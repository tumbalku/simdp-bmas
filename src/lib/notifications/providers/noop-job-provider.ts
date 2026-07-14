import type { NotificationJobProvider } from "../types";

export class NoopJobProvider implements NotificationJobProvider {
  async enqueueNotification(input: { notificationId: string; userId: string }): Promise<void> {
    console.warn(
      `[NoopJobProvider] enqueueNotification skipped for notificationId: ${input.notificationId}. INNGEST_EVENT_KEY is not configured.`,
    );
  }

  async enqueueEmail(input: { to: string; subject: string; html: string }): Promise<void> {
    console.warn(
      `[NoopJobProvider] enqueueEmail skipped to: ${input.to} with subject: "${input.subject}". INNGEST_EVENT_KEY is not configured.`,
    );
  }
}
