import { getT } from "@/lib/i18n/server";
import { exportResponse } from "@/lib/export-file";
import { AccessError, requireApiRole } from "@/lib/tenancy";
import { staffMonthCsvRows } from "@/lib/staff-attendance";
import { toCsv } from "@/lib/csv";
import { audit } from "@/lib/audit";

/**
 * The staff register for a month as a file: a person per row, a teaching day
 * per column with P/L/H/A/LV in the cells, and the month's counts at the end.
 * The office and the head only; audited — it carries every staff member's
 * absences. CSV, or ?format=xlsx for the workbook.
 */
export async function GET(request: Request) {
  try {
    const ctx = await requireApiRole("ADMIN", "PRINCIPAL");
    const url = new URL(request.url);
    const requested = url.searchParams.get("month") ?? "";
    if (requested && !/^\d{4}-\d{2}$/.test(requested)) {
      return new Response("month must be YYYY-MM", { status: 400 });
    }
    const { month, headers, rows } = await staffMonthCsvRows(ctx, requested || undefined);
    await audit({ schoolId: ctx.schoolId, actorUserId: ctx.user.id, action: "staffAttendance.export", targetType: "School", targetId: ctx.schoolId, meta: { month, rows: rows.length } });
    return exportResponse(request, { filename: `edulink-staff-register-${month}.csv`, csv: toCsv(rows, headers) });
  } catch (error) {
    if (error instanceof AccessError) {
      const status = error.code === "UNAUTHENTICATED" ? 401 : error.code === "NOT_FOUND" ? 404 : 403;
      return new Response((await getT())(error.key, error.vars), { status });
    }
    console.error("[staff register export]", error);
    return new Response((await getT())("common.somethingWrong"), { status: 500 });
  }
}
