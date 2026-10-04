import { NextResponse } from "next/server";
import { apiErrorSchema, publicSurveySchema, surveyAnswerSchema } from "@edulink/contracts";
import { answerByLink, linkSurveyView } from "@/lib/iqac";
import { apiInvalid, ok, readJson } from "@/lib/api-v1";
import { moduleFailure } from "@/lib/rule-refusal";
import { AccessError } from "@/lib/access-error";
import { CODE_LOOKUPS, consumeByCaller } from "@/lib/rate-limit";
import { getT } from "@/lib/i18n/server";

/**
 * GET|POST /api/v1/public/surveys/{token} — an employer's (or a parent's)
 * survey through the signed link the IQAC desk handed them (G-5). Signed
 * out, so the caller is an address and is counted as the certificate check
 * counts one; a forged, closed or wrong link is 404 either way.
 */
async function limited(): Promise<NextResponse | null> {
  const gate = await consumeByCaller("survey-link", CODE_LOOKUPS);
  if (gate.allowed) return null;
  const t = await getT();
  return NextResponse.json(apiErrorSchema.parse({ error: t("common.tryAgainMoment"), code: "RATE_LIMITED", retryAfterSeconds: gate.retryAfterSeconds }), { status: 429, headers: { "Retry-After": String(gate.retryAfterSeconds), "Cache-Control": "no-store" } });
}

export async function GET(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  try {
    const refused = await limited();
    if (refused) return refused;
    const { token } = await params;
    const view = await linkSurveyView(token, await getT());
    if (!view) throw new AccessError("iqac.refuseNotYourSurvey", "NOT_FOUND");
    return ok(publicSurveySchema.parse(view));
  } catch (error) {
    return moduleFailure(error, "api/v1/public/surveys/[token]");
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  try {
    const refused = await limited();
    if (refused) return refused;
    const { token } = await params;
    const parsed = surveyAnswerSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(publicSurveySchema.parse(await answerByLink(token, parsed.data.answers, await getT())));
  } catch (error) {
    return moduleFailure(error, "api/v1/public/surveys/[token]");
  }
}
