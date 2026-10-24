import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const getSession = vi.fn();
vi.mock("@/integrations/auth", () => ({
  auth: { api: { getSession: (...args: unknown[]) => getSession(...args) } },
}));

const bookingsStore = new Map<
  string,
  { id: string; userId: string; startsAt: Date; status: string }
>();

vi.mock("@/server/repositories/drizzle-booking-repository", () => ({
  DrizzleBookingRepository: class {
    async findById(id: string) {
      return bookingsStore.get(id) ?? null;
    }
    async cancel(id: string, status: string) {
      const b = bookingsStore.get(id);
      if (b) b.status = status;
    }
  },
}));

import { POST } from "@/app/api/bookings/[id]/cancel/route";

function makeRequest(): NextRequest {
  return new NextRequest("http://localhost/api/bookings/booking-1/cancel", {
    method: "POST",
  });
}

describe("POST /api/bookings/:id/cancel", () => {
  beforeEach(() => {
    getSession.mockReset();
    bookingsStore.clear();
    bookingsStore.set("booking-1", {
      id: "booking-1",
      userId: "owner",
      startsAt: new Date(Date.now() + 86_400_000),
      status: "confirmed",
    });
  });

  it("CP-160 responde 401 sin sesion", async () => {
    getSession.mockResolvedValue(null);
    const res = await POST(makeRequest(), { params: Promise.resolve({ id: "booking-1" }) });
    expect(res.status).toBe(401);
  });

  it("CP-161 [RN-08] responde 403 si no es el dueño de la reserva", async () => {
    getSession.mockResolvedValue({ user: { id: "intruder" } });
    const res = await POST(makeRequest(), { params: Promise.resolve({ id: "booking-1" }) });
    expect(res.status).toBe(403);
  });

  it("CP-162 [RN-07] cancela la reserva propia y responde ok", async () => {
    getSession.mockResolvedValue({ user: { id: "owner" } });
    const res = await POST(makeRequest(), { params: Promise.resolve({ id: "booking-1" }) });
    expect(res.status).toBe(200);
    expect(bookingsStore.get("booking-1")?.status).toBe("cancelled_by_player");
  });

  it("CP-163 responde 404 si la reserva no existe", async () => {
    getSession.mockResolvedValue({ user: { id: "owner" } });
    const res = await POST(makeRequest(), { params: Promise.resolve({ id: "no-existe" }) });
    expect(res.status).toBe(404);
  });
});
