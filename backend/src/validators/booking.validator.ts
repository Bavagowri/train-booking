import { z } from "zod";

export const createBookingSchema = z.object({
  journeyId: z
    .string()
    .trim()
    .min(1, "Journey ID is required."),

  seatId: z
    .string()
    .trim()
    .min(1, "Seat ID is required."),

  originStationId: z
    .string()
    .trim()
    .min(1, "Origin station ID is required."),

  destinationStationId: z
    .string()
    .trim()
    .min(1, "Destination station ID is required."),

  passengerName: z
    .string()
    .trim()
    .min(2, "Passenger name must contain at least 2 characters.")
    .max(100, "Passenger name cannot exceed 100 characters."),

  passengerEmail: z
    .union([
      z
        .string()
        .trim()
        .email("Passenger email must be valid.")
        .max(255),
      z.literal(""),
    ])
    .optional()
    .transform((value) =>
      value && value.length > 0
        ? value.toLowerCase()
        : undefined,
    ),
});

export type CreateBookingInput = z.infer<
  typeof createBookingSchema
>;