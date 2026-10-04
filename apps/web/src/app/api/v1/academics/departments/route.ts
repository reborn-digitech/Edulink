import { academicsIdResultSchema, departmentSaveSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { saveDepartment } from "@/lib/academics";
import { apiInvalid, ok, readJson } from "@/lib/api-v1";
import { moduleFailure } from "@/lib/rule-refusal";

/** POST /api/v1/academics/departments — A department made or changed: code, name, its HOD, the lowest attendance its HOD may condone. */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRoles("ADMIN");
    const parsed = departmentSaveSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const q = parsed.data;
    return ok(academicsIdResultSchema.parse(await saveDepartment(ctx, q)));
  } catch (error) {
    return moduleFailure(error, "api/v1/academics/departments");
  }
}
