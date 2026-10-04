import { collegeAdmitBodySchema, collegeAdmittedSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { admitStudent } from "@/lib/college-admissions";
import { apiInvalid, ok, readJson } from "@/lib/api-v1";
import { moduleFailure } from "@/lib/rule-refusal";

type Params = { params: Promise<{ applicationId: string }> };

/** POST /api/v1/college/admissions/applications/{applicationId}/admit — The seat: account, membership, record, programme enrolment, academic seat and fee plan in one transaction. */
export async function POST(request: Request, { params }: Params) {
  try {
    const ctx = await requireApiRoles("ADMIN");
    const { applicationId } = await params;
    const parsed = collegeAdmitBodySchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const b = parsed.data;
    return ok(collegeAdmittedSchema.parse(await admitStudent(ctx, applicationId, b)));
  } catch (error) {
    return moduleFailure(error, "api/v1/college/admissions/applications/[applicationId]/admit");
  }
}
