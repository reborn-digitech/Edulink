import { birthdateBodySchema, okSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { setMemberBirthdate } from "@/lib/birthdate";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";
import { apiRefused } from "@/lib/api-reads/admin";

/** POST /api/v1/admin/people/{membershipId}/birthdate — the office sets a member's date of birth, or clears it with null; the rule is lib/birthdate.ts. */
export async function POST(request: Request, { params }: { params: Promise<{ membershipId: string }> }) {
  try {
    const ctx = await requireApiRole("ADMIN");
    const { membershipId } = await params;
    const parsed = birthdateBodySchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const result = await setMemberBirthdate(ctx, membershipId, parsed.data.dateKey);
    if (!result.ok) return apiRefused(result);
    return ok(okSchema.parse({ ok: true }));
  } catch (error) {
    return apiFailure(error, "api/v1/admin/people/[membershipId]/birthdate");
  }
}
