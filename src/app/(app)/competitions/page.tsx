import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircleIcon, HourglassMediumIcon, SealCheckIcon, TrophyIcon } from "@phosphor-icons/react/ssr";
import { requireUser } from "@/lib/tenancy";
import { listCompetitions, pendingConsents } from "@/lib/competitions";
import { Card, CardBody } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/states";
import { Button } from "@/components/ui/button";
import { ConsentControls } from "./entry-controls";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("meta.competitions") };
}

/**
 * The marketplace.
 *
 * Open to every role because a competition is not school-owned: the same maths
 * challenge is the same challenge at both schools. What differs per person is
 * the state alongside it — a child sees whether they have asked, a guardian sees
 * what is waiting on them.
 */
export default async function CompetitionsPage({
  searchParams,
}: {
  searchParams: Promise<{ show?: string }>;
}) {
  const t = await getT();
  const session = await requireUser();
  const { show } = await searchParams;
  const openOnly = show !== "all";

  const [{ school, platform }, waiting] = await Promise.all([
    listCompetitions(session, { openOnly }),
    pendingConsents(session),
  ]);
  const nothing = school.length === 0 && platform.length === 0;

  // One card, two sections — the JSX is identical either side of the divide,
  // because what differs is who ELSE can see the row, not how it looks.
  const renderCard = (competition: (typeof school)[number]) => (
    <li key={competition.id}>
      <Card interactive>
        <CardBody>
          <Link href={`/competitions/${competition.id}`} className="block space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-semibold">{competition.title}</h3>
              {competition.verified && (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-accent-strong">
                  <SealCheckIcon weight="fill" className="size-4" />
                  {t("competitions.verified")}
                </span>
              )}
            </div>
            <p className="text-sm text-fg-muted">{competition.summary}</p>
            <p className="text-xs text-fg-muted">
              {competition.organizerName}
              {competition.subject ? ` · ${competition.subject}` : ""}
              {competition.gradeLow
                ? ` · ${competition.gradeLow}${competition.gradeHigh && competition.gradeHigh !== competition.gradeLow ? `–${competition.gradeHigh}` : ""}`
                : ""}
              {competition.registrationClosesAt
                ? ` · ${t("competitions.closesShort", { date: competition.registrationClosesAt.toLocaleDateString("en-GB", { day: "numeric", month: "long" }) })}`
                : ""}
            </p>
          </Link>

          {competition.entry && (
            <p
              className={`mt-2.5 inline-flex items-center gap-1.5 text-sm font-medium ${
                competition.entry.awaitingConsent ? "text-warn" : "text-ok"
              }`}
            >
              {competition.entry.awaitingConsent ? (
                <>
                  <HourglassMediumIcon weight="fill" className="size-4" />
                  {session.role === "PARENT"
                    ? t("competitions.childWaitingOnYou", { child: competition.entry.studentName })
                    : t("competitions.waitingForGrownUp")}
                </>
              ) : (
                <>
                  <CheckCircleIcon weight="fill" className="size-4" />
                  {session.role === "PARENT"
                    ? t("competitions.childEntered", { child: competition.entry.studentName })
                    : t("competitions.youAreEntered")}
                </>
              )}
            </p>
          )}
        </CardBody>
      </Card>
    </li>
  );

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("competitions.title")}</h1>
          <p className="text-sm text-fg-muted">{t("competitions.intro")}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link href={openOnly ? "/competitions?show=all" : "/competitions"}>
              {openOnly ? t("competitions.showClosed") : t("competitions.onlyOpen")}
            </Link>
          </Button>
          {session.role === "ADMIN" && (
            <Button asChild size="sm">
              <Link href="/competitions/new">{t("competitions.postOne")}</Link>
            </Button>
          )}
        </div>
      </header>

      {waiting.length > 0 && (
        <section aria-labelledby="waiting-heading" className="space-y-2.5">
          <h2 id="waiting-heading" className="text-sm font-semibold text-warn">
            {t("competitions.waitingForYou")}
          </h2>
          {waiting.map((item) => (
            <Card key={item.entryId} className="border-warn/40 bg-warn-soft/40">
              <CardBody className="space-y-2.5">
                <p className="text-[0.9375rem]">
                  {/* One sentence with placeholders — the link styling on the
                      title went with the fragments; the card links to it via
                      the consent controls anyway. */}
                  <Link href={`/competitions/${item.competitionId}`} className="underline underline-offset-4">
                    {t("competitions.wouldLikeToEnter", {
                      child: item.childName,
                      title: item.title,
                      organiser: item.organizerName,
                    })}
                  </Link>
                </p>
                <p className="text-sm text-fg-muted">{t("competitions.cannotUntilYes")}</p>
                <ConsentControls
                  entryId={item.entryId}
                  childName={item.childName}
                  title={item.title}
                />
              </CardBody>
            </Card>
          ))}
        </section>
      )}

      {nothing ? (
        <EmptyState
          icon={<TrophyIcon weight="duotone" className="size-8" />}
          title={openOnly ? t("competitions.emptyOpenTitle") : t("competitions.emptyTitle")}
          description={openOnly ? t("competitions.emptyOpenBody") : t("competitions.emptyBody")}
          action={
            openOnly ? (
              <Button asChild variant="secondary">
                <Link href="/competitions?show=all">{t("competitions.showClosed")}</Link>
              </Button>
            ) : undefined
          }
        />
      ) : (
        <>
          {school.length > 0 && (
            <section aria-labelledby="school-competitions" className="space-y-2.5">
              <div>
                <h2 id="school-competitions" className="text-sm font-semibold text-fg">
                  {t("competitions.fromYourSchool")}
                </h2>
                <p className="text-xs text-fg-muted">{t("competitions.fromYourSchoolHint")}</p>
              </div>
              <ul className="space-y-2.5">{school.map(renderCard)}</ul>
            </section>
          )}

          {platform.length > 0 && (
            <section aria-labelledby="platform-competitions" className="space-y-2.5">
              <div>
                <h2 id="platform-competitions" className="text-sm font-semibold text-fg">
                  {t("competitions.forEverySchool")}
                </h2>
                <p className="text-xs text-fg-muted">{t("competitions.forEverySchoolHint")}</p>
              </div>
              <ul className="space-y-2.5">{platform.map(renderCard)}</ul>
            </section>
          )}
        </>
      )}
    </div>
  );
}
