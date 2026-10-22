import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/integrations/auth";
import { cancelBooking } from "@/server/services/cancel-booking-service";
import { DrizzleBookingRepository } from "@/server/repositories/drizzle-booking-repository";
import { domainErrorToResponse } from "@/server/http-errors";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { id } = await params;
  const bookings = new DrizzleBookingRepository();

  try {
    await cancelBooking(
      { bookingId: id, userId: session.user.id },
      { bookings, now: new Date() },
    );
    return NextResponse.json({ status: "ok" });
  } catch (err) {
    const response = domainErrorToResponse(err);
    if (response) return response;
    throw err;
  }
}
