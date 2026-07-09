import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "@/app/api/v1/cron/check-expiry/route";
import { NextRequest } from "next/server";
import { env } from "@/lib/env";
import { mockPrisma } from "../../../tests/setup";

describe("Cron Expiry Integration API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should reject request when authorization header is missing", async () => {
    const req = new NextRequest("http://localhost/api/v1/cron/check-expiry");
    const res = await GET(req);

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe("UNAUTHENTICATED");
  });

  it("should reject request when authorization header is invalid", async () => {
    const req = new NextRequest("http://localhost/api/v1/cron/check-expiry", {
      headers: {
        authorization: "Bearer wrong-secret",
      },
    });
    const res = await GET(req);

    expect(res.status).toBe(401);
  });

  it("should reject request when secret is passed in query string instead of headers", async () => {
    const req = new NextRequest(
      `http://localhost/api/v1/cron/check-expiry?secret=${env.CRON_SECRET}`
    );
    const res = await GET(req);

    expect(res.status).toBe(401);
  });

  it("should run cron successfully and return 200 with stats when Bearer token is correct", async () => {
    mockPrisma.documentRecord.findMany.mockResolvedValue([]);
    mockPrisma.systemSetting.findMany.mockResolvedValue([]);

    const req = new NextRequest("http://localhost/api/v1/cron/check-expiry", {
      headers: {
        authorization: `Bearer ${env.CRON_SECRET}`,
      },
    });
    const res = await GET(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.data.expiredCount).toBeDefined();
    expect(body.data.remindersSent).toBeDefined();
  });
});
