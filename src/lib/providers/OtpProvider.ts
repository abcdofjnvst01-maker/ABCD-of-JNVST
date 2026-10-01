// Future integration boundary: OTP Provider Interface & Mock
export type OtpPurpose =
  "login" | "guardian_verification" | "phone_update" | "password_reset";

export interface SendOtpParams {
  phoneNumber: string;
  purpose: OtpPurpose;
  expiryMinutes?: number;
}

export interface SendOtpResult {
  success: boolean;
  messageId: string;
  expiresAt: Date;
  mockDebugCode?: string;
}

export interface VerifyOtpParams {
  phoneNumber: string;
  code: string;
  purpose: OtpPurpose;
}

export interface VerifyOtpResult {
  isValid: boolean;
  message: string;
}

export interface OtpProvider {
  sendOtp(params: SendOtpParams): Promise<SendOtpResult>;
  verifyOtp(params: VerifyOtpParams): Promise<VerifyOtpResult>;
}

export class MockOtpProvider implements OtpProvider {
  private inMemoryStore = new Map<
    string,
    { code: string; expiresAt: Date; purpose: OtpPurpose }
  >();

  async sendOtp(params: SendOtpParams): Promise<SendOtpResult> {
    const mockCode = "123456"; // Standard local deterministic test code
    const expiresAt = new Date(Date.now() + (params.expiryMinutes || 10) * 60 * 1000);
    this.inMemoryStore.set(`${params.phoneNumber}:${params.purpose}`, {
      code: mockCode,
      expiresAt,
      purpose: params.purpose,
    });

    return {
      success: true,
      messageId: `msg_mock_${Date.now()}`,
      expiresAt,
      mockDebugCode: process.env.NODE_ENV !== "production" ? mockCode : undefined,
    };
  }

  async verifyOtp(params: VerifyOtpParams): Promise<VerifyOtpResult> {
    const key = `${params.phoneNumber}:${params.purpose}`;
    const record = this.inMemoryStore.get(key);

    if (!record) {
      // In dev mock, allow '123456' as universal test bypass
      if (params.code === "123456") {
        return { isValid: true, message: "Mock OTP verified successfully" };
      }
      return {
        isValid: false,
        message: "No active OTP request found for this phone number.",
      };
    }

    if (new Date() > record.expiresAt) {
      this.inMemoryStore.delete(key);
      return { isValid: false, message: "OTP has expired. Please request a new one." };
    }

    if (record.code !== params.code && params.code !== "123456") {
      return { isValid: false, message: "Invalid OTP code entered." };
    }

    this.inMemoryStore.delete(key);
    return { isValid: true, message: "OTP verified successfully." };
  }
}

export const otpProvider: OtpProvider = new MockOtpProvider();
