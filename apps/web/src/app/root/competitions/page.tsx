import { notFound } from "next/navigation";
import { getT } from "@/lib/i18n/server";
import { featureOn } from "@/lib/platform-features";
import { CompetitionsDeskPage } from "@/components/competitions-desk/desk-page";

export async function generateMetadata() {
  const t = await getT();
  return { title: t("appadmin.competitions") };
}

/**
 * The competitions desk for the operator, inside the operator's own frame (the layout asks for the
 * superuser): the platform's competitions, "Suggested from the web" with the crawl's Start and Stop, and
 * the sources the crawler reads — the same desk as the content team's /appadmin; a press made here
 * records the role OPERATOR (competitions-crawler, 12 Oct 2026).
 */
export default async function RootCompetitionsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  // decision 0007 (6 Nov 2026): the marketplace's desk is not here while the operator has COMPETITIONS off (/root/features).
  if (!(await featureOn("COMPETITIONS"))) notFound();
  return <CompetitionsDeskPage base="/root/competitions" searchParams={searchParams} />;
}
