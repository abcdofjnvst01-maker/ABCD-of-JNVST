// Future integration boundary: Notification Provider Interface & Mock
export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface WhatsAppMessage {
  to: string;
  templateName: string;
  languageCode?: string;
  parameters?: Record<string, string>;
}

export interface NotificationProvider {
  sendEmail(message: EmailMessage): Promise<{ success: boolean; messageId: string }>;
  sendWhatsApp(
    message: WhatsAppMessage
  ): Promise<{ success: boolean; messageId: string }>;
}

export class MockNotificationProvider implements NotificationProvider {
  async sendEmail(
    message: EmailMessage
  ): Promise<{ success: boolean; messageId: string }> {
    if (process.env.NODE_ENV === "development") {
      console.log(
        `[MockNotificationProvider Email] To: ${message.to} | Subject: ${message.subject}`
      );
    }
    return {
      success: true,
      messageId: `email_mock_${Date.now()}`,
    };
  }

  async sendWhatsApp(
    message: WhatsAppMessage
  ): Promise<{ success: boolean; messageId: string }> {
    if (process.env.NODE_ENV === "development") {
      console.log(
        `[MockNotificationProvider WhatsApp] To: ${message.to} | Template: ${message.templateName}`
      );
    }
    return {
      success: true,
      messageId: `wa_mock_${Date.now()}`,
    };
  }
}

export const notificationProvider: NotificationProvider = new MockNotificationProvider();
