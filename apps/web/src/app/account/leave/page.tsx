import type { Metadata } from "next";
import Link from "next/link";
import { CalendarIcon } from "@phosphor-icons/react/ssr";
import { leaveBalanceFor } from "@/lib/staff-records";
import { LeaveBalanceCard } from "@/components/leave-balance-card";
import { requireUser } from "@/lib/tenancy";
import { db } from "@/lib/db";
import { COVER_ROLES, LEAVE_APPLICANT_ROLES, myLeave } from "@/lib/leave";
import { todayKey } from "@/lib/dates";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/states";
import { PageHeader } from "@/components/ui/page-header";
import { getT } from "@/lib/i18n/server";
import { LeaveForm } from "@/app/(app)/teacher/leave/form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("meta.leave") };
}

/**
 * My own leave, for the staff whose home is not /teacher (4 Oct 2026): the
 * college's faculty, HOD, exam cell, IQAC, placement and accounts desks, and
 * the driver, librarian and warden. The same form, balance and rules as the
 * teacher's page (lib/leave.ts); the office or the principal decides it on
 * /principal/leave. Under /account because it is the person's own, so a desk
 * whose module is off still reaches it, as the payslips do.
 */
export default async function MyLeavePage() {
  const ctx = await requireUser();
  const t = await getT();
  const staff = ctx.schoolId && ctx.membershipId && ctx.role && (LEAVE_APPLICANT_ROLES as readonly string[]).includes(ctx.role);
  if (!staff || !ctx.schoolId || !ctx.membershipId) {
    return (
      <div className="space-y-6">
        <PageHeader title={t("teacher.leave")} />
        <EmptyState title={t("payroll.notStaffTitle")} description={t("payroll.notStaffBody")} action={<Button asChild size="sm"><Link href="/account">{t("nav.account")}</Link></Button>} />
      </div>
    );
  }
  const schoolId = ctx.schoolId;
  const membershipId = ctx.membershipId;
  const [school, requests, colleagues, balance] = await Promise.all([
    db.school.findUniqueOrThrow({ where: { id: schoolId }, select: { timezone: true } }),
    myLeave(ctx),
    db.membership.findMany({
      where: { schoolId, role: { in: [...COVER_ROLES] }, status: "ACTIVE", leftAt: null, id: { not: membershipId } },
      select: { id: true, user: { select: { name: true, preferredName: true } } },
      orderBy: { joinedAt: "asc" },
    }),
    leaveBalanceFor(schoolId, membershipId),
  ]);

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div className="flex items-start gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-full bg-accent-soft text-accent-strong">
          <CalendarIcon weight="duotone" className="size-6" />
        </span>
        <PageHeader title={t("teacher.leave")} description={t("teacher.leaveExplainer")} />
      </div>
      <LeaveBalanceCard balance={balance} t={t} />
      <LeaveForm
        requests={requests}
        today={todayKey(school.timezone)}
        staff={colleagues.map((person) => ({ membershipId: person.id, name: person.user.preferredName ?? person.user.name }))}
      />
    </div>
  );
}
