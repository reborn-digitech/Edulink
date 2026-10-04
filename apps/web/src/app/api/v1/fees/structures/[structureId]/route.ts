import { feeOkSchema, feeStructureBodySchema, feeStructureDetailSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { updateStructure } from "@/lib/fees";
import { feesStructureRead } from "@/lib/api-reads/fees";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";

/** GET /api/v1/fees/structures/{structureId} — one structure in full, with the classes it could be assigned to. */
export async function GET(_request: Request, { params }: { params: Promise<{ structureId: string }> }) {
  try {
    const ctx = await requireApiRole("ADMIN", "PRINCIPAL", "ACCOUNTS");
    const { structureId } = await params;
    return ok(feeStructureDetailSchema.parse(await feesStructureRead(ctx, structureId)));
  } catch (error) {
    return apiFailure(error, "api/v1/fees/structures/[structureId]");
  }
}

/** POST /api/v1/fees/structures/{structureId} — rewrite a DRAFT; a published one is refused with a sentence. */
export async function POST(request: Request, { params }: { params: Promise<{ structureId: string }> }) {
  try {
    const ctx = await requireApiRole("ADMIN", "ACCOUNTS");
    const { structureId } = await params;
    const parsed = feeStructureBodySchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const { gradeLevel, academicYearId: _year, ...rest } = parsed.data;
    void _year;
    await updateStructure(ctx, structureId, { ...rest, gradeLevel: gradeLevel ?? null });
    return ok(feeOkSchema.parse({ ok: true }));
  } catch (error) {
    return apiFailure(error, "api/v1/fees/structures/[structureId]");
  }
}
