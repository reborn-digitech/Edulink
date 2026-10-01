import { decisionsQuerySchema, decisionsSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { listDecisions } from "@/lib/decision-log";
import { apiFailure, apiInvalid, ok } from "@/lib/api-v1";

/** GET /api/v1/principal/decisions?from=&to=&kind=&cursor=&limit= — the head's own decisions, newest first; the office reads the head's. */
export async function GET(request: Request) {
  try {
    const ctx = await requireApiRole("PRINCIPAL", "ADMIN");
    const parsed = decisionsQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(decisionsSchema.parse(await listDecisions(ctx, parsed.data)));
  } catch (error) {
    return apiFailure(error, "api/v1/principal/decisions");
  }
}
