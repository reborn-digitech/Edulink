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
    "/admin/settings", "/bulletin", "/bulletin?filter=mine", "/bulletin?filter=pending",
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
    "/teacher/classes", "/bulletin", "/bulletin/new", "/remarks", "/remarks/new",
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
    "/student", "/student/work", "/student/grades", "/student/profile", "/bulletin",
    "/bulletin/new", "/notifications", "/account",
  ]) {
    await check(student, p);
  }
  if (post) await check(student, `/bulletin/${post.id}`);

  /* ---- parent ---- */
  for (const p of [
    "/parent", "/parent/attendance", "/parent/grades", "/parent/settings", "/remarks",
    "/notifications", "/account", "/switch",
  ]) {
    await check(parent, p);
  }
  if (thread) await check(parent, `/remarks/${thread.id}`, 200, "own thread");

  /* ---- negative: cross-tenant and cross-role ---- */
  if (klass) await check(otherAdmin, `/teacher/classes/${klass.id}`, 404, "other school's class must NOT be found");
  if (thread) await check(otherAdmin, `/remarks/${thread.id}`, 404, "other school's remark thread");
  await check(teacher, "/admin/people/export", 403, "teacher on the admin export");
  await check(student, "/admin/people", 307, "student on an admin page");

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
