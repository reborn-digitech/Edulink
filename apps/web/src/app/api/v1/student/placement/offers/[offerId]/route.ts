import { offerAnswerSchema, offerViewSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { answerOffer } from "@/lib/placement";
import { moduleFailure } from "@/lib/rule-refusal";
import { apiInvalid, ok, readJson } from "@/lib/api-v1";

type Params = { params: Promise<{ offerId: string }> };

/** POST /api/v1/student/placement/offers/{offerId} — Accept or decline an offer. */
export async function POST(request: Request, { params }: Params) {
  try {
    const ctx = await requireApiRoles("STUDENT");
    const p = await params;
    const parsed = offerAnswerSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const b = parsed.data;
    return ok(offerViewSchema.parse(await answerOffer(ctx, p.offerId, b.accept)));
  } catch (error) {
    return moduleFailure(error, "api/v1/student/placement/offers/[offerId]");
  }
}
