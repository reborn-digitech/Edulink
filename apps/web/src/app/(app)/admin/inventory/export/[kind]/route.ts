import { getT } from "@/lib/i18n/server";
import { exportResponse } from "@/lib/export-file";
import { AccessError, requireApiRole } from "@/lib/tenancy";
import { RuleRefusal } from "@/lib/rule-refusal";
import { fixedAssetRegisterExport, stockExport } from "@/lib/inventory";

/**
 * /admin/inventory/export/{fixed-assets|stock}?format= — the auditor's
 * fixed-asset register and the stock on hand as a download, CSV or workbook.
 * Built and audited by the library, shared with the phone's
 * /api/v1/admin/inventory/export/{kind}.
 */
export async function GET(request: Request, { params }: { params: Promise<{ kind: string }> }) {
  try {
    const ctx = await requireApiRole("ADMIN", "ACCOUNTS");
    const { kind } = await params;
    const file = kind === "fixed-assets" ? await fixedAssetRegisterExport(ctx) : kind === "stock" ? await stockExport(ctx) : null;
    if (!file) return new Response(null, { status: 404 });
    return exportResponse(request, file);
  } catch (error) {
    if (error instanceof AccessError || error instanceof RuleRefusal) {
      const status = error instanceof AccessError && error.code === "UNAUTHENTICATED" ? 401 : 403;
      return new Response((await getT())(error.key, error.vars), { status });
    }
    console.error("[inventory export]", error);
    return new Response((await getT())("common.somethingWrong"), { status: 500 });
  }
}
