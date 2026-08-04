import { Router } from "express";

import { waitlistController } from "../controllers/waitlist.controller.js";

export const waitlistRouter = Router();

waitlistRouter.post(
  "/",
  (req, res, next) => {
    void waitlistController.createEntry(
      req,
      res,
      next,
    );
  },
);

waitlistRouter.get(
  "/:waitlistReference",
  (req, res, next) => {
    void waitlistController.getEntry(
      req,
      res,
      next,
    );
  },
);