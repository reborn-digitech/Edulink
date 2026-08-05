import type { Metadata } from "next";
import Link from "next/link";
import { BriefcaseIcon, ChatCircleDotsIcon } from "@phosphor-icons/react/ssr";
import { requireExpert } from "@/lib/tenancy";
import { listBookings } from "@/lib/experts";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/states";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("meta.myBookings") };
}

export default async function ExpertHome() {
  const ctx = await requireExpert();
  const bookings = await listBookings(ctx);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-fg sm:text-3xl">Bookings</h1>
        <p className="mt-1 text-sm text-fg-muted">
          Schools that have booked one of your times. You can see a school only while a booking
          with them is live.
        </p>
      </div>

      {bookings.length === 0 ? (
        <EmptyState
          icon={<BriefcaseIcon weight="duotone" className="size-8" />}
          title="No bookings yet"
          description="Offer some times under Availability and schools will be able to book them."
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
                        {booking.status.toLowerCase()}
                      </Badge>
                      <span className="text-sm font-semibold text-fg">{booking.schoolName}</span>
                      {booking.unread > 0 && (
                        <Badge tone="accent" size="sm">
                          <ChatCircleDotsIcon weight="fill" className="mr-1 inline size-3" />
                          {booking.unread} new
                        </Badge>
                      )}
                      <span className="ml-auto text-xs text-fg-muted">
                        {booking.startsAt.toUTCString().slice(0, 22)}
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
