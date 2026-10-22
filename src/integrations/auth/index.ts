import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/server/db/client";
import * as schema from "@/server/db/schema";

const testLoginEnabled = process.env.AUTH_TEST_LOGIN === "true";

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg", schema }),
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    },
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        defaultValue: "player",
        input: false,
      },
    },
  },
  // Solo en test/preview (AUTH_TEST_LOGIN=true): permite login con email/contraseña
  // sembrado, porque Google OAuth no se puede automatizar en CI. En producción
  // esta variable no existe y el proveedor no se registra (ver PLAN.md sección 8).
  emailAndPassword: {
    enabled: testLoginEnabled,
  },
});
