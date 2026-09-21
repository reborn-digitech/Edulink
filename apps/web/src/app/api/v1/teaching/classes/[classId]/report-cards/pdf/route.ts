import { teachingCardsBundleQuerySchema } from "@edulink/contracts";
import { requireApiRole, AccessError } from "@/lib/tenancy";
import { getCard } from "@/lib/report-cards";
import { db } from "@/lib/db";
import { renderReportCardsPdf } from "@/lib/report-card-pdf";
import { getT, getLocale } from "@/lib/i18n/server";
import { apiFailure, apiInvalid } from "@/lib/api-v1";

/** GET /api/v1/teaching/classes/{classId}/report-cards/pdf?title= — the class's cards under one title, a page each. */
export async function GET(request: Request, { params }: { params: Promise<{ classId: string }> }) {
  try {
    const ctx = await requireApiRole("TEACHER", "ADMIN", "PRINCIPAL");
    const { classId } = await params;
    const parsed = teachingCardsBundleQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!parsed.success) return apiInvalid(parsed);
    // Reading, not writing: the head and the office read every card, a
    // teacher of the class theirs, and getCard's own gate decides each one.
    const rows = await db.reportCard.findMany({ where: { schoolId: ctx.schoolId, classId, title: parsed.data.title }, select: { id: true }, take: 500 });
    const cards = [];
    for (const row of rows) {
      const card = await getCard(ctx, row.id);
      if (card) cards.push(card);
    }
    if (cards.length === 0) throw new AccessError("reportCards.nothingUnderName", "NOT_FOUND");
    cards.sort((a, b) => a.studentName.localeCompare(b.studentName));
    const [t, locale] = await Promise.all([getT(), getLocale()]);
    const bytes = await renderReportCardsPdf(cards, t, locale);
    const name = `${parsed.data.title} - ${cards[0]?.className ?? classId}`.replace(/[^\w .-]+/g, "_");
    return new Response(new Uint8Array(bytes), { headers: { "content-type": "application/pdf", "content-disposition": `inline; filename="${name}.pdf"`, "cache-control": "private, no-store" } });
  } catch (error) {
    return apiFailure(error, "api/v1/teaching/report-cards/pdf");
  }
}
