import { eq } from "drizzle-orm";
import { db } from "@/server/db/client";
import { courts } from "@/server/db/schema";
import type { Court, CourtRepository } from "./types";

function toDomain(row: typeof courts.$inferSelect): Court {
  return {
    id: row.id,
    clubId: row.clubId,
    name: row.name,
    sport: row.sport,
    pricePerSlot: row.pricePerSlot,
    active: row.active,
  };
}

export class DrizzleCourtRepository implements CourtRepository {
  async findById(id: string): Promise<Court | null> {
    const [row] = await db.select().from(courts).where(eq(courts.id, id));
    return row ? toDomain(row) : null;
  }

  async findByClubId(clubId: string): Promise<Court[]> {
    const rows = await db.select().from(courts).where(eq(courts.clubId, clubId));
    return rows.map(toDomain);
  }

  async setActive(id: string, active: boolean): Promise<void> {
    await db.update(courts).set({ active }).where(eq(courts.id, id));
  }

  async setPrice(id: string, pricePerSlot: number): Promise<void> {
    await db.update(courts).set({ pricePerSlot }).where(eq(courts.id, id));
  }

  async create(input: {
    id: string;
    clubId: string;
    name: string;
    sport: Court["sport"];
    pricePerSlot: number;
  }): Promise<Court> {
    const [row] = await db
      .insert(courts)
      .values({
        id: input.id,
        clubId: input.clubId,
        name: input.name,
        sport: input.sport,
        pricePerSlot: input.pricePerSlot,
        active: true,
      })
      .returning();
    return toDomain(row!);
  }
}
