import { councilQuerySchema, councilViewSchema, worksheetSaveSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { councilView, saveWorksheet } from "@/lib/council-filings";
import { apiInvalid, ok, readJson } from "@/lib/api-v1";
import { moduleFailure } from "@/lib/rule-refusal";

/** GET /api/v1/iqac/council/nba?year=&departmentId= — an engineering department's NBA SAR, with its qualitative criteria (an HOD reads and writes their own department's), from the rows as they stand (404 unless the college teaches engineering). */
export async function GET(request: Request) {
  try {
    const ctx = await requireApiRoles("IQAC", "ADMIN", "PRINCIPAL", "HOD");
    const parsed = councilQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(councilViewSchema.parse(await councilView(ctx, "NBA_SAR", parsed.data)));
  } catch (error) {
    return moduleFailure(error, "api/v1/iqac/council/nba");
  }
}

/** POST /api/v1/iqac/council/nba — save items of the worksheet; the others stand. Audited. */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRoles("IQAC", "HOD");
    const parsed = worksheetSaveSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(councilViewSchema.parse(await saveWorksheet(ctx, "NBA_SAR", parsed.data)));
  } catch (error) {
    return moduleFailure(error, "api/v1/iqac/council/nba");
  }
}
