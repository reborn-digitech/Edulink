import type { Metadata } from "next";
import { requireRole } from "@/lib/tenancy";
import { institutionKindOf, isModuleOn } from "@/lib/modules";
import { isCollegeKind } from "@/lib/institution";
import { getLocale, getT } from "@/lib/i18n/server";
import { sessionView } from "@/lib/exam-cell";
import { conductView } from "@/lib/exam-cell-after";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/states";
import { CellOff, Hidden, Labelled, PAPER_STATUS_KEY, SessionFrame, day } from "@/components/exam-cell/parts";
import { allocationAction, assignPaperAction, moderatePaperAction, printingAction, returnAllocationAction } from "../../../actions";
import { fieldClass } from "@/components/ui/field-class";
import { ActionForm } from "@/components/ui/action-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("examCell.tabConduct"), robots: { index: false, follow: false } };
}

/**
 * An autonomous college's own conduct: papers set by appointed faculty with
 * their outcome maps, moderated, kept sealed and opened only into the file
 * that sends them (each opening logged); printing lists per hall; bundles of
 * answer books at central assessment. An affiliated college sees none of it.
 */
export default async function ConductPage({ params, searchParams }: { params: Promise<{ sessionId: string }>; searchParams: Promise<{ ok?: string; error?: string }> }) {
  const ctx = await requireRole("EXAM_CONTROLLER", "ADMIN", "PRINCIPAL");
  const [t, locale, on, kind] = await Promise.all([getT(), getLocale(), isModuleOn(ctx.schoolId, "EXAMS"), institutionKindOf(ctx.schoolId)]);
  if (!on) return <CellOff t={t} college={isCollegeKind(kind)} />;
  const { sessionId } = await params;
  const { ok, error } = await searchParams;
  const s = await sessionView(ctx, sessionId);
  if (!s.autonomous)
    return (
      <SessionFrame t={t} session={s} current="conduct" autonomous={false}>
        <EmptyState title={t("examCell.notAutonomousTitle")} description={t("examCell.notAutonomousBody")} />
      </SessionFrame>
    );
  const c = await conductView(ctx, s.id);
  const back = `/exam-cell/sessions/${s.id}/conduct`;
  const faculty = s.staff.filter((m) => m.role === "FACULTY" || m.role === "HOD");
  return (
    <SessionFrame t={t} session={s} current="conduct" autonomous ok={ok} error={error}>
      <Card>
        <CardHeader title={t("examCell.papersTitle")} description={t("examCell.papersHint")} />
        <CardBody className="space-y-3">
          {c.papers.map((p) => (
            <div key={p.id} className="space-y-2 rounded-[var(--radius-md)] border border-border p-3 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium">
                  {p.courseCode} · {p.setterName}
                </p>
                <div className="flex items-center gap-2">
                  <Badge tone={p.status === "MODERATED" ? "ok" : p.status === "SUBMITTED" ? "accent" : "neutral"}>{t(PAPER_STATUS_KEY[p.status]!)}</Badge>
                  <span className="text-xs text-fg-muted">{p.opens === 1 ? t("examCell.opensOne", { count: 1 }) : t("examCell.opens", { count: p.opens })}</span>
                </div>
              </div>
              {p.coMap.length ? <p className="text-xs text-fg-muted">{p.coMap.map((q) => `${q.question}→${q.co} (${q.marks})`).join(", ")}</p> : null}
              {p.submittedAt ? <p className="text-xs text-fg-muted">{t("examCell.submittedOn", { date: day(p.submittedAt, locale) })}</p> : null}
              {s.canWrite && p.status !== "ASSIGNED" ? (
                <div className="flex flex-wrap items-end gap-2">
                  <a className="text-sm font-medium text-accent-strong hover:underline" href={`/api/v1/exam-cell/papers/${p.id}/open`}>
                    {t("examCell.openSealed")}
                  </a>
                  {p.status === "SUBMITTED" ? (
                    <ActionForm action={moderatePaperAction} className="flex flex-wrap items-end gap-2">
                      <Hidden fields={{ paperId: p.id, back }} />
                      <Labelled label={t("examCell.moderationNote")}>
                        <input name="note" required minLength={3} maxLength={1000} className={fieldClass()} />
                      </Labelled>
                      <Button type="submit" size="sm" variant="secondary">
                        {t("examCell.markModerated")}
                      </Button>
                    </ActionForm>
                  ) : null}
                </div>
              ) : null}
            </div>
          ))}
          {s.canWrite ? (
            <ActionForm action={assignPaperAction} className="flex flex-wrap items-end gap-2">
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
              <Labelled label={t("examCell.setter")}>
                <select name="setterMembershipId" className={fieldClass()}>
                  {faculty.map((m) => (
                    <option key={m.membershipId} value={m.membershipId}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </Labelled>
              <Button type="submit" size="sm">
                {t("examCell.appointSetter")}
              </Button>
            </ActionForm>
          ) : null}
        </CardBody>
      </Card>

      <Card>
        <CardHeader title={t("examCell.printingTitle")} />
        <CardBody className="space-y-2">
          {c.printing.map((p) => (
            <p key={p.id} className="text-sm">
              {p.courseCode} · {p.roomName} · {t("examCell.printLine", { seated: p.seated, spare: p.spare, count: p.count })}
            </p>
          ))}
          {s.canWrite ? (
            <ActionForm action={printingAction} className="flex flex-wrap items-end gap-2">
              <Hidden fields={{ sessionId: s.id, back }} />
              <Labelled label={t("examCell.spare")}>
                <input name="spare" type="number" min={0} max={50} defaultValue={2} className={fieldClass("w-24")} />
              </Labelled>
              <Button type="submit" size="sm" variant="secondary">
                {t("examCell.buildPrinting")}
              </Button>
            </ActionForm>
          ) : null}
        </CardBody>
      </Card>

      <Card>
        <CardHeader title={t("examCell.assessmentTitle")} />
        <CardBody className="space-y-2">
          {c.allocations.map((a) => (
            <div key={a.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <span>
                {a.courseCode} · {a.bundle} · {a.assessorName} · {t("examCell.books", { count: a.count })}
              </span>
              {s.canWrite && a.status === "ALLOTTED" ? (
                <ActionForm action={returnAllocationAction}>
                  <Hidden fields={{ allocationId: a.id, back }} />
                  <Button type="submit" size="sm" variant="ghost">
                    {t("examCell.markReturned")}
                  </Button>
                </ActionForm>
              ) : (
                <Badge tone="ok">{t("examCell.returned")}</Badge>
              )}
            </div>
          ))}
          {s.canWrite ? (
            <ActionForm action={allocationAction} className="flex flex-wrap items-end gap-2">
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
              <Labelled label={t("examCell.assessor")}>
                <select name="assessorMembershipId" className={fieldClass()}>
                  {faculty.map((m) => (
                    <option key={m.membershipId} value={m.membershipId}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </Labelled>
              <Labelled label={t("examCell.bundle")}>
                <input name="bundle" required maxLength={40} className={fieldClass("w-28")} />
              </Labelled>
              <Labelled label={t("examCell.count")}>
                <input name="count" type="number" min={1} max={500} required className={fieldClass("w-24")} />
              </Labelled>
              <Button type="submit" size="sm">
                {t("examCell.allot")}
              </Button>
            </ActionForm>
          ) : null}
        </CardBody>
      </Card>
    </SessionFrame>
  );
}
