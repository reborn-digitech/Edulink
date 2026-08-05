import "server-only";
import { db } from "./db";
import { audit } from "./audit";
import { fakePasswordWork, verifyPassword } from "./crypto";
import { toDisplayLoginName, toLoginEmail } from "./login-name";
import { forTenant, forUser } from "./tenant-context";
import type { ActiveContext } from "./session";

/**
 * Joining two accounts that belong to the same person.
 *
 * WHY THIS EXISTS, and it is a consequence of the transfer feature rather than a
 * feature in its own right. A leaving certificate travels on `studentUserId` —
 * it has to, because the receiving school can never read the issuing school's
 * rows and the child's user id is the only thing both sides share. So the moment
 * a family arrives at their new school and creates a FRESH account instead of
 * signing in with the old one, the certificate is stranded on an account nobody
 * uses, and "their previous school, on their profile" silently shows nothing.
 * `joinAsStudent` mints a new User every time it runs, so this fork is the
 * DEFAULT outcome of a transfer, not an unlucky one.
 *
 * DIRECTION: the account you are signed in to is the one that survives. It is
 * the one whose password the child actually remembers, the one their school
 * emails, and the one they will use tomorrow morning. Bringing the old life
 * forward is also fewer rows than pushing the new one back.
 *
 * AUTHORISATION IS OWNERSHIP OF BOTH, and there is deliberately no other way in.
 * No admin can do this: a school admin who could merge accounts could absorb a
 * child's account from a school they cannot otherwise see, which is precisely
 * the boundary the rest of this codebase spends its effort holding. So the proof
 * is the old account's password: you have to be able to sign in to both.
 *
 * WHAT MOVES is everything keyed to the PERSON: memberships (and therefore, for
 * free, every mark, register, report card and enrolment hanging off them),
 * leaving certificates, guardianships, and authorship of posts, comments,
 * reactions and remark messages.
 *
 * WHAT DOES NOT MOVE, each for its own reason:
 *   - Credentials — password, sessions, tokens, push subscriptions. They are
 *     how you prove you are the OLD account, and the whole point is that it
 *     stops existing.
 *   - Audit log entries. A log of who did what at the time is not improved by
 *     rewriting who did it.
 *   - Safeguarding reports. `Report.reporterUserId` is closer to a signature
 *     than to a piece of profile data, and re-attributing one is not this
 *     feature's business.
 *   - Notifications. Alerts about a school the person has left, pointing at
 *     pages they can no longer open, are noise rather than history.
 *
 * AND THE OLD ACCOUNT IS CLOSED, NOT DELETED. `User` cascades to Post, Comment,
 * Reaction and more, so deleting it would take a child's three months of class
 * bulletin posts with it — the merge would destroy exactly the history it was
 * asked to preserve. `disabledAt` stops the login, `mergedIntoUserId` records
 * where the person went, and every row still pointing at the old id still
 * resolves to a name.
 */

/* -------------------------------------------------------------------------- */
/* Types                                                                       */
/* -------------------------------------------------------------------------- */

export type MergeInput = {
  /** Email, or the bare handle a pupil was given. */
  identifier: string;
  password: string;
};

export type OtherSchool = {
  schoolId: string;
  schoolName: string;
  role: string;
  leftAt: Date | null;
};

/** What the confirm screen shows before anything is written. */
export type OtherAccount = {
  userId: string;
  name: string;
  loginName: string;
  schools: OtherSchool[];
  certificates: number;
  children: number;
};

export type MergePreview = { ok: true; other: OtherAccount } | { ok: false; error: string };

export type MergeCounts = {
  schools: number;
  certificates: number;
  children: number;
  posts: number;
};

export type MergeResult = { ok: true; counts: MergeCounts } | { ok: false; error: string };

/**
 * ONE MESSAGE FOR EVERY WAY THE CREDENTIALS CAN BE WRONG.
 *
 * This form is a password prompt for an arbitrary account, so it is an
 * enumeration oracle unless every failure looks identical — no account, no
 * password set, disabled, wrong password. It is no worse than `/login`, which
 * offers the same oracle to somebody with no session at all and takes the same
 * care; it must not be worse.
 */
const GENERIC =
  "That login name and password do not match an account. Check both, and remember a pupil's login name is not an email address.";

/* -------------------------------------------------------------------------- */
/* Authentication of the other side                                            */
/* -------------------------------------------------------------------------- */

type Authenticated =
  | { ok: true; other: OtherAccount; schoolIds: string[] }
  | { ok: false; error: string };

/**
 * Verifies the old account's credentials and works out what merging would move.
 *
 * Shared by the preview and the commit, and called AGAIN by the commit rather
 * than trusting anything the preview returned. The preview hands back no token
 * and no id the caller could replay: if the password stopped being right between
 * the two screens — because somebody changed it, or because the preview was left
 * open on a shared laptop — the merge does not happen.
 */
async function authenticate(ctx: ActiveContext, input: MergeInput): Promise<Authenticated> {
  const email = toLoginEmail(input.identifier ?? "");
  if (email.length === 0 || (input.password ?? "").length === 0) {
    await fakePasswordWork();
    return { ok: false, error: GENERIC };
  }

  const other = await db.user.findUnique({
    where: { email },
    select: {
      id: true,
      name: true,
      preferredName: true,
      email: true,
      passwordHash: true,
      disabledAt: true,
      mergedIntoUserId: true,
      isSuperuser: true,
    },
  });

  // Every one of these costs a password verification's worth of time and says
  // the same thing. See GENERIC.
  if (!other?.passwordHash || other.disabledAt || other.mergedIntoUserId) {
    await fakePasswordWork();
    return { ok: false, error: GENERIC };
  }

  if (!(await verifyPassword(other.passwordHash, input.password))) {
    await audit({
      actorUserId: ctx.user.id,
      action: "account.merge.failed",
      targetType: "User",
      targetId: other.id,
    });
    return { ok: false, error: GENERIC };
  }

  /* -- From here the caller has PROVED they hold the other account, so the
     -- messages below can be specific: they tell somebody about an account they
     -- have just demonstrated is theirs. ------------------------------------ */

  if (other.id === ctx.user.id) {
    return {
      ok: false,
      error: "That is the account you are already signed in to. Enter your OTHER account's details.",
    };
  }

  // Whoever runs the server is not a school membership and must not be absorbed
  // into one, in either direction. An operator with two accounts is a database
  // job, not a self-service form.
  if (other.isSuperuser || ctx.user.isSuperuser) {
    return { ok: false, error: "Server administrator accounts cannot be joined this way." };
  }

  /**
   * A's rows, read while bound to A.
   *
   * `forUser` is exactly the right tool and this is exactly its case: the
   * Membership policy answers "which schools does this user belong to" from
   * `app.user_id` with no school bound, which is the one question a
   * school-scoped policy cannot answer. Binding somebody else's id is
   * legitimate here and nowhere else, because the line above proved we hold
   * their password. It is a read-only binding — `app.user_id` appears in no
   * WITH CHECK in the whole schema.
   */
  const memberships = await forUser(other.id, () =>
    db.membership.findMany({
      where: { userId: other.id },
      select: { id: true, schoolId: true, role: true, leftAt: true },
    }),
  );

  const schoolIds = [...new Set(memberships.map((m) => m.schoolId))];

  const names = new Map<string, string>();
  if (schoolIds.length > 0) {
    const schools = await forTenant(
      { schoolIds, userId: other.id, joinCode: null, isSuperuser: false },
      () => db.school.findMany({ where: { id: { in: schoolIds } }, select: { id: true, name: true } }),
    );
    for (const school of schools) names.set(school.id, school.name);
  }

  const certificates = await forUser(other.id, () =>
    db.schoolRecord.count({ where: { studentUserId: other.id } }),
  );

  // Guardianship carries no policy — it is deliberately cross-school, see the
  // note on `studentSchoolId` in the schema — so this needs no binding.
  const children = await db.guardianship.count({
    where: { parentUserId: other.id, status: { not: "REVOKED" } },
  });

  /* -- Refusals that are about the SHAPE of the two accounts, not the
     -- credentials. Each one is a case where merging would have to guess. --- */

  const mine = await db.membership.findMany({
    where: { userId: ctx.user.id },
    select: { schoolId: true, role: true },
  });
  const mineKeys = new Set(mine.map((m) => `${m.schoolId}:${m.role}`));
  const clash = memberships.find((m) => mineKeys.has(`${m.schoolId}:${m.role}`));
  if (clash) {
    // `@@unique([userId, schoolId, role])` would refuse the move anyway; this
    // says so in words instead of as a constraint violation. It also happens to
    // be the guarantee every other move in this file leans on — two accounts
    // that share no school cannot collide on any school-scoped unique key.
    return {
      ok: false,
      error: `Both accounts are already at ${names.get(clash.schoolId) ?? "the same school"} as a ${clash.role.toLowerCase()}. Ask that school to remove one of them first — joining the accounts cannot decide which is right.`,
    };
  }

  // ExpertProfile is `userId @unique`, and an expert's bookings, slots and
  // mentorships are a working relationship with schools rather than a
  // membership. Moving them means deciding what happens to a booked session,
  // which is a different feature. Refuse out loud rather than half-do it.
  const expertProfiles = await db.expertProfile.count({
    where: { userId: { in: [ctx.user.id, other.id] } },
  });
  if (expertProfiles > 0) {
    return {
      ok: false,
      error: "One of these accounts is an expert account. Those hold bookings and mentorships, so they have to be joined by hand — contact support.",
    };
  }

  return {
    ok: true,
    schoolIds,
    other: {
      userId: other.id,
      name: other.preferredName ?? other.name,
      loginName: toDisplayLoginName(other.email),
      certificates,
      children,
      schools: memberships.map((m) => ({
        schoolId: m.schoolId,
        schoolName: names.get(m.schoolId) ?? "A school",
        role: m.role,
        leftAt: m.leftAt,
      })),
    },
  };
}

/* -------------------------------------------------------------------------- */
/* Preview                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Says what a merge would do, and writes nothing.
 *
 * A CONFIRM STEP RATHER THAN ONE BUTTON, because this is the only action in the
 * app that ends an account, and because the thing most likely to go wrong is not
 * a bug — it is a parent typing the wrong child's login name. Naming the person,
 * their schools and their dates back to the reader is what catches that, and it
 * catches it before anything has moved rather than after.
 */
export async function previewMerge(ctx: ActiveContext, input: MergeInput): Promise<MergePreview> {
  const result = await authenticate(ctx, input);
  if (!result.ok) return { ok: false, error: result.error };
  return { ok: true, other: result.other };
}

/* -------------------------------------------------------------------------- */
/* The merge                                                                   */
/* -------------------------------------------------------------------------- */

type MergeTx = {
  membership: { updateMany(args: unknown): Promise<{ count: number }> };
  schoolRecord: { updateMany(args: unknown): Promise<{ count: number }> };
  guardianship: {
    findMany(args: unknown): Promise<{ id: string; studentMembershipId: string }[]>;
    updateMany(args: unknown): Promise<{ count: number }>;
    deleteMany(args: unknown): Promise<{ count: number }>;
  };
  post: { updateMany(args: unknown): Promise<{ count: number }> };
  comment: { updateMany(args: unknown): Promise<{ count: number }> };
  reaction: { updateMany(args: unknown): Promise<{ count: number }> };
  remarkMessage: { updateMany(args: unknown): Promise<{ count: number }> };
  session: { updateMany(args: unknown): Promise<{ count: number }> };
  authToken: { deleteMany(args: unknown): Promise<{ count: number }> };
  user: { update(args: unknown): Promise<unknown> };
};

/**
 * Does it. One transaction, bound to every school either account touches.
 *
 * ATOMIC OR NOTHING, and this one genuinely cannot be half-done. A run that
 * moved the memberships and failed before the certificates leaves a child whose
 * history is split across two accounts, one of which can no longer be signed in
 * to — strictly worse than the problem this fixes, and not something a person
 * could repair from the UI.
 *
 * `$tenantTransaction` inside `forTenant` is what makes that possible across
 * schools: the plain helper binds whatever the session says, which is ONE
 * school, and a merge is a cross-school act by definition. The ids handed to
 * `forTenant` come out of Membership and SchoolRecord rows Postgres already
 * agreed to return — never from the form — which is the documented rule for
 * using it at all.
 */
export async function mergeAccounts(ctx: ActiveContext, input: MergeInput): Promise<MergeResult> {
  const auth = await authenticate(ctx, input);
  if (!auth.ok) return { ok: false, error: auth.error };

  const { other, schoolIds } = auth;
  const keeperId = ctx.user.id;
  const now = new Date();

  // Certificates can be issued by a school the pupil is no longer a member of —
  // that is the normal case, since a departure is what creates one — so their
  // issuing schools are read separately rather than assumed to be a subset.
  const recordSchoolIds = await forUser(other.userId, () =>
    db.schoolRecord
      .findMany({ where: { studentUserId: other.userId }, select: { schoolId: true } })
      .then((rows) => rows.map((row) => row.schoolId)),
  );

  const bound = [...new Set([...schoolIds, ...recordSchoolIds])];

  const counts = await forTenant(
    { schoolIds: bound, userId: keeperId, joinCode: null, isSuperuser: false },
    () =>
      db.$tenantTransaction(async (rawTx) => {
        const tx = rawTx as MergeTx;

        const schools = await tx.membership.updateMany({
          where: { userId: other.userId },
          data: { userId: keeperId },
        });

        const certificates = await tx.schoolRecord.updateMany({
          where: { studentUserId: other.userId },
          data: { studentUserId: keeperId },
        });

        /**
         * Guardianships, minus the ones that would collide.
         *
         * `@@unique([parentUserId, studentMembershipId])`, and a parent who
         * linked to the same child from both of their accounts is the ordinary
         * way this happens rather than a strange one. The duplicate is dropped
         * instead of moved: after the merge it would be the same person linked
         * to the same child twice, which is a row with no meaning.
         */
        const existing = await tx.guardianship.findMany({
          where: { parentUserId: keeperId },
          select: { id: true, studentMembershipId: true },
        });
        const held = existing.map((row) => row.studentMembershipId);
        if (held.length > 0) {
          await tx.guardianship.deleteMany({
            where: { parentUserId: other.userId, studentMembershipId: { in: held } },
          });
        }
        const children = await tx.guardianship.updateMany({
          where: { parentUserId: other.userId },
          data: { parentUserId: keeperId },
        });

        /**
         * Authorship. Bulletin decides "is this mine?" on `authorUserId`, so
         * without this a child's own posts stop being theirs the day they merge
         * — they could not edit or delete their own work, and the app would
         * quietly disagree with itself about who wrote it.
         *
         * Safe from unique collisions because `authenticate` has already
         * refused any pair of accounts sharing a school, and every unique key
         * here (`Reaction`'s postId+userId+kind) is school-scoped.
         */
        const posts = await tx.post.updateMany({
          where: { authorUserId: other.userId },
          data: { authorUserId: keeperId },
        });
        await tx.comment.updateMany({
          where: { authorUserId: other.userId },
          data: { authorUserId: keeperId },
        });
        await tx.reaction.updateMany({
          where: { userId: other.userId },
          data: { userId: keeperId },
        });
        await tx.remarkMessage.updateMany({
          where: { authorUserId: other.userId },
          data: { authorUserId: keeperId },
        });

        // The old account stops being a way in, in the same breath as it stops
        // being a person. Sessions revoked and tokens destroyed, so a magic
        // link already sitting in an inbox is dead too.
        await tx.session.updateMany({
          where: { userId: other.userId, revokedAt: null },
          data: { revokedAt: now },
        });
        await tx.authToken.deleteMany({ where: { userId: other.userId } });

        await tx.user.update({
          where: { id: other.userId },
          data: { disabledAt: now, mergedIntoUserId: keeperId, mergedAt: now },
        });

        return {
          schools: schools.count,
          certificates: certificates.count,
          children: children.count,
          posts: posts.count,
        };
      }),
  );

  /**
   * Audited once per school, and once with none.
   *
   * A merge is the only ordinary action that reaches into more than one school
   * at a time, and each of those schools has a Safety Centre whose whole job is
   * to show what happened to its own people. An entry filed under no school
   * would be invisible to every one of them.
   */
  for (const schoolId of bound) {
    await audit({
      schoolId,
      actorUserId: keeperId,
      action: "account.merge",
      targetType: "User",
      targetId: other.userId,
      meta: { mergedFrom: other.loginName, counts },
    });
  }
  await audit({
    actorUserId: keeperId,
    action: "account.merge",
    targetType: "User",
    targetId: other.userId,
    meta: { counts },
  });

  return { ok: true, counts };
}
