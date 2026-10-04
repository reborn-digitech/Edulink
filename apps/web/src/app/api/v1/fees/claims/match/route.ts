import { feeBankMatchBodySchema, feeBankMatchSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { matchBankRows } from "@/lib/fees-payments";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";

/** POST /api/v1/fees/claims/match — a pasted statement against the waiting claims, by UTR then amount. Writes nothing. */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRole("ADMIN", "ACCOUNTS");
    const parsed = feeBankMatchBodySchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(feeBankMatchSchema.parse(await matchBankRows(ctx, parsed.data.csv)));
  } catch (error) {
    return apiFailure(error, "api/v1/fees/claims/match");
  }
}
