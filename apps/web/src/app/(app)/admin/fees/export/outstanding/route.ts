import { getT } from "@/lib/i18n/server";
import { AccessError, requireApiRole } from "@/lib/tenancy";
import { outstandingExport } from "@/lib/fees-reports";

/** Everyone with something outstanding this year, with ageing — the defaulter list, as a CSV file. */
export async function GET() {
  try {
    const ctx = await requireApiRole("ADMIN");
    const file = await outstandingExport(ctx);
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
    console.error("[fees outstanding export]", error);
    return new Response((await getT())("common.somethingWrong"), { status: 500 });
  }
}
