import { describe, expect, it, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  requireAuth: vi.fn(),
  enforceApiRateLimit: vi.fn(),
  getPostById: vi.fn(),
  updatePost: vi.fn(),
  archivePost: vi.fn(),
  deletePost: vi.fn(),
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
  getPostById: mocks.getPostById,
  updatePost: mocks.updatePost,
  archivePost: mocks.archivePost,
  deletePost: mocks.deletePost,
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

import { GET, PATCH, DELETE } from "../route";

const session = { userId: "admin-1", role: "ADMIN" };

function rateLimitedResponse() {
  return new Response(JSON.stringify({ ok: false, error: { code: "RATE_LIMITED" } }), { status: 429 });
}

describe("rate limiting on /api/v1/posts/manage/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAuth.mockResolvedValue(session);
    mocks.enforceApiRateLimit.mockResolvedValue(null);
    mocks.getPostById.mockResolvedValue({
      id: "post-1",
      title: "Pengumuman",
      authorId: "admin-1",
      status: "DRAFT",
      visibilityType: "PUBLIC",
    });
    mocks.updatePost.mockResolvedValue({
      id: "post-1",
      title: "Pengumuman diperbarui",
      status: "PUBLISHED",
      visibilityType: "PUBLIC",
    });
    mocks.archivePost.mockResolvedValue({ id: "post-1", title: "Pengumuman" });
    mocks.deletePost.mockResolvedValue(undefined);
    mocks.getActorDisplayName.mockResolvedValue("Admin SiCantik");
    mocks.logActivity.mockResolvedValue(undefined);
  });

  it("applies the NOTIFICATION_READ limit to the single-post read", async () => {
    const request = new Request("http://localhost/api/v1/posts/manage/post-1");

    const response = await GET(request, { params: Promise.resolve({ id: "post-1" }) });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(mocks.requireAuth).toHaveBeenCalledWith("STAFF");
    expect(mocks.enforceApiRateLimit).toHaveBeenCalledWith(request, "NOTIFICATION_READ", {
      actorId: "admin-1",
      actorRole: "ADMIN",
    });
    expect(mocks.getPostById).toHaveBeenCalledWith("post-1");
    expect(body.ok).toBe(true);
  });

  it("applies the FILE_UPLOAD limit to updates before loading the post", async () => {
    const request = new Request("http://localhost/api/v1/posts/manage/post-1", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: "Pengumuman diperbarui", content: "Isi pengumuman", status: "PUBLISHED" }),
    });

    const response = await PATCH(request, { params: Promise.resolve({ id: "post-1" }) });

    expect(response.status).toBe(200);
    expect(mocks.enforceApiRateLimit).toHaveBeenCalledWith(request, "FILE_UPLOAD", {
      actorId: "admin-1",
      actorRole: "ADMIN",
    });
    expect(mocks.updatePost).toHaveBeenCalled();
  });

  it("applies the FILE_UPLOAD limit to deletion before loading the post", async () => {
    const request = new Request("http://localhost/api/v1/posts/manage/post-1", { method: "DELETE" });

    const response = await DELETE(request, { params: Promise.resolve({ id: "post-1" }) });

    expect(response.status).toBe(200);
    expect(mocks.enforceApiRateLimit).toHaveBeenCalledWith(request, "FILE_UPLOAD", {
      actorId: "admin-1",
      actorRole: "ADMIN",
    });
    expect(mocks.deletePost).toHaveBeenCalledWith("post-1");
  });

  it("returns 429 from PATCH without touching the post service", async () => {
    mocks.enforceApiRateLimit.mockResolvedValue(rateLimitedResponse());

    const request = new Request("http://localhost/api/v1/posts/manage/post-1", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: "Pengumuman diperbarui", content: "Isi pengumuman" }),
    });

    const response = await PATCH(request, { params: Promise.resolve({ id: "post-1" }) });
    const body = await response.json();

    expect(response.status).toBe(429);
    expect(body.error.code).toBe("RATE_LIMITED");
    expect(mocks.getPostById).not.toHaveBeenCalled();
    expect(mocks.updatePost).not.toHaveBeenCalled();
    expect(mocks.logActivity).not.toHaveBeenCalled();
  });

  it("returns 429 from DELETE without touching the post service", async () => {
    mocks.enforceApiRateLimit.mockResolvedValue(rateLimitedResponse());

    const request = new Request("http://localhost/api/v1/posts/manage/post-1", { method: "DELETE" });

    const response = await DELETE(request, { params: Promise.resolve({ id: "post-1" }) });
    const body = await response.json();

    expect(response.status).toBe(429);
    expect(body.error.code).toBe("RATE_LIMITED");
    expect(mocks.deletePost).not.toHaveBeenCalled();
    expect(mocks.logActivity).not.toHaveBeenCalled();
  });

  it("returns 429 from GET without loading the post", async () => {
    mocks.enforceApiRateLimit.mockResolvedValue(rateLimitedResponse());

    const response = await GET(new Request("http://localhost/api/v1/posts/manage/post-1"), {
      params: Promise.resolve({ id: "post-1" }),
    });

    expect(response.status).toBe(429);
    expect(mocks.getPostById).not.toHaveBeenCalled();
  });
});
