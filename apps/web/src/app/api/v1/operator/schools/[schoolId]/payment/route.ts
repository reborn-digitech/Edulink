import { paymentAnswerSchema, paymentBodySchema } from "@edulink/contracts";
import { requireApiOperator } from "@/lib/tenancy";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";
import { recordPayment } from "@/lib/subscriptions";
import { operatorRefused } from "@/lib/api-reads/operator-school";

/** POST /api/v1/operator/schools/{schoolId}/payment — record a payment the company received: the renewal moves twelve months, the school is Active; refused while paused or ended. Recorded, never collected. `preview` writes nothing. */
export async function POST(request: Request, { params }: { params: Promise<{ schoolId: string }> }) {
  try {
    const ctx = await requireApiOperator();
    const { schoolId } = await params;
    const parsed = paymentBodySchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const result = await recordPayment(ctx, schoolId, parsed.data);
    if ("ok" in result) return operatorRefused(result);
    return ok(paymentAnswerSchema.parse(result));
  } catch (error) {
    return apiFailure(error, "api/v1/operator/schools/[schoolId]/payment");
  }
}
