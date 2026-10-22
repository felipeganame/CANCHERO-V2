import { SlotTakenError } from "@/domain/errors";
import type {
  Booking,
  BookingRepository,
  Court,
  CourtRepository,
} from "./types";

export class FakeCourtRepository implements CourtRepository {
  constructor(private courts: Court[] = []) {}

  async findById(id: string): Promise<Court | null> {
    return this.courts.find((c) => c.id === id) ?? null;
  }

  async findByClubId(clubId: string): Promise<Court[]> {
    return this.courts.filter((c) => c.clubId === clubId);
  }

  async setActive(id: string, active: boolean): Promise<void> {
    const court = this.courts.find((c) => c.id === id);
    if (court) court.active = active;
  }

  async setPrice(id: string, pricePerSlot: number): Promise<void> {
    const court = this.courts.find((c) => c.id === id);
    if (court) court.pricePerSlot = pricePerSlot;
  }

  async create(input: {
    id: string;
    clubId: string;
    name: string;
    sport: Court["sport"];
    pricePerSlot: number;
  }): Promise<Court> {
    const court: Court = { ...input, active: true };
    this.courts.push(court);
    return court;
  }
}

export class FakeBookingRepository implements BookingRepository {
  constructor(public bookings: Booking[] = []) {}

  async create(input: {
    id: string;
    courtId: string;
    userId: string;
    startsAt: Date;
    endsAt: Date;
    price: number;
  }): Promise<Booking> {
    const conflict = this.bookings.some(
      (b) =>
        b.courtId === input.courtId &&
        b.status === "confirmed" &&
        b.startsAt.getTime() === input.startsAt.getTime(),
    );
    if (conflict) throw new SlotTakenError();

    const booking: Booking = {
      id: input.id,
      courtId: input.courtId,
      userId: input.userId,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      price: input.price,
      status: "confirmed",
      cancelledAt: null,
    };
    this.bookings.push(booking);
    return booking;
  }

  async findById(id: string): Promise<Booking | null> {
    return this.bookings.find((b) => b.id === id) ?? null;
  }

  async findFutureConfirmedByCourtId(
    courtId: string,
    after: Date,
  ): Promise<Booking[]> {
    return this.bookings.filter(
      (b) =>
        b.courtId === courtId &&
        b.status === "confirmed" &&
        b.startsAt > after,
    );
  }

  async findConfirmedByCourtIdInRange(
    courtId: string,
    start: Date,
    end: Date,
  ): Promise<Booking[]> {
    return this.bookings.filter(
      (b) =>
        b.courtId === courtId &&
        b.status === "confirmed" &&
        b.startsAt >= start &&
        b.startsAt < end,
    );
  }

  async cancelFutureByCourtId(
    courtId: string,
    after: Date,
    status: "cancelled_by_club",
  ): Promise<number> {
    let count = 0;
    for (const b of this.bookings) {
      if (b.courtId === courtId && b.status === "confirmed" && b.startsAt > after) {
        b.status = status;
        b.cancelledAt = new Date();
        count++;
      }
    }
    return count;
  }

  async cancel(
    id: string,
    status: "cancelled_by_player",
    cancelledAt: Date,
  ): Promise<void> {
    const booking = this.bookings.find((b) => b.id === id);
    if (booking) {
      booking.status = status;
      booking.cancelledAt = cancelledAt;
    }
  }

  async findByUserId(userId: string): Promise<Booking[]> {
    return this.bookings.filter((b) => b.userId === userId);
  }
}
