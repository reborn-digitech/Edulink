import { myAppraisalsSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { myAppraisals } from "@/lib/appraisal";
import { apiFailure, ok } from "@/lib/api-v1";

/** GET /api/v1/staff/me/appraisals — the entries the head has shown me, newest first. */
export async function GET() {
  try {
    const ctx = await requireApiRole("TEACHER", "ADMIN", "PRINCIPAL");
    return ok(myAppraisalsSchema.parse(await myAppraisals(ctx)));
  } catch (error) {
    return apiFailure(error, "api/v1/staff/me/appraisals");
  }
}
