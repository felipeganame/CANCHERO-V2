import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const getSession = vi.fn();
vi.mock("@/integrations/auth", () => ({
  auth: { api: { getSession: (...args: unknown[]) => getSession(...args) } },
}));

const findClubIdByAdminUserId = vi.fn();
vi.mock("@/server/repositories/drizzle-club-admin-repository", () => ({
  findClubIdByAdminUserId: (...args: unknown[]) => findClubIdByAdminUserId(...args),
}));

const courtsStore = new Map<
  string,
  { id: string; clubId: string; active: boolean; pricePerSlot: number }
>();
vi.mock("@/server/repositories/drizzle-court-repository", () => ({
  DrizzleCourtRepository: class {
    async findById(id: string) {
      return courtsStore.get(id) ?? null;
    }
    async setActive(id: string, active: boolean) {
      const c = courtsStore.get(id);
      if (c) c.active = active;
    }
    async setPrice(id: string, price: number) {
      const c = courtsStore.get(id);
      if (c) c.pricePerSlot = price;
    }
  },
}));

const futureBookings = new Map<string, number>();
vi.mock("@/server/repositories/drizzle-booking-repository", () => ({
  DrizzleBookingRepository: class {
    async cancelFutureByCourtId(courtId: string) {
      return futureBookings.get(courtId) ?? 0;
    }
  },
}));

import { PATCH } from "@/app/api/panel/courts/[id]/route";

function makeRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/panel/courts/court-1", {
    method: "PATCH",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

describe("PATCH /api/panel/courts/:id", () => {
  beforeEach(() => {
    getSession.mockReset();
    findClubIdByAdminUserId.mockReset();
    courtsStore.clear();
    futureBookings.clear();
    courtsStore.set("court-1", { id: "court-1", clubId: "club-1", active: true, pricePerSlot: 30000 });
    getSession.mockResolvedValue({ user: { id: "admin-1" } });
    findClubIdByAdminUserId.mockResolvedValue("club-1");
  });

  it("CP-180 [RN-05] deshabilitar cancela las reservas futuras y devuelve el conteo", async () => {
    futureBookings.set("court-1", 3);
    const res = await PATCH(makeRequest({ active: false }), {
      params: Promise.resolve({ id: "court-1" }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.cancelledFutureBookings).toBe(3);
    expect(courtsStore.get("court-1")?.active).toBe(false);
  });

  it("CP-181 [RN-08] rechaza modificar una cancha de otro club", async () => {
    findClubIdByAdminUserId.mockResolvedValue("otro-club");
    const res = await PATCH(makeRequest({ active: true }), {
      params: Promise.resolve({ id: "court-1" }),
    });
    expect(res.status).toBe(403);
  });

  it("CP-182 [RN-06] rechaza un precio invalido", async () => {
    const res = await PATCH(makeRequest({ pricePerSlot: -5 }), {
      params: Promise.resolve({ id: "court-1" }),
    });
    expect(res.status).toBe(400);
  });

  it("CP-183 responde 404 si la cancha no existe", async () => {
    const res = await PATCH(makeRequest({ active: false }), {
      params: Promise.resolve({ id: "no-existe" }),
    });
    expect(res.status).toBe(404);
  });
});
