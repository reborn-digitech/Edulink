import type { Metadata } from "next";
import { CalendarCheckIcon } from "@phosphor-icons/react/ssr";
import { requireRole } from "@/lib/tenancy";
import { db } from "@/lib/db";
import { schoolLeave, LEAVE_KIND_LABEL_KEY, type LeaveKind } from "@/lib/leave";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/states";
import { DecideCard } from "./decide-card";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("meta.staffLeave") };
}

/**
 * Leave, from the principal's side.
 *
 * PENDING FIRST AND SEPARATELY, because this page has one job: the requests
 * nobody has answered. Decided ones are history and sit below, collapsed into a
 * plain list — mixing them would bury the two that need a decision under thirty
 * that do not.
 */
export default async function PrincipalLeavePage() {
  const t = await getT();
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

  /**
   * How many classes each applicant is DUE IN, so the decision screen can say
   * what approving will actually cover before it is pressed.
   *
   * COUNTED FROM BOTH LISTS, and it has to be. `decideLeave` arranges cover for
   * every class the applicant marks a register for AND every class they hold a
   * lesson in on the timetable, because those are different sets of people — a
   * visiting music teacher marks no registers and is due in six rooms. Counting
   * registers alone told a principal "applies to 1 class" and then created two,
   * and told a pure subject teacher's approver that no cover was needed at all.
   */
  const dutyCounts = new Map<string, number>();
  if (pending.length > 0) {
    const applicants = pending.map((p) => p.applicantMembershipId);
    const [registers, lessons] = await Promise.all([
      db.classTeacher.findMany({
        where: {
          schoolId: ctx.schoolId,
          canTakeAttendance: true,
          class: { archivedAt: null },
          teacherMembershipId: { in: applicants },
        },
        select: { teacherMembershipId: true, classId: true },
      }),
      db.timetableSlot.findMany({
        where: {
          schoolId: ctx.schoolId,
          class: { archivedAt: null },
          teacherMembershipId: { in: applicants },
        },
        select: { teacherMembershipId: true, classId: true },
        distinct: ["teacherMembershipId", "classId"],
      }),
    ]);

    // The union, per applicant — the same de-duplication `decideLeave` does, so
    // the number shown is the number of cover rows that will be written.
    const byApplicant = new Map<string, Set<string>>();
    for (const row of [...registers, ...lessons]) {
      if (!row.teacherMembershipId) continue;
      const set = byApplicant.get(row.teacherMembershipId) ?? new Set<string>();
      set.add(row.classId);
      byApplicant.set(row.teacherMembershipId, set);
    }
    for (const [membershipId, classes] of byApplicant) {
      dutyCounts.set(membershipId, classes.size);
    }
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
          Approving arranges cover for every class the applicant is due in — the registers they
          mark and the lessons they teach. Nothing here is visible to students or parents.
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
                    {LEAVE_KIND_LABEL_KEY[request.kind as LeaveKind]
                      ? t(LEAVE_KIND_LABEL_KEY[request.kind as LeaveKind])
                      : request.kind}
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
