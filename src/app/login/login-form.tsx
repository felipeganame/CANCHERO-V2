"use client";

import { useState } from "react";
import Link from "next/link";
import { signIn } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";

// Google OAuth: comentado hasta tener credenciales de Google Cloud
// Console configuradas (ver src/integrations/auth/index.ts).
// import { signIn as signInSocial } from "@/lib/auth-client";
// async function handleGoogleLogin(callbackURL: string) {
//   await signInSocial.social({ provider: "google", callbackURL });
// }

export function LoginForm({ callbackURL }: { callbackURL: string }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const { error: signInError } = await signIn.email({ email, password });
    setSubmitting(false);
    if (signInError) {
      if (signInError.status === 403) {
        setError("Todavía no confirmaste tu cuenta. Revisá tu email.");
      } else {
        setError(signInError.message ?? "No se pudo iniciar sesión.");
      }
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
        Entrá con tu email y contraseña para reservar y ver tus turnos.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
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
        {error && (
          <p className="text-sm font-semibold text-danger">{error}</p>
        )}
        <Link
          href="/forgot-password"
          className="self-start text-sm font-semibold text-bordo no-underline hover:underline"
        >
          ¿Olvidaste tu contraseña?
        </Link>
        <Button type="submit" variant="confirm" disabled={submitting}>
          {submitting ? "Entrando…" : "Entrar"}
        </Button>
      </form>

      {/*
        Google OAuth: comentado hasta tener credenciales configuradas.
        <Button variant="primary" className="w-full mt-4" onClick={() => handleGoogleLogin(callbackURL)}>
          Continuar con Google
        </Button>
      */}

      <p className="mt-8 text-center text-sm text-muted">
        ¿No tenés cuenta?{" "}
        <Link
          href={`/register?next=${encodeURIComponent(callbackURL)}`}
          className="font-semibold text-bordo no-underline hover:underline"
        >
          Registrate
        </Link>
      </p>
    </div>
  );
}
