import { Resend } from "resend";

import { env } from "@/lib/env";
import type { EmailProvider } from "../types";

export class ResendEmailProvider implements EmailProvider {
  private resend: Resend;
  private from: string;

  constructor() {
    this.resend = new Resend(env.RESEND_API_KEY ?? "");
    this.from = env.EMAIL_FROM ?? "";
  }

  async sendEmail(input: { to: string; subject: string; html: string; text?: string }): Promise<void> {
    try {
      await this.resend.emails.send({
        from: this.from,
        to: input.to,
        subject: input.subject,
        html: input.html,
        text: input.text,
      });
    } catch (error) {
      console.error("[ResendEmailProvider] sendEmail error:", error);
    }
  }
}
