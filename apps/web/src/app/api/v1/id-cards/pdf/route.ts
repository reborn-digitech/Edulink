import { idCardPdfQuerySchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { cardOrigin, idCardFor } from "@/lib/id-card";
import { renderIdCardPdf } from "@/lib/id-card-pdf";
import { getLocale, getT } from "@/lib/i18n/server";
import { PDF_BUDGET, apiFailure, apiInvalid, budget } from "@/lib/api-v1";

/** GET /api/v1/id-cards/pdf?student= — a student's identity card as a PDF (application/pdf), drawn from the rows on every read (5 Oct 2026). */
export async function GET(request: Request) {
  try {
    const ctx = await requireApiRoles("STUDENT", "PARENT", "ADMIN", "PRINCIPAL");
    // Only a student may leave the student out (their own card); a guardian or the office naming nobody is a
    // missing query, 422, not a "not found" (STREAMS-5).
    const query = ctx.role === "STUDENT" ? idCardPdfQuerySchema : idCardPdfQuerySchema.required({ student: true });
    const parsed = query.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!parsed.success) return apiInvalid(parsed);
    const refused = await budget(`pdf:${ctx.user.id}`, PDF_BUDGET.limit, PDF_BUDGET.windowMs);
    if (refused) return refused;
    const card = await idCardFor(ctx, parsed.data.student ?? null);
    // The QR's address is the configured app's, not the request's host (A3-S-6).
    const bytes = await renderIdCardPdf(card, await getT(), cardOrigin(request.url), await getLocale());
    const file = `id-card-${(card.name || "student").replace(/[^\w-]/g, "").slice(0, 40) || "student"}.pdf`;
    return new Response(new Uint8Array(bytes), { headers: { "content-type": "application/pdf", "content-disposition": `inline; filename="${file}"`, "cache-control": "private, no-store" } });
  } catch (error) {
    return apiFailure(error, "api/v1/id-cards/pdf");
  }
}
