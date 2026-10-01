import { z } from "zod";

export const guardianProfileSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Full name must be at least 2 characters")
    .max(100, "Full name is too long"),
  phoneNumber: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, "Please enter a valid 10-digit Indian mobile number")
    .optional()
    .or(z.literal("")),
  state: z.string().trim().min(2, "State is required"),
});

export type GuardianProfileInput = z.infer<typeof guardianProfileSchema>;
