"use client";

import Link from "next/link";
import { useSession, signOut } from "@/lib/auth-client";

export function SiteHeader() {
  const { data: session, isPending } = useSession();
  const user = session?.user as { name?: string; role?: string } | undefined;

  return (
    <header className="sticky top-0 z-10 border-b border-line bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link
          href="/"
          className="text-xl font-extrabold tracking-tight text-bordo"
        >
          Canchero
        </Link>
        <nav className="flex items-center gap-4 text-sm font-semibold text-ink">
          <Link href="/buscar" className="hover:text-bordo">
            Buscar
          </Link>

          {isPending ? null : user ? (
            <>
              {user.role === "club_admin" && (
                <Link href="/panel" className="hover:text-bordo">
                  Panel
                </Link>
              )}
              <Link href="/mis-reservas" className="hover:text-bordo">
                Mis reservas
              </Link>
              <span className="text-muted">{user.name}</span>
              <button
                type="button"
                onClick={() => signOut({ fetchOptions: { onSuccess: () => window.location.assign("/") } })}
                className="min-h-9 rounded-full border border-line px-3.5 font-semibold text-ink hover:border-bordo"
              >
                Salir
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="inline-flex min-h-9 items-center rounded-full bg-bordo px-4 font-bold text-white no-underline"
            >
              Iniciar sesión
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
