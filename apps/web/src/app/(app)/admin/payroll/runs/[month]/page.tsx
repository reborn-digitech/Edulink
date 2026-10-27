import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircleIcon, DownloadSimpleIcon, FilePdfIcon, LockIcon, QrCodeIcon, WarningIcon } from "@phosphor-icons/react/ssr";
import { formatPaise } from "@edulink/i18n";
import { PAYMENT_MODES, PAYROLL_EXPORT_KINDS, PAYROLL_EXPORT_SLUG, type PayslipView } from "@edulink/contracts";
import { ActionForm } from "@/components/ui/action-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader, StatTile } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/states";
import { ModuleOff } from "@/components/module-off";
import { ModuleFlash, LINK, NUM, TD, TH } from "@/components/module-flash";
import { PageHeader } from "@/components/ui/page-header";
import { AccessError } from "@/lib/access-error";
import { RuleRefusal } from "@/lib/rule-refusal";
import { runView } from "@/lib/payroll";
import { todayKey } from "@/lib/dates";
import { FILE_HEADINGS } from "@/lib/module-file-headings";
import { db } from "@/lib/db";
import { CODE_LABEL_KEY } from "@/lib/payroll-rules";
import { formatInZone } from "@/lib/dates";
import { getT } from "@/lib/i18n/server";
import type { TranslationKey } from "@/lib/i18n/dictionary";
import { monthName, payrollGate } from "../../shared";
import { bankBatchAction, draftRunAction, editSlipAction, lockRunAction, recordPaymentAction, shareRunAction, utrSheetAction, voidPaymentAction } from "../../actions";
import { fieldClass } from "@/components/ui/field-class";
import { SelectField, TextAreaField, TextField } from "@/components/ui/field";
import type { Translate } from "@/lib/i18n/dictionary";
import { TableScroll } from "@/components/ui/table-scroll";

export async function generateMetadata({ params }: { params: Promise<{ month: string }> }): Promise<Metadata> {
  return { title: `${(await params).month} · ${(await getT())("payroll.title")}` };
}

/**
 * One month's run. While a DRAFT the office reviews each slip (arrears,
 * the month's TDS, its own loss-of-pay figure, a note), draws it afresh
 * from the register, and locks it; once LOCKED the files are cut from it.
 * The head sees the totals, and the slips once the admin shares the run.
 *
 * PAYMENTS (owner-batch-item2b, 27 October 2026). Once locked the school
 * pays outside the app and records each slip here: one form per slip, the
 * bank slips together after the bank advice (a UTR each, one date), or the
 * UTR sheet the bank or the UPI app gives back; an unpaid UPI slip opens the
 * pay-from-your-app page. Those forms are <ActionForm>s: a refusal (a sheet's
 * refused lines, each with why) answers in place, what was typed kept. The run is PAID when the last slip is recorded.
 */
export default async function PayrollRunPage({ params, searchParams }: { params: Promise<{ month: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { ctx, t, locale, on, canEdit } = await payrollGate();
  if (!on) return <ModuleOff page module="PAYROLL" t={t} />;
  const { month } = await params;
  const sp = await searchParams;
  let run;
  try {
    run = await runView(ctx, month);
  } catch (error) {
    // A month that is not YYYY-MM ("zz-nope") is a RuleRefusal 422 from runView: the URL names no run, so 404 (A3-states-2).
    if (error instanceof AccessError || error instanceof RuleRefusal) notFound();
    throw error;
  }
  const money = (p: number) => formatPaise(p, locale, { always: true });
  const locked = run.status !== "DRAFT";
  const school = canEdit && locked ? await db.school.findUnique({ where: { id: ctx.schoolId }, select: { timezone: true } }) : null;
  const today = todayKey(school?.timezone ?? "Asia/Kolkata");
  const day = (key: string) => formatInZone(new Date(`${key}T12:00:00Z`), "UTC", { day: "numeric", month: "short", year: "numeric" }, locale);
  const unpaidBank = locked && run.slips ? run.slips.filter((s) => s.paymentMode === "BANK" && s.netPaise > 0 && !s.payment) : [];
  const adviceCut = run.exports.some((e) => e.kind === "BANK_ADVICE");
  const label = (code: string, l: string) => l || t(CODE_LABEL_KEY[code as keyof typeof CODE_LABEL_KEY] as TranslationKey);
  return (
    <div className="space-y-6">
      <PageHeader
        title={t("payroll.runTitle", { month: monthName(run.month, locale) })}
        description={<Link className={LINK} href="/admin/payroll">{t("payroll.backToPayroll")}</Link>}
        meta={<Badge tone={locked ? "ok" : "warn"}>{t(`payroll.status${run.status}`)}</Badge>}
      />
      <ModuleFlash t={t} params={sp} />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <StatTile label={t("payroll.colPeople")} value={run.totals.headcount} />
        <StatTile label={t("payroll.colGross")} value={formatPaise(run.totals.grossPaise, locale)} />
        <StatTile label={t("payroll.colDeductions")} value={formatPaise(run.totals.deductionsPaise, locale)} />
        <StatTile label={t("payroll.colNet")} value={formatPaise(run.totals.netPaise, locale)} tone="accent" />
        <StatTile label={t("payroll.colEmployer")} value={formatPaise(run.totals.employerPaise, locale)} />
      </div>
      {locked && run.lockedAt ? (
        <p className="flex items-center gap-2 text-sm text-fg-muted">
          <LockIcon className="size-4" aria-hidden="true" />
          {t("payroll.lockedBy", { name: run.lockedByName ?? "", date: formatInZone(new Date(run.lockedAt), "Asia/Kolkata", { day: "numeric", month: "short", year: "numeric" }, locale) })}
        </p>
      ) : null}

      {canEdit ? (
        <Card>
          <CardHeader title={locked ? t("payroll.filesTitle") : t("payroll.reviewTitle")} description={locked ? t("payroll.filesBody") : t("payroll.reviewBody")} />
          <CardBody className="space-y-4">
            {locked ? (
              <ul className="flex flex-wrap gap-3 text-sm">
                {PAYROLL_EXPORT_KINDS.map((k) => (
                  <li key={k}>
                    <a className={`${LINK} inline-flex items-center gap-1`} href={`/admin/payroll/runs/${run.month}/export/${PAYROLL_EXPORT_SLUG[k]}`}>
                      <DownloadSimpleIcon className="size-4" aria-hidden="true" />
                      {t(`payroll.export${k}`)}
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex flex-wrap items-end gap-4">
                <form action={draftRunAction}>
                  <input type="hidden" name="month" value={run.month} />
                  <Button type="submit" variant="secondary">{t("payroll.redraw")}</Button>
                </form>
                <form action={lockRunAction} className="flex flex-wrap items-center gap-3">
                  <input type="hidden" name="month" value={run.month} />
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" name="confirm" className="size-4" required />
                    {t("payroll.lockConfirm")}
                  </label>
                  <Button type="submit" icon={<LockIcon weight="bold" />}>{t("payroll.lock")}</Button>
                </form>
              </div>
            )}
            <form action={shareRunAction} className="flex flex-wrap items-center gap-3 text-sm">
              <input type="hidden" name="month" value={run.month} />
              <input type="hidden" name="shared" value={run.sharedWithPrincipal ? "0" : "1"} />
              <span className="text-fg-muted">{run.sharedWithPrincipal ? t("payroll.sharedYes") : t("payroll.sharedNo")}</span>
              <Button type="submit" size="sm" variant="ghost">{run.sharedWithPrincipal ? t("payroll.unshare") : t("payroll.share")}</Button>
            </form>
            {run.exports.length ? (
              <ul className="text-xs text-fg-muted">
                {run.exports.slice(0, 10).map((e, i) => (
                  <li key={i}>{t("payroll.exportLine", { file: e.fileName, rows: e.rows, by: e.byName, date: formatInZone(new Date(e.createdAt), "Asia/Kolkata", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }, locale) })}</li>
                ))}
              </ul>
            ) : null}
            {run.missingSalary.length ? (
              <p className="flex items-start gap-2 rounded-[var(--radius-md)] border border-warn/40 bg-warn-soft px-3 py-2 text-sm text-warn">
                <WarningIcon weight="fill" className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                <span>
                  {t("payroll.missingSalary", { names: run.missingSalary.map((m) => m.name).join(", ") })}{" "}
                  <Link className={LINK} href="/admin/payroll/salaries">{t("payroll.tabSalaries")}</Link>
                </span>
              </p>
            ) : null}
          </CardBody>
        </Card>
      ) : null}

      {canEdit && locked && run.payments ? (
        <Card>
          <CardHeader title={t("salaryPay.paymentsTitle")} description={t("salaryPay.paymentsBody")} />
          <CardBody className="space-y-5">
            <p className="flex items-center gap-2 text-sm">
              {run.status === "PAID" ? <CheckCircleIcon weight="fill" className="size-4 text-ok" aria-hidden="true" /> : null}
              {run.status === "PAID" && run.paidAt
                ? t("salaryPay.runPaid", { date: formatInZone(new Date(run.paidAt), "Asia/Kolkata", { day: "numeric", month: "short", year: "numeric" }, locale) })
                : t("salaryPay.paymentsCount", { paid: run.payments.paid, due: run.payments.due, amount: money(run.payments.paidPaise) })}
            </p>
            {unpaidBank.length ? (
              <section aria-labelledby="bank-batch" className="space-y-2">
                <h2 id="bank-batch" className="text-sm font-semibold text-fg">{t("salaryPay.bankBatchTitle")}</h2>
                {adviceCut ? (
                  <ActionForm action={bankBatchAction} className="space-y-3">
                    <p className="text-sm text-fg-muted">{t("salaryPay.bankBatchBody")}</p>
                    <input type="hidden" name="month" value={run.month} />
                    <TextField label={t("salaryPay.fieldPaidOn")} name="paidOn" type="date" required defaultValue={today} min={`${run.month}-01`} max={today} className="max-w-xs" />
                    <div className="grid gap-3 sm:grid-cols-2">
                      {unpaidBank.map((s, i) => (
                        <div key={s.membershipId}>
                          <input type="hidden" name={`ref:${i}`} value={s.slipRef} />
                          <TextField label={t("salaryPay.bankBatchUtr", { name: s.name, ref: s.slipRef })} name={`utr:${i}`} maxLength={22} autoComplete="off" hint={money(s.netPaise)} />
                        </div>
                      ))}
                    </div>
                    <Button type="submit" size="sm">{t("salaryPay.bankBatchButton")}</Button>
                  </ActionForm>
                ) : (
                  <p className="text-sm text-fg-muted">{t("salaryPay.bankBatchNeedsAdvice")}</p>
                )}
              </section>
            ) : null}
            {run.status === "LOCKED" ? (
              <section aria-labelledby="utr-sheet" className="space-y-2">
                <h2 id="utr-sheet" className="text-sm font-semibold text-fg">{t("salaryPay.sheetTitle")}</h2>
                <ActionForm action={utrSheetAction} className="space-y-3">
                  <p className="text-sm text-fg-muted">{t("salaryPay.sheetBody")}</p>
                  <input type="hidden" name="month" value={run.month} />
                  <TextField label={t("salaryPay.sheetFile")} name="file" type="file" accept=".csv,text/csv" />
                  <TextAreaField label={t("salaryPay.sheetPaste")} name="csv" maxLength={200000} placeholder={FILE_HEADINGS.UTR_SHEET.join(",")} />
                  <Button type="submit" size="sm" variant="secondary">{t("salaryPay.sheetButton")}</Button>
                </ActionForm>
              </section>
            ) : null}
          </CardBody>
        </Card>
      ) : null}

      <Card>
        <CardHeader title={t("payroll.slipsTitle")} />
        <CardBody>
          {run.slips === null ? (
            <EmptyState className="border-0 bg-transparent py-4" title={t("payroll.notSharedTitle")} description={t("payroll.notSharedBody")} />
          ) : run.slips.length === 0 ? (
            <EmptyState className="border-0 bg-transparent py-4" title={t("payroll.slipsNone")} description={t("payroll.slipsNoneBody")} />
          ) : (
            <ul className="divide-y divide-border">
              {run.slips.map((s) => (
                <li key={s.membershipId} className="py-3">
                  <details>
                    <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-2 text-sm [&::-webkit-details-marker]:hidden">
                      <span>
                        <span className="font-medium text-fg">{s.name}</span>
                        <span className="text-fg-muted"> · {t(`payroll.dept${s.department}` as TranslationKey)} · {t("payroll.paidDays", { paid: s.paidDays, days: s.daysInMonth })}</span>
                        {s.warnings.map((w) => (
                          <Badge key={w} tone={w === "NEGATIVE_NET" ? "danger" : "warn"} size="sm" className="ml-2">{t(`payroll.warn${w}` as TranslationKey)}</Badge>
                        ))}
                        {locked && s.netPaise > 0 ? (
                          <Badge tone={s.payment ? "ok" : "neutral"} size="sm" className="ml-2">{s.payment ? t("payroll.statusPAID") : t("salaryPay.unpaid")}</Badge>
                        ) : null}
                      </span>
                      <span className="tabular-nums">
                        {money(s.grossPaise)} − {money(s.deductionsPaise)} = <strong>{money(s.netPaise)}</strong>
                      </span>
                    </summary>
                    <div className="mt-3 grid gap-4 md:grid-cols-2">
                      <TableScroll>
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-border">
                              <th scope="col" className={TH}>{t("payroll.colComponent")}</th>
                              <th scope="col" className={`${TH} text-right`}>{t("payroll.colFull")}</th>
                              <th scope="col" className={`${TH} text-right`}>{t("payroll.colThisMonth")}</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border">
                            {s.lines.map((l, i) => (
                              <tr key={`${l.code}-${i}`}>
                                <td className={TD}>{label(l.code, l.label)} <span className="text-xs text-fg-muted">{t(`payroll.kind${l.kind}`)}</span></td>
                                <td className={NUM}>{money(l.fullPaise)}</td>
                                <td className={NUM}>{money(l.paise)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </TableScroll>
                      <div className="space-y-3">
                        <p className="text-sm">
                          <a className={`${LINK} inline-flex items-center gap-1`} href={`/api/v1/admin/payroll/runs/${run.month}/slips/${s.membershipId}/pdf`} target="_blank" rel="noreferrer">
                            <FilePdfIcon className="size-4" aria-hidden="true" />
                            {t("payroll.slipPdf")}
                          </a>
                          {canEdit ? (
                            <>
                              {" · "}
                              <Link className={LINK} href={`/admin/payroll/statement/${s.membershipId}`}>{t("payroll.statement")}</Link>
                            </>
                          ) : null}
                        </p>
                        {run.canEdit ? (
                          <form action={editSlipAction} className="grid gap-2 sm:grid-cols-2">
                            <input type="hidden" name="month" value={run.month} />
                            <input type="hidden" name="membershipId" value={s.membershipId} />
                            <label className="text-xs">
                              <span className="mb-1 block font-medium text-fg">{t("payroll.fieldArrears")}</span>
                              <input className={fieldClass()} name="arrears" inputMode="decimal" defaultValue={s.arrearsPaise ? (s.arrearsPaise / 100).toFixed(2) : ""} />
                            </label>
                            <label className="text-xs">
                              <span className="mb-1 block font-medium text-fg">{t("payroll.fieldTds")}</span>
                              <input className={fieldClass()} name="tds" inputMode="decimal" defaultValue={s.tdsOverridePaise === null ? "" : (s.tdsOverridePaise / 100).toFixed(2)} />
                            </label>
                            <label className="text-xs">
                              <span className="mb-1 block font-medium text-fg">{t("payroll.fieldLopDays", { found: s.lopOverrideDays === null ? s.lopDays : "—" })}</span>
                              <input className={fieldClass()} name="lopDays" inputMode="decimal" defaultValue={s.lopOverrideDays === null ? "" : String(s.lopOverrideDays)} />
                            </label>
                            <label className="text-xs">
                              <span className="mb-1 block font-medium text-fg">{t("payroll.fieldNotes")}</span>
                              <input className={fieldClass()} name="notes" maxLength={300} defaultValue={s.notes} />
                            </label>
                            <div className="sm:col-span-2">
                              <Button type="submit" size="sm" variant="secondary">{t("payroll.saveSlip")}</Button>
                            </div>
                          </form>
                        ) : s.notes ? (
                          <p className="text-sm text-fg-muted">{s.notes}</p>
                        ) : null}
                        {locked ? <SlipPayment t={t} s={s} month={run.month} canEdit={canEdit} today={today} day={day} money={money} /> : null}
                      </div>
                    </div>
                  </details>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

/** One slip's payment: how it was paid and the void form, or the record form (and, for UPI, the pay-from-your-app page). */
function SlipPayment({ t, s, month, canEdit, today, day, money }: { t: Translate; s: PayslipView; month: string; canEdit: boolean; today: string; day: (key: string) => string; money: (p: number) => string }) {
  if (s.netPaise <= 0) return null;
  const mode = (m: string) => t(`payroll.mode${m}` as TranslationKey);
  return (
    <div className="space-y-2 rounded-[var(--radius-md)] border border-border px-3 py-2 text-sm">
      <p className="text-xs text-fg-muted">{t("salaryPay.slipRef", { ref: s.slipRef })}{s.upiMasked ? ` · ${t("salaryPay.upiEnding", { masked: s.upiMasked })}` : ""}</p>
      {s.payment ? (
        <>
          <p className="font-medium text-fg">
            {s.payment.reference ? t("salaryPay.paidLineRef", { date: day(s.payment.paidOn), mode: mode(s.payment.mode), reference: s.payment.reference }) : t("salaryPay.paidLine", { date: day(s.payment.paidOn), mode: mode(s.payment.mode) })}
          </p>
          <p className="text-xs text-fg-muted">{t("salaryPay.recordedBy", { name: s.payment.recordedByName })}{s.payment.note ? ` ${s.payment.note}` : ""}</p>
          {canEdit ? (
            <details>
              <summary className="cursor-pointer text-xs font-medium text-danger">{t("salaryPay.voidTitle")}</summary>
              <ActionForm action={voidPaymentAction} className="mt-2 flex flex-wrap items-end gap-2">
                <input type="hidden" name="month" value={month} />
                <input type="hidden" name="membershipId" value={s.membershipId} />
                <TextField label={t("salaryPay.voidReason")} name="reason" required maxLength={300} className="min-w-[14rem] flex-1" />
                <Button type="submit" size="sm" variant="danger">{t("salaryPay.voidButton")}</Button>
              </ActionForm>
            </details>
          ) : null}
        </>
      ) : (
        <>
          <p className="text-fg-muted">{t("salaryPay.unpaid")}</p>
          {canEdit ? (
            <>
              {s.paymentMode === "UPI" && s.upiMasked ? (
                <p>
                  <Link className={`${LINK} inline-flex items-center gap-1`} href={`/admin/payroll/runs/${month}/pay/${s.membershipId}`}>
                    <QrCodeIcon className="size-4" aria-hidden="true" />
                    {t("salaryPay.payFromApp")}
                  </Link>
                </p>
              ) : null}
              <details>
                <summary className="cursor-pointer text-xs font-medium text-accent-strong">{t("salaryPay.recordTitle")}</summary>
                <ActionForm action={recordPaymentAction} className="mt-2 grid gap-2 sm:grid-cols-2">
                  <input type="hidden" name="month" value={month} />
                  <input type="hidden" name="membershipId" value={s.membershipId} />
                  <input type="hidden" name="amountPaise" value={s.netPaise} />
                  <p className="text-xs text-fg-muted sm:col-span-2">{t("salaryPay.amountFixed", { amount: money(s.netPaise) })}</p>
                  <SelectField label={t("salaryPay.fieldMode")} name="mode" defaultValue={s.paymentMode}>
                    {PAYMENT_MODES.map((m) => (
                      <option key={m} value={m}>{mode(m)}</option>
                    ))}
                  </SelectField>
                  <TextField label={t("salaryPay.fieldPaidOn")} name="paidOn" type="date" required defaultValue={today} min={`${month}-01`} max={today} />
                  <TextField label={t("salaryPay.fieldReference")} name="reference" maxLength={22} autoComplete="off" hint={t("salaryPay.fieldReferenceHint")} />
                  <TextField label={t("salaryPay.fieldNote")} name="note" maxLength={300} />
                  <div className="sm:col-span-2">
                    <Button type="submit" size="sm">{t("salaryPay.recordButton")}</Button>
                  </div>
                </ActionForm>
              </details>
            </>
          ) : null}
        </>
      )}
    </div>
  );
}
