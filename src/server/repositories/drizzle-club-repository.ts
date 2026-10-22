import { eq } from "drizzle-orm";
import { db } from "@/server/db/client";
import { clubs } from "@/server/db/schema";
import type { Club, ClubRepository } from "./types";

function toDomain(row: typeof clubs.$inferSelect): Club {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    city: row.city,
    barrio: row.barrio,
    lat: row.lat,
    lng: row.lng,
    openHour: row.openHour,
    closeHour: row.closeHour,
    slotMinutes: row.slotMinutes,
  };
}

export class DrizzleClubRepository implements ClubRepository {
  async findById(id: string): Promise<Club | null> {
    const [row] = await db.select().from(clubs).where(eq(clubs.id, id));
    return row ? toDomain(row) : null;
  }

  async findBySlug(slug: string): Promise<Club | null> {
    const [row] = await db.select().from(clubs).where(eq(clubs.slug, slug));
    return row ? toDomain(row) : null;
  }
}
