import { createHash, randomBytes } from "node:crypto";
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { PrismaClient } from "@prisma/client";
import { config } from "dotenv";
import { dutiesForRole } from "@edulink/contracts";
import { HARNESS_EXAM_NAME } from "./harness-exam";

/**
 * Sessions for one actor per role on ZZ Northgate, written to e2e/.sessions.json.
 * Minted, not signed in: the login form is exercised by its own suite, and
 * no password is typed here. Every session carries userAgent "e2e" and a
 * one-hour expiry; global-teardown.ts removes them after the run.
 */
export type Actor = {
  role: string;
  cookie: string;
  email?: string;
  classId?: string;
  slotId?: string;
  pupilId?: string;
  askedAboutPupilId?: string;
  /** The modules the actor's school has on (SchoolModule rows), so the axe walk opens only the entries the menu shows. Absent for an actor with no school. */
  modules?: string[];
  /** A FACULTY's or HOD's duties (5 Oct 2026), so the axe walk opens only the duty entries the menu shows. */
  duties?: string[];
  /** The college's streams (5 Oct 2026): an entry for other streams (the practical record at a law college) is hidden. */
  streams?: string[];
};
export type Sessions = Record<string, Actor>;

config({ path: ".env" });
const db = new PrismaClient({ datasourceUrl: process.env.DATABASE_ADMIN_URL ?? process.env.DATABASE_URL });

async function mint(userId: string, role: string | null, schoolId: string | null): Promise<string> {
  const token = randomBytes(32).toString("base64url");
  await db.session.create({
    data: {
      userId,
      tokenHash: createHash("sha256").update(token).digest("hex"),
      activeSchoolId: schoolId,
      activeRole: role,
      userAgent: "e2e",
      expiresAt: new Date(Date.now() + 3_600_000),
    },
  });
  return `edulink_session=${token}`;
}

export default async function globalSetup() {
  await db.session.deleteMany({ where: { userAgent: "e2e" } });
  const school = await db.school.findUnique({ where: { slug: "zz-northgate-school" } });
  if (!school) throw new Error("ZZ Northgate missing — run npm run zz:fixtures");

  const byEmail = async (email: string) => (await db.user.findUniqueOrThrow({ where: { email }, select: { id: true } })).id;
  const sessions: Sessions = {};

  sessions.ADMIN = { role: "ADMIN", email: "zz.admin@zz.test", cookie: await mint(await byEmail("zz.admin@zz.test"), "ADMIN", school.id) };
  sessions.PRINCIPAL = { role: "PRINCIPAL", cookie: await mint(await byEmail("zz.principal@zz.test"), "PRINCIPAL", school.id) };

  // A lead teacher of a class with pupils, and an exam slot for that grade —
  // made here if the fixture has none (a fresh CI database has none), ZZ-named
  // and find-or-create so a second run reuses it. One actor who can open both
  // the register and the marks sheet. global-teardown.ts removes it after the
  // run (QA-73), so the fixture teacher's home does not carry it afterwards.
  const lead = await db.classTeacher.findFirstOrThrow({
    where: { schoolId: school.id, role: "LEAD", class: { archivedAt: null, gradeLevel: { not: null }, enrollments: { some: { status: "ACTIVE" } } } },
    include: { teacher: { select: { userId: true, user: { select: { email: true } } } }, class: { select: { id: true, gradeLevel: true } } },
    orderBy: { class: { name: "asc" } },
  });
  const gradeLevel = lead.class.gradeLevel!;
  const series =
    (await db.examSeries.findFirst({ where: { schoolId: school.id, name: HARNESS_EXAM_NAME, gradeLevel }, select: { id: true } })) ??
    (await db.examSeries.create({ data: { schoolId: school.id, name: HARNESS_EXAM_NAME, gradeLevel }, select: { id: true } }));
  const slot =
    (await db.examSlot.findFirst({ where: { seriesId: series.id }, select: { id: true } })) ??
    (await db.examSlot.create({ data: { schoolId: school.id, seriesId: series.id, subject: "Mathematics", dateKey: "2026-09-01", pointsMilli: 50_000 }, select: { id: true } }));
  // The series' term, as exams.ts derives it (syncSeriesTerm): the term its earliest paper falls in. Written straight to
  // the database, the series had none, and data:audit's exam-sitting check failed after every Playwright run (W-15).
  const earliest = await db.examSlot.findFirst({ where: { seriesId: series.id }, orderBy: [{ dateKey: "asc" }, { position: "asc" }], select: { dateKey: true } });
  const at = earliest ? new Date(`${earliest.dateKey}T00:00:00.000Z`) : null;
  const term = at ? await db.term.findFirst({ where: { schoolId: school.id, startDate: { lte: at }, endDate: { gte: at } }, select: { id: true } }) : null;
  await db.examSeries.update({ where: { id: series.id }, data: { termId: term?.id ?? null } });
  sessions.TEACHER = { role: "TEACHER", email: lead.teacher.user.email ?? undefined, cookie: await mint(lead.teacher.userId, "TEACHER", school.id), classId: lead.class.id, slotId: slot.id };

  // A NAMED pupil and that pupil's own parent, as the API sweep signs in (bc8e649). "The first active pupil" and
  // "the first guardianship" had no order, so each run could be a different child and a screenshot of their
  // page a different page. The lowest id where a database has no such pupil.
  const pupil =
    (await db.membership.findFirst({ where: { schoolId: school.id, role: "STUDENT", status: "ACTIVE", leftAt: null, user: { email: "zz.pupil01@zz.test" } }, select: { id: true, userId: true, user: { select: { email: true } } } })) ??
    (await db.membership.findFirstOrThrow({ where: { schoolId: school.id, role: "STUDENT", status: "ACTIVE", leftAt: null }, orderBy: { id: "asc" }, select: { id: true, userId: true, user: { select: { email: true } } } }));
  sessions.STUDENT = { role: "STUDENT", email: pupil.user.email ?? undefined, cookie: await mint(pupil.userId, "STUDENT", school.id), pupilId: pupil.id };

  const guardian =
    (await db.guardianship.findFirst({ where: { studentMembershipId: pupil.id, status: "ACTIVE", relation: { not: "SCHOOL" } }, orderBy: { id: "asc" }, select: { parentUserId: true, parent: { select: { email: true } } } })) ??
    (await db.guardianship.findFirstOrThrow({ where: { studentSchoolId: school.id, status: "ACTIVE" }, orderBy: { id: "asc" }, select: { parentUserId: true, parent: { select: { email: true } } } }));
  sessions.PARENT = { role: "PARENT", email: guardian.parent.email ?? undefined, cookie: await mint(guardian.parentUserId, "PARENT", null), pupilId: pupil.id };

  // The pupil a family's ask to change the record waits on (zz-fixtures.ts `buildRecordChanges`): the page where the office decides.
  const waiting = await db.recordChangeRequest.findFirst({ where: { schoolId: school.id, id: "zz-fixture-record-change-waiting", status: "PENDING" }, select: { studentMembershipId: true } });
  sessions.ADMIN.pupilId = pupil.id;
  sessions.ADMIN.askedAboutPupilId = waiting?.studentMembershipId;
  sessions.PRINCIPAL.askedAboutPupilId = waiting?.studentMembershipId;

  const expert = await db.expertProfile.findFirst({ where: { user: { email: { endsWith: "@zz.test" } } }, select: { userId: true } });
  if (expert) sessions.EXPERT = { role: "EXPERT", cookie: await mint(expert.userId, "EXPERT", null) };

  // The module roles (3 Oct 2026), each a Northgate membership (zz-fixtures.ts buildModuleRoles), so the axe walk opens their homes.
  for (const [role, email] of [["DRIVER", "zz.driver01@zz.test"], ["LIBRARIAN", "zz.librarian@zz.test"], ["WARDEN", "zz.warden@zz.test"], ["ALUMNUS", "zz.alumni01@zz.test"]] as const) {
    const member = await db.membership.findFirst({ where: { schoolId: school.id, role, status: "ACTIVE", leftAt: null, user: { email } }, select: { userId: true } });
    if (member) sessions[role] = { role, email, cookie: await mint(member.userId, role, school.id) };
  }

  // The college's six staff roles (4 Oct 2026) at ZZ Vidya College, and the recruiter with no school (zz-college.ts), so the axe walk opens their homes.
  const vidya = await db.school.findUnique({ where: { slug: "zz-vidya-college" }, select: { id: true } });
  if (vidya) {
    for (const [role, email] of [["FACULTY", "zz.faculty01@zz.test"], ["HOD", "zz.hod01@zz.test"], ["EXAM_CONTROLLER", "zz.examctrl@zz.test"], ["IQAC", "zz.iqac@zz.test"], ["TPO", "zz.tpo@zz.test"], ["ACCOUNTS", "zz.accounts@zz.test"]] as const) {
      const member = await db.membership.findFirst({ where: { schoolId: vidya.id, role, status: "ACTIVE", leftAt: null, user: { email } }, select: { userId: true } });
      if (member) sessions[role] = { role, email, cookie: await mint(member.userId, role, vidya.id) };
    }
  }
  // The college's office, head and a student at ZZ Vidya (B-21): the walk of 4 October found the college pages' sideways
  // scroll, unfocusable tables and squeezed inputs because no gate opened them as these three. Keyed apart from the school's
  // ADMIN, PRINCIPAL and STUDENT; `role` is the real role, whose NAV they walk.
  if (vidya) {
    for (const [key, role, email] of [["COLLEGE_ADMIN", "ADMIN", "zz.cadmin@zz.test"], ["COLLEGE_PRINCIPAL", "PRINCIPAL", "zz.cprincipal@zz.test"], ["COLLEGE_STUDENT", "STUDENT", "zz.cstudent02@zz.test"]] as const) {
      const member = await db.membership.findFirst({ where: { schoolId: vidya.id, role, status: "ACTIVE", leftAt: null, user: { email } }, select: { userId: true } });
      if (member) sessions[key] = { role, email, cookie: await mint(member.userId, role, vidya.id) };
    }
  }
  const recruiter = await db.recruiterProfile.findFirst({ where: { user: { email: "zz.recruiter01@zz.test" }, disabledAt: null }, select: { userId: true } });
  if (recruiter) sessions.RECRUITER = { role: "RECRUITER", email: "zz.recruiter01@zz.test", cookie: await mint(recruiter.userId, "RECRUITER", null) };

  // The content team and the operator: the fixture's flagged accounts, with no school and no role, as they really sign in.
  const platform = async (key: string, email: string) => {
    const user = await db.user.findUnique({ where: { email }, select: { id: true } });
    if (user) sessions[key] = { role: key, email, cookie: await mint(user.id, null, null) };
  };
  await platform("APPADMIN", "zz.appadmin@zz.test");
  await platform("OPERATOR", "zz.operator@zz.test");

  // Each school actor's modules, read once: Northgate's for the school's, Vidya's for the college's.
  const modulesOf = new Map<string, string[]>();
  for (const actor of Object.values(sessions)) {
    const session = await db.session.findFirst({ where: { tokenHash: createHash("sha256").update(actor.cookie.split("=")[1]!).digest("hex") }, select: { activeSchoolId: true, activeRole: true, userId: true } });
    const schoolId = session?.activeSchoolId;
    if (!schoolId) continue;
    if (!modulesOf.has(schoolId)) modulesOf.set(schoolId, (await db.schoolModule.findMany({ where: { schoolId }, select: { module: true } })).map((m) => m.module));
    actor.modules = modulesOf.get(schoolId);
    // The streams and the duties (5 Oct 2026): the shell hides another stream's entries and a duty the person does not hold.
    const school = await db.school.findUnique({ where: { id: schoolId }, select: { streamsJson: true } });
    actor.streams = JSON.parse(school?.streamsJson ?? "[]") as string[];
    if (session.activeRole) {
      const membership = await db.membership.findFirst({ where: { userId: session.userId, schoolId, role: session.activeRole, status: "ACTIVE", leftAt: null }, select: { dutiesJson: true } });
      // As the session reads them (owner-batch-item9): a college teacher's duties, an admin's office duties (the head's
      // pages, or every admin's while the school has no head).
      const head = (await db.membership.count({ where: { schoolId, role: "PRINCIPAL", status: "ACTIVE", leftAt: null } })) > 0;
      actor.duties = dutiesForRole(session.activeRole, membership?.dutiesJson, head);
    }
  }

  writeFileSync(join(__dirname, ".sessions.json"), JSON.stringify(sessions, null, 2));
  await db.$disconnect();
}
