export interface RealtimeNotificationProvider {
  publishToUser(
    userId: string,
    payload: {
      id: string;
      type: string;
      title: string;
      message: string | null;
      isRead: boolean;
      relatedEntityType: string | null;
      relatedEntityId: string | null;
      createdAt: string;
    }
  ): Promise<void>;
  publishToRole(role: string, payload: unknown): Promise<void>;
}

export interface EmailProvider {
  sendEmail(input: {
    to: string;
    subject: string;
    html: string;
    text?: string;
  }): Promise<void>;
}

export interface NotificationJobProvider {
  enqueueNotification(input: {
    notificationId: string;
    userId: string;
  }): Promise<void>;
  enqueueEmail(input: {
    to: string;
    subject: string;
    html: string;
  }): Promise<void>;
}
