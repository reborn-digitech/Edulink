import { penChangeProposeSchema, penChangeRequestSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { proposePenChange } from "@/lib/pen-changes";
import { apiInvalid, ok, readJson } from "@/lib/api-v1";
import { moduleFailure } from "@/lib/rule-refusal";

/** POST /api/v1/office/pupil-records/{membershipId}/pen-change — the admin proposes a corrected PEN. */
export async function POST(request: Request, { params }: { params: Promise<{ membershipId: string }> }) {
  try {
    const ctx = await requireApiRole("ADMIN");
    const { membershipId } = await params;
    const parsed = penChangeProposeSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(penChangeRequestSchema.parse(await proposePenChange(ctx, membershipId, parsed.data)), 201);
  } catch (error) {
    // A refused value is a 422 naming `toPen`, a state in the way a 409 (TA-602); a role stays a 403.
    return moduleFailure(error, "api/v1/office/pupil-records/[membershipId]/pen-change");
  }
}
