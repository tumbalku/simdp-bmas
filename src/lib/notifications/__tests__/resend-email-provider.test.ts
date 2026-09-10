import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ send: vi.fn() }));
vi.mock("resend", () => ({ Resend: class { emails = { send: mocks.send }; } }));
vi.mock("@/lib/env", () => ({ env: { RESEND_API_KEY: "re_test", EMAIL_FROM: "noreply@example.com" } }));

import { ResendEmailProvider } from "../providers/resend-email-provider";

const email = { to: "pegawai@example.com", subject: "OTP", html: "<p>123456</p>" };

describe("Resend email delivery", () => {
  beforeEach(() => vi.clearAllMocks());

  it("rejects a resolved SDK error without exposing the provider message", async () => {
    mocks.send.mockResolvedValue({ data: null, error: { message: "provider-private-detail", name: "validation_error" } });
    await expect(new ResendEmailProvider().sendEmail(email)).rejects.toMatchObject({
      code: "EMAIL_DELIVERY_FAILED",
      message: "Email gagal dikirim. Silakan coba lagi atau hubungi administrator.",
    });
  });

  it("completes when the provider accepts the email", async () => {
    mocks.send.mockResolvedValue({ data: { id: "email-1" }, error: null });
    await expect(new ResendEmailProvider().sendEmail(email)).resolves.toBeUndefined();
  });
});
