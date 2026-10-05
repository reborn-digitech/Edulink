import { tallyReceiptsQuerySchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { tallyReceipts } from "@/lib/tally-export";
import { moduleFailure } from "@/lib/rule-refusal";
import { apiInvalid, budget, EXPORT_BUDGET } from "@/lib/api-v1";

/** GET /api/v1/tally/receipts?from=&to=&format= — The span's fee receipts and refunds as Tally vouchers (XML or a CSV day book; audited). */
export async function GET(request: Request) {
  try {
    const ctx = await requireApiRoles("ADMIN", "ACCOUNTS");
    const refused = await budget(`export:${ctx.user.id}`, EXPORT_BUDGET.limit, EXPORT_BUDGET.windowMs);
    if (refused) return refused;
    const parsed = tallyReceiptsQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!parsed.success) return apiInvalid(parsed);
    const file = await tallyReceipts(ctx, parsed.data.from, parsed.data.to, parsed.data.format);
    return new Response(file.content, { headers: { "content-type": `${file.mime}; charset=utf-8`, "content-disposition": `attachment; filename="${file.filename}"`, "cache-control": "private, no-store" } });
  } catch (error) {
    return moduleFailure(error, "api/v1/tally/receipts");
  }
}
