import { offerBodySchema, offerChangeSchema, schoolOfferAnswerSchema } from "@edulink/contracts";
import { requireApiOperator } from "@/lib/tenancy";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";
import { readOfferAnswer, updateOffer } from "@/lib/school-terms";
import { operatorRefused } from "@/lib/api-reads/operator-school";

/** GET /api/v1/operator/offer — our offer for all schools (or the owner's starting values before the first save), how the live schools stand against it, and the year billed at today's prices. */
export async function GET() {
  try {
    const ctx = await requireApiOperator();
    return ok(schoolOfferAnswerSchema.parse(await readOfferAnswer(ctx)));
  } catch (error) {
    return apiFailure(error, "api/v1/operator/offer");
  }
}

/** PUT /api/v1/operator/offer — change our offer with a reason, against the offer as read; `preview` names every school that moves and writes nothing. */
export async function PUT(request: Request) {
  try {
    const ctx = await requireApiOperator();
    const parsed = offerBodySchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const result = await updateOffer(ctx, parsed.data);
    if ("ok" in result) return operatorRefused(result);
    return ok(offerChangeSchema.parse(result));
  } catch (error) {
    return apiFailure(error, "api/v1/operator/offer");
  }
}
