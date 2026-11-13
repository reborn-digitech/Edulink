/**
 * A scratch ZZ college for the college-exam-cell batch of the testing analysis
 * of 13 November 2026: the academics module's rows the exam cell reads (a
 * programme, its scheme of 30 internal and 70 external at 40 % each, two
 * courses of 3 and 4 credits, a term, the offerings, each student's seat and
 * the HOD's locked internals of 20 out of 30), the people (two controllers, a
 * principal, and one account that holds both EXAM_CONTROLLER and PRINCIPAL),
 * and helpers for a session with approved forms and double-entered marks.
 * Every row is the suite's own; `drop()` removes the college (its rows cascade)
 * and the stamped users.
 */
import { PrismaClient } from "@prisma/client";
import type { ActiveContext } from "@/lib/session";

export const db = new PrismaClient();

export type Who = "ctrl" | "ctrl2" | "principal" | "dual" | `s${number}`;

export type College = {
  id: string;
  stamp: number;
  suffix: string;
  user: Record<string, string>;
  member: Record<string, string>;
  schemeId: string;
  programmeId: string;
  c1: string;
  c2: string;
  term: string;
  o1: string;
  o2: string;
  students: string[];
  ctx: (who: Who, role?: string) => ActiveContext;
  session: (name: string, opts?: { kind?: "REGULAR" | "SUPPLEMENTARY"; status?: string; students?: string[]; courses?: { courseId: string; kind: "REGULAR" | "BACKLOG" }[]; termId?: string }) => Promise<string>;
  mark: (sessionId: string, courseId: string, student: string, externalMilli: number | null) => Promise<void>;
  drop: () => Promise<void>;
};

export async function makeCollege(tag: string, opts: { autonomous?: boolean; students?: number; totalCredits?: number; graceMaxPerSession?: number; withSeats?: boolean } = {}): Promise<College> {
  const stamp = Date.now() + Math.floor(Math.random() * 1000);
  const suffix = String(stamp).slice(-6);
  const mail = (who: string) => `zz-tacec-${tag.toLowerCase()}-${who.toLowerCase()}-${stamp}@test.invalid`;
  const id = (
    await db.school.create({
      data: { name: `ZZ TACEC ${tag} ${stamp}`, slug: `zz-tacec-${tag.toLowerCase()}-${stamp}`, code: `ZC${tag.slice(0, 2).toUpperCase()}${suffix}`, contactEmail: mail("school"), timezone: "Asia/Kolkata", kind: opts.autonomous ? "AUTONOMOUS_COLLEGE" : "COLLEGE", affiliatingUniversity: "ZZ University", isTestFixture: true },
      select: { id: true },
    })
  ).id;
  await db.schoolModule.createMany({ data: [{ schoolId: id, module: "EXAMS" }, { schoolId: id, module: "ACADEMICS" }] });
  const user: Record<string, string> = {};
  const member: Record<string, string> = {};
  const mkUser = async (who: string) => (user[who] = (await db.user.create({ data: { name: `ZZ TACEC ${who}`, email: mail(who) }, select: { id: true } })).id);
  const mkMember = async (who: string, role: string, code?: string) => (member[`${who}:${role}`] = (await db.membership.create({ data: { userId: user[who]!, schoolId: id, role, status: "ACTIVE", ...(code ? { studentCode: code } : {}) }, select: { id: true } })).id);
  for (const w of ["ctrl", "ctrl2", "principal", "dual"]) await mkUser(w);
  await mkMember("ctrl", "EXAM_CONTROLLER");
  await mkMember("ctrl2", "EXAM_CONTROLLER");
  await mkMember("principal", "PRINCIPAL");
  await mkMember("dual", "EXAM_CONTROLLER");
  await mkMember("dual", "PRINCIPAL");
  const students: string[] = [];
  for (let n = 1; n <= (opts.students ?? 3); n += 1) {
    await mkUser(`s${n}`);
    students.push(await mkMember(`s${n}`, "STUDENT", `ZC${n}${suffix}`));
  }
  const dept = await db.department.create({ data: { schoolId: id, code: `ZCD${suffix}`, name: `ZZ TACEC dept ${tag}` }, select: { id: true } });
  const programmeId = (await db.programme.create({ data: { schoolId: id, departmentId: dept.id, code: `ZCP${suffix}`, name: `ZZ TACEC BSc ${tag}`, level: "UG", durationYears: 3, regulator: "UGC", attendanceThreshold: 75 }, select: { id: true } })).id;
  const schemeId = (
    await db.scheme.create({
      data: {
        schoolId: id,
        programmeId,
        name: `ZZ TACEC scheme ${tag}`,
        effectiveYear: 2024,
        passingRules: JSON.stringify({ minPercentPerCourse: 40, atktLimit: 2, totalCredits: opts.totalCredits ?? 120, internalMax: 30, externalMax: 70, minTermCredits: 0, maxTermCredits: 30, graceMaxPerCourse: 5, graceMaxPerSession: opts.graceMaxPerSession ?? 10 }),
      },
      select: { id: true },
    })
  ).id;
  const c1 = (await db.course.create({ data: { schoolId: id, schemeId, code: `ZCA${suffix}`, name: "ZZ Mechanics", semester: 1, creditsL: 3 }, select: { id: true } })).id;
  const c2 = (await db.course.create({ data: { schoolId: id, schemeId, code: `ZCB${suffix}`, name: "ZZ Optics", semester: 1, creditsL: 4 }, select: { id: true } })).id;
  const term = (await db.academicTerm.create({ data: { schoolId: id, name: `ZZ TACEC Odd ${stamp}`, academicYear: "2026-27", startsOn: "2026-07-01", endsOn: "2026-11-30", registrationOpensOn: "2026-07-01", registrationClosesOn: "2026-07-15" }, select: { id: true } })).id;
  const o1 = (await db.courseOffering.create({ data: { schoolId: id, termId: term, courseId: c1 }, select: { id: true } })).id;
  const o2 = (await db.courseOffering.create({ data: { schoolId: id, termId: term, courseId: c2 }, select: { id: true } })).id;
  if (opts.withSeats !== false) for (const s of students) await db.studentProgramme.create({ data: { schoolId: id, studentMembershipId: s, programmeId, schemeId, entryYear: 2026, prn: `ZC${s.slice(-8)}`.toUpperCase() } });
  // The HOD's lock: 20 of 30 for every student in both courses.
  for (const o of [o1, o2]) await db.internalLock.create({ data: { schoolId: id, offeringId: o, termId: term, outOf: 30, totalsJson: JSON.stringify(students.map((studentMembershipId) => ({ studentMembershipId, totalHundredths: 2000 }))), lockedByUserId: user.ctrl! } });

  const ctx = (who: Who, role?: string): ActiveContext => {
    const r = role ?? (who === "principal" ? "PRINCIPAL" : who.startsWith("s") ? "STUDENT" : "EXAM_CONTROLLER");
    return {
      sessionId: "test-session",
      membershipId: member[`${who}:${r}`]!,
      schoolId: id,
      role: r as never,
      user: { id: user[who]!, name: `ZZ TACEC ${who}`, preferredName: null, email: null, avatarKey: null, isMinor: false, isSuperuser: false, isAppAdmin: false, prefs: { theme: "system", contrast: "normal", locale: "en", channels: { push: true, email: true }, quietHours: null } as never },
    };
  };
  const session: College["session"] = async (name, o = {}) => {
    const s = await db.examSession.create({ data: { schoolId: id, name: `${name} ${stamp}`, kind: o.kind ?? "REGULAR", termId: o.termId ?? term, status: o.status ?? "CONDUCT" }, select: { id: true } });
    const courses = o.courses ?? [
      { courseId: c1, kind: "REGULAR" as const },
      { courseId: c2, kind: "REGULAR" as const },
    ];
    for (const st of o.students ?? students) await db.examForm.create({ data: { schoolId: id, sessionId: s.id, studentMembershipId: st, coursesJson: JSON.stringify(courses), eligibilityJson: "{}", eligible: true, noDues: true, status: "APPROVED", submittedAt: new Date(), lockedAt: new Date() } });
    return s.id;
  };
  const mark: College["mark"] = async (sessionId, courseId, student, externalMilli) => {
    const absent = externalMilli === null;
    await db.examMark.create({ data: { schoolId: id, sessionId, courseId, studentMembershipId: student, externalMilli, absent, entry1Milli: externalMilli, entry1Absent: absent, entry1ByUserId: user.ctrl!, entry2Milli: externalMilli, entry2Absent: absent, entry2ByUserId: user.ctrl2!, matched: true, source: "DOUBLE_ENTRY", version: 1, enteredByUserId: user.ctrl! } });
  };
  const drop = async () => {
    await db.notification.deleteMany({ where: { user: { email: { contains: `-${stamp}@test.invalid` } } } });
    await db.auditLog.deleteMany({ where: { schoolId: id } });
    await db.school.deleteMany({ where: { id } });
    await db.user.deleteMany({ where: { email: { contains: `-${stamp}@test.invalid` } } });
  };
  return { id, stamp, suffix, user, member, schemeId, programmeId, c1, c2, term, o1, o2, students, ctx, session, mark, drop };
}

/** The refusal a promise ends in (a RuleRefusal or an AccessError), or a thrown Error naming that it went through. */
export async function refusalOf(p: Promise<unknown>): Promise<{ key: string; status?: number; vars?: unknown }> {
  try {
    await p;
  } catch (error) {
    const e = error as { key?: string; status?: number; vars?: unknown };
    if (typeof e.key === "string") return { key: e.key, status: e.status, vars: e.vars };
    throw error;
  }
  throw new Error("expected a refusal, the call went through");
}
