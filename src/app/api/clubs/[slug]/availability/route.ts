import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getCourtAvailability } from "@/server/services/availability-service";
import { DrizzleClubRepository } from "@/server/repositories/drizzle-club-repository";
import { DrizzleCourtRepository } from "@/server/repositories/drizzle-court-repository";
import { DrizzleBookingRepository } from "@/server/repositories/drizzle-booking-repository";

const querySchema = z.object({ fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) });

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const url = new URL(request.url);
  const parsed = querySchema.safeParse({ fecha: url.searchParams.get("fecha") });
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Parametros invalidos", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const clubs = new DrizzleClubRepository();
  const club = await clubs.findBySlug(slug);
  if (!club) {
    return NextResponse.json({ error: "Club no encontrado" }, { status: 404 });
  }

  const courts = new DrizzleCourtRepository();
  const bookings = new DrizzleBookingRepository();
  const clubCourts = (await courts.findByClubId(club.id)).filter((c) => c.active);

  const grid = await Promise.all(
    clubCourts.map(async (court) => ({
      court,
      slots: await getCourtAvailability(
        { courtId: court.id, localDate: parsed.data.fecha },
        { bookings, club },
      ),
    })),
  );

  return NextResponse.json({ club, grid });
}
