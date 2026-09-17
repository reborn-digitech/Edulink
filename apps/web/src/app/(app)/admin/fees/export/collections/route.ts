import { getT } from "@/lib/i18n/server";
import { AccessError, requireApiRole } from "@/lib/tenancy";
import { db } from "@/lib/db";
import { isDateKey, todayKey } from "@/lib/dates";
import { collectionsExport } from "@/lib/fees-reports";

/**
 * The collection register between two days, as a CSV file. Defaults to the
 * current month in the school's own zone; the library refuses a range over
 * 400 days and audits the download.
 */
export async function GET(request: Request) {
  try {
    const ctx = await requireApiRole("ADMIN");
    const school = await db.school.findUniqueOrThrow({ where: { id: ctx.schoolId }, select: { timezone: true } });
    const today = todayKey(school.timezone);
    const url = new URL(request.url);
    const fromKey = url.searchParams.get("fromKey") || `${today.slice(0, 7)}-01`;
    const toKey = url.searchParams.get("toKey") || today;
    if (!isDateKey(fromKey) || !isDateKey(toKey)) throw new AccessError("fees.refuseDate");
    const file = await collectionsExport(ctx, { fromKey, toKey });
    return new Response(file.csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${file.filename}"`,
        "Cache-Control": "no-store, private",
      },
    });
  } catch (error) {
    if (error instanceof AccessError) {
      const status = error.code === "UNAUTHENTICATED" ? 401 : error.code === "NOT_FOUND" ? 404 : 403;
      return new Response((await getT())(error.key, error.vars), { status });
    }
    console.error("[fees collections export]", error);
    return new Response((await getT())("common.somethingWrong"), { status: 500 });
  }
}
