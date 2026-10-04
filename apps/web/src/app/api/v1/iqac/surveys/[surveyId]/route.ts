import { surveyResultsSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { surveyResults } from "@/lib/iqac";
import { ok } from "@/lib/api-v1";
import { moduleFailure } from "@/lib/rule-refusal";

/** GET /api/v1/iqac/surveys/{surveyId} — A survey's aggregates (never a respondent; hidden below five answers); a teacher reads their own offering's course feedback, an HOD the department's. */
export async function GET(_request: Request, { params }: { params: Promise<{ surveyId: string }> }) {
  try {
    const ctx = await requireApiRoles("IQAC", "ADMIN", "PRINCIPAL", "FACULTY", "HOD");
    const p = await params;
    return ok(surveyResultsSchema.parse(await surveyResults(ctx, p.surveyId)));
  } catch (error) {
    return moduleFailure(error, "api/v1/iqac/surveys/[surveyId]");
  }
}
