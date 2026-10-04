import { companySaveSchema, recruiterCompanySchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { recruiterCompany, registerCompany } from "@/lib/placement-recruiter";
import { moduleFailure } from "@/lib/rule-refusal";
import { apiInvalid, ok, readJson } from "@/lib/api-v1";

/** GET /api/v1/recruiter/company — The recruiter's company and colleagues. */
export async function GET() {
  try {
    const ctx = await requireApiRoles("RECRUITER");
    return ok(recruiterCompanySchema.parse(await recruiterCompany(ctx)));
  } catch (error) {
    return moduleFailure(error, "api/v1/recruiter/company");
  }
}

/** POST /api/v1/recruiter/company — Register the recruiter's company. */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRoles("RECRUITER");
    const parsed = companySaveSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const b = parsed.data;
    return ok(recruiterCompanySchema.parse(await registerCompany(ctx, b)));
  } catch (error) {
    return moduleFailure(error, "api/v1/recruiter/company");
  }
}
