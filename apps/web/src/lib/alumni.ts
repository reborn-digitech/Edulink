import "server-only";
import {
  ALUMNI_FEED_MODES,
  DEFAULT_ALUMNI_FEED_MODE,
  type AlumniContactPref,
  type AlumniDirectoryJoin,
  type AlumniFeedMode,
} from "@edulink/contracts";
import { db } from "./db";
import { audit } from "./audit";
import { notify } from "./notify";
import { consume } from "./rate-limit";
import { AccessError, ModuleOffError } from "./access-error";
import { assertModuleOn, isModuleOn } from "./modules";
import { readJson, readJsonArray, writeJson } from "./json";
import { CONTACTABLE_ROLES, type Role } from "./constants";
import { batchYearOf } from "./alumni-tags";
import type { ActiveContext } from "./session";

/**
 * THE ALUMNI MODULE (the owner's decision of 3 October 2026): a pupil who
 * leaves a school keeps a connection to it. The connection itself is the
 * ALUMNUS membership a departure opens (alumni-membership.ts); this file is
 * what the module hangs on it.
 *
 *   - MESSAGES. An alumnus writes to the school's staff (CONTACTABLE_ROLES:
 *     the office, the head, the teachers) through the ordinary conversation
 *     rooms (conversations.ts), their former teachers — the teachers of any
 *     class they were in, from the register's history — listed first. Staff
 *     may close a room (the alumnus can read but not write until staff write
 *     or reopen it), and the office may mute an alumnus, who is told. New
 *     rooms and messages are rate-limited.
 *   - THE FEED. What alumni may do is the admin's choice (READ, COMMENT —
 *     the default — or POST), kept in the ALUMNI module's settings; what an
 *     alumnus writes carries the "Alumni · year" tag (alumni-tags.ts). An
 *     alumnus's post is always held for the office; a minor's comment is
 *     held as a pupil's is.
 *   - THE DIRECTORY is consent: nothing about an alumnus is shown until they
 *     join it, a minor cannot, and leaving clears what they wrote.
 *   - THE OFFICE sees its alumni by batch (the year they left), writes to a
 *     batch, mutes, and marks mentors.
 *
 * The batch and the last class are read, never stored: the ALUMNUS row's
 * joinedAt is the leaving date, and the leaving record (SchoolRecord) names
 * the class.
 *
 * Every function asserts the ALUMNI module is on at the school; the catalog's
 * `module: "ALUMNI"` says the same at the door. Switching the module off
 * hides all of this and deletes none of it.
 */

const STAFF: readonly Role[] = CONTACTABLE_ROLES;
const isStaff = (role: Role | null | undefined) => role !== null && role !== undefined && STAFF.includes(role);

/** New rooms an alumnus may open in a day, and messages they may send in an hour. */
export const ALUMNI_ROOMS_PER_DAY = 10;
export const ALUMNI_MESSAGES_PER_HOUR = 30;
const NOTES_PER_DAY = 10;
const DAY = 24 * 60 * 60 * 1000;
const HOUR = 60 * 60 * 1000;

/* -------------------------------------------------------------------------- */
/* The module's settings                                                       */
/* -------------------------------------------------------------------------- */

type AlumniSettings = { feedMode?: AlumniFeedMode };

/** What the school's alumni may do on its feed; COMMENT until the admin says otherwise. */
export async function alumniFeedMode(schoolId: string): Promise<AlumniFeedMode> {
  const row = await db.schoolModule.findUnique({ where: { schoolId_module: { schoolId, module: "ALUMNI" } }, select: { settingsJson: true } });
  const mode = readJson<AlumniSettings>(row?.settingsJson, {}).feedMode;
  return mode && (ALUMNI_FEED_MODES as readonly string[]).includes(mode) ? mode : DEFAULT_ALUMNI_FEED_MODE;
}

/** The admin's choice. Idempotent; a change is an audit row. */
export async function setAlumniFeedMode(ctx: ActiveContext, feedMode: AlumniFeedMode): Promise<{ feedMode: AlumniFeedMode; changed: boolean }> {
  const schoolId = await requireOffice(ctx, true);
  if (!(ALUMNI_FEED_MODES as readonly string[]).includes(feedMode)) throw new AccessError("access.wrongRoleForThisAction");
  const row = await db.schoolModule.findUnique({ where: { schoolId_module: { schoolId, module: "ALUMNI" } }, select: { id: true, settingsJson: true } });
  if (!row) throw new ModuleOffError("ALUMNI");
  const settings = readJson<AlumniSettings>(row.settingsJson, {});
  const was = settings.feedMode ?? DEFAULT_ALUMNI_FEED_MODE;
  if (was === feedMode) return { feedMode, changed: false };
  await db.schoolModule.update({ where: { id: row.id }, data: { settingsJson: writeJson({ ...settings, feedMode }) } });
  await audit({ schoolId, actorUserId: ctx.user.id, action: "alumni.settings", targetType: "School", targetId: schoolId, meta: { feedMode, was } });
  return { feedMode, changed: true };
}

/* -------------------------------------------------------------------------- */
/* Who is asking                                                               */
/* -------------------------------------------------------------------------- */

type AlumnusRow = { id: string; userId: string; schoolId: string; joinedAt: Date };

/** The caller's own live ALUMNUS membership, at a school with the module on. */
async function requireAlumnus(ctx: ActiveContext): Promise<AlumnusRow> {
  if (ctx.role !== "ALUMNUS" || !ctx.schoolId || !ctx.membershipId) throw new AccessError("access.wrongRoleForThisAction");
  await assertModuleOn(ctx.schoolId, "ALUMNI");
  const row = await db.membership.findFirst({
    where: { id: ctx.membershipId, schoolId: ctx.schoolId, userId: ctx.user.id, role: "ALUMNUS", status: "ACTIVE", leftAt: null },
    select: { id: true, userId: true, schoolId: true, joinedAt: true },
  });
  if (!row) throw new AccessError("access.wrongRoleForThisAction");
  return row;
}

/** The office (and, to read, the head) at a school with the module on. */
async function requireOffice(ctx: ActiveContext, write: boolean): Promise<string> {
  const allowed: Role[] = write ? ["ADMIN"] : ["ADMIN", "PRINCIPAL"];
  if (!ctx.schoolId || !ctx.role || !allowed.includes(ctx.role)) throw new AccessError("access.wrongRoleForThisAction");
  await assertModuleOn(ctx.schoolId, "ALUMNI");
  return ctx.schoolId;
}

/** An ALUMNUS membership at the office's school, with the person behind it. */
async function alumnusAt(schoolId: string, membershipId: string) {
  const row = await db.membership.findFirst({
    where: { id: membershipId, schoolId, role: "ALUMNUS", status: "ACTIVE", leftAt: null },
    select: { id: true, userId: true, joinedAt: true, user: { select: { isMinor: true } }, alumniProfile: true },
  });
  if (!row) throw new AccessError("alumni.refuseNotAlumnus", "NOT_FOUND");
  return row;
}

/* -------------------------------------------------------------------------- */
/* The rules other modules ask                                                 */
/* -------------------------------------------------------------------------- */

/** "reach" is the module and the mute alone: finding a room that already exists. */
export type AlumnusAct = "reach" | "open" | "message" | "comment" | "react" | "post";

/**
 * Whether the caller, when they are an ALUMNUS, may do `act` at `schoolId`:
 * the module on, not muted, within the feed's setting and the rate limits.
 * Anyone else passes untouched — the older rules about them stand.
 */
export async function assertAlumnusMay(ctx: ActiveContext, schoolId: string, act: AlumnusAct): Promise<void> {
  if (ctx.role !== "ALUMNUS") return;
  await assertModuleOn(schoolId, "ALUMNI");
  const profile = ctx.membershipId
    ? await db.alumniProfile.findUnique({ where: { membershipId: ctx.membershipId }, select: { mutedAt: true } })
    : null;
  if (profile?.mutedAt) throw new AccessError("alumni.refuseMuted");
  if (act === "comment" || act === "react" || act === "post") {
    const mode = await alumniFeedMode(schoolId);
    if (mode === "READ") throw new AccessError("alumni.refuseFeedRead");
    if (act === "post" && mode !== "POST") throw new AccessError("alumni.refuseFeedPost");
  }
  if (act === "open") {
    const limit = await consume(`alumni-open:${ctx.user.id}:${schoolId}`, ALUMNI_ROOMS_PER_DAY, DAY);
    if (!limit.allowed) throw new AccessError("alumni.refuseTooMany", "FORBIDDEN", { minutes: Math.max(1, Math.ceil(limit.retryAfterSeconds / 60)) });
  }
  if (act === "message") {
    const limit = await consume(`alumni-message:${ctx.user.id}`, ALUMNI_MESSAGES_PER_HOUR, HOUR);
    if (!limit.allowed) throw new AccessError("alumni.refuseTooManyMessages", "FORBIDDEN", { minutes: Math.max(1, Math.ceil(limit.retryAfterSeconds / 60)) });
  }
}

/** Whether a room at `schoolId` has a live alumnus of that school among `userIds`. */
export async function roomHasAlumnus(schoolId: string, userIds: string[]): Promise<boolean> {
  const row = await db.membership.findFirst({
    where: { schoolId, userId: { in: userIds }, role: "ALUMNUS", status: "ACTIVE", leftAt: null },
    select: { id: true },
  });
  return row !== null;
}

/**
 * Staff close a room a former pupil writes in, or open it again. A
 * participant of the room, on the staff of its school, and only a room with
 * an alumnus in it: the others are what they always were. Idempotent.
 */
export async function setConversationClosed(ctx: ActiveContext, conversationId: string, closed: boolean): Promise<{ conversationId: string; closedAt: Date | null; changed: boolean }> {
  if (!isStaff(ctx.role) || !ctx.schoolId || !ctx.membershipId) throw new AccessError("access.wrongRoleForThisAction");
  const conversation = await db.conversation.findUnique({
    where: { id: conversationId },
    select: { id: true, schoolId: true, closedAt: true, participants: { select: { userId: true } } },
  });
  if (!conversation || conversation.schoolId !== ctx.schoolId || !conversation.participants.some((p) => p.userId === ctx.user.id)) {
    throw new AccessError("access.conversationNotFound", "NOT_FOUND");
  }
  await assertModuleOn(conversation.schoolId, "ALUMNI");
  const me = await db.membership.findFirst({ where: { id: ctx.membershipId, schoolId: conversation.schoolId, status: "ACTIVE", leftAt: null }, select: { id: true } });
  if (!me) throw new AccessError("access.conversationNotFound", "NOT_FOUND");
  const others = conversation.participants.map((p) => p.userId).filter((id) => id !== ctx.user.id);
  if (!(await roomHasAlumnus(conversation.schoolId, others))) throw new AccessError("alumni.refuseNotAlumniRoom");
  if ((conversation.closedAt !== null) === closed) return { conversationId, closedAt: conversation.closedAt, changed: false };
  const closedAt = closed ? new Date() : null;
  await db.conversation.update({ where: { id: conversationId }, data: { closedAt, closedByUserId: closed ? ctx.user.id : null } });
  await audit({ schoolId: conversation.schoolId, actorUserId: ctx.user.id, action: closed ? "conversation.close" : "conversation.reopen", targetType: "Conversation", targetId: conversationId });
  return { conversationId, closedAt, changed: true };
}

/* -------------------------------------------------------------------------- */
/* Former teachers and the staff                                               */
/* -------------------------------------------------------------------------- */

/**
 * The membership ids of every teacher of a class `userId` was ever in at
 * `schoolId`: a class's own teachers (ClassTeacher) and whoever its timetable
 * names, over every enrolment the pupil had, the ended ones included.
 */
export async function formerTeacherMembershipIds(userId: string, schoolId: string): Promise<Set<string>> {
  const pupil = await db.membership.findUnique({ where: { userId_schoolId_role: { userId, schoolId, role: "STUDENT" } }, select: { id: true } });
  if (!pupil) return new Set();
  const enrolments = await db.enrollment.findMany({ where: { studentMembershipId: pupil.id, schoolId }, select: { classId: true } });
  const classIds = [...new Set(enrolments.map((e) => e.classId))];
  if (classIds.length === 0) return new Set();
  const [leads, slots] = await Promise.all([
    db.classTeacher.findMany({ where: { schoolId, classId: { in: classIds } }, select: { teacherMembershipId: true } }),
    db.timetableSlot.findMany({ where: { schoolId, classId: { in: classIds }, teacherMembershipId: { not: null } }, select: { teacherMembershipId: true }, distinct: ["teacherMembershipId"] }),
  ]);
  return new Set([...leads.map((l) => l.teacherMembershipId), ...slots.map((s) => s.teacherMembershipId!)]);
}

export type StaffPerson = {
  userId: string;
  membershipId: string;
  name: string;
  avatarKey: string | null;
  role: Role;
  detail: string | null;
  formerTeacher: boolean;
};

/** The staff an alumnus may write to, former teachers first, `q` on the name. */
export async function alumniStaff(ctx: ActiveContext, q = ""): Promise<{ schoolId: string; people: StaffPerson[] }> {
  const me = await requireAlumnus(ctx);
  return { schoolId: me.schoolId, people: await staffFor(me, q) };
}

async function staffFor(me: AlumnusRow, q: string, limit = 80): Promise<StaffPerson[]> {
  const needle = q.trim();
  const former = await formerTeacherMembershipIds(me.userId, me.schoolId);
  const rows = await db.membership.findMany({
    where: {
      schoolId: me.schoolId,
      role: { in: [...CONTACTABLE_ROLES] },
      status: "ACTIVE",
      leftAt: null,
      userId: { not: me.userId },
      user: {
        disabledAt: null,
        ...(needle ? { OR: [{ name: { contains: needle, mode: "insensitive" as const } }, { preferredName: { contains: needle, mode: "insensitive" as const } }] } : {}),
      },
    },
    select: { id: true, userId: true, role: true, subjects: true, user: { select: { name: true, preferredName: true, avatarKey: true } } },
    orderBy: [{ user: { name: "asc" } }],
    take: 300,
  });
  const rank = (r: string) => (r === "ADMIN" ? 0 : r === "PRINCIPAL" ? 1 : 2);
  return rows
    .map((m) => ({
      userId: m.userId,
      membershipId: m.id,
      name: m.user.preferredName ?? m.user.name,
      avatarKey: m.user.avatarKey,
      role: m.role as Role,
      detail: m.role === "TEACHER" ? readJsonArray<string>(m.subjects).join(" · ") || null : null,
      formerTeacher: former.has(m.id),
    }))
    .sort((a, b) => Number(b.formerTeacher) - Number(a.formerTeacher) || rank(a.role) - rank(b.role) || a.name.localeCompare(b.name))
    .slice(0, limit);
}

/* -------------------------------------------------------------------------- */
/* The alumnus's home                                                          */
/* -------------------------------------------------------------------------- */

/** The class on the leaving record of `userId`'s pupil membership at `schoolId`, newest first. */
async function lastClassesOf(schoolId: string, userIds: string[]): Promise<Map<string, string | null>> {
  if (userIds.length === 0) return new Map();
  const records = await db.schoolRecord.findMany({
    where: { schoolId, studentUserId: { in: userIds } },
    select: { studentUserId: true, className: true, leftAt: true },
    orderBy: { leftAt: "desc" },
  });
  const out = new Map<string, string | null>();
  for (const r of records) if (!out.has(r.studentUserId)) out.set(r.studentUserId, r.className);
  return out;
}

type DirectoryMe = { listed: boolean; city: string | null; occupation: string | null; contactPref: AlumniContactPref; mentor: boolean };

function directoryMe(profile: { listed: boolean; city: string | null; occupation: string | null; contactPref: string; mentor: boolean } | null): DirectoryMe {
  return {
    listed: profile?.listed ?? false,
    city: profile?.listed ? profile.city : null,
    occupation: profile?.listed ? profile.occupation : null,
    contactPref: (profile?.contactPref as AlumniContactPref | undefined) ?? "OFFICE",
    mentor: profile?.mentor ?? false,
  };
}

export async function alumniHome(ctx: ActiveContext) {
  const me = await requireAlumnus(ctx);
  const batchYear = batchYearOf(me.joinedAt);
  const [school, feedMode, profile, staff, lastClass, notes] = await Promise.all([
    db.school.findUniqueOrThrow({ where: { id: me.schoolId }, select: { name: true } }),
    alumniFeedMode(me.schoolId),
    db.alumniProfile.findUnique({ where: { membershipId: me.id } }),
    staffFor(me, "", 200),
    lastClassesOf(me.schoolId, [me.userId]),
    db.alumniNote.findMany({
      where: { schoolId: me.schoolId, OR: [{ batchYear: null }, { batchYear }] },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: { id: true, batchYear: true, title: true, body: true, createdAt: true },
    }),
  ]);
  return {
    schoolId: me.schoolId,
    schoolName: school.name,
    batchYear,
    leftAt: me.joinedAt,
    lastClass: lastClass.get(me.userId) ?? null,
    feedMode,
    muted: profile?.mutedAt != null,
    muteReason: profile?.mutedAt ? profile.muteReason : null,
    isMinor: ctx.user.isMinor,
    formerTeachers: staff.filter((p) => p.formerTeacher),
    notes,
    directory: directoryMe(profile),
  };
}

/* -------------------------------------------------------------------------- */
/* The directory                                                               */
/* -------------------------------------------------------------------------- */

/**
 * The listed alumni of the reader's school: for its alumni and its staff.
 * A minor is never shown, whatever a row says (a minor cannot join; this is
 * the second lock), and an email only when its owner chose EMAIL.
 */
export async function alumniDirectory(ctx: ActiveContext) {
  if (!ctx.schoolId || !ctx.role) throw new AccessError("access.wrongRoleForThisAction");
  let me: AlumnusRow | null = null;
  if (ctx.role === "ALUMNUS") me = await requireAlumnus(ctx);
  else {
    if (!isStaff(ctx.role) || !ctx.membershipId) throw new AccessError("access.wrongRoleForThisAction");
    await assertModuleOn(ctx.schoolId, "ALUMNI");
  }
  const schoolId = ctx.schoolId;
  const [school, rows, mine] = await Promise.all([
    db.school.findUniqueOrThrow({ where: { id: schoolId }, select: { name: true } }),
    db.alumniProfile.findMany({
      where: { schoolId, listed: true, membership: { role: "ALUMNUS", status: "ACTIVE", leftAt: null, user: { disabledAt: null, isMinor: false } } },
      select: {
        membershipId: true,
        userId: true,
        city: true,
        occupation: true,
        contactPref: true,
        mentor: true,
        membership: { select: { joinedAt: true, user: { select: { name: true, preferredName: true, avatarKey: true, email: true } } } },
      },
      take: 1000,
    }),
    me ? db.alumniProfile.findUnique({ where: { membershipId: me.id } }) : Promise.resolve(null),
  ]);
  const entries = rows
    .map((r) => ({
      membershipId: r.membershipId,
      userId: r.userId,
      name: r.membership.user.preferredName ?? r.membership.user.name,
      avatarKey: r.membership.user.avatarKey,
      batchYear: batchYearOf(r.membership.joinedAt),
      city: r.city,
      occupation: r.occupation,
      contactPref: r.contactPref as AlumniContactPref,
      email: r.contactPref === "EMAIL" ? r.membership.user.email : null,
      mentor: r.mentor,
      mine: r.userId === ctx.user.id,
    }))
    .sort((a, b) => b.batchYear - a.batchYear || a.name.localeCompare(b.name));
  return {
    schoolName: school.name,
    entries,
    me: me ? directoryMe(mine) : null,
    canJoin: me !== null && !ctx.user.isMinor,
  };
}

/** Join the directory, or change one's entry. An adult alumnus's own act; audited. */
export async function joinAlumniDirectory(ctx: ActiveContext, input: AlumniDirectoryJoin): Promise<DirectoryMe> {
  const me = await requireAlumnus(ctx);
  if (ctx.user.isMinor) throw new AccessError("alumni.refuseMinor");
  const data = {
    listed: true,
    city: input.city?.trim().slice(0, 80) || null,
    occupation: input.occupation?.trim().slice(0, 120) || null,
    contactPref: input.contactPref,
  };
  const existing = await db.alumniProfile.findUnique({ where: { membershipId: me.id }, select: { id: true, listed: true } });
  const saved = existing
    ? await db.alumniProfile.update({ where: { id: existing.id }, data: { ...data, ...(existing.listed ? {} : { listedAt: new Date() }) } })
    : await db.alumniProfile.create({ data: { ...data, listedAt: new Date(), schoolId: me.schoolId, membershipId: me.id, userId: me.userId } });
  await audit({ schoolId: me.schoolId, actorUserId: ctx.user.id, action: "alumni.directory.join", targetType: "Membership", targetId: me.id, meta: { contactPref: data.contactPref, first: !existing?.listed } });
  return directoryMe(saved);
}

/** Leave the directory: what was written there goes with it. Idempotent. */
export async function leaveAlumniDirectory(ctx: ActiveContext): Promise<DirectoryMe> {
  const me = await requireAlumnus(ctx);
  const existing = await db.alumniProfile.findUnique({ where: { membershipId: me.id } });
  if (!existing?.listed) return directoryMe(existing);
  const saved = await db.alumniProfile.update({ where: { id: existing.id }, data: { listed: false, listedAt: null, city: null, occupation: null, contactPref: "OFFICE" } });
  await audit({ schoolId: me.schoolId, actorUserId: ctx.user.id, action: "alumni.directory.leave", targetType: "Membership", targetId: me.id });
  return directoryMe(saved);
}

/* -------------------------------------------------------------------------- */
/* The office                                                                  */
/* -------------------------------------------------------------------------- */

export async function alumniForOffice(ctx: ActiveContext, q = "") {
  const schoolId = await requireOffice(ctx, false);
  const needle = q.trim();
  const [feedMode, rows, notes] = await Promise.all([
    alumniFeedMode(schoolId),
    db.membership.findMany({
      where: { schoolId, role: "ALUMNUS", status: "ACTIVE", leftAt: null },
      select: { id: true, userId: true, joinedAt: true, user: { select: { name: true, preferredName: true, isMinor: true } }, alumniProfile: true },
      take: 5000,
    }),
    db.alumniNote.findMany({ where: { schoolId }, orderBy: { createdAt: "desc" }, take: 30, select: { id: true, batchYear: true, title: true, body: true, createdAt: true, recipientCount: true } }),
  ]);
  const classes = await lastClassesOf(schoolId, rows.map((r) => r.userId));
  const all = rows.map((r) => ({
    membershipId: r.id,
    userId: r.userId,
    name: r.user.preferredName ?? r.user.name,
    batchYear: batchYearOf(r.joinedAt),
    lastClass: classes.get(r.userId) ?? null,
    isMinor: r.user.isMinor,
    listed: r.alumniProfile?.listed ?? false,
    mentor: r.alumniProfile?.mentor ?? false,
    muted: r.alumniProfile?.mutedAt != null,
    muteReason: r.alumniProfile?.mutedAt ? r.alumniProfile.muteReason : null,
  }));
  const byYear = new Map<number, { year: number; count: number; listed: number }>();
  for (const a of all) {
    const b = byYear.get(a.batchYear) ?? { year: a.batchYear, count: 0, listed: 0 };
    b.count += 1;
    if (a.listed) b.listed += 1;
    byYear.set(a.batchYear, b);
  }
  const lower = needle.toLowerCase();
  return {
    feedMode,
    batches: [...byYear.values()].sort((a, b) => b.year - a.year),
    alumni: all
      .filter((a) => !lower || a.name.toLowerCase().includes(lower))
      .sort((a, b) => b.batchYear - a.batchYear || a.name.localeCompare(b.name))
      .slice(0, 500),
    notes,
  };
}

async function schoolName(schoolId: string): Promise<string> {
  return (await db.school.findUniqueOrThrow({ where: { id: schoolId }, select: { name: true } })).name;
}

/** The office mutes an alumnus, with a reason they are told, or lifts it. Idempotent; audited. */
export async function setAlumnusMuted(ctx: ActiveContext, membershipId: string, muted: boolean, reason?: string): Promise<{ membershipId: string; changed: boolean }> {
  const schoolId = await requireOffice(ctx, true);
  const row = await alumnusAt(schoolId, membershipId);
  if ((row.alumniProfile?.mutedAt != null) === muted) return { membershipId, changed: false };
  const muteReason = muted ? reason?.trim().slice(0, 300) || null : null;
  const data = muted ? { mutedAt: new Date(), mutedByUserId: ctx.user.id, muteReason } : { mutedAt: null, mutedByUserId: null, muteReason: null };
  await db.alumniProfile.upsert({ where: { membershipId }, create: { schoolId, membershipId, userId: row.userId, ...data }, update: data });
  await audit({ schoolId, actorUserId: ctx.user.id, action: muted ? "alumni.mute" : "alumni.unmute", targetType: "Membership", targetId: membershipId, meta: { hasReason: muteReason !== null } });
  await notify({
    userId: row.userId,
    schoolId,
    kind: "SYSTEM",
    titleKey: muted ? "alumni.notifMuted" : "alumni.notifUnmuted",
    titleVars: { school: await schoolName(schoolId) },
    ...(muteReason ? { body: muteReason } : {}),
    url: "/alumni",
  }).catch(() => undefined);
  return { membershipId, changed: true };
}

/** The office marks an adult alumnus a mentor, or takes it back. Idempotent; audited. */
export async function setAlumnusMentor(ctx: ActiveContext, membershipId: string, mentor: boolean): Promise<{ membershipId: string; changed: boolean }> {
  const schoolId = await requireOffice(ctx, true);
  const row = await alumnusAt(schoolId, membershipId);
  if (mentor && row.user.isMinor) throw new AccessError("alumni.refuseMentorMinor");
  if ((row.alumniProfile?.mentor ?? false) === mentor) return { membershipId, changed: false };
  const data = mentor ? { mentor: true, mentorAt: new Date(), mentorByUserId: ctx.user.id } : { mentor: false, mentorAt: null, mentorByUserId: null };
  await db.alumniProfile.upsert({ where: { membershipId }, create: { schoolId, membershipId, userId: row.userId, ...data }, update: data });
  await audit({ schoolId, actorUserId: ctx.user.id, action: mentor ? "alumni.mentor.on" : "alumni.mentor.off", targetType: "Membership", targetId: membershipId });
  if (mentor) {
    await notify({ userId: row.userId, schoolId, kind: "SYSTEM", titleKey: "alumni.notifMentor", titleVars: { school: await schoolName(schoolId) }, url: "/alumni" }).catch(() => undefined);
  }
  return { membershipId, changed: true };
}

/**
 * A note from the office to one batch (the year they left) or to every
 * alumnus: kept as an AlumniNote, shown on their home, and told to each by a
 * notification. Ten a day. Audited with the count it reached.
 */
export async function sendAlumniNote(ctx: ActiveContext, input: { batchYear: number | null; title: string; body: string }): Promise<{ noteId: string; recipientCount: number }> {
  const schoolId = await requireOffice(ctx, true);
  const limit = await consume(`alumni-note:${schoolId}`, NOTES_PER_DAY, DAY);
  if (!limit.allowed) throw new AccessError("alumni.refuseNoteTooMany");
  const rows = await db.membership.findMany({
    where: { schoolId, role: "ALUMNUS", status: "ACTIVE", leftAt: null, user: { disabledAt: null } },
    select: { userId: true, joinedAt: true },
  });
  const recipients = rows.filter((r) => input.batchYear === null || batchYearOf(r.joinedAt) === input.batchYear).map((r) => r.userId);
  const note = await db.alumniNote.create({
    data: { schoolId, batchYear: input.batchYear, title: input.title.trim(), body: input.body.trim(), sentByUserId: ctx.user.id, recipientCount: recipients.length },
    select: { id: true },
  });
  const name = await schoolName(schoolId);
  for (const userId of recipients) {
    await notify({ userId, schoolId, kind: "SYSTEM", titleKey: "alumni.notifNote", titleVars: { school: name }, body: input.title.trim(), url: "/alumni", meta: { alumniNoteId: note.id } }).catch(() => undefined);
  }
  await audit({ schoolId, actorUserId: ctx.user.id, action: "alumni.note", targetType: "AlumniNote", targetId: note.id, meta: { batchYear: input.batchYear, recipientCount: recipients.length } });
  return { noteId: note.id, recipientCount: recipients.length };
}

/** For a page that draws differently while the module is off. */
export async function alumniOn(schoolId: string | null | undefined): Promise<boolean> {
  return isModuleOn(schoolId, "ALUMNI");
}
