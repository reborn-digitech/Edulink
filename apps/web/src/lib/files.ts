import "server-only";
import { db } from "./db";
import { readJsonArray, type Attachment, type MediaItem } from "./json";

// Re-exported for server callers; client components must import it from ./json
// directly, because this module is server-only.
export { formatBytes } from "./json";
import type { ActiveContext } from "./session";
import { applicationOwningFile } from "./admissions";
import { kycOwningFile } from "./expert-kyc";
import { parentMaySee } from "./student-consent";

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
  | { allowed: true; kind: "assignment" | "submission" | "post" | "application" | "kyc" | "purchase" | "academics" | "scholarship" | "placement" | "iqac"; public: false }
  | { allowed: false; reason: "not-found" | "unauthenticated" | "forbidden" };

const DENY: FileAccess = { allowed: false, reason: "not-found" };

/** A college offering's teacher (R-48): its faculty member, or the HOD of the department whose programme owns its course. */
async function teachesOffering(offeringId: string, membershipId: string, role: string | null): Promise<boolean> {
  if (role !== "FACULTY" && role !== "HOD") return false;
  const offering = await db.courseOffering.findFirst({
    where: {
      id: offeringId,
      OR: [
        { facultyMembershipId: membershipId },
        ...(role === "HOD" ? [{ course: { scheme: { programme: { department: { hodMembershipId: membershipId } } } } }] : []),
      ],
    },
    select: { id: true },
  });
  return Boolean(offering);
}

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
      assignment: { select: { classId: true, offeringId: true } },
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
    if (role === "TEACHER" && schoolId === submission.schoolId && membershipId && submission.assignment.classId) {
      const teaches = await db.classTeacher.findFirst({
        where: { classId: submission.assignment.classId, teacherMembershipId: membershipId },
        select: { id: true },
      });
      if (teaches) return { allowed: true, kind: "submission", public: false };
    }
    // A college offering's work (R-48): its faculty member or its department's HOD.
    if (schoolId === submission.schoolId && membershipId && submission.assignment.offeringId && (await teachesOffering(submission.assignment.offeringId, membershipId, role))) {
      return { allowed: true, kind: "submission", public: false };
    }
    return DENY;
  }

  // ---- 2b. an admission application's document: the family that attached
  // it and the office of the school it was sent to. Nobody else — not a
  // teacher, not the class it might one day join. Looked up before the
  // school-scoped branches because the applicant has no school at all.
  const application = await applicationOwningFile(ref);
  if (application) {
    if (application.applicantUserId && application.applicantUserId === user.id) return { allowed: true, kind: "application", public: false };
    if ((role === "ADMIN" || role === "PRINCIPAL") && schoolId === application.schoolId) return { allowed: true, kind: "application", public: false };
    return DENY;
  }

  // ---- 2c. an expert's KYC papers: the expert themself and the operator
  // (User.isSuperuser), nobody else — not a school that booked them, not
  // another expert. The ids are on a row that belongs to no school, so this
  // too comes before the school-scoped branches; a refusal is the same
  // not-found as an id that never existed.
  const kyc = await kycOwningFile(fileId);
  if (kyc) {
    if (kyc.userId === user.id || user.isSuperuser) return { allowed: true, kind: "kyc", public: false };
    return DENY;
  }

  // ---- 2c-college. a college admission's scrutiny document (the ADMISSIONS
  // module, 4 Oct 2026): the office and the principal of that college. A
  // scholarship claim's document: the student who added it, and the
  // college's office, accounts desk and principal.
  const collegeApp = await db.collegeApplication.findFirst({ where: { documentsJson: { contains: ref } }, select: { schoolId: true } });
  if (collegeApp) {
    if ((role === "ADMIN" || role === "PRINCIPAL") && schoolId === collegeApp.schoolId) return { allowed: true, kind: "application", public: false };
    return DENY;
  }
  const claim = await db.scholarshipClaim.findFirst({ where: { documentsJson: { contains: ref } }, select: { schoolId: true, student: { select: { userId: true } } } });
  if (claim) {
    if (claim.student.userId === user.id) return { allowed: true, kind: "scholarship", public: false };
    if ((role === "ADMIN" || role === "PRINCIPAL" || role === "ACCOUNTS") && schoolId === claim.schoolId) return { allowed: true, kind: "scholarship", public: false };
    return DENY;
  }

  // ---- 2d. a purchase record's scanned bill (the INVENTORY module): the
  // office and the head of the school whose bill it is, nobody else.
  const bill = await db.purchaseRecord.findFirst({ where: { billFileId: fileId }, select: { schoolId: true } });
  if (bill) {
    if ((role === "ADMIN" || role === "PRINCIPAL") && schoolId === bill.schoolId) return { allowed: true, kind: "purchase", public: false };
    return DENY;
  }

  // ---- 2e. the college's academics (4 Oct 2026). A condonation's document:
  // the student who asked, the HOD of their programme's department, the
  // principal and the office. A course file's resource or question paper:
  // its faculty member and their department, the office and the head, and
  // (a resource, never a question paper or model answer) a student
  // registered on the offering.
  const condonation = await db.attendanceCondonation.findFirst({ where: { documentFileId: fileId }, select: { schoolId: true, student: { select: { userId: true, academicSeat: { select: { programme: { select: { department: { select: { hodMembershipId: true } } } } } } } } } });
  if (condonation) {
    if (condonation.student.userId === user.id) return { allowed: true, kind: "academics", public: false };
    if (schoolId !== condonation.schoolId) return DENY;
    if (role === "ADMIN" || role === "PRINCIPAL") return { allowed: true, kind: "academics", public: false };
    if (role === "HOD" && membershipId && condonation.student.academicSeat?.programme.department.hodMembershipId === membershipId) return { allowed: true, kind: "academics", public: false };
    return DENY;
  }
  const courseItem = await db.courseFileItem.findFirst({ where: { fileId }, select: { schoolId: true, kind: true, courseFile: { select: { offeringId: true, offering: { select: { facultyMembershipId: true, course: { select: { scheme: { select: { programme: { select: { departmentId: true } } } } } } } } } } } });
  if (courseItem) {
    if (schoolId !== courseItem.schoolId || !membershipId) return DENY;
    if (role === "ADMIN" || role === "PRINCIPAL") return { allowed: true, kind: "academics", public: false };
    const offering = courseItem.courseFile.offering;
    if ((role === "FACULTY" || role === "HOD") && offering.facultyMembershipId === membershipId) return { allowed: true, kind: "academics", public: false };
    if (role === "FACULTY" || role === "HOD") {
      const dept = offering.course.scheme.programme.departmentId;
      const member = await db.departmentFaculty.findFirst({ where: { membershipId, departmentId: dept }, select: { id: true } });
      const head = role === "HOD" ? await db.department.findFirst({ where: { id: dept, hodMembershipId: membershipId }, select: { id: true } }) : null;
      if (member || head) return { allowed: true, kind: "academics", public: false };
    }
    if (role === "STUDENT" && !["QUESTION_PAPER", "MODEL_ANSWER"].includes(courseItem.kind)) {
      const registered = await db.courseRegistration.findFirst({ where: { offeringId: courseItem.courseFile.offeringId, studentMembershipId: membershipId, status: "REGISTERED" }, select: { id: true } });
      if (registered) return { allowed: true, kind: "academics", public: false };
    }
    return DENY;
  }

  // ---- 2f. placement (4 Oct 2026). An offer letter: the student it is for,
  // a guardian who may see their PLACEMENT (always, for a minor), the host
  // college's cell (the TPO, the office, the principal) and a recruiter bound
  // to the drive's company while the drive is live. An internship's report or
  // a parent's declaration: the student, such a guardian, the supervising
  // faculty member, and the college's TPO, HOD, office and principal.
  const letter = await db.offer.findFirst({ where: { letterFileId: fileId }, select: { schoolId: true, studentMembershipId: true, student: { select: { userId: true } }, drive: { select: { companyId: true, status: true } } } });
  if (letter) {
    if (letter.student.userId === user.id) return { allowed: true, kind: "placement", public: false };
    if ((role === "TPO" || role === "ADMIN" || role === "PRINCIPAL") && schoolId === letter.schoolId) return { allowed: true, kind: "placement", public: false };
    if (role === "RECRUITER" && ["OPEN", "SHORTLISTING", "ROUNDS", "OFFERS"].includes(letter.drive.status)) {
      const bound = await db.companyRecruiter.findFirst({ where: { companyId: letter.drive.companyId, userId: user.id, removedAt: null }, select: { id: true } });
      if (bound) return { allowed: true, kind: "placement", public: false };
    }
    if (await placementGuardian(user.id, letter.studentMembershipId)) return { allowed: true, kind: "placement", public: false };
    return DENY;
  }
  const internship = await db.internship.findFirst({ where: { OR: [{ reportFileId: fileId }, { parentDeclarationFileId: fileId }] }, select: { schoolId: true, studentMembershipId: true, facultyMembershipId: true, student: { select: { userId: true } } } });
  if (internship) {
    if (internship.student.userId === user.id) return { allowed: true, kind: "placement", public: false };
    if (schoolId === internship.schoolId && (role === "TPO" || role === "HOD" || role === "ADMIN" || role === "PRINCIPAL")) return { allowed: true, kind: "placement", public: false };
    if (schoolId === internship.schoolId && role === "FACULTY" && membershipId && internship.facultyMembershipId === membershipId) return { allowed: true, kind: "placement", public: false };
    if (await placementGuardian(user.id, internship.studentMembershipId)) return { allowed: true, kind: "placement", public: false };
    return DENY;
  }

  // ---- 2g. the IQAC's documents (4 Oct 2026): evidence, minutes, a research
  // item's paper, an activity's report, a grievance's attachment, a portal's
  // acknowledgement — every file the IQAC module registered (IqacFile). The
  // college's IQAC desk (IQAC, the office, the principal) and the person who
  // uploaded it, and an HOD for research and activity papers; nobody else,
  // so a student's grievance attachment never reaches a teacher.
  const iqacFile = await db.iqacFile.findUnique({ where: { fileId }, select: { schoolId: true, uploadedByUserId: true, purpose: true } });
  if (iqacFile) {
    if (iqacFile.uploadedByUserId === user.id) return { allowed: true, kind: "iqac", public: false };
    // A research paper or an activity's report is the department's record too: its HOD reads it.
    if (role === "HOD" && schoolId === iqacFile.schoolId && (iqacFile.purpose === "RESEARCH" || iqacFile.purpose === "ACTIVITY")) return { allowed: true, kind: "iqac", public: false };
    // A grievance's attachment is the office's and the head's alone, as its words are.
    if ((role === "ADMIN" || role === "PRINCIPAL" || (role === "IQAC" && iqacFile.purpose !== "GRIEVANCE")) && schoolId === iqacFile.schoolId) return { allowed: true, kind: "iqac", public: false };
    return DENY;
  }

  // ---- 3. assignment attachment: anyone who can see the assignment
  const assignment = await db.assignment.findFirst({
    where: { attachments: { contains: ref } },
    select: { id: true, schoolId: true, classId: true, offeringId: true, publishedAt: true },
  });

  // A college offering's handouts (R-48): its faculty member or HOD, the office, and once published its REGISTERED
  // students. Not a guardian: an adult student's work is theirs (the family's list names it, the file stays theirs).
  if (assignment && assignment.offeringId) {
    if (schoolId !== assignment.schoolId || !membershipId) return DENY;
    if (role === "ADMIN") return { allowed: true, kind: "assignment", public: false };
    if (await teachesOffering(assignment.offeringId, membershipId, role)) return { allowed: true, kind: "assignment", public: false };
    if (role === "STUDENT" && assignment.publishedAt) {
      const registered = await db.courseRegistration.findFirst({ where: { offeringId: assignment.offeringId, studentMembershipId: membershipId, status: "REGISTERED" }, select: { id: true } });
      if (registered) return { allowed: true, kind: "assignment", public: false };
    }
    return DENY;
  }

  if (assignment && assignment.classId) {
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

/** An active guardian of the student who may see their placement (placement, 4 Oct 2026). */
async function placementGuardian(userId: string, studentMembershipId: string): Promise<boolean> {
  const link = await db.guardianship.findFirst({ where: { parentUserId: userId, studentMembershipId, status: "ACTIVE" }, select: { id: true } });
  return link !== null && (await parentMaySee(studentMembershipId, "PLACEMENT"));
}
