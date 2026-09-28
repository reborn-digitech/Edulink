import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * The shape tenancy relies on, checked against the schema itself.
 *
 * `tenancy.ts` puts `schoolId` in the WHERE clause of every scoped query, and
 * the Postgres migration intends to turn that into an RLS policy per table. Both
 * depend on a property of the DATA MODEL rather than of any one query: that a
 * row can say which school it belongs to.
 *
 * The schema header claimed every school-owned row carried `schoolId` directly.
 * Five did not — they reached their tenant through a join, and nothing said so,
 * which would have meant five hand-written `EXISTS` policies discovered one at a
 * time. They have one now. Prose cannot be run; this can, which is the point:
 * the claim was wrong for as long as it was only prose.
 *
 * A new model has to land in one of three lists below, deliberately. Adding one
 * and forgetting fails this test rather than being discovered when a policy is
 * written against a column that is not there.
 */

const SCHEMA = readFileSync(resolve(process.cwd(), "prisma/schema.prisma"), "utf8");

/** Every .ts/.tsx file under a directory, recursively. */
function globSource(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = resolve(dir, entry.name);
    if (entry.isDirectory()) out.push(...globSource(full));
    else if (/\.tsx?$/.test(entry.name)) out.push(full);
  }
  return out;
}

/** Models that carry `schoolId` and can take a one-line RLS predicate. */
const DIRECT = [
  /**
   * The operator's visitor book. Carries `schoolId` directly like everything
   * else here, but its policy is bespoke: readable by the school, writable only
   * by whoever runs the server, and DELETABLE BY NOBODY — see
   * OPERATOR_LOG_TABLES in scripts/gen-rls.ts. It is in this list because the
   * question this file asks is "how does it reach its tenant", and the answer
   * is the ordinary one.
   */
  "OperatorAccess",
  /** The pupil's health card and its check-ups: the school's, read by the child's teachers and guardians through the app's own rules. */
  "HealthCard",
  "HealthCheck",
  /** The incident log and its follow-up notes: the school's record of a child's bad day, read by the family through the app's own rules. */
  "Incident",
  "IncidentNote",
  /** A circular opened by a reader: denormalised schoolId like PostAck beside it. */
  "PostRead",
  /** The staff register: a staff member's day, the school's row. */
  "StaffAttendance",
  /** The syllabus: the school's chapter list per grade and subject, a class's progress on each, and the lessons planned and taught. */
  "SyllabusUnit",
  "SyllabusProgress",
  "LessonPlan",
  /** A lesson covered on a day: the school's row on its own timetable slot. */
  "Substitution",
  /** The pupil record, the certificate templates and the certificates issued from them. */
  "PupilRecord",
  "CertificateTemplate",
  "IssuedCertificate",
  /** Admissions: the cycle, a family's application and the entrance-test sittings. */
  "AdmissionCycle",
  "Application",
  "EntranceSlot",
  /** A family's ask for a certificate. */
  "CertificateRequest",
  /** A proposed correction to a pupil's PEN, awaiting the head and a guardian. */
  "PenChangeRequest",
  "AcademicYear",
  "Term",
  "StaffRecord",
  "ScheduledDeparture",
  "ReviewRound",
  "ReviewRoundTeacher",
  "ReviewResponse",
  /**
   * The outreach trio. All three carry `schoolId` — the TARGET school's, which
   * is the tenant that answers them — and each also opens by exactly one
   * extra clause in gen-rls.ts: a published-or-hiring school to everyone, an
   * enquiry to its opener, a message to its enquiry's opener. The pinned
   * cross-tenant INSERTs are the same file's Enquiry/EnquiryMessage blocks.
   */
  "JobPosting",
  "Enquiry",
  "EnquiryMessage",
  "Assignment",
  "AttendanceRecord",
  "AttendanceCover",
  "AttendanceSession",
  "AuditLog",
  "TimetablePeriod",
  "TimetableSlot",
  "Class",
  "ClassTeacher",
  /**
   * The cross-school leaderboard's one table. Carries `schoolId` and reaches its
   * tenant the ordinary way; its policy additionally opens the row to OTHER
   * schools when the organiser has switched the leaderboard on — see
   * GLOBALLY_READABLE in scripts/gen-rls.ts. It is in this list because the
   * question here is how it reaches its tenant, and the answer is the ordinary
   * one. What it may NOT carry is a child: see the model.
   */
  "CompetitionStanding",
  "Comment",
  "EarnedBadge",
  "QuizAttempt",
  "QuizResponse",
  "QuizMastery",
  "PracticeAssignment",
  "CompetitionEntry",
  "Enrollment",
  "ExpertBooking",
  "ExpertMessage",
  "ExpertInvite",
  "Grade",
  "GradeCategory",
  "MentorThread",
  "MentorMessage",
  "GlobalPostHide",
  "Holiday",
  "Invite",
  "LeaveRequest",
  "Membership",
  "Notification",
  "Post",
  "PostAck",
  "Reaction",
  "ExamSeries",
  "ExamSlot",
  "MeetingSlot",
  "MeetingBooking",
  /**
   * The fees ledger. Every table carries the school's id directly — a
   * demand, a payment, a receipt, an allocation are the school's rows about
   * one of its pupils — and none opens to anybody else by policy: a guardian
   * reads their child's dues through the API, which checks the guardianship
   * itself, and the webhook writes under forSchool(schoolId) after proving
   * the signature with that school's own secret.
   */
  "FeeHead",
  "FeeStructure",
  "FeeInstalment",
  "FeeLine",
  "StudentFeePlan",
  "FeeConcession",
  "FeeDemand",
  "FeePayment",
  "FeeAllocation",
  "FeeReceipt",
  "FeeRefund",
  "FeeGatewayAccount",
  "GatewayEvent",
  // Texts to families: a message and a broadcast are the school's rows about
  // its own guardians; the status webhook writes under forSchool with the
  // school in its URL, like the gateway's.
  "OutboundMessage",
  "Broadcast",
  "RemarkMessage",
  "Conversation",
  "ConversationParticipant",
  "ConversationMessage",
  "RemarkThread",
  "Report",
  "ReportCard",
  "ReportCardItem",
  "SchoolRecord",
  "Submission",
  // A request to join and a claim to be a guardian: filed under the school asked, decided by it.
  "JoinRequest",
  "GuardianClaim",
];

/**
 * School-owned but reaching the tenant only through a join.
 *
 * EMPTY, and worth keeping empty. It had five entries — ClassTeacher and
 * Enrollment via classId, Comment and Reaction via postId, RemarkMessage via
 * threadId — each of which would have needed its own `EXISTS (...)` policy.
 * Those are the policies most likely to be written wrong and the ones that run
 * per row, so the five were given a `schoolId` instead and every policy is now
 * the same one-line predicate.
 *
 * A new entry here is a decision to write a bespoke policy. Prefer denormalising.
 */
const VIA_JOIN: Record<string, { fk: string; parent: string }> = {};

/** Not school-owned, each for a stated reason. */
const NOT_TENANT_SCOPED: Record<string, string> = {
  School: "is the tenant itself — its policy is on id, not schoolId",
  User: "spans schools on purpose — a parent has children in two, a teacher may work at two",
  Session: "belongs to a user, not a school; a session survives switching school",
  AuthToken: "belongs to a user, before any school is chosen",
  SsoIdentity: "an external login bound to a user, before any school is chosen — like AuthToken",
  PushSubscription: "belongs to a user's device",
  DeviceToken: "the phone's push token — belongs to a user's device, like PushSubscription",
  UploadTicket: "a file a person uploaded and has not attached yet; the post that consumes it is the tenant-scoped row",
  Guardianship: "deliberately cross-school: it is the link between a parent and a child",
  Competition: "organizerSchoolId is nullable because a competition may be run by nobody's school",
  OutboundEmail: "a dev mailbox of sent mail; has no tenant and holds no school data",
  JobRun: "a scheduled job runs for the whole server; the row is the lock and the log",
  RateLimit: "counts attempts made before any session exists; a bucket name and an integer",
  QuizTopic: "a shared practice catalogue, like Competition — a chapter belongs to no school",
  QuizQuestion: "belongs to a QuizTopic, which belongs to no school",
  QuizTopicTranslation: "a translation of the shared catalogue is still the shared catalogue",
  QuizQuestionTranslation: "a translation of the shared catalogue is still the shared catalogue",
  ExpertProfile: "an expert belongs to no school — the marketplace is shared, like Competition",
  ExpertSlot: "belongs to an ExpertProfile, so it belongs to no school either",
};

function modelBodies(): Map<string, string> {
  const bodies = new Map<string, string>();
  const re = /^model\s+(\w+)\s*\{([\s\S]*?)^\}/gm;
  let match: RegExpExecArray | null;
  while ((match = re.exec(SCHEMA)) !== null) bodies.set(match[1]!, match[2]!);
  return bodies;
}

const MODELS = modelBodies();

function hasField(body: string, field: string): boolean {
  return new RegExp(`^\\s*${field}\\s`, "m").test(body);
}

describe("the schema parses at all", () => {
  it("finds every model", () => {
    expect(
      MODELS.size,
      "If this FELL, the regex above has stopped matching and every assertion " +
        "below is passing vacuously. If it ROSE, a model was added — say how it " +
        "is scoped in one of the three lists and update this number.",
    ).toBe(113);
  });
});

describe("every model declares how it is scoped", () => {
  it("⚠ has no model missing from all three lists", () => {
    const accounted = new Set([...DIRECT, ...Object.keys(VIA_JOIN), ...Object.keys(NOT_TENANT_SCOPED)]);
    const orphans = [...MODELS.keys()].filter((m) => !accounted.has(m));

    expect(
      orphans,
      `New model(s) with no stated tenancy: ${orphans.join(", ")}. Add a schoolId ` +
        "and list it in DIRECT, or say how it reaches its tenant in VIA_JOIN, or " +
        "why it has none in NOT_TENANT_SCOPED.",
    ).toEqual([]);
  });

  it("lists nothing that does not exist", () => {
    const listed = [...DIRECT, ...Object.keys(VIA_JOIN), ...Object.keys(NOT_TENANT_SCOPED)];
    const ghosts = listed.filter((m) => !MODELS.has(m));
    expect(ghosts, `Listed but not in the schema: ${ghosts.join(", ")}`).toEqual([]);
  });
});

describe("direct scoping", () => {
  it("⚠ every model claiming a schoolId actually has one", () => {
    // A one-line RLS predicate against a column that is not there fails closed
    // in Postgres, but only when the policy is written — months later.
    const missing = DIRECT.filter((m) => !hasField(MODELS.get(m)!, "schoolId"));
    expect(missing, `Claim schoolId but do not have it: ${missing.join(", ")}`).toEqual([]);
  });
});

describe("scoping through a join", () => {
  it("⚠ each one still has the foreign key its policy would go through", () => {
    const broken: string[] = [];
    for (const [model, { fk }] of Object.entries(VIA_JOIN)) {
      if (!hasField(MODELS.get(model)!, fk)) broken.push(`${model}.${fk}`);
    }
    expect(broken, `Missing the key their RLS policy needs: ${broken.join(", ")}`).toEqual([]);
  });

  it("the parent it joins to is itself directly scoped", () => {
    // Otherwise the policy needs two joins, and nobody has written that down.
    for (const [model, { parent }] of Object.entries(VIA_JOIN)) {
      expect(DIRECT, `${model} joins to ${parent}, which is not directly scoped`).toContain(parent);
    }
  });

  it("⚠ is empty, so every policy is the same predicate", () => {
    // Not a style preference. Each entry here is a hand-written EXISTS policy,
    // and those are both the easiest to get wrong and the ones that cost per row.
    expect(Object.keys(VIA_JOIN)).toEqual([]);
  });
});

describe("models with no tenant", () => {
  it("each has a stated reason, not just an absence", () => {
    for (const [model, reason] of Object.entries(NOT_TENANT_SCOPED)) {
      expect(reason.length, `${model} needs a reason`).toBeGreaterThan(20);
    }
  });

  it("⚠ none of them quietly grew a schoolId", () => {
    // If one does, it is probably tenant-scoped after all and its queries should
    // be going through the scoped layer.
    const surprising = Object.keys(NOT_TENANT_SCOPED).filter(
      (m) => m !== "School" && hasField(MODELS.get(m)!, "schoolId"),
    );
    expect(surprising, `Now carry schoolId — should these be scoped? ${surprising.join(", ")}`).toEqual([]);
  });
});

/**
 * ⚠ NOBODY MAY CALL `db.$transaction` — AND THE REASON IS NOT STYLE.
 *
 * `db` is extended: to bind `app.school_ids` for row-level security, the
 * extension re-issues EVERY query inside its own `base.$transaction` (see
 * db.ts). So a `db.$transaction` — in either form, the array batch or the
 * interactive callback — hands its statements to an outer transaction that they
 * never actually join, and the outer one holds nothing together. Atomicity is
 * silently gone.
 *
 * DEMONSTRATED, NOT REASONED ABOUT. With a tenant bound and a deliberate failure
 * on the second statement of three otherwise-identical transactions:
 *
 *     db.$transaction([...])            first statement PERSISTED   (not atomic)
 *     db.$transaction(async (tx) => …)  first statement PERSISTED   (not atomic)
 *     db.$tenantTransaction(…)          first statement ROLLED BACK (atomic)
 *
 * It was found at five call sites. What made it survive is that no test could
 * see it: `npm test` has no session cookie, so the tenant resolves empty, the
 * extension short-circuits, and both broken forms behave like a normal Prisma
 * transaction. The bug only exists in a real request — which is exactly the
 * property that makes a grep the right check rather than a runtime one.
 *
 * The stakes, from those five: recovery codes deleted and not replaced (a second
 * factor with no way past it), a leave request cancelled with its cover still
 * standing, a class left with no weighting categories at all.
 */
describe("⚠ transactions bind the tenant", () => {
  const SOURCES = globSource(resolve(process.cwd(), "src"));

  it("no source file calls db.$transaction", () => {
    const offenders: string[] = [];
    for (const file of SOURCES) {
      const body = readFileSync(file, "utf8");
      // Comments discussing the hazard are the point of this rule, not a breach
      // of it — so only lines that actually CALL it count.
      body.split("\n").forEach((line, index) => {
        const code = line.replace(/^\s*(\/\/|\*|\/\*).*$/, "");
        if (/\bdb\s*\.\s*\$transaction\s*\(/.test(code)) {
          offenders.push(`${file.replace(process.cwd() + "/", "")}:${index + 1}`);
        }
      });
    }

    expect(
      offenders,
      "db.$transaction is not atomic on the extended client — the per-query " +
        "extension re-issues each statement in its own transaction. Use " +
        "db.$tenantTransaction, which binds the tenant once and keeps them " +
        "together. See src/lib/school-record.ts for the idiom.",
    ).toEqual([]);
  });

  it("⚠ and the rule can actually fail", () => {
    // A guard that cannot go red is decoration. This proves the matcher sees
    // the thing it is looking for, in both the forms that were found broken.
    const pattern = /\bdb\s*\.\s*\$transaction\s*\(/;
    expect(pattern.test("await db.$transaction([a, b]);")).toBe(true);
    expect(pattern.test("return db.$transaction(async (tx) => {")).toBe(true);
    expect(pattern.test("await db . $transaction ( [")).toBe(true);
    // …and does not trip on the replacement, which is the whole point.
    expect(pattern.test("await db.$tenantTransaction(async (tx) => {")).toBe(false);
  });
});
