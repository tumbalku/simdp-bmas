import { emailProvider } from "@/lib/notifications";
import { inngest } from "@/lib/notifications/providers/inngest-job-provider";
import {
  NOTIFICATION_RELATED_ENTITY_TYPE,
  NOTIFICATION_TYPE,
} from "@/modules/notification";
import {
  createNotification,
  dispatchNotification,
} from "@/modules/notification/server";

import { EVENT_NAMES } from "./names";
import type { EventPayload } from "./types";

export async function handleDocumentExpiryReminderCreated(
  data: EventPayload<typeof EVENT_NAMES.DOCUMENT_EXPIRY_REMINDER_CREATED>
) {
  await createNotification({
    userId: data.userId,
    type: NOTIFICATION_TYPE.EXPIRY_REMINDER,
    title: data.title,
    message: data.message,
    relatedEntityType: NOTIFICATION_RELATED_ENTITY_TYPE.DOCUMENT_RECORD,
    relatedEntityId: data.documentRecordId,
  });
}

export async function handleEmailSendRequested(data: EventPayload<typeof EVENT_NAMES.EMAIL_SEND_REQUESTED>) {
  await emailProvider.sendEmail(data);
}

export async function handleNotificationDispatchRequested(
  data: EventPayload<typeof EVENT_NAMES.NOTIFICATION_DISPATCH_REQUESTED>
) {
  await dispatchNotification({ notificationId: data.notificationId });
}

export async function handleVerificationApproved(data: EventPayload<typeof EVENT_NAMES.VERIFICATION_APPROVED>) {
  await createNotification({
    userId: data.userId,
    type: NOTIFICATION_TYPE.DOCUMENT_STATUS,
    title: "Dokumen Disetujui",
    message: `Dokumen ${data.documentTypeName} Anda telah disetujui.`,
    relatedEntityType: NOTIFICATION_RELATED_ENTITY_TYPE.DOCUMENT_RECORD,
    relatedEntityId: data.documentRecordId,
  });
}

export async function handleVerificationRejected(data: EventPayload<typeof EVENT_NAMES.VERIFICATION_REJECTED>) {
  await createNotification({
    userId: data.userId,
    type: NOTIFICATION_TYPE.DOCUMENT_STATUS,
    title: "Dokumen Ditolak",
    message: `Dokumen ${data.documentTypeName} Anda telah ditolak. Catatan: ${data.note}`,
    relatedEntityType: NOTIFICATION_RELATED_ENTITY_TYPE.DOCUMENT_RECORD,
    relatedEntityId: data.documentRecordId,
  });
}

const documentExpiryReminderCreatedFn = inngest.createFunction(
  {
    id: "document-expiry-reminder-created",
    triggers: [{ event: EVENT_NAMES.DOCUMENT_EXPIRY_REMINDER_CREATED }],
  },
  async ({ event }: { event: { data: EventPayload<typeof EVENT_NAMES.DOCUMENT_EXPIRY_REMINDER_CREATED> } }) => {
    await handleDocumentExpiryReminderCreated(event.data);
  }
);

const emailSendFn = inngest.createFunction(
  { id: "email-send", triggers: [{ event: EVENT_NAMES.EMAIL_SEND_REQUESTED }] },
  async ({ event }: { event: { data: EventPayload<typeof EVENT_NAMES.EMAIL_SEND_REQUESTED> } }) => {
    await handleEmailSendRequested(event.data);
  }
);

const notificationDispatchRequestedFn = inngest.createFunction(
  {
    id: "notification-dispatch-requested",
    triggers: [{ event: EVENT_NAMES.NOTIFICATION_DISPATCH_REQUESTED }],
  },
  async ({ event }: { event: { data: EventPayload<typeof EVENT_NAMES.NOTIFICATION_DISPATCH_REQUESTED> } }) => {
    await handleNotificationDispatchRequested(event.data);
  }
);

const verificationApprovedFn = inngest.createFunction(
  { id: "verification-approved", triggers: [{ event: EVENT_NAMES.VERIFICATION_APPROVED }] },
  async ({ event }: { event: { data: EventPayload<typeof EVENT_NAMES.VERIFICATION_APPROVED> } }) => {
    await handleVerificationApproved(event.data);
  }
);

const verificationRejectedFn = inngest.createFunction(
  { id: "verification-rejected", triggers: [{ event: EVENT_NAMES.VERIFICATION_REJECTED }] },
  async ({ event }: { event: { data: EventPayload<typeof EVENT_NAMES.VERIFICATION_REJECTED> } }) => {
    await handleVerificationRejected(event.data);
  }
);

export const eventSubscribers = [
  documentExpiryReminderCreatedFn,
  emailSendFn,
  notificationDispatchRequestedFn,
  verificationApprovedFn,
  verificationRejectedFn,
];
