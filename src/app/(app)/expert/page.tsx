import type { Metadata } from "next";
import Link from "next/link";
import { BriefcaseIcon, ChatCircleDotsIcon } from "@phosphor-icons/react/ssr";
import { requireExpert } from "@/lib/tenancy";
import { listBookings } from "@/lib/experts";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/states";
import { getT } from "@/lib/i18n/server";
import { EXPERT_BOOKING_STATUS_KEY, type ExpertBookingStatus } from "@/lib/constants";
import { formatUtcMoment } from "@/lib/dates";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("meta.myBookings") };
}

export default async function ExpertHome() {
  const t = await getT();
  const ctx = await requireExpert();
  const bookings = await listBookings(ctx);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-fg sm:text-3xl">
          {t("expert.bookings")}
        </h1>
        <p className="mt-1 text-sm text-fg-muted">{t("expert.bookingsBody")}</p>
      </div>

      {bookings.length === 0 ? (
        <EmptyState
          icon={<BriefcaseIcon weight="duotone" className="size-8" />}
          title={t("expert.noBookings")}
          description={t("expert.noBookingsBody")}
        />
      ) : (
        <ul className="space-y-3">
          {bookings.map((booking) => (
            <li key={booking.id}>
              <Card interactive>
                <Link href={`/expert/bookings/${booking.id}`} className="block">
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
