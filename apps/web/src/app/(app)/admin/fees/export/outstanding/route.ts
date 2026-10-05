import { getT } from "@/lib/i18n/server";
import { exportResponse } from "@/lib/export-file";
import { AccessError, requireApiRole } from "@/lib/tenancy";
import { outstandingExport } from "@/lib/fees-reports";

/** Everyone with something outstanding this year, with ageing — the defaulter list, as a CSV file. */
export async function GET(request: Request) {
  try {
    const ctx = await requireApiRole("ADMIN", "ACCOUNTS");
    const file = await outstandingExport(ctx);
    return exportResponse(request, file);
  } catch (error) {
    if (error instanceof AccessError) {
      const status = error.code === "UNAUTHENTICATED" ? 401 : 403;
      return new Response((await getT())(error.key, error.vars), { status });
    }
    console.error("[fees outstanding export]", error);
    return new Response((await getT())("common.somethingWrong"), { status: 500 });
  }
}
