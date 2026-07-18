import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createNotification: vi.fn(),
  dispatchNotification: vi.fn(),
  sendEmail: vi.fn(),
}));

vi.mock("@/lib/notifications", () => ({
  emailProvider: {
    sendEmail: mocks.sendEmail,
  },
}));

vi.mock("@/lib/events/inngest", () => ({
  inngest: {
    createFunction: vi.fn((config, handler) => ({ config, handler })),
  },
}));

vi.mock("@/modules/notification", () => ({
  NOTIFICATION_RELATED_ENTITY_TYPE: {
    DOCUMENT_RECORD: "DOCUMENT_RECORD",
  },
  NOTIFICATION_TYPE: {
    DOCUMENT_STATUS: "DOCUMENT_STATUS",
    EXPIRY_REMINDER: "EXPIRY_REMINDER",
    VERIFICATION_REQUIRED: "VERIFICATION_REQUIRED",
  },
}));

vi.mock("@/modules/notification/server", () => ({
  createNotification: mocks.createNotification,
  dispatchNotification: mocks.dispatchNotification,
}));

import {
  handleDocumentExpiryReminderCreated,
  handleDocumentVerificationRequested,
  handleEmailSendRequested,
  handleNotificationDispatchRequested,
  handleVerificationApproved,
  handleVerificationRejected,
} from "..";

describe("event subscribers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates expiry reminder notifications inside the notification module", async () => {
    await handleDocumentExpiryReminderCreated({
      userId: "user-1",
      documentRecordId: "doc-1",
      documentTypeName: "STR",
      title: "Peringatan",
      message: "Dokumen akan kedaluwarsa.",
      reminderStage: "H30",
    });

    expect(mocks.createNotification).toHaveBeenCalledWith({
      userId: "user-1",
      type: "EXPIRY_REMINDER",
      title: "Peringatan",
      message: "Dokumen akan kedaluwarsa.",
      relatedEntityType: "DOCUMENT_RECORD",
      relatedEntityId: "doc-1",
      skipDispatch: true,
    });
  });

  it("dispatches notifications inside the notification module", async () => {
    await handleNotificationDispatchRequested({
      notificationId: "notification-1",
      userId: "user-1",
    });

    expect(mocks.dispatchNotification).toHaveBeenCalledWith({
      notificationId: "notification-1",
    });
  });

  it("creates realtime verification request notifications for every recipient", async () => {
    await handleDocumentVerificationRequested({
      recipientUserIds: ["admin-1", "staff-1"],
      documentRecordId: "doc-1",
      documentTypeName: "STR",
      ownerName: "Sil",
      action: "UPLOADED",
    });

    expect(mocks.createNotification).toHaveBeenCalledTimes(2);
    expect(mocks.createNotification).toHaveBeenCalledWith({
      userId: "admin-1",
      type: "VERIFICATION_REQUIRED",
      title: "Dokumen Baru Perlu Verifikasi",
      message: "Pegawai Sil telah mengunggah dokumen baru: STR",
      relatedEntityType: "DOCUMENT_RECORD",
      relatedEntityId: "doc-1",
      skipDispatch: true,
    });
    expect(mocks.createNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "staff-1",
        title: "Dokumen Baru Perlu Verifikasi",
      })
    );
  });

  it("creates replacement verification notifications for every recipient", async () => {
    await handleDocumentVerificationRequested({
      recipientUserIds: ["staff-1"],
      documentRecordId: "doc-1",
      documentTypeName: "STR",
      ownerName: "Sil",
      action: "REPLACED",
    });

    expect(mocks.createNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "staff-1",
        title: "Dokumen Diganti Perlu Verifikasi",
        message: "Pegawai Sil telah mengganti file dokumen: STR",
      })
    );
  });

  it("creates verification status notifications", async () => {
    await handleVerificationApproved({
      userId: "user-1",
      documentRecordId: "doc-1",
      documentTypeName: "Ijazah",
    });
    await handleVerificationRejected({
      userId: "user-1",
      documentRecordId: "doc-1",
      documentTypeName: "Ijazah",
      note: "File blur",
    });

    expect(mocks.createNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Dokumen Disetujui",
        message: "Dokumen Ijazah Anda telah disetujui.",
      })
    );
    expect(mocks.createNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Dokumen Ditolak",
        message: "Dokumen Ijazah Anda telah ditolak. Catatan: File blur",
      })
    );
  });

  it("sends email through the configured email provider", async () => {
    await handleEmailSendRequested({
      to: "user@example.com",
      subject: "Halo",
      html: "<p>Halo</p>",
    });

    expect(mocks.sendEmail).toHaveBeenCalledWith({
      to: "user@example.com",
      subject: "Halo",
      html: "<p>Halo</p>",
    });
  });
});
