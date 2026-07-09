import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST as loginPost } from "@/app/api/v1/auth/login/route";
import { POST as refreshPost } from "@/app/api/v1/auth/refresh/route";
import { NextRequest } from "next/server";
import { mockPrisma, mockCookieStore } from "../../../tests/setup";
import bcryptjs from "bcryptjs";

describe("Auth Integration API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("POST /api/v1/auth/login", () => {
    it("should return validation error for missing body fields", async () => {
      const req = new NextRequest("http://localhost/api/v1/auth/login", {
        method: "POST",
        body: JSON.stringify({ identifier: "" }),
      });
      const res = await loginPost(req);

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.ok).toBe(false);
      expect(body.error.code).toBe("VALIDATION_ERROR");
    });

    it("should return 401 if loginUser returns null", async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);

      const req = new NextRequest("http://localhost/api/v1/auth/login", {
        method: "POST",
        body: JSON.stringify({ identifier: "wrong@example.com", password: "password" }),
      });
      const res = await loginPost(req);

      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.error.code).toBe("UNAUTHENTICATED");
    });

    it("should return 200 and set cookies for successful login", async () => {
      const passwordHash = await bcryptjs.hash("correct-password", 10);
      const user = {
        id: "user-1",
        email: "test@example.com",
        passwordHash,
        role: "EMPLOYEE",
        isActive: true,
        employee: { id: "emp-1", name: "Test Employee" },
      };

      mockPrisma.user.findFirst.mockResolvedValueOnce({ id: "user-1" });
      mockPrisma.user.findFirst.mockResolvedValueOnce(user);
      mockPrisma.refreshToken.findMany.mockResolvedValue([]);

      const req = new NextRequest("http://localhost/api/v1/auth/login", {
        method: "POST",
        body: JSON.stringify({ identifier: "test@example.com", password: "correct-password" }),
      });
      const res = await loginPost(req);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.ok).toBe(true);
      expect(body.data.user.email).toBe("test@example.com");
      expect(mockCookieStore.set).toHaveBeenCalledTimes(2);
    });
  });

  describe("POST /api/v1/auth/refresh", () => {
    it("should return 401 when refresh cookie is missing", async () => {
      const req = new NextRequest("http://localhost/api/v1/auth/refresh", {
        method: "POST",
      });
      // next/server NextRequest cookies are read using req.cookies.get
      // Let's verify how cookies are read in the route handler:
      // const refreshToken = request.cookies.get("refresh_token")?.value;
      // In NextRequest, req.cookies is a RequestCookies helper.
      // We can mock request.cookies.get or pass it in request options.
      // In NextRequest constructor, we can set headers Cookie: refresh_token=abc, and next/server parses it automatically!
      const res = await refreshPost(req);

      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.error.code).toBe("UNAUTHENTICATED");
    });

    it("should rotate session when cookie is present", async () => {
      const record = {
        id: "token-record-1",
        userId: "user-1",
        expiresAt: new Date(Date.now() + 100000),
        user: {
          id: "user-1",
          email: "test@example.com",
          role: "EMPLOYEE",
          employee: { id: "emp-1", name: "Test Employee" },
        },
      };
      mockPrisma.refreshToken.findFirst.mockResolvedValue(record);

      const req = new NextRequest("http://localhost/api/v1/auth/refresh", {
        method: "POST",
        headers: {
          Cookie: "refresh_token=valid-plain-token",
        },
      });

      const res = await refreshPost(req);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.ok).toBe(true);
      expect(mockCookieStore.set).toHaveBeenCalledTimes(2);
    });
  });
});
