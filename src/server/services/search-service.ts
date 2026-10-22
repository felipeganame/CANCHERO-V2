import { getCourtAvailability } from "@/server/services/availability-service";
import type {
  BookingRepository,
  ClubWithCourts,
  SearchRepository,
} from "@/server/repositories/types";

export interface SearchClubsInput {
  sport: "futbol5" | "futbol7" | "padel" | "tenis";
  city: string;
  localDate: string;
}

export interface SearchClubsDeps {
  search: SearchRepository;
  bookings: BookingRepository;
}

export async function searchClubs(
  input: SearchClubsInput,
  deps: SearchClubsDeps,
): Promise<ClubWithCourts[]> {
  const candidates = await deps.search.findClubsBySportAndCity(
    input.sport,
    input.city,
  );

  const results: ClubWithCourts[] = [];

  for (const candidate of candidates) {
    const activeCourts = candidate.courts.filter(
      (c) => c.active && c.sport === input.sport,
    );

    for (const court of activeCourts) {
      const slots = await getCourtAvailability(
        { courtId: court.id, localDate: input.localDate },
        { bookings: deps.bookings, club: candidate.club },
      );
      if (slots.some((s) => s.free)) {
        results.push({ club: candidate.club, courts: activeCourts });
        break;
      }
    }
  }

  return results;
}
