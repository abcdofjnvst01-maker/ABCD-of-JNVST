import { describe, it, expect } from "vitest";
import { sanitizeAuditMetadata } from "@/server/services/AuditService";

describe("Audit Metadata Sanitization", () => {
  it("redacts sensitive fields like passwords, tokens, and secrets", () => {
    const rawMetadata = {
      email: "guardian@example.com",
      password: "SuperSecretPassword123!",
      confirmPassword: "SuperSecretPassword123!",
      token: "jwt-token-value",
      accessToken: "access-token-12345",
      apiKey: "secret-api-key",
      creditCard: "4111-2222-3333-4444",
      userProfile: {
        name: "Ramesh Sharma",
        otp: "123456",
        refreshToken: "refresh-secret",
      },
    };

    const sanitized = sanitizeAuditMetadata(rawMetadata);

    expect(sanitized.email).toBe("guardian@example.com");
    expect(sanitized.password).toBe("[REDACTED]");
    expect(sanitized.confirmPassword).toBe("[REDACTED]");
    expect(sanitized.token).toBe("[REDACTED]");
    expect(sanitized.accessToken).toBe("[REDACTED]");
    expect(sanitized.apiKey).toBe("[REDACTED]");
    expect(sanitized.creditCard).toBe("[REDACTED]");

    const nested = sanitized.userProfile as Record<string, unknown>;
    expect(nested.name).toBe("Ramesh Sharma");
    expect(nested.otp).toBe("[REDACTED]");
    expect(nested.refreshToken).toBe("[REDACTED]");
  });

  it("safely handles null, undefined, and non-object inputs", () => {
    expect(sanitizeAuditMetadata(null)).toEqual({});
    expect(sanitizeAuditMetadata(undefined)).toEqual({});
  });
});
