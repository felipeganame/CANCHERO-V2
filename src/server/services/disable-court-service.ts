import { ForbiddenError, NotFoundError } from "@/domain/errors";
import type { BookingRepository, CourtRepository } from "@/server/repositories/types";

export interface DisableCourtInput {
  courtId: string;
  adminClubId: string;
}

export interface DisableCourtDeps {
  courts: CourtRepository;
  bookings: BookingRepository;
  now: Date;
}

export async function disableCourt(
  input: DisableCourtInput,
  deps: DisableCourtDeps,
): Promise<number> {
  const court = await deps.courts.findById(input.courtId);
  if (!court) throw new NotFoundError("Cancha");
  if (court.clubId !== input.adminClubId) throw new ForbiddenError();

  await deps.courts.setActive(input.courtId, false);

  return deps.bookings.cancelFutureByCourtId(
    input.courtId,
    deps.now,
    "cancelled_by_club",
  );
}
