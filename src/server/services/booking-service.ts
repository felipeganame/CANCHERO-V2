import { randomUUID } from "node:crypto";
import {
  CourtDisabledError,
  InvalidSlotError,
  NotFoundError,
  PastSlotError,
} from "@/domain/errors";
import { isPastOrStartedSlot, isValidSlotForClub, type ClubSchedule } from "@/domain/slots";
import type { Booking, BookingRepository, CourtRepository } from "@/server/repositories/types";

export interface ReserveSlotInput {
  id?: string;
  courtId: string;
  userId: string;
  startsAt: Date;
}

export interface ReserveSlotDeps {
  courts: CourtRepository;
  bookings: BookingRepository;
  club: ClubSchedule;
  now: Date;
}

export async function reserveSlot(
  input: ReserveSlotInput,
  deps: ReserveSlotDeps,
): Promise<Booking> {
  const court = await deps.courts.findById(input.courtId);
  if (!court) throw new NotFoundError("Cancha");
  if (!court.active) throw new CourtDisabledError();

  if (isPastOrStartedSlot(input.startsAt, deps.now)) {
    throw new PastSlotError();
  }

  if (!isValidSlotForClub(input.startsAt, deps.club)) {
    throw new InvalidSlotError();
  }

  const endsAt = new Date(
    input.startsAt.getTime() + deps.club.slotMinutes * 60 * 1000,
  );

  return deps.bookings.create({
    id: input.id ?? randomUUID(),
    courtId: input.courtId,
    userId: input.userId,
    startsAt: input.startsAt,
    endsAt,
    price: court.pricePerSlot,
  });
}
