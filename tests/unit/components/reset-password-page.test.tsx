import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import ResetPasswordPage from "@/app/reset-password/page";

describe("ResetPasswordPage", () => {
  it("renderiza el formulario con el token de la URL", async () => {
    const element = await ResetPasswordPage({
      searchParams: Promise.resolve({ token: "abc123" }),
    });
    render(element);
    expect(
      screen.getByRole("heading", { name: /Elegí una nueva contraseña/i }),
    ).toBeInTheDocument();
  });

  it("renderiza el formulario sin token cuando no esta presente", async () => {
    const element = await ResetPasswordPage({
      searchParams: Promise.resolve({}),
    });
    render(element);
    expect(
      screen.getByRole("heading", { name: /Elegí una nueva contraseña/i }),
    ).toBeInTheDocument();
  });
});
