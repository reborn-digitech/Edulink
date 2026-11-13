import { advanceCancelSchema, staffAdvanceSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { apiInvalid, ok, readJson } from "@/lib/api-v1";
import { cancelAdvance } from "@/lib/payroll";
import { moduleFailure } from "@/lib/rule-refusal";

/** POST /api/v1/admin/payroll/advances/cancel — cancel a recorded advance nothing has been taken back for (TA-043). */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRole("ADMIN", "ACCOUNTS");
    const parsed = advanceCancelSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(staffAdvanceSchema.parse(await cancelAdvance(ctx, parsed.data)));
  } catch (error) {
    return moduleFailure(error, "api/v1/admin/payroll/advances/cancel");
  }
}
