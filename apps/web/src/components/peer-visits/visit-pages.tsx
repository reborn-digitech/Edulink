import Link from "next/link";
import { CalendarCheckIcon, FolderOpenIcon, ListChecksIcon, PackageIcon } from "@phosphor-icons/react/ssr";
import { EVIDENCE_LINK_KINDS, type EvidenceLinkKind, type VisitDetail, type VisitList } from "@edulink/contracts";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/states";
import { TableScroll } from "@/components/ui/table-scroll";
import { ActionForm } from "@/components/ui/action-form";
import { DateField, SelectField, TextAreaField, TextField } from "@/components/ui/field";
import { formatDateKey } from "@/lib/dates";
import type { Translate, TranslationKey } from "@/lib/i18n/dictionary";
import { addEvidenceAction, addScheduleAction, createVisitAction, removeItemAction, setVisitStatusAction } from "@/app/(app)/iqac/visits/actions";

/**
 * THE PEER-TEAM VISIT FILE on the web (R-2, 5 Oct 2026), drawn the same for
 * the IQAC (/iqac/visits), an HOD (/hod/visits) and the principal and office
 * who read the IQAC's pages. lib/peer-visits.ts decides who may change what;
 * these draw what the answer says.
 */

const LINK = "font-medium text-accent-strong hover:underline";
const TH = "px-3 py-2 text-xs font-semibold uppercase tracking-wide text-fg-muted";
const TD = "px-3 py-2 align-top";
export const LINK_KIND_KEY: Record<EvidenceLinkKind, TranslationKey> = { FILING: "peerVisit.linkFILING", FILE: "peerVisit.linkFILE", METRIC: "peerVisit.linkMETRIC", WORKSHEET: "peerVisit.linkWORKSHEET", LINK: "peerVisit.linkLINK", NOTE: "peerVisit.linkNOTE" };
const hhmm = (m: number | null) => (m === null ? "" : `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`);

export function VisitListView({ list, base, t, locale, thisYear }: { list: VisitList; base: string; t: Translate; locale: string; thisYear: number }) {
  const canCreate = list.canCreateNaac || list.nbaDepartments.length > 0;
  return (
    <>
      <Card>
        <CardHeader icon={<FolderOpenIcon weight="duotone" className="size-5" />} title={t("peerVisit.listTitle")} />
        <CardBody className="p-0">
          {list.visits.length === 0 ? (
            <div className="p-5">
              <EmptyState icon={<FolderOpenIcon weight="duotone" className="size-8" />} title={t("peerVisit.noneTitle")} description={t("peerVisit.noneBody")} />
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {list.visits.map((v) => (
                <li key={v.id} className="flex flex-wrap items-center gap-3 px-5 py-3 text-sm">
                  <Link className={LINK} href={`${base}/${v.id}`}>
                    {v.title}
                  </Link>
                  <Badge tone="accent">{v.framework}</Badge>
                  {v.departmentName ? <span>{v.departmentName}</span> : null}
                  <span className="text-fg-muted">{`${formatDateKey(v.fromDate, { dateStyle: "medium" }, locale)} – ${formatDateKey(v.toDate, { dateStyle: "medium" }, locale)}`}</span>
                  <span className="text-fg-muted">{t("peerVisit.counts", { slots: v.scheduleCount, lines: v.evidenceCount })}</span>
                  <Badge tone={v.status === "DONE" ? "ok" : "neutral"}>{v.status === "DONE" ? t("peerVisit.statusDONE") : t("peerVisit.statusPLANNED")}</Badge>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
      {canCreate ? (
        <Card>
          <CardHeader title={t("peerVisit.newTitle")} description={t("peerVisit.newIntro")} />
          <CardBody>
            <ActionForm action={createVisitAction} className="grid gap-3 sm:grid-cols-2">
              <input type="hidden" name="base" value={base} />
              <SelectField name="framework" label={t("peerVisit.fieldFramework")} defaultValue={list.canCreateNaac ? "NAAC" : "NBA"}>
                {list.canCreateNaac ? <option value="NAAC">NAAC</option> : null}
                {list.nbaDepartments.length ? <option value="NBA">NBA</option> : null}
              </SelectField>
              <TextField name="title" label={t("peerVisit.fieldTitle")} required minLength={2} maxLength={160} />
              {list.canCreateNaac ? (
                <SelectField name="cycleId" label={t("peerVisit.fieldCycle")} defaultValue={list.cycles[0]?.id ?? ""} hint={t("peerVisit.fieldCycleHint")}>
                  <option value="">—</option>
                  {list.cycles.map((c) => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
                </SelectField>
              ) : null}
              {list.nbaDepartments.length ? (
                <SelectField name="departmentId" label={t("peerVisit.fieldDepartment")} defaultValue="" hint={t("peerVisit.fieldDepartmentHint")}>
                  <option value="">—</option>
                  {list.nbaDepartments.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </SelectField>
              ) : null}
              <TextField name="year" label={t("peerVisit.fieldYear")} type="number" min={2000} max={2100} required defaultValue={String(thisYear)} hint={t("peerVisit.fieldYearHint")} />
              <DateField name="fromDate" label={t("peerVisit.fieldFrom")} required />
              <DateField name="toDate" label={t("peerVisit.fieldTo")} required />
              <TextAreaField name="team" label={t("peerVisit.fieldTeam")} hint={t("peerVisit.fieldTeamHint")} maxLength={3000} className="sm:col-span-2" />
              <div className="sm:col-span-2">
                <Button type="submit">{t("peerVisit.create")}</Button>
              </div>
            </ActionForm>
          </CardBody>
        </Card>
      ) : null}
    </>
  );
}

export function VisitFileView({ v, base, t, locale }: { v: VisitDetail; base: string; t: Translate; locale: string }) {
  const days: string[] = [];
  for (let d = v.fromDate; d <= v.toDate && days.length < 8; ) {
    days.push(d);
    const n = new Date(`${d}T00:00:00Z`);
    n.setUTCDate(n.getUTCDate() + 1);
    d = n.toISOString().slice(0, 10);
  }
  const hidden = (
    <>
      <input type="hidden" name="visitId" value={v.id} />
      <input type="hidden" name="base" value={base} />
    </>
  );
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <Badge tone="accent">{v.framework}</Badge>
        {v.departmentName ? <span>{v.departmentName}</span> : null}
        <span>{t("peerVisit.yearLine", { year: v.year })}</span>
        <Badge tone={v.status === "DONE" ? "ok" : "neutral"}>{v.status === "DONE" ? t("peerVisit.statusDONE") : t("peerVisit.statusPLANNED")}</Badge>
        <a className={LINK} href={`/api/v1/iqac/visits/${v.id}/export`}>{t("peerVisit.export")}</a>
      </div>
      {v.team.length ? <p className="text-sm">{t("peerVisit.teamLine", { team: v.team.map((m) => (m.role ? `${m.name} (${m.role})` : m.name)).join(", ") })}</p> : null}

      <Card>
        <CardHeader icon={<PackageIcon weight="duotone" className="size-5" />} title={t("peerVisit.packTitle")} description={v.framework === "NAAC" ? t("peerVisit.packIntroNaac") : t("peerVisit.packIntroNba")} />
        <CardBody className="space-y-3 text-sm">
          {v.pack.figure !== null ? <p className="font-semibold">{v.framework === "NAAC" ? t("peerVisit.cgpa", { value: v.pack.figure.toFixed(2) }) : t("peerVisit.marks", { value: String(v.pack.figure) })}</p> : null}
          {v.pack.filings.length === 0 ? <p className="text-fg-muted">{t("peerVisit.packEmpty")}</p> : null}
          <ul className="space-y-1">
            {v.pack.filings.map((f) => (
              <li key={f.id} className="flex flex-wrap items-center gap-2">
                <Link className={LINK} href={f.href}>{`${f.kind} ${f.year}`}</Link>
                <Badge tone={f.status === "FILED" || f.status === "SIGNED_OFF" ? "ok" : "neutral"}>{f.status}</Badge>
                <span className="font-mono text-xs text-fg-muted">sha256 {f.hash.slice(0, 12)}</span>
              </li>
            ))}
          </ul>
          {v.pack.missing.length ? <p className="text-warn">{t("peerVisit.packMissing", { kinds: v.pack.missing.join(", ") })}</p> : null}
        </CardBody>
      </Card>

      <Card>
        <CardHeader icon={<CalendarCheckIcon weight="duotone" className="size-5" />} title={t("peerVisit.scheduleTitle")} />
        <CardBody className="space-y-4">
          {v.schedule.length === 0 ? <p className="text-sm text-fg-muted">{t("peerVisit.noSchedule")}</p> : null}
          {days.map((d) => {
            const slots = v.schedule.filter((s) => s.dayKey === d);
            if (!slots.length) return null;
            return (
              <section key={d} className="space-y-1">
                <h3 className="text-sm font-semibold">{formatDateKey(d, { weekday: "long", day: "numeric", month: "long" }, locale)}</h3>
                <ul className="divide-y divide-border text-sm">
                  {slots.map((s) => (
                    <li key={s.id} className="flex flex-wrap items-center gap-3 py-2">
                      <span className="font-mono">{`${hhmm(s.startMinute)}–${hhmm(s.endMinute)}`}</span>
                      <span className="font-medium">{s.activity}</span>
                      {s.venue ? <span className="text-fg-muted">{s.venue}</span> : null}
                      {s.ownerName ? <span className="text-fg-muted">{s.ownerName}</span> : null}
                      {v.canEdit ? (
                        <ActionForm action={removeItemAction} className="inline">
                          {hidden}
                          <input type="hidden" name="itemId" value={s.id} />
                          <Button type="submit" size="sm" variant="ghost">{t("peerVisit.remove")}</Button>
                        </ActionForm>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
          {v.canEdit ? (
            <ActionForm action={addScheduleAction} className="grid gap-3 sm:grid-cols-3">
              {hidden}
              <SelectField name="dayKey" label={t("peerVisit.fieldDay")} defaultValue={days[0]}>
                {days.map((d) => (
                  <option key={d} value={d}>{formatDateKey(d, { weekday: "short", day: "numeric", month: "short" }, locale)}</option>
                ))}
              </SelectField>
              <TextField name="start" label={t("peerVisit.fieldStart")} type="time" required defaultValue="10:00" />
              <TextField name="end" label={t("peerVisit.fieldEnd")} type="time" required defaultValue="11:00" />
              <TextField name="activity" label={t("peerVisit.fieldActivity")} required minLength={2} maxLength={200} />
              <TextField name="venue" label={t("peerVisit.fieldVenue")} maxLength={120} />
              <TextField name="ownerName" label={t("peerVisit.fieldOwner")} maxLength={120} />
              <div className="sm:col-span-3">
                <Button type="submit" variant="secondary">{t("peerVisit.addSlot")}</Button>
              </div>
            </ActionForm>
          ) : null}
        </CardBody>
      </Card>

      <Card>
        <CardHeader icon={<ListChecksIcon weight="duotone" className="size-5" />} title={t("peerVisit.evidenceTitle")} description={t("peerVisit.evidenceIntro")} />
        <CardBody className="space-y-4">
          <ul className="flex flex-wrap gap-2 text-sm">
            {v.pack.coverage.map((c) => (
              <li key={c.criterion}>
                <Badge tone={c.lines === 0 ? "warn" : c.missing ? "danger" : "ok"}>{t("peerVisit.coverage", { criterion: c.criterion, lines: c.lines })}</Badge>
              </li>
            ))}
          </ul>
          {v.evidence.length === 0 ? (
            <p className="text-sm text-fg-muted">{t("peerVisit.noEvidence")}</p>
          ) : (
            <TableScroll label={t("peerVisit.evidenceTitle")}>
              <table className="w-full text-left text-sm">
                <thead>
                  <tr>
                    <th className={TH}>{t("peerVisit.colCriterion")}</th>
                    <th className={TH}>{t("peerVisit.colWhat")}</th>
                    <th className={TH}>{t("peerVisit.colWhere")}</th>
                    {v.canEdit ? <th className={TH}><span className="sr-only">{t("peerVisit.remove")}</span></th> : null}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {v.evidence.map((e) => (
                    <tr key={e.id}>
                      <td className={`${TD} font-mono`}>{e.criterion}</td>
                      <td className={TD}>
                        {e.title}
                        {e.note ? <div className="text-xs text-fg-muted">{e.note}</div> : null}
                      </td>
                      <td className={TD}>
                        <span className="mr-2 text-xs text-fg-muted">{e.linkKind ? t(LINK_KIND_KEY[e.linkKind]) : ""}</span>
                        {e.resolved && !e.resolved.ok ? (
                          <Badge tone="danger">{t("peerVisit.missing")}</Badge>
                        ) : e.resolved?.href ? (
                          <a className={LINK} href={e.resolved.href} {...(e.linkKind === "LINK" ? { target: "_blank", rel: "noreferrer" } : {})}>
                            {e.resolved.label || t("peerVisit.open")}
                          </a>
                        ) : (
                          e.resolved?.label ?? ""
                        )}
                      </td>
                      {v.canEdit ? (
                        <td className={TD}>
                          <ActionForm action={removeItemAction}>
                            {hidden}
                            <input type="hidden" name="itemId" value={e.id} />
                            <Button type="submit" size="sm" variant="ghost">{t("peerVisit.remove")}</Button>
                          </ActionForm>
                        </td>
                      ) : null}
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableScroll>
          )}
          {v.canEdit ? (
            <ActionForm action={addEvidenceAction} className="grid gap-3 sm:grid-cols-2">
              {hidden}
              <TextField name="criterion" label={t("peerVisit.fieldCriterion")} required maxLength={20} hint={t("peerVisit.fieldCriterionHint")} />
              <TextField name="title" label={t("peerVisit.fieldEvidenceTitle")} required minLength={2} maxLength={200} />
              <SelectField name="linkKind" label={t("peerVisit.fieldLinkKind")} defaultValue={v.options.filings.length ? "FILING" : "NOTE"}>
                {EVIDENCE_LINK_KINDS.filter((k) => k !== "WORKSHEET" || v.framework === "NBA").map((k) => (
                  <option key={k} value={k}>{t(LINK_KIND_KEY[k])}</option>
                ))}
              </SelectField>
              <SelectField name="filingId" label={t("peerVisit.fieldFiling")} defaultValue="" hint={t("peerVisit.fieldFilingHint")}>
                <option value="">—</option>
                {v.options.filings.map((f) => (
                  <option key={f.id} value={f.id}>{f.label}</option>
                ))}
              </SelectField>
              <SelectField name="fileId" label={t("peerVisit.fieldFile")} defaultValue="" hint={t("peerVisit.fieldFileHint")}>
                <option value="">—</option>
                {v.options.files.map((f) => (
                  <option key={f.id} value={f.id}>{f.label}</option>
                ))}
              </SelectField>
              <TextField name="url" label={t("peerVisit.fieldUrl")} type="url" maxLength={500} hint={t("peerVisit.fieldUrlHint")} />
              <TextAreaField name="note" label={t("peerVisit.fieldNote")} maxLength={1000} className="sm:col-span-2" />
              <div className="sm:col-span-2">
                <Button type="submit" variant="secondary">{t("peerVisit.addEvidence")}</Button>
              </div>
            </ActionForm>
          ) : null}
        </CardBody>
      </Card>

      {v.canEdit ? (
        <ActionForm action={setVisitStatusAction}>
          {hidden}
          <input type="hidden" name="status" value={v.status === "DONE" ? "PLANNED" : "DONE"} />
          <Button type="submit" variant="secondary">{v.status === "DONE" ? t("peerVisit.markPlanned") : t("peerVisit.markDone")}</Button>
        </ActionForm>
      ) : null}
    </div>
  );
}
