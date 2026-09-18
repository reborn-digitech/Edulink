import "server-only";
import type { CircularReach, ReachState } from "@edulink/contracts";
import { db } from "./db";
import { AccessError } from "./tenancy";
import { audit } from "./audit";
import { notify } from "./notify";
import type { ActiveContext } from "./session";
import type { Role } from "./constants";

/**
 * Circular reach: the loop a school could not close.
 *
 * A post that asks for an acknowledgement is a circular. Publishing one now
 * TELLS its audience — a push to everyone with the app, and a text to a
 * guardian where the school has the channel on — and the office can then
 * read, family by family and class by class, how far the notice got: told,
 * seen (opened on the web or the phone, PostRead), or acknowledged
 * (PostAck), and chase the rest once a day on the second channel.
 *
 * THE UNIT IS THE FAMILY, as in ackReport: a pupil counts as reached when
 * any guardian got there. Nothing here ranks anybody; it is a delivery
 * checklist, and the names on it are the families the school still has to
 * telephone.
 */

const OFFICE: readonly Role[] = ["ADMIN", "PRINCIPAL"];
const STAFF: readonly Role[] = ["ADMIN", "PRINCIPAL", "TEACHER"];
/** A circular to this many readers or fewer is told in the request; more waits for the job within the minute. */
export const INLINE_DELIVERY_MAX = 60;
const REMIND_EVERY_MS = 20 * 3_600_000;
const CHUNK = 20;

type PostRow = { id: string; schoolId: string | null; scope: string; classId: string | null; audience: string; audienceGrade: string | null; title: string; requiresAck: boolean; status: string; createdAt: Date; deliveredAt: Date | null; deliveryQueuedAt: Date | null; remindedAt: Date | null; remindCount: number };

const postSelect = { id: true, schoolId: true, scope: true, classId: true, audience: true, audienceGrade: true, title: true, requiresAck: true, status: true, createdAt: true, deliveredAt: true, deliveryQueuedAt: true, remindedAt: true, remindCount: true } as const;

type Family = { studentMembershipId: string; studentUserId: string; studentName: string; guardians: { userId: string; name: string; phone: string | null }[] };
type Group = { classId: string | null; className: string; families: Family[] };

/** The classes a circular is for, with each pupil's guardians. A teacher sees only their own classes. */
async function familyGroups(post: PostRow, viewer?: { role: Role; membershipId: string }): Promise<Group[]> {
  const schoolId = post.schoolId!;
  const classes = await db.class.findMany({
    where: {
      schoolId,
      archivedAt: null,
      ...(post.scope === "CLASS" && post.classId ? { id: post.classId } : {}),
      ...(post.audienceGrade ? { gradeLevel: post.audienceGrade } : {}),
      ...(viewer?.role === "TEACHER" ? { teachers: { some: { teacherMembershipId: viewer.membershipId } } } : {}),
    },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      enrollments: {
        where: { status: "ACTIVE" },
        select: {
          student: {
            select: {
              id: true,
              userId: true,
              user: { select: { name: true, preferredName: true } },
              guardianships: { where: { status: "ACTIVE" }, select: { parent: { select: { id: true, name: true, preferredName: true, phone: true } } } },
            },
          },
        },
      },
    },
  });
  return classes.map((k) => ({
    classId: k.id,
    className: k.name,
    families: k.enrollments.map(({ student }) => ({
      studentMembershipId: student.id,
      studentUserId: student.userId,
      studentName: student.user.preferredName ?? student.user.name,
      guardians: student.guardianships.map((g) => ({ userId: g.parent.id, name: g.parent.preferredName ?? g.parent.name, phone: g.parent.phone })),
    })),
  }));
}

/** Every reader the circular is addressed to, by kind: guardians get a text too, the rest a push. */
async function recipients(post: PostRow): Promise<{ guardianIds: string[]; otherIds: string[] }> {
  const schoolId = post.schoolId!;
  const guardianIds = new Set<string>();
  const otherIds = new Set<string>();
  if (post.audience !== "TEACHERS") {
    for (const group of await familyGroups(post)) {
      for (const f of group.families) {
        if (post.audience !== "STUDENTS") f.guardians.forEach((g) => guardianIds.add(g.userId));
        if (post.audience === "STUDENTS" || post.audience === "ALL") otherIds.add(f.studentUserId);
      }
    }
  }
  if (post.audience === "TEACHERS" || post.audience === "ALL") {
    const staff = await db.membership.findMany({ where: { schoolId, role: { in: ["ADMIN", "PRINCIPAL", "TEACHER"] }, status: "ACTIVE", leftAt: null }, select: { userId: true } });
    staff.forEach((m) => otherIds.add(m.userId));
  }
  return { guardianIds: [...guardianIds], otherIds: [...otherIds].filter((id) => !guardianIds.has(id)) };
}

async function inChunks<T>(items: T[], run: (item: T) => Promise<unknown>): Promise<void> {
  for (let i = 0; i < items.length; i += CHUNK) await Promise.all(items.slice(i, i + CHUNK).map(run));
}

async function tell(post: PostRow, purpose: string, guardianIds: string[], otherIds: string[]): Promise<{ pushed: number }> {
  const schoolId = post.schoolId!;
  const school = await db.school.findUniqueOrThrow({ where: { id: schoolId }, select: { name: true } });
  const base = { schoolId, kind: "POST" as const, titleKey: "bulletin.notifCircular" as const, titleVars: { school: school.name }, body: post.title, url: `/bulletin/${post.id}` };
  await inChunks(guardianIds, (userId) => notify({ ...base, userId, text: { templateKey: "circular", vars: { notice: post.title.slice(0, 300) }, purpose } }));
  await inChunks(otherIds, (userId) => notify({ ...base, userId }));
  return { pushed: guardianIds.length + otherIds.length };
}

/**
 * Called when a circular is published: told now when the audience is small,
 * otherwise marked for the job. Safe to call twice — a delivered post is
 * left alone.
 */
export async function queueCircularDelivery(postId: string): Promise<{ delivered: boolean; recipients: number }> {
  const post = await db.post.findUnique({ where: { id: postId }, select: postSelect });
  if (!post || !post.schoolId || !post.requiresAck || post.status !== "APPROVED" || post.deliveredAt) return { delivered: false, recipients: 0 };
  const { guardianIds, otherIds } = await recipients(post);
  const total = guardianIds.length + otherIds.length;
  await db.post.update({ where: { id: postId }, data: { deliveryQueuedAt: post.deliveryQueuedAt ?? new Date() } });
  if (total > INLINE_DELIVERY_MAX) return { delivered: false, recipients: total };
  await deliverCircular(post);
  return { delivered: true, recipients: total };
}

async function deliverCircular(post: PostRow): Promise<number> {
  const { guardianIds, otherIds } = await recipients(post);
  const { pushed } = await tell(post, `circular:${post.id}`, guardianIds, otherIds);
  await db.post.update({ where: { id: post.id }, data: { deliveredAt: new Date() } });
  await audit({ schoolId: post.schoolId, actorUserId: null, action: "circular.deliver", targetType: "Post", targetId: post.id, meta: { recipients: pushed, guardians: guardianIds.length } });
  return pushed;
}

/** The job: every circular queued and not yet told, oldest first. */
export async function deliverQueuedCirculars(): Promise<{ delivered: number; recipients: number; perSchool: Record<string, { delivered: number; recipients: number }> }> {
  const queued = await db.post.findMany({ where: { requiresAck: true, status: "APPROVED", deliveryQueuedAt: { not: null }, deliveredAt: null }, select: postSelect, orderBy: { deliveryQueuedAt: "asc" }, take: 20 });
  const perSchool: Record<string, { delivered: number; recipients: number }> = {};
  let delivered = 0;
  let total = 0;
  for (const post of queued) {
    if (!post.schoolId) continue;
    const n = await deliverCircular(post);
    delivered += 1;
    total += n;
    const s = (perSchool[post.schoolId] ??= { delivered: 0, recipients: 0 });
    s.delivered += 1;
    s.recipients += n;
  }
  return { delivered, recipients: total, perSchool };
}

/** A reader opened a circular. Idempotent; a plain post records nothing. */
export async function recordPostRead(session: ActiveContext, post: { id: string; schoolId: string | null; requiresAck: boolean; status: string }): Promise<void> {
  if (!post.requiresAck || post.status !== "APPROVED" || !post.schoolId) return;
  await db.postRead.upsert({ where: { postId_userId: { postId: post.id, userId: session.user.id } }, create: { postId: post.id, schoolId: post.schoolId, userId: session.user.id }, update: {} }).catch(() => {});
}

async function loadCircular(session: ActiveContext, postId: string): Promise<{ post: PostRow; viewer: { role: Role; membershipId: string; schoolId: string } }> {
  const { schoolId, membershipId, role } = session;
  if (!schoolId || !membershipId || !role || !STAFF.includes(role)) throw new AccessError("access.postNotFound", "NOT_FOUND");
  const post = await db.post.findFirst({ where: { id: postId, schoolId, requiresAck: true, status: "APPROVED" }, select: postSelect });
  if (!post) throw new AccessError("access.postNotFound", "NOT_FOUND");
  if (role === "TEACHER" && post.scope === "CLASS" && post.classId) {
    const mine = await db.classTeacher.findFirst({ where: { classId: post.classId, teacherMembershipId: membershipId }, select: { id: true } });
    if (!mine) throw new AccessError("access.postNotFound", "NOT_FOUND");
  }
  return { post, viewer: { role, membershipId, schoolId } };
}

const RANK: Record<ReachState, number> = { UNREACHED: 0, TOLD: 1, SEEN: 2, ACKED: 3 };
const best = (a: ReachState, b: ReachState) => (RANK[a] >= RANK[b] ? a : b);

/** The reach report: told, seen, acked and the outstanding families, class by class. */
export async function circularReach(session: ActiveContext, postId: string): Promise<CircularReach> {
  const { post, viewer } = await loadCircular(session, postId);
  const schoolId = viewer.schoolId;
  const office = OFFICE.includes(viewer.role);
  // Who is on the list first, then one lookup per fact for exactly those people.
  const staff = post.audience === "TEACHERS" ? await db.membership.findMany({ where: { schoolId, role: { in: ["ADMIN", "PRINCIPAL", "TEACHER"] }, status: "ACTIVE", leftAt: null }, select: { id: true, userId: true, user: { select: { name: true, preferredName: true, phone: true } } } }) : [];
  const fgroups = post.audience === "TEACHERS" ? [] : await familyGroups(post, viewer);
  const everyone = new Set<string>(staff.map((m) => m.userId));
  for (const g of fgroups) for (const f of g.families) { everyone.add(f.studentUserId); f.guardians.forEach((x) => everyone.add(x.userId)); }
  const ids = [...everyone];
  const [acks, reads, told, texted, pushDevices, pushSubs] = await Promise.all([
    db.postAck.findMany({ where: { postId }, select: { userId: true } }),
    db.postRead.findMany({ where: { postId }, select: { userId: true } }),
    db.notification.findMany({ where: { schoolId, url: `/bulletin/${postId}` }, select: { userId: true, readAt: true } }),
    db.outboundMessage.findMany({ where: { schoolId, purpose: { in: [`circular:${postId}`, `circular-remind:${postId}`] }, status: { in: ["SENT", "DELIVERED"] } }, select: { userId: true } }),
    ids.length ? db.deviceToken.findMany({ where: { userId: { in: ids } }, select: { userId: true } }) : [],
    ids.length ? db.pushSubscription.findMany({ where: { userId: { in: ids } }, select: { userId: true } }) : [],
  ]);
  const acked = new Set(acks.map((a) => a.userId));
  const seen = new Set([...reads.map((r) => r.userId), ...told.filter((n) => n.readAt).map((n) => n.userId)]);
  const toldSet = new Set(told.map((n) => n.userId));
  const textedSet = new Set(texted.map((m) => m.userId));
  const hasApp = new Set([...pushDevices.map((d) => d.userId), ...pushSubs.map((s) => s.userId)]);
  const stateOf = (userId: string): ReachState => (acked.has(userId) ? "ACKED" : seen.has(userId) ? "SEEN" : toldSet.has(userId) || textedSet.has(userId) ? "TOLD" : "UNREACHED");

  const groups: CircularReach["groups"] = [];
  if (post.audience === "TEACHERS") {
    const byUser = new Map(staff.map((m) => [m.userId, m]));
    const fams = [...byUser.values()].map((m) => ({ studentMembershipId: m.id, studentName: m.user.preferredName ?? m.user.name, state: stateOf(m.userId), guardians: [{ userId: m.userId, name: m.user.preferredName ?? m.user.name, phone: office ? m.user.phone : null, hasApp: hasApp.has(m.userId), texted: textedSet.has(m.userId), state: stateOf(m.userId) }] }));
    groups.push({ classId: null, className: "", total: fams.length, told: fams.filter((f) => RANK[f.state] >= 1).length, seen: fams.filter((f) => RANK[f.state] >= 2).length, acked: fams.filter((f) => f.state === "ACKED").length, outstanding: fams.filter((f) => f.state !== "ACKED").sort((a, b) => a.studentName.localeCompare(b.studentName)) });
  } else {
    for (const group of fgroups) {
      const fams = group.families.map((f) => {
        const guardians = post.audience === "STUDENTS" ? [] : f.guardians.map((g) => ({ userId: g.userId, name: g.name, phone: office ? g.phone : null, hasApp: hasApp.has(g.userId), texted: textedSet.has(g.userId), state: stateOf(g.userId) }));
        let state: ReachState = "UNREACHED";
        for (const g of guardians) state = best(state, g.state);
        if (post.audience !== "PARENTS") state = best(state, stateOf(f.studentUserId));
        return { studentMembershipId: f.studentMembershipId, studentName: f.studentName, state, guardians };
      });
      groups.push({ classId: group.classId, className: group.className, total: fams.length, told: fams.filter((f) => RANK[f.state] >= 1).length, seen: fams.filter((f) => RANK[f.state] >= 2).length, acked: fams.filter((f) => f.state === "ACKED").length, outstanding: fams.filter((f) => f.state !== "ACKED").sort((a, b) => a.studentName.localeCompare(b.studentName)) });
    }
  }
  const totals = groups.reduce((t, g) => ({ total: t.total + g.total, told: t.told + g.told, seen: t.seen + g.seen, acked: t.acked + g.acked }), { total: 0, told: 0, seen: 0, acked: 0 });
  const outstanding = totals.total - totals.acked;
  const remindBlocked: CircularReach["remindBlocked"] = !office ? "not-office" : !post.deliveredAt ? "not-delivered" : outstanding === 0 ? "nothing-outstanding" : post.remindedAt && Date.now() - post.remindedAt.getTime() < REMIND_EVERY_MS ? "too-soon" : "none";
  return {
    postId,
    title: post.title,
    audience: post.audience,
    publishedAt: post.createdAt.toISOString(),
    deliveredAt: post.deliveredAt?.toISOString() ?? null,
    deliveryQueuedAt: post.deliveryQueuedAt?.toISOString() ?? null,
    remindedAt: post.remindedAt?.toISOString() ?? null,
    remindCount: post.remindCount,
    totals,
    groups,
    canRemind: remindBlocked === "none",
    remindBlocked,
  };
}

/**
 * The chase: the office or the head tells the outstanding families again —
 * a push, and the text on the second channel — once a day at most, after
 * which it is a no-op until the day is up. The whole outstanding set, not
 * one class: the office chases, the class teacher telephones.
 */
export async function remindCircular(session: ActiveContext, postId: string): Promise<{ reminded: number; texted: number; remindedAt: Date }> {
  const reach = await circularReach(session, postId);
  if (reach.remindBlocked === "not-office") throw new AccessError("access.notAllowed");
  // Nothing to chase, or chased within the day: a no-op with the last time,
  // not a refusal — a second tap and the sweep's second role both get 200.
  if (!reach.canRemind) return { reminded: 0, texted: 0, remindedAt: reach.remindedAt ? new Date(reach.remindedAt) : new Date() };
  const { post } = await loadCircular(session, postId);
  // Every full report, not the teacher-scoped one: the office sees every class.
  const guardianIds = new Set<string>();
  const otherIds = new Set<string>();
  for (const g of reach.groups) {
    for (const f of g.outstanding) {
      if (post.audience === "TEACHERS") f.guardians.forEach((x) => otherIds.add(x.userId));
      else {
        f.guardians.filter((x) => x.state !== "ACKED").forEach((x) => guardianIds.add(x.userId));
        if (post.audience !== "PARENTS") {
          const pupil = await db.membership.findUnique({ where: { id: f.studentMembershipId }, select: { userId: true } });
          if (pupil) otherIds.add(pupil.userId);
        }
      }
    }
  }
  const { pushed } = await tell(post, `circular-remind:${postId}`, [...guardianIds], [...otherIds].filter((id) => !guardianIds.has(id)));
  const remindedAt = new Date();
  await db.post.update({ where: { id: postId }, data: { remindedAt, remindCount: { increment: 1 } } });
  await audit({ schoolId: post.schoolId, actorUserId: session.user.id, action: "circular.remind", targetType: "Post", targetId: postId, meta: { reminded: pushed, families: reach.totals.total - reach.totals.acked } });
  return { reminded: pushed, texted: guardianIds.size, remindedAt };
}

/** The office's list: every circular of the school with its reach, newest first. */
export async function officeCirculars(session: ActiveContext): Promise<{ rows: { postId: string; title: string; audience: string; className: string | null; publishedAt: string; deliveredAt: string | null; remindedAt: string | null; total: number; told: number; seen: number; acked: number }[] }> {
  const { schoolId, role } = session;
  if (!schoolId || !role || !OFFICE.includes(role)) throw new AccessError("access.notAllowed");
  const posts = await db.post.findMany({ where: { schoolId, requiresAck: true, status: "APPROVED" }, select: { ...postSelect, class: { select: { name: true } } }, orderBy: { createdAt: "desc" }, take: 50 });
  const rows = [];
  for (const post of posts) {
    const reach = await circularReach(session, post.id);
    rows.push({ postId: post.id, title: post.title, audience: post.audience, className: post.class?.name ?? null, publishedAt: post.createdAt.toISOString(), deliveredAt: post.deliveredAt?.toISOString() ?? null, remindedAt: post.remindedAt?.toISOString() ?? null, ...reach.totals });
  }
  return { rows };
}
