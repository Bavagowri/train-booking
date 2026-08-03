import {
  BookingStatus,
  CoachType,
} from "@prisma/client";

import { prisma } from "../lib/prisma.js";
import { fareService } from "./fare.service.js";
import { segmentService } from "./segment.service.js";

export class AvailabilityService {
  async getAvailableSeats(
    journeyId: string,
    originRouteStationId: string,
    destinationRouteStationId: string,
  ) {
    const segment =
      await segmentService.validateSegment(
        journeyId,
        originRouteStationId,
        destinationRouteStationId,
      );

    const fare = fareService.calculateFare({
      originDistanceKm:
        segment.origin.distanceFromStartKm,

      destinationDistanceKm:
        segment.destination.distanceFromStartKm,
    });

    const [
      journeyCoachAssignments,
      conflictingBookings,
    ] = await Promise.all([
      prisma.journeyCoach.findMany({
        where: {
          journeyId,

          coach: {
            type: CoachType.RESERVED,
          },
        },

        orderBy: {
          displayOrder: "asc",
        },

        include: {
          coach: {
            include: {
              seats: {
                orderBy: {
                  displayOrder: "asc",
                },
              },
            },
          },
        },
      }),

      prisma.booking.findMany({
        where: {
          journeyId,
          status: BookingStatus.CONFIRMED,

          originOrder: {
            lt: segment.destination.stopOrder,
          },

          destinationOrder: {
            gt: segment.origin.stopOrder,
          },
        },

        select: {
          seatId: true,
        },
      }),
    ]);

    const unavailableSeatIds = new Set(
      conflictingBookings.map(
        (booking) => booking.seatId,
      ),
    );

    const coaches =
      journeyCoachAssignments.map(
        (assignment) => {
          const coach = assignment.coach;

          const seats = coach.seats.map(
            (seat) => ({
              id: seat.id,
              seatNumber: seat.seatNumber,
              displayOrder:
                seat.displayOrder,

              available:
                !unavailableSeatIds.has(
                  seat.id,
                ),
            }),
          );

          const availableSeatCount =
            seats.filter(
              (seat) => seat.available,
            ).length;

          return {
            id: coach.id,
            code: coach.code,
            name: coach.name,

            displayOrder:
              assignment.displayOrder,

            totalSeatCount:
              seats.length,

            availableSeatCount,

            seats,
          };
        },
      );

    const totalSeatCount =
      coaches.reduce(
        (total, coach) =>
          total +
          coach.totalSeatCount,
        0,
      );

    const availableSeatCount =
      coaches.reduce(
        (total, coach) =>
          total +
          coach.availableSeatCount,
        0,
      );

    return {
      journey: {
        id: segment.journey.id,

        trainNumber:
          segment.journey.trainNumber,

        departureTime:
          segment.journey.departureTime,
      },

      segment: {
        origin: segment.origin,
        destination:
          segment.destination,

        ...fare,
      },

      availability: {
        totalSeatCount,
        availableSeatCount,

        unavailableSeatCount:
          totalSeatCount -
          availableSeatCount,
      },

      coaches,
    };
  }
}

export const availabilityService =
  new AvailabilityService();