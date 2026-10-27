// Mismas reglas de negocio que tests/integration/booking-repository.test.ts
// (RN-01, RN-05), pero ejecutadas contra la base REAL de QA en Supabase
// en vez de un Postgres efimero de Testcontainers. Es la prueba de
// integracion externa "contra entorno real" que pide el TP (no un doble
// de prueba ni un contenedor local) - corre en la etapa deploy-qa del
// pipeline, una vez que la base de QA ya esta migrada.
//
// Requiere DATABASE_URL apuntando a QA (seteada por ci.yml). Usa IDs
// unicos por corrida y borra todo lo que crea en afterAll, porque a
// diferencia de Testcontainers esta base es compartida y persistente.
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { randomUUID } from "node:crypto";
import { eq, inArray } from "drizzle-orm";
import { SlotTakenError } from "@/domain/errors";

describe("DrizzleBookingRepository (Postgres real de QA)", () => {
  let DrizzleBookingRepository: typeof import("@/server/repositories/drizzle-booking-repository").DrizzleBookingRepository;
  let DrizzleCourtRepository: typeof import("@/server/repositories/drizzle-court-repository").DrizzleCourtRepository;
  let disableCourt: typeof import("@/server/services/disable-court-service").disableCourt;
  let db: typeof import("@/server/db/client").db;
  let schema: typeof import("@/server/db/schema");

  const clubId = `qa-int-club-${randomUUID()}`;
  const courtId1 = `qa-int-court-${randomUUID()}`;
  const courtId2 = `qa-int-court-${randomUUID()}`;
  const userId = `qa-int-user-${randomUUID()}`;

  beforeAll(async () => {
    if (!process.env.DATABASE_URL) {
      throw new Error(
        "DATABASE_URL no esta seteada. Este test corre contra QA real, no crea su propia base.",
      );
    }

    const clientMod = await import("@/server/db/client");
    const schemaMod = await import("@/server/db/schema");
    const bookingRepoMod = await import("@/server/repositories/drizzle-booking-repository");
    const courtRepoMod = await import("@/server/repositories/drizzle-court-repository");
    const disableMod = await import("@/server/services/disable-court-service");

    db = clientMod.db;
    schema = schemaMod;
    DrizzleBookingRepository = bookingRepoMod.DrizzleBookingRepository;
    DrizzleCourtRepository = courtRepoMod.DrizzleCourtRepository;
    disableCourt = disableMod.disableCourt;

    await db.insert(schema.clubs).values({
      id: clubId,
      slug: `club-qa-integration-${randomUUID()}`,
      name: "Club QA Integration Test",
      city: "Cordoba",
      lat: 0,
      lng: 0,
      openHour: 9,
      closeHour: 24,
      slotMinutes: 60,
    });
    await db.insert(schema.courts).values({
      id: courtId1,
      clubId,
      name: "Cancha QA Integration 1",
      sport: "futbol5",
      pricePerSlot: 30000,
      active: true,
    });
    await db.insert(schema.user).values({
      id: userId,
      name: "Jugador QA Integration",
      email: `qa-integration-${randomUUID()}@test.com`,
    });
  }, 60000);

  afterAll(async () => {
    await db.delete(schema.bookings).where(inArray(schema.bookings.courtId, [courtId1, courtId2]));
    await db.delete(schema.courts).where(eq(schema.courts.clubId, clubId));
    await db.delete(schema.clubs).where(eq(schema.clubs.id, clubId));
    await db.delete(schema.user).where(eq(schema.user.id, userId));
  }, 60000);

  it("CP-112 [RN-01] el indice unico impide dos reservas confirmadas en el mismo turno (QA real)", async () => {
    const bookings = new DrizzleBookingRepository();
    const startsAt = new Date("2027-02-01T21:00:00.000Z");

    await bookings.create({
      id: randomUUID(),
      courtId: courtId1,
      userId,
      startsAt,
      endsAt: new Date(startsAt.getTime() + 3600_000),
      price: 30000,
    });

    await expect(
      bookings.create({
        id: randomUUID(),
        courtId: courtId1,
        userId,
        startsAt,
        endsAt: new Date(startsAt.getTime() + 3600_000),
        price: 30000,
      }),
    ).rejects.toThrow(SlotTakenError);
  });

  it("CP-113 [RN-05] deshabilitar una cancha cancela sus reservas futuras en transaccion, no las pasadas (QA real)", async () => {
    const bookingRepo = new DrizzleBookingRepository();
    const courtRepo = new DrizzleCourtRepository();

    await db.insert(schema.courts).values({
      id: courtId2,
      clubId,
      name: "Cancha QA Integration 2",
      sport: "futbol5",
      pricePerSlot: 25000,
      active: true,
    });

    const pastStart = new Date("2020-01-01T21:00:00.000Z");
    const futureStart = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

    await db.insert(schema.bookings).values([
      {
        id: randomUUID(),
        courtId: courtId2,
        userId,
        startsAt: pastStart,
        endsAt: new Date(pastStart.getTime() + 3600_000),
        price: 25000,
        status: "confirmed",
      },
      {
        id: randomUUID(),
        courtId: courtId2,
        userId,
        startsAt: futureStart,
        endsAt: new Date(futureStart.getTime() + 3600_000),
        price: 25000,
        status: "confirmed",
      },
    ]);

    const cancelledCount = await disableCourt(
      { courtId: courtId2, adminClubId: clubId },
      { courts: courtRepo, bookings: bookingRepo, now: new Date() },
    );

    expect(cancelledCount).toBe(1);

    const rows = await db
      .select()
      .from(schema.bookings)
      .where(eq(schema.bookings.courtId, courtId2));
    const past = rows.find((r) => r.startsAt.getTime() === pastStart.getTime());
    const future = rows.find((r) => r.startsAt.getTime() === futureStart.getTime());
    expect(past?.status).toBe("confirmed");
    expect(future?.status).toBe("cancelled_by_club");
  });
});
