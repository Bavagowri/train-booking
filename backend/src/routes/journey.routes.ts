import { Router } from "express";

import { availabilityController } from "../controllers/availability.controller.js";
import { journeyController } from "../controllers/journey.controller.js";

export const journeyRouter = Router();

journeyRouter.get("/", (req, res, next) => {
  void journeyController.getJourneys(
    req,
    res,
    next,
  );
});

journeyRouter.get(
  "/:journeyId/available-seats",
  (req, res, next) => {
    void availabilityController.getAvailableSeats(
      req,
      res,
      next,
    );
  },
);

journeyRouter.get(
  "/:journeyId",
  (req, res, next) => {
    void journeyController.getJourneyById(
      req,
      res,
      next,
    );
  },
);