/**
 * A STALE OR SOMEONE ELSE'S ID IS A 404, NOT A 500 (A3-states-2 and
 * A3-journeys-6, audit of 5 October 2026).
 *
 * Twelve college route templates answered HTTP 500 with Next's bare
 * "Application error" for a mistyped id, another college's id, or another
 * faculty member's lecture: the library refused with an AccessError (or the
 * payroll month with a RuleRefusal) and nothing on the page turned it into
 * `notFound()`. AccessError now carries the digest Next's own `notFound()`
 * throws, so a refusal that reaches any page's render is the app's not-found
 * page (app/(app)/not-found.tsx, inside the shell) with a 404.
 *
 * What is proved: the digest is the framework's, read back through Next's own
 * `getAccessFallbackHTTPStatus`; every one of the twelve templates, rendered
 * as its own role at a ZZ college of this suite's, rejects a bogus id with
 * that 404 interrupt (before the fix each rejected with a bare AccessError or
 * RuleRefusal, which Next answers 500); another college's exam session,
 * survey and application, and another faculty member's lecture and offering,
 * are the same 404; the owner still renders.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import * as React from "react";
import { PrismaClient } from "@prisma/client";
import { notFound } from "next/navigation";
import { getAccessFallbackHTTPStatus } from "next/dist/client/components/http-access-fallback/http-access-fallback";
import { createSession } from "@/lib/session";
import { AccessError, ModuleOffError, PAGE_NOT_FOUND_DIGEST } from "@/lib/access-error";
import { addDaysToKey, todayKey } from "@/lib/dates";
import { __resetCookies, __setHeaders } from "./stubs/next-headers";
import SessionFormsPage from "@/app/(app)/exam-cell/sessions/[sessionId]/page";
import ConductPage from "@/app/(app)/exam-cell/sessions/[sessionId]/conduct/page";
import ExportPage from "@/app/(app)/exam-cell/sessions/[sessionId]/export/page";
import LogisticsPage from "@/app/(app)/exam-cell/sessions/[sessionId]/logistics/page";
import MarksPage from "@/app/(app)/exam-cell/sessions/[sessionId]/marks/page";
import ResultsPage from "@/app/(app)/exam-cell/sessions/[sessionId]/results/page";
import SeatingPage from "@/app/(app)/exam-cell/sessions/[sessionId]/seating/[scheduleId]/page";
import LecturePage from "@/app/(app)/faculty/lectures/[lectureId]/page";
import OfferingPage from "@/app/(app)/faculty/offerings/[offeringId]/page";
import SurveyResultsPage from "@/app/(app)/iqac/surveys/[surveyId]/page";
import ApplicationPage from "@/app/(app)/admin/college-admissions/[applicationId]/page";
import PayrollRunPage from "@/app/(app)/admin/payroll/runs/[month]/page";

// Server components compiled with the classic JSX runtime here (tsconfig's "preserve") need React in scope.
(globalThis as { React?: typeof React }).React = React;

const db = new PrismaClient();
const STAMP = Date.now();
const SUFFIX = String(STAMP).slice(-6);
const TODAY = todayKey("Asia/Kolkata");
const BOGUS = "zz-nope0000000000000000000";
const u: Record<string, string> = {};
const m: Record<string, string> = {};
const id: Record<string, string> = {};

async function as(who: string, role: string, schoolId: string) {
  __resetCookies();
  __setHeaders({});
  await createSession(u[who]!, { schoolId, role: role as never });
}

/** What a page's render did: the 404 interrupt, another throw (Next answers it 500), or a rendered tree. */
async function outcome(render: Promise<unknown>): Promise<"404" | "rendered" | string> {
  try {
    await render;
    return "rendered";
  } catch (error) {
    if (getAccessFallbackHTTPStatus(error as never) === 404) return "404";
    return `threw ${(error as Error).name}: ${(error as Error).message}`;
  }
}

const p = <T extends Record<string, string>>(params: T) => ({ params: Promise.resolve(params), searchParams: Promise.resolve({}) });

/** The twelve templates of the finding, each as the role that opens it. */
const TEMPLATES: { name: string; who: string; role: string; render: (x: string) => Promise<unknown> }[] = [
  { name: "/exam-cell/sessions/[id]", who: "ctrl", role: "EXAM_CONTROLLER", render: (x) => SessionFormsPage(p({ sessionId: x })) },
  { name: "/exam-cell/sessions/[id]/conduct", who: "ctrl", role: "EXAM_CONTROLLER", render: (x) => ConductPage(p({ sessionId: x })) },
  { name: "/exam-cell/sessions/[id]/export", who: "ctrl", role: "EXAM_CONTROLLER", render: (x) => ExportPage(p({ sessionId: x })) },
  { name: "/exam-cell/sessions/[id]/logistics", who: "ctrl", role: "EXAM_CONTROLLER", render: (x) => LogisticsPage(p({ sessionId: x })) },
  { name: "/exam-cell/sessions/[id]/marks", who: "ctrl", role: "EXAM_CONTROLLER", render: (x) => MarksPage(p({ sessionId: x })) },
  { name: "/exam-cell/sessions/[id]/results", who: "ctrl", role: "EXAM_CONTROLLER", render: (x) => ResultsPage(p({ sessionId: x })) },
  { name: "/exam-cell/sessions/[id]/seating/[scheduleId]", who: "ctrl", role: "EXAM_CONTROLLER", render: (x) => SeatingPage({ params: Promise.resolve({ sessionId: x, scheduleId: x }) }) },
  { name: "/faculty/lectures/[id]", who: "facA", role: "FACULTY", render: (x) => LecturePage(p({ lectureId: x })) },
  { name: "/faculty/offerings/[id]", who: "facA", role: "FACULTY", render: (x) => OfferingPage(p({ offeringId: x })) },
  { name: "/iqac/surveys/[id]", who: "iqac", role: "IQAC", render: (x) => SurveyResultsPage(p({ surveyId: x })) },
  { name: "/admin/college-admissions/[id]", who: "admin", role: "ADMIN", render: (x) => ApplicationPage(p({ applicationId: x })) },
  { name: "/admin/payroll/runs/[month]", who: "admin", role: "ADMIN", render: (x) => PayrollRunPage(p({ month: x })) },
];

beforeAll(async () => {
  const mk = (tag: string) =>
    db.school.create({ data: { name: `ZZ NotFound ${tag} ${STAMP}`, slug: `zz-nf-${tag.toLowerCase()}-${STAMP}`, code: `ZN${tag[0]}${SUFFIX}`, contactEmail: `zz-nf-${tag.toLowerCase()}-${STAMP}@test.invalid`, timezone: "Asia/Kolkata", kind: "COLLEGE" }, select: { id: true } });
  id.mine = (await mk("Mine")).id;
  id.other = (await mk("Other")).id;
  const modules = ["ACADEMICS", "EXAMS", "IQAC", "ADMISSIONS", "PAYROLL"];
  await db.schoolModule.createMany({ data: [id.mine, id.other].flatMap((schoolId) => modules.map((module) => ({ schoolId: schoolId!, module }))) });
  const people: [string, string, string][] = [["admin", "ADMIN", id.mine!], ["ctrl", "EXAM_CONTROLLER", id.mine!], ["iqac", "IQAC", id.mine!], ["facA", "FACULTY", id.mine!], ["facB", "FACULTY", id.mine!], ["otherAdmin", "ADMIN", id.other!]];
  for (const [who, role, schoolId] of people) {
    u[who] = (await db.user.create({ data: { name: `ZZ NotFound ${who}`, email: `zz-nf-${who.toLowerCase()}-${STAMP}@test.invalid`, isMinor: false }, select: { id: true } })).id;
    m[who] = (await db.membership.create({ data: { userId: u[who]!, schoolId, role, status: "ACTIVE" }, select: { id: true } })).id;
  }
  // Each college's own structure: a department, a programme, a scheme, a course and a term.
  for (const [key, schoolId] of [["mine", id.mine!], ["other", id.other!]] as const) {
    const dep = (await db.department.create({ data: { schoolId, code: "PHY", name: "ZZ Physics" }, select: { id: true } })).id;
    if (key === "mine") {
      // facB teaches in another department: a colleague of the same department may read the course file (countersigning), by design.
      const chem = (await db.department.create({ data: { schoolId, code: "CHE", name: "ZZ Chemistry" }, select: { id: true } })).id;
      await db.departmentFaculty.createMany({ data: [{ schoolId, membershipId: m.facA!, departmentId: dep }, { schoolId, membershipId: m.facB!, departmentId: chem }] });
    }
    id[`${key}Prog`] = (await db.programme.create({ data: { schoolId, departmentId: dep, code: "BSC", name: "ZZ BSc", level: "UG", durationYears: 3, regulator: "UGC", attendanceThreshold: 75 }, select: { id: true } })).id;
    const scheme = (await db.scheme.create({ data: { schoolId, programmeId: id[`${key}Prog`]!, name: "ZZ BSc 2026", effectiveYear: 2026, passingRules: JSON.stringify({ minPercentPerCourse: 40, atktLimit: 4, totalCredits: 120, internalMax: 40, externalMax: 60, minTermCredits: 1, maxTermCredits: 30 }) }, select: { id: true } })).id;
    id[`${key}Course`] = (await db.course.create({ data: { schoolId, schemeId: scheme, code: "PHY1", name: "ZZ PHY1", semester: 1, creditsL: 4, kind: "CORE", outcomes: JSON.stringify([{ code: "CO1", text: "ZZ an outcome" }]) }, select: { id: true } })).id;
    id[`${key}Term`] = (await db.academicTerm.create({ data: { schoolId, name: "ZZ Now", academicYear: "2026–27", startsOn: addDaysToKey(TODAY, -30), endsOn: addDaysToKey(TODAY, 90), registrationOpensOn: addDaysToKey(TODAY, -40), registrationClosesOn: addDaysToKey(TODAY, -31) }, select: { id: true } })).id;
  }
  // Mine: facA's offering and lecture, which facB may not open.
  id.offering = (await db.courseOffering.create({ data: { schoolId: id.mine!, termId: id.mineTerm!, courseId: id.mineCourse!, facultyMembershipId: m.facA!, lectureHours: 3 }, select: { id: true } })).id;
  id.lecture = (await db.lecture.create({ data: { schoolId: id.mine!, offeringId: id.offering, dateKey: TODAY, startMinute: 540, endMinute: 590 }, select: { id: true } })).id;
  // The other college's session, survey, application and payroll run, which mine may not open.
  id.otherSession = (await db.examSession.create({ data: { schoolId: id.other!, name: "ZZ Winter", termId: id.otherTerm! }, select: { id: true } })).id;
  id.otherSurvey = (await db.survey.create({ data: { schoolId: id.other!, kind: "STUDENT_SATISFACTION", title: "ZZ Survey", opensOn: TODAY, closesOn: addDaysToKey(TODAY, 7) }, select: { id: true } })).id;
  const round = (await db.admissionRound.create({ data: { schoolId: id.other!, intakeYear: 2026, kind: "MERIT", name: "ZZ Round", opensAt: new Date(Date.now() - 86_400_000), closesAt: new Date(Date.now() + 86_400_000) }, select: { id: true } })).id;
  id.otherApp = (await db.collegeApplication.create({ data: { schoolId: id.other!, roundId: round, programmeId: id.otherProg!, number: 1, applicantName: "ZZ Applicant", category: "GENERAL", quota: "GENERAL" }, select: { id: true } })).id;
  await db.payrollRun.create({ data: { schoolId: id.other!, month: "2026-08" } });
});

afterAll(async () => {
  __resetCookies();
  __setHeaders({});
  await db.session.deleteMany({ where: { user: { email: { contains: `-${STAMP}@test.invalid` } } } });
  await db.school.deleteMany({ where: { id: { in: [id.mine!, id.other!] } } });
  await db.user.deleteMany({ where: { email: { contains: `-${STAMP}@test.invalid` } } });
  await db.$disconnect();
});

describe("a refusal in a page's render", () => {
  it("carries the digest Next's own notFound() throws, so Next answers it 404", () => {
    let thrown: unknown;
    try {
      notFound();
    } catch (e) {
      thrown = e;
    }
    expect((thrown as { digest?: string }).digest).toBe(PAGE_NOT_FOUND_DIGEST);
    for (const code of ["NOT_FOUND", "FORBIDDEN", "MODULE_OFF"] as const) {
      expect(getAccessFallbackHTTPStatus(new AccessError("access.entryNotFound", code) as never)).toBe(404);
    }
    expect(getAccessFallbackHTTPStatus(new ModuleOffError("PAYROLL") as never)).toBe(404);
    // A signed-out refusal is a page gate's redirect, never a 404 (page-gates.test.ts).
    expect(new AccessError("access.entryNotFound", "UNAUTHENTICATED").digest).toBeUndefined();
  });
});

describe("the twelve templates of A3-states-2", () => {
  for (const tpl of TEMPLATES) {
    it(`${tpl.name} answers 404 for a bogus id`, async () => {
      await as(tpl.who, tpl.role, id.mine!);
      expect(await outcome(tpl.render(BOGUS))).toBe("404");
    });
  }

  it("another college's exam session is 404 on every session page", async () => {
    for (const tpl of TEMPLATES.filter((x) => x.name.startsWith("/exam-cell/"))) {
      await as(tpl.who, tpl.role, id.mine!);
      expect(`${tpl.name} ${await outcome(tpl.render(id.otherSession!))}`).toBe(`${tpl.name} 404`);
    }
  });

  it("another college's survey, application and payroll month are 404", async () => {
    await as("iqac", "IQAC", id.mine!);
    expect(await outcome(SurveyResultsPage(p({ surveyId: id.otherSurvey! })))).toBe("404");
    await as("admin", "ADMIN", id.mine!);
    expect(await outcome(ApplicationPage(p({ applicationId: id.otherApp! })))).toBe("404");
    expect(await outcome(PayrollRunPage(p({ month: "2026-08" })))).toBe("404");
  });

  it("another department's faculty member's lecture and offering are 404 (A3-journeys-6), and the owner's own render", async () => {
    await as("facB", "FACULTY", id.mine!);
    expect(await outcome(LecturePage(p({ lectureId: id.lecture! })))).toBe("404");
    expect(await outcome(OfferingPage(p({ offeringId: id.offering! })))).toBe("404");
    await as("facA", "FACULTY", id.mine!);
    expect(await outcome(LecturePage(p({ lectureId: id.lecture! })))).toBe("rendered");
    expect(await outcome(OfferingPage(p({ offeringId: id.offering! })))).toBe("rendered");
  });
});
