import { quizBankChaptersQuerySchema, quizBankChaptersSchema } from "@edulink/contracts";
import { requireApiAppAdmin } from "@/lib/tenancy";
import { bankChapters } from "@/lib/bank-desk";
import { apiFailure, apiInvalid, ok } from "@/lib/api-v1";

/** GET /api/v1/appadmin/quiz-review/chapters?board=&grade=&subject= — the chapters grouped by class and subject in their book's order (bank-desk, 20 Oct 2026). */
export async function GET(request: Request) {
  try {
    const ctx = await requireApiAppAdmin();
    const parsed = quizBankChaptersQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(quizBankChaptersSchema.parse(await bankChapters(ctx, parsed.data)));
  } catch (error) {
    return apiFailure(error, "api/v1/appadmin/quiz-review/chapters");
  }
}
