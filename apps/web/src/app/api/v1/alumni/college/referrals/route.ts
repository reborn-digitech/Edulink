import { alumniReferralSaveSchema, alumniReferralViewSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { referOpening } from "@/lib/placement-alumni";
import { moduleFailure } from "@/lib/rule-refusal";
import { apiInvalid, ok, readJson } from "@/lib/api-v1";

/** POST /api/v1/alumni/college/referrals — Refer an opening. */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRoles("ALUMNUS");
    const parsed = alumniReferralSaveSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const b = parsed.data;
    return ok(alumniReferralViewSchema.parse(await referOpening(ctx, b)));
  } catch (error) {
    return moduleFailure(error, "api/v1/alumni/college/referrals");
  }
}
