import { EVENT_NAMES, publishEvent } from "@/lib/events";
import { logActivity } from "@/modules/security/server";
import { SECURITY_ACTOR_ROLE, SECURITY_EVENT_TYPE, SECURITY_LOG_STATUS } from "@/modules/security/server";
import * as repo from "../repository";

export async function processExpiredDocumentsAndReminders() {
  const now = new Date();

  // 1. Expired Transition: APPROVED documents whose expiryDate <= now
  const expiredDocs = await repo.findExpiredApprovedDocuments(now);

  let expiredCount = 0;
  for (const doc of expiredDocs) {
    await repo.updateDocumentStatus(doc.id, "EXPIRED");

    await logActivity({
      actorName: "System",
      actorRole: SECURITY_ACTOR_ROLE.SYSTEM,
      eventType: SECURITY_EVENT_TYPE.CRON_DOCUMENT_EXPIRED,
      resource: `DocumentRecord:${doc.id}`,
      status: SECURITY_LOG_STATUS.SUCCESS,
      metadata: { code: doc.documentType.code, ownerId: doc.ownerId },
    });

    expiredCount++;
  }

  // 2. Idempotent Reminders
  // Load configurations
  const settings = await repo.findSystemSettings();
  const getSettingVal = (key: string, fallback: number) => {
    const s = settings.find((x) => x.key === key);
    return s ? parseInt(s.value, 10) : fallback;
  };

  const reminderDaysH30 = getSettingVal("reminder_days_h30", 30);
  const reminderDaysH7 = getSettingVal("reminder_days_h7", 7);
  const reminderDaysH1 = getSettingVal("reminder_days_h1", 1);

  // UTC midnight helper
  const getMidnightUTC = (offsetDays: number) => {
    const d = new Date();
    d.setUTCHours(0, 0, 0, 0);
    d.setUTCDate(d.getUTCDate() + offsetDays);
    return d;
  };

  const h30Date = getMidnightUTC(reminderDaysH30);
  const h7Date = getMidnightUTC(reminderDaysH7);
  const h1Date = getMidnightUTC(reminderDaysH1);

  // Find all APPROVED docs with expiryDate matching target dates and flags are null
  const docsToRemind = await repo.findDocumentsToRemind(h30Date, h7Date, h1Date);

  const remindersSent = {
    H30: 0,
    H7: 0,
    H1: 0,
  };

  const dateString = (d: Date) => d.toISOString().split("T")[0];

  for (const doc of docsToRemind) {
    if (!doc.expiryDate) continue;
    const docTime = doc.expiryDate.getTime();

    if (docTime === h30Date.getTime() && !doc.reminderH30SentAt) {
      const title = "Peringatan Kedaluwarsa Dokumen (H-30)";
      const message = `Dokumen ${doc.documentType.name} Anda akan kedaluwarsa dalam 30 hari (${dateString(
        doc.expiryDate
      )}).`;
      await repo.updateReminderSentAt({
        documentRecordId: doc.id,
        reminderField: "reminderH30SentAt",
      });
      await publishEvent(EVENT_NAMES.DOCUMENT_EXPIRY_REMINDER_CREATED, {
        userId: doc.owner.userId,
        documentRecordId: doc.id,
        documentTypeName: doc.documentType.name,
        title,
        message,
        reminderStage: "H30",
      });
      remindersSent.H30++;
    } else if (docTime === h7Date.getTime() && !doc.reminderH7SentAt) {
      const title = "Peringatan Kedaluwarsa Dokumen (H-7)";
      const message = `Dokumen ${doc.documentType.name} Anda akan kedaluwarsa dalam 7 hari (${dateString(
        doc.expiryDate
      )}).`;
      await repo.updateReminderSentAt({
        documentRecordId: doc.id,
        reminderField: "reminderH7SentAt",
      });
      await publishEvent(EVENT_NAMES.DOCUMENT_EXPIRY_REMINDER_CREATED, {
        userId: doc.owner.userId,
        documentRecordId: doc.id,
        documentTypeName: doc.documentType.name,
        title,
        message,
        reminderStage: "H7",
      });
      remindersSent.H7++;
    } else if (docTime === h1Date.getTime() && !doc.reminderH1SentAt) {
      const title = "Peringatan Kedaluwarsa Dokumen (H-1)";
      const message = `Dokumen ${doc.documentType.name} Anda akan kedaluwarsa besok (${dateString(
        doc.expiryDate
      )}).`;
      await repo.updateReminderSentAt({
        documentRecordId: doc.id,
        reminderField: "reminderH1SentAt",
      });
      await publishEvent(EVENT_NAMES.DOCUMENT_EXPIRY_REMINDER_CREATED, {
        userId: doc.owner.userId,
        documentRecordId: doc.id,
        documentTypeName: doc.documentType.name,
        title,
        message,
        reminderStage: "H1",
      });
      remindersSent.H1++;
    }
  }

  await logActivity({
    actorName: "System",
    actorRole: SECURITY_ACTOR_ROLE.SYSTEM,
    eventType: SECURITY_EVENT_TYPE.CRON_CHECK_EXPIRY_RUN,
    resource: "CronCheckExpiry",
    status: SECURITY_LOG_STATUS.SUCCESS,
    metadata: { expiredCount, remindersSent },
  });

  return {
    expiredCount,
    remindersSent,
  };
}
