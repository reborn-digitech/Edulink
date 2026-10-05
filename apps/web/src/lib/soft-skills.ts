import "server-only";
import {
  softSkillsCompleted,
  type SoftSkill,
  type StudentTrainings,
  type TrainingAttendanceSave,
  type TrainingDetail,
  type TrainingList,
  type TrainingSave,
  type TrainingSessionSave,
  type TrainingSummary,
  type TrainingUpdate,
} from "@edulink/contracts";
import { db } from "./db";
import { audit } from "./audit";
import { AccessError } from "./access-error";
import { RuleRefusal } from "./rule-refusal";
import { cellOf, rollOf, studentOf } from "./placement";
import { softSkillsCompletions } from "./soft-skills-count";
import type { ActiveContext } from "./session";

/**
 * SOFT-SKILLS TRAINING (the risks batch, R-2, 5 October 2026; module
 * PLACEMENT). The TPO's courses in communication, aptitude, group
 * discussion, interviews and the like, each with its sessions.
 *
 * WHO. The TPO makes a training and its sessions, puts students on its roll
 * or takes them off, closes enrolment, cancels a session that has no marks,
 * and marks each session once it has started; the office and the principal
 * read. A student enrols themselves while the training is OPEN and a seat is
 * left, withdraws, and reads their own attendance.
 *
 * COMPLETION is computed on read (`softSkillsCompleted`): present at the
 * training's share of the sessions not cancelled. The cell's figure is the
 * number of students with at least one completion; the student's placement
 * profile lists theirs (soft-skills-count.ts).
 */

type Tx = typeof db;
const TRAINING_INCLUDE = {
  sessions: { select: { id: true, startsAt: true, durationMinutes: true, topic: true, venue: true, cancelledAt: true, heldAt: true, attendance: { select: { studentMembershipId: true, present: true } } }, orderBy: { startsAt: "asc" as const } },
  enrolments: { select: { studentMembershipId: true, withdrawnAt: true } },
} as const;
type TrainingRow = NonNullable<Awaited<ReturnType<typeof loadTraining>>>;

async function loadTraining(schoolId: string, trainingId: string) {
  return db.softSkillsTraining.findFirst({ where: { id: trainingId, schoolId }, include: TRAINING_INCLUDE });
}

function attendedBy(t: TrainingRow, studentId: string): number {
  return t.sessions.filter((s) => !s.cancelledAt && s.attendance.some((a) => a.studentMembershipId === studentId && a.present)).length;
}

function summary(t: TrainingRow, now: Date, me: string | null): TrainingSummary {
  const live = t.sessions.filter((s) => !s.cancelledAt);
  const enrolledIds = t.enrolments.filter((e) => !e.withdrawnAt).map((e) => e.studentMembershipId);
  const marked = new Set(live.flatMap((s) => s.attendance.map((a) => a.studentMembershipId)));
  const everyone = new Set([...enrolledIds, ...marked]);
  const completed = [...everyone].filter((id) => softSkillsCompleted(attendedBy(t, id), live.length, t.minAttendancePercent)).length;
  const next = live.find((s) => s.startsAt.getTime() > now.getTime());
  const mineEnrolled = me ? enrolledIds.includes(me) : false;
  const mineAttended = me ? attendedBy(t, me) : 0;
  const seatLeft = t.capacity === null || enrolledIds.length < t.capacity;
  return {
    id: t.id,
    title: t.title,
    skill: t.skill as SoftSkill,
    trainer: t.trainer,
    status: t.status as TrainingSummary["status"],
    capacity: t.capacity,
    minAttendancePercent: t.minAttendancePercent,
    sessions: live.length,
    held: live.filter((s) => s.heldAt).length,
    enrolled: enrolledIds.length,
    completed,
    nextSessionAt: next?.startsAt.toISOString() ?? null,
    mine: me ? { enrolled: mineEnrolled, attended: mineAttended, completed: softSkillsCompleted(mineAttended, live.length, t.minAttendancePercent) } : null,
    canEnrol: Boolean(me) && t.status === "OPEN" && !mineEnrolled && seatLeft,
  };
}

/** The cell's trainings, the open ones first, and how many students have completed one. */
export async function listTrainings(ctx: ActiveContext, now = new Date()): Promise<TrainingList> {
  const cell = await cellOf(ctx, "read");
  const rows = await db.softSkillsTraining.findMany({ where: { schoolId: cell.schoolId }, include: TRAINING_INCLUDE, orderBy: [{ status: "desc" }, { createdAt: "desc" }], take: 200 });
  const roll = await rollOf(cell.schoolId);
  const completions = await softSkillsCompletions(cell.schoolId, roll.map((r) => r.id));
  return { trainings: rows.map((t) => summary(t, now, null)), studentsCompleted: completions.size, canEdit: cell.canEdit };
}

/** A student's view: the open trainings and every one they are or were on, with their completions. */
export async function studentTrainings(ctx: ActiveContext, now = new Date()): Promise<StudentTrainings> {
  const me = await studentOf(ctx);
  const rows = await db.softSkillsTraining.findMany({
    where: { schoolId: me.schoolId, OR: [{ status: "OPEN" }, { enrolments: { some: { studentMembershipId: me.membershipId } } }] },
    include: TRAINING_INCLUDE,
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  const done = (await softSkillsCompletions(me.schoolId, [me.membershipId])).get(me.membershipId) ?? [];
  return { trainings: rows.map((t) => summary(t, now, me.membershipId)), completed: done.map((c) => ({ ...c, skill: c.skill as SoftSkill })) };
}

/** One training with its sessions and its roll (the enrolled, and anyone marked once). */
export async function trainingDetail(ctx: ActiveContext, trainingId: string, now = new Date()): Promise<TrainingDetail> {
  const cell = await cellOf(ctx, "read");
  const t = await loadTraining(cell.schoolId, trainingId);
  if (!t) throw new AccessError("access.entryNotFound", "NOT_FOUND");
  const live = t.sessions.filter((s) => !s.cancelledAt);
  const ids = [...new Set([...t.enrolments.filter((e) => !e.withdrawnAt).map((e) => e.studentMembershipId), ...live.flatMap((s) => s.attendance.map((a) => a.studentMembershipId))])];
  const people = ids.length ? await db.membership.findMany({ where: { id: { in: ids }, schoolId: cell.schoolId }, select: { id: true, user: { select: { name: true, preferredName: true } } } }) : [];
  const prns = ids.length ? await db.studentProgramme.findMany({ where: { schoolId: cell.schoolId, studentMembershipId: { in: ids } }, select: { studentMembershipId: true, prn: true } }) : [];
  const prnOf = new Map(prns.map((p) => [p.studentMembershipId, p.prn]));
  const roster = people
    .map((p) => {
      const attended = attendedBy(t, p.id);
      const marks: Record<string, boolean> = {};
      for (const s of live) {
        const m = s.attendance.find((a) => a.studentMembershipId === p.id);
        if (m) marks[s.id] = m.present;
      }
      return { studentMembershipId: p.id, name: p.user.preferredName ?? p.user.name, prn: prnOf.get(p.id) ?? null, attended, completed: softSkillsCompleted(attended, live.length, t.minAttendancePercent), marks };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
  return {
    ...summary(t, now, null),
    description: t.description,
    sessionList: t.sessions.map((s) => ({ id: s.id, startsAt: s.startsAt.toISOString(), durationMinutes: s.durationMinutes, topic: s.topic, venue: s.venue, cancelled: Boolean(s.cancelledAt), held: Boolean(s.heldAt), present: s.attendance.filter((a) => a.present).length })),
    roster,
    canEdit: cell.canEdit,
  };
}

/** The TPO makes a training. Audited. */
export async function createTraining(ctx: ActiveContext, input: TrainingSave, now = new Date()): Promise<TrainingDetail> {
  const cell = await cellOf(ctx);
  const t = await db.softSkillsTraining.create({
    data: { schoolId: cell.schoolId, title: input.title, skill: input.skill, trainer: input.trainer, description: input.description, capacity: input.capacity ?? null, minAttendancePercent: input.minAttendancePercent, createdByUserId: cell.userId },
    select: { id: true },
  });
  await audit({ schoolId: cell.schoolId, actorUserId: cell.userId, action: "placement.training.create", targetType: "SoftSkillsTraining", targetId: t.id, meta: { skill: input.skill } });
  return trainingDetail(ctx, t.id, now);
}

/** The TPO edits a training or closes its enrolment; seats never below the students on it. Audited. */
export async function updateTraining(ctx: ActiveContext, trainingId: string, input: TrainingUpdate, now = new Date()): Promise<TrainingDetail> {
  const cell = await cellOf(ctx);
  const t = await loadTraining(cell.schoolId, trainingId);
  if (!t) throw new AccessError("access.entryNotFound", "NOT_FOUND");
  const enrolled = t.enrolments.filter((e) => !e.withdrawnAt).length;
  if (input.capacity != null && input.capacity < enrolled) throw new RuleRefusal("softSkills.refuseCapacityBelowEnrolled", 422, { enrolled }, "capacity");
  await db.softSkillsTraining.update({
    where: { id: t.id },
    data: {
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.skill !== undefined ? { skill: input.skill } : {}),
      ...(input.trainer !== undefined ? { trainer: input.trainer } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.capacity !== undefined ? { capacity: input.capacity } : {}),
      ...(input.minAttendancePercent !== undefined ? { minAttendancePercent: input.minAttendancePercent } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
    },
  });
  await audit({ schoolId: cell.schoolId, actorUserId: cell.userId, action: "placement.training.update", targetType: "SoftSkillsTraining", targetId: t.id, meta: { fields: Object.keys(input) } });
  return trainingDetail(ctx, t.id, now);
}

/** The TPO adds a session. Audited. */
export async function addTrainingSession(ctx: ActiveContext, trainingId: string, input: TrainingSessionSave, now = new Date()): Promise<TrainingDetail> {
  const cell = await cellOf(ctx);
  const t = await db.softSkillsTraining.findFirst({ where: { id: trainingId, schoolId: cell.schoolId }, select: { id: true } });
  if (!t) throw new AccessError("access.entryNotFound", "NOT_FOUND");
  const s = await db.softSkillsSession.create({ data: { schoolId: cell.schoolId, trainingId, startsAt: new Date(input.startsAt), durationMinutes: input.durationMinutes, topic: input.topic, venue: input.venue }, select: { id: true } });
  await audit({ schoolId: cell.schoolId, actorUserId: cell.userId, action: "placement.training.session", targetType: "SoftSkillsSession", targetId: s.id, meta: { trainingId, startsAt: input.startsAt } });
  return trainingDetail(ctx, trainingId, now);
}

/** The TPO cancels a session, or brings it back; a session with marks is not cancelled (its marks count). Audited. */
export async function setSessionCancelled(ctx: ActiveContext, trainingId: string, sessionId: string, cancelled: boolean, now = new Date()): Promise<TrainingDetail> {
  const cell = await cellOf(ctx);
  const s = await db.softSkillsSession.findFirst({ where: { id: sessionId, trainingId, schoolId: cell.schoolId }, select: { id: true, cancelledAt: true, _count: { select: { attendance: true } } } });
  if (!s) throw new AccessError("access.entryNotFound", "NOT_FOUND");
  if (cancelled && s._count.attendance > 0) throw new RuleRefusal("softSkills.refuseMarkedSession", 409);
  if (Boolean(s.cancelledAt) !== cancelled) {
    await db.softSkillsSession.update({ where: { id: s.id }, data: { cancelledAt: cancelled ? now : null } });
    await audit({ schoolId: cell.schoolId, actorUserId: cell.userId, action: cancelled ? "placement.training.sessionCancel" : "placement.training.sessionRestore", targetType: "SoftSkillsSession", targetId: s.id, meta: { trainingId } });
  }
  return trainingDetail(ctx, trainingId, now);
}

async function assertOnRoll(schoolId: string, ids: string[]): Promise<void> {
  const onRoll = await db.membership.count({ where: { id: { in: ids }, schoolId, role: "STUDENT", status: "ACTIVE", leftAt: null } });
  if (onRoll !== ids.length) throw new RuleRefusal("softSkills.refuseNotOnRoll", 422, undefined, "studentMembershipIds");
}

/** The TPO puts students on the roll (within the seats, whatever the status) or takes them off. Idempotent; audited. */
export async function setEnrolment(ctx: ActiveContext, trainingId: string, input: { studentMembershipIds: string[]; remove: boolean }, now = new Date()): Promise<TrainingDetail> {
  const cell = await cellOf(ctx);
  const ids = [...new Set(input.studentMembershipIds)];
  // Taking someone off needs no roll check (a student who has left may still be on it).
  if (!input.remove) await assertOnRoll(cell.schoolId, ids);
  let changed = 0;
  await db.$tenantTransaction(async (raw) => {
    const tx = raw as Tx;
    await tx.$queryRaw`SELECT "id" FROM "SoftSkillsTraining" WHERE "id" = ${trainingId} AND "schoolId" = ${cell.schoolId} FOR UPDATE`;
    const t = await tx.softSkillsTraining.findFirst({ where: { id: trainingId, schoolId: cell.schoolId }, select: { capacity: true, enrolments: { select: { studentMembershipId: true, withdrawnAt: true } } } });
    if (!t) throw new AccessError("access.entryNotFound", "NOT_FOUND");
    const on = new Set(t.enrolments.filter((e) => !e.withdrawnAt).map((e) => e.studentMembershipId));
    if (input.remove) {
      const off = ids.filter((id) => on.has(id));
      if (off.length) await tx.softSkillsEnrolment.updateMany({ where: { trainingId, studentMembershipId: { in: off } }, data: { withdrawnAt: now } });
      changed = off.length;
      return;
    }
    const add = ids.filter((id) => !on.has(id));
    if (t.capacity !== null && on.size + add.length > t.capacity) throw new RuleRefusal("softSkills.refuseFull", 409, { seats: Math.max(0, t.capacity - on.size) });
    for (const studentMembershipId of add) {
      await tx.softSkillsEnrolment.upsert({
        where: { trainingId_studentMembershipId: { trainingId, studentMembershipId } },
        create: { schoolId: cell.schoolId, trainingId, studentMembershipId, byUserId: cell.userId },
        update: { withdrawnAt: null, enrolledAt: now, byUserId: cell.userId },
      });
    }
    changed = add.length;
  });
  if (changed) await audit({ schoolId: cell.schoolId, actorUserId: cell.userId, action: input.remove ? "placement.training.unenrol" : "placement.training.enrol", targetType: "SoftSkillsTraining", targetId: trainingId, meta: { count: changed } });
  return trainingDetail(ctx, trainingId, now);
}

/** A student enrols themselves (OPEN, a seat left) or withdraws. Idempotent. */
export async function enrolSelf(ctx: ActiveContext, trainingId: string, enrol: boolean, now = new Date()): Promise<TrainingSummary> {
  const me = await studentOf(ctx);
  await db.$tenantTransaction(async (raw) => {
    const tx = raw as Tx;
    await tx.$queryRaw`SELECT "id" FROM "SoftSkillsTraining" WHERE "id" = ${trainingId} AND "schoolId" = ${me.schoolId} FOR UPDATE`;
    const t = await tx.softSkillsTraining.findFirst({ where: { id: trainingId, schoolId: me.schoolId }, select: { status: true, capacity: true, enrolments: { select: { studentMembershipId: true, withdrawnAt: true } } } });
    if (!t) throw new AccessError("access.entryNotFound", "NOT_FOUND");
    const on = t.enrolments.filter((e) => !e.withdrawnAt);
    const mine = on.some((e) => e.studentMembershipId === me.membershipId);
    if (enrol) {
      if (mine) return;
      if (t.status !== "OPEN") throw new RuleRefusal("softSkills.refuseClosed", 409);
      if (t.capacity !== null && on.length >= t.capacity) throw new RuleRefusal("softSkills.refuseFull", 409, { seats: 0 });
      await tx.softSkillsEnrolment.upsert({
        where: { trainingId_studentMembershipId: { trainingId, studentMembershipId: me.membershipId } },
        create: { schoolId: me.schoolId, trainingId, studentMembershipId: me.membershipId, byUserId: me.userId },
        update: { withdrawnAt: null, enrolledAt: now, byUserId: me.userId },
      });
    } else if (mine) {
      await tx.softSkillsEnrolment.updateMany({ where: { trainingId, studentMembershipId: me.membershipId }, data: { withdrawnAt: now } });
    }
  });
  const t = await loadTraining(me.schoolId, trainingId);
  return summary(t!, now, me.membershipId);
}

/**
 * The TPO marks a session: present or absent for students on the training's
 * roll. Only once the session has started and while it is not cancelled; the
 * first mark sets `heldAt`; a re-mark replaces. Refused whole if a mark names
 * someone not enrolled. Audited.
 */
export async function markTrainingSession(ctx: ActiveContext, trainingId: string, sessionId: string, input: TrainingAttendanceSave, now = new Date()): Promise<{ saved: number; training: TrainingDetail }> {
  const cell = await cellOf(ctx);
  const s = await db.softSkillsSession.findFirst({ where: { id: sessionId, trainingId, schoolId: cell.schoolId }, select: { id: true, startsAt: true, cancelledAt: true, heldAt: true, training: { select: { enrolments: { where: { withdrawnAt: null }, select: { studentMembershipId: true } } } } } });
  if (!s) throw new AccessError("access.entryNotFound", "NOT_FOUND");
  if (s.cancelledAt) throw new RuleRefusal("softSkills.refuseCancelledSession", 409);
  if (s.startsAt.getTime() > now.getTime()) throw new RuleRefusal("softSkills.refuseNotStarted", 409);
  const enrolled = new Set(s.training.enrolments.map((e) => e.studentMembershipId));
  const last = new Map(input.marks.map((m) => [m.studentMembershipId, m.present]));
  if ([...last.keys()].some((id) => !enrolled.has(id))) throw new RuleRefusal("softSkills.refuseNotEnrolled", 422, undefined, "marks");
  await db.$tenantTransaction(async (raw) => {
    const tx = raw as Tx;
    for (const [studentMembershipId, present] of last) {
      await tx.softSkillsAttendance.upsert({
        where: { sessionId_studentMembershipId: { sessionId, studentMembershipId } },
        create: { schoolId: cell.schoolId, sessionId, studentMembershipId, present, markedByUserId: cell.userId, markedAt: now },
        update: { present, markedByUserId: cell.userId, markedAt: now },
      });
    }
    if (!s.heldAt) await tx.softSkillsSession.update({ where: { id: sessionId }, data: { heldAt: now } });
  });
  await audit({ schoolId: cell.schoolId, actorUserId: cell.userId, action: "placement.training.attendance", targetType: "SoftSkillsSession", targetId: sessionId, meta: { trainingId, marked: last.size, present: [...last.values()].filter(Boolean).length } });
  return { saved: last.size, training: await trainingDetail(ctx, trainingId, now) };
}
