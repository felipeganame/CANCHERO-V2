import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { SiteHeader } from "@/components/site-header";

const useSessionMock = vi.fn();

vi.mock("@/lib/auth-client", () => ({
  useSession: () => useSessionMock(),
  signOut: vi.fn(),
}));

describe("SiteHeader", () => {
  afterEach(() => {
    useSessionMock.mockReset();
  });

  it("muestra 'Iniciar sesión' cuando no hay sesion", () => {
    useSessionMock.mockReturnValue({ data: null, isPending: false });
    render(<SiteHeader />);
    expect(screen.getByRole("link", { name: "Iniciar sesión" })).toBeInTheDocument();
  });

  it("muestra el nombre del usuario y 'Mis reservas' cuando hay sesion", () => {
    useSessionMock.mockReturnValue({
      data: { user: { name: "Jugador Uno", role: "player" } },
      isPending: false,
    });
    render(<SiteHeader />);
    expect(screen.getByText("Jugador Uno")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Mis reservas" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Panel" })).not.toBeInTheDocument();
  });

  it("muestra el link 'Panel' solo para club_admin", () => {
    useSessionMock.mockReturnValue({
      data: { user: { name: "Admin Uno", role: "club_admin" } },
      isPending: false,
    });
    render(<SiteHeader />);
    expect(screen.getByRole("link", { name: "Panel" })).toBeInTheDocument();
  });
});
