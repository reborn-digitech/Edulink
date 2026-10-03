import { libraryReservationCreateSchema, libraryReservationSchema, libraryReservationsSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { reservationQueue, reserveTitle } from "@/lib/library";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";

/** GET /api/v1/library/reservations — The queue: every open reservation, ready ones first. */
export async function GET() {
  try {
    const ctx = await requireApiRoles("LIBRARIAN", "ADMIN", "PRINCIPAL");
    return ok(libraryReservationsSchema.parse(await reservationQueue(ctx)));
  } catch (error) {
    return apiFailure(error, "api/v1/library/reservations");
  }
}

/** POST /api/v1/library/reservations — A place in a title's queue: for oneself, a child, or (the desk) a member. */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRoles("STUDENT", "PARENT", "TEACHER", "ADMIN", "PRINCIPAL", "LIBRARIAN");
    const parsed = libraryReservationCreateSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const b = parsed.data;
    return ok(libraryReservationSchema.parse(await reserveTitle(ctx, b)));
  } catch (error) {
    return apiFailure(error, "api/v1/library/reservations");
  }
}
