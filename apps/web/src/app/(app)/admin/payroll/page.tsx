import type { Metadata } from "next";
import Link from "next/link";
import { CalendarCheckIcon, ChartBarIcon, CoinsIcon, UsersThreeIcon } from "@phosphor-icons/react/ssr";
import { formatPaise } from "@edulink/i18n";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader, StatTile } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/states";
import { TextField } from "@/components/ui/field";
import { ModuleOff } from "@/components/module-off";
import { LINK, NUM, TD, TH } from "@/components/module-flash";
import { payrollSummary } from "@/lib/payroll";
import { getT } from "@/lib/i18n/server";
import { monthName, payrollGate, PayrollTop } from "./shared";
import { draftRunAction } from "./actions";
import { TableScroll } from "@/components/ui/table-scroll";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("payroll.title") };
}

function previousMonth(): string {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() - 1, 1)).toISOString().slice(0, 7);
}

/**
 * Payroll at a glance, for the office and the head: who has a salary, the
 * runs and their totals, what payroll cost month by month and department by
 * department. The admin drafts a month from here.
 */
export default async function PayrollOverview({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { ctx, t, locale, on, canEdit } = await payrollGate();
  if (!on) return <ModuleOff page module="PAYROLL" t={t} />;
  const params = await searchParams;
  const s = await payrollSummary(ctx);
  const latest = s.runs.find((r) => r.status === "LOCKED");
  const peak = Math.max(1, ...s.costByMonth.map((m) => m.grossPaise + m.employerPaise));
  return (
    <div className="space-y-6">
      <PayrollTop t={t} current="overview" params={params} admin={canEdit} />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label={t("payroll.statStaff")} value={`${s.withSalary}/${s.staffCount}`} hint={t("payroll.statStaffHint")} icon={<UsersThreeIcon className="size-4" />} tone={s.withSalary < s.staffCount ? "warn" : "ok"} />
        <StatTile label={t("payroll.statNet")} value={latest ? formatPaise(latest.netPaise, locale) : "—"} hint={latest ? monthName(latest.month, locale) : t("payroll.noLockedRun")} icon={<CoinsIcon className="size-4" />} />
        <StatTile label={t("payroll.statCost")} value={latest ? formatPaise(latest.grossPaise + latest.employerPaise, locale) : "—"} hint={t("payroll.statCostHint")} icon={<ChartBarIcon className="size-4" />} />
        <StatTile label={t("payroll.statHeadcount")} value={latest?.headcount ?? 0} hint={latest ? monthName(latest.month, locale) : ""} icon={<UsersThreeIcon className="size-4" />} />
      </div>

      <Card>
        <CardHeader icon={<CalendarCheckIcon weight="duotone" className="size-5" />} title={t("payroll.runsTitle")} description={t("payroll.runsBody")} />
        <CardBody className="space-y-4">
          {canEdit ? (
            <form action={draftRunAction} className="flex flex-wrap items-end gap-2">
              <TextField label={t("payroll.fieldMonth")} name="month" type="month" required defaultValue={previousMonth()} className="w-48" />
              <Button type="submit">{t("payroll.draftRun")}</Button>
            </form>
          ) : null}
          {s.runs.length === 0 ? (
            <EmptyState className="border-0 bg-transparent py-4" title={t("payroll.runsNone")} description={canEdit ? t("payroll.runsNoneBody") : t("payroll.runsNoneHead")} />
          ) : (
            <TableScroll>
              <table className="w-full min-w-[40rem] text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th scope="col" className={TH}>{t("payroll.colMonth")}</th>
                    <th scope="col" className={TH}>{t("payroll.colStatus")}</th>
                    <th scope="col" className={`${TH} text-right`}>{t("payroll.colPeople")}</th>
                    <th scope="col" className={`${TH} text-right`}>{t("payroll.colGross")}</th>
                    <th scope="col" className={`${TH} text-right`}>{t("payroll.colNet")}</th>
                    <th scope="col" className={`${TH} text-right`}>{t("payroll.colEmployer")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {s.runs.map((r) => (
                    <tr key={r.month}>
                      <th scope="row" className={`${TD} text-left`}>
                        <Link className={LINK} href={`/admin/payroll/runs/${r.month}`}>{monthName(r.month, locale)}</Link>
                      </th>
                      <td className={TD}><Badge tone={r.status === "LOCKED" ? "ok" : "warn"} size="sm">{t(`payroll.status${r.status}`)}</Badge></td>
                      <td className={NUM}>{r.headcount}</td>
                      <td className={NUM}>{formatPaise(r.grossPaise, locale)}</td>
                      <td className={NUM}>{formatPaise(r.netPaise, locale)}</td>
                      <td className={NUM}>{formatPaise(r.employerPaise, locale)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableScroll>
          )}
        </CardBody>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader icon={<ChartBarIcon weight="duotone" className="size-5" />} title={t("payroll.costByMonth")} description={t("payroll.costByMonthBody")} />
          <CardBody>
            {s.costByMonth.length === 0 ? (
              <EmptyState className="border-0 bg-transparent py-4" title={t("payroll.noLockedRun")} description={t("payroll.noLockedRunBody")} />
            ) : (
              <ul className="space-y-2">
                {s.costByMonth.map((m) => {
                  const cost = m.grossPaise + m.employerPaise;
                  return (
                    <li key={m.month} className="text-sm">
                      <div className="flex justify-between gap-2">
                        <span>{monthName(m.month, locale, true)}</span>
                        <span className="tabular-nums font-medium">{formatPaise(cost, locale)}</span>
                      </div>
                      <div className="mt-1 h-2 rounded-full bg-surface-muted" aria-hidden="true">
                        <div className="h-2 rounded-full bg-accent" style={{ width: `${Math.round((cost / peak) * 100)}%` }} />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardBody>
        </Card>
        <Card>
          <CardHeader icon={<UsersThreeIcon weight="duotone" className="size-5" />} title={t("payroll.costByDepartment")} description={s.latestLockedMonth ? monthName(s.latestLockedMonth, locale) : t("payroll.noLockedRun")} />
          <CardBody>
            {s.costByDepartment.length === 0 ? (
              <EmptyState className="border-0 bg-transparent py-4" title={t("payroll.noLockedRun")} description={t("payroll.noLockedRunBody")} />
            ) : (
              <TableScroll>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th scope="col" className={TH}>{t("payroll.colDepartment")}</th>
                      <th scope="col" className={`${TH} text-right`}>{t("payroll.colPeople")}</th>
                      <th scope="col" className={`${TH} text-right`}>{t("payroll.colGross")}</th>
                      <th scope="col" className={`${TH} text-right`}>{t("payroll.colEmployer")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {s.costByDepartment.map((d) => (
                      <tr key={d.department}>
                        <td className={TD}>{t(`payroll.dept${d.department}` as Parameters<typeof t>[0])}</td>
                        <td className={NUM}>{d.headcount}</td>
                        <td className={NUM}>{formatPaise(d.grossPaise, locale)}</td>
                        <td className={NUM}>{formatPaise(d.employerPaise, locale)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </TableScroll>
            )}
          </CardBody>
        </Card>
      </div>
      {canEdit && s.advancesWaiting > 0 ? (
        <p className="text-sm">
          <Link className={LINK} href="/admin/payroll/advances">{t("payroll.advancesWaiting", { count: s.advancesWaiting })}</Link>
        </p>
      ) : null}
      {!canEdit ? <p className="text-sm text-fg-muted">{t("payroll.headReads")}</p> : null}
    </div>
  );
}
