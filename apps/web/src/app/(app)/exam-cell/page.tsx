import type { Metadata } from "next";
import Link from "next/link";
import { ChartBarIcon, ClipboardTextIcon, ExamIcon, SealCheckIcon } from "@phosphor-icons/react/ssr";
import { requireRole } from "@/lib/tenancy";
import { institutionKindOf, isModuleOn } from "@/lib/modules";
import { isCollegeKind } from "@/lib/institution";
import { getLocale, getT } from "@/lib/i18n/server";
import { examCellHome } from "@/lib/exam-cell";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/states";
import { DateField } from "@/components/ui/field";
import { DateTimeField } from "@/components/ui/date-time-field";
import { FileField } from "@/components/ui/file-field";
import { CellOff, Flash, Hidden, Labelled, SESSION_STATUS_KEY, KIND_KEY, day, inputClass } from "@/components/exam-cell/parts";
import { createSessionAction, decideGraceAction, signatureAction } from "./actions";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("examCell.title"), robots: { index: false, follow: false } };
}

/**
 * THE EXAM CELL'S HOME (module EXAMS, 4 Oct 2026) — the EXAM_CONTROLLER's
 * home, and where the office and the principal read the cell (their NAV
 * entries). Not /exams, the school's marks page. The sessions, a new one,
 * the grace proposals the principal decides, the controller's signature for
 * the papers they issue, and the doors to after-results and analytics.
 */
export default async function ExamCellPage({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const ctx = await requireRole("EXAM_CONTROLLER", "ADMIN", "PRINCIPAL");
  const [t, locale, on, kind] = await Promise.all([getT(), getLocale(), isModuleOn(ctx.schoolId, "EXAMS"), institutionKindOf(ctx.schoolId)]);
  const { ok, error } = await searchParams;
  if (!on) return <CellOff t={t} college={isCollegeKind(kind)} />;
  const home = await examCellHome(ctx);
  return (
    <div className="space-y-5">
      <PageHeader
        title={t("examCell.title")}
        description={t(home.autonomous ? "examCell.introAutonomous" : "examCell.introAffiliated")}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="secondary" icon={<SealCheckIcon weight="duotone" className="size-5" />}>
              <Link href="/exam-cell/after">{t("examCell.afterTitle")}</Link>
            </Button>
            <Button asChild variant="secondary" icon={<ChartBarIcon weight="duotone" className="size-5" />}>
              <Link href="/exam-cell/analytics">{t("examCell.analyticsTitle")}</Link>
            </Button>
          </div>
        }
      />
      <Flash ok={ok} error={error} />

      {home.graceWaiting.length > 0 ? (
        <Card>
          <CardHeader title={t("examCell.graceWaitingTitle")} description={home.canApproveGrace ? t("examCell.graceWaitingHead") : t("examCell.graceWaitingOthers")} />
          <CardBody className="p-0">
            <ul className="divide-y divide-border">
              {home.graceWaiting.map((g) => (
                <li key={g.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
                  <div className="min-w-0 text-sm">
                    <p className="font-medium text-fg">{t("examCell.graceLine", { student: g.studentName, marks: g.marks, course: g.courseCode })}</p>
                    <p className="text-fg-muted">
                      {g.sessionName} · {t(g.rule === "TO_PASS" ? "examCell.ruleTO_PASS" : "examCell.ruleTO_CLASS")} · {g.reason}
                    </p>
                  </div>
                  {home.canApproveGrace ? (
                    <div className="flex gap-2">
                      <form action={decideGraceAction}>
                        <Hidden fields={{ graceId: g.id, approve: "1", back: "/exam-cell" }} />
                        <Button type="submit" size="sm">
                          {t("examCell.approve")}
                        </Button>
                      </form>
                      <form action={decideGraceAction}>
                        <Hidden fields={{ graceId: g.id, approve: "0", back: "/exam-cell" }} />
                        <Button type="submit" size="sm" variant="secondary">
                          {t("examCell.refuse")}
                        </Button>
                      </form>
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      ) : null}

      <Card>
        <CardHeader icon={<ExamIcon weight="duotone" className="size-5" />} title={t("examCell.sessionsTitle")} />
        <CardBody className="p-0">
          {home.sessions.length === 0 ? (
            <EmptyState icon={<ClipboardTextIcon weight="duotone" className="size-8" />} title={t("examCell.noSessions")} description={t("examCell.noSessionsBody")} />
          ) : (
            <ul className="divide-y divide-border">
              {home.sessions.map((s) => (
                <li key={s.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
                  <div className="min-w-0">
                    <Link href={`/exam-cell/sessions/${s.id}`} className="text-sm font-semibold text-accent-strong hover:underline">
                      {s.name}
                    </Link>
                    <p className="mt-0.5 text-xs text-fg-muted">
                      {s.termName} · {t(KIND_KEY[s.kind]!)} · {t("examCell.formsCount", { forms: s.forms, submitted: s.submitted, approved: s.approved })}
                      {s.publishedAt ? ` · ${t("examCell.publishedOn", { date: day(s.publishedAt, locale) })}` : ""}
                    </p>
                  </div>
                  <Badge tone={s.status === "PUBLISHED" ? "ok" : s.status === "FORMS" ? "accent" : "neutral"}>{t(SESSION_STATUS_KEY[s.status]!)}</Badge>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>

      {home.canWrite ? (
        <Card>
          <CardHeader title={t("examCell.newSession")} description={t("examCell.newSessionHint")} />
          <CardBody>
            {home.terms.length === 0 ? (
              <p className="text-sm text-fg-muted">{t("examCell.noTerms")}</p>
            ) : (
              <form action={createSessionAction} className="grid gap-4 sm:grid-cols-2">
                <Hidden fields={{ back: "/exam-cell" }} />
                <Labelled label={t("examCell.fieldName")}>
                  <input name="name" required minLength={2} maxLength={120} className={inputClass} />
                </Labelled>
                <Labelled label={t("examCell.fieldTerm")}>
                  <select name="termId" required className={inputClass}>
                    {home.terms.map((x) => (
                      <option key={x.id} value={x.id}>
                        {x.name}
                      </option>
                    ))}
                  </select>
                </Labelled>
                <Labelled label={t("examCell.fieldKind")}>
                  <select name="kind" className={inputClass}>
                    <option value="REGULAR">{t("examCell.kindREGULAR")}</option>
                    <option value="SUPPLEMENTARY">{t("examCell.kindSUPPLEMENTARY")}</option>
                  </select>
                </Labelled>
                <Labelled label={t("examCell.fieldFeeHead")}>
                  <select name="feeHeadId" className={inputClass}>
                    <option value="">{t("examCell.noFeeHead")}</option>
                    {home.feeHeads.map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.name}
                      </option>
                    ))}
                  </select>
                </Labelled>
                <DateTimeField label={t("examCell.fieldOpens")} name="formOpensAt" defaultTime="00:00" />
                <DateTimeField label={t("examCell.fieldCloses")} name="formClosesAt" defaultTime="23:59" />
                <Labelled label={t("examCell.fieldFeePerCourse")}>
                  <input name="feePerCourse" inputMode="decimal" className={inputClass} />
                </Labelled>
                <Labelled label={t("examCell.fieldFeePerBacklog")}>
                  <input name="feePerBacklog" inputMode="decimal" className={inputClass} />
                </Labelled>
                <Labelled label={t("examCell.fieldPhotocopyFee")}>
                  <input name="photocopyFee" inputMode="decimal" className={inputClass} />
                </Labelled>
                <Labelled label={t("examCell.fieldRevalFee")}>
                  <input name="revalFee" inputMode="decimal" className={inputClass} />
                </Labelled>
                <DateField label={t("examCell.fieldLateFrom")} name="slabFrom1" />
                <Labelled label={t("examCell.fieldLateFee")}>
                  <input name="slabFee1" inputMode="decimal" className={inputClass} />
                </Labelled>
                <div className="sm:col-span-2">
                  <Button type="submit">{t("examCell.createSession")}</Button>
                </div>
              </form>
            )}
          </CardBody>
        </Card>
      ) : null}

      {home.canWrite ? (
        <Card>
          <CardHeader title={t("examCell.signatureTitle")} description={home.signatureSet ? t("examCell.signatureSet") : t("examCell.signatureNone")} />
          <CardBody>
            <form action={signatureAction} className="flex flex-wrap items-end gap-3">
              <Hidden fields={{ back: "/exam-cell" }} />
              <FileField label={t("examCell.signatureFile")} name="image" accept="image/png" required />
              <Button type="submit" variant="secondary">
                {t("examCell.signatureSave")}
              </Button>
            </form>
          </CardBody>
        </Card>
      ) : null}
    </div>
  );
}
