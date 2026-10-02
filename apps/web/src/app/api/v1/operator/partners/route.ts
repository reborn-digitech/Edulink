import { operatorPartnerBodySchema, operatorPartnerCreatedSchema, operatorPartnersSchema } from "@edulink/contracts";
import { requireApiOperator } from "@/lib/tenancy";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";
import { createPartner, listPartners } from "@/lib/subscriptions";
import { operatorRefused } from "@/lib/api-reads/operator-school";

/** GET /api/v1/operator/partners — every commission partner with their live schools and what each is owed this month (computed, recorded only). */
export async function GET() {
  try {
    const ctx = await requireApiOperator();
    const partners = await listPartners(ctx);
    return ok(operatorPartnersSchema.parse({ items: partners.map((p) => ({ ...p, createdAt: p.createdAt.toISOString() })) }));
  } catch (error) {
    return apiFailure(error, "api/v1/operator/partners");
  }
}

/** POST /api/v1/operator/partners — add a partner: a name, a share in tenths of a percent, a phone, an email, notes; 201 with the id. Audited as superuser.partner.create. */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiOperator();
    const parsed = operatorPartnerBodySchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const result = await createPartner(ctx, parsed.data);
    if (!result.ok) return operatorRefused(result);
    return ok(operatorPartnerCreatedSchema.parse({ ok: true, partnerId: result.partnerId }), 201);
  } catch (error) {
    return apiFailure(error, "api/v1/operator/partners");
  }
}
