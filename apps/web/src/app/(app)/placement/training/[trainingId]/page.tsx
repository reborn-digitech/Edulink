import type { Metadata } from "next";
import Link from "next/link";
import { CalendarCheckIcon, SealCheckIcon, UsersThreeIcon } from "@phosphor-icons/react/ssr";
import { getT } from "@/lib/i18n/server";
import { trainingDetail } from "@/lib/soft-skills";
import { rollOf } from "@/lib/placement";
import { momentFormatter } from "@/lib/school-zone";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TableScroll } from "@/components/ui/table-scroll";
import { ActionForm } from "@/components/ui/action-form";
import { TextField } from "@/components/ui/field";
import { DateTimeField } from "@/components/ui/date-time-field";
import { CellFrame, LINK, TABLE, TD, TH, cellContext } from "@/components/placement/parts";
import { SKILL_KEY, trainingBadge } from "@/components/placement/events";
import { addSessionAction, cancelSessionAction, enrolStudentsAction, markSessionAction, setTrainingStatusAction } from "../actions";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("softSkills.title"), robots: { index: false, follow: false } };
}

/**
 * One training (R-2, 5 Oct 2026): its sessions, its roll with each student's
 * marks and completion, and for the TPO the session form, the roll's
 * additions and removals, a session's marks (`?sessionId=`), and closing or
 * opening enrolment.
 */
export default async function TrainingDetailPage({ params, searchParams }: { params: Promise<{ trainingId: string }>; searchParams: Promise<{ sessionId?: string }> }) {
  const { ctx, t, on, college } = await cellContext();
  const [{ trainingId }, { sessionId }] = await Promise.all([params, searchParams]);
  const back = { href: "/placement/training", label: t("softSkills.title") };
  if (!on) return <CellFrame t={t} on={false} college={college} current="training" title={t("softSkills.title")} back={back}>{null}</CellFrame>;
  const [tr, moment] = await Promise.all([trainingDetail(ctx, trainingId), momentFormatter(ctx.schoolId)]);
  const now = new Date().getTime();
  const live = tr.sessionList.filter((s) => !s.cancelled);
  const marking = tr.canEdit ? (live.find((s) => s.id === sessionId) ?? [...live].reverse().find((s) => new Date(s.startsAt).getTime() <= now) ?? null) : null;
  const enrolledIds = new Set(tr.roster.map((r) => r.studentMembershipId));
  const others = tr.canEdit ? (await rollOf(ctx.schoolId)).filter((s) => !enrolledIds.has(s.id)) : [];
  const base = `/placement/training/${tr.id}`;
  return (
    <CellFrame t={t} on college={college} current="training" title={tr.title} description={[t(SKILL_KEY[tr.skill]), tr.trainer].filter(Boolean).join(" · ")} back={back}>
      <div className="flex flex-wrap items-center gap-3 text-sm">
        {trainingBadge(tr, t)}
        <span>{t("softSkills.completesAt", { percent: tr.minAttendancePercent })}</span>
        <span className="text-fg-muted">{t("softSkills.summaryLine", { enrolled: tr.enrolled, completed: tr.completed })}</span>
      </div>
      {tr.description ? <p className="text-sm">{tr.description}</p> : null}

      <Card>
        <CardHeader icon={<CalendarCheckIcon weight="duotone" className="size-5" />} title={t("softSkills.sessionsTitle")} />
        <CardBody className="space-y-4">
          {tr.sessionList.length === 0 ? <p className="text-sm text-fg-muted">{t("softSkills.noSessions")}</p> : null}
          <ul className="divide-y divide-border text-sm">
            {tr.sessionList.map((s) => (
              <li key={s.id} className="flex flex-wrap items-center gap-3 py-2">
                <span className={s.cancelled ? "text-fg-subtle line-through" : ""}>{moment(s.startsAt)}</span>
                {s.topic ? <span>{s.topic}</span> : null}
                {s.venue ? <span className="text-fg-muted">{s.venue}</span> : null}
                {s.cancelled ? <Badge tone="neutral">{t("softSkills.sessionCancelledBadge")}</Badge> : s.held ? <Badge tone="ok">{t("softSkills.presentCount", { count: s.present })}</Badge> : null}
                {tr.canEdit && !s.cancelled && new Date(s.startsAt).getTime() <= now ? (
                  <Link className={LINK} href={`${base}?sessionId=${s.id}`} aria-current={marking?.id === s.id ? "true" : undefined}>
                    {t("softSkills.markThis")}
                  </Link>
                ) : null}
                {tr.canEdit && !s.held ? (
                  <ActionForm action={cancelSessionAction} className="inline">
                    <input type="hidden" name="trainingId" value={tr.id} />
                    <input type="hidden" name="sessionId" value={s.id} />
                    <input type="hidden" name="cancelled" value={s.cancelled ? "false" : "true"} />
                    <Button type="submit" size="sm" variant="secondary">{s.cancelled ? t("softSkills.restoreSession") : t("softSkills.cancelSession")}</Button>
                  </ActionForm>
                ) : null}
              </li>
            ))}
          </ul>
          {tr.canEdit ? (
            <ActionForm action={addSessionAction} className="grid gap-3 sm:grid-cols-2">
              <input type="hidden" name="trainingId" value={tr.id} />
              <DateTimeField name="startsAt" label={t("softSkills.fieldWhen")} required defaultTime="14:00" />
              <TextField name="durationMinutes" label={t("softSkills.fieldMinutes")} type="number" min={15} max={480} defaultValue="60" />
              <TextField name="topic" label={t("softSkills.fieldTopic")} maxLength={160} />
              <TextField name="venue" label={t("softSkills.fieldVenue")} maxLength={160} />
              <div className="sm:col-span-2">
                <Button type="submit" variant="secondary">{t("softSkills.addSession")}</Button>
              </div>
            </ActionForm>
          ) : null}
        </CardBody>
      </Card>

      <Card>
        <CardHeader icon={<UsersThreeIcon weight="duotone" className="size-5" />} title={t("softSkills.rosterTitle")} description={marking ? t("softSkills.markingIntro", { when: moment(marking.startsAt) }) : t("softSkills.rosterIntro")} />
        <CardBody className="space-y-4">
          {tr.roster.length === 0 ? (
            <p className="text-sm text-fg-muted">{t("softSkills.noRoster")}</p>
          ) : (
            <ActionForm action={markSessionAction} className="space-y-4">
              <input type="hidden" name="trainingId" value={tr.id} />
              {marking ? <input type="hidden" name="sessionId" value={marking.id} /> : null}
              <TableScroll label={t("softSkills.rosterTitle")}>
                <table className={TABLE}>
                  <thead>
                    <tr>
                      <th className={TH}>{t("softSkills.colStudent")}</th>
                      <th className={TH}>{t("softSkills.colPrn")}</th>
                      <th className={TH}>{t("softSkills.colAttended")}</th>
                      <th className={TH}>{t("softSkills.colCompleted")}</th>
                      {marking ? <th className={TH}>{t("softSkills.colPresentHere")}</th> : null}
                      {tr.canEdit ? <th className={TH}>{t("softSkills.colRemove")}</th> : null}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {tr.roster.map((r) => (
                      <tr key={r.studentMembershipId}>
                        <td className={TD}>{r.name}</td>
                        <td className={TD}>{r.prn ?? "—"}</td>
                        <td className={TD}>{t("softSkills.attendedOf", { attended: r.attended, sessions: tr.sessions })}</td>
                        <td className={TD}>{r.completed ? <SealCheckIcon weight="fill" className="size-5 text-ok" aria-label={t("softSkills.completedYes")} /> : "—"}</td>
                        {marking ? (
                          <td className={TD}>
                            <input type="hidden" name="roll" value={r.studentMembershipId} />
                            <label className="flex min-h-11 items-center">
                              <input type="checkbox" name="present" value={r.studentMembershipId} defaultChecked={r.marks[marking.id] ?? false} className="size-4 accent-[var(--accent)]" aria-label={t("softSkills.presentFor", { name: r.name })} />
                            </label>
                          </td>
                        ) : null}
                        {tr.canEdit ? (
                          <td className={TD}>
                            <label className="flex min-h-11 items-center">
                              <input type="checkbox" name="student" value={r.studentMembershipId} form={`unenrol-${tr.id}`} className="size-4 accent-[var(--accent)]" aria-label={t("softSkills.removeFor", { name: r.name })} />
                            </label>
                          </td>
                        ) : null}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </TableScroll>
              {marking ? <Button type="submit">{t("softSkills.saveMarks")}</Button> : null}
            </ActionForm>
          )}
          {tr.canEdit && others.length > 0 ? (
            <ActionForm action={enrolStudentsAction} className="space-y-3">
              <input type="hidden" name="trainingId" value={tr.id} />
              <fieldset>
                <legend className="mb-2 text-sm font-medium">{t("softSkills.addStudents")}</legend>
                <ul className="grid max-h-72 gap-1 overflow-y-auto sm:grid-cols-2">
                  {others.map((s) => (
                    <li key={s.id}>
                      <label className="flex min-h-11 items-center gap-2 text-sm">
                        <input type="checkbox" name="student" value={s.id} className="size-4 accent-[var(--accent)]" />
                        {s.name}
                      </label>
                    </li>
                  ))}
                </ul>
              </fieldset>
              <Button type="submit" variant="secondary">{t("softSkills.enrolChosen")}</Button>
            </ActionForm>
          ) : null}
        </CardBody>
      </Card>

      {tr.canEdit ? (
        <Card>
          <CardHeader title={tr.status === "OPEN" ? t("softSkills.closeTitle") : t("softSkills.openTitle")} description={tr.status === "OPEN" ? t("softSkills.closeIntro") : t("softSkills.openIntro")} />
          <CardBody className="flex flex-wrap gap-3">
            <ActionForm action={setTrainingStatusAction}>
              <input type="hidden" name="trainingId" value={tr.id} />
              <input type="hidden" name="status" value={tr.status === "OPEN" ? "CLOSED" : "OPEN"} />
              <Button type="submit" variant="secondary">{tr.status === "OPEN" ? t("softSkills.closeEnrolment") : t("softSkills.openEnrolment")}</Button>
            </ActionForm>
            {tr.roster.length > 0 ? (
              <ActionForm action={enrolStudentsAction} id={`unenrol-${tr.id}`}>
                <input type="hidden" name="trainingId" value={tr.id} />
                <input type="hidden" name="remove" value="true" />
                <Button type="submit" variant="secondary">{t("softSkills.removeChosen")}</Button>
              </ActionForm>
            ) : null}
          </CardBody>
        </Card>
      ) : null}
    </CellFrame>
  );
}

