import { penLookupSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { lookupPen } from "@/lib/pen";
import { ok } from "@/lib/api-v1";
import { moduleFailure } from "@/lib/rule-refusal";

/** GET /api/v1/office/pupils/by-pen/{pen} — who holds this UDISE+ PEN. */
export async function GET(_request: Request, { params }: { params: Promise<{ pen: string }> }) {
  try {
    const ctx = await requireApiRole("ADMIN", "PRINCIPAL");
    const { pen } = await params;
    return ok(penLookupSchema.parse(await lookupPen(ctx, pen)));
  } catch (error) {
    // A PEN that is not eleven digits is a 422 naming `pen` (TA-602); the rest as apiFailure says.
    return moduleFailure(error, "api/v1/office/pupils/by-pen/[pen]");
  }
}
