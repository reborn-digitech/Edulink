import { getT } from "@/lib/i18n/server";
import { featureOn } from "@/lib/platform-features";
import { requireAppAdmin } from "@/lib/tenancy";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { ModelServersCard } from "@/components/quiz-review/model-servers-card";
import { ViduraReviewCountsCard } from "@/components/vidura-review/counts-card";
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
export default async function AppAdminHome({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  // decision 0007 (6 Nov 2026): the marketplace is behind the COMPETITIONS switch. The content team's home keeps
  // its other cards while it is off; the desk, its tabs and its doors (404 FEATURE_OFF) wait for the operator.
  if (!(await featureOn("COMPETITIONS"))) {
    await requireAppAdmin();
    const t = await getT();
    return (
      <div className="space-y-5">
        <PageHeader title={t("appadmin.competitions")} description={t("appadmin.competitionsIntro")} />
        <ModelServersCard deskHref="/appadmin/quiz-review" />
        <ViduraReviewCountsCard href="/appadmin/vidura-review" />
        <Card data-testid="competitions-off">
          <CardHeader title={t("appadmin.marketplaceOffTitle")} description={t("appadmin.marketplaceOffBody")} />
          <CardBody>
            <p className="text-sm text-fg-muted">{t("appadmin.marketplaceOffWhere")}</p>
          </CardBody>
        </Card>
      </div>
    );
  }
  return (
    <CompetitionsDeskPage
      base="/appadmin"
      searchParams={searchParams}
      // quiz-publish-jobs (11 Oct 2026): the two model servers' state and the way to the generated bank.
      top={
        <>
          <ModelServersCard deskHref="/appadmin/quiz-review" />
          {/* Vidura pass 2 (17 Oct 2026): the guide's Hindi and Marathi renderings, read here and reviewed by the operator. */}
          <ViduraReviewCountsCard href="/appadmin/vidura-review" />
        </>
      }
    />
  );
}
