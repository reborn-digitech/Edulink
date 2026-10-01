import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NotebookIcon } from "@phosphor-icons/react/ssr";
import { AccessError, requireRole } from "@/lib/tenancy";
import { db } from "@/lib/db";
import { staffAppraisals } from "@/lib/appraisal";
import { todayKey } from "@/lib/dates";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { getT } from "@/lib/i18n/server";
import { AppraisalPanel } from "./appraisal-panel";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("appraisal.metaTitle") };
}

/**
 * A member of staff's observations, targets and appraisals, newest first:
 * the head writes them here, the office reads them. What the member of
 * staff sees is only what the head has marked visible — the badge on each
 * entry says which.
 */
export default async function StaffAppraisalPage({ params }: { params: Promise<{ membershipId: string }> }) {
  const ctx = await requireRole("PRINCIPAL", "ADMIN");
  const t = await getT();
  const { membershipId } = await params;
  let view;
  try {
    view = await staffAppraisals(ctx, membershipId);
  } catch (error) {
    if (error instanceof AccessError) notFound();
    throw error;
  }
  const school = await db.school.findUniqueOrThrow({ where: { id: ctx.schoolId }, select: { timezone: true } });
  const today = todayKey(school.timezone);
  return (
    <div className="space-y-6">
      <PageHeader back={{ href: "/principal/staff", label: t("staff.rosterTitle") }} title={t("appraisal.title", { name: view.name })} description={view.canEdit ? t("appraisal.introHead") : t("appraisal.introOffice")} />
      <Card>
        <CardHeader icon={<NotebookIcon weight="duotone" className="size-5" />} title={t("appraisal.timeline")} description={view.year ? t("appraisal.filedUnder", { year: view.year }) : t("appraisal.noYear")} />
        <CardBody>
          <AppraisalPanel membershipId={view.staffMembershipId} items={view.items} canEdit={view.canEdit} today={today} />
        </CardBody>
      </Card>
    </div>
  );
}
