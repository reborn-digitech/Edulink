import { HandHeartIcon, TentIcon, UsersThreeIcon } from "@phosphor-icons/react/ssr";
import type { CorpsCode } from "@edulink/contracts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader, StatTile } from "@/components/ui/card";
import { CheckboxField, DateField, TextField } from "@/components/ui/field";
import { EmptyState } from "@/components/ui/states";
import { PageHeader } from "@/components/ui/page-header";
import { TableScroll } from "@/components/ui/table-scroll";
import { ModuleOff } from "@/components/module-off";
import { NUM, TD, TH } from "@/components/module-flash";
import { RecordsFlash } from "@/components/stream-records/flash";
import { dutyPageContext } from "@/components/stream-records/duty-page";
import { corpsDesk } from "@/lib/corps";
import { db } from "@/lib/db";
import { formatDateKey, todayKey } from "@/lib/dates";
import { getLocale, getT } from "@/lib/i18n/server";
import { corpsActivityAction, enrolCorpsAction, leaveCorpsAction } from "@/app/(app)/duties/actions";

type Params = Record<string, string | string[] | undefined>;

/**
 * THE NSS OR NCC OFFICER'S DESK (5 Oct 2026), one page for both units: the
 * enrolled students with this year's hours against the NSS Manual's 120, the
 * year's activities and camps, and the officer's forms — enrol, a student
 * leaving, an activity with its hours and who took part (enrolled students
 * only). The office writes too; the head reads. lib/corps.ts.
 */
export async function CorpsPage({ corps, searchParams }: { corps: CorpsCode; searchParams: Promise<Params> }) {
  const { ctx, moduleOn } = await dutyPageContext(corps === "NSS" ? "NSS_OFFICER" : "NCC_OFFICER", "IQAC");
  const t = await getT();
  const locale = await getLocale();
  if (!moduleOn) return <ModuleOff module="IQAC" t={t} college />;
  const params = await searchParams;
  const [d, school] = await Promise.all([corpsDesk(ctx, corps), db.school.findUniqueOrThrow({ where: { id: ctx.schoolId }, select: { timezone: true } })]);
  const today = todayKey(school.timezone);
  const k = corps === "NSS" ? "nss" : "ncc";
  const enrolledIds = new Set(d.enrolled.map((e) => e.studentMembershipId));
  const notEnrolled = d.students.filter((s) => !enrolledIds.has(s.membershipId));
  return (
    <div className="space-y-6">
      <PageHeader title={t(`duties.corps.${k}Title`)} description={t(`duties.corps.${k}Intro`, { hours: d.hoursPerYear })} />
      <RecordsFlash t={t} params={params} />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label={t("duties.corps.statEnrolled")} value={d.enrolled.length} />
        <StatTile label={t("duties.corps.statActivities")} value={d.summary.activities} />
        <StatTile label={t("duties.corps.statHours")} value={d.summary.hours} />
        <StatTile label={t("duties.corps.statCamps")} value={d.summary.camps} />
      </div>

      <Card>
        <CardHeader icon={<UsersThreeIcon weight="duotone" className="size-5" />} title={t("duties.corps.enrolledTitle")} description={t("duties.corps.enrolledBody", { hours: d.hoursPerYear })} />
        <CardBody className="space-y-4">
          {d.enrolled.length === 0 ? (
            <EmptyState
              className="border-0 bg-transparent py-4"
              title={t("duties.corps.noneEnrolled")}
              description={t(d.canEdit ? "duties.corps.noneEnrolledBody" : "duties.corps.noneEnrolledRead")}
              action={
                d.canEdit && notEnrolled.length > 0 ? (
                  <Button asChild size="sm" variant="secondary">
                    <a href="#enrol-form">{t("duties.corps.enrol")}</a>
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <TableScroll label={t("duties.corps.enrolledTitle")}>
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className={TH}>{t("streamRecords.colStudent")}</th>
                    <th className={TH}>{t("duties.corps.colUnit")}</th>
                    <th className={TH}>{t("duties.corps.colSince")}</th>
                    <th className={`${TH} text-right`}>{t("duties.corps.colHours")}</th>
                    {d.canEdit ? <th className={TH}><span className="sr-only">{t("duties.corps.leave")}</span></th> : null}
                  </tr>
                </thead>
                <tbody>
                  {d.enrolled.map((e) => (
                    <tr key={e.studentMembershipId}>
                      <td className={TD}>{e.name}</td>
                      <td className={TD}>{e.unit || "—"}</td>
                      <td className={TD}>{formatDateKey(e.enrolledOn, { dateStyle: "medium" }, locale)}</td>
                      <td className={NUM}>
                        {e.hours} {e.hours >= d.hoursPerYear ? <Badge tone="ok">{t("duties.corps.metHours")}</Badge> : null}
                      </td>
                      {d.canEdit ? (
                        <td className={TD}>
                          <form action={leaveCorpsAction}>
                            <input type="hidden" name="corps" value={corps} />
                            <input type="hidden" name="studentMembershipId" value={e.studentMembershipId} />
                            <input type="hidden" name="on" value={today} />
                            <Button type="submit" size="sm" variant="ghost">{t("duties.corps.leave")}</Button>
                          </form>
                        </td>
                      ) : null}
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableScroll>
          )}
          {d.canEdit && notEnrolled.length > 0 ? (
            <form id="enrol-form" action={enrolCorpsAction} className="space-y-3 border-t border-border pt-4">
              <input type="hidden" name="corps" value={corps} />
              <details>
                <summary className="min-h-11 cursor-pointer py-2 text-sm font-medium text-accent-strong">{t("duties.corps.chooseToEnrol", { count: notEnrolled.length })}</summary>
                <ul className="grid gap-1 sm:grid-cols-2 lg:grid-cols-3">
                  {notEnrolled.map((s) => (
                    <li key={s.membershipId}>
                      <label className="flex min-h-11 items-center gap-2 text-sm text-fg">
                        <input type="checkbox" name="student" value={s.membershipId} className="size-4 accent-[--accent]" />
                        {s.name}
                      </label>
                    </li>
                  ))}
                </ul>
              </details>
              <div className="flex flex-wrap items-end gap-3">
                <TextField name="unit" label={t("duties.corps.fieldUnit")} maxLength={80} className="w-56" />
                <Button type="submit" variant="secondary">{t("duties.corps.enrol")}</Button>
              </div>
            </form>
          ) : null}
        </CardBody>
      </Card>

      <Card>
        <CardHeader icon={<HandHeartIcon weight="duotone" className="size-5" />} title={t("duties.corps.activitiesTitle")} description={t("duties.corps.activitiesBody")} />
        <CardBody className="space-y-4">
          {d.activities.length === 0 ? (
            <p className="text-sm text-fg-muted">{t("duties.corps.noActivities")}</p>
          ) : (
            <ul className="divide-y divide-border text-sm">
              {d.activities.map((a) => (
                <li key={a.id} className="flex flex-wrap items-center gap-2 py-2">
                  <span className="font-medium text-fg">{a.title}</span>
                  <span className="text-fg-muted">{t("duties.corps.activityLine", { day: formatDateKey(a.at, { dateStyle: "medium" }, locale), hours: a.hours, count: a.participants })}</span>
                  {a.camp ? (
                    <Badge tone="info">
                      <TentIcon className="mr-1 inline size-3.5" aria-hidden="true" />
                      {t("duties.corps.camp")}
                    </Badge>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
          {d.canEdit && d.enrolled.length > 0 ? (
            <form action={corpsActivityAction} className="space-y-3 border-t border-border pt-4">
              <input type="hidden" name="corps" value={corps} />
              <div className="grid gap-3 sm:grid-cols-3">
                <TextField name="title" label={t("duties.corps.fieldTitle")} required minLength={2} maxLength={160} />
                <DateField name="at" label={t("duties.corps.fieldDay")} required defaultValue={today} max={today} />
                <TextField name="hours" label={t("duties.corps.fieldHours")} required inputMode="decimal" defaultValue="4" />
              </div>
              <CheckboxField name="camp" label={t("duties.corps.fieldCamp")} />
              <fieldset>
                <legend className="mb-1 text-sm font-medium text-fg">{t("duties.corps.fieldParticipants")}</legend>
                <ul className="grid gap-1 sm:grid-cols-2 lg:grid-cols-3">
                  {d.enrolled.map((e) => (
                    <li key={e.studentMembershipId}>
                      <label className="flex min-h-11 items-center gap-2 text-sm text-fg">
                        <input type="checkbox" name="participant" value={e.studentMembershipId} defaultChecked className="size-4 accent-[--accent]" />
                        {e.name}
                      </label>
                    </li>
                  ))}
                </ul>
              </fieldset>
              <Button type="submit">{t("duties.corps.addActivity")}</Button>
            </form>
          ) : null}
        </CardBody>
      </Card>
    </div>
  );
}
