import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  loginUser,
  rotateSession,
  logoutUser,
  requestPasswordReset,
  resetPasswordWithToken,
} from "../service";
import { mockPrisma } from "../../../../tests/setup";
import bcryptjs from "bcryptjs";

describe("Auth Module Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("loginUser", () => {
    it("should return null if user is not found by NIK, NIP, or email", async () => {
      mockPrisma.employee.findFirst.mockResolvedValue(null);
      mockPrisma.user.findFirst.mockResolvedValue(null);

      const result = await loginUser("unknown-user", "password");
      expect(result).toBeNull();
      expect(mockPrisma.securityLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            eventType: "AUTH_LOGIN_FAILED",
            status: "FAILED",
          }),
        })
      );
    });

    it("should return null if user is not active", async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null); // not found by email/nik/nip directly, fallback or identifier is resolved
      // Assume email matches but isActive is false
      mockPrisma.user.findFirst.mockResolvedValueOnce({ id: "user-1" }); // user exists check
      mockPrisma.user.findFirst.mockResolvedValueOnce(null); // when fetching active user

      const result = await loginUser("inactive@example.com", "password");
      expect(result).toBeNull();
    });

    it("should return null if password compare fails", async () => {
      const passwordHash = await bcryptjs.hash("correct-password", 10);
      const user = {
        id: "user-1",
        email: "test@example.com",
        passwordHash,
        role: "EMPLOYEE",
        isActive: true,
        employee: { name: "Test Employee" },
      };

      mockPrisma.user.findFirst.mockResolvedValueOnce({ id: "user-1" }); // resolve user
      mockPrisma.user.findFirst.mockResolvedValueOnce(user); // active user fetch

      const result = await loginUser("test@example.com", "wrong-password");
      expect(result).toBeNull();
    });

    it("should successfully log in, revoke old tokens, and generate new ones", async () => {
      const passwordHash = await bcryptjs.hash("correct-password", 10);
      const user = {
        id: "user-1",
        email: "test@example.com",
        passwordHash,
        role: "EMPLOYEE",
        isActive: true,
        employee: { id: "emp-1", name: "Test Employee" },
      };

      mockPrisma.user.findFirst.mockResolvedValueOnce({ id: "user-1" }); // resolve user
      mockPrisma.user.findFirst.mockResolvedValueOnce(user); // active user fetch
      mockPrisma.refreshToken.findMany.mockResolvedValue([{ id: "old-token" }]);

      const result = await loginUser("test@example.com", "correct-password");
      expect(result).not.toBeNull();
      expect(result?.user.id).toBe("user-1");
      expect(result?.refreshTokenPlain).toBeTypeOf("string");

      // Verify that old tokens were revoked
      expect(mockPrisma.refreshToken.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: "user-1", revokedAt: null },
        })
      );
      // Verify that a new token record was created
      expect(mockPrisma.refreshToken.create).toHaveBeenCalled();
      // Verify that lastLoginAt was updated
      expect(mockPrisma.user.update).toHaveBeenCalled();
    });
  });

  describe("rotateSession", () => {
    it("should return null if token is not found or expired", async () => {
      mockPrisma.refreshToken.findFirst.mockResolvedValue(null);

      const result = await rotateSession("invalid-token-plain");
      expect(result).toBeNull();
    });

    it("should successfully rotate session", async () => {
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

      const result = await rotateSession("old-token-plain");
      expect(result).not.toBeNull();
      expect(result?.user.id).toBe("user-1");

      // Verify old token was revoked
      expect(mockPrisma.refreshToken.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "token-record-1" },
          data: { revokedAt: expect.any(Date) },
        })
      );
      // Verify new token was created
      expect(mockPrisma.refreshToken.create).toHaveBeenCalled();
    });
  });

  describe("logoutUser", () => {
    it("should revoke token and log out user", async () => {
      mockPrisma.refreshToken.findFirst.mockResolvedValue({ id: "token-record-1" });

      const result = await logoutUser("token-plain", "user-1", "EMPLOYEE");
      expect(result).toBe(true);

      expect(mockPrisma.refreshToken.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "token-record-1" },
        })
      );
    });
  });

  describe("requestPasswordReset", () => {
    it("should return null for non-existent email", async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);
      const result = await requestPasswordReset("wrong@example.com");
      expect(result).toBeNull();
    });

    it("should create reset token for valid email and return raw token", async () => {
      const user = { id: "user-1", email: "test@example.com", role: "EMPLOYEE", employee: { name: "Emp" } };
      mockPrisma.user.findFirst.mockResolvedValue(user);

      const token = await requestPasswordReset("test@example.com");
      expect(token).not.toBeNull();
      expect(token?.startsWith("prt_")).toBe(true);
      expect(mockPrisma.passwordResetToken.create).toHaveBeenCalled();
    });
  });

  describe("resetPasswordWithToken", () => {
    it("should return false if reset token is not found or used or expired", async () => {
      mockPrisma.passwordResetToken.findFirst.mockResolvedValue(null);
      const success = await resetPasswordWithToken("invalid-token", "newpassword123");
      expect(success).toBe(false);
    });

    it("should reset password, use token, and revoke other sessions in a transaction", async () => {
      const tokenRecord = {
        id: "token-rec-1",
        userId: "user-1",
        expiresAt: new Date(Date.now() + 100000),
        user: { id: "user-1", email: "test@example.com", role: "EMPLOYEE" },
      };
      mockPrisma.passwordResetToken.findFirst.mockResolvedValue(tokenRecord);

      const success = await resetPasswordWithToken("valid-token", "newpassword123");
      expect(success).toBe(true);

      // Verify transaction executions (user update, reset token update, and refresh tokens updateMany)
      expect(mockPrisma.user.update).toHaveBeenCalled();
      expect(mockPrisma.passwordResetToken.update).toHaveBeenCalled();
      expect(mockPrisma.refreshToken.updateMany).toHaveBeenCalled();
    });
  });
});
