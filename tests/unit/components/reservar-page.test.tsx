import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next/headers", () => ({
  headers: async () => new Map([["host", "localhost:3000"]]),
}));

const getSession = vi.fn();
vi.mock("@/integrations/auth", () => ({
  auth: { api: { getSession: (...args: unknown[]) => getSession(...args) } },
}));

import ReservarPage from "@/app/reservar/page";

describe("ReservarPage (server)", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    getSession.mockReset();
  });

  it("muestra error si faltan cancha o inicio en la URL", async () => {
    const element = await ReservarPage({ searchParams: Promise.resolve({}) });
    render(element);
    expect(screen.getByText("Falta información del turno")).toBeInTheDocument();
  });

  it("muestra error si el horario no es una fecha valida", async () => {
    const element = await ReservarPage({
      searchParams: Promise.resolve({ cancha: "court-1", inicio: "no-es-fecha" }),
    });
    render(element);
    expect(screen.getByText("Horario inválido")).toBeInTheDocument();
  });

  it("muestra 404 si la cancha no existe", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.resolve({ status: 404, ok: false, json: async () => ({}) } as Response)),
    );
    const element = await ReservarPage({
      searchParams: Promise.resolve({ cancha: "no-existe", inicio: "2026-10-26T00:00:00.000Z" }),
    });
    render(element);
    expect(screen.getByText("No encontramos esa cancha")).toBeInTheDocument();
  });

  it("renderiza ReservarView con sesion activa", async () => {
    getSession.mockResolvedValue({ user: { id: "user-1" } });
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve({
          status: 200,
          ok: true,
          json: async () => ({
            court: {
              id: "court-1",
              clubId: "club-1",
              name: "Cancha 1",
              sport: "futbol5",
              pricePerSlot: 30000,
              active: true,
            },
            club: { id: "club-1", slug: "club-1", name: "Club Uno", city: "Cordoba", barrio: null },
          }),
        } as Response),
      ),
    );

    const element = await ReservarPage({
      searchParams: Promise.resolve({ cancha: "court-1", inicio: "2026-10-26T00:00:00.000Z" }),
    });
    render(element);

    expect(screen.getByRole("heading", { name: /Revisá y confirmá/i })).toBeInTheDocument();
  });
});
