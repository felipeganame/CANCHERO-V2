import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { LoginForm } from "@/app/login/login-form";

const signInEmail = vi.fn();

vi.mock("@/lib/auth-client", () => ({
  signIn: {
    email: (...args: unknown[]) => signInEmail(...args),
  },
}));

describe("LoginForm", () => {
  afterEach(() => {
    signInEmail.mockReset();
  });

  it("muestra un error claro cuando la cuenta todavia no confirmo el email (403)", async () => {
    signInEmail.mockResolvedValue({ error: { status: 403 } });
    render(<LoginForm callbackURL="/" />);

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "a@test.com" },
    });
    fireEvent.change(screen.getByLabelText("Contraseña"), {
      target: { value: "x" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Entrar" }));

    expect(
      await screen.findByText(/Todavía no confirmaste tu cuenta/i),
    ).toBeInTheDocument();
  });

  it("muestra el mensaje de error del servidor ante credenciales invalidas", async () => {
    signInEmail.mockResolvedValue({
      error: { status: 401, message: "Email o contraseña incorrectos" },
    });
    render(<LoginForm callbackURL="/" />);

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "a@test.com" },
    });
    fireEvent.change(screen.getByLabelText("Contraseña"), {
      target: { value: "mal" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Entrar" }));

    expect(
      await screen.findByText(/Email o contraseña incorrectos/i),
    ).toBeInTheDocument();
  });

  it("llama a signIn.email con los datos del formulario y navega al callbackURL si el login es correcto", async () => {
    signInEmail.mockResolvedValue({ error: null });
    const assign = vi.fn();
    vi.stubGlobal("location", { ...window.location, assign });

    render(<LoginForm callbackURL="/reservar?cancha=1" />);

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "a@test.com" },
    });
    fireEvent.change(screen.getByLabelText("Contraseña"), {
      target: { value: "secreta123" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Entrar" }));

    await vi.waitFor(() => {
      expect(signInEmail).toHaveBeenCalledWith({
        email: "a@test.com",
        password: "secreta123",
      });
    });
    await vi.waitFor(() => {
      expect(assign).toHaveBeenCalledWith("/reservar?cancha=1");
    });

    vi.unstubAllGlobals();
  });

  it("tiene links a registro y a recuperar contraseña", () => {
    render(<LoginForm callbackURL="/reservar?cancha=1" />);

    expect(screen.getByRole("link", { name: /Registrate/i })).toHaveAttribute(
      "href",
      "/register?next=%2Freservar%3Fcancha%3D1",
    );
    expect(
      screen.getByRole("link", { name: /Olvidaste tu contraseña/i }),
    ).toHaveAttribute("href", "/forgot-password");
  });
});
