import { labBreakageSaveSchema, stockMovementSchema } from "@edulink/contracts";
import { apiInvalid, budget, NOTICE_WRITE_BUDGET, ok, readJson } from "@/lib/api-v1";
import { requireApiRoles } from "@/lib/api-roles";
import { moduleFailure } from "@/lib/rule-refusal";
import { recordLabBreakage } from "@/lib/duty-desks";

/** POST /api/v1/duties/lab/breakage — a breakage written off a lab's stock (audited duties.lab.breakage). */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRoles("ADMIN", "FACULTY", "HOD");
    // The duty desks' writes are budgeted per person (A3-S-15), before the body is read.
    const refused = await budget(`duty-write:${ctx.user.id}`, NOTICE_WRITE_BUDGET.limit, NOTICE_WRITE_BUDGET.windowMs);
    if (refused) return refused;
    const parsed = labBreakageSaveSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(stockMovementSchema.parse(await recordLabBreakage(ctx, parsed.data)));
  } catch (error) {
    return moduleFailure(error, "api/v1/duties/lab/breakage");
  }
}
