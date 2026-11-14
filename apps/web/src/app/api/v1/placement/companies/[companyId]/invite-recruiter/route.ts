import { companyViewSchema, recruiterColleagueSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { inviteCompanyRecruiter } from "@/lib/placement-recruiter";
import { moduleFailure } from "@/lib/rule-refusal";
import { apiInvalid, budget, FANOUT_BUDGET, ok, readJson } from "@/lib/api-v1";

type Params = { params: Promise<{ companyId: string }> };

/**
 * POST /api/v1/placement/companies/{companyId}/invite-recruiter — the cell that verified a company invites its first
 * recruiter by the address of a recruiter account (TA-090); the same answer for any address. Spends the fanout budget,
 * as a colleague's invitation does.
 */
export async function POST(request: Request, { params }: Params) {
  try {
    const ctx = await requireApiRoles("TPO");
    const refused = await budget(`fanout:${ctx.user.id}`, FANOUT_BUDGET.limit, FANOUT_BUDGET.windowMs);
    if (refused) return refused;
    const parsed = recruiterColleagueSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const p = await params;
    return ok(companyViewSchema.parse(await inviteCompanyRecruiter(ctx, p.companyId, parsed.data.email)));
  } catch (error) {
    return moduleFailure(error, "api/v1/placement/companies/[companyId]/invite-recruiter");
  }
}
