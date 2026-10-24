import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { BuscarResults } from "@/app/buscar/buscar-results";

const clubs = [
  {
    club: {
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
    },
    courts: [
      {
        id: "court-1",
        clubId: "club-1",
        name: "Cancha 1",
        sport: "futbol5" as const,
        pricePerSlot: 30000,
        active: true,
      },
    ],
  },
];

function baseProps() {
  return {
    clubs,
    errorMessage: null,
    deporte: "futbol5",
    ciudad: "Cordoba",
    fecha: "2026-10-25",
    sportLabel: "Fútbol 5",
  };
}

describe("BuscarResults", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("muestra el mensaje de error cuando la busqueda falla", () => {
    render(<BuscarResults {...baseProps()} clubs={[]} errorMessage="No pudimos buscar" />);
    expect(screen.getAllByText("No pudimos buscar").length).toBeGreaterThan(0);
  });

  it("muestra el estado vacio cuando no hay clubes", () => {
    render(<BuscarResults {...baseProps()} clubs={[]} />);
    expect(screen.getByText("No encontramos canchas libres")).toBeInTheDocument();
  });

  it("muestra la tarjeta de un club con sus datos", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: async () => ({ grid: [{ slots: [{ startsAt: "2026-10-26T00:00:00.000Z", free: true }] }] }),
        } as Response),
      ),
    );

    render(<BuscarResults {...baseProps()} />);

    expect(screen.getByTestId("club-card-club-1")).toBeInTheDocument();
    expect(screen.getByText("Club Uno")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Ver turnos/i })).toHaveAttribute(
      "href",
      "/clubes/club-1?fecha=2026-10-25",
    );
  });
});
