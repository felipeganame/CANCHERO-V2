import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { LoginForm } from "@/app/login/login-form";

const signInSocial = vi.fn();
const signInEmail = vi.fn();

vi.mock("@/lib/auth-client", () => ({
  signIn: {
    social: (...args: unknown[]) => signInSocial(...args),
    email: (...args: unknown[]) => signInEmail(...args),
  },
}));

describe("LoginForm", () => {
  afterEach(() => {
    signInSocial.mockReset();
    signInEmail.mockReset();
  });

  it("el boton de Google llama a signIn.social con el callbackURL", () => {
    render(<LoginForm callbackURL="/reservar?cancha=1" />);
    fireEvent.click(screen.getByRole("button", { name: /Continuar con Google/i }));
    expect(signInSocial).toHaveBeenCalledWith({
      provider: "google",
      callbackURL: "/reservar?cancha=1",
    });
  });

  it("muestra un error claro cuando el login de prueba no esta habilitado (403)", async () => {
    signInEmail.mockResolvedValue({ error: { status: 403 } });
    render(<LoginForm callbackURL="/" />);

    fireEvent.click(screen.getByText(/Login de prueba/i));
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "a@test.com" },
    });
    fireEvent.change(screen.getByLabelText("Contraseña"), {
      target: { value: "x" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Entrar" }));

    expect(
      await screen.findByText(/Login de prueba no disponible en este entorno/i),
    ).toBeInTheDocument();
  });
});
