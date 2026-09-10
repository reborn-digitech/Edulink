import { operatorSchoolCreatedSchema, operatorSchoolDetailsBodySchema } from "@edulink/contracts";
import { requireApiOperator } from "@/lib/tenancy";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";
import { createSchool } from "@/lib/superuser";
import { operatorRefused } from "@/lib/api-reads/operator-school";

/** POST /api/v1/operator/schools — add a school (the web's /root/new); 201 with its id and join code. Audited as superuser.school.create. */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiOperator();
    const parsed = operatorSchoolDetailsBodySchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const result = await createSchool(ctx, parsed.data);
    if (!result.ok) return operatorRefused(result);
    return ok(operatorSchoolCreatedSchema.parse({ ok: true, schoolId: result.schoolId, code: result.code }), 201);
  } catch (error) {
    return apiFailure(error, "api/v1/operator/schools");
  }
}
