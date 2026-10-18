import { viduraAnswerActSchema, viduraAnswerReadSchema } from "@edulink/contracts";
import { requireApiOperator } from "@/lib/tenancy";
import { actOnStandardAnswer } from "@/lib/assistant/standard";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";

/** POST /api/v1/operator/vidura/answers/{answerId} — CHECK a draft as the standard answer, REVOKE one, DISCARD a draft. Audited; the same act again changes nothing. */
export async function POST(request: Request, { params }: { params: Promise<{ answerId: string }> }) {
  try {
    const ctx = await requireApiOperator();
    const { answerId } = await params;
    const parsed = viduraAnswerActSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(viduraAnswerReadSchema.parse({ answer: await actOnStandardAnswer(ctx, answerId, parsed.data) }));
  } catch (error) {
    return apiFailure(error, "api/v1/operator/vidura/answers/[answerId]");
  }
}
