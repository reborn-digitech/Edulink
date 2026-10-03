import { libraryIssueCreateSchema, libraryLoanSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { issueCopy } from "@/lib/library";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";

/** POST /api/v1/library/issues — Lend a copy to a member. */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRoles("LIBRARIAN", "ADMIN");
    const parsed = libraryIssueCreateSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const b = parsed.data;
    return ok(libraryLoanSchema.parse(await issueCopy(ctx, b)));
  } catch (error) {
    return apiFailure(error, "api/v1/library/issues");
  }
}
