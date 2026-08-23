import type { Metadata } from "next";
import { leaveBalanceFor } from "@/lib/staff-records";
import { LeaveBalanceCard } from "@/components/leave-balance-card";
import { CalendarIcon } from "@phosphor-icons/react/ssr";
import { requireRole } from "@/lib/tenancy";
import { db } from "@/lib/db";
import { myLeave } from "@/lib/leave";
import { todayKey } from "@/lib/dates";
import { LeaveForm } from "./form";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("meta.leave") };
}

export default async function TeacherLeavePage() {
  const t = await getT();
  const ctx = await requireRole("TEACHER", "PRINCIPAL");

  const school = await db.school.findUniqueOrThrow({
    where: { id: ctx.schoolId },
    select: { timezone: true },
  });

  const [requests, staff, balance] = await Promise.all([
    myLeave(ctx),
    db.membership.findMany({
      where: {
        schoolId: ctx.schoolId,
        role: { in: ["TEACHER", "PRINCIPAL"] },
        status: "ACTIVE",
        leftAt: null,
        // Nominating yourself to cover your own absence is not a thing.
        id: { not: ctx.membershipId },
      },
      select: { id: true, user: { select: { name: true, preferredName: true } } },
      orderBy: { joinedAt: "asc" },
    }),
    leaveBalanceFor(ctx.schoolId!, ctx.membershipId!),
  ]);

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div className="flex items-start gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-full bg-accent-soft text-accent-strong">
          <CalendarIcon weight="duotone" className="size-6" />
        </span>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-fg sm:text-3xl">{t("teacher.leave")}</h1>
          <p className="mt-1 text-sm leading-relaxed text-fg-muted">
            {t("teacher.leaveExplainer")}
          </p>
        </div>
      </div>

      <LeaveBalanceCard balance={balance} t={t} />

      <LeaveForm
        requests={requests}
        today={todayKey(school.timezone)}
        staff={staff.map((person) => ({
          membershipId: person.id,
          name: person.user.preferredName ?? person.user.name,
        }))}
      />
    </div>
  );
}
