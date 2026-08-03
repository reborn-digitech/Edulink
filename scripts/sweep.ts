/**
 * Route sweep. Mints a real session row per role, then requests every route the
 * navigation offers AS a signed-in user of the role that owns it.
 *
 * Asserts 200 specifically. "200 or a redirect" is what previously let a 404 and
 * a five-commit-old 500 through — a redirect to /login is a route that never
 * rendered, not a route that works.
 *
 * Run: tsx --tsconfig scripts/tsconfig.json scripts/sweep.ts
 */
import { PrismaClient } from "@prisma/client";
import { createHash, randomBytes } from "node:crypto";
import { config } from "dotenv";

config();

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
const db = new PrismaClient({ datasourceUrl: process.env.DATABASE_ADMIN_URL });

type Actor = { label: string; cookie: string; sessionId: string };

async function mint(email: string, role: string | null, schoolId: string | null, label: string): Promise<Actor> {
  const user = await db.user.findUnique({ where: { email } });
  if (!user) throw new Error(`no such user: ${email}`);
  const token = randomBytes(32).toString("base64url");
  const session = await db.session.create({
    data: {
      userId: user.id,
      tokenHash: createHash("sha256").update(token).digest("hex"),
      activeSchoolId: schoolId,
      activeRole: role,
      userAgent: "sweep",
      expiresAt: new Date(Date.now() + 3_600_000),
    },
  });
  return { label, cookie: `edulink_session=${token}`, sessionId: session.id };
}

async function hit(actor: Actor | null, path: string): Promise<{ status: number; body: string; loc: string | null }> {
  const res = await fetch(BASE + path, {
    headers: actor ? { cookie: actor.cookie } : {},
    redirect: "manual",
  });
  const body = res.status === 200 ? await res.text() : "";
  return { status: res.status, body, loc: res.headers.get("location") };
}

const results: { role: string; path: string; status: number; expected: number; ok: boolean; note: string }[] = [];

async function check(actor: Actor | null, path: string, expected = 200, note = "") {
  const { status, loc } = await hit(actor, path);
  const ok = status === expected;
  results.push({
    role: actor?.label ?? "anonymous",
    path,
    status,
    expected,
    ok,
    note: ok ? note : `${note}${loc ? ` → ${loc}` : ""}`.trim(),
  });
}

/**
 * One person, two schools — built for the length of this check and taken away
 * again, because the seed has nobody in this position and adding one would move
 * every count the other suites assert.
 *
 * It is here rather than in `npm test` because it is invisible from there: the
 * suite connects as the database owner, where the policies do not apply and the
 * bug this catches cannot happen. What it catches is a joined read across
 * schools — the switcher asking for a school row the tenant is not scoped to,
 * which Prisma turns into a 500 rather than a null. The nav shell calls it on
 * every page, so it was a 500 on all of them, not just `/switch`.
 *
 * And the half that matters more: that the widening the switcher needs stays
 * inside the switcher.
 */
async function twoSchoolTeacher(riversideId: string, oakfieldId: string) {
  const tom = await db.user.findUniqueOrThrow({ where: { email: "tom@riverside.school" } });
  const oakClass = await db.class.findFirstOrThrow({ where: { schoolId: oakfieldId } });
  const homeClass = await db.classTeacher.findFirstOrThrow({
    where: { teacher: { userId: tom.id, schoolId: riversideId } },
  });

  const second = await db.membership.create({
    data: { userId: tom.id, schoolId: oakfieldId, role: "TEACHER", status: "ACTIVE" },
  });
  // A class he genuinely teaches at the other school, so the only thing between
  // him and it is which school he is currently ACTING for.
  await db.classTeacher.create({
    data: { classId: oakClass.id, schoolId: oakfieldId, teacherMembershipId: second.id, role: "LEAD" },
  });

  try {
    const atRiverside = await mint("tom@riverside.school", "TEACHER", riversideId, "two-school");
    for (const p of ["/switch", "/teacher", "/account", "/teacher/classes"]) {
      await check(atRiverside, p, 200, "a teacher with a post at two schools");
    }

    const { body } = await hit(atRiverside, "/switch");
    results.push({
      role: "two-school",
      path: "/switch",
      status: 200,
      expected: 200,
      ok: body.includes("Riverside") && body.includes("Oakfield"),
      note: "the switcher offers BOTH schools",
    });

    // The widening must not escape listContexts: his OWN class at the other
    // school is still out of reach while he is being a Riverside teacher.
    await check(
      atRiverside,
      `/teacher/classes/${oakClass.id}`,
      404,
      "his own other-school class, while acting for this one",
    );

    // …and switching genuinely re-scopes, in both directions.
    const atOakfield = await mint("tom@riverside.school", "TEACHER", oakfieldId, "two-school");
    await check(atOakfield, `/teacher/classes/${oakClass.id}`, 200, "after switching schools");
    await check(atOakfield, `/teacher/classes/${homeClass.classId}`, 404, "and the first school is now out of reach");
  } finally {
    await db.classTeacher.deleteMany({ where: { teacherMembershipId: second.id } });
    await db.membership.delete({ where: { id: second.id } });
  }
}

/**
 * The front door: an unguessable code, presented by somebody with no session.
 *
 * These are the pages a child or a new member of staff meets FIRST, and they are
 * the ones tenant scoping breaks most quietly — the row a code names is the very
 * thing that would say which school to scope to, so a school-scoped policy
 * refuses the only query that could answer it. Every join code on the
 * installation read as "we could not find that code", and an invitation link as
 * "no longer valid".
 *
 * Signed out on purpose. That is the whole point.
 */
async function joinCodeBootstrap(riversideId: string) {
  const klass = await db.class.findFirstOrThrow({
    where: { schoolId: riversideId, archivedAt: null },
  });
  const creator = await db.membership.findFirstOrThrow({
    where: { schoolId: riversideId, role: "ADMIN" },
  });

  const token = randomBytes(24).toString("base64url");
  const invite = await db.invite.create({
    data: {
      schoolId: riversideId,
      classId: klass.id,
      email: "sweep-invitee@riverside.school",
      role: "TEACHER",
      status: "PENDING",
      tokenHash: createHash("sha256").update(token).digest("hex"),
      createdByMembershipId: creator.id,
      expiresAt: new Date(Date.now() + 7 * 86_400_000),
    },
  });

  try {
    const page = await hit(null, `/invite/${token}`);
    results.push({
      role: "anonymous",
      path: "/invite/<token>",
      status: page.status,
      expected: 200,
      // The page renders either way; what matters is whether it could READ the
      // invitation, or fell through to "no longer valid".
      ok: page.status === 200 && !page.body.includes("no longer valid"),
      note: "a real invitation link, signed out",
    });

    await check(null, `/invite/${randomBytes(24).toString("base64url")}`, 200, "a forged one still renders its refusal");
  } finally {
    await db.invite.delete({ where: { id: invite.id } });
  }
}

async function main() {
  const riverside = await db.school.findFirst({ where: { name: { contains: "Riverside" } } });
  const oakfield = await db.school.findFirst({ where: { name: { contains: "Oakfield" } } });
  if (!riverside || !oakfield) throw new Error("seed missing");

  // A student who actually belongs to Riverside.
  const studentMembership = await db.membership.findFirst({
    where: { schoolId: riverside.id, role: "STUDENT", status: "ACTIVE" },
    include: { user: true },
  });
  if (!studentMembership?.user.email && !studentMembership) throw new Error("no student");

  const admin = await mint("priya@riverside.school", "ADMIN", riverside.id, "admin");
  const teacher = await mint("tom@riverside.school", "TEACHER", riverside.id, "teacher");
  const otherAdmin = await mint("sam@oakfield.school", "ADMIN", oakfield.id, "oakfield-admin");
  const parent = await mint("parent@example.com", "PARENT", null, "parent");

  // Students may have no email (self-joined), so mint straight off the user row.
  const studentUser = studentMembership!.user;
  const studentToken = randomBytes(32).toString("base64url");
  await db.session.create({
    data: {
      userId: studentUser.id,
      tokenHash: createHash("sha256").update(studentToken).digest("hex"),
      activeSchoolId: riverside.id,
      activeRole: "STUDENT",
      userAgent: "sweep",
      expiresAt: new Date(Date.now() + 3_600_000),
    },
  });
  const student: Actor = { label: "student", cookie: `edulink_session=${studentToken}`, sessionId: "" };

  // Real ids for the dynamic routes.
  const klass = await db.class.findFirst({ where: { schoolId: riverside.id, archivedAt: null } });
  const teacherClass = await db.classTeacher.findFirst({
    where: { teacher: { user: { email: "tom@riverside.school" } } },
    include: { class: true },
  });
  const assignment = await db.assignment.findFirst({ where: { schoolId: riverside.id } });
  // An assignment in a class this teacher actually teaches. Picking any
  // assignment gets a correct 404 and reads as a bug — teachers are scoped to
  // their own classes, not merely to their school.
  const post = await db.post.findFirst({ where: { schoolId: riverside.id, status: "APPROVED" } });
  const thread = await db.remarkThread.findFirst({ where: { schoolId: riverside.id } });

  /* ---- public routes, signed out ---- */
  for (const p of ["/", "/login", "/register", "/join", "/join/student", "/join/parent", "/offline", "/manifest.webmanifest"]) {
    await check(null, p);
  }
  await check(null, "/dev/mailbox", 404, "must 404 in production");
  await check(null, "/admin", 307, "signed-out admin redirects to login");
  await check(null, "/api/push", 401, "unauthenticated push registration");

  /* ---- admin ---- */
  for (const p of [
    "/admin", "/admin/classes", "/admin/classes/new", "/admin/invites", "/admin/invites/new",
    "/admin/people", "/admin/people?q=a", "/admin/people?role=STUDENT", "/admin/safety",
    "/admin/settings", "/admin/calendar", "/bulletin", "/bulletin/global", "/bulletin?filter=mine", "/bulletin?filter=pending",
    "/bulletin/new", "/notifications", "/notifications?tab=unread", "/account", "/switch",
    "/remarks", "/admin/people/export",
  ]) {
    await check(admin, p);
  }
  // Messages are teacher↔parent, so an admin is sent to pick a role rather than
  // shown a compose box they cannot post from.
  await check(admin, "/remarks/new", 307, "admin is not a teacher here");
  if (klass) await check(admin, `/teacher/classes/${klass.id}`, 200, "admin viewing a class");

  /* ---- teacher ---- */
  for (const p of [
    "/teacher", "/teacher/attendance", "/teacher/assignments", "/teacher/assignments/new",
    "/teacher/classes", "/bulletin", "/bulletin/global", "/bulletin/new", "/remarks", "/remarks/new",
    "/notifications", "/account", "/switch",
  ]) {
    await check(teacher, p);
  }
  if (teacherClass) await check(teacher, `/teacher/classes/${teacherClass.classId}`);
  const ownAssignment = teacherClass
    ? await db.assignment.findFirst({ where: { classId: teacherClass.classId } })
    : null;
  if (ownAssignment) {
    await check(teacher, `/teacher/assignments/${ownAssignment.id}`, 200, "gradebook");
  }
  if (assignment && assignment.classId !== teacherClass?.classId) {
    await check(teacher, `/teacher/assignments/${assignment.id}`, 404, "another teacher's class");
  }
  if (assignment) await check(admin, `/teacher/assignments/${assignment.id}`, 200, "gradebook");

  /* ---- student ---- */
  for (const p of [
    "/student", "/student/work", "/student/grades", "/student/profile",
    "/student/abhyaas", "/student/abhyaas?subject=MATHS", "/bulletin", "/bulletin/global",
    "/bulletin/new", "/notifications", "/account",
  ]) {
    await check(student, p);
  }
  if (post) await check(student, `/bulletin/${post.id}`);

  /* ---- abhyaas: the practice bank is shared, the practising is not ---- */
  const topic = await db.quizTopic.findFirst({ orderBy: { slug: "asc" }, select: { slug: true } });
  if (topic) {
    await check(student, `/student/abhyaas/${topic.slug}`, 200, "a pupil may practise");
    // The bank is global, so a pupil at the OTHER school reaches the same topic.
    // What must never cross is their attempts, which are school-scoped rows.
    await check(teacher, `/student/abhyaas/${topic.slug}`, 307, "practice is not a teacher's page");
    await check(parent, `/student/abhyaas/${topic.slug}`, 307, "nor a guardian's");
  }
  await check(student, "/student/abhyaas/no-such-topic", 404, "an invented topic slug");

  /* ---- parent ---- */
  for (const p of [
    "/parent", "/parent/attendance", "/parent/grades", "/parent/settings", "/remarks",
    "/notifications", "/account", "/switch",
  ]) {
    await check(parent, p);
  }

  // A parent has no Membership and so no active school until they pick one, and
  // the global feed needs one: which posts are HIDDEN is a per-school decision,
  // so serving the feed with no school bound would show a guardian content their
  // child's school had deliberately taken down. Sent to the switcher instead.
  await check(parent, "/bulletin/global", 307, "needs a school for that school's hides to apply");
  if (thread) await check(parent, `/remarks/${thread.id}`, 200, "own thread");

  /* ---- negative: cross-tenant and cross-role ---- */
  if (klass) await check(otherAdmin, `/teacher/classes/${klass.id}`, 404, "other school's class must NOT be found");
  if (thread) await check(otherAdmin, `/remarks/${thread.id}`, 404, "other school's remark thread");
  await check(teacher, "/admin/people/export", 403, "teacher on the admin export");
  await check(student, "/admin/people", 307, "student on an admin page");

  await twoSchoolTeacher(riverside.id, oakfield.id);
  await joinCodeBootstrap(riverside.id);

  /* ---- progress reports: a summary must not outrank its parts ---- */
  const reportChild = await db.guardianship.findFirst({
    where: { parent: { email: "parent@example.com" }, status: "ACTIVE", studentSchoolId: riverside.id },
    select: { studentMembershipId: true },
  });
  if (reportChild) {
    const id = reportChild.studentMembershipId;
    await check(parent, `/reports/${id}`, 200, "their own child");
    await check(admin, `/reports/${id}`, 200, "their school's pupil");
    // A DIFFERENT pupil: the sweep's own student actor may well be this child,
    // and "you can read your own report" is not the check being made here.
    const otherPupil = await db.membership.findFirst({
      where: { schoolId: riverside.id, role: "STUDENT", status: "ACTIVE", id: { not: id } },
      include: { user: { select: { email: true } } },
    });
    if (otherPupil?.user.email) {
      const classmate = await mint(otherPupil.user.email, "STUDENT", riverside.id, "classmate");
      await check(classmate, `/reports/${id}`, 404, "another pupil's report");
      await check(classmate, `/reports/${otherPupil.id}`, 200, "…but their own is fine");
    }
    await check(otherAdmin, `/reports/${id}`, 404, "another school's pupil");
    await check(null, `/reports/${id}`, 307, "signed out");
    await check(parent, `/reports/${id}?from=2026-05-01&to=2026-06-30`, 200, "a narrower window");
  }

  /* ---- competitions: the one thing that is NOT school-scoped ---- */
  const openComp = await db.competition.findFirst({ where: { status: "PUBLISHED" } });
  const draftComp = await db.competition.findFirst({ where: { status: "DRAFT" } });

  for (const actor of [admin, teacher, student, parent]) {
    await check(actor, "/competitions");
  }
  await check(student, "/competitions?show=all", 200, "including closed ones");
  await check(admin, "/competitions/new", 200, "posting one");
  await check(teacher, "/competitions/new", 307, "a teacher cannot post one");
  await check(student, "/competitions/new", 307, "nor can a pupil");

  if (openComp) {
    // EVERY role, at BOTH schools. A competition is not school-owned, and this
    // is the check that would fail if somebody "helpfully" scoped it.
    for (const actor of [admin, teacher, student, parent, otherAdmin]) {
      await check(actor, `/competitions/${openComp.id}`, 200, "the catalogue is shared");
    }
  }
  if (openComp) {
    // The results page is staff-only, and school-scoped by the policy rather
    // than by anything the page does.
    await check(admin, `/competitions/${openComp.id}/entries`, 200, "this school's entries");
    await check(teacher, `/competitions/${openComp.id}/entries`, 200, "staff record results");
    await check(student, `/competitions/${openComp.id}/entries`, 404, "not a pupil's page");
    await check(parent, `/competitions/${openComp.id}/entries`, 404, "nor a guardian's");
  }

  if (draftComp) {
    // …but an unpublished one is nobody's business, and 404 rather than 403 so
    // it does not confirm itself.
    for (const actor of [teacher, student, parent, otherAdmin]) {
      await check(actor, `/competitions/${draftComp.id}`, 404, "a draft is not visible");
    }
  }

  /* ---- report ---- */
  const pad = (s: string, n: number) => s.padEnd(n);
  console.log("\n" + pad("ROLE", 16) + pad("STATUS", 14) + "PATH");
  console.log("-".repeat(96));
  for (const r of results) {
    const mark = r.ok ? "ok  " : "FAIL";
    const status = r.ok ? `${mark} ${r.status}` : `${mark} ${r.status} (want ${r.expected})`;
    console.log(pad(r.role, 16) + pad(status, 14) + r.path + (r.note ? `   — ${r.note}` : ""));
  }
  const failed = results.filter((r) => !r.ok);
  console.log("-".repeat(96));
  console.log(`${results.length - failed.length}/${results.length} as expected, ${failed.length} unexpected.`);

  await db.session.deleteMany({ where: { userAgent: "sweep" } });
  process.exit(failed.length ? 1 : 0);
}

main().catch(async (e) => {
  console.error(e);
  await db.session.deleteMany({ where: { userAgent: "sweep" } });
  process.exit(1);
});
