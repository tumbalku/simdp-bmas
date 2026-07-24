import { serve } from "inngest/next";
import { inngest } from "@/lib/events/inngest";
import { eventSubscribers } from "@/lib/events";
import { env } from "@/lib/env";

// Ensure webhook signature verification is active in production to prevent event spoofing (Issue #225)
if (env.NODE_ENV === "production" && !env.INNGEST_SIGNING_KEY) {
  throw new Error(
    "Inngest initialization failed: INNGEST_SIGNING_KEY wajib dikonfigurasi pada lingkungan production."
  );
}

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: eventSubscribers,
});
