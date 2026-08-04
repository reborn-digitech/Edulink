import type { Metadata } from "next";
import { CalendarCheckIcon } from "@phosphor-icons/react/ssr";
import { requireRole } from "@/lib/tenancy";
import { db } from "@/lib/db";
import { schoolLeave, LEAVE_KIND_LABEL, type LeaveKind } from "@/lib/leave";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/states";
import { DecideCard } from "./decide-card";

export const metadata: Metadata = { title: "Staff leave" };

/**
 * Leave, from the principal's side.
 *
 * PENDING FIRST AND SEPARATELY, because this page has one job: the requests
 * nobody has answered. Decided ones are history and sit below, collapsed into a
 * plain list — mixing them would bury the two that need a decision under thirty
 * that do not.
 */
export default async function PrincipalLeavePage() {
  const ctx = await requireRole("PRINCIPAL", "ADMIN");

  const [all, staff] = await Promise.all([
    schoolLeave(ctx),
    db.membership.findMany({
      where: {
        schoolId: ctx.schoolId,
        role: { in: ["TEACHER", "PRINCIPAL"] },
        status: "ACTIVE",
        leftAt: null,
      },
      select: { id: true, user: { select: { name: true, preferredName: true } } },
      orderBy: { joinedAt: "asc" },
    }),
  ]);

  const pending = all.filter((row) => row.status === "PENDING");
  const decided = all.filter((row) => row.status !== "PENDING");

  // How many registers each applicant is down to mark, so the decision screen
  // can say what approving will actually cover before it is pressed.
  const dutyCounts = new Map<string, number>();
  if (pending.length > 0) {
    const counts = await db.classTeacher.groupBy({
      by: ["teacherMembershipId"],
      where: {
        schoolId: ctx.schoolId,
        canTakeAttendance: true,
        class: { archivedAt: null },
        teacherMembershipId: { in: pending.map((p) => p.applicantMembershipId) },
      },
      _count: true,
    });
    for (const row of counts) dutyCounts.set(row.teacherMembershipId, row._count);
  }

  const staffOptions = staff.map((person) => ({
    membershipId: person.id,
    name: person.user.preferredName ?? person.user.name,
  }));

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-fg sm:text-3xl">Staff leave</h1>
        <p className="mt-1 text-sm leading-relaxed text-fg-muted">
          Approving arranges cover for every register the applicant is down to mark. Nothing here is
          visible to students or parents.
        </p>
      </div>

      <section>
        <h2 className="text-sm font-semibold text-fg">
          Waiting for you {pending.length > 0 ? `(${pending.length})` : ""}
        </h2>
        {pending.length === 0 ? (
          <div className="mt-3">
            <EmptyState
              icon={<CalendarCheckIcon weight="duotone" className="size-8" />}
              title="Nothing waiting"
              description="Leave requests appear here as staff send them."
            />
          </div>
        ) : (
          <ul className="mt-3 space-y-3">
            {pending.map((request) => (
              <li key={request.id}>
                <DecideCard
                  request={request}
                  staff={staffOptions.filter(
                    (person) => person.membershipId !== request.applicantMembershipId,
                  )}
                  classesCovered={dutyCounts.get(request.applicantMembershipId) ?? 0}
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      {decided.length > 0 && (
        <section className="border-t border-border pt-5">
          <h2 className="text-sm font-semibold text-fg">Already decided</h2>
          <ul className="mt-3 space-y-1.5">
            {decided.map((request) => (
              <li
                key={request.id}
                className="flex flex-wrap items-center gap-3 rounded-[--radius-sm] bg-surface-muted p-3"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-fg">
                    {request.applicantName}
                  </span>
                  <span className="block truncate text-xs text-fg-muted">
                    {request.fromDateKey}
                    {request.toDateKey !== request.fromDateKey ? ` to ${request.toDateKey}` : ""} ·{" "}
                    {LEAVE_KIND_LABEL[request.kind as LeaveKind] ?? request.kind}
                    {request.decidedByName ? ` · ${request.decidedByName}` : ""}
                  </span>
                </span>
                <Badge
                  tone={
                    request.status === "APPROVED"
                      ? "ok"
                      : request.status === "DECLINED"
                        ? "danger"
                        : "neutral"
                  }
                  size="sm"
                >
                  {request.status.toLowerCase()}
                </Badge>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
