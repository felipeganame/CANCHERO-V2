import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { writeFileSync } from "node:fs";
import { auth } from "@/integrations/auth";
import { db } from "@/server/db/client";
import { clubs, clubAdmins, courts, user } from "@/server/db/schema";

// Datos de ejemplo tomados de design/Buscar.dc.html y design/PanelCanchas.dc.html
const SEED_CLUBS = [
  {
    slug: "complejo-el-potrero",
    name: "Complejo El Potrero",
    city: "Córdoba",
    barrio: "General Paz",
    lat: -31.4295,
    lng: -64.1858,
    adminEmail: "admin@elpotrero.canchero.test",
    courts: [
      { name: "Cancha 1", price: 30000 },
      { name: "Cancha 2", price: 30000 },
      { name: "Cancha 3", price: 34000 },
    ],
  },
  {
    slug: "club-los-andes",
    name: "Club Los Andes",
    city: "Córdoba",
    barrio: "Alta Córdoba",
    lat: -31.3833,
    lng: -64.1833,
    adminEmail: "admin@losandes.canchero.test",
    courts: [
      { name: "Cancha 1", price: 28000 },
      { name: "Cancha 2", price: 28000 },
    ],
  },
] as const;

function randomPassword(): string {
  return randomUUID().replace(/-/g, "").slice(0, 16);
}

async function main() {
  const credentials: string[] = [
    "Canchero — usuarios de prueba (seed)",
    `Generado: ${new Date().toISOString()}`,
    "",
  ];

  for (const c of SEED_CLUBS) {
    const password = randomPassword();

    const signUp = await auth.api.signUpEmail({
      body: { email: c.adminEmail, password, name: `Admin ${c.name}` },
    });
    const userId = signUp.user.id;

    await db.update(user).set({ role: "club_admin" }).where(eq(user.id, userId));

    const clubId = randomUUID();
    await db.insert(clubs).values({
      id: clubId,
      slug: c.slug,
      name: c.name,
      city: c.city,
      barrio: c.barrio,
      lat: c.lat,
      lng: c.lng,
      openHour: 9,
      closeHour: 24,
      slotMinutes: 60,
    });

    await db.insert(clubAdmins).values({ clubId, userId });

    for (const court of c.courts) {
      await db.insert(courts).values({
        id: randomUUID(),
        clubId,
        name: court.name,
        sport: "futbol5",
        pricePerSlot: court.price,
        active: true,
      });
    }

    credentials.push(`${c.name}`);
    credentials.push(`  email:    ${c.adminEmail}`);
    credentials.push(`  password: ${password}`);
    credentials.push("");
  }

  const outPath = "seed-credentials.txt";
  writeFileSync(outPath, credentials.join("\n"), "utf-8");
  console.log(`Seed OK. Credenciales en ${outPath} (no se commitea, ver .gitignore).`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
