import type { Metadata } from "next";
import { WarningIcon } from "@phosphor-icons/react/ssr";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { ModuleOff } from "@/components/module-off";
import { AttendanceReportTable } from "@/components/academics/report-table";
import { requireRole } from "@/lib/tenancy";
import { isModuleOn } from "@/lib/modules";
import { attendanceReport } from "@/lib/academics-attendance";
import { formatInZone } from "@/lib/dates";
import { db } from "@/lib/db";
import { getLocale, getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("academics.defaultersTitle") };
}

/**
 * The department's defaulters this term, below their programme's rule and
 * not condoned. Opening the list tells each of them (and their guardians,
 * where the student allows) — once a week per course at most.
 */
export default async function HodDefaultersPage() {
  const ctx = await requireRole("HOD");
  const [t, locale] = await Promise.all([getT(), getLocale()]);
  if (!(await isModuleOn(ctx.schoolId, "ACADEMICS"))) return <ModuleOff page module="ACADEMICS" t={t} college />;
  const [report, school] = await Promise.all([attendanceReport(ctx, { defaultersOnly: "1" }), db.school.findUniqueOrThrow({ where: { id: ctx.schoolId }, select: { timezone: true } })]);
  return (
    <div className="space-y-6">
      <PageHeader title={t("academics.defaultersTitle")} description={t("academics.hodDefaultersIntro")} />
      <Card>
        <CardHeader icon={<WarningIcon weight="duotone" className="size-5" />} title={t("academics.defaultersCount", { n: report.rows.length })} description={report.noticesSent ? t("academics.noticesSent", { n: report.noticesSent }) : t("academics.noticesNoneNew")} />
        <CardBody>
          <AttendanceReportTable t={t} rows={report.rows} formatAt={(iso) => formatInZone(new Date(iso), school.timezone, { day: "numeric", month: "short" }, locale)} />
        </CardBody>
      </Card>
    </div>
  );
}
