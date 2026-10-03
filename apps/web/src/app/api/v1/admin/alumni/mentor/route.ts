import { alumniFlagResultSchema, alumniMentorSchema } from "@edulink/contracts";
import { setAlumnusMentor } from "@/lib/alumni";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";
import { requireApiRole } from "@/lib/tenancy";

/** POST /api/v1/admin/alumni/mentor — mark an adult alumnus a mentor, or take it back (audited). */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRole("ADMIN");
    const parsed = alumniMentorSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(alumniFlagResultSchema.parse(await setAlumnusMentor(ctx, parsed.data.membershipId, parsed.data.mentor)));
  } catch (error) {
    return apiFailure(error, "api/v1/admin/alumni/mentor");
  }
}
