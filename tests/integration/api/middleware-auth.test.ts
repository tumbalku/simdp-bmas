import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { signAccessToken } from "@/lib/auth";
import { middleware } from "@/middleware";

function createRequest(path: string, accessToken?: string) {
  return new NextRequest(`http://localhost${path}`, {
    headers: accessToken ? { Cookie: `access_token=${accessToken}` } : undefined,
  });
}

describe("middleware auth coverage", () => {
  it.each([
    "/dashboard",
    "/documents",
    "/documents/doc-1",
    "/master-data/employees",
    "/profile",
    "/settings",
    "/system-settings",
    "/verification/doc-1",
    "/notifications",
    "/security-log",
    "/statistics",
  ])("redirects unauthenticated dashboard route %s to login with next target", async (path) => {
    const response = await middleware(createRequest(`${path}?tab=active`));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      `http://localhost/login?next=${encodeURIComponent(`${path}?tab=active`)}`
    );
  });

  it.each(["/", "/login", "/forgot-password", "/reset-password?token=abc", "/verify-document?code=SIMDP-ABC"])(
    "allows public route %s without auth",
    async (path) => {
      const response = await middleware(createRequest(path));

      expect(response.status).toBe(200);
      expect(response.headers.get("location")).toBeNull();
    }
  );

  it.each([
    "/api/v1/auth/login",
    "/api/v1/auth/forgot-password",
    "/api/v1/auth/reset-password",
    "/api/v1/auth/refresh",
    "/api/v1/auth/logout",
    "/api/v1/auth/google/start",
    "/api/v1/auth/google/callback",
  ])("allows public auth API route %s without auth", async (path) => {
    const response = await middleware(createRequest(path));

    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
  });

  it.each(["/login", "/forgot-password", "/reset-password?token=abc"])(
    "redirects authenticated auth page %s to dashboard",
    async (path) => {
      const token = await signAccessToken({ userId: "user-1", role: "EMPLOYEE", employeeId: "emp-1" });
      const response = await middleware(createRequest(path, token));

      expect(response.status).toBe(307);
      expect(response.headers.get("location")).toBe("http://localhost/dashboard");
    }
  );

  it("does not redirect authenticated users away from public document verification", async () => {
    const token = await signAccessToken({ userId: "user-1", role: "EMPLOYEE", employeeId: "emp-1" });
    const response = await middleware(createRequest("/verify-document?code=SIMDP-ABC", token));

    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
  });
});
