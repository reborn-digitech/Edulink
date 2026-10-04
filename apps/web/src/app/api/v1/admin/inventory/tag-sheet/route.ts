import { requireApiRole } from "@/lib/tenancy";
import { budget, PDF_BUDGET } from "@/lib/api-v1";
import { tagSheetAssets } from "@/lib/inventory";
import { renderTagSheetPdf } from "@/lib/asset-tag-pdf";
import { getLocale } from "@/lib/i18n/server";
import { moduleFailure } from "@/lib/rule-refusal";

/** GET /api/v1/admin/inventory/tag-sheet?location= — printable asset tags with QR codes (application/pdf). Audited. */
export async function GET(request: Request) {
  try {
    const ctx = await requireApiRole("ADMIN", "ACCOUNTS");
    const refused = await budget(`pdf:${ctx.user.id}`, PDF_BUDGET.limit, PDF_BUDGET.windowMs);
    if (refused) return refused;
    const location = new URL(request.url).searchParams.get("location")?.trim().slice(0, 60) || undefined;
    const sheet = await tagSheetAssets(ctx, { location });
    const bytes = await renderTagSheetPdf({ ...sheet, locale: await getLocale() });
    return new Response(new Uint8Array(bytes), { headers: { "content-type": "application/pdf", "content-disposition": `inline; filename="asset-tags.pdf"`, "cache-control": "private, no-store" } });
  } catch (error) {
    return moduleFailure(error, "api/v1/admin/inventory/tag-sheet");
  }
}
