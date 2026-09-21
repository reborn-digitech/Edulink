import { termWeightSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { setTermWeight } from "@/lib/report-card-config";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";

/** POST /api/v1/office/terms/{termId}/weight — the term's share of the annual card. */
export async function POST(request: Request, { params }: { params: Promise<{ termId: string }> }) {
  try {
    const ctx = await requireApiRole("ADMIN", "PRINCIPAL");
    const { termId } = await params;
    const parsed = termWeightSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(termWeightSchema.parse(await setTermWeight(ctx, termId, parsed.data.weightPercent)));
  } catch (error) {
    return apiFailure(error, "api/v1/office/terms/weight");
  }
}
