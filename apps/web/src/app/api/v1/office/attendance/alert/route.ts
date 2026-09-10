import { officeAbsenceAlertBodySchema, officeAbsenceAlertSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { sendAbsenceAlert } from "@/lib/attendance-intel";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";

/**
 * POST /api/v1/office/attendance/alert — tell one child's family they have
 * been missing school. One tap, one family, audited; a family told within the
 * last week is not told again (`skipped`), as on the web.
 */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRole("ADMIN");
    const parsed = officeAbsenceAlertBodySchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const result = await sendAbsenceAlert(ctx, parsed.data.studentMembershipId);
    return ok(officeAbsenceAlertSchema.parse(result));
  } catch (error) {
    return apiFailure(error, "api/v1/office/attendance/alert");
  }
}
