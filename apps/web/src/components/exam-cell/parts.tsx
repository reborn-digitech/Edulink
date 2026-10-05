import type { ReactNode } from "react";
import { CheckCircleIcon, WarningIcon } from "@phosphor-icons/react/ssr";
import { formatPaise, type Locale } from "@edulink/i18n";
import type { TermResultView } from "@edulink/contracts";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { TabBar } from "@/components/ui/tabs";
import { ModuleOff } from "@/components/module-off";
import { formatInZone } from "@/lib/dates";
import type { Translate, TranslationKey } from "@/lib/i18n/dictionary";

/**
 * The exam cell's shared pieces (module EXAMS, 4 Oct 2026): the message a form
 * came back with, the session's frame and tabs, the words for each coded
 * status, and a term's result table that the controller's, the student's
 * and the guardian's pages all draw. Every button is a form posting to
 * app/(app)/exam-cell/actions.ts with `back`.
 */

export const SESSION_STATUS_KEY: Record<string, TranslationKey> = {
  DRAFT: "examCell.statusDRAFT",
  FORMS: "examCell.statusFORMS",
  CONDUCT: "examCell.statusCONDUCT",
  ASSESSMENT: "examCell.statusASSESSMENT",
  PUBLISHED: "examCell.statusPUBLISHED",
  CLOSED: "examCell.statusCLOSED",
};
export const FORM_STATUS_KEY: Record<string, TranslationKey> = { DRAFT: "examCell.formDRAFT", SUBMITTED: "examCell.formSUBMITTED", APPROVED: "examCell.formAPPROVED", REFUSED: "examCell.formREFUSED" };
export const COURSE_STATUS_KEY: Record<string, TranslationKey> = { PASS: "examCell.resultPASS", FAIL: "examCell.resultFAIL", ATKT: "examCell.resultATKT", ABSENT: "examCell.resultABSENT" };
export const TERM_STATUS_KEY: Record<string, TranslationKey> = { PASS: "examCell.resultPASS", ATKT: "examCell.resultATKT", FAIL: "examCell.resultFAIL" };
export const CLASS_KEY: Record<string, TranslationKey> = { DISTINCTION: "examCell.classDISTINCTION", FIRST: "examCell.classFIRST", HIGHER_SECOND: "examCell.classHIGHER_SECOND", SECOND: "examCell.classSECOND", PASS: "examCell.classPASS" };
export const RUN_STATUS_KEY: Record<string, TranslationKey> = { DRAFT: "examCell.runDRAFT", PUBLISHED: "examCell.runPUBLISHED", SUPERSEDED: "examCell.runSUPERSEDED" };
export const KIND_KEY: Record<string, TranslationKey> = { REGULAR: "examCell.kindREGULAR", SUPPLEMENTARY: "examCell.kindSUPPLEMENTARY", BACKLOG: "examCell.kindBACKLOG" };
export const DUTY_STATUS_KEY: Record<string, TranslationKey> = { ASSIGNED: "examCell.dutyASSIGNED", SWAPPED: "examCell.dutySWAPPED", DONE: "examCell.dutyDONE" };
export const MALPRACTICE_KEY: Record<string, TranslationKey> = { NO_ACTION: "examCell.decisionNO_ACTION", WARNING: "examCell.decisionWARNING", CANCEL_PAPER: "examCell.decisionCANCEL_PAPER", CANCEL_SESSION: "examCell.decisionCANCEL_SESSION", DEBAR_NEXT: "examCell.decisionDEBAR_NEXT" };
export const REMUNERATION_KEY: Record<string, TranslationKey> = { SETTER: "examCell.payKindSETTER", MODERATOR: "examCell.payKindMODERATOR", INVIGILATOR: "examCell.payKindINVIGILATOR", ASSESSOR: "examCell.payKindASSESSOR" };
export const REVAL_KIND_KEY: Record<string, TranslationKey> = { PHOTOCOPY: "examCell.revalPHOTOCOPY", REVAL: "examCell.revalREVAL" };
export const REVAL_OUTCOME_KEY: Record<string, TranslationKey> = { PROVIDED: "examCell.outcomePROVIDED", UNCHANGED: "examCell.outcomeUNCHANGED", CHANGED: "examCell.outcomeCHANGED" };
export const BACKLOG_STATUS_KEY: Record<string, TranslationKey> = { OPEN: "examCell.backlogOPEN", CLEARED: "examCell.backlogCLEARED", LAPSED: "examCell.backlogLAPSED" };
export const CREDIT_STATUS_KEY: Record<string, TranslationKey> = { PENDING: "examCell.creditPENDING", SENT: "examCell.creditSENT", FAILED: "examCell.creditFAILED" };
export const DOC_KIND_KEY: Record<string, TranslationKey> = { GRADE_CARD: "examCell.docGradeCard", TRANSCRIPT: "examCell.docTranscript", DEGREE: "examCell.docDegree" };
export const PAPER_STATUS_KEY: Record<string, TranslationKey> = { ASSIGNED: "examCell.paperASSIGNED", SUBMITTED: "examCell.paperSUBMITTED", MODERATED: "examCell.paperMODERATED" };
export const GRACE_STATUS_KEY: Record<string, TranslationKey> = { PROPOSED: "examCell.gracePROPOSED", APPROVED: "examCell.graceAPPROVED", REFUSED: "examCell.graceREFUSED" };

export const money = (paise: number, locale: string) => formatPaise(paise, locale as Locale);
export const when = (iso: string | null, locale: string) => (iso ? formatInZone(new Date(iso), "Asia/Kolkata", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" }, locale) : "—");
export const day = (iso: string | null, locale: string) => (iso ? formatInZone(new Date(iso), "Asia/Kolkata", { day: "numeric", month: "short", year: "numeric" }, locale) : "—");
/** Thousandths as marks: 45500 → "45.5". */
export const marks = (milli: number | null | undefined) => (milli === null || milli === undefined ? "—" : String(Math.round(milli) / 1000));
/** An instant as the value of a datetime-local field, on the college's clock (IST). */
export const localInput = (iso: string | null) => (iso ? new Date(new Date(iso).getTime() + 330 * 60_000).toISOString().slice(0, 16) : "");

/** What the last form said: done (green) or refused (red). */
export function Flash({ ok, error }: { ok?: string; error?: string }) {
  if (!ok && !error) return null;
  return (
    <Card role={error ? "alert" : "status"}>
      <CardBody className={`flex items-center gap-2 pt-5 text-sm ${error ? "text-danger" : "text-ok"}`}>
        {error ? <WarningIcon weight="fill" className="size-4 shrink-0" aria-hidden /> : <CheckCircleIcon weight="fill" className="size-4 shrink-0" aria-hidden />}
        {error ?? ok}
      </CardBody>
    </Card>
  );
}

export function Hidden({ fields }: { fields: Record<string, string | undefined> }) {
  return (
    <>
      {Object.entries(fields).map(([name, value]) => (value === undefined ? null : <input key={name} type="hidden" name={name} value={value} />))}
    </>
  );
}

export const labelClass = "block text-sm font-medium text-fg";

/** A labelled field: the label above whatever control is given. */
export function Labelled({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <label className={`block space-y-1.5 ${className ?? ""}`}>
      <span className={labelClass}>{label}</span>
      {children}
    </label>
  );
}

/** A session's frame: its header, tabs to its parts, the flash, or ModuleOff. */
export function SessionFrame({ t, session, current, autonomous, ok, error, children }: { t: Translate; session: { id: string; name: string; status: string; termName: string }; current: "forms" | "logistics" | "marks" | "results" | "conduct"; autonomous: boolean; ok?: string; error?: string; children: ReactNode }) {
  const base = `/exam-cell/sessions/${session.id}`;
  const tabs = [
    { key: "forms", href: base, label: t("examCell.tabForms") },
    { key: "logistics", href: `${base}/logistics`, label: t("examCell.tabLogistics") },
    { key: "marks", href: `${base}/marks`, label: t("examCell.tabMarks") },
    { key: "results", href: `${base}/results`, label: t("examCell.tabResults") },
    ...(autonomous ? [{ key: "conduct", href: `${base}/conduct`, label: t("examCell.tabConduct") }] : []),
  ];
  return (
    <div className="space-y-5">
      <PageHeader title={session.name} description={t("examCell.sessionIntro", { term: session.termName })} meta={<Badge tone="accent">{t(SESSION_STATUS_KEY[session.status] ?? "examCell.statusDRAFT")}</Badge>} back={{ href: "/exam-cell", label: t("examCell.title") }} />
      <TabBar ariaLabel={t("examCell.sessionNav")} current={current} tabs={tabs} />
      <Flash ok={ok} error={error} />
      {children}
    </div>
  );
}

export function CellOff({ t, college }: { t: Translate; college: boolean }) {
  return (
    <div className="space-y-5">
      <PageHeader title={t("examCell.title")} />
      <ModuleOff module="EXAMS" t={t} college={college} />
    </div>
  );
}

/** One term's result: each course's grade and points, then the SGPA, credits, standing and class. */
export function TermResultCard({ result, t, title, actions, note }: { result: TermResultView; t: Translate; title: string; actions?: (courseId: string) => ReactNode; note?: string }) {
  return (
    <Card>
      <CardHeader title={title} description={[[t("examCell.sgpaLabel"), result.sgpa?.toFixed(2) ?? "—"].join(" "), t("examCell.creditsOf", { earned: result.creditsEarned, of: result.creditsAttempted }), t(TERM_STATUS_KEY[result.status]!), result.cls ? t(CLASS_KEY[result.cls]!) : null].filter(Boolean).join(" · ")} />
      {note ? (
        <p role="status" className="mx-5 mb-3 rounded-[var(--radius-md)] bg-warn-soft p-3 text-sm text-warn">
          {note}
        </p>
      ) : null}
      <CardBody className="relative overflow-x-auto p-0" tabIndex={0} role="group">
        <table className="w-full text-sm">
          <thead className="bg-surface-muted text-left text-xs text-fg-muted">
            <tr>
              <th className="px-4 py-2 font-medium">{t("examCell.colCourse")}</th>
              <th className="px-3 py-2 font-medium">{t("examCell.colCredits")}</th>
              <th className="px-3 py-2 font-medium">{t("examCell.colInternal")}</th>
              <th className="px-3 py-2 font-medium">{t("examCell.colExternal")}</th>
              <th className="px-3 py-2 font-medium">{t("examCell.colTotal")}</th>
              <th className="px-3 py-2 font-medium">{t("examCell.colGrade")}</th>
              <th className="px-3 py-2 font-medium">{t("examCell.colResult")}</th>
              {actions ? <th className="px-3 py-2" /> : null}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {result.courses.map((c) => (
              <tr key={c.courseId}>
                <td className="px-4 py-2">
                  <span className="font-medium text-fg">{c.code}</span> <span className="text-fg-muted">{c.name}</span>
                </td>
                <td className="px-3 py-2 tabular-nums">{c.credits}</td>
                <td className="px-3 py-2 tabular-nums">{marks(c.internalMilli)}</td>
                <td className="px-3 py-2 tabular-nums">
                  {c.status === "ABSENT" ? t("examCell.absentShort") : marks(c.externalMilli)}
                  {c.graceMilli > 0 ? ` +${marks(c.graceMilli)}` : ""}
                </td>
                <td className="px-3 py-2 tabular-nums">
                  {marks(c.totalMilli)} / {marks(c.maxMilli)}
                </td>
                <td className="px-3 py-2 font-semibold">
                  {c.grade} <span className="font-normal text-fg-muted">({c.points})</span>
                </td>
                <td className="px-3 py-2">
                  <Badge tone={c.status === "PASS" ? "ok" : c.status === "ATKT" ? "warn" : "danger"}>{t(COURSE_STATUS_KEY[c.status]!)}</Badge>
                </td>
                {actions ? <td className="px-3 py-2">{actions(c.courseId)}</td> : null}
              </tr>
            ))}
          </tbody>
        </table>
      </CardBody>
    </Card>
  );
}
