import { Router } from "express";

import { adminAuthController } from "../controllers/adminAuth.controller.js";
import { requireAdminAuth } from "../middleware/requireAdminAuth.js";

export const adminAuthRouter = Router();

adminAuthRouter.post(
  "/login",
  (req, res, next) => {
    void adminAuthController.login(
      req,
      res,
      next,
    );
  },
);

adminAuthRouter.get(
  "/me",
  requireAdminAuth,
  (req, res, next) => {
    void adminAuthController.getCurrentAdmin(
      req,
      res,
      next,
    );
  },
);