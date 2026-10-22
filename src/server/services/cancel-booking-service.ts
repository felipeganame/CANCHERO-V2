import { ForbiddenError, NotFoundError, PastSlotError } from "@/domain/errors";
import { isPastOrStartedSlot } from "@/domain/slots";
import type { BookingRepository } from "@/server/repositories/types";

export interface CancelBookingInput {
  bookingId: string;
  userId: string;
}

export interface CancelBookingDeps {
  bookings: BookingRepository;
  now: Date;
}

export async function cancelBooking(
  input: CancelBookingInput,
  deps: CancelBookingDeps,
): Promise<void> {
  const booking = await deps.bookings.findById(input.bookingId);
  if (!booking) throw new NotFoundError("Reserva");
  if (booking.userId !== input.userId) throw new ForbiddenError();
  if (isPastOrStartedSlot(booking.startsAt, deps.now)) throw new PastSlotError();

  await deps.bookings.cancel(input.bookingId, "cancelled_by_player", deps.now);
}
