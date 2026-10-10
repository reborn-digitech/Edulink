import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { randomUUID } from "node:crypto";
import { NotebookIcon, StethoscopeIcon } from "@phosphor-icons/react/ssr";
import { LOGBOOK_KINDS, logbookStateTone } from "@edulink/contracts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader, StatTile } from "@/components/ui/card";
import { DateField, SelectField, TextAreaField, TextField } from "@/components/ui/field";
import { EmptyState } from "@/components/ui/states";
import { PageHeader } from "@/components/ui/page-header";
import { ModuleOff } from "@/components/module-off";
import { RecordsFlash } from "@/components/stream-records/flash";
import { day } from "@/components/clinical/parts";
import { myClinical } from "@/lib/clinical";
import { requireRole } from "@/lib/tenancy";
import { institutionKindOf, isModuleOn } from "@/lib/modules";
import { isCollegeKind } from "@/lib/institution";
import { getLocale, getT } from "@/lib/i18n/server";
import type { TranslationKey } from "@/lib/i18n/dictionary";
import { logbookEntryAction, logbookSubmitAction } from "./actions";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("duties.clinical.myTitle"), robots: { index: false, follow: false } };
}

const TONE = { ok: "ok", warn: "warn", danger: "danger", neutral: "neutral" } as const;

/**
 * A STUDENT'S CLINICAL LOGBOOK (R-56, the clinical half; 10 Oct 2026): their
 * postings, current first, and every entry with its state; a new entry on a
 * day of one of their postings (the form carries a client id minted here, so
 * a double send writes one row), a draft or returned one corrected, and the
 * hand-in. A note names no patient: the server refuses one that does.
 * No guardian page: the record is the student's own. lib/clinical.ts.
 */
export default async function StudentClinicalPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const ctx = await requireRole("STUDENT");
  if (!isCollegeKind(await institutionKindOf(ctx.schoolId))) notFound();
  const t = await getT();
  const locale = await getLocale();
  if (!(await isModuleOn(ctx.schoolId, "ACADEMICS"))) return <ModuleOff page module="ACADEMICS" t={t} college />;
  const params = await searchParams;
  const d = await myClinical(ctx);
  const clientId = `web-${randomUUID()}`;
  const open = d.postings.filter((p) => p.from <= d.today);
  const kindLabel = (k: string) => t(`duties.clinical.logKind.${k}` as TranslationKey);
  return (
    <div className="space-y-6">
      <PageHeader title={t("duties.clinical.myTitle")} description={t("duties.clinical.myIntro")} />
      <RecordsFlash t={t} params={params} />
      {!d.offered ? <p className="rounded-[var(--radius-md)] border border-border bg-surface-muted px-3 py-2 text-sm text-fg-muted">{t("duties.clinical.notOffered")}</p> : null}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label={t("duties.clinical.state.SIGNED")} value={d.summary.signed} />
        <StatTile label={t("duties.clinical.state.SUBMITTED")} value={d.summary.waiting} />
        <StatTile label={t("duties.clinical.state.RETURNED")} value={d.summary.returned} tone={d.summary.returned > 0 ? "warn" : "ok"} />
        <StatTile label={t("duties.clinical.state.DRAFT")} value={d.summary.draft} />
      </div>

      <Card>
        <CardHeader icon={<StethoscopeIcon weight="duotone" className="size-5" />} title={t("duties.clinical.myPostingsTitle")} />
        <CardBody>
          {d.postings.length === 0 ? (
            <EmptyState className="border-0 bg-transparent py-4" title={t("duties.clinical.noMyPostings")} description={t("duties.clinical.noMyPostingsBody")} />
          ) : (
            <ul className="divide-y divide-border text-sm">
              {d.postings.map((p) => (
                <li key={p.id} className="flex flex-wrap items-center gap-2 py-2" data-posting={p.id}>
                  <span className="text-fg">{t("duties.clinical.myPostingLine", { site: p.siteName, department: p.departmentName, from: day(p.from, locale), to: day(p.to, locale), supervisor: p.supervisorName })}</span>
                  {p.current ? <Badge tone="ok">{t("duties.clinical.currentBadge")}</Badge> : null}
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader icon={<NotebookIcon weight="duotone" className="size-5" />} title={t("duties.clinical.logbookTitle")} description={t("duties.clinical.mySummary", { signed: d.summary.signed, waiting: d.summary.waiting, returned: d.summary.returned, draft: d.summary.draft })} />
        <CardBody className="space-y-4">
          {d.entries.length === 0 ? (
            <EmptyState className="border-0 bg-transparent py-4" title={t("duties.clinical.noEntries")} description={t(open.length > 0 ? "duties.clinical.noEntriesBody" : "duties.clinical.noMyPostingsBody")} />
          ) : (
            <ul className="divide-y divide-border">
              {d.entries.map((e) => (
                <li key={e.id} className="space-y-2 py-3" data-entry={e.id}>
                  <p className="flex flex-wrap items-center gap-2 text-sm text-fg">
                    <span className="font-semibold">{day(e.on, locale)}</span>
                    <span className="text-fg-muted">· {e.siteName} › {e.departmentName}</span>
                    <Badge tone="info">{t("duties.clinical.entryLine", { kind: kindLabel(e.kind), count: e.count })}</Badge>
                    <Badge tone={TONE[logbookStateTone(e.state)]}>{t(`duties.clinical.state.${e.state}` as TranslationKey)}</Badge>
                  </p>
                  {e.note ? <p className="text-sm text-fg-muted">{e.note}</p> : null}
                  {e.state === "SIGNED" && e.signedAt ? <p className="text-xs text-fg-muted">{t("duties.clinical.signedLine", { name: e.signedByName ?? "", day: day(e.signedAt.slice(0, 10), locale) })}{e.remark ? ` — ${e.remark}` : ""}</p> : null}
                  {e.state === "RETURNED" ? <p className="text-xs text-danger">{t("duties.clinical.returnedLine", { remark: e.remark })}</p> : null}
                  {e.state === "DRAFT" || e.state === "RETURNED" ? (
                    <details className="text-sm">
                      <summary className="cursor-pointer text-accent">{t("duties.clinical.correct")}</summary>
                      <form action={logbookEntryAction} className="mt-2 grid gap-3 sm:grid-cols-4">
                        <input type="hidden" name="id" value={e.id} />
                        <input type="hidden" name="clientId" value={e.clientId} />
                        <input type="hidden" name="postingId" value={e.postingId} />
                        <DateField name="on" label={t("duties.clinical.fieldDay")} required defaultValue={e.on} max={d.today} />
                        <SelectField name="kind" label={t("duties.clinical.fieldEntryKind")} required defaultValue={e.kind}>
                          {LOGBOOK_KINDS.map((k) => (
                            <option key={k} value={k}>{kindLabel(k)}</option>
                          ))}
                        </SelectField>
                        <TextField name="count" type="number" min={1} max={500} label={t("duties.clinical.fieldCount")} required defaultValue={String(e.count)} />
                        <TextAreaField name="note" label={t("duties.clinical.fieldNote")} maxLength={1000} rows={2} defaultValue={e.note} hint={t("duties.clinical.noteHint")} className="sm:col-span-4" />
                        <div className="sm:col-span-4">
                          <Button type="submit" size="sm" variant="secondary">{t("duties.clinical.addEntry")}</Button>
                        </div>
                      </form>
                    </details>
                  ) : null}
                  {e.state === "DRAFT" || e.state === "RETURNED" ? (
                    <form action={logbookSubmitAction}>
                      <input type="hidden" name="entryId" value={e.id} />
                      <Button type="submit" size="sm">{t("duties.clinical.submit")}</Button>
                    </form>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
          {open.length > 0 ? (
            <form id="entry-form" action={logbookEntryAction} className="grid gap-3 border-t border-border pt-4 sm:grid-cols-4">
              <h3 className="text-sm font-semibold text-fg sm:col-span-4">{t("duties.clinical.newEntryTitle")}</h3>
              <input type="hidden" name="clientId" value={clientId} />
              <SelectField name="postingId" label={t("duties.clinical.fieldPosting")} required className="sm:col-span-2">
                {open.map((p) => (
                  <option key={p.id} value={p.id}>{`${p.siteName} › ${p.departmentName}`}</option>
                ))}
              </SelectField>
              <DateField name="on" label={t("duties.clinical.fieldDay")} required defaultValue={d.today} max={d.today} />
              <SelectField name="kind" label={t("duties.clinical.fieldEntryKind")} required defaultValue="CASE">
                {LOGBOOK_KINDS.map((k) => (
                  <option key={k} value={k}>{kindLabel(k)}</option>
                ))}
              </SelectField>
              <TextField name="count" type="number" min={1} max={500} label={t("duties.clinical.fieldCount")} required defaultValue="1" />
              <TextAreaField name="note" label={t("duties.clinical.fieldNote")} maxLength={1000} rows={2} hint={t("duties.clinical.noteHint")} className="sm:col-span-3" />
              <div className="sm:col-span-4">
                <Button type="submit">{t("duties.clinical.addEntry")}</Button>
              </div>
            </form>
          ) : null}
        </CardBody>
      </Card>
    </div>
  );
}
