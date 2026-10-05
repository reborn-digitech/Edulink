import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/tenancy";
import { familySessions, type BookingStatus } from "@/lib/gig-sessions";
import { formatInZone } from "@/lib/dates";
import { getLocale, getT } from "@/lib/i18n/server";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { formatPaise } from "@edulink/i18n";
import { BookSeat, ResumeCheckout, SeatActions } from "./family-forms";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("gigs.sessionsTitle"), robots: { index: false, follow: false } };
}

const TONE: Record<BookingStatus, "info" | "ok" | "neutral" | "warn" | "danger"> = { PENDING_CONSENT: "info", PENDING_PAYMENT: "warn", CONFIRMED: "ok", CANCELLED: "neutral", DELIVERED: "ok", MISSED: "warn", UNHELD: "danger" };

/**
 * Sessions and workshops, for a pupil and for a guardian: the free allowance
 * of the school year, the seats they hold (with the meeting link only while
 * one is confirmed), and the times open to book. A pupil's own ask waits for
 * a guardian, who answers it here.
 */
export default async function SessionsPage({ searchParams }: { searchParams: Promise<{ checkout?: string }> }) {
  const ctx = await requireUser();
  if (ctx.role !== "STUDENT" && ctx.role !== "PARENT") redirect("/");
  const t = await getT();
  const locale = await getLocale();
  const { children, freeCancelHours, paymentsOn } = await familySessions(ctx);
  const byGuardian = ctx.role === "PARENT";
  // A checkout the phone started: the gateway's script runs here, on the web, on the phone's own order.
  const { checkout: resume } = await searchParams;
  const money = (paise: number) => formatPaise(paise, locale);

  return (
    <div className="space-y-6">
      <PageHeader title={t("gigs.sessionsTitle")} description={t("gigs.sessionsIntro")} />
      {byGuardian && resume && <ResumeCheckout paymentId={resume} />}
      {children.map((c) => {
        const when = (iso: string) => formatInZone(new Date(iso), c.timeZone, { dateStyle: "medium", timeStyle: "short" }, locale);
        return (
          <section key={c.id} className="space-y-4" data-testid="session-child">
            {byGuardian && (
              <h2 className="text-base font-semibold text-fg">
                {c.name} · {c.schoolName}
              </h2>
            )}
            <p className="rounded-[var(--radius-md)] border border-border bg-surface-muted px-4 py-3 text-sm leading-relaxed text-fg" data-testid="session-allowance">
              {t("gigs.allowanceLine", { oneLeft: c.allowance.ONE_TO_ONE.left, oneAllowed: c.allowance.ONE_TO_ONE.allowed, workLeft: c.allowance.WORKSHOP.left, workAllowed: c.allowance.WORKSHOP.allowed })}
            </p>
            <Card>
              <CardHeader title={t("gigs.yourSeats")} />
              <CardBody>
                {c.bookings.length === 0 ? (
                  <p className="py-4 text-center text-sm text-fg-muted">{t("gigs.noSeats")}</p>
                ) : (
                  <ul className="divide-y divide-border" data-testid="session-seats">
                    {c.bookings.map((b) => (
                      <li key={b.id} className="space-y-2 py-3">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="break-words text-sm font-medium text-fg">{b.title}</p>
                            <p className="text-xs text-fg-muted">
                              {t(`gigs.kind${b.kind}`)} · {when(b.startsAt)} · {t("gigs.withProvider", { name: b.providerName })}
                              {b.lateCancel ? ` · ${t("gigs.lateCancelNote")}` : ""}
                              {b.paid ? ` · ${t("gigs.paidSeat")}` : ""}
                            </p>
                            {b.payment && b.payment.status !== "INITIATED" && b.payment.status !== "FAILED" && (
                              <p className="text-xs text-fg-muted" data-testid="session-payment-line">
                                {b.payment.status === "REFUNDED" ? t("gigs.refundLine", { amount: money(b.payment.amountPaise) }) : t("gigs.paymentLine", { amount: money(b.payment.amountPaise) })}
                                {" · "}
                                <a href={`/api/v1/gigs/payments/${b.payment.paymentId}/receipt`} target="_blank" rel="noreferrer noopener" className="underline" data-testid="session-receipt-link">
                                  {t("gigs.receiptLink")}
                                </a>
                              </p>
                            )}
                            {b.status === "CANCELLED" && b.paid && b.payment && (b.payment.status === "PAID" || b.payment.status === "HELD") && !b.lateCancel && <p className="text-xs text-fg-muted">{t("gigs.refundWaitingLine", { amount: money(b.payment.amountPaise) })}</p>}
                          </div>
                          <Badge tone={TONE[b.status]}>{t(`gigs.bookingStatus${b.status}`)}</Badge>
                        </div>
                        {b.meetingUrl && (
                          <p className="text-sm">
                            <a href={b.meetingUrl} target="_blank" rel="noreferrer noopener" className="tap inline-flex items-center font-medium text-accent-strong underline underline-offset-4" data-testid="session-link">
                              {t("gigs.joinLink")}
                            </a>
                            <span className="ml-2 text-xs text-fg-muted">{t("gigs.linkHint")}</span>
                          </p>
                        )}
                        <SeatActions bookingId={b.id} title={b.title} canConsent={b.canConsent} canPay={b.canPay} payAmount={b.pricePaise} canCancel={b.canCancel} canRate={b.canRate} canReportUnheld={b.canReportUnheld} confirmed={b.status === "CONFIRMED"} lateHours={freeCancelHours} />
                      </li>
                    ))}
                  </ul>
                )}
              </CardBody>
            </Card>
            <Card>
              <CardHeader title={t("gigs.openTitle")} />
              <CardBody>
                {c.open.length === 0 ? (
                  <p className="py-4 text-center text-sm text-fg-muted">{t("gigs.noneOpen")}</p>
                ) : (
                  <ul className="divide-y divide-border" data-testid="session-open">
                    {c.open.map((s) => (
                      <li key={s.id} className="flex flex-wrap items-start justify-between gap-3 py-3">
                        <div className="min-w-0 flex-1">
                          <p className="break-words text-sm font-medium text-fg">{s.title}</p>
                          <p className="text-xs text-fg-muted">
                            {t(`gigs.kind${s.kind}`)} · {when(s.startsAt)} · {t("gigs.withProvider", { name: s.providerName })} ({t(`gigs.provider${s.providerKind}`)})
                            {s.kind === "WORKSHOP" ? ` · ${t("gigs.seatsLeft", { count: s.seatsLeft })}` : ""}
                          </p>
                          {s.providerHeadline && <p className="text-xs text-fg-muted">{s.providerHeadline}</p>}
                          {s.pricePaise > 0 && (
                            <p className="text-xs font-medium text-fg" data-testid="session-open-price">
                              {s.freeSeat ? t("gigs.seatFree") : t("gigs.seatPrice", { amount: money(s.pricePaise) })}
                            </p>
                          )}
                        </div>
                        <BookSeat slotId={s.id} childId={c.id} byGuardian={byGuardian} title={s.title} priceLabel={s.pricePaise > 0 && !s.freeSeat && paymentsOn ? t("gigs.payNow", { amount: money(s.pricePaise) }) : null} />
                      </li>
                    ))}
                  </ul>
                )}
              </CardBody>
            </Card>
          </section>
        );
      })}
    </div>
  );
}
