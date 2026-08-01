import { Router } from "express";

import { bookingController } from "../controllers/booking.controller.js";

export const bookingRouter = Router();

bookingRouter.post("/", (req, res, next) => {
  void bookingController.createBooking(
    req,
    res,
    next,
  );
});

bookingRouter.get(
  "/:bookingReference",
  (req, res, next) => {
    void bookingController.getBookingByReference(
      req,
      res,
      next,
    );
  },
);