import { waitingJoins } from "@/lib/join-requests";
import { waitingClaimsForGuardian, waitingClaimsForOffice } from "@/lib/guardian-claims";
import "server-only";
import { db } from "@/lib/db";
import { AccessError, assertGuardianAccess } from "@/lib/tenancy";
import { getSession, listContexts, type ActiveContext } from "@/lib/session";
import { getLocale, getT } from "@/lib/i18n/server";
import { localiseVars } from "@/lib/notice-dates";
import type { Translate, TranslationKey } from "@/lib/i18n/dictionary";
import { readJson, readJsonArray, type MediaItem } from "@/lib/json";
import { NOTIFICATION_KINDS, POST_CATEGORIES, type NotificationKind, type PostCategory, type PostStatus, type Role } from "@/lib/constants";
import { ackReport, getPost, heldCommentCount, heldComments, listFeed, parentBulletinSchools, pendingCount, type AckGroup } from "@/lib/bulletin";
import { globalReader, listGlobalFeed } from "@/lib/global-feed";
import { conversationSchools, listConversations, peopleToMessage } from "@/lib/conversations";
import { listThreads } from "@/lib/remarks";
import { getCompetition, leaderboard, listCompetitions, pendingConsents } from "@/lib/competitions";
import { listMentorRequests, listMentorships } from "@/lib/mentoring";
import {
  closedYearsForPupil,
  listClosedYears,
  pupilYearArchive,
  schoolYearArchive,
  teacherYearArchive,
  type ArchiveYear,
} from "@/lib/year-archive";

/**
 * The reads behind /api/v1/shared that a page computed inline — the bulletin
 * page's school picker and pending count, the notifications page's three
 * queries, the archive page's role branch — reproduced here with the same
 * guards, so the handler is a parse and a call. Where the page reads a lib
 * function directly the handler calls that function itself.
 */

const iso = (d: Date) => d.toISOString();
const isoOrNull = (d: Date | null) => (d ? d.toISOString() : null);

/**
 * In-memory cursor paging over a list the lib already caps (the feed takes
 * 100, the global feed likewise). The cursor is the last id the client saw;
 * an id no longer in the list starts again from the top rather than erroring,
 * because a post that vanished between two scrolls is not the client's fault.
 */
export function sliceAfter<T extends { id: string }>(items: T[], cursor: string | undefined, limit: number) {
  const start = cursor ? items.findIndex((item) => item.id === cursor) + 1 : 0;
  const page = items.slice(start, start + limit);
  const last = page[page.length - 1];
  return { items: page, nextCursor: last && start + limit < items.length ? last.id : null };
}

/* -------------------------------------------------------------------------- */
/* Guards                                                                      */
/* -------------------------------------------------------------------------- */

/** The route-handler shape of `requireUser`: 401 rather than a redirect. */
export async function requireApiSession(): Promise<ActiveContext> {
  const ctx = await getSession();
  if (!ctx) throw new AccessError("access.notSignedIn", "UNAUTHENTICATED");
  return ctx;
}

/**
 * The route-handler shape of `requireExpert`: the role alone is not enough,
 * a PUBLISHED profile must exist — an accepted-but-uncurated expert has no
 * expert area, on the web or here.
 */
export async function requireApiExpert(): Promise<ActiveContext & { expertProfileId: string }> {
  const ctx = await requireApiSession();
  if (ctx.role !== "EXPERT") throw new AccessError("access.notAnExpert");
  const profile = await db.expertProfile.findUnique({ where: { userId: ctx.user.id }, select: { id: true, publishedAt: true } });
  if (!profile) throw new AccessError("access.noExpertProfile", "NOT_FOUND");
  if (!profile.publishedAt) throw new AccessError("access.notAnExpert");
  return { ...ctx, expertProfileId: profile.id };
}

/* -------------------------------------------------------------------------- */
/* Bulletin                                                                    */
/* -------------------------------------------------------------------------- */

/** A mangled category is nobody's filter; ignore it rather than 422, as the page does. */
export function asCategory(raw: string | null | undefined): PostCategory | undefined {
  return POST_CATEGORIES.includes(raw as PostCategory) ? (raw as PostCategory) : undefined;
}

export async function readBulletinFeed(
  ctx: ActiveContext,
  opts: { filter?: string; tag?: string; school?: string; category?: PostCategory; q?: string; cursor?: string; limit: number },
) {
  const parentSchools = await parentBulletinSchools(ctx);
  const activeSchoolId = ctx.schoolId ?? (parentSchools.find((s) => s.id === opts.school)?.id ?? parentSchools[0]?.id ?? null);
  const filter = opts.filter === "pending" || opts.filter === "mine" ? opts.filter : null;
  if (!activeSchoolId) {
    return { schoolId: null, schoolName: null, schools: parentSchools, filter, pendingCount: 0, heldCommentCount: 0, items: [], nextCursor: null };
  }
  const isStaff = ctx.role === "ADMIN" || ctx.role === "TEACHER";
  const showPending = filter === "pending" && isStaff;
  const [posts, queue, held, school] = await Promise.all([
    listFeed(ctx, {
      tag: opts.tag,
      status: showPending ? ("PENDING" as PostStatus) : undefined,
      mineOnly: filter === "mine",
      schoolId: activeSchoolId,
      category: opts.category,
      q: opts.q,
    }),
    pendingCount(ctx),
    heldCommentCount(ctx),
    db.school.findUniqueOrThrow({ where: { id: activeSchoolId }, select: { name: true } }),
  ]);
  const page = sliceAfter(posts, opts.cursor, opts.limit);
  return {
    schoolId: activeSchoolId,
    schoolName: school.name,
    schools: parentSchools,
    filter,
    pendingCount: queue,
    heldCommentCount: held,
    items: page.items.map((post) => ({ ...post, createdAt: iso(post.createdAt) })),
    nextCursor: page.nextCursor,
  };
}

/**
 * The global feed's door, as the page splits it: a guardian through the
 * guard shaped for them (an active guardianship), everyone else through the
 * school roles — which leaves an expert outside, as on the web.
 */
export async function readGlobalFeed(
  ctx: ActiveContext,
  opts: { category?: PostCategory; q?: string; tag?: string; cursor?: string; limit: number },
) {
  if (ctx.role === "PARENT") {
    const hasChild = await db.guardianship.findFirst({ where: { parentUserId: ctx.user.id, status: "ACTIVE" }, select: { id: true } });
    if (!hasChild) throw new AccessError("access.wrongRoleForThisAction");
  } else {
    // Every role of a school or a college reads it; an expert or a recruiter does not (global-feed.ts globalReader).
    if (!globalReader(ctx.role)) throw new AccessError("access.wrongRoleForThisAction");
    if (!ctx.schoolId || !ctx.membershipId) throw new AccessError("access.noActiveSchoolSelected");
  }
  const posts = await listGlobalFeed(ctx, { category: opts.category, q: opts.q, tag: opts.tag });
  const page = sliceAfter(posts, opts.cursor, opts.limit);
  return { items: page.items.map((post) => ({ ...post, createdAt: iso(post.createdAt) })), nextCursor: page.nextCursor };
}

/** Everybody waiting on the reader for a yes: joins by code, and claims to be a child's guardian. */
export async function readWaitingQueue(ctx: ActiveContext) {
  const [joins, claims] = await Promise.all([
    waitingJoins(ctx),
    ctx.role === "PARENT" ? waitingClaimsForGuardian(ctx.user.id) : waitingClaimsForOffice(ctx),
  ]);
  return {
    // The queue's row without the class's id: the contract names the class and nothing else of it.
    joins: joins.map((join) => ({ id: join.id, name: join.name, age: join.age, via: join.via, className: join.className, onRoll: join.onRoll, createdAt: iso(join.createdAt) })),
    claims: claims.map((claim) => ({ ...claim, createdAt: iso(claim.createdAt) })),
  };
}

/** The comments waiting on the reader — empty for anybody who reviews nothing. */
export async function readHeldComments(ctx: ActiveContext) {
  const rows = await heldComments(ctx);
  return { items: rows.map((row) => ({ ...row, createdAt: iso(row.createdAt) })) };
}

export async function readPost(ctx: ActiveContext, postId: string) {
  const post = await getPost(ctx, postId);
  const isStaff = ctx.role === "ADMIN" || ctx.role === "TEACHER";
  const reactions: Record<string, number> = {};
  const myReactions: string[] = [];
  for (const reaction of post.reactions) {
    reactions[reaction.kind] = (reactions[reaction.kind] ?? 0) + 1;
    if (reaction.userId === ctx.user.id) myReactions.push(reaction.kind);
  }
  let ackGroups: AckGroup[] = [];
  if (isStaff && post.requiresAck && post.status === "APPROVED") {
    try {
      ackGroups = await ackReport(ctx, post.id);
    } catch {
      // A teacher with no classes simply gets no breakdown.
    }
  }
  return {
    id: post.id,
    scope: post.scope,
    category: post.category,
    font: post.font,
    title: post.title,
    body: post.body,
    tags: readJsonArray<string>(post.tags),
    media: readJsonArray<MediaItem>(post.media),
    status: post.status,
    rejectionReason: post.rejectionReason,
    pinned: post.pinnedAt !== null,
    createdAt: iso(post.createdAt),
    schoolId: post.schoolId,
    className: post.class?.name ?? null,
    audience: post.audience,
    audienceGrade: post.audienceGrade,
    requiresAck: post.requiresAck,
    canAck: post.canAck,
    // A permission slip's question and its last day (5 Oct 2026, permission-slips.ts).
    consentQuestion: post.consentQuestion ?? null,
    consentBy: post.consentBy ?? null,
    acked: post.acks.length > 0,
    ackCount: post._count.acks,
    author: {
      id: post.author.id,
      name: post.author.preferredName ?? post.author.name,
      avatarKey: post.author.avatarKey,
      membershipId: post.membershipByUser.get(post.author.id) ?? null,
      role: (post.authorship?.role as Role | undefined) ?? null,
      batch: post.authorBatch,
    },
    reactions,
    myReactions,
    // addComment owns the rule: a pupil's comment is held, and on the cross-school feed everybody's is.
    commentsWillBeHeld: ctx.role === "STUDENT" || (ctx.role === "ALUMNUS" && ctx.user.isMinor) || post.scope === "GLOBAL",
    comments: post.comments.map((entry) => ({
      id: entry.id,
      body: entry.body,
      status: entry.status,
      parentCommentId: entry.parentCommentId,
      createdAt: iso(entry.createdAt),
      mine: entry.authorUserId === ctx.user.id,
      canReview: post.reviewableCommentIds.has(entry.id),
      author: {
        id: entry.author.id,
        name: entry.author.preferredName ?? entry.author.name,
        avatarKey: entry.author.avatarKey,
        membershipId: post.membershipByUser.get(entry.author.id) ?? null,
        // The tag (3 Oct 2026): Student, Alumni with the year, or a staff role.
        role: post.tagByUser.get(entry.author.id)?.role ?? null,
        batch: post.tagByUser.get(entry.author.id)?.batch ?? null,
      },
    })),
    ackReport: ackGroups,
  };
}

/* -------------------------------------------------------------------------- */
/* Inbox                                                                       */
/* -------------------------------------------------------------------------- */

export async function readInbox(ctx: ActiveContext, opts: { q?: string; unreadOnly?: boolean }) {
  const q = opts.q?.trim().toLowerCase() ?? "";
  const unreadOnly = Boolean(opts.unreadOnly);
  const [conversations, threads] = await Promise.all([listConversations(ctx), listThreads(ctx)]);
  const shownConversations = conversations.filter(
    (c) =>
      (!unreadOnly || c.unread) &&
      (!q || c.others.some((o) => o.name.toLowerCase().includes(q)) || c.preview.toLowerCase().includes(q)),
  );
  const shownThreads = threads.filter(
    (th) =>
      (!unreadOnly || th.unread) &&
      (!q || th.subject.toLowerCase().includes(q) || th.studentName.toLowerCase().includes(q) || th.teacherName.toLowerCase().includes(q)),
  );
  return {
    conversations: shownConversations.map((c) => ({ ...c, lastMessageAt: iso(c.lastMessageAt) })),
    threads: shownThreads.map((th) => ({ ...th, lastMessageAt: iso(th.lastMessageAt) })),
    unreadTotal: conversations.filter((c) => c.unread).length + threads.filter((th) => th.unread).length,
  };
}

/** The people picker: the caller's schools, and everyone they may write to at one of them. */
export async function readPeople(ctx: ActiveContext, opts: { school?: string; q?: string }) {
  const schoolIds = await conversationSchools(ctx);
  if (schoolIds.length === 0) throw new AccessError("access.noActiveSchoolSelected");
  const schoolId = schoolIds.includes(opts.school ?? "") ? (opts.school as string) : schoolIds[0]!;
  const [schools, people] = await Promise.all([
    schoolIds.length > 1
      ? db.school.findMany({ where: { id: { in: schoolIds } }, select: { id: true, name: true }, orderBy: { name: "asc" } })
      : Promise.resolve([]),
    peopleToMessage(ctx, schoolId, opts.q ?? ""),
  ]);
  return { schoolId, schools, people };
}

/* -------------------------------------------------------------------------- */
/* Notifications                                                               */
/* -------------------------------------------------------------------------- */

/** A stored notification's sentence, said again in today's language when it has a key. */
function sayAgain(t: Translate, key: string | null, vars: string, fallback: string, locale?: string): string {
  if (!key) return fallback;
  // A date kept as a date (noticeDate, B-15) is said in the reader's language of today with the rest.
  const rendered = t(key as TranslationKey, localiseVars(readJson<Record<string, string | number>>(vars, {}), locale));
  return rendered && rendered !== key ? rendered : fallback;
}

export function asNotificationKind(raw: string | null | undefined): NotificationKind | undefined {
  return NOTIFICATION_KINDS.includes(raw as NotificationKind) ? (raw as NotificationKind) : undefined;
}

export async function listNotifications(
  ctx: ActiveContext,
  opts: { unreadOnly?: boolean; kind?: NotificationKind; cursor?: string; limit: number },
) {
  const t = await getT();
  const locale = await getLocale();
  const where = { userId: ctx.user.id, ...(opts.unreadOnly ? { readAt: null } : {}), ...(opts.kind ? { kind: opts.kind } : {}) };
  // The cursor is a notification id; one that is not this person's (or is gone)
  // starts from the top rather than erroring or paging from a stranger's row.
  const anchor = opts.cursor ? await db.notification.findFirst({ where: { id: opts.cursor, userId: ctx.user.id }, select: { id: true } }) : null;
  const [rows, unreadCount, totalCount] = await Promise.all([
    db.notification.findMany({
      where,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: opts.limit + 1,
      ...(anchor ? { cursor: { id: anchor.id }, skip: 1 } : {}),
    }),
    db.notification.count({ where: { userId: ctx.user.id, readAt: null } }),
    db.notification.count({ where: { userId: ctx.user.id } }),
  ]);
  const page = rows.slice(0, opts.limit);
  return {
    items: page.map((row) => ({
      id: row.id,
      kind: row.kind,
      title: sayAgain(t, row.titleKey, row.titleVars, row.title, locale),
      body: sayAgain(t, row.bodyKey, row.bodyVars, row.body, locale),
      url: row.url,
      read: row.readAt !== null,
      createdAt: iso(row.createdAt),
    })),
    nextCursor: rows.length > opts.limit ? page[page.length - 1]!.id : null,
    unreadCount,
    totalCount,
  };
}

/**
 * Scoped by the session's userId, so somebody else's id matches nothing —
 * and "nothing" is answered as not found, never as "that exists but is not yours".
 */
export async function markNotificationRead(ctx: ActiveContext, id: string): Promise<void> {
  const own = await db.notification.findFirst({ where: { id, userId: ctx.user.id }, select: { id: true } });
  if (!own) throw new AccessError("notFound.title", "NOT_FOUND");
  await db.notification.updateMany({ where: { id, userId: ctx.user.id, readAt: null }, data: { readAt: new Date() } });
}

export async function markAllNotificationsRead(ctx: ActiveContext): Promise<number> {
  const result = await db.notification.updateMany({ where: { userId: ctx.user.id, readAt: null }, data: { readAt: new Date() } });
  return result.count;
}

/* -------------------------------------------------------------------------- */
/* Competitions                                                                */
/* -------------------------------------------------------------------------- */

function summaryOut<T extends { registrationClosesAt: Date | null; startsAt: Date | null; endsAt: Date | null; entry: { consentedAt: Date | null } | null }>(c: T) {
  return {
    ...c,
    registrationClosesAt: isoOrNull(c.registrationClosesAt),
    startsAt: isoOrNull(c.startsAt),
    endsAt: isoOrNull(c.endsAt),
    entry: c.entry ? { ...c.entry, consentedAt: isoOrNull(c.entry.consentedAt) } : null,
  };
}

const waitingOut = (rows: Awaited<ReturnType<typeof pendingConsents>>) => rows.map((w) => ({ ...w, closesAt: isoOrNull(w.closesAt) }));

export async function readCompetitions(ctx: ActiveContext, opts: { openOnly: boolean; subject?: string }) {
  const [{ school, platform }, waiting] = await Promise.all([listCompetitions(ctx, { openOnly: opts.openOnly }), pendingConsents(ctx)]);
  const keep = (c: { subject: string | null }) => !opts.subject || c.subject === opts.subject;
  return { school: school.filter(keep).map(summaryOut), platform: platform.filter(keep).map(summaryOut), waiting: waitingOut(waiting) };
}

export async function readCompetition(ctx: ActiveContext, competitionId: string) {
  const competition = await getCompetition(ctx, competitionId);
  const [waiting, board] = await Promise.all([pendingConsents(ctx), leaderboard(ctx, competition.id)]);
  return {
    ...summaryOut(competition),
    waiting: waitingOut(waiting.filter((w) => w.competitionId === competition.id)),
    board,
  };
}

/* -------------------------------------------------------------------------- */
/* Mentoring                                                                   */
/* -------------------------------------------------------------------------- */

export async function readMentoring(ctx: ActiveContext, opts: { status?: string }) {
  const reviews = ctx.role === "ADMIN" || ctx.role === "PRINCIPAL";
  const [threads, requests] = await Promise.all([listMentorships(ctx), reviews ? listMentorRequests(ctx) : Promise.resolve([])]);
  const statusFilter = opts.status === "ACTIVE" || opts.status === "CLOSED" || opts.status === "REQUESTED" ? opts.status : null;
  return {
    threads: statusFilter ? threads.filter((t) => t.status === statusFilter) : threads,
    requests: requests.map((r) => ({ ...r, askedAt: iso(r.askedAt) })),
  };
}

/* -------------------------------------------------------------------------- */
/* The year archive                                                            */
/* -------------------------------------------------------------------------- */

const yearOut = (y: ArchiveYear) => ({ id: y.id, name: y.name, startDate: iso(y.startDate), endDate: iso(y.endDate), closedAt: iso(y.closedAt) });

/**
 * The archive page's role branch, verbatim: a guardian reads a child's
 * years, a pupil their own, a teacher their classes', the office the
 * school's. Each slice is asserted again inside year-archive.ts.
 */
export async function readArchive(ctx: ActiveContext, opts: { year?: string; child?: string }) {
  let schoolId: string | null = null;
  let pupilMembershipId: string | null = null;
  let children: { studentMembershipId: string; name: string; schoolId: string }[] = [];
  if (ctx.role === "PARENT") {
    const contexts = await listContexts(ctx.user.id);
    children = contexts.children.map((c) => ({ studentMembershipId: c.studentMembershipId, name: c.name, schoolId: c.schoolId }));
    if (children.length === 0) throw new AccessError("access.wrongRoleForThisAction");
    const selected = children.find((c) => c.studentMembershipId === opts.child) ?? children[0]!;
    schoolId = selected.schoolId;
    pupilMembershipId = selected.studentMembershipId;
    // The same door every other guardian read goes through.
    await assertGuardianAccess(ctx.user.id, pupilMembershipId);
  } else if (ctx.role === "STUDENT") {
    schoolId = ctx.schoolId;
    pupilMembershipId = ctx.membershipId;
  } else if (ctx.role === "TEACHER" || ctx.role === "ADMIN" || ctx.role === "PRINCIPAL") {
    schoolId = ctx.schoolId;
  } else {
    throw new AccessError("access.wrongRoleForThisAction");
  }
  if (!schoolId) throw new AccessError("access.noActiveSchoolSelected");

  const [years, school] = await Promise.all([
    pupilMembershipId ? closedYearsForPupil(schoolId, pupilMembershipId) : listClosedYears(schoolId),
    db.school.findUniqueOrThrow({ where: { id: schoolId }, select: { name: true, timezone: true } }),
  ]);
  const base = { schoolId, schoolName: school.name, timezone: school.timezone, children, child: pupilMembershipId, years: years.map(yearOut) };
  if (years.length === 0) return { ...base, selected: null };

  // A year asked for that is not on this reader's shelf is a 404, not the first year.
  const year = opts.year ? years.find((y) => y.id === opts.year) : years[0];
  if (!year) throw new AccessError("access.academicYearNotFound", "NOT_FOUND");

  if (pupilMembershipId) {
    const pupil = await pupilYearArchive(ctx, pupilMembershipId, year.id);
    return {
      ...base,
      selected: {
        year: yearOut(year),
        pupil: { ...pupil, reportCards: pupil.reportCards.map((r) => ({ ...r, publishedAt: isoOrNull(r.publishedAt) })) },
        teacher: null,
        school: null,
      },
    };
  }
  if (ctx.role === "TEACHER") {
    return { ...base, selected: { year: yearOut(year), pupil: null, teacher: await teacherYearArchive(ctx, year.id), school: null } };
  }
  return { ...base, selected: { year: yearOut(year), pupil: null, teacher: null, school: await schoolYearArchive(ctx, year.id) } };
}
