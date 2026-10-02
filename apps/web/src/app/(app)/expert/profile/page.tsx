import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ChartLineUpIcon, ListChecksIcon, SealCheckIcon, StarIcon, UserIcon } from "@phosphor-icons/react/ssr";
import { requireExpert, AccessError } from "@/lib/tenancy";
import { getOwnProfile, ownImpact } from "@/lib/experts";
import { calendarTokenUrl, readKyc } from "@/lib/expert-kyc";
import { expertPayoutStanding } from "@/lib/gig-sessions";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProfileForm } from "./profile-form";
import { KycCard } from "./kyc-card";
import { CalendarCard } from "./calendar-card";
import { GetPaidCard } from "./get-paid-card";
import { getT } from "@/lib/i18n/server";
import { PageHeader } from "@/components/ui/page-header";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("meta.profile") };
}

/**
 * The expert's own profile.
 *
 * This link has been in the side rail and the ⌘K palette since experts existed,
 * and until now it went to a 404 — the app's own navigation pointing at nothing.
 *
 * STANDING IS SHOWN, NEVER EDITED. "Published" decides whether any school can
 * find this person and "verified" says a human has checked who they are; both
 * belong to whoever runs the server. Showing them read-only answers the question
 * an unpublished expert actually has — "why is nobody booking me?" — which an
 * empty bookings page does not.
 */
export default async function ExpertProfilePage() {
  const t = await getT();
  const session = await requireExpert();

  let profile, impact, kyc, calendar, payout;
  try {
    profile = await getOwnProfile(session);
    impact = await ownImpact(session);
    kyc = await readKyc(session);
    calendar = await calendarTokenUrl(session);
    payout = await expertPayoutStanding(session);
  } catch (error) {
    // An EXPERT session with no ExpertProfile row should not exist, but a 500
    // is the wrong way to find out. Same answer the other pages give.
    if (error instanceof AccessError) notFound();
    throw error;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <PageHeader title={t("expert.yourProfile")} description={t("expert.yourProfileBody")} />

      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={profile.published ? "ok" : "warn"} size="sm">
          {profile.published ? t("expert.listed") : t("expert.notListedYet")}
        </Badge>
        {profile.verified && (
          <Badge tone="accent" size="sm">
            <SealCheckIcon weight="fill" className="mr-1 inline size-3" />
            {t("expert.verified")}
          </Badge>
        )}
        {/* Families' ratings, as the marketplace shows them: an average from three on, "New" before. */}
        <span data-testid="expert-rating">
          <Badge tone={impact.rating ? "ok" : "neutral"} size="sm">
            <StarIcon weight="fill" className="mr-1 inline size-3" />
            {impact.rating ? t("expert.ratingLine", { average: impact.rating.average.toFixed(1), count: impact.rating.count }) : t("expert.ratingNew")}
          </Badge>
        </span>
        <p className="text-xs text-fg-muted">
          {profile.published ? t("expert.listedBody") : t("expert.notListedBody")}
        </p>
      </div>

      {(impact.sessionsDone > 0 || impact.sessionsBooked > 0 || impact.activeMentorships > 0) && (
        <Card>
          <CardHeader
            icon={<ChartLineUpIcon weight="duotone" className="size-5" />}
            title={t("expert.impactTitle")}
            description={t("expert.impactBody")}
          />
          <CardBody>
            <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[
                [t("expert.statSessionsDone"), impact.sessionsDone],
                [t("expert.statSessionsBooked"), impact.sessionsBooked],
                [t("expert.statSchools"), impact.schoolsServed],
                [
                  t("expert.statMentees"),
                  impact.mentorCapacity !== null
                    ? `${impact.activeMentorships}/${impact.mentorCapacity}`
                    : impact.activeMentorships,
                ],
              ].map(([label, value]) => (
                <div key={String(label)} className="rounded-[--radius-md] border border-border bg-surface px-3 py-2">
                  <dt className="text-xs uppercase tracking-wide text-fg-muted">{label}</dt>
                  <dd className="text-lg font-bold tabular-nums text-fg">{value}</dd>
                </div>
              ))}
            </dl>
          </CardBody>
        </Card>
      )}

      {/* The onboarding that matters for an expert is LOOKING BOOKABLE. Each
          line names the thing a school actually weighs before booking. */}
      <Card>
        <CardHeader
          icon={<ListChecksIcon weight="duotone" className="size-5" />}
          title={t("expert.getBookedTitle")}
          description={t("expert.getBookedBody")}
        />
        <CardBody>
          <ul className="space-y-1.5 text-sm">
            {[
              [Boolean(profile.bio.trim()), t("expert.stepBio")],
              [profile.specialisms.length > 0, t("expert.stepSpecialisms")],
              [impact.upcomingSlots > 0, t("expert.stepSlots")],
              [profile.published, t("expert.stepPublished")],
            ].map(([done, label]) => (
              <li key={String(label)} className="flex items-center gap-2">
                <span
                  aria-hidden="true"
                  className={`inline-flex size-4 items-center justify-center rounded-full text-[10px] font-bold ${
                    done ? "bg-ok text-surface" : "border border-border text-fg-muted"
                  }`}
                >
                  {done ? "✓" : ""}
                </span>
                <span className={done ? "text-fg-muted line-through" : "text-fg"}>{label}</span>
              </li>
            ))}
          </ul>
        </CardBody>
      </Card>

      <KycCard initial={kyc} />

      <GetPaidCard initial={payout} />

      <CalendarCard initialUrl={calendar.url} />

      <Card>
        <CardHeader
          icon={<UserIcon weight="duotone" className="size-5" />}
          title={t("expert.aboutYou")}
          description={t("expert.profileCardBody")}
        />
        <CardBody>
          <ProfileForm
            headline={profile.headline}
            bio={profile.bio}
            organisation={profile.organisation}
            specialisms={profile.specialisms}
            timezone={profile.timezone}
        offering={profile.offering}
        mentorCapacity={profile.mentorCapacity}
          />
        </CardBody>
      </Card>
    </div>
  );
}
