import type { Metadata } from "next";
import { FirstAidKitIcon, LockKeyIcon, StethoscopeIcon } from "@phosphor-icons/react/ssr";
import { requireRole } from "@/lib/tenancy";
import { db } from "@/lib/db";
import { healthCardFor } from "@/lib/health";
import { maySelfRead } from "@/lib/self-read";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/states";
import { PageHeader } from "@/components/ui/page-header";
import { HealthCardEditor, HealthChecksList } from "@/components/health-card";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("familyCare.myHealthTitle"), robots: { index: false, follow: false } };
}

/**
 * The pupil's own health card, read-only, from the age the school sets
 * (self-read.ts). Below the age, or with no age set or no date of birth on
 * the account, the page is the "ask a grown-up" empty state and says
 * nothing about which of those it was. `healthCardFor` makes the same
 * decision for the record itself; `canEdit` is false for a pupil whatever
 * the age, so the editor shows the card and no form.
 */
export default async function StudentHealthPage() {
  const ctx = await requireRole("STUDENT");
  const t = await getT();
  const allowed = await maySelfRead(ctx, ctx.membershipId);
  if (!allowed) {
    return (
      <div className="space-y-5">
        <PageHeader title={t("familyCare.myHealthTitle")} back={{ href: "/student", label: t("nav.today") }} />
        <EmptyState icon={<LockKeyIcon weight="duotone" className="size-8" />} title={t("familyCare.askGrownUpTitle")} description={t("familyCare.askGrownUpBody")} />
      </div>
    );
  }
  const [view, school] = await Promise.all([healthCardFor(ctx, ctx.membershipId), db.school.findUniqueOrThrow({ where: { id: ctx.schoolId }, select: { timezone: true } })]);
  return (
    <div className="space-y-5">
      <PageHeader title={t("familyCare.myHealthTitle")} description={t("familyCare.myHealthBody")} back={{ href: "/student", label: t("nav.today") }} />
      <Card>
        <CardHeader icon={<FirstAidKitIcon weight="duotone" className="size-5" />} title={t("health.title")} />
        <CardBody>
          <HealthCardEditor view={view} timezone={school.timezone} />
        </CardBody>
      </Card>
      <Card>
        <CardHeader icon={<StethoscopeIcon weight="duotone" className="size-5" />} title={t("health.checks")} description={t("health.checksHint")} />
        <CardBody>
          <HealthChecksList checks={view.checks} />
        </CardBody>
      </Card>
    </div>
  );
}
