import Link from "next/link";
import { FlaskIcon, SealCheckIcon } from "@phosphor-icons/react/ssr";
import type { PracticalSheet } from "@edulink/contracts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { DateField, TextField } from "@/components/ui/field";
import { ActionForm } from "@/components/ui/action-form";
import { EmptyState } from "@/components/ui/states";
import { TableScroll } from "@/components/ui/table-scroll";
import { NUM, TD, TH } from "@/components/module-flash";
import { formatDateKey } from "@/lib/dates";
import type { Translate } from "@/lib/i18n/dictionary";
import { savePracticalsAction, signPracticalsAction } from "@/app/(app)/admin/stream-records/actions";
import { fieldClass } from "@/components/ui/field-class";

/**
 * THE PRACTICAL RECORD on the web (5 Oct 2026), one panel for the faculty
 * member's, the HOD's and the office's pages: the offerings with practicals
 * the reader may keep (or read), one offering's students with their batch,
 * the experiments recorded with who signed, a form for the next experiment
 * and the unsigned rows to sign. lib/stream-records.ts decides who writes and
 * who signs; the panel draws what the sheet says.
 */
export function PracticalsPanel({ sheet, t, locale, base, today }: { sheet: PracticalSheet; t: Translate; locale: string; base: string; today: string }) {
  if (sheet.offerings.length === 0) {
    return <EmptyState icon={<FlaskIcon weight="duotone" className="size-6" />} title={t("streamRecords.practicals.noneTitle")} description={t("streamRecords.practicals.noneBody")} action={<Button asChild size="sm" variant="secondary"><Link href={base.startsWith("/admin") ? "/admin/academics/offerings" : "/faculty"}>{t(base.startsWith("/admin") ? "streamRecords.batches.toAcademics" : "streamRecords.practicals.noneAction")}</Link></Button>} />;
  }
  const offering = sheet.offerings.find((o) => o.offeringId === sheet.offeringId) ?? null;
  const experiments = [...new Set(sheet.records.map((r) => r.experimentNo))].sort((a, b) => a - b);
  const cell = new Map(sheet.records.map((r) => [`${r.studentMembershipId}|${r.experimentNo}`, r]));
  const unsigned = sheet.records.filter((r) => !r.signed);
  const nextNo = (experiments[experiments.length - 1] ?? 0) + 1;
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader icon={<FlaskIcon weight="duotone" className="size-5" />} title={t("streamRecords.practicals.offeringsTitle")} description={t("streamRecords.practicals.offeringsBody")} />
        <CardBody>
          <ul className="flex flex-wrap gap-2">
            {sheet.offerings.map((o) => (
              <li key={o.offeringId}>
                <Link
                  href={`${base}?offeringId=${o.offeringId}`}
                  aria-current={o.offeringId === sheet.offeringId ? "page" : undefined}
                  className={`inline-flex min-h-11 items-center rounded-[var(--radius-md)] border px-3 text-sm ${o.offeringId === sheet.offeringId ? "border-accent bg-accent-soft font-semibold text-accent-strong" : "border-border text-fg hover:bg-surface-muted"}`}
                >
                  {[o.courseCode, o.divisionName].filter(Boolean).join(" · ")}
                </Link>
              </li>
            ))}
          </ul>
        </CardBody>
      </Card>

      {offering ? (
        <Card>
          <CardHeader title={[offering.courseCode, offering.courseName].join(" · ")} description={t("streamRecords.practicals.sheetBody", { faculty: offering.facultyName ?? "—", students: sheet.students.length, experiments: experiments.length })} />
          <CardBody>
            {sheet.students.length === 0 ? (
              <p className="text-sm text-fg-muted">{t("streamRecords.practicals.noStudents")}</p>
            ) : (
              <TableScroll label={t("streamRecords.practicals.tableLabel")}>
                <table className="w-full text-sm">
                  <thead>
                    <tr>
                      <th className={TH}>{t("streamRecords.colRoll")}</th>
                      <th className={TH}>{t("streamRecords.colStudent")}</th>
                      <th className={TH}>{t("streamRecords.colBatch")}</th>
                      {experiments.map((n) => (
                        <th key={n} className={TH}>
                          {t("streamRecords.practicals.expN", { n })}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sheet.students.map((s) => (
                      <tr key={s.studentMembershipId}>
                        <td className={NUM}>{s.rollNumber ?? "—"}</td>
                        <td className={TD}>{s.name}</td>
                        <td className={TD}>{s.batchName ?? "—"}</td>
                        {experiments.map((n) => {
                          const r = cell.get(`${s.studentMembershipId}|${n}`);
                          return (
                            <td key={n} className={TD}>
                              {r ? (
                                <span className="inline-flex items-center gap-1">
                                  {r.marks ?? "✓"}
                                  {r.signed ? <SealCheckIcon weight="fill" className="size-4 text-ok" aria-label={t("streamRecords.practicals.signedBy", { name: r.signedByName ?? "" })} /> : null}
                                </span>
                              ) : (
                                <span className="text-fg-subtle">—</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </TableScroll>
            )}
          </CardBody>
        </Card>
      ) : null}

      {offering && sheet.canWrite && sheet.students.length > 0 ? (
        <Card>
          <CardHeader title={t("streamRecords.practicals.addTitle")} description={t("streamRecords.practicals.addBody")} />
          <CardBody>
            {/* Answers in place (A3-journeys-27): a refused mark keeps the sheet as typed and its box is marked. */}
            <ActionForm action={savePracticalsAction} className="space-y-4">
              <input type="hidden" name="offeringId" value={offering.offeringId} />
              <input type="hidden" name="back" value={base} />
              <div className="grid gap-3 sm:grid-cols-3">
                <TextField name="experimentNo" label={t("streamRecords.practicals.fieldNo")} type="number" min={1} max={200} required defaultValue={String(nextNo)} />
                <TextField name="title" label={t("streamRecords.practicals.fieldTitle")} required minLength={2} maxLength={160} />
                <DateField name="performedOn" label={t("streamRecords.practicals.fieldDay")} required defaultValue={today} max={today} />
              </div>
              <fieldset>
                <legend className="mb-2 text-sm font-medium text-fg">{t("streamRecords.practicals.fieldStudents")}</legend>
                <ul className="grid gap-2 sm:grid-cols-2">
                  {sheet.students.map((s) => (
                    <li key={s.studentMembershipId} className="flex items-center gap-2">
                      <label className="flex min-h-11 flex-1 items-center gap-2 text-sm text-fg">
                        <input type="checkbox" name="student" value={s.studentMembershipId} defaultChecked className="size-4 accent-[var(--accent)]" />
                        {s.name}
                        {s.batchName ? <span className="text-xs text-fg-muted">{t("streamRecords.batchN", { name: s.batchName })}</span> : null}
                      </label>
                      <input className={fieldClass("w-20 text-right")} name={`marks:${s.studentMembershipId}`} inputMode="numeric" maxLength={3} aria-label={t("streamRecords.practicals.marksFor", { name: s.name })} placeholder={t("streamRecords.practicals.marks")} />
                    </li>
                  ))}
                </ul>
              </fieldset>
              <Button type="submit">{t("streamRecords.practicals.save")}</Button>
            </ActionForm>
          </CardBody>
        </Card>
      ) : null}

      {offering && sheet.canSign && unsigned.length > 0 ? (
        <Card>
          <CardHeader icon={<SealCheckIcon weight="duotone" className="size-5" />} title={t("streamRecords.practicals.signTitle")} description={t("streamRecords.practicals.signBody", { count: unsigned.length })} />
          <CardBody>
            <form action={signPracticalsAction} className="space-y-3">
              <input type="hidden" name="offeringId" value={offering.offeringId} />
              <input type="hidden" name="back" value={base} />
              <ul className="divide-y divide-border text-sm">
                {unsigned.map((r) => (
                  <li key={r.id}>
                    <label className="flex min-h-11 items-center gap-2 py-1.5">
                      <input type="checkbox" name="record" value={r.id} defaultChecked className="size-4 accent-[var(--accent)]" />
                      <span className="min-w-0">{t("streamRecords.practicals.signLine", { n: r.experimentNo, title: r.title, student: r.studentName, day: formatDateKey(r.performedOn, { dateStyle: "medium" }, locale) })}</span>
                      {r.marks !== null ? <Badge tone="neutral">{r.marks}</Badge> : null}
                    </label>
                  </li>
                ))}
              </ul>
              <Button type="submit" variant="secondary">{t("streamRecords.practicals.sign")}</Button>
            </form>
          </CardBody>
        </Card>
      ) : null}
    </div>
  );
}
