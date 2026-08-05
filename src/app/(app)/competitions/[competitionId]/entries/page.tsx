import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon, TrophyIcon } from "@phosphor-icons/react/ssr";
import { AccessError, requireUser } from "@/lib/tenancy";
import { getCompetition, listEntriesForResults } from "@/lib/competitions";
import { EmptyState } from "@/components/ui/states";
import { Button } from "@/components/ui/button";
import { ResultsRow } from "./results-row";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("meta.entries") };
}

/**
 * This school's entries for one competition, and what they scored.
 *
 * THIS SCHOOL'S, and that is not a filter this page applies — it is one it
 * inherits. `CompetitionEntry.schoolId` is the entrant's school and is policied,
 * so a competition organised by Riverside and entered by an Oakfield pupil
 * produces a row Riverside cannot read at all. Results are therefore recorded by
 * the child's own school: their own pupils, in their own competitions and in the
 * national ones they sit. See Not built for why the cross-school version is a
 * decision rather than a missing page.
 */
export default async function EntriesPage({
  params,
}: {
  params: Promise<{ competitionId: string }>;
}) {
  const session = await requireUser();
  const { competitionId } = await params;

  if (session.role !== "ADMIN" && session.role !== "TEACHER") notFound();

  let competition;
  try {
    competition = await getCompetition(session, competitionId);
  } catch (error) {
    if (error instanceof AccessError) notFound();
    throw error;
  }

  const entries = await listEntriesForResults(session, competitionId);

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <Link
        href={`/competitions/${competitionId}`}
        className="inline-flex items-center gap-1.5 text-sm text-fg-muted hover:text-fg"
      >
        <ArrowLeftIcon weight="bold" className="size-4" />
        {competition.title}
      </Link>

      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Entries and results</h1>
        <p className="text-sm text-fg-muted">
          Your school&apos;s pupils only. Other schools record their own.
        </p>
      </header>

      {entries.length === 0 ? (
        <EmptyState
          icon={<TrophyIcon weight="duotone" className="size-8" />}
          title="Nobody has entered yet"
          description="When a pupil at your school asks to take part, they will appear here — and once a guardian has said yes, you can record what they scored."
          action={
            <Button asChild variant="secondary">
              <Link href={`/competitions/${competitionId}`}>Back to the competition</Link>
            </Button>
          }
        />
      ) : (
        <ul className="space-y-2.5">
          {entries.map((entry) => (
            <ResultsRow key={entry.entryId} {...entry} />
          ))}
        </ul>
      )}
    </div>
  );
}
