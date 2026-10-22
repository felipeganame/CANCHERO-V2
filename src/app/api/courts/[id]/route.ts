import { NextResponse, type NextRequest } from "next/server";
import { DrizzleCourtRepository } from "@/server/repositories/drizzle-court-repository";
import { DrizzleClubRepository } from "@/server/repositories/drizzle-club-repository";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const courts = new DrizzleCourtRepository();
  const court = await courts.findById(id);
  if (!court) {
    return NextResponse.json({ error: "Cancha no encontrada" }, { status: 404 });
  }

  const clubs = new DrizzleClubRepository();
  const club = await clubs.findById(court.clubId);
  if (!club) {
    return NextResponse.json({ error: "Club no encontrado" }, { status: 404 });
  }

  return NextResponse.json({ court, club });
}
