import { describe, it, expect } from "vitest";
import { SignJWT } from "jose";
import {
  signAccessToken,
  verifyAccessToken,
  generateRefreshToken,
  hashRefreshToken,
  setAuthCookies,
  clearAuthCookies,
  hasRolePermission,
  getSession,
  requireAuth,
  ACCESS_TOKEN_TTL_SECONDS,
} from "@/lib/auth";
import { mockCookieStore } from "../../../tests/setup";

describe("auth library helpers", () => {
  describe("token signing and verification", () => {
    it("should sign and successfully verify a JWT token", async () => {
      const payload = { userId: "user-1", role: "EMPLOYEE", employeeId: "emp-1" };
      const token = await signAccessToken(payload);
      expect(token).toBeTypeOf("string");

      const verified = await verifyAccessToken(token);
      expect(verified).toBeDefined();
      expect(verified?.userId).toBe(payload.userId);
      expect(verified?.role).toBe(payload.role);
      expect(verified?.employeeId).toBe(payload.employeeId);
    });

    it("should use a 30-minute access token lifetime", async () => {
      const token = await signAccessToken({ userId: "user-1", role: "EMPLOYEE" });
      const [, payload] = token.split(".");
      const decoded = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { iat: number; exp: number };

      expect(decoded.exp - decoded.iat).toBe(ACCESS_TOKEN_TTL_SECONDS);
    });

    it("should return null for invalid tokens", async () => {
      const verified = await verifyAccessToken("invalid-token-string");
      expect(verified).toBeNull();
    });

    it("should return null for expired token", async () => {
      const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);
      const token = await new SignJWT({ userId: "user-1", role: "EMPLOYEE", employeeId: "emp-1" })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("-1s") // expired
        .sign(JWT_SECRET);

      const verified = await verifyAccessToken(token);
      expect(verified).toBeNull();
    });
  });

  describe("refreshToken helpers", () => {
    it("should generate a random refresh token", () => {
      const token = generateRefreshToken();
      expect(token).toHaveLength(64); // 32 bytes hex
    });

    it("should hash refresh token consistently", () => {
      const token = "my-secret-refresh-token";
      const hash1 = hashRefreshToken(token);
      const hash2 = hashRefreshToken(token);
      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64); // sha256 hex
    });
  });

  describe("hasRolePermission", () => {
    it("should correctly validate role hierarchy", () => {
      expect(hasRolePermission("ADMIN", "STAFF")).toBe(true);
      expect(hasRolePermission("ADMIN", "EMPLOYEE")).toBe(true);
      expect(hasRolePermission("ADMIN", "ADMIN")).toBe(true);

      expect(hasRolePermission("STAFF", "ADMIN")).toBe(false);
      expect(hasRolePermission("STAFF", "STAFF")).toBe(true);
      expect(hasRolePermission("STAFF", "EMPLOYEE")).toBe(true);

      expect(hasRolePermission("EMPLOYEE", "STAFF")).toBe(false);
      expect(hasRolePermission("EMPLOYEE", "ADMIN")).toBe(false);
      expect(hasRolePermission("EMPLOYEE", "EMPLOYEE")).toBe(true);
    });
  });

  describe("cookie manipulation", () => {
    it("should set access and refresh tokens in cookies", async () => {
      await setAuthCookies("user-1", "STAFF", "emp-1", "plain-refresh-token");

      expect(mockCookieStore.set).toHaveBeenCalledTimes(2);
      expect(mockCookieStore.set).toHaveBeenNthCalledWith(
        1,
        "access_token",
        expect.any(String),
        expect.objectContaining({ httpOnly: true, path: "/", maxAge: ACCESS_TOKEN_TTL_SECONDS })
      );
      expect(mockCookieStore.set).toHaveBeenNthCalledWith(
        2,
        "refresh_token",
        "plain-refresh-token",
        expect.objectContaining({ httpOnly: true, path: "/api/v1/auth" })
      );
    });

    it("should clear auth cookies", async () => {
      await clearAuthCookies();
      expect(mockCookieStore.set).toHaveBeenCalledTimes(2);
      expect(mockCookieStore.set).toHaveBeenNthCalledWith(
        1,
        "access_token",
        "",
        expect.objectContaining({ maxAge: 0, path: "/" })
      );
      expect(mockCookieStore.set).toHaveBeenNthCalledWith(
        2,
        "refresh_token",
        "",
        expect.objectContaining({ maxAge: 0, path: "/api/v1/auth" })
      );
    });
  });

  describe("session helpers", () => {
    it("should return null getSession when no access token cookie exists", async () => {
      mockCookieStore.get.mockReturnValueOnce(undefined);
      const session = await getSession();
      expect(session).toBeNull();
    });

    it("should return payload when valid token cookie is present", async () => {
      const payload = { userId: "user-1", role: "EMPLOYEE", employeeId: null };
      const token = await signAccessToken(payload);
      mockCookieStore.get.mockReturnValueOnce({ value: token });

      const session = await getSession();
      expect(session).toEqual(expect.objectContaining({ userId: "user-1", role: "EMPLOYEE" }));
    });

    it("should throw UNAUTHENTICATED in requireAuth when no session", async () => {
      mockCookieStore.get.mockReturnValueOnce(undefined);
      await expect(requireAuth()).rejects.toThrow("UNAUTHENTICATED");
    });

    it("should throw FORBIDDEN in requireAuth when role insufficient", async () => {
      const payload = { userId: "user-1", role: "EMPLOYEE", employeeId: null };
      const token = await signAccessToken(payload);
      mockCookieStore.get.mockReturnValue({ value: token });

      await expect(requireAuth("ADMIN")).rejects.toThrow("FORBIDDEN");
    });

    it("should succeed in requireAuth when role is sufficient", async () => {
      const payload = { userId: "user-1", role: "ADMIN", employeeId: null };
      const token = await signAccessToken(payload);
      mockCookieStore.get.mockReturnValue({ value: token });

      const session = await requireAuth("STAFF");
      expect(session.userId).toBe("user-1");
    });

    it("should throw UNAUTHENTICATED in requireAuth when token is expired", async () => {
      const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);
      const token = await new SignJWT({ userId: "user-1", role: "EMPLOYEE", employeeId: "emp-1" })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("-1s") // expired
        .sign(JWT_SECRET);
      mockCookieStore.get.mockReturnValue({ value: token });

      await expect(requireAuth()).rejects.toThrow("UNAUTHENTICATED");
    });
  });
});
