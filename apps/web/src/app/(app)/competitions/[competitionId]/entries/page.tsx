import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { TrophyIcon } from "@phosphor-icons/react/ssr";
import { AccessError, requireUser } from "@/lib/tenancy";
import { getCompetition, listEntriesForResults } from "@/lib/competitions";
import { EmptyState } from "@/components/ui/states";
import { Button } from "@/components/ui/button";
import { ResultsRow } from "./results-row";
import { getT } from "@/lib/i18n/server";
import { PageHeader } from "@/components/ui/page-header";

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
  const t = await getT();
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
      <PageHeader
        title={t("competitions.entriesAndResults")}
        description={t("competitions.yourPupilsOnly")}
        back={{ href: `/competitions/${competitionId}`, label: competition.title }}
      />


      {entries.length === 0 ? (
        <EmptyState
          icon={<TrophyIcon weight="duotone" className="size-8" />}
          title={t("competitions.nobodyEntered")}
          description={t("competitions.nobodyEnteredBody")}
          action={
            <Button asChild variant="secondary">
              <Link href={`/competitions/${competitionId}`}>{t("competitions.backToCompetition")}</Link>
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
