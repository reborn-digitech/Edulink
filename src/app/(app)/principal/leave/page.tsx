import type { Metadata } from "next";
import { leaveBalancesFor, leaveDays } from "@/lib/staff-records";
import { CalendarCheckIcon } from "@phosphor-icons/react/ssr";
import { requireRole } from "@/lib/tenancy";
import { db } from "@/lib/db";
import {
  schoolLeave,
  coverCandidates,
  LEAVE_KIND_LABEL_KEY,
  LEAVE_STATUS_KEY,
  type LeaveKind,
  type LeaveStatus,
} from "@/lib/leave";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/states";
import { DecideCard } from "./decide-card";
import { getT } from "@/lib/i18n/server";
import { formatDateKey } from "@/lib/dates";

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
  // What the desk was approving blind: each applicant's leave this year.
  const balances = await leaveBalancesFor(ctx.schoolId!, pending.map((r) => r.applicantMembershipId));
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

  /**
   * The timetable's advice, per request: who is actually FREE for the
   * applicant's lessons in that window. Computed here so the picker can rank
   * free people first and say why, instead of offering the alphabet.
   */
  const suggestionsBy = new Map<
    string,
    {
      lessonCount: number;
      options: { membershipId: string; name: string; hint: string | null }[];
      groups: import("./decide-card").GroupPick[];
    }
  >();
  for (const request of pending) {
    const { lessonCount, candidates, groups } = await coverCandidates(
      ctx,
      request.applicantMembershipId,
      request.fromDateKey,
      request.toDateKey,
    );
    suggestionsBy.set(request.id, {
      lessonCount,
      options: candidates.map((candidate) => ({
        membershipId: candidate.membershipId,
        name: candidate.name,
        hint:
          lessonCount === 0
            ? null
            : candidate.clashes === 0
              ? t("principalCover.free")
              : t("principalCover.busy", { busy: candidate.clashes, total: lessonCount }),
      })),
      /* The (class, subject) slices, hints re-said against each group's own
         lessons: free for all four Maths periods is a different fact from
         free for the whole week. */
      groups: groups.map((group) => ({
        classId: group.classId,
        className: group.className,
        subject: group.subject,
        lessonCount: group.lessonCount,
        options: group.candidates.map((candidate) => ({
          membershipId: candidate.membershipId,
          name: candidate.name,
          teachesSubject: candidate.teachesSubject,
          hint:
            candidate.clashes === 0
              ? t("reviews.freeForAll")
              : t("reviews.clashesN", { count: candidate.clashes }),
        })),
      })),
    });
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-fg sm:text-3xl">
          {t("principal.staffLeave")}
        </h1>
        <p className="mt-1 text-sm leading-relaxed text-fg-muted">{t("principal.staffLeaveBody")}</p>
      </div>

      <section>
        <h2 className="text-sm font-semibold text-fg">
          {pending.length > 0
            ? t("principal.waitingForYouCount", { count: pending.length })
            : t("principal.waitingForYou")}
        </h2>
        {pending.length === 0 ? (
          <div className="mt-3">
            <EmptyState
              icon={<CalendarCheckIcon weight="duotone" className="size-8" />}
              title={t("principal.nothingWaiting")}
              description={t("principal.nothingWaitingBody")}
            />
          </div>
        ) : (
          <ul className="mt-3 space-y-3">
            {pending.map((request) => (
              <li key={request.id}>
                <DecideCard
                  request={request}
                  staff={
                    suggestionsBy.get(request.id)?.options ??
                    staffOptions
                      .filter((person) => person.membershipId !== request.applicantMembershipId)
                      .map((person) => ({ ...person, hint: null }))
                  }
                  groups={suggestionsBy.get(request.id)?.groups ?? []}
                  classesCovered={dutyCounts.get(request.applicantMembershipId) ?? 0}
                  balance={(() => {
                    const b = balances.get(request.applicantMembershipId);
                    if (!b) return null;
                    const counted = request.kind === "CASUAL" || request.kind === "SICK";
                    return { ...b, thisRequest: counted ? leaveDays(request.fromDateKey, request.toDateKey) : 0 };
                  })()}
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      {decided.length > 0 && (
        <section className="border-t border-border pt-5">
          <h2 className="text-sm font-semibold text-fg">{t("principal.alreadyDecided")}</h2>
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
                    {request.toDateKey !== request.fromDateKey
                      ? t("calendar.rangeTo", {
                          from: formatDateKey(request.fromDateKey, { day: "numeric", month: "short" }),
                          to: formatDateKey(request.toDateKey, { day: "numeric", month: "short" }),
                        })
                      : formatDateKey(request.fromDateKey, { day: "numeric", month: "short" })}{" "}
                    ·{" "}
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
                  {t(LEAVE_STATUS_KEY[request.status as LeaveStatus] ?? "leaveStatus.pending")}
                </Badge>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
