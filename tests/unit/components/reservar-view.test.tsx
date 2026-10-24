import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ReservarView } from "@/app/reservar/reservar-view";

vi.mock("@/lib/auth-client", () => ({
  authClient: { signIn: { social: vi.fn() } },
}));

const court = {
  id: "court-1",
  clubId: "club-1",
  name: "Cancha 1",
  sport: "futbol5",
  pricePerSlot: 30000,
  active: true,
};
const club = {
  id: "club-1",
  slug: "club-1",
  name: "Club Uno",
  city: "Cordoba",
  barrio: "Centro",
};
const startsAt = "2026-10-26T00:00:00.000Z";

function renderView(isLoggedIn: boolean) {
  return render(
    <ReservarView
      court={court}
      club={club}
      startsAt={startsAt}
      isLoggedIn={isLoggedIn}
      currentUrl="http://localhost:3000/reservar?cancha=court-1&inicio=x"
    />,
  );
}

describe("ReservarView", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("muestra el paso de login cuando no hay sesion", () => {
    renderView(false);
    expect(
      screen.getByRole("heading", { name: /Ingresá para reservar/i }),
    ).toBeInTheDocument();
  });

  it("muestra el resumen y el boton de confirmar cuando hay sesion", () => {
    renderView(true);
    expect(
      screen.getByRole("heading", { name: /Revisá y confirmá/i }),
    ).toBeInTheDocument();
    expect(screen.getByText("Club Uno")).toBeInTheDocument();
    expect(screen.getByText("$ 30.000")).toBeInTheDocument();
  });

  it("CP-120 [RN-01] muestra 'turno ocupado' cuando la API responde 409", async () => {
    vi.mocked(fetch).mockResolvedValue({
      status: 409,
      json: async () => ({ error: "Ese turno se acaba de ocupar" }),
    } as Response);

    renderView(true);
    fireEvent.click(screen.getByRole("button", { name: /Confirmar reserva/i }));

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: /turno.*ocup/i }),
      ).toBeInTheDocument();
    });
  });

  it("muestra la confirmacion cuando la API responde 201", async () => {
    vi.mocked(fetch).mockResolvedValue({ status: 201 } as Response);

    renderView(true);
    fireEvent.click(screen.getByRole("button", { name: /Confirmar reserva/i }));

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: /Reserva confirmada/i }),
      ).toBeInTheDocument();
    });
  });

  it("muestra un mensaje de error generico ante una falla de red", async () => {
    vi.mocked(fetch).mockRejectedValue(new Error("network down"));

    renderView(true);
    fireEvent.click(screen.getByRole("button", { name: /Confirmar reserva/i }));

    await waitFor(() => {
      expect(screen.getByText(/No pudimos conectarnos/i)).toBeInTheDocument();
    });
  });
});
