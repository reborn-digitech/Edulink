import { operatorExpertApplicationDecideBodySchema, operatorExpertApplicationDecidedSchema } from "@edulink/contracts";
import { requireApiOperator, AccessError } from "@/lib/tenancy";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";
import { apiRefused } from "@/lib/api-reads/admin";
import { decideExpertApplication } from "@/lib/expert-applications";

/**
 * POST /api/v1/operator/expert-applications/{id}/decide — the operator's answer to an expert's application
 * (15 Oct 2026). APPROVE makes the account and an unpublished profile and sends the invitation's link, whose
 * form sets the password; REFUSE takes a coded reason (OTHER with a note) and the applicant is told by email in
 * their language. Audited as operator.expertApplication.approve / .refuse. 404 for no such application, 422 for
 * a refusal (already decided, no reason, an address that is already an expert's).
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await requireApiOperator();
    const { id } = await params;
    const parsed = operatorExpertApplicationDecideBodySchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const result = await decideExpertApplication(ctx, id, parsed.data);
    if (!result.ok) {
      if (result.errorKey === "expertApply.noSuchApplication") throw new AccessError(result.errorKey, "NOT_FOUND");
      return apiRefused({ errorKey: result.errorKey });
    }
    return ok(operatorExpertApplicationDecidedSchema.parse(result));
  } catch (error) {
    return apiFailure(error, "api/v1/operator/expert-applications/[id]/decide");
  }
}
