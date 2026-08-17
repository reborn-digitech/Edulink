import "server-only";
import { db } from "./db";
import { readJsonArray, type Attachment, type MediaItem } from "./json";

// Re-exported for server callers; client components must import it from ./json
// directly, because this module is server-only.
export { formatBytes } from "./json";
import type { ActiveContext } from "./session";

/**
 * Per-file read authorisation.
 *
 * Attachments are referenced from JSON columns (`Assignment.attachments`,
 * `Submission.attachments`, `Post.media`), so there is no foreign key from a
 * file back to its owner. Authorising a read therefore means a REVERSE lookup:
 * find the record that references this fileId, then apply that record's own
 * access rules.
 *
 * Two rules make this safe rather than clever:
 *
 *   1. **Default deny.** A file referenced by nothing we recognise is refused.
 *      An orphan — left by a failed write, or a row deleted since — must not
 *      become a world-readable URL just because nobody claims it.
 *   2. **Every lookup is tenant-scoped.** The reverse queries carry `schoolId`
 *      from the session, so a fileId belonging to another school matches nothing
 *      even though the id itself is a valid UUID.
 *
 * The most sensitive case is a submission attachment: that is a child's own
 * work. It is readable by the child, their active guardians, teachers of the
 * class it was set for, and admins of that school. Explicitly NOT by classmates.
 */

export type FileAccess =
  | { allowed: true; kind: "logo"; public: true }
  | { allowed: true; kind: "assignment" | "submission" | "post"; public: false }
  | { allowed: false; reason: "not-found" | "unauthenticated" | "forbidden" };

const DENY: FileAccess = { allowed: false, reason: "not-found" };

/**
 * The JSON columns store `[{"fileId":"<uuid>.png",...}]`, so a reference is
 * matched by the quoted id. Quoting matters: without it, the id `a.png` would
 * also match a record referencing `aa.png`.
 */
function jsonRef(fileId: string): string {
  return `"fileId":"${fileId}"`;
}

export async function authorizeFileRead(
  fileId: string,
  session: ActiveContext | null,
): Promise<FileAccess> {
  // ---- 1. school logo: effectively public (sign-in page, invitation emails)
  const logo = await db.school.findFirst({
    where: { logoPath: fileId },
    select: { id: true },
  });
  if (logo) return { allowed: true, kind: "logo", public: true };

  // Everything else needs a session before we look anything up at all, so an
  // anonymous request cannot use this endpoint to probe which ids exist.
  if (!session) return { allowed: false, reason: "unauthenticated" };

  const { schoolId, membershipId, role, user } = session;
  const ref = jsonRef(fileId);

  // ---- 2. submission attachment: a child's own work. Tightest rules.
  const submission = await db.submission.findFirst({
    where: { attachments: { contains: ref } },
    select: {
      studentMembershipId: true,
      schoolId: true,
      assignment: { select: { classId: true } },
      student: { select: { userId: true } },
    },
  });

  if (submission) {
    // The student themselves.
    if (submission.student.userId === user.id) {
      return { allowed: true, kind: "submission", public: false };
    }
    // An active guardian of that student.
    const guardian = await db.guardianship.findFirst({
      where: {
        parentUserId: user.id,
        studentMembershipId: submission.studentMembershipId,
        status: "ACTIVE",
      },
      select: { id: true },
    });
    if (guardian) return { allowed: true, kind: "submission", public: false };

    // An admin of that school.
    if (role === "ADMIN" && schoolId === submission.schoolId) {
      return { allowed: true, kind: "submission", public: false };
    }
    // A teacher of the class the work was set for — not merely a colleague.
    if (role === "TEACHER" && schoolId === submission.schoolId && membershipId) {
      const teaches = await db.classTeacher.findFirst({
        where: { classId: submission.assignment.classId, teacherMembershipId: membershipId },
        select: { id: true },
      });
      if (teaches) return { allowed: true, kind: "submission", public: false };
    }
    return DENY;
  }

  // ---- 3. assignment attachment: anyone who can see the assignment
  const assignment = await db.assignment.findFirst({
    where: { attachments: { contains: ref } },
    select: { id: true, schoolId: true, classId: true, publishedAt: true },
  });

  if (assignment) {
    if (schoolId !== assignment.schoolId) {
      // Could still be a guardian of a child in that class, at another school
      // context. Check that before denying.
      const guardianElsewhere = await db.guardianship.findFirst({
        where: {
          parentUserId: user.id,
          status: "ACTIVE",
          student: {
            enrollments: { some: { classId: assignment.classId, status: "ACTIVE" } },
          },
        },
        select: { id: true },
      });
      if (guardianElsewhere && assignment.publishedAt) {
        return { allowed: true, kind: "assignment", public: false };
      }
      return DENY;
    }

    if (role === "ADMIN") return { allowed: true, kind: "assignment", public: false };

    if (role === "TEACHER" && membershipId) {
      const teaches = await db.classTeacher.findFirst({
        where: { classId: assignment.classId, teacherMembershipId: membershipId },
        select: { id: true },
      });
      if (teaches) return { allowed: true, kind: "assignment", public: false };
      return DENY;
    }

    if (role === "STUDENT" && membershipId) {
      // Only once published — an unpublished draft's attachment is not theirs
      // to see yet.
      if (!assignment.publishedAt) return DENY;
      const enrolled = await db.enrollment.findFirst({
        where: { classId: assignment.classId, studentMembershipId: membershipId, status: "ACTIVE" },
        select: { id: true },
      });
      if (enrolled) return { allowed: true, kind: "assignment", public: false };
      return DENY;
    }

    // Parent in the same school context.
    const guardian = await db.guardianship.findFirst({
      where: {
        parentUserId: user.id,
        status: "ACTIVE",
        student: { enrollments: { some: { classId: assignment.classId, status: "ACTIVE" } } },
      },
      select: { id: true },
    });
    if (guardian && assignment.publishedAt) {
      return { allowed: true, kind: "assignment", public: false };
    }
    return DENY;
  }

  // ---- 4. bulletin post media: mirrors post visibility
  const post = await db.post.findFirst({
    where: { media: { contains: ref } },
    select: {
      id: true,
      schoolId: true,
      classId: true,
      scope: true,
      status: true,
      authorUserId: true,
    },
  });

  if (post) {
    // The author always sees their own attachment, in any state.
    if (post.authorUserId === user.id) return { allowed: true, kind: "post", public: false };

    // Post.schoolId is nullable because the schema allows a GLOBAL post by an
    // external organiser. Posting GLOBAL is refused (see bulletin.ts), so a
    // school-less post here is not something we can authorise against — deny
    // rather than treating null as "any school".
    if (!post.schoolId) return DENY;
    const postSchoolId = post.schoolId;

    // Parents are checked FIRST, because a parent's session has no schoolId at
    // all — they legitimately span schools. Putting the school-scope check
    // before this denied every guardian, which showed up as broken images on
    // the bulletin with no error anywhere. Same shape as the assignment branch.
    if (post.status === "APPROVED") {
      const guardianOfClass = await db.guardianship.findFirst({
        where: {
          parentUserId: user.id,
          status: "ACTIVE",
          student: {
            schoolId: postSchoolId,
            ...(post.scope === "CLASS" && post.classId
              ? { enrollments: { some: { classId: post.classId, status: "ACTIVE" } } }
              : {}),
          },
        },
        select: { id: true },
      });
      if (guardianOfClass) return { allowed: true, kind: "post", public: false };
    }

    /**
     * A GLOBAL post is the one thing every school may read — that is the whole
     * point of the feed — so its media crosses the school boundary with it.
     * This check predates media on the global feed (the page never rendered
     * any until it did), which is how "share with every school" shipped whose
     * pictures 404ed for every school but the publisher's. Approved and
     * global only: taking the post back off the feed makes its media
     * school-private again in the same moment. Any signed-in reader — the
     * audience the feed itself has; a per-school hide is a courtesy filter on
     * the feed, never a secrecy boundary, and is not re-checked per byte.
     */
    if (post.scope === "GLOBAL" && post.status === "APPROVED") {
      return { allowed: true, kind: "post", public: false };
    }

    if (schoolId !== postSchoolId) return DENY;
    // A pending or rejected post's media is as private as the post itself.
    if (post.status !== "APPROVED") {
      if (role === "ADMIN") return { allowed: true, kind: "post", public: false };
      if (role === "TEACHER" && membershipId && post.scope === "CLASS" && post.classId) {
        const teaches = await db.classTeacher.findFirst({
          where: { classId: post.classId, teacherMembershipId: membershipId },
          select: { id: true },
        });
        if (teaches) return { allowed: true, kind: "post", public: false };
      }
      return DENY;
    }

    if (post.scope === "SCHOOL") return { allowed: true, kind: "post", public: false };

    if (post.classId) {
      // Anyone attached to that class: teacher, enrolled student, or admin.
      if (role === "ADMIN") return { allowed: true, kind: "post", public: false };
      const attached = await db.class.findFirst({
        where: {
          id: post.classId,
          schoolId: postSchoolId,
          OR: [
            ...(membershipId
              ? [
                  { teachers: { some: { teacherMembershipId: membershipId } } },
                  { enrollments: { some: { studentMembershipId: membershipId, status: "ACTIVE" } } },
                ]
              : []),
            {
              enrollments: {
                some: {
                  status: "ACTIVE",
                  student: {
                    guardianships: { some: { parentUserId: user.id, status: "ACTIVE" } },
                  },
                },
              },
            },
          ],
        },
        select: { id: true },
      });
      if (attached) return { allowed: true, kind: "post", public: false };
    }
    return DENY;
  }

  // ---- 5. referenced by nothing we recognise: refuse.
  return DENY;
}

/* -------------------------------------------------------------------------- */
/* Attachment list helpers                                                     */
/* -------------------------------------------------------------------------- */

export function readAttachments(raw: string | null | undefined): Attachment[] {
  return readJsonArray<Attachment>(raw).filter(
    (a) => typeof a?.fileId === "string" && a.fileId.length > 0,
  );
}

export function readMedia(raw: string | null | undefined): MediaItem[] {
  return readJsonArray<MediaItem>(raw).filter(
    (m) => typeof m?.fileId === "string" && m.fileId.length > 0,
  );
}
