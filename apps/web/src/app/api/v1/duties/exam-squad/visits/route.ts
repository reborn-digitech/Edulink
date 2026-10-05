import { examSquadVisitSaveSchema, streamRecordsIdSchema } from "@edulink/contracts";
import { apiInvalid, budget, FANOUT_BUDGET, ok, readJson } from "@/lib/api-v1";
import { requireApiRoles } from "@/lib/api-roles";
import { moduleFailure } from "@/lib/rule-refusal";
import { recordSquadVisit } from "@/lib/duty-desks";

/** POST /api/v1/duties/exam-squad/visits — a squad member logs a visit to a paper's halls; one that found something tells the exam controllers (audited duties.examSquad.visit). */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRoles("FACULTY", "HOD");
    // A flagged visit tells every exam controller: a fan-out's budget (A3-S-15), taken before the body is read.
    const refused = await budget(`duty-fanout:${ctx.user.id}`, FANOUT_BUDGET.limit, FANOUT_BUDGET.windowMs);
    if (refused) return refused;
    const parsed = examSquadVisitSaveSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(streamRecordsIdSchema.parse(await recordSquadVisit(ctx, parsed.data)));
  } catch (error) {
    return moduleFailure(error, "api/v1/duties/exam-squad/visits");
  }
}
