import { officeDirectoryProfileSchema, okSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { updateSchoolProfile } from "@/lib/school-profile";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";
import { apiRefused } from "@/lib/api-reads/admin";

/**
 * POST /api/v1/office/directory — save the school's directory profile: its
 * own words and the admissions contact. A published profile cannot lose its
 * contact; the library says so in the reader's language (a 422).
 */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRole("ADMIN");
    const parsed = officeDirectoryProfileSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const result = await updateSchoolProfile(ctx, parsed.data);
    if (!result.ok) return apiRefused(result);
    return ok(okSchema.parse({ ok: true }));
  } catch (error) {
    return apiFailure(error, "api/v1/office/directory");
  }
}
