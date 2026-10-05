import type { Metadata } from "next";
import Link from "next/link";
import { ChartBarIcon } from "@phosphor-icons/react/ssr";
import { Card, CardBody, CardHeader, StatTile } from "@/components/ui/card";
import { ModuleOff } from "@/components/module-off";
import { OfficeTop } from "@/components/academics/parts";
import { TermPicker } from "@/components/academics/term-picker";
import { AttendanceReportTable } from "@/components/academics/report-table";
import { academicsStructure } from "@/lib/academics";
import { attendanceReport } from "@/lib/academics-attendance";
import { formatInZone } from "@/lib/dates";
import { db } from "@/lib/db";
import { getT } from "@/lib/i18n/server";
import { academicsGate, one, type SearchParams } from "../shared";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("academics.tabAttendance") };
}

/** Lecture attendance across the college: by offering, or the defaulters, against each programme's rule — the eligibility list the exam forms read. */
export default async function AttendanceAdminPage({ searchParams }: { searchParams: SearchParams }) {
  const { ctx, t, locale, on, college } = await academicsGate();
  if (!on) return <ModuleOff page module="ACADEMICS" t={t} college={college} />;
  const params = await searchParams;
  const defaulters = one(params.defaulters) === "1";
  const [s, report, school] = await Promise.all([
    academicsStructure(ctx),
    attendanceReport(ctx, { termId: one(params.termId), offeringId: one(params.offeringId), defaultersOnly: defaulters ? "1" : "0" }),
    db.school.findUniqueOrThrow({ where: { id: ctx.schoolId }, select: { timezone: true } }),
  ]);
  const at = (iso: string) => formatInZone(new Date(iso), school.timezone, { day: "numeric", month: "short" }, locale);
  const students = new Set(report.rows.map((r) => r.studentMembershipId)).size;
  const short = report.rows.filter((r) => !r.eligible).length;
  return (
    <div className="space-y-6">
      <OfficeTop t={t} current="attendance" params={params} />
      <TermPicker t={t} terms={s.terms} current={report.termId} path="/admin/academics/attendance" extra={defaulters ? "&defaulters=1" : ""} />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatTile label={t("academics.statStudents")} value={students} />
        <StatTile label={t("academics.statDefaulters")} value={short} tone={short ? "warn" : "ok"} />
        <StatTile label={t("academics.statRows")} value={report.rows.length} />
      </div>
      <Card>
        <CardHeader icon={<ChartBarIcon weight="duotone" className="size-5" />} title={t(defaulters ? "academics.defaultersTitle" : "academics.reportTitle")} description={t("academics.reportBody")} />
        <CardBody className="space-y-3">
          <p className="text-sm">
            <Link className="font-medium text-accent-strong underline underline-offset-2" href={`/admin/academics/attendance?termId=${report.termId ?? ""}${defaulters ? "" : "&defaulters=1"}`}>
              {t(defaulters ? "academics.showEveryone" : "academics.showDefaulters")}
            </Link>
          </p>
          <AttendanceReportTable t={t} rows={report.rows} formatAt={at} />
        </CardBody>
      </Card>
    </div>
  );
}
