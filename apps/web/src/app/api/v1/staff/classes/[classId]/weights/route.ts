import { classWeightsSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { saveClassWeights } from "@/lib/api-reads/staff";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";

/**
 * POST /api/v1/staff/classes/{classId}/weights — the class's grade weights,
 * as percentages. Replaces the set; sending the same rows twice leaves the
 * same weights. The total-100 rule and the name rules are saveGradeCategories'.
 */
export async function POST(request: Request, { params }: { params: Promise<{ classId: string }> }) {
  try {
    const ctx = await requireApiRole("TEACHER", "ADMIN");
    const { classId } = await params;
    const parsed = classWeightsSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    await saveClassWeights(ctx, classId, parsed.data.rows);
    return ok({ ok: true });
  } catch (error) {
    return apiFailure(error, "api/v1/staff/classes/[classId]/weights");
  }
}
