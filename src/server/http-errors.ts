import { NextResponse } from "next/server";
import {
  CourtDisabledError,
  ForbiddenError,
  InvalidSlotError,
  NotFoundError,
  PastSlotError,
  SlotTakenError,
} from "@/domain/errors";

export function domainErrorToResponse(err: unknown): NextResponse | null {
  if (err instanceof SlotTakenError) {
    return NextResponse.json({ error: err.message }, { status: 409 });
  }
  if (
    err instanceof CourtDisabledError ||
    err instanceof PastSlotError ||
    err instanceof InvalidSlotError
  ) {
    return NextResponse.json({ error: err.message }, { status: 422 });
  }
  if (err instanceof ForbiddenError) {
    return NextResponse.json({ error: err.message }, { status: 403 });
  }
  if (err instanceof NotFoundError) {
    return NextResponse.json({ error: err.message }, { status: 404 });
  }
  return null;
}
