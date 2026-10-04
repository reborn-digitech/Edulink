import type { Metadata } from "next";
import Link from "next/link";
import { BriefcaseIcon, PlusIcon } from "@phosphor-icons/react/ssr";
import { getT } from "@/lib/i18n/server";
import { listDrives } from "@/lib/placement";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/states";
import { CellFrame, cellContext } from "@/components/placement/parts";
import { DriveTable } from "@/components/placement/drive-table";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("placement.tabDrives"), robots: { index: false, follow: false } };
}

/** Every drive the college runs or is a pooled guest of, newest first. */
export default async function DrivesPage({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const { ctx, t, on, college, canWrite } = await cellContext();
  const { ok, error } = await searchParams;
  if (!on) return <CellFrame t={t} on={false} college={college} current="drives" title={t("placement.tabDrives")}>{null}</CellFrame>;
  const { drives } = await listDrives(ctx);
  return (
    <CellFrame t={t} on college={college} current="drives" title={t("placement.tabDrives")} description={t("placement.drivesIntro")} ok={ok} error={error}>
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
        <CardBody className="p-0">{drives.length === 0 ? <div className="p-5"><EmptyState icon={<BriefcaseIcon weight="duotone" className="size-8" />} title={t("placement.noDrivesTitle")} description={t("placement.noDrivesBody")} /></div> : <DriveTable drives={drives} t={t} />}</CardBody>
      </Card>
    </CellFrame>
  );
}
