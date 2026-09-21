import { describe, expect, it, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  requireAuth: vi.fn(),
  enforceApiRateLimit: vi.fn(),
  getPostAttachmentForUser: vi.fn(),
  readFile: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  requireAuth: mocks.requireAuth,
}));

vi.mock("@/lib/rate-limit", () => ({
  API_RATE_LIMIT_CATEGORY: {
    FILE_DOWNLOAD: "FILE_DOWNLOAD",
  },
  enforceApiRateLimit: mocks.enforceApiRateLimit,
}));

vi.mock("@/modules/post/server", () => ({
  getPostAttachmentForUser: mocks.getPostAttachmentForUser,
}));

vi.mock("fs/promises", () => ({
  default: { readFile: mocks.readFile },
}));

import { GET } from "../route";

const session = { userId: "user-1", role: "STAFF", employeeId: "employee-1" };

const attachment = {
  id: "attachment-1",
  filePath: "posts/attachment-1.pdf",
  fileName: "lampiran.pdf",
  mimeType: "application/pdf",
};

function rateLimitedResponse() {
  return new Response(JSON.stringify({ ok: false, error: { code: "RATE_LIMITED" } }), { status: 429 });
}

describe("rate limiting on /api/v1/posts/attachments/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAuth.mockResolvedValue(session);
    mocks.enforceApiRateLimit.mockResolvedValue(null);
    mocks.getPostAttachmentForUser.mockResolvedValue(attachment);
    mocks.readFile.mockResolvedValue(Buffer.from("pdf body"));
  });

  it("applies the FILE_DOWNLOAD limit before resolving the attachment", async () => {
    const request = new Request("http://localhost/api/v1/posts/attachments/attachment-1");

    const response = await GET(request, { params: Promise.resolve({ id: "attachment-1" }) });

    expect(mocks.requireAuth).toHaveBeenCalled();
    expect(mocks.enforceApiRateLimit).toHaveBeenCalledWith(request, "FILE_DOWNLOAD", {
      actorId: "user-1",
      actorRole: "STAFF",
    });
    expect(mocks.getPostAttachmentForUser).toHaveBeenCalledWith({
      attachmentId: "attachment-1",
      context: {
        userId: "user-1",
        role: "STAFF",
        employeeId: "employee-1",
        workplaceId: null,
        employeeGroupId: null,
      },
    });
    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("application/pdf");
    expect(response.headers.get("Content-Disposition")).toBe('inline; filename="lampiran.pdf"');
  });

  it("returns 429 without streaming the attachment", async () => {
    mocks.enforceApiRateLimit.mockResolvedValue(rateLimitedResponse());

    const request = new Request("http://localhost/api/v1/posts/attachments/attachment-1");

    const response = await GET(request, { params: Promise.resolve({ id: "attachment-1" }) });
    const body = await response.json();

    expect(response.status).toBe(429);
    expect(body.error.code).toBe("RATE_LIMITED");
    expect(mocks.getPostAttachmentForUser).not.toHaveBeenCalled();
  });
});
