import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST as loginPost } from "@/app/api/v1/auth/login/route";
import { POST as refreshPost } from "@/app/api/v1/auth/refresh/route";
import { POST as logoutPost } from "@/app/api/v1/auth/logout/route";
import { POST as forgotPost } from "@/app/api/v1/auth/forgot-password/route";
import { POST as resetPost } from "@/app/api/v1/auth/reset-password/route";
import { NextRequest } from "next/server";
import { mockPrisma, mockCookieStore } from "../../../tests/setup";
import { signAccessToken } from "@/lib/auth";
import * as argon2 from "argon2";

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
      const passwordHash = await argon2.hash("correct-password");
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

  describe("POST /api/v1/auth/logout", () => {
    it("should return 401 if unauthenticated", async () => {
      mockCookieStore.get.mockReturnValue(undefined);

      const req = new NextRequest("http://localhost/api/v1/auth/logout", {
        method: "POST",
      });
      const res = await logoutPost(req);

      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.error.code).toBe("UNAUTHENTICATED");
    });

    it("should succeed and clear cookies and call logoutUser if authenticated with refresh cookie", async () => {
      const accessToken = await signAccessToken({ userId: "user-1", role: "EMPLOYEE", employeeId: "emp-1" });
      mockCookieStore.get.mockImplementation((name) => {
        if (name === "access_token") return { value: accessToken };
        if (name === "refresh_token") return { value: "valid-refresh-token" };
        return undefined;
      });

      mockPrisma.user.findFirst.mockResolvedValue({
        id: "user-1",
        email: "test@example.com",
        employee: { name: "Test" },
      });
      mockPrisma.refreshToken.findFirst.mockResolvedValue({
        id: "token-record-1",
        userId: "user-1",
      });

      const req = new NextRequest("http://localhost/api/v1/auth/logout", {
        method: "POST",
        headers: {
          Cookie: "refresh_token=valid-refresh-token",
        },
      });
      const res = await logoutPost(req);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.ok).toBe(true);
      expect(mockCookieStore.set).toHaveBeenCalled();
      expect(mockPrisma.refreshToken.update).toHaveBeenCalled();
    });

    it("should still succeed and clear cookies if authenticated without refresh cookie", async () => {
      const accessToken = await signAccessToken({ userId: "user-1", role: "EMPLOYEE", employeeId: "emp-1" });
      mockCookieStore.get.mockImplementation((name) => {
        if (name === "access_token") return { value: accessToken };
        return undefined;
      });

      const req = new NextRequest("http://localhost/api/v1/auth/logout", {
        method: "POST",
      });
      const res = await logoutPost(req);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.ok).toBe(true);
      expect(mockCookieStore.set).toHaveBeenCalled();
      expect(mockPrisma.refreshToken.update).not.toHaveBeenCalled();
    });
  });

  describe("POST /api/v1/auth/forgot-password", () => {
    it("should return validation error for invalid email format", async () => {
      const req = new NextRequest("http://localhost/api/v1/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email: "not-an-email" }),
      });
      const res = await forgotPost(req);

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error.code).toBe("VALIDATION_ERROR");
      expect(body.error.details?.[0].message).toBe("Format email tidak valid");
    });

    it("should return 200 generic message without leaking account existence", async () => {
      // Mock user not found
      mockPrisma.user.findFirst.mockResolvedValue(null);

      const req = new NextRequest("http://localhost/api/v1/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email: "doesnotexist@example.com" }),
      });
      const res = await forgotPost(req);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.ok).toBe(true);
      expect(body.data.message).toContain("Instruksi reset password telah dikirim");

      // Mock user found
      mockPrisma.user.findFirst.mockResolvedValue({
        id: "user-1",
        email: "exists@example.com",
        role: "EMPLOYEE",
      });
      mockPrisma.passwordResetToken.create.mockResolvedValue({ id: "token-1" });

      const req2 = new NextRequest("http://localhost/api/v1/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email: "exists@example.com" }),
      });
      const res2 = await forgotPost(req2);

      expect(res2.status).toBe(200);
      const body2 = await res2.json();
      expect(body2.ok).toBe(true);
      expect(body2.data.message).toContain("Instruksi reset password telah dikirim");
    });
  });

  describe("POST /api/v1/auth/reset-password", () => {
    it("should return validation error for mismatched confirmation", async () => {
      const req = new NextRequest("http://localhost/api/v1/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({
          token: "some-token",
          password: "password123",
          confirmPassword: "password124",
        }),
      });
      const res = await resetPost(req);

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error.code).toBe("VALIDATION_ERROR");
      expect(body.error.details?.[0].path).toBe("confirmPassword");
      expect(body.error.details?.[0].message).toBe("Konfirmasi password tidak cocok");
    });

    it("should return 400 BAD_REQUEST for invalid/expired token", async () => {
      // Mock findFirst to return null (token not found/used)
      mockPrisma.passwordResetToken.findFirst.mockResolvedValue(null);

      const req = new NextRequest("http://localhost/api/v1/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({
          token: "invalid-token",
          password: "password123",
          confirmPassword: "password123",
        }),
      });
      const res = await resetPost(req);

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error.code).toBe("BAD_REQUEST");
      expect(body.error.message).toContain("Token reset tidak valid");
    });

    it("should return 200 for valid token reset", async () => {
      const resetTokenRecord = {
        id: "reset-record-1",
        userId: "user-1",
        expiresAt: new Date(Date.now() + 100000),
        user: {
          id: "user-1",
          email: "test@example.com",
          role: "EMPLOYEE",
          employee: { name: "Test" },
        },
      };
      mockPrisma.passwordResetToken.findFirst.mockResolvedValue(resetTokenRecord);
      mockPrisma.passwordResetToken.update.mockResolvedValue({});
      mockPrisma.user.update.mockResolvedValue({});
      mockPrisma.refreshToken.updateMany.mockResolvedValue({});

      const req = new NextRequest("http://localhost/api/v1/auth/reset-password", {
        method: "POST",
        headers: { "x-forwarded-for": "203.0.113.99" },
        body: JSON.stringify({
          token: "valid-token",
          password: "password123",
          confirmPassword: "password123",
        }),
      });
      const res = await resetPost(req);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.ok).toBe(true);
    });
  });
});
