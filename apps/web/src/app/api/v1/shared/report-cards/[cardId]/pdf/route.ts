import { requireApiRole, AccessError } from "@/lib/tenancy";
import { getSession } from "@/lib/session";
import { getCard } from "@/lib/report-cards";
import { renderReportCardsPdf } from "@/lib/report-card-pdf";
import { getT, getLocale } from "@/lib/i18n/server";
import { apiFailure } from "@/lib/api-v1";

/** GET /api/v1/shared/report-cards/{cardId}/pdf — one card as a PDF for anyone who may read it. */
export async function GET(_request: Request, { params }: { params: Promise<{ cardId: string }> }) {
  try {
    // A guardian's session carries no school; getCard's own gate decides by
    // the guardianship, so a guardian with no link to this child is 404, not
    // a hint that the card exists. Staff come through the role gate; signed
    // out is 401, any other role 403.
    const session = await getSession();
    if (!session) throw new AccessError("access.notSignedIn", "UNAUTHENTICATED");
    const ctx = session.role === "PARENT" || session.role === "STUDENT" ? session : await requireApiRole("TEACHER", "ADMIN", "PRINCIPAL");
    const { cardId } = await params;
    const card = await getCard(ctx, cardId);
    if (!card) throw new AccessError("access.thatContentNoLongerExists", "NOT_FOUND");
    const [t, locale] = await Promise.all([getT(), getLocale()]);
    const bytes = await renderReportCardsPdf([card], t, locale);
    const name = `${card.title} - ${card.studentName}`.replace(/[^\w .-]+/g, "_");
    return new Response(new Uint8Array(bytes), { headers: { "content-type": "application/pdf", "content-disposition": `inline; filename="${name}.pdf"`, "cache-control": "private, no-store" } });
  } catch (error) {
    return apiFailure(error, "api/v1/shared/report-cards/pdf");
  }
}
