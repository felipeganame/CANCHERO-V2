import { describe, it, expect } from "vitest";
import { searchClubs } from "@/server/services/search-service";
import { FakeBookingRepository } from "@/server/repositories/fakes";
import type { ClubWithCourts, SearchRepository, Booking } from "@/server/repositories/types";

class FakeSearchRepository implements SearchRepository {
  constructor(private results: ClubWithCourts[]) {}
  async findClubsBySportAndCity(): Promise<ClubWithCourts[]> {
    return this.results;
  }
}

const clubWithFreeSlot: ClubWithCourts = {
  club: {
    id: "club-1",
    slug: "club-1",
    name: "Club Uno",
    city: "Cordoba",
    barrio: null,
    lat: 0,
    lng: 0,
    openHour: 21,
    closeHour: 24,
    slotMinutes: 60,
  },
  courts: [
    { id: "court-1", clubId: "club-1", name: "Cancha 1", sport: "padel", pricePerSlot: 15000, active: true },
  ],
};

describe("searchClubs", () => {
  it("CP-100 [RN-10] devuelve el club si tiene al menos un turno libre", async () => {
    const search = new FakeSearchRepository([clubWithFreeSlot]);
    const bookings = new FakeBookingRepository([]);

    const results = await searchClubs(
      { sport: "padel", city: "Cordoba", localDate: "2026-01-02" },
      { search, bookings },
    );

    expect(results).toHaveLength(1);
    expect(results[0]?.club.id).toBe("club-1");
  });

  it("CP-101 [RN-10] no devuelve el club si todos los turnos estan ocupados", async () => {
    const search = new FakeSearchRepository([clubWithFreeSlot]);
    const allBusy: Booking[] = [
      { id: "b1", courtId: "court-1", userId: "u", startsAt: new Date("2026-01-03T00:00:00.000Z"), endsAt: new Date(), price: 15000, status: "confirmed", cancelledAt: null },
      { id: "b2", courtId: "court-1", userId: "u", startsAt: new Date("2026-01-03T01:00:00.000Z"), endsAt: new Date(), price: 15000, status: "confirmed", cancelledAt: null },
      { id: "b3", courtId: "court-1", userId: "u", startsAt: new Date("2026-01-03T02:00:00.000Z"), endsAt: new Date(), price: 15000, status: "confirmed", cancelledAt: null },
    ];
    const bookings = new FakeBookingRepository(allBusy);

    const results = await searchClubs(
      { sport: "padel", city: "Cordoba", localDate: "2026-01-02" },
      { search, bookings },
    );

    expect(results).toHaveLength(0);
  });

  it("CP-102 [RN-10] ignora canchas inactivas", async () => {
    const inactiveCourtClub: ClubWithCourts = {
      ...clubWithFreeSlot,
      courts: [{ ...clubWithFreeSlot.courts[0]!, active: false }],
    };
    const search = new FakeSearchRepository([inactiveCourtClub]);
    const bookings = new FakeBookingRepository([]);

    const results = await searchClubs(
      { sport: "padel", city: "Cordoba", localDate: "2026-01-02" },
      { search, bookings },
    );

    expect(results).toHaveLength(0);
  });
});
