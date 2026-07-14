import Pusher from "pusher";

import { env } from "@/lib/env";
import type { RealtimeNotificationProvider } from "../types";

export class PusherRealtimeProvider implements RealtimeNotificationProvider {
  private pusher: Pusher;

  constructor() {
    this.pusher = new Pusher({
      appId: env.PUSHER_APP_ID ?? "",
      key: env.PUSHER_KEY ?? env.NEXT_PUBLIC_PUSHER_KEY ?? "",
      secret: env.PUSHER_SECRET ?? "",
      cluster: env.PUSHER_CLUSTER ?? env.NEXT_PUBLIC_PUSHER_CLUSTER ?? "",
      useTLS: true,
    });
  }

  async publishToUser(userId: string, payload: unknown): Promise<void> {
    try {
      await this.pusher.trigger(`private-user-${userId}`, "notification:new", payload);
    } catch (error) {
      console.error("[PusherRealtimeProvider] publishToUser error:", error);
    }
  }

  async publishToRole(role: string, payload: unknown): Promise<void> {
    try {
      await this.pusher.trigger(`private-role-${role.toLowerCase()}`, "notification:new", payload);
    } catch (error) {
      console.error("[PusherRealtimeProvider] publishToRole error:", error);
    }
  }
}
