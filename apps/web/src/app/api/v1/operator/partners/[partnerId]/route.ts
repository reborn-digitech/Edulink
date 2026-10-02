import { okSchema, operatorPartnerUpdateBodySchema } from "@edulink/contracts";
import { requireApiOperator } from "@/lib/tenancy";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";
import { updatePartner } from "@/lib/subscriptions";
import { operatorRefused } from "@/lib/api-reads/operator-school";

/** PATCH /api/v1/operator/partners/{partnerId} — correct a partner; only the fields sent change. Audited as superuser.partner.update. */
export async function PATCH(request: Request, { params }: { params: Promise<{ partnerId: string }> }) {
  try {
    const ctx = await requireApiOperator();
    const { partnerId } = await params;
    const parsed = operatorPartnerUpdateBodySchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const result = await updatePartner(ctx, partnerId, parsed.data);
    if (!result.ok) return operatorRefused(result);
    return ok(okSchema.parse({ ok: true }));
  } catch (error) {
    return apiFailure(error, "api/v1/operator/partners/[partnerId]");
  }
}
