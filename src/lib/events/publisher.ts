import { env } from "@/lib/env";
import { inngest } from "@/lib/notifications/providers/inngest-job-provider";

import { EVENT_NAMES } from "./names";
import type { EventPayload, EventPayloadMap } from "./types";

export async function publishEvent<Name extends keyof EventPayloadMap>(
  name: Name,
  data: EventPayload<Name>
): Promise<void> {
  if (!env.INNGEST_EVENT_KEY) {
    try {
      await dispatchEventLocally(name, data);
    } catch (error) {
      console.error(`[EventBus] Failed to dispatch local event ${name}:`, error);
    }
    return;
  }

  try {
    await inngest.send({ name, data });
  } catch (error) {
    console.error(`[EventBus] Failed to publish event ${name}:`, error);
  }
}

async function dispatchEventLocally<Name extends keyof EventPayloadMap>(
  name: Name,
  data: EventPayload<Name>
) {
  const subscribers = await import("./subscribers");

  switch (name) {
    case EVENT_NAMES.DOCUMENT_EXPIRY_REMINDER_CREATED:
      await subscribers.handleDocumentExpiryReminderCreated(
        data as EventPayload<typeof EVENT_NAMES.DOCUMENT_EXPIRY_REMINDER_CREATED>
      );
      break;
    case EVENT_NAMES.DOCUMENT_VERIFICATION_REQUESTED:
      await subscribers.handleDocumentVerificationRequested(
        data as EventPayload<typeof EVENT_NAMES.DOCUMENT_VERIFICATION_REQUESTED>
      );
      break;
    case EVENT_NAMES.EMAIL_SEND_REQUESTED:
      await subscribers.handleEmailSendRequested(data as EventPayload<typeof EVENT_NAMES.EMAIL_SEND_REQUESTED>);
      break;
    case EVENT_NAMES.NOTIFICATION_DISPATCH_REQUESTED:
      await subscribers.handleNotificationDispatchRequested(
        data as EventPayload<typeof EVENT_NAMES.NOTIFICATION_DISPATCH_REQUESTED>
      );
      break;
    case EVENT_NAMES.VERIFICATION_APPROVED:
      await subscribers.handleVerificationApproved(data as EventPayload<typeof EVENT_NAMES.VERIFICATION_APPROVED>);
      break;
    case EVENT_NAMES.VERIFICATION_REJECTED:
      await subscribers.handleVerificationRejected(data as EventPayload<typeof EVENT_NAMES.VERIFICATION_REJECTED>);
      break;
  }
}
