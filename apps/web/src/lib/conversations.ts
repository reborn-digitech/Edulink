import "server-only";
import { db } from "./db";
import { AccessError } from "./tenancy";
import { audit } from "./audit";
import { notify } from "./notify";
import { publish, channel } from "./realtime";
import { readJsonArray } from "./json";
import type { ActiveContext } from "./session";
import type { Role } from "./constants";

/**
 * A person writing to a person, inside one school.
 *
 * WHAT THIS IS NOT. `remarks.ts` is the room ABOUT A PUPIL — teacher, child
 * and guardians, keyed on the pupil so the family is present by construction.
 * For as long as it was the only message shape, a principal could not write
 * to a teacher, an admin could not answer a parent, and two teachers planning
 * a trip had no channel at all. This is the other shape: people in one
 * school, keyed on nothing but who is in the room.
 *
 * WHO MAY WRITE TO WHOM is the whole design, and it is one function
 * (`mayConverse`) so it can be read in one place and pinned in one test:
 *
 *   - staff (teacher, admin, principal) may write to anyone at the school —
 *     other staff, any pupil, any parent;
 *   - a parent may write to staff, and only staff: a parent directory is not
 *     something a parent is owed, and a stranger's parent is not somebody a
 *     child's parent should be able to reach through the child's school;
 *   - a pupil may write to staff, and only staff. Never to another pupil,
 *     never to a parent. The same safeguarding line `remarks.ts` draws: an
 *     unobserved channel between a child and anyone but the school's own
 *     staff is the shape policy exists to prevent.
 *
 * The room belongs to the SCHOOL. `schoolId` sits on every row, so the
 * ordinary tenant policy applies; a parent reaches it through the child's
 * school binding; and a person who leaves the school stops reading it the
 * day they leave — `standingAt` re-checks a live membership on every write.
 */

const STAFF: readonly Role[] = ["TEACHER", "ADMIN", "PRINCIPAL"];

export function isStaffRole(role: Role | null | undefined): boolean {
  return role !== null && role !== undefined && STAFF.includes(role);
}

/** The rule. Symmetric on purpose: if A may open a room with B, B may reply. */
export function mayConverse(a: Role, b: Role): boolean {
  if (isStaffRole(a) && isStaffRole(b)) return true;
  if (isStaffRole(a)) return true; // staff → pupil, staff → parent
  if (isStaffRole(b)) return true; // pupil → staff, parent → staff
  return false; // pupil ↔ pupil, pupil ↔ parent, parent ↔ parent
}

/**
 * Where the caller stands at a school, or null if they do not.
 *
 * A parent has no school on their session; their standing is an ACTIVE
 * guardianship of a pupil there. A school's stand-in guardianship (relation
 * SCHOOL) is held by staff for a guardianless child and confers nothing here.
 */
export async function standingAt(ctx: ActiveContext, schoolId: string): Promise<Role | null> {
  if (ctx.role === "PARENT") {
    const link = await db.guardianship.findFirst({
      where: { parentUserId: ctx.user.id, studentSchoolId: schoolId, status: "ACTIVE", relation: { not: "SCHOOL" } },
      select: { id: true },
    });
    return link ? "PARENT" : null;
  }
  if (!ctx.role || ctx.schoolId !== schoolId || !ctx.membershipId) return null;
  const membership = await db.membership.findFirst({
    where: { id: ctx.membershipId, schoolId, status: "ACTIVE", leftAt: null },
    select: { id: true },
  });
  return membership ? ctx.role : null;
}

/** Who somebody else is at a school: a live membership first, else a real guardianship, else nobody. */
export async function roleOfAt(userId: string, schoolId: string): Promise<Role | null> {
  const membership = await db.membership.findFirst({
    where: { userId, schoolId, status: "ACTIVE", leftAt: null },
    select: { role: true },
  });
  if (membership) return membership.role as Role;
  const link = await db.guardianship.findFirst({
    where: { parentUserId: userId, studentSchoolId: schoolId, status: "ACTIVE", relation: { not: "SCHOOL" } },
    select: { id: true },
  });
  return link ? "PARENT" : null;
}

/** The schools a caller can hold a conversation in. */
export async function conversationSchools(ctx: ActiveContext): Promise<string[]> {
  if (ctx.role === "PARENT") {
    const links = await db.guardianship.findMany({
      where: { parentUserId: ctx.user.id, status: "ACTIVE", relation: { not: "SCHOOL" } },
      select: { studentSchoolId: true },
      distinct: ["studentSchoolId"],
    });
    return links.map((l) => l.studentSchoolId);
  }
  return ctx.schoolId ? [ctx.schoolId] : [];
}

/* -------------------------------------------------------------------------- */
/* Who is there to write to                                                    */
/* -------------------------------------------------------------------------- */

export type Person = {
  userId: string;
  /** Null for a parent, who has no membership. */
  membershipId: string | null;
  name: string;
  avatarKey: string | null;
  role: Role;
  /** One line under the name: a teacher's subjects, a pupil's class, a parent's child. */
  detail: string | null;
};

/**
 * Everyone at `schoolId` the caller may write to, by name. Search is a
 * case-insensitive substring on the name; the list is capped because a
 * picker is not a roll.
 */
export async function peopleToMessage(
  ctx: ActiveContext,
  schoolId: string,
  q = "",
  limit = 60,
): Promise<Person[]> {
  const me = await standingAt(ctx, schoolId);
  if (!me) throw new AccessError("access.notAtThisSchool", "NOT_FOUND");

  const needle = q.trim();
  const nameFilter = needle
    ? { OR: [{ name: { contains: needle, mode: "insensitive" as const } }, { preferredName: { contains: needle, mode: "insensitive" as const } }] }
    : {};

  const out: Person[] = [];

  const members = await db.membership.findMany({
    where: {
      schoolId,
      status: "ACTIVE",
      leftAt: null,
      userId: { not: ctx.user.id },
      user: { disabledAt: null, ...nameFilter },
    },
    select: {
      id: true,
      role: true,
      subjects: true,
      userId: true,
      user: { select: { name: true, preferredName: true, avatarKey: true } },
      enrollments: {
        where: { status: "ACTIVE", class: { archivedAt: null } },
        select: { class: { select: { name: true } } },
        take: 1,
      },
    },
    orderBy: [{ role: "asc" }, { user: { name: "asc" } }],
    take: limit * 2,
  });
  for (const m of members) {
    const role = m.role as Role;
    if (!mayConverse(me, role)) continue;
    const detail =
      role === "STUDENT"
        ? (m.enrollments[0]?.class.name ?? null)
        : role === "TEACHER"
          ? readJsonArray<string>(m.subjects).join(" · ") || null
          : null;
    out.push({
      userId: m.userId,
      membershipId: m.id,
      name: m.user.preferredName ?? m.user.name,
      avatarKey: m.user.avatarKey,
      role,
      detail,
    });
  }

  // Parents, for those who may reach them. One row per person, not per child.
  if (mayConverse(me, "PARENT")) {
    const links = await db.guardianship.findMany({
      where: {
        studentSchoolId: schoolId,
        status: "ACTIVE",
        relation: { not: "SCHOOL" },
        parentUserId: { not: ctx.user.id },
        parent: { disabledAt: null, ...nameFilter },
        student: { leftAt: null },
      },
      select: {
        parentUserId: true,
        parent: { select: { name: true, preferredName: true, avatarKey: true } },
        student: { select: { user: { select: { name: true, preferredName: true } } } },
      },
      orderBy: { parent: { name: "asc" } },
      take: limit * 2,
    });
    const byParent = new Map<string, Person & { children: string[] }>();
    for (const link of links) {
      const child = link.student.user.preferredName ?? link.student.user.name;
      const existing = byParent.get(link.parentUserId);
      if (existing) {
        existing.children.push(child);
        continue;
      }
      byParent.set(link.parentUserId, {
        userId: link.parentUserId,
        membershipId: null,
        name: link.parent.preferredName ?? link.parent.name,
        avatarKey: link.parent.avatarKey,
        role: "PARENT",
        detail: null,
        children: [child],
      });
    }
    for (const parent of byParent.values()) {
      out.push({ ...parent, detail: parent.children.join(", ") });
    }
  }

  return out.slice(0, limit);
}

/* -------------------------------------------------------------------------- */
/* Opening, reading, writing                                                   */
/* -------------------------------------------------------------------------- */

/**
 * The one room between the caller and `otherUserId` at `schoolId` — found
 * if it exists, made if it does not. Two people share one room; a second
 * "new conversation" with the same person lands in the same place.
 */
export async function openConversation(
  ctx: ActiveContext,
  schoolId: string,
  otherUserId: string,
): Promise<{ conversationId: string; created: boolean }> {
  if (otherUserId === ctx.user.id) throw new AccessError("access.cannotMessageYourself");
  const me = await standingAt(ctx, schoolId);
  if (!me) throw new AccessError("access.notAtThisSchool", "NOT_FOUND");
  const them = await roleOfAt(otherUserId, schoolId);
  if (!them) throw new AccessError("access.personNotAtSchool", "NOT_FOUND");
  if (!mayConverse(me, them)) throw new AccessError("access.cannotMessageThisPerson");

  // ONE ROOM PER PAIR IS THE DATABASE'S PROMISE, not this function's. The
  // key is unique; two opens a moment apart both try to create, one wins,
  // and the other finds the winner. Rooms from before the key existed are
  // found by their participants and keyed on the way past.
  const pairKey = `${schoolId}:${[ctx.user.id, otherUserId].sort().join(":")}`;
  const keyed = await db.conversation.findUnique({ where: { pairKey }, select: { id: true } });
  if (keyed) return { conversationId: keyed.id, created: false };

  const candidates = await db.conversation.findMany({
    where: {
      schoolId,
      pairKey: null,
      AND: [
        { participants: { some: { userId: ctx.user.id } } },
        { participants: { some: { userId: otherUserId } } },
      ],
    },
    select: { id: true, _count: { select: { participants: true } } },
    take: 5,
  });
  const existing = candidates.find((c) => c._count.participants === 2);
  if (existing) {
    await db.conversation.updateMany({ where: { id: existing.id, pairKey: null }, data: { pairKey } }).catch(() => {});
    return { conversationId: existing.id, created: false };
  }

  let conversation: { id: string };
  try {
    conversation = await db.conversation.create({
      data: {
        schoolId,
        pairKey,
        createdById: ctx.user.id,
        participants: {
          create: [
            { schoolId, userId: ctx.user.id, lastReadAt: new Date() },
            { schoolId, userId: otherUserId },
          ],
        },
      },
      select: { id: true },
    });
  } catch (error) {
    // The other tap won the race: its room is ours too.
    const winner = await db.conversation.findUnique({ where: { pairKey }, select: { id: true } });
    if (!winner) throw error;
    return { conversationId: winner.id, created: false };
  }

  await audit({
    schoolId,
    actorUserId: ctx.user.id,
    action: "conversation.open",
    targetType: "Conversation",
    targetId: conversation.id,
    meta: { withUserId: otherUserId, withRole: them },
  });

  return { conversationId: conversation.id, created: true };
}

async function assertParticipant(ctx: ActiveContext, conversationId: string) {
  const conversation = await db.conversation.findUnique({
    where: { id: conversationId },
    include: {
      participants: {
        include: { user: { select: { id: true, name: true, preferredName: true, avatarKey: true } } },
      },
    },
  });
  if (!conversation) throw new AccessError("access.conversationNotFound", "NOT_FOUND");
  const mine = conversation.participants.find((p) => p.userId === ctx.user.id);
  if (!mine) throw new AccessError("access.conversationNotFound", "NOT_FOUND");
  // Still at the school? A leaver keeps nothing, and the tenant policy has
  // already hidden the rows from them — this is the application saying the
  // same thing in words rather than in an empty page.
  const standing = await standingAt(ctx, conversation.schoolId);
  if (!standing) throw new AccessError("access.conversationNotFound", "NOT_FOUND");
  return { conversation, mine };
}

export type ConversationSummary = {
  id: string;
  schoolId: string;
  /** Everyone in the room but the viewer. */
  others: { userId: string; membershipId: string | null; name: string; avatarKey: string | null; role: Role | null }[];
  lastMessageAt: Date;
  preview: string;
  previewMine: boolean;
  unread: boolean;
  messageCount: number;
};

export async function listConversations(ctx: ActiveContext): Promise<ConversationSummary[]> {
  const schoolIds = await conversationSchools(ctx);
  if (schoolIds.length === 0) return [];

  const rows = await db.conversation.findMany({
    where: { schoolId: { in: schoolIds }, participants: { some: { userId: ctx.user.id } } },
    include: {
      participants: {
        include: { user: { select: { id: true, name: true, preferredName: true, avatarKey: true } } },
      },
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
      _count: { select: { messages: true } },
    },
    orderBy: { lastMessageAt: "desc" },
    take: 100,
  });

  // Roles for the "others", one query per school rather than one per person.
  const otherIds = [...new Set(rows.flatMap((r) => r.participants.map((p) => p.userId)))].filter((id) => id !== ctx.user.id);
  const memberships = await db.membership.findMany({
    where: { userId: { in: otherIds }, schoolId: { in: schoolIds }, status: "ACTIVE", leftAt: null },
    select: { id: true, userId: true, schoolId: true, role: true },
  });
  const memberOf = new Map(memberships.map((m) => [`${m.schoolId}:${m.userId}`, { id: m.id, role: m.role as Role }]));

  return rows.map((row) => {
    const mine = row.participants.find((p) => p.userId === ctx.user.id);
    const latest = row.messages[0];
    return {
      id: row.id,
      schoolId: row.schoolId,
      others: row.participants
        .filter((p) => p.userId !== ctx.user.id)
        .map((p) => ({
          userId: p.userId,
          membershipId: memberOf.get(`${row.schoolId}:${p.userId}`)?.id ?? null,
          name: p.user.preferredName ?? p.user.name,
          avatarKey: p.user.avatarKey,
          role: memberOf.get(`${row.schoolId}:${p.userId}`)?.role ?? ("PARENT" as Role),
        })),
      lastMessageAt: row.lastMessageAt,
      preview: latest ? latest.body.slice(0, 140) : "",
      previewMine: latest?.authorUserId === ctx.user.id,
      unread: Boolean(
        latest &&
          latest.authorUserId !== ctx.user.id &&
          (!mine?.lastReadAt || latest.createdAt > mine.lastReadAt),
      ),
      messageCount: row._count.messages,
    };
  });
}

/** Rooms with something the viewer has not seen. Cheap enough for the shell. */
export async function unreadConversationCount(ctx: ActiveContext): Promise<number> {
  const schoolIds = await conversationSchools(ctx);
  if (schoolIds.length === 0) return 0;
  const mine = await db.conversationParticipant.findMany({
    where: { userId: ctx.user.id, schoolId: { in: schoolIds } },
    select: {
      lastReadAt: true,
      conversation: { select: { messages: { orderBy: { createdAt: "desc" }, take: 1, select: { authorUserId: true, createdAt: true } } } },
    },
  });
  let n = 0;
  for (const p of mine) {
    const latest = p.conversation.messages[0];
    if (latest && latest.authorUserId !== ctx.user.id && (!p.lastReadAt || latest.createdAt > p.lastReadAt)) n++;
  }
  return n;
}

export async function getConversation(ctx: ActiveContext, conversationId: string) {
  const { conversation, mine } = await assertParticipant(ctx, conversationId);
  const messages = await db.conversationMessage.findMany({
    where: { conversationId },
    orderBy: { createdAt: "asc" },
    include: { author: { select: { name: true, preferredName: true, avatarKey: true } } },
  });
  const others = conversation.participants.filter((p) => p.userId !== ctx.user.id);
  const roles = await Promise.all(others.map((p) => roleOfAt(p.userId, conversation.schoolId)));
  // Profiles are keyed on a membership; a parent has none and gets no link.
  const memberships = await db.membership.findMany({
    where: { schoolId: conversation.schoolId, userId: { in: conversation.participants.map((p) => p.userId) }, status: "ACTIVE", leftAt: null },
    select: { id: true, userId: true },
  });
  const membershipByUser = new Map(memberships.map((m) => [m.userId, m.id]));
  // Read receipts: the newest moment anyone else opened the room.
  const othersReadAt = others.map((p) => p.lastReadAt).filter((d): d is Date => d !== null);
  const lastReadByOthers = othersReadAt.length ? new Date(Math.max(...othersReadAt.map((d) => d.getTime()))) : null;

  return {
    id: conversation.id,
    schoolId: conversation.schoolId,
    others: others.map((p, i) => ({
      userId: p.userId,
      membershipId: membershipByUser.get(p.userId) ?? null,
      name: p.user.preferredName ?? p.user.name,
      avatarKey: p.user.avatarKey,
      role: roles[i] ?? null,
    })),
    myLastReadAt: mine.lastReadAt,
    messages: messages.map((m) => ({
      id: m.id,
      body: m.body,
      createdAt: m.createdAt,
      mine: m.authorUserId === ctx.user.id,
      authorMembershipId: membershipByUser.get(m.authorUserId) ?? null,
      authorName: m.author.preferredName ?? m.author.name,
      authorAvatar: m.author.avatarKey,
      readByOthers: lastReadByOthers !== null && m.createdAt <= lastReadByOthers,
    })),
  };
}

export async function markConversationRead(ctx: ActiveContext, conversationId: string): Promise<void> {
  const { mine } = await assertParticipant(ctx, conversationId);
  await db.conversationParticipant.update({ where: { id: mine.id }, data: { lastReadAt: new Date() } });
}

export async function sendConversationMessage(
  ctx: ActiveContext,
  conversationId: string,
  body: string,
  opts: { clientId?: string } = {},
): Promise<{ messageId: string }> {
  const text = body.trim();
  if (!text) throw new AccessError("remarks.writeSomethingFirst");
  const { conversation, mine } = await assertParticipant(ctx, conversationId);

  // A replay from the offline outbox carries the clientId the device minted
  // before the message was queued. If that id already landed in this room,
  // the answer is the message that landed — not a twin, and nobody is told
  // twice. Checked before the write and again on the unique violation,
  // because two replays can race.
  if (opts.clientId) {
    const landed = await findLanded(conversationId, opts.clientId);
    if (landed) return { messageId: landed };
  }

  // `$tenantTransaction`, never `$transaction`: the plain form opens a
  // transaction nothing has bound `app.school_ids` on, and the policy then
  // refuses every statement inside it as zero rows. See db.ts.
  let message: { id: string; createdAt: Date };
  try {
    message = await db.$tenantTransaction(async (rawTx: unknown) => {
      const tx = rawTx as typeof db;
      const created = await tx.conversationMessage.create({
        data: { conversationId, schoolId: conversation.schoolId, authorUserId: ctx.user.id, body: text, clientId: opts.clientId ?? null },
        select: { id: true, createdAt: true },
      });
      await tx.conversation.update({ where: { id: conversationId }, data: { lastMessageAt: created.createdAt } });
      await tx.conversationParticipant.update({ where: { id: mine.id }, data: { lastReadAt: created.createdAt } });
      return created;
    });
  } catch (error) {
    const code = (error as { code?: string } | null)?.code;
    if (opts.clientId && code === "P2002") {
      const landed = await findLanded(conversationId, opts.clientId);
      if (landed) return { messageId: landed };
    }
    throw error;
  }

  const senderName = ctx.user.preferredName ?? ctx.user.name;
  const others = conversation.participants.filter((p) => p.userId !== ctx.user.id);
  await Promise.all(
    others.map((p) =>
      notify({
        userId: p.userId,
        schoolId: conversation.schoolId,
        kind: "REMARK",
        titleKey: "notif.newMessageFrom",
        titleVars: { name: senderName },
        body: text.slice(0, 140),
        url: `/remarks/c/${conversationId}`,
        meta: { conversationId },
      }),
    ),
  );
  publish(
    others.map((p) => channel.user(p.userId)).concat(channel.user(ctx.user.id)),
    { type: "conversation.message", conversationId },
  );

  await audit({
    schoolId: conversation.schoolId,
    actorUserId: ctx.user.id,
    action: "conversation.message",
    targetType: "Conversation",
    targetId: conversationId,
    meta: { length: text.length },
  });

  return { messageId: message.id };
}

async function findLanded(conversationId: string, clientId: string): Promise<string | null> {
  const row = await db.conversationMessage.findUnique({
    where: { conversationId_clientId: { conversationId, clientId } },
    select: { id: true },
  });
  return row?.id ?? null;
}
