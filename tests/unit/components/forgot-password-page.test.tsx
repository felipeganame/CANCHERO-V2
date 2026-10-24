import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ForgotPasswordPage from "@/app/forgot-password/page";

const requestPasswordReset = vi.fn();

vi.mock("@/lib/auth-client", () => ({
  requestPasswordReset: (...args: unknown[]) => requestPasswordReset(...args),
}));

describe("ForgotPasswordPage", () => {
  afterEach(() => {
    requestPasswordReset.mockReset();
  });

  it("llama a requestPasswordReset con el email y redirectTo a /reset-password", async () => {
    requestPasswordReset.mockResolvedValue({ error: null });
    render(<ForgotPasswordPage />);

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "a@test.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Enviar link/i }));

    await vi.waitFor(() => {
      expect(requestPasswordReset).toHaveBeenCalledWith({
        email: "a@test.com",
        redirectTo: "/reset-password",
      });
    });
  });

  it("muestra el mismo mensaje de exito exista o no la cuenta (anti enumeracion)", async () => {
    requestPasswordReset.mockResolvedValue({ error: null });
    render(<ForgotPasswordPage />);

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "noexiste@test.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Enviar link/i }));

    expect(await screen.findByText(/Revisá tu email/i)).toBeInTheDocument();
    expect(screen.getByText(/noexiste@test.com/)).toBeInTheDocument();
  });

  it("tiene un link para volver a iniciar sesion", () => {
    render(<ForgotPasswordPage />);
    expect(
      screen.getByRole("link", { name: /Volver a iniciar sesión/i }),
    ).toHaveAttribute("href", "/login");
  });
});
