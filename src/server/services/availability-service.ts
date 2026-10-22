import { generateSlotsForLocalDate, type ClubSchedule } from "@/domain/slots";
import type { BookingRepository } from "@/server/repositories/types";

export interface SlotAvailability {
  startsAt: Date;
  free: boolean;
}

export interface GetCourtAvailabilityInput {
  courtId: string;
  localDate: string;
}

export interface GetCourtAvailabilityDeps {
  bookings: BookingRepository;
  club: ClubSchedule;
}

export async function getCourtAvailability(
  input: GetCourtAvailabilityInput,
  deps: GetCourtAvailabilityDeps,
): Promise<SlotAvailability[]> {
  const slots = generateSlotsForLocalDate(deps.club, input.localDate);
  if (slots.length === 0) return [];

  const rangeStart = slots[0]!;
  const rangeEnd = new Date(
    slots[slots.length - 1]!.getTime() + deps.club.slotMinutes * 60 * 1000,
  );

  const busy = await deps.bookings.findConfirmedByCourtIdInRange(
    input.courtId,
    rangeStart,
    rangeEnd,
  );
  const busyTimes = new Set(busy.map((b) => b.startsAt.getTime()));

  return slots.map((startsAt) => ({
    startsAt,
    free: !busyTimes.has(startsAt.getTime()),
  }));
}
