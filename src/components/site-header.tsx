import Link from "next/link";

export function SiteHeader() {
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
          <Link href="/mis-reservas" className="hover:text-bordo">
            Mis reservas
          </Link>
        </nav>
      </div>
    </header>
  );
}
