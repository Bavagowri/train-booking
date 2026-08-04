import type {
  NextFunction,
  Request,
  Response,
} from "express";

import { prisma } from "../lib/prisma.js";
import { AppError } from "../utils/appError.js";
import { verifyAdminAccessToken } from "../utils/jwt.js";

export async function requireAdminAuth(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const authorizationHeader =
      req.headers.authorization;

    if (!authorizationHeader) {
      throw new AppError(
        401,
        "ADMIN_AUTHENTICATION_REQUIRED",
        "Administrator authentication is required.",
      );
    }

    const [scheme, token] =
      authorizationHeader.split(" ");

    if (
      scheme !== "Bearer" ||
      !token
    ) {
      throw new AppError(
        401,
        "INVALID_AUTHORIZATION_HEADER",
        "Use the Authorization header with a Bearer token.",
      );
    }

    const payload =
      verifyAdminAccessToken(token);

    const admin = await prisma.admin.findFirst({
      where: {
        id: payload.sub,
        email: payload.email,
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        role: true,
      },
    });

    if (!admin) {
      throw new AppError(
        401,
        "ADMIN_NOT_AUTHENTICATED",
        "The administrator account is unavailable or disabled.",
      );
    }

    req.admin = admin;

    next();
  } catch (error: unknown) {
    next(error);
  }
}