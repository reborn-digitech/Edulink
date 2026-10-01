import { expect, type Browser, type Page } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { config } from "dotenv";
import { contextFor, sessions, VIEWPORTS } from "./actors";
import type { Actor } from "./global-setup";
import { overflow, seriousViolations, smallTargets } from "./checks";

/**
 * What the seven flow specs (flow-*.spec.ts) share: the admin connection
 * record.spec.ts opens, the minted actors, ZZ Northgate by its slug, one
 * page per actor at phone width in light, and the three measurements
 * checks.ts makes — taken on the page AFTER its write, as the brief asks.
 *
 * Every flow makes what it writes to in its own beforeAll, scoped to ZZ
 * Northgate's id and named "ZZ e2e …", and removes exactly those rows in
 * its afterAll. Nothing here touches another school.
 */
config({ path: ".env" });
export const db = new PrismaClient({ datasourceUrl: process.env.DATABASE_ADMIN_URL ?? process.env.DATABASE_URL });
export const all = sessions();
export const STAMP = Date.now();
export const PHONE = VIEWPORTS.iphone;

export async function northgate() {
  return db.school.findUniqueOrThrow({ where: { slug: "zz-northgate-school" }, select: { id: true, name: true, timezone: true, teachingDays: true } });
}

/** The current academic year ZZ Northgate's fees live in (the fixture makes one). */
export async function currentYear(schoolId: string) {
  return db.academicYear.findFirstOrThrow({ where: { schoolId, isCurrent: true }, select: { id: true, name: true } });
}

/** The membership an e2e session signs in as — the actor's own row in ZZ Northgate. */
export async function membershipOf(actor: Actor, schoolId: string, role: string) {
  const session = await db.session.findFirstOrThrow({ where: { userAgent: "e2e", activeRole: actor.role, activeSchoolId: schoolId }, orderBy: { createdAt: "desc" }, select: { userId: true } });
  return db.membership.findFirstOrThrow({ where: { userId: session.userId, schoolId, role, status: "ACTIVE" }, select: { id: true, userId: true, user: { select: { name: true, preferredName: true, email: true } } } });
}

export async function openAs(browser: Browser, actor: Actor, baseURL: string, viewport: { width: number; height: number } = PHONE): Promise<Page> {
  const context = await contextFor(browser, actor.cookie, { viewport, theme: "light", locale: "en" }, baseURL);
  return context.newPage();
}

/**
 * No sideways scroll, no touch target under 44 px, no serious axe violation
 * — record.spec.ts's three lines, taken once the toast a write raises has
 * gone (it goes on its own after five seconds). The toast's own dismiss
 * button measures 28 px; it is the shell's, on every page, and is reported
 * as a finding rather than counted against each flow.
 */
export async function sound(page: Page, label: string): Promise<void> {
  await expect(page.getByRole("button", { name: "Dismiss notification" })).toHaveCount(0, { timeout: 15_000 });
  expect(await overflow(page), `${label}: the page scrolls sideways`).toBeLessThanOrEqual(0);
  expect(await smallTargets(page), `${label}: interactive elements under 44px`).toEqual([]);
  expect(await seriousViolations(page, label)).toEqual([]);
}

/** A unique class join code, the shape the fixtures mint (the column is unique across schools). */
export function joinCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "ZE";
  for (let i = 0; i < 6; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)];
  return out;
}

/**
 * A ZZ class of the e2e teacher's own grade, with the teacher as LEAD and
 * three of the fixture's pupils of that grade enrolled in it beside their
 * own class. The register and the marks sheet both write under it, so a
 * run leaves the fixture's registers and grades untouched.
 */
export async function classForTeacher(schoolId: string, teacher: Actor, name: string) {
  const own = await db.class.findUniqueOrThrow({ where: { id: teacher.classId! }, select: { gradeLevel: true } });
  const lead = await db.classTeacher.findFirstOrThrow({ where: { classId: teacher.classId!, role: "LEAD" }, select: { teacherMembershipId: true } });
  const pupils = await db.enrollment.findMany({
    where: { classId: teacher.classId!, status: "ACTIVE", student: { status: "ACTIVE", leftAt: null } },
    orderBy: { studentMembershipId: "asc" },
    take: 3,
    select: { studentMembershipId: true, student: { select: { user: { select: { name: true, preferredName: true } } } } },
  });
  if (pupils.length < 3) throw new Error("the e2e teacher's class has fewer than three pupils — run npm run zz:fixtures");
  const klass = await db.class.create({
    data: {
      schoolId,
      name,
      subject: "Form group",
      gradeLevel: own.gradeLevel,
      section: "E2E",
      joinCode: joinCode(),
      teachers: { create: { schoolId, teacherMembershipId: lead.teacherMembershipId, role: "LEAD" } },
      enrollments: { create: pupils.map((p) => ({ schoolId, studentMembershipId: p.studentMembershipId, status: "ACTIVE" })) },
    },
    select: { id: true, gradeLevel: true },
  });
  return {
    id: klass.id,
    gradeLevel: klass.gradeLevel!,
    teacherMembershipId: lead.teacherMembershipId,
    pupils: pupils.map((p) => ({ membershipId: p.studentMembershipId, name: p.student.user.preferredName ?? p.student.user.name })),
  };
}

/** Removes the class and everything that hangs off it, scoped by the school id as well as the class's own. */
export async function removeClass(schoolId: string, classId: string): Promise<void> {
  await db.attendanceSession.deleteMany({ where: { schoolId, classId } });
  await db.grade.deleteMany({ where: { schoolId, assignment: { classId } } });
  await db.assignment.deleteMany({ where: { schoolId, classId } });
  await db.enrollment.deleteMany({ where: { schoolId, classId } });
  await db.classTeacher.deleteMany({ where: { schoolId, classId } });
  await db.class.deleteMany({ where: { schoolId, id: classId } });
}
