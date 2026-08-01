import { Router } from "express";

import { prisma } from "../lib/prisma.js";
import { journeyRouter } from "./journey.routes.js";
import { bookingRouter } from "./booking.routes.js";

export const apiRouter = Router();

apiRouter.get("/", (_req, res) => {
  res.status(200).json({
    message: "Train Booking API",
    version: "1.0.0",
  });
});

apiRouter.get("/health", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;

    res.status(200).json({
      status: "healthy",
      database: "connected",
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    console.error("Health check failed:", error);

    res.status(503).json({
      status: "unhealthy",
      database: "disconnected",
      timestamp: new Date().toISOString(),
    });
  }
});

apiRouter.use("/journeys", journeyRouter);
apiRouter.use("/bookings", bookingRouter);