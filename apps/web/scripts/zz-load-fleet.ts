/**
 * A fleet of large ZZ schools, for finding out what the platform does at a
 * size no real school has asked for yet.
 *
 *   npm run zz:fleet                                  50 schools × 5,000 pupils, 10,000 parents, 100 teachers, 50 admins, 10 days of registers
 *   npm run zz:fleet -- --schools 2 --pupils 500      smaller, same shape
 *   npm run zz:fleet -- --teardown                    remove every zz-load-* school and zz.load.* person
 *
 * Everything is ZZ: school slugs `zz-load-NN`, emails `zz.load.NN.…@zz.test`,
 * names beginning "ZZ", so teardown is exact and nothing here can reach a
 * row that belongs to a real school or to the smaller ZZ fixture. The people
 * have NO password (magic-link only): the load runner mints sessions straight
 * from the database, and a fleet of 750,000 accounts with a known password is
 * not something a development database should hold. Idempotent per school: a
 * slug that already exists is skipped, so an interrupted run is resumed by
 * running it again.
 *
 * Bulk inserts with client-made ids, in batches, because 750,000 upserts one
 * at a time is an afternoon. Registers for the last N school days are marked
 * mostly PRESENT with a few ABSENT and LATE, so the guardian overview and the
 * attendance history have the rows a real school's would.
 *
 * Runs on the ADMIN connection: it creates schools, and a row that belongs to
 * no tenant yet cannot be written through the app's row-level-security role.
 */
import { randomBytes } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { config } from "dotenv";
import { classCode, schoolCode, studentCode } from "../src/lib/codes";

config();
const db = new PrismaClient({ datasourceUrl: process.env.DATABASE_ADMIN_URL });

function arg(name: string, fallback: string): string {
  const i = process.argv.indexOf(`--${name}`);
  return i === -1 ? fallback : (process.argv[i + 1] ?? fallback);
}
const SCHOOLS = Number(arg("schools", "50"));
const PUPILS = Number(arg("pupils", "5000"));
const PARENTS = Number(arg("parents", "10000"));
const TEACHERS = Number(arg("teachers", "100"));
const ADMINS = Number(arg("admins", "50"));
const DAYS = Number(arg("days", "10"));
const DOMAIN = "zz.test";
const BATCH = 5_000;
const THIS_YEAR = new Date().getUTCFullYear();

/**
 * Ids in the shape Prisma's cuid() makes and the API contracts check for
 * (`^c[a-z0-9]{20,}$`): a UUID here passes the database and fails every
 * register POST with a 422 — which is how the first fleet run found out.
 */
function cuid(): string {
  return `c${randomBytes(16).toString("hex").slice(0, 24)}`;
}

const FIRST = ["Aarav", "Bhavna", "Chetan", "Divya", "Eshan", "Falguni", "Gaurav", "Harini", "Ishaan", "Jyoti", "Kabir", "Lalita", "Manav", "Nandini", "Omkar", "Pallavi", "Qadir", "Ritika", "Sahil", "Tanvi", "Uday", "Vaishali", "Wasim", "Yamini", "Zoya"];
const LAST = ["Apte", "Bhatt", "Chavan", "Desai", "Fernandes", "Gokhale", "Hegde", "Iyengar", "Joshi", "Kulkarni", "Limaye", "Mhatre", "Naik", "Patil", "Rane", "Sawant"];
const name = (i: number) => `ZZ ${FIRST[i % FIRST.length]} ${LAST[Math.floor(i / FIRST.length) % LAST.length]}`;

/** Codes are random and the columns are unique; 250,000 pupil codes have a fair chance of one collision, so dedupe here and retry. */
function unique(make: () => string, seen: Set<string>): string {
  for (;;) {
    const code = make();
    if (!seen.has(code)) {
      seen.add(code);
      return code;
    }
  }
}

async function inBatches<T>(rows: T[], write: (batch: T[]) => Promise<unknown>) {
  for (let i = 0; i < rows.length; i += BATCH) await write(rows.slice(i, i + BATCH));
}

/** The last N weekdays before today, oldest first, as YYYY-MM-DD. */
function schoolDays(n: number): string[] {
  const out: string[] = [];
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - 1);
  while (out.length < n) {
    if (d.getUTCDay() !== 0 && d.getUTCDay() !== 6) out.push(d.toISOString().slice(0, 10));
    d.setUTCDate(d.getUTCDate() - 1);
  }
  return out.reverse();
}

async function buildSchool(n: number, seen: { student: Set<string>; cls: Set<string>; school: Set<string> }) {
  const nn = String(n).padStart(2, "0");
  const slug = `zz-load-${nn}`;
  if (await db.school.findUnique({ where: { slug }, select: { id: true } })) {
    console.log(`  ${slug} exists, skipped`);
    return;
  }
  const t0 = Date.now();
  const schoolName = `ZZ Load School ${nn}`;
  const school = await db.school.create({
    data: {
      name: schoolName,
      slug,
      code: unique(() => schoolCode(schoolName.replace(/^ZZ /, "")), seen.school),
      city: "Pune",
      country: "India",
      contactEmail: `zz.load.${nn}.office@${DOMAIN}`,
      timezone: "Asia/Kolkata",
      locale: "en",
      gradeLow: "1",
      gradeHigh: "10",
      brandPrimary: "#0f766e",
      verifiedAt: new Date(),
    },
  });
  const prefs = JSON.stringify({ theme: "system", channels: { push: true, email: true } });
  const now = new Date();
  const person = (email: string, label: string, i: number, extra: Record<string, unknown> = {}) => ({ id: cuid(), email, name: `${name(i)}${label}`, emailVerifiedAt: now, prefs, ...extra });

  const admins = Array.from({ length: ADMINS }, (_, i) => person(`zz.load.${nn}.admin${i + 1}@${DOMAIN}`, "", i));
  const teachers = Array.from({ length: TEACHERS }, (_, i) => person(`zz.load.${nn}.teacher${i + 1}@${DOMAIN}`, "", i + 7));
  const pupils = Array.from({ length: PUPILS }, (_, i) => {
    const grade = 1 + Math.floor((i / PUPILS) * 10);
    return { user: person(`zz.load.${nn}.pupil${i + 1}@${DOMAIN}`, "", i + 13, { isMinor: true, birthdate: new Date(Date.UTC(THIS_YEAR - (grade + 5), i % 12, 1 + (i % 28))) }), grade };
  });
  const parents = Array.from({ length: PARENTS }, (_, i) => person(`zz.load.${nn}.parent${i + 1}@${DOMAIN}`, " (parent)", i + 29));

  await inBatches([...admins, ...teachers, ...pupils.map((p) => p.user), ...parents], (b) => db.user.createMany({ data: b }));

  const adminMemberships = admins.map((u) => ({ id: cuid(), userId: u.id, schoolId: school.id, role: "ADMIN", status: "ACTIVE", title: "School administrator" }));
  const teacherMemberships = teachers.map((u, i) => ({ id: cuid(), userId: u.id, schoolId: school.id, role: "TEACHER", status: "ACTIVE", title: "Class teacher", subjects: JSON.stringify([["Mathematics", "English", "Science", "Hindi", "Marathi"][i % 5]]) }));
  const studentMemberships = pupils.map((p) => ({ id: cuid(), userId: p.user.id, schoolId: school.id, role: "STUDENT", status: "ACTIVE", gradeLevel: String(p.grade), studentCode: unique(studentCode, seen.student) }));
  await inBatches([...adminMemberships, ...teacherMemberships, ...studentMemberships], (b) => db.membership.createMany({ data: b }));

  // One class per teacher; pupils dealt out in order, so each class is one grade.
  const classCount = TEACHERS;
  const perClass = Math.ceil(PUPILS / classCount);
  const classes = Array.from({ length: classCount }, (_, i) => {
    const grade = studentMemberships[Math.min(PUPILS - 1, i * perClass)]!.gradeLevel;
    const section = String.fromCharCode(65 + (i % 26));
    return { id: cuid(), schoolId: school.id, name: `ZZ Grade ${grade} · ${section}${i >= 26 ? i : ""}`, subject: "Form group", gradeLevel: grade, section, color: "#0ea5e9", joinCode: unique(classCode, seen.cls) };
  });
  await db.class.createMany({ data: classes });
  await db.classTeacher.createMany({ data: classes.map((c, i) => ({ id: cuid(), classId: c.id, schoolId: school.id, teacherMembershipId: teacherMemberships[i]!.id, role: "LEAD" })) });
  const enrolments = studentMemberships.map((m, i) => ({ id: cuid(), classId: classes[Math.floor(i / perClass)]!.id, schoolId: school.id, studentMembershipId: m.id, status: "ACTIVE" }));
  await inBatches(enrolments, (b) => db.enrollment.createMany({ data: b }));

  // Two guardians per pupil, dealt round the pupils; a parent with two children when PARENTS < 2 × PUPILS.
  const guardianships = Array.from({ length: PARENTS }, (_, i) => ({ id: cuid(), parentUserId: parents[i]!.id, studentMembershipId: studentMemberships[i % PUPILS]!.id, studentSchoolId: school.id, relation: "PARENT", status: "ACTIVE", consentSharingAt: now, consentNotificationsAt: now }));
  await inBatches(guardianships, (b) => db.guardianship.createMany({ data: b }));

  // Registers: every class, every school day, mostly present.
  const days = schoolDays(DAYS);
  const sessions: { id: string; schoolId: string; classId: string; dateKey: string; takenByMembershipId: string; takenAt: Date; finalizedAt: Date }[] = [];
  const records: { id: string; sessionId: string; schoolId: string; studentMembershipId: string; status: string; markedAt: Date }[] = [];
  for (const dateKey of days) {
    const takenAt = new Date(`${dateKey}T03:45:00.000Z`); // 09:15 IST
    for (const [ci, cls] of classes.entries()) {
      const session = { id: cuid(), schoolId: school.id, classId: cls.id, dateKey, takenByMembershipId: teacherMemberships[ci]!.id, takenAt, finalizedAt: takenAt };
      sessions.push(session);
      for (let p = ci * perClass; p < Math.min(PUPILS, (ci + 1) * perClass); p++) {
        const roll = (p * 31 + dateKey.charCodeAt(9) * 7) % 100;
        records.push({ id: cuid(), sessionId: session.id, schoolId: school.id, studentMembershipId: studentMemberships[p]!.id, status: roll < 4 ? "ABSENT" : roll < 7 ? "LATE" : "PRESENT", markedAt: takenAt });
      }
    }
  }
  await inBatches(sessions, (b) => db.attendanceSession.createMany({ data: b }));
  await inBatches(records, (b) => db.attendanceRecord.createMany({ data: b }));

  console.log(`  ${slug}: ${admins.length} admins, ${teachers.length} teachers, ${pupils.length} pupils in ${classes.length} classes, ${parents.length} parents, ${records.length} register lines over ${days.length} days — ${((Date.now() - t0) / 1000).toFixed(1)}s`);
}

/**
 * CHILDREN FIRST, IN BULK. The obvious `school.deleteMany` leans on the
 * foreign keys' ON DELETE CASCADE, and a cascade is a per-row trigger: over
 * a fleet's 2.7 million register lines it ran for half an hour and was
 * cancelled. Each statement below is one indexed bulk delete, so the whole
 * fleet goes in minutes — and it is also the order the operator's
 * whole-school delete would want at this size.
 */
async function teardown() {
  const t0 = Date.now();
  const ids = (await db.school.findMany({ where: { slug: { startsWith: "zz-load-" } }, select: { id: true } })).map((s) => s.id);
  const step = async (label: string, run: () => Promise<{ count: number }>) => {
    const t = Date.now();
    const { count } = await run();
    console.log(`  ${label.padEnd(18)} ${String(count).padStart(9)} rows  ${((Date.now() - t) / 1000).toFixed(1)}s`);
  };
  for (const batch of Array.from({ length: Math.ceil(ids.length / 5) }, (_, i) => ids.slice(i * 5, i * 5 + 5))) {
    const where = { schoolId: { in: batch } };
    await step("attendance lines", () => db.attendanceRecord.deleteMany({ where }));
    await step("attendance sessions", () => db.attendanceSession.deleteMany({ where }));
    await step("enrolments", () => db.enrollment.deleteMany({ where }));
    await step("class teachers", () => db.classTeacher.deleteMany({ where }));
    await step("classes", () => db.class.deleteMany({ where }));
    await step("guardianships", () => db.guardianship.deleteMany({ where: { studentSchoolId: { in: batch } } }));
    await step("memberships", () => db.membership.deleteMany({ where }));
  }
  await step("people", () => db.user.deleteMany({ where: { email: { startsWith: "zz.load." } } }));
  await step("schools", () => db.school.deleteMany({ where: { slug: { startsWith: "zz-load-" } } }));
  console.log(`removed ${ids.length} fleet school(s) in ${((Date.now() - t0) / 60_000).toFixed(1)} min`);
}

async function main() {
  if (process.argv.includes("--teardown")) return teardown();
  console.log(`fleet: ${SCHOOLS} schools × ${PUPILS} pupils, ${PARENTS} parents, ${TEACHERS} teachers, ${ADMINS} admins, ${DAYS} school days of registers`);
  const seen = {
    student: new Set((await db.membership.findMany({ where: { studentCode: { not: null } }, select: { studentCode: true } })).map((m) => m.studentCode!)),
    cls: new Set((await db.class.findMany({ select: { joinCode: true } })).map((c) => c.joinCode)),
    school: new Set((await db.school.findMany({ select: { code: true } })).map((s) => s.code)),
  };
  const t0 = Date.now();
  for (let n = 1; n <= SCHOOLS; n++) await buildSchool(n, seen);
  console.log(`done in ${((Date.now() - t0) / 60_000).toFixed(1)} min. Remove with: npm run zz:fleet -- --teardown`);
}

main()
  .catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
