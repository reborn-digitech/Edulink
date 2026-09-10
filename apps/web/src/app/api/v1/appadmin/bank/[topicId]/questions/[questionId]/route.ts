import { contestQuestionSavedSchema, contestQuestionSchema } from "@edulink/contracts";
import { AccessError, requireApiAppAdmin } from "@/lib/tenancy";
import { getBankQuestion, updateBankQuestion } from "@/lib/app-admin";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";
import { refused } from "../../../../../shared/helpers";

/**
 * POST /api/v1/appadmin/bank/{topicId}/questions/{questionId} — edit a
 * question and re-translate it, so the three languages cannot drift. A
 * question that is not in this chapter is a 404, as the web's edit page is.
 */
export async function POST(request: Request, { params }: { params: Promise<{ topicId: string; questionId: string }> }) {
  try {
    const ctx = await requireApiAppAdmin();
    const { topicId, questionId } = await params;
    const question = await getBankQuestion(ctx, questionId);
    if (!question || question.topicId !== topicId) throw new AccessError("appadmin.noSuchQuestion", "NOT_FOUND");
    const parsed = contestQuestionSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const result = await updateBankQuestion(ctx, question.id, parsed.data);
    if (!result.ok) return refused(result.errorKey);
    return ok(contestQuestionSavedSchema.parse({ questionId: question.id, translated: result.translated }));
  } catch (error) {
    return apiFailure(error, "api/v1/appadmin/bank/[topicId]/questions/[questionId]");
  }
}
