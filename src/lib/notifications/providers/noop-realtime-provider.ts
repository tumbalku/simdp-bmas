import { RealtimeNotificationProvider } from "../types";

export class NoopRealtimeProvider implements RealtimeNotificationProvider {
  async publishToUser(userId: string, payload: unknown): Promise<void> {
    console.warn(
      `[NoopRealtimeProvider] publishToUser triggered for user: ${userId} but Pusher is not configured.`,
      payload
    );
  }

  async publishToRole(role: string, payload: unknown): Promise<void> {
    console.warn(
      `[NoopRealtimeProvider] publishToRole triggered for role: ${role} but Pusher is not configured.`,
      payload
    );
  }
}
