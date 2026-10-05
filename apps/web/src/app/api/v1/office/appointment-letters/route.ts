import { appointmentLetterIssueSchema, appointmentLettersViewSchema, issuedCertificateSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { appointmentLettersView, issueAppointmentLetter } from "@/lib/certificates";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";

/** GET /api/v1/office/appointment-letters — the APPOINTMENT templates, the staff a letter may go to, and the letters issued. */
export async function GET() {
  try {
    const ctx = await requireApiRoles("ADMIN", "PRINCIPAL");
    return ok(appointmentLettersViewSchema.parse(await appointmentLettersView(ctx)));
  } catch (error) {
    return apiFailure(error, "api/v1/office/appointment-letters");
  }
}

/** POST /api/v1/office/appointment-letters — issue an appointment letter to one member of staff: filled from their record, numbered under the year's lock, frozen, the member told. */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRoles("ADMIN", "PRINCIPAL");
    const parsed = appointmentLetterIssueSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(issuedCertificateSchema.parse(await issueAppointmentLetter(ctx, parsed.data)), 201);
  } catch (error) {
    return apiFailure(error, "api/v1/office/appointment-letters");
  }
}
