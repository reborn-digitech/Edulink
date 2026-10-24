import { isoToDisplayDate } from "@/lib/dates";
import type { Metadata } from "next";
import Link from "next/link";
import { requireRole } from "@/lib/tenancy";
import { institutionKindOf, isModuleOn } from "@/lib/modules";
import { isCollegeKind } from "@/lib/institution";
import { getLocale, getT } from "@/lib/i18n/server";
import { afterView } from "@/lib/exam-cell-after";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BACKLOG_STATUS_KEY, CREDIT_STATUS_KEY, CellOff, DOC_KIND_KEY, Flash, Hidden, Labelled, REVAL_KIND_KEY, REVAL_OUTCOME_KEY, day, marks, money } from "@/components/exam-cell/parts";
import { convocationAction, decideRevaluationAction, issueDocumentAction, pushCreditsAction } from "../actions";
import { fieldClass } from "@/components/ui/field-class";
import { ActionForm } from "@/components/ui/action-form";
import { FEE_DEMAND_STATUS_KEY } from "@/app/(app)/parent/fees/labels";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("examCell.afterTitle"), robots: { index: false, follow: false } };
}

/**
 * After a result: photocopies and revaluations to decide (a changed mark is
 * a new version, and the next run carries it), the backlogs with their
 * limit, grade cards, transcripts and (autonomous) degrees to issue, the
 * credits waiting for the Academic Bank, the convocation.
 */
export default async function AfterPage({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const ctx = await requireRole("EXAM_CONTROLLER", "ADMIN", "PRINCIPAL");
  const [t, locale, on, kind] = await Promise.all([getT(), getLocale(), isModuleOn(ctx.schoolId, "EXAMS"), institutionKindOf(ctx.schoolId)]);
  if (!on) return <CellOff t={t} college={isCollegeKind(kind)} />;
  const { ok, error } = await searchParams;
  const a = await afterView(ctx);
  const back = "/exam-cell/after";
  const w = a.canWrite;
  return (
    <div className="space-y-5">
      <PageHeader title={t("examCell.afterTitle")} description={t("examCell.afterIntro")} back={{ href: "/exam-cell", label: t("examCell.title") }} />
      <Flash ok={ok} error={error} />

      <Card>
        <CardHeader title={t("examCell.revaluationsTitle")} />
        <CardBody className="space-y-3">
          {a.revaluations.length === 0 ? <p className="text-sm text-fg-muted">{t("examCell.noRevaluations")}</p> : null}
          {a.revaluations.map((r) => (
            <div key={r.id} className="space-y-2 rounded-[var(--radius-md)] border border-border p-3 text-sm">
              <p className="font-medium">
                {r.studentName} · {r.courseCode} · {t(REVAL_KIND_KEY[r.kind]!)} · {r.sessionName}
              </p>
              <p className="text-fg-muted">
                {t("examCell.askedOn", { date: day(r.askedAt, locale) })} · {money(r.feePaise, locale)}
                {r.demandStatus ? ` · ${t("examCell.demandStatus", { status: FEE_DEMAND_STATUS_KEY[r.demandStatus] ? t(FEE_DEMAND_STATUS_KEY[r.demandStatus]!) : r.demandStatus })}` : ""}
                {r.outcome ? ` · ${t(REVAL_OUTCOME_KEY[r.outcome]!)}` : ""}
                {r.outcome === "CHANGED" ? ` · ${marks(r.oldExternalMilli)} → ${marks(r.newExternalMilli)}` : ""}
              </p>
              {r.correction ? (
                // The changed mark reaches the result only through a run (A3-journeys-11).
                <p className="flex flex-wrap items-center gap-2">
                  <Badge tone="warn">{t(r.correction === "RUN_DUE" ? "examCell.correctionRunDue" : "examCell.correctionPublishDue")}</Badge>
                  <Link href={`/exam-cell/sessions/${r.sessionId}/results`} className="font-medium text-accent-strong hover:underline">
                    {t("examCell.openResults")}
                  </Link>
                </p>
              ) : null}
              {w && r.status === "ASKED" ? (
                <ActionForm action={decideRevaluationAction} className="flex flex-wrap items-end gap-2">
                  <Hidden fields={{ revaluationId: r.id, back }} />
                  <Labelled label={t("examCell.outcome")}>
                    <select name="outcome" className={fieldClass()}>
                      {(r.kind === "PHOTOCOPY" ? (["PROVIDED"] as const) : (["UNCHANGED", "CHANGED"] as const)).map((o) => (
                        <option key={o} value={o}>
                          {t(REVAL_OUTCOME_KEY[o]!)}
                        </option>
                      ))}
                    </select>
                  </Labelled>
                  {r.kind === "REVAL" ? (
                    <Labelled label={t("examCell.newMarks")}>
                      <input name="marks" inputMode="decimal" className={fieldClass("w-24")} />
                    </Labelled>
                  ) : null}
                  <Labelled label={t("examCell.note")}>
                    <input name="note" maxLength={300} className={fieldClass()} />
                  </Labelled>
                  <Button type="submit" size="sm">
                    {t("examCell.decide")}
                  </Button>
                </ActionForm>
              ) : null}
            </div>
          ))}
        </CardBody>
      </Card>

      <Card>
        <CardHeader title={t("examCell.backlogsTitle")} description={t("examCell.backlogsHint")} />
        <CardBody className="p-0">
          <ul className="divide-y divide-border">
            {a.backlogs.map((b) => (
              <li key={b.id} className="flex flex-wrap items-center justify-between gap-2 px-5 py-2 text-sm">
                <span>
                  {b.studentName} · {b.courseCode} {b.courseName} · {t("examCell.attempts", { count: b.attempts })} · {t("examCell.lastDay", { date: isoToDisplayDate(b.lastDay) })}
                </span>
                <Badge tone={b.status === "OPEN" ? "warn" : b.status === "CLEARED" ? "ok" : "danger"}>{t(BACKLOG_STATUS_KEY[b.status]!)}</Badge>
              </li>
            ))}
          </ul>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title={t("examCell.documentsTitle")} description={t("examCell.documentsHint")} />
        <CardBody className="space-y-3">
          {a.documents.map((d) => (
            <p key={d.id} className="text-sm">
              <a href={`/api/v1/exam-cell/documents/${d.id}/pdf`} className="font-medium text-accent-strong hover:underline">
                {d.serial}
              </a>{" "}
              · {t(DOC_KIND_KEY[d.kind]!)} · {d.studentName} · {day(d.issuedAt, locale)}
            </p>
          ))}
          {w ? (
            <ActionForm action={issueDocumentAction} className="flex flex-wrap items-end gap-2">
              <Hidden fields={{ back }} />
              <Labelled label={t("examCell.student")}>
                <select name="studentMembershipId" className={fieldClass()}>
                  {a.students.map((s) => (
                    <option key={s.membershipId} value={s.membershipId}>
                      {s.name} {s.code ?? ""}
                    </option>
                  ))}
                </select>
              </Labelled>
              <Labelled label={t("examCell.docKind")}>
                <select name="kind" className={fieldClass()}>
                  <option value="GRADE_CARD">{t("examCell.docGradeCard")}</option>
                  <option value="TRANSCRIPT">{t("examCell.docTranscript")}</option>
                  {a.autonomous ? <option value="DEGREE">{t("examCell.docDegree")}</option> : null}
                </select>
              </Labelled>
              <Button type="submit" size="sm">
                {t("examCell.issue")}
              </Button>
            </ActionForm>
          ) : null}
        </CardBody>
      </Card>

      <Card>
        <CardHeader title={t("examCell.creditsTitle")} description={a.abcConnected ? t("examCell.abcStub") : t("examCell.abcOff")} />
        <CardBody className="space-y-2">
          {a.credits.map((c) => (
            <p key={c.id} className="text-sm">
              {c.studentName} · {c.termName} · {t("examCell.creditsN", { count: c.credits })} · <Badge tone={c.status === "SENT" ? "ok" : c.status === "FAILED" ? "danger" : "neutral"}>{t(CREDIT_STATUS_KEY[c.status]!)}</Badge> {c.abcRef ?? ""}
            </p>
          ))}
          {w && a.abcConnected ? (
            <ActionForm action={pushCreditsAction}>
              <Hidden fields={{ back }} />
              <Button type="submit" size="sm" variant="secondary">
                {t("examCell.pushCredits")}
              </Button>
            </ActionForm>
          ) : null}
        </CardBody>
      </Card>

      {a.autonomous ? (
        <Card>
          <CardHeader title={t("examCell.convocationTitle")} />
          <CardBody className="space-y-2">
            {a.convocations.map((c) => (
              <p key={c.year} className="text-sm">
                {c.year} · {t("examCell.graduates", { count: c.graduates })} · {c.status === "FINAL" ? t("examCell.final") : t("examCell.draft")}
              </p>
            ))}
            {w ? (
              <ActionForm action={convocationAction} className="flex flex-wrap items-end gap-2">
                <Hidden fields={{ back }} />
                <Labelled label={t("examCell.year")}>
                  <input name="year" type="number" min={2000} max={2100} required className={fieldClass("w-28")} />
                </Labelled>
                <label className="flex min-h-11 items-center gap-2 text-sm">
                  <input type="checkbox" name="finalize" value="1" /> {t("examCell.finalize")}
                </label>
                <Button type="submit" size="sm">
                  {t("examCell.drawList")}
                </Button>
              </ActionForm>
            ) : null}
          </CardBody>
        </Card>
      ) : null}
    </div>
  );
}
