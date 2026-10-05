import { councilQuerySchema, councilViewSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { councilView } from "@/lib/council-filings";
import { apiInvalid, ok } from "@/lib/api-v1";
import { moduleFailure } from "@/lib/rule-refusal";

/** GET /api/v1/iqac/council/pci?year= — the PCI inspection data from the rows as they stand (404 unless the college teaches pharmacy). */
export async function GET(request: Request) {
  try {
    const ctx = await requireApiRoles("IQAC", "ADMIN", "PRINCIPAL");
    const parsed = councilQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(councilViewSchema.parse(await councilView(ctx, "PCI_INSPECTION", parsed.data)));
  } catch (error) {
    return moduleFailure(error, "api/v1/iqac/council/pci");
  }
}
