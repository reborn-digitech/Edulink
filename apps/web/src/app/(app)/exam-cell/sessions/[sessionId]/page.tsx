import type { Metadata } from "next";
import Link from "next/link";
import { requireRole } from "@/lib/tenancy";
import { institutionKindOf, isModuleOn } from "@/lib/modules";
import { isCollegeKind } from "@/lib/institution";
import { getLocale, getT } from "@/lib/i18n/server";
import { sessionView } from "@/lib/exam-cell";
import { termsOf } from "@/lib/exam-cell-academics";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CellOff, FORM_STATUS_KEY, Hidden, Labelled, SessionFrame, inputClass, localInput, money, when } from "@/components/exam-cell/parts";
import { decideFormAction, generateFormsAction, sessionStatusAction, submitFormAction, updateSessionAction } from "../../actions";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("examCell.tabForms"), robots: { index: false, follow: false } };
}

const NEXT: Record<string, "FORMS" | "CONDUCT" | "ASSESSMENT" | "CLOSED" | null> = { DRAFT: "FORMS", FORMS: "CONDUCT", CONDUCT: "ASSESSMENT", ASSESSMENT: null, PUBLISHED: "CLOSED", CLOSED: null };

/** A session's forms: generate them, decide each submitted one, move the session forward, export the list for the university. */
export default async function SessionFormsPage({ params, searchParams }: { params: Promise<{ sessionId: string }>; searchParams: Promise<{ ok?: string; error?: string }> }) {
  const ctx = await requireRole("EXAM_CONTROLLER", "ADMIN", "PRINCIPAL");
  const [t, locale, on, kind] = await Promise.all([getT(), getLocale(), isModuleOn(ctx.schoolId, "EXAMS"), institutionKindOf(ctx.schoolId)]);
  if (!on) return <CellOff t={t} college={isCollegeKind(kind)} />;
  const { sessionId } = await params;
  const { ok, error } = await searchParams;
  const [s, terms] = await Promise.all([sessionView(ctx, sessionId), termsOf(ctx.schoolId)]);
  const back = `/exam-cell/sessions/${s.id}`;
  const next = NEXT[s.status];
  const slab = s.lateFeeSlabs[0];
  return (
    <SessionFrame t={t} session={s} current="forms" autonomous={s.autonomous} ok={ok} error={error}>
      <Card>
        <CardHeader title={t("examCell.windowTitle")} description={t("examCell.windowLine", { opens: when(s.formOpensAt, locale), closes: when(s.formClosesAt, locale), course: money(s.feePerCoursePaise, locale), backlog: money(s.feePerBacklogPaise, locale) })} />
        {s.canWrite ? (
          <CardBody className="flex flex-wrap gap-2">
            {s.status === "DRAFT" || s.status === "FORMS" ? (
              <form action={generateFormsAction}>
                <Hidden fields={{ sessionId: s.id, back }} />
                <Button type="submit" variant="secondary">
                  {t("examCell.generateForms")}
                </Button>
              </form>
            ) : null}
            {next ? (
              <form action={sessionStatusAction}>
                <Hidden fields={{ sessionId: s.id, status: next, back }} />
                <Button type="submit">{t(`examCell.moveTo${next}` as const)}</Button>
              </form>
            ) : null}
            <Button asChild variant="ghost">
              <Link href={`/exam-cell/sessions/${s.id}/export?kind=forms`}>{t("examCell.exportForms")}</Link>
            </Button>
          </CardBody>
        ) : null}
      </Card>

      <Card>
        <CardHeader title={t("examCell.formsTitle")} description={t("examCell.formsCountLine", { count: s.forms.length })} />
        <CardBody className="p-0">
          {s.forms.length === 0 ? (
            <p className="px-5 pb-5 text-sm text-fg-muted">{t("examCell.noForms")}</p>
          ) : (
            <ul className="divide-y divide-border">
              {s.forms.map((f) => (
                <li key={f.id} className="space-y-2 px-5 py-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-medium text-fg">
                      {f.name} <span className="font-normal text-fg-muted">{f.code ?? ""}</span>
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      <Badge tone={f.status === "APPROVED" ? "ok" : f.status === "REFUSED" ? "danger" : f.status === "SUBMITTED" ? "accent" : "neutral"}>{t(FORM_STATUS_KEY[f.status]!)}</Badge>
                      {f.hallTicket ? <Badge tone="info">{f.hallTicket.number}</Badge> : null}
                      {f.lockedAt ? <Badge tone="outline">{t("examCell.locked")}</Badge> : null}
                    </div>
                  </div>
                  <p className="text-xs text-fg-muted">
                    {f.courses.map((c) => `${c.code}${c.kind === "BACKLOG" ? ` (${t("examCell.backlogShort")})` : ""}`).join(", ")}
                    {f.status !== "DRAFT" ? ` · ${t("examCell.feeLine", { fee: money(f.feePaise + f.lateFeePaise, locale) })}` : ""}
                    {f.demandStatus ? ` · ${t("examCell.demandStatus", { status: f.demandStatus })}` : ""}
                    {f.refusalReason ? ` · ${f.refusalReason}` : ""}
                    {f.waiverReason ? ` · ${t("examCell.waived", { reason: f.waiverReason })}` : ""}
                  </p>
                  {s.canWrite && f.status === "DRAFT" && s.status === "FORMS" ? (
                    <form action={submitFormAction}>
                      <Hidden fields={{ formId: f.id, back }} />
                      <Button type="submit" size="sm" variant="secondary">
                        {t("examCell.submitFor")}
                      </Button>
                    </form>
                  ) : null}
                  {s.canWrite && f.status === "SUBMITTED" && !f.lockedAt ? (
                    <form action={decideFormAction} className="flex flex-wrap items-end gap-2">
                      <Hidden fields={{ formId: f.id, back }} />
                      <Labelled label={t("examCell.reason")} className="min-w-48 flex-1">
                        <input name="reason" maxLength={300} className={inputClass} />
                      </Labelled>
                      <label className="flex min-h-11 items-center gap-2 text-sm">
                        <input type="checkbox" name="waiveFee" value="1" /> {t("examCell.waiveFee")}
                      </label>
                      <Button type="submit" size="sm" name="approve" value="1">
                        {t("examCell.approve")}
                      </Button>
                      <Button type="submit" size="sm" variant="secondary" name="approve" value="0">
                        {t("examCell.refuse")}
                      </Button>
                    </form>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>

      {s.canWrite && (s.status === "DRAFT" || s.status === "FORMS") ? (
        <Card>
          <CardHeader title={t("examCell.editSession")} />
          <CardBody>
            <form action={updateSessionAction} className="grid gap-4 sm:grid-cols-2">
              <Hidden fields={{ sessionId: s.id, back }} />
              <Labelled label={t("examCell.fieldName")}>
                <input name="name" required defaultValue={s.name} className={inputClass} />
              </Labelled>
              <Labelled label={t("examCell.fieldTerm")}>
                <select name="termId" defaultValue={s.termId} className={inputClass}>
                  {terms.map((x) => (
                    <option key={x.id} value={x.id}>
                      {x.name}
                    </option>
                  ))}
                </select>
              </Labelled>
              <Labelled label={t("examCell.fieldKind")}>
                <select name="kind" defaultValue={s.kind} className={inputClass}>
                  <option value="REGULAR">{t("examCell.kindREGULAR")}</option>
                  <option value="SUPPLEMENTARY">{t("examCell.kindSUPPLEMENTARY")}</option>
                </select>
              </Labelled>
              <input type="hidden" name="feeHeadId" value={s.feeHeadId ?? ""} />
              <Labelled label={t("examCell.fieldOpens")}>
                <input type="datetime-local" name="formOpensAt" defaultValue={localInput(s.formOpensAt)} className={inputClass} />
              </Labelled>
              <Labelled label={t("examCell.fieldCloses")}>
                <input type="datetime-local" name="formClosesAt" defaultValue={localInput(s.formClosesAt)} className={inputClass} />
              </Labelled>
              <Labelled label={t("examCell.fieldFeePerCourse")}>
                <input name="feePerCourse" defaultValue={String(s.feePerCoursePaise / 100)} className={inputClass} />
              </Labelled>
              <Labelled label={t("examCell.fieldFeePerBacklog")}>
                <input name="feePerBacklog" defaultValue={String(s.feePerBacklogPaise / 100)} className={inputClass} />
              </Labelled>
              <Labelled label={t("examCell.fieldPhotocopyFee")}>
                <input name="photocopyFee" defaultValue={String(s.photocopyFeePaise / 100)} className={inputClass} />
              </Labelled>
              <Labelled label={t("examCell.fieldRevalFee")}>
                <input name="revalFee" defaultValue={String(s.revalFeePaise / 100)} className={inputClass} />
              </Labelled>
              <Labelled label={t("examCell.fieldLateFrom")}>
                <input type="date" name="slabFrom1" defaultValue={slab?.fromDateKey ?? ""} className={inputClass} />
              </Labelled>
              <Labelled label={t("examCell.fieldLateFee")}>
                <input name="slabFee1" defaultValue={slab ? String(slab.paise / 100) : ""} className={inputClass} />
              </Labelled>
              <div className="sm:col-span-2">
                <Button type="submit">{t("examCell.saveSession")}</Button>
              </div>
            </form>
          </CardBody>
        </Card>
      ) : null}
    </SessionFrame>
  );
}
