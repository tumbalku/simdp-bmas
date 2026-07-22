import { describe, expect, it } from "vitest";

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

function createRequest(headers?: HeadersInit) {
  return new Request("https://simdp.test/api/v1/documents/upload", {
    headers,
  });
}

describe("rate-limit helper", () => {
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
          }),
        }),
      })
    );

    const body = await response!.json();
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe("RATE_LIMITED");
    expect(body.meta.retryAfterSeconds).toBe(900);
  });
});
