import { z } from "zod";

export const studentSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Student full name must be at least 2 characters")
    .max(80, "Name must be under 80 characters")
    .regex(/^[a-zA-Z\s.'-]+$/, "Student name should only contain alphabetic characters"),
  dateOfBirth: z
    .string()
    .min(1, "Date of birth is required")
    .refine((dob) => {
      const birthDate = new Date(dob);
      if (isNaN(birthDate.getTime())) return false;
      const ageDiffMs = Date.now() - birthDate.getTime();
      const ageDate = new Date(ageDiffMs);
      const age = Math.abs(ageDate.getUTCFullYear() - 1970);
      // JNVST Class 6 candidates are typically 9 to 14 years old
      return age >= 8 && age <= 15;
    }, "Student must be between 8 and 15 years old for JNVST Class 6 eligibility"),
  district: z
    .string()
    .trim()
    .min(2, "District is required")
    .max(60, "District name is too long"),
  state: z.string().trim().min(2, "State is required"),
  gender: z.enum(["male", "female", "other"], {
    required_error: "Please select student gender",
  }),
  targetExamYear: z.coerce
    .number()
    .int()
    .min(2025, "Target year must be 2025 or later")
    .max(2032, "Target year cannot exceed 2032")
    .default(2027),
  relationship: z
    .enum(["parent", "guardian", "teacher", "other"], {
      required_error: "Please specify your relationship with the student",
    })
    .default("parent"),
});

export type StudentInput = z.infer<typeof studentSchema>;

export const studentUpdateSchema = studentSchema.partial().extend({
  id: z.string().uuid("Invalid student ID"),
});

export type StudentUpdateInput = z.infer<typeof studentUpdateSchema>;
