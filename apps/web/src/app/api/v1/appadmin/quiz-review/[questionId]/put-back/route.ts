import { requireApiAppAdmin } from "@/lib/tenancy";
import { putBackItem } from "@/lib/quiz-review";
import { apiFailure } from "@/lib/api-v1";
import { answer } from "../../_shared";

/** POST /api/v1/appadmin/quiz-review/{questionId}/put-back — a taken-down item served again; again is a no-op. */
export async function POST(_request: Request, { params }: { params: Promise<{ questionId: string }> }) {
  try {
    const ctx = await requireApiAppAdmin();
    const { questionId } = await params;
    return await answer(await putBackItem(ctx, questionId));
  } catch (error) {
    return apiFailure(error, "api/v1/appadmin/quiz-review/[questionId]/put-back");
  }
}
