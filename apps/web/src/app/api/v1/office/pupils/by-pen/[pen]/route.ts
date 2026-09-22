import { penLookupSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { lookupPen } from "@/lib/pen";
import { apiFailure, ok } from "@/lib/api-v1";

/** GET /api/v1/office/pupils/by-pen/{pen} — who holds this UDISE+ PEN. */
export async function GET(_request: Request, { params }: { params: Promise<{ pen: string }> }) {
  try {
    const ctx = await requireApiRole("ADMIN", "PRINCIPAL");
    const { pen } = await params;
    return ok(penLookupSchema.parse(await lookupPen(ctx, pen)));
  } catch (error) {
    return apiFailure(error, "api/v1/office/pupils/by-pen/[pen]");
  }
}
