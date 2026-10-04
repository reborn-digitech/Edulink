import { SCHOLARSHIP_SCHEMES, type ScholarshipScheme } from "@edulink/contracts";
import { getT } from "@/lib/i18n/server";
import { exportResponse } from "@/lib/export-file";
import { AccessError, requireApiUser } from "@/lib/tenancy";
import { accountsReport } from "@/lib/accounts";
import { reconciliationSheet } from "@/lib/scholarships";
import { budget, EXPORT_BUDGET } from "@/lib/api-v1";

const REPORTS = ["collection", "defaulters", "receivable", "income-expense", "finance-table"] as const;

/**
 * The accounts desk's sheets as files (4 Oct 2026): the auditor's schedules,
 * and a scholarship scheme's reconciliation for a year (`reconciliation?scheme=&year=`).
 * Who may read each is the library's to decide (accounts.ts, scholarships.ts).
 */
export async function GET(request: Request, { params }: { params: Promise<{ report: string }> }) {
  const t = await getT();
  try {
    const ctx = await requireApiUser();
    const refused = await budget(`export:${ctx.user.id}`, EXPORT_BUDGET.limit, EXPORT_BUDGET.windowMs);
    if (refused) return refused;
    const { report } = await params;
    if (report === "reconciliation") {
      const url = new URL(request.url);
      const scheme = url.searchParams.get("scheme") ?? "";
      const year = url.searchParams.get("year") ?? "";
      if (!(SCHOLARSHIP_SCHEMES as readonly string[]).includes(scheme) || !/^\d{4}-\d{2}$/.test(year)) return new Response(t("common.checkTheForm"), { status: 422 });
      return exportResponse(request, await reconciliationSheet(ctx, scheme as ScholarshipScheme, year, t));
    }
    if (!(REPORTS as readonly string[]).includes(report)) return new Response(t("common.checkTheForm"), { status: 404 });
    return exportResponse(request, await accountsReport(ctx, report as (typeof REPORTS)[number], t));
  } catch (error) {
    if (error instanceof AccessError) {
      const status = error.code === "UNAUTHENTICATED" ? 401 : error.code === "NOT_FOUND" ? 404 : 403;
      return new Response(t(error.key, error.vars), { status });
    }
    console.error("[accounts export]", error);
    return new Response(t("common.somethingWrong"), { status: 500 });
  }
}
