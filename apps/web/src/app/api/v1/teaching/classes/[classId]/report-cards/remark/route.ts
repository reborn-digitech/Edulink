import { okSchema, teachingCardRemarkSchema } from "@edulink/contracts";
import { AccessError, requireApiRole } from "@/lib/tenancy";
import { db } from "@/lib/db";
import { setRemark } from "@/lib/report-cards";
import { apiRefused } from "@/lib/api-reads/admin";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";

/**
 * POST /api/v1/teaching/classes/{classId}/report-cards/remark — the web's
 * `saveRemark`: the class teacher's words on one draft card. The card must be
 * this class's; a published card is locked, as `setRemark` says.
 */
export async function POST(request: Request, { params }: { params: Promise<{ classId: string }> }) {
  try {
    const ctx = await requireApiRole("TEACHER", "ADMIN", "PRINCIPAL");
    const { classId } = await params;
    const parsed = teachingCardRemarkSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const card = await db.reportCard.findFirst({ where: { id: parsed.data.cardId, schoolId: ctx.schoolId, classId }, select: { id: true } });
    if (!card) throw new AccessError("reportCards.notInSchool", "NOT_FOUND");
    const result = await setRemark(ctx, card.id, parsed.data.remark);
    if (!result.ok) return apiRefused(result);
    return ok(okSchema.parse({ ok: true }));
  } catch (error) {
    return apiFailure(error, "api/v1/teaching/classes/[classId]/report-cards/remark");
  }
}
