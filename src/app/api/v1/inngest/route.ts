import { serve } from "inngest/next";
import { inngest } from "@/lib/notifications/providers/inngest-job-provider";
import { eventSubscribers } from "@/lib/events";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: eventSubscribers,
});
