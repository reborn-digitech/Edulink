import { certificatesListSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { myAppointmentLetters } from "@/lib/certificates";
import { apiFailure, ok } from "@/lib/api-v1";

/** GET /api/v1/account/appointment-letters — the member of staff's own appointment letters at the school they are signed in to. */
export async function GET() {
  try {
    const ctx = await requireApiRoles("TEACHER", "PRINCIPAL", "ADMIN", "DRIVER", "LIBRARIAN", "WARDEN", "FACULTY", "HOD", "EXAM_CONTROLLER", "IQAC", "TPO", "ACCOUNTS");
    return ok(certificatesListSchema.parse(await myAppointmentLetters(ctx)));
  } catch (error) {
    return apiFailure(error, "api/v1/account/appointment-letters");
  }
}
