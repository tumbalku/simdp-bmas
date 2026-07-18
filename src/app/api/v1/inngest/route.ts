import { serve } from "inngest/next";
import { inngest } from "@/lib/notifications/providers/inngest-job-provider";
import { dispatchNotification } from "@/modules/notification/server";
import { emailProvider } from "@/lib/notifications";

const notificationDispatchFn = inngest.createFunction(
  { id: "notification-dispatch", triggers: [{ event: "notification/dispatch" }] },
  async ({ event }: { event: { data: { notificationId: string } } }) => {
    const { notificationId } = event.data;
    await dispatchNotification({ notificationId });
  }
);

const emailSendFn = inngest.createFunction(
  { id: "email-send", triggers: [{ event: "email/send" }] },
  async ({ event }: { event: { data: { to: string; subject: string; html: string } } }) => {
    const { to, subject, html } = event.data;
    await emailProvider.sendEmail({ to, subject, html });
  }
);

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [notificationDispatchFn, emailSendFn],
});
