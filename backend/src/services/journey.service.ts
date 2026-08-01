import { prisma } from "../lib/prisma.js";

export class JourneyService {
  async getJourneys() {
    const journeys = await prisma.journey.findMany({
      orderBy: {
        departureTime: "asc",
      },
      include: {
        route: {
          include: {
            routeStops: {
              orderBy: {
                stopOrder: "asc",
              },
              include: {
                station: true,
              },
            },
          },
        },
      },
    });

    return journeys.map((journey) => {
      const firstStop = journey.route.routeStops[0];
      const lastStop =
        journey.route.routeStops[
          journey.route.routeStops.length - 1
        ];

      return {
        id: journey.id,
        trainNumber: journey.trainNumber,
        departureTime: journey.departureTime,
        route: {
          id: journey.route.id,
          name: journey.route.name,
          origin: firstStop
            ? {
                id: firstStop.id,
                stationId: firstStop.station.id,
                code: firstStop.station.code,
                name: firstStop.station.name,
              }
            : null,
          destination: lastStop
            ? {
                id: lastStop.id,
                stationId: lastStop.station.id,
                code: lastStop.station.code,
                name: lastStop.station.name,
              }
            : null,
          stationCount: journey.route.routeStops.length,
        },
      };
    });
  }

  async getJourneyById(journeyId: string) {
    const journey = await prisma.journey.findUnique({
      where: {
        id: journeyId,
      },
      include: {
        route: {
          include: {
            routeStops: {
              orderBy: {
                stopOrder: "asc",
              },
              include: {
                station: true,
              },
            },
          },
        },
      },
    });

    if (!journey) {
      return null;
    }

    return {
      id: journey.id,
      trainNumber: journey.trainNumber,
      departureTime: journey.departureTime,
      route: {
        id: journey.route.id,
        name: journey.route.name,
        stations: journey.route.routeStops.map((routeStop) => ({
          id: routeStop.id,
          stationId: routeStop.station.id,
          code: routeStop.station.code,
          name: routeStop.station.name,
          stopOrder: routeStop.stopOrder,
          distanceFromStartKm: Number(
            routeStop.distanceFromStartKm,
          ),
        })),
      },
    };
  }
}

export const journeyService = new JourneyService();