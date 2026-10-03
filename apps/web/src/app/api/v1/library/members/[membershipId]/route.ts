import { libraryMemberViewSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { memberView } from "@/lib/library";
import { apiFailure, ok } from "@/lib/api-v1";

type Params = { params: Promise<{ membershipId: string }> };

/** GET /api/v1/library/members/{membershipId} — One member at the desk: loans, fines and queue. */
export async function GET(_request: Request, { params }: Params) {
  try {
    const ctx = await requireApiRoles("LIBRARIAN", "ADMIN", "PRINCIPAL");
    const p = await params;
    return ok(libraryMemberViewSchema.parse(await memberView(ctx, p.membershipId)));
  } catch (error) {
    return apiFailure(error, "api/v1/library/members/[membershipId]");
  }
}
