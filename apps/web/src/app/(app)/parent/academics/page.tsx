import type { Metadata } from "next";
import Link from "next/link";
import { ChartBarIcon, LockSimpleIcon } from "@phosphor-icons/react/ssr";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/states";
import { PageHeader } from "@/components/ui/page-header";
import { AttendanceTable } from "@/components/academics/parts";
import { requireParent } from "@/lib/tenancy";
import { familyAcademics } from "@/lib/academics-homes";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("academics.familyTitle") };
}

/**
 * A college student's lecture attendance for their guardian: a minor's
 * always, an adult's only while they let their guardians see attendance
 * (their consent record) — otherwise the page says so and shows nothing.
 */
export default async function ParentAcademicsPage({ searchParams }: { searchParams: Promise<{ child?: string }> }) {
  const ctx = await requireParent();
  const t = await getT();
  const { child } = await searchParams;
  const view = await familyAcademics(ctx, child);
  return (
    <div className="space-y-6">
      <PageHeader title={t("academics.familyTitle")} description={t("academics.familyIntro")} />
      {view.children.length > 1 ? (
        <nav aria-label={t("academics.whichChild")} className="flex flex-wrap gap-2 text-sm">
          {view.children.map((c) => (
            <Link key={c.studentMembershipId} href={`/parent/academics?child=${c.studentMembershipId}`} aria-current={c.studentMembershipId === view.childId ? "page" : undefined} className={c.studentMembershipId === view.childId ? "rounded-full bg-accent-soft px-3 py-1 font-semibold text-accent-strong" : "rounded-full border border-border px-3 py-1 text-fg-muted"}>
              {c.name}
            </Link>
          ))}
        </nav>
      ) : null}
      {view.childId === null ? (
        <EmptyState title={t("academics.familyNone")} description={t("academics.familyNoneBody")} />
      ) : !view.allowed ? (
        <EmptyState icon={<LockSimpleIcon weight="duotone" className="size-8" />} title={t("academics.familyNotGranted")} description={t("academics.familyNotGrantedBody")} />
      ) : (
        <Card>
          <CardHeader icon={<ChartBarIcon weight="duotone" className="size-5" />} title={t("academics.childAttendance", { name: view.children.find((c) => c.studentMembershipId === view.childId)?.name ?? "" })} />
          <CardBody>
            <AttendanceTable t={t} rows={view.attendance} />
          </CardBody>
        </Card>
      )}
    </div>
  );
}
