import { advanceRecordSchema, staffAdvanceSchema, staffAdvancesSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { apiInvalid, ok, readJson } from "@/lib/api-v1";
import { listAdvances, recordAdvance } from "@/lib/payroll";
import { moduleFailure } from "@/lib/rule-refusal";

/** GET /api/v1/admin/payroll/advances — asks waiting first, then what is recorded. */
export async function GET() {
  try {
    const ctx = await requireApiRole("ADMIN");
    return ok(staffAdvancesSchema.parse(await listAdvances(ctx)));
  } catch (error) {
    return moduleFailure(error, "api/v1/admin/payroll/advances");
  }
}

/** POST /api/v1/admin/payroll/advances — record an advance handed over outside the app. */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRole("ADMIN");
    const parsed = advanceRecordSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(staffAdvanceSchema.parse(await recordAdvance(ctx, parsed.data)));
  } catch (error) {
    return moduleFailure(error, "api/v1/admin/payroll/advances");
  }
}
