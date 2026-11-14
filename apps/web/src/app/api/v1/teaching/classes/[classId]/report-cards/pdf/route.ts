import { teachingCardsBundleQuerySchema } from "@edulink/contracts";
import { requireApiRole, AccessError } from "@/lib/tenancy";
import { getCard, type Card, type CardReadMemo } from "@/lib/report-cards";
import { db } from "@/lib/db";
import { renderReportCardsPdf } from "@/lib/report-card-pdf";
import { getT, getLocale } from "@/lib/i18n/server";
import { apiFailure, apiInvalid, budget, PDF_BUNDLE_BUDGET } from "@/lib/api-v1";

/**
 * NOT ONE CARD AFTER ANOTHER, NOT EVERY LAYOUT AT ONCE (TA-453, 13 Nov 2026). The bundle read each card in turn,
 * each with its own reads of the school, its rules and the set's signatures, and every request laid its pages out
 * on the process every other request shares, however many arrived together on result day. The cards are now read
 * a few at a time with one memo for what they share (getCard's CardReadMemo), and no more than BUNDLE_RENDERS
 * bundles are laid out at once in a process; the rest wait their turn. The layout itself still runs on the
 * process's own thread: a worker, or a file written once per published set, is the half of TA-453 left open.
 */
const BUNDLE_READS = 8;
const BUNDLE_RENDERS = 2;
let rendering = 0;
const waiting: (() => void)[] = [];
async function inRenderTurn<T>(work: () => Promise<T>): Promise<T> {
  if (rendering >= BUNDLE_RENDERS) await new Promise<void>((resolve) => waiting.push(resolve));
  rendering += 1;
  try {
    return await work();
  } finally {
    rendering -= 1;
    waiting.shift()?.();
  }
}

/** GET /api/v1/teaching/classes/{classId}/report-cards/pdf?title= — the class's cards under one title, a page each. */
export async function GET(request: Request, { params }: { params: Promise<{ classId: string }> }) {
  try {
    const ctx = await requireApiRole("TEACHER", "ADMIN", "PRINCIPAL");
    const { classId } = await params;
    const parsed = teachingCardsBundleQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!parsed.success) return apiInvalid(parsed);
    const refused = await budget(`pdf-bundle:${ctx.user.id}`, PDF_BUNDLE_BUDGET.limit, PDF_BUNDLE_BUDGET.windowMs);
    if (refused) return refused;
    // Reading, not writing: the head and the office read every card, a
    // teacher of the class theirs, and getCard's own gate decides each one.
    const rows = await db.reportCard.findMany({ where: { schoolId: ctx.schoolId, classId, title: parsed.data.title }, select: { id: true }, take: 400 });
    const memo: CardReadMemo = new Map();
    const cards: Card[] = [];
    for (let i = 0; i < rows.length; i += BUNDLE_READS) {
      const read = await Promise.all(rows.slice(i, i + BUNDLE_READS).map((row) => getCard(ctx, row.id, memo)));
      for (const card of read) if (card) cards.push(card);
    }
    if (cards.length === 0) throw new AccessError("reportCards.nothingUnderName", "NOT_FOUND");
    cards.sort((a, b) => a.studentName.localeCompare(b.studentName));
    const [t, locale] = await Promise.all([getT(), getLocale()]);
    const bytes = await inRenderTurn(() => renderReportCardsPdf(cards, t, locale));
    const name = `${parsed.data.title} - ${cards[0]?.className ?? classId}`.replace(/[^\w .-]+/g, "_");
    return new Response(new Uint8Array(bytes), { headers: { "content-type": "application/pdf", "content-disposition": `inline; filename="${name}.pdf"`, "cache-control": "private, no-store" } });
  } catch (error) {
    return apiFailure(error, "api/v1/teaching/report-cards/pdf");
  }
}
