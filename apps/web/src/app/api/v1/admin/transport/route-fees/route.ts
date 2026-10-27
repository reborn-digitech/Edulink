import { routeFeesBodySchema, routeFeesResultSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { raiseRouteFees } from "@/lib/college-fees";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";

/**
 * POST /api/v1/admin/transport/route-fees — the office raises a term's route fee on each rider's ledger under the
 * Transport fee head: every pupil riding a route with a fee per term, once for the term (owner-batch-item5, 27 Oct
 * 2026). A school's door, and a college's office may use it too; the college's accounts desk has
 * /api/v1/accounts/route-fees. Who may, and "once", are raiseRouteFees's.
 */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRole("ADMIN");
    const parsed = routeFeesBodySchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(routeFeesResultSchema.parse(await raiseRouteFees(ctx, parsed.data)));
  } catch (error) {
    return apiFailure(error, "api/v1/admin/transport/route-fees");
  }
}
