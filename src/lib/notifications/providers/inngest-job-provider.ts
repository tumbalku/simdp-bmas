import { Inngest } from "inngest";

import { env } from "@/lib/env";
import type { NotificationJobProvider } from "../types";

export const inngest = new Inngest({
  id: "simdp-bmas",
  eventKey: env.INNGEST_EVENT_KEY,
});

export class InngestJobProvider implements NotificationJobProvider {
  async enqueueNotification(input: { notificationId: string; userId: string }): Promise<void> {
    try {
      await inngest.send({
        name: "notification/dispatch",
        data: input,
      });
    } catch (error) {
      console.error("[InngestJobProvider] enqueueNotification error:", error);
    }
  }

  async enqueueEmail(input: { to: string; subject: string; html: string }): Promise<void> {
    try {
      await inngest.send({
        name: "email/send",
        data: input,
      });
    } catch (error) {
      console.error("[InngestJobProvider] enqueueEmail error:", error);
    }
  }
}
