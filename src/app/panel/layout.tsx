import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Clock, ListChecks, LayoutGrid } from "lucide-react";
import { auth } from "@/integrations/auth";
import { findClubIdByAdminUserId } from "@/server/repositories/drizzle-club-admin-repository";
import { DrizzleClubRepository } from "@/server/repositories/drizzle-club-repository";

const NAV_ITEMS = [
  { href: "/panel", label: "Hoy", icon: Clock },
  { href: "/panel/reservas", label: "Reservas", icon: ListChecks },
  { href: "/panel/canchas", label: "Canchas", icon: LayoutGrid },
];

export default async function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    redirect("/");
  }

  const clubId = await findClubIdByAdminUserId(session.user.id);
  if (!clubId) {
    redirect("/");
  }

  const clubs = new DrizzleClubRepository();
  const club = await clubs.findById(clubId);

  return (
    <div className="flex min-h-[calc(100vh-64px)] flex-wrap bg-panel">
      <aside className="flex flex-1 basis-60 flex-col gap-6 bg-bordo-dark p-4 text-white">
        <div className="rounded-2xl bg-bordo-mid p-3.5">
          <p className="m-0 text-xs font-bold uppercase tracking-wide text-[#E9C7CD]">
            Complejo
          </p>
          <p className="m-0 mt-1 text-base font-bold">{club?.name ?? "Mi club"}</p>
        </div>
        <nav aria-label="Panel" className="flex flex-col gap-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex min-h-12 items-center gap-3 rounded-xl px-3.5 text-[15px] font-semibold text-white hover:bg-white/10"
              >
                <Icon size={20} aria-hidden="true" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <span className="flex-1" />
        <Link
          href="/"
          className="flex min-h-11 items-center gap-2 px-3.5 text-sm font-semibold text-[#F3DADF]"
        >
          Ver mi club como jugador
        </Link>
      </aside>
      <main className="min-w-0 flex-[999] basis-[560px] px-4 py-7 pb-14 sm:px-8 lg:px-10">
        {children}
      </main>
    </div>
  );
}
