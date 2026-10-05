import { isoToDisplayDate } from "@/lib/dates";
import type { ReactNode } from "react";
import { ExamIcon } from "@phosphor-icons/react/ssr";
import type { MyExams } from "@edulink/contracts";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/states";
import { PageHeader } from "@/components/ui/page-header";
import type { Translate } from "@/lib/i18n/dictionary";
import { BACKLOG_STATUS_KEY, CREDIT_STATUS_KEY, DOC_KIND_KEY, FORM_STATUS_KEY, Flash, Hidden, KIND_KEY, REVAL_KIND_KEY, REVAL_OUTCOME_KEY, TermResultCard, day, money, when } from "./parts";
import { addBacklogAction, askRevaluationAction, submitFormAction } from "@/app/(app)/exam-cell/actions";
import { ActionForm } from "@/components/ui/action-form";

/**
 * A student's exams on one page (module EXAMS, 4 Oct 2026) — the student's
 * own /student/exams, and the guardian's /parent/results read-only (a
 * minor's always, an adult's under the RESULTS grant): the form with its fee
 * and no-dues, the hall ticket and seats, each published result with the
 * revaluation window, the papers issued, revaluations, backlogs and credits.
 */
export function MyExamsView({ data, t, locale, back, ok, error, switcher, title }: { data: MyExams; t: Translate; locale: string; back: string; ok?: string; error?: string; switcher?: ReactNode; title: string }) {
  const act = data.canAct;
  const nothing = data.forms.length === 0 && data.results.length === 0 && data.tickets.length === 0;
  return (
    <div className="space-y-5">
      <PageHeader title={title} description={t("examCell.mineIntro", { name: data.name })} />
      {switcher}
      <Flash ok={ok} error={error} />
      {nothing ? <EmptyState icon={<ExamIcon weight="duotone" className="size-8" />} title={t("examCell.mineNothing")} description={t("examCell.mineNothingBody")} /> : null}

      {data.forms.map((f) => (
        <Card key={f.id}>
          <CardHeader title={t("examCell.formFor", { session: f.sessionName })} description={f.windowOpen ? t("examCell.windowOpenUntil", { date: when(f.closesAt, locale) }) : t("examCell.windowShut")} action={<Badge tone={f.status === "APPROVED" ? "ok" : f.status === "REFUSED" ? "danger" : f.status === "SUBMITTED" ? "accent" : "neutral"}>{t(FORM_STATUS_KEY[f.status]!)}</Badge>} />
          <CardBody className="space-y-2 text-sm">
            <p>{f.courses.map((c) => `${c.code} ${c.name}${c.kind === "BACKLOG" ? ` (${t(KIND_KEY.BACKLOG!)})` : ""}`).join(" · ")}</p>
            {f.status !== "DRAFT" ? <p>{t("examCell.feeLine", { fee: money(f.feePaise + f.lateFeePaise, locale) })}{f.lateFeePaise > 0 ? ` (${t("examCell.lateIncluded", { late: money(f.lateFeePaise, locale) })})` : ""}</p> : null}
            {f.eligibilityNote ? <p className="text-danger">{f.eligibilityNote}</p> : null}
            {f.noDuesLines.filter((l) => !l.cleared).length > 0 ? <p className="text-danger">{t("examCell.noDuesPending", { desks: f.noDuesLines.filter((l) => !l.cleared).map((l) => l.desk).join(", ") })}</p> : null}
            {f.refusalReason ? <p className="text-danger">{f.refusalReason}</p> : null}
            {act && f.status === "DRAFT" && f.windowOpen ? (
              <ActionForm action={submitFormAction}>
                <Hidden fields={{ formId: f.id, back }} />
                <Button type="submit">{t("examCell.submitForm")}</Button>
              </ActionForm>
            ) : null}
            {act && f.backlogsToAdd.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {f.backlogsToAdd.map((b) => (
                  <ActionForm key={b.courseId} action={addBacklogAction}>
                    <Hidden fields={{ sessionId: f.sessionId, courseId: b.courseId, back }} />
                    <Button type="submit" size="sm" variant="secondary">
                      {t("examCell.addBacklog", { course: b.code })}
                    </Button>
                  </ActionForm>
                ))}
              </div>
            ) : null}
          </CardBody>
        </Card>
      ))}

      {data.tickets.length > 0 || data.seating.length > 0 ? (
        <Card>
          <CardHeader title={t("examCell.ticketsAndSeats")} />
          <CardBody className="space-y-2 text-sm">
            {data.tickets.map((x) => (
              <p key={x.id}>
                <a href={`/api/v1/exam-cell/hall-tickets/${x.id}/pdf`} className="font-medium text-accent-strong hover:underline">
                  {t("examCell.hallTicketNo", { number: x.number })}
                </a>{" "}
                · {x.sessionName}
              </p>
            ))}
            {data.seating.map((s) => (
              <p key={`${s.courseCode}-${s.at}`}>
                {s.courseCode} {s.courseName} · {when(s.at, locale)} · {s.roomName} · {t("examCell.seatNo", { seat: s.seatNo })}
              </p>
            ))}
          </CardBody>
        </Card>
      ) : null}

      {data.results.length > 0 ? (
        <Card>
          <CardHeader title={t("examCell.standingTitle")} description={t("examCell.standingLine", { cgpa: data.cgpa?.toFixed(2) ?? "—", credits: data.creditsEarned })} />
        </Card>
      ) : null}
      {data.results.map((r) => (
        <TermResultCard
          key={r.sessionId}
          result={r.result}
          t={t}
          title={[r.sessionName, t("examCell.publishedOn", { date: day(r.publishedAt, locale) }), r.underCorrection.length ? t("examCell.underCorrection") : null].filter(Boolean).join(" · ")}
          note={
            // A revaluation changed marks the published result does not carry yet (A3-journeys-11).
            r.underCorrection.length ? t("examCell.underCorrectionNote", { courses: r.result.courses.filter((c) => r.underCorrection.includes(c.courseId)).map((c) => c.code).join(", ") }) : undefined
          }
          actions={
            act && r.revaluationOpenUntil
              ? (courseId) => (
                  <div className="flex gap-1">
                    {(["PHOTOCOPY", "REVAL"] as const).map((kind) => (
                      <ActionForm key={kind} action={askRevaluationAction}>
                        <Hidden fields={{ sessionId: r.sessionId, courseId, kind, back }} />
                        <Button type="submit" size="sm" variant="ghost">
                          {t(REVAL_KIND_KEY[kind]!)}
                        </Button>
                      </ActionForm>
                    ))}
                  </div>
                )
              : undefined
          }
        />
      ))}

      {data.documents.length > 0 ? (
        <Card>
          <CardHeader title={t("examCell.documentsTitle")} />
          <CardBody className="space-y-1 text-sm">
            {data.documents.map((d) => (
              <p key={d.id}>
                <a href={`/api/v1/exam-cell/documents/${d.id}/pdf`} className="font-medium text-accent-strong hover:underline">
                  {t(DOC_KIND_KEY[d.kind]!)}
                </a>{" "}
                · {d.serial} · {day(d.issuedAt, locale)}
              </p>
            ))}
          </CardBody>
        </Card>
      ) : null}

      {data.revaluations.length > 0 ? (
        <Card>
          <CardHeader title={t("examCell.revaluationsTitle")} />
          <CardBody className="space-y-1 text-sm">
            {data.revaluations.map((r) => (
              <p key={r.id}>
                {r.courseCode} · {t(REVAL_KIND_KEY[r.kind]!)} · {r.correction ? t("examCell.underCorrection") : r.outcome ? t(REVAL_OUTCOME_KEY[r.outcome]!) : t("examCell.waitingDecision")}
              </p>
            ))}
          </CardBody>
        </Card>
      ) : null}

      {data.backlogs.length > 0 ? (
        <Card>
          <CardHeader title={t("examCell.backlogsTitle")} />
          <CardBody className="space-y-1 text-sm">
            {data.backlogs.map((b) => (
              <p key={b.id}>
                {b.courseCode} {b.courseName} · {t(BACKLOG_STATUS_KEY[b.status]!)} · {t("examCell.lastDay", { date: isoToDisplayDate(b.lastDay) })}
              </p>
            ))}
          </CardBody>
        </Card>
      ) : null}

      {data.credits.length > 0 ? (
        <Card>
          <CardHeader title={t("examCell.creditStatement")} />
          <CardBody className="space-y-1 text-sm">
            {data.credits.map((c) => (
              <p key={c.id}>
                {c.termName} · {t("examCell.creditsN", { count: c.credits })} · {t(CREDIT_STATUS_KEY[c.status]!)} {c.abcRef ?? ""}
              </p>
            ))}
          </CardBody>
        </Card>
      ) : null}
    </div>
  );
}
