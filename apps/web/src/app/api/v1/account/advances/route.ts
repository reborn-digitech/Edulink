import { advanceAskSchema, staffAdvanceSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { SCHOOL_STAFF_ROLES } from "@/lib/staff-records";
import { apiInvalid, ok, readJson } from "@/lib/api-v1";
import { askAdvance } from "@/lib/payroll";
import { moduleFailure } from "@/lib/rule-refusal";

/** POST /api/v1/account/advances — ask the office for an advance against salary. */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRole(...SCHOOL_STAFF_ROLES);
    const parsed = advanceAskSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(staffAdvanceSchema.parse(await askAdvance(ctx, parsed.data)));
  } catch (error) {
    return moduleFailure(error, "api/v1/account/advances");
  }
}
