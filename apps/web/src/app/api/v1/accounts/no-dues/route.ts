import { noDuesListSchema, noDuesQuerySchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { noDuesList } from "@/lib/no-dues";
import { apiFailure, apiInvalid, budget, HEAVY_READ_BUDGET, ok } from "@/lib/api-v1";

/** GET /api/v1/accounts/no-dues — Active students with an uncleared line for the event, the desks named. */
export async function GET(request: Request) {
  try {
    const ctx = await requireApiRoles("ACCOUNTS", "ADMIN", "PRINCIPAL", "LIBRARIAN", "WARDEN", "HOD");
    const refused = await budget(`heavy:${ctx.user.id}`, HEAVY_READ_BUDGET.limit, HEAVY_READ_BUDGET.windowMs);
    if (refused) return refused;
    const parsed = noDuesQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!parsed.success) return apiInvalid(parsed);
    const q = parsed.data;
    return ok(noDuesListSchema.parse(await noDuesList(ctx, q.event)));
  } catch (error) {
    return apiFailure(error, "api/v1/accounts/no-dues");
  }
}
