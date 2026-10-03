import { libraryReservationSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { cancelReservation } from "@/lib/library";
import { apiFailure, ok } from "@/lib/api-v1";

type Params = { params: Promise<{ reservationId: string }> };

/** POST /api/v1/library/reservations/{reservationId}/cancel — Leave the queue: the member, their guardian or the desk. */
export async function POST(_request: Request, { params }: Params) {
  try {
    const ctx = await requireApiRoles("STUDENT", "PARENT", "TEACHER", "ADMIN", "PRINCIPAL", "LIBRARIAN");
    const p = await params;
    return ok(libraryReservationSchema.parse(await cancelReservation(ctx, p.reservationId)));
  } catch (error) {
    return apiFailure(error, "api/v1/library/reservations/[reservationId]/cancel");
  }
}
