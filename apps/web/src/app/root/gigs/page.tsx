import type { Metadata } from "next";
import { formatPaise } from "@edulink/i18n";
import { requireSuperuser } from "@/lib/tenancy";
import { gigOverview } from "@/lib/gig-questions";
import { sessionCounts } from "@/lib/gig-sessions";
import { operatorInvoices, operatorPayouts } from "@/lib/gig-payments";
import { formatInZone } from "@/lib/dates";
import { getLocale, getT } from "@/lib/i18n/server";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { CompanyForm, LinkAllExperts, PaymentForm, PaymentsSwitch, PayoutForm, RetryPayment, SettingsForm, SuspendPayee } from "./forms";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("gigs.operatorTitle") };
}

/**
 * Gigs, for whoever runs the server: the dials teachers are paid by, what
 * this month has committed, who is owed for the months that have ended, and
 * the transfers already recorded.
 *
 * THE PAGE SENDS NOTHING. The operator pays each person from the company's
 * bank by UPI and types the transfer's reference here; the amount recorded
 * is the server's sum of what that person is owed, never a typed one. The
 * expert's paid seats are different (decision 0004, third amendment of
 * 2 October 2026): families pay through Razorpay Route, the expert's share
 * is held by Razorpay and released by the hourly job, and the company keeps
 * its commission with a GST invoice. Here the operator sees whether paid
 * seats can be switched on (Route working on the company's account), links
 * ready experts in one press, and reads each expert's linked account; the
 * hand-recorded payouts of the second amendment show only while one is open.
 */
export default async function RootGigsPage() {
  const session = await requireSuperuser();
  const t = await getT();
  const locale = await getLocale();
  const money = (paise: number) => formatPaise(paise, locale);
  const [o, sessions, payouts, invoices] = await Promise.all([gigOverview(session), sessionCounts(session), operatorPayouts(session), operatorInvoices(session)]);
  const s = o.settings;
  const day = (iso: string) => formatInZone(new Date(iso), "Asia/Kolkata", { dateStyle: "medium" });

  return (
    <div className="space-y-6">
      <PageHeader title={t("gigs.operatorTitle")} description={t("gigs.operatorIntro")} />
      <p className="rounded-[var(--radius-md)] border border-border bg-surface-muted px-4 py-3 text-sm leading-relaxed text-fg" data-testid="gig-month">
        {t("gigs.monthLine", {
          month: o.month,
          spent: money(o.spentThisMonthPaise),
          budget: money(s.questionMonthlyBudgetPaise),
          added: o.addedThisMonth,
          waiting: o.waiting,
        })}
      </p>

      <Card>
        <CardHeader title={t("gigs.dueTitle")} description={t("gigs.dueIntro")} />
        <CardBody className="space-y-4">
          {o.due.length === 0 ? (
            <p className="text-sm text-fg-muted" data-testid="gig-due-none">
              {t("gigs.dueNone")}
            </p>
          ) : (
            <ul className="divide-y divide-border" data-testid="gig-due">
              {o.due.map((d) => (
                <li key={d.userId} className="grid gap-3 py-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                  <div className="min-w-0">
                    <p className="break-words text-sm font-medium text-fg">
                      {d.name} · {money(d.amountPaise)}
                    </p>
                    <p className="break-words text-xs text-fg-muted">
                      {d.schoolName} · {t("gigs.questionsCount", { count: d.questions })} · {d.throughMonth}
                    </p>
                    <p className="mt-1 break-all font-mono text-xs text-fg">{d.upiId ? `${d.upiId} (${d.payeeName})` : t("gigs.noUpi")}</p>
                  </div>
                  <PaymentForm userId={d.userId} name={d.name} disabled={!d.upiId} />
                </li>
              ))}
            </ul>
          )}
          {o.accruingPaise > 0 && <p className="text-sm text-fg-muted">{t("gigs.accruing", { amount: money(o.accruingPaise) })}</p>}
        </CardBody>
      </Card>

      <Card>
        <CardHeader title={t("gigs.dialsTitle")} />
        <CardBody>
          <SettingsForm
            testId="gig-settings"
            dials={[
              {
                key: "questionRatePaise",
                label: t("gigs.setRate"),
                value: s.questionRatePaise,
                rupees: true,
              },
              {
                key: "questionFreeCount",
                label: t("gigs.setFree"),
                value: s.questionFreeCount,
              },
              {
                key: "questionMonthlyCap",
                label: t("gigs.setCap"),
                value: s.questionMonthlyCap,
              },
              {
                key: "questionMonthlyBudgetPaise",
                label: t("gigs.setBudget"),
                value: s.questionMonthlyBudgetPaise,
                rupees: true,
              },
              {
                key: "questionDailyLimit",
                label: t("gigs.setDaily"),
                value: s.questionDailyLimit,
              },
              {
                key: "questionPendingLimit",
                label: t("gigs.setPending"),
                value: s.questionPendingLimit,
              },
            ]}
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title={t("gigs.sessionsDials")}
          description={t("gigs.sessionsLine", {
            slots: sessions.upcomingSlots,
            taken: sessions.seatsTaken,
            seats: sessions.upcomingSeats,
          })}
        />
        <CardBody>
          <SettingsForm
            testId="gig-session-settings"
            dials={[
              {
                key: "pupilFreeOneToOnes",
                label: t("gigs.setPupilOne"),
                value: s.pupilFreeOneToOnes,
              },
              {
                key: "pupilFreeWorkshops",
                label: t("gigs.setPupilWork"),
                value: s.pupilFreeWorkshops,
              },
              {
                key: "expertStartOneToOnes",
                label: t("gigs.setExpertStartOne"),
                value: s.expertStartOneToOnes,
              },
              {
                key: "expertStartWorkshops",
                label: t("gigs.setExpertStartWork"),
                value: s.expertStartWorkshops,
              },
              {
                key: "expertMonthlyOneToOnes",
                label: t("gigs.setExpertMonthly"),
                value: s.expertMonthlyOneToOnes,
              },
              {
                key: "expertQuarterlyWorkshops",
                label: t("gigs.setExpertQuarterly"),
                value: s.expertQuarterlyWorkshops,
              },
              {
                key: "teacherMonthlyGuidance",
                label: t("gigs.setTeacherMonthly"),
                value: s.teacherMonthlyGuidance,
              },
              {
                key: "freeCancelHours",
                label: t("gigs.setCancelHours"),
                value: s.freeCancelHours,
              },
              {
                key: "workshopMaxSeats",
                label: t("gigs.setMaxSeats"),
                value: s.workshopMaxSeats,
              },
            ]}
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader title={t("gigs.opCompanyTitle")} description={t("gigs.opCompanyIntro")} />
        <CardBody className="space-y-3" data-testid="gig-company-card">
          {payouts.company.missing.length > 0 && (
            <p className="rounded-[var(--radius-md)] border border-warn/30 bg-warn-soft px-4 py-3 text-sm text-fg" data-testid="gig-company-missing">
              {t("gigs.opCompanyMissing", {
                missing: payouts.company.missing.map((m) => t(`gigs.opMissing${m === "legalName" ? "LegalName" : m === "gstin" ? "Gstin" : "StateCode"}`)).join(", "),
              })}
            </p>
          )}
          <CompanyForm
            initial={{
              legalName: payouts.company.legalName ?? "",
              gstin: payouts.company.gstin ?? "",
              address: payouts.company.address ?? "",
              stateCode: payouts.company.stateCode ?? "",
              sacCode: payouts.company.sacCode,
              invoicePrefix: payouts.company.invoicePrefix,
              gstPercent: payouts.company.gstPercent,
            }}
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader title={t("gigs.opRouteTitle")} description={t("gigs.opRouteIntro")} />
        <CardBody className="space-y-4" data-testid="gig-route">
          <ul className="space-y-1 text-sm" data-testid="gig-route-checklist">
            {[
              [payouts.route.gatewaySet, t("gigs.opRouteGateway", { transport: payouts.transport })],
              [payouts.route.webhookSet, t("gigs.opRouteWebhook")],
              [payouts.route.companySet, t("gigs.opRouteCompany")],
              [payouts.route.activated > 0, t("gigs.opRouteActivated", { count: payouts.route.activated })],
            ].map(([done, label]) => (
              <li key={String(label)} className="flex items-start gap-2" data-done={done ? "yes" : "no"}>
                <span aria-hidden className={done ? "text-ok" : "text-fg-muted"}>
                  {done ? "✓" : "○"}
                </span>
                <span className={done ? "text-fg" : "text-fg-muted"}>{label}</span>
              </li>
            ))}
          </ul>
          <p className="text-xs text-fg-muted">
            {t("gigs.opRouteCounts", {
              inReview: payouts.route.inReview,
              attention: payouts.route.needsAttention,
              ready: payouts.route.readyToLink,
            })}
          </p>
          <LinkAllExperts disabled={!payouts.route.gatewaySet} />
          <div>
            <p className="text-sm font-medium text-fg">{t("gigs.opRouteAccountsTitle")}</p>
            {payouts.routeAccounts.length === 0 ? (
              <p className="text-sm text-fg-muted">{t("gigs.opRouteAccountsNone")}</p>
            ) : (
              <ul className="divide-y divide-border" data-testid="gig-route-accounts">
                {payouts.routeAccounts.map((a) => (
                  <li key={a.expertUserId} className="flex flex-wrap items-start justify-between gap-2 py-2">
                    <div className="min-w-0 flex-1">
                      <p className="break-words text-sm font-medium text-fg">{a.expertName}</p>
                      <p className="text-xs text-fg-muted">{[!a.kycVerified ? t("gigs.opRouteNoKyc") : null, !a.linked && !a.readyToLink ? t("gigs.opRouteIncomplete") : null, a.needsResend ? t("gigs.opRouteResend") : null, ...a.requirements.map((r) => t("gigs.routeRequirement", { field: r.field }))].filter(Boolean).join(" · ")}</p>
                      {a.error && <p className="break-all font-mono text-xs text-danger">{a.error}</p>}
                      <SuspendPayee expertUserId={a.expertUserId} name={a.expertName} suspended={a.suspended} />
                    </div>
                    <span className="flex flex-wrap gap-1">
                      <Badge tone={a.status === "ACTIVATED" ? "ok" : a.status === "NEEDS_CLARIFICATION" ? "warn" : a.status === "SUSPENDED" ? "danger" : "neutral"}>{t(`gigs.routeStatus${a.status}`)}</Badge>
                      {a.suspended && <Badge tone="danger">{t("gigs.opPayeeSuspended")}</Badge>}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title={t("gigs.opPayoutsTitle")} description={t("gigs.opPayoutsIntro")} />
        <CardBody className="space-y-4" data-testid="gig-payouts">
          <PaymentsSwitch on={payouts.paymentsEnabled} canTurnOn={payouts.route.ready} />
          {!payouts.paymentsEnabled && !payouts.route.ready && <p className="text-xs text-fg-muted">{t("gigs.refuseRouteNotReady")}</p>}
          <p className="text-xs text-fg-muted">{t("gigs.opTransport", { transport: payouts.transport })}</p>
          <dl className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
            {[[t("gigs.opCommission"), payouts.commissionThisMonthPaise], [t("gigs.opGst"), payouts.gstThisMonthPaise], [t("gigs.opHeld"), payouts.heldPaise], [t("gigs.opReleased"), payouts.releasedThisMonthPaise], ...(payouts.duePaise > 0 ? [[t("gigs.opDue"), payouts.duePaise]] : []), ...(payouts.paidOutThisMonthPaise > 0 ? [[t("gigs.opPaidOut"), payouts.paidOutThisMonthPaise]] : []), [t("gigs.opRefunded"), payouts.refundedThisMonthPaise]].map(([label, value]) => (
              <div key={String(label)} className="rounded-[var(--radius-md)] border border-border bg-surface px-3 py-2">
                <dt className="text-xs uppercase tracking-wide text-fg-muted">{label}</dt>
                <dd className="text-lg font-bold tabular-nums text-fg">{money(Number(value))}</dd>
              </div>
            ))}
          </dl>
          {payouts.toPay.length > 0 && (
            <div>
              <p className="text-sm font-medium text-fg">{t("gigs.opToPayTitle")}</p>
              <p className="text-xs text-fg-muted">
                {t("gigs.opLegacyNote")} {t("gigs.opToPayIntro")}
              </p>
              {
                <ul className="divide-y divide-border" data-testid="gig-to-pay">
                  {payouts.toPay.map((p) => {
                    const payee = p.payee;
                    const canRecord = payouts.company.missing.length === 0 && payee.status === "ACTIVE";
                    return (
                      <li key={p.id} className="grid gap-3 py-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                        <div className="min-w-0">
                          <p className="break-words text-sm font-medium text-fg">
                            {p.expertName} ·{" "}
                            {t("gigs.payoutLine", {
                              amount: money(p.netPaise),
                              count: p.paymentsCount,
                            })}
                          </p>
                          <p className="text-xs text-fg-muted">{day(p.createdAt)}</p>
                          {payee.payeeName ? (
                            <p className="mt-1 break-all font-mono text-xs text-fg">
                              {payee.payeeName} ·{" "}
                              {payee.upiId
                                ? t("gigs.payeeUpiLine", { upiId: payee.upiId })
                                : t("gigs.payeeBankLine", {
                                    last4: payee.bankLast4 ?? "",
                                    ifsc: payee.ifsc ?? "",
                                  })}{" "}
                              ·{" "}
                              {t("gigs.opPayeeState", {
                                code: payee.gstStateCode ?? "",
                              })}
                              {payee.gstin ? ` · ${t("gigs.opPayeeGstin", { gstin: payee.gstin })}` : ""}
                            </p>
                          ) : (
                            <p className="mt-1 text-xs text-fg-muted">{t("gigs.opPayeeNone")}</p>
                          )}
                          {payee.status === "SUSPENDED" && <Badge tone="danger">{t("gigs.opPayeeSuspended")}</Badge>}
                        </div>
                        <PayoutForm payoutId={p.id} name={p.expertName} disabled={!canRecord} />
                      </li>
                    );
                  })}
                </ul>
              }
            </div>
          )}
          <div>
            <p className="text-sm font-medium text-fg">{t("gigs.opFailures")}</p>
            {payouts.failures.length === 0 ? (
              <p className="text-sm text-fg-muted" data-testid="gig-failures-none">
                {t("gigs.opFailuresNone")}
              </p>
            ) : (
              <ul className="divide-y divide-border" data-testid="gig-failures">
                {payouts.failures.map((f) => (
                  <li key={f.paymentId} className="flex flex-wrap items-center justify-between gap-2 py-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-fg">
                        {f.expertName} · {money(f.amountPaise)} · {t(`gigs.opAction${f.action}`)} · {t("gigs.opAttempts", { count: f.attempts })}
                      </p>
                      {f.lastError && <p className="break-all font-mono text-xs text-fg-muted">{f.lastError}</p>}
                    </div>
                    <RetryPayment paymentId={f.paymentId} />
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <p className="text-sm font-medium text-fg">{t("gigs.opPaidTitle")}</p>
            {payouts.paid.length === 0 ? (
              <p className="text-sm text-fg-muted">{t("gigs.opPayoutsNone")}</p>
            ) : (
              <ul className="divide-y divide-border" data-testid="gig-payout-rows">
                {payouts.paid.map((p) => (
                  <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-fg">
                        {p.expertName} ·{" "}
                        {t("gigs.payoutLine", {
                          amount: money(p.netPaise),
                          count: p.paymentsCount,
                        })}
                      </p>
                      <p className="text-xs text-fg-muted">
                        {p.paidAt
                          ? p.status === "RELEASED"
                            ? t("gigs.opReleasedLine", { date: day(p.paidAt) })
                            : t("gigs.paidOutLine", {
                                date: day(p.paidAt),
                                reference: p.reference ?? "",
                              })
                          : ""}
                        {p.invoiceNumber ? ` · ${p.invoiceNumber}` : ""}
                        {p.note ? ` · ${p.note}` : ""}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <p className="text-sm font-medium text-fg">{t("gigs.opInvoicesTitle")}</p>
            {invoices.invoices.length === 0 ? (
              <p className="text-sm text-fg-muted">{t("gigs.opInvoicesNone")}</p>
            ) : (
              <ul className="divide-y divide-border" data-testid="gig-invoices">
                {invoices.invoices.map((i) => (
                  <li key={i.id} className="py-2 text-sm text-fg">
                    {t("gigs.opInvoiceLine", {
                      number: i.number,
                      name: i.expertName,
                      date: day(i.issuedAt),
                      total: money(i.totalPaise),
                    })}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title={t("gigs.paymentsTitle")} />
        <CardBody>
          {o.payments.length === 0 ? (
            <p className="py-4 text-center text-sm text-fg-muted">{t("gigs.paymentsNone")}</p>
          ) : (
            <ul className="divide-y divide-border" data-testid="gig-payments">
              {o.payments.map((p) => (
                <li key={p.id} className="py-3">
                  <p className="break-words text-sm font-medium text-fg">
                    {p.name} · {money(p.amountPaise)}
                  </p>
                  <p className="break-all text-xs text-fg-muted">
                    {formatInZone(new Date(p.paidAt), "Asia/Kolkata", {
                      dateStyle: "medium",
                    })}{" "}
                    · {t("gigs.questionsCount", { count: p.questions })} · <span className="font-mono">{p.utr}</span> · <span className="font-mono">{p.upiId}</span>
                  </p>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
