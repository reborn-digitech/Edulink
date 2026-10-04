import { eligibilityQuerySchema, eligibilitySchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { eligibilityList } from "@/lib/academics-attendance";
import { apiInvalid, ok } from "@/lib/api-v1";
import { moduleFailure } from "@/lib/rule-refusal";

/** GET /api/v1/academics/eligibility — The term's eligibility list: every registered student on every offering, percentage, threshold, condoned, eligible. */
export async function GET(request: Request) {
  try {
    const ctx = await requireApiRoles("ADMIN", "PRINCIPAL", "HOD", "EXAM_CONTROLLER");
    const parsed = eligibilityQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!parsed.success) return apiInvalid(parsed);
    const q = parsed.data;
    return ok(eligibilitySchema.parse(await eligibilityList(ctx, q.termId)));
  } catch (error) {
    return moduleFailure(error, "api/v1/academics/eligibility");
  }
}
