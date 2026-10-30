/**
 * qb-B (31 October 2026): the QA pass's teaching findings QB-02 to QB-05, at a ZZ school of this suite's own
 * (people at @test.invalid), deleted by id.
 *
 * QB-02 the class door gave a timetable-only teacher the class's join code; it answers null unless the caller is
 * the class's form teacher (or the office). QB-03 the gradebook door never answered the work's subject. QB-04 a
 * lesson was stored with the subject as typed ("english") and so fell outside the class's English syllabus; it now
 * takes the timetable's spelling, and the syllabus read matches the subject asked for the same way. QB-05 a subject
 * teacher's syllabus opened on the first subject of the class (Art, read-only) rather than their own, the empty
 * chapter list invited a reader who cannot plan to "plan lessons below", and the class pickers sorted Grade 10
 * before Grade 3.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { PrismaClient } from "@prisma/client";
import { staffClassDetailSchema, teachingGradebookSchema } from "@edulink/contracts";
import type { ActiveContext } from "@/lib/session";
import { createSession } from "@/lib/session";
import { __resetCookies, __setHeaders } from "./stubs/next-headers";
import { createAssignment } from "@/lib/grading";
import { saveLessonPlan, staffSyllabus } from "@/lib/syllabus";
import { teachingGradebook } from "@/lib/api-reads/teaching";
import { staffAssignments, staffClasses } from "@/lib/api-reads/staff";
import { GET as classGet } from "@/app/api/v1/staff/classes/[classId]/route";
import { I18nProvider } from "@/lib/i18n/provider";
import { dictionaryAsset } from "@/lib/i18n/asset";
import ClassSyllabusPage from "@/app/(app)/teacher/classes/[classId]/syllabus/page";

(globalThis as { React?: typeof React }).React = React;

const db = new PrismaClient();
const STAMP = Date.now();
const SUFFIX = String(STAMP).slice(-6);
const EMAIL = (who: string) => `zz-qbb-${who}-${STAMP}@test.invalid`;

const ids = { school: "", klassA: "", klass3: "", klass10: "", period: "", period2: "" };
type Person = { userId: string; membershipId: string };
let admin: Person;
let form: Person; // LEAD of 6A; Art in 6A on the timetable
let subject: Person; // English in 6A, 3A and 10A on the timetable, no ClassTeacher row

const prefs = { theme: "system", contrast: "normal", locale: "en", channels: { push: false, email: false }, quietHours: null } as never;
function ctxOf(p: Person, role: "ADMIN" | "TEACHER"): ActiveContext & { schoolId: string; membershipId: string; role: "ADMIN" | "TEACHER" } {
  return { sessionId: "test-session", membershipId: p.membershipId, schoolId: ids.school, role, user: { id: p.userId, name: "ZZ QbB", preferredName: null, email: null, avatarKey: null, isMinor: false, isSuperuser: false, isAppAdmin: false, prefs } };
}
async function as(p: Person, role: "TEACHER" | "ADMIN", route: string | null = null) {
  __resetCookies();
  __setHeaders(route ? { "x-edulink-route": route } : {});
  await createSession(p.userId, { schoolId: ids.school, role });
}

beforeAll(async () => {
  ids.school = (await db.school.create({ data: { name: `ZZ QbB Teaching ${STAMP}`, slug: `zz-qbb-teach-${STAMP}`, code: `ZQB${SUFFIX}`, contactEmail: EMAIL("school"), timezone: "Asia/Kolkata", locale: "en", verifiedAt: new Date(), teachingDays: "0,1,2,3,4,5,6", isTestFixture: true }, select: { id: true } })).id;
  const person = async (who: string, role: "ADMIN" | "TEACHER"): Promise<Person> => {
    const userId = (await db.user.create({ data: { name: `ZZ QbB ${who}`, email: EMAIL(who.toLowerCase()) }, select: { id: true } })).id;
    const membershipId = (await db.membership.create({ data: { userId, schoolId: ids.school, role, status: "ACTIVE" }, select: { id: true } })).id;
    return { userId, membershipId };
  };
  admin = await person("Admin", "ADMIN");
  form = await person("Form", "TEACHER");
  subject = await person("Rekha", "TEACHER");
  const klass = async (name: string, gradeLevel: string, code: string) => (await db.class.create({ data: { schoolId: ids.school, name, gradeLevel, joinCode: `${code}${SUFFIX}` }, select: { id: true } })).id;
  // Created in the order a name sort would list them, so a list in creation order proves nothing either way.
  ids.klass10 = await klass("ZZ Grade 10 · A", "10", "QBX");
  ids.klass3 = await klass("ZZ Grade 3 · A", "3", "QBT");
  ids.klassA = await klass("ZZ Grade 6 · A", "6", "QBA");
  await db.classTeacher.create({ data: { classId: ids.klassA, schoolId: ids.school, teacherMembershipId: form.membershipId, role: "LEAD" } });
  ids.period = (await db.timetablePeriod.create({ data: { schoolId: ids.school, name: "Period 1", startMinute: 480, endMinute: 525, position: 1 }, select: { id: true } })).id;
  ids.period2 = (await db.timetablePeriod.create({ data: { schoolId: ids.school, name: "Period 2", startMinute: 525, endMinute: 570, position: 2 }, select: { id: true } })).id;
  const slot = (classId: string, weekday: number, periodId: string, subj: string, who: Person) => db.timetableSlot.create({ data: { schoolId: ids.school, classId, periodId, weekday, subject: subj, teacherMembershipId: who.membershipId } });
  await slot(ids.klassA, 1, ids.period, "English", subject);
  await slot(ids.klassA, 1, ids.period2, "Art", form);
  await slot(ids.klass3, 2, ids.period, "English", subject);
  await slot(ids.klass10, 3, ids.period, "English", subject);
  await db.syllabusUnit.create({ data: { schoolId: ids.school, gradeLevel: "6", subject: "English", position: 1, title: "ZZ Poems" } });
});

afterAll(async () => {
  __resetCookies();
  __setHeaders({});
  const users = [admin, form, subject].filter(Boolean).map((p) => p.userId);
  await db.session.deleteMany({ where: { userId: { in: users } } });
  await db.notification.deleteMany({ where: { OR: [{ schoolId: ids.school }, { userId: { in: users } }] } });
  await db.auditLog.deleteMany({ where: { schoolId: ids.school } });
  await db.school.deleteMany({ where: { id: ids.school } });
  await db.user.deleteMany({ where: { email: { contains: `-${STAMP}@test.invalid` } } });
  expect(await db.school.count({ where: { id: ids.school } })).toBe(0);
  await db.$disconnect();
});

describe("QB-02: the class door's join code", () => {
  it("answers null to a teacher the timetable alone sends here, and the code to the form teacher and the office", async () => {
    const read = async (p: Person, role: "TEACHER" | "ADMIN") => {
      await as(p, role, `GET /api/v1/staff/classes/${ids.klassA}`);
      const res = await classGet(new Request(`http://localhost/api/v1/staff/classes/${ids.klassA}`), { params: Promise.resolve({ classId: ids.klassA }) });
      expect(res.status).toBe(200);
      const text = await res.text();
      const body = JSON.parse(text) as { data?: unknown };
      return { text, view: staffClassDetailSchema.parse(body.data ?? body) };
    };
    const code = `QBA${SUFFIX}`;
    const bySubject = await read(subject, "TEACHER");
    expect(bySubject.view.formTeacher).toBe(false);
    expect(bySubject.view.class.joinCode).toBeNull();
    expect(bySubject.text).not.toContain(code);
    expect((await read(form, "TEACHER")).view.class.joinCode).toBe(code);
    expect((await read(admin, "ADMIN")).view.class.joinCode).toBe(code);
  });
});

describe("QB-03: the gradebook door answers the work's subject", () => {
  it("carries the subject the work was stored with", async () => {
    const ctx = ctxOf(subject, "TEACHER");
    const work = await createAssignment({ schoolId: ids.school, membershipId: subject.membershipId, role: "TEACHER", userId: subject.userId }, { classId: ids.klassA, title: "ZZ QbB poem", body: "", subject: "english", publish: false });
    const book = teachingGradebookSchema.parse(await teachingGradebook(ctx as ActiveContext & { schoolId: string; membershipId: string; role: "TEACHER" }, work.assignmentId));
    expect(book.assignment.subject).toBe("English");
  });
});

describe("QB-04: a lesson takes the timetable's spelling of its subject", () => {
  it("stores 'english' as English and lists it under English, whichever spelling the read asks for", async () => {
    const ctx = ctxOf(subject, "TEACHER");
    const { id } = await saveLessonPlan(ctx, { classId: ids.klassA, subject: "  english ", dateKey: "2026-10-30", topic: "ZZ QbB english lesson", notes: "", homework: "", status: "PLANNED" });
    expect((await db.lessonPlan.findUniqueOrThrow({ where: { id }, select: { subject: true } })).subject).toBe("English");
    const asked = await staffSyllabus(ctx, { classId: ids.klassA, subject: "English" });
    expect(asked.lessons.map((l) => l.topic)).toContain("ZZ QbB english lesson");
    const lower = await staffSyllabus(ctx, { classId: ids.klassA, subject: "english" });
    expect(lower.subject).toBe("English");
    expect(lower.units).toHaveLength(1);
    expect(lower.lessons.map((l) => l.topic)).toContain("ZZ QbB english lesson");
  });
});

describe("QB-05: a subject teacher's syllabus and class lists", () => {
  it("opens on the caller's own subject, editable; the form teacher's opens on theirs; the office on the first", async () => {
    const mine = await staffSyllabus(ctxOf(subject, "TEACHER"), { classId: ids.klassA });
    expect(mine.subjects).toEqual(["Art", "English"]);
    expect(mine.subject).toBe("English");
    expect(mine.canEdit).toBe(true);
    expect((await staffSyllabus(ctxOf(form, "TEACHER"), { classId: ids.klassA })).subject).toBe("Art");
    expect((await staffSyllabus(ctxOf(admin, "ADMIN"), { classId: ids.klassA })).subject).toBe("Art");
  });

  it("does not invite a reader who cannot plan to plan lessons", async () => {
    await as(subject, "TEACHER");
    const page = await ClassSyllabusPage({ params: Promise.resolve({ classId: ids.klassA }), searchParams: Promise.resolve({ subject: "Art" }) });
    const html = renderToStaticMarkup(React.createElement(I18nProvider, { locale: "en", href: dictionaryAsset("en").href } as Parameters<typeof I18nProvider>[0], page));
    expect(html).toContain("No syllabus for this subject yet");
    expect(html).not.toContain("plan lessons below meanwhile");
    expect(html).toContain("The office writes the chapter list for the grade.");
  });

  it("lists classes by grade number: Grade 3 before Grade 10, on the classes door and the work picker", async () => {
    const ctx = ctxOf(subject, "TEACHER");
    const want = ["ZZ Grade 3 · A", "ZZ Grade 6 · A", "ZZ Grade 10 · A"];
    expect((await staffClasses(ctx)).classes.map((k) => k.name)).toEqual(want);
    expect((await staffAssignments(ctx, {})).classOptions.map((k) => k.name)).toEqual(want);
    expect((await staffAssignments(ctxOf(admin, "ADMIN"), {})).classOptions.map((k) => k.name)).toEqual(want);
  });
});
