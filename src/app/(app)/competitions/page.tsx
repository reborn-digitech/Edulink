import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircleIcon, HourglassMediumIcon, SealCheckIcon, TrophyIcon } from "@phosphor-icons/react/ssr";
import { requireUser } from "@/lib/tenancy";
import { listCompetitions, pendingConsents } from "@/lib/competitions";
import { Card, CardBody } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/states";
import { Button } from "@/components/ui/button";
import { ConsentControls } from "./entry-controls";

export const metadata: Metadata = { title: "Competitions" };

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
  const session = await requireUser();
  const { show } = await searchParams;
  const openOnly = show !== "all";

  const [competitions, waiting] = await Promise.all([
    listCompetitions(session, { openOnly }),
    pendingConsents(session),
  ]);

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Competitions</h1>
          <p className="text-sm text-fg-muted">
            Open to pupils across every school on EduLink.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link href={openOnly ? "/competitions?show=all" : "/competitions"}>
              {openOnly ? "Show closed ones too" : "Only ones I can still enter"}
            </Link>
          </Button>
          {session.role === "ADMIN" && (
            <Button asChild size="sm">
              <Link href="/competitions/new">Post one</Link>
            </Button>
          )}
        </div>
      </header>

      {waiting.length > 0 && (
        <section aria-labelledby="waiting-heading" className="space-y-2.5">
          <h2 id="waiting-heading" className="text-sm font-semibold text-warn">
            Waiting for you
          </h2>
          {waiting.map((item) => (
            <Card key={item.entryId} className="border-warn/40 bg-warn-soft/40">
              <CardBody className="space-y-2.5">
                <p className="text-[0.9375rem]">
                  <strong>{item.childName}</strong> would like to enter{" "}
                  <Link href={`/competitions/${item.competitionId}`} className="underline underline-offset-4">
                    {item.title}
                  </Link>
                  , run by {item.organizerName}.
                </p>
                <p className="text-sm text-fg-muted">
                  They cannot take part until you say yes.
                </p>
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

      {competitions.length === 0 ? (
        <EmptyState
          icon={<TrophyIcon weight="duotone" className="size-8" />}
          title={openOnly ? "Nothing open just now" : "No competitions yet"}
          description={
            openOnly
              ? "Nothing is taking entries at the moment. Have a look at the closed ones to see the sort of thing that comes up."
              : "When a school or an organiser posts a competition, it will show up here for every school."
          }
          action={
            openOnly ? (
              <Button asChild variant="secondary">
                <Link href="/competitions?show=all">Show closed ones too</Link>
              </Button>
            ) : undefined
          }
        />
      ) : (
        <ul className="space-y-2.5">
          {competitions.map((competition) => (
            <li key={competition.id}>
              <Card interactive>
                <CardBody>
                  <Link href={`/competitions/${competition.id}`} className="block space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-base font-semibold">{competition.title}</h2>
                      {competition.verified && (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-accent-strong">
                          <SealCheckIcon weight="fill" className="size-4" />
                          Checked by EduLink
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
                        ? ` · closes ${competition.registrationClosesAt.toLocaleDateString("en-GB", { day: "numeric", month: "long" })}`
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
                            ? `${competition.entry.studentName} is waiting on you`
                            : "Waiting for a grown-up to say yes"}
                        </>
                      ) : (
                        <>
                          <CheckCircleIcon weight="fill" className="size-4" />
                          {session.role === "PARENT"
                            ? `${competition.entry.studentName} is entered`
                            : "You are entered"}
                        </>
                      )}
                    </p>
                  )}
                </CardBody>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
