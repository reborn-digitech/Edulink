import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircleIcon, FileTextIcon } from "@phosphor-icons/react/ssr";
import { isCollegeKind, REFUND_SLAB_SOURCE } from "@edulink/contracts";
import { requireRole } from "@/lib/tenancy";
import { institutionKindOf, isModuleOn } from "@/lib/modules";
import { getApplication } from "@/lib/college-admissions";
import { getLocale, getT } from "@/lib/i18n/server";
import { db } from "@/lib/db";
import type { TranslationKey } from "@/lib/i18n/dictionary";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SelectField, TextField } from "@/components/ui/field";
import { ModuleOff } from "@/components/module-off";
import { APP_STATUS_KEY, CATEGORY_KEY, DOC_KEY, Flash, Hidden, NotCollege, QUOTA_KEY, Table, money } from "@/components/college-office/parts";
import { admissionFeeAction, admitAction, cancelAdmissionAction, documentAction, offerAction, refundAction, supernumeraryAction, undertakingAction } from "../../../accounts/actions";
import { askRefundExceptionAction, decideRefundExceptionAction } from "../refunds/actions";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("collegeOffice.applicationTitle") };
}

/**
 * ONE COLLEGE APPLICATION (4 Oct 2026): the category's documents with their
 * files and scrutiny, the anti-ragging undertaking from the student and a
 * parent, the offer and the admission fee, the seat, and — when the seat is
 * given up — the refund the slab allows, recorded, then its bank reference.
 */
export default async function ApplicationPage({ params, searchParams }: { params: Promise<{ applicationId: string }>; searchParams: Promise<{ ok?: string; error?: string }> }) {
  const ctx = await requireRole("ADMIN", "PRINCIPAL", "ACCOUNTS");
  const [t, locale, kind] = await Promise.all([getT(), getLocale(), institutionKindOf(ctx.schoolId)]);
  const { applicationId } = await params;
  const sp = await searchParams;
  if (!isCollegeKind(kind ?? "SCHOOL")) return <NotCollege t={t} />;
  if (!(await isModuleOn(ctx.schoolId, "ADMISSIONS"))) return <ModuleOff page module="ADMISSIONS" t={t} college />;
  const a = await getApplication(ctx, applicationId);
  const programme = await db.programme.findFirst({ where: { id: a.programmeId, schoolId: ctx.schoolId }, select: { code: true, name: true } });
  const write = ctx.role === "ADMIN";
  // The accounts desk records the admission fee and the bank's refund reference, as its two doors permit (A3-inventory-3).
  const moneyDesk = ctx.role === "ADMIN" || ctx.role === "ACCOUNTS";
  const back = `/admin/college-admissions/${a.id}`;
  const open = a.status === "APPLIED" || a.status === "SCRUTINY" || a.status === "OFFERED";
  return (
    <div className="space-y-6">
      <PageHeader
        title={a.applicantName}
        description={t("collegeOffice.applicationLine", { round: a.roundName, number: a.number, programme: programme ? `${programme.code} · ${programme.name}` : "—", category: t(CATEGORY_KEY(a.category)), quota: t(QUOTA_KEY(a.quota)) })}
        actions={
          <Button asChild variant="secondary">
            <Link href={`/admin/college-admissions?round=${a.roundId}`}>{t("collegeOffice.backToRound")}</Link>
          </Button>
        }
      />
      <Flash ok={sp.ok} error={sp.error} />
      <Card>
        <CardBody className="flex flex-wrap items-center gap-3 pt-5">
          <Badge tone={a.status === "ADMITTED" ? "ok" : a.status === "CANCELLED" || a.status === "REFUNDED" ? "danger" : "warn"}>{t(APP_STATUS_KEY(a.status))}</Badge>
          {a.cetApplicationId ? <span className="text-sm text-fg-muted">{t("collegeOffice.colCetId")}: {a.cetApplicationId}</span> : null}
          {a.meritRank ? <span className="text-sm text-fg-muted">{t("collegeOffice.colMerit")}: {a.meritRank}</span> : null}
          {a.admittedMembershipId ? <span className="text-sm text-ok">{t("collegeOffice.admittedOn")}</span> : null}
          {a.supernumeraryAt ? <Badge tone="info">{t("collegeOffice.supernumeraryApproved", { reason: a.supernumeraryReason ?? "—" })}</Badge> : null}
        </CardBody>
      </Card>
      {ctx.role === "PRINCIPAL" && !a.supernumeraryAt && (open || a.status === "FEE_DUE") ? (
        <Card>
          <CardHeader title={t("collegeOffice.supernumeraryTitle")} description={t("collegeOffice.supernumeraryIntro")} />
          <CardBody>
            <form action={supernumeraryAction} className="flex flex-wrap items-end gap-3">
              <Hidden fields={{ back, applicationId: a.id }} />
              <TextField name="reason" required minLength={3} maxLength={300} label={t("collegeOffice.supernumeraryReason")} />
              <Button type="submit" variant="secondary">{t("collegeOffice.supernumeraryApprove")}</Button>
            </form>
          </CardBody>
        </Card>
      ) : null}
      <Card>
        <CardHeader icon={<FileTextIcon weight="duotone" className="size-5" />} title={t("collegeOffice.scrutinyTitle")} description={a.scrutinyComplete ? t("collegeOffice.scrutinyComplete") : t("collegeOffice.scrutinyIntro")} />
        <CardBody>
          <Table head={[t("collegeOffice.colDocument"), t("collegeOffice.colFile"), t("collegeOffice.colStatus"), ""]} testId="scrutiny">
            {a.documents.map((d) => (
              <tr key={d.doc} className="align-top">
                <td className="py-2 pr-3">{t(DOC_KEY(d.doc))}</td>
                <td className="py-2 pr-3">
                  {d.fileId ? (
                    <a className="text-accent-strong hover:underline" href={`/api/files/${d.fileId}`} target="_blank" rel="noreferrer">
                      {t("collegeOffice.openFile")}
                    </a>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="py-2 pr-3">
                  <Badge tone={d.status === "VERIFIED" ? "ok" : d.status === "REJECTED" ? "danger" : "warn"}>{t(`collegeOffice.scrutiny${d.status}` as TranslationKey)}</Badge>
                  {d.note ? <p className="mt-1 text-xs text-fg-muted">{d.note}</p> : null}
                </td>
                <td className="py-2">
                  {write && open ? (
                    <form action={documentAction} encType="multipart/form-data" className="flex flex-wrap items-end gap-2">
                      <Hidden fields={{ back, applicationId: a.id, doc: d.doc }} />
                      <label className="text-xs text-fg-muted">
                        {t("collegeOffice.attachScan")}
                        <input type="file" name="file" accept="image/png,image/jpeg,application/pdf" className="mt-1 block text-xs" />
                      </label>
                      <SelectField name="status" label={t("collegeOffice.colStatus")} defaultValue={d.status}>
                        <option value="PENDING">{t("collegeOffice.scrutinyPENDING")}</option>
                        <option value="VERIFIED">{t("collegeOffice.scrutinyVERIFIED")}</option>
                        <option value="REJECTED">{t("collegeOffice.scrutinyREJECTED")}</option>
                      </SelectField>
                      <TextField name="note" label={t("collegeOffice.note")} />
                      <Button type="submit" size="sm">{t("collegeOffice.save")}</Button>
                    </form>
                  ) : null}
                </td>
              </tr>
            ))}
          </Table>
        </CardBody>
      </Card>
      <Card>
        <CardHeader title={t("collegeOffice.undertakingTitle")} description={t("collegeOffice.undertakingIntro")} />
        <CardBody className="flex flex-wrap gap-3">
          {(["STUDENT", "PARENT"] as const).map((by) => {
            const at = by === "STUDENT" ? a.antiRaggingStudentAt : a.antiRaggingParentAt;
            return at ? (
              <span key={by} className="inline-flex items-center gap-1 text-sm text-ok">
                <CheckCircleIcon weight="fill" className="size-4" aria-hidden />
                {t(by === "STUDENT" ? "collegeOffice.undertakingStudentDone" : "collegeOffice.undertakingParentDone")}
              </span>
            ) : write ? (
              <form key={by} action={undertakingAction}>
                <Hidden fields={{ back, applicationId: a.id, by }} />
                <Button type="submit" size="sm" variant="secondary">{t(by === "STUDENT" ? "collegeOffice.undertakingStudent" : "collegeOffice.undertakingParent")}</Button>
              </form>
            ) : null;
          })}
        </CardBody>
      </Card>
      {ctx.role === "PRINCIPAL" && a.refundAsk?.status === "ASKED" ? (
        // A refund outside the slab waits for the head's word (5 Oct 2026, head-approvals.ts).
        <Card>
          <CardHeader title={t("collegeDesks.refundTitle")} description={t("collegeDesks.refundWaiting", { amount: money(a.refundAsk.paise, locale), slab: money(a.refundPaise ?? 0, locale) })} />
          <CardBody className="space-y-3">
            <p className="text-sm">{a.refundAsk.reason}</p>
            <form action={decideRefundExceptionAction} className="flex flex-wrap items-end gap-2">
              <Hidden fields={{ back, applicationId: a.id }} />
              <TextField name="note" maxLength={600} label={t("collegeDesks.decisionNote")} />
              <Button type="submit" size="sm" name="decision" value="APPROVE">{t("collegeDesks.approve")}</Button>
              <Button type="submit" size="sm" variant="secondary" name="decision" value="REFUSE">{t("collegeDesks.refuse")}</Button>
            </form>
          </CardBody>
        </Card>
      ) : null}
      {moneyDesk ? (
        <Card>
          <CardHeader title={t("collegeOffice.seatTitle")} />
          <CardBody className="space-y-4">
            {write && open ? (
              <form action={offerAction}>
                <Hidden fields={{ back, applicationId: a.id }} />
                <Button type="submit" disabled={!a.scrutinyComplete || !a.antiRaggingStudentAt || !a.antiRaggingParentAt}>{t("collegeOffice.offer")}</Button>
                <p className="mt-1 text-xs text-fg-muted">{t("collegeOffice.offerHint")}</p>
              </form>
            ) : null}
            {a.status === "FEE_DUE" && !a.admissionFeePaidAt ? (
              <form action={admissionFeeAction} className="flex flex-wrap items-end gap-3">
                <Hidden fields={{ back, applicationId: a.id }} />
                <TextField name="amount" inputMode="decimal" required label={t("collegeOffice.amount")} defaultValue={a.admissionFeePaise ? (a.admissionFeePaise / 100).toFixed(2) : ""} hint={a.admissionFeePaise ? t("collegeOffice.feeAsked", { amount: money(a.admissionFeePaise, locale) }) : undefined} />
                <SelectField name="method" required label={t("collegeOffice.method")}>
                  <option value="BANK">{t("collegeOffice.methodBANK")}</option>
                  <option value="UPI">{t("collegeOffice.methodUPI")}</option>
                  <option value="CHEQUE">{t("collegeOffice.methodCHEQUE")}</option>
                  <option value="CASH">{t("collegeOffice.methodCASH")}</option>
                </SelectField>
                <TextField name="reference" required minLength={3} label={t("collegeOffice.bankReference")} />
                <Button type="submit" variant="secondary">{t("collegeOffice.recordFee")}</Button>
              </form>
            ) : null}
            {write && a.status === "FEE_DUE" && (a.admissionFeePaidAt || !a.admissionFeePaise) ? (
              <form action={admitAction} className="flex flex-wrap items-end gap-3">
                <Hidden fields={{ back, applicationId: a.id }} />
                <TextField name="prn" label={t("collegeOffice.prn")} />
                <TextField name="apaarId" inputMode="numeric" pattern="\d{12}" label={t("collegeOffice.apaar")} />
                <TextField name="abcId" inputMode="numeric" pattern="\d{12}" label={t("collegeOffice.abc")} />
                <Button type="submit">{t("collegeOffice.admit")}</Button>
              </form>
            ) : null}
            {write && a.status !== "CANCELLED" && a.status !== "REFUNDED" ? (
              <details>
                <summary className="cursor-pointer text-sm text-danger">{t("collegeOffice.cancelSeat")}</summary>
                <form action={cancelAdmissionAction} className="mt-2 flex flex-wrap items-end gap-3">
                  <Hidden fields={{ back, applicationId: a.id }} />
                  <TextField name="reason" required minLength={3} label={t("collegeOffice.colReason")} />
                  <TextField name="lastDateKey" type="date" required label={t("collegeOffice.lastDate")} hint={t("collegeOffice.slabSource", { title: REFUND_SLAB_SOURCE.title, dated: REFUND_SLAB_SOURCE.dated })} />
                  <Button type="submit" variant="danger">{t("collegeOffice.cancelSeat")}</Button>
                </form>
              </details>
            ) : null}
            {a.status === "CANCELLED" ? (
              <div className="space-y-2">
                <p className="text-sm">{t("collegeOffice.refundLine", { amount: money(a.refundPaise ?? 0, locale), slab: t(`collegeOffice.slab${a.refundSlab ?? "NONE"}` as TranslationKey) })}</p>
                {/* A refund outside the slab (5 Oct 2026): the office asks the principal; the bank reference waits for the answer. */}
                {a.refundAsk ? (
                  <p className={`text-sm ${a.refundAsk.status === "ASKED" ? "text-warn" : "text-fg-muted"}`}>
                    {a.refundAsk.status === "ASKED"
                      ? t("collegeDesks.refundWaiting", { amount: money(a.refundAsk.paise, locale), slab: money(a.refundPaise ?? 0, locale) })
                      : a.refundAsk.status === "APPROVED"
                        ? t("collegeDesks.refundApprovedLine", { amount: money(a.refundAsk.paise, locale), slab: money(a.refundAsk.slabPaise ?? 0, locale) })
                        : t("collegeDesks.refundRefusedLine", { slab: money(a.refundPaise ?? 0, locale) })}
                  </p>
                ) : null}
                {write && (!a.refundAsk || a.refundAsk.status === "REFUSED") ? (
                  <details>
                    <summary className="cursor-pointer text-sm text-accent-strong">{t("collegeDesks.refundTitle")}</summary>
                    <p className="mt-2 text-sm text-fg-muted">{t("collegeDesks.refundIntro", { amount: money(a.refundPaise ?? 0, locale) })}</p>
                    <form action={askRefundExceptionAction} className="mt-2 flex flex-wrap items-end gap-3">
                      <Hidden fields={{ back, applicationId: a.id }} />
                      <TextField name="amount" required inputMode="decimal" label={t("collegeDesks.refundField")} />
                      <TextField name="reason" required minLength={10} maxLength={600} label={t("collegeDesks.refundReason")} />
                      <Button type="submit" variant="secondary">{t("collegeDesks.refundAskButton")}</Button>
                    </form>
                  </details>
                ) : null}

                <form action={refundAction} className="flex flex-wrap items-end gap-3">
                  <Hidden fields={{ back, applicationId: a.id }} />
                  <TextField name="reference" required minLength={3} label={t("collegeOffice.bankReference")} />
                  <Button type="submit" variant="secondary">{t("collegeOffice.recordRefund")}</Button>
                </form>
              </div>
            ) : null}
          </CardBody>
        </Card>
      ) : null}
    </div>
  );
}
