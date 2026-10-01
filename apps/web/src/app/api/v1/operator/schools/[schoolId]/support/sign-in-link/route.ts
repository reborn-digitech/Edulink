import { okSchema, operatorSupportUserBodySchema } from "@edulink/contracts";
import { requireApiOperator } from "@/lib/tenancy";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";
import { sendAdminResetLink } from "@/lib/superuser";
import { operatorRefused } from "@/lib/api-reads/operator-school";

/** POST /api/v1/operator/schools/{schoolId}/support/sign-in-link — email one of the school's admins a one-time sign-in link; no password is set or seen. Audited as superuser.admin.signInLink; the school's office is told. */
export async function POST(request: Request, { params }: { params: Promise<{ schoolId: string }> }) {
  try {
    const ctx = await requireApiOperator();
    const { schoolId } = await params;
    const parsed = operatorSupportUserBodySchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const result = await sendAdminResetLink(ctx, schoolId, parsed.data.userId);
    if (!result.ok) return operatorRefused(result);
    return ok(okSchema.parse({ ok: true }));
  } catch (error) {
    return apiFailure(error, "api/v1/operator/schools/[schoolId]/support/sign-in-link");
  }
}
