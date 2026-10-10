import { facultyStudiosSchema } from "@edulink/contracts";
import { ok } from "@/lib/api-v1";
import { requireApiRoles } from "@/lib/api-roles";
import { moduleFailure } from "@/lib/rule-refusal";
import { facultyStudios } from "@/lib/studio";

/** GET /api/v1/faculty/studios — the studios I teach, coordinate or sit on a jury for, and those juries' sheets (R-56, the studio half, 10 Oct 2026). */
export async function GET() {
  try {
    const ctx = await requireApiRoles("FACULTY", "HOD");
    return ok(facultyStudiosSchema.parse(await facultyStudios(ctx)));
  } catch (error) {
    return moduleFailure(error, "api/v1/faculty/studios");
  }
}
