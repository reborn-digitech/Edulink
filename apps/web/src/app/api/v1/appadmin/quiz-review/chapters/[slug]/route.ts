import { quizBankChapterQuerySchema, quizBankChapterSchema } from "@edulink/contracts";
import { requireApiAppAdmin } from "@/lib/tenancy";
import { bankChapter } from "@/lib/bank-desk";
import { apiFailure, apiInvalid, ok } from "@/lib/api-v1";

/** GET /api/v1/appadmin/quiz-review/chapters/{slug}?lang=&state=&page= — one chapter's questions, fifty a page, in English, Hindi or Marathi (bank-desk, 20 Oct 2026). */
export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const ctx = await requireApiAppAdmin();
    const { slug } = await params;
    const parsed = quizBankChapterQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(quizBankChapterSchema.parse(await bankChapter(ctx, slug, parsed.data)));
  } catch (error) {
    return apiFailure(error, "api/v1/appadmin/quiz-review/chapters/[slug]");
  }
}
