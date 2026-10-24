"use client";

import { useState } from "react";
import Link from "next/link";
import { requestPasswordReset } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    await requestPasswordReset({ email, redirectTo: "/reset-password" });
    setSubmitting(false);
    // Siempre mostramos el mismo mensaje, exista o no la cuenta,
    // para no filtrar qué emails están registrados.
    setDone(true);
  }

  if (done) {
    return (
      <div className="mx-auto max-w-sm px-4 py-16 text-center">
        <h1 className="mb-2 text-3xl font-extrabold tracking-tight">
          Revisá tu email
        </h1>
        <p className="text-sm text-muted">
          Si <strong>{email}</strong> tiene una cuenta en Canchero, te
          mandamos un link para restablecer tu contraseña.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-sm px-4 py-16">
      <h1 className="mb-2 text-3xl font-extrabold tracking-tight">
        Recuperar contraseña
      </h1>
      <p className="mb-8 text-sm text-muted">
        Te mandamos un link para elegir una contraseña nueva.
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
        <Button type="submit" variant="confirm" disabled={submitting}>
          {submitting ? "Enviando…" : "Enviar link"}
        </Button>
      </form>

      <p className="mt-8 text-center text-sm">
        <Link href="/login" className="font-semibold text-bordo no-underline hover:underline">
          Volver a iniciar sesión
        </Link>
      </p>
    </div>
  );
}
