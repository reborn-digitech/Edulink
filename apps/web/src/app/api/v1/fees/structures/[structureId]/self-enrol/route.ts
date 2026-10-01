import { feeOkSchema, feeStructureSelfEnrolBodySchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { setStructureSelfEnrol } from "@/lib/fees";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";

/** POST /api/v1/fees/structures/{structureId}/self-enrol {open} — open a published structure to families, or close it again. */
export async function POST(request: Request, { params }: { params: Promise<{ structureId: string }> }) {
  try {
    const ctx = await requireApiRole("ADMIN");
    const { structureId } = await params;
    const parsed = feeStructureSelfEnrolBodySchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    await setStructureSelfEnrol(ctx, structureId, parsed.data.open);
    return ok(feeOkSchema.parse({ ok: true }));
  } catch (error) {
    return apiFailure(error, "api/v1/fees/structures/[structureId]/self-enrol");
  }
}
