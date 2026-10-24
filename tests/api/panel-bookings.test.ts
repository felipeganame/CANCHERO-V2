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

vi.mock("@/server/db/client", () => ({ db: {} }));

import { GET } from "@/app/api/panel/bookings/route";

describe("GET /api/panel/bookings", () => {
  beforeEach(() => {
    getSession.mockReset();
    findClubIdByAdminUserId.mockReset();
  });

  it("CP-240 responde 401 sin sesion", async () => {
    getSession.mockResolvedValue(null);
    const res = await GET(new NextRequest("http://localhost/api/panel/bookings"));
    expect(res.status).toBe(401);
  });

  it("CP-241 [RN-08] responde 403 si no administra ningun club", async () => {
    getSession.mockResolvedValue({ user: { id: "user-1" } });
    findClubIdByAdminUserId.mockResolvedValue(null);
    const res = await GET(new NextRequest("http://localhost/api/panel/bookings"));
    expect(res.status).toBe(403);
  });
});
