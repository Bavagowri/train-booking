import type {
  NextFunction,
  Request,
  Response,
} from "express";

import { adminAuthService } from "../services/adminAuth.service.js";
import { AppError } from "../utils/appError.js";
import { adminLoginSchema } from "../validators/adminAuth.validator.js";

export class AdminAuthController {
  async login(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const validationResult =
        adminLoginSchema.safeParse(req.body);

      if (!validationResult.success) {
        throw new AppError(
          400,
          "VALIDATION_ERROR",
          "The administrator login request contains invalid data.",
          validationResult.error.flatten(),
        );
      }

      const result =
        await adminAuthService.login(
          validationResult.data,
        );

      res.status(200).json({
        data: result,
        message:
          "Administrator signed in successfully.",
      });
    } catch (error: unknown) {
      next(error);
    }
  }

  async getCurrentAdmin(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.admin) {
        throw new AppError(
          401,
          "ADMIN_NOT_AUTHENTICATED",
          "Administrator authentication is required.",
        );
      }

      const admin =
        await adminAuthService.getCurrentAdmin(
          req.admin.id,
        );

      res.status(200).json({
        data: admin,
      });
    } catch (error: unknown) {
      next(error);
    }
  }
}

export const adminAuthController =
  new AdminAuthController();