import { describe, it, expect } from "vitest";
import { reserveSlot } from "@/server/services/booking-service";
import { FakeCourtRepository, FakeBookingRepository } from "@/server/repositories/fakes";
import { SlotTakenError, CourtDisabledError, PastSlotError, InvalidSlotError } from "@/domain/errors";
import type { Court, Booking } from "@/server/repositories/types";

const club = { openHour: 9, closeHour: 24, slotMinutes: 60 };
const activeCourt: Court = {
  id: "court-1",
  clubId: "club-1",
  name: "Cancha 1",
  sport: "futbol5",
  pricePerSlot: 30000,
  active: true,
};
const now = new Date("2026-01-01T12:00:00.000Z");
const futureSlot = new Date("2026-01-02T00:00:00.000Z"); // 21:00 Cordoba, dentro de horario

describe("reserveSlot", () => {
  it("CP-040 [RN-09] reserva un turno libre y congela el precio actual de la cancha", async () => {
    const courts = new FakeCourtRepository([activeCourt]);
    const bookings = new FakeBookingRepository();

    const booking = await reserveSlot(
      { courtId: "court-1", userId: "user-1", startsAt: futureSlot, id: "booking-1" },
      { courts, bookings, club, now },
    );

    expect(booking.status).toBe("confirmed");
    expect(booking.price).toBe(30000);
  });

  it("CP-041 [RN-01] rechaza segunda reserva simultanea del mismo turno", async () => {
    const courts = new FakeCourtRepository([activeCourt]);
    const existing: Booking = {
      id: "booking-existing",
      courtId: "court-1",
      userId: "other-user",
      startsAt: futureSlot,
      endsAt: new Date(futureSlot.getTime() + 60 * 60 * 1000),
      price: 30000,
      status: "confirmed",
      cancelledAt: null,
    };
    const bookings = new FakeBookingRepository([existing]);

    await expect(
      reserveSlot(
        { courtId: "court-1", userId: "user-1", startsAt: futureSlot, id: "booking-2" },
        { courts, bookings, club, now },
      ),
    ).rejects.toThrow(SlotTakenError);
  });

  it("CP-042 [RN-02] rechaza un turno que ya empezo", async () => {
    const courts = new FakeCourtRepository([activeCourt]);
    const bookings = new FakeBookingRepository();
    const pastSlot = new Date("2026-01-01T11:00:00.000Z");

    await expect(
      reserveSlot(
        { courtId: "court-1", userId: "user-1", startsAt: pastSlot, id: "booking-3" },
        { courts, bookings, club, now },
      ),
    ).rejects.toThrow(PastSlotError);
  });

  it("CP-043 [RN-03] rechaza un turno fuera de horario del club", async () => {
    const courts = new FakeCourtRepository([activeCourt]);
    const bookings = new FakeBookingRepository();
    const outsideHours = new Date("2026-01-01T13:30:00.000Z"); // 10:30 Cordoba, no alineado

    await expect(
      reserveSlot(
        { courtId: "court-1", userId: "user-1", startsAt: outsideHours, id: "booking-4" },
        { courts, bookings, club, now },
      ),
    ).rejects.toThrow(InvalidSlotError);
  });

  it("CP-044 [RN-04] rechaza reservar una cancha deshabilitada", async () => {
    const disabledCourt: Court = { ...activeCourt, active: false };
    const courts = new FakeCourtRepository([disabledCourt]);
    const bookings = new FakeBookingRepository();

    await expect(
      reserveSlot(
        { courtId: "court-1", userId: "user-1", startsAt: futureSlot, id: "booking-5" },
        { courts, bookings, club, now },
      ),
    ).rejects.toThrow(CourtDisabledError);
  });
});
