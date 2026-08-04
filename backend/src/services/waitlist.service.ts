import { randomBytes } from "node:crypto";

import {
  WaitlistStatus,
} from "@prisma/client";

import { prisma } from "../lib/prisma.js";
import { AppError } from "../utils/appError.js";
import type {
  CreateWaitlistEntryInput,
} from "../validators/waitlist.validator.js";

import { availabilityService } from "./availability.service.js";
import { segmentService } from "./segment.service.js";

function generateWaitlistReference(): string {
  const timestamp = Date.now()
    .toString(36)
    .toUpperCase();

  const randomPart = randomBytes(3)
    .toString("hex")
    .toUpperCase();

  return `WL-${timestamp}-${randomPart}`;
}

export class WaitlistService {
  async createEntry(
    input: CreateWaitlistEntryInput,
  ) {
    const segment =
      await segmentService.validateSegment(
        input.journeyId,
        input.originStationId,
        input.destinationStationId,
      );

    const availability =
      await availabilityService.getAvailableSeats(
        input.journeyId,
        input.originStationId,
        input.destinationStationId,
      );

    if (
      availability.availability
        .availableSeatCount > 0
    ) {
      throw new AppError(
        409,
        "SEATS_STILL_AVAILABLE",
        "Seats are still available for this segment. Please make a normal booking.",
      );
    }

    const duplicateEntry =
      await prisma.waitlistEntry.findFirst({
        where: {
          journeyId:
            input.journeyId,

          originRouteStationId:
            input.originStationId,

          destinationRouteStationId:
            input.destinationStationId,

          passengerEmail:
            input.passengerEmail,

          status: {
            in: [
              WaitlistStatus.WAITING,
              WaitlistStatus.OFFERED,
            ],
          },
        },
        select: {
          waitlistReference: true,
        },
      });

    if (duplicateEntry) {
      throw new AppError(
        409,
        "WAITLIST_ENTRY_EXISTS",
        "This passenger already has an active waitlist entry for the selected segment.",
        {
          waitlistReference:
            duplicateEntry.waitlistReference,
        },
      );
    }

    const position =
      (await prisma.waitlistEntry.count({
        where: {
          journeyId:
            input.journeyId,

          originRouteStationId:
            input.originStationId,

          destinationRouteStationId:
            input.destinationStationId,

          status: WaitlistStatus.WAITING,
        },
      })) + 1;

    const entry =
      await prisma.waitlistEntry.create({
        data: {
          waitlistReference:
            generateWaitlistReference(),

          journeyId:
            input.journeyId,

          originRouteStationId:
            input.originStationId,

          destinationRouteStationId:
            input.destinationStationId,

          originOrder:
            segment.origin.stopOrder,

          destinationOrder:
            segment.destination.stopOrder,

          passengerName:
            input.passengerName.trim(),

          passengerEmail:
            input.passengerEmail,

          passengerCategory:
            input.passengerCategory,

          status:
            WaitlistStatus.WAITING,
        },
        include: {
          journey: {
            include: {
              route: true,
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
        },
      });

    return {
      ...this.formatEntry(entry),
      position,
    };
  }

  async getByReference(
    waitlistReference: string,
  ) {
    const entry =
      await prisma.waitlistEntry.findUnique({
        where: {
          waitlistReference,
        },
        include: {
          journey: {
            include: {
              route: true,
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
          offeredSeat: {
            include: {
              coach: true,
            },
          },
        },
      });

    if (!entry) {
      throw new AppError(
        404,
        "WAITLIST_ENTRY_NOT_FOUND",
        "Waitlist entry not found.",
      );
    }

    const aheadCount =
      entry.status ===
      WaitlistStatus.WAITING
        ? await prisma.waitlistEntry.count({
            where: {
              journeyId:
                entry.journeyId,

              originRouteStationId:
                entry.originRouteStationId,

              destinationRouteStationId:
                entry.destinationRouteStationId,

              status:
                WaitlistStatus.WAITING,

              createdAt: {
                lt: entry.createdAt,
              },
            },
          })
        : 0;

    return {
      ...this.formatEntry(entry),
      position:
        entry.status ===
        WaitlistStatus.WAITING
          ? aheadCount + 1
          : null,
    };
  }

  private formatEntry(entry: any) {
    return {
      id: entry.id,
      waitlistReference:
        entry.waitlistReference,
      status: entry.status,

      passenger: {
        name: entry.passengerName,
        email: entry.passengerEmail,
        category:
          entry.passengerCategory,
      },

      journey: {
        id: entry.journey.id,
        trainNumber:
          entry.journey.trainNumber,
        departureTime:
          entry.journey.departureTime,
        routeName:
          entry.journey.route.name,
      },

      segment: {
        origin: {
          id:
            entry.originRouteStation.id,
          name:
            entry.originRouteStation
              .station.name,
          code:
            entry.originRouteStation
              .station.code,
        },
        destination: {
          id:
            entry.destinationRouteStation
              .id,
          name:
            entry.destinationRouteStation
              .station.name,
          code:
            entry.destinationRouteStation
              .station.code,
        },
      },

      offeredSeat:
        entry.offeredSeat
          ? {
              id:
                entry.offeredSeat.id,
              seatNumber:
                entry.offeredSeat
                  .seatNumber,
              coachCode:
                entry.offeredSeat
                  .coach.code,
            }
          : null,

      offeredAt: entry.offeredAt,
      expiresAt: entry.expiresAt,
      createdAt: entry.createdAt,
    };
  }
}

export const waitlistService =
  new WaitlistService();