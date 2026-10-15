import type { Metadata } from "next";
import Link from "next/link";
import { BriefcaseIcon, ChatCircleDotsIcon, GiftIcon } from "@phosphor-icons/react/ssr";
import { requireExpert } from "@/lib/tenancy";
import { listBookings } from "@/lib/experts";
import { freeDutyRemaining } from "@/lib/gig-sessions";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/states";
import { getT } from "@/lib/i18n/server";
import { EXPERT_BOOKING_STATUS_KEY, type ExpertBookingStatus } from "@/lib/constants";
import { formatUtcMoment } from "@/lib/dates";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { accessTo } from "@/lib/platform-features";
import { PlanCard } from "@/components/plan-card";
import { UserIcon } from "@phosphor-icons/react/ssr";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("meta.myBookings") };
}

export default async function ExpertHome() {
  const t = await getT();
  const ctx = await requireExpert();
  // Expert sessions switched off on the platform (15 Oct 2026): the expert still signs in and keeps their profile,
  // and their home says, in one sentence, that sessions are not open yet; nothing else of the sessions is drawn.
  // plans (16 Oct 2026): sessions on, but the EXPERT plan asked for and not held — the plan card, the profile still theirs.
  const access = await accessTo(["EXPERT_SESSIONS"], ctx);
  if (access.state === "plan") return <PlanCard plan={access.plan} feature={access.feature} />;
  if (access.state === "off") {
    return (
      <div className="space-y-5">
        <PageHeader title={t("expert.bookings")} />
        <EmptyState
          icon={<BriefcaseIcon weight="duotone" className="size-8" />}
          title={t("platformFeatures.expertNotOpen")}
          action={
            <Button asChild variant="secondary" icon={<UserIcon weight="bold" />}>
              <Link href="/expert/profile">{t("nav.profile")}</Link>
            </Button>
          }
        />
      </div>
    );
  }
  const [bookings, duty] = await Promise.all([listBookings(ctx), freeDutyRemaining(ctx.user.id)]);
  const dutyLines = [
    duty.oneToOnes > 0 ? (duty.stage.oneToOnes === "START" ? t("gigs.freeDutyStartOneToOnes", { count: duty.oneToOnes, start: duty.asked.startOneToOnes }) : t("gigs.freeDutyMonthOneToOnes", { count: duty.oneToOnes })) : null,
    duty.workshops > 0 ? (duty.stage.workshops === "START" ? t("gigs.freeDutyStartWorkshops", { count: duty.workshops, start: duty.asked.startWorkshops }) : t("gigs.freeDutyQuarterWorkshops", { count: duty.workshops })) : null,
  ].filter((line): line is string => line !== null);

  return (
    <div className="space-y-5">
      <PageHeader title={t("expert.bookings")} description={t("expert.bookingsBody")} />

      {/* Decision 0004's free duty, from the one function that gates a price (freeDutyRemaining). */}
      <Card data-testid="free-duty">
        <CardHeader icon={<GiftIcon weight="duotone" className="size-5" />} title={t("gigs.freeDutyTitle")} description={t("gigs.freeDutyBody")} />
        <CardBody>
          {dutyLines.length === 0 ? (
            <p className="text-sm font-medium text-ok">{t("gigs.freeDutyDone")}</p>
          ) : (
            <ul className="space-y-1 text-sm text-fg">
              {dutyLines.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          )}
          <p className="mt-2 text-xs text-fg-muted">
            <Link href="/expert/sessions" className="font-medium text-accent hover:underline">
              {t("gigs.providerTitle")}
            </Link>
          </p>
        </CardBody>
      </Card>

      {bookings.length === 0 ? (
        <EmptyState
          icon={<BriefcaseIcon weight="duotone" className="size-8" />}
          title={t("expert.noBookings")}
          description={t("expert.noBookingsBody")}
          action={
            <Button asChild variant="secondary">
              <Link href="/expert/availability">{t("expert.availabilityCta")}</Link>
            </Button>
          }
        />
      ) : (
        <ul className="space-y-3">
          {bookings.map((booking) => (
            <li key={booking.id}>
              <Card interactive>
                <Link href={`/experts/bookings/${booking.id}`} className="block">
                  <CardBody className="space-y-2 pt-5">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone={booking.status === "CANCELLED" ? "danger" : "accent"} size="sm">
                        {/* The KEY, not `.toLowerCase()` on the column — which
                            put "confirmed" in the middle of a Marathi page.
                            The `??` covers a status the table has not met. */}
                        {EXPERT_BOOKING_STATUS_KEY[booking.status as ExpertBookingStatus]
                          ? t(EXPERT_BOOKING_STATUS_KEY[booking.status as ExpertBookingStatus])
                          : booking.status.toLowerCase()}
                      </Badge>
                      <span className="text-sm font-semibold text-fg">{booking.schoolName}</span>
                      {booking.unread > 0 && (
                        <Badge tone="accent" size="sm">
                          <ChatCircleDotsIcon weight="fill" className="mr-1 inline size-3" />
                          {t("expert.newCount", { count: booking.unread })}
                        </Badge>
                      )}
                      <span className="ml-auto text-xs text-fg-muted">
                        {formatUtcMoment(booking.startsAt)}
                      </span>
                    </div>
                    <p className="text-[0.9375rem] text-fg-muted">{booking.topic}</p>
                  </CardBody>
                </Link>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
