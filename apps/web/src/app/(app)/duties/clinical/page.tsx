import type { Metadata } from "next";
import { StethoscopeIcon } from "@phosphor-icons/react/ssr";
import { CLINICAL_CONTACT_ROLES, CLINICAL_SITE_KINDS } from "@edulink/contracts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader, StatTile } from "@/components/ui/card";
import { DateField, SelectField, TextField } from "@/components/ui/field";
import { PageHeader } from "@/components/ui/page-header";
import { ModuleOff } from "@/components/module-off";
import { RecordsFlash } from "@/components/stream-records/flash";
import { dutyPageContext } from "@/components/stream-records/duty-page";
import { PostingsList, QueueCard, day, siteIcon } from "@/components/clinical/parts";
import { clinicalDesk } from "@/lib/clinical";
import { getLocale, getT } from "@/lib/i18n/server";
import type { TranslationKey } from "@/lib/i18n/dictionary";
import { clinicalDepartmentAction, clinicalPostingAction, clinicalSiteAction } from "./actions";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("duties.clinical.title") };
}

/**
 * THE CLINICAL COORDINATOR'S DESK (R-56, the clinical half; 10 Oct 2026): the
 * sites students are posted to with their departments, each rotation's
 * postings with the logbook counts per student, the entries waiting for a
 * signature, and the councils' minimums where stated. The coordinator (the
 * duty) and the office keep sites and departments; the coordinator alone
 * posts; the posting's supervisor or the coordinator signs; the head reads.
 * lib/clinical.ts.
 */
export default async function ClinicalDeskPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { ctx, moduleOn } = await dutyPageContext("CLINICAL_COORDINATOR", "ACADEMICS");
  const t = await getT();
  const locale = await getLocale();
  if (!moduleOn) return <ModuleOff page module="ACADEMICS" t={t} college />;
  const params = await searchParams;
  const d = await clinicalDesk(ctx);
  // The site and the ward in one line, as the posting form names a department (data, not a sentence: the i18n audit reads `label`).
  const departments = d.sites.flatMap((s) => s.departments.map((dep) => ({ id: dep.id, text: [s.name, dep.name].join(" › ") })));
  return (
    <div className="space-y-6">
      <PageHeader title={t("duties.clinical.title")} description={t("duties.clinical.intro")} />
      <RecordsFlash t={t} params={params} />
      {!d.offered ? <p className="rounded-[var(--radius-md)] border border-border bg-surface-muted px-3 py-2 text-sm text-fg-muted">{t("duties.clinical.notOffered")}</p> : null}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatTile label={t("duties.clinical.statSites")} value={d.summary.sites} />
        <StatTile label={t("duties.clinical.statPostings")} value={d.summary.postings} />
        <StatTile label={t("duties.clinical.statCurrent")} value={d.summary.current} />
        <StatTile label={t("duties.clinical.statStudents")} value={d.summary.students} />
        <StatTile label={t("duties.clinical.statSigned")} value={`${d.summary.signed} / ${d.summary.entries}`} />
        <StatTile label={t("duties.clinical.statWaiting")} value={d.summary.waiting} tone={d.summary.waiting > 0 ? "warn" : "ok"} />
      </div>

      <Card>
        <CardHeader icon={siteIcon} title={t("duties.clinical.sitesTitle")} description={t("duties.clinical.sitesBody")} />
        <CardBody className="space-y-4">
          {d.sites.length === 0 ? (
            <p className="text-sm text-fg-muted">{t("duties.clinical.noSites")}</p>
          ) : (
            <ul className="divide-y divide-border text-sm">
              {d.sites.map((s) => (
                <li key={s.id} className="space-y-1 py-2" data-site={s.id}>
                  <p className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-fg">{s.name}</span>
                    <Badge tone="neutral">{t(`duties.clinical.kind.${s.kind}` as TranslationKey)}</Badge>
                    {s.agreementLapsed ? <Badge tone="warn">{s.agreementTo ? t("duties.clinical.agreementLapsed") : t("duties.clinical.agreementNone")}</Badge> : null}
                  </p>
                  <p className="text-fg-muted">{[s.address || null, s.agreementFrom && s.agreementTo ? t("duties.clinical.agreementLine", { from: day(s.agreementFrom, locale), to: day(s.agreementTo, locale) }) : null, t("duties.clinical.contactLine", { role: t(`duties.clinical.contact.${s.contactRole}` as TranslationKey) })].filter(Boolean).join(" · ")}</p>
                  {s.departments.length > 0 ? <p className="text-fg-muted">{s.departments.map((dep) => [dep.name, dep.beds != null ? t("duties.clinical.bedsN", { count: dep.beds }) : null, t("duties.clinical.postingsN", { count: dep.postings })].filter(Boolean).join(" · ")).join(" — ")}</p> : null}
                </li>
              ))}
            </ul>
          )}
          {d.canManage ? (
            <>
              <form id="site-form" action={clinicalSiteAction} className="grid gap-3 border-t border-border pt-4 sm:grid-cols-3">
                <TextField name="name" label={t("duties.clinical.fieldSite")} required minLength={2} maxLength={160} />
                <SelectField name="kind" label={t("duties.clinical.fieldKind")} required defaultValue="HOSPITAL">
                  {CLINICAL_SITE_KINDS.map((k) => (
                    <option key={k} value={k}>{t(`duties.clinical.kind.${k}` as TranslationKey)}</option>
                  ))}
                </SelectField>
                <SelectField name="contactRole" label={t("duties.clinical.fieldContactRole")} required defaultValue="MEDICAL_SUPERINTENDENT">
                  {CLINICAL_CONTACT_ROLES.map((r) => (
                    <option key={r} value={r}>{t(`duties.clinical.contact.${r}` as TranslationKey)}</option>
                  ))}
                </SelectField>
                <TextField name="address" label={t("duties.clinical.fieldAddress")} maxLength={300} className="sm:col-span-3" />
                <DateField name="agreementFrom" label={t("duties.clinical.fieldAgreementFrom")} />
                <DateField name="agreementTo" label={t("duties.clinical.fieldAgreementTo")} />
                <div className="sm:col-span-3">
                  <Button type="submit" variant="secondary">{t("duties.clinical.addSite")}</Button>
                </div>
              </form>
              {d.sites.length > 0 ? (
                <form id="department-form" action={clinicalDepartmentAction} className="grid gap-3 border-t border-border pt-4 sm:grid-cols-3">
                  <SelectField name="siteId" label={t("duties.clinical.fieldSite")} required>
                    {d.sites.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </SelectField>
                  <TextField name="name" label={t("duties.clinical.fieldDepartment")} required minLength={2} maxLength={120} />
                  <TextField name="beds" type="number" min={0} max={5000} label={t("duties.clinical.fieldBeds")} hint={t("duties.clinical.bedsHint")} />
                  <div className="sm:col-span-3">
                    <Button type="submit" variant="secondary">{t("duties.clinical.addDepartment")}</Button>
                  </div>
                </form>
              ) : null}
            </>
          ) : null}
        </CardBody>
      </Card>

      <Card>
        <CardHeader icon={<StethoscopeIcon weight="duotone" className="size-5" />} title={t("duties.clinical.postingsTitle")} description={t("duties.clinical.postingsBody")} />
        <CardBody className="space-y-4">
          <PostingsList postings={d.postings} t={t} locale={locale} empty={{ title: t("duties.clinical.noPostings"), body: t(d.canPost ? "duties.clinical.noPostingsBody" : "duties.clinical.noPostingsRead") }} />
          {d.canPost && departments.length > 0 && d.divisions.length > 0 && d.supervisors.length > 0 ? (
            <form id="posting-form" action={clinicalPostingAction} className="grid gap-3 border-t border-border pt-4 sm:grid-cols-2 lg:grid-cols-6">
              <SelectField name="division" label={t("duties.clinical.fieldDivision")} required className="lg:col-span-2">
                {d.divisions.flatMap((dv) => [
                  <option key={dv.id} value={dv.id}>{`${dv.name} (${dv.programmeCode}) — ${t("duties.clinical.wholeDivision")}`}</option>,
                  ...dv.batches.map((b) => (
                    <option key={b.id} value={`${dv.id}|${b.id}`}>{`${dv.name} — ${t("duties.clinical.batchLine", { batch: b.name })}`}</option>
                  )),
                ])}
              </SelectField>
              <SelectField name="departmentId" label={t("duties.clinical.fieldDepartment")} required className="lg:col-span-2">
                {departments.map((dep) => (
                  <option key={dep.id} value={dep.id}>{dep.text}</option>
                ))}
              </SelectField>
              <SelectField name="supervisorMembershipId" label={t("duties.clinical.fieldSupervisor")} required className="lg:col-span-2">
                {d.supervisors.map((s) => (
                  <option key={s.membershipId} value={s.membershipId}>{s.name}</option>
                ))}
              </SelectField>
              <DateField name="from" label={t("duties.clinical.fieldFrom")} required defaultValue={d.today} className="lg:col-span-2" />
              <DateField name="to" label={t("duties.clinical.fieldTo")} required defaultValue={d.today} className="lg:col-span-2" />
              <TextField name="rotationOrder" type="number" min={1} max={99} label={t("duties.clinical.fieldRotation")} defaultValue="1" className="lg:col-span-2" />
              <div className="sm:col-span-2 lg:col-span-6">
                <Button type="submit">{t("duties.clinical.addPosting")}</Button>
              </div>
            </form>
          ) : null}
        </CardBody>
      </Card>

      <QueueCard queue={d.queue} t={t} locale={locale} back="/duties/clinical" />

      <Card>
        <CardHeader title={t("duties.clinical.requirementsTitle")} />
        <CardBody className="text-sm text-fg-muted">
          {d.requirements.length === 0 ? (
            <p>{t("duties.clinical.requirementsNone")}</p>
          ) : (
            <ul>
              {d.requirements.map((r, i) => (
                <li key={i}>{t("duties.clinical.requirementLine", { regulator: r.regulator, programme: r.programmeCode, kind: t(`duties.clinical.logKind.${r.kind}` as TranslationKey), count: r.minimumPerYear, source: r.source })}</li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
