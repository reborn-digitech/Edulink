import { operatorSignOutEverywhereSchema, operatorSupportUserBodySchema } from "@edulink/contracts";
import { requireApiOperator } from "@/lib/tenancy";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";
import { signOutAdminEverywhere } from "@/lib/superuser";
import { operatorRefused } from "@/lib/api-reads/operator-school";

/** POST /api/v1/operator/schools/{schoolId}/support/sign-out — sign one of the school's admins out of every device: sessions, unspent tokens and push registrations. Audited as superuser.admin.signOut; the school's office is told. */
export async function POST(request: Request, { params }: { params: Promise<{ schoolId: string }> }) {
  try {
    const ctx = await requireApiOperator();
    const { schoolId } = await params;
    const parsed = operatorSupportUserBodySchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const result = await signOutAdminEverywhere(ctx, schoolId, parsed.data.userId);
    if (!result.ok) return operatorRefused(result);
    return ok(operatorSignOutEverywhereSchema.parse({ ok: true, sessionsEnded: result.sessionsEnded ?? 0 }));
  } catch (error) {
    return apiFailure(error, "api/v1/operator/schools/[schoolId]/support/sign-out");
  }
}
