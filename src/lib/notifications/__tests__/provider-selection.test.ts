import { afterEach, describe, expect, it, vi } from "vitest";

const nodemailerMocks = vi.hoisted(() => ({
  createTransport: vi.fn(() => ({
    sendMail: vi.fn(),
  })),
}));

vi.mock("nodemailer", () => ({
  default: {
    createTransport: nodemailerMocks.createTransport,
  },
}));

const originalEnv = { ...process.env };

async function loadEmailProviderName(overrides: Record<string, string | undefined>) {
  vi.resetModules();
  process.env = {
    ...originalEnv,
    EMAIL_PROVIDER: "",
    RESEND_API_KEY: "",
    EMAIL_FROM: "",
    SMTP_HOST: "",
    SMTP_PORT: "",
    SMTP_SECURE: "",
    SMTP_USER: "",
    SMTP_PASS: "",
    ...overrides,
  };

  const { createEmailProvider } = await import("@/lib/notifications");
  return createEmailProvider().constructor.name;
}

describe("email provider selection", () => {
  afterEach(() => {
    process.env = { ...originalEnv };
    vi.clearAllMocks();
  });

  it("uses NoopEmailProvider by default", async () => {
    await expect(loadEmailProviderName({})).resolves.toBe("NoopEmailProvider");
  });

  it("uses ResendEmailProvider when EMAIL_PROVIDER=resend is configured", async () => {
    await expect(
      loadEmailProviderName({
        EMAIL_PROVIDER: "resend",
        RESEND_API_KEY: "re_test",
        EMAIL_FROM: "noreply@example.com",
      })
    ).resolves.toBe("ResendEmailProvider");
  });

  it("uses SmtpEmailProvider when EMAIL_PROVIDER=smtp is configured", async () => {
    await expect(
      loadEmailProviderName({
        EMAIL_PROVIDER: "smtp",
        EMAIL_FROM: "noreply@example.com",
        SMTP_HOST: "smtp.gmail.com",
        SMTP_PORT: "587",
        SMTP_SECURE: "false",
        SMTP_USER: "noreply@example.com",
        SMTP_PASS: "app-password",
      })
    ).resolves.toBe("SmtpEmailProvider");
    expect(nodemailerMocks.createTransport).toHaveBeenCalledWith(
      expect.objectContaining({
        host: "smtp.gmail.com",
        port: 587,
        secure: false,
        auth: {
          user: "noreply@example.com",
          pass: "app-password",
        },
      })
    );
  });

  it("falls back to NoopEmailProvider when SMTP config is incomplete", async () => {
    await expect(
      loadEmailProviderName({
        EMAIL_PROVIDER: "smtp",
        EMAIL_FROM: "noreply@example.com",
        SMTP_HOST: "smtp.gmail.com",
      })
    ).resolves.toBe("NoopEmailProvider");
  });
});
