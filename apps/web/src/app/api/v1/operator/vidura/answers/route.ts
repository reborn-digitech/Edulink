import { viduraAnswerSchema, viduraAnswersSchema, viduraAnswerTrySchema } from "@edulink/contracts";
import { requireApiOperator } from "@/lib/tenancy";
import { listStandardAnswers, tryStandardAnswer } from "@/lib/assistant/standard";
import { apiFailure, apiInvalid, budget, ok, readJson } from "@/lib/api-v1";

/** GET /api/v1/operator/vidura/answers — the standard answers with their hits, the drafts and the revoked (Vidura pass 3). */
export async function GET() {
  try {
    const ctx = await requireApiOperator();
    return ok(viduraAnswersSchema.parse(await listStandardAnswers(ctx)));
  } catch (error) {
    return apiFailure(error, "api/v1/operator/vidura/answers");
  }
}

/** POST /api/v1/operator/vidura/answers — ask Vidura as a role; the answer is kept as a draft (201). Audited. */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiOperator();
    const parsed = viduraAnswerTrySchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    // Each trial is a question to the model: a budget, as the drawer's own questions have a day's cap.
    const refused = await budget(`vidura-try:${ctx.user.id}`, 60, 60 * 60_000);
    if (refused) return refused;
    return ok(viduraAnswerSchema.parse(await tryStandardAnswer(ctx, parsed.data)), 201);
  } catch (error) {
    return apiFailure(error, "api/v1/operator/vidura/answers");
  }
}
