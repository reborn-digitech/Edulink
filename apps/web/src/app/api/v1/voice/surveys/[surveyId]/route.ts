import { surveyAnswerSchema, voiceSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { answerSurvey } from "@/lib/iqac";
import { apiInvalid, ok, readJson } from "@/lib/api-v1";
import { moduleFailure } from "@/lib/rule-refusal";

/** POST /api/v1/voice/surveys/{surveyId} — Answer a survey once; an anonymous one keeps no name. */
export async function POST(request: Request, { params }: { params: Promise<{ surveyId: string }> }) {
  try {
    const ctx = await requireApiRoles("STUDENT", "ALUMNUS", "FACULTY", "HOD");
    const p = await params;
    const parsed = surveyAnswerSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const b = parsed.data;
    return ok(voiceSchema.parse(await answerSurvey(ctx, p.surveyId, b.answers)));
  } catch (error) {
    return moduleFailure(error, "api/v1/voice/surveys/[surveyId]");
  }
}
