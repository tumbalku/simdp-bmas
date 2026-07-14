import { EmailProvider } from "../types";

export class NoopEmailProvider implements EmailProvider {
  async sendEmail(input: { to: string; subject: string; html: string; text?: string }): Promise<void> {
    console.warn(
      `[NoopEmailProvider] sendEmail triggered to: ${input.to} with subject: "${input.subject}" but Resend is not configured.`
    );
  }
}
