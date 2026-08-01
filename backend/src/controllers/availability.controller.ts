import type {
  NextFunction,
  Request,
  Response,
} from "express";

import { availabilityService } from "../services/availability.service.js";

export class AvailabilityController {
  async getAvailableSeats(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const journeyId =
        req.params.journeyId;

      const originStationId =
        req.query.originStationId;

      const destinationStationId =
        req.query.destinationStationId;

      if (typeof journeyId !== "string") {
        res.status(400).json({
          error: {
            code: "INVALID_JOURNEY_ID",
            message:
              "A valid journey ID is required.",
          },
        });

        return;
      }

      if (
        typeof originStationId !== "string" ||
        originStationId.trim() === ""
      ) {
        res.status(400).json({
          error: {
            code: "INVALID_ORIGIN_STATION_ID",
            message:
              "originStationId is required.",
          },
        });

        return;
      }

      if (
        typeof destinationStationId !==
          "string" ||
        destinationStationId.trim() === ""
      ) {
        res.status(400).json({
          error: {
            code:
              "INVALID_DESTINATION_STATION_ID",
            message:
              "destinationStationId is required.",
          },
        });

        return;
      }

      const availability =
        await availabilityService.getAvailableSeats(
          journeyId,
          originStationId,
          destinationStationId,
        );

      res.status(200).json({
        data: availability,
      });
    } catch (error: unknown) {
      next(error);
    }
  }
}

export const availabilityController =
  new AvailabilityController();