import "server-only";
import { db } from "./db";
import { AccessError, assertGuardianAccess } from "./tenancy";
import { forSchool } from "./tenant-context";
import { listContexts } from "./session";
import { currentAcademicYear } from "./academic-year";
import { addDaysToKey, dateKeyInZone, todayKey } from "./dates";
import { ownWorkScope, workLabel } from "./grading";
import { dateToDay } from "./fees";
import { pupilMaySeeFees } from "./fees-family";
import type { ActiveContext } from "./session";

/**
 * The fortnight agenda: what is coming for one pupil, in date order, from
 * every source that holds a date about them — the exam sittings for their
 * grade, the work still due, the guidance sessions booked, the parent's
 * meetings with teachers, the calendar's closures and events, and the fee
 * instalments falling due. One list the pupil and the guardian both read,
 * each row a link to the page that owns it.
 *
 * WHO SEES WHAT. A pupil sees their own; a guardian sees one child at a
 * time, re-checked against the guardianship. Meetings are the guardian's
 * bookings and appear only on theirs. Fee dates appear for the guardian
 * always, and for the pupil only while the school lets pupils of their age
 * see fees (School.pupilFeeViewAge) — the pupil's row never links to a way
 * to pay.
 */

export type AgendaKind = "EXAM" | "WORK" | "SESSION" | "MEETING" | "CLOSURE" | "EVENT" | "FEE";

export type AgendaRow = {
  id: string;
  kind: AgendaKind;
  dateKey: string;
  at: string | null;
  endDateKey: string | null;
  title: string;
  detail: string | null;
  amountPaise: number | null;
  href: string;
};

export type Agenda = {
  children: { studentMembershipId: string; name: string; schoolName: string; leftAt: string | null }[];
  student: { studentMembershipId: string; name: string; schoolName: string };
  fromKey: string;
  toKey: string;
  days: number;
  timeZone: string;
  rows: AgendaRow[];
};

export const AGENDA_DEFAULT_DAYS = 14;
export const AGENDA_MAX_DAYS = 60;

const KIND_ORDER: Record<AgendaKind, number> = { CLOSURE: 0, EVENT: 1, EXAM: 2, SESSION: 3, MEETING: 4, WORK: 5, FEE: 6 };

/** Date first, then the timed ones in time order with the untimed after, then a steady order of kinds. Exported for the test. */
export function sortAgenda(rows: AgendaRow[]): AgendaRow[] {
  return [...rows].sort((a, b) => {
    if (a.dateKey !== b.dateKey) return a.dateKey < b.dateKey ? -1 : 1;
    if (a.at !== b.at) {
      if (a.at === null) return 1;
      if (b.at === null) return -1;
      return a.at < b.at ? -1 : 1;
    }
    return KIND_ORDER[a.kind] - KIND_ORDER[b.kind] || (a.title < b.title ? -1 : a.title > b.title ? 1 : 0);
  });
}

type Viewer = { role: "STUDENT" | "PARENT"; schoolId: string; studentMembershipId: string; name: string; schoolName: string; timeZone: string; gradeLevel: string | null; birthdate: Date | null; userId: string };

async function viewerFor(ctx: ActiveContext, studentMembershipId?: string | null): Promise<{ viewer: Viewer; children: Agenda["children"] }> {
  if (ctx.role === "STUDENT") {
    if (!ctx.schoolId || !ctx.membershipId) throw new AccessError("access.noActiveSchoolSelected");
    const m = await db.membership.findFirst({ where: { id: ctx.membershipId, schoolId: ctx.schoolId, role: "STUDENT" }, select: { id: true, gradeLevel: true, user: { select: { name: true, preferredName: true, birthdate: true } }, school: { select: { id: true, name: true, timezone: true } } } });
    if (!m) throw new AccessError("access.notAllowed");
    return { viewer: { role: "STUDENT", schoolId: m.school.id, studentMembershipId: m.id, name: m.user.preferredName ?? m.user.name, schoolName: m.school.name, timeZone: m.school.timezone, gradeLevel: m.gradeLevel, birthdate: m.user.birthdate, userId: ctx.user.id }, children: [] };
  }
  if (ctx.role !== "PARENT") throw new AccessError("access.wrongRoleForThisAction");
  const { children } = await listContexts(ctx.user.id);
  const selectedId = studentMembershipId ?? children.find((c) => !c.leftAt)?.studentMembershipId ?? children[0]?.studentMembershipId;
  if (!selectedId) throw new AccessError("access.notAllowed");
  const link = await assertGuardianAccess(ctx.user.id, selectedId);
  return {
    viewer: { role: "PARENT", schoolId: link.student.schoolId, studentMembershipId: link.studentMembershipId, name: link.student.user.preferredName ?? link.student.user.name, schoolName: link.student.school.name, timeZone: link.student.school.timezone, gradeLevel: link.student.gradeLevel, birthdate: link.student.user.birthdate, userId: ctx.user.id },
    children: children.map((c) => ({ studentMembershipId: c.studentMembershipId, name: c.name, schoolName: c.schoolName, leftAt: c.leftAt ? c.leftAt.toISOString() : null })),
  };
}

/** The pupil's own, or a guardian's child's, next `days` days (14 by default, 60 at most). */
export async function familyAgenda(ctx: ActiveContext, input: { student?: string | null; days?: number | null } = {}, now: Date = new Date()): Promise<Agenda> {
  const { viewer, children } = await viewerFor(ctx, input.student);
  const days = Math.max(1, Math.min(AGENDA_MAX_DAYS, input.days ?? AGENDA_DEFAULT_DAYS));
  const fromKey = todayKey(viewer.timeZone, now);
  const toKey = addDaysToKey(fromKey, days - 1);
  const parentChild = viewer.role === "PARENT" ? `?child=${viewer.studentMembershipId}` : "";
  const rows = await forSchool(viewer.schoolId, async () => {
    const out: AgendaRow[] = [];
    const year = await currentAcademicYear(viewer.schoolId);
    const enrolments = await db.enrollment.findMany({ where: { schoolId: viewer.schoolId, studentMembershipId: viewer.studentMembershipId, status: "ACTIVE" }, select: { class: { select: { gradeLevel: true } } } });
    const grades = [...new Set(enrolments.map((e) => e.class.gradeLevel).filter((g): g is string => g !== null))];
    if (viewer.gradeLevel && !grades.includes(viewer.gradeLevel)) grades.push(viewer.gradeLevel);

    // Exam sittings for the pupil's grade, from published series.
    if (grades.length > 0) {
      const slots = await db.examSlot.findMany({
        where: { schoolId: viewer.schoolId, dateKey: { gte: fromKey, lte: toKey }, series: { schoolId: viewer.schoolId, archivedAt: null, publishedAt: { not: null }, gradeLevel: { in: grades } } },
        select: { id: true, subject: true, dateKey: true, startMinute: true, series: { select: { name: true } } },
        orderBy: [{ dateKey: "asc" }, { position: "asc" }],
      });
      for (const s of slots) out.push({ id: `exam:${s.id}`, kind: "EXAM", dateKey: s.dateKey, at: s.startMinute === null ? null : minuteToIso(s.dateKey, s.startMinute, viewer.timeZone), endDateKey: null, title: s.subject, detail: s.series.name, amountPaise: null, href: "/exams" });
    }

    // Work still due: published, not an exam paper, not handed in or marked.
    const fromInstant = new Date(`${fromKey}T00:00:00.000Z`);
    const toInstant = new Date(`${addDaysToKey(toKey, 2)}T00:00:00.000Z`);
    const work = await db.assignment.findMany({
      where: {
        schoolId: viewer.schoolId,
        publishedAt: { not: null },
        examSlotId: null,
        dueAt: { gte: new Date(fromInstant.getTime() - 86_400_000), lt: toInstant },
        submissions: { none: { studentMembershipId: viewer.studentMembershipId, submittedAt: { not: null } } },
        grades: { none: { studentMembershipId: viewer.studentMembershipId } },
        ...(await ownWorkScope(viewer.schoolId, viewer.studentMembershipId)),
      },
      select: { id: true, title: true, dueAt: true, class: { select: { name: true } }, offering: { select: { course: { select: { code: true, name: true } } } } },
      orderBy: [{ dueAt: "asc" }],
    });
    for (const a of work) {
      if (!a.dueAt) continue;
      const dateKey = dateKeyInZone(a.dueAt, viewer.timeZone);
      if (dateKey < fromKey || dateKey > toKey) continue;
      out.push({ id: `work:${a.id}`, kind: "WORK", dateKey, at: a.dueAt.toISOString(), endDateKey: null, title: a.title, detail: workLabel(a), amountPaise: null, href: viewer.role === "PARENT" ? `/parent/assignments${parentChild}` : "/student/assignments" });
    }

    // Guidance sessions and workshops the pupil has a seat in (or one waiting for a guardian's yes).
    const bookings = await db.gigBooking.findMany({
      where: { schoolId: viewer.schoolId, studentMembershipId: viewer.studentMembershipId, status: { in: ["PENDING_CONSENT", "CONFIRMED"] }, slot: { cancelledAt: null, startsAt: { gte: fromInstant, lt: toInstant } } },
      select: { id: true, status: true, slot: { select: { title: true, startsAt: true, provider: { select: { name: true } } } } },
    });
    for (const b of bookings) {
      const dateKey = dateKeyInZone(b.slot.startsAt, viewer.timeZone);
      if (dateKey < fromKey || dateKey > toKey) continue;
      out.push({ id: `session:${b.id}`, kind: "SESSION", dateKey, at: b.slot.startsAt.toISOString(), endDateKey: null, title: b.slot.title, detail: b.slot.provider.name, amountPaise: null, href: "/sessions" });
    }

    // The guardian's meetings about this child.
    if (viewer.role === "PARENT") {
      const meetings = await db.meetingBooking.findMany({
        where: { schoolId: viewer.schoolId, studentMembershipId: viewer.studentMembershipId, parentUserId: viewer.userId, cancelledAt: null, slot: { cancelledAt: null, startsAt: { gte: fromInstant, lt: toInstant } } },
        select: { id: true, slot: { select: { startsAt: true, location: true, teacher: { select: { user: { select: { name: true, preferredName: true } } } } } } },
      });
      for (const m of meetings) {
        const dateKey = dateKeyInZone(m.slot.startsAt, viewer.timeZone);
        if (dateKey < fromKey || dateKey > toKey) continue;
        out.push({ id: `meeting:${m.id}`, kind: "MEETING", dateKey, at: m.slot.startsAt.toISOString(), endDateKey: null, title: m.slot.teacher.user.preferredName ?? m.slot.teacher.user.name, detail: m.slot.location, amountPaise: null, href: "/parent/meetings" });
      }
    }

    // Closures and events from the school's calendar, clipped to the window.
    const holidays = await db.holiday.findMany({ where: { schoolId: viewer.schoolId, startDateKey: { lte: toKey }, endDateKey: { gte: fromKey } }, select: { id: true, name: true, kind: true, startDateKey: true, endDateKey: true, note: true }, orderBy: [{ startDateKey: "asc" }, { name: "asc" }] });
    for (const h of holidays) {
      const dateKey = h.startDateKey < fromKey ? fromKey : h.startDateKey;
      out.push({ id: `calendar:${h.id}`, kind: h.kind === "HOLIDAY" ? "CLOSURE" : "EVENT", dateKey, at: null, endDateKey: h.endDateKey > dateKey ? h.endDateKey : null, title: h.name, detail: h.note, amountPaise: null, href: viewer.role === "PARENT" ? "/parent/timetable" : "/timetable" });
    }

    // Fee instalments falling due, with what is still outstanding on them.
    const feesAllowed = viewer.role === "PARENT" || (await db.school.findUnique({ where: { id: viewer.schoolId }, select: { pupilFeeViewAge: true } }).then((s) => pupilMaySeeFees(s?.pupilFeeViewAge ?? null, viewer.birthdate, now).allowed));
    if (feesAllowed && year) {
      const demands = await db.feeDemand.findMany({ where: { schoolId: viewer.schoolId, studentMembershipId: viewer.studentMembershipId, academicYearId: year.id, status: { in: ["OPEN", "PART"] }, dueDate: { gte: fromInstant, lt: toInstant } }, select: { id: true, label: true, dueDate: true, netPaise: true, paidPaise: true }, orderBy: { dueDate: "asc" } });
      for (const d of demands) {
        const dateKey = dateToDay(d.dueDate);
        if (dateKey < fromKey || dateKey > toKey) continue;
        const outstanding = Math.max(0, d.netPaise - d.paidPaise);
        if (outstanding <= 0) continue;
        out.push({ id: `fee:${d.id}`, kind: "FEE", dateKey, at: null, endDateKey: null, title: d.label, detail: null, amountPaise: outstanding, href: viewer.role === "PARENT" ? `/parent/fees${parentChild}` : "/student/fees" });
      }
    }
    return sortAgenda(out);
  });
  return {
    children,
    student: { studentMembershipId: viewer.studentMembershipId, name: viewer.name, schoolName: viewer.schoolName },
    fromKey,
    toKey,
    days,
    timeZone: viewer.timeZone,
    rows,
  };
}

/** A minute of a day in the school's zone, as an instant. */
function minuteToIso(dateKey: string, minute: number, timeZone: string): string {
  // Find the UTC instant whose wall clock in `timeZone` is dateKey + minute: start from UTC midnight and correct by the zone's offset at that moment.
  const guess = new Date(`${dateKey}T00:00:00.000Z`).getTime() + minute * 60_000;
  const wall = new Date(new Date(guess).toLocaleString("en-US", { timeZone }));
  const utc = new Date(new Date(guess).toLocaleString("en-US", { timeZone: "UTC" }));
  return new Date(guess - (wall.getTime() - utc.getTime())).toISOString();
}
