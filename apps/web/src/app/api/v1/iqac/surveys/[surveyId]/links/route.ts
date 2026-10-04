import { surveyLinkSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { makeSurveyLink } from "@/lib/iqac";
import { ok } from "@/lib/api-v1";
import { moduleFailure } from "@/lib/rule-refusal";

/** POST /api/v1/iqac/surveys/{surveyId}/links — One signed link for one respondent of an employer's or a parent's survey (G-5). */
export async function POST(_request: Request, { params }: { params: Promise<{ surveyId: string }> }) {
  try {
    const ctx = await requireApiRoles("IQAC", "ADMIN");
    const { surveyId } = await params;
    return ok(surveyLinkSchema.parse(await makeSurveyLink(ctx, surveyId)));
  } catch (error) {
    return moduleFailure(error, "api/v1/iqac/surveys/[surveyId]/links");
  }
}
