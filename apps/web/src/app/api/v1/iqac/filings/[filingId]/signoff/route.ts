import { collegeFilingSignoffSchema, collegeFilingsSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { signOffFiling } from "@/lib/iqac-filings";
import { apiInvalid, ok, readJson } from "@/lib/api-v1";
import { moduleFailure } from "@/lib/rule-refusal";

/** POST /api/v1/iqac/filings/{filingId}/signoff — The principal signs off or returns with a note. */
export async function POST(request: Request, { params }: { params: Promise<{ filingId: string }> }) {
  try {
    const ctx = await requireApiRoles("PRINCIPAL");
    const p = await params;
    const parsed = collegeFilingSignoffSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const b = parsed.data;
    return ok(collegeFilingsSchema.parse(await signOffFiling(ctx, p.filingId, b)));
  } catch (error) {
    return moduleFailure(error, "api/v1/iqac/filings/[filingId]/signoff");
  }
}
