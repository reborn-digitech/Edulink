import type { Metadata } from "next";
import Link from "next/link";
import { BriefcaseIcon, BuildingsIcon, ClipboardTextIcon, PlusIcon } from "@phosphor-icons/react/ssr";
import { getT } from "@/lib/i18n/server";
import { waitingCompaniesText } from "@/lib/count-copy";
import { placementHome } from "@/lib/placement-analytics";
import { Card, CardBody, CardHeader, StatTile } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/states";
import { CellFrame, LINK, cellContext, lpa } from "@/components/placement/parts";
import { DriveTable } from "@/components/placement/drive-table";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("role.tpo"), robots: { index: false, follow: false } };
}

/**
 * The TPO's home (the placement module, 4 October 2026): the season's table
 * at a glance, the drives, and what is waiting — requirements from
 * recruiters, internships to approve, companies to verify. The office and
 * the principal read the same page. Switched off, it says so.
 */
export default async function PlacementHome({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const { ctx, t, on, college, canWrite } = await cellContext();
  const { ok, error } = await searchParams;
  if (!on) return <CellFrame t={t} on={false} college={college} current="home" title={t("placement.homeTitle")}>{null}</CellFrame>;
  const home = await placementHome(ctx);
  const tb = home.table;
  return (
    <CellFrame t={t} on college={college} current="home" title={t("placement.homeTitle")} description={t("placement.homeIntro", { batch: home.batchYear })} ok={ok} error={error}>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {/* B-29: the tile counts the season's batch, not a drive's eligible list; with nobody finishing that year it says why it is 0. */}
        <StatTile label={t("placement.tileFinalYear")} value={tb.finalYear} hint={tb.finalYear === 0 ? t("placement.tileFinalYearNone", { batch: home.batchYear }) : t("placement.tileFinalYearHint", { batch: home.batchYear })} />
        <StatTile label={t("placement.tilePlaced")} value={tb.placed} tone="ok" />
        <StatTile label={t("placement.tileMedian")} value={tb.medianSalaryRupees === null ? "—" : lpa(tb.medianSalaryRupees, t)} />
        <StatTile label={t("placement.tileIndex")} value={tb.placementIndex === null ? "—" : tb.placementIndex.toFixed(2)} hint={t("placement.tileIndexHint")} />
      </div>
      <Card>
        <CardHeader icon={<ClipboardTextIcon weight="duotone" className="size-5" />} title={t("placement.waitingTitle")} />
        <CardBody className="flex flex-wrap gap-4 text-sm">
          <Link className={LINK} href="/placement/companies">{t("placement.waitingRequirements", { count: home.requirementsWaiting })}</Link>
          <Link className={LINK} href="/placement/internships">{t("placement.waitingInternships", { count: home.internshipsWaiting })}</Link>
          <Link className={LINK} href="/placement/companies">{waitingCompaniesText(t, home.unverifiedCompanies)}</Link>
        </CardBody>
      </Card>
      <Card>
        <CardHeader
          icon={<BriefcaseIcon weight="duotone" className="size-5" />}
          title={t("placement.drivesTitle")}
          action={
            canWrite ? (
              <Button asChild size="sm">
                <Link href="/placement/drives/new">
                  <PlusIcon weight="bold" className="size-4" aria-hidden />
                  {t("placement.openDrive")}
                </Link>
              </Button>
            ) : undefined
          }
        />
        <CardBody className="p-0">
          {home.drives.length === 0 ? (
            <div className="p-5">
              <EmptyState icon={<BuildingsIcon weight="duotone" className="size-8" />} title={t("placement.noDrivesTitle")} description={t("placement.noDrivesBody")} />
            </div>
          ) : (
            <DriveTable drives={home.drives.slice(0, 12)} t={t} />
          )}
        </CardBody>
      </Card>
    </CellFrame>
  );
}
