import { describe, it, expect, vi } from "vitest";
import { NextRequest } from "next/server";

const clubsStore = new Map<string, { id: string; slug: string; openHour: number; closeHour: number; slotMinutes: number }>();
const courtsByClub = new Map<string, Array<{ id: string; clubId: string; active: boolean }>>();

vi.mock("@/server/repositories/drizzle-club-repository", () => ({
  DrizzleClubRepository: class {
    async findBySlug(slug: string) {
      return [...clubsStore.values()].find((c) => c.slug === slug) ?? null;
    }
  },
}));
vi.mock("@/server/repositories/drizzle-court-repository", () => ({
  DrizzleCourtRepository: class {
    async findByClubId(clubId: string) {
      return courtsByClub.get(clubId) ?? [];
    }
  },
}));
vi.mock("@/server/repositories/drizzle-booking-repository", () => ({
  DrizzleBookingRepository: class {
    async findConfirmedByCourtIdInRange() {
      return [];
    }
  },
}));

import { GET } from "@/app/api/clubs/[slug]/availability/route";

describe("GET /api/clubs/:slug/availability", () => {
  it("CP-230 responde 400 con fecha invalida", async () => {
    const res = await GET(
      new NextRequest("http://localhost/api/clubs/club-1/availability?fecha=no"),
      { params: Promise.resolve({ slug: "club-1" }) },
    );
    expect(res.status).toBe(400);
  });

  it("CP-231 responde 404 si el club no existe", async () => {
    const res = await GET(
      new NextRequest("http://localhost/api/clubs/no-existe/availability?fecha=2026-10-26"),
      { params: Promise.resolve({ slug: "no-existe" }) },
    );
    expect(res.status).toBe(404);
  });

  it("CP-232 [RN-04] excluye canchas inactivas de la grilla", async () => {
    clubsStore.set("club-1", {
      id: "club-1",
      slug: "club-1",
      openHour: 9,
      closeHour: 24,
      slotMinutes: 60,
    });
    courtsByClub.set("club-1", [
      { id: "court-active", clubId: "club-1", active: true },
      { id: "court-inactive", clubId: "club-1", active: false },
    ]);

    const res = await GET(
      new NextRequest("http://localhost/api/clubs/club-1/availability?fecha=2026-10-26"),
      { params: Promise.resolve({ slug: "club-1" }) },
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.grid).toHaveLength(1);
    expect(body.grid[0].court.id).toBe("court-active");
  });
});
