import type { Metadata } from "next";
import { requireRole } from "@/lib/tenancy";
import { db } from "@/lib/db";
import { getT } from "@/lib/i18n/server";
import { todayKey } from "@/lib/dates";
import { isModuleOn } from "@/lib/modules";
import { PageHeader } from "@/components/ui/page-header";
import { SupportStaffForm } from "./form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("supportStaff.title") };
}

/**
 * owner-batch-item2a (27 Oct 2026): ADD SUPPORT STAFF. A cleaner, cook, guard, peon, gardener or ayah, put on the
 * books with no login so the school can pay them: the name, the job, the day they joined, a phone the office rings,
 * and the salary when the school runs payroll here. They then appear on the people page, the staff register and the
 * payroll like any member of staff; a sign-in can be given later from their row (Issue sign-in code).
 */
export default async function AddSupportStaffPage() {
  const t = await getT();
  const ctx = await requireRole("ADMIN");
  const [school, payroll] = await Promise.all([
    db.school.findUniqueOrThrow({ where: { id: ctx.schoolId }, select: { timezone: true } }),
    isModuleOn(ctx.schoolId, "PAYROLL"),
  ]);
  const structures = payroll
    ? await db.salaryStructure.findMany({ where: { schoolId: ctx.schoolId, archivedAt: null }, orderBy: { name: "asc" }, select: { id: true, name: true } })
    : [];
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title={t("supportStaff.title")} description={t("supportStaff.subtitle")} back={{ href: "/admin/people", label: t("intake.backToPeople") }} />
      <SupportStaffForm today={todayKey(school.timezone)} payroll={payroll} structures={structures} />
    </div>
  );
}
