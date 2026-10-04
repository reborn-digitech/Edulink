import { surveySaveSchema, surveysSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { createSurvey, listSurveys } from "@/lib/iqac";
import { apiInvalid, ok, readJson } from "@/lib/api-v1";
import { moduleFailure } from "@/lib/rule-refusal";

/** GET /api/v1/iqac/surveys — The college's surveys. */
export async function GET() {
  try {
    const ctx = await requireApiRoles("IQAC", "ADMIN", "PRINCIPAL");
    return ok(surveysSchema.parse(await listSurveys(ctx)));
  } catch (error) {
    return moduleFailure(error, "api/v1/iqac/surveys");
  }
}

/** POST /api/v1/iqac/surveys — Open a survey: the SSS, course feedback on an offering, exit, alumni, employer, parent or teachers'. */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRoles("IQAC", "ADMIN");
    const parsed = surveySaveSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const b = parsed.data;
    return ok(surveysSchema.parse(await createSurvey(ctx, b)));
  } catch (error) {
    return moduleFailure(error, "api/v1/iqac/surveys");
  }
}
