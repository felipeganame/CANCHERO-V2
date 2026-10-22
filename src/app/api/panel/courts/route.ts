import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/integrations/auth";
import { createCourtSchema } from "@/lib/validation/court";
import { createCourt } from "@/server/services/create-court-service";
import { DrizzleCourtRepository } from "@/server/repositories/drizzle-court-repository";
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

  const courts = new DrizzleCourtRepository();
  const list = await courts.findByClubId(clubId);
  return NextResponse.json(list);
}

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const clubId = await findClubIdByAdminUserId(session.user.id);
  if (!clubId) {
    return NextResponse.json({ error: "No administra ningun club" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = createCourtSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos invalidos", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const courts = new DrizzleCourtRepository();
  const court = await createCourt({ clubId, ...parsed.data }, { courts });
  return NextResponse.json(court, { status: 201 });
}
