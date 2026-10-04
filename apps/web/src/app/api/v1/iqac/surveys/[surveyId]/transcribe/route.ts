import { surveyResultsSchema, surveyTranscribeSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { transcribeResponse } from "@/lib/iqac";
import { apiInvalid, ok, readJson } from "@/lib/api-v1";
import { moduleFailure } from "@/lib/rule-refusal";

/** POST /api/v1/iqac/surveys/{surveyId}/transcribe — Type in an employer's or a parent's paper form. */
export async function POST(request: Request, { params }: { params: Promise<{ surveyId: string }> }) {
  try {
    const ctx = await requireApiRoles("IQAC", "ADMIN");
    const p = await params;
    const parsed = surveyTranscribeSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const b = parsed.data;
    return ok(surveyResultsSchema.parse(await transcribeResponse(ctx, p.surveyId, b)));
  } catch (error) {
    return moduleFailure(error, "api/v1/iqac/surveys/[surveyId]/transcribe");
  }
}
