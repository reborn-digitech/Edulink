import { certificateRequestFeeSchema, certificateRequestSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { setRequestFee } from "@/lib/certificate-requests";
import { apiInvalid, ok, readJson } from "@/lib/api-v1";
import { moduleFailure } from "@/lib/rule-refusal";

/** POST /api/v1/office/certificate-requests/{requestId}/fee — the office sets what a paper costs: a demand on the pupil's ledger, paid outside the platform (G-6). */
export async function POST(request: Request, { params }: { params: Promise<{ requestId: string }> }) {
  try {
    const ctx = await requireApiRole("ADMIN");
    const { requestId } = await params;
    const parsed = certificateRequestFeeSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(certificateRequestSchema.parse(await setRequestFee(ctx, requestId, parsed.data.amountPaise)));
  } catch (error) {
    return moduleFailure(error, "api/v1/office/certificate-requests/[requestId]/fee");
  }
}
