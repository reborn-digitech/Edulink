import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { StethoscopeIcon } from "@phosphor-icons/react/ssr";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { ModuleOff } from "@/components/module-off";
import { RecordsFlash } from "@/components/stream-records/flash";
import { PostingsList, QueueCard } from "@/components/clinical/parts";
import { clinicalSupervision } from "@/lib/clinical";
import { requireRole } from "@/lib/tenancy";
import { institutionKindOf, isModuleOn } from "@/lib/modules";
import { isCollegeKind } from "@/lib/institution";
import { getLocale, getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("duties.clinical.supervisingTitle") };
}

/**
 * A SUPERVISING TEACHER'S OWN CLINICAL PAGE (R-56, the clinical half; 10 Oct
 * 2026): the postings the coordinator put under their name and the logbook
 * entries waiting for their signature, for any FACULTY or HOD at a college
 * with a clinical stream — no duty needed; the right is the posting's.
 * lib/clinical.ts `clinicalSupervision`.
 */
export default async function FacultyClinicalPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const ctx = await requireRole("FACULTY", "HOD");
  if (!isCollegeKind(await institutionKindOf(ctx.schoolId))) notFound();
  const t = await getT();
  const locale = await getLocale();
  if (!(await isModuleOn(ctx.schoolId, "ACADEMICS"))) return <ModuleOff page module="ACADEMICS" t={t} college />;
  const params = await searchParams;
  const d = await clinicalSupervision(ctx);
  return (
    <div className="space-y-6">
      <PageHeader title={t("duties.clinical.supervisingTitle")} description={t("duties.clinical.supervisingIntro")} />
      <RecordsFlash t={t} params={params} />
      {!d.offered ? <p className="rounded-[var(--radius-md)] border border-border bg-surface-muted px-3 py-2 text-sm text-fg-muted">{t("duties.clinical.notOffered")}</p> : null}
      <Card>
        <CardHeader icon={<StethoscopeIcon weight="duotone" className="size-5" />} title={t("duties.clinical.postingsTitle")} />
        <CardBody>
          <PostingsList postings={d.postings} t={t} locale={locale} empty={{ title: t("duties.clinical.noSupervising"), body: t("duties.clinical.noSupervisingBody") }} />
        </CardBody>
      </Card>
      <QueueCard queue={d.queue} t={t} locale={locale} back="/faculty/clinical" />
    </div>
  );
}
