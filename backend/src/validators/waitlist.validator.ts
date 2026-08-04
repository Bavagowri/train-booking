import {
  PassengerCategory,
} from "@prisma/client";

import { z } from "zod";

export const createWaitlistEntrySchema =
  z.object({
    journeyId: z.string().trim().min(1),
    originStationId:
      z.string().trim().min(1),
    destinationStationId:
      z.string().trim().min(1),

    passengerName: z
      .string()
      .trim()
      .min(2)
      .max(100),

    passengerEmail: z
      .string()
      .trim()
      .email()
      .max(255)
      .transform((value) =>
        value.toLowerCase(),
      ),

    passengerCategory: z
      .nativeEnum(PassengerCategory)
      .default(
        PassengerCategory.ADULT,
      ),
  });

export type CreateWaitlistEntryInput =
  z.infer<
    typeof createWaitlistEntrySchema
  >;