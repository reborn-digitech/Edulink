import { companyViewSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { verifyCompany } from "@/lib/placement";
import { moduleFailure } from "@/lib/rule-refusal";
import { ok } from "@/lib/api-v1";

type Params = { params: Promise<{ companyId: string }> };

/** POST /api/v1/placement/companies/{companyId}/verify — The TPO's word that a company is checked. */
export async function POST(_request: Request, { params }: Params) {
  try {
    const ctx = await requireApiRoles("TPO");
    const p = await params;
    return ok(companyViewSchema.parse(await verifyCompany(ctx, p.companyId)));
  } catch (error) {
    return moduleFailure(error, "api/v1/placement/companies/[companyId]/verify");
  }
}
