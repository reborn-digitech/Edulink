import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/tenancy";
import { getCard, gradingHintKey } from "@/lib/report-cards";
import { SUBJECT_KEY, type QuizSubject } from "@/lib/quiz";
import { formatDateKey } from "@/lib/dates";
import { nameCarriesSection } from "@/lib/codes";
import { formatMilli } from "@/lib/validation";
import { getT } from "@/lib/i18n/server";
import { PersonLink } from "@/components/person-link";
import Link from "next/link";
import { ArrowLeftIcon, DownloadSimpleIcon } from "@phosphor-icons/react/ssr";
import { PrintButton } from "../../reports/[studentMembershipId]/print-button";

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
  searchParams,
}: {
  params: Promise<{ cardId: string }>;
  searchParams: Promise<{ from?: string }>;
}) {
  const t = await getT();
  const subjectName = (code: string) => {
    const key = SUBJECT_KEY[code as QuizSubject];
    return key ? t(key) : code;
  };
  const session = await requireUser();
  const { cardId } = await params;
  const { from } = await searchParams;
  // Only a path of our own is a way back; anything else is the cards tab.
  const backHref = from && from.startsWith("/") && !from.startsWith("//") && !from.includes("\\") ? from : "/exams?tab=cards";

  const card = await getCard(session, cardId);
  if (!card) notFound();

  const logoUrl = card.school.logoPath ? `/api/files/${card.school.logoPath}` : null;
  const { layout, scale } = card;
  /* The letterhead in the school's colour when the office asked for it; a
     school with no colour set gets the page's own. */
  const brand = layout.useBrandColour && card.school.brandPrimary ? { color: card.school.brandPrimary } : undefined;
  const addressLine = [card.school.addressLine, card.school.city, card.school.region, card.school.postalCode].filter(Boolean).join(", ");
  const contactLine = [card.school.contactPhone, card.school.contactEmail, card.school.website].filter(Boolean).join(" · ");
  const showGradeColumn = scale.bands.length > 0;
  const showPointsColumn = layout.showGradePoints && card.subjects.some((s) => s.points !== null);
  /* On a marks-over-maximum card the rows show the marks they contributed, so
     the overall is the sum of this column over the sum of its maximums. */
  const showMarksColumn = card.gradingMethod === "exams" && card.subjects.some((s) => s.pointsMilli);
  const coRows = layout.showCoScholastic ? card.coScholastic : [];
  const scaleLine = scale.bands.map((b) => `${b.label} ${b.minPercent}%${b.descriptor ? ` ${b.descriptor}` : ""}`).join(" · ");
  const cell = "py-2 text-fg print:text-black";
  const head = "py-2 font-medium";
  const headRow = "border-b border-border text-left text-xs text-fg-muted print:border-black/20 print:text-black/70";
  const bodyRow = "border-b border-border/60 print:border-black/10";

  return (
    <article className="mx-auto max-w-2xl print:max-w-none">
      {/* The sheet the office chose, for the browser's own print dialog. */}
      <style>{`@page { size: ${layout.paper === "LETTER" ? "letter" : "A4"}; margin: 14mm }`}</style>
      {/* Off the sheet: the way back and the way onto paper. The page is
          designed for print and had neither. */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 print:hidden">
        <Link href={backHref} className="inline-flex items-center gap-1.5 text-sm font-medium text-fg-muted hover:text-fg">
          <ArrowLeftIcon weight="bold" className="size-4" />
          {t("reportView.back")}
        </Link>
        <span className="flex flex-wrap items-center gap-2">
          <a
            href={`/api/v1/shared/report-cards/${card.id}/pdf`}
            target="_blank"
            rel="noopener"
            className="inline-flex min-h-10 items-center gap-1.5 text-sm font-medium text-accent-strong underline underline-offset-2 hover:text-accent"
            data-testid="download-pdf"
          >
            <DownloadSimpleIcon weight="bold" className="size-4" aria-hidden="true" />
            {t("reportView.downloadPdf")}
          </a>
          <PrintButton />
        </span>
      </div>
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
            <h1 className="text-xl font-bold tracking-tight text-fg print:text-black sm:text-2xl" style={brand}>
              {card.school.name}
            </h1>
            {layout.headerNote && <p className="text-xs text-fg-muted print:text-black/70">{layout.headerNote}</p>}
            {layout.showAddress && (addressLine || contactLine) && (
              <p className="text-xs text-fg-muted print:text-black/70">
                {addressLine}
                {addressLine && contactLine ? " · " : ""}
                {contactLine}
              </p>
            )}
            <p className="mt-1 text-sm text-fg-muted print:text-black/70">
              {card.scope === "YEAR" ? `${t("reportView.annualCard")} · ` : ""}
              {card.title} · {card.className}
              {card.classSection && !nameCarriesSection(card.className, card.classSection) ? ` ${card.classSection}` : ""}
            </p>
          </div>
        </header>

        {/* ---------------- the child ---------------- */}
        <section className="flex flex-wrap items-baseline justify-between gap-3 py-5">
          <h2 className="text-2xl font-bold text-fg print:text-black">
            <PersonLink membershipId={card.studentMembershipId} name={card.studentName} />
          </h2>
          <p className="text-xs text-fg-muted print:text-black/70">
            {formatDateKey(card.fromDateKey, { day: "numeric", month: "short" })} –{" "}
            {formatDateKey(card.toDateKey, { day: "numeric", month: "short", year: "numeric" })}
          </p>
        </section>

        {/* ---------------- headline figures ---------------- */}
        <section className="grid gap-3 sm:grid-cols-2">
          {/* The percent is already the one-decimal figure the letter was read from; toFixed here only fixes the width. */}
          <Figure
            label={t("reportView.overall")}
            value={`${card.overallPercent === null ? "—" : `${card.overallPercent.toFixed(1)}%`}${card.overallLetter ? ` · ${card.overallLetter}` : ""}`}
            hint={t(gradingHintKey(card))}
          />
          {layout.showGradePoints && card.gradePoints !== null && (
            <Figure label={t("reportView.gradePoints")} value={card.gradePoints.toFixed(2)} hint={t("reportView.gradePointsHint")} />
          )}
          {layout.showAttendance && (
            <Figure
              label={t("reportView.attendance")}
              value={
                card.attendancePercent === null ? "—" : `${card.attendancePercent}%`
              }
              hint={
                card.attendanceTotal === 0
                  ? t("reportView.noRegisterWindow")
                  : t("reportView.daysOf", { present: card.attendancePresent, total: card.attendanceTotal })
              }
            />
          )}
        </section>

        {/* ---------------- the subjects ---------------- */}
        {card.subjects.length > 0 ? (
          <section className="mt-6">
            <h3 className="text-sm font-semibold text-fg print:text-black">{t("reportView.scholastic")}</h3>
            <table className="mt-2 w-full text-sm" data-testid="subject-table">
              <thead>
                <tr className={headRow}>
                  <th scope="col" className={head}>
                    {t("reportView.subject")}
                  </th>
                  <th scope="col" className={head}>
                    {card.scope === "YEAR" ? t("reportView.terms") : t("reportView.papers")}
                  </th>
                  {showMarksColumn && (
                    <th scope="col" className={`${head} text-right`}>
                      {t("reportView.mark")}
                    </th>
                  )}
                  <th scope="col" className={`${head} text-right`}>
                    {t("reportView.percent")}
                  </th>
                  {showGradeColumn && (
                    <th scope="col" className={`${head} text-right`}>
                      {t("reportView.grade")}
                    </th>
                  )}
                  {showPointsColumn && (
                    <th scope="col" className={`${head} text-right`}>
                      {t("reportView.points")}
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {card.subjects.map((subject) => (
                  <tr key={subject.subject} className={bodyRow}>
                    <td className={`${cell} pr-3 font-medium`}>{subject.subject}</td>
                    <td className={`${cell} pr-3 text-xs text-fg-muted print:text-black/70`}>
                      {subject.parts.map((part, index) => (
                        <span key={index} className="block whitespace-nowrap tabular-nums">
                          {part.label}
                          {part.scoreMilli !== null && part.pointsMilli
                            ? ` ${formatMilli(part.scoreMilli)}/${formatMilli(part.pointsMilli)}`
                            : part.percent !== null
                              ? ` ${part.percent.toFixed(1)}%`
                              : ""}
                          {part.weight !== null ? ` (${Math.round(part.weight)}%)` : ""}
                        </span>
                      ))}
                    </td>
                    {showMarksColumn && (
                      <td className={`${cell} text-right tabular-nums`}>
                        {subject.scoreMilli !== null && subject.scoreMilli !== undefined && subject.pointsMilli ? `${formatMilli(subject.scoreMilli)}/${formatMilli(subject.pointsMilli)}` : "—"}
                      </td>
                    )}
                    <td className={`${cell} text-right tabular-nums`}>{subject.percent === null ? "—" : `${subject.percent.toFixed(1)}%`}</td>
                    {showGradeColumn && <td className={`${cell} text-right font-semibold`}>{subject.letter ?? "—"}</td>}
                    {showPointsColumn && <td className={`${cell} text-right tabular-nums`}>{subject.points === null ? "—" : subject.points}</td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ) : (
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
        )}

        {/* ---------------- the class teacher's grades ---------------- */}
        {coRows.length > 0 && (
          <section className="mt-6">
            <h3 className="text-sm font-semibold text-fg print:text-black">{t("reportView.coScholastic")}</h3>
            <table className="mt-2 w-full text-sm" data-testid="co-scholastic-table">
              <thead>
                <tr className={headRow}>
                  <th scope="col" className={head}>
                    {t("reportView.subject")}
                  </th>
                  <th scope="col" className={`${head} text-right`}>
                    {t("reportView.grade")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {coRows.map((row) => (
                  <tr key={row.area} className={bodyRow}>
                    <td className={`${cell} pr-3`}>
                      {row.area}
                      {row.note && <span className="block text-xs text-fg-muted print:text-black/60">{row.note}</span>}
                    </td>
                    <td className={`${cell} text-right font-semibold`}>{row.grade ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {/* ---------------- the practice annexure ---------------- */}
        {layout.showPractice && card.practice && (
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
        {layout.showRemark && card.remark && (
          <section className="mt-6">
            <h3 className="text-sm font-semibold text-fg print:text-black">
              {t("reportView.fromClassTeacher")}
            </h3>
            <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-fg print:text-black">
              {card.remark}
            </p>
          </section>
        )}

        {/* ---------------- the scale the card was read on ---------------- */}
        {scale.bands.length > 0 && (
          <p className="mt-6 text-xs text-fg-muted print:text-black/70">
            <span className="font-medium">{t("reportView.scaleLine")}: </span>
            {scaleLine}
          </p>
        )}

        {/* ---------------- signatures ---------------- */}
        {layout.showSignatures && (
          <section className="mt-10 grid grid-cols-3 gap-4 text-center text-xs text-fg-muted print:text-black/70" data-testid="signatures">
            {[layout.signatureLeft, t("reportView.signatureParent"), layout.signatureRight].map((who, index) => (
              <div key={index} className="border-t border-border pt-2 print:border-black/40">
                {who}
              </div>
            ))}
          </section>
        )}

        <footer className="mt-8 border-t border-border pt-4 text-xs text-fg-muted print:border-black/20 print:text-black/70">
          {layout.footerNote && <p className="mb-1">{layout.footerNote}</p>}
          {/* Whole sentences with placeholders; the date is a value — the
              publish day in the SCHOOL'S zone, never the server's or UTC. */}
          {card.authorName ? `${t("reportView.writtenBy", { name: card.authorName })} ` : ""}
          {card.issuedDateKey
            ? t("reportView.issuedOn", { date: formatDateKey(card.issuedDateKey, { day: "numeric", month: "numeric", year: "numeric" }) })
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
