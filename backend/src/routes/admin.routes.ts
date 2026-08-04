import { Router } from "express";

import { adminController } from "../controllers/admin.controller.js";

export const adminRouter = Router();

adminRouter.get("/summary", (req, res, next) => {
  void adminController.getSummary(
    req,
    res,
    next,
  );
});

adminRouter.get(
  "/journeys/:journeyId/analytics",
  (req, res, next) => {
    void adminController.getJourneyAnalytics(
      req,
      res,
      next,
    );
  },
);

adminRouter.get(
  "/bookings",
  (req, res, next) => {
    void adminController.getRecentBookings(
      req,
      res,
      next,
    );
  },
);