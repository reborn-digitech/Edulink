import { companyListSchema, companySaveSchema, companyViewSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { addCompany, listCompanies } from "@/lib/placement";
import { moduleFailure } from "@/lib/rule-refusal";
import { apiInvalid, ok, readJson } from "@/lib/api-v1";

/** GET /api/v1/placement/companies — The companies the college works with. */
export async function GET() {
  try {
    const ctx = await requireApiRoles("TPO", "ADMIN", "PRINCIPAL");
    return ok(companyListSchema.parse(await listCompanies(ctx)));
  } catch (error) {
    return moduleFailure(error, "api/v1/placement/companies");
  }
}

/** POST /api/v1/placement/companies — The TPO adds a company by GSTIN or CIN. */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRoles("TPO");
    const parsed = companySaveSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const b = parsed.data;
    return ok(companyViewSchema.parse(await addCompany(ctx, b)));
  } catch (error) {
    return moduleFailure(error, "api/v1/placement/companies");
  }
}
