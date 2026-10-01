import "server-only";
import type { z } from "zod";
import type { substitutionAssignSchema, substitutionBoardSchema, substitutionClearSchema, substitutionLessonSchema, myCoversSchema, schoolWeekSchema, coverAnsweredSchema } from "@edulink/contracts";
import { db } from "./db";
import { AccessError } from "./tenancy";
import { audit } from "./audit";
import { notify } from "./notify";
import { closedOn } from "./holidays";
import { approvedLeaveBetween } from "./leave";
import { readJsonArray } from "./json";
import { formatTeachingDays, isDateKey, parseTeachingDays, todayKey, weekdayOfKey } from "./dates";
import type { ActiveContext } from "./session";
import type { Role } from "./constants";

/**
 * The substitution board.
 *
 * A school that knows who was in this morning still has to answer, at
 * eleven, who takes 7B's Mathematics now that its teacher is away. The board
 * for a day is every lesson on the timetable whose teacher is ABSENT or ON
 * LEAVE on the staff register, or inside an approved leave, and for each
 * lesson who is standing in — a Substitution row on that slot and day — and
 * who could: staff who are in, free that period, ranked with the subject's
 * own teachers first and the lightest day next. The office assigns; the
 * substitute is told and sees the lesson on their Today.
 *
 * The board is read against the school's own week (`School.teachingDays`):
 * a day the school does not teach has no lessons and no board.
 */
const OFFICE: readonly Role[] = ["ADMIN", "PRINCIPAL"];
type Office = ActiveContext & { schoolId: string; membershipId: string; role: Role };
type Staff = ActiveContext & { schoolId: string; membershipId: string; role: Role };

function office(ctx: ActiveContext): Office {
  if (!ctx.schoolId || !ctx.membershipId || !ctx.role || !OFFICE.includes(ctx.role)) throw new AccessError("access.notAllowed");
  return ctx as Office;
}
function staff(ctx: ActiveContext): Staff {
  if (!ctx.schoolId || !ctx.membershipId || !ctx.role || !["ADMIN", "PRINCIPAL", "TEACHER"].includes(ctx.role)) throw new AccessError("access.notAllowed");
  return ctx as Staff;
}

type Board = z.infer<typeof substitutionBoardSchema>;
type Lesson = z.infer<typeof substitutionLessonSchema>;
type AbsentReason = Lesson["absentReason"];

const nameOf = (u: { name: string; preferredName: string | null }) => u.preferredName ?? u.name;

async function schoolOf(schoolId: string) {
  return db.school.findUniqueOrThrow({ where: { id: schoolId }, select: { timezone: true, teachingDays: true } });
}

/**
 * Who is away on the day, and why: the register's word first, then an
 * approved leave. The register is authoritative in BOTH directions, as it is
 * on the staff register itself — a stored PRESENT, LATE or HALF_DAY means
 * the person came in, approved leave or not, and they are not on the board.
 */
async function absentOn(ctx: Staff, dateKey: string): Promise<Map<string, AbsentReason>> {
  const [rows, leave] = await Promise.all([
    db.staffAttendance.findMany({ where: { schoolId: ctx.schoolId, dateKey }, select: { membershipId: true, status: true } }),
    approvedLeaveBetween(ctx, dateKey, dateKey),
  ]);
  const out = new Map<string, AbsentReason>();
  for (const r of leave) out.set(r.applicantMembershipId, "ON_LEAVE");
  for (const r of rows) {
    if (r.status === "ABSENT") out.set(r.membershipId, "ABSENT");
    else if (r.status === "ON_LEAVE") out.set(r.membershipId, "ON_LEAVE");
    else out.delete(r.membershipId);
  }
  return out;
}

const SLOT_SELECT = {
  id: true,
  classId: true,
  periodId: true,
  weekday: true,
  subject: true,
  room: true,
  teacherMembershipId: true,
  class: { select: { name: true } },
  period: { select: { name: true, position: true, startMinute: true, endMinute: true } },
} as const;

/** A lesson counts as covered when someone is named and has not declined; a declined cover is the office's to reassign. */
const isCovered = (l: Lesson) => Boolean(l.substitute && !l.substitute.declinedAt);

/** The board for a day: today when none is asked for. */
export async function substitutionBoard(ctx: ActiveContext, date?: string | null): Promise<Board> {
  const caller = office(ctx);
  const school = await schoolOf(caller.schoolId);
  const dateKey = date && isDateKey(date) ? date : todayKey(school.timezone);
  const closure = await closedOn(caller.schoolId, dateKey);
  const empty: Board = { dateKey, closed: true, closedName: closure.closed ? (closure.entries[0]?.name ?? null) : null, absent: [], lessons: [], covered: 0, uncovered: 0 };
  if (!closure.teachingDay || closure.closed) return empty;

  const weekday = weekdayOfKey(dateKey);
  const away = await absentOn(caller, dateKey);
  const [members, daySlots, rows] = await Promise.all([
    db.membership.findMany({
      where: { schoolId: caller.schoolId, role: { in: ["TEACHER", "PRINCIPAL", "ADMIN"] }, status: "ACTIVE", leftAt: null },
      select: { id: true, role: true, subjects: true, user: { select: { name: true, preferredName: true } } },
      take: 500,
    }),
    db.timetableSlot.findMany({ where: { schoolId: caller.schoolId, weekday, class: { archivedAt: null } }, select: SLOT_SELECT }),
    db.substitution.findMany({ where: { schoolId: caller.schoolId, dateKey }, select: { slotId: true, substituteMembershipId: true, note: true, acknowledgedAt: true, declinedAt: true, declineReason: true } }),
  ]);
  const memberById = new Map(members.map((m) => [m.id, m]));
  const coverBySlot = new Map(rows.map((r) => [r.slotId, r]));

  // What each person already has that day: their own lessons, by period, and
  // the covers they have taken on. A lesson of an absent teacher is not a
  // clash for anyone — it is the very thing being covered.
  const busy = new Map<string, Set<string>>();
  const load = new Map<string, number>();
  const bump = (who: string, periodId: string) => {
    (busy.get(who) ?? busy.set(who, new Set()).get(who)!).add(periodId);
    load.set(who, (load.get(who) ?? 0) + 1);
  };
  for (const slot of daySlots) if (slot.teacherMembershipId && !away.has(slot.teacherMembershipId)) bump(slot.teacherMembershipId, slot.periodId);
  const slotById = new Map(daySlots.map((s) => [s.id, s]));
  for (const r of rows) {
    const slot = slotById.get(r.slotId);
    // A declined cover holds nobody: the person who said no is free for it again, and for anything else that period.
    if (slot && !r.declinedAt) bump(r.substituteMembershipId, slot.periodId);
  }
  const subjectsBy = new Map(members.map((m) => [m.id, new Set(readJsonArray<string>(m.subjects).map((s) => s.toLowerCase()))]));

  const lessons: Lesson[] = daySlots
    .filter((slot) => slot.teacherMembershipId && away.has(slot.teacherMembershipId) && memberById.has(slot.teacherMembershipId))
    .map((slot) => {
      const absentId = slot.teacherMembershipId!;
      const cover = coverBySlot.get(slot.id);
      const coverer = cover ? memberById.get(cover.substituteMembershipId) : null;
      const subject = slot.subject.toLowerCase();
      const candidates = members
        .filter((m) => m.id !== absentId && !away.has(m.id))
        .map((m) => ({
          membershipId: m.id,
          name: nameOf(m.user),
          role: m.role,
          // The person already on this lesson is "free" for it: their own cover is not a clash.
          free: !busy.get(m.id)?.has(slot.periodId) || cover?.substituteMembershipId === m.id,
          teachesSubject: subjectsBy.get(m.id)?.has(subject) ?? false,
          load: load.get(m.id) ?? 0,
        }))
        .sort((a, b) => Number(b.free) - Number(a.free) || Number(b.teachesSubject) - Number(a.teachesSubject) || a.load - b.load || a.name.localeCompare(b.name))
        .slice(0, 12);
      return {
        slotId: slot.id,
        periodId: slot.periodId,
        periodName: slot.period.name,
        position: slot.period.position,
        startMinute: slot.period.startMinute,
        endMinute: slot.period.endMinute,
        classId: slot.classId,
        className: slot.class.name,
        subject: slot.subject,
        room: slot.room,
        absentMembershipId: absentId,
        absentName: nameOf(memberById.get(absentId)!.user),
        absentReason: away.get(absentId)!,
        substitute: cover && coverer ? { membershipId: cover.substituteMembershipId, name: nameOf(coverer.user), note: cover.note, acknowledgedAt: cover.acknowledgedAt?.toISOString() ?? null, declinedAt: cover.declinedAt?.toISOString() ?? null, declineReason: cover.declineReason } : null,
        candidates,
      };
    })
    .sort((a, b) => a.position - b.position || a.className.localeCompare(b.className));

  const absent = [...away.entries()]
    .filter(([id]) => memberById.has(id))
    .map(([id, reason]) => {
      const mine = lessons.filter((l) => l.absentMembershipId === id);
      return { membershipId: id, name: nameOf(memberById.get(id)!.user), reason, lessons: mine.length, covered: mine.filter((l) => isCovered(l)).length };
    })
    .sort((a, b) => b.lessons - a.lessons || a.name.localeCompare(b.name));
  const covered = lessons.filter((l) => isCovered(l)).length;
  return { dateKey, closed: false, closedName: null, absent, lessons, covered, uncovered: lessons.length - covered };
}

/** A slot on a day, checked: it is the school's, the day is one the slot falls on and the school teaches, and its teacher is away. */
async function lessonOn(caller: Office, dateKey: string, slotId: string) {
  const closure = await closedOn(caller.schoolId, dateKey);
  if (!closure.teachingDay || closure.closed) throw new AccessError("substitutions.refuseClosed");
  const slot = await db.timetableSlot.findFirst({ where: { id: slotId, schoolId: caller.schoolId }, select: SLOT_SELECT });
  if (!slot) throw new AccessError("substitutions.noSuchLesson", "NOT_FOUND");
  if (slot.weekday !== weekdayOfKey(dateKey)) throw new AccessError("substitutions.wrongDay");
  if (!slot.teacherMembershipId) throw new AccessError("substitutions.unstaffed");
  const away = await absentOn(caller, dateKey);
  if (!away.has(slot.teacherMembershipId)) throw new AccessError("substitutions.teacherNotAway");
  return { slot: { ...slot, teacherMembershipId: slot.teacherMembershipId }, away };
}

/** The office names who takes the lesson. The same person again changes nothing; a clash is refused. */
export async function assignSubstitute(ctx: ActiveContext, input: z.infer<typeof substitutionAssignSchema>): Promise<{ changed: boolean }> {
  const caller = office(ctx);
  const { slot, away } = await lessonOn(caller, input.dateKey, input.slotId);
  if (input.substituteMembershipId === slot.teacherMembershipId) throw new AccessError("substitutions.sameTeacher");
  const sub = await db.membership.findFirst({
    where: { id: input.substituteMembershipId, schoolId: caller.schoolId, role: { in: ["TEACHER", "PRINCIPAL", "ADMIN"] }, status: "ACTIVE", leftAt: null },
    select: { id: true, userId: true, user: { select: { name: true, preferredName: true } } },
  });
  if (!sub) throw new AccessError("substitutions.noSuchStaff", "NOT_FOUND");
  if (away.has(sub.id)) throw new AccessError("substitutions.substituteAway");

  const existing = await db.substitution.findUnique({ where: { slotId_dateKey: { slotId: slot.id, dateKey: input.dateKey } }, select: { id: true, substituteMembershipId: true, note: true, declinedAt: true } });
  const note = input.note?.trim() || null;
  if (existing && existing.substituteMembershipId === sub.id && (existing.note ?? null) === note) return { changed: false };
  const samePerson = Boolean(existing && existing.substituteMembershipId === sub.id);

  // A clash: their own lesson in that period, or another cover that period that day.
  const [ownClash, coverClash] = await Promise.all([
    db.timetableSlot.findFirst({ where: { schoolId: caller.schoolId, weekday: slot.weekday, periodId: slot.periodId, teacherMembershipId: sub.id, class: { archivedAt: null } }, select: { id: true } }),
    db.substitution.findFirst({ where: { schoolId: caller.schoolId, dateKey: input.dateKey, substituteMembershipId: sub.id, slotId: { not: slot.id }, slot: { periodId: slot.periodId } }, select: { id: true } }),
  ]);
  if (ownClash || coverClash) throw new AccessError("substitutions.clash");

  const previous = existing && existing.substituteMembershipId !== sub.id ? await db.membership.findUnique({ where: { id: existing.substituteMembershipId }, select: { userId: true } }) : null;
  await db.substitution.upsert({
    where: { slotId_dateKey: { slotId: slot.id, dateKey: input.dateKey } },
    create: { schoolId: caller.schoolId, dateKey: input.dateKey, slotId: slot.id, absentMembershipId: slot.teacherMembershipId, substituteMembershipId: sub.id, note, createdByUserId: caller.user.id },
    // Someone else named: their answer is theirs to give; the same person with a new note keeps the answer they gave.
    update: { absentMembershipId: slot.teacherMembershipId, substituteMembershipId: sub.id, note, createdByUserId: caller.user.id, ...(samePerson ? {} : { acknowledgedAt: null, declinedAt: null, declineReason: null }) },
  });
  const absent = await db.membership.findUnique({ where: { id: slot.teacherMembershipId }, select: { user: { select: { name: true, preferredName: true } } } });
  const vars = { subject: slot.subject, className: slot.class.name, period: slot.period.name, date: input.dateKey, name: absent ? nameOf(absent.user) : "" };
  if (!existing || existing.substituteMembershipId !== sub.id) {
    await notify({ userId: sub.userId, schoolId: caller.schoolId, kind: "SYSTEM", titleKey: "notifTitle.coverAssigned", titleVars: vars, bodyKey: "notifTitle.coverAssignedBody", bodyVars: vars, url: "/teacher", meta: { slotId: slot.id, dateKey: input.dateKey } });
  }
  if (previous) {
    await notify({ userId: previous.userId, schoolId: caller.schoolId, kind: "SYSTEM", titleKey: "notifTitle.coverReleased", titleVars: vars, bodyKey: "notifTitle.coverReleasedBody", bodyVars: vars, url: "/teacher", meta: { slotId: slot.id, dateKey: input.dateKey } });
  }
  await audit({ schoolId: caller.schoolId, actorUserId: caller.user.id, action: "substitutions.assign", targetType: "TimetableSlot", targetId: slot.id, meta: { dateKey: input.dateKey, substituteMembershipId: sub.id, replaced: Boolean(previous) } });
  return { changed: true };
}

/** The lesson is uncovered again; nothing there is a no-op. The person released is told. */
export async function clearSubstitution(ctx: ActiveContext, input: z.infer<typeof substitutionClearSchema>): Promise<{ changed: boolean }> {
  const caller = office(ctx);
  const existing = await db.substitution.findFirst({
    where: { slotId: input.slotId, dateKey: input.dateKey, schoolId: caller.schoolId },
    select: { id: true, substitute: { select: { userId: true } }, absent: { select: { user: { select: { name: true, preferredName: true } } } }, slot: { select: { subject: true, class: { select: { name: true } }, period: { select: { name: true } } } } },
  });
  if (!existing) return { changed: false };
  await db.substitution.delete({ where: { id: existing.id } });
  const vars = { subject: existing.slot.subject, className: existing.slot.class.name, period: existing.slot.period.name, date: input.dateKey, name: nameOf(existing.absent.user) };
  await notify({ userId: existing.substitute.userId, schoolId: caller.schoolId, kind: "SYSTEM", titleKey: "notifTitle.coverReleased", titleVars: vars, bodyKey: "notifTitle.coverReleasedBody", bodyVars: vars, url: "/teacher", meta: { slotId: input.slotId, dateKey: input.dateKey } });
  await audit({ schoolId: caller.schoolId, actorUserId: caller.user.id, action: "substitutions.clear", targetType: "TimetableSlot", targetId: input.slotId, meta: { dateKey: input.dateKey } });
  return { changed: true };
}

/**
 * The lessons I am covering on a day, in period order. A cover whose absent
 * teacher is not away after all — the leave withdrawn, or the register saying
 * they came in — is not a lesson to take, and a closed day has none.
 */
export async function myCovers(ctx: ActiveContext, date?: string | null): Promise<z.infer<typeof myCoversSchema>> {
  const caller = staff(ctx);
  const school = await schoolOf(caller.schoolId);
  const dateKey = date && isDateKey(date) ? date : todayKey(school.timezone);
  const closure = await closedOn(caller.schoolId, dateKey);
  if (!closure.teachingDay || closure.closed) return { dateKey, items: [] };
  const [rows, away] = await Promise.all([
    db.substitution.findMany({
      where: { schoolId: caller.schoolId, dateKey, substituteMembershipId: caller.membershipId },
      select: { id: true, slotId: true, note: true, acknowledgedAt: true, declinedAt: true, declineReason: true, absentMembershipId: true, absent: { select: { user: { select: { name: true, preferredName: true } } } }, slot: { select: SLOT_SELECT } },
    }),
    absentOn(caller, dateKey),
  ]);
  const items = rows
    .filter((r) => away.has(r.absentMembershipId))
    .map((r) => ({
      id: r.id,
      slotId: r.slotId,
      periodName: r.slot.period.name,
      position: r.slot.period.position,
      startMinute: r.slot.period.startMinute,
      endMinute: r.slot.period.endMinute,
      classId: r.slot.classId,
      className: r.slot.class.name,
      subject: r.slot.subject,
      room: r.slot.room,
      absentName: nameOf(r.absent.user),
      note: r.note,
      acknowledgedAt: r.acknowledgedAt?.toISOString() ?? null,
      declinedAt: r.declinedAt?.toISOString() ?? null,
      declineReason: r.declineReason,
    }))
    .sort((a, b) => a.position - b.position);
  return { dateKey, items };
}

/* -------------------------------------------------------------------------- */
/* The covering teacher's answer                                               */
/* -------------------------------------------------------------------------- */

/** The cover row, mine to answer: the school's, and I am the one named on it. Anyone else's is not found. */
async function myCover(caller: Staff, coverId: string) {
  const cover = await db.substitution.findFirst({
    where: { id: coverId, schoolId: caller.schoolId, substituteMembershipId: caller.membershipId },
    select: { id: true, slotId: true, dateKey: true, acknowledgedAt: true, declinedAt: true, declineReason: true, absent: { select: { user: { select: { name: true, preferredName: true } } } }, substitute: { select: { user: { select: { name: true, preferredName: true } } } }, slot: { select: { subject: true, class: { select: { name: true } }, period: { select: { name: true } } } } },
  });
  if (!cover) throw new AccessError("substitutions.noSuchCover", "NOT_FOUND");
  return cover;
}

/**
 * I have seen the cover and will take it. Saying so twice changes nothing;
 * saying so after declining takes the decline back (the office is not told
 * again — the board simply shows the lesson covered).
 */
export async function acknowledgeCover(ctx: ActiveContext, coverId: string): Promise<z.infer<typeof coverAnsweredSchema>> {
  const caller = staff(ctx);
  const cover = await myCover(caller, coverId);
  if (cover.acknowledgedAt && !cover.declinedAt) return { changed: false, state: "ACKNOWLEDGED" };
  await db.substitution.update({ where: { id: cover.id }, data: { acknowledgedAt: new Date(), declinedAt: null, declineReason: null } });
  await audit({ schoolId: caller.schoolId, actorUserId: caller.user.id, action: "substitutions.acknowledge", targetType: "Substitution", targetId: cover.id, meta: { slotId: cover.slotId, dateKey: cover.dateKey, afterDecline: Boolean(cover.declinedAt) } });
  return { changed: true, state: "ACKNOWLEDGED" };
}

/**
 * I cannot take the cover, and why. The office and the head are told at once
 * (event "cover.declined") so the lesson can be given to someone else; the
 * board shows it uncovered again with the reason beside the name. The same
 * reason twice changes nothing and tells nobody twice.
 */
export async function declineCover(ctx: ActiveContext, coverId: string, reason: string): Promise<z.infer<typeof coverAnsweredSchema>> {
  const caller = staff(ctx);
  const cover = await myCover(caller, coverId);
  const why = reason.trim().slice(0, 300);
  if (cover.declinedAt && cover.declineReason === why) return { changed: false, state: "DECLINED" };
  await db.substitution.update({ where: { id: cover.id }, data: { declinedAt: new Date(), declineReason: why, acknowledgedAt: null } });
  const office = await db.membership.findMany({
    where: { schoolId: caller.schoolId, role: { in: ["ADMIN", "PRINCIPAL"] }, status: "ACTIVE", leftAt: null, NOT: { id: caller.membershipId } },
    select: { userId: true },
    distinct: ["userId"],
    take: 50,
  });
  const vars = { subject: cover.slot.subject, className: cover.slot.class.name, period: cover.slot.period.name ?? "", date: cover.dateKey, name: nameOf(cover.substitute.user), reason: why };
  const url = `/admin/substitutions?date=${cover.dateKey}`;
  await Promise.all(office.map((m) => notify({ userId: m.userId, schoolId: caller.schoolId, kind: "SYSTEM", titleKey: "notifTitle.coverDeclined", titleVars: vars, bodyKey: "notifTitle.coverDeclinedBody", bodyVars: vars, url, meta: { event: "cover.declined", coverId: cover.id, slotId: cover.slotId, dateKey: cover.dateKey } })));
  await audit({ schoolId: caller.schoolId, actorUserId: caller.user.id, action: "substitutions.decline", targetType: "Substitution", targetId: cover.id, meta: { slotId: cover.slotId, dateKey: cover.dateKey, told: office.length } });
  return { changed: true, state: "DECLINED" };
}

/* -------------------------------------------------------------------------- */
/* The school's week                                                            */
/* -------------------------------------------------------------------------- */

/** The weekday numbers the school teaches on, Monday first. */
export async function schoolWeekOf(ctx: ActiveContext): Promise<z.infer<typeof schoolWeekSchema>> {
  const caller = office(ctx);
  const school = await schoolOf(caller.schoolId);
  return { days: parseTeachingDays(school.teachingDays) };
}

/**
 * The office sets the week. A slot already on a day the school no longer
 * teaches stays on the timetable but off every grid; the office is told how
 * many so it can move them. Setting the same week again changes nothing.
 */
export async function setSchoolWeek(ctx: ActiveContext, input: z.infer<typeof schoolWeekSchema>): Promise<{ days: number[]; orphanedSlots: number }> {
  const caller = office(ctx);
  // Setting the week is setting the school up: the admin's. The head reads it and runs the board.
  if (caller.role !== "ADMIN") throw new AccessError("access.onlyAnAdminSetsUpTheSchool");
  const days = parseTeachingDays(input.days.join(","));
  const school = await schoolOf(caller.schoolId);
  const orphanedSlots = await db.timetableSlot.count({ where: { schoolId: caller.schoolId, weekday: { notIn: days }, class: { archivedAt: null } } });
  if (formatTeachingDays(days) === formatTeachingDays(parseTeachingDays(school.teachingDays))) return { days, orphanedSlots };
  await db.school.update({ where: { id: caller.schoolId }, data: { teachingDays: formatTeachingDays(days) } });
  await audit({ schoolId: caller.schoolId, actorUserId: caller.user.id, action: "school.week", targetType: "School", targetId: caller.schoolId, meta: { days, orphanedSlots } });
  return { days, orphanedSlots };
}
