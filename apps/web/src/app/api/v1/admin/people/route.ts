import { adminPeopleQuerySchema, adminPeopleSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { apiFailure, apiInvalid, ok } from "@/lib/api-v1";
import { adminPeople } from "@/lib/api-reads/admin";

/** GET /api/v1/admin/people — the directory, one page of it, with the role, status, class and search filters the page has. */
export async function GET(request: Request) {
  try {
    const ctx = await requireApiRole("ADMIN");
    const parsed = adminPeopleQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(adminPeopleSchema.parse(await adminPeople(ctx, parsed.data)));
  } catch (error) {
    return apiFailure(error, "api/v1/admin/people");
  }
}
