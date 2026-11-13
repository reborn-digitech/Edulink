/**
 * THE COLLEGE'S ACADEMICS, the marks and decisions half of the batch (testing analysis of 13 November 2026,
 * batch college-academics), at a ZZ college of this suite's own, made here and removed after.
 *
 *   - TA-055: a pasted internal-marks sheet keyed by roll number on an offering shared by two divisions,
 *     whose students both hold roll 1, put the mark on whichever student was set last; now the line is
 *     skipped as ambiguous and the student code still names one student.
 *   - TA-238: the HOD's lock read the marks outside any transaction, so a save that had passed its own lock
 *     check wrote after the totals were frozen; the save, the countersign, the release and the lock now
 *     queue on the offering's row lock and read under it.
 *   - TA-275: an HOD heading two departments acted in one of them only, and a FACULTY member could be
 *     named head though the role could do nothing a head does.
 *   - TA-058: an HOD's approval of a condonation covered the student for the term whatever the percentage
 *     fell to afterwards, though below the department's floor the decision is the principal's.
 *   - TA-062: a course plan's week with a taught day typed as DD/MM/YYYY, a week over 30 or a topic over
 *     200 characters was stored and then dropped on read.
 *   - TA-531: the seat's PRN check was case-sensitive while the result file is matched case-folded, so two
 *     PRNs differing in case collapsed onto one form at import.
 *   - TA-541: of two opposite decisions on one late registration at once, the loser was answered
 *     changed: false as if its decision stood.
 */
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { PrismaClient } from "@prisma/client";

vi.mock("next/cache", () => ({ revalidatePath: () => undefined, revalidateTag: () => undefined }));
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw Object.assign(new Error(`REDIRECT ${url}`), { url });
  },
  notFound: () => {
    throw new Error("NOT_FOUND");
  },
}));

import { createSession, getSession, type ActiveContext } from "@/lib/session";
import { __resetCookies, __setHeaders } from "./stubs/next-headers";
import { addDaysToKey, todayKey } from "@/lib/dates";
import { lockInternal, lockTotals, releaseComponent, saveInternalMarks } from "@/lib/academics-assessment";
import { askCondonation, attendanceRows, decideCondonation } from "@/lib/academics-attendance";
import { saveDepartment, saveSeat } from "@/lib/academics";
import { saveCoursePlan } from "@/lib/academics-coursefile";
import { askLateRegistration, decideLateRegistration } from "@/lib/academics-registration";
import { importMarks } from "@/lib/exam-cell-marks";
import { savePlanAction } from "@/app/(app)/faculty/actions";

const db = new PrismaClient();
const STAMP = Date.now();
const SUFFIX = String(STAMP).slice(-6);
const TZ = "Asia/Kolkata";
const TODAY = todayKey(TZ);
const MAIL = (who: string) => `zz-taca-${who.toLowerCase()}-${STAMP}@test.invalid`;
const ids: Record<string, string> = {};
const RULES = JSON.stringify({ minPercentPerCourse: 40, atktLimit: 4, totalCredits: 120, internalMax: 40, externalMax: 60, minTermCredits: 0, maxTermCredits: 40 });

async function as(who: string, role: string): Promise<ActiveContext> {
  __resetCookies();
  __setHeaders({});
  await createSession(ids[who]!, { schoolId: ids.college!, role: role as never });
  const ctx = await getSession();
  if (!ctx) throw new Error(`no session for ${who}`);
  return ctx;
}

async function person(who: string, role: string, extra: Record<string, unknown> = {}): Promise<void> {
  ids[who] = (await db.user.create({ data: { name: `ZZ TACA ${who}`, email: MAIL(who) }, select: { id: true } })).id;
  ids[`${who}M`] = (await db.membership.create({ data: { userId: ids[who]!, schoolId: ids.college!, role, status: "ACTIVE", ...extra }, select: { id: true } })).id;
}

const register = (student: string, offering: string) => db.courseRegistration.create({ data: { schoolId: ids.college!, studentMembershipId: ids[`${student}M`]!, offeringId: ids[offering]!, termId: ids.term!, kind: "CORE" } });

/** One lecture a day back from `back` days ago, marked for the student as asked. */
async function lectures(offering: string, student: string, statuses: ("PRESENT" | "ABSENT")[], startBack: number): Promise<void> {
  for (const [i, status] of statuses.entries()) {
    const l = await db.lecture.create({ data: { schoolId: ids.college!, offeringId: ids[offering]!, dateKey: addDaysToKey(TODAY, -(startBack + i)), startMinute: 540, endMinute: 590 }, select: { id: true } });
    await db.lectureAttendance.create({ data: { schoolId: ids.college!, lectureId: l.id, studentMembershipId: ids[`${student}M`]!, status, markedByMembershipId: ids.facM! } });
  }
}

beforeAll(async () => {
  const c = (ids.college = (await db.school.create({ data: { name: `ZZ TACA College ${STAMP}`, slug: `zz-taca-${STAMP}`, code: `ZTC${SUFFIX}`, contactEmail: MAIL("contact"), timezone: TZ, kind: "COLLEGE", affiliatingUniversity: "ZZ University" }, select: { id: true } })).id);
  await db.schoolModule.createMany({ data: [{ schoolId: c, module: "ACADEMICS" }, { schoolId: c, module: "EXAMS" }] });
  for (const [who, role] of [["admin", "ADMIN"], ["principal", "PRINCIPAL"], ["hod", "HOD"], ["fac", "FACULTY"], ["fac2", "FACULTY"], ["chemFac", "FACULTY"], ["ctrl", "EXAM_CONTROLLER"]] as const) await person(who, role);
  for (let n = 1; n <= 8; n += 1) await person(`s${n}`, "STUDENT", { studentCode: `ZTCS${n}${SUFFIX}` });

  // One HOD heads two departments (TA-275), Physics first and Chemistry second.
  ids.phy = (await db.department.create({ data: { schoolId: c, code: "ZPHY", name: "ZZ TACA Physics", hodMembershipId: ids.hodM, condoneFloorPercent: 65 }, select: { id: true } })).id;
  ids.che = (await db.department.create({ data: { schoolId: c, code: "ZCHE", name: "ZZ TACA Chemistry", hodMembershipId: ids.hodM, condoneFloorPercent: 65 }, select: { id: true } })).id;
  await db.departmentFaculty.createMany({ data: [{ schoolId: c, membershipId: ids.facM!, departmentId: ids.phy }, { schoolId: c, membershipId: ids.fac2M!, departmentId: ids.phy }, { schoolId: c, membershipId: ids.chemFacM!, departmentId: ids.che }] });
  ids.bsc = (await db.programme.create({ data: { schoolId: c, departmentId: ids.phy, code: "ZBSC", name: "ZZ TACA BSc", level: "UG", durationYears: 3, regulator: "UGC", attendanceThreshold: 75 }, select: { id: true } })).id;
  ids.bch = (await db.programme.create({ data: { schoolId: c, departmentId: ids.che, code: "ZBCH", name: "ZZ TACA BSc Chem", level: "UG", durationYears: 3, regulator: "UGC", attendanceThreshold: 75 }, select: { id: true } })).id;
  ids.scheme = (await db.scheme.create({ data: { schoolId: c, programmeId: ids.bsc, name: "ZZ TACA scheme", effectiveYear: 2024, passingRules: RULES }, select: { id: true } })).id;
  ids.chScheme = (await db.scheme.create({ data: { schoolId: c, programmeId: ids.bch, name: "ZZ TACA chem scheme", effectiveYear: 2024, passingRules: RULES }, select: { id: true } })).id;
  const course = async (scheme: string, code: string) => (await db.course.create({ data: { schoolId: c, schemeId: ids[scheme]!, code, name: `ZZ ${code}`, semester: 1, creditsL: 4, kind: "CORE", outcomes: JSON.stringify([{ code: "CO1", text: "ZZ an outcome" }]) }, select: { id: true } })).id;
  ids.cPhy = await course("scheme", `ZP1${SUFFIX}`);
  ids.cPhy2 = await course("scheme", `ZP2${SUFFIX}`);
  ids.cPhy3 = await course("scheme", `ZP3${SUFFIX}`);
  ids.cChe = await course("chScheme", `ZC1${SUFFIX}`);
  ids.term = (await db.academicTerm.create({ data: { schoolId: c, name: `ZZ TACA term ${STAMP}`, academicYear: "2026–27", startsOn: addDaysToKey(TODAY, -60), endsOn: addDaysToKey(TODAY, 60), registrationOpensOn: addDaysToKey(TODAY, -70), registrationClosesOn: addDaysToKey(TODAY, -61) }, select: { id: true } })).id;

  // Two divisions of the BSc, each with its own roll 1 (TA-055).
  for (const tag of ["A", "B"]) {
    const klass = await db.class.create({ data: { schoolId: c, name: `ZZ TACA FY ${tag} ${STAMP}`, gradeLevel: "1", subject: "BSC", joinCode: `ZT${tag}${SUFFIX}` }, select: { id: true } });
    ids[`class${tag}`] = klass.id;
    ids[`div${tag}`] = (await db.division.create({ data: { schoolId: c, classId: klass.id, programmeId: ids.bsc, yearOfStudy: 1, academicYear: "2026–27" }, select: { id: true } })).id;
  }
  for (const [s, div] of [["s1", "A"], ["s2", "B"]] as const) {
    await db.studentProgramme.create({ data: { schoolId: c, studentMembershipId: ids[`${s}M`]!, programmeId: ids.bsc, schemeId: ids.scheme, entryYear: 2026, divisionId: ids[`div${div}`]! } });
    await db.enrollment.create({ data: { schoolId: c, classId: ids[`class${div}`]!, studentMembershipId: ids[`${s}M`]!, rollNumber: 1 } });
  }
  for (const s of ["s3", "s5", "s6"]) await db.studentProgramme.create({ data: { schoolId: c, studentMembershipId: ids[`${s}M`]!, programmeId: ids.bsc, schemeId: ids.scheme, entryYear: 2026 } });
  await db.studentProgramme.create({ data: { schoolId: c, studentMembershipId: ids.s4M!, programmeId: ids.bch, schemeId: ids.chScheme, entryYear: 2026 } });

  const offering = async (courseId: string, faculty: string) => (await db.courseOffering.create({ data: { schoolId: c, termId: ids.term!, courseId, facultyMembershipId: ids[`${faculty}M`]!, lectureHours: 3 }, select: { id: true } })).id;
  ids.oShared = await offering(ids.cPhy, "fac");
  ids.oLock = await offering(ids.cPhy2, "fac");
  ids.oAtt = await offering(ids.cPhy3, "fac");
  ids.oChe = await offering(ids.cChe, "chemFac");
  for (const s of ["s1", "s2"]) await register(s, "oShared");
  await register("s3", "oLock");
  await register("s3", "oAtt");
  await register("s4", "oChe");
});

afterAll(async () => {
  __resetCookies();
  __setHeaders({});
  // Only what this suite made: its own stamped college (never an unscoped delete, should the set-up have failed) and its stamped people.
  const college = ids.college;
  if (college) {
    await db.auditLog.deleteMany({ where: { schoolId: college } });
    await db.school.deleteMany({ where: { id: college, name: `ZZ TACA College ${STAMP}` } });
  }
  await db.session.deleteMany({ where: { user: { email: { endsWith: `-${STAMP}@test.invalid`, startsWith: "zz-taca-" } } } });
  await db.notification.deleteMany({ where: { user: { email: { endsWith: `-${STAMP}@test.invalid`, startsWith: "zz-taca-" } } } });
  await db.user.deleteMany({ where: { email: { endsWith: `-${STAMP}@test.invalid`, startsWith: "zz-taca-" } } });
  await db.$disconnect();
});

describe("a pasted marks sheet on an offering shared by two divisions (TA-055)", () => {
  it("TA-055: skips a roll number two students hold as ambiguous, and writes nothing for it", async () => {
    const k = await db.internalComponent.create({ data: { schoolId: ids.college!, offeringId: ids.oShared!, name: "ZZ Unit test", kind: "UNIT_TEST", maxMarks: 20, weight: 20, coCodes: "[]" }, select: { id: true } });
    const fac = await as("fac", "FACULTY");
    const r = await saveInternalMarks(fac, ids.oShared!, { componentId: k.id, sheet: "1, 18" });
    expect(r).toEqual({ saved: 0, skipped: [{ line: 1, reason: "AMBIGUOUS_STUDENT" }] });
    expect(await db.internalMark.count({ where: { componentId: k.id } })).toBe(0);
    // The student code still names one student.
    const byCode = await saveInternalMarks(fac, ids.oShared!, { componentId: k.id, sheet: `ZTCS2${SUFFIX}, 18` });
    expect(byCode).toEqual({ saved: 1, skipped: [] });
    expect(await db.internalMark.findMany({ where: { componentId: k.id }, select: { studentMembershipId: true, marksTenths: true } })).toEqual([{ studentMembershipId: ids.s2M, marksTenths: 180 }]);
  });
});

describe("the HOD's lock against a save landing at the same moment (TA-238)", () => {
  it("TA-238: never freezes totals that the live marks then disagree with", async () => {
    const k = await db.internalComponent.create({ data: { schoolId: ids.college!, offeringId: ids.oLock!, name: "ZZ Whole", kind: "UNIT_TEST", maxMarks: 40, weight: 40, coCodes: "[]", moderatedAt: new Date(), moderatedByUserId: ids.fac2 }, select: { id: true } });
    const mark = await db.internalMark.create({ data: { schoolId: ids.college!, componentId: k.id, studentMembershipId: ids.s3M!, marksTenths: 300, enteredByUserId: ids.fac!, moderatedAt: new Date(), moderatedByUserId: ids.fac2 }, select: { id: true } });
    const fac = await as("fac", "FACULTY");
    const hod = await as("hod", "HOD");
    const pause = (ms: number) => new Promise((r) => setTimeout(r, ms));
    let save: Promise<unknown> = Promise.resolve();
    let lock: Promise<unknown> = Promise.resolve();
    // A transaction of the suite's own holds the mark's row: the save that has passed its checks waits at its write,
    // and the HOD locks meanwhile. Released, the save writes.
    await db.$transaction(
      async (tx) => {
        await tx.$queryRaw`SELECT 1 FROM "InternalMark" WHERE "id" = ${mark.id} FOR UPDATE`;
        save = saveInternalMarks(fac, ids.oLock!, { componentId: k.id, entries: [{ studentMembershipId: ids.s3M!, marks: 35 }] }).then((v) => ({ ok: v }), (e: unknown) => ({ err: e }));
        await pause(800);
        lock = lockInternal(hod, ids.oLock!).then((v) => ({ ok: v }), (e: unknown) => ({ err: e }));
        await pause(1500);
      },
      { timeout: 20_000 },
    );
    await Promise.all([save, lock]);
    const frozen = await db.internalLock.findUnique({ where: { offeringId: ids.oLock! }, select: { totalsJson: true } });
    const live = await db.internalComponent.findMany({ where: { offeringId: ids.oLock! }, select: { id: true, maxMarks: true, weight: true, moderatedAt: true, marks: { select: { studentMembershipId: true, marksTenths: true } } } });
    if (frozen) {
      // A lock stands only over the marks as they now are, every component still countersigned.
      expect(JSON.parse(frozen.totalsJson)).toEqual(lockTotals(live, [ids.s3M!]));
      expect(live.every((x) => x.moderatedAt !== null)).toBe(true);
    } else {
      // Or the save went first, took the countersign away, and the lock was refused for it.
      expect(await lock).toMatchObject({ err: { key: "academics.refuseNotModerated" } });
      expect(live[0]!.marks[0]!.marksTenths).toBe(350);
    }
  });
});

describe("an HOD who heads two departments (TA-275)", () => {
  it("TA-275: releases, locks and decides condonations in both", async () => {
    const hod = await as("hod", "HOD");
    // Physics: a countersigned component released.
    const kPhy = await db.internalComponent.create({ data: { schoolId: ids.college!, offeringId: ids.oShared!, name: "ZZ Released", kind: "ASSIGNMENT", maxMarks: 20, weight: 20, coCodes: "[]", moderatedAt: new Date(), moderatedByUserId: ids.fac2 }, select: { id: true } });
    expect(await releaseComponent(hod, kPhy.id)).toEqual({ changed: true });
    // Chemistry: a complete, countersigned offering locked.
    const kChe = await db.internalComponent.create({ data: { schoolId: ids.college!, offeringId: ids.oChe!, name: "ZZ Chem whole", kind: "UNIT_TEST", maxMarks: 40, weight: 40, coCodes: "[]", moderatedAt: new Date(), moderatedByUserId: ids.chemFac }, select: { id: true } });
    await db.internalMark.create({ data: { schoolId: ids.college!, componentId: kChe.id, studentMembershipId: ids.s4M!, marksTenths: 250, enteredByUserId: ids.chemFac!, moderatedAt: new Date(), moderatedByUserId: ids.chemFac } });
    expect(await lockInternal(await as("hod", "HOD"), ids.oChe!)).toEqual({ changed: true });
    // A condonation of each department's student.
    for (const [s, offering] of [["s4", "oChe"], ["s3", "oAtt"]] as const) {
      const asked = await askCondonation(await as(s, "STUDENT"), { termId: ids.term!, offeringId: ids[offering]!, ground: "MEDICAL", note: "ZZ a medical ground", documentFileId: null });
      const decided = await decideCondonation(await as("hod", "HOD"), asked.id, { decision: "FORWARD", note: "" });
      expect(decided.status).toBe("FORWARDED");
    }
  });

  it("TA-275: refuses a FACULTY member as a department's head", async () => {
    const admin = await as("admin", "ADMIN");
    await expect(saveDepartment(admin, { code: "ZFAC", name: "ZZ TACA Faculty-headed", hodMembershipId: ids.fac2M!, condoneFloorPercent: 65 })).rejects.toMatchObject({ key: "academics.refuseHeadNotHod", status: 422 });
    expect(await db.department.count({ where: { schoolId: ids.college!, code: "ZFAC" } })).toBe(0);
    // An HOD may still be named, a second department included.
    const made = await saveDepartment(admin, { code: "ZHOD", name: "ZZ TACA HOD-headed", hodMembershipId: ids.hodM!, condoneFloorPercent: 65 });
    expect(made.id).toBeTruthy();
  });
});

describe("an HOD's approval when attendance then falls under the floor (TA-058)", () => {
  it("TA-058: no longer covers the student once the percentage is below the department's floor", async () => {
    // 7 of 10: 70 %, under the rule of 75 and over the floor of 65.
    await lectures("oAtt", "s3", ["PRESENT", "PRESENT", "PRESENT", "PRESENT", "PRESENT", "PRESENT", "PRESENT", "ABSENT", "ABSENT", "ABSENT"], 30);
    await db.attendanceCondonation.deleteMany({ where: { schoolId: ids.college!, studentMembershipId: ids.s3M! } });
    const asked = await askCondonation(await as("s3", "STUDENT"), { termId: ids.term!, offeringId: null, ground: "MEDICAL", note: "ZZ a medical ground", documentFileId: null });
    expect((await decideCondonation(await as("hod", "HOD"), asked.id, { decision: "APPROVE", note: "" })).status).toBe("HOD_APPROVED");
    const before = (await attendanceRows(ids.college!, ids.term!, { studentMembershipId: ids.s3M!, offeringIds: [ids.oAtt!] }))[0]!;
    expect(before).toMatchObject({ percent: 70, condoned: true, eligible: true });
    // Ten absences more: 7 of 20, 35 %, under the floor.
    await lectures("oAtt", "s3", Array(10).fill("ABSENT") as "ABSENT"[], 10);
    const after = (await attendanceRows(ids.college!, ids.term!, { studentMembershipId: ids.s3M!, offeringIds: [ids.oAtt!] }))[0]!;
    expect(after.percent).toBe(35);
    expect(after).toMatchObject({ condoned: false, eligible: false });
  });
});

describe("the course plan (TA-062)", () => {
  it("TA-062: refuses a week the reader would drop rather than storing it", async () => {
    const fac = await as("fac", "FACULTY");
    for (const week of [
      { week: 3, topic: "ZZ Arrays", coCodes: [], taughtOn: "15/07/2026" },
      { week: 31, topic: "ZZ Arrays", coCodes: [], taughtOn: null },
      { week: 4, topic: "Z".repeat(201), coCodes: [], taughtOn: null },
      { week: 5, topic: "ZZ Arrays", coCodes: [], taughtOn: "2026-02-30" },
    ]) {
      await expect(saveCoursePlan(fac, ids.oShared!, { plan: [{ week: 1, topic: "ZZ Units", coCodes: ["CO1"], taughtOn: null }, week] })).rejects.toMatchObject({ key: "academics.refusePlanWeek", status: 422 });
    }
    expect(await db.courseFile.findUnique({ where: { offeringId: ids.oShared! }, select: { planJson: true } })).toBeNull();
  });

  it("TA-062: the web's form reads a day typed DD/MM/YYYY as that day, and refuses week 31 by name", async () => {
    await as("fac", "FACULTY");
    const form = (plan: string) => {
      const f = new FormData();
      f.set("offeringId", ids.oShared!);
      f.set("plan", plan);
      return f;
    };
    const saved = await savePlanAction(form("1 | ZZ Units | CO1 | 15/07/2026")).catch((e: { url?: string }) => e.url);
    expect(saved).toContain("done=academics.planSaved");
    const plan = JSON.parse((await db.courseFile.findUniqueOrThrow({ where: { offeringId: ids.oShared! }, select: { planJson: true } })).planJson) as { week: number; taughtOn: string | null }[];
    expect(plan).toEqual([{ week: 1, topic: "ZZ Units", coCodes: ["CO1"], taughtOn: "2026-07-15" }]);
    const refused = await savePlanAction(form("31 | ZZ Too late | CO1 |")).catch((e: { url?: string }) => e.url);
    expect(refused).toContain("error=academics.refusePlanWeek");
  });
});

describe("PRNs that differ only in case (TA-531)", () => {
  it("TA-531: the seat refuses a PRN another student holds in another case", async () => {
    await db.studentProgramme.update({ where: { studentMembershipId: ids.s5M! }, data: { prn: `ZZV${SUFFIX}` } });
    const admin = await as("admin", "ADMIN");
    await expect(saveSeat(admin, { studentMembershipId: ids.s6M!, programmeId: ids.bsc!, schemeId: ids.scheme!, entryYear: 2026, yearOfStudy: 1, semester: 1, divisionId: null, rollNumber: null, prn: `zzv${SUFFIX}` })).rejects.toMatchObject({ key: "academics.refusePrnTaken", status: 409 });
  });

  it("TA-531: the result file leaves a PRN two forms fold to unmatched, and writes nothing", async () => {
    // Stored that way before the check: two seats whose PRNs differ only in case.
    await db.studentProgramme.update({ where: { studentMembershipId: ids.s6M! }, data: { prn: `zzv${SUFFIX}` } });
    const session = await db.examSession.create({ data: { schoolId: ids.college!, name: `ZZ TACA session ${STAMP}`, kind: "REGULAR", termId: ids.term!, status: "CONDUCT" }, select: { id: true } });
    const examCourse = await db.course.create({ data: { schoolId: ids.college!, schemeId: ids.scheme!, code: `ZPX${SUFFIX}`, name: "ZZ Exam course", semester: 1, creditsL: 4 }, select: { id: true } });
    for (const s of ["s5", "s6"]) await db.examForm.create({ data: { schoolId: ids.college!, sessionId: session.id, studentMembershipId: ids[`${s}M`]!, coursesJson: JSON.stringify([{ courseId: examCourse.id, kind: "REGULAR" }]), eligibilityJson: "{}", eligible: true, noDues: true, status: "APPROVED", submittedAt: new Date() } });
    const ctrl = await as("ctrl", "EXAM_CONTROLLER");
    const r = await importMarks(ctrl, session.id, ["PRN,SEAT_NO,COURSE_CODE,INTERNAL,EXTERNAL", `ZZV${SUFFIX},,ZPX${SUFFIX},20,40`].join("\n"));
    expect(r).toMatchObject({ created: 0, updated: 0 });
    expect(r.unmatched.map((u) => u.line)).toEqual([2]);
    expect(await db.examMark.count({ where: { sessionId: session.id } })).toBe(0);
  });
});

describe("two opposite decisions on one late registration at once (TA-541)", () => {
  it("TA-541: the decision that lost is refused 409, not answered as if it stood", async () => {
    const admin = await as("admin", "ADMIN");
    const asked = await askLateRegistration(admin, { studentMembershipId: ids.s7M!, termId: ids.term!, reason: "ZZ a late admission", openUntil: TODAY });
    const principal = await as("principal", "PRINCIPAL");
    let both: Promise<({ ok: unknown } | { err: unknown })[]> = Promise.resolve([]);
    // Both read the row as asked; the suite holds it so both writes queue; released, one write wins.
    await db.$transaction(
      async (tx) => {
        await tx.$queryRaw`SELECT 1 FROM "LateRegistration" WHERE "id" = ${asked.id} FOR UPDATE`;
        both = Promise.all([true, false].map((approve) => decideLateRegistration(principal, asked.id, approve).then((v) => ({ ok: v }), (e: unknown) => ({ err: e }))));
        await new Promise((r) => setTimeout(r, 1200));
      },
      { timeout: 20_000 },
    );
    const outcomes = await both;
    expect(outcomes).toHaveLength(2);
    expect(outcomes.filter((o) => "ok" in o)).toEqual([{ ok: { changed: true } }]);
    expect(outcomes.filter((o) => "err" in o)).toMatchObject([{ err: { key: "academics.refuseDecided", status: 409 } }]);
  });
});
