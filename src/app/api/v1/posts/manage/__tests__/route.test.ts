import { describe, expect, it, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  requireAuth: vi.fn(),
  enforceApiRateLimit: vi.fn(),
  getPosts: vi.fn(),
  createPost: vi.fn(),
  getActorDisplayName: vi.fn(),
  logActivity: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  requireAuth: mocks.requireAuth,
}));

vi.mock("@/lib/rate-limit", () => ({
  API_RATE_LIMIT_CATEGORY: {
    NOTIFICATION_READ: "NOTIFICATION_READ",
    FILE_UPLOAD: "FILE_UPLOAD",
    FILE_DOWNLOAD: "FILE_DOWNLOAD",
  },
  enforceApiRateLimit: mocks.enforceApiRateLimit,
}));

vi.mock("@/modules/post/server", () => ({
  getPosts: mocks.getPosts,
  createPost: mocks.createPost,
}));

vi.mock("@/modules/security/server", () => ({
  logActivity: mocks.logActivity,
  SECURITY_EVENT_TYPE: {
    POST_PUBLISHED: "POST_PUBLISHED",
    POST_DRAFT_SAVED: "POST_DRAFT_SAVED",
    POST_ARCHIVED: "POST_ARCHIVED",
    POST_DELETED: "POST_DELETED",
  },
  SECURITY_LOG_STATUS: {
    SUCCESS: "SUCCESS",
  },
}));

vi.mock("@/modules/employee/server", () => ({
  getActorDisplayName: mocks.getActorDisplayName,
}));

import { GET, POST } from "../route";

const session = { userId: "admin-1", role: "ADMIN" };

describe("rate limiting on /api/v1/posts/manage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAuth.mockResolvedValue(session);
    mocks.enforceApiRateLimit.mockResolvedValue(null);
    mocks.getPosts.mockResolvedValue({ data: [], meta: { page: 1, pageSize: 10, total: 0 } });
    mocks.createPost.mockResolvedValue({
      id: "post-1",
      title: "Pengumuman",
      visibilityType: "PUBLIC",
      status: "DRAFT",
    });
    mocks.getActorDisplayName.mockResolvedValue("Admin SiCantik");
    mocks.logActivity.mockResolvedValue(undefined);
  });

  it("applies the NOTIFICATION_READ limit to the manage list before reading posts", async () => {
    const request = new Request("http://localhost/api/v1/posts/manage?page=1");

    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(mocks.requireAuth).toHaveBeenCalledWith("STAFF");
    expect(mocks.enforceApiRateLimit).toHaveBeenCalledWith(request, "NOTIFICATION_READ", {
      actorId: "admin-1",
      actorRole: "ADMIN",
    });
    expect(mocks.getPosts).toHaveBeenCalled();
    expect(body).toEqual(
      expect.objectContaining({
        ok: true,
        data: [],
      }),
    );
  });

  it("applies the FILE_UPLOAD limit to post creation before touching the service layer", async () => {
    const request = new Request("http://localhost/api/v1/posts/manage", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: "Pengumuman", content: "Isi pengumuman", targets: {} }),
    });

    const response = await POST(request);

    expect(response.status).toBe(201);
    expect(mocks.enforceApiRateLimit).toHaveBeenCalledWith(request, "FILE_UPLOAD", {
      actorId: "admin-1",
      actorRole: "ADMIN",
    });
    expect(mocks.createPost).toHaveBeenCalledWith(expect.objectContaining({ authorId: "admin-1" }));
  });

  it("returns 429 and skips the create call once the upload limit is exceeded", async () => {
    mocks.enforceApiRateLimit.mockResolvedValue(
      new Response(JSON.stringify({ ok: false, error: { code: "RATE_LIMITED" } }), { status: 429 }),
    );

    const request = new Request("http://localhost/api/v1/posts/manage", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: "Pengumuman", content: "Isi pengumuman" }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(429);
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe("RATE_LIMITED");
    expect(mocks.createPost).not.toHaveBeenCalled();
    expect(mocks.logActivity).not.toHaveBeenCalled();
  });

  it("still enforces auth before the rate limit", async () => {
    const { AppError } = await import("@/lib/errors");
    mocks.requireAuth.mockRejectedValue(new AppError("UNAUTHENTICATED", "Unauthenticated", 401));

    const response = await GET(new Request("http://localhost/api/v1/posts/manage"));

    expect(response.status).toBe(401);
    expect(mocks.enforceApiRateLimit).not.toHaveBeenCalled();
  });
});
