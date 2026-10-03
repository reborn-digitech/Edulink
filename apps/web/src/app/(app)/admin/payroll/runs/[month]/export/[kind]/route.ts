import { PAYROLL_EXPORT_KINDS, PAYROLL_EXPORT_SLUG } from "@edulink/contracts";
import { getT } from "@/lib/i18n/server";
import { AccessError, requireApiRole } from "@/lib/tenancy";
import { RuleRefusal } from "@/lib/rule-refusal";
import { payrollExport } from "@/lib/payroll";

/**
 * /admin/payroll/runs/{month}/export/{pf-ecr|esi|bank-advice|pt|tds} — the
 * file as a download, cut and audited by the library (the same bytes the
 * phone's /api/v1 door answers as text). Never cached: a bank advice holds
 * account numbers in the clear.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ month: string; kind: string }> }) {
  try {
    const ctx = await requireApiRole("ADMIN");
    const { month, kind } = await params;
    const code = PAYROLL_EXPORT_KINDS.find((k) => PAYROLL_EXPORT_SLUG[k] === kind);
    if (!code) return new Response(null, { status: 404 });
    const file = await payrollExport(ctx, month, code);
    return new Response(file.content, { headers: { "Content-Type": `${file.mime}; charset=utf-8`, "Content-Disposition": `attachment; filename="${file.filename}"`, "Cache-Control": "no-store, private" } });
  } catch (error) {
    if (error instanceof AccessError || error instanceof RuleRefusal) {
      const status = error instanceof AccessError ? (error.code === "UNAUTHENTICATED" ? 401 : error.code === "NOT_FOUND" ? 404 : 403) : error.status;
      return new Response((await getT())(error.key, error.vars), { status });
    }
    console.error("[payroll export]", error);
    return new Response((await getT())("common.somethingWrong"), { status: 500 });
  }
}
