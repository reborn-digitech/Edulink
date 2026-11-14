import "server-only";
import type { TranslationKey } from "@/lib/i18n/dictionary";
import { db } from "./db";
import { audit } from "./audit";
import { AccessError } from "./tenancy";
import { withSchoolAccess } from "./superuser";
import { syncStandinsHeldBy, syncStandinsForTeacherClasses } from "./standin-guardian";
import { takeDownProfileOf } from "./faculty-profile";
import type { ActiveContext } from "./session";

/**
 * What whoever runs the server can see and do inside a school they have opened.
 *
 * EVERY FUNCTION HERE GOES THROUGH `withSchoolAccess`, which is the only door.
 * Access is always on for whoever runs the server — there is no grant to ask
 * for any more — but the door still records every visit where the school can
 * read it, and then binds that ONE school, so the ordinary tenant policies
 * govern the operator exactly as they govern that school's admin. There is no
 * policy anywhere saying "a superuser may read grades"; what exists is a school
 * being bound, deliberately and visibly.
 *
 * SO THE SCHOOL NEXT DOOR STAYS INVISIBLE. That is not a claim about this file's
 * WHERE clauses — it is the same `schoolId = ANY(app.school_ids)` predicate that
 * protects every school from every other one, and `npm run rls:verify` proves it
 * for this case specifically.
 *
 * WHAT IS DELIBERATELY NOT HERE:
 *
 *   READING MESSAGES. RemarkThread and MentorMessage are private conversations
 *   between a parent, a teacher and a child, and the whole of the rest of this
 *   codebase treats them as the most protected thing in it. An operator
 *   investigating a report needs to see what was PUBLISHED, and a school's own
 *   Safety Centre is the right route to a private thread — through the school,
 *   with the school knowing.
 *
 *   DELETING A PERSON. Suspension is reversible, is audited, and is enough to
 *   stop somebody immediately, which is what an urgent case needs. Ending an
 *   account permanently is the school's decision about its own member, and an
 *   operator who genuinely must has `psql` — the honest limit, stated, rather
 *   than a button that pretends the boundary is somewhere it is not.
 *
 *   CHANGING MARKS, ATTENDANCE OR REPORT CARDS. Nothing here writes to a
 *   child's record. An operator who could quietly alter a grade would make
 *   every grade in the system arguable.
 */

export type SchoolOverview = {
  members: { role: string; status: string; count: number }[];
  classes: number;
  pendingPosts: number;
  openReports: number;
};

/**
 * Every READ the operator makes inside a school is a line in that school's
 * audit log, not only every action.
 *
 * The visitor book (`withSchoolAccess`) says "the operator was here this
 * afternoon"; it cannot say what they looked at, because one row covers an
 * hour. The audit's first finding was exactly that gap — a directory listed,
 * a name searched, and nothing in the school's Safety Centre to say so. So
 * each read writes `operator.read.<what>` against the school, with COUNTS AND
 * NOTHING ELSE in `meta`: how many people were listed, never who; that a
 * search ran and how long the query was, never the letters typed. The row
 * says the operator looked; the school's own pages say what there was to see.
 */
async function auditRead(
  session: ActiveContext,
  schoolId: string,
  what: "overview" | "posts" | "people" | "people.search",
  counts: Record<string, number | null>,
): Promise<void> {
  await audit({
    schoolId,
    actorUserId: session.user.id,
    action: `operator.read.${what}`,
    targetType: "School",
    targetId: schoolId,
    meta: counts,
  });
}

/**
 * The shape of a school, in numbers, for somebody deciding whether there is
 * anything to look at.
 *
 * COUNTS BEFORE NAMES, on purpose. Most reasons to open a school are answered by
 * "is anything waiting in moderation" rather than by a list of children, and a
 * page that opens on a directory invites reading one.
 */
export async function schoolOverview(
  session: ActiveContext,
  schoolId: string,
): Promise<SchoolOverview> {
  return withSchoolAccess(session, schoolId, async () => {
    const [members, classes, pendingPosts, openReports] = await Promise.all([
      db.membership.groupBy({
        by: ["role", "status"],
        where: { schoolId, leftAt: null },
        _count: { _all: true },
      }),
      db.class.count({ where: { schoolId, archivedAt: null } }),
      db.post.count({ where: { schoolId, status: "PENDING" } }),
      db.report.count({ where: { schoolId, status: "OPEN" } }),
    ]);

    await auditRead(session, schoolId, "overview", {
      members: members.reduce((sum, row) => sum + row._count._all, 0),
      classes,
      pendingPosts,
      openReports,
    });

    return {
      members: members.map((row) => ({
        role: row.role,
        status: row.status,
        count: row._count._all,
      })),
      classes,
      pendingPosts,
      openReports,
    };
  });
}

export type OversightPost = {
  id: string;
  title: string;
  body: string | null;
  scope: string;
  status: string;
  authorName: string;
  createdAt: Date;
};

/**
 * What this school has published, newest first.
 *
 * PUBLISHED THINGS ONLY — posts are the one kind of content in this app written
 * to be read by people other than their author, which is exactly why a host ever
 * has to look at one. Filtering is by status rather than by anything cleverer:
 * an operator arriving because of a report needs to see what is live and what is
 * queued, and neither of those is a private message.
 */
export async function listPosts(
  session: ActiveContext,
  schoolId: string,
  opts: { status?: string } = {},
): Promise<OversightPost[]> {
  return withSchoolAccess(session, schoolId, async () => {
    const posts = await db.post.findMany({
      where: { schoolId, ...(opts.status ? { status: opts.status } : {}) },
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        title: true,
        body: true,
        scope: true,
        status: true,
        createdAt: true,
        author: { select: { name: true, preferredName: true } },
      },
    });

    await auditRead(session, schoolId, "posts", { count: posts.length });

    return posts.map((post) => ({
      id: post.id,
      title: post.title,
      body: post.body,
      scope: post.scope,
      status: post.status,
      authorName: post.author.preferredName ?? post.author.name,
      createdAt: post.createdAt,
    }));
  });
}

export type OversightResult = { ok: true } | { ok: false; errorKey: TranslationKey };

/**
 * Takes a post down.
 *
 * REJECTED, NOT DELETED, and this matters more here than anywhere else it is
 * said in this codebase. A host removing a school's content and leaving nothing
 * behind is indistinguishable from the content never existing — the school
 * cannot tell what went, or check whether the removal was right. Setting the
 * status leaves the row, the author, the words and the audit line, so the school
 * can see exactly what was taken down and argue about it.
 *
 * The reason is required for the same purpose as opening the school is: it lands
 * in the school's Safety Centre.
 */
export async function takeDownPost(
  session: ActiveContext,
  schoolId: string,
  postId: string,
  reason: string,
): Promise<OversightResult> {
  const clean = reason.trim();
  if (clean.length < 5) return { ok: false, errorKey: "root.sayWhyShort" };

  return withSchoolAccess(session, schoolId, async () => {
    // Scoped find, exactly as every other assert-don't-accept lookup here: an id
    // from another school does not resolve, even for an operator, because the
    // binding is to this school alone.
    const post = await db.post.findFirst({
      where: { id: postId, schoolId },
      select: { id: true, title: true, status: true },
    });
    if (!post) return { ok: false, errorKey: "root.noSuchPost" };
    if (post.status === "REJECTED") return { ok: false, errorKey: "root.postAlreadyDown" };

    await db.post.update({
      where: { id: post.id },
      data: { status: "REJECTED", reviewedAt: new Date() },
    });
    // TA-224: off the school's public website at once, words and picture, if the live site shows it.
    const { refreshSchoolSite } = await import("./site-publish");
    await refreshSchoolSite(schoolId);

    await audit({
      schoolId,
      actorUserId: session.user.id,
      action: "operator.post.takedown",
      targetType: "Post",
      targetId: post.id,
      meta: { title: post.title, reason: clean },
    });

    return { ok: true };
  });
}

/**
 * Pauses somebody's access to this school, or gives it back.
 *
 * SUSPENSION AND NOT REMOVAL. It stops somebody in the time it takes to press a
 * button — which is what an urgent safeguarding case needs — and it is
 * reversible by the school afterwards, which is what a mistake needs. Nothing
 * of theirs is deleted: `membership.ts` explains at length why a suspension is a
 * statement about access from now on rather than an attempt to unhappen a term,
 * and none of that reasoning changes because the person pressing the button
 * hosts the server.
 *
 * DELIBERATELY NOT REUSING `suspendMembership`, and this is worth being explicit
 * about rather than looking like duplication: that function refuses anybody
 * whose `ctx.role` is not ADMIN, and an operator holds no membership and
 * therefore no role at all. Loosening it to accept them would put an
 * operator-shaped hole in the function a school's own directory depends on. The
 * guard here is a different guard — an open grant — so it is a different
 * function, and the last-admin rule is re-stated rather than inherited.
 */
export async function setMembershipSuspension(
  session: ActiveContext,
  schoolId: string,
  membershipId: string,
  next: { suspended: boolean; reason: string },
): Promise<OversightResult> {
  const clean = next.reason.trim();
  if (next.suspended && clean.length < 5) {
    return { ok: false, errorKey: "root.sayWhySchoolReads" };
  }

  return withSchoolAccess(session, schoolId, async () => {
    // TA-170: the shape of the school's own door (membership.ts): every suspension in a school is serialised behind a
    // row lock on the school, so two pauses cannot both pass the last-admin count, and only an ACTIVE membership is
    // paused (a PENDING one is an invitation, which is revoked rather than paused).
    let target: SuspensionTarget;
    try {
      target = await db.$tenantTransaction(async (tx: unknown) => {
        const t = tx as SuspensionTx;
        await t.$queryRaw`SELECT id FROM "School" WHERE id = ${schoolId} FOR UPDATE`;
        const found = await t.membership.findFirst({
          where: { id: membershipId, schoolId },
          select: { id: true, role: true, status: true, userId: true, user: { select: { name: true } } },
        });
        if (!found) throw new SuspensionRefused("root.personNotHere");
        await writeSuspension(t, found);
        return found;
      });
    } catch (error) {
      if (error instanceof SuspensionRefused) return { ok: false, errorKey: error.key };
      throw error;
    }

    await audit({
      schoolId,
      actorUserId: session.user.id,
      action: next.suspended ? "operator.membership.suspend" : "operator.membership.reinstate",
      targetType: "Membership",
      targetId: membershipId,
      meta: { name: target.user.name, role: target.role, reason: clean || null },
    });

    // TA-170: what the school's own pause and reinstatement do after the write (membership.ts), done here too, so a
    // person the operator pauses stops standing in as a guardian for the pupils they held, and a paused college
    // teacher's public page comes down. Reinstated, a class teacher takes their classes' unclaimed pupils back.
    if (next.suspended) {
      if (target.role !== "STUDENT") {
        await syncStandinsHeldBy({ schoolId, userId: target.userId, actorUserId: session.user.id }).catch((error) =>
          console.error("[setMembershipSuspension] standin sync failed", error instanceof Error ? error.message : error),
        );
      }
      if (target.role === "FACULTY" || target.role === "HOD") {
        await takeDownProfileOf(schoolId, membershipId, session.user.id, "membership.suspend");
      }
    } else if (target.role === "TEACHER" || target.role === "PRINCIPAL") {
      await syncStandinsForTeacherClasses({ schoolId, teacherUserId: target.userId, actorUserId: session.user.id }).catch((error) =>
        console.error("[setMembershipSuspension] standin sync failed", error instanceof Error ? error.message : error),
      );
    }

    return { ok: true };
  });

  async function writeSuspension(t: SuspensionTx, target: SuspensionTarget): Promise<void> {
    if (next.suspended) {
      if (target.status === "SUSPENDED") throw new SuspensionRefused("root.alreadyPaused");
      if (target.status !== "ACTIVE") throw new SuspensionRefused("refusal.inviteNotAccepted");

      /**
       * THE LAST ADMIN RULE, restated rather than inherited.
       *
       * A school with no admin cannot invite one, cannot restore anybody, and
       * cannot reach its own settings — it is bricked, and the only person who
       * could unbrick it is the operator who just bricked it. `membership.ts`
       * refuses this for a school's own admin and it must refuse it here too,
       * because "the host did it" makes the outcome worse rather than better.
       */
      if (target.role === "ADMIN") {
        const others = await t.membership.count({
          where: {
            schoolId,
            role: "ADMIN",
            status: "ACTIVE",
            leftAt: null,
            id: { not: membershipId },
          },
        });
        if (others === 0) throw new SuspensionRefused("root.onlyAdmin");
      }

      await t.membership.update({
        where: { id: membershipId },
        data: {
          status: "SUSPENDED",
          suspendedAt: new Date(),
          suspendedReason: `Paused by the Shalaghar team: ${clean}`,
        },
      });
    } else {
      if (target.status !== "SUSPENDED") throw new SuspensionRefused("root.notPaused");
      await t.membership.update({
        where: { id: membershipId },
        data: { status: "ACTIVE", suspendedAt: null, suspendedReason: null },
      });
    }
  }
}

type SuspensionTarget = { id: string; role: string; status: string; userId: string; user: { name: string } };

/** A refusal met inside the suspension's transaction, thrown to roll it back and handed back as its key. */
class SuspensionRefused extends Error {
  constructor(readonly key: TranslationKey) {
    super(key);
  }
}

/** The delegates the suspension's transaction touches. */
type SuspensionTx = {
  $queryRaw(strings: TemplateStringsArray, ...values: unknown[]): Promise<unknown>;
  membership: {
    findFirst(args: unknown): Promise<SuspensionTarget | null>;
    count(args: unknown): Promise<number>;
    update(args: unknown): Promise<unknown>;
  };
};

export type OversightPerson = {
  membershipId: string;
  name: string;
  role: string;
  status: string;
};

/**
 * The whole roll, role by role.
 *
 * The operator's sight goes down to the individual by design now, so the
 * directory is listed rather than search-only. Every look at it still goes
 * through `withSchoolAccess`, which records the visit for the school to read.
 */
export async function listPeople(
  session: ActiveContext,
  schoolId: string,
): Promise<OversightPerson[]> {
  return withSchoolAccess(session, schoolId, async () => {
    const rows = await db.membership.findMany({
      where: { schoolId, leftAt: null },
      orderBy: [{ role: "asc" }, { joinedAt: "asc" }],
      take: 1000,
      select: {
        id: true,
        role: true,
        status: true,
        user: { select: { name: true, preferredName: true } },
      },
    });

    await auditRead(session, schoolId, "people", { count: rows.length });

    return rows.map((row) => ({
      membershipId: row.id,
      name: row.user.preferredName ?? row.user.name,
      role: row.role,
      status: row.status,
    }));
  });
}

/** The same roll, narrowed by a typed name or email — for big schools. */
export async function findPeople(
  session: ActiveContext,
  schoolId: string,
  query: string,
): Promise<OversightPerson[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  return withSchoolAccess(session, schoolId, async () => {
    const rows = await db.membership.findMany({
      where: {
        schoolId,
        leftAt: null,
        user: {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
          ],
        },
      },
      orderBy: { role: "asc" },
      take: 25,
      select: {
        id: true,
        role: true,
        status: true,
        user: { select: { name: true, preferredName: true } },
      },
    });

    // The query's LENGTH, never the query: a searched name is a name.
    await auditRead(session, schoolId, "people.search", { count: rows.length, queryLength: q.length });

    return rows.map((row) => ({
      membershipId: row.id,
      name: row.user.preferredName ?? row.user.name,
      role: row.role,
      status: row.status,
    }));
  });
}

/** Re-exported so route handlers have one import for the whole feature. */
export { AccessError };
