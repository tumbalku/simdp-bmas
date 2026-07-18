import { env } from "@/lib/env";
import type { EmailProvider, RealtimeNotificationProvider } from "./types";
import { PusherRealtimeProvider } from "./providers/pusher-realtime-provider";
import { NoopRealtimeProvider } from "./providers/noop-realtime-provider";
import { ResendEmailProvider } from "./providers/resend-email-provider";
import { NoopEmailProvider } from "./providers/noop-email-provider";

const isPusherConfigured = Boolean(
  env.PUSHER_APP_ID &&
    (env.PUSHER_KEY || env.NEXT_PUBLIC_PUSHER_KEY) &&
    env.PUSHER_SECRET &&
    (env.PUSHER_CLUSTER || env.NEXT_PUBLIC_PUSHER_CLUSTER),
);

const isResendConfigured = Boolean(env.RESEND_API_KEY && env.EMAIL_FROM);

export const realtimeProvider: RealtimeNotificationProvider = isPusherConfigured
  ? new PusherRealtimeProvider()
  : new NoopRealtimeProvider();

export const emailProvider: EmailProvider = isResendConfigured
  ? new ResendEmailProvider()
  : new NoopEmailProvider();
