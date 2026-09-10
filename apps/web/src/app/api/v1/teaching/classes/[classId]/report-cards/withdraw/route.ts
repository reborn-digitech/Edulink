import { teachingCardsTitleSchema, teachingCardsWithdrawnSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { withdrawCards } from "@/lib/report-cards";
import { apiRefused } from "@/lib/api-reads/admin";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";

/**
 * POST /api/v1/teaching/classes/{classId}/report-cards/withdraw — the web's
 * `withdraw`: a published set goes back to draft, audited. Families may have
 * read them already; the phone asks before sending this.
 */
export async function POST(request: Request, { params }: { params: Promise<{ classId: string }> }) {
  try {
    const ctx = await requireApiRole("TEACHER", "ADMIN", "PRINCIPAL");
    const { classId } = await params;
    const parsed = teachingCardsTitleSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const result = await withdrawCards(ctx, classId, parsed.data.title);
    if (!result.ok) return apiRefused(result);
    return ok(teachingCardsWithdrawnSchema.parse({ withdrawn: result.withdrawn ?? 0 }));
  } catch (error) {
    return apiFailure(error, "api/v1/teaching/classes/[classId]/report-cards/withdraw");
  }
}
