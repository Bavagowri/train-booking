import type {
  NextFunction,
  Request,
  Response,
} from "express";

import { waitlistService } from "../services/waitlist.service.js";
import { AppError } from "../utils/appError.js";
import {
  createWaitlistEntrySchema,
} from "../validators/waitlist.validator.js";

export class WaitlistController {
  async createEntry(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const validationResult =
        createWaitlistEntrySchema.safeParse(
          req.body,
        );

      if (!validationResult.success) {
        throw new AppError(
          400,
          "VALIDATION_ERROR",
          "The waitlist request contains invalid data.",
          validationResult.error.flatten(),
        );
      }

      const entry =
        await waitlistService.createEntry(
          validationResult.data,
        );

      res.status(201).json({
        data: entry,
        message:
          "Passenger added to the waitlist.",
      });
    } catch (error: unknown) {
      next(error);
    }
  }

  async getEntry(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const waitlistReference =
        req.params.waitlistReference;

      if (
        typeof waitlistReference !==
          "string" ||
        !waitlistReference.trim()
      ) {
        throw new AppError(
          400,
          "INVALID_WAITLIST_REFERENCE",
          "A valid waitlist reference is required.",
        );
      }

      const entry =
        await waitlistService.getByReference(
          waitlistReference.trim(),
        );

      res.status(200).json({
        data: entry,
      });
    } catch (error: unknown) {
      next(error);
    }
  }
}

export const waitlistController =
  new WaitlistController();