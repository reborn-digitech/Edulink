import { academicsChangedResultSchema, facultyDepartmentSaveSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { setFacultyDepartment } from "@/lib/academics";
import { apiInvalid, ok, readJson } from "@/lib/api-v1";
import { moduleFailure } from "@/lib/rule-refusal";

/** POST /api/v1/academics/faculty — Put a faculty member in a department (or none). */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRoles("ADMIN");
    const parsed = facultyDepartmentSaveSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const q = parsed.data;
    return ok(academicsChangedResultSchema.parse(await setFacultyDepartment(ctx, q)));
  } catch (error) {
    return moduleFailure(error, "api/v1/academics/faculty");
  }
}
