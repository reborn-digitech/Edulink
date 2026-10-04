import { dutiesSetSchema, memberDutiesSchema } from "@edulink/contracts";
import { apiInvalid, ok, readJson } from "@/lib/api-v1";
import { requireApiRole } from "@/lib/tenancy";
import { moduleFailure } from "@/lib/rule-refusal";
import { setDuties } from "@/lib/duties";

/** POST /api/v1/admin/people/{membershipId}/duties — the registrar sets a college teacher's duties (5 Oct 2026); a duty the college's streams do not offer, or a person who is not a FACULTY or HOD, is a 422. Audited people.duties.set. */
export async function POST(request: Request, { params }: { params: Promise<{ membershipId: string }> }) {
  try {
    const ctx = await requireApiRole("ADMIN");
    const { membershipId } = await params;
    const parsed = dutiesSetSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(memberDutiesSchema.parse(await setDuties(ctx, membershipId, parsed.data.duties)));
  } catch (error) {
    return moduleFailure(error, "api/v1/admin/people/[membershipId]/duties");
  }
}
