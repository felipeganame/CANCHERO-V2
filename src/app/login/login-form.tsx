"use client";

import { useState } from "react";
import { signIn } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";

export function LoginForm({ callbackURL }: { callbackURL: string }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [testLoginError, setTestLoginError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleGoogleLogin() {
    await signIn.social({ provider: "google", callbackURL });
  }

  async function handleTestLogin(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setTestLoginError(null);
    const { error } = await signIn.email({ email, password });
    setSubmitting(false);
    if (error) {
      setTestLoginError(
        error.status === 403
          ? "Login de prueba no disponible en este entorno."
          : error.message ?? "No se pudo iniciar sesión.",
      );
      return;
    }
    window.location.assign(callbackURL);
  }

  return (
    <div className="mx-auto max-w-sm px-4 py-16">
      <h1 className="mb-2 text-3xl font-extrabold tracking-tight">
        Iniciar sesión
      </h1>
      <p className="mb-8 text-sm text-muted">
        Entrá con tu cuenta de Google para reservar y ver tus turnos.
      </p>

      <Button variant="primary" className="w-full" onClick={handleGoogleLogin}>
        Continuar con Google
      </Button>

      <details className="mt-8 rounded-2xl border border-line p-4">
        <summary className="cursor-pointer text-sm font-bold text-muted">
          Login de prueba (solo test/preview)
        </summary>
        <form onSubmit={handleTestLogin} className="mt-4 flex flex-col gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-sm font-bold">Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="min-h-11 rounded-xl border border-line px-3.5 text-base"
              required
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm font-bold">Contraseña</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="min-h-11 rounded-xl border border-line px-3.5 text-base"
              required
            />
          </label>
          {testLoginError && (
            <p className="text-sm font-semibold text-danger">{testLoginError}</p>
          )}
          <Button type="submit" variant="confirm" disabled={submitting}>
            {submitting ? "Entrando…" : "Entrar"}
          </Button>
        </form>
      </details>
    </div>
  );
}
