import { ResendSender } from "./resend-sender";
import { FakeEmailSender } from "./fake-sender";
import type { EmailSender } from "./types";

let instance: EmailSender | null = null;

export function getEmailSender(): EmailSender {
  if (instance) return instance;
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    instance = new FakeEmailSender();
    return instance;
  }
  instance = new ResendSender(apiKey, process.env.RESEND_FROM ?? "Canchero <onboarding@resend.dev>");
  return instance;
}

export type { EmailSender, SendEmailInput } from "./types";
export { ResendSender } from "./resend-sender";
export { FakeEmailSender } from "./fake-sender";
