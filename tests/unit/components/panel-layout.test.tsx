import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next/headers", () => ({
  headers: async () => new Map(),
}));

const getSession = vi.fn();
vi.mock("@/integrations/auth", () => ({
  auth: { api: { getSession: (...args: unknown[]) => getSession(...args) } },
}));

const findClubIdByAdminUserId = vi.fn();
vi.mock("@/server/repositories/drizzle-club-admin-repository", () => ({
  findClubIdByAdminUserId: (...args: unknown[]) => findClubIdByAdminUserId(...args),
}));

vi.mock("@/server/repositories/drizzle-club-repository", () => ({
  DrizzleClubRepository: class {
    async findById(id: string) {
      return { id, name: "Club Uno" };
    }
  },
}));

const redirectMock = vi.fn((path: string) => {
  throw new Error(`NEXT_REDIRECT:${path}`);
});
vi.mock("next/navigation", () => ({
  redirect: (path: string) => redirectMock(path),
}));

import PanelLayout from "@/app/panel/layout";

describe("PanelLayout (server)", () => {
  beforeEach(() => {
    getSession.mockReset();
    findClubIdByAdminUserId.mockReset();
    redirectMock.mockClear();
  });

  it("redirige a / sin sesion", async () => {
    getSession.mockResolvedValue(null);
    await expect(
      PanelLayout({ children: <div /> }),
    ).rejects.toThrow("NEXT_REDIRECT:/");
  });

  it("[RN-08] redirige a / si no administra ningun club", async () => {
    getSession.mockResolvedValue({ user: { id: "user-1" } });
    findClubIdByAdminUserId.mockResolvedValue(null);
    await expect(
      PanelLayout({ children: <div /> }),
    ).rejects.toThrow("NEXT_REDIRECT:/");
  });

  it("renderiza el sidebar con el nombre del club para un admin valido", async () => {
    getSession.mockResolvedValue({ user: { id: "admin-1" } });
    findClubIdByAdminUserId.mockResolvedValue("club-1");

    const element = await PanelLayout({ children: <div>contenido</div> });
    render(element);

    expect(screen.getByText("Club Uno")).toBeInTheDocument();
    expect(screen.getByText("contenido")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Hoy/i })).toBeInTheDocument();
  });
});
