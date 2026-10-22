import { describe, it, expect } from "vitest";
import { getCourtAvailability } from "@/server/services/availability-service";
import { FakeBookingRepository } from "@/server/repositories/fakes";
import type { Booking } from "@/server/repositories/types";

const club = { openHour: 21, closeHour: 24, slotMinutes: 60 };

describe("getCourtAvailability", () => {
  it("CP-090 marca como ocupado un slot con reserva confirmada y libres los demas", async () => {
    const busy: Booking = {
      id: "b1",
      courtId: "court-1",
      userId: "user-1",
      startsAt: new Date("2026-01-03T01:00:00.000Z"), // 22:00 local
      endsAt: new Date("2026-01-03T02:00:00.000Z"),
      price: 30000,
      status: "confirmed",
      cancelledAt: null,
    };
    const bookings = new FakeBookingRepository([busy]);

    const slots = await getCourtAvailability(
      { courtId: "court-1", localDate: "2026-01-02" },
      { bookings, club },
    );

    expect(slots).toHaveLength(3);
    expect(slots.map((s) => s.free)).toEqual([true, false, true]);
  });

  it("CP-091 reserva cancelada no ocupa el slot", async () => {
    const cancelled: Booking = {
      id: "b1",
      courtId: "court-1",
      userId: "user-1",
      startsAt: new Date("2026-01-03T01:00:00.000Z"),
      endsAt: new Date("2026-01-03T02:00:00.000Z"),
      price: 30000,
      status: "cancelled_by_player",
      cancelledAt: new Date(),
    };
    const bookings = new FakeBookingRepository([cancelled]);

    const slots = await getCourtAvailability(
      { courtId: "court-1", localDate: "2026-01-02" },
      { bookings, club },
    );

    expect(slots.every((s) => s.free)).toBe(true);
  });
});
