import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/integrations/auth";
import { updateCourtSchema } from "@/lib/validation/court";
import { disableCourt } from "@/server/services/disable-court-service";
import { DrizzleCourtRepository } from "@/server/repositories/drizzle-court-repository";
import { DrizzleBookingRepository } from "@/server/repositories/drizzle-booking-repository";
import { findClubIdByAdminUserId } from "@/server/repositories/drizzle-club-admin-repository";
import { domainErrorToResponse } from "@/server/http-errors";
import { NotFoundError } from "@/domain/errors";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const clubId = await findClubIdByAdminUserId(session.user.id);
  if (!clubId) {
    return NextResponse.json({ error: "No administra ningun club" }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = updateCourtSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos invalidos", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const courts = new DrizzleCourtRepository();
  const bookings = new DrizzleBookingRepository();

  try {
    const court = await courts.findById(id);
    if (!court) throw new NotFoundError("Cancha");

    let cancelledFutureBookings = 0;

    if (parsed.data.active === false) {
      cancelledFutureBookings = await disableCourt(
        { courtId: id, adminClubId: clubId },
        { courts, bookings, now: new Date() },
      );
    } else {
      if (court.clubId !== clubId) {
        return NextResponse.json({ error: "No tenes permiso para esta accion" }, { status: 403 });
      }
      if (parsed.data.active === true) {
        await courts.setActive(id, true);
      }
    }

    if (parsed.data.pricePerSlot !== undefined) {
      await courts.setPrice(id, parsed.data.pricePerSlot);
    }

    const updated = await courts.findById(id);
    return NextResponse.json({ court: updated, cancelledFutureBookings });
  } catch (err) {
    const response = domainErrorToResponse(err);
    if (response) return response;
    throw err;
  }
}
