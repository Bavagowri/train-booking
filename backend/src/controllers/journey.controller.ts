import type {
  NextFunction,
  Request,
  Response,
} from "express";

import { journeyService } from "../services/journey.service.js";

export class JourneyController {
  async getJourneys(
    _req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const journeys = await journeyService.getJourneys();

      res.status(200).json({
        data: journeys,
        count: journeys.length,
      });
    } catch (error: unknown) {
      next(error);
    }
  }

  async getJourneyById(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const journeyId = String(req.params.journeyId);

      if (!journeyId) {
        res.status(400).json({
          error: {
            code: "INVALID_JOURNEY_ID",
            message: "Journey ID is required.",
          },
        });

        return;
      }

      const journey =
        await journeyService.getJourneyById(journeyId);

      if (!journey) {
        res.status(404).json({
          error: {
            code: "JOURNEY_NOT_FOUND",
            message: "Journey not found.",
          },
        });

        return;
      }

      res.status(200).json({
        data: journey,
      });
    } catch (error: unknown) {
      next(error);
    }
  }
}

export const journeyController = new JourneyController();