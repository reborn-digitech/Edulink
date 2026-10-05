import { contestQuestionSavedSchema, contestQuestionSchema, okSchema } from "@edulink/contracts";
import { AccessError, requireApiAppAdmin } from "@/lib/tenancy";
import { deleteBankQuestion, getBankQuestion, updateBankQuestion } from "@/lib/app-admin";
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

/**
 * DELETE /api/v1/appadmin/bank/{topicId}/questions/{questionId} — the content
 * team takes a question out of the bank (the web's deleteBankQuestion, R-50);
 * the answers pupils gave it go with it, earned badges stay. Audited
 * appadmin.question.delete with the platform's null school. A question that
 * is not in this chapter is a 404, as the edit is; anyone not on the content
 * team is a 403 before the ids are read.
 */
export async function DELETE(_request: Request, { params }: { params: Promise<{ topicId: string; questionId: string }> }) {
  try {
    const ctx = await requireApiAppAdmin();
    const { topicId, questionId } = await params;
    const question = await getBankQuestion(ctx, questionId);
    if (!question || question.topicId !== topicId) throw new AccessError("appadmin.noSuchQuestion", "NOT_FOUND");
    const result = await deleteBankQuestion(ctx, question.id);
    if (!result.ok) throw new AccessError(result.errorKey, "NOT_FOUND");
    return ok(okSchema.parse({ ok: true }));
  } catch (error) {
    return apiFailure(error, "api/v1/appadmin/bank/[topicId]/questions/[questionId]");
  }
}
