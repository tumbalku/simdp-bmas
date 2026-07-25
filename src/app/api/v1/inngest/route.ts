import { serve } from "inngest/next";
import { inngest } from "@/lib/events/inngest";
import { eventSubscribers } from "@/lib/events";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

function assertInngestSigningKeyConfigured() {
  // Build-time evaluation should not fail, but production requests must still
  // refuse to serve unsigned webhooks when the signing key is absent.
  if (env.NODE_ENV === "production" && !env.INNGEST_SIGNING_KEY) {
    throw new Error(
      "Inngest initialization failed: INNGEST_SIGNING_KEY wajib dikonfigurasi pada lingkungan production."
    );
  }
}

const handlers = serve({
  client: inngest,
  functions: eventSubscribers,
});

export async function GET(...args: Parameters<typeof handlers.GET>) {
  assertInngestSigningKeyConfigured();
  return handlers.GET(...args);
}

export async function POST(...args: Parameters<typeof handlers.POST>) {
  assertInngestSigningKeyConfigured();
  return handlers.POST(...args);
}

export async function PUT(...args: Parameters<typeof handlers.PUT>) {
  assertInngestSigningKeyConfigured();
  return handlers.PUT(...args);
}
