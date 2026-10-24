import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next/headers", () => ({
  headers: async () => new Map([["host", "localhost:3000"]]),
}));

import ClubPage from "@/app/clubes/[slug]/page";

describe("ClubPage (server)", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("muestra el estado 404 cuando el club no existe", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.resolve({ status: 404, ok: false, json: async () => ({}) } as Response)),
    );

    const element = await ClubPage({
      params: Promise.resolve({ slug: "no-existe" }),
      searchParams: Promise.resolve({}),
    });
    render(element);

    expect(screen.getByText("No encontramos este club")).toBeInTheDocument();
  });

  it("muestra un error generico cuando la API falla", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.resolve({ status: 500, ok: false, json: async () => ({}) } as Response)),
    );

    const element = await ClubPage({
      params: Promise.resolve({ slug: "club-1" }),
      searchParams: Promise.resolve({}),
    });
    render(element);

    expect(screen.getByText("Ocurrió un error")).toBeInTheDocument();
  });

  it("renderiza el ClubView con los datos de la API", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve({
          status: 200,
          ok: true,
          json: async () => ({
            club: {
              id: "club-1",
              slug: "club-1",
              name: "Club Uno",
              city: "Cordoba",
              barrio: null,
              lat: 0,
              lng: 0,
              openHour: 9,
              closeHour: 24,
              slotMinutes: 60,
            },
            grid: [],
          }),
        } as Response),
      ),
    );

    const element = await ClubPage({
      params: Promise.resolve({ slug: "club-1" }),
      searchParams: Promise.resolve({ fecha: "2026-10-26" }),
    });
    render(element);

    expect(screen.getByRole("heading", { name: "Club Uno" })).toBeInTheDocument();
  });
});
