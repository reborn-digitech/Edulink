import Link from "next/link";
import { COLLEGE_CLASS_LEVEL, QUIZ_BOARDS, type QuizBankChapters, type QuizBankMatrix } from "@edulink/contracts";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { ChipLink } from "@/components/ui/chip";
import { TableScroll } from "@/components/ui/table-scroll";
import { quizBoardKey } from "@/lib/quiz-board";
import { SUBJECT_KEY, type QuizSubject } from "@/lib/quiz";
import { streamLabel } from "@/lib/institution";
import type { Translate } from "@/lib/i18n/dictionary";
import { cn } from "@/lib/cn";

/**
 * The bank desk's views by class and subject (the owner's ask of 20 October 2026), rendered on the server for
 * /root/quiz-review and /appadmin/quiz-review: the board switch, the matrix of classes by subjects, and the chapters
 * grouped by class and subject in their book's order. Every choice is a link: the selection lives in the URL
 * (?board=&grade=&subject=), so an operator can send it to somebody.
 */

type Params = Record<string, string | undefined>;

/**
 * The desk's URL with some parameters changed (null removes one); the chapter walked on the desk is always cleared,
 * and so is the chapters' page unless the change names one — a filter resets the list to its first page (12 Nov 2026).
 */
export function deskHref(base: string, current: Params, changes: Record<string, string | number | null>, hash = ""): string {
  const merged: Record<string, string> = {};
  for (const [k, v] of Object.entries(current)) if (v && k !== "topic" && k !== "skip" && k !== "page") merged[k] = v;
  for (const [k, v] of Object.entries(changes)) {
    if (v === null || v === "") delete merged[k];
    else merged[k] = String(v);
  }
  const qs = new URLSearchParams(merged).toString();
  return `${base}${qs ? `?${qs}` : ""}${hash}`;
}

/** A subject's name: the bank's subjects by their key, a college stream's subject by the stream's name. */
export function bankSubjectLabel(subject: string, t: Translate): string {
  return subject in SUBJECT_KEY ? t(SUBJECT_KEY[subject as QuizSubject]) : streamLabel(subject, t);
}

export function bankBoardLabel(board: string | null, t: Translate): string | null {
  if (!board) return null;
  const key = quizBoardKey(board);
  return key ? t(key) : board;
}

/** NCERT, Balbharati or both: chips that narrow the whole page, keeping the class and subject chosen. */
export function BankBoardSwitch({ base, current, t }: { base: string; current: Params; t: Translate }) {
  const board = current.board ?? "";
  const options: { value: string; label: string }[] = [...QUIZ_BOARDS.map((b) => ({ value: b, label: bankBoardLabel(b, t)! })), { value: "", label: t("quizBoard.ALL") }];
  return (
    <nav aria-label={t("quizBoard.switchLabel")} className="flex flex-wrap items-center gap-2">
      <span className="text-sm font-medium text-fg-muted">{t("quizBoard.switchLabel")}</span>
      {options.map((o) => (
        <ChipLink key={o.value || "all"} href={deskHref(base, current, { board: o.value || null })} current={board === o.value} scroll={false}>
          {o.label}
        </ChipLink>
      ))}
    </nav>
  );
}

/** The generated share under a served figure (one bank, 7 Nov 2026): a cell, a row's total, a group, a chapter's row. */
function GeneratedLine({ generated, t }: { generated: number; t: Translate }) {
  return <span className="block text-[0.6875rem] leading-tight text-fg-muted">{t("bankDesk.cellGenerated", { generated })}</span>;
}

function Cell({ cell, href, title, t, chosen }: { cell: QuizBankMatrix["rows"][number]["cells"][number]; href: string; title: string; t: Translate; chosen: boolean }) {
  if (cell.chapters === 0) {
    return (
      <td className="px-1 py-1 text-center text-xs text-fg-subtle">
        <span className="sr-only">{t("bankDesk.emptyCell")}</span>
        <span aria-hidden="true">·</span>
      </td>
    );
  }
  const full = cell.atTarget === cell.chapters;
  return (
    <td className="px-1 py-1">
      <Link
        href={href}
        title={title}
        aria-label={title}
        aria-current={chosen ? "true" : undefined}
        className={cn(
          "flex min-h-11 flex-col items-center justify-center rounded-[var(--radius-md)] border px-2 py-1 text-center tabular-nums transition-colors hover:border-accent",
          chosen ? "border-accent bg-accent-soft" : full ? "border-ok bg-ok-soft" : "border-border bg-surface",
        )}
      >
        <span className="text-sm font-semibold text-fg">{cell.served}</span>
        <GeneratedLine generated={cell.generated} t={t} />
        <span className="text-[0.6875rem] leading-tight text-fg-muted">{t("bankDesk.cellChapters", { atTarget: cell.atTarget, chapters: cell.chapters })}</span>
      </Link>
    </td>
  );
}

/** Classes by subjects: the served questions in each cell with the generated share, and its chapters at the target; a cell opens its chapters. */
export function BankMatrixCard({ matrix, base, current, t }: { matrix: QuizBankMatrix; base: string; current: Params; t: Translate }) {
  const cellTitle = (subject: string, row: string, c: { served: number; generated: number; chapters: number; atTarget: number }) =>
    t("bankDesk.cellTitle", { subject: bankSubjectLabel(subject, t), row, served: c.served, generated: c.generated, chapters: c.chapters, atTarget: c.atTarget, target: matrix.target });
  const grade = current.grade ? Number(current.grade) : null;
  return (
    <Card>
      <CardHeader
        title={t("bankDesk.matrixTitle")}
        description={
          <>
            {t("bankDesk.matrixHint")} {matrix.targetFromRun ? t("bankDesk.targetFromRun", { target: matrix.target }) : t("bankDesk.targetDefault", { target: matrix.target })}
          </>
        }
      />
      <CardBody className="space-y-4">
        <BankBoardSwitch base={base} current={current} t={t} />
        <TableScroll>
          <table className="w-full min-w-[46rem] border-separate border-spacing-0 text-sm" data-testid="bank-matrix">
            <thead className="text-xs uppercase tracking-wide text-fg-muted">
              <tr>
                <th scope="col" className="py-2 pr-2 text-left font-medium">
                  {t("bankDesk.classCol")}
                </th>
                {matrix.subjects.map((s) => (
                  <th key={s} scope="col" className="px-1 py-2 text-center font-medium">
                    {bankSubjectLabel(s, t)}
                  </th>
                ))}
                <th scope="col" className="py-2 pl-2 text-right font-medium">
                  {t("bankDesk.allSubjects")}
                </th>
              </tr>
            </thead>
            <tbody>
              {matrix.rows.map((r) => {
                const row = t("bankDesk.gradeRow", { grade: r.grade });
                return (
                  <tr key={r.grade}>
                    <th scope="row" className="py-1 pr-2 text-left font-medium whitespace-nowrap">
                      <Link href={deskHref(base, current, { grade: r.grade, subject: null }, "#chapters")} className="inline-flex min-h-11 items-center text-accent-strong underline-offset-4 hover:underline">
                        {row}
                      </Link>
                    </th>
                    {r.cells.map((c) => (
                      <Cell key={c.subject} cell={c} t={t} title={cellTitle(c.subject, row, c)} chosen={grade === r.grade && current.subject === c.subject} href={deskHref(base, current, { grade: r.grade, subject: c.subject }, "#chapters")} />
                    ))}
                    <td className="py-1 pl-2 text-right tabular-nums">
                      <span className="font-semibold">{r.served}</span>
                      {r.chapters > 0 && <GeneratedLine generated={r.generated} t={t} />}
                      {r.chapters > 0 && <span className="block text-[0.6875rem] text-fg-muted">{t("bankDesk.cellChapters", { atTarget: r.atTarget, chapters: r.chapters })}</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </TableScroll>

        {matrix.college.rows.length > 0 && (
          <section className="space-y-2">
            <h3 className="text-sm font-semibold">{t("bankDesk.collegeTitle")}</h3>
            <TableScroll>
              <table className="w-full border-separate border-spacing-0 text-sm" data-testid="bank-matrix-college">
                <thead className="text-xs uppercase tracking-wide text-fg-muted">
                  <tr>
                    <th scope="col" className="py-2 pr-2 text-left font-medium">
                      {t("bankDesk.streamCol")}
                    </th>
                    {matrix.college.subjects.map((s) => (
                      <th key={s} scope="col" className="px-1 py-2 text-center font-medium">
                        {bankSubjectLabel(s, t)}
                      </th>
                    ))}
                    <th scope="col" className="py-2 pl-2 text-right font-medium">
                      {t("bankDesk.allSubjects")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {matrix.college.rows.map((r) => {
                    const row = r.stream ? streamLabel(r.stream, t) : t("bankDesk.everyStream");
                    return (
                      <tr key={r.stream ?? "all"}>
                        <th scope="row" className="py-1 pr-2 text-left font-medium whitespace-nowrap">
                          {row}
                        </th>
                        {r.cells.map((c) => (
                          <Cell key={c.subject} cell={c} t={t} title={cellTitle(c.subject, row, c)} chosen={grade === COLLEGE_CLASS_LEVEL && current.subject === c.subject} href={deskHref(base, current, { grade: COLLEGE_CLASS_LEVEL, subject: c.subject }, "#chapters")} />
                        ))}
                        <td className="py-1 pl-2 text-right tabular-nums">
                          <span className="font-semibold">{r.served}</span>
                          {r.chapters > 0 && <GeneratedLine generated={r.generated} t={t} />}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </TableScroll>
          </section>
        )}
      </CardBody>
    </Card>
  );
}

/** One group's heading: "Class 6 · Mathematics · NCERT", "College · Law". */
export function groupHeading(g: { grade: number; subject: string; board: string | null }, t: Translate): string {
  const subject = bankSubjectLabel(g.subject, t);
  if (g.grade >= COLLEGE_CLASS_LEVEL) return t("bankDesk.groupHeadingCollege", { subject });
  const board = bankBoardLabel(g.board, t);
  return board ? t("bankDesk.groupHeading", { grade: g.grade, subject, board }) : t("bankDesk.groupHeadingNoBoard", { grade: g.grade, subject });
}

/** The chapters grouped by class, subject and board, in each book's order; a chapter opens its own page. */
export function BankChapterGroups({ data, base, t }: { data: QuizBankChapters; base: string; t: Translate }) {
  if (data.groups.length === 0) return <p className="text-sm text-fg-muted">{t("bankDesk.chaptersNone")}</p>;
  return (
    <div className="space-y-6" data-testid="bank-chapters">
      {data.groups.map((g) => {
        const heading = groupHeading(g, t);
        return (
          <section key={`${g.grade}|${g.subject}|${g.board ?? ""}`} aria-label={heading} className="space-y-2">
            <h3 className="flex flex-wrap items-baseline justify-between gap-2 text-sm font-semibold">
              <span>{heading}</span>
              <span className="text-xs font-normal text-fg-muted">
                {t("bankDesk.groupServed", { served: g.served })} · {t("bankDesk.cellGenerated", { generated: g.generated })}
              </span>
            </h3>
            <TableScroll>
              <table className="w-full text-sm">
                <thead className="text-left text-xs uppercase tracking-wide text-fg-muted">
                  <tr>
                    <th scope="col" className="py-2 pr-3 font-medium">
                      {t("quizReview.chapterCol")}
                    </th>
                    {[1, 2, 3, 4, 5, 6].map((l) => (
                      <th key={l} scope="col" className="px-1 py-2 text-right font-medium whitespace-nowrap">
                        {t("quizReview.levelOption", { level: l })}
                      </th>
                    ))}
                    <th scope="col" className="py-2 pl-3 text-right font-medium">
                      {t("bankDesk.servedCol")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {g.chapters.map((c) => (
                    <tr key={c.topicId} className="border-t border-border">
                      <td className="py-2 pr-3">
                        <Link href={`${base}/chapter/${encodeURIComponent(c.slug)}`} className="inline-flex min-h-11 items-center text-accent-strong underline-offset-4 hover:underline">
                          {/* The title alone (the owner, 23 Oct 2026): two books of one class share chapter numbers, so a number in front read as a duplicate; the rows keep their book order. */}
                          {c.name}
                        </Link>
                        {/* owner-batch-item8: the book beside the title where two books of the class share chapter numbers. */}
                        {c.book && <span className="ml-2 text-xs text-fg-muted">{c.book}</span>}
                        <span className="ml-2 inline-flex flex-wrap gap-1 align-middle">
                          {c.maker && (
                            <Badge tone={c.maker === "GENERATED" ? "accent" : c.maker === "AUTHORED" ? "outline" : "info"} size="sm">
                              {t(`bankDesk.maker${c.maker}`)}
                            </Badge>
                          )}
                          {c.total >= data.target && (
                            <Badge tone="ok" size="sm">
                              {t("bankDesk.atTarget", { target: data.target })}
                            </Badge>
                          )}
                        </span>
                        {(c.down > 0 || c.held > 0) && <span className="block text-xs text-warn">{t("quizReview.chapterNote", { down: c.down, held: c.held })}</span>}
                      </td>
                      {c.levels.map((n, i) => (
                        <td key={i} className="px-1 py-2 text-right tabular-nums">
                          {n || ""}
                        </td>
                      ))}
                      <td className="py-2 pl-3 text-right tabular-nums">
                        <span className="font-semibold">{c.total}</span>
                        {c.total > 0 && <GeneratedLine generated={c.generated} t={t} />}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableScroll>
          </section>
        );
      })}
    </div>
  );
}
