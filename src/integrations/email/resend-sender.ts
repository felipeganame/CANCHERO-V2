import { Resend } from "resend";
import type { EmailSender, SendEmailInput } from "./types";

const TIMEOUT_MS = 5000;

export class ResendSender implements EmailSender {
  private client: Resend;
  private from: string;

  constructor(apiKey: string, from: string) {
    this.client = new Resend(apiKey);
    this.from = from;
  }

  async send(input: SendEmailInput): Promise<{ id: string }> {
    const timeout = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error("Resend timeout")), TIMEOUT_MS);
    });
    const { data, error } = await Promise.race([
      this.client.emails.send({
        from: this.from,
        to: input.to,
        subject: input.subject,
        html: input.html,
      }),
      timeout,
    ]);
    if (error) throw new Error(error.message);
    if (!data) throw new Error("Resend no devolvió datos");
    return { id: data.id };
  }
}
