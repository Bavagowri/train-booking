import { randomBytes } from "node:crypto";

import {
  BookingStatus,
  CoachType,
} from "@prisma/client";

import type { Prisma } from "@prisma/client";

import { prisma } from "../lib/prisma.js";
import { AppError } from "../utils/appError.js";
import type { CreateBookingInput } from "../validators/booking.validator.js";
import { fareService } from "./fare.service.js";
import { segmentService } from "./segment.service.js";

const bookingInclude = {
  journey: {
    include: {
      route: true,
    },
  },

  seat: {
    include: {
      coach: true,
    },
  },

  originRouteStation: {
    include: {
      station: true,
    },
  },

  destinationRouteStation: {
    include: {
      station: true,
    },
  },
} satisfies Prisma.BookingInclude;

type BookingWithDetails =
  Prisma.BookingGetPayload<{
    include: typeof bookingInclude;
  }>;

function generateBookingReference(): string {
  const timestamp = Date.now()
    .toString(36)
    .toUpperCase();

  const randomPart = randomBytes(4)
    .toString("hex")
    .toUpperCase();

  return `TB-${timestamp}-${randomPart}`;
}

export class BookingService {
  async createBooking(
    input: CreateBookingInput,
  ) {
    /*
     * Validate that the journey exists and that both
     * stations belong to the journey's route.
     */
    const segment =
      await segmentService.validateSegment(
        input.journeyId,
        input.originStationId,
        input.destinationStationId,
      );

    /*
     * Fare is always calculated by the backend.
     */
    const fareResult =
      await fareService.calculateFare({
        originDistanceKm:
          segment.origin.distanceFromStartKm,

        destinationDistanceKm:
          segment.destination.distanceFromStartKm,

        journeyDepartureTime:
          segment.journey.departureTime,

        passengerCategory:
          input.passengerCategory,
      });

    const booking: BookingWithDetails =
      await prisma.$transaction(
        async (transaction) => {
          /*
           * Lock the physical seat row.
           *
           * Concurrent requests trying to book this seat
           * must wait until the current transaction completes.
           */
          const lockedSeats =
            await transaction.$queryRaw<
              Array<{ id: string }>
            >`
              SELECT id
              FROM "Seat"
              WHERE id = ${input.seatId}
              FOR UPDATE
            `;

          if (lockedSeats.length === 0) {
            throw new AppError(
              404,
              "SEAT_NOT_FOUND",
              "The selected seat was not found.",
            );
          }

          /*
           * Confirm that:
           *
           * 1. The seat exists.
           * 2. Its coach is RESERVED.
           * 3. The coach is assigned to this journey.
           */
          const seat =
            await transaction.seat.findFirst({
              where: {
                id: input.seatId,

                coach: {
                  is: {
                    type: CoachType.RESERVED,

                    journeyCoaches: {
                      some: {
                        journeyId:
                          input.journeyId,
                      },
                    },
                  },
                },
              },

              include: {
                coach: true,
              },
            });

          if (!seat) {
            throw new AppError(
              400,
              "SEAT_NOT_ASSIGNED_TO_JOURNEY",
              "The selected seat does not belong to a reserved coach assigned to this journey.",
            );
          }

          /*
           * Recheck availability after obtaining the lock.
           *
           * Overlap:
           * existingOrigin < requestedDestination
           * AND
           * existingDestination > requestedOrigin
           */
          const conflictingBooking =
            await transaction.booking.findFirst({
              where: {
                journeyId: input.journeyId,
                seatId: input.seatId,
                status:
                  BookingStatus.CONFIRMED,

                originOrder: {
                  lt:
                    segment.destination
                      .stopOrder,
                },

                destinationOrder: {
                  gt: segment.origin.stopOrder,
                },
              },

              select: {
                id: true,
                bookingReference: true,
              },
            });

          if (conflictingBooking) {
            throw new AppError(
              409,
              "SEAT_UNAVAILABLE",
              "This seat is no longer available for the selected segment.",
            );
          }

          const bookingReference =
            generateBookingReference();

          const fareBreakdown: Prisma.InputJsonObject = {
            baseFare: fareResult.baseFare,
            distanceCharge:
              fareResult.distanceCharge,
            reservedSurcharge:
              fareResult.reservedSurcharge,
            peakSurcharge:
              fareResult.peakSurcharge,
            passengerDiscount:
              fareResult.passengerDiscount,
            subtotal:
              fareResult.subtotal,
            minimumFare:
              fareResult.minimumFare,
            isPeak:
              fareResult.isPeak,
            passengerCategory:
              fareResult.passengerCategory,
            currency:
              fareResult.currency,

            bands: fareResult.bands.map(
              (band): Prisma.InputJsonObject => ({
                fromKm: band.fromKm,
                toKm: band.toKm,
                chargedKm: band.chargedKm,
                ratePerKm: band.ratePerKm,
                amount: band.amount,
              }),
            ),
          };

          return transaction.booking.create({
            data: {
              bookingReference,

              passengerName:
                input.passengerName.trim(),

              passengerEmail:
                input.passengerEmail ?? null,

              passengerCategory:
                input.passengerCategory,

              journeyId: input.journeyId,
              seatId: input.seatId,

              originRouteStationId:
                input.originStationId,

              destinationRouteStationId:
                input.destinationStationId,

              originOrder:
                segment.origin.stopOrder,

              destinationOrder:
                segment.destination.stopOrder,

              distanceKm:
                fareResult.distanceKm,

              fare:
                fareResult.fare,

              fareBreakdown,

              status:
                BookingStatus.CONFIRMED,
            },
            include: bookingInclude,
          });
        },
      );

    return this.formatBooking(booking);
  }

  async getBookingByReference(
    bookingReference: string,
  ) {
    const booking: BookingWithDetails | null =
      await prisma.booking.findUnique({
        where: {
          bookingReference,
        },

        include: bookingInclude,
      });

    if (!booking) {
      throw new AppError(
        404,
        "BOOKING_NOT_FOUND",
        "Booking not found.",
      );
    }

    return this.formatBooking(booking);
  }

  private formatBooking(
    booking: BookingWithDetails,
  ) {
    return {
      id: booking.id,

      bookingReference:
        booking.bookingReference,

      status: booking.status,

      passenger: {
        name: booking.passengerName,
        email: booking.passengerEmail,
        category:
          booking.passengerCategory,
      },

      journey: {
        id: booking.journey.id,

        trainNumber:
          booking.journey.trainNumber,

        departureTime:
          booking.journey.departureTime,

        route: {
          id: booking.journey.route.id,
          name: booking.journey.route.name,
        },
      },

      seat: {
        id: booking.seat.id,

        seatNumber:
          booking.seat.seatNumber,

        coach: {
          id: booking.seat.coach.id,
          code: booking.seat.coach.code,
          name: booking.seat.coach.name,
          type: booking.seat.coach.type,
        },
      },

      segment: {
        origin: {
          id:
            booking.originRouteStation.id,

          stationId:
            booking.originRouteStation
              .station.id,

          code:
            booking.originRouteStation
              .station.code,

          name:
            booking.originRouteStation
              .station.name,

          stopOrder:
            booking.originRouteStation
              .stopOrder,
        },

        destination: {
          id:
            booking
              .destinationRouteStation.id,

          stationId:
            booking
              .destinationRouteStation
              .station.id,

          code:
            booking
              .destinationRouteStation
              .station.code,

          name:
            booking
              .destinationRouteStation
              .station.name,

          stopOrder:
            booking
              .destinationRouteStation
              .stopOrder,
        },

        distanceKm: Number(
          booking.distanceKm,
        ),
      },

      fare: {
        amount: Number(booking.fare),
        currency: "LKR",
        breakdown:
          booking.fareBreakdown,
      },

      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt,
    };
  }
}

export const bookingService =
  new BookingService();