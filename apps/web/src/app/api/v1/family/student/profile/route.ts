import { okSchema, familyStudentProfileSaveSchema, familyStudentProfileSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { saveStudentProfile, studentProfile } from "@/lib/api-reads/family";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";
import { fieldFailure } from "../../_shared";

/** GET /api/v1/family/student/profile — how the pupil looks, their schools, practice, competitions and badges. */
export async function GET() {
  try {
    const ctx = await requireApiRole("STUDENT");
    return ok(familyStudentProfileSchema.parse(await studentProfile(ctx)));
  } catch (error) {
    return apiFailure(error, "api/v1/family/student/profile");
  }
}

/** POST /api/v1/family/student/profile — preferred name, bio, avatar and (while allowed) date of birth. */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRole("STUDENT");
    const parsed = familyStudentProfileSaveSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const result = await saveStudentProfile(ctx, parsed.data);
    if (!result.ok) return fieldFailure(result.issues);
    return ok(okSchema.parse({ ok: true }));
  } catch (error) {
    return apiFailure(error, "api/v1/family/student/profile");
  }
}
