import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeftIcon, NotePencilIcon } from "@phosphor-icons/react/ssr";
import { requireRole } from "@/lib/tenancy";
import { isModuleOn } from "@/lib/modules";
import { alumniHome } from "@/lib/alumni";
import { getT } from "@/lib/i18n/server";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/states";
import { ModuleOff } from "@/components/module-off";
import { ShareForm } from "./share-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("alumni.shareTitle") };
}

/** A former pupil's post for the old school's feed, while the school takes them; held for the office. */
export default async function AlumniSharePage() {
  const ctx = await requireRole("ALUMNUS");
  const t = await getT();
  if (!(await isModuleOn(ctx.schoolId, "ALUMNI"))) return <ModuleOff module="ALUMNI" t={t} />;
  const home = await alumniHome(ctx);
  const open = home.feedMode === "POST" && !home.muted;
  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <Link href="/alumni" className="inline-flex items-center gap-1.5 text-sm font-medium text-fg-muted hover:text-fg">
        <ArrowLeftIcon weight="bold" className="size-4" />
        {t("modules.alumniName")}
      </Link>
      <PageHeader title={t("alumni.shareTitle")} description={open ? t("alumni.shareIntro") : undefined} />
      {open ? (
        <Card>
          <CardBody>
            <ShareForm />
          </CardBody>
        </Card>
      ) : (
        <EmptyState icon={<NotePencilIcon weight="duotone" className="size-8" />} title={home.muted ? t("alumni.mutedBanner") : t("alumni.shareOff")} />
      )}
    </div>
  );
}
