import Link from "next/link";
import { Search } from "lucide-react";

const SPORTS = [
  { value: "futbol5", label: "Fútbol 5" },
  { value: "futbol7", label: "Fútbol 7" },
  { value: "padel", label: "Pádel" },
  { value: "tenis", label: "Tenis" },
] as const;

function todayLocalDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function HomePage() {
  const today = todayLocalDate();

  return (
    <main className="bg-ground">
      <section className="px-4 pt-6 sm:px-6">
        <div className="mx-auto max-w-6xl rounded-3xl bg-bordo px-6 py-10 sm:px-10 sm:py-16">
          <p className="mb-5 inline-flex items-center gap-2 rounded-full bg-bordo-mid px-3.5 py-2 text-sm font-semibold text-naranja-soft">
            <span className="h-2 w-2 rounded-full bg-naranja" aria-hidden="true" />
            Turnos en tiempo real
          </p>
          <h1 className="max-w-2xl text-[2.5rem] font-extrabold leading-[0.98] tracking-tight text-white sm:text-6xl">
            Encontrá cancha libre.{" "}
            <span className="text-naranja">Reservá en dos clics.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-bordo-soft">
            Mirá qué canchas están disponibles, a qué hora y cuánto salen, en
            todos los complejos de tu ciudad. Sin escribirle a nadie por
            WhatsApp.
          </p>

          <form
            action="/buscar"
            role="search"
            aria-label="Buscar canchas"
            className="mt-10 flex flex-wrap gap-2 rounded-3xl bg-white p-2.5"
          >
            <label className="flex min-w-[150px] flex-1 flex-col gap-1 rounded-2xl bg-panel px-4 py-2.5">
              <span className="text-xs font-bold uppercase tracking-wide text-muted">
                Deporte
              </span>
              <select
                name="deporte"
                defaultValue="futbol5"
                className="min-h-7 border-0 bg-transparent text-base font-semibold text-ink focus:outline-none"
              >
                {SPORTS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex min-w-[150px] flex-1 flex-col gap-1 rounded-2xl bg-panel px-4 py-2.5">
              <span className="text-xs font-bold uppercase tracking-wide text-muted">
                Ciudad
              </span>
              <input
                type="text"
                name="ciudad"
                defaultValue="Córdoba"
                className="min-h-7 border-0 bg-transparent text-base font-semibold text-ink focus:outline-none"
              />
            </label>

            <label className="flex min-w-[150px] flex-1 flex-col gap-1 rounded-2xl bg-panel px-4 py-2.5">
              <span className="text-xs font-bold uppercase tracking-wide text-muted">
                Fecha
              </span>
              <input
                type="date"
                name="fecha"
                defaultValue={today}
                className="min-h-7 border-0 bg-transparent text-base font-semibold text-ink focus:outline-none"
              />
            </label>

            <button
              type="submit"
              className="inline-flex min-h-11 flex-none items-center justify-center gap-2 rounded-xl bg-naranja px-7 font-extrabold text-[#2A0D13] hover:bg-naranja-strong"
            >
              <Search className="h-5 w-5" aria-hidden="true" />
              Buscar canchas
            </button>
          </form>

          <div className="mt-6 flex flex-wrap items-center gap-2">
            <span className="mr-1 text-sm text-bordo-soft">Populares:</span>
            {SPORTS.map((s) => (
              <Link
                key={s.value}
                href={`/buscar?deporte=${s.value}&ciudad=Córdoba&fecha=${today}`}
                className="inline-flex min-h-9 items-center rounded-full border border-[#A85A68] px-3.5 text-sm font-semibold text-white no-underline"
              >
                {s.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section
        aria-labelledby="como"
        className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24"
      >
        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-naranja-text">
          Para jugadores
        </p>
        <h2
          id="como"
          className="mb-10 max-w-2xl text-3xl font-extrabold leading-tight tracking-tight sm:text-5xl"
        >
          Del grupo de WhatsApp a la cancha, en un minuto.
        </h2>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          {[
            {
              n: "01",
              title: "Buscá",
              body: "Elegí deporte, ciudad y fecha. Ves al instante qué canchas hay libres y cuánto salen.",
            },
            {
              n: "02",
              title: "Elegí tu turno",
              body: "Compará horarios y precios de cada complejo, con su ubicación en el mapa.",
            },
            {
              n: "03",
              title: "Reservá con Google",
              body: "Entrás con tu cuenta y listo. Si al final no podés ir, la cancelás desde Mis reservas.",
            },
          ].map((step) => (
            <div
              key={step.n}
              className="rounded-3xl border border-line bg-white p-7"
            >
              <p className="text-4xl font-extrabold leading-none text-naranja">
                {step.n}
              </p>
              <h3 className="mt-4 mb-2 text-xl font-bold">{step.title}</h3>
              <p className="text-base leading-relaxed text-muted">
                {step.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="clubes" className="px-4 pb-6 sm:px-6">
        <div className="mx-auto max-w-6xl rounded-3xl bg-ink px-6 py-10 sm:px-10 sm:py-16">
          <p className="mb-3 text-xs font-bold uppercase tracking-wide text-naranja">
            Para complejos
          </p>
          <h2
            id="clubes"
            className="max-w-xl text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl"
          >
            Dejá de anotar turnos en un cuaderno.
          </h2>
          <p className="mt-5 mb-8 max-w-lg text-lg leading-relaxed text-[#D6CDCF]">
            Cargás tus canchas una vez y los jugadores reservan solos. Vos ves
            la agenda del día desde un panel.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/panel"
              className="inline-flex min-h-11 items-center rounded-full bg-naranja px-6 font-extrabold text-[#2A0D13] no-underline"
            >
              Sumar mi club
            </Link>
            <Link
              href="/panel"
              className="inline-flex min-h-11 items-center rounded-full border border-[#6E6265] px-6 font-bold text-white no-underline"
            >
              Ver el panel
            </Link>
          </div>
        </div>
      </section>

      <footer className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-6 text-sm text-muted sm:px-6">
        <span className="text-lg font-extrabold text-bordo">canchero</span>
        <nav aria-label="Legal" className="flex flex-wrap gap-5">
          <a href="#" className="text-muted">
            Términos
          </a>
          <a href="#" className="text-muted">
            Privacidad
          </a>
          <a href="#" className="text-muted">
            Contacto
          </a>
        </nav>
        <span>© 2026 Canchero</span>
      </footer>
    </main>
  );
}
