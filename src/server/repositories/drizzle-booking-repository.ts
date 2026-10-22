import { and, eq, gt, gte, lt } from "drizzle-orm";
import { db } from "@/server/db/client";
import { bookings } from "@/server/db/schema";
import { SlotTakenError } from "@/domain/errors";
import type { Booking, BookingRepository } from "./types";

const UNIQUE_VIOLATION = "23505";

// El driver postgres-js envuelve el error de Postgres en DrizzleQueryError
// y el codigo real queda en `.cause.code`, no en el error de nivel superior.
function hasUniqueViolationCode(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  if ("code" in err && err.code === UNIQUE_VIOLATION) return true;
  if ("cause" in err) return hasUniqueViolationCode(err.cause);
  return false;
}

function toDomain(row: typeof bookings.$inferSelect): Booking {
  return {
    id: row.id,
    courtId: row.courtId,
    userId: row.userId,
    startsAt: row.startsAt,
    endsAt: row.endsAt,
    price: row.price,
    status: row.status,
    cancelledAt: row.cancelledAt,
  };
}

export class DrizzleBookingRepository implements BookingRepository {
  async create(input: {
    id: string;
    courtId: string;
    userId: string;
    startsAt: Date;
    endsAt: Date;
    price: number;
  }): Promise<Booking> {
    try {
      const [row] = await db
        .insert(bookings)
        .values({
          id: input.id,
          courtId: input.courtId,
          userId: input.userId,
          startsAt: input.startsAt,
          endsAt: input.endsAt,
          price: input.price,
          status: "confirmed",
        })
        .returning();
      return toDomain(row!);
    } catch (err) {
      if (hasUniqueViolationCode(err)) {
        throw new SlotTakenError();
      }
      throw err;
    }
  }

  async findById(id: string): Promise<Booking | null> {
    const [row] = await db.select().from(bookings).where(eq(bookings.id, id));
    return row ? toDomain(row) : null;
  }

  async findFutureConfirmedByCourtId(
    courtId: string,
    after: Date,
  ): Promise<Booking[]> {
    const rows = await db
      .select()
      .from(bookings)
      .where(
        and(
          eq(bookings.courtId, courtId),
          eq(bookings.status, "confirmed"),
          gt(bookings.startsAt, after),
        ),
      );
    return rows.map(toDomain);
  }

  async findConfirmedByCourtIdInRange(
    courtId: string,
    start: Date,
    end: Date,
  ): Promise<Booking[]> {
    const rows = await db
      .select()
      .from(bookings)
      .where(
        and(
          eq(bookings.courtId, courtId),
          eq(bookings.status, "confirmed"),
          gte(bookings.startsAt, start),
          lt(bookings.startsAt, end),
        ),
      );
    return rows.map(toDomain);
  }

  async cancelFutureByCourtId(
    courtId: string,
    after: Date,
    status: "cancelled_by_club",
  ): Promise<number> {
    const rows = await db
      .update(bookings)
      .set({ status, cancelledAt: new Date() })
      .where(
        and(
          eq(bookings.courtId, courtId),
          eq(bookings.status, "confirmed"),
          gt(bookings.startsAt, after),
        ),
      )
      .returning({ id: bookings.id });
    return rows.length;
  }

  async cancel(
    id: string,
    status: "cancelled_by_player",
    cancelledAt: Date,
  ): Promise<void> {
    await db.update(bookings).set({ status, cancelledAt }).where(eq(bookings.id, id));
  }

  async findByUserId(userId: string): Promise<Booking[]> {
    const rows = await db.select().from(bookings).where(eq(bookings.userId, userId));
    return rows.map(toDomain);
  }
}
