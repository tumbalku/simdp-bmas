import { Inngest } from "inngest";

import { env } from "@/lib/env";
import { EVENT_NAMES } from "@/lib/events/names";
import type { NotificationJobProvider } from "../types";

export const inngest = new Inngest({
  id: "simdp-bmas",
  eventKey: env.INNGEST_EVENT_KEY,
});

export class InngestJobProvider implements NotificationJobProvider {
  async enqueueNotification(input: { notificationId: string; userId: string }): Promise<void> {
    try {
      await inngest.send({
        name: EVENT_NAMES.NOTIFICATION_DISPATCH_REQUESTED,
        data: input,
      });
    } catch (error) {
      console.error("[InngestJobProvider] enqueueNotification error:", error);
    }
  }

  async enqueueEmail(input: { to: string; subject: string; html: string }): Promise<void> {
    try {
      await inngest.send({
        name: EVENT_NAMES.EMAIL_SEND_REQUESTED,
        data: input,
      });
    } catch (error) {
      console.error("[InngestJobProvider] enqueueEmail error:", error);
    }
  }
}
