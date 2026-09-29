/**
 * The API leg of the sweep: every endpoint in the catalog, as every role and
 * signed out, asserting the status alone — the same shape as the page sweep.
 *
 *   npm run api:sweep                       against NEXT_PUBLIC_APP_URL (default :3000)
 *   npm run api:sweep -- --only=/shared/joins   only the endpoints whose path contains the text:
 *                                               a check of one change, not the sweep's count
 *
 * Sessions are minted on ZZ Northgate exactly as the page sweep mints its
 * own, sent as bearer tokens (not cookies — the point is the phone's door),
 * and deleted at the end. A GET is expected to answer 200 for a permitted
 * role and 403 for the rest; a POST/DELETE with an empty body answers the
 * catalog's emptyBodyStatus (422 for a body it validates) for a permitted
 * role and 403 for the rest; signed out is 401 for anything not open to
 * anyone. An endpoint with a path parameter and no sample is skipped and
 * listed, so the gap is visible rather than silent.
 */
import { createHash, randomBytes } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { ENDPOINTS, type Endpoint, type SweepFixture } from "../src/lib/api-catalog";
import { ROLES, type Role } from "../src/lib/constants";
import { parseTeachingDays } from "../src/lib/dates";
import { HOLIDAY_KIND_META, type HolidayKind } from "../src/lib/holiday-kinds";

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
const db = new PrismaClient({ datasourceUrl: process.env.DATABASE_ADMIN_URL ?? process.env.DATABASE_URL });
const minted: string[] = [];
const results: { endpoint: string; role: string; expected: number | number[]; got: number; ok: boolean }[] = [];
const skipped: string[] = [];

async function mint(userId: string, role: Role, schoolId: string | null): Promise<string> {
  const token = randomBytes(32).toString("base64url");
  const s = await db.session.create({
    data: { userId, tokenHash: createHash("sha256").update(token).digest("hex"), activeSchoolId: schoolId, activeRole: role, userAgent: "api-sweep", expiresAt: new Date(Date.now() + 3_600_000) },
  });
  minted.push(s.id);
  return token;
}

/** Ids from ZZ Northgate for endpoints with a parameter; null where the fixture lacks the thing. */
/**
 * A lesson today whose teacher is away today, and someone in who is free
 * for it. zz:fixtures marks one ZZ teacher absent today and covers one of
 * their lessons; the sweep's assign then repeats that cover (a no-op) and
 * its clear takes it off, which the fixture restore puts back.
 */
async function substitutionFixture(s: string): Promise<{ substitutionSlotId: string | null; substituteMembershipId: string | null }> {
  const today = new Date().toISOString().slice(0, 10);
  const cover = await db.substitution.findFirst({ where: { schoolId: s, dateKey: today }, select: { slotId: true, substituteMembershipId: true }, orderBy: { createdAt: "asc" } });
  return { substitutionSlotId: cover?.slotId ?? null, substituteMembershipId: cover?.substituteMembershipId ?? null };
}

/** The ZZ report cards: a published Term 1 set and a draft set, and the school's rules read back as a body. */
async function reportCardFixture(s: string): Promise<{ reportCardId: string | null; draftReportCardId: string | null; reportCardTitle: string | null; reportCardConfig: Record<string, unknown> | null }> {
  const [published, draft, school] = await Promise.all([
    db.reportCard.findFirst({ where: { schoolId: s, status: "PUBLISHED" }, orderBy: { createdAt: "asc" }, select: { id: true, title: true } }),
    db.reportCard.findFirst({ where: { schoolId: s, status: "DRAFT" }, orderBy: { createdAt: "asc" }, select: { id: true } }),
    db.school.findUnique({ where: { id: s }, select: { reportCardConfig: true } }),
  ]);
  let config: Record<string, unknown> | null = null;
  try {
    config = school?.reportCardConfig ? (JSON.parse(school.reportCardConfig) as Record<string, unknown>) : null;
  } catch {
    config = null;
  }
  return { reportCardId: published?.id ?? null, draftReportCardId: draft?.id ?? null, reportCardTitle: published?.title ?? null, reportCardConfig: config };
}

/** The ZZ certificates: an active template (and its body to send back), a retired one, an issued certificate, one still to revoke, and a printed code. */
async function certificateFixture(s: string): Promise<{ certificateTemplateId: string | null; certificateTemplate: Record<string, unknown> | null; retiredTemplateId: string | null; certificateId: string | null; revocableCertificateId: string | null; certificateCode: string | null; cancelledCertificateRequestId: string | null; declinedCertificateRequestId: string | null; penNumber: string | null; penChangeId: string | null; penChangeToPen: string | null; recordChangeId: string | null }> {
  const [active, retired, issued, revocable] = await Promise.all([
    db.certificateTemplate.findFirst({ where: { schoolId: s, active: true, kind: "BONAFIDE" }, orderBy: { createdAt: "asc" } }),
    db.certificateTemplate.findFirst({ where: { schoolId: s, active: false }, orderBy: { createdAt: "asc" }, select: { id: true } }),
    db.issuedCertificate.findFirst({ where: { schoolId: s, revokedAt: null }, orderBy: { issuedAt: "asc" }, select: { id: true, code: true } }),
    db.issuedCertificate.findFirst({ where: { schoolId: s, revokedAt: null, kind: "STUDY" }, orderBy: { issuedAt: "desc" }, select: { id: true } }),
  ]);
  let body: Record<string, unknown> | null = null;
  if (active) {
    try {
      body = { kind: active.kind, name: active.name, locale: active.locale, title: active.title, intro: active.intro, rows: JSON.parse(active.rowsJson), outro: active.outro, layout: JSON.parse(active.layoutJson), serialPrefix: active.serialPrefix, active: true };
    } catch {
      body = null;
    }
  }
  const [cancelled, declined] = await Promise.all([
    db.certificateRequest.findFirst({ where: { schoolId: s, status: "CANCELLED" }, select: { id: true } }),
    db.certificateRequest.findFirst({ where: { schoolId: s, status: "DECLINED" }, select: { id: true } }),
  ]);
  const pen = await db.user.findFirst({ where: { penNumber: { not: null }, memberships: { some: { schoolId: s, role: "STUDENT", status: "ACTIVE" } } }, select: { penNumber: true } });
  // A pending request first; otherwise the newest settled one, which every write answers as it stands — so the sweep stays repeatable after its own rejection.
  const penChange = (await db.penChangeRequest.findFirst({ where: { schoolId: s, status: "PENDING" }, orderBy: { createdAt: "asc" }, select: { id: true, toPen: true } })) ?? (await db.penChangeRequest.findFirst({ where: { schoolId: s }, orderBy: { createdAt: "desc" }, select: { id: true, toPen: true } }));
  // The fixture's settled ask, by id (zz-fixtures.ts `buildRecordChanges`): deciding it and taking it back are both answered as it stands.
  const recordChange = await db.recordChangeRequest.findFirst({ where: { schoolId: s, id: { in: ["zz-fixture-record-change", "zz-fixture-record-change-southbank"] }, status: { not: "PENDING" } }, select: { id: true } });
  return { certificateTemplateId: active?.id ?? null, certificateTemplate: body, retiredTemplateId: retired?.id ?? null, certificateId: issued?.id ?? null, revocableCertificateId: revocable?.id ?? null, certificateCode: issued?.code ?? null, cancelledCertificateRequestId: cancelled?.id ?? null, declinedCertificateRequestId: declined?.id ?? null, penNumber: pen?.penNumber ?? null, penChangeId: penChange?.id ?? null, penChangeToPen: penChange?.toPen ?? null, recordChangeId: recordChange?.id ?? null };
}

/** The ZZ admissions: the open cycle and its body, the closed one, the sweep parent's application (the same guardian `actors()` picks) and one in each settled state. */
async function admissionFixture(s: string): Promise<Pick<SweepFixture, "admissionCycleId" | "admissionCycle" | "closedCycleId" | "admissionGrade" | "admissionSlotId" | "cancelledSlotId" | "applicationId" | "offeredApplicationId" | "acceptedApplicationId" | "admittedApplicationId" | "waitlistedApplicationId" | "withdrawnApplicationId">> {
  const [open, closed, cancelled, guardian] = await Promise.all([
    db.admissionCycle.findFirst({ where: { schoolId: s, status: "OPEN" }, orderBy: { createdAt: "asc" } }),
    db.admissionCycle.findFirst({ where: { schoolId: s, status: "CLOSED" }, orderBy: { createdAt: "asc" }, select: { id: true } }),
    db.entranceSlot.findFirst({ where: { schoolId: s, cancelledAt: { not: null } }, select: { id: true } }),
    db.guardianship.findFirst({ where: { studentSchoolId: s, status: "ACTIVE" }, select: { parentUserId: true } }),
  ]);
  let body: Record<string, unknown> | null = null;
  let grade: string | null = null;
  if (open) {
    try {
      const grades = JSON.parse(open.gradesJson) as { grade: string; seats: number }[];
      grade = grades[0]?.grade ?? null;
      body = { academicYearId: open.academicYearId, name: open.name, grades, documents: JSON.parse(open.documentsJson), testRequired: open.testRequired, notice: open.notice, feeStructureId: open.feeStructureId, opensAt: open.opensAt?.toISOString().slice(0, 10) ?? null, closesAt: open.closesAt?.toISOString().slice(0, 10) ?? null };
    } catch {
      body = null;
    }
  }
  // The SUBMITTED one must carry documents: the verify step refuses an empty folder, rightly.
  const mine = (status: string) => (open && guardian ? db.application.findFirst({ where: { cycleId: open.id, applicantUserId: guardian.parentUserId, status, ...(status === "SUBMITTED" ? { documentsJson: { not: "[]" } } : {}) }, orderBy: { number: "asc" }, select: { id: true, testSlotId: true } }) : Promise.resolve(null));
  const [submitted, offered, accepted, admitted, waitlisted, withdrawn] = await Promise.all([mine("SUBMITTED"), mine("OFFERED"), mine("ACCEPTED"), mine("ADMITTED"), mine("WAITLISTED"), mine("WITHDRAWN")]);
  return { admissionCycleId: open?.id ?? null, admissionCycle: body, closedCycleId: closed?.id ?? null, admissionGrade: grade, admissionSlotId: submitted?.testSlotId ?? null, cancelledSlotId: cancelled?.id ?? null, applicationId: submitted?.id ?? null, offeredApplicationId: offered?.id ?? null, acceptedApplicationId: accepted?.id ?? null, admittedApplicationId: admitted?.id ?? null, waitlistedApplicationId: waitlisted?.id ?? null, withdrawnApplicationId: withdrawn?.id ?? null };
}

async function fixture(slug = "zz-northgate-school"): Promise<SweepFixture> {
  const school = await db.school.findUniqueOrThrow({ where: { slug } });
  const s = school.id;
  const first = async <T extends { id: string }>(q: Promise<T | null>) => (await q)?.id ?? null;
  /**
   * This school's waiting fixture among the ids the builder gives (zz-fixtures.ts `waitingIds`), made new
   * first: a request lives thirty days, and a fixture built in August must still be waiting in October.
   * Null when the fixtures have not made it.
   */
  const again = { status: "PENDING", createdAt: new Date(), decidedAt: null, declineReason: null };
  const waitingJoin = async (ids: string[]) => {
    await db.joinRequest.updateMany({ where: { id: { in: ids }, schoolId: s }, data: again });
    return first(db.joinRequest.findFirst({ where: { id: { in: ids }, schoolId: s }, select: { id: true } }));
  };
  const waitingClaim = async (ids: string[]) => {
    await db.guardianClaim.updateMany({ where: { id: { in: ids }, schoolId: s }, data: again });
    return first(db.guardianClaim.findFirst({ where: { id: { in: ids }, schoolId: s }, select: { id: true } }));
  };
  // The grade-3 class first: the exams, cards, records, syllabus and certificates fixtures all live there, and the teacher actor is its lead.
  const klass = (await db.class.findFirst({ where: { schoolId: s, archivedAt: null, gradeLevel: "3", enrollments: { some: { status: "ACTIVE" } } }, select: { id: true } })) ?? (await db.class.findFirst({ where: { schoolId: s, archivedAt: null, enrollments: { some: { status: "ACTIVE" } } }, select: { id: true } }));
  const student = klass ? await db.enrollment.findFirst({ where: { classId: klass.id, status: "ACTIVE" }, select: { studentMembershipId: true } }) : null;
  const lead = klass ? await db.classTeacher.findFirst({ where: { classId: klass.id, role: "LEAD" }, select: { teacherMembershipId: true } }) : null;
  return {
    schoolId: s,
    classId: klass?.id ?? null,
    studentMembershipId: student?.studentMembershipId ?? null,
    teacherMembershipId: lead?.teacherMembershipId ?? null,
    adminMembershipId: await first(db.membership.findFirst({ where: { schoolId: s, role: "ADMIN", status: "ACTIVE" }, select: { id: true } })),
    examSeriesId: await first(db.examSeries.findFirst({ where: { schoolId: s }, select: { id: true } })),
    examSlotId: await first(db.examSlot.findFirst({ where: { schoolId: s }, select: { id: true } })),
    assignmentId: await first(db.assignment.findFirst({ where: { schoolId: s }, select: { id: true } })),
    postId: await first(db.post.findFirst({ where: { schoolId: s }, select: { id: true } })),
    heldCommentId: await first(db.comment.findFirst({ where: { schoolId: s, status: "PENDING" }, orderBy: { createdAt: "asc" }, select: { id: true } })),
    // The fixture's own two rows, by id (zz-fixtures.ts `buildWaiting`), made new first: a request
    // lives thirty days, and a fixture built in August must still be waiting in October.
    joinRequestId: await waitingJoin(["zz-fixture-join", "zz-fixture-join-southbank"]),
    guardianClaimId: await waitingClaim(["zz-fixture-claim", "zz-fixture-claim-southbank"]),
    otherClassJoinRequestId: await waitingJoin(["zz-fixture-join-other"]),
    otherFamilyClaimId: await waitingClaim(["zz-fixture-claim-other"]),
    conversationId: await first(db.conversation.findFirst({ where: { schoolId: s }, select: { id: true } })),
    remarkThreadId: await first(db.remarkThread.findFirst({ where: { schoolId: s }, select: { id: true } })),
    // One a pupil could actually enter today, so the sweep's POST proves the door and not a closed date.
    competitionId: await first(db.competition.findFirst({ where: { status: "PUBLISHED", registrationClosesAt: { gt: new Date() }, organizerSchoolId: null }, select: { id: true } })),
    vacancyId: await first(db.jobPosting.findFirst({ where: { schoolId: s }, select: { id: true } })),
    enquiryId: await first(db.enquiry.findFirst({ where: { schoolId: s }, select: { id: true } })),
    meetingSlotId: await first(db.meetingSlot.findFirst({ where: { schoolId: s }, select: { id: true } })),
    inviteId: await first(db.invite.findFirst({ where: { schoolId: s }, select: { id: true } })),
    leaveRequestId: await first(db.leaveRequest.findFirst({ where: { schoolId: s }, select: { id: true } })),
    reviewRoundId: await first(db.reviewRound.findFirst({ where: { schoolId: s }, select: { id: true } })),
    academicYearId: await first(db.academicYear.findFirst({ where: { schoolId: s }, select: { id: true } })),
    termId: await first(db.term.findFirst({ where: { schoolId: s }, select: { id: true } })),
    notificationId: await first(db.notification.findFirst({ where: { schoolId: s }, select: { id: true } })),
    fileId: null,
    feeHeadId: await first(db.feeHead.findFirst({ where: { schoolId: s }, select: { id: true } })),
    feeStructureId: await first(db.feeStructure.findFirst({ where: { schoolId: s, publishedAt: { not: null } }, select: { id: true } })),
    feePaymentId: await first(db.feePayment.findFirst({ where: { schoolId: s, status: "PAID" }, select: { id: true } })),
    feeReceiptId: await first(db.feeReceipt.findFirst({ where: { schoolId: s }, select: { id: true } })),
    broadcastId: await first(db.broadcast.findFirst({ where: { schoolId: s }, select: { id: true } })),
    // An OPEN one, so the sweep's note and close both have a door; zz:fixtures leaves one open on every run.
    // …and on a pupil of the sampled class, so its lead — the sweep's teacher — may add a note; the newest open incident is often one an earlier sweep opened on another class.
    incidentId: await first(db.incident.findFirst({ where: { schoolId: s, status: "OPEN", ...(klass ? { student: { enrollments: { some: { classId: klass.id, status: "ACTIVE" } } } } : {}) }, orderBy: { createdAt: "desc" }, select: { id: true } })),
    circularId: await first(db.post.findFirst({ where: { schoolId: s, requiresAck: true, status: "APPROVED" }, orderBy: { createdAt: "desc" }, select: { id: true } })),
    syllabusUnitId: klass ? await first(db.syllabusUnit.findFirst({ where: { schoolId: s, gradeLevel: (await db.class.findUniqueOrThrow({ where: { id: klass.id }, select: { gradeLevel: true } })).gradeLevel ?? "" }, orderBy: { position: "asc" }, select: { id: true } })) : null,
    lessonPlanId: klass ? await first(db.lessonPlan.findFirst({ where: { classId: klass.id }, orderBy: { createdAt: "desc" }, select: { id: true } })) : null,
    ...(await substitutionFixture(s)),
    ...(await reportCardFixture(s)),
    ...(await certificateFixture(s)),
    ...(await admissionFixture(s)),
    todayKey: new Date().toISOString().slice(0, 10),
  };
}

async function actors(): Promise<Record<Role, string>> {
  const school = await db.school.findUniqueOrThrow({ where: { slug: "zz-northgate-school" } });
  const byEmail = async (email: string) => (await db.user.findUniqueOrThrow({ where: { email }, select: { id: true } })).id;
  // The teacher is the LEAD of the class the fixture samples, so the class-scoped writes (incidents, lessons) are theirs to make; "the first teacher" depended on row order and broke when the fixtures were rebuilt.
  const sampledClass = (await db.class.findFirst({ where: { schoolId: school.id, archivedAt: null, gradeLevel: "3", enrollments: { some: { status: "ACTIVE" } } }, select: { id: true } })) ?? (await db.class.findFirst({ where: { schoolId: school.id, archivedAt: null, enrollments: { some: { status: "ACTIVE" } } }, select: { id: true } }));
  const lead = sampledClass ? await db.classTeacher.findFirst({ where: { classId: sampledClass.id, role: "LEAD" }, select: { teacher: { select: { userId: true } } } }) : null;
  const teacher = lead ? { userId: lead.teacher.userId } : await db.membership.findFirstOrThrow({ where: { schoolId: school.id, role: "TEACHER", status: "ACTIVE" }, select: { userId: true } });
  // The pupil and the guardian BY NAME: pupil 01 and their parent, whom the fixtures give the certificate
  // requests, the record and the remark thread the samples point at. "The first pupil" was whichever row the
  // database returned first, and the sweep's own writes move rows: each run signed in as a different child,
  // and the one after a rebuild was refused another pupil's certificate request with a 404 that was right.
  const pupil = (await db.membership.findFirst({ where: { schoolId: school.id, role: "STUDENT", status: "ACTIVE", leftAt: null, user: { email: "zz.pupil01@zz.test" } }, select: { id: true, userId: true } }))
    ?? (await db.membership.findFirstOrThrow({ where: { schoolId: school.id, role: "STUDENT", status: "ACTIVE" }, orderBy: { id: "asc" }, select: { id: true, userId: true } }));
  const guardian = (await db.guardianship.findFirst({ where: { studentMembershipId: pupil.id, status: "ACTIVE", relation: { not: "SCHOOL" } }, orderBy: { id: "asc" }, select: { parentUserId: true } }))
    ?? (await db.guardianship.findFirstOrThrow({ where: { studentSchoolId: school.id, status: "ACTIVE" }, orderBy: { id: "asc" }, select: { parentUserId: true } }));
  const expert = await db.expertProfile.findFirst({ where: { user: { email: { endsWith: "@zz.test" } } }, select: { userId: true } });
  const out: Partial<Record<Role, string>> = {
    ADMIN: await mint(await byEmail("zz.admin@zz.test"), "ADMIN", school.id),
    PRINCIPAL: await mint(await byEmail("zz.principal@zz.test"), "PRINCIPAL", school.id),
    TEACHER: await mint(teacher.userId, "TEACHER", school.id),
    STUDENT: await mint(pupil.userId, "STUDENT", school.id),
    PARENT: await mint(guardian.parentUserId, "PARENT", null),
  };
  if (expert) out.EXPERT = await mint(expert.userId, "EXPERT", null);
  return out as Record<Role, string>;
}

/**
 * Whether the fixture school is closed today by its own calendar — a day off
 * its teaching week, or a closing holiday. The staff self check-in refuses a
 * closed day by design, so on a Sunday in the school's zone the door answers
 * 403 to every permitted role and the sweep must expect that rather than 200.
 */
const CLOSING_KINDS = (Object.keys(HOLIDAY_KIND_META) as HolidayKind[]).filter((k) => HOLIDAY_KIND_META[k].closesSchool);
let checkInClosedToday = false;
async function readCheckInClosure(slug = "zz-northgate-school"): Promise<void> {
  const school = await db.school.findUniqueOrThrow({ where: { slug }, select: { id: true, timezone: true, teachingDays: true } });
  const key = new Intl.DateTimeFormat("en-CA", { timeZone: school.timezone, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  const week = parseTeachingDays(school.teachingDays);
  const closed = await db.holiday.findFirst({ where: { schoolId: school.id, startDateKey: { lte: key }, endDateKey: { gte: key }, kind: { in: CLOSING_KINDS } }, select: { id: true } });
  checkInClosedToday = !week.includes(new Date(`${key}T00:00:00Z`).getUTCDay()) || closed !== null;
  if (checkInClosedToday) console.log(`· ${key} is a closed day for the fixture school: the staff check-in is expected to refuse`);
}

function expected(e: Endpoint, role: Role | null): number | number[] {
  if (role === null) return e.access === "anyone" ? (e.emptyBodyStatus ?? 200) : 401;
  // The operator and the content team hold no school role: every role token is refused.
  if (e.access === "operator" || e.access === "app-admin") return 403;
  const permitted = e.access === "anyone" || e.access === "signed-in" || e.access.includes(role);
  if (!permitted) return 403;
  if (e.path === "/api/v1/staff/attendance/check-in" && checkInClosedToday) return 403;
  if (e.method === "GET") return e.path === "/api/v1/events" ? 200 : [200, 404];
  return e.emptyBodyStatus ?? [200, 404, 422];
}

/**
 * A status of 0 is a socket the server dropped, not an answer: the dev
 * server sheds its keep-alive connections while it compiles a route in the
 * background, and a run of 0s at the tail of the catalog was the whole of
 * four failed sweeps in a row. One retry after a short pause; a second 0
 * is reported as the result, so a door that is really shut still shows.
 */
async function hit(e: Endpoint, token: string | null, path: string, body?: string): Promise<number> {
  const first = await hitOnce(e, token, path, body);
  if (first !== 0) return first;
  await new Promise((resolve) => setTimeout(resolve, 750));
  return hitOnce(e, token, path, body);
}

async function hitOnce(e: Endpoint, token: string | null, path: string, body?: string): Promise<number> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8_000);
  try {
    const res = await fetch(BASE + path, {
      method: e.method,
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(e.method === "GET" ? {} : { "content-type": "application/json" }) },
      body: e.method === "GET" ? undefined : (body ?? "{}"),
      signal: controller.signal,
    });
    if (e.path === "/api/v1/events") controller.abort(); // a stream: the status is the answer
    return res.status;
  } catch (err) {
    if ((err as { name?: string }).name === "AbortError") return 200; // the stream opened
    return 0;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * The cross-tenant and cross-person probes (`--cross=school`, `--cross=person`).
 *
 * The ordinary sweep proves each door opens for the right role with the
 * school's own ids. These two prove it stays shut for the WRONG ids: every
 * catalogued endpoint whose sample carries an id is called by ZZ Northgate's
 * actors with another school's ids (school), or with a classmate the family
 * actors are not linked to (person). A refusal is a pass — 401, 403, 404,
 * 405 and 422 all keep the fence — and a 2xx is reported as a breach. NO
 * ANSWER IS NOT A REFUSAL: with the server down every call came back with
 * nothing, and the probe counted each as a door that stayed shut (found
 * 2026-09-29, when the app had stopped the dev server). The probe now asks
 * /api/health first and stops if it is not answered, and a call that gets
 * no answer or a 5xx is reported apart and fails the run.
 * Platform-wide surfaces (shared, competitions, vacancies, experts, the
 * operator's and the content team's) are outside a school's fence and skipped.
 */
const CROSS_MODE = (process.argv.find((a) => a.startsWith("--cross="))?.slice(8) ?? null) as "school" | "person" | null;
/** `--only=a,b`: the endpoints whose catalog path contains any of these. */
const ONLY = process.argv.find((a) => a.startsWith("--only="))?.slice(7).split(",").filter(Boolean) ?? null;
const CROSS_SCHOOL = process.argv.find((a) => a.startsWith("--other="))?.slice(8) ?? "zz-southbank-school";
const PLATFORM_WIDE = [/^\/api\/v1\/shared\//, /^\/api\/v1\/competitions/, /^\/api\/v1\/contest/, /^\/api\/v1\/vacancies/, /^\/api\/v1\/expert/, /^\/api\/v1\/operator/, /^\/api\/v1\/appadmin/, /^\/api\/v1\/auth\//, /^\/api\/v1\/me\b/, /^\/api\/v1\/account/];

/** Doors that answer for another school ON PURPOSE, with what they give away. */
const CROSS_SCHOOL_BY_DESIGN: Record<string, string> = {
  "GET /api/v1/office/pupils/by-pen/{pen}": "answers HERE / ELSEWHERE_ACTIVE / ELSEWHERE_LEFT / NONE by state alone; the other school's name, class and record stay behind the fence (pen.ts)",
};

async function crossProbe(mode: "school" | "person") {
  const health = await fetch(BASE + "/api/health").then((r) => r.status, () => 0);
  if (health !== 200) throw new Error(`cross-${mode}: ${BASE}/api/health answered ${health}; the server is down, and nothing was tried`);
  const tokens = await actors();
  const home = await db.school.findUniqueOrThrow({ where: { slug: "zz-northgate-school" }, select: { id: true } });
  const homeFx = await fixture();
  const byDesign: string[] = [];
  const ownData: string[] = [];
  /** The doors tried with a body or a path of the probe's own, named so the count can be read. */
  const tried: string[] = [];
  // A door that answers 2xx is a breach only if the answer carries the other person's id or name; a family door that
  // ignores a childId it was not built to take and answers the caller's OWN child is not a leak — it is listed apart.
  const check = async (e: Endpoint, role: Role, path: string, body: Record<string, unknown> | null, label: string, mustNotCarry: string[] = []) => {
    const res = await hitText(e, tokens[role], path, body ? JSON.stringify(body) : undefined);
    const twoXx = res.status >= 200 && res.status < 300;
    const leak = twoXx && mustNotCarry.some((needle) => needle && res.text.includes(needle));
    // No answer, or the server's own failure, says nothing about the fence.
    const unanswered = res.status === 0 || res.status >= 500;
    const ok = !unanswered && (!twoXx || (mustNotCarry.length > 0 && !leak));
    if (twoXx && !leak && mustNotCarry.length > 0) ownData.push(`${e.method} ${e.path} as ${role}: ${res.status}, answered without the other person`);
    results.push({ endpoint: `${e.method} ${e.path}${body ? " (valid body)" : ""} [${label}]`, role, expected: [401, 403, 404, 422], got: res.status, ok });
  };
  if (mode === "school") {
    const fx = await fixture(CROSS_SCHOOL);
    for (const e of ENDPOINTS) {
      // The probe's own path where the ordinary sweep has none (a door with no body, whose call is the act).
      const pathOf = e.probe?.path ?? (typeof e.sample === "function" ? e.sample : null);
      if (!pathOf) continue; // a fixed path carries no id to swap
      if (e.access === "anyone") { skipped.push(`${e.method} ${e.path} (public)`); continue; }
      // A door that names a probe is a school's, wherever it is filed: the queue of people waiting is under /shared.
      if (!e.probe && PLATFORM_WIDE.some((re) => re.test(e.path))) { skipped.push(`${e.method} ${e.path} (platform-wide)`); continue; }
      const key = `${e.method} ${e.path}`;
      if (CROSS_SCHOOL_BY_DESIGN[key]) { byDesign.push(`${key}: ${CROSS_SCHOOL_BY_DESIGN[key]}`); continue; }
      const path = pathOf(fx);
      if (path === null || /\{\w+\}/.test(path)) { skipped.push(key); continue; }
      if (path === pathOf(homeFx)) { skipped.push(`${key} (no id in the path)`); continue; }
      // A valid body, so the refusal is the fence's and not the parser's.
      const body = e.probe?.body ? e.probe.body(fx) : e.sampleBody ? e.sampleBody(fx) : null;
      if (e.probe) tried.push(`${key}${body ? " (valid body)" : ""}`);
      for (const role of (ROLES as readonly Role[]).filter((r) => tokens[r])) {
        if (Array.isArray(e.access) && !e.access.includes(role)) continue; // a role the door refuses anyway proves nothing here
        await check(e, role, path, body, "another school's ids");
      }
    }
  } else {
    // A guardian asks for a child that is not theirs; a teacher for a pupil in a class they do not teach.
    // The guardian the PARENT actor IS (actors(), above): pupil 01's. "The first guardianship" could be another
    // family's, and the child chosen as "not theirs" would then be measured against the wrong parent.
    const theirs = await db.membership.findFirst({ where: { schoolId: home.id, role: "STUDENT", status: "ACTIVE", leftAt: null, user: { email: "zz.pupil01@zz.test" } }, select: { id: true } });
    const guardian =
      (theirs ? await db.guardianship.findFirst({ where: { studentMembershipId: theirs.id, status: "ACTIVE", relation: { not: "SCHOOL" } }, orderBy: { id: "asc" }, select: { parentUserId: true } }) : null) ??
      (await db.guardianship.findFirstOrThrow({ where: { studentSchoolId: home.id, status: "ACTIVE" }, orderBy: { id: "asc" }, select: { parentUserId: true } }));
    const linked = (await db.guardianship.findMany({ where: { parentUserId: guardian.parentUserId }, select: { studentMembershipId: true } })).map((g) => g.studentMembershipId);
    const notMine = await db.membership.findFirst({ where: { schoolId: home.id, role: "STUDENT", status: "ACTIVE", leftAt: null, id: { notIn: linked } }, orderBy: { id: "asc" }, select: { id: true } });
    const teacherLead = homeFx.classId ? await db.classTeacher.findFirst({ where: { classId: homeFx.classId, role: "LEAD" }, select: { teacherMembershipId: true } }) : null;
    const taught = teacherLead ? (await db.classTeacher.findMany({ where: { teacherMembershipId: teacherLead.teacherMembershipId }, select: { classId: true } })).map((c) => c.classId) : [];
    const untaughtPupil = await db.enrollment.findFirst({ where: { schoolId: home.id, status: "ACTIVE", classId: { notIn: taught }, class: { archivedAt: null }, student: { status: "ACTIVE", leftAt: null } }, select: { studentMembershipId: true } });
    if (!notMine) throw new Error("no unlinked pupil to probe with");
    const nameOf = async (id: string) => (await db.membership.findUniqueOrThrow({ where: { id }, select: { user: { select: { name: true } } } })).user.name;
    const notMineNeedles = [notMine.id, await nameOf(notMine.id)];
    // The queue's two decisions, by the people who may decide SOME and not these: a teacher of another class,
    // and a guardian of another child. A valid decision is sent, so the refusal is the rule's.
    const decide = (path: string) => ENDPOINTS.find((e) => e.method === "POST" && e.path === path)!;
    if (homeFx.otherClassJoinRequestId) {
      const e = decide("/api/v1/shared/joins/{requestId}/decide");
      await check(e, "TEACHER", `/api/v1/shared/joins/${homeFx.otherClassJoinRequestId}/decide`, { decision: "APPROVE" }, "a join by another class's code");
      tried.push(`POST ${e.path} as TEACHER (valid body)`);
    } else skipped.push("POST /api/v1/shared/joins/{requestId}/decide (no join by another class's code in the fixtures)");
    if (homeFx.otherFamilyClaimId) {
      const e = decide("/api/v1/shared/claims/{claimId}/decide");
      await check(e, "PARENT", `/api/v1/shared/claims/${homeFx.otherFamilyClaimId}/decide`, { decision: "APPROVE" }, "a claim on a child not theirs");
      tried.push(`POST ${e.path} as PARENT (valid body)`);
    } else skipped.push("POST /api/v1/shared/claims/{claimId}/decide (no claim on another family's child in the fixtures)");
    // An ask to change the record of a child who is not theirs, still waiting (zz-fixtures.ts `buildRecordChanges`):
    // the guardian and the pupil each try to take it back. The loop below tries the same door with the id of their
    // OWN settled ask and another child on the query string, which the door does not read; that proves nothing of
    // the fence, so the ask itself is another family's here.
    const othersAsk = await db.recordChangeRequest.findFirst({ where: { schoolId: home.id, status: "PENDING", studentMembershipId: { notIn: [...linked, ...(theirs ? [theirs.id] : [])] } }, orderBy: { id: "asc" }, select: { id: true } });
    if (othersAsk) {
      const e = decide("/api/v1/family/record/changes/{requestId}/withdraw");
      for (const role of ["PARENT", "STUDENT"] as const) {
        await check(e, role, `/api/v1/family/record/changes/${othersAsk.id}/withdraw`, null, "an ask about a child not theirs");
        tried.push(`POST ${e.path} as ${role}`);
      }
    } else skipped.push("POST /api/v1/family/record/changes/{requestId}/withdraw (no ask waiting on another family's child in the fixtures)");
    const untaughtNeedles = untaughtPupil ? [untaughtPupil.studentMembershipId, await nameOf(untaughtPupil.studentMembershipId)] : [];
    for (const e of ENDPOINTS) {
      if (e.access === "anyone" || PLATFORM_WIDE.some((re) => re.test(e.path))) continue;
      const permitted = (r: Role) => e.access === "signed-in" || (Array.isArray(e.access) && e.access.includes(r));
      const base = typeof e.sample === "function" ? e.sample(homeFx) : (e.sample ?? e.path);
      if (base === null || /\{\w+\}/.test(base)) continue;
      const body = e.sampleBody ? e.sampleBody(homeFx) : null;
      // PARENT: every family door with another child's id on the query string.
      if (e.path.startsWith("/api/v1/family/") && permitted("PARENT")) {
        const path = `${base}${base.includes("?") ? "&" : "?"}childId=${notMine.id}`;
        await check(e, "PARENT", path, body, "a child not theirs", notMineNeedles);
      }
      // TEACHER: any door whose sample names the fixture pupil, with a pupil from a class the teacher does not teach.
      if (untaughtPupil && homeFx.studentMembershipId && permitted("TEACHER") && (base.includes(homeFx.studentMembershipId) || (body && JSON.stringify(body).includes(homeFx.studentMembershipId)))) {
        const swap = (v: string) => v.split(homeFx.studentMembershipId!).join(untaughtPupil.studentMembershipId);
        const swappedBody = body ? (JSON.parse(swap(JSON.stringify(body))) as Record<string, unknown>) : null;
        await check(e, "TEACHER", swap(base), swappedBody, "a pupil of a class they do not teach", untaughtNeedles);
      }
    }
  }
  const failed = results.filter((r) => !r.ok);
  for (const r of failed) console.log(r.got === 0 || r.got >= 500 ? `✗ NO ANSWER ${r.endpoint} as ${r.role}: got ${r.got}` : `✗ BREACH ${r.endpoint} as ${r.role}: got ${r.got}`);
  for (const d of tried) console.log(`· tried: ${d}`);
  for (const b of byDesign) console.log(`· by design: ${b}`);
  for (const o of ownData) console.log(`· own data: ${o}`);
  console.log(`cross-${mode}: ${results.length - failed.length}/${results.length} doors stayed shut, ${failed.filter((r) => r.got !== 0 && r.got < 500).length} opened, ${failed.filter((r) => r.got === 0 || r.got >= 500).length} unanswered, ${skipped.length} skipped.`);
  if (failed.length > 0) process.exitCode = 1;
}

async function hitText(e: Endpoint, token: string | null, path: string, body?: string): Promise<{ status: number; text: string }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8_000);
  try {
    const res = await fetch(BASE + path, { method: e.method, headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(e.method === "GET" ? {} : { "content-type": "application/json" }) }, body: e.method === "GET" ? undefined : (body ?? "{}"), signal: controller.signal });
    return { status: res.status, text: await res.text() };
  } catch {
    return { status: 0, text: "" };
  } finally {
    clearTimeout(timer);
  }
}

async function main() {
  if (CROSS_MODE) return crossProbe(CROSS_MODE);
  const tokens = await actors();
  const fx = await fixture();
  await readCheckInClosure();
  for (const e of ENDPOINTS) {
    if (ONLY && !ONLY.some((text) => e.path.includes(text))) continue;
    const path = typeof e.sample === "function" ? e.sample(fx) : (e.sample ?? e.path);
    if (path === null || /\{\w+\}/.test(path)) {
      skipped.push(`${e.method} ${e.path}`);
      continue;
    }
    const goodBody = e.sampleBody ? e.sampleBody(fx) : null;
    // Sign-in endpoints mint sessions and burn rate limits; the sweep checks
    // their shape signed out only, with an empty body.
    const roles: (Role | null)[] = e.access === "anyone" ? [null] : [null, ...(ROLES as readonly Role[]).filter((r) => tokens[r])];
    for (const role of roles) {
      if (e.path === "/api/v1/auth/logout" && role) continue; // would revoke the sweep's own session
      const want = expected(e, role);
      const got = await hit(e, role ? tokens[role] : null, path);
      const ok = Array.isArray(want) ? want.includes(got) : want === got;
      results.push({ endpoint: `${e.method} ${e.path}`, role: role ?? "anonymous", expected: want, got, ok });
      // With a valid body, a permitted role must get through (200), which is
      // the half of the contract an empty body cannot prove.
      if (goodBody && role && e.method !== "GET" && (e.access === "signed-in" || (Array.isArray(e.access) && e.access.includes(role)))) {
        const status = await hit(e, tokens[role], path, JSON.stringify(goodBody));
        results.push({ endpoint: `${e.method} ${e.path} (valid body)`, role, expected: [200, 201], got: status, ok: status === 200 || status === 201 });
      }
    }
  }
  const failed = results.filter((r) => !r.ok);
  for (const r of failed) console.log(`✗ ${r.endpoint} as ${r.role}: expected ${JSON.stringify(r.expected)}, got ${r.got}`);
  for (const s of skipped) console.log(`· skipped (no sample): ${s}`);
  console.log(`${results.length - failed.length}/${results.length} as expected, ${failed.length} unexpected, ${skipped.length} skipped.`);
  if (failed.length) process.exitCode = 1;
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (minted.length) await db.session.deleteMany({ where: { id: { in: minted } } });
    await db.$disconnect();
  });
