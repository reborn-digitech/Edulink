import { examSquadVisitSaveSchema, streamRecordsIdSchema } from "@edulink/contracts";
import { apiInvalid, ok, readJson } from "@/lib/api-v1";
import { requireApiRoles } from "@/lib/api-roles";
import { moduleFailure } from "@/lib/rule-refusal";
import { recordSquadVisit } from "@/lib/duty-desks";

/** POST /api/v1/duties/exam-squad/visits — a squad member logs a visit to a paper's halls; one that found something tells the exam controllers (audited duties.examSquad.visit). */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRoles("FACULTY", "HOD");
    const parsed = examSquadVisitSaveSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(streamRecordsIdSchema.parse(await recordSquadVisit(ctx, parsed.data)));
  } catch (error) {
    return moduleFailure(error, "api/v1/duties/exam-squad/visits");
  }
}
