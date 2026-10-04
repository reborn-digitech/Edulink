import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeftIcon, HandIcon, ReceiptIcon, WalletIcon } from "@phosphor-icons/react/ssr";
import { requireRole } from "@/lib/tenancy";
import { pupilFees } from "@/lib/fees-family";
import { formatDateKey } from "@/lib/dates";
import { formatPaise } from "@edulink/i18n";
import { Card, CardBody, CardHeader, StatTile } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/states";
import { PageHeader } from "@/components/ui/page-header";
import { getLocale, getT } from "@/lib/i18n/server";
import { FEE_DEMAND_STATUS_KEY, demandTone } from "../../parent/fees/labels";
import { TableScroll } from "@/components/ui/table-scroll";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("meta.pupilFees") };
}

/**
 * A pupil's own fees — only while the school lets pupils of their age see
 * them (School.pupilFeeViewAge). Dues, what is paid and the next due date;
 * NO WAY TO PAY, by design: a pupil never pays, and the page says so in
 * one sentence. See docs/decisions/0003.
 */
export default async function StudentFeesPage() {
  const ctx = await requireRole("STUDENT");
  const t = await getT();
  const locale = await getLocale();
  const view = await pupilFees(ctx);
  const dueDate = (key: string) => formatDateKey(key, { day: "numeric", month: "short", year: "numeric" }, locale);
  const money = (paise: number) => formatPaise(paise, locale);

  return (
    <div className="space-y-5">
      <Link href="/student" className="inline-flex items-center gap-1.5 text-sm font-medium text-fg-muted hover:text-fg">
        <ArrowLeftIcon weight="bold" className="size-4" />
        {t("nav.today")}
      </Link>

      <PageHeader title={t("fees.myFeesTitle")} description={[view.schoolName, view.year?.name].filter(Boolean).join(" · ") || t("fees.pupilIntro")} />

      {!view.allowed ? (
        <EmptyState
          icon={<ReceiptIcon weight="duotone" className="size-8" />}
          title={t("fees.myFeesTitle")}
          description={view.reason === "UNDER_AGE" ? t("fees.pupilNotAllowedAge", { age: view.fromAge ?? 0 }) : view.reason === "NO_BIRTHDATE" ? t("fees.pupilNotAllowedBirthdate") : t("fees.pupilNotAllowedOff")}
        />
      ) : (
        <>
          <Card>
            <CardBody className="flex items-start gap-3 text-sm text-fg" data-testid="fees-pupil-note">
              <HandIcon weight="duotone" className="mt-0.5 size-5 shrink-0 text-accent" />
              <p>{t("fees.pupilAskGrownUp")}</p>
            </CardBody>
          </Card>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <StatTile label={t("fees.parentOutstanding")} value={money(view.totals.outstandingPaise)} tone={view.totals.outstandingPaise > 0 ? "warn" : "ok"} icon={<WalletIcon weight="duotone" className="size-5" />} />
            <StatTile label={t("fees.parentOverdue")} value={money(view.totals.overduePaise)} tone={view.totals.overduePaise > 0 ? "danger" : "neutral"} />
            <StatTile label={t("fees.pupilNextDue")} value={view.nextDue ? dueDate(view.nextDue.dueDateKey) : "—"} hint={view.nextDue ? `${view.nextDue.label} · ${money(view.nextDue.amountPaise)}` : t("fees.pupilNothingDue")} tone="neutral" />
          </div>

          <Card>
            <CardHeader icon={<ReceiptIcon weight="duotone" className="size-5" />} title={t("fees.pupilDemandsTitle")} description={view.year?.name} />
            <CardBody className="p-0">
              {view.demands.length === 0 ? (
                <div className="px-5 py-6">
                  <EmptyState className="border-0 bg-transparent py-6" title={t("fees.pupilNothingDue")} />
                </div>
              ) : (
                <TableScroll>
                  <table className="w-full text-sm" data-testid="fees-pupil-demands">
                    <thead>
                      <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-fg-muted">
                        <th className="px-5 py-2.5 font-medium">{t("fees.structureInstalmentLabel")}</th>
                        <th className="px-3 py-2.5 font-medium">{t("fees.structureDueDate")}</th>
                        <th className="px-3 py-2.5 text-right font-medium">{t("fees.lineNet")}</th>
                        <th className="px-3 py-2.5 text-right font-medium">{t("fees.duesColPaid")}</th>
                        <th className="px-3 py-2.5 text-right font-medium">{t("fees.duesColOutstanding")}</th>
                        <th className="px-5 py-2.5 font-medium">{t("fees.parentColStatus")}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {view.demands.map((d) => (
                        <tr key={d.id} className={d.overdue ? "bg-danger-soft/40" : undefined}>
                          <td className="px-5 py-2.5 font-medium text-fg">{d.label}</td>
                          <td className="whitespace-nowrap px-3 py-2.5 text-fg-muted">{dueDate(d.dueDateKey)}</td>
                          <td className="px-3 py-2.5 text-right tabular-nums text-fg">{money(d.netPaise)}</td>
                          <td className="px-3 py-2.5 text-right tabular-nums text-fg">{money(d.paidPaise)}</td>
                          <td className="px-3 py-2.5 text-right font-semibold tabular-nums text-fg">{money(d.outstandingPaise)}</td>
                          <td className="whitespace-nowrap px-5 py-2.5">
                            <span className="inline-flex flex-wrap items-center gap-1.5">
                              <Badge tone={demandTone(d.status, d.overdue)} size="sm">
                                {FEE_DEMAND_STATUS_KEY[d.status] ? t(FEE_DEMAND_STATUS_KEY[d.status]!) : d.status}
                              </Badge>
                              {d.overdue && (
                                <Badge tone="danger" size="sm" dot>
                                  {t("fees.overdue")}
                                </Badge>
                              )}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </TableScroll>
              )}
            </CardBody>
          </Card>
        </>
      )}
    </div>
  );
}
