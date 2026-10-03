import type { Metadata } from "next";
import { HandCoinsIcon, PlusIcon } from "@phosphor-icons/react/ssr";
import { formatPaise } from "@edulink/i18n";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/states";
import { SelectField, TextField } from "@/components/ui/field";
import { ModuleOff } from "@/components/module-off";
import { INPUT } from "@/components/module-flash";
import { listAdvances, listSalaries } from "@/lib/payroll";
import { formatInZone } from "@/lib/dates";
import { getT } from "@/lib/i18n/server";
import { payrollGate, PayrollTop } from "../shared";
import { decideAdvanceAction, recordAdvanceAction } from "../actions";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("payroll.tabAdvances") };
}

/**
 * Advances against salary. The money is handed over outside the app; what
 * is recorded here is how much and what each month takes back, recovered as
 * a line on the slips that follow (worked out from the locked slips, never
 * stored). Staff ask from their own payslips page.
 */
export default async function PayrollAdvances({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { ctx, t, locale, on } = await payrollGate(true);
  if (!on) return <ModuleOff module="PAYROLL" t={t} />;
  const params = await searchParams;
  const [{ advances }, { staff }] = await Promise.all([listAdvances(ctx), listSalaries(ctx)]);
  const money = (p: number) => formatPaise(p, locale);
  return (
    <div className="space-y-6">
      <PayrollTop t={t} current="advances" params={params} admin />
      <Card>
        <CardHeader icon={<HandCoinsIcon weight="duotone" className="size-5" />} title={t("payroll.advancesTitle")} description={t("payroll.advancesBody")} />
        <CardBody>
          {advances.length === 0 ? (
            <EmptyState className="border-0 bg-transparent py-4" title={t("payroll.advancesNone")} description={t("payroll.advancesNoneBody")} />
          ) : (
            <ul className="divide-y divide-border">
              {advances.map((a) => (
                <li key={a.id} className="space-y-2 py-3 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span>
                      <span className="font-medium text-fg">{a.name}</span> · {money(a.amountPaise)} · {a.reason}
                    </span>
                    <Badge tone={a.status === "REQUESTED" ? "accent" : a.status === "RECORDED" ? "ok" : "neutral"} size="sm">{t(`payroll.advance${a.status}`)}</Badge>
                  </div>
                  <p className="text-xs text-fg-muted">
                    {formatInZone(new Date(a.createdAt), "Asia/Kolkata", { day: "numeric", month: "short", year: "numeric" }, locale)}
                    {a.status === "RECORDED" ? ` · ${t("payroll.advanceProgress", { instalment: money(a.monthlyRecoveryPaise ?? 0), recovered: money(a.recoveredPaise), outstanding: money(a.outstandingPaise) })}` : ""}
                    {a.decisionNote ? ` · ${a.decisionNote}` : ""}
                  </p>
                  {a.status === "REQUESTED" ? (
                    <div className="flex flex-wrap gap-2">
                      <form action={decideAdvanceAction} className="flex flex-wrap items-end gap-2">
                        <input type="hidden" name="advanceId" value={a.id} />
                        <input type="hidden" name="decision" value="RECORD" />
                        <input aria-label={t("payroll.fieldAmount")} className={`${INPUT} w-32`} name="amount" inputMode="decimal" defaultValue={(a.amountPaise / 100).toFixed(2)} />
                        <input aria-label={t("payroll.fieldInstalment")} className={`${INPUT} w-32`} name="instalment" inputMode="decimal" required placeholder={t("payroll.fieldInstalment")} />
                        <Button type="submit" size="sm">{t("payroll.recordAdvance")}</Button>
                      </form>
                      <form action={decideAdvanceAction} className="flex flex-wrap items-end gap-2">
                        <input type="hidden" name="advanceId" value={a.id} />
                        <input type="hidden" name="decision" value="DECLINE" />
                        <input aria-label={t("payroll.declineWhy")} className={`${INPUT} w-48`} name="note" maxLength={300} placeholder={t("payroll.declineWhy")} />
                        <Button type="submit" size="sm" variant="secondary">{t("payroll.declineAdvance")}</Button>
                      </form>
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
      <Card>
        <CardHeader icon={<PlusIcon weight="bold" className="size-5" />} title={t("payroll.recordAdvanceTitle")} description={t("payroll.recordAdvanceBody")} />
        <CardBody>
          <form action={recordAdvanceAction} className="grid gap-3 sm:grid-cols-2">
            <SelectField label={t("payroll.fieldPerson")} name="membershipId" required defaultValue="">
              <option value="" disabled>{t("payroll.choosePerson")}</option>
              {staff.map((s) => (
                <option key={s.membershipId} value={s.membershipId}>{s.name}</option>
              ))}
            </SelectField>
            <TextField label={t("payroll.fieldReason")} name="reason" required maxLength={300} />
            <TextField label={t("payroll.fieldAmount")} name="amount" inputMode="decimal" required />
            <TextField label={t("payroll.fieldInstalment")} name="instalment" inputMode="decimal" required />
            <div>
              <Button type="submit">{t("payroll.recordAdvance")}</Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
