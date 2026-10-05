import { hostelRollCallCorrectSchema, hostelRollCallCorrectedSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { correctRollCall } from "@/lib/hostel";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";

/** POST /api/v1/hostel/rollcall/{rollCallId}/correct — the office corrects a taken roll call with a reason, audited before and after (R-11). */
export async function POST(request: Request, { params }: { params: Promise<{ rollCallId: string }> }) {
  try {
    const ctx = await requireApiRoles("ADMIN");
    const { rollCallId } = await params;
    const parsed = hostelRollCallCorrectSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(hostelRollCallCorrectedSchema.parse(await correctRollCall(ctx, rollCallId, parsed.data)));
  } catch (error) {
    return apiFailure(error, "api/v1/hostel/rollcall/[rollCallId]/correct");
  }
}
