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

const courtsByClub = new Map<string, Array<{ id: string; clubId: string }>>();
vi.mock("@/server/repositories/drizzle-court-repository", () => ({
  DrizzleCourtRepository: class {
    async findByClubId(clubId: string) {
      return courtsByClub.get(clubId) ?? [];
    }
    async create(input: { clubId: string }) {
      return { id: "court-new", active: true, ...input };
    }
  },
}));

import { GET, POST } from "@/app/api/panel/courts/route";

function makeGetRequest(): NextRequest {
  return new NextRequest("http://localhost/api/panel/courts");
}

function makePostRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/panel/courts", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

describe("GET /api/panel/courts", () => {
  beforeEach(() => {
    getSession.mockReset();
    findClubIdByAdminUserId.mockReset();
    courtsByClub.clear();
    courtsByClub.set("club-1", [{ id: "court-1", clubId: "club-1" }]);
  });

  it("CP-170 responde 401 sin sesion", async () => {
    getSession.mockResolvedValue(null);
    const res = await GET(makeGetRequest());
    expect(res.status).toBe(401);
  });

  it("CP-171 [RN-08] responde 403 si no administra ningun club", async () => {
    getSession.mockResolvedValue({ user: { id: "user-1" } });
    findClubIdByAdminUserId.mockResolvedValue(null);
    const res = await GET(makeGetRequest());
    expect(res.status).toBe(403);
  });

  it("CP-172 devuelve las canchas del club del admin", async () => {
    getSession.mockResolvedValue({ user: { id: "admin-1" } });
    findClubIdByAdminUserId.mockResolvedValue("club-1");
    const res = await GET(makeGetRequest());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveLength(1);
  });
});

describe("POST /api/panel/courts", () => {
  beforeEach(() => {
    getSession.mockReset();
    findClubIdByAdminUserId.mockReset();
    getSession.mockResolvedValue({ user: { id: "admin-1" } });
    findClubIdByAdminUserId.mockResolvedValue("club-1");
  });

  it("CP-173 [RN-06] responde 400 con precio invalido", async () => {
    const res = await POST(
      makePostRequest({ name: "Cancha 1", sport: "futbol5", pricePerSlot: 0 }),
    );
    expect(res.status).toBe(400);
  });

  it("CP-174 crea la cancha con datos validos", async () => {
    const res = await POST(
      makePostRequest({ name: "Cancha 1", sport: "futbol5", pricePerSlot: 15000 }),
    );
    expect(res.status).toBe(201);
  });
});
