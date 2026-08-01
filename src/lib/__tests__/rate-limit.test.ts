import { describe, expect, it, beforeEach, vi } from "vitest";
import crypto from "crypto";

import {
  API_RATE_LIMIT_CATEGORY,
  API_RATE_LIMIT_CONFIG,
  enforceApiRateLimit,
  getClientIp,
} from "@/lib/rate-limit";
import {
  SECURITY_EVENT_TYPE,
  SECURITY_LOG_STATUS,
} from "@/modules/security/server";
import { mockPrisma } from "../../../tests/setup";

let uploadBucketCount = 0;

function createRequest(headers?: HeadersInit) {
  return new Request("https://simdp.test/api/v1/documents/upload", {
    headers,
  });
}

describe("rate-limit helper", () => {
  beforeEach(() => {
    uploadBucketCount = 0;
    vi.mocked(mockPrisma.$queryRaw).mockImplementation(async () => [
      {
        key: "RateLimit:FILE_UPLOAD:test",
        category: "FILE_UPLOAD",
        count: ++uploadBucketCount,
        resetAt: new Date(Date.now() + 15 * 60 * 1000),
        limitedLoggedAt: null,
      },
    ]);
    vi.mocked(mockPrisma.rateLimitBucket.updateMany).mockResolvedValue({ count: 1 });
  });

  it("allows up to 15 public auth requests per 15-minute window", () => {
    expect(API_RATE_LIMIT_CONFIG.AUTH_PUBLIC).toEqual({
      limit: 15,
      windowMs: 15 * 60 * 1000,
    });
  });

  it("uses the first forwarded IP address", () => {
    const request = createRequest({
      "x-forwarded-for": "203.0.113.10, 10.0.0.1",
      "x-real-ip": "198.51.100.20",
    });

    expect(getClientIp(request)).toBe("203.0.113.10");
  });

  it("allows requests below the configured limit without writing audit noise", async () => {
    mockPrisma.securityLog.create.mockResolvedValue({ id: "log-1" });

    const response = await enforceApiRateLimit(
      createRequest({ "x-forwarded-for": "203.0.113.11" }),
      API_RATE_LIMIT_CATEGORY.FILE_UPLOAD,
      { actorId: "user-1", actorRole: "ADMIN" }
    );

    expect(response).toBeNull();
    expect(mockPrisma.securityLog.create).not.toHaveBeenCalled();
  });

  it("uses separate database buckets for different scoped actions", async () => {
    const capturedBuckets: string[] = [];
    vi.mocked(mockPrisma.$queryRaw).mockImplementation(async (...args: unknown[]) => {
      capturedBuckets.push(args[1] as string);
      return [
        {
          key: args[1] as string,
          category: API_RATE_LIMIT_CATEGORY.EXPORT,
          count: 1,
          resetAt: new Date(Date.now() + 15 * 60 * 1000),
          limitedLoggedAt: null,
        },
      ];
    });

    const request = createRequest({ "x-forwarded-for": "203.0.113.13" });

    await enforceApiRateLimit(request, API_RATE_LIMIT_CATEGORY.EXPORT, {
      actorId: "user-1",
      actorRole: "ADMIN",
      scope: "first",
    });
    await enforceApiRateLimit(request, API_RATE_LIMIT_CATEGORY.EXPORT, {
      actorId: "user-1",
      actorRole: "ADMIN",
      scope: "b",
    });

    const firstKey = "EXPORT:scope:first:user:user-1:ip:203.0.113.13";
    const secondKey = "EXPORT:scope:b:user:user-1:ip:203.0.113.13";
    const expectedFirstBucket = `RateLimit:EXPORT:${crypto.createHash("sha256").update(firstKey).digest("hex").slice(0, 24)}`;
    const expectedSecondBucket = `RateLimit:EXPORT:${crypto.createHash("sha256").update(secondKey).digest("hex").slice(0, 24)}`;

    expect(capturedBuckets).toEqual([expectedFirstBucket, expectedSecondBucket]);
    expect(capturedBuckets[0]).not.toBe(capturedBuckets[1]);
  });

  it("returns a 429 response when the configured limit is reached", async () => {
    mockPrisma.securityLog.create.mockResolvedValue({ id: "log-2" });

    const category = API_RATE_LIMIT_CATEGORY.FILE_UPLOAD;
    const request = createRequest({ "x-forwarded-for": "203.0.113.12" });

    for (let i = 0; i < API_RATE_LIMIT_CONFIG.FILE_UPLOAD.limit; i += 1) {
      await enforceApiRateLimit(request, category, {
        actorId: "user-1",
        actorRole: "ADMIN",
      });
    }

    const response = await enforceApiRateLimit(request, category, {
      actorId: "user-1",
      actorRole: "ADMIN",
    });

    expect(response?.status).toBe(429);
    expect(mockPrisma.securityLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          actorId: "user-1",
          actorRole: "ADMIN",
          eventType: SECURITY_EVENT_TYPE.API_RATE_LIMIT_CHECK,
          ipAddress: "203.0.113.12",
          status: SECURITY_LOG_STATUS.FAILED,
          metadata: expect.objectContaining({
            category: API_RATE_LIMIT_CATEGORY.FILE_UPLOAD,
            reason: "RATE_LIMITED",
            scope: "global",
          }),
        }),
      })
    );

    const body = await response!.json();
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe("RATE_LIMITED");
    expect(body.meta.retryAfterSeconds).toBeGreaterThan(0);
  });
});
