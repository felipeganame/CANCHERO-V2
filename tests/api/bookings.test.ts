import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const getSession = vi.fn();
vi.mock("@/integrations/auth", () => ({
  auth: { api: { getSession: (...args: unknown[]) => getSession(...args) } },
}));

const courtsStore = new Map<string, { id: string; clubId: string; active: boolean; pricePerSlot: number }>();
const clubsStore = new Map<string, { id: string; openHour: number; closeHour: number; slotMinutes: number }>();
const bookingsStore: Array<{ courtId: string; startsAt: Date; status: string }> = [];

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

vi.mock("@/server/repositories/drizzle-booking-repository", () => ({
  DrizzleBookingRepository: class {
    async create(input: { courtId: string; startsAt: Date }) {
      const conflict = bookingsStore.some(
        (b) =>
          b.courtId === input.courtId &&
          b.status === "confirmed" &&
          b.startsAt.getTime() === input.startsAt.getTime(),
      );
      if (conflict) {
        const { SlotTakenError } = await import("@/domain/errors");
        throw new SlotTakenError();
      }
      bookingsStore.push({ courtId: input.courtId, startsAt: input.startsAt, status: "confirmed" });
      return { id: "booking-1", status: "confirmed", ...input };
    }
  },
}));

import { POST } from "@/app/api/bookings/route";

function makeRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/bookings", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

describe("POST /api/bookings", () => {
  beforeEach(() => {
    getSession.mockReset();
    courtsStore.clear();
    clubsStore.clear();
    bookingsStore.length = 0;
    courtsStore.set("court-1", { id: "court-1", clubId: "club-1", active: true, pricePerSlot: 30000 });
    clubsStore.set("club-1", { id: "club-1", openHour: 9, closeHour: 24, slotMinutes: 60 });
  });

  it("CP-150 responde 401 si no hay sesion", async () => {
    getSession.mockResolvedValue(null);
    const res = await POST(makeRequest({ courtId: "court-1", startsAt: "2026-10-26T00:00:00.000Z" }));
    expect(res.status).toBe(401);
  });

  it("CP-151 responde 400 con datos invalidos", async () => {
    getSession.mockResolvedValue({ user: { id: "user-1" } });
    const res = await POST(makeRequest({ courtId: "" }));
    expect(res.status).toBe(400);
  });

  it("CP-152 responde 404 si la cancha no existe", async () => {
    getSession.mockResolvedValue({ user: { id: "user-1" } });
    const res = await POST(
      makeRequest({ courtId: "no-existe", startsAt: "2026-10-26T00:00:00.000Z" }),
    );
    expect(res.status).toBe(404);
  });

  it("CP-153 [RN-01] responde 201 la primera vez y 409 la segunda", async () => {
    getSession.mockResolvedValue({ user: { id: "user-1" } });
    const body = { courtId: "court-1", startsAt: "2026-10-26T00:00:00.000Z" };

    const first = await POST(makeRequest(body));
    expect(first.status).toBe(201);

    const second = await POST(makeRequest(body));
    expect(second.status).toBe(409);
  });
});
