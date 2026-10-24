import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const getSession = vi.fn();
vi.mock("@/integrations/auth", () => ({
  auth: { api: { getSession: (...args: unknown[]) => getSession(...args) } },
}));

const bookings = [
  { id: "b1", status: "confirmed", startsAt: new Date(Date.now() + 86_400_000) },
  { id: "b2", status: "confirmed", startsAt: new Date(Date.now() - 86_400_000) },
  { id: "b3", status: "cancelled_by_player", startsAt: new Date(Date.now() + 86_400_000) },
];

vi.mock("@/server/repositories/drizzle-booking-repository", () => ({
  DrizzleBookingRepository: class {
    async findByUserId() {
      return bookings;
    }
  },
}));

import { GET } from "@/app/api/me/bookings/route";

function makeRequest(estado?: string): NextRequest {
  const url = estado
    ? `http://localhost/api/me/bookings?estado=${estado}`
    : "http://localhost/api/me/bookings";
  return new NextRequest(url);
}

describe("GET /api/me/bookings", () => {
  beforeEach(() => getSession.mockReset());

  it("CP-210 responde 401 sin sesion", async () => {
    getSession.mockResolvedValue(null);
    const res = await GET(makeRequest());
    expect(res.status).toBe(401);
  });

  it("CP-211 filtra proximas: confirmadas y futuras", async () => {
    getSession.mockResolvedValue({ user: { id: "user-1" } });
    const res = await GET(makeRequest("proximas"));
    const body = await res.json();
    expect(body).toHaveLength(1);
    expect(body[0].id).toBe("b1");
  });

  it("CP-212 filtra canceladas", async () => {
    getSession.mockResolvedValue({ user: { id: "user-1" } });
    const res = await GET(makeRequest("canceladas"));
    const body = await res.json();
    expect(body).toHaveLength(1);
    expect(body[0].id).toBe("b3");
  });

  it("sin filtro devuelve todas", async () => {
    getSession.mockResolvedValue({ user: { id: "user-1" } });
    const res = await GET(makeRequest());
    const body = await res.json();
    expect(body).toHaveLength(3);
  });
});
