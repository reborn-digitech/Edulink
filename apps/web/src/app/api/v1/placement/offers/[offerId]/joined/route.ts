import { offerJoinedSchema, offerViewSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { cellActorForOffer, recordJoined } from "@/lib/placement";
import { recruiterActorForOffer } from "@/lib/placement-recruiter";
import { moduleFailure } from "@/lib/rule-refusal";
import { apiInvalid, ok, readJson } from "@/lib/api-v1";

type Params = { params: Promise<{ offerId: string }> };

/** POST /api/v1/placement/offers/{offerId}/joined — The day an accepted offer's student joined. */
export async function POST(request: Request, { params }: Params) {
  try {
    const ctx = await requireApiRoles("TPO", "RECRUITER");
    const p = await params;
    const parsed = offerJoinedSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const b = parsed.data;
    return ok(offerViewSchema.parse(await recordJoined(ctx.role === "RECRUITER" ? await recruiterActorForOffer(ctx, p.offerId) : await cellActorForOffer(ctx, p.offerId), p.offerId, b.joinedOn)));
  } catch (error) {
    return moduleFailure(error, "api/v1/placement/offers/[offerId]/joined");
  }
}
