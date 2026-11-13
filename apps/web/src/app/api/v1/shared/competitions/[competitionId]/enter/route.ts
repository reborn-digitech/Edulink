import { competitionEnterBodySchema, competitionEnterResultSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { enterCompetition } from "@/lib/competitions";
import { apiFailure, apiInvalid, BodyTooLarge, JSON_BODY_LIMIT, ok, readBounded } from "@/lib/api-v1";
import { underRules } from "@/lib/api-rule-failure";

/**
 * POST /api/v1/shared/competitions/{competitionId}/enter — a pupil enrols themself (a second call returns the
 * same entry), or, since decision 0007 (6 Nov 2026), a guardian enrols one of their own children by
 * `studentMembershipId`, which counts as the guardian's consent. A pupil's body is ignored. A guardian naming no
 * child, or a closed enrolment, is a 422 in words; another family's child is a 404.
 */
export async function POST(request: Request, { params }: { params: Promise<{ competitionId: string }> }) {
  try {
    const ctx = await requireApiRoles("STUDENT", "PARENT"); // a guardian's session names no school: the child in the body names it
    const { competitionId } = await params;
    // TA-423: read to the cap, by what arrives; past it, 413 (apiFailure).
    const raw = await readBounded(request, JSON_BODY_LIMIT);
    if (raw === null) throw new BodyTooLarge();
    const parsed = competitionEnterBodySchema.safeParse(raw.trim().length === 0 ? undefined : JSON.parse(raw));
    if (!parsed.success) return apiInvalid(parsed);
    const body = parsed.data ?? {};
    return await underRules("api/v1/shared/competitions/[competitionId]/enter", async () =>
      ok(competitionEnterResultSchema.parse(await enterCompetition(ctx, competitionId, { studentMembershipId: ctx.role === "PARENT" ? (body.studentMembershipId ?? null) : null }))),
    );
  } catch (error) {
    return apiFailure(error, "api/v1/shared/competitions/[competitionId]/enter");
  }
}
