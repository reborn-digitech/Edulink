import { corpsEnrolSchema, streamRecordsCountSchema } from "@edulink/contracts";
import { apiInvalid, budget, NOTICE_WRITE_BUDGET, ok, readJson } from "@/lib/api-v1";
import { requireApiRoles } from "@/lib/api-roles";
import { moduleFailure } from "@/lib/rule-refusal";
import { enrolInCorps } from "@/lib/corps";

/** POST /api/v1/duties/ncc/enrolments — students enrolled in the NCC unit (audited duties.corps.enrol). */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRoles("ADMIN", "FACULTY", "HOD");
    // The duty desks' writes are budgeted per person (A3-S-15), before the body is read.
    const refused = await budget(`duty-write:${ctx.user.id}`, NOTICE_WRITE_BUDGET.limit, NOTICE_WRITE_BUDGET.windowMs);
    if (refused) return refused;
    const parsed = corpsEnrolSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(streamRecordsCountSchema.parse(await enrolInCorps(ctx, "NCC", parsed.data)));
  } catch (error) {
    return moduleFailure(error, "api/v1/duties/ncc/enrolments");
  }
}
