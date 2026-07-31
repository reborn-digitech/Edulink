import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeftIcon,
  ArrowSquareOutIcon,
  CalendarBlankIcon,
  SealCheckIcon,
  ShieldCheckIcon,
} from "@phosphor-icons/react/ssr";
import { requireUser } from "@/lib/tenancy";
import { AccessError } from "@/lib/tenancy";
import { getCompetition, pendingConsents } from "@/lib/competitions";
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ConsentControls, EnterButton, EntryStatus, OrganiserControls } from "../entry-controls";

export const metadata: Metadata = { title: "Competition" };

function when(date: Date | null): string | null {
  if (!date) return null;
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

export default async function CompetitionPage({
  params,
}: {
  params: Promise<{ competitionId: string }>;
}) {
  const session = await requireUser();
  const { competitionId } = await params;

  let competition;
  try {
    competition = await getCompetition(session, competitionId);
  } catch (error) {
    // NOT_FOUND for a draft as well as a missing row — a distinguishable error
    // would confirm the row exists, which is itself a disclosure.
    if (error instanceof AccessError) notFound();
    throw error;
  }

  const waiting = (await pendingConsents(session)).filter(
    (w) => w.competitionId === competition.id,
  );

  const closes = when(competition.registrationClosesAt);
  const starts = when(competition.startsAt);
  const ends = when(competition.endsAt);

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <Link
        href="/competitions"
        className="inline-flex items-center gap-1.5 text-sm text-fg-muted hover:text-fg"
      >
        <ArrowLeftIcon weight="bold" className="size-4" />
        Competitions
      </Link>

      <header className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight">{competition.title}</h1>
          {competition.verified && (
            <span className="inline-flex items-center gap-1 text-sm font-medium text-accent-strong">
              <SealCheckIcon weight="fill" className="size-4" />
              Checked by EduLink
            </span>
          )}
          {competition.status !== "PUBLISHED" && (
            <span className="rounded-[--radius-sm] bg-surface-muted px-2 py-0.5 text-xs font-medium text-fg-muted">
              {competition.status === "DRAFT" ? "Not published yet" : "Archived"}
            </span>
          )}
        </div>
        <p className="text-fg-muted">{competition.summary}</p>
        <p className="text-sm text-fg-muted">Run by {competition.organizerName}</p>
      </header>

      {/* What the caller can do about it, before the wall of detail. */}
      <Card>
        <CardBody className="space-y-3">
          {session.role === "STUDENT" &&
            (competition.entry ? (
              <EntryStatus
                entryId={competition.entry.id}
                awaitingConsent={competition.entry.awaitingConsent}
                canWithdraw
              />
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
                    A grown-up at home will be asked first. You will not take part until they say
                    yes.
                  </p>
                )}
              </>
            ))}

          {session.role === "PARENT" &&
            (waiting.length > 0 ? (
              waiting.map((item) => (
                <div key={item.entryId} className="space-y-2.5">
                  <p className="text-[0.9375rem]">
                    <strong>{item.childName}</strong> would like to take part.
                  </p>
                  <ConsentControls
                    entryId={item.entryId}
                    childName={item.childName}
                    title={competition.title}
                  />
                </div>
              ))
            ) : competition.entry ? (
              <EntryStatus
                entryId={competition.entry.id}
                awaitingConsent={competition.entry.awaitingConsent}
                canWithdraw
              />
            ) : (
              <p className="text-sm text-fg-muted">
                None of your children have asked to enter this one.
              </p>
            ))}

          {competition.isOrganiser && (
            <OrganiserControls
              competitionId={competition.id}
              status={competition.status}
              entered={competition.enteredCount}
            />
          )}

          {(session.role === "ADMIN" || session.role === "TEACHER") && (
            <p className="text-sm text-fg-muted">
              {competition.enteredCount === 0
                ? "No pupils from your school are taking part yet."
                : `${competition.enteredCount} ${competition.enteredCount === 1 ? "pupil" : "pupils"} from your school ${competition.enteredCount === 1 ? "is" : "are"} taking part.`}
            </p>
          )}

          {competition.externalUrl && (
            <Button asChild variant="secondary" size="sm">
              <a href={competition.externalUrl} target="_blank" rel="noopener noreferrer nofollow">
                Organiser's own page
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
              Dates
            </h2>
            <dl className="space-y-1 text-sm">
              {closes && (
                <div className="flex gap-2">
                  <dt className="w-32 shrink-0 text-fg-muted">Entries close</dt>
                  <dd>{closes}</dd>
                </div>
              )}
              {starts && (
                <div className="flex gap-2">
                  <dt className="w-32 shrink-0 text-fg-muted">Starts</dt>
                  <dd>{starts}</dd>
                </div>
              )}
              {ends && (
                <div className="flex gap-2">
                  <dt className="w-32 shrink-0 text-fg-muted">Ends</dt>
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
            <h2 className="mb-2 text-sm font-semibold">About</h2>
            <p className="whitespace-pre-wrap text-[0.9375rem] leading-relaxed">{competition.body}</p>
          </CardBody>
        </Card>
      )}

      {(competition.eligibility || competition.rules || competition.prizes) && (
        <Card>
          <CardBody className="space-y-3">
            {competition.eligibility && (
              <section>
                <h2 className="text-sm font-semibold">Who can enter</h2>
                <p className="whitespace-pre-wrap text-[0.9375rem]">{competition.eligibility}</p>
              </section>
            )}
            {competition.rules && (
              <section>
                <h2 className="text-sm font-semibold">Rules</h2>
                <p className="whitespace-pre-wrap text-[0.9375rem]">{competition.rules}</p>
              </section>
            )}
            {competition.prizes && (
              <section>
                <h2 className="text-sm font-semibold">Prizes</h2>
                <p className="whitespace-pre-wrap text-[0.9375rem]">{competition.prizes}</p>
              </section>
            )}
          </CardBody>
        </Card>
      )}
    </div>
  );
}
