import { streamRecordsSummaryQuerySchema, streamRecordsSummarySchema } from "@edulink/contracts";
import { apiInvalid, ok } from "@/lib/api-v1";
import { requireApiRoles } from "@/lib/api-roles";
import { moduleFailure } from "@/lib/rule-refusal";
import { streamRecordsSummary } from "@/lib/stream-records";

/** GET /api/v1/stream-records/summary — the year's practical record, law internships and moots, teaching practice and NSS/NCC, for the office and the head. */
export async function GET(request: Request) {
  try {
    const ctx = await requireApiRoles("ADMIN", "PRINCIPAL");
    const parsed = streamRecordsSummaryQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(streamRecordsSummarySchema.parse(await streamRecordsSummary(ctx, parsed.data.year)));
  } catch (error) {
    return moduleFailure(error, "api/v1/stream-records/summary");
  }
}
