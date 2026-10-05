import { councilQuerySchema, councilViewSchema, worksheetSaveSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { councilView, saveWorksheet } from "@/lib/council-filings";
import { apiInvalid, ok, readJson } from "@/lib/api-v1";
import { moduleFailure } from "@/lib/rule-refusal";

/** GET /api/v1/iqac/council/ncte?year= — the NCTE return, with the office's infrastructure items, from the rows as they stand (404 unless the college teaches teacher education). */
export async function GET(request: Request) {
  try {
    const ctx = await requireApiRoles("IQAC", "ADMIN", "PRINCIPAL");
    const parsed = councilQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(councilViewSchema.parse(await councilView(ctx, "NCTE_RETURN", parsed.data)));
  } catch (error) {
    return moduleFailure(error, "api/v1/iqac/council/ncte");
  }
}

/** POST /api/v1/iqac/council/ncte — save items of the worksheet; the others stand. Audited. */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRoles("IQAC", "ADMIN");
    const parsed = worksheetSaveSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(councilViewSchema.parse(await saveWorksheet(ctx, "NCTE_RETURN", parsed.data)));
  } catch (error) {
    return moduleFailure(error, "api/v1/iqac/council/ncte");
  }
}
