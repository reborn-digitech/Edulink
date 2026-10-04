import { accountsReportQuerySchema, officeCsvExportSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { accountsReport } from "@/lib/accounts";
import { getT } from "@/lib/i18n/server";
import { apiFailure, apiInvalid, budget, EXPORT_BUDGET, ok } from "@/lib/api-v1";

/** GET /api/v1/accounts/reports — The auditor's schedules: collection, defaulters, receivable ageing, income and expense, the finance table, as CSV text. */
export async function GET(request: Request) {
  try {
    const ctx = await requireApiRoles("ACCOUNTS", "ADMIN", "PRINCIPAL");
    const refused = await budget(`export:${ctx.user.id}`, EXPORT_BUDGET.limit, EXPORT_BUDGET.windowMs);
    if (refused) return refused;
    const parsed = accountsReportQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!parsed.success) return apiInvalid(parsed);
    const q = parsed.data;
    const t = await getT();
    const file = await accountsReport(ctx, q.report, t);
    return ok(officeCsvExportSchema.parse({ ...file, rows: Math.max(0, file.csv.split("\n").filter(Boolean).length - 1) }));
  } catch (error) {
    return apiFailure(error, "api/v1/accounts/reports");
  }
}
