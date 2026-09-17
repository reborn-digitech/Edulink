import { feeOkSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { publishStructure } from "@/lib/fees";
import { apiFailure, ok } from "@/lib/api-v1";

/** POST /api/v1/fees/structures/{structureId}/publish */
export async function POST(_request: Request, { params }: { params: Promise<{ structureId: string }> }) {
  try {
    const ctx = await requireApiRole("ADMIN");
    const { structureId } = await params;
    await publishStructure(ctx, structureId);
    return ok(feeOkSchema.parse({ ok: true }));
  } catch (error) {
    return apiFailure(error, "api/v1/fees/structures/[structureId]/publish");
  }
}
