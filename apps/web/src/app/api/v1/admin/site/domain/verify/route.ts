import { siteDomainConfirmBodySchema, siteDomainViewSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { verifySiteDomain } from "@/lib/site-domains";
import { apiFailure, apiInvalid, budget, ok, readJson } from "@/lib/api-v1";

/** Each Verify asks the DNS and the hosting platform: sixty an hour a person is a press a minute. */
const VERIFY_BUDGET = { limit: 60, windowMs: 60 * 60 * 1000 };

/** POST /api/v1/admin/site/domain/verify — check the domain's DNS now ({ domain }, the one shown), ask for its certificate, and answer its new state; audited. */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRole("ADMIN", "PRINCIPAL");
    const parsed = siteDomainConfirmBodySchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const refused = await budget(`site-domain-verify:${ctx.user.id}`, VERIFY_BUDGET.limit, VERIFY_BUDGET.windowMs);
    if (refused) return refused;
    return ok(siteDomainViewSchema.parse(await verifySiteDomain(ctx, parsed.data.domain)));
  } catch (error) {
    return apiFailure(error, "api/v1/admin/site/domain/verify");
  }
}
