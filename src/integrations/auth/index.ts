import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/server/db/client";
import * as schema from "@/server/db/schema";
import { getEmailSender } from "@/integrations/email";
import { verifyEmailMessage, resetPasswordEmail } from "@/integrations/email/templates";

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg", schema }),
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,
  // Los dominios estables (alias) difieren de la URL de preview que
  // Vercel asigna en cada deploy, asi que los listamos a mano para que
  // el chequeo de origin de Better Auth no los rechace.
  trustedOrigins: [
    "http://localhost:3000",
    "https://canchero-qa.vercel.app",
    "https://canchero-puce.vercel.app",
  ],
  // Google OAuth: comentado hasta tener credenciales de Google Cloud
  // Console. No se muestra en la UI mientras tanto (ver login-form.tsx).
  // socialProviders: {
  //   google: {
  //     clientId: process.env.GOOGLE_CLIENT_ID ?? "",
  //     clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
  //   },
  // },
  user: {
    additionalFields: {
      role: {
        type: "string",
        defaultValue: "player",
        input: false,
      },
    },
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    sendResetPassword: async ({ user, url }) => {
      const { subject, html } = resetPasswordEmail({ name: user.name, url });
      await getEmailSender().send({ to: user.email, subject, html });
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      const { subject, html } = verifyEmailMessage({ name: user.name, url });
      await getEmailSender().send({ to: user.email, subject, html });
    },
  },
});
