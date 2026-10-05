import { councilQuerySchema, councilViewSchema, worksheetSaveSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { councilView, saveWorksheet } from "@/lib/council-filings";
import { apiInvalid, ok, readJson, budget, HEAVY_READ_BUDGET } from "@/lib/api-v1";
import { moduleFailure } from "@/lib/rule-refusal";

/** GET /api/v1/iqac/council/bci?year= — the BCI return, with the office's compliance items, from the rows as they stand (404 unless the college teaches law). */
export async function GET(request: Request) {
  try {
    const ctx = await requireApiRoles("IQAC", "ADMIN", "PRINCIPAL");
    // A whole recompute per call (A3-S-7): counted as the filing generate and the cycle compute are (S-18).
    const refused = await budget(`heavy:${ctx.user.id}`, HEAVY_READ_BUDGET.limit, HEAVY_READ_BUDGET.windowMs);
    if (refused) return refused;
    const parsed = councilQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(councilViewSchema.parse(await councilView(ctx, "BCI_RETURN", parsed.data)));
  } catch (error) {
    return moduleFailure(error, "api/v1/iqac/council/bci");
  }
}

/** POST /api/v1/iqac/council/bci — save items of the worksheet; the others stand. Audited. */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRoles("IQAC", "ADMIN");
    const parsed = worksheetSaveSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(councilViewSchema.parse(await saveWorksheet(ctx, "BCI_RETURN", parsed.data)));
  } catch (error) {
    return moduleFailure(error, "api/v1/iqac/council/bci");
  }
}
