import type { Metadata } from "next";
import { ClipboardTextIcon, FileTextIcon, LockIcon, TargetIcon } from "@phosphor-icons/react/ssr";
import { COURSE_FILE_ITEM_KINDS, INTERNAL_KINDS } from "@edulink/contracts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/states";
import { PageHeader } from "@/components/ui/page-header";
import { TabBar } from "@/components/ui/tabs";
import { SelectField, TextAreaField, TextField } from "@/components/ui/field";
import { ModuleOff } from "@/components/module-off";
import { INPUT, LINK, ModuleFlash, NUM, TD, TH } from "@/components/module-flash";
import { INTERNAL_KIND_KEY, ITEM_KEY } from "@/components/academics/parts";
import { AttendanceReportTable } from "@/components/academics/report-table";
import { requireRole } from "@/lib/tenancy";
import { isModuleOn } from "@/lib/modules";
import { courseFile } from "@/lib/academics-coursefile";
import { internalSheet } from "@/lib/academics-assessment";
import { attendanceReport } from "@/lib/academics-attendance";
import { formatInZone, isoToDisplayDate } from "@/lib/dates";
import { db } from "@/lib/db";
import { getLocale, getT } from "@/lib/i18n/server";
import { coverageLineText } from "@/lib/count-copy";
import type { ActiveContext } from "@/lib/session";
import { addItemAction, lockAction, moderateAction, releaseAction, reviewAction, saveComponentAction, saveMarksAction, savePlanAction } from "../../actions";
import { TableScroll } from "@/components/ui/table-scroll";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("academics.offeringTitle") };
}

type Tab = "file" | "marks" | "attendance";

/**
 * One offering for its faculty member, a colleague of the department and the
 * HOD: the course file (plan by week with outcomes, coverage against the
 * term, resources and question papers, the HOD's review, CO and PO
 * attainment), the internal marks (components, entry, countersign, release,
 * lock) and the attendance by student.
 */
export default async function OfferingPage({ params, searchParams }: { params: Promise<{ offeringId: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const ctx = await requireRole("FACULTY", "HOD");
  const [t, locale] = await Promise.all([getT(), getLocale()]);
  if (!(await isModuleOn(ctx.schoolId, "ACADEMICS"))) return <ModuleOff module="ACADEMICS" t={t} college />;
  const { offeringId } = await params;
  const sp = await searchParams;
  const tab: Tab = sp.tab === "marks" || sp.tab === "attendance" ? sp.tab : "file";
  const file = await courseFile(ctx, offeringId);
  const base = `/faculty/offerings/${offeringId}`;
  return (
    <div className="space-y-6">
      <PageHeader title={[file.courseCode, file.courseName].join(" · ")} description={file.facultyName ?? undefined} />
      <TabBar
        ariaLabel={t("academics.offeringTitle")}
        current={tab}
        tabs={[
          { key: "file", href: base, label: t("academics.tabCourseFile") },
          { key: "marks", href: `${base}?tab=marks`, label: t("academics.tabInternal") },
          { key: "attendance", href: `${base}?tab=attendance`, label: t("academics.tabAttendance") },
        ]}
      />
      <ModuleFlash t={t} params={sp} />
      {tab === "file" ? <FileTab t={t} file={file} /> : tab === "marks" ? <MarksTab t={t} offeringId={offeringId} ctx={ctx} /> : <AttendanceTab t={t} offeringId={offeringId} ctx={ctx} locale={locale} />}
    </div>
  );
}

type T = Awaited<ReturnType<typeof getT>>;
type Ctx = ActiveContext;

function FileTab({ t, file }: { t: T; file: Awaited<ReturnType<typeof courseFile>> }) {
  const planText = file.plan.map((w) => `${w.week} | ${w.topic} | ${w.coCodes.join(" ")} | ${w.taughtOn ?? ""}`).join("\n");
  return (
    <>
      <Card>
        <CardHeader icon={<FileTextIcon weight="duotone" className="size-5" />} title={t("academics.planTitle")} description={coverageLineText(t, { taught: file.taught, planned: file.plan.length, expected: file.expected, elapsed: file.termElapsedPercent })} />
        <CardBody className="space-y-4">
          {file.behind ? <Badge tone="danger">{t("academics.behindBody")}</Badge> : null}
          {file.outcomes.length ? <ul className="list-inside list-disc text-sm text-fg-muted">{file.outcomes.map((o) => <li key={o.code}>{`${o.code} — ${o.text}`}</li>)}</ul> : null}
          {file.plan.length ? (
            <ol className="space-y-1 text-sm">
              {file.plan.map((w) => (
                <li key={w.week}>
                  <span className="tabular-nums text-fg-muted">{t("academics.weekN", { n: w.week })}</span> {w.topic} <span className="text-fg-muted">{w.coCodes.join(", ")}</span> {w.taughtOn ? <Badge tone="ok">{t("academics.taughtOn", { date: isoToDisplayDate(w.taughtOn) })}</Badge> : null}
                </li>
              ))}
            </ol>
          ) : (
            <EmptyState className="border-0 bg-transparent py-4" title={t("academics.planNone")} description={t("academics.planNoneBody")} />
          )}
          {file.canEdit ? (
            <form action={savePlanAction} className="space-y-2">
              <input type="hidden" name="offeringId" value={file.offeringId} />
              <TextAreaField label={t("academics.fieldPlan")} name="plan" rows={8} defaultValue={planText} hint={t("academics.fieldPlanHint")} />
              <Button type="submit" variant="secondary">{t("academics.savePlan")}</Button>
            </form>
          ) : null}
        </CardBody>
      </Card>
      <Card>
        <CardHeader icon={<ClipboardTextIcon weight="duotone" className="size-5" />} title={t("academics.itemsTitle")} description={t("academics.itemsBody")} />
        <CardBody className="space-y-4">
          {file.items.length === 0 ? (
            <EmptyState className="border-0 bg-transparent py-4" title={t("academics.itemsNone")} description={t("academics.itemsNoneBody")} />
          ) : (
            <ul className="divide-y divide-border text-sm">
              {file.items.map((i) => (
                <li key={i.id} className="py-2">
                  <Badge tone="neutral">{t(ITEM_KEY[i.kind]!)}</Badge>{" "}
                  {i.fileId ? <a className={LINK} href={`/api/files/${encodeURIComponent(i.fileId)}`} target="_blank" rel="noreferrer">{i.title}</a> : i.url ? <a className={LINK} href={i.url} target="_blank" rel="noreferrer noopener">{i.title}</a> : i.title}{" "}
                  <span className="text-fg-muted">{i.coCodes.join(", ")}</span>
                </li>
              ))}
            </ul>
          )}
          {file.canEdit ? (
            <form action={addItemAction} className="grid gap-3 sm:grid-cols-3">
              <input type="hidden" name="offeringId" value={file.offeringId} />
              <SelectField label={t("academics.fieldItemKind")} name="kind" defaultValue="RESOURCE">
                {COURSE_FILE_ITEM_KINDS.map((k) => <option key={k} value={k}>{t(ITEM_KEY[k]!)}</option>)}
              </SelectField>
              <TextField label={t("academics.fieldTitle")} name="title" required maxLength={160} />
              <TextField label={t("academics.fieldCoCodes")} name="coCodes" hint={t("academics.fieldCoCodesHint")} />
              <TextField label={t("academics.fieldLink")} name="url" type="url" maxLength={500} />
              <TextField label={t("academics.fieldFile")} name="file" type="file" />
              <div className="self-end">
                <Button type="submit">{t("academics.addItem")}</Button>
              </div>
            </form>
          ) : null}
        </CardBody>
      </Card>
      <Card>
        <CardHeader icon={<TargetIcon weight="duotone" className="size-5" />} title={t("academics.attainmentTitle")} description={t("academics.attainmentBody", { target: file.attainment.targetPercent })} />
        <CardBody className="space-y-3">
          {file.attainment.cos.length === 0 ? (
            <EmptyState className="border-0 bg-transparent py-4" title={t("academics.attainmentNone")} description={t("academics.attainmentNoneBody")} />
          ) : (
            <TableScroll>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th scope="col" className={TH}>{t("academics.colOutcome")}</th>
                    <th scope="col" className={`${TH} text-right`}>{t("academics.colReached")}</th>
                    <th scope="col" className={`${TH} text-right`}>{t("academics.colDirect")}</th>
                    <th scope="col" className={`${TH} text-right`}>{t("academics.colIndirect")}</th>
                    <th scope="col" className={`${TH} text-right`}>{t("academics.colLevel")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {file.attainment.cos.map((c) => (
                    <tr key={c.code}>
                      <td className={TD}>{c.code}</td>
                      <td className={NUM}>{t("academics.reachedOf", { reached: c.reached, assessed: c.assessed })}</td>
                      <td className={NUM}>{c.direct ?? "—"}</td>
                      <td className={NUM}>{c.indirect ?? "—"}</td>
                      <td className={NUM}>{c.level ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableScroll>
          )}
          {file.attainment.pos.length ? <p className="text-sm text-fg-muted">{file.attainment.pos.map((p) => `${p.code} ${p.attainment ?? "—"}`).join(" · ")}</p> : null}
          <p className="text-sm text-fg-muted">{t("collegeHub.indirectFromSurvey")}</p>
        </CardBody>
      </Card>
      <Card>
        <CardBody className="space-y-2 text-sm">
          {file.review ? <p>{t("academics.reviewedLine", { name: file.review.byName ?? "—", note: file.review.note || "—" })}</p> : <p className="text-fg-muted">{t("academics.notReviewed")}</p>}
          {file.canReview ? (
            <form action={reviewAction} className="flex flex-wrap items-end gap-2">
              <input type="hidden" name="offeringId" value={file.offeringId} />
              <input aria-label={t("academics.fieldNote")} className={`${INPUT} max-w-md`} name="note" maxLength={400} placeholder={t("academics.fieldNote")} />
              <Button type="submit" size="sm">{t("academics.markReviewed")}</Button>
            </form>
          ) : null}
        </CardBody>
      </Card>
    </>
  );
}

async function MarksTab({ t, offeringId, ctx }: { t: T; offeringId: string; ctx: Ctx }) {
  const sheet = await internalSheet(ctx, offeringId);
  return (
    <Card>
      <CardHeader icon={<ClipboardTextIcon weight="duotone" className="size-5" />} title={t("academics.internalTitle", { max: sheet.internalMax })} description={t("academics.internalBody", { total: sheet.weightTotal, max: sheet.internalMax })} />
      <CardBody className="space-y-5">
        {sheet.locked ? (
          <p className="flex items-center gap-2 text-sm font-medium text-ok">
            <LockIcon className="size-4" aria-hidden /> {t("academics.lockedLine", { name: sheet.locked.byName ?? "—" })}
          </p>
        ) : null}
        {sheet.components.length === 0 ? (
          <EmptyState className="border-0 bg-transparent py-4" title={t("academics.componentsNone")} description={t("academics.componentsNoneBody")} />
        ) : (
          <ul className="divide-y divide-border text-sm">
            {sheet.components.map((k) => (
              <li key={k.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <span>
                  <span className="font-medium text-fg">{k.name}</span> <span className="text-fg-muted">{[t(INTERNAL_KIND_KEY[k.kind]!), t("academics.maxWeight", { max: k.maxMarks, weight: k.weight }), k.coCodes.join(", "), t("academics.enteredN", { n: k.enteredCount, of: sheet.students.length })].filter(Boolean).join(" · ")}</span>{" "}
                  {k.moderated ? <Badge tone="ok">{t("academics.countersigned", { name: k.moderatedByName ?? "—" })}</Badge> : <Badge tone="warn">{t("academics.notCountersigned")}</Badge>} {k.released ? <Badge tone="info">{t("academics.releasedBadge")}</Badge> : null}
                </span>
                <span className="flex gap-2">
                  {sheet.canModerate && !k.moderated ? (
                    <form action={moderateAction}>
                      <input type="hidden" name="offeringId" value={offeringId} />
                      <input type="hidden" name="componentId" value={k.id} />
                      <Button type="submit" size="sm" variant="secondary">{t("academics.countersign")}</Button>
                    </form>
                  ) : null}
                  {sheet.canRelease && k.moderated && !k.released ? (
                    <form action={releaseAction}>
                      <input type="hidden" name="offeringId" value={offeringId} />
                      <input type="hidden" name="componentId" value={k.id} />
                      <Button type="submit" size="sm">{t("academics.release")}</Button>
                    </form>
                  ) : null}
                </span>
              </li>
            ))}
          </ul>
        )}
        {sheet.canEnter ? (
          <form action={saveComponentAction} className="grid gap-3 sm:grid-cols-6">
            <input type="hidden" name="offeringId" value={offeringId} />
            <TextField className="sm:col-span-2" label={t("academics.fieldName")} name="name" required maxLength={80} />
            <SelectField label={t("academics.fieldKind")} name="kind" defaultValue="UNIT_TEST">
              {INTERNAL_KINDS.map((k) => <option key={k} value={k}>{t(INTERNAL_KIND_KEY[k]!)}</option>)}
            </SelectField>
            <TextField label={t("academics.fieldMaxMarks")} name="maxMarks" type="number" min={1} max={500} defaultValue={20} />
            <TextField label={t("academics.fieldWeight")} name="weight" type="number" min={1} max={200} defaultValue={10} />
            <TextField label={t("academics.fieldCoCodes")} name="coCodes" />
            <div>
              <Button type="submit" variant="secondary">{t("academics.addComponent")}</Button>
            </div>
          </form>
        ) : null}
        {sheet.students.length && sheet.components.length ? (
          <TableScroll>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th scope="col" className={TH}>{t("academics.colStudent")}</th>
                  {sheet.components.map((k) => <th key={k.id} scope="col" className={`${TH} text-right`}>{`${k.name} (${k.maxMarks})`}</th>)}
                  <th scope="col" className={`${TH} text-right`}>{t("academics.colTotal", { max: sheet.internalMax })}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sheet.students.map((s) => (
                  <tr key={s.studentMembershipId}>
                    <td className={TD}>
                      <span className="tabular-nums text-fg-muted">{s.rollNumber ?? ""}</span> {s.name}
                    </td>
                    {sheet.components.map((k) => {
                      const m = s.marks[k.id];
                      return <td key={k.id} className={NUM}>{m === undefined ? "—" : m === null ? t("academics.absentShort") : m}</td>;
                    })}
                    <td className={NUM}>{s.total ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableScroll>
        ) : null}
        {sheet.canEnter && sheet.components.some((k) => !k.released) && sheet.students.length ? (
          <form action={saveMarksAction} className="space-y-3">
            <input type="hidden" name="offeringId" value={offeringId} />
            <SelectField label={t("academics.fieldComponent")} name="componentId" required>
              {sheet.components.filter((k) => !k.released).map((k) => <option key={k.id} value={k.id}>{`${k.name} (${k.maxMarks})`}</option>)}
            </SelectField>
            <div className="grid gap-2 sm:grid-cols-3">
              {sheet.students.map((s) => (
                <label key={s.studentMembershipId} className="flex items-center justify-between gap-2 text-sm">
                  <span>{`${s.rollNumber ?? ""} ${s.name}`}</span>
                  <input className={`${INPUT} w-20 text-right`} name={`mark:${s.studentMembershipId}`} inputMode="decimal" aria-label={s.name} />
                </label>
              ))}
            </div>
            <TextAreaField label={t("academics.fieldSheet")} name="sheet" rows={3} hint={t("academics.fieldSheetHint")} />
            <Button type="submit">{t("academics.saveMarks")}</Button>
          </form>
        ) : null}
        {sheet.canLock ? (
          <form action={lockAction}>
            <input type="hidden" name="offeringId" value={offeringId} />
            <Button type="submit" variant="secondary">
              <LockIcon className="size-4" aria-hidden />
              {t("academics.lockMarks")}
            </Button>
          </form>
        ) : null}
      </CardBody>
    </Card>
  );
}

async function AttendanceTab({ t, offeringId, ctx, locale }: { t: T; offeringId: string; ctx: Ctx; locale: string }) {
  const [report, school] = await Promise.all([attendanceReport(ctx, { offeringId }), db.school.findUniqueOrThrow({ where: { id: ctx.schoolId ?? "" }, select: { timezone: true } })]);
  return (
    <Card>
      <CardBody>
        <AttendanceReportTable t={t} rows={report.rows.filter((r) => r.offeringId === offeringId)} formatAt={(iso) => formatInZone(new Date(iso), school.timezone, { day: "numeric", month: "short" }, locale)} />
      </CardBody>
    </Card>
  );
}
