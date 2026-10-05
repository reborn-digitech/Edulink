import type { Metadata } from "next";
import { MALPRACTICE_DECISIONS, REMUNERATION_KINDS } from "@edulink/contracts";
import { requireRole } from "@/lib/tenancy";
import { institutionKindOf, isModuleOn } from "@/lib/modules";
import { isCollegeKind } from "@/lib/institution";
import { getLocale, getT } from "@/lib/i18n/server";
import { sessionView } from "@/lib/exam-cell";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DateTimeField } from "@/components/ui/date-time-field";
import { CellOff, DUTY_STATUS_KEY, Hidden, Labelled, MALPRACTICE_KEY, REMUNERATION_KEY, SessionFrame, money, when } from "@/components/exam-cell/parts";
import { assignInvigilatorAction, buildSeatingAction, decideMalpracticeAction, dutyDoneAction, issueTicketsAction, reportMalpracticeAction, saveRemunerationAction, saveRoomAction, saveScheduleAction, swapInvigilatorAction } from "../../../actions";
import { fieldClass } from "@/components/ui/field-class";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("examCell.tabLogistics"), robots: { index: false, follow: false } };
}

/**
 * The sittings: the date sheet, halls, seating on alternate seats, hall
 * tickets, invigilation with swaps, each hall's attendance sheet, unfair
 * means with the committee's decision, and remuneration.
 */
export default async function LogisticsPage({ params, searchParams }: { params: Promise<{ sessionId: string }>; searchParams: Promise<{ ok?: string; error?: string }> }) {
  const ctx = await requireRole("EXAM_CONTROLLER", "ADMIN", "PRINCIPAL");
  const [t, locale, on, kind] = await Promise.all([getT(), getLocale(), isModuleOn(ctx.schoolId, "EXAMS"), institutionKindOf(ctx.schoolId)]);
  if (!on) return <CellOff t={t} college={isCollegeKind(kind)} />;
  const { sessionId } = await params;
  const { ok, error } = await searchParams;
  const s = await sessionView(ctx, sessionId);
  const back = `/exam-cell/sessions/${s.id}/logistics`;
  const w = s.canWrite;
  const sitting = s.forms.filter((f) => f.status === "APPROVED");
  const staffOptions = s.staff.map((m) => (
    <option key={m.membershipId} value={m.membershipId}>
      {m.name}
    </option>
  ));
  return (
    <SessionFrame t={t} session={s} current="logistics" autonomous={s.autonomous} ok={ok} error={error}>
      <Card>
        <CardHeader title={t("examCell.dateSheet")} description={t("examCell.dateSheetHint")} />
        <CardBody className="space-y-4">
          {s.schedule.length === 0 ? <p className="text-sm text-fg-muted">{t("examCell.noSchedule")}</p> : null}
          {s.schedule.map((x) => (
            <div key={x.id} className="space-y-2 rounded-[var(--radius-md)] border border-border p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-fg">
                  {x.code} {x.name}
                </p>
                <p className="text-xs text-fg-muted">
                  {when(x.at, locale)} · {t("examCell.minutes", { count: x.durationMin })} · {t("examCell.expected", { count: x.expected })}
                </p>
              </div>
              <ul className="space-y-1.5">
                {x.rooms.map((r) => (
                  <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                    <span>
                      {r.name} · {t("examCell.seatedOf", { seated: r.seated, capacity: r.capacity })}
                      {r.invigilators.map((i) => (
                        <span key={i.id} className="ml-2 inline-flex items-center gap-1">
                          <Badge tone="outline">
                            {i.name} · {t(DUTY_STATUS_KEY[i.status]!)}
                          </Badge>
                          {w && i.status !== "DONE" ? (
                            <form action={dutyDoneAction} className="inline">
                              <Hidden fields={{ invigilationId: i.id, back }} />
                              <Button type="submit" size="sm" variant="ghost">
                                {t("examCell.markDone")}
                              </Button>
                            </form>
                          ) : null}
                        </span>
                      ))}
                    </span>
                    <a className="text-xs font-medium text-accent-strong hover:underline" href={`/api/v1/exam-cell/rooms/${r.id}/sheet`}>
                      {t("examCell.attendanceSheet")}
                    </a>
                  </li>
                ))}
              </ul>
              {w ? (
                <div className="flex flex-wrap gap-3">
                  <form action={saveRoomAction} className="flex flex-wrap items-end gap-2">
                    <Hidden fields={{ sessionId: s.id, scheduleId: x.id, back }} />
                    <Labelled label={t("examCell.hallName")}>
                      <input name="name" required maxLength={60} className={fieldClass()} />
                    </Labelled>
                    <Labelled label={t("examCell.capacity")}>
                      <input name="capacity" type="number" min={2} max={500} required className={fieldClass()} />
                    </Labelled>
                    <Button type="submit" size="sm" variant="secondary">
                      {t("examCell.addHall")}
                    </Button>
                  </form>
                  <form action={buildSeatingAction}>
                    <Hidden fields={{ sessionId: s.id, scheduleId: x.id, back }} />
                    <Button type="submit" size="sm" variant="secondary">
                      {t("examCell.buildSeating")}
                    </Button>
                  </form>
                  <a className="self-center text-sm font-medium text-accent-strong hover:underline" href={`/exam-cell/sessions/${s.id}/seating/${x.id}`}>
                    {t("examCell.viewSeating")}
                  </a>
                </div>
              ) : null}
            </div>
          ))}
          {w ? (
            <form action={saveScheduleAction} className="flex flex-wrap items-end gap-2">
              <Hidden fields={{ sessionId: s.id, back }} />
              <Labelled label={t("examCell.course")}>
                <select name="courseId" required className={fieldClass()}>
                  {s.courses.map((c) => (
                    <option key={c.courseId} value={c.courseId}>
                      {c.code} {c.name}
                    </option>
                  ))}
                  {s.marks
                    .filter((m) => !s.courses.some((c) => c.courseId === m.courseId))
                    .map((m) => (
                      <option key={m.courseId} value={m.courseId}>
                        {m.code}
                      </option>
                    ))}
                </select>
              </Labelled>
              <DateTimeField label={t("examCell.when")} name="at" defaultTime="10:00" required className="w-full sm:w-auto sm:min-w-[20rem]" />
              <Labelled label={t("examCell.duration")}>
                <input name="durationMin" type="number" min={30} max={360} defaultValue={180} className={fieldClass()} />
              </Labelled>
              <Button type="submit" size="sm">
                {t("examCell.addPaper")}
              </Button>
            </form>
          ) : null}
        </CardBody>
      </Card>

      {w ? (
        <Card>
          <CardHeader title={t("examCell.ticketsTitle")} description={t("examCell.ticketsHint", { count: sitting.filter((f) => !f.hallTicket).length })} />
          <CardBody className="flex flex-wrap gap-2">
            <form action={issueTicketsAction}>
              <Hidden fields={{ sessionId: s.id, back }} />
              <Button type="submit">{t("examCell.issueTickets")}</Button>
            </form>
            <form action={buildSeatingAction}>
              <Hidden fields={{ sessionId: s.id, back }} />
              <Button type="submit" variant="secondary">
                {t("examCell.buildAllSeating")}
              </Button>
            </form>
          </CardBody>
        </Card>
      ) : null}

      {w ? (
        <Card>
          <CardHeader title={t("examCell.invigilationTitle")} />
          <CardBody className="space-y-3">
            <form action={assignInvigilatorAction} className="flex flex-wrap items-end gap-2">
              <Hidden fields={{ sessionId: s.id, back }} />
              <Labelled label={t("examCell.hall")}>
                <select name="examRoomId" required className={fieldClass()}>
                  {s.schedule.flatMap((x) =>
                    x.rooms.map((r) => (
                      <option key={r.id} value={r.id}>
                        {x.code} · {r.name}
                      </option>
                    )),
                  )}
                </select>
              </Labelled>
              <Labelled label={t("examCell.staff")}>
                <select name="staffMembershipId" required className={fieldClass()}>
                  {staffOptions}
                </select>
              </Labelled>
              <Button type="submit" size="sm">
                {t("examCell.assignDuty")}
              </Button>
            </form>
            <form action={swapInvigilatorAction} className="flex flex-wrap items-end gap-2">
              <Hidden fields={{ back }} />
              <Labelled label={t("examCell.duty")}>
                <select name="invigilationId" required className={fieldClass()}>
                  {s.schedule.flatMap((x) =>
                    x.rooms.flatMap((r) =>
                      r.invigilators
                        .filter((i) => i.status !== "DONE")
                        .map((i) => (
                          <option key={i.id} value={i.id}>
                            {x.code} · {r.name} · {i.name}
                          </option>
                        )),
                    ),
                  )}
                </select>
              </Labelled>
              <Labelled label={t("examCell.swapTo")}>
                <select name="staffMembershipId" required className={fieldClass()}>
                  {staffOptions}
                </select>
              </Labelled>
              <Labelled label={t("examCell.reason")}>
                <input name="note" required minLength={3} maxLength={300} className={fieldClass()} />
              </Labelled>
              <Button type="submit" size="sm" variant="secondary">
                {t("examCell.swap")}
              </Button>
            </form>
          </CardBody>
        </Card>
      ) : null}

      <Card>
        <CardHeader title={t("examCell.malpracticeTitle")} />
        <CardBody className="space-y-3">
          {s.malpractice.length === 0 ? <p className="text-sm text-fg-muted">{t("examCell.noMalpractice")}</p> : null}
          {s.malpractice.map((m) => (
            <div key={m.id} className="space-y-2 rounded-[var(--radius-md)] border border-border p-3 text-sm">
              <p className="font-medium text-fg">
                {m.studentName} · {m.courseCode}
              </p>
              <p className="text-fg-muted">{m.note}</p>
              {m.decision ? (
                <p>
                  <Badge tone="warn">{t(MALPRACTICE_KEY[m.decision]!)}</Badge> {m.decisionNote}
                </p>
              ) : w ? (
                <form action={decideMalpracticeAction} className="flex flex-wrap items-end gap-2">
                  <Hidden fields={{ malpracticeId: m.id, back }} />
                  <Labelled label={t("examCell.decision")}>
                    <select name="decision" className={fieldClass()}>
                      {MALPRACTICE_DECISIONS.map((d) => (
                        <option key={d} value={d}>
                          {t(MALPRACTICE_KEY[d]!)}
                        </option>
                      ))}
                    </select>
                  </Labelled>
                  <Labelled label={t("examCell.committeeNote")}>
                    <input name="note" required minLength={3} maxLength={1000} className={fieldClass()} />
                  </Labelled>
                  <Button type="submit" size="sm">
                    {t("examCell.record")}
                  </Button>
                </form>
              ) : null}
            </div>
          ))}
          {w && s.schedule.length > 0 ? (
            <form action={reportMalpracticeAction} className="flex flex-wrap items-end gap-2">
              <Hidden fields={{ sessionId: s.id, back }} />
              <Labelled label={t("examCell.paper")}>
                <select name="scheduleId" className={fieldClass()}>
                  {s.schedule.map((x) => (
                    <option key={x.id} value={x.id}>
                      {x.code}
                    </option>
                  ))}
                </select>
              </Labelled>
              <Labelled label={t("examCell.student")}>
                <select name="studentMembershipId" className={fieldClass()}>
                  {sitting.map((f) => (
                    <option key={f.studentMembershipId} value={f.studentMembershipId}>
                      {f.name}
                    </option>
                  ))}
                </select>
              </Labelled>
              <Labelled label={t("examCell.whatHappened")}>
                <input name="note" required minLength={5} maxLength={1000} className={fieldClass()} />
              </Labelled>
              <Button type="submit" size="sm" variant="secondary">
                {t("examCell.reportCase")}
              </Button>
            </form>
          ) : null}
        </CardBody>
      </Card>

      <Card>
        <CardHeader title={t("examCell.remunerationTitle")} description={t("examCell.remunerationHint")} />
        <CardBody className="space-y-3">
          {s.remuneration.map((r) => (
            <p key={r.id} className="text-sm">
              {r.name} · {t(REMUNERATION_KEY[r.kind]!)} · {t("examCell.payLine", { count: r.count, rate: money(r.ratePaise, locale), amount: money(r.amountPaise, locale), duties: r.duties })}
            </p>
          ))}
          {w ? (
            <form action={saveRemunerationAction} className="flex flex-wrap items-end gap-2">
              <Hidden fields={{ sessionId: s.id, back }} />
              <Labelled label={t("examCell.staff")}>
                <select name="staffMembershipId" className={fieldClass()}>
                  {staffOptions}
                </select>
              </Labelled>
              <Labelled label={t("examCell.payKind")}>
                <select name="kind" className={fieldClass()}>
                  {REMUNERATION_KINDS.map((k) => (
                    <option key={k} value={k}>
                      {t(REMUNERATION_KEY[k]!)}
                    </option>
                  ))}
                </select>
              </Labelled>
              <Labelled label={t("examCell.count")}>
                <input name="count" type="number" min={0} max={1000} required className={fieldClass()} />
              </Labelled>
              <Labelled label={t("examCell.rate")}>
                <input name="rate" inputMode="decimal" required className={fieldClass()} />
              </Labelled>
              <Button type="submit" size="sm" variant="secondary">
                {t("examCell.save")}
              </Button>
            </form>
          ) : null}
        </CardBody>
      </Card>
    </SessionFrame>
  );
}
