import { PAYROLL_EXPORT_KINDS, PAYROLL_EXPORT_SLUG, payrollExportFileSchema } from "@edulink/contracts";
import { AccessError, requireApiRole } from "@/lib/tenancy";
import { ok } from "@/lib/api-v1";
import { payrollExport } from "@/lib/payroll";
import { moduleFailure } from "@/lib/rule-refusal";

/** GET /api/v1/admin/payroll/runs/{month}/export/{kind} — pf-ecr, esi, bank-advice, pt or tds, cut from a LOCKED run. Audited. */
export async function GET(_request: Request, { params }: { params: Promise<{ month: string; kind: string }> }) {
  try {
    const ctx = await requireApiRole("ADMIN");
    const { month, kind } = await params;
    const code = PAYROLL_EXPORT_KINDS.find((k) => PAYROLL_EXPORT_SLUG[k] === kind);
    if (!code) throw new AccessError("access.entryNotFound", "NOT_FOUND");
    return ok(payrollExportFileSchema.parse(await payrollExport(ctx, month, code)));
  } catch (error) {
    return moduleFailure(error, "api/v1/admin/payroll/runs/[month]/export/[kind]");
  }
}
