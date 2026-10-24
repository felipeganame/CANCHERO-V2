"use client";

import { useState } from "react";
import { resetPassword } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";

export function ResetPasswordForm({ token }: { token: string | null }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) {
      setError("El link no es válido o ya expiró. Pedí uno nuevo.");
      return;
    }
    setSubmitting(true);
    setError(null);
    const { error: resetError } = await resetPassword({ newPassword: password, token });
    setSubmitting(false);
    if (resetError) {
      setError(resetError.message ?? "No se pudo restablecer la contraseña.");
      return;
    }
    setDone(true);
  }

  if (done) {
    return (
      <div className="mx-auto max-w-sm px-4 py-16 text-center">
        <h1 className="mb-2 text-3xl font-extrabold tracking-tight">
          Contraseña actualizada
        </h1>
        <p className="text-sm text-muted">
          Ya podés iniciar sesión con tu nueva contraseña.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-sm px-4 py-16">
      <h1 className="mb-2 text-3xl font-extrabold tracking-tight">
        Elegí una nueva contraseña
      </h1>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3">
        <label className="flex flex-col gap-1">
          <span className="text-sm font-bold">Contraseña nueva</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={8}
            className="min-h-11 rounded-xl border border-line px-3.5 text-base"
            required
          />
        </label>
        {error && (
          <p className="text-sm font-semibold text-danger">{error}</p>
        )}
        <Button type="submit" variant="confirm" disabled={submitting}>
          {submitting ? "Guardando…" : "Guardar contraseña"}
        </Button>
      </form>
    </div>
  );
}
