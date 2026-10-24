import type { Metadata } from "next";
import { DateField, SelectField, TextField } from "@/components/ui/field";
import { ActionForm } from "@/components/ui/action-form";
import { ExamIcon, PlusIcon, WarningIcon, CalendarCheckIcon } from "@phosphor-icons/react/ssr";
import { requireRole } from "@/lib/tenancy";
import { db } from "@/lib/db";
import { listSeries } from "@/lib/exams";
import { currentTerms } from "@/lib/terms";
import { formatDateKey } from "@/lib/dates";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getT, getLocale } from "@/lib/i18n/server";
import { EXAM_KINDS, EXAM_KIND_KEY, type ExamKind } from "@/lib/constants";
import { DataToolbar } from "@/components/ui/data-toolbar";
import { EmptyState } from "@/components/ui/states";
import { PageHeader } from "@/components/ui/page-header";
import { TableScroll } from "@/components/ui/table-scroll";
import {
  createSeriesAction,
  addSlotAction,
  removeSlotAction,
  publishSeriesAction,
  archiveSeriesAction,
} from "./actions";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("exams.adminTitle") };
}

const hhmm = (m: number) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;

/**
 * The exam office: one series per grade per term, a dated slot per subject.
 * Publishing puts the sheet in front of pupils and families; marks entry lives
 * with the teachers, on /teacher/exams, whether or not the sheet is published.
 */
export default async function AdminExamsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; kind?: string; grade?: string; state?: string }>;
}) {
  const ctx = await requireRole("ADMIN");
  const t = await getT();
  const locale = await getLocale();
  const { error, kind: rawKind, grade: rawGrade, state: rawState } = await searchParams;
  // The same toggle the reader's marks page has: unit tests, mid-term, final —
  // plus the two the office actually narrows by: which grade, and whether
  // the sheet is out yet. All three are the query's WHERE, not a filter over
  // a list already fetched.
  const kindFilter = EXAM_KINDS.includes(rawKind as ExamKind) ? (rawKind as ExamKind) : null;
  const stateFilter = rawState === "draft" || rawState === "published" ? rawState : null;

  const school = await db.school.findUniqueOrThrow({ where: { id: ctx.schoolId! }, select: { timezone: true } });
  const gradeFilter = rawGrade?.trim() || null;
  const [series, total, gradeRows, terms] = await Promise.all([
    listSeries(ctx, { kind: kindFilter ?? undefined, gradeLevel: gradeFilter ?? undefined, state: stateFilter ?? undefined }),
    db.examSeries.count({ where: { schoolId: ctx.schoolId!, archivedAt: null } }),
    db.class.findMany({
      where: { schoolId: ctx.schoolId!, archivedAt: null, gradeLevel: { not: null } },
      select: { gradeLevel: true },
      distinct: ["gradeLevel"],
    }),
    currentTerms(ctx.schoolId!, school.timezone),
  ]);
  const grades = gradeRows
    .map((c) => c.gradeLevel!)
    .sort((a, b) => Number(a) - Number(b) || a.localeCompare(b));

  return (
    <div className="space-y-6">
      <PageHeader title={t("exams.adminTitle")} description={t("exams.adminIntro")} />

      {error && (
        <Card>
          <CardBody className="flex items-center gap-2 text-sm text-danger">
            <WarningIcon weight="fill" className="size-4 shrink-0" />
            {error}
          </CardBody>
        </Card>
      )}

      {/* Used once a term, read every day: once the office has a series,
          the form folds away behind its own heading so the list is what a
          visit opens on. */}
      <details open={total === 0} className="group">
        <summary className="cursor-pointer list-none rounded-[var(--radius-md)] border border-border bg-surface px-4 py-3 text-sm font-semibold text-fg hover:bg-surface-muted [&::-webkit-details-marker]:hidden">
          + {t("exams.newSeriesTitle")}
        </summary>
        <div className="mt-3">
      <Card>
        <CardHeader
          icon={<PlusIcon weight="bold" className="size-5" />}
          title={t("exams.newSeriesTitle")}
          description={t("exams.newSeriesHint")}
        />
        <CardBody>
          {/* Answers in place (A3-journeys-27): a refusal keeps what was typed and sits under its box; a new series is announced and scrolled to. */}
          <ActionForm action={createSeriesAction} className="grid gap-3 sm:grid-cols-3">
            <TextField
              className="sm:col-span-2"
              label={t("exams.fieldName")}
              name="name"
              required
              maxLength={120}
              placeholder={t("exams.namePlaceholder")}
            />
            <SelectField label={t("exams.fieldGrade")} name="gradeLevel" required>
              {grades.map((grade) => (
                <option key={grade} value={grade}>
                  {t("practice.classN", { n: grade })}
                </option>
              ))}
            </SelectField>
            <SelectField label={t("exams.fieldKind")} name="kind" required>
              {EXAM_KINDS.map((kind) => (
                <option key={kind} value={kind}>
                  {t(EXAM_KIND_KEY[kind])}
                </option>
              ))}
            </SelectField>
            {terms.length > 0 && (
              <SelectField label={t("terms.examTerm")} name="termId" defaultValue={terms.find((x) => x.current)?.id ?? ""}>
                <option value="">{t("terms.examNoTerm")}</option>
                {terms.map((term) => (
                  <option key={term.id} value={term.id}>{term.name}</option>
                ))}
              </SelectField>
            )}
            <div className="sm:col-span-3">
              <Button type="submit">{t("exams.createSeries")}</Button>
            </div>
          </ActionForm>
        </CardBody>
      </Card>
        </div>
      </details>

      {total > 0 && (
        <DataToolbar
          facets={[
            {
              key: "kind",
              label: t("exams.kindFilterLabel"),
              value: kindFilter ?? "",
              options: [{ value: "", label: t("exams.allKinds") }, ...EXAM_KINDS.map((k) => ({ value: k, label: t(EXAM_KIND_KEY[k]) }))],
            },
            {
              key: "state",
              label: t("exams.stateFilterLabel"),
              value: stateFilter ?? "",
              options: [
                { value: "", label: t("vacancies.filterAll") },
                { value: "draft", label: t("exams.draftLabel") },
                { value: "published", label: t("exams.published") },
              ],
            },
            {
              key: "grade",
              label: t("exams.fieldGrade"),
              value: gradeFilter ?? "",
              as: "select",
              options: [{ value: "", label: t("exams.allGrades") }, ...grades.map((g) => ({ value: g, label: t("practice.classN", { n: g }) }))],
            },
          ]}
          labels={{ clearAll: t("common.clearAll"), clearSearch: t("common.clearSearch"), activeFilters: t("common.activeFilters") }}
        />
      )}

      {series.length === 0 ? (
        <EmptyState
          icon={<ExamIcon weight="duotone" className="size-8" />}
          title={total > 0 ? t("common.noResultsTitle") : t("exams.noneYet")}
          description={total > 0 ? t("common.noResultsBody") : t("exams.newSeriesHint")}
        />
      ) : (
        series.map((s) => (
          <Card key={s.id} id={`series-${s.id}`} tabIndex={-1} className="scroll-mt-20 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-ring/40">
            <CardHeader
              icon={<CalendarCheckIcon weight="duotone" className="size-5" />}
              title={[s.name, t(EXAM_KIND_KEY[s.kind as ExamKind]), t("practice.classN", { n: s.gradeLevel }), s.term?.name].filter(Boolean).join(" · ")}
              description={
                s.publishedAt ? t("exams.publishedHint") : t("exams.draftHint")
              }
              action={
                <div className="flex items-center gap-2">
                  {s.publishedAt ? (
                    <Badge tone="ok" size="sm">
                      {t("exams.published")}
                    </Badge>
                  ) : (
                    <ActionForm action={publishSeriesAction}>
                      <input type="hidden" name="seriesId" value={s.id} />
                      <Button type="submit" size="sm">
                        {t("exams.publish")}
                      </Button>
                    </ActionForm>
                  )}
                  <ActionForm action={archiveSeriesAction}>
                    <input type="hidden" name="seriesId" value={s.id} />
                    <Button type="submit" size="sm" variant="secondary">
                      {t("exams.archive")}
                    </Button>
                  </ActionForm>
                </div>
              }
            />
            <CardBody className="space-y-4">
              {s.slots.length > 0 && (
                <TableScroll>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-fg-muted">
                        <th className="py-2 pr-3 font-medium">{t("exams.colSubject")}</th>
                        <th className="py-2 pr-3 font-medium">{t("exams.colDay")}</th>
                        <th className="py-2 pr-3 font-medium">{t("exams.colTime")}</th>
                        <th className="py-2 pr-3 text-right font-medium">{t("exams.colMaxMarks")}</th>
                        <th className="py-2"><span className="sr-only">{t("qaInterface.colActions")}</span></th>
                      </tr>
                    </thead>
                    <tbody>
                      {s.slots.map((slot) => (
                        <tr key={slot.id} className="border-b border-border last:border-b-0">
                          <td className="py-2.5 pr-3 font-medium text-fg">{slot.subject}</td>
                          <td className="py-2.5 pr-3 text-fg">{formatDateKey(slot.dateKey, undefined, locale)}</td>
                          <td className="py-2.5 pr-3 text-fg-muted">
                            {slot.startMinute !== null
                              ? `${hhmm(slot.startMinute)}${slot.endMinute !== null ? `–${hhmm(slot.endMinute)}` : ""}`
                              : "—"}
                          </td>
                          <td className="py-2.5 pr-3 text-right text-fg">{slot.pointsMilli / 1000}</td>
                          <td className="py-2.5 text-right">
                            <ActionForm action={removeSlotAction}>
                              <input type="hidden" name="slotId" value={slot.id} />
                              {/* Named per paper: a column of bare "Remove"
                                  buttons is unreadable to a screen reader. */}
                              <Button
                                type="submit"
                                size="sm"
                                variant="ghost"
                                aria-label={t("exams.removePaper", { subject: slot.subject })}
                              >
                                {t("common.remove")}
                              </Button>
                            </ActionForm>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </TableScroll>
              )}

              <ActionForm action={addSlotAction} className="grid gap-3 sm:grid-cols-5">
                <input type="hidden" name="seriesId" value={s.id} />
                <TextField label={t("exams.colSubject")} name="subject" required maxLength={80} />
                <DateField label={t("exams.colDay")} name="dateKey" required />
                <TextField label={t("exams.fieldStart")} name="startTime" type="time" />
                <TextField label={t("exams.fieldEnd")} name="endTime" type="time" />
                <TextField label={t("exams.colMaxMarks")} name="maxMarks" type="number" required min={1} max={1000} step="0.5" defaultValue={80} />
                <label className="flex items-center gap-2 text-xs text-fg-muted sm:col-span-5">
                  <input type="checkbox" name="evenIfClosed" />
                  {t("exams.evenIfClosed")}
                </label>
                <div className="sm:col-span-5">
                  <Button type="submit" variant="secondary" size="sm" icon={<PlusIcon weight="bold" />}>
                    {t("exams.addPaper")}
                  </Button>
                </div>
              </ActionForm>
            </CardBody>
          </Card>
        ))
      )}
    </div>
  );
}
