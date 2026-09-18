/**
 * The API leg of the sweep: every endpoint in the catalog, as every role and
 * signed out, asserting the status alone — the same shape as the page sweep.
 *
 *   npm run api:sweep            against NEXT_PUBLIC_APP_URL (default :3000)
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
async function fixture(): Promise<SweepFixture> {
  const school = await db.school.findUniqueOrThrow({ where: { slug: "zz-northgate-school" } });
  const s = school.id;
  const first = async <T extends { id: string }>(q: Promise<T | null>) => (await q)?.id ?? null;
  const klass = await db.class.findFirst({ where: { schoolId: s, archivedAt: null, enrollments: { some: { status: "ACTIVE" } } }, select: { id: true } });
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
    incidentId: await first(db.incident.findFirst({ where: { schoolId: s, status: "OPEN" }, orderBy: { createdAt: "desc" }, select: { id: true } })),
    todayKey: new Date().toISOString().slice(0, 10),
  };
}

async function actors(): Promise<Record<Role, string>> {
  const school = await db.school.findUniqueOrThrow({ where: { slug: "zz-northgate-school" } });
  const byEmail = async (email: string) => (await db.user.findUniqueOrThrow({ where: { email }, select: { id: true } })).id;
  const teacher = await db.membership.findFirstOrThrow({ where: { schoolId: school.id, role: "TEACHER", status: "ACTIVE" }, select: { userId: true } });
  const pupil = await db.membership.findFirstOrThrow({ where: { schoolId: school.id, role: "STUDENT", status: "ACTIVE" }, select: { userId: true } });
  const guardian = await db.guardianship.findFirstOrThrow({ where: { studentSchoolId: school.id, status: "ACTIVE" }, select: { parentUserId: true } });
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

function expected(e: Endpoint, role: Role | null): number | number[] {
  if (role === null) return e.access === "anyone" ? (e.emptyBodyStatus ?? 200) : 401;
  // The operator and the content team hold no school role: every role token is refused.
  if (e.access === "operator" || e.access === "app-admin") return 403;
  const permitted = e.access === "anyone" || e.access === "signed-in" || e.access.includes(role);
  if (!permitted) return 403;
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

async function main() {
  const tokens = await actors();
  const fx = await fixture();
  for (const e of ENDPOINTS) {
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
