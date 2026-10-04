import { recruiterColleagueSchema, recruiterCompanySchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { removeColleague } from "@/lib/placement-recruiter";
import { moduleFailure } from "@/lib/rule-refusal";
import { apiInvalid, ok, readJson } from "@/lib/api-v1";

/** POST /api/v1/recruiter/company/colleagues/remove — take a recruiter (or oneself) off the company (campaign S-16). */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRoles("RECRUITER");
    const parsed = recruiterColleagueSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(recruiterCompanySchema.parse(await removeColleague(ctx, parsed.data.email)));
  } catch (error) {
    return moduleFailure(error, "api/v1/recruiter/company/colleagues/remove");
  }
}
