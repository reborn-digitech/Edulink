import { expertProfileSchema, okSchema, expertSaveProfileSchema } from "@edulink/contracts";
import { getOwnProfile, ownImpact, updateOwnProfile } from "@/lib/experts";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";
import { requireApiExpert } from "@/lib/api-reads/shared";
import { requireApiExpertRole } from "@/app/api/v1/expert/guard";

/**
 * GET /api/v1/shared/expert/profile — what the expert wrote about themselves, and what the work has added up to.
 *
 * Read by the ROLE, listed or not (QA-53, QA campaign of 24 October 2026): `published: false` is how the phone says
 * "your profile is being reviewed", which the web says by its /expert/pending page; the door refused an expert under
 * review, so the phone could not tell and offered a Profile its save door refuses. Saving stays the listed expert's.
 */
export async function GET() {
  try {
    const ctx = await requireApiExpertRole();
    const [profile, impact] = await Promise.all([getOwnProfile(ctx), ownImpact(ctx)]);
    return ok(expertProfileSchema.parse({ profile, impact }));
  } catch (error) {
    return apiFailure(error, "api/v1/shared/expert/profile");
  }
}

/** POST /api/v1/shared/expert/profile — the expert's own words; published and verified are never theirs to set. */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiExpert();
    const parsed = expertSaveProfileSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    await updateOwnProfile(ctx, parsed.data);
    return ok(okSchema.parse({ ok: true }));
  } catch (error) {
    return apiFailure(error, "api/v1/shared/expert/profile");
  }
}
