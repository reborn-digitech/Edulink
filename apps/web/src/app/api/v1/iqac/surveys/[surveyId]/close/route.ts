import { surveysSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { closeSurvey } from "@/lib/iqac";
import { ok } from "@/lib/api-v1";
import { moduleFailure } from "@/lib/rule-refusal";

/** POST /api/v1/iqac/surveys/{surveyId}/close — Close a survey now; its salt is wiped. */
export async function POST(_request: Request, { params }: { params: Promise<{ surveyId: string }> }) {
  try {
    const ctx = await requireApiRoles("IQAC", "ADMIN");
    const p = await params;
    return ok(surveysSchema.parse(await closeSurvey(ctx, p.surveyId)));
  } catch (error) {
    return moduleFailure(error, "api/v1/iqac/surveys/[surveyId]/close");
  }
}
