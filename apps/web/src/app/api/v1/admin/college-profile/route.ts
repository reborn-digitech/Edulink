import { collegeProfileSchema, collegeProfileSetSchema } from "@edulink/contracts";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";
import { requireApiRole } from "@/lib/tenancy";
import { collegeProfile, setCollegeProfile } from "@/lib/college-profile";
import { moduleFailure } from "@/lib/rule-refusal";

/** GET /api/v1/admin/college-profile — a college's regulator references (4 Oct 2026); null fields for a school. The office and the head. */
export async function GET() {
  try {
    const ctx = await requireApiRole("ADMIN", "PRINCIPAL");
    return ok(collegeProfileSchema.parse(await collegeProfile(ctx)));
  } catch (error) {
    return apiFailure(error, "api/v1/admin/college-profile");
  }
}

/** POST /api/v1/admin/college-profile — the office writes; a key left out stays, null clears; refused at a school. Audited college.profile.update, and college.streams.set when the streams change. */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRole("ADMIN");
    const parsed = collegeProfileSetSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    await setCollegeProfile(ctx, parsed.data);
    return ok(collegeProfileSchema.parse(await collegeProfile(ctx)));
  } catch (error) {
    // A college with no stream left is a 422 on the field (RuleRefusal, 5 Oct 2026).
    return moduleFailure(error, "api/v1/admin/college-profile");
  }
}
