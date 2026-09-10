import { contestQuestionSavedSchema, contestQuestionSchema } from "@edulink/contracts";
import { AccessError, requireApiAppAdmin } from "@/lib/tenancy";
import { createBankQuestion } from "@/lib/app-admin";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";
import { refused } from "../../../../shared/helpers";

/**
 * POST /api/v1/appadmin/bank/{topicId}/questions — add a question in English;
 * the save translates it to Hindi and Marathi (`translated` says whether that
 * ran). The rules — a real stem, two non-empty options, a marked answer, a
 * worked solution — are createBankQuestion's.
 */
export async function POST(request: Request, { params }: { params: Promise<{ topicId: string }> }) {
  try {
    const ctx = await requireApiAppAdmin();
    const { topicId } = await params;
    const parsed = contestQuestionSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const result = await createBankQuestion(ctx, topicId, parsed.data);
    if (!result.ok) {
      if (result.errorKey === "appadmin.noSuchTopic") throw new AccessError(result.errorKey, "NOT_FOUND");
      return refused(result.errorKey);
    }
    return ok(contestQuestionSavedSchema.parse({ questionId: result.questionId, translated: result.translated }), 201);
  } catch (error) {
    return apiFailure(error, "api/v1/appadmin/bank/[topicId]/questions");
  }
}
