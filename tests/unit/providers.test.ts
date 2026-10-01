import { describe, it, expect } from "vitest";
import { MockPaymentProvider } from "@/lib/providers/PaymentProvider";
import { MockOtpProvider } from "@/lib/providers/OtpProvider";
import { MockFileStorageProvider } from "@/lib/providers/FileStorageProvider";
import { MockNotificationProvider } from "@/lib/providers/NotificationProvider";

describe("Mock Integration Provider Boundaries", () => {
  it("MockPaymentProvider creates and verifies ₹500 test order", async () => {
    const payment = new MockPaymentProvider();
    const order = await payment.createOrder({
      studentId: "student-123",
      planId: "plan-456",
      amountInr: 500,
      guardianId: "guardian-789",
      guardianEmail: "parent@example.com",
    });

    expect(order.amountInr).toBe(500);
    expect(order.orderId).toContain("order_mock_");

    const verification = await payment.verifyPayment({
      orderId: order.orderId,
      paymentId: "pay_test_123",
    });

    expect(verification.isVerified).toBe(true);
    expect(verification.status).toBe("success");
  });

  it("MockOtpProvider sends and validates OTP", async () => {
    const otp = new MockOtpProvider();
    const sendResult = await otp.sendOtp({
      phoneNumber: "9876543210",
      purpose: "guardian_verification",
    });

    expect(sendResult.success).toBe(true);
    expect(sendResult.mockDebugCode).toBe("123456");

    const verifyResult = await otp.verifyOtp({
      phoneNumber: "9876543210",
      code: "123456",
      purpose: "guardian_verification",
    });

    expect(verifyResult.isValid).toBe(true);
  });

  it("MockFileStorageProvider creates signed upload and download URLs", async () => {
    const storage = new MockFileStorageProvider();
    const upload = await storage.generateSignedUploadUrl({
      bucket: "student_docs",
      path: "student-123/certificate.pdf",
      contentType: "application/pdf",
    });

    expect(upload.uploadUrl).toContain("student_docs/student-123/certificate.pdf");
    expect(upload.headers?.["Content-Type"]).toBe("application/pdf");

    const downloadUrl = await storage.getSignedDownloadUrl({
      bucket: "student_docs",
      path: "student-123/certificate.pdf",
    });

    expect(downloadUrl).toContain("https://mock-storage.local/download");
  });

  it("MockNotificationProvider simulates email and whatsapp dispatch", async () => {
    const notifier = new MockNotificationProvider();
    const emailRes = await notifier.sendEmail({
      to: "parent@example.com",
      subject: "Welcome to ABCD of JNVST",
      html: "<p>Welcome!</p>",
    });
    expect(emailRes.success).toBe(true);

    const waRes = await notifier.sendWhatsApp({
      to: "9876543210",
      templateName: "jnvst_exam_alert",
    });
    expect(waRes.success).toBe(true);
  });
});
