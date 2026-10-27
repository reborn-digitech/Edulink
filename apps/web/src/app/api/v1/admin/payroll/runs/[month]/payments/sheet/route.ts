import { utrSheetAnswerSchema, utrSheetSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { apiInvalid, ok, readJson } from "@/lib/api-v1";
import { importUtrSheet } from "@/lib/salary-payments";
import { moduleFailure } from "@/lib/rule-refusal";

/** POST /api/v1/admin/payroll/runs/{month}/payments/sheet — the UTR sheet ({ csv }: Slip Ref, UTR, Date, optional Amount); all lines or none, each line's outcome answered. */
export async function POST(request: Request, { params }: { params: Promise<{ month: string }> }) {
  try {
    const ctx = await requireApiRole("ADMIN", "ACCOUNTS");
    const parsed = utrSheetSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const { month } = await params;
    return ok(utrSheetAnswerSchema.parse(await importUtrSheet(ctx, month, parsed.data.csv)));
  } catch (error) {
    return moduleFailure(error, "api/v1/admin/payroll/runs/[month]/payments/sheet");
  }
}
