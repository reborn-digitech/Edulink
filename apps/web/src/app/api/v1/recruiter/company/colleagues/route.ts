import { recruiterColleagueSchema, recruiterCompanySchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { addColleague } from "@/lib/placement-recruiter";
import { moduleFailure } from "@/lib/rule-refusal";
import { apiInvalid, ok, readJson } from "@/lib/api-v1";

/** POST /api/v1/recruiter/company/colleagues — Add another recruiter account to the company. */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRoles("RECRUITER");
    const parsed = recruiterColleagueSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const b = parsed.data;
    return ok(recruiterCompanySchema.parse(await addColleague(ctx, b.email)));
  } catch (error) {
    return moduleFailure(error, "api/v1/recruiter/company/colleagues");
  }
}
