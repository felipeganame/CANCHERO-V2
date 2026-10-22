import { describe, it, expect } from "vitest";
import { cancelBooking } from "@/server/services/cancel-booking-service";
import { FakeBookingRepository } from "@/server/repositories/fakes";
import { ForbiddenError, NotFoundError, PastSlotError } from "@/domain/errors";
import type { Booking } from "@/server/repositories/types";

const now = new Date("2026-01-01T12:00:00.000Z");

function makeBooking(overrides: Partial<Booking> = {}): Booking {
  return {
    id: "booking-1",
    courtId: "court-1",
    userId: "user-1",
    startsAt: new Date("2026-01-02T00:00:00.000Z"),
    endsAt: new Date("2026-01-02T01:00:00.000Z"),
    price: 30000,
    status: "confirmed",
    cancelledAt: null,
    ...overrides,
  };
}

describe("cancelBooking", () => {
  it("CP-050 [RN-07] el jugador cancela su propia reserva futura", async () => {
    const bookings = new FakeBookingRepository([makeBooking()]);

    await cancelBooking(
      { bookingId: "booking-1", userId: "user-1" },
      { bookings, now },
    );

    const updated = await bookings.findById("booking-1");
    expect(updated?.status).toBe("cancelled_by_player");
  });

  it("CP-051 [RN-08] un jugador no puede cancelar la reserva de otro", async () => {
    const bookings = new FakeBookingRepository([makeBooking({ userId: "owner" })]);

    await expect(
      cancelBooking({ bookingId: "booking-1", userId: "intruder" }, { bookings, now }),
    ).rejects.toThrow(ForbiddenError);
  });

  it("CP-052 rechaza cancelar una reserva que no existe", async () => {
    const bookings = new FakeBookingRepository([]);

    await expect(
      cancelBooking({ bookingId: "nope", userId: "user-1" }, { bookings, now }),
    ).rejects.toThrow(NotFoundError);
  });

  it("CP-053 rechaza cancelar una reserva cuyo turno ya empezo", async () => {
    const bookings = new FakeBookingRepository([
      makeBooking({ startsAt: new Date("2026-01-01T11:00:00.000Z") }),
    ]);

    await expect(
      cancelBooking({ bookingId: "booking-1", userId: "user-1" }, { bookings, now }),
    ).rejects.toThrow(PastSlotError);
  });
});
