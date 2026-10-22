import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/integrations/auth";
import { DrizzleBookingRepository } from "@/server/repositories/drizzle-booking-repository";

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const estado = new URL(request.url).searchParams.get("estado");
  const bookings = new DrizzleBookingRepository();
  const all = await bookings.findByUserId(session.user.id);

  const now = new Date();
  const filtered = all.filter((b) => {
    if (estado === "proximas") return b.status === "confirmed" && b.startsAt > now;
    if (estado === "pasadas") return b.status === "confirmed" && b.startsAt <= now;
    if (estado === "canceladas") return b.status !== "confirmed";
    return true;
  });

  return NextResponse.json(filtered);
}
