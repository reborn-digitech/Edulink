import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowSquareOutIcon, CalendarBlankIcon, SealCheckIcon, ShieldCheckIcon, TrophyIcon } from "@phosphor-icons/react/ssr";
import { formatDate } from "@/lib/dates";
import { getT } from "@/lib/i18n/server";
import { requireUser } from "@/lib/tenancy";
import { AccessError } from "@/lib/tenancy";
import { PlanRequiredError } from "@/lib/access-error";
import { getCompetition, pendingConsents, leaderboard, internalBoard, ordinal } from "@/lib/competitions";
import { listContexts } from "@/lib/session";
import { PlanCard } from "@/components/plan-card";
import { formatMilli } from "@/lib/validation";
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ConsentControls,
  EnterButton,
  EnterChildButton,
  EntryStatus,
  OrganiserControls,
  ResultBadge,
  SubmitPanel,
} from "../entry-controls";
import { PageHeader } from "@/components/ui/page-header";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("meta.competition") };
}

function when(date: Date | null): string | null {
  if (!date) return null;
  return formatDate(date);
}

export default async function CompetitionPage({
  params,
  searchParams,
}: {
  params: Promise<{ competitionId: string }>;
  searchParams: Promise<{ child?: string }>;
}) {
  const t = await getT();
  const session = await requireUser();
  const { competitionId } = await params;
  const { child: childParam } = await searchParams;

  let competition;
  try {
    competition = await getCompetition(session, competitionId);
  } catch (error) {
    // decision 0007: a platform competition a pupil lacks the plan for shows the plan card, not a 404.
    if (error instanceof PlanRequiredError) {
      return (
        <div className="mx-auto max-w-2xl space-y-5">
          <PlanCard plan={error.plan} feature={error.feature} />
        </div>
      );
    }
    // NOT_FOUND for a draft as well as a missing row — a distinguishable error
    // would confirm the row exists, which is itself a disclosure.
    if (error instanceof AccessError) notFound();
    throw error;
  }

  // decision 0007: the internal board (empty unless the office set one and this reader may see it), and, for a
  // guardian, the children of theirs at the organising school who could be enrolled.
  const board = await internalBoard(session, competition.id, { studentMembershipId: childParam ?? null });
  const children =
    session.role === "PARENT" && competition.organizerSchoolId
      ? (await listContexts(session.user.id)).children.filter((c) => c.schoolId === competition.organizerSchoolId && !c.leftAt)
      : [];
  const selectedChild = children.find((c) => c.studentMembershipId === childParam) ?? null;
  const parentChild = session.role === "PARENT" && childParam ? `?child=${childParam}` : "";

  const waiting = (await pendingConsents(session)).filter(
    (w) => w.competitionId === competition.id,
  );

  // Empty unless the organiser has switched the board on — and the policy on
  // CompetitionStanding refuses other schools' rows regardless, so this is the
  // second lock rather than the only one.
  const standings = await leaderboard(session, competition.id);

  const closes = when(competition.registrationClosesAt);
  const starts = when(competition.startsAt);
  const ends = when(competition.endsAt);

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div className="space-y-2">
        <PageHeader
          title={competition.title}
          back={session.role === "PARENT" ? { href: `/parent/agenda${parentChild}`, label: t("agenda.title") } : session.role === "STUDENT" ? { href: "/student/agenda", label: t("agenda.title") } : { href: "/competitions", label: t("competitions.title") }}
          meta={
            <>
              {competition.verified && (
                <span className="inline-flex items-center gap-1 text-sm font-medium text-accent-strong">
                  <SealCheckIcon weight="fill" className="size-4" />
                  {t("competitions.verified")}
                </span>
              )}
              {competition.status !== "PUBLISHED" && (
                <span className="rounded-[var(--radius-sm)] bg-surface-muted px-2 py-0.5 text-xs font-medium text-fg-muted">
                  {competition.status === "DRAFT" ? t("competitions.notPublishedYet") : t("competitions.archived")}
                </span>
              )}
            </>
          }
        />
        <p className="text-fg-muted">{competition.summary}</p>
        <p className="text-sm text-fg-muted">{t("competitions.runBy", { name: competition.organizerName })}</p>
        {/* competitions-crawler (12 Oct 2026): read from the organiser's own site, and when the page was last checked. */}
        {competition.source && (
          <p className="text-xs text-fg-subtle">{t("competitionCrawl.publicSource", { organiser: competition.source.organiser, date: formatDate(competition.source.lastCheckedAt) })}</p>
        )}
      </div>


      {/* What the caller can do about it, before the wall of detail. */}
      <Card>
        <CardBody className="space-y-3">
          {session.role === "STUDENT" &&
            (competition.entry ? (
              <>
                <EntryStatus
                  entryId={competition.entry.id}
                  awaitingConsent={competition.entry.awaitingConsent}
                  canWithdraw
                />
                <ResultBadge
                  scoreMilli={competition.entry.scoreMilli}
                  rank={competition.entry.rank}
                />
                <SubmitPanel
                  competitionId={competition.id}
                  existingUrl={competition.entry.submissionUrl}
                  canSubmit={!competition.entry.awaitingConsent && competition.acceptingWork}
                  reason={
                    competition.entry.awaitingConsent
                      ? t("competitions.handInOnceYes")
                      : t("competitions.finished")
                  }
                />
              </>
            ) : (
              <>
                <EnterButton
                  competitionId={competition.id}
                  title={competition.title}
                  open={competition.open}
                  requiresParentConsent={competition.requiresParentConsent}
                />
                {competition.open && competition.requiresParentConsent && (
                  <p className="inline-flex items-start gap-1.5 text-sm text-fg-muted">
                    <ShieldCheckIcon weight="duotone" className="mt-0.5 size-4 shrink-0" />
                    {t("competitions.grownUpAskedFirst")}
                  </p>
                )}
              </>
            ))}

          {session.role === "PARENT" &&
            (waiting.length > 0 ? (
              waiting.map((item) => (
                <div key={item.entryId} className="space-y-2.5">
                  <p className="text-[0.9375rem]">
                    {t("competitions.wouldLikeToTakePart", { child: item.childName })}
                  </p>
                  <ConsentControls
                    entryId={item.entryId}
                    childName={item.childName}
                    title={competition.title}
                  />
                </div>
              ))
            ) : competition.entry ? (
              <>
                <EntryStatus
                  entryId={competition.entry.id}
                  awaitingConsent={competition.entry.awaitingConsent}
                  canWithdraw
                />
                <ResultBadge
                  scoreMilli={competition.entry.scoreMilli}
                  rank={competition.entry.rank}
                />
              </>
            ) : competition.open && children.length > 0 ? (
              /* decision 0007: a guardian enrols their own child, which is their consent. */
              <div className="space-y-2">
                <p className="text-sm text-fg-muted">{t("competitions.enrolChildIntro")}</p>
                <div className="flex flex-wrap gap-2">
                  {(selectedChild ? [selectedChild] : children).map((c) => (
                    <EnterChildButton key={c.studentMembershipId} competitionId={competition.id} studentMembershipId={c.studentMembershipId} childName={c.name} title={competition.title} />
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-sm text-fg-muted">{competition.open ? t("competitions.noChildAsked") : t("competitions.entriesClosed")}</p>
            ))}

          {competition.isOrganiser && competition.calendarEntryId && (
            <Button asChild variant="secondary" size="sm">
              <Link href="/admin/calendar">
                <CalendarBlankIcon weight="bold" className="size-4" />
                {t("competitions.onTheCalendar")}
              </Link>
            </Button>
          )}

          {competition.isOrganiser && (
            <OrganiserControls
              competitionId={competition.id}
              status={competition.status}
              entered={competition.enteredCount}
              leaderboardEnabled={competition.leaderboardEnabled}
            />
          )}

          {(session.role === "ADMIN" || session.role === "TEACHER") && (
            <Button asChild variant="secondary" size="sm">
              <Link href={`/competitions/${competition.id}/entries`}>
                {t("competitions.entriesAndResultsLink")}
              </Link>
            </Button>
          )}

          {(session.role === "ADMIN" || session.role === "TEACHER") && (
            <p className="text-sm text-fg-muted">
              {competition.enteredCount === 0
                ? t("competitions.noPupilsYet")
                : competition.enteredCount === 1
                  ? t("competitions.pupilsTakingPartOne")
                  : t("competitions.pupilsTakingPartMany", { count: competition.enteredCount })}
            </p>
          )}

          {competition.externalUrl && (
            <Button asChild variant="secondary" size="sm">
              <a href={competition.externalUrl} target="_blank" rel="noopener noreferrer nofollow">
                {t("competitions.organiserPage")}
                <ArrowSquareOutIcon weight="bold" className="size-4" />
              </a>
            </Button>
          )}
        </CardBody>
      </Card>

      {(closes || starts || ends) && (
        <Card>
          <CardBody>
            <h2 className="mb-2 inline-flex items-center gap-1.5 text-sm font-semibold">
              <CalendarBlankIcon weight="duotone" className="size-4" />
              {t("competitions.dates")}
            </h2>
            <dl className="space-y-1 text-sm">
              {closes && (
                <div className="flex gap-2">
                  <dt className="w-32 shrink-0 text-fg-muted">{t("competitions.entriesClose")}</dt>
                  <dd>{closes}</dd>
                </div>
              )}
              {starts && (
                <div className="flex gap-2">
                  <dt className="w-32 shrink-0 text-fg-muted">{t("competitions.starts")}</dt>
                  <dd>{starts}</dd>
                </div>
              )}
              {ends && (
                <div className="flex gap-2">
                  <dt className="w-32 shrink-0 text-fg-muted">{t("competitions.ends")}</dt>
                  <dd>{ends}</dd>
                </div>
              )}
            </dl>
          </CardBody>
        </Card>
      )}

      {competition.body && (
        <Card>
          <CardBody>
            <h2 className="mb-2 text-sm font-semibold">{t("competitions.about")}</h2>
            <p className="whitespace-pre-wrap text-[0.9375rem] leading-relaxed">{competition.body}</p>
          </CardBody>
        </Card>
      )}

      {board.setting !== "OFF" && (board.rows.length > 0 || board.mine) && (
        /* decision 0007: the school's own board — staff every result by name; a pupil or a guardian the top places by first name and their own. */
        <Card data-testid="internal-board" data-setting={board.setting}>
          <CardBody>
            <h2 className="inline-flex items-center gap-1.5 text-sm font-semibold">
              <TrophyIcon weight="duotone" className="size-4" />
              {t("competitions.internalBoard")}
            </h2>
            <p className="mt-0.5 text-xs leading-relaxed text-fg-muted">{board.full ? t("competitions.internalBoardStaff") : t("competitions.internalBoardSchool")}</p>
            <ol className="mt-3 divide-y divide-border">
              {[...board.rows, ...(board.mine ? [board.mine] : [])].map((row) => (
                <li key={`${row.place}-${row.name}`} className={row.mine ? "flex items-baseline gap-3 rounded-[var(--radius-sm)] bg-accent-soft px-2 py-2.5" : "flex items-baseline gap-3 px-2 py-2.5"} data-mine={row.mine ? "yes" : undefined}>
                  <span className="w-6 shrink-0 text-sm font-semibold tabular-nums text-fg-muted">{row.place}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-fg">
                      {row.name}
                      {row.className ? <span className="ml-1.5 text-xs font-normal text-fg-muted">{row.className}</span> : null}
                      {row.mine && <span className="ml-1.5 text-xs font-normal text-accent-strong">{t("competitions.you")}</span>}
                    </span>
                    <span className="block text-xs text-fg-muted">
                      {[row.rank !== null ? t("competitions.placeLabel", { n: ordinal(row.rank) }) : null, row.scoreMilli !== null ? t("competitions.pointsLabel", { n: formatMilli(row.scoreMilli) }) : null].filter(Boolean).join(" · ")}
                    </span>
                  </span>
                </li>
              ))}
            </ol>
          </CardBody>
        </Card>
      )}

      {standings.length > 0 && (
        <Card>
          <CardBody>
            <h2 className="text-sm font-semibold">{t("competitions.schoolsDoing")}</h2>
            {/* Said on the page, not only in the code. A reader looking for
                names should be told they are not here, and why. */}
            {/* The entries page is staff-only, so pointing a pupil at it sends
                them to a 404 to be told where their own name is. Two whole
                sentences rather than a spliced tail. */}
            <p className="mt-0.5 text-xs leading-relaxed text-fg-muted">
              {session.role === "ADMIN" || session.role === "TEACHER"
                ? t("competitions.rankedNotNamedStaff")
                : t("competitions.rankedNotNamed")}
            </p>
            <ol className="mt-3 divide-y divide-border">
              {standings.map((row, index) => (
                <li
                  key={row.schoolId}
                  className={
                    row.isOwnSchool
                      ? "flex items-baseline gap-3 rounded-[var(--radius-sm)] bg-accent-soft px-2 py-2.5"
                      : "flex items-baseline gap-3 px-2 py-2.5"
                  }
                >
                  <span className="w-6 shrink-0 text-sm font-semibold tabular-nums text-fg-muted">
                    {index + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-fg">
                      {row.schoolName}
                      {row.isOwnSchool && (
                        <span className="ml-1.5 text-xs font-normal text-accent-strong">
                          {t("competitions.yourSchool")}
                        </span>
                      )}
                    </span>
                    <span className="block text-xs text-fg-muted">
                      {row.entrants === 1
                        ? t("competitions.resultsOne")
                        : t("competitions.resultsMany", { count: row.entrants })}
                      {/* The ordinal ("3rd") is an English VALUE, like a date —
                          the label around it is what translates. */}
                      {row.bestRank !== null && (
                        <> · {t("competitions.bestPlace", { n: ordinal(row.bestRank) })}</>
                      )}
                      {row.bestScoreMilli !== null && (
                        <> · {t("competitions.bestScore", { n: (row.bestScoreMilli / 1000).toFixed(1) })}</>
                      )}
                    </span>
                  </span>
                </li>
              ))}
            </ol>
          </CardBody>
        </Card>
      )}

      {(competition.eligibility || competition.rules || competition.prizes) && (
        <Card>
          <CardBody className="space-y-3">
            {competition.eligibility && (
              <section>
                <h2 className="text-sm font-semibold">{t("competitions.whoCanEnter")}</h2>
                <p className="whitespace-pre-wrap text-[0.9375rem]">{competition.eligibility}</p>
              </section>
            )}
            {competition.rules && (
              <section>
                <h2 className="text-sm font-semibold">{t("competitions.rules")}</h2>
                <p className="whitespace-pre-wrap text-[0.9375rem]">{competition.rules}</p>
              </section>
            )}
            {competition.prizes && (
              <section>
                <h2 className="text-sm font-semibold">{t("competitions.prizes")}</h2>
                <p className="whitespace-pre-wrap text-[0.9375rem]">{competition.prizes}</p>
              </section>
            )}
          </CardBody>
        </Card>
      )}
    </div>
  );
}
