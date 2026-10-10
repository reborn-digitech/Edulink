import type { Metadata } from "next";
import Link from "next/link";
import { PaletteIcon, SealCheckIcon, UsersThreeIcon } from "@phosphor-icons/react/ssr";
import { EXTERNAL_JUROR_ROLES } from "@edulink/contracts";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader, StatTile } from "@/components/ui/card";
import { DateField, SelectField, TextAreaField, TextField } from "@/components/ui/field";
import { EmptyState } from "@/components/ui/states";
import { PageHeader } from "@/components/ui/page-header";
import { ModuleOff } from "@/components/module-off";
import { RecordsFlash } from "@/components/stream-records/flash";
import { dutyPageContext } from "@/components/stream-records/duty-page";
import { EXTERNAL_ROLE_KEY, StudioCard } from "@/components/studio/studio-card";
import { studioDesk } from "@/lib/studio";
import { formatDateKey } from "@/lib/dates";
import { getLocale, getT } from "@/lib/i18n/server";
import { saveJuryAction, saveStudioAction } from "./actions";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("duties.studio.title") };
}

/**
 * THE STUDIO COORDINATOR'S DESK (R-56, the studio half, 10 Oct 2026): every
 * studio of the college with its stages and what each waits for, the
 * students' submission states and signed results, the juries ahead and past
 * with their panels, and the sheets waiting for a chair's signature. A holder
 * of the duty keeps studios and convenes juries; the office keeps studios;
 * the head reads. lib/studio.ts.
 */
export default async function StudioDeskPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { ctx, moduleOn } = await dutyPageContext("STUDIO_COORDINATOR", "ACADEMICS");
  const t = await getT();
  const locale = await getLocale();
  if (!moduleOn) return <ModuleOff page module="ACADEMICS" t={t} college />;
  const params = await searchParams;
  const d = await studioDesk(ctx);
  const holder = ctx.role === "FACULTY" || ctx.role === "HOD";
  const day = (k: string) => formatDateKey(k, { dateStyle: "medium" }, locale);
  const juriesAhead = d.studios.reduce((a, s) => a + s.juries.filter((j) => !j.past).length, 0);
  const waiting = d.studios.reduce((a, s) => a + s.stages.filter((st) => st.stage !== "JURY").reduce((b, st) => b + st.waiting, 0), 0);
  return (
    <div className="space-y-6">
      <PageHeader title={t("duties.studio.title")} description={t("duties.studio.intro")} />
      <RecordsFlash t={t} params={params} />
      {!d.offered ? <p className="rounded-[var(--radius-md)] border border-border bg-surface-muted px-3 py-2 text-sm text-fg-muted">{t("duties.studio.notOffered")}</p> : null}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label={t("duties.studio.statStudios")} value={d.studios.length} />
        <StatTile label={t("duties.studio.statJuriesAhead")} value={juriesAhead} />
        <StatTile label={t("duties.studio.statToSign")} value={d.toSign.length} tone={d.toSign.length ? "warn" : "ok"} />
        <StatTile label={t("duties.studio.statWaiting")} value={waiting} tone={waiting ? "warn" : "neutral"} />
      </div>

      <Card>
        <CardHeader icon={<SealCheckIcon weight="duotone" className="size-5" />} title={t("duties.studio.toSignTitle")} description={t("duties.studio.toSignBody")} />
        <CardBody>
          {d.toSign.length === 0 ? (
            <p className="text-sm text-fg-muted">{t("duties.studio.nothingToSign")}</p>
          ) : (
            <ul className="divide-y divide-border text-sm">
              {d.toSign.map((x) => (
                <li key={x.juryId} className="py-1.5">{t("duties.studio.toSignLine", { studio: x.studioTitle, day: day(x.on), marked: x.marked, students: x.students, chair: x.chairName })}</li>
              ))}
            </ul>
          )}
          {holder ? (
            <Button asChild size="sm" variant="secondary" className="mt-3">
              <Link href="/faculty/studios">{t("duties.studio.openFaculty")}</Link>
            </Button>
          ) : null}
        </CardBody>
      </Card>

      {d.studios.length === 0 ? (
        <EmptyState
          icon={<PaletteIcon weight="duotone" className="size-6" />}
          title={t("duties.studio.noStudios")}
          description={t(d.canManage && d.offered ? "duties.studio.noStudiosBody" : "duties.studio.noStudiosRead")}
          action={
            d.canManage && d.offered ? (
              <Button asChild size="sm" variant="secondary">
                <a href="#studio-form">{t("duties.studio.addStudioTitle")}</a>
              </Button>
            ) : undefined
          }
        />
      ) : (
        d.studios.map((s) => (
          <StudioCard key={s.id} s={s} t={t} locale={locale}>
            {d.canConvene && d.offered ? (
              <details className="rounded-[var(--radius-md)] border border-border p-3">
                <summary className="min-h-11 cursor-pointer text-sm font-semibold text-fg">{t("duties.studio.addJuryTitle")}</summary>
                <form action={saveJuryAction} className="mt-3 grid gap-3 sm:grid-cols-2">
                  <input type="hidden" name="studioId" value={s.id} />
                  <DateField name="on" label={t("duties.studio.fieldJuryDay")} required defaultValue={s.juryOn ?? d.today} />
                  <TextField name="title" label={t("duties.studio.fieldJuryTitle")} maxLength={160} />
                  <fieldset className="sm:col-span-2">
                    <legend className="text-sm font-medium text-fg">{t("duties.studio.fieldJurors")}</legend>
                    <ul className="mt-1 grid gap-1 sm:grid-cols-2">
                      {d.teachers.map((m) => (
                        <li key={m.membershipId}>
                          <label className="flex min-h-11 items-center gap-2">
                            <input type="checkbox" name="juror" value={m.membershipId} defaultChecked={m.membershipId === ctx.membershipId} className="size-4 accent-[var(--accent)]" />
                            <span className="text-sm text-fg">{m.name}</span>
                          </label>
                        </li>
                      ))}
                    </ul>
                  </fieldset>
                  <SelectField name="chairMembershipId" label={t("duties.studio.fieldChair")} required defaultValue={ctx.membershipId ?? undefined}>
                    {d.teachers.map((m) => (
                      <option key={m.membershipId} value={m.membershipId}>{m.name}</option>
                    ))}
                  </SelectField>
                  <p className="text-sm text-fg-muted sm:col-span-2">{t("duties.studio.externalHint")}</p>
                  {[1, 2].map((n) => (
                    <div key={n} className="contents">
                      <SelectField name={`externalRole${n}`} label={t("duties.studio.fieldExternalRole")} defaultValue="">
                        <option value="">—</option>
                        {EXTERNAL_JUROR_ROLES.map((r) => (
                          <option key={r} value={r}>{t(EXTERNAL_ROLE_KEY[r])}</option>
                        ))}
                      </SelectField>
                      <TextField name={`externalInstitution${n}`} label={t("duties.studio.fieldExternalInstitution")} maxLength={160} />
                    </div>
                  ))}
                  <div className="sm:col-span-2">
                    <Button type="submit" variant="secondary">{t("duties.studio.saveJury")}</Button>
                  </div>
                </form>
              </details>
            ) : null}
          </StudioCard>
        ))
      )}

      {d.canManage && d.offered ? (
        <Card id="studio-form">
          <CardHeader icon={<UsersThreeIcon weight="duotone" className="size-5" />} title={t("duties.studio.addStudioTitle")} description={t("duties.studio.addStudioBody")} />
          <CardBody>
            {d.offerings.length === 0 ? (
              <p className="text-sm text-fg-muted">{t("duties.studio.noOfferings")}</p>
            ) : (
              <form action={saveStudioAction} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <SelectField name="offeringId" label={t("duties.studio.fieldOffering")} required className="sm:col-span-2">
                  {d.offerings.map((o) => (
                    <option key={o.id} value={o.id}>{`${o.courseCode} ${o.courseName} · ${o.termName}${o.facultyName ? ` · ${o.facultyName}` : ""}`}</option>
                  ))}
                </SelectField>
                <TextField name="title" label={t("duties.studio.fieldTitle")} required minLength={2} maxLength={160} className="sm:col-span-2" />
                <TextAreaField name="brief" label={t("duties.studio.fieldBrief")} maxLength={4000} rows={4} className="sm:col-span-2 lg:col-span-4" />
                <TextField name="maxMarks" type="number" min={10} max={1000} label={t("duties.studio.fieldMaxMarks")} required defaultValue="100" />
                {holder ? (
                  <input type="hidden" name="coordinatorMembershipId" value={ctx.membershipId ?? ""} />
                ) : (
                  <SelectField name="coordinatorMembershipId" label={t("duties.studio.fieldCoordinator")} required>
                    {d.coordinators.map((m) => (
                      <option key={m.membershipId} value={m.membershipId}>{m.name}</option>
                    ))}
                  </SelectField>
                )}
                <DateField name="briefIssuedOn" label={t("duties.studio.fieldBriefIssuedOn")} required defaultValue={d.today} />
                <DateField name="interimOn" label={t("duties.studio.fieldInterimOn")} />
                <DateField name="finalOn" label={t("duties.studio.fieldFinalOn")} />
                <DateField name="juryOn" label={t("duties.studio.fieldJuryOn")} />
                <div className="sm:col-span-2 lg:col-span-4">
                  <Button type="submit">{t("duties.studio.saveStudio")}</Button>
                </div>
              </form>
            )}
            {!holder && d.coordinators.length === 0 ? <p className="mt-2 text-sm text-fg-muted">{t("duties.studio.noCoordinators")}</p> : null}
          </CardBody>
        </Card>
      ) : null}
    </div>
  );
}
