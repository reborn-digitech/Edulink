import { familyExportQuerySchema } from "@edulink/contracts";
import { requireApiReader } from "@/lib/api-reads/family";
import { personExport, PERSON_EXPORT_BUDGET } from "@/lib/person-export";
import { apiFailure, apiInvalid, budget } from "@/lib/api-v1";

/**
 * GET /api/v1/family/export?student= — a person's own data as one JSON
 * document, to keep (the DPDP Act's section 11). A pupil takes their own; a
 * guardian names one child (`student`, a membership id; the first child when
 * omitted) and takes one child per call. Assembled from the same reads the
 * family's pages make, audited, and a handful an hour per person.
 */
export async function GET(request: Request) {
  try {
    const ctx = await requireApiReader();
    const parsed = familyExportQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!parsed.success) return apiInvalid(parsed);
    const refused = await budget(`family-export:${ctx.user.id}`, PERSON_EXPORT_BUDGET.limit, PERSON_EXPORT_BUDGET.windowMs);
    if (refused) return refused;
    const file = await personExport(ctx, ctx.role === "PARENT" ? parsed.data.student : null);
    return new Response(JSON.stringify(file.document, null, 2), {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="${file.filename}"`,
        "Cache-Control": "no-store, private",
      },
    });
  } catch (error) {
    return apiFailure(error, "api/v1/family/export");
  }
}
