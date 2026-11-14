import { okSchema, operatorCompanyRecruiterInviteBodySchema } from "@edulink/contracts";
import { requireApiOperator } from "@/lib/tenancy";
import { apiInvalid, ok, readJson } from "@/lib/api-v1";
import { moduleFailure } from "@/lib/rule-refusal";
import { operatorInviteCompanyRecruiter } from "@/lib/placement-recruiter";

/**
 * POST /api/v1/operator/companies/invite-recruiter — the operator invites a company's first recruiter, the company named
 * by its GSTIN or CIN and the recruiter by the address of their account (TA-090); the same answer for any address;
 * audited superuser.recruiter.invite.
 */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiOperator();
    const parsed = operatorCompanyRecruiterInviteBodySchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(okSchema.parse(await operatorInviteCompanyRecruiter(ctx, parsed.data.identifier, parsed.data.email)));
  } catch (error) {
    return moduleFailure(error, "api/v1/operator/companies/invite-recruiter");
  }
}
