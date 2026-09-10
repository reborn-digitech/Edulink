import { getT } from "@/lib/i18n/server";
import { AccessError, requireApiRole } from "@/lib/tenancy";
import { registerExport } from "@/lib/attendance-export";

/**
 * One class's register for one month, as the inspection-shaped grid: a row per
 * pupil, a column per register actually taken, P/L/A/E in the cells. Audited —
 * this file carries children's names and their absences. The grid and the
 * audit line are the library's, shared with the phone's export.
 */
export async function GET(request: Request) {
  try {
    const ctx = await requireApiRole("ADMIN");
    const url = new URL(request.url);
    const classId = url.searchParams.get("classId") ?? "";
    const month = url.searchParams.get("month") ?? "";
    if (!/^\d{4}-\d{2}$/.test(month)) {
      return new Response("month must be YYYY-MM", { status: 400 });
    }

    const file = await registerExport(ctx, classId, month);
    if (!file) return new Response("class not found", { status: 404 });

    return new Response(file.csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${file.filename}"`,
        "Cache-Control": "no-store, private",
      },
    });
  } catch (error) {
    if (error instanceof AccessError) {
      const status = error.code === "UNAUTHENTICATED" ? 401 : 403;
      return new Response((await getT())(error.key, error.vars), { status });
    }
    console.error("[register export]", error);
    return new Response((await getT())("common.somethingWrong"), { status: 500 });
  }
}
