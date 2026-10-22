import { NextResponse, type NextRequest } from "next/server";
import { and, eq, gte, lte, ilike } from "drizzle-orm";
import { auth } from "@/integrations/auth";
import { db } from "@/server/db/client";
import { bookings, courts, user } from "@/server/db/schema";
import { findClubIdByAdminUserId } from "@/server/repositories/drizzle-club-admin-repository";

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const clubId = await findClubIdByAdminUserId(session.user.id);
  if (!clubId) {
    return NextResponse.json({ error: "No administra ningun club" }, { status: 403 });
  }

  const params = new URL(request.url).searchParams;
  const desde = params.get("desde");
  const hasta = params.get("hasta");
  const cancha = params.get("cancha");
  const estado = params.get("estado");
  const q = params.get("q");

  const conditions = [eq(courts.clubId, clubId)];
  if (desde) conditions.push(gte(bookings.startsAt, new Date(desde)));
  if (hasta) conditions.push(lte(bookings.startsAt, new Date(hasta)));
  if (cancha) conditions.push(eq(bookings.courtId, cancha));
  if (estado) {
    conditions.push(
      eq(bookings.status, estado as "confirmed" | "cancelled_by_player" | "cancelled_by_club"),
    );
  }
  if (q) conditions.push(ilike(user.name, `%${q}%`));

  const rows = await db
    .select({
      booking: bookings,
      courtName: courts.name,
      playerName: user.name,
    })
    .from(bookings)
    .innerJoin(courts, eq(bookings.courtId, courts.id))
    .innerJoin(user, eq(bookings.userId, user.id))
    .where(and(...conditions));

  return NextResponse.json(rows);
}
