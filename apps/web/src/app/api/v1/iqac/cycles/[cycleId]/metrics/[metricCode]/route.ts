import { iqacPredictorSchema, iqacScoreSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { scoreQualitative } from "@/lib/iqac";
import { apiInvalid, ok, readJson } from "@/lib/api-v1";
import { moduleFailure } from "@/lib/rule-refusal";

/** POST /api/v1/iqac/cycles/{cycleId}/metrics/{metricCode} — Score a qualitative metric 0–4 with evidence: at least one file or one cited record. */
export async function POST(request: Request, { params }: { params: Promise<{ cycleId: string, metricCode: string }> }) {
  try {
    const ctx = await requireApiRoles("IQAC");
    const p = await params;
    const parsed = iqacScoreSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const b = parsed.data;
    return ok(iqacPredictorSchema.parse(await scoreQualitative(ctx, p.cycleId, p.metricCode, b)));
  } catch (error) {
    return moduleFailure(error, "api/v1/iqac/cycles/[cycleId]/metrics/[metricCode]");
  }
}
