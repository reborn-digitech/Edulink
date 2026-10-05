import "server-only";
import { TALK_ROSTER_MAX, type TalkAnswer, type TalkAttendanceSave, type TalkDetail, type TalkList, type TalkSave, type TalkUpdate, type TalkView } from "@edulink/contracts";
import { db } from "./db";
import { audit } from "./audit";
import { notify } from "./notify";
import { AccessError } from "./access-error";
import { RuleRefusal } from "./rule-refusal";
import { cellOf, rollOf, studentOf } from "./placement";
import type { ActiveContext } from "./session";

/**
 * PRE-PLACEMENT TALKS (the risks batch, R-2, 5 October 2026; module
 * PLACEMENT). A company's talk to the college's students before its drive.
 *
 * WHO. The TPO sets, moves and cancels a talk and marks who came; the office
 * and the principal read the cell's list and a talk's roster. A student of
 * the college answers GOING or NOT_GOING while the talk is ahead and
 * scheduled (GOING stops at the talk's seats), and reads their own answer and
 * mark. A talk belongs to at most one drive (`driveId` is unique), a drive
 * of this college's own that is not closed; the drive's page links to it.
 *
 * ATTENDANCE opens when the talk starts (the instant, so no zone is needed)
 * and is the TPO's: a mark for anyone on the roll, answered or a walk-in;
 * the first mark sets `heldAt`, after which the talk can be neither moved nor
 * cancelled. The counts are read from the rows each time and stored nowhere.
 */

type Tx = typeof db;
const TALK_INCLUDE = { drive: { select: { title: true } }, rsvps: { select: { studentMembershipId: true, answer: true, attendance: true } } } as const;
type TalkRow = NonNullable<Awaited<ReturnType<typeof loadTalk>>>;

async function loadTalk(schoolId: string, talkId: string) {
  return db.placementTalk.findFirst({ where: { id: talkId, schoolId }, include: TALK_INCLUDE });
}

function view(t: TalkRow, now: Date, me: string | null): TalkView {
  const count = (pick: (r: TalkRow["rsvps"][number]) => boolean) => t.rsvps.filter(pick).length;
  const going = count((r) => r.answer === "GOING");
  const mine = me ? t.rsvps.find((r) => r.studentMembershipId === me) : undefined;
  const started = t.startsAt.getTime() <= now.getTime();
  const seatLeft = t.capacity === null || going < t.capacity || mine?.answer === "GOING";
  return {
    id: t.id,
    title: t.title,
    companyName: t.companyName,
    driveId: t.driveId,
    driveTitle: t.drive?.title ?? null,
    startsAt: t.startsAt.toISOString(),
    durationMinutes: t.durationMinutes,
    venue: t.venue,
    note: t.note,
    capacity: t.capacity,
    status: t.status as TalkView["status"],
    heldAt: t.heldAt?.toISOString() ?? null,
    started,
    counts: { going, notGoing: count((r) => r.answer === "NOT_GOING"), present: count((r) => r.attendance === "PRESENT"), absent: count((r) => r.attendance === "ABSENT") },
    mine: me ? { answer: (mine?.answer as TalkAnswer | null | undefined) ?? null, attendance: (mine?.attendance as "PRESENT" | "ABSENT" | null | undefined) ?? null } : null,
    canAnswer: Boolean(me) && t.status === "SCHEDULED" && !started && seatLeft,
  };
}

/** The cell's talks, the latest first. */
export async function listTalks(ctx: ActiveContext, now = new Date()): Promise<TalkList> {
  const cell = await cellOf(ctx, "read");
  const rows = await db.placementTalk.findMany({ where: { schoolId: cell.schoolId }, include: TALK_INCLUDE, orderBy: { startsAt: "desc" }, take: 200 });
  return { talks: rows.map((t) => view(t, now, null)), canEdit: cell.canEdit };
}

/** A student's talks: the ones ahead first, then the last ones held; a cancelled one stays to say so. */
export async function studentTalks(ctx: ActiveContext, now = new Date()): Promise<TalkList> {
  const me = await studentOf(ctx);
  const since = new Date(now.getTime() - 90 * 86_400_000);
  const rows = await db.placementTalk.findMany({ where: { schoolId: me.schoolId, startsAt: { gte: since } }, include: TALK_INCLUDE, orderBy: { startsAt: "asc" }, take: 100 });
  const views = rows.map((t) => view(t, now, me.membershipId));
  return { talks: [...views.filter((v) => !v.started), ...views.filter((v) => v.started).reverse()], canEdit: false };
}

/** The talk of a drive, for the drive's page: the cell's readers, or a student of the drive's college. */
export async function talkForDrive(ctx: ActiveContext, driveId: string, now = new Date()): Promise<TalkView | null> {
  const schoolId = ctx.role === "STUDENT" ? (await studentOf(ctx)).schoolId : (await cellOf(ctx, "read")).schoolId;
  const t = await db.placementTalk.findFirst({ where: { driveId, schoolId }, include: TALK_INCLUDE });
  return t ? view(t, now, ctx.role === "STUDENT" ? ctx.membershipId : null) : null;
}

async function checkDrive(schoolId: string, driveId: string, talkId: string | null): Promise<void> {
  const drive = await db.drive.findFirst({ where: { id: driveId, schoolId }, select: { status: true, talk: { select: { id: true } } } });
  if (!drive) throw new RuleRefusal("talks.refuseDrive", 422, undefined, "driveId");
  if (drive.status === "CLOSED") throw new RuleRefusal("talks.refuseDriveClosed", 409, undefined, "driveId");
  if (drive.talk && drive.talk.id !== talkId) throw new RuleRefusal("talks.refuseDriveHasTalk", 409, undefined, "driveId");
}

/** The TPO sets a talk, ahead of now. Audited. */
export async function createTalk(ctx: ActiveContext, input: TalkSave, now = new Date()): Promise<TalkDetail> {
  const cell = await cellOf(ctx);
  const startsAt = new Date(input.startsAt);
  if (startsAt.getTime() <= now.getTime()) throw new RuleRefusal("talks.refusePast", 422, undefined, "startsAt");
  if (input.driveId) await checkDrive(cell.schoolId, input.driveId, null);
  const t = await db.placementTalk.create({
    data: {
      schoolId: cell.schoolId,
      driveId: input.driveId ?? null,
      companyName: input.companyName,
      title: input.title,
      startsAt,
      durationMinutes: input.durationMinutes,
      venue: input.venue,
      note: input.note,
      capacity: input.capacity ?? null,
      createdByUserId: cell.userId,
    },
    select: { id: true },
  });
  await audit({ schoolId: cell.schoolId, actorUserId: cell.userId, action: "placement.talk.create", targetType: "PlacementTalk", targetId: t.id, meta: { driveId: input.driveId ?? null, startsAt: input.startsAt } });
  return talkDetail(ctx, t.id, now);
}

/**
 * The TPO moves, edits or cancels a talk. A held talk (attendance marked)
 * changes no more; a cancelled one may be scheduled again while it is ahead.
 * Cancelling tells the students who answered GOING. Audited.
 */
export async function updateTalk(ctx: ActiveContext, talkId: string, input: TalkUpdate, now = new Date()): Promise<TalkDetail> {
  const cell = await cellOf(ctx);
  const t = await loadTalk(cell.schoolId, talkId);
  if (!t) throw new AccessError("access.entryNotFound", "NOT_FOUND");
  if (t.heldAt) throw new RuleRefusal("talks.refuseHeld", 409);
  const startsAt = input.startsAt ? new Date(input.startsAt) : t.startsAt;
  if (input.startsAt && startsAt.getTime() <= now.getTime()) throw new RuleRefusal("talks.refusePast", 422, undefined, "startsAt");
  if (input.status === "SCHEDULED" && t.status === "CANCELLED" && startsAt.getTime() <= now.getTime()) throw new RuleRefusal("talks.refusePast", 422, undefined, "startsAt");
  if (input.driveId) await checkDrive(cell.schoolId, input.driveId, t.id);
  const going = t.rsvps.filter((r) => r.answer === "GOING").length;
  if (input.capacity != null && input.capacity < going) throw new RuleRefusal("talks.refuseCapacityBelowGoing", 422, { going }, "capacity");
  await db.placementTalk.update({
    where: { id: t.id },
    data: {
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.companyName !== undefined ? { companyName: input.companyName } : {}),
      ...(input.driveId !== undefined ? { driveId: input.driveId } : {}),
      ...(input.startsAt !== undefined ? { startsAt } : {}),
      ...(input.durationMinutes !== undefined ? { durationMinutes: input.durationMinutes } : {}),
      ...(input.venue !== undefined ? { venue: input.venue } : {}),
      ...(input.note !== undefined ? { note: input.note } : {}),
      ...(input.capacity !== undefined ? { capacity: input.capacity } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
    },
  });
  const cancelled = input.status === "CANCELLED" && t.status !== "CANCELLED";
  await audit({ schoolId: cell.schoolId, actorUserId: cell.userId, action: cancelled ? "placement.talk.cancel" : "placement.talk.update", targetType: "PlacementTalk", targetId: t.id, meta: { fields: Object.keys(input) } });
  if (cancelled) {
    const ids = t.rsvps.filter((r) => r.answer === "GOING").map((r) => r.studentMembershipId);
    const people = ids.length ? await db.membership.findMany({ where: { id: { in: ids }, schoolId: cell.schoolId }, select: { userId: true } }) : [];
    await Promise.all(people.map((p) => notify({ userId: p.userId, schoolId: cell.schoolId, kind: "SYSTEM", titleKey: "talks.notifCancelled", titleVars: { title: t.title, company: t.companyName }, url: "/student/placement/talks" }).catch((error) => console.error("[talks] cancel notice failed", error))));
  }
  return talkDetail(ctx, t.id, now);
}

/** A talk with its roster: every student on the roll, those who answered first (GOING, then NOT_GOING), up to TALK_ROSTER_MAX. */
export async function talkDetail(ctx: ActiveContext, talkId: string, now = new Date()): Promise<TalkDetail> {
  const cell = await cellOf(ctx, "read");
  const t = await loadTalk(cell.schoolId, talkId);
  if (!t) throw new AccessError("access.entryNotFound", "NOT_FOUND");
  const roll = await rollOf(cell.schoolId);
  const byId = new Map(t.rsvps.map((r) => [r.studentMembershipId, r]));
  const rank = (id: string) => (byId.get(id)?.answer === "GOING" ? 0 : byId.get(id)?.answer === "NOT_GOING" ? 1 : byId.get(id)?.attendance ? 2 : 3);
  const sorted = [...roll].sort((a, b) => rank(a.id) - rank(b.id));
  const shown = sorted.slice(0, TALK_ROSTER_MAX);
  const prns = await db.studentProgramme.findMany({ where: { schoolId: cell.schoolId, studentMembershipId: { in: shown.map((s) => s.id) } }, select: { studentMembershipId: true, prn: true } });
  const prnOf = new Map(prns.map((p) => [p.studentMembershipId, p.prn]));
  const v = view(t, now, null);
  return {
    ...v,
    roster: shown.map((s) => ({ studentMembershipId: s.id, name: s.name, prn: prnOf.get(s.id) ?? null, answer: (byId.get(s.id)?.answer as TalkAnswer | null | undefined) ?? null, attendance: (byId.get(s.id)?.attendance as "PRESENT" | "ABSENT" | null | undefined) ?? null })),
    truncated: sorted.length > shown.length,
    canEdit: cell.canEdit && !t.heldAt,
    canMark: cell.canEdit && v.started && t.status === "SCHEDULED",
  };
}

/**
 * A student answers. Idempotent (the same answer again changes nothing);
 * refused once the talk has started or is cancelled, and GOING refused when
 * the seats are taken (a student already going keeps the seat).
 */
export async function answerTalk(ctx: ActiveContext, talkId: string, answer: TalkAnswer, now = new Date()): Promise<TalkView> {
  const me = await studentOf(ctx);
  const updated = await db.$tenantTransaction(async (raw) => {
    const tx = raw as Tx;
    // The talk's row is locked so two last-seat answers cannot both be GOING.
    await tx.$queryRaw`SELECT "id" FROM "PlacementTalk" WHERE "id" = ${talkId} AND "schoolId" = ${me.schoolId} FOR UPDATE`;
    const t = await tx.placementTalk.findFirst({ where: { id: talkId, schoolId: me.schoolId }, include: TALK_INCLUDE });
    if (!t) throw new AccessError("access.entryNotFound", "NOT_FOUND");
    if (t.status !== "SCHEDULED") throw new RuleRefusal("talks.refuseCancelled", 409);
    if (t.startsAt.getTime() <= now.getTime()) throw new RuleRefusal("talks.refuseStarted", 409);
    const mine = t.rsvps.find((r) => r.studentMembershipId === me.membershipId);
    if (mine?.answer === answer) return t;
    if (answer === "GOING" && t.capacity !== null && t.rsvps.filter((r) => r.answer === "GOING").length >= t.capacity) throw new RuleRefusal("talks.refuseFull", 409);
    await tx.placementTalkRsvp.upsert({
      where: { talkId_studentMembershipId: { talkId, studentMembershipId: me.membershipId } },
      create: { schoolId: me.schoolId, talkId, studentMembershipId: me.membershipId, answer, answeredAt: now },
      update: { answer, answeredAt: now },
    });
    return tx.placementTalk.findFirstOrThrow({ where: { id: talkId }, include: TALK_INCLUDE });
  });
  return view(updated, now, me.membershipId);
}

/**
 * The TPO marks who came: PRESENT or ABSENT for students on the roll (a
 * walk-in with no answer too). Only once the talk has started and while it is
 * scheduled; the first mark sets `heldAt`. A re-mark replaces the mark.
 * Refused whole if any mark names someone not on the college's roll. Audited.
 */
export async function markTalkAttendance(ctx: ActiveContext, talkId: string, input: TalkAttendanceSave, now = new Date()): Promise<{ saved: number; talk: TalkDetail }> {
  const cell = await cellOf(ctx);
  const t = await loadTalk(cell.schoolId, talkId);
  if (!t) throw new AccessError("access.entryNotFound", "NOT_FOUND");
  if (t.status !== "SCHEDULED") throw new RuleRefusal("talks.refuseCancelled", 409);
  if (t.startsAt.getTime() > now.getTime()) throw new RuleRefusal("talks.refuseNotStarted", 409);
  const ids = [...new Set(input.marks.map((m) => m.studentMembershipId))];
  const onRoll = await db.membership.count({ where: { id: { in: ids }, schoolId: cell.schoolId, role: "STUDENT", status: "ACTIVE", leftAt: null } });
  if (onRoll !== ids.length) throw new RuleRefusal("talks.refuseNotOnRoll", 422, undefined, "marks");
  const last = new Map(input.marks.map((m) => [m.studentMembershipId, m.attendance]));
  await db.$tenantTransaction(async (raw) => {
    const tx = raw as Tx;
    for (const [studentMembershipId, attendance] of last) {
      await tx.placementTalkRsvp.upsert({
        where: { talkId_studentMembershipId: { talkId, studentMembershipId } },
        create: { schoolId: cell.schoolId, talkId, studentMembershipId, attendance, markedByUserId: cell.userId, markedAt: now },
        update: { attendance, markedByUserId: cell.userId, markedAt: now },
      });
    }
    if (!t.heldAt) await tx.placementTalk.update({ where: { id: talkId }, data: { heldAt: now } });
  });
  const present = [...last.values()].filter((a) => a === "PRESENT").length;
  await audit({ schoolId: cell.schoolId, actorUserId: cell.userId, action: "placement.talk.attendance", targetType: "PlacementTalk", targetId: talkId, meta: { marked: last.size, present } });
  return { saved: last.size, talk: await talkDetail(ctx, talkId, now) };
}
