import { legalNameBodySchema, okSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { correctLegalName } from "@/lib/legal-name";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";
import { apiRefused } from "@/lib/api-reads/admin";

/** POST /api/v1/admin/people/{membershipId}/legal-name — the office corrects a legal name for a coded reason; the rule, the audit row and who is told are lib/legal-name.ts. */
export async function POST(request: Request, { params }: { params: Promise<{ membershipId: string }> }) {
  try {
    const ctx = await requireApiRole("ADMIN");
    const { membershipId } = await params;
    const parsed = legalNameBodySchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const result = await correctLegalName(ctx, membershipId, parsed.data.name, parsed.data.reason);
    if (!result.ok) return apiRefused(result);
    return ok(okSchema.parse({ ok: true }));
  } catch (error) {
    return apiFailure(error, "api/v1/admin/people/[membershipId]/legal-name");
  }
}
