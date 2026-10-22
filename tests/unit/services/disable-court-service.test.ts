import { describe, it, expect } from "vitest";
import { disableCourt } from "@/server/services/disable-court-service";
import { FakeCourtRepository, FakeBookingRepository } from "@/server/repositories/fakes";
import { ForbiddenError, NotFoundError } from "@/domain/errors";
import type { Court, Booking } from "@/server/repositories/types";

const now = new Date("2026-01-01T12:00:00.000Z");

const court: Court = {
  id: "court-1",
  clubId: "club-1",
  name: "Cancha 1",
  sport: "futbol5",
  pricePerSlot: 30000,
  active: true,
};

function booking(id: string, startsAt: string): Booking {
  return {
    id,
    courtId: "court-1",
    userId: "user-1",
    startsAt: new Date(startsAt),
    endsAt: new Date(startsAt),
    price: 30000,
    status: "confirmed",
    cancelledAt: null,
  };
}

describe("disableCourt", () => {
  it("CP-060 [RN-05] deshabilita la cancha y cancela solo las reservas futuras", async () => {
    const courts = new FakeCourtRepository([{ ...court }]);
    const bookings = new FakeBookingRepository([
      booking("past", "2026-01-01T10:00:00.000Z"), // pasada, no se toca
      booking("future-1", "2026-01-02T00:00:00.000Z"),
      booking("future-2", "2026-01-03T00:00:00.000Z"),
    ]);

    const cancelledCount = await disableCourt(
      { courtId: "court-1", adminClubId: "club-1" },
      { courts, bookings, now },
    );

    expect(cancelledCount).toBe(2);
    expect((await courts.findById("court-1"))?.active).toBe(false);
    expect((await bookings.findById("past"))?.status).toBe("confirmed");
    expect((await bookings.findById("future-1"))?.status).toBe("cancelled_by_club");
    expect((await bookings.findById("future-2"))?.status).toBe("cancelled_by_club");
  });

  it("CP-061 [RN-08] un admin de otro club no puede deshabilitar esta cancha", async () => {
    const courts = new FakeCourtRepository([{ ...court }]);
    const bookings = new FakeBookingRepository([]);

    await expect(
      disableCourt(
        { courtId: "court-1", adminClubId: "otro-club" },
        { courts, bookings, now },
      ),
    ).rejects.toThrow(ForbiddenError);
  });

  it("CP-062 rechaza deshabilitar una cancha inexistente", async () => {
    const courts = new FakeCourtRepository([]);
    const bookings = new FakeBookingRepository([]);

    await expect(
      disableCourt(
        { courtId: "nope", adminClubId: "club-1" },
        { courts, bookings, now },
      ),
    ).rejects.toThrow(NotFoundError);
  });
});
