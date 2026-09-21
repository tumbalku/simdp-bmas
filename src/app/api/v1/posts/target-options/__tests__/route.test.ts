import { describe, expect, it, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  requireAuth: vi.fn(),
  enforceApiRateLimit: vi.fn(),
  getPostTargetOptions: vi.fn(),
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

vi.mock("@/modules/post/server", () => ({
  getPostTargetOptions: mocks.getPostTargetOptions,
}));

import { GET } from "../route";

describe("rate limiting on /api/v1/posts/target-options", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAuth.mockResolvedValue({ userId: "admin-1", role: "ADMIN" });
    mocks.enforceApiRateLimit.mockResolvedValue(null);
    mocks.getPostTargetOptions.mockResolvedValue({ roles: ["ADMIN"] });
  });

  it("applies the NOTIFICATION_READ limit before the aggregate query", async () => {
    const request = new Request("http://localhost/api/v1/posts/target-options");

    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(mocks.requireAuth).toHaveBeenCalledWith("STAFF");
    expect(mocks.enforceApiRateLimit).toHaveBeenCalledWith(request, "NOTIFICATION_READ", {
      actorId: "admin-1",
      actorRole: "ADMIN",
    });
    expect(mocks.getPostTargetOptions).toHaveBeenCalled();
    expect(body).toEqual(
      expect.objectContaining({
        ok: true,
        data: { roles: ["ADMIN"] },
      }),
    );
  });

  it("returns 429 without running the aggregate query", async () => {
    mocks.enforceApiRateLimit.mockResolvedValue(
      new Response(JSON.stringify({ ok: false, error: { code: "RATE_LIMITED" } }), { status: 429 }),
    );

    const response = await GET(new Request("http://localhost/api/v1/posts/target-options"));
    const body = await response.json();

    expect(response.status).toBe(429);
    expect(body.error.code).toBe("RATE_LIMITED");
    expect(mocks.getPostTargetOptions).not.toHaveBeenCalled();
  });
});
