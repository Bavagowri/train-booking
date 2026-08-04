import { z } from "zod";

export const adminLoginSchema = z.object({
  email: z
    .string()
    .trim()
    .email("A valid email address is required.")
    .max(255)
    .transform((value) =>
      value.toLowerCase(),
    ),

  password: z
    .string()
    .min(8, "Password must contain at least 8 characters.")
    .max(72, "Password cannot exceed 72 characters."),
});

export type AdminLoginInput = z.infer<
  typeof adminLoginSchema
>;