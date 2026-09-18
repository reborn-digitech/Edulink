import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeftIcon, ReceiptIcon, WalletIcon, WarningIcon } from "@phosphor-icons/react/ssr";
import { requireParent, AccessError } from "@/lib/tenancy";
import { db } from "@/lib/db";
import { familyFees, type FamilyFees } from "@/lib/fees-payments";
import { formatDateKey, formatInZone } from "@/lib/dates";
import { formatPaise } from "@edulink/i18n";
import { Card, CardBody, CardHeader, StatTile } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/states";
import { PageHeader } from "@/components/ui/page-header";
import { ChildSwitcher } from "../child-switcher";
import { getLocale, getT } from "@/lib/i18n/server";
import { PayChooser } from "./pay-chooser";
import { FEE_DEMAND_STATUS_KEY, FEE_METHOD_KEY, FEE_PAYMENT_STATUS_KEY, demandTone, paymentTone } from "./labels";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("fees.parentTitle") };
}

/**
 * The family's fees page: what the school asked for this year, what has
 * arrived, and how to pay the rest.
 *
 * THE MONEY GOES TO THE SCHOOL. The payee note under the chooser says so on
 * every render, whatever the options: a parent paying from here is paying
 * the school's own gateway account or the school's own UPI id, and Relay
 * neither receives nor holds it. See docs/decisions/0003.
 */
export default async function ParentFeesPage({ searchParams }: { searchParams: Promise<{ child?: string; childId?: string; checkout?: string }> }) {
  const session = await requireParent();
  const t = await getT();
  const locale = await getLocale();
  const { child: childParam, childId: childIdParam, checkout: checkoutParam } = await searchParams;
  // `?checkout=<paymentId>`: an online order the phone app started, to be
  // finished here in the gateway's own checkout. Just a payment id; the page
  // asks the server whether it is really this parent's and still open.
  const resumePaymentId = checkoutParam && /^[A-Za-z0-9_-]{8,64}$/.test(checkoutParam) ? checkoutParam : null;
  const requested = childParam ?? childIdParam;

  let fees: FamilyFees;
  let refused: string | null = null;
  try {
    fees = await familyFees(session, requested);
  } catch (error) {
    if (!(error instanceof AccessError)) throw error;
    refused = t(error.key, error.vars);
    fees = { children: [], child: null };
  }
  const { children, child } = fees;
  const timezone = child ? ((await db.school.findUnique({ where: { id: child.schoolId }, select: { timezone: true } }))?.timezone ?? "UTC") : "UTC";

  const dueDate = (key: string) => formatDateKey(key, { day: "numeric", month: "short", year: "numeric" }, locale);
  const money = (paise: number) => formatPaise(paise, locale);
  const payable = child ? child.demands.filter((d) => (d.status === "OPEN" || d.status === "PART") && d.outstandingPaise > 0) : [];

  return (
    <div className="space-y-5">
      <Link href="/parent" className="inline-flex items-center gap-1.5 text-sm font-medium text-fg-muted hover:text-fg">
        <ArrowLeftIcon weight="bold" className="size-4" />
        {t("parent.overview")}
      </Link>

      {children.length > 1 && child && <ChildSwitcher pupils={children} selectedId={child.studentMembershipId} basePath="/parent/fees" />}

      <PageHeader
        title={t("fees.parentTitle")}
        description={child ? [child.name, child.schoolName, child.year?.name].filter(Boolean).join(" · ") : t("fees.parentIntro")}
      />

      {refused && (
        <Card>
          <CardBody className="flex items-center gap-2 text-sm text-danger">
            <WarningIcon weight="fill" className="size-4 shrink-0" />
            {refused}
          </CardBody>
        </Card>
      )}

      {!child ? (
        !refused && <EmptyState icon={<ReceiptIcon weight="duotone" className="size-8" />} title={t("fees.parentNoChild")} />
      ) : (
        <>
          {!child.year && (
            <Card>
              <CardBody className="text-sm text-fg-muted">{t("fees.parentNoYear")}</CardBody>
            </Card>
          )}

          <div className="grid gap-3 sm:grid-cols-3">
            <StatTile label={t("fees.parentOutstanding")} value={money(child.totals.outstandingPaise)} tone={child.totals.outstandingPaise > 0 ? "warn" : "ok"} icon={<WalletIcon weight="duotone" className="size-5" />} />
            <StatTile label={t("fees.parentOverdue")} value={money(child.totals.overduePaise)} tone={child.totals.overduePaise > 0 ? "danger" : "neutral"} />
            <StatTile label={t("fees.parentPaidSoFar")} value={money(child.totals.paidPaise)} tone="neutral" />
          </div>

          <Card>
            <CardHeader icon={<ReceiptIcon weight="duotone" className="size-5" />} title={t("fees.pupilDemandsTitle")} description={child.year?.name} />
            <CardBody className="p-0">
              {child.demands.length === 0 ? (
                <div className="px-5 py-6">
                  <EmptyState className="border-0 bg-transparent py-6" title={t("fees.parentNothingDue")} />
                </div>
              ) : (
                <div className="overflow-x-auto" tabIndex={0}>
                  <table className="w-full text-sm" data-testid="fees-demands">
                    <thead>
                      <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-fg-muted">
                        <th className="px-5 py-2.5 font-medium">{t("fees.structureInstalmentLabel")}</th>
                        <th className="px-3 py-2.5 font-medium">{t("fees.structureDueDate")}</th>
                        <th className="px-3 py-2.5 text-right font-medium">{t("fees.lineGross")}</th>
                        <th className="px-3 py-2.5 text-right font-medium">{t("fees.lineConcession")}</th>
                        <th className="px-3 py-2.5 text-right font-medium">{t("fees.lineNet")}</th>
                        <th className="px-3 py-2.5 text-right font-medium">{t("fees.duesColPaid")}</th>
                        <th className="px-3 py-2.5 text-right font-medium">{t("fees.duesColOutstanding")}</th>
                        <th className="px-5 py-2.5 font-medium">{t("fees.parentColStatus")}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {child.demands.map((d) => (
                        <tr key={d.id} className={d.overdue ? "bg-danger-soft/40" : undefined}>
                          <td className="px-5 py-2.5 font-medium text-fg">{d.label}</td>
                          <td className="whitespace-nowrap px-3 py-2.5 text-fg-muted">{dueDate(d.dueDateKey)}</td>
                          <td className="px-3 py-2.5 text-right tabular-nums text-fg-muted">{money(d.grossPaise)}</td>
                          <td className="px-3 py-2.5 text-right tabular-nums text-fg-muted">{d.concessionPaise > 0 ? `−${money(d.concessionPaise)}` : "—"}</td>
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
                </div>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader icon={<WalletIcon weight="duotone" className="size-5" />} title={t("fees.parentPickTitle")} />
            <CardBody className="space-y-4">
              {payable.length === 0 ? (
                <p className="text-sm text-fg-muted">{t("fees.parentNothingDue")}</p>
              ) : (
                <PayChooser
                  studentMembershipId={child.studentMembershipId}
                  demands={payable.map((d) => ({ id: d.id, label: d.label, dueDateKey: d.dueDateKey, outstandingPaise: d.outstandingPaise, overdue: d.overdue }))}
                  options={child.options}
                  resumePaymentId={resumePaymentId}
                />
              )}
              <p className="text-xs leading-relaxed text-fg-subtle" data-testid="fees-payee-note">
                {t("fees.parentPayeeNote", { school: child.schoolName })}
              </p>
            </CardBody>
          </Card>

          <Card>
            <CardHeader icon={<ReceiptIcon weight="duotone" className="size-5" />} title={t("fees.parentHistory")} />
            <CardBody className="p-0">
              {child.payments.length === 0 ? (
                <div className="px-5 py-6">
                  <EmptyState className="border-0 bg-transparent py-6" title={t("fees.parentNoHistory")} />
                </div>
              ) : (
                <ul className="divide-y divide-border" data-testid="fees-payments">
                  {child.payments.map((p) => (
                    <li key={p.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
                      <div className="min-w-0">
                        <p className="flex flex-wrap items-center gap-2 text-sm font-medium text-fg">
                          <span className="tabular-nums">{money(p.amountPaise)}</span>
                          <Badge tone="outline" size="sm">
                            {FEE_METHOD_KEY[p.method] ? t(FEE_METHOD_KEY[p.method]!) : p.method}
                          </Badge>
                          <Badge tone={paymentTone(p.status)} size="sm">
                            {FEE_PAYMENT_STATUS_KEY[p.status] ? t(FEE_PAYMENT_STATUS_KEY[p.status]!) : p.status}
                          </Badge>
                        </p>
                        <p className="mt-0.5 text-xs text-fg-muted">
                          {formatInZone(p.paidAt ?? p.createdAt, timezone, { dateStyle: "medium", timeStyle: "short" }, locale)}
                          {p.reference ? ` · ${p.reference}` : ""}
                          {p.status === "CLAIMED" ? ` · ${t("fees.parentWaiting")}` : ""}
                          {p.status === "FAILED" ? ` · ${t("fees.parentFailed")}${p.failedReason ? ` · ${p.failedReason}` : ""}` : ""}
                        </p>
                      </div>
                      {p.receiptId && (
                        <Link href={`/fees/receipts/${p.receiptId}`} className="text-sm font-semibold text-accent-strong underline underline-offset-2">
                          {p.serial ? t("fees.parentReceipt", { serial: p.serial }) : t("fees.receiptOpen")}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>
        </>
      )}
    </div>
  );
}
