import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import RegisterPage from "@/app/register/page";

describe("RegisterPage", () => {
  it("renderiza el formulario de registro con callbackURL por defecto", async () => {
    const element = await RegisterPage({ searchParams: Promise.resolve({}) });
    render(element);
    expect(
      screen.getByRole("heading", { name: "Crear cuenta" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Iniciar sesión/i })).toHaveAttribute(
      "href",
      "/login?next=%2F",
    );
  });

  it("usa el ?next= como callbackURL cuando esta presente", async () => {
    const element = await RegisterPage({
      searchParams: Promise.resolve({ next: "/reservar?cancha=1" }),
    });
    render(element);
    expect(screen.getByRole("link", { name: /Iniciar sesión/i })).toHaveAttribute(
      "href",
      "/login?next=%2Freservar%3Fcancha%3D1",
    );
  });
});
