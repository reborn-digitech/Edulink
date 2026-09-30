import { paperSignatureDecidedSchema, paperSignatureDecideSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";
import { decidePaperSignature } from "@/lib/signatures";

/** POST /api/v1/office/signatures/{signatureId}/decide — sign a paper that waited for the reader, or decline to. */
export async function POST(request: Request, { params }: { params: Promise<{ signatureId: string }> }) {
  try {
    const ctx = await requireApiRole("ADMIN", "PRINCIPAL", "TEACHER");
    const { signatureId } = await params;
    const parsed = paperSignatureDecideSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(paperSignatureDecidedSchema.parse(await decidePaperSignature(ctx, signatureId, parsed.data.approve)));
  } catch (error) {
    return apiFailure(error, "api/v1/office/signatures/[signatureId]/decide");
  }
}
