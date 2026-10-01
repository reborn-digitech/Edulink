import { bankStatsQuerySchema, bankStatsSchema } from "@edulink/contracts";
import { AccessError, requireApiAppAdmin } from "@/lib/tenancy";
import { questionStats } from "@/lib/bank-tools";
import { apiFailure, apiInvalid, ok } from "@/lib/api-v1";

/** GET /api/v1/appadmin/bank/stats?questionId= — one question's numbers, whole and by the answering pupils' grade. */
export async function GET(request: Request) {
  try {
    const ctx = await requireApiAppAdmin();
    const parsed = bankStatsQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!parsed.success) return apiInvalid(parsed);
    const stats = await questionStats(ctx, parsed.data.questionId);
    if (!stats) throw new AccessError("appadmin.noSuchQuestion", "NOT_FOUND");
    return ok(bankStatsSchema.parse({ ...stats, updatedAt: stats.updatedAt?.toISOString() ?? null }));
  } catch (error) {
    return apiFailure(error, "api/v1/appadmin/bank/stats");
  }
}
