import { routeFeesBodySchema, routeFeesResultSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { raiseRouteFees } from "@/lib/college-fees";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";

/** POST /api/v1/accounts/route-fees — Raise a term's route fee on each rider's ledger under the TRANSPORT head; raised once per student, route and term. */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRoles("ACCOUNTS", "ADMIN");
    const parsed = routeFeesBodySchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const b = parsed.data;
    return ok(routeFeesResultSchema.parse(await raiseRouteFees(ctx, b)));
  } catch (error) {
    return apiFailure(error, "api/v1/accounts/route-fees");
  }
}
