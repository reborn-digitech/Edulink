import { operatorAuditQuerySchema, operatorAuditSchema } from "@edulink/contracts";
import { requireApiOperator } from "@/lib/tenancy";
import { apiFailure, apiInvalid, ok } from "@/lib/api-v1";
import { operatorAuditPage } from "@/lib/api-reads/operator-school";

/** GET /api/v1/operator/audit — the server log, newest first: ?limit= up to 200, ?page=, and the web's filters (action, q, from, to, live). */
export async function GET(request: Request) {
  try {
    const ctx = await requireApiOperator();
    const parsed = operatorAuditQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(operatorAuditSchema.parse(await operatorAuditPage(ctx, parsed.data)));
  } catch (error) {
    return apiFailure(error, "api/v1/operator/audit");
  }
}
