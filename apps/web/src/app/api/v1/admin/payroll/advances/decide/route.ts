import { advanceDecideSchema, staffAdvanceSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { apiInvalid, ok, readJson } from "@/lib/api-v1";
import { decideAdvance } from "@/lib/payroll";
import { moduleFailure } from "@/lib/rule-refusal";

/** POST /api/v1/admin/payroll/advances/decide — record or decline an ask. */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRole("ADMIN");
    const parsed = advanceDecideSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(staffAdvanceSchema.parse(await decideAdvance(ctx, parsed.data)));
  } catch (error) {
    return moduleFailure(error, "api/v1/admin/payroll/advances/decide");
  }
}
