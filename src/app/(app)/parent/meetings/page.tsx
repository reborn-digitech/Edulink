import type { Metadata } from "next";
import { CalendarCheckIcon, ChatCircleIcon, WarningIcon, CheckCircleIcon } from "@phosphor-icons/react/ssr";
import { requireParent } from "@/lib/tenancy";
import { db } from "@/lib/db";
import { listContexts } from "@/lib/session";
import { openSlotsFor, myBookings } from "@/lib/meetings";
import { formatInZone } from "@/lib/dates";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/states";
import { getT } from "@/lib/i18n/server";
import { bookSlotAction, cancelBookingAction } from "./actions";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("meetings.parentTitle") };
}

/**
 * The family's side: the open windows of the teachers who actually teach
 * their children, one tap to claim one, and their own upcoming meetings.
 * Times render in the school's zone — the meeting happens at the school.
 */
export default async function ParentMeetingsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; booked?: string }>;
}) {
  const session = await requireParent();
  const t = await getT();
  const { error, booked } = await searchParams;

  const { children } = await listContexts(session.user.id);
  const [open, mine, school] = await Promise.all([
    openSlotsFor(session.user.id),
    myBookings(session.user.id),
    children[0]
      ? db.school.findUnique({
          where: { id: children[0].schoolId },
          select: { timezone: true },
        })
      : Promise.resolve(null),
  ]);
  const timezone = school?.timezone ?? "UTC";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-fg sm:text-3xl">
          {t("meetings.parentTitle")}
        </h1>
        <p className="mt-1 text-sm text-fg-muted">{t("meetings.parentIntro")}</p>
      </div>

      {error && (
        <Card>
          <CardBody className="flex items-center gap-2 text-sm text-danger">
            <WarningIcon weight="fill" className="size-4 shrink-0" />
            {error}
          </CardBody>
        </Card>
      )}
      {booked && (
        <Card>
          <CardBody className="flex items-center gap-2 text-sm text-ok">
            <CheckCircleIcon weight="fill" className="size-4 shrink-0" />
            {t("meetings.bookedNote")}
          </CardBody>
        </Card>
      )}

      {mine.length > 0 && (
        <Card>
          <CardHeader
            icon={<CalendarCheckIcon weight="duotone" className="size-5" />}
            title={t("meetings.mineTitle")}
          />
          <CardBody className="p-0">
            <ul className="divide-y divide-border">
              {mine.map((booking) => (
                <li
                  key={booking.bookingId}
                  className="flex flex-wrap items-center justify-between gap-3 px-5 py-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-fg">
                      {t("meetings.withTeacher", { teacher: booking.teacherName })} ·{" "}
                      {t("meetings.aboutChild", { child: booking.childName })}
                    </p>
                    <p className="mt-0.5 text-xs text-fg-muted">
                      {formatInZone(booking.startsAt, timezone)}
                      {booking.location ? ` · ${booking.location}` : ""}
                    </p>
                  </div>
                  <form action={cancelBookingAction}>
                    <input type="hidden" name="bookingId" value={booking.bookingId} />
                    <Button type="submit" size="sm" variant="ghost">
                      {t("common.cancel")}
                    </Button>
                  </form>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      )}

      <Card>
        <CardHeader
          icon={<ChatCircleIcon weight="duotone" className="size-5" />}
          title={t("meetings.openTitle")}
          description={t("meetings.openHint")}
        />
        <CardBody className="p-0">
          {open.length === 0 ? (
            <div className="px-5 py-6">
              <EmptyState
                icon={<CalendarCheckIcon weight="duotone" className="size-8" />}
                title={t("meetings.openEmptyTitle")}
                description={t("meetings.openEmptyBody")}
              />
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {open.map((slot) => (
                <li key={slot.id} className="px-5 py-3">
                  <form action={bookSlotAction} className="flex flex-wrap items-center justify-between gap-3">
                    <input type="hidden" name="slotId" value={slot.id} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-fg">
                        {t("meetings.withTeacher", { teacher: slot.teacherName })}
                      </p>
                      <p className="mt-0.5 text-xs text-fg-muted">
                        {formatInZone(slot.startsAt, timezone)} –{" "}
                        {formatInZone(slot.endsAt, timezone, { timeStyle: "short" })}
                        {slot.location ? ` · ${slot.location}` : ""}
                        {slot.note ? ` · ${slot.note}` : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {children.length > 1 ? (
                        <select
                          name="studentMembershipId"
                          className="rounded-lg border border-border bg-surface px-2 py-1.5 text-sm text-fg"
                        >
                          {children.map((child) => (
                            <option key={child.studentMembershipId} value={child.studentMembershipId}>
                              {child.name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="hidden"
                          name="studentMembershipId"
                          value={children[0]?.studentMembershipId ?? ""}
                        />
                      )}
                      <Button type="submit" size="sm">
                        {t("meetings.book")}
                      </Button>
                    </div>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
