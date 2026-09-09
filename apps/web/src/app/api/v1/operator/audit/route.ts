import { operatorAuditQuerySchema, operatorAuditSchema } from "@edulink/contracts";
import { requireApiOperator } from "@/lib/tenancy";
import { apiFailure, apiInvalid, ok } from "@/lib/api-v1";
import { operatorAudit } from "@/lib/api-reads/operator";

/** GET /api/v1/operator/audit — the server log, newest first; ?limit= up to 200. */
export async function GET(request: Request) {
  try {
    const ctx = await requireApiOperator();
    const parsed = operatorAuditQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(operatorAuditSchema.parse(await operatorAudit(ctx, parsed.data.limit)));
  } catch (error) {
    return apiFailure(error, "api/v1/operator/audit");
  }
}
