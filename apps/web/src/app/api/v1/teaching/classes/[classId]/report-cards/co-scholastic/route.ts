import { coScholasticSaveSchema, okSchema } from "@edulink/contracts";
import { requireApiRole, AccessError } from "@/lib/tenancy";
import { setCoScholastic } from "@/lib/report-cards";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";

/**
 * POST /api/v1/teaching/classes/{classId}/report-cards/co-scholastic — the
 * class teacher's grades on one draft card. The door is the class teacher's
 * and the office's; the head reads cards and does not grade them here (a
 * head named a class's lead still may on the web, through the builder).
 * The card must be the {classId}'s, as on the remark door beside it: another
 * class's card, or a class of another school, is 404 (owner's item 14).
 */
export async function POST(request: Request, { params }: { params: Promise<{ classId: string }> }) {
  try {
    const ctx = await requireApiRole("TEACHER", "ADMIN");
    const { classId } = await params;
    const parsed = coScholasticSaveSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const result = await setCoScholastic(ctx, parsed.data.cardId, parsed.data.grades, { classId });
    if (!result.ok) throw new AccessError(result.errorKey ?? "access.notAllowed", result.errorKey === "reportCards.notInSchool" ? "NOT_FOUND" : undefined);
    return ok(okSchema.parse({ ok: true }));
  } catch (error) {
    return apiFailure(error, "api/v1/teaching/report-cards/co-scholastic");
  }
}
