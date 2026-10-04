import { raiseDemandsBodySchema, raiseDemandsResultSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { raiseDemands } from "@/lib/college-fees";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";

/** POST /api/v1/accounts/demands/raise — Every active student on the structure their programme, year and category call for, with each term's demand; a second run changes nothing. */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRoles("ACCOUNTS", "ADMIN");
    const parsed = raiseDemandsBodySchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const b = parsed.data;
    return ok(raiseDemandsResultSchema.parse(await raiseDemands(ctx, b)));
  } catch (error) {
    return apiFailure(error, "api/v1/accounts/demands/raise");
  }
}
