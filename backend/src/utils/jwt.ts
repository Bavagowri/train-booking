import jwt from "jsonwebtoken";

import type { AdminRole } from "@prisma/client";

import { AppError } from "./appError.js";

export interface AdminTokenPayload {
  sub: string;
  email: string;
  role: AdminRole;
  type: "admin-access";
}

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error(
      "JWT_SECRET must contain at least 32 characters.",
    );
  }

  return secret;
}

export function createAdminAccessToken(
  payload: Omit<AdminTokenPayload, "type">,
): string {
  const expiresIn =
    process.env.JWT_EXPIRES_IN ?? "2h";

  return jwt.sign(
    {
      email: payload.email,
      role: payload.role,
      type: "admin-access",
    },
    getJwtSecret(),
    {
      subject: payload.sub,
      expiresIn:
        expiresIn as jwt.SignOptions["expiresIn"],
      algorithm: "HS256",
    },
  );
}

export function verifyAdminAccessToken(
  token: string,
): AdminTokenPayload {
  try {
    const decoded = jwt.verify(
      token,
      getJwtSecret(),
      {
        algorithms: ["HS256"],
      },
    );

    if (
      typeof decoded === "string" ||
      typeof decoded.sub !== "string" ||
      typeof decoded.email !== "string" ||
      typeof decoded.role !== "string" ||
      decoded.type !== "admin-access"
    ) {
      throw new AppError(
        401,
        "INVALID_ADMIN_TOKEN",
        "The administrator access token is invalid.",
      );
    }

    return {
      sub: decoded.sub,
      email: decoded.email,
      role: decoded.role as AdminRole,
      type: "admin-access",
    };
  } catch (error: unknown) {
    if (error instanceof AppError) {
      throw error;
    }

    if (error instanceof jwt.TokenExpiredError) {
      throw new AppError(
        401,
        "ADMIN_TOKEN_EXPIRED",
        "The administrator session has expired. Please sign in again.",
      );
    }

    throw new AppError(
      401,
      "INVALID_ADMIN_TOKEN",
      "The administrator access token is invalid.",
    );
  }
}