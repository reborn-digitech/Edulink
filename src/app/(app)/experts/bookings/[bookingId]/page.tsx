import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon } from "@phosphor-icons/react/ssr";
import { requireApiUser, AccessError } from "@/lib/tenancy";
import { getBooking } from "@/lib/experts";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookingThread } from "./thread";
import { CancelButton } from "./cancel-button";
import { getT, getLocale } from "@/lib/i18n/server";
import { formatUtcMoment } from "@/lib/dates";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("meta.booking"), robots: { index: false, follow: false } };
}

export default async function BookingPage({
  params,
}: {
  params: Promise<{ bookingId: string }>;
}) {
  const t = await getT();
  const locale = await getLocale();
  const ctx = await requireApiUser();
  const { bookingId } = await params;

  let booking;
  try {
    booking = await getBooking(ctx, bookingId);
  } catch (error) {
    if (error instanceof AccessError) notFound();
    throw error;
  }

  const isExpert = ctx.role === "EXPERT";

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <Link
        href={isExpert ? "/expert" : "/experts"}
        className="inline-flex items-center gap-1.5 text-sm text-fg-muted hover:text-fg"
      >
        <ArrowLeftIcon weight="bold" className="size-4" />
        {t("common.back")}
      </Link>

      <div>
        <h1 className="text-2xl font-bold tracking-tight text-fg">{booking.topic}</h1>
        <p className="mt-1 text-sm text-fg-muted">
          {isExpert ? booking.schoolName : booking.expertName} ·{" "}
          {formatUtcMoment(booking.startsAt, locale)}
        </p>
      </div>

      {booking.status === "CANCELLED" && (
        <Badge tone="danger" size="sm">{t("expert.bookingCancelled")}</Badge>
      )}

      {/*
        ⚠ NOTHING COULD CANCEL A BOOKING UNTIL THIS LINE. `cancelBooking` and the
        `cancel` server action both existed and no component called either, so a
        school that booked the wrong hour could not release it. See the note on
        `CancelButton`.

        NOT OFFERED ONCE THE TIME HAS PASSED. Cancelling something that already
        happened does not free anything anybody can use, and it would let a
        session be quietly marked as never having taken place. A past booking
        simply stops offering the control.
      */}
      {booking.status !== "CANCELLED" && booking.startsAt.getTime() > Date.now() && (
        <CancelButton bookingId={booking.id} />
      )}

      <Card>
        <CardBody className="pt-5">
          <BookingThread
            bookingId={booking.id}
            disabled={booking.status === "CANCELLED"}
            messages={booking.messages.map((m) => ({
              id: m.id,
              body: m.body,
              createdAt: m.createdAt.toISOString(),
              authorName: m.authorName,
              mine: m.mine,
            }))}
          />
        </CardBody>
      </Card>
    </div>
  );
}
