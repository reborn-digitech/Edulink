import { ClipboardTextIcon, HospitalIcon } from "@phosphor-icons/react/ssr";
import type { ClinicalPosting, LogbookQueueRow } from "@edulink/contracts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { TextField } from "@/components/ui/field";
import { EmptyState } from "@/components/ui/states";
import type { Translate, TranslationKey } from "@/lib/i18n/dictionary";
import { formatDateKey } from "@/lib/dates";
import { logbookReturnAction, logbookSignAction } from "@/app/(app)/duties/clinical/actions";

/**
 * The clinical desk's shared pieces (R-56, the clinical half; 10 Oct 2026):
 * the rotations list and the signing queue, drawn on the coordinator's desk
 * (/duties/clinical) and on a supervising teacher's own page
 * (/faculty/clinical). The server says per entry whether the reader may sign
 * it (`canSign`); the page only draws the forms it is told to.
 */
export const day = (k: string, locale: string) => formatDateKey(k, { dateStyle: "medium" }, locale);

export function PostingsList({ postings, t, locale, empty }: { postings: ClinicalPosting[]; t: Translate; locale: string; empty: { title: string; body: string } }) {
  if (postings.length === 0) return <EmptyState className="border-0 bg-transparent py-4" title={empty.title} description={empty.body} />;
  return (
    <ul className="divide-y divide-border">
      {postings.map((p) => (
        <li key={p.id} className="space-y-1.5 py-3" data-posting={p.id}>
          <p className="flex flex-wrap items-center gap-2 text-sm text-fg">
            <span className="font-semibold">{p.divisionName}</span>
            {p.batchName ? <span className="text-fg-muted">{t("duties.clinical.batchLine", { batch: p.batchName })}</span> : null}
            <span className="text-fg-muted">· {p.siteName} › {p.departmentName}</span>
            {p.current ? <Badge tone="ok">{t("duties.clinical.currentBadge")}</Badge> : null}
          </p>
          <p className="text-sm text-fg-muted">{t("duties.clinical.postingLine", { order: p.rotationOrder, from: day(p.from, locale), to: day(p.to, locale), supervisor: p.supervisorName })}</p>
          {p.students.length > 0 ? (
            <ul className="grid gap-x-4 gap-y-0.5 text-xs text-fg-muted sm:grid-cols-2">
              {p.students.map((s) => (
                <li key={s.membershipId} className="tabular-nums">
                  <span className="text-fg">{s.rollNumber != null ? `${s.rollNumber} · ` : ""}{s.name}</span> — {t("duties.clinical.studentCounts", { signed: s.signed, waiting: s.waiting, returned: s.returned, draft: s.draft })}
                </li>
              ))}
            </ul>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

export function QueueCard({ queue, t, locale, back }: { queue: LogbookQueueRow[]; t: Translate; locale: string; back: "/duties/clinical" | "/faculty/clinical" }) {
  return (
    <Card>
      <CardHeader icon={<ClipboardTextIcon weight="duotone" className="size-5" />} title={t("duties.clinical.queueTitle")} description={t("duties.clinical.queueBody")} />
      <CardBody>
        {queue.length === 0 ? (
          <p className="text-sm text-fg-muted">{t("duties.clinical.noQueue")}</p>
        ) : (
          <ul className="divide-y divide-border">
            {queue.map((e) => (
              <li key={e.id} className="space-y-2 py-3" data-entry={e.id}>
                <p className="text-sm text-fg">
                  <span className="font-semibold">{t("duties.clinical.queueLine", { student: e.studentName, site: e.siteName, department: e.departmentName, day: day(e.on, locale) })}</span>
                  <Badge tone="info" className="ml-2">{t("duties.clinical.entryLine", { kind: t(`duties.clinical.logKind.${e.kind}` as TranslationKey), count: e.count })}</Badge>
                </p>
                {e.note ? <p className="text-sm text-fg-muted">{e.note}</p> : null}
                {e.canSign ? (
                  <div className="flex flex-wrap items-end gap-2">
                    <form action={logbookSignAction} className="flex flex-wrap items-end gap-2">
                      <input type="hidden" name="entryId" value={e.id} />
                      <input type="hidden" name="back" value={back} />
                      <TextField name="remark" label={t("duties.clinical.fieldRemark")} maxLength={400} className="w-56" />
                      <Button type="submit" size="sm">{t("duties.clinical.sign")}</Button>
                    </form>
                    <form action={logbookReturnAction} className="flex flex-wrap items-end gap-2">
                      <input type="hidden" name="entryId" value={e.id} />
                      <input type="hidden" name="back" value={back} />
                      <TextField name="remark" label={t("duties.clinical.fieldRemark")} required minLength={3} maxLength={400} hint={t("duties.clinical.returnHint")} className="w-56" />
                      <Button type="submit" size="sm" variant="secondary">{t("duties.clinical.returnIt")}</Button>
                    </form>
                  </div>
                ) : (
                  <p className="text-xs text-fg-muted">{t("duties.clinical.readOnlySigner")}</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardBody>
    </Card>
  );
}

export const siteIcon = <HospitalIcon weight="duotone" className="size-5" />;
