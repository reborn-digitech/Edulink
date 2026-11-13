import { teachingCardsGeneratedTitleSchema, teachingGenerateCardsSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { generateCards } from "@/lib/report-cards";
import { apiRefused } from "@/lib/api-reads/admin";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";

/**
 * POST /api/v1/teaching/classes/{classId}/report-cards/generate — the web's
 * `generate`: draft (or refresh) a card per pupil from the chosen papers.
 * Pressing it twice updates rather than duplicates; a published card is left
 * alone and counted. A term, when named, fixes the title and the window.
 */
export async function POST(request: Request, { params }: { params: Promise<{ classId: string }> }) {
  try {
    const ctx = await requireApiRole("TEACHER", "ADMIN", "PRINCIPAL");
    const { classId } = await params;
    const parsed = teachingGenerateCardsSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const result = await generateCards(ctx, classId, { title: parsed.data.title, assignmentIds: parsed.data.assignmentIds, termId: parsed.data.termId ?? null, academicYearId: parsed.data.academicYearId ?? null });
    if (!result.ok) return apiRefused(result);
    // The set's title as made: where the class holds the name from another year it carries the year (TA-009).
    return ok(teachingCardsGeneratedTitleSchema.parse({ created: result.created ?? 0, updated: result.updated ?? 0, skippedPublished: result.skippedPublished ?? 0, title: result.title }));
  } catch (error) {
    return apiFailure(error, "api/v1/teaching/classes/[classId]/report-cards/generate");
  }
}
