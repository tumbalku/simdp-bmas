import { serve } from "inngest/next";
import { inngest } from "@/lib/events/inngest";
import { eventSubscribers } from "@/lib/events";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: eventSubscribers,
});
