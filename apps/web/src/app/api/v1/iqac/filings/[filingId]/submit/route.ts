import { collegeFilingsSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { submitFiling } from "@/lib/iqac-filings";
import { ok } from "@/lib/api-v1";
import { moduleFailure } from "@/lib/rule-refusal";

/** POST /api/v1/iqac/filings/{filingId}/submit — Send a NAAC document to the principal for sign-off. */
export async function POST(_request: Request, { params }: { params: Promise<{ filingId: string }> }) {
  try {
    const ctx = await requireApiRoles("IQAC", "ADMIN");
    const p = await params;
    return ok(collegeFilingsSchema.parse(await submitFiling(ctx, p.filingId)));
  } catch (error) {
    return moduleFailure(error, "api/v1/iqac/filings/[filingId]/submit");
  }
}
