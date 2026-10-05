import { slipAnswerSchema, slipViewSchema } from "@edulink/contracts";
import { answerSlip, assertSlipAnswerRole, slipForReader } from "@/lib/permission-slips";
import { NOTICE_WRITE_BUDGET, apiFailure, apiInvalid, budget, ok, readJson } from "@/lib/api-v1";
import { requireApiSession } from "@/lib/api-reads/shared";

type Params = { params: Promise<{ postId: string }> };

/** GET /api/v1/shared/bulletin/{postId}/consent — a permission slip as its reader answers it: their children in its audience and each one's answer (5 Oct 2026). */
export async function GET(_request: Request, { params }: Params) {
  try {
    const ctx = await requireApiSession();
    const { postId } = await params;
    return ok(slipViewSchema.parse(await slipForReader(ctx, postId)));
  } catch (error) {
    return apiFailure(error, "api/v1/shared/bulletin/[postId]/consent");
  }
}

/** POST /api/v1/shared/bulletin/{postId}/consent — a guardian's yes or no for one child (an adult student's own), until the slip's day. */
export async function POST(request: Request, { params }: Params) {
  try {
    const ctx = await requireApiSession();
    // The role before the body: the wrong role gets 403, not the body's 422.
    assertSlipAnswerRole(ctx);
    // Counted per person (A3-S-9): each answer checks the child and redraws the slip.
    const refused = await budget(`slip-answer:${ctx.user.id}`, NOTICE_WRITE_BUDGET.limit, NOTICE_WRITE_BUDGET.windowMs);
    if (refused) return refused;
    const { postId } = await params;
    const parsed = slipAnswerSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(slipViewSchema.parse(await answerSlip(ctx, postId, parsed.data)));
  } catch (error) {
    return apiFailure(error, "api/v1/shared/bulletin/[postId]/consent");
  }
}
