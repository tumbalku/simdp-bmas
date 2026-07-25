import { env } from "@/lib/env";
import type { EmailProvider, RealtimeNotificationProvider } from "./types";
import { PusherRealtimeProvider } from "./providers/pusher-realtime-provider";
import { NoopRealtimeProvider } from "./providers/noop-realtime-provider";
import { ResendEmailProvider } from "./providers/resend-email-provider";
import { NoopEmailProvider } from "./providers/noop-email-provider";
import { SmtpEmailProvider } from "./providers/smtp-email-provider";

const isPusherConfigured = Boolean(
  env.PUSHER_APP_ID &&
    (env.PUSHER_KEY || env.NEXT_PUBLIC_PUSHER_KEY) &&
    env.PUSHER_SECRET &&
    (env.PUSHER_CLUSTER || env.NEXT_PUBLIC_PUSHER_CLUSTER),
);

function isResendConfigured() {
  return Boolean(env.RESEND_API_KEY && env.EMAIL_FROM);
}

function isSmtpConfigured() {
  return Boolean(env.SMTP_HOST && env.SMTP_PORT && env.SMTP_USER && env.SMTP_PASS && env.EMAIL_FROM);
}

export function isEmailProviderConfigured() {
  if (env.EMAIL_PROVIDER === "resend") return isResendConfigured();
  if (env.EMAIL_PROVIDER === "smtp") return isSmtpConfigured();
  return false;
}

export function createEmailProvider(): EmailProvider {
  if (env.EMAIL_PROVIDER === "resend") {
    if (isResendConfigured()) return new ResendEmailProvider();
    console.warn("[EmailProvider] EMAIL_PROVIDER=resend but RESEND_API_KEY or EMAIL_FROM is missing. Falling back to NoopEmailProvider.");
    return new NoopEmailProvider();
  }

  if (env.EMAIL_PROVIDER === "smtp") {
    if (isSmtpConfigured()) return new SmtpEmailProvider();
    console.warn("[EmailProvider] EMAIL_PROVIDER=smtp but SMTP config or EMAIL_FROM is missing. Falling back to NoopEmailProvider.");
    return new NoopEmailProvider();
  }

  return new NoopEmailProvider();
}

export const realtimeProvider: RealtimeNotificationProvider = isPusherConfigured
  ? new PusherRealtimeProvider()
  : new NoopRealtimeProvider();

export const emailProvider: EmailProvider = createEmailProvider();
