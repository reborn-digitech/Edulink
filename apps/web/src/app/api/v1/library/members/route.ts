import { libraryMemberSearchQuerySchema, libraryMemberSearchSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { searchMembers } from "@/lib/library";
import { apiFailure, apiInvalid, ok } from "@/lib/api-v1";

/** GET /api/v1/library/members — People the desk may lend to, by name, pupil code or card. */
export async function GET(request: Request) {
  try {
    const ctx = await requireApiRoles("LIBRARIAN", "ADMIN", "PRINCIPAL");
    const parsed = libraryMemberSearchQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!parsed.success) return apiInvalid(parsed);
    const q = parsed.data;
    return ok(libraryMemberSearchSchema.parse(await searchMembers(ctx, q.q)));
  } catch (error) {
    return apiFailure(error, "api/v1/library/members");
  }
}
