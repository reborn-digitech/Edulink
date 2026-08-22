import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/tenancy";
import { getCard } from "@/lib/report-cards";
import { SUBJECT_KEY, type QuizSubject } from "@/lib/quiz";
import { formatDateKey } from "@/lib/dates";
import { formatMilli } from "@/lib/validation";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return {
  title: t("meta.reportCard"),
  robots: { index: false, follow: false },
};
}

/**
 * One report card, as it will be printed.
 *
 * BUILT TO GO ON PAPER, because that is what happens to a report card. The
 * `print:` classes strip the app chrome and force black on white — a card
 * printed from a dark-mode phone must not come out as a black rectangle, and a
 * school that prints thirty of these should not spend a cartridge on the
 * background.
 *
 * THE LOGO IS THE SCHOOL'S OWN, served through the authorised file route like
 * every other upload. It is not decoration: a report card is a document a family
 * keeps, and one that does not look like it came from the school is one they
 * cannot show anybody.
 *
 * `getCard` returns null rather than throwing when the reader is not allowed —
 * a draft to a parent, another school's card to anybody — and this renders that
 * as a 404. Not "forbidden": a card somebody may not read should not confirm
 * that it exists.
 */
export default async function ReportCardPage({
  params,
}: {
  params: Promise<{ cardId: string }>;
}) {
  const t = await getT();
  const subjectName = (code: string) => {
    const key = SUBJECT_KEY[code as QuizSubject];
    return key ? t(key) : code;
  };
  const session = await requireUser();
  const { cardId } = await params;

  const card = await getCard(session, cardId);
  if (!card) notFound();

  const logoUrl = card.school.logoPath ? `/api/files/${card.school.logoPath}` : null;

  return (
    <article className="mx-auto max-w-2xl print:max-w-none">
      {card.status !== "PUBLISHED" && (
        // Only staff can see a draft at all, but a teacher printing one by
        // mistake and handing it to a parent is the accident worth preventing.
        <p className="mb-4 rounded-[--radius-md] border border-warn/30 bg-warn-soft px-4 py-3 text-sm font-semibold text-warn print:hidden">
          {t("reportView.draftBanner")}
        </p>
      )}

      <div className="rounded-[--radius-lg] border border-border bg-surface p-6 print:rounded-none print:border-0 print:bg-white print:p-0 print:text-black sm:p-8">
        {/* ---------------- letterhead ---------------- */}
        <header className="flex items-start gap-4 border-b border-border pb-5 print:border-black/20">
          {logoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoUrl}
              alt=""
              className="size-16 shrink-0 rounded-[--radius-md] object-contain"
            />
          )}
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-bold tracking-tight text-fg print:text-black sm:text-2xl">
              {card.school.name}
            </h1>
            <p className="text-sm text-fg-muted print:text-black/70">
              {card.title} · {card.className}
              {card.classSection ? ` ${card.classSection}` : ""}
            </p>
          </div>
        </header>

        {/* ---------------- the child ---------------- */}
        <section className="flex flex-wrap items-baseline justify-between gap-3 py-5">
          <h2 className="text-2xl font-bold text-fg print:text-black">{card.studentName}</h2>
          <p className="text-xs text-fg-muted print:text-black/70">
            {formatDateKey(card.fromDateKey, { day: "numeric", month: "short" })} –{" "}
            {formatDateKey(card.toDateKey, { day: "numeric", month: "short", year: "numeric" })}
          </p>
        </section>

        {/* ---------------- headline figures ---------------- */}
        <section className="grid gap-3 sm:grid-cols-2">
          <Figure
            label={t("reportView.overall")}
            value={card.overallPercent === null ? "—" : `${card.overallPercent.toFixed(1)}%`}
            hint={
              card.overallPercent === null
                ? t("reportView.noMarksCounted")
                : card.gradingMethod === "exams"
                  ? t("reportView.examsOnly")
                  : card.gradingMethod === "weighted"
                    ? t("reportView.weightedBy")
                    : t("reportView.acrossBelow")
            }
          />
          <Figure
            label={t("reportView.attendance")}
            value={
              card.attendancePercent === null ? "—" : `${card.attendancePercent.toFixed(1)}%`
            }
            hint={
              card.attendanceTotal === 0
                ? t("reportView.noRegisterWindow")
                : t("reportView.daysOf", { present: card.attendancePresent, total: card.attendanceTotal })
            }
          />
        </section>

        {/* ---------------- the assessments ---------------- */}
        <section className="mt-6">
          <h3 className="text-sm font-semibold text-fg print:text-black">
            {t("reportView.whatThisCovers")}
          </h3>
          <table className="mt-2 w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-fg-muted print:border-black/20 print:text-black/70">
                <th scope="col" className="py-2 font-medium">
                  {t("reportView.assessment")}
                </th>
                <th scope="col" className="py-2 text-right font-medium">
                  {t("reportView.mark")}
                </th>
              </tr>
            </thead>
            <tbody>
              {card.items.map((item, index) => (
                <tr key={index} className="border-b border-border/60 print:border-black/10">
                  <td className="py-2 pr-3 text-fg print:text-black">
                    {item.title}
                    {item.category && (
                      <span className="block text-xs text-fg-muted print:text-black/60">
                        {item.category}
                      </span>
                    )}
                  </td>
                  <td className="py-2 text-right tabular-nums text-fg print:text-black">
                    {item.scoreMilli === null ? (
                      // Blank, not zero. A test the child has not sat is not a
                      // mark of nought, and the card must not imply it was.
                      <span className="text-fg-muted print:text-black/50">not marked</span>
                    ) : (
                      // formatMilli keeps a deliberate half-mark as 67.5 —
                      // toFixed(0) showed a number no teacher entered.
                      <>
                        {formatMilli(item.scoreMilli)}
                        {item.pointsMilli ? ` / ${formatMilli(item.pointsMilli)}` : ""}
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* ---------------- the practice annexure ---------------- */}
        {card.practice && (
          <section className="mt-6">
            <h3 className="text-sm font-semibold text-fg print:text-black">
              {t("reportView.practiceTitle")}
            </h3>
            <p className="mt-0.5 text-xs text-fg-muted print:text-black/70">
              {t("reportView.practiceHint")}
            </p>
            <table className="mt-2 w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-fg-muted print:border-black/20 print:text-black/70">
                  <th scope="col" className="py-2 font-medium">
                    {t("practice.colChapter")}
                  </th>
                  <th scope="col" className="py-2 text-right font-medium">
                    {t("practice.colLevel")}
                  </th>
                  <th scope="col" className="py-2 text-right font-medium">
                    {t("practice.colBadges")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {card.practice.map((row, index) => (
                  <tr key={index} className="border-b border-border/60 print:border-black/10">
                    <td className="py-2 pr-3 text-fg print:text-black">
                      {row.name}
                      <span className="block text-xs text-fg-muted print:text-black/60">
                        {subjectName(row.subject)}
                      </span>
                    </td>
                    <td className="py-2 text-right tabular-nums text-fg print:text-black">
                      L{row.level}/6
                    </td>
                    <td className="py-2 text-right tabular-nums text-fg print:text-black">
                      {row.tiers}/6
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {/* ---------------- the teacher's words ---------------- */}
        {card.remark && (
          <section className="mt-6">
            <h3 className="text-sm font-semibold text-fg print:text-black">
              {t("reportView.fromClassTeacher")}
            </h3>
            <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-fg print:text-black">
              {card.remark}
            </p>
          </section>
        )}

        <footer className="mt-8 border-t border-border pt-4 text-xs text-fg-muted print:border-black/20 print:text-black/70">
          {/* Whole sentences with placeholders; the date is a value. */}
          {card.authorName ? `${t("reportView.writtenBy", { name: card.authorName })} ` : ""}
          {card.publishedAt
            ? t("reportView.issuedOn", { date: card.publishedAt.toLocaleDateString() })
            : t("reportView.notYetIssued")}
        </footer>
      </div>
    </article>
  );
}

function Figure({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-[--radius-md] bg-surface-muted p-4 print:bg-transparent print:p-0">
      <p className="text-xs font-medium text-fg-muted print:text-black/70">{label}</p>
      <p className="mt-0.5 text-3xl font-bold tabular-nums text-fg print:text-black">{value}</p>
      <p className="mt-0.5 text-xs text-fg-muted print:text-black/70">{hint}</p>
    </div>
  );
}
