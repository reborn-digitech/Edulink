import type { Metadata } from "next";
import Link from "next/link";
import { IdentificationCardIcon, WarningIcon } from "@phosphor-icons/react/ssr";
import { formatPaise } from "@edulink/i18n";
import { PAYMENT_MODES } from "@edulink/contracts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/states";
import { SelectField, TextField } from "@/components/ui/field";
import { ModuleOff } from "@/components/module-off";
import { LINK } from "@/components/module-flash";
import { listSalaries } from "@/lib/payroll";
import { ROLE_META, type Role } from "@/lib/constants";
import { todayKey } from "@/lib/dates";
import { db } from "@/lib/db";
import { getT } from "@/lib/i18n/server";
import { payrollGate, PayrollTop } from "../shared";
import { saveSalaryAction } from "../actions";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("payroll.tabSalaries") };
}

/**
 * Each member of staff's salary: the structure, the basic, the statutory
 * numbers and how they are paid. The PAN and the bank account are sealed on
 * arrival and shown as their last four only; a blank field keeps what is
 * sealed. A revision is a new salary from its own date.
 */
export default async function PayrollSalaries({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { ctx, t, locale, on } = await payrollGate(true);
  if (!on) return <ModuleOff module="PAYROLL" t={t} />;
  const params = await searchParams;
  const [list, school] = await Promise.all([listSalaries(ctx), db.school.findUniqueOrThrow({ where: { id: ctx.schoolId }, select: { timezone: true } })]);
  const today = todayKey(school.timezone);
  const firstOfMonth = `${today.slice(0, 7)}-01`;
  return (
    <div className="space-y-6">
      <PayrollTop t={t} current="salaries" params={params} admin />
      {!list.sealingAvailable ? (
        <p role="alert" className="flex items-start gap-2 rounded-[var(--radius-md)] border border-warn/40 bg-warn-soft px-3 py-2 text-sm text-warn">
          <WarningIcon weight="fill" className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {t("payroll.noSealing")}
        </p>
      ) : null}
      <Card>
        <CardHeader icon={<IdentificationCardIcon weight="duotone" className="size-5" />} title={t("payroll.salariesTitle")} description={t("payroll.salariesBody")} />
        <CardBody>
          {list.structures.length === 0 ? (
            <EmptyState className="border-0 bg-transparent py-4" title={t("payroll.structuresNone")} description={t("payroll.structuresFirst")} action={<Button asChild size="sm"><Link href="/admin/payroll/structures">{t("payroll.tabStructures")}</Link></Button>} />
          ) : list.staff.length === 0 ? (
            <EmptyState className="border-0 bg-transparent py-4" title={t("payroll.staffNone")} description={t("payroll.staffNoneBody")} />
          ) : (
            <ul className="divide-y divide-border">
              {list.staff.map((p) => {
                const s = p.salary;
                return (
                  <li key={p.membershipId} className="py-3">
                    <details>
                      <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-2 text-sm [&::-webkit-details-marker]:hidden">
                        <span>
                          <span className="font-medium text-fg">{p.name}</span>
                          <span className="text-fg-muted"> · {t(ROLE_META[p.role as Role]?.labelKey ?? "role.teacher")}{p.designation ? ` · ${p.designation}` : ""}</span>
                        </span>
                        {s ? (
                          <span className="text-fg-muted">
                            {s.structureName} · {t("payroll.grossPerMonth", { amount: formatPaise(s.monthlyGrossPaise, locale) })}
                            {s.bankLast4 ? ` · ${t("payroll.bankEnding", { last4: s.bankLast4 })}` : ""}
                          </span>
                        ) : (
                          <Badge tone="warn" size="sm">{t("payroll.noSalary")}</Badge>
                        )}
                      </summary>
                      <form action={saveSalaryAction} className="mt-3 grid gap-3 sm:grid-cols-3">
                        <input type="hidden" name="membershipId" value={p.membershipId} />
                        <SelectField label={t("payroll.fieldStructure")} name="structureId" required defaultValue={s?.structureId ?? list.structures[0]?.id ?? ""}>
                          {list.structures.map((st) => (
                            <option key={st.id} value={st.id}>{st.name}</option>
                          ))}
                        </SelectField>
                        <TextField label={t("payroll.fieldEffectiveFrom")} name="effectiveFrom" type="date" required defaultValue={s?.effectiveFrom ?? firstOfMonth} hint={t("payroll.fieldEffectiveFromHint")} />
                        <TextField label={t("payroll.fieldBasic")} name="basic" inputMode="decimal" required defaultValue={s ? (s.basicPaise / 100).toFixed(2) : ""} />
                        <TextField label={t("payroll.fieldUan")} name="pfUan" inputMode="numeric" maxLength={12} defaultValue={s?.pfUan ?? ""} />
                        <TextField label={t("payroll.fieldEsi")} name="esiNumber" inputMode="numeric" maxLength={17} defaultValue={s?.esiNumber ?? ""} />
                        <TextField label={t("payroll.fieldPan")} name="pan" maxLength={10} autoComplete="off" placeholder={s?.panLast4 ? t("payroll.keepsEnding", { last4: s.panLast4 }) : ""} />
                        <SelectField label={t("payroll.fieldPaymentMode")} name="paymentMode" defaultValue={s?.paymentMode ?? "BANK"}>
                          {PAYMENT_MODES.map((m) => (
                            <option key={m} value={m}>{t(`payroll.mode${m}`)}</option>
                          ))}
                        </SelectField>
                        <TextField label={t("payroll.fieldBankAccount")} name="bankAccount" inputMode="numeric" maxLength={20} autoComplete="off" placeholder={s?.bankLast4 ? t("payroll.keepsEnding", { last4: s.bankLast4 }) : ""} />
                        <TextField label={t("payroll.fieldIfsc")} name="bankIfsc" maxLength={11} defaultValue={s?.bankIfsc ?? ""} />
                        <TextField label={t("payroll.fieldBankName")} name="bankName" maxLength={80} defaultValue={s?.bankName ?? ""} />
                        <div className="flex flex-wrap items-center gap-3 sm:col-span-3">
                          <Button type="submit" size="sm">{t("payroll.saveSalary")}</Button>
                          {s ? <Link className={LINK} href={`/admin/payroll/statement/${p.membershipId}`}>{t("payroll.statement")}</Link> : null}
                        </div>
                      </form>
                    </details>
                  </li>
                );
              })}
            </ul>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
