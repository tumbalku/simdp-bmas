import { EVENT_NAMES } from "./names";

export type DocumentExpiryReminderStage = "H30" | "H7" | "H1";

export type EventPayloadMap = {
  [EVENT_NAMES.DOCUMENT_EXPIRY_REMINDER_CREATED]: {
    userId: string;
    documentRecordId: string;
    documentTypeName: string;
    title: string;
    message: string;
    reminderStage: DocumentExpiryReminderStage;
  };
  [EVENT_NAMES.EMAIL_SEND_REQUESTED]: {
    to: string;
    subject: string;
    html: string;
  };
  [EVENT_NAMES.NOTIFICATION_DISPATCH_REQUESTED]: {
    notificationId: string;
    userId: string;
  };
  [EVENT_NAMES.VERIFICATION_APPROVED]: {
    userId: string;
    documentRecordId: string;
    documentTypeName: string;
  };
  [EVENT_NAMES.VERIFICATION_REJECTED]: {
    userId: string;
    documentRecordId: string;
    documentTypeName: string;
    note: string;
  };
};

export type EventPayload<Name extends keyof EventPayloadMap> = EventPayloadMap[Name];
