import { feeCounterPaymentBodySchema, feeReceiptIssuedSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { recordCounterPayment } from "@/lib/fees-payments";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";

/** POST /api/v1/fees/payments — the counter: cash, cheque, bank transfer or UPI the office already holds; the receipt is numbered in the same transaction. Replay-safe by clientId. */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRole("ADMIN");
    const parsed = feeCounterPaymentBodySchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const result = await recordCounterPayment(ctx, parsed.data);
    return ok(feeReceiptIssuedSchema.parse(result), result.already ? 200 : 201);
  } catch (error) {
    return apiFailure(error, "api/v1/fees/payments");
  }
}
