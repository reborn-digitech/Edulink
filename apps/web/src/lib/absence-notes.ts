import "server-only";
import type { AbsenceNoteCreate, AbsenceNoteRow, AbsenceNotes, RegisterAbsenceNote } from "@edulink/contracts";
import { db } from "./db";
import { AccessError, assertGuardianAccess } from "./tenancy";
import { audit } from "./audit";
import { forSchool } from "./tenant-context";
import { addDaysToKey, todayKey } from "./dates";
import type { ActiveContext } from "./session";

/**
 * THE FAMILY TELLS THE SCHOOL FIRST. The register's absence notice exists
 * because a school that marks a child absent must tell the family at once —
 * but when the family has already said "away on Thursday, it's a wedding",
 * the notice is noise and the teacher wondering is wasted. So a guardian
 * (or the pupil, for themselves) files one note per day with a coded
 * reason, the register shows it beside the pupil's row for that day, and
 * the notice that day's absence would have sent is not sent.
 *
 * WHO FILES: an active guardian of the child (assertGuardianAccess — the
 * stand-in teacher is one too, and the row says who filed it), or the pupil
 * for their own membership. WHO READS: the same, and the register.
 *
 * DAYS ARE THE SCHOOL'S. A note is for today or a coming day in the
 * school's zone — the past is the register's — and at most NOTE_DAYS_AHEAD
 * ahead, so a note is a plan and not a term's leave. One per day: filing
 * again for the same day replaces the first (which also makes a replay
 * harmless). TAKING IT BACK: its author, until the day's register has
 * marked the pupil; after that the note is part of what happened.
 */

export const NOTE_DAYS_AHEAD = 60;

type Filer = { schoolId: string; studentMembershipId: string; studentName: string; timezone: string; authorRole: "PARENT" | "STUDENT" };

async function admit(ctx: ActiveContext, studentMembershipId: string): Promise<Filer> {
  if (ctx.role === "PARENT") {
    const link = await assertGuardianAccess(ctx.user.id, studentMembershipId, "ATTENDANCE");
    if (link.student.leftAt) throw new AccessError("access.notAllowed");
    return { schoolId: link.student.schoolId, studentMembershipId, studentName: link.student.user.preferredName ?? link.student.user.name, timezone: link.student.school.timezone, authorRole: "PARENT" };
  }
  if (ctx.role === "STUDENT" && ctx.schoolId && ctx.membershipId && ctx.membershipId === studentMembershipId) {
    const m = await db.membership.findFirst({
      where: { id: studentMembershipId, schoolId: ctx.schoolId, role: "STUDENT", status: "ACTIVE", leftAt: null },
      select: { user: { select: { name: true, preferredName: true } }, school: { select: { timezone: true } } },
    });
    if (!m) throw new AccessError("access.notAllowed");
    return { schoolId: ctx.schoolId, studentMembershipId, studentName: m.user.preferredName ?? m.user.name, timezone: m.school.timezone, authorRole: "STUDENT" };
  }
  throw new AccessError("access.notAllowed");
}

type Row = { id: string; studentMembershipId: string; dateKey: string; reason: string; text: string | null; authorUserId: string; authorRole: string; createdAt: Date };

async function rowsOut(ctx: ActiveContext, rows: Row[], today: string): Promise<AbsenceNoteRow[]> {
  if (rows.length === 0) return [];
  const ids = [...new Set(rows.map((r) => r.authorUserId))];
  const users = await db.user.findMany({ where: { id: { in: ids } }, select: { id: true, name: true, preferredName: true } });
  const names = new Map(users.map((u) => [u.id, u.preferredName ?? u.name]));
  // A day already marked is the register's: the note stays as filed.
  const marked = new Set(
    (
      await db.attendanceRecord.findMany({
        where: { studentMembershipId: rows[0]!.studentMembershipId, session: { dateKey: { in: rows.map((r) => r.dateKey) } } },
        select: { session: { select: { dateKey: true } } },
      })
    ).map((r) => r.session.dateKey),
  );
  return rows.map((r) => ({
    id: r.id,
    studentMembershipId: r.studentMembershipId,
    dateKey: r.dateKey,
    reason: r.reason as AbsenceNoteRow["reason"],
    text: r.text ?? "",
    authorName: names.get(r.authorUserId) ?? "",
    authorRole: r.authorRole as AbsenceNoteRow["authorRole"],
    createdAt: r.createdAt.toISOString(),
    canDelete: r.authorUserId === ctx.user.id && r.dateKey >= today && !marked.has(r.dateKey),
  }));
}

/** The notes from today on, soonest first. */
export async function listAbsenceNotes(ctx: ActiveContext, studentMembershipId: string, now: Date = new Date()): Promise<AbsenceNotes> {
  const filer = await admit(ctx, studentMembershipId);
  const today = todayKey(filer.timezone, now);
  const rows = await db.absenceNote.findMany({ where: { schoolId: filer.schoolId, studentMembershipId, dateKey: { gte: today } }, orderBy: { dateKey: "asc" } });
  return { studentMembershipId, childName: filer.studentName, today, notes: await rowsOut(ctx, rows, today) };
}

/** Files a note for one day; a second for the same day replaces the first. */
export async function fileAbsenceNote(ctx: ActiveContext, studentMembershipId: string, input: AbsenceNoteCreate, now: Date = new Date()): Promise<AbsenceNotes> {
  const filer = await admit(ctx, studentMembershipId);
  const today = todayKey(filer.timezone, now);
  if (input.dateKey < today) throw new AccessError("familyCare.absencePastDay");
  if (input.dateKey > addDaysToKey(today, NOTE_DAYS_AHEAD)) throw new AccessError("familyCare.absenceTooFar", "FORBIDDEN", { days: NOTE_DAYS_AHEAD });
  const data = { reason: input.reason, text: input.text || null, authorUserId: ctx.user.id, authorRole: filer.authorRole };
  const note = await forSchool(filer.schoolId, () =>
    db.absenceNote.upsert({
      where: { studentMembershipId_dateKey: { studentMembershipId, dateKey: input.dateKey } },
      create: { schoolId: filer.schoolId, studentMembershipId, dateKey: input.dateKey, ...data },
      update: data,
      select: { id: true },
    }),
  );
  // The reason is a code; the line the family wrote stays on the note, not in the log the whole office reads.
  await audit({ schoolId: filer.schoolId, actorUserId: ctx.user.id, action: "absence.note", targetType: "Membership", targetId: studentMembershipId, meta: { noteId: note.id, dateKey: input.dateKey, reason: input.reason, by: filer.authorRole } });
  return listAbsenceNotes(ctx, studentMembershipId, now);
}

/** Its author takes a note back, before the day's register has marked the pupil. */
export async function deleteAbsenceNote(ctx: ActiveContext, studentMembershipId: string, noteId: string, now: Date = new Date()): Promise<AbsenceNotes> {
  const filer = await admit(ctx, studentMembershipId);
  const today = todayKey(filer.timezone, now);
  const note = await db.absenceNote.findFirst({ where: { id: noteId, schoolId: filer.schoolId, studentMembershipId } });
  if (!note) throw new AccessError("familyCare.absenceNotFound", "NOT_FOUND");
  if (note.authorUserId !== ctx.user.id) throw new AccessError("familyCare.absenceNotYours");
  if (note.dateKey < today) throw new AccessError("familyCare.absencePastDay");
  const marked = await db.attendanceRecord.findFirst({ where: { studentMembershipId, session: { dateKey: note.dateKey } }, select: { id: true } });
  if (marked) throw new AccessError("familyCare.absenceAlreadyMarked");
  await forSchool(filer.schoolId, () => db.absenceNote.delete({ where: { id: noteId } }));
  await audit({ schoolId: filer.schoolId, actorUserId: ctx.user.id, action: "absence.note.delete", targetType: "Membership", targetId: studentMembershipId, meta: { noteId, dateKey: note.dateKey } });
  return listAbsenceNotes(ctx, studentMembershipId, now);
}

/**
 * The notes for one day across a roster, for the register and for the
 * absence notice it would send. Scoped to the school; the caller has
 * already established the class is theirs.
 */
export async function absenceNotesOn(schoolId: string, studentMembershipIds: string[], dateKey: string): Promise<Map<string, RegisterAbsenceNote>> {
  if (studentMembershipIds.length === 0) return new Map();
  const rows = await db.absenceNote.findMany({
    where: { schoolId, dateKey, studentMembershipId: { in: studentMembershipIds } },
    select: { studentMembershipId: true, reason: true, text: true, authorRole: true },
  });
  return new Map(rows.map((r) => [r.studentMembershipId, { reason: r.reason as RegisterAbsenceNote["reason"], text: r.text ?? "", byFamily: r.authorRole !== "STUDENT" }]));
}
