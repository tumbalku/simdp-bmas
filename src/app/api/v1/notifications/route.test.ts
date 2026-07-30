import { describe, expect, it, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  requireAuth: vi.fn(),
  enforceApiRateLimit: vi.fn(),
  getNotifications: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  requireAuth: mocks.requireAuth,
}));

vi.mock("@/lib/rate-limit", () => ({
  API_RATE_LIMIT_CATEGORY: {
    NOTIFICATION_READ: "NOTIFICATION_READ",
  },
  enforceApiRateLimit: mocks.enforceApiRateLimit,
}));

vi.mock("@/modules/notification/server", () => ({
  getNotifications: mocks.getNotifications,
}));

import { GET } from "./route";

describe("GET /api/v1/notifications", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAuth.mockResolvedValue({ userId: "user-1", role: "ADMIN" });
    mocks.enforceApiRateLimit.mockResolvedValue(null);
    mocks.getNotifications.mockResolvedValue({
      data: [
        {
          id: "notification-1",
          type: "VERIFICATION_REQUIRED",
          title: "Dokumen perlu diverifikasi",
          message: "Ada dokumen baru.",
          isRead: false,
          relatedEntityType: "DocumentRecord",
          relatedEntityId: "document-1",
          createdAt: "2026-07-30T00:00:00.000Z",
        },
      ],
      meta: { unreadCount: 1 },
    });
  });

  it("returns notifications through a GET route with rate limiting", async () => {
    const request = new Request("http://localhost/api/v1/notifications?page=1&pageSize=10&isRead=false");

    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(mocks.requireAuth).toHaveBeenCalled();
    expect(mocks.enforceApiRateLimit).toHaveBeenCalledWith(request, "NOTIFICATION_READ", {
      actorId: "user-1",
      actorRole: "ADMIN",
    });
    expect(mocks.getNotifications).toHaveBeenCalledWith("user-1", {
      page: 1,
      pageSize: 10,
      isRead: false,
    });
    expect(body).toEqual(
      expect.objectContaining({
        ok: true,
        data: [
          expect.objectContaining({
            id: "notification-1",
            isRead: false,
          }),
        ],
        meta: expect.objectContaining({ unreadCount: 1 }),
      }),
    );
  });

  it("rejects invalid notification query values", async () => {
    const response = await GET(new Request("http://localhost/api/v1/notifications?page=0&pageSize=999"));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toEqual(
      expect.objectContaining({
        code: "VALIDATION_ERROR",
        message: "Query notifikasi tidak valid.",
      }),
    );
    expect(mocks.getNotifications).not.toHaveBeenCalled();
  });
});
