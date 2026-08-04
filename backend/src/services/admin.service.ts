import { BookingStatus, CoachType } from "@prisma/client";

import { prisma } from "../lib/prisma.js";
import { AppError } from "../utils/appError.js";
import { segmentService } from "./segment.service.js";

export class AdminService {
  async getJourneyAnalytics(
    journeyId: string,
    originRouteStationId: string,
    destinationRouteStationId: string,
  ) {
    const segment = await segmentService.validateSegment(
      journeyId,
      originRouteStationId,
      destinationRouteStationId,
    );

    const journeyCoachAssignments =
      await prisma.journeyCoach.findMany({
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
              seats: true,
            },
          },
        },
      });

    const reservedSeatIds =
      journeyCoachAssignments.flatMap((assignment) =>
        assignment.coach.seats.map((seat) => seat.id),
      );

    const overlappingBookings =
      await prisma.booking.findMany({
        where: {
          journeyId,
          seatId: {
            in: reservedSeatIds,
          },
          status: BookingStatus.CONFIRMED,
          originOrder: {
            lt: segment.destination.stopOrder,
          },
          destinationOrder: {
            gt: segment.origin.stopOrder,
          },
        },
        select: {
          id: true,
          seatId: true,
          fare: true,
        },
      });

    const occupiedSeatIds = new Set(
      overlappingBookings.map((booking) => booking.seatId),
    );

    const totalReservedSeats = reservedSeatIds.length;
    const occupiedSeats = occupiedSeatIds.size;
    const availableSeats =
      totalReservedSeats - occupiedSeats;

    const occupancyPercentage =
      totalReservedSeats === 0
        ? 0
        : Number(
            (
              (occupiedSeats / totalReservedSeats) *
              100
            ).toFixed(2),
          );

    const coachOccupancy =
      journeyCoachAssignments.map((assignment) => {
        const seatIds = assignment.coach.seats.map(
          (seat) => seat.id,
        );

        const occupiedCount = seatIds.filter((seatId) =>
          occupiedSeatIds.has(seatId),
        ).length;

        const totalSeats = seatIds.length;

        const percentage =
          totalSeats === 0
            ? 0
            : Number(
                (
                  (occupiedCount / totalSeats) *
                  100
                ).toFixed(2),
              );

        return {
          coachId: assignment.coach.id,
          code: assignment.coach.code,
          name: assignment.coach.name,
          displayOrder: assignment.displayOrder,
          totalSeats,
          occupiedSeats: occupiedCount,
          availableSeats: totalSeats - occupiedCount,
          occupancyPercentage: percentage,
        };
      });

    return {
      journey: {
        id: segment.journey.id,
        trainNumber: segment.journey.trainNumber,
        departureTime: segment.journey.departureTime,
      },

      segment: {
        origin: segment.origin,
        destination: segment.destination,
      },

      summary: {
        totalReservedSeats,
        occupiedSeats,
        availableSeats,
        occupancyPercentage,
      },

      coaches: coachOccupancy,
    };
  }

//   async getDashboardSummary() {
//     const [
//       confirmedBookingCount,
//       cancelledBookingCount,
//       revenueResult,
//       journeyCount,
//       waitlistCount,
//     ] = await Promise.all([
//       prisma.booking.count({
//         where: {
//           status: BookingStatus.CONFIRMED,
//         },
//       }),

//       prisma.booking.count({
//         where: {
//           status: BookingStatus.CANCELLED,
//         },
//       }),

//       prisma.booking.aggregate({
//         where: {
//           status: BookingStatus.CONFIRMED,
//         },
//         _sum: {
//           fare: true,
//         },
//       }),

//       prisma.journey.count(),

//       prisma.waitlistEntry
//         ? prisma.waitlistEntry.count({
//             where: {
//               status: "WAITING",
//             },
//           })
//         : Promise.resolve(0),
//     ]);

//     return {
//       confirmedBookingCount,
//       cancelledBookingCount,
//       totalRevenue: Number(
//         revenueResult._sum.fare ?? 0,
//       ),
//       currency: "LKR",
//       journeyCount,
//       waitlistCount,
//     };
//   }
  async getDashboardSummary() {
    const [
        confirmedBookingCount,
        cancelledBookingCount,
        revenueResult,
        journeyCount,
    ] = await Promise.all([
        prisma.booking.count({
        where: {
            status: BookingStatus.CONFIRMED,
        },
        }),

        prisma.booking.count({
        where: {
            status: BookingStatus.CANCELLED,
        },
        }),

        prisma.booking.aggregate({
        where: {
            status: BookingStatus.CONFIRMED,
        },
        _sum: {
            fare: true,
        },
        }),

        prisma.journey.count(),
    ]);

    return {
        confirmedBookingCount,
        cancelledBookingCount,
        totalRevenue: Number(
        revenueResult._sum.fare ?? 0,
        ),
        currency: "LKR",
        journeyCount,
    };
    }

  async getRecentBookings(limit = 10) {
    const safeLimit = Math.min(
      Math.max(limit, 1),
      50,
    );

    const bookings = await prisma.booking.findMany({
      take: safeLimit,
      orderBy: {
        createdAt: "desc",
      },
      include: {
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
      },
    });

    return bookings.map((booking) => ({
      id: booking.id,
      bookingReference: booking.bookingReference,
      passengerName: booking.passengerName,
      passengerEmail: booking.passengerEmail,
      status: booking.status,
      fare: Number(booking.fare),
      createdAt: booking.createdAt,

      journey: {
        id: booking.journey.id,
        trainNumber: booking.journey.trainNumber,
        departureTime:
          booking.journey.departureTime,
        routeName: booking.journey.route.name,
      },

      seat: {
        id: booking.seat.id,
        seatNumber: booking.seat.seatNumber,
        coachCode: booking.seat.coach.code,
      },

      segment: {
        origin:
          booking.originRouteStation.station.name,
        destination:
          booking.destinationRouteStation.station.name,
      },
    }));
  }
}

export const adminService = new AdminService();