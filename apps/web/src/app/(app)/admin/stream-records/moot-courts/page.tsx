import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GavelIcon } from "@phosphor-icons/react/ssr";
import { MOOT_COURT_KINDS, MOOT_OUTCOMES } from "@edulink/contracts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { DateField, SelectField, TextAreaField, TextField } from "@/components/ui/field";
import { EmptyState } from "@/components/ui/states";
import { PageHeader } from "@/components/ui/page-header";
import { ModuleOff } from "@/components/module-off";
import { RecordsFlash } from "@/components/stream-records/flash";
import { requireRole } from "@/lib/tenancy";
import { db } from "@/lib/db";
import { institutionKindOf, isModuleOn } from "@/lib/modules";
import { isCollegeKind } from "@/lib/institution";
import { mootCourts } from "@/lib/stream-records";
import { formatDateKey, todayKey } from "@/lib/dates";
import { getLocale, getT } from "@/lib/i18n/server";
import { saveMootCourtAction } from "../actions";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("streamRecords.moots.title") };
}

/**
 * MOOT COURTS (a law college's, 5 Oct 2026): every moot with its teams, how
 * each came out, the result and the judges' notes, and the office's form for
 * the next one (up to four teams; the phone and the API take more). The head
 * reads. At a college with no LAW stream the page says so and offers no form.
 */
export default async function MootCourtsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const ctx = await requireRole("ADMIN", "PRINCIPAL");
  const t = await getT();
  const locale = await getLocale();
  if (!isCollegeKind(await institutionKindOf(ctx.schoolId))) notFound();
  if (!(await isModuleOn(ctx.schoolId, "ACADEMICS"))) return <ModuleOff module="ACADEMICS" t={t} college />;
  const params = await searchParams;
  const [data, school] = await Promise.all([mootCourts(ctx), db.school.findUniqueOrThrow({ where: { id: ctx.schoolId }, select: { timezone: true } })]);
  const today = todayKey(school.timezone);
  return (
    <div className="space-y-6">
      <PageHeader title={t("streamRecords.moots.title")} description={t("streamRecords.moots.intro")} back={{ href: "/admin/stream-records", label: t("streamRecords.title") }} />
      <RecordsFlash t={t} params={params} />
      {!data.offered ? <p className="rounded-[--radius-md] border border-border bg-surface-muted px-3 py-2 text-sm text-fg-muted">{t("streamRecords.moots.notOffered")}</p> : null}

      <Card>
        <CardHeader icon={<GavelIcon weight="duotone" className="size-5" />} title={t("streamRecords.moots.listTitle")} />
        <CardBody>
          {data.items.length === 0 ? (
            <EmptyState className="border-0 bg-transparent py-4" title={t("streamRecords.moots.none")} description={t(data.canEdit ? "streamRecords.moots.noneBody" : "streamRecords.moots.noneRead")} />
          ) : (
            <ul className="divide-y divide-border">
              {data.items.map((m) => (
                <li key={m.id} className="space-y-1.5 py-3">
                  <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-fg">
                    {m.name}
                    <Badge tone="info">{t(`streamRecords.moots.kind${m.kind}`)}</Badge>
                    <span className="font-normal text-fg-muted">{formatDateKey(m.at, { dateStyle: "medium" }, locale)}</span>
                  </p>
                  <ul className="text-sm text-fg">
                    {m.teams.map((team) => (
                      <li key={team.name}>
                        <span className="font-medium">{team.name}</span> — {t(`streamRecords.moots.outcome${team.outcome}`)}
                        {team.members.length ? <span className="text-fg-muted"> · {team.members.map((p) => p.name).join(", ")}</span> : null}
                      </li>
                    ))}
                  </ul>
                  {m.result ? <p className="text-sm text-fg">{t("streamRecords.moots.resultLine", { result: m.result })}</p> : null}
                  {m.judgeNotes ? <p className="whitespace-pre-line text-sm text-fg-muted">{m.judgeNotes}</p> : null}
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>

      {data.canEdit && ctx.role === "ADMIN" ? (
        <Card>
          <CardHeader title={t("streamRecords.moots.addTitle")} description={t("streamRecords.moots.addBody")} />
          <CardBody>
            <form action={saveMootCourtAction} className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <TextField name="name" label={t("streamRecords.moots.fieldName")} required minLength={2} maxLength={160} />
                <DateField name="at" label={t("streamRecords.moots.fieldDay")} required defaultValue={today} />
                <SelectField name="kind" label={t("streamRecords.moots.fieldKind")} required defaultValue="INTRA">
                  {MOOT_COURT_KINDS.map((k) => (
                    <option key={k} value={k}>{t(`streamRecords.moots.kind${k}`)}</option>
                  ))}
                </SelectField>
              </div>
              {[1, 2, 3, 4].map((n) => (
                <fieldset key={n} className="rounded-[--radius-md] border border-border p-3">
                  <legend className="px-1 text-sm font-medium text-fg">{t("streamRecords.moots.teamN", { n })}</legend>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <TextField name={`team${n}Name`} label={t("streamRecords.moots.fieldTeam")} maxLength={80} required={n <= 2} />
                    <SelectField name={`team${n}Outcome`} label={t("streamRecords.moots.fieldOutcome")} defaultValue="PARTICIPATED">
                      {MOOT_OUTCOMES.map((o) => (
                        <option key={o} value={o}>{t(`streamRecords.moots.outcome${o}`)}</option>
                      ))}
                    </SelectField>
                  </div>
                  {data.students.length ? (
                    <details className="mt-2">
                      <summary className="min-h-11 cursor-pointer py-2 text-sm text-accent-strong">{t("streamRecords.moots.chooseMembers")}</summary>
                      <ul className="grid gap-1 sm:grid-cols-2">
                        {data.students.map((s) => (
                          <li key={s.membershipId}>
                            <label className="flex min-h-11 items-center gap-2 text-sm text-fg">
                              <input type="checkbox" name={`team${n}Member`} value={s.membershipId} className="size-4 accent-[--accent]" />
                              {s.name}
                            </label>
                          </li>
                        ))}
                      </ul>
                    </details>
                  ) : null}
                </fieldset>
              ))}
              <TextField name="result" label={t("streamRecords.moots.fieldResult")} maxLength={400} />
              <TextAreaField name="judgeNotes" label={t("streamRecords.moots.fieldNotes")} maxLength={2000} rows={3} />
              <Button type="submit">{t("streamRecords.moots.save")}</Button>
            </form>
          </CardBody>
        </Card>
      ) : null}
    </div>
  );
}
