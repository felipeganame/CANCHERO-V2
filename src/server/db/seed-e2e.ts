import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { auth } from "@/integrations/auth";
import { db } from "@/server/db/client";
import { clubs, clubAdmins, courts, user } from "@/server/db/schema";

// Credenciales fijas para E2E en CI (AUTH_TEST_LOGIN=true, nunca en produccion).
export const E2E_PASSWORD = "Test1234!";
export const E2E_PLAYER_EMAIL = "e2e-player@canchero.test";
export const E2E_ADMIN_EMAIL = "e2e-admin@canchero.test";

async function main() {
  const existingAdmin = await db.query.user.findFirst({
    where: eq(user.email, E2E_ADMIN_EMAIL),
  });
  if (existingAdmin) {
    console.log("Seed E2E: ya existe, no se recrea.");
    return;
  }

  await auth.api.signUpEmail({
    body: { email: E2E_PLAYER_EMAIL, password: E2E_PASSWORD, name: "Jugador E2E" },
  });

  const adminSignUp = await auth.api.signUpEmail({
    body: { email: E2E_ADMIN_EMAIL, password: E2E_PASSWORD, name: "Admin E2E" },
  });
  await db
    .update(user)
    .set({ role: "club_admin" })
    .where(eq(user.id, adminSignUp.user.id));

  const clubId = randomUUID();
  await db.insert(clubs).values({
    id: clubId,
    slug: "club-e2e",
    name: "Club E2E",
    city: "Cordoba E2E",
    barrio: "Test",
    lat: 0,
    lng: 0,
    openHour: 9,
    closeHour: 24,
    slotMinutes: 60,
  });
  await db.insert(clubAdmins).values({ clubId, userId: adminSignUp.user.id });
  await db.insert(courts).values({
    id: randomUUID(),
    clubId,
    name: "Cancha E2E",
    sport: "futbol5",
    pricePerSlot: 10000,
    active: true,
  });

  console.log("Seed E2E OK.");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
