import type {
  NextFunction,
  Request,
  Response,
} from "express";

import { bookingService } from "../services/booking.service.js";
import { AppError } from "../utils/appError.js";
import { createBookingSchema } from "../validators/booking.validator.js";

export class BookingController {
  async createBooking(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const validationResult =
        createBookingSchema.safeParse(req.body);

      if (!validationResult.success) {
        throw new AppError(
          400,
          "VALIDATION_ERROR",
          "The booking request contains invalid data.",
          validationResult.error.flatten(),
        );
      }

      const booking =
        await bookingService.createBooking(
          validationResult.data,
        );

      res.status(201).json({
        data: booking,
        message: "Booking confirmed successfully.",
      });
    } catch (error: unknown) {
      next(error);
    }
  }

  async getBookingByReference(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const bookingReference =
        req.params.bookingReference;

      if (
        typeof bookingReference !== "string" ||
        bookingReference.trim() === ""
      ) {
        throw new AppError(
          400,
          "INVALID_BOOKING_REFERENCE",
          "A valid booking reference is required.",
        );
      }

      const booking =
        await bookingService.getBookingByReference(
          bookingReference.trim(),
        );

      res.status(200).json({
        data: booking,
      });
    } catch (error: unknown) {
      next(error);
    }
  }
}

export const bookingController =
  new BookingController();