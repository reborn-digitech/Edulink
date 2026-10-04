import { messBillBodySchema, messBillResultSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { billMess } from "@/lib/college-fees";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";

/** POST /api/v1/accounts/mess-bill — Bill a month's mess to each boarder's ledger under the MESS head; a month billed twice bills nobody twice. */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRoles("ACCOUNTS", "ADMIN");
    const parsed = messBillBodySchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const b = parsed.data;
    return ok(messBillResultSchema.parse(await billMess(ctx, b)));
  } catch (error) {
    return apiFailure(error, "api/v1/accounts/mess-bill");
  }
}
