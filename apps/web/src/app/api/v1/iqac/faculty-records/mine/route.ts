import { myFacultyProfileSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { myFacultyProfile } from "@/lib/iqac";
import { ok } from "@/lib/api-v1";
import { moduleFailure } from "@/lib/rule-refusal";

/** GET /api/v1/iqac/faculty-records/mine — A teacher's own record, research and FDPs. */
export async function GET() {
  try {
    const ctx = await requireApiRoles("FACULTY", "HOD");
    return ok(myFacultyProfileSchema.parse(await myFacultyProfile(ctx)));
  } catch (error) {
    return moduleFailure(error, "api/v1/iqac/faculty-records/mine");
  }
}
