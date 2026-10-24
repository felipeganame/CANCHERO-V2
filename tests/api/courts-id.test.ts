import { describe, it, expect, vi } from "vitest";
import { NextRequest } from "next/server";

const courtsStore = new Map<string, { id: string; clubId: string }>();
const clubsStore = new Map<string, { id: string; name: string }>();

vi.mock("@/server/repositories/drizzle-court-repository", () => ({
  DrizzleCourtRepository: class {
    async findById(id: string) {
      return courtsStore.get(id) ?? null;
    }
  },
}));
vi.mock("@/server/repositories/drizzle-club-repository", () => ({
  DrizzleClubRepository: class {
    async findById(id: string) {
      return clubsStore.get(id) ?? null;
    }
  },
}));

import { GET } from "@/app/api/courts/[id]/route";

describe("GET /api/courts/:id", () => {
  it("CP-200 responde 404 si la cancha no existe", async () => {
    const res = await GET(new NextRequest("http://localhost/api/courts/x"), {
      params: Promise.resolve({ id: "no-existe" }),
    });
    expect(res.status).toBe(404);
  });

  it("CP-201 devuelve cancha y club", async () => {
    courtsStore.set("court-1", { id: "court-1", clubId: "club-1" });
    clubsStore.set("club-1", { id: "club-1", name: "Club Uno" });

    const res = await GET(new NextRequest("http://localhost/api/courts/court-1"), {
      params: Promise.resolve({ id: "court-1" }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.club.name).toBe("Club Uno");
  });
});
