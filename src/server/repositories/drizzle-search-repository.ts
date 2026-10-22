import { and, eq } from "drizzle-orm";
import { db } from "@/server/db/client";
import { clubs, courts } from "@/server/db/schema";
import type { ClubWithCourts, Court, SearchRepository } from "./types";

export class DrizzleSearchRepository implements SearchRepository {
  async findClubsBySportAndCity(
    sport: Court["sport"],
    city: string,
  ): Promise<ClubWithCourts[]> {
    const rows = await db
      .select({ club: clubs, court: courts })
      .from(clubs)
      .innerJoin(courts, eq(courts.clubId, clubs.id))
      .where(and(eq(clubs.city, city), eq(courts.sport, sport), eq(courts.active, true)));

    const byClub = new Map<string, ClubWithCourts>();
    for (const row of rows) {
      const existing = byClub.get(row.club.id);
      const court: Court = {
        id: row.court.id,
        clubId: row.court.clubId,
        name: row.court.name,
        sport: row.court.sport,
        pricePerSlot: row.court.pricePerSlot,
        active: row.court.active,
      };
      if (existing) {
        existing.courts.push(court);
      } else {
        byClub.set(row.club.id, {
          club: {
            id: row.club.id,
            slug: row.club.slug,
            name: row.club.name,
            city: row.club.city,
            barrio: row.club.barrio,
            lat: row.club.lat,
            lng: row.club.lng,
            openHour: row.club.openHour,
            closeHour: row.club.closeHour,
            slotMinutes: row.club.slotMinutes,
          },
          courts: [court],
        });
      }
    }

    return [...byClub.values()];
  }
}
