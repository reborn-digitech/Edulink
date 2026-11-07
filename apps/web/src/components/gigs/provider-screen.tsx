import { mySlots, type BookingStatus } from "@/lib/gig-sessions";
import { gigSettings } from "@/lib/gig-questions";
import { formatInZone } from "@/lib/dates";
import { getLocale, getT } from "@/lib/i18n/server";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import type { ActiveContext } from "@/lib/session";
import { formatPaise } from "@edulink/i18n";
import { CancelWithReason, CloseSeat, OfferForm, PremiumMeetingSwitch } from "./provider-forms";
import { PaidGateList, TeacherGateList } from "./paid-gate";

const TONE: Record<BookingStatus, "info" | "ok" | "neutral" | "warn" | "danger"> = { PENDING_CONSENT: "info", PENDING_PAYMENT: "warn", CONFIRMED: "ok", CANCELLED: "neutral", DELIVERED: "ok", MISSED: "warn", UNHELD: "danger" };

/**
 * A provider's side of sessions, the same for an expert and a teacher: what
 * they have given free against what is asked, the form that offers a time,
 * and every time they have offered with who has a seat in it. A seat is
 * marked once its time has begun; a time is taken back with a reason.
 */
export async function ProviderScreen({ ctx }: { ctx: ActiveContext }) {
  const t = await getT();
  const locale = await getLocale();
  const [view, settings] = await Promise.all([mySlots(ctx), gigSettings()]);
  const when = (iso: string) => formatInZone(new Date(iso), view.timeZone, { dateStyle: "medium", timeStyle: "short" }, locale);
  const d = view.duty;
  const gate = view.gate;
  const teacherGate = view.teacherGate;
  const earnings = view.earnings;

  return (
    <div className="space-y-6">
      <PageHeader title={t("gigs.providerTitle")} description={t(view.kind === "EXPERT" ? "gigs.providerIntroEXPERT" : "seats.providerIntroTEACHER")} />
      {!view.enabled || !d ? (
        <p className="rounded-[var(--radius-md)] border border-border bg-surface-muted px-4 py-3 text-sm text-fg" data-testid="guidance-off">
          {t("gigs.guidanceOff")}
        </p>
      ) : (
        <>
          <div className="rounded-[var(--radius-md)] border border-border bg-surface-muted px-4 py-3 text-sm leading-relaxed text-fg" data-testid="provider-duty">
            {view.kind === "EXPERT" ? (
              <>
                <p>{t("gigs.dutyStart", { done: d.deliveredOneToOnes, workshops: d.heldWorkshops, start: d.startOneToOnes, startWorkshops: d.startWorkshops })}</p>
                <p>{t("gigs.dutyStanding", { month: d.oneToOnesThisMonth, monthly: d.monthlyOneToOnes, quarter: d.workshopsThisQuarter, quarterly: d.quarterlyWorkshops })}</p>
              </>
            ) : (
              <p>{t("gigs.dutyTeacher", { done: d.deliveredOneToOnes, month: d.oneToOnesThisMonth, monthly: d.monthlyOneToOnes })}</p>
            )}
          </div>
          <Card>
            <CardHeader title={t("gigs.offerTitle")} />
            <CardBody className="space-y-4">
              <OfferForm workshops={view.kind === "EXPERT"} maxSeats={settings.workshopMaxSeats} gate={gate ?? teacherGate} meeting={view.meeting} />
              {/* The provider's meeting account (decision 0008): premium lifts the free-account length cap. */}
              <PremiumMeetingSwitch meeting={view.meeting} />
              {gate && (
                <div className="rounded-[var(--radius-md)] border border-border bg-surface-muted px-4 py-3" data-testid="paid-gate">
                  <p className="text-sm font-medium text-fg">{t("gigs.gateTitle")}</p>
                  <p className="mb-2 text-xs text-fg-muted">{t("seats.gateIntro")}</p>
                  <PaidGateList gate={gate} />
                </div>
              )}
              {teacherGate && (
                <div className="rounded-[var(--radius-md)] border border-border bg-surface-muted px-4 py-3" data-testid="teacher-paid-gate">
                  <p className="text-sm font-medium text-fg">{t("seats.teacherGateTitle")}</p>
                  <p className="mb-2 text-xs text-fg-muted">{t("seats.teacherGateIntro")}</p>
                  <TeacherGateList gate={teacherGate} />
                </div>
              )}
            </CardBody>
          </Card>
          {/* A teacher's sold seats (seats, 17 Oct 2026): an expert reads theirs, seat by seat, on /expert/earnings. */}
          {view.kind === "TEACHER" && earnings && earnings.seats + earnings.refundedPaise > 0 && (
            <Card>
              <CardHeader title={t("seats.earningsTitle")} description={t("seats.earningsNote", { percent: teacherGate?.commissionPercent ?? 0 })} />
              <CardBody>
                <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4" data-testid="provider-earnings">
                  {(
                    [
                      ["seats.earningsHeld", earnings.heldPaise],
                      ["seats.earningsDue", earnings.duePaise],
                      ["seats.earningsPaid", earnings.paidPaise],
                      ["seats.earningsRefunded", earnings.refundedPaise],
                    ] as const
                  ).map(([key, paise]) => (
                    <div key={key}>
                      <dt className="text-xs text-fg-muted">{t(key)}</dt>
                      <dd className="font-semibold tabular-nums text-fg">{formatPaise(paise, locale)}</dd>
                    </div>
                  ))}
                </dl>
              </CardBody>
            </Card>
          )}
          <Card>
            <CardHeader title={t("gigs.yourSlots")} />
            <CardBody>
              {view.slots.length === 0 ? (
                <p className="text-sm text-fg-muted">{t("gigs.noSlots")}</p>
              ) : (
                <ul className="divide-y divide-border" data-testid="provider-slots">
                  {view.slots.map((s) => (
                    <li key={s.id} className="space-y-2 py-3" data-testid="provider-slot">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="break-words text-sm font-medium text-fg">{s.title}</p>
                          <p className="text-xs text-fg-muted">
                            {t(`gigs.kind${s.kind}`)} · {when(s.startsAt)} · {t("gigs.seatsOf", { taken: s.seatsTaken, seats: s.seats })}
                            {s.pricePaise > 0 ? ` · ${t("gigs.seatPrice", { amount: formatPaise(s.pricePaise, locale) })}` : ""}
                          </p>
                        </div>
                        {s.cancelled ? <Badge tone="neutral">{t("gigs.slotIsCancelled")}</Badge> : !s.started && <CancelWithReason id={s.id} what="slot" title={s.title} />}
                      </div>
                      {/* The provider's own room, always theirs to open (seats, 17 Oct 2026). */}
                      {!s.cancelled && s.meetingUrl.startsWith("https://") && (
                        <a href={s.meetingUrl} target="_blank" rel="noreferrer noopener" className="tap inline-flex items-center text-sm font-medium text-accent-strong underline underline-offset-4" aria-label={[t("seats.openRoom"), s.title].join(": ")} data-testid="provider-room">
                          {t("seats.openRoom")}
                        </a>
                      )}
                      {s.bookings.length > 0 && (
                        <ul className="space-y-2 rounded-[var(--radius-md)] bg-surface-muted px-3 py-2">
                          {s.bookings.map((b) => (
                            <li key={b.id} className="space-y-1.5" data-testid="provider-seat">
                              <div className="flex flex-wrap items-start justify-between gap-2">
                                <p className="min-w-0 flex-1 break-words text-sm text-fg">
                                  <span className="font-medium">{b.pupilName}</span> · {b.schoolName}
                                  <span className="block text-xs text-fg-muted">{b.purpose}</span>
                                </p>
                                <span className="inline-flex flex-wrap gap-1">
                                  {b.paid && (
                                    <Badge tone="accent" size="sm">
                                      {t("gigs.paidSeat")}
                                    </Badge>
                                  )}
                                  <Badge tone={TONE[b.status]}>{t(`gigs.bookingStatus${b.status}`)}</Badge>
                                </span>
                              </div>
                              {b.status === "CONFIRMED" && s.started && <CloseSeat bookingId={b.id} pupilName={b.pupilName} />}
                              {(b.status === "CONFIRMED" || b.status === "PENDING_CONSENT" || b.status === "PENDING_PAYMENT") && !s.started && <CancelWithReason id={b.id} what="seat" title={b.pupilName} />}
                              {b.rating !== null && (
                                <p className="text-xs text-fg-muted">
                                  {t("gigs.ratingGiven", { rating: b.rating })}
                                  {b.feedback ? ` · ${b.feedback}` : ""}
                                </p>
                              )}
                            </li>
                          ))}
                        </ul>
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
