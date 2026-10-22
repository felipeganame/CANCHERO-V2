import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/integrations/auth";
import { createBookingSchema } from "@/lib/validation/booking";
import { reserveSlot } from "@/server/services/booking-service";
import { DrizzleBookingRepository } from "@/server/repositories/drizzle-booking-repository";
import { DrizzleCourtRepository } from "@/server/repositories/drizzle-court-repository";
import { DrizzleClubRepository } from "@/server/repositories/drizzle-club-repository";
import { NotFoundError } from "@/domain/errors";
import { domainErrorToResponse } from "@/server/http-errors";

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = createBookingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos invalidos", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const courts = new DrizzleCourtRepository();
  const clubsRepo = new DrizzleClubRepository();
  const bookings = new DrizzleBookingRepository();

  try {
    const court = await courts.findById(parsed.data.courtId);
    if (!court) throw new NotFoundError("Cancha");
    const club = await clubsRepo.findById(court.clubId);
    if (!club) throw new NotFoundError("Club");

    const booking = await reserveSlot(
      {
        courtId: parsed.data.courtId,
        userId: session.user.id,
        startsAt: new Date(parsed.data.startsAt),
      },
      { courts, bookings, club, now: new Date() },
    );

    return NextResponse.json(booking, { status: 201 });
  } catch (err) {
    const response = domainErrorToResponse(err);
    if (response) return response;
    throw err;
  }
}
