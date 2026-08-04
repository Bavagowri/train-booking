import bcrypt from "bcryptjs";

import { prisma } from "../lib/prisma.js";
import { AppError } from "../utils/appError.js";
import { createAdminAccessToken } from "../utils/jwt.js";

import type { AdminLoginInput } from "../validators/adminAuth.validator.js";

export class AdminAuthService {
  async login(input: AdminLoginInput) {
    const admin = await prisma.admin.findUnique({
      where: {
        email: input.email,
      },
    });

    const invalidCredentialsError =
      new AppError(
        401,
        "INVALID_ADMIN_CREDENTIALS",
        "The email or password is incorrect.",
      );

    if (!admin) {
      throw invalidCredentialsError;
    }

    if (!admin.isActive) {
      throw new AppError(
        403,
        "ADMIN_ACCOUNT_DISABLED",
        "This administrator account has been disabled.",
      );
    }

    const passwordMatches =
      await bcrypt.compare(
        input.password,
        admin.passwordHash,
      );

    if (!passwordMatches) {
      throw invalidCredentialsError;
    }

    const accessToken =
      createAdminAccessToken({
        sub: admin.id,
        email: admin.email,
        role: admin.role,
      });

    const updatedAdmin =
      await prisma.admin.update({
        where: {
          id: admin.id,
        },
        data: {
          lastLoginAt: new Date(),
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
          lastLoginAt: true,
          createdAt: true,
        },
      });

    return {
      accessToken,
      tokenType: "Bearer",
      expiresIn:
        process.env.JWT_EXPIRES_IN ?? "2h",
      admin: updatedAdmin,
    };
  }

  async getCurrentAdmin(adminId: string) {
    const admin = await prisma.admin.findFirst({
      where: {
        id: adminId,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
      },
    });

    if (!admin) {
      throw new AppError(
        401,
        "ADMIN_NOT_AUTHENTICATED",
        "The administrator account could not be authenticated.",
      );
    }

    return admin;
  }
}

export const adminAuthService =
  new AdminAuthService();