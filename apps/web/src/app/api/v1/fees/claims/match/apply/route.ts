import { feeBankApplyBodySchema, feeBankApplyResultSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { feesApplyMatches } from "@/lib/api-reads/fees";
import { getT } from "@/lib/i18n/server";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";

/** POST /api/v1/fees/claims/match/apply — confirm the matched claims together; each refusal is reported by id. */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRole("ADMIN", "ACCOUNTS");
    const parsed = feeBankApplyBodySchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const t = await getT();
    return ok(feeBankApplyResultSchema.parse(await feesApplyMatches(ctx, parsed.data.paymentIds, (e) => t(e.key, e.vars))));
  } catch (error) {
    return apiFailure(error, "api/v1/fees/claims/match/apply");
  }
}
