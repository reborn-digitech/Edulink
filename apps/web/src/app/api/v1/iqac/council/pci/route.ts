import { councilQuerySchema, councilViewSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { councilView } from "@/lib/council-filings";
import { apiInvalid, ok, budget, HEAVY_READ_BUDGET } from "@/lib/api-v1";
import { moduleFailure } from "@/lib/rule-refusal";

/** GET /api/v1/iqac/council/pci?year= — the PCI inspection data from the rows as they stand (404 unless the college teaches pharmacy). */
export async function GET(request: Request) {
  try {
    const ctx = await requireApiRoles("IQAC", "ADMIN", "PRINCIPAL");
    // A whole recompute per call (A3-S-7): counted as the filing generate and the cycle compute are (S-18).
    const refused = await budget(`heavy:${ctx.user.id}`, HEAVY_READ_BUDGET.limit, HEAVY_READ_BUDGET.windowMs);
    if (refused) return refused;
    const parsed = councilQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(councilViewSchema.parse(await councilView(ctx, "PCI_INSPECTION", parsed.data)));
  } catch (error) {
    return moduleFailure(error, "api/v1/iqac/council/pci");
  }
}
