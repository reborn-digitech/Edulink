import { libraryLoanSchema, libraryRenewSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { renewLoan } from "@/lib/library";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";

/** POST /api/v1/library/renewals — Renew a loan within the school's limits. */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRoles("LIBRARIAN", "ADMIN");
    const parsed = libraryRenewSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const b = parsed.data;
    return ok(libraryLoanSchema.parse(await renewLoan(ctx, b.issueId)));
  } catch (error) {
    return apiFailure(error, "api/v1/library/renewals");
  }
}
