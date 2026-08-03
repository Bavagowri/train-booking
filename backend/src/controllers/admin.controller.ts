import type {
  NextFunction,
  Request,
  Response,
} from "express";

import { adminService } from "../services/admin.service.js";
import { AppError } from "../utils/appError.js";

export class AdminController {
  async getSummary(
    _req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const summary =
        await adminService.getDashboardSummary();

      res.status(200).json({
        data: summary,
      });
    } catch (error: unknown) {
      next(error);
    }
  }

  async getJourneyAnalytics(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const journeyId = req.params.journeyId;
      const originStationId =
        req.query.originStationId;
      const destinationStationId =
        req.query.destinationStationId;

      if (typeof journeyId !== "string") {
        throw new AppError(
          400,
          "INVALID_JOURNEY_ID",
          "A valid journey ID is required.",
        );
      }

      if (typeof originStationId !== "string") {
        throw new AppError(
          400,
          "INVALID_ORIGIN_STATION_ID",
          "originStationId is required.",
        );
      }

      if (
        typeof destinationStationId !== "string"
      ) {
        throw new AppError(
          400,
          "INVALID_DESTINATION_STATION_ID",
          "destinationStationId is required.",
        );
      }

      const analytics =
        await adminService.getJourneyAnalytics(
          journeyId,
          originStationId,
          destinationStationId,
        );

      res.status(200).json({
        data: analytics,
      });
    } catch (error: unknown) {
      next(error);
    }
  }

  async getRecentBookings(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const limitValue = Number(req.query.limit ?? 10);

      const bookings =
        await adminService.getRecentBookings(
          Number.isFinite(limitValue)
            ? limitValue
            : 10,
        );

      res.status(200).json({
        data: bookings,
        count: bookings.length,
      });
    } catch (error: unknown) {
      next(error);
    }
  }
}

export const adminController =
  new AdminController();