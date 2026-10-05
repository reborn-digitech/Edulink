import { facultyProfilePublishSchema, myFacultyPublicProfileSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { myPublicProfile, setMyPublicProfile } from "@/lib/faculty-profile";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";

/** GET /api/v1/faculty/profile — my public page: whether there is a record, its preview, whether it is up (5 Oct 2026). */
export async function GET() {
  try {
    const ctx = await requireApiRoles("FACULTY", "HOD");
    return ok(myFacultyPublicProfileSchema.parse(await myPublicProfile(ctx)));
  } catch (error) {
    return apiFailure(error, "api/v1/faculty/profile");
  }
}

/** POST /api/v1/faculty/profile — publish (or refresh) my page from today's rows, or take it down. */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRoles("FACULTY", "HOD");
    const parsed = facultyProfilePublishSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(myFacultyPublicProfileSchema.parse(await setMyPublicProfile(ctx, parsed.data.publish)));
  } catch (error) {
    return apiFailure(error, "api/v1/faculty/profile");
  }
}
