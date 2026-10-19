import { quizBankMatrixQuerySchema, quizBankMatrixSchema } from "@edulink/contracts";
import { requireApiAppAdmin } from "@/lib/tenancy";
import { bankMatrix } from "@/lib/bank-desk";
import { apiFailure, apiInvalid, ok } from "@/lib/api-v1";

/** GET /api/v1/appadmin/quiz-review/matrix?board= — the bank by class and subject: served questions, chapters, chapters at the target (bank-desk, 20 Oct 2026). */
export async function GET(request: Request) {
  try {
    const ctx = await requireApiAppAdmin();
    const parsed = quizBankMatrixQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(quizBankMatrixSchema.parse(await bankMatrix(ctx, parsed.data)));
  } catch (error) {
    return apiFailure(error, "api/v1/appadmin/quiz-review/matrix");
  }
}
