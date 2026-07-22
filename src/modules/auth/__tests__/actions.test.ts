import { describe, expect, it, vi } from "vitest";

const notificationMocks = vi.hoisted(() => ({
  sendEmail: vi.fn(),
}));

vi.mock("@/lib/notifications", () => ({
  emailProvider: {
    sendEmail: notificationMocks.sendEmail,
  },
}));

import { forgotPasswordAction } from "../actions/auth.actions";
import { mockPrisma } from "../../../../tests/setup";

describe("Auth Module Actions", () => {
  it("should return a generic success for unknown forgot-password email", async () => {
    mockPrisma.user.findFirst.mockResolvedValue(null);

    const result = await forgotPasswordAction({ email: "unknown@example.com" });

    expect(result).toEqual({ ok: true, data: { success: true } });
    expect(mockPrisma.passwordResetToken.create).not.toHaveBeenCalled();
  });

  it("should keep validation errors for invalid forgot-password email format", async () => {
    const result = await forgotPasswordAction({ email: "not-an-email" });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("VALIDATION_ERROR");
    }
  });

  it("should not expose service result when forgot-password email exists", async () => {
    const user = {
      id: "user-1",
      email: "pegawai@example.com",
      role: "EMPLOYEE",
      employee: { name: "Pegawai" },
    };
    mockPrisma.user.findFirst.mockResolvedValue(user);
    mockPrisma.passwordResetToken.create.mockResolvedValue({ id: "reset-token-1" });

    const result = await forgotPasswordAction({ email: "pegawai@example.com" });

    expect(result).toEqual({ ok: true, data: { success: true } });
  });
});
