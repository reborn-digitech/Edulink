import type { Metadata } from "next";
import Link from "next/link";
import { BriefcaseIcon, SealCheckIcon, StarIcon } from "@phosphor-icons/react/ssr";
import { requireRole } from "@/lib/tenancy";
import { listMarketplace, listBookings } from "@/lib/experts";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/states";
import { BookButton } from "./book-button";
import { getT } from "@/lib/i18n/server";
import { EXPERT_OFFERING_META } from "@/lib/constants";
import { formatUtcMoment, formatUtcTime } from "@/lib/dates";
import { DataToolbar } from "@/components/ui/data-toolbar";
import { PageHeader } from "@/components/ui/page-header";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("meta.experts") };
}

/**
 * Experts — the marketplace.
 *
 * Availability is public and who booked it is not: a taken slot simply does not
 * appear here, because the booking that would name the school is behind that
 * school's own policy.
 */
export default async function ExpertsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; offering?: string; specialism?: string }>;
}) {
  const { q, offering: rawOffering, specialism: rawSpecialism } = await searchParams;
  const t = await getT();
  const ctx = await requireRole("ADMIN", "TEACHER");
  const [allExperts, bookings] = await Promise.all([listMarketplace(ctx), listBookings(ctx)]);
  const specialisms = [...new Set(allExperts.flatMap((e) => e.specialisms))].sort();
  const offering = rawOffering && Object.hasOwn(EXPERT_OFFERING_META, rawOffering) ? (rawOffering as keyof typeof EXPERT_OFFERING_META) : null;
  const specialism = rawSpecialism && specialisms.includes(rawSpecialism) ? rawSpecialism : null;
  const needle = (q ?? "").trim().toLowerCase();
  const experts = allExperts.filter(
    (e) =>
      (!offering || e.offering === offering) &&
      (!specialism || e.specialisms.includes(specialism)) &&
      (!needle || [e.name, e.headline, e.organisation ?? ""].join(" ").toLowerCase().includes(needle)),
  );
  const narrowed = Boolean(offering || specialism || needle);
  const live = bookings.filter((b) => b.status !== "CANCELLED");

  return (
    <div className="space-y-6">
      <PageHeader title={t("feature.experts")} description={t("expert.marketplaceBody")} />

      {live.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-fg-muted">
            {t("expert.yourBookings")}
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
                        <Badge tone="accent" size="sm">
                          {t("expert.newCount", { count: booking.unread })}
                        </Badge>
                      )}
                      <span className="ml-auto text-xs text-fg-muted">
                        {formatUtcMoment(booking.startsAt)}
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
          {t("expert.availableExperts")}
        </h2>

        {(allExperts.length > 2 || narrowed) && (
          <DataToolbar
            search={{ value: q ?? "", placeholder: t("expert.searchPlaceholder"), label: t("common.searchLabel") }}
            facets={[
              {
                key: "offering",
                label: t("expert.offeringFilter"),
                value: offering ?? "",
                options: [
                  { value: "", label: t("vacancies.filterAll"), count: allExperts.length },
                  ...(Object.keys(EXPERT_OFFERING_META) as (keyof typeof EXPERT_OFFERING_META)[]).map((k) => ({ value: k, label: t(EXPERT_OFFERING_META[k].labelKey), count: allExperts.filter((e) => e.offering === k).length })).filter((o) => o.count > 0),
                ],
              },
              ...(specialisms.length > 1 ? [{ key: "specialism", label: t("expert.specialismFilter"), value: specialism ?? "", as: "select" as const, options: [{ value: "", label: t("expert.allSpecialisms") }, ...specialisms.map((r) => ({ value: r, label: r }))] }] : []),
            ]}
            labels={{ clearAll: t("common.clearAll"), clearSearch: t("common.clearSearch"), activeFilters: t("common.activeFilters") }}
          />
        )}

        {experts.length === 0 ? (
          <EmptyState
            icon={<BriefcaseIcon weight="duotone" className="size-8" />}
            title={narrowed ? t("common.noResultsTitle") : t("expert.noneListed")}
            description={narrowed ? t("common.noResultsBody") : t("expert.noneListedBody")}
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
                          {t("expert.verified")}
                        </Badge>
                      )}
                      {/* Computed on read from families' ratings; "New" until three have rated. */}
                      <span title={expert.rating ? undefined : t("expert.ratingNewHint")} data-testid="expert-rating">
                        <Badge tone={expert.rating ? "accent" : "neutral"} size="sm">
                          <StarIcon weight="fill" className="mr-1 inline size-3" />
                          {expert.rating ? t("expert.ratingLine", { average: expert.rating.average.toFixed(1), count: expert.rating.count }) : t("expert.ratingNew")}
                        </Badge>
                      </span>
                      {expert.organisation && (
                        <span className="text-xs text-fg-muted">{expert.organisation}</span>
                      )}
                    </div>
                    <p className="text-[0.9375rem] text-fg">{expert.headline}</p>
                    {expert.bio && <p className="line-clamp-3 text-sm text-fg-muted">{expert.bio}</p>}

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
                      {t(EXPERT_OFFERING_META[expert.offering].labelKey)}
                      {expert.offering !== "SESSIONS" && (
                        <>
                          {" · "}
                          {expert.mentoringOpen
                            ? expert.mentorCapacity === null
                              ? t("expert.takingMentees")
                              : t("expert.upToAtATime", { count: expert.mentorCapacity })
                            : t("expert.notTakingMentees")}
                        </>
                      )}
                    </p>

                    {expert.offering === "MENTORING" ? (
                      // Their times are for mentoring, and a school cannot take
                      // one for a workshop. Offering the button would be
                      // offering something the server refuses.
                      <p className="text-xs text-fg-muted">{t("expert.mentoringOnly")}</p>
                    ) : expert.openSlots.length === 0 ? (
                      <p className="text-xs text-fg-muted">{t("expert.noFreeTimes")}</p>
                    ) : (
                      <ul className="space-y-2">
                        {expert.openSlots.map((slot) => (
                          <li
                            key={slot.id}
                            className="flex flex-wrap items-center gap-3 rounded-[--radius-md] border border-border p-3"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-fg">
                                {formatUtcMoment(slot.startsAt)} —{" "}
                                {formatUtcTime(slot.endsAt)}
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
