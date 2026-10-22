import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { startTestDatabase, stopTestDatabase } from "./setup";
import { SlotTakenError } from "@/domain/errors";

describe("DrizzleBookingRepository (Postgres real)", () => {
  let DrizzleBookingRepository: typeof import("@/server/repositories/drizzle-booking-repository").DrizzleBookingRepository;
  let DrizzleCourtRepository: typeof import("@/server/repositories/drizzle-court-repository").DrizzleCourtRepository;
  let disableCourt: typeof import("@/server/services/disable-court-service").disableCourt;
  let db: typeof import("@/server/db/client").db;
  let schema: typeof import("@/server/db/schema");

  beforeAll(async () => {
    const url = await startTestDatabase();
    process.env.DATABASE_URL = url;

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
      id: "club-1",
      slug: "club-test",
      name: "Club Test",
      city: "Cordoba",
      lat: 0,
      lng: 0,
      openHour: 9,
      closeHour: 24,
      slotMinutes: 60,
    });
    await db.insert(schema.courts).values({
      id: "court-1",
      clubId: "club-1",
      name: "Cancha 1",
      sport: "futbol5",
      pricePerSlot: 30000,
      active: true,
    });
    await db.insert(schema.user).values({
      id: "user-1",
      name: "Jugador Uno",
      email: "jugador1@test.com",
    });
  }, 180000);

  afterAll(async () => {
    await stopTestDatabase();
  });

  it("CP-110 [RN-01] el indice unico impide dos reservas confirmadas en el mismo turno", async () => {
    const bookings = new DrizzleBookingRepository();
    const startsAt = new Date("2026-02-01T21:00:00.000Z");

    await bookings.create({
      id: randomUUID(),
      courtId: "court-1",
      userId: "user-1",
      startsAt,
      endsAt: new Date(startsAt.getTime() + 3600_000),
      price: 30000,
    });

    await expect(
      bookings.create({
        id: randomUUID(),
        courtId: "court-1",
        userId: "user-1",
        startsAt,
        endsAt: new Date(startsAt.getTime() + 3600_000),
        price: 30000,
      }),
    ).rejects.toThrow(SlotTakenError);
  });

  it("CP-111 [RN-05] deshabilitar una cancha cancela sus reservas futuras en transaccion, no las pasadas", async () => {
    const bookingRepo = new DrizzleBookingRepository();
    const courtRepo = new DrizzleCourtRepository();

    await db.insert(schema.courts).values({
      id: "court-2",
      clubId: "club-1",
      name: "Cancha 2",
      sport: "futbol5",
      pricePerSlot: 25000,
      active: true,
    });

    const pastStart = new Date("2020-01-01T21:00:00.000Z");
    const futureStart = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

    await db.insert(schema.bookings).values([
      {
        id: randomUUID(),
        courtId: "court-2",
        userId: "user-1",
        startsAt: pastStart,
        endsAt: new Date(pastStart.getTime() + 3600_000),
        price: 25000,
        status: "confirmed",
      },
      {
        id: randomUUID(),
        courtId: "court-2",
        userId: "user-1",
        startsAt: futureStart,
        endsAt: new Date(futureStart.getTime() + 3600_000),
        price: 25000,
        status: "confirmed",
      },
    ]);

    const cancelledCount = await disableCourt(
      { courtId: "court-2", adminClubId: "club-1" },
      { courts: courtRepo, bookings: bookingRepo, now: new Date() },
    );

    expect(cancelledCount).toBe(1);

    const rows = await db
      .select()
      .from(schema.bookings)
      .where(eq(schema.bookings.courtId, "court-2"));
    const past = rows.find((r) => r.startsAt.getTime() === pastStart.getTime());
    const future = rows.find((r) => r.startsAt.getTime() === futureStart.getTime());
    expect(past?.status).toBe("confirmed");
    expect(future?.status).toBe("cancelled_by_club");
  });
});
