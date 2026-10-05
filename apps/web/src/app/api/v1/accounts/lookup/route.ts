import { accountsLookupQuerySchema, accountsLookupSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { lookupStudents } from "@/lib/accounts-lookup";
import { HEAVY_READ_BUDGET, apiFailure, apiInvalid, budget, ok } from "@/lib/api-v1";

/** GET /api/v1/accounts/lookup?q= — a student of this college by PRN, college code or name, at most twenty (5 Oct 2026). */
export async function GET(request: Request) {
  try {
    const ctx = await requireApiRoles("ACCOUNTS", "ADMIN", "PRINCIPAL");
    const parsed = accountsLookupQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!parsed.success) return apiInvalid(parsed);
    // A search across the roll: the same hourly allowance as the other reads that range over every student.
    const refused = await budget(`heavy:${ctx.user.id}`, HEAVY_READ_BUDGET.limit, HEAVY_READ_BUDGET.windowMs);
    if (refused) return refused;
    return ok(accountsLookupSchema.parse(await lookupStudents(ctx, parsed.data.q)));
  } catch (error) {
    return apiFailure(error, "api/v1/accounts/lookup");
  }
}
