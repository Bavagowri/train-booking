import { prisma } from "../lib/prisma.js";
import { AppError } from "../utils/appError.js";

export interface ValidatedSegment {
  journey: {
    id: string;
    trainNumber: string;
    departureTime: Date;
    routeId: string;
  };

  origin: {
    id: string;
    stationId: string;
    code: string;
    name: string;
    stopOrder: number;
    distanceFromStartKm: number;
  };

  destination: {
    id: string;
    stationId: string;
    code: string;
    name: string;
    stopOrder: number;
    distanceFromStartKm: number;
  };
}

export class SegmentService {
  async validateSegment(
    journeyId: string,
    originRouteStationId: string,
    destinationRouteStationId: string,
  ): Promise<ValidatedSegment> {
    const journey = await prisma.journey.findUnique({
      where: {
        id: journeyId,
      },
      select: {
        id: true,
        trainNumber: true,
        departureTime: true,
        routeId: true,
      },
    });

    if (!journey) {
      throw new AppError(
        404,
        "JOURNEY_NOT_FOUND",
        "Journey not found.",
      );
    }

    const routeStations = await prisma.routeStation.findMany({
      where: {
        id: {
          in: [
            originRouteStationId,
            destinationRouteStationId,
          ],
        },
        routeId: journey.routeId,
      },
      include: {
        station: true,
      },
    });

    const origin = routeStations.find(
      (routeStation) =>
        routeStation.id === originRouteStationId,
    );

    const destination = routeStations.find(
      (routeStation) =>
        routeStation.id === destinationRouteStationId,
    );

    if (!origin) {
      throw new AppError(
        404,
        "ORIGIN_NOT_FOUND",
        "The selected origin station was not found on this journey route.",
      );
    }

    if (!destination) {
      throw new AppError(
        404,
        "DESTINATION_NOT_FOUND",
        "The selected destination station was not found on this journey route.",
      );
    }

    if (origin.id === destination.id) {
      throw new AppError(
        400,
        "INVALID_SEGMENT",
        "Origin and destination cannot be the same station.",
      );
    }

    if (origin.stopOrder >= destination.stopOrder) {
      throw new AppError(
        400,
        "INVALID_SEGMENT",
        "Destination must come after the origin station.",
      );
    }

    return {
      journey: {
        id: journey.id,
        trainNumber: journey.trainNumber,
        departureTime: journey.departureTime,
        routeId: journey.routeId,
      },

      origin: {
        id: origin.id,
        stationId: origin.station.id,
        code: origin.station.code,
        name: origin.station.name,
        stopOrder: origin.stopOrder,
        distanceFromStartKm: Number(
          origin.distanceFromStartKm,
        ),
      },

      destination: {
        id: destination.id,
        stationId: destination.station.id,
        code: destination.station.code,
        name: destination.station.name,
        stopOrder: destination.stopOrder,
        distanceFromStartKm: Number(
          destination.distanceFromStartKm,
        ),
      },
    };
  }
}

export const segmentService = new SegmentService();