import { gigDecideBodySchema, gigDecidedSchema } from "@edulink/contracts";
import { requireApiAppAdmin } from "@/lib/tenancy";
import { decideContribution } from "@/lib/gig-questions";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";
import { refused } from "@/app/api/v1/shared/helpers";

/**
 * POST /api/v1/appadmin/contributions/{contributionId}/decide — add the
 * question to the bank, return it with a note, or reject it with a reason.
 * Adding is the only act that earns, and is refused (422) when the teacher's
 * month or the month's budget is used up: the question then waits.
 */
export async function POST(request: Request, { params }: { params: Promise<{ contributionId: string }> }) {
  try {
    const ctx = await requireApiAppAdmin();
    const { contributionId } = await params;
    const parsed = gigDecideBodySchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const { edit, ...rest } = parsed.data;
    const result = await decideContribution(ctx, contributionId, { ...rest, edit: edit ? { ...edit, terms: true } : undefined });
    if (!result.ok) return refused(result.errorKey, result.vars);
    return ok(gigDecidedSchema.parse({ contribution: result.contribution }));
  } catch (error) {
    return apiFailure(error, "api/v1/appadmin/contributions/[contributionId]/decide");
  }
}
