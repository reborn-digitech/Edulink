import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowSquareOutIcon, InfoIcon } from "@phosphor-icons/react/ssr";
import { formatPaise } from "@edulink/i18n";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { TextField } from "@/components/ui/field";
import { ActionForm } from "@/components/ui/action-form";
import { ModuleOff } from "@/components/module-off";
import { ModuleFlash, LINK } from "@/components/module-flash";
import { AccessError } from "@/lib/access-error";
import { RuleRefusal } from "@/lib/rule-refusal";
import { upiIntentFor, type UpiIntent } from "@/lib/salary-payments";
import { todayKey } from "@/lib/dates";
import { db } from "@/lib/db";
import { getT } from "@/lib/i18n/server";
import { monthName, payrollGate } from "../../../../shared";
import { recordPaymentAction } from "../../../../actions";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("salaryPay.payFromApp") };
}

/**
 * PAY FROM THE SCHOOL'S UPI APP (owner-batch-item2b, 27 October 2026): one unpaid UPI slip's
 * `upi://pay` link and its QR, for the admin to open on the phone that holds the school's own UPI
 * app. That app pays the member of staff from the school's account; the platform receives, holds
 * and sends nothing (decision 0003). Then the UTR the app shows is typed in below. The link is built
 * from the sealed UPI id on this request alone, never stored, and the showing is audited.
 */
export default async function PayFromUpiApp({ params, searchParams }: { params: Promise<{ month: string; membershipId: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { ctx, t, locale, on } = await payrollGate(true);
  if (!on) return <ModuleOff page module="PAYROLL" t={t} />;
  const { month, membershipId } = await params;
  const sp = await searchParams;
  const back = `/admin/payroll/runs/${month}`;
  let intent: UpiIntent | null = null;
  let refusal: RuleRefusal | null = null;
  try {
    intent = await upiIntentFor(ctx, month, membershipId);
  } catch (error) {
    if (error instanceof AccessError) notFound();
    if (error instanceof RuleRefusal && error.key === "payroll.refuseMonth") notFound();
    if (error instanceof RuleRefusal) refusal = error;
    else throw error;
  }
  const school = await db.school.findUnique({ where: { id: ctx.schoolId }, select: { timezone: true } });
  const today = todayKey(school?.timezone ?? "Asia/Kolkata");
  const amount = intent ? formatPaise(intent.amountPaise, locale, { always: true }) : "";
  return (
    <div className="space-y-6">
      <PageHeader
        title={intent ? t("salaryPay.payTitle", { name: intent.payeeName }) : t("salaryPay.payFromApp")}
        description={
          <Link className={LINK} href={back}>
            {t("salaryPay.payBack")} · {monthName(month, locale)}
          </Link>
        }
      />
      <ModuleFlash t={t} params={sp} />
      {refusal ? (
        <p role="status" className="flex items-start gap-2 rounded-[var(--radius-md)] border border-border bg-surface-muted px-3 py-2 text-sm">
          <InfoIcon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {t(refusal.key, refusal.vars)}
        </p>
      ) : null}
      {intent ? (
        <>
          <Card>
            <CardHeader title={amount} description={t("salaryPay.payIntro", { name: intent.payeeName, amount })} />
            <CardBody className="space-y-4">
              {intent.qr ? (
                <svg viewBox={intent.qr.viewBox} role="img" aria-label={t("salaryPay.payQrLabel", { name: intent.payeeName, amount })} className="size-60 max-w-full rounded-[var(--radius-md)] bg-white" shapeRendering="crispEdges">
                  <path d={intent.qr.d} fill="#000" />
                </svg>
              ) : (
                <p className="text-sm text-fg-muted">{t("salaryPay.payNoQr")}</p>
              )}
              <p>
                <a className={`${LINK} inline-flex items-center gap-1`} href={intent.link}>
                  <ArrowSquareOutIcon className="size-4" aria-hidden="true" />
                  {t("salaryPay.payLink")}
                </a>
              </p>
              <p className="break-all font-mono text-xs text-fg-muted">{intent.link}</p>
              <p className="text-xs text-fg-muted">{t("salaryPay.slipRef", { ref: intent.slipRef })}</p>
              <p className="flex items-start gap-2 text-xs text-fg-muted">
                <InfoIcon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                {t("salaryPay.payNote")}
              </p>
            </CardBody>
          </Card>
          <Card>
            <CardHeader title={t("salaryPay.recordTitle")} description={t("salaryPay.amountFixed", { amount })} />
            <CardBody>
              <ActionForm action={recordPaymentAction} className="grid gap-3 sm:grid-cols-2">
                <input type="hidden" name="month" value={month} />
                <input type="hidden" name="membershipId" value={membershipId} />
                <input type="hidden" name="amountPaise" value={intent.amountPaise} />
                <input type="hidden" name="mode" value="UPI" />
                <input type="hidden" name="back" value="pay" />
                <TextField label={t("salaryPay.fieldPaidOn")} name="paidOn" type="date" required defaultValue={today} min={`${month}-01`} max={today} />
                <TextField label={t("salaryPay.fieldReference")} name="reference" required maxLength={22} autoComplete="off" inputMode="text" hint={t("salaryPay.fieldReferenceHint")} />
                <TextField label={t("salaryPay.fieldNote")} name="note" maxLength={300} className="sm:col-span-2" />
                <div className="sm:col-span-2">
                  <Button type="submit">{t("salaryPay.recordButton")}</Button>
                </div>
              </ActionForm>
            </CardBody>
          </Card>
        </>
      ) : null}
    </div>
  );
}
