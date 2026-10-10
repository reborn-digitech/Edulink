import { requireApiAppAdmin } from "@/lib/tenancy";
import { acceptItem } from "@/lib/quiz-review";
import { apiFailure } from "@/lib/api-v1";
import { answer } from "../../_shared";

/** POST /api/v1/appadmin/quiz-review/{questionId}/stamp — accept: the first stamp serves the item; again is a no-op. */
export async function POST(_request: Request, { params }: { params: Promise<{ questionId: string }> }) {
  try {
    const ctx = await requireApiAppAdmin();
    const { questionId } = await params;
    return await answer(await acceptItem(ctx, questionId));
  } catch (error) {
    return apiFailure(error, "api/v1/appadmin/quiz-review/[questionId]/stamp");
  }
}
