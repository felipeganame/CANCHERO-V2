import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import LoginPage from "@/app/login/page";

describe("LoginPage", () => {
  it("renderiza el formulario de login con callbackURL por defecto", async () => {
    const element = await LoginPage({ searchParams: Promise.resolve({}) });
    render(element);
    expect(
      screen.getByRole("heading", { name: "Iniciar sesión" }),
    ).toBeInTheDocument();
  });

  it("usa el ?next= como callbackURL cuando esta presente", async () => {
    const element = await LoginPage({
      searchParams: Promise.resolve({ next: "/reservar?cancha=1" }),
    });
    render(element);
    expect(
      screen.getByRole("button", { name: /Continuar con Google/i }),
    ).toBeInTheDocument();
  });
});
