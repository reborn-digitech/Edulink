import { getT } from "@/lib/i18n/server";
import { ModelServersCard } from "@/components/quiz-review/model-servers-card";
import { CompetitionsDeskPage } from "@/components/competitions-desk/desk-page";

export async function generateMetadata() {
  const t = await getT();
  return { title: t("appadmin.competitions") };
}

/**
 * Platform competitions — the ones posted for every school at once.
 * School-organised competitions are managed by their own admins and are
 * deliberately not listed here. competitions-crawler (12 Oct 2026): the page is
 * the competitions desk (src/components/competitions-desk/desk-page.tsx), with
 * the "Suggested from the web" and sources tabs; the operator has the same desk
 * at /root/competitions.
 */
export default function AppAdminHome({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return (
    <CompetitionsDeskPage
      base="/appadmin"
      searchParams={searchParams}
      // quiz-publish-jobs (11 Oct 2026): the two model servers' state and the way to the generated bank.
      top={<ModelServersCard deskHref="/appadmin/quiz-review" />}
    />
  );
}
