import { describe, it, expect } from "vitest";
import { signInSchema, signUpSchema } from "@/server/validation/auth";
import { studentSchema } from "@/server/validation/student";
import { guardianProfileSchema } from "@/server/validation/guardian";

describe("Authentication Validation Schemas", () => {
  it("validates valid sign-in input", () => {
    const valid = signInSchema.safeParse({
      email: "parent@example.com",
      password: "StrongPassword123",
    });
    expect(valid.success).toBe(true);
  });

  it("rejects invalid email in sign-in", () => {
    const invalid = signInSchema.safeParse({
      email: "not-an-email",
      password: "Password123",
    });
    expect(invalid.success).toBe(false);
  });

  it("validates valid guardian sign-up data", () => {
    const valid = signUpSchema.safeParse({
      fullName: "Ramesh Sharma",
      email: "ramesh@example.com",
      phoneNumber: "9876543210",
      state: "Rajasthan",
      password: "SecurePassword1",
      confirmPassword: "SecurePassword1",
    });
    expect(valid.success).toBe(true);
  });

  it("enforces security constraint: mobile number cannot be password", () => {
    const mobileAsPassword = signUpSchema.safeParse({
      fullName: "Ramesh Sharma",
      email: "ramesh@example.com",
      phoneNumber: "9876543210",
      state: "Rajasthan",
      password: "9876543210",
      confirmPassword: "9876543210",
    });
    expect(mobileAsPassword.success).toBe(false);
  });

  it("enforces password matching", () => {
    const mismatch = signUpSchema.safeParse({
      fullName: "Ramesh Sharma",
      email: "ramesh@example.com",
      phoneNumber: "9876543210",
      state: "Rajasthan",
      password: "Password123",
      confirmPassword: "DifferentPassword123",
    });
    expect(mismatch.success).toBe(false);
  });
});

describe("Student Validation Schemas", () => {
  it("accepts eligible JNVST Class 6 student (e.g. 11 years old)", () => {
    const valid = studentSchema.safeParse({
      fullName: "Aarav Sharma",
      dateOfBirth: "2015-06-15",
      district: "Jaipur",
      state: "Rajasthan",
      gender: "male",
      targetExamYear: 2027,
      relationship: "parent",
    });
    expect(valid.success).toBe(true);
  });

  it("rejects ineligible student age (e.g. 25 years old)", () => {
    const ineligible = studentSchema.safeParse({
      fullName: "Adult Person",
      dateOfBirth: "2000-01-01",
      district: "Jaipur",
      state: "Rajasthan",
      gender: "male",
      targetExamYear: 2027,
      relationship: "parent",
    });
    expect(ineligible.success).toBe(false);
  });

  it("enforces valid target exam year range", () => {
    const pastYear = studentSchema.safeParse({
      fullName: "Aarav Sharma",
      dateOfBirth: "2015-06-15",
      district: "Jaipur",
      state: "Rajasthan",
      gender: "male",
      targetExamYear: 2020, // Too early
      relationship: "parent",
    });
    expect(pastYear.success).toBe(false);
  });
});

describe("Guardian Profile Validation", () => {
  it("validates guardian profile update", () => {
    const valid = guardianProfileSchema.safeParse({
      fullName: "Suresh Patel",
      phoneNumber: "9823456789",
      state: "Gujarat",
    });
    expect(valid.success).toBe(true);
  });

  it("rejects invalid phone numbers", () => {
    const invalidPhone = guardianProfileSchema.safeParse({
      fullName: "Suresh Patel",
      phoneNumber: "12345",
      state: "Gujarat",
    });
    expect(invalidPhone.success).toBe(false);
  });
});
