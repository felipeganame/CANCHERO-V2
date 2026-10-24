import { describe, it, expect, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/server/repositories/drizzle-search-repository", () => ({
  DrizzleSearchRepository: class {
    async findClubsBySportAndCity() {
      return [];
    }
  },
}));
vi.mock("@/server/repositories/drizzle-booking-repository", () => ({
  DrizzleBookingRepository: class {},
}));

import { GET } from "@/app/api/search/route";

describe("GET /api/search", () => {
  it("CP-190 responde 400 con parametros invalidos", async () => {
    const res = await GET(
      new NextRequest("http://localhost/api/search?deporte=rugby&ciudad=&fecha=invalid"),
    );
    expect(res.status).toBe(400);
  });

  it("CP-191 responde 200 con parametros validos", async () => {
    const res = await GET(
      new NextRequest(
        "http://localhost/api/search?deporte=futbol5&ciudad=Cordoba&fecha=2026-10-26",
      ),
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([]);
  });
});
