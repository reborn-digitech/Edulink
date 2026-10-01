import "server-only";
import type { Prisma } from "@prisma/client";
import type { SearchHit, SearchResults } from "@edulink/contracts";
import { db } from "./db";
import type { ActiveContext } from "./session";
import { listFeed } from "./bulletin";
import { readerIsFixture } from "./fixtures";
import { NAV, QUICK_ACTIONS } from "./nav";
import { ROLE_META, type Role } from "./constants";
import { getT } from "./i18n/server";
import type { Translate } from "./i18n/dictionary";

/**
 * One search across what a person may already see.
 *
 * NOTHING IS INDEXED AND NOTHING IS WIDENED. Every group is one bounded
 * ILIKE query (`contains`, `mode: "insensitive"`, `take`) with the same
 * fence the page for that thing already draws: the office and the head see
 * the school, a teacher the pupils of the classes they teach and the staff
 * room, a guardian their own children, a pupil nobody. Posts go through
 * `listFeed`, so the bulletin's visibility rule is the search's rule too,
 * and papers (exams, certificates, report cards) repeat the reader rule of
 * their own libraries (`mayRead` in certificates.ts and report-cards.ts,
 * `dateSheetsFor` in exams.ts) as a WHERE clause rather than a check per
 * row. The groups run in parallel. Postgres scopes every query to the
 * session's schools underneath (RLS); the clauses here are what keeps a
 * teacher from reading another class's roll inside their own school.
 *
 * Every hit carries the web path and the phone's screen, so neither client
 * decides where a kind of thing opens.
 */

const STAFF: string[] = ["ADMIN", "PRINCIPAL", "TEACHER"];

/** A `contains` on a text column, case-insensitively. */
function like(q: string): Prisma.StringFilter {
  return { contains: q, mode: "insensitive" };
}

/** The query as a URL segment of a phone route. */
function params(values: Record<string, string | null | undefined>): string {
  const parts = Object.entries(values)
    .filter((entry): entry is [string, string] => typeof entry[1] === "string" && entry[1] !== "")
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`);
  return parts.length ? `?${parts.join("&")}` : "";
}

/** The ids of every child a guardian actively guards, at any school. */
async function childrenOf(userId: string): Promise<string[]> {
  const rows = await db.guardianship.findMany({ where: { parentUserId: userId, status: "ACTIVE" }, select: { studentMembershipId: true } });
  return rows.map((r) => r.studentMembershipId);
}

/* -------------------------------------------------------------------------- */
/* People                                                                      */
/* -------------------------------------------------------------------------- */

async function searchPeople(ctx: ActiveContext, q: string, limit: number, t: Translate): Promise<SearchHit[]> {
  const { role, schoolId, membershipId, user } = ctx;
  const nameMatch: Prisma.UserWhereInput = { OR: [{ name: like(q) }, { preferredName: like(q) }] };
  let where: Prisma.MembershipWhereInput;
  // The class a pupil row names: for a teacher, one of the teacher's own.
  let classFence: Prisma.ClassWhereInput = {};

  if ((role === "ADMIN" || role === "PRINCIPAL") && schoolId) {
    where = { schoolId, status: "ACTIVE", leftAt: null };
  } else if (role === "TEACHER" && schoolId && membershipId) {
    classFence = { teachers: { some: { teacherMembershipId: membershipId } } };
    where = {
      schoolId,
      status: "ACTIVE",
      leftAt: null,
      OR: [{ role: { in: STAFF } }, { role: "STUDENT", enrollments: { some: { status: "ACTIVE", class: classFence } } }],
    };
  } else if (role === "PARENT") {
    const children = await childrenOf(user.id);
    if (children.length === 0) return [];
    where = { id: { in: children }, role: "STUDENT" };
  } else {
    // A pupil searches no people; an expert has no school to search.
    return [];
  }

  // A real school's search never lists the test people (fixtures.ts); a
  // guardian's own children are theirs whatever the flag says.
  const fixtureReader = role === "PARENT" ? true : await readerIsFixture(schoolId);
  const rows = await db.membership.findMany({
    where: { ...where, user: fixtureReader ? nameMatch : { ...nameMatch, isTestFixture: false } },
    select: {
      id: true,
      role: true,
      title: true,
      subjects: true,
      user: { select: { name: true, preferredName: true } },
      enrollments: { where: { status: "ACTIVE", class: classFence }, select: { classId: true, class: { select: { name: true } } }, take: 1 },
    },
    orderBy: [{ role: "asc" }, { user: { name: "asc" } }],
    take: limit,
  });

  return rows.map((m) => {
    const memberRole = m.role as Role;
    const roleLabel = ROLE_META[memberRole] ? t(ROLE_META[memberRole].labelKey) : m.role;
    const enrolment = m.enrollments[0];
    const name = m.user.preferredName ?? m.user.name;
    const detail = memberRole === "STUDENT" ? enrolment?.class.name ?? null : m.title ?? null;
    return {
      kind: "people" as const,
      id: m.id,
      title: name,
      subtitle: [roleLabel, detail].filter(Boolean).join(" · "),
      href: `/people/${m.id}`,
      phoneRoute: personRoute(role, memberRole, m.id, name, enrolment?.classId ?? null),
    };
  });
}

/**
 * Where a name opens on the phone, which has no one person page: the
 * office's person screen; for a teacher or the head a pupil's class and
 * the staff list; for a guardian the child's record.
 */
function personRoute(viewer: Role | null, memberRole: Role, membershipId: string, name: string, classId: string | null): string | null {
  if (viewer === "ADMIN") return `/(app)/person${params({ membershipId, name, role: memberRole })}`;
  if (viewer === "PRINCIPAL" || viewer === "TEACHER") {
    if (memberRole === "STUDENT") return classId ? `/(app)/classes/detail${params({ classId })}` : "/(app)/classes";
    return viewer === "PRINCIPAL" ? "/(app)/staff" : "/(app)/people";
  }
  if (viewer === "PARENT") return `/(app)/record${params({ childId: membershipId })}`;
  return null;
}

/* -------------------------------------------------------------------------- */
/* Posts                                                                       */
/* -------------------------------------------------------------------------- */

async function searchPosts(ctx: ActiveContext, q: string, limit: number): Promise<SearchHit[]> {
  if (ctx.role === "EXPERT") return [];
  const posts = await listFeed(ctx, { q, schoolId: ctx.schoolId });
  return posts.slice(0, limit).map((post) => ({
    kind: "posts" as const,
    id: post.id,
    title: post.title || post.body.slice(0, 80),
    subtitle: [post.authorName, post.className].filter(Boolean).join(" · ") || null,
    href: `/bulletin/${post.id}`,
    phoneRoute: `/(app)/post${params({ postId: post.id })}`,
  }));
}

/* -------------------------------------------------------------------------- */
/* Messages — rooms the reader is in, threads about a pupil they stand with    */
/* -------------------------------------------------------------------------- */

async function searchMessages(ctx: ActiveContext, q: string, limit: number, t: Translate): Promise<SearchHit[]> {
  const { role, schoolId, membershipId, user } = ctx;
  if (role === "EXPERT") return [];

  // Threads: the same four branches as remarks.ts `listThreads`.
  let threadWhere: Prisma.RemarkThreadWhereInput | null = null;
  if (role === "TEACHER" && schoolId && membershipId) threadWhere = { schoolId, teacherMembershipId: membershipId };
  else if ((role === "ADMIN" || role === "PRINCIPAL") && schoolId) threadWhere = { schoolId };
  else if (role === "STUDENT" && schoolId && membershipId) threadWhere = { schoolId, studentMembershipId: membershipId };
  else if (role === "PARENT") {
    const children = await childrenOf(user.id);
    threadWhere = children.length ? { studentMembershipId: { in: children } } : null;
  }

  // Rooms: the ones this person is a participant of, at the school (a
  // guardian's rooms are at their children's schools, as conversations.ts says).
  const roomSchools: Prisma.ConversationWhereInput = role === "PARENT" ? {} : schoolId ? { schoolId } : { id: "" };

  const [threads, rooms] = await Promise.all([
    threadWhere
      ? db.remarkThread.findMany({
          where: { ...threadWhere, OR: [{ subject: like(q) }, { messages: { some: { body: like(q) } } }, { student: { user: { name: like(q) } } }] },
          select: {
            id: true,
            subject: true,
            student: { select: { user: { select: { name: true, preferredName: true } } } },
            messages: { orderBy: { createdAt: "desc" }, take: 1, select: { body: true } },
          },
          orderBy: { lastMessageAt: "desc" },
          take: limit,
        })
      : Promise.resolve([]),
    db.conversation.findMany({
      where: {
        ...roomSchools,
        participants: { some: { userId: user.id } },
        OR: [{ messages: { some: { body: like(q) } } }, { participants: { some: { userId: { not: user.id }, user: { OR: [{ name: like(q) }, { preferredName: like(q) }] } } } }],
      },
      select: {
        id: true,
        participants: { where: { userId: { not: user.id } }, select: { user: { select: { name: true, preferredName: true } } } },
        messages: { orderBy: { createdAt: "desc" }, take: 1, select: { body: true } },
      },
      orderBy: { lastMessageAt: "desc" },
      take: limit,
    }),
  ]);

  const hits: SearchHit[] = [
    ...threads.map((thread) => ({
      kind: "messages" as const,
      id: thread.id,
      title: thread.subject,
      subtitle: [thread.student.user.preferredName ?? thread.student.user.name, thread.messages[0]?.body.slice(0, 100) ?? null].filter(Boolean).join(" · ") || null,
      href: `/remarks/${thread.id}`,
      phoneRoute: `/(app)/messages/thread${params({ threadId: thread.id })}`,
    })),
    ...rooms.map((room) => ({
      kind: "messages" as const,
      id: room.id,
      title: room.participants.map((p) => p.user.preferredName ?? p.user.name).join(", ") || t("search.conversation"),
      subtitle: room.messages[0]?.body.slice(0, 100) ?? null,
      href: `/remarks/c/${room.id}`,
      phoneRoute: `/(app)/messages/room${params({ conversationId: room.id })}`,
    })),
  ];
  return hits.slice(0, limit);
}

/* -------------------------------------------------------------------------- */
/* Papers — exams, certificates, report cards, by title                        */
/* -------------------------------------------------------------------------- */

async function searchPapers(ctx: ActiveContext, q: string, limit: number, t: Translate): Promise<SearchHit[]> {
  const { role, schoolId, membershipId, user } = ctx;
  if (role === "EXPERT" || !role) return [];
  const staff = STAFF.includes(role);
  const children = role === "PARENT" ? await childrenOf(user.id) : [];
  if (role === "PARENT" && children.length === 0) return [];
  if (role !== "PARENT" && (!schoolId || !membershipId)) return [];

  // Exams: the office every unarchived round, the rest the published ones;
  // a pupil's or a family's grades only (exams.ts `dateSheetsFor`).
  let examWhere: Prisma.ExamSeriesWhereInput | null;
  if (role === "ADMIN") examWhere = { schoolId: schoolId!, archivedAt: null };
  else if (staff) examWhere = { schoolId: schoolId!, archivedAt: null, publishedAt: { not: null } };
  else {
    const enrolments = await db.enrollment.findMany({
      where: role === "STUDENT" ? { studentMembershipId: membershipId!, status: "ACTIVE" } : { studentMembershipId: { in: children }, status: "ACTIVE" },
      select: { schoolId: true, class: { select: { gradeLevel: true } } },
    });
    const scopes = enrolments.filter((e) => e.class.gradeLevel !== null).map((e) => ({ schoolId: e.schoolId, gradeLevel: e.class.gradeLevel! }));
    examWhere = scopes.length ? { archivedAt: null, publishedAt: { not: null }, OR: scopes } : null;
  }

  // The teacher's fence for a pupil's paper: a class they teach.
  const taughtBy: Prisma.MembershipWhereInput = { enrollments: { some: { status: "ACTIVE", class: { teachers: { some: { teacherMembershipId: membershipId ?? "" } } } } } };
  const certWhere: Prisma.IssuedCertificateWhereInput =
    role === "ADMIN" || role === "PRINCIPAL"
      ? { schoolId: schoolId! }
      : role === "TEACHER"
        ? { schoolId: schoolId!, student: taughtBy }
        : role === "STUDENT"
          ? { studentMembershipId: membershipId! }
          : { studentMembershipId: { in: children } };
  const cardWhere: Prisma.ReportCardWhereInput =
    role === "ADMIN" || role === "PRINCIPAL"
      ? { schoolId: schoolId! }
      : role === "TEACHER"
        ? { schoolId: schoolId!, class: { teachers: { some: { teacherMembershipId: membershipId! } } } }
        : role === "STUDENT"
          ? { studentMembershipId: membershipId!, status: "PUBLISHED" }
          : { studentMembershipId: { in: children }, status: "PUBLISHED" };

  const [exams, certificates, cards] = await Promise.all([
    examWhere
      ? db.examSeries.findMany({ where: { ...examWhere, name: like(q) }, select: { id: true, name: true, gradeLevel: true, kind: true }, orderBy: { createdAt: "desc" }, take: limit })
      : Promise.resolve([]),
    db.issuedCertificate.findMany({
      where: { ...certWhere, OR: [{ title: like(q) }, { serial: like(q) }, { studentName: like(q) }] },
      select: { id: true, title: true, serial: true, studentName: true, student: { select: { user: { select: { name: true } } } } },
      orderBy: { issuedAt: "desc" },
      take: limit,
    }),
    db.reportCard.findMany({
      where: { ...cardWhere, OR: [{ title: like(q) }, { studentName: like(q) }, { student: { user: { name: like(q) } } }] },
      select: { id: true, title: true, classId: true, class: { select: { name: true } }, student: { select: { user: { select: { name: true, preferredName: true } } } } },
      orderBy: { createdAt: "desc" },
      take: limit,
    }),
  ]);

  const examHref = role === "ADMIN" ? "/admin/exams" : role === "TEACHER" ? "/teacher/exams" : "/exams";
  const examRoute = role === "TEACHER" ? "/(app)/marks" : "/(app)/exams";
  const hits: SearchHit[] = [
    ...exams.map((series) => ({
      kind: "papers" as const,
      id: series.id,
      title: series.name,
      subtitle: t("search.examOfGrade", { grade: series.gradeLevel }),
      href: examHref,
      phoneRoute: examRoute,
    })),
    ...certificates.map((cert) => ({
      kind: "papers" as const,
      id: cert.id,
      title: cert.title,
      subtitle: [cert.studentName ?? cert.student.user.name, cert.serial].join(" · "),
      href: `/certificates/${cert.id}`,
      phoneRoute: `/(app)/certificate${params({ id: cert.id })}`,
    })),
    ...cards.map((card) => ({
      kind: "papers" as const,
      id: card.id,
      title: card.title,
      subtitle: [card.student.user.preferredName ?? card.student.user.name, card.class.name].join(" · "),
      href: `/report-cards/${card.id}`,
      phoneRoute: staff ? `/(app)/report-cards${params({ classId: card.classId })}` : `/(app)/exams${params({ cardId: card.id })}`,
    })),
  ];
  return hits.slice(0, limit);
}

/* -------------------------------------------------------------------------- */
/* Pages — the role's menu, for the phone (the web palette filters its own)    */
/* -------------------------------------------------------------------------- */

function searchPages(ctx: ActiveContext, q: string, limit: number, t: Translate): SearchHit[] {
  const role = ctx.role;
  if (!role) return [];
  const needle = q.toLowerCase();
  const entries = [
    ...QUICK_ACTIONS[role].map((a) => ({ href: a.href, label: t(a.labelKey), description: t(a.descriptionKey) as string | null })),
    ...NAV[role].map((n) => ({ href: n.href, label: t(n.labelKey), description: null as string | null })),
  ];
  const seen = new Set<string>();
  const hits: SearchHit[] = [];
  for (const entry of entries) {
    if (seen.has(entry.href)) continue;
    if (!entry.label.toLowerCase().includes(needle) && !entry.description?.toLowerCase().includes(needle) && !entry.href.toLowerCase().includes(needle)) continue;
    seen.add(entry.href);
    hits.push({ kind: "pages", id: entry.href, title: entry.label, subtitle: entry.description, href: entry.href, phoneRoute: null });
    if (hits.length >= limit) break;
  }
  return hits;
}

/* -------------------------------------------------------------------------- */
/* The whole                                                                   */
/* -------------------------------------------------------------------------- */

export async function searchEverything(ctx: ActiveContext, opts: { q: string; limit: number }): Promise<SearchResults> {
  const q = opts.q.trim();
  const limit = Math.max(1, Math.min(50, opts.limit));
  const t = await getT();
  const [people, posts, messages, papers] = await Promise.all([
    searchPeople(ctx, q, limit, t),
    searchPosts(ctx, q, limit),
    searchMessages(ctx, q, limit, t),
    searchPapers(ctx, q, limit, t),
  ]);
  return { q, people, posts, messages, papers, pages: searchPages(ctx, q, limit, t) };
}
