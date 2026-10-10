import Link from "next/link";
import { BuildingsIcon } from "@phosphor-icons/react/ssr";
import type { PreviousSchoolsView } from "@edulink/contracts";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { TableScroll } from "@/components/ui/table-scroll";
import { formatDateKey } from "@/lib/dates";
import { getLocale, getT } from "@/lib/i18n/server";
import type { TranslationKey } from "@/lib/i18n/dictionary";

const REASON_KEY: Record<string, TranslationKey> = { TRANSFERRED: "tc.reasonTransferred", GRADUATED: "tc.reasonGraduated", LEFT: "tc.reasonLeft" };

/**
 * THE PREVIOUS SCHOOLS (R-70, 10 Oct 2026): on the pupil's record at the new
 * school and on the family's child page. One card; each school the pupil has
 * left is a section with its leaving certificate (serial, class, the leaving
 * day and reason, the attendance it froze) and the published report cards it
 * opens, each card's subjects behind a disclosure. Read-only by construction:
 * there is no form here and no door that writes. The old school is named on
 * every section; the certificate opens on the TC page the family already
 * uses. Drawn only from what the server's clauses opened (previous-schools.ts).
 */
export async function PreviousSchoolsPanel({ view }: { view: PreviousSchoolsView }) {
  const t = await getT();
  const locale = await getLocale();
  const day = (iso: string) => formatDateKey(iso.slice(0, 10), { day: "numeric", month: "short", year: "numeric" }, locale);
  const pct = (n: number | null) => (n === null ? "—" : `${Math.round(n * 10) / 10}%`);
  return (
    <Card data-testid="previous-schools">
      <CardHeader icon={<BuildingsIcon weight="duotone" className="size-5" />} title={t("ownerDecisions.previousSchoolsTitle")} description={t("ownerDecisions.previousSchoolsIntro", { name: view.studentName })} />
      <CardBody className="space-y-5">
        {view.schools.length === 0 ? (
          <p className="text-sm text-fg-muted">{t("ownerDecisions.noPreviousSchools", { name: view.studentName })}</p>
        ) : (
          view.schools.map((s) => (
            <section key={s.recordId} className="space-y-3" data-testid="previous-school">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-base font-semibold text-fg">{s.schoolName}</h3>
                <Badge tone="neutral" size="sm">{t("ownerDecisions.leftOnReason", { date: day(s.leftAt), reason: REASON_KEY[s.reason] ? t(REASON_KEY[s.reason]!) : s.reason })}</Badge>
              </div>
              <div className="rounded-[var(--radius-md)] border border-border bg-surface-muted p-3 text-sm">
                <p className="font-medium text-fg">
                  {t("ownerDecisions.leavingCertificate")}
                  {s.serial ? <span className="ml-2 font-mono text-fg-muted">{s.serial}</span> : null}
                </p>
                <p className="mt-1 text-fg-muted">
                  {[s.className ?? s.gradeLevel, t("ownerDecisions.attendanceLine", { present: s.attendancePresent, marked: s.attendanceMarked })].filter(Boolean).join(" · ")}
                </p>
                <Link href={`/certificate/${s.recordId}`} className="mt-2 inline-flex min-h-11 items-center text-sm font-medium text-accent underline-offset-2 hover:underline">
                  {t("ownerDecisions.openCertificate")}
                </Link>
              </div>
              <div>
                <p className="text-sm font-medium text-fg">{t("ownerDecisions.publishedCards")}</p>
                {s.cards.length === 0 ? (
                  <p className="mt-1 text-sm text-fg-muted">{t("ownerDecisions.noPublishedCards", { name: view.studentName })}</p>
                ) : (
                  <ul className="mt-2 divide-y divide-border rounded-[var(--radius-md)] border border-border">
                    {s.cards.map((c) => (
                      <li key={c.id} data-testid="previous-school-card">
                        <details className="group">
                          <summary className="flex min-h-11 cursor-pointer flex-wrap items-center justify-between gap-2 px-3 py-2 text-sm">
                            <span className="flex flex-wrap items-center gap-2">
                              <span className="font-medium text-fg">{c.title}</span>
                              <span className="text-fg-muted">{day(c.fromDateKey)} – {day(c.toDateKey)}</span>
                            </span>
                            <span className="flex flex-wrap items-center gap-2 text-fg-muted">
                              <span>{t("ownerDecisions.cardOverall")}: <strong className="text-fg">{c.overallLetter ?? pct(c.overallPercent)}</strong></span>
                              <span>{t("ownerDecisions.cardAttendance", { present: c.attendancePresent, total: c.attendanceTotal })}</span>
                            </span>
                          </summary>
                          <div className="space-y-3 border-t border-border px-3 py-3">
                            {c.subjects.length > 0 && (
                              <TableScroll>
                                <table className="w-full text-sm">
                                  <thead>
                                    <tr className="text-left text-xs uppercase tracking-wide text-fg-muted">
                                      <th className="py-1.5 pr-3 font-medium">{t("ownerDecisions.subjectCol")}</th>
                                      <th className="py-1.5 pr-3 text-right font-medium">{t("ownerDecisions.percentCol")}</th>
                                      <th className="py-1.5 font-medium">{t("ownerDecisions.letterCol")}</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {c.subjects.map((row) => (
                                      <tr key={row.subject} className="border-t border-border">
                                        <td className="py-1.5 pr-3 text-fg">{row.subject}</td>
                                        <td className="py-1.5 pr-3 text-right tabular-nums text-fg">{pct(row.percent)}</td>
                                        <td className="py-1.5 text-fg">{row.letter ?? "—"}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </TableScroll>
                            )}
                            {c.remark && (
                              <p className="text-sm text-fg-muted">
                                <span className="font-medium text-fg">{t("ownerDecisions.remarkLabel")}: </span>
                                {c.remark}
                              </p>
                            )}
                          </div>
                        </details>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>
          ))
        )}
      </CardBody>
    </Card>
  );
}
