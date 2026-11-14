import { feeOkSchema, feeUnassignBodySchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { unassignPlan } from "@/lib/fees";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";

/** POST /api/v1/fees/plans/remove — off the plan for a year, while nothing is paid. */
export async function POST(request: Request) {
  try {
    // The office's own, as the web's Remove button is (TA-082): the accounts desk puts a student on their structure, it does not empty their dues.
    const ctx = await requireApiRole("ADMIN");
    const parsed = feeUnassignBodySchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    await unassignPlan(ctx, parsed.data.studentMembershipId, parsed.data.academicYearId);
    return ok(feeOkSchema.parse({ ok: true }));
  } catch (error) {
    return apiFailure(error, "api/v1/fees/plans/remove");
  }
}
