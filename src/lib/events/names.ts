export const EVENT_NAMES = {
  DOCUMENT_EXPIRY_REMINDER_CREATED: "document/expiry-reminder.created",
  EMAIL_SEND_REQUESTED: "email/send",
  NOTIFICATION_DISPATCH_REQUESTED: "notification/dispatch.requested",
  VERIFICATION_APPROVED: "verification/approved",
  VERIFICATION_REJECTED: "verification/rejected",
} as const;

export type EventName = (typeof EVENT_NAMES)[keyof typeof EVENT_NAMES];
