import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ClubView, type GridRow } from "@/app/clubes/[slug]/club-view";

const club = {
  id: "club-1",
  slug: "club-1",
  name: "Club Uno",
  city: "Cordoba",
  barrio: "Centro",
  lat: 0,
  lng: 0,
  openHour: 9,
  closeHour: 24,
  slotMinutes: 60,
};

describe("ClubView", () => {
  it("muestra el nombre del club y sus canchas con turnos", () => {
    const grid: GridRow[] = [
      {
        court: {
          id: "court-1",
          clubId: "club-1",
          name: "Cancha 1",
          sport: "futbol5",
          pricePerSlot: 30000,
          active: true,
        },
        slots: [
          { startsAt: "2026-10-26T00:00:00.000Z", free: true },
          { startsAt: "2026-10-26T01:00:00.000Z", free: false },
        ],
      },
    ];

    render(<ClubView club={club} grid={grid} fecha="2026-10-25" />);

    expect(screen.getByRole("heading", { name: "Club Uno" })).toBeInTheDocument();
    expect(screen.getByText("Cancha 1")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "21:00" })).toBeInTheDocument();
    expect(screen.getByText("22:00")).toBeInTheDocument();
  });

  it("muestra el estado vacio cuando el club no tiene canchas activas", () => {
    render(<ClubView club={club} grid={[]} fecha="2026-10-25" />);
    expect(
      screen.getByText("Este club no tiene canchas activas."),
    ).toBeInTheDocument();
  });

  it("el link de un turno libre apunta a /reservar con cancha e inicio", () => {
    const grid: GridRow[] = [
      {
        court: {
          id: "court-1",
          clubId: "club-1",
          name: "Cancha 1",
          sport: "futbol5",
          pricePerSlot: 30000,
          active: true,
        },
        slots: [{ startsAt: "2026-10-26T00:00:00.000Z", free: true }],
      },
    ];

    render(<ClubView club={club} grid={grid} fecha="2026-10-25" />);

    const link = screen.getByRole("link", { name: "21:00" });
    expect(link).toHaveAttribute(
      "href",
      "/reservar?cancha=court-1&inicio=2026-10-26T00%3A00%3A00.000Z",
    );
  });
});
