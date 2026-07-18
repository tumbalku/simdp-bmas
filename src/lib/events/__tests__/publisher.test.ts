import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  dispatchNotification: vi.fn(),
  send: vi.fn(),
  env: {
    INNGEST_EVENT_KEY: "test-event-key" as string | undefined,
  },
}));

vi.mock("@/lib/env", () => ({
  env: mocks.env,
}));

vi.mock("@/lib/events/inngest", () => ({
  inngest: {
    send: mocks.send,
  },
}));

describe("event publisher", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    mocks.env.INNGEST_EVENT_KEY = "test-event-key";
  });

  it("publishes typed events through the shared Inngest client", async () => {
    const { EVENT_NAMES } = await import("../names");
    const { publishEvent } = await import("../publisher");

    await publishEvent(EVENT_NAMES.NOTIFICATION_DISPATCH_REQUESTED, {
      notificationId: "notification-1",
      userId: "user-1",
    });

    expect(mocks.send).toHaveBeenCalledWith({
      name: EVENT_NAMES.NOTIFICATION_DISPATCH_REQUESTED,
      data: {
        notificationId: "notification-1",
        userId: "user-1",
      },
    });
  });

  it("rejects when Inngest publish fails", async () => {
    mocks.send.mockRejectedValueOnce(new Error("Inngest unavailable"));

    const { EVENT_NAMES } = await import("../names");
    const { publishEvent } = await import("../publisher");

    await expect(
      publishEvent(EVENT_NAMES.NOTIFICATION_DISPATCH_REQUESTED, {
        notificationId: "notification-1",
        userId: "user-1",
      })
    ).rejects.toThrow("Inngest unavailable");
  });

  it("dispatches events locally when Inngest is not configured", async () => {
    mocks.env.INNGEST_EVENT_KEY = undefined;
    vi.doMock("../subscribers", () => ({
      handleDocumentExpiryReminderCreated: vi.fn(),
      handleDocumentVerificationRequested: vi.fn(),
      handleEmailSendRequested: vi.fn(),
      handleNotificationDispatchRequested: mocks.dispatchNotification,
      handleVerificationApproved: vi.fn(),
      handleVerificationRejected: vi.fn(),
    }));

    const { EVENT_NAMES } = await import("../names");
    const { publishEvent } = await import("../publisher");

    await publishEvent(EVENT_NAMES.NOTIFICATION_DISPATCH_REQUESTED, {
      notificationId: "notification-1",
      userId: "user-1",
    });

    expect(mocks.send).not.toHaveBeenCalled();
    expect(mocks.dispatchNotification).toHaveBeenCalledWith({
      notificationId: "notification-1",
      userId: "user-1",
    });
  });
});
