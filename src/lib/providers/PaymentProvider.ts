// Future integration boundary: Payment Provider Interface & Mock
export interface PaymentOrderParams {
  studentId: string;
  planId: string;
  amountInr: number;
  guardianId: string;
  guardianEmail: string;
}

export interface PaymentOrderResult {
  orderId: string;
  amountInr: number;
  currency: "INR";
  status: "created" | "paid" | "failed";
  mockCheckoutUrl?: string;
}

export interface PaymentVerificationParams {
  orderId: string;
  paymentId: string;
  signature?: string;
}

export interface PaymentVerificationResult {
  isVerified: boolean;
  orderId: string;
  paymentId: string;
  status: "success" | "failure";
  transactionTime: Date;
}

export interface PaymentProvider {
  createOrder(params: PaymentOrderParams): Promise<PaymentOrderResult>;
  verifyPayment(params: PaymentVerificationParams): Promise<PaymentVerificationResult>;
  refund(
    paymentId: string,
    amountInr: number
  ): Promise<{ success: boolean; refundId: string }>;
}

export class MockPaymentProvider implements PaymentProvider {
  async createOrder(params: PaymentOrderParams): Promise<PaymentOrderResult> {
    // In local development / Phase 0, mock the payment order creation
    const orderId = `order_mock_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    return {
      orderId,
      amountInr: params.amountInr,
      currency: "INR",
      status: "created",
      mockCheckoutUrl: `/mock-checkout?orderId=${orderId}&amount=${params.amountInr}`,
    };
  }

  async verifyPayment(
    params: PaymentVerificationParams
  ): Promise<PaymentVerificationResult> {
    // Always verifies successfully in mock development environment
    return {
      isVerified: true,
      orderId: params.orderId,
      paymentId: params.paymentId || `pay_mock_${Date.now()}`,
      status: "success",
      transactionTime: new Date(),
    };
  }

  async refund(
    paymentId: string,
    amountInr: number
  ): Promise<{ success: boolean; refundId: string }> {
    return {
      success: true,
      refundId: `rfnd_mock_${Date.now()}`,
    };
  }
}

export const paymentProvider: PaymentProvider = new MockPaymentProvider();
