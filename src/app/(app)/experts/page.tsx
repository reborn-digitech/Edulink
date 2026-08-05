import type { Metadata } from "next";
import Link from "next/link";
import { BriefcaseIcon, SealCheckIcon } from "@phosphor-icons/react/ssr";
import { requireRole } from "@/lib/tenancy";
import { listMarketplace, listBookings } from "@/lib/experts";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/states";
import { BookButton } from "./book-button";
import { getT } from "@/lib/i18n/server";
import { EXPERT_OFFERING_META } from "@/lib/constants";

export const metadata: Metadata = { title: "Experts" };

/**
 * Experts — the marketplace.
 *
 * Availability is public and who booked it is not: a taken slot simply does not
 * appear here, because the booking that would name the school is behind that
 * school's own policy.
 */
export default async function ExpertsPage() {
  const t = await getT();
  const ctx = await requireRole("ADMIN", "TEACHER");
  const [experts, bookings] = await Promise.all([listMarketplace(ctx), listBookings(ctx)]);
  const live = bookings.filter((b) => b.status !== "CANCELLED");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-fg sm:text-3xl">{t("feature.experts")}</h1>
        <p className="mt-1 max-w-prose text-sm text-fg-muted">
          Book time with a curated expert. They can see your school only while a booking with you
          is live.
        </p>
      </div>

      {live.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-fg-muted">
            Your bookings
          </h2>
          <ul className="space-y-2">
            {live.map((booking) => (
              <li key={booking.id}>
                <Card interactive>
                  <Link href={`/experts/bookings/${booking.id}`} className="block">
                    <CardBody className="flex flex-wrap items-center gap-2 py-4">
                      <span className="font-medium text-fg">{booking.expertName}</span>
                      <span className="text-sm text-fg-muted">{booking.topic}</span>
                      {booking.unread > 0 && (
                        <Badge tone="accent" size="sm">{booking.unread} new</Badge>
                      )}
                      <span className="ml-auto text-xs text-fg-muted">
                        {booking.startsAt.toUTCString().slice(0, 22)}
                      </span>
                    </CardBody>
                  </Link>
                </Card>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-fg-muted">
          Available experts
        </h2>

        {experts.length === 0 ? (
          <EmptyState
            icon={<BriefcaseIcon weight="duotone" className="size-8" />}
            title="No experts listed yet"
            description="Experts appear here once they have been reviewed and have offered times."
          />
        ) : (
          <ul className="space-y-3">
            {experts.map((expert) => (
              <li key={expert.id}>
                <Card>
                  <CardBody className="space-y-3 pt-5">
                    <div className="flex flex-wrap items-baseline gap-2">
                      <h3 className="text-lg font-semibold text-fg">{expert.name}</h3>
                      {expert.verified && (
                        <Badge tone="ok" size="sm">
                          <SealCheckIcon weight="fill" className="mr-1 inline size-3" />
                          Verified
                        </Badge>
                      )}
                      {expert.organisation && (
                        <span className="text-xs text-fg-muted">{expert.organisation}</span>
                      )}
                    </div>
                    <p className="text-[0.9375rem] text-fg">{expert.headline}</p>
                    {expert.bio && <p className="text-sm text-fg-muted">{expert.bio}</p>}

                    {expert.specialisms.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {expert.specialisms.map((s) => (
                          <Badge key={s} tone="neutral" size="sm">{s}</Badge>
                        ))}
                      </div>
                    )}

                    {/*
                      WHAT THEY AGREED TO DO, said plainly. A published expert
                      used to appear identically whether they had offered an
                      hour's workshop or a term with one child, and a school
                      could act on either. Both are now refused server-side; this
                      is so the refusal is never a surprise.
                    */}
                    <p className="text-xs font-medium text-fg-muted">
                      {EXPERT_OFFERING_META[expert.offering].label}
                      {expert.offering !== "SESSIONS" && (
                        <>
                          {" · "}
                          {expert.mentoringOpen
                            ? expert.mentorCapacity === null
                              ? "taking mentees"
                              : `up to ${expert.mentorCapacity} at a time`
                            : "not taking more mentees just now"}
                        </>
                      )}
                    </p>

                    {expert.offering === "MENTORING" ? (
                      // Their times are for mentoring, and a school cannot take
                      // one for a workshop. Offering the button would be
                      // offering something the server refuses.
                      <p className="text-xs text-fg-muted">
                        Available for mentoring rather than sessions. Set a mentorship up from
                        Mentoring.
                      </p>
                    ) : expert.openSlots.length === 0 ? (
                      <p className="text-xs text-fg-muted">No free times at the moment.</p>
                    ) : (
                      <ul className="space-y-2">
                        {expert.openSlots.map((slot) => (
                          <li
                            key={slot.id}
                            className="flex flex-wrap items-center gap-3 rounded-[--radius-md] border border-border p-3"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-fg">
                                {slot.startsAt.toUTCString().slice(0, 22)} —{" "}
                                {slot.endsAt.toUTCString().slice(17, 22)}
                              </p>
                              {slot.note && <p className="text-xs text-fg-muted">{slot.note}</p>}
                            </div>
                            <BookButton slotId={slot.id} expertName={expert.name} />
                          </li>
                        ))}
                      </ul>
                    )}
                  </CardBody>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
