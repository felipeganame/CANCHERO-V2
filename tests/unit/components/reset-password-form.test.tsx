import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ResetPasswordForm } from "@/app/reset-password/reset-password-form";

const resetPassword = vi.fn();

vi.mock("@/lib/auth-client", () => ({
  resetPassword: (...args: unknown[]) => resetPassword(...args),
}));

describe("ResetPasswordForm", () => {
  afterEach(() => {
    resetPassword.mockReset();
  });

  it("muestra un error si no hay token en la URL", async () => {
    render(<ResetPasswordForm token={null} />);

    fireEvent.change(screen.getByLabelText("Contraseña nueva"), {
      target: { value: "nuevaPass123" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Guardar contraseña" }));

    expect(
      await screen.findByText(/El link no es válido o ya expiró/i),
    ).toBeInTheDocument();
    expect(resetPassword).not.toHaveBeenCalled();
  });

  it("llama a resetPassword con el token y la nueva contraseña", async () => {
    resetPassword.mockResolvedValue({ error: null });
    render(<ResetPasswordForm token="abc123" />);

    fireEvent.change(screen.getByLabelText("Contraseña nueva"), {
      target: { value: "nuevaPass123" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Guardar contraseña" }));

    await vi.waitFor(() => {
      expect(resetPassword).toHaveBeenCalledWith({
        newPassword: "nuevaPass123",
        token: "abc123",
      });
    });
    expect(
      await screen.findByText(/Contraseña actualizada/i),
    ).toBeInTheDocument();
  });

  it("muestra un error cuando el token ya expiro", async () => {
    resetPassword.mockResolvedValue({
      error: { message: "El link expiró, pedí uno nuevo" },
    });
    render(<ResetPasswordForm token="viejo" />);

    fireEvent.change(screen.getByLabelText("Contraseña nueva"), {
      target: { value: "nuevaPass123" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Guardar contraseña" }));

    expect(
      await screen.findByText(/El link expiró, pedí uno nuevo/i),
    ).toBeInTheDocument();
  });
});
