import type { Metadata } from "next";
import Link from "next/link";
import { requireRole } from "@/lib/tenancy";
import { db } from "@/lib/db";
import { listHeads } from "@/lib/fees";
import { currentAcademicYear } from "@/lib/academic-year";
import { todayKey } from "@/lib/dates";
import { getT } from "@/lib/i18n/server";
import { Card, CardBody } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/states";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { StructureEditor } from "../editor";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("meta.feeStructure") };
}

export default async function NewStructurePage() {
  const t = await getT();
  const ctx = await requireRole("ADMIN");
  const [school, heads, year] = await Promise.all([
    db.school.findUniqueOrThrow({ where: { id: ctx.schoolId }, select: { timezone: true } }),
    listHeads(ctx.schoolId),
    currentAcademicYear(ctx.schoolId),
  ]);
  const header = <PageHeader title={t("fees.structureNew")} description={year ? t("calendar.yearRunning", { name: year.name }) : undefined} back={{ href: "/admin/fees/structures", label: t("fees.structuresTitle") }} />;

  if (!year) {
    return (
      <div className="mx-auto max-w-3xl space-y-5">
        {header}
        <EmptyState
          title={t("fees.noYear")}
          action={
            <Button asChild>
              <Link href="/admin/calendar">{t("nav.calendar")}</Link>
            </Button>
          }
        />
      </div>
    );
  }
  if (heads.length === 0) {
    return (
      <div className="mx-auto max-w-3xl space-y-5">
        {header}
        <EmptyState
          title={t("fees.structureNoHeads")}
          action={
            <Button asChild>
              <Link href="/admin/fees/heads">{t("fees.linkHeads")}</Link>
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      {header}
      <Card>
        <CardBody className="pt-5">
          <StructureEditor structureId={null} initial={null} heads={heads.map((h) => ({ id: h.id, name: h.name, code: h.code }))} todayKey={todayKey(school.timezone)} />
        </CardBody>
      </Card>
    </div>
  );
}
