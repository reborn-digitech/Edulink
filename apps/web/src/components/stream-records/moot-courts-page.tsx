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
import type { Role } from "@/lib/constants";
import { saveMootCourtAction } from "@/app/(app)/admin/stream-records/actions";
import { ActionForm } from "@/components/ui/action-form";

/**
 * MOOT COURTS (a law college's, 5 Oct 2026): every moot with its teams, how
 * each came out, the result and the judges' notes, and the form for the next
 * one (up to four teams; the phone and the API take more). Drawn the same for
 * the office (/admin/stream-records/moot-courts) and a faculty member or an
 * HOD (/faculty/moot-courts, A3-inventory-4): the library decides who records
 * and who corrects; the head reads. At a college with no LAW stream the page
 * says so and offers no form.
 */
export async function MootCourtsPage({ roles, base, searchParams, back }: { roles: Role[]; base: string; searchParams: Promise<Record<string, string | string[] | undefined>>; back?: { href: string; labelKey: "streamRecords.title" } }) {
  const ctx = await requireRole(...roles);
  const t = await getT();
  const locale = await getLocale();
  if (!isCollegeKind(await institutionKindOf(ctx.schoolId))) notFound();
  if (!(await isModuleOn(ctx.schoolId, "ACADEMICS"))) return <ModuleOff page module="ACADEMICS" t={t} college />;
  const params = await searchParams;
  const [data, school] = await Promise.all([mootCourts(ctx), db.school.findUniqueOrThrow({ where: { id: ctx.schoolId }, select: { timezone: true } })]);
  const today = todayKey(school.timezone);
  // A moot opened for correction (TA-271): ?correct=<id> fills the form with it and its id, where the library lets this reader correct it.
  const editing = typeof params.correct === "string" ? (data.items.find((m) => m.id === params.correct && m.canEdit) ?? null) : null;
  const slots = Math.max(4, editing?.teams.length ?? 0);
  return (
    <div className="space-y-6">
      <PageHeader title={t("streamRecords.moots.title")} description={t("streamRecords.moots.intro")} back={back ? { href: back.href, label: t(back.labelKey) } : undefined} />
      <RecordsFlash t={t} params={params} />
      {!data.offered ? <p className="rounded-[var(--radius-md)] border border-border bg-surface-muted px-3 py-2 text-sm text-fg-muted">{t("streamRecords.moots.notOffered")}</p> : null}

      <Card>
        <CardHeader icon={<GavelIcon weight="duotone" className="size-5" />} title={t("streamRecords.moots.listTitle")} />
        <CardBody>
          {data.items.length === 0 ? (
            <EmptyState
              className="border-0 bg-transparent py-4"
              title={t("streamRecords.moots.none")}
              description={t(data.canEdit ? "streamRecords.moots.noneBody" : "streamRecords.moots.noneRead")}
              action={
                data.canEdit ? (
                  <Button asChild size="sm" variant="secondary">
                    <a href="#moot-form">{t("streamRecords.moots.addTitle")}</a>
                  </Button>
                ) : undefined
              }
            />
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
                  {m.canEdit ? (
                    <a className="inline-flex min-h-11 items-center text-sm font-medium text-accent-strong underline" href={`${base}?correct=${m.id}#moot-form`} data-correct={m.id}>
                      {t("streamRecords.moots.correctThis", { name: m.name })}
                    </a>
                  ) : m.frozen ? (
                    <p className="text-sm text-fg-muted">{t("streamRecords.moots.frozenNote")}</p>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>

      {data.canEdit ? (
        <Card>
          <CardHeader title={t(editing ? "streamRecords.moots.correctTitle" : "streamRecords.moots.addTitle")} description={t(editing ? "streamRecords.moots.correctBody" : "streamRecords.moots.addBodyByKind")} />
          <CardBody>
            <ActionForm key={editing?.id ?? "new"} id="moot-form" action={saveMootCourtAction} className="space-y-4">
              <input type="hidden" name="back" value={base} />
              {editing ? <input type="hidden" name="id" value={editing.id} /> : null}
              <input type="hidden" name="teamSlots" value={slots} />
              <div className="grid gap-3 sm:grid-cols-3">
                <TextField name="name" label={t("streamRecords.moots.fieldName")} required minLength={2} maxLength={160} defaultValue={editing?.name} />
                <DateField name="at" label={t("streamRecords.moots.fieldDay")} required defaultValue={editing?.at ?? today} />
                <SelectField name="kind" label={t("streamRecords.moots.fieldKind")} required defaultValue={editing?.kind ?? "INTRA"}>
                  {MOOT_COURT_KINDS.map((k) => (
                    <option key={k} value={k}>{t(`streamRecords.moots.kind${k}`)}</option>
                  ))}
                </SelectField>
              </div>
              {Array.from({ length: slots }, (_, i) => i + 1).map((n) => (
                <fieldset key={n} className="rounded-[var(--radius-md)] border border-border p-3">
                  <legend className="px-1 text-sm font-medium text-fg">{t("streamRecords.moots.teamN", { n })}</legend>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <TextField name={`team${n}Name`} label={t("streamRecords.moots.fieldTeam")} maxLength={80} required={n === 1} defaultValue={editing?.teams[n - 1]?.name} />
                    <SelectField name={`team${n}Outcome`} label={t("streamRecords.moots.fieldOutcome")} defaultValue={editing?.teams[n - 1]?.outcome ?? "PARTICIPATED"}>
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
                              <input type="checkbox" name={`team${n}Member`} value={s.membershipId} defaultChecked={editing?.teams[n - 1]?.members.some((p) => p.membershipId === s.membershipId) ?? false} className="size-4 accent-[var(--accent)]" />
                              {s.name}
                            </label>
                          </li>
                        ))}
                      </ul>
                    </details>
                  ) : null}
                </fieldset>
              ))}
              <TextField name="result" label={t("streamRecords.moots.fieldResult")} maxLength={400} defaultValue={editing?.result} />
              <TextAreaField name="judgeNotes" label={t("streamRecords.moots.fieldNotes")} maxLength={2000} rows={3} defaultValue={editing?.judgeNotes} />
              <div className="flex flex-wrap items-center gap-3">
                <Button type="submit">{t(editing ? "streamRecords.moots.saveCorrection" : "streamRecords.moots.save")}</Button>
                {editing ? (
                  <a className="inline-flex min-h-11 items-center text-sm font-medium text-accent-strong underline" href={base}>
                    {t("common.cancel")}
                  </a>
                ) : null}
              </div>
            </ActionForm>
          </CardBody>
        </Card>
      ) : null}
    </div>
  );
}
