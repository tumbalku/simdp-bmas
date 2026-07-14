import { env } from "@/lib/env";
import type { EmailProvider, NotificationJobProvider, RealtimeNotificationProvider } from "./types";
import { PusherRealtimeProvider } from "./providers/pusher-realtime-provider";
import { NoopRealtimeProvider } from "./providers/noop-realtime-provider";
import { ResendEmailProvider } from "./providers/resend-email-provider";
import { NoopEmailProvider } from "./providers/noop-email-provider";
import { InngestJobProvider } from "./providers/inngest-job-provider";
import { NoopJobProvider } from "./providers/noop-job-provider";

const isPusherConfigured = Boolean(
  env.PUSHER_APP_ID &&
    (env.PUSHER_KEY || env.NEXT_PUBLIC_PUSHER_KEY) &&
    env.PUSHER_SECRET &&
    (env.PUSHER_CLUSTER || env.NEXT_PUBLIC_PUSHER_CLUSTER),
);

const isResendConfigured = Boolean(env.RESEND_API_KEY && env.EMAIL_FROM);

const isInngestConfigured = Boolean(env.INNGEST_EVENT_KEY);

export const realtimeProvider: RealtimeNotificationProvider = isPusherConfigured
  ? new PusherRealtimeProvider()
  : new NoopRealtimeProvider();

export const emailProvider: EmailProvider = isResendConfigured
  ? new ResendEmailProvider()
  : new NoopEmailProvider();

export const jobProvider: NotificationJobProvider = isInngestConfigured
  ? new InngestJobProvider()
  : new NoopJobProvider();
