export const NOTIFICATION_TYPE = {
  DOCUMENT_STATUS: "DOCUMENT_STATUS",
  DOCUMENT_VERIFICATION: "DOCUMENT_VERIFICATION",
  EXPIRY_REMINDER: "EXPIRY_REMINDER",
  VERIFICATION_REQUIRED: "VERIFICATION_REQUIRED",
  INFO: "INFO",
} as const;

export type NotificationType = (typeof NOTIFICATION_TYPE)[keyof typeof NOTIFICATION_TYPE];

export const NOTIFICATION_RELATED_ENTITY_TYPE = {
  DOCUMENT_RECORD: "DOCUMENT_RECORD",
} as const;

export type NotificationRelatedEntityType =
  (typeof NOTIFICATION_RELATED_ENTITY_TYPE)[keyof typeof NOTIFICATION_RELATED_ENTITY_TYPE];

export function mapNotificationTypeToCanonical(value: string | null | undefined) {
  if (!value) return NOTIFICATION_TYPE.INFO;
  if (value in NOTIFICATION_TYPE) return value as NotificationType;
  return NOTIFICATION_TYPE.INFO;
}
