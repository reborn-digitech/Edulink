import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/tenancy";
import { SCHOOL_STAFF_ROLES } from "@/lib/staff-records";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/states";
import { PageHeader } from "@/components/ui/page-header";
import { getT } from "@/lib/i18n/server";
import { MyStaffAttendanceView } from "@/app/(app)/teacher/attendance/me/view";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("staffAttendance.myTitle") };
}

/**
 * "I'm in" and my own days, for the staff whose home is not /teacher
 * (campaign 2026-10-04, G-2): the college's faculty, HOD, exam cell, IQAC,
 * placement and accounts desks, and the driver, librarian and warden. The
 * principal's "faculty present" reads the staff register, which until now
 * only the office could fill for them. The same view and rules as the
 * teacher's page; under /account, as the leave and payslips pages are, so a
 * desk whose module is off still reaches it.
 */
export default async function MyAttendancePage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const ctx = await requireUser();
  const t = await getT();
  const staff = ctx.schoolId && ctx.membershipId && ctx.role && (SCHOOL_STAFF_ROLES as readonly string[]).includes(ctx.role);
  if (!staff || !ctx.schoolId) {
    return (
      <div className="space-y-6">
        <PageHeader title={t("staffAttendance.myTitle")} />
        <EmptyState title={t("payroll.notStaffTitle")} description={t("payroll.notStaffBody")} action={<Button asChild size="sm"><Link href="/account">{t("nav.account")}</Link></Button>} />
      </div>
    );
  }
  const { month } = await searchParams;
  return <MyStaffAttendanceView ctx={{ ...ctx, schoolId: ctx.schoolId }} requestedMonth={month} base="/account/attendance" />;
}
