import { alumniCompanyLinkResultSchema, alumniCompanyLinkSaveSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { linkMyCompany } from "@/lib/placement-alumni";
import { moduleFailure } from "@/lib/rule-refusal";
import { apiInvalid, ok, readJson } from "@/lib/api-v1";

/** POST /api/v1/alumni/college/company — An alumnus names their company. */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRoles("ALUMNUS");
    const parsed = alumniCompanyLinkSaveSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const b = parsed.data;
    return ok(alumniCompanyLinkResultSchema.parse(await linkMyCompany(ctx, b)));
  } catch (error) {
    return moduleFailure(error, "api/v1/alumni/college/company");
  }
}
