import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { RegisterForm } from "@/app/register/register-form";

const signUpEmail = vi.fn();

vi.mock("@/lib/auth-client", () => ({
  signUp: {
    email: (...args: unknown[]) => signUpEmail(...args),
  },
}));

describe("RegisterForm", () => {
  afterEach(() => {
    signUpEmail.mockReset();
  });

  it("llama a signUp.email con los datos del formulario y el callbackURL", async () => {
    signUpEmail.mockResolvedValue({ error: null });
    render(<RegisterForm callbackURL="/reservar?cancha=1" />);

    fireEvent.change(screen.getByLabelText("Nombre"), {
      target: { value: "Juana Pérez" },
    });
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "juana@test.com" },
    });
    fireEvent.change(screen.getByLabelText("Contraseña"), {
      target: { value: "secreta123" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Crear cuenta" }));

    await vi.waitFor(() => {
      expect(signUpEmail).toHaveBeenCalledWith({
        name: "Juana Pérez",
        email: "juana@test.com",
        password: "secreta123",
        callbackURL: "/reservar?cancha=1",
      });
    });
  });

  it("muestra el mensaje de revisa tu email cuando el registro es exitoso", async () => {
    signUpEmail.mockResolvedValue({ error: null });
    render(<RegisterForm callbackURL="/" />);

    fireEvent.change(screen.getByLabelText("Nombre"), {
      target: { value: "Juana" },
    });
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "juana@test.com" },
    });
    fireEvent.change(screen.getByLabelText("Contraseña"), {
      target: { value: "secreta123" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Crear cuenta" }));

    expect(await screen.findByText(/¡Ya casi!/i)).toBeInTheDocument();
    expect(screen.getByText(/juana@test.com/)).toBeInTheDocument();
  });

  it("muestra un error cuando el registro falla (ej: email ya existe)", async () => {
    signUpEmail.mockResolvedValue({
      error: { message: "Ya existe una cuenta con ese email" },
    });
    render(<RegisterForm callbackURL="/" />);

    fireEvent.change(screen.getByLabelText("Nombre"), {
      target: { value: "Juana" },
    });
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "juana@test.com" },
    });
    fireEvent.change(screen.getByLabelText("Contraseña"), {
      target: { value: "secreta123" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Crear cuenta" }));

    expect(
      await screen.findByText(/Ya existe una cuenta con ese email/i),
    ).toBeInTheDocument();
  });

  it("tiene un link a login con el callbackURL como next", () => {
    render(<RegisterForm callbackURL="/reservar?cancha=1" />);
    expect(
      screen.getByRole("link", { name: /Iniciar sesión/i }),
    ).toHaveAttribute("href", "/login?next=%2Freservar%3Fcancha%3D1");
  });
});
