import { teachingCardsPublishedSchema, teachingCardsTitleSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { publishCards } from "@/lib/report-cards";
import { apiRefused } from "@/lib/api-reads/admin";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";

/**
 * POST /api/v1/teaching/classes/{classId}/report-cards/publish — the web's
 * `publish`: every draft under one title goes out together, and each child and
 * their guardians are told once. Nothing left in draft is a refusal.
 */
export async function POST(request: Request, { params }: { params: Promise<{ classId: string }> }) {
  try {
    const ctx = await requireApiRole("TEACHER", "ADMIN", "PRINCIPAL");
    const { classId } = await params;
    const parsed = teachingCardsTitleSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const result = await publishCards(ctx, classId, parsed.data.title);
    if (!result.ok) return apiRefused(result);
    return ok(teachingCardsPublishedSchema.parse({ published: result.published ?? 0 }));
  } catch (error) {
    return apiFailure(error, "api/v1/teaching/classes/[classId]/report-cards/publish");
  }
}
