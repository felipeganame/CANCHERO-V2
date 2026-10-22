import type { EmailSender, SendEmailInput } from "./types";

export class FakeEmailSender implements EmailSender {
  sent: SendEmailInput[] = [];

  async send(input: SendEmailInput): Promise<{ id: string }> {
    this.sent.push(input);
    return { id: `fake-${this.sent.length}` };
  }
}
