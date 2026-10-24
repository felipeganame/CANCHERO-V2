"use client";

import { useState } from "react";
import Link from "next/link";
import { signUp } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";

export function RegisterForm({ callbackURL }: { callbackURL: string }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const { error: signUpError } = await signUp.email({
      name,
      email,
      password,
      callbackURL,
    });
    setSubmitting(false);
    if (signUpError) {
      setError(signUpError.message ?? "No se pudo crear la cuenta.");
      return;
    }
    setDone(true);
  }

  if (done) {
    return (
      <div className="mx-auto max-w-sm px-4 py-16 text-center">
        <h1 className="mb-2 text-3xl font-extrabold tracking-tight">
          ¡Ya casi!
        </h1>
        <p className="text-sm text-muted">
          Te mandamos un email a <strong>{email}</strong> para confirmar tu
          cuenta. Abrí el link que te enviamos para poder iniciar sesión.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-sm px-4 py-16">
      <h1 className="mb-2 text-3xl font-extrabold tracking-tight">
        Crear cuenta
      </h1>
      <p className="mb-8 text-sm text-muted">
        Registrate para reservar canchas y ver tus turnos.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1">
          <span className="text-sm font-bold">Nombre</span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="min-h-11 rounded-xl border border-line px-3.5 text-base"
            required
          />
        </label>
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
            minLength={8}
            className="min-h-11 rounded-xl border border-line px-3.5 text-base"
            required
          />
        </label>
        {error && (
          <p className="text-sm font-semibold text-danger">{error}</p>
        )}
        <Button type="submit" variant="confirm" disabled={submitting}>
          {submitting ? "Creando cuenta…" : "Crear cuenta"}
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-muted">
        ¿Ya tenés cuenta?{" "}
        <Link
          href={`/login?next=${encodeURIComponent(callbackURL)}`}
          className="font-semibold text-bordo no-underline hover:underline"
        >
          Iniciar sesión
        </Link>
      </p>
    </div>
  );
}
