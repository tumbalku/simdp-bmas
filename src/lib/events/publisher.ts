import { inngest } from "@/lib/notifications/providers/inngest-job-provider";

import type { EventPayload, EventPayloadMap } from "./types";

export async function publishEvent<Name extends keyof EventPayloadMap>(
  name: Name,
  data: EventPayload<Name>
): Promise<void> {
  try {
    await inngest.send({ name, data });
  } catch (error) {
    console.error(`[EventBus] Failed to publish event ${name}:`, error);
  }
}
