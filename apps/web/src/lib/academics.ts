import "server-only";
import {
  academicsSettingsSchema,
  defaultAttendanceThreshold,
  exitPointSchema,
  gradeRowSchema,
  outcomeSchema,
  passingRulesSchema,
  type AcademicsSettings,
  type AcademicsStructure,
  type ExitPoint,
  type GradeRow,
  type Offering,
  type Outcome,
  type PassingRules,
} from "@edulink/contracts";
import type { z } from "zod";
import type {
  academicsTimetableSchema,
  courseMappingSaveSchema,
  courseSaveSchema,
  departmentSaveSchema,
  divisionSaveSchema,
  lectureSubstitutionsSchema,
  offeringSaveSchema,
  offeringsSchema,
  programmeOutcomesSaveSchema,
  programmeSaveSchema,
  roomSaveSchema,
  schemeSaveSchema,
  seatSaveSchema,
  seatsSchema,
  termSaveSchema,
  timetableSlotSaveSchema,
} from "@edulink/contracts";
import { db } from "./db";
import { syncGradeLevel } from "./grade-level";
import { AccessError } from "./access-error";
import { RuleRefusal } from "./rule-refusal";
import { assertModuleOn } from "./modules";
import { audit } from "./audit";
import { notify } from "./notify";
import { classCode } from "./codes";
import { closedOn } from "./holidays";
import { readJson, writeJson } from "./json";
import { isDateKey, parseTeachingDays, todayKey, weekdayOfKey } from "./dates";
import { creditsOf, loadState, slotKey } from "./academics-rules";
import type { ActiveContext } from "./session";
import type { Role } from "./constants";

/**
 * THE COLLEGE'S ACADEMICS (module ACADEMICS, roles FACULTY and HOD; the
 * owner's plan of 4 October 2026) — the structure the office keeps, the
 * offerings, the timetable and the substitution board. Registration,
 * lectures and attendance, internal assessment, the course file, mentoring
 * and the homes are the academics-*.ts files beside this one, all through
 * `academicsCaller` below.
 *
 * WHO. The office (ADMIN) writes the structure; the head (PRINCIPAL) reads
 * it and decides what the regulations reserve to a principal (late
 * registrations, forwarded condonations). An HOD allots their own
 * department's offerings and decides its condonations; FACULTY teach. Every
 * door and page asks for its roles first and then for the module, so the
 * wrong role is answered 403 before anything is parsed, and a school (which
 * is never offered ACADEMICS) answers MODULE_OFF.
 *
 * A DIVISION IS A CLASS (see the schema's note): making one makes a Class
 * row and a Division row naming its programme, in one transaction.
 */

export type Caller = { schoolId: string; userId: string; membershipId: string; role: Role; timeZone: string };
export const OFFICE: readonly Role[] = ["ADMIN", "PRINCIPAL"];
export const TEACHING: readonly Role[] = ["FACULTY", "HOD"];
type Tx = typeof db;

export async function zoneOf(schoolId: string): Promise<string> {
  return (await db.school.findUnique({ where: { id: schoolId }, select: { timezone: true } }))?.timezone ?? "Asia/Kolkata";
}

/** The caller, in one of `roles`, at an institution with ACADEMICS on — or refused. */
export async function academicsCaller(ctx: ActiveContext, roles: readonly Role[]): Promise<Caller> {
  if (!ctx.schoolId || !ctx.membershipId || !ctx.role || !roles.includes(ctx.role)) throw new AccessError("access.wrongRoleForThisAction");
  // Side by side rather than one after the other (load campaign LOAD-2): every academics door starts here.
  const [, timeZone] = await Promise.all([assertModuleOn(ctx.schoolId, "ACADEMICS"), zoneOf(ctx.schoolId)]);
  return { schoolId: ctx.schoolId, userId: ctx.user.id, membershipId: ctx.membershipId, role: ctx.role, timeZone };
}

export const nameOf = (u: { name: string; preferredName: string | null } | null | undefined) => (u ? (u.preferredName ?? u.name) : "");
const USER = { select: { name: true, preferredName: true } } as const;

/** Names of memberships, by id. */
export async function namesOf(ids: readonly (string | null | undefined)[]): Promise<Map<string, string>> {
  const clean = [...new Set(ids.filter((x): x is string => Boolean(x)))];
  if (!clean.length) return new Map();
  const rows = await db.membership.findMany({ where: { id: { in: clean } }, select: { id: true, user: USER } });
  return new Map(rows.map((r) => [r.id, nameOf(r.user)]));
}

/* ------------------------------------------------------------ json fields */

export function readExitPoints(raw: string): ExitPoint[] {
  return readJson<unknown[]>(raw, []).flatMap((x) => {
    const p = exitPointSchema.safeParse(x);
    return p.success ? [p.data] : [];
  });
}
export function readGradingTable(raw: string): GradeRow[] {
  return readJson<unknown[]>(raw, []).flatMap((x) => {
    const p = gradeRowSchema.safeParse(x);
    return p.success ? [p.data] : [];
  });
}
export const DEFAULT_PASSING_RULES: PassingRules = { minPercentPerCourse: 40, atktLimit: 4, totalCredits: 120, internalMax: 40, externalMax: 60, minTermCredits: 16, maxTermCredits: 26 };
export function readPassingRules(raw: string): PassingRules {
  const p = passingRulesSchema.safeParse(readJson<unknown>(raw, {}));
  return p.success ? p.data : DEFAULT_PASSING_RULES;
}
export function readOutcomes(raw: string): Outcome[] {
  return readJson<unknown[]>(raw, []).flatMap((x) => {
    const p = outcomeSchema.safeParse(x);
    return p.success ? [p.data] : [];
  });
}
export const readCodes = (raw: string): string[] => readJson<unknown[]>(raw, []).filter((x): x is string => typeof x === "string");

/* --------------------------------------------------------------- settings */

export const ACADEMICS_DEFAULTS: AcademicsSettings = { loadMinHours: 14, loadMaxHours: 18, studentsPerFaculty: 20, menteesPerMentor: 20 };

export async function academicsSettings(schoolId: string): Promise<AcademicsSettings> {
  const row = await db.academicsSettings.findUnique({ where: { schoolId } });
  return row ? { loadMinHours: row.loadMinHours, loadMaxHours: row.loadMaxHours, studentsPerFaculty: row.studentsPerFaculty, menteesPerMentor: row.menteesPerMentor } : { ...ACADEMICS_DEFAULTS };
}

export async function saveAcademicsSettings(ctx: ActiveContext, input: AcademicsSettings): Promise<AcademicsSettings> {
  const c = await academicsCaller(ctx, ["ADMIN"]);
  const data = academicsSettingsSchema.parse(input);
  if (data.loadMinHours > data.loadMaxHours) throw new RuleRefusal("academics.refuseLoadRange", 422, undefined, "loadMinHours");
  await db.academicsSettings.upsert({ where: { schoolId: c.schoolId }, create: { schoolId: c.schoolId, ...data, updatedByUserId: c.userId }, update: { ...data, updatedByUserId: c.userId } });
  await audit({ schoolId: c.schoolId, actorUserId: c.userId, action: "academics.settings", targetType: "School", targetId: c.schoolId, meta: { ...data } });
  return academicsSettings(c.schoolId);
}

/* ---------------------------------------------------------------- terms */

/** The term a day falls in (the latest-starting one), or null. */
export async function termOn(schoolId: string, dateKey: string) {
  return db.academicTerm.findFirst({ where: { schoolId, startsOn: { lte: dateKey }, endsOn: { gte: dateKey } }, orderBy: { startsOn: "desc" } });
}

/** The term to show by default: the one today falls in, else the next to start, else the last that ended. */
export async function currentTerm(schoolId: string, today: string) {
  return (
    (await termOn(schoolId, today)) ??
    (await db.academicTerm.findFirst({ where: { schoolId, startsOn: { gt: today } }, orderBy: { startsOn: "asc" } })) ??
    (await db.academicTerm.findFirst({ where: { schoolId }, orderBy: { startsOn: "desc" } }))
  );
}

export function termView(t: { id: string; name: string; academicYear: string; startsOn: string; endsOn: string; registrationOpensOn: string; registrationClosesOn: string }, today: string) {
  return { id: t.id, name: t.name, academicYear: t.academicYear, startsOn: t.startsOn, endsOn: t.endsOn, registrationOpensOn: t.registrationOpensOn, registrationClosesOn: t.registrationClosesOn, registrationOpen: today >= t.registrationOpensOn && today <= t.registrationClosesOn };
}

/* ------------------------------------------------------------ departments */

/** The department an HOD heads (by their HOD membership), or null. */
export async function hodDepartment(c: Caller) {
  if (c.role !== "HOD") return null;
  return db.department.findFirst({ where: { schoolId: c.schoolId, hodMembershipId: c.membershipId }, select: { id: true, code: true, name: true, condoneFloorPercent: true } });
}

/** A teaching member's department: the one they head, else the one they belong to. */
export async function departmentOfMember(schoolId: string, membershipId: string): Promise<string | null> {
  const head = await db.department.findFirst({ where: { schoolId, hodMembershipId: membershipId }, select: { id: true } });
  if (head) return head.id;
  return (await db.departmentFaculty.findUnique({ where: { membershipId }, select: { departmentId: true } }))?.departmentId ?? null;
}

/** The college's teaching staff: FACULTY and HOD memberships, with their departments. */
export async function teachingStaff(schoolId: string) {
  const [members, links, heads] = await Promise.all([
    db.membership.findMany({ where: { schoolId, role: { in: ["FACULTY", "HOD"] }, status: "ACTIVE", leftAt: null }, select: { id: true, role: true, user: USER }, orderBy: { user: { name: "asc" } }, take: 1000 }),
    db.departmentFaculty.findMany({ where: { schoolId }, select: { membershipId: true, departmentId: true } }),
    db.department.findMany({ where: { schoolId, hodMembershipId: { not: null } }, select: { id: true, hodMembershipId: true } }),
  ]);
  const dept = new Map(links.map((l) => [l.membershipId, l.departmentId]));
  for (const h of heads) if (h.hodMembershipId && !dept.has(h.hodMembershipId)) dept.set(h.hodMembershipId, h.id);
  return members.map((m) => ({ membershipId: m.id, name: nameOf(m.user), role: m.role as "FACULTY" | "HOD", departmentId: dept.get(m.id) ?? null }));
}

async function refuseTaken<T>(work: () => Promise<T>): Promise<T> {
  try {
    return await work();
  } catch (e) {
    if (typeof e === "object" && e !== null && (e as { code?: string }).code === "P2002") throw new RuleRefusal("academics.refuseCodeTaken", 409, undefined, "code");
    throw e;
  }
}

export async function saveDepartment(ctx: ActiveContext, input: z.infer<typeof departmentSaveSchema>): Promise<{ id: string }> {
  const c = await academicsCaller(ctx, ["ADMIN"]);
  if (input.hodMembershipId) {
    const m = await db.membership.findFirst({ where: { id: input.hodMembershipId, schoolId: c.schoolId, role: { in: ["FACULTY", "HOD"] }, status: "ACTIVE" }, select: { id: true } });
    if (!m) throw new RuleRefusal("academics.refuseNotFaculty", 422, undefined, "hodMembershipId");
  }
  const data = { code: input.code.toUpperCase(), name: input.name, hodMembershipId: input.hodMembershipId, condoneFloorPercent: input.condoneFloorPercent };
  const row = await refuseTaken(async () => {
    if (input.id) {
      const found = await db.department.findFirst({ where: { id: input.id, schoolId: c.schoolId }, select: { id: true } });
      if (!found) throw new AccessError("access.entryNotFound", "NOT_FOUND");
      return db.department.update({ where: { id: input.id }, data, select: { id: true } });
    }
    return db.department.create({ data: { schoolId: c.schoolId, ...data }, select: { id: true } });
  });
  await audit({ schoolId: c.schoolId, actorUserId: c.userId, action: "academics.department.save", targetType: "Department", targetId: row.id, meta: { code: data.code, hod: Boolean(data.hodMembershipId) } });
  return row;
}

export async function setFacultyDepartment(ctx: ActiveContext, input: { membershipId: string; departmentId: string | null }): Promise<{ changed: boolean }> {
  const c = await academicsCaller(ctx, ["ADMIN"]);
  const m = await db.membership.findFirst({ where: { id: input.membershipId, schoolId: c.schoolId, role: { in: ["FACULTY", "HOD"] } }, select: { id: true } });
  if (!m) throw new RuleRefusal("academics.refuseNotFaculty", 422, undefined, "membershipId");
  const now = await db.departmentFaculty.findUnique({ where: { membershipId: input.membershipId }, select: { departmentId: true } });
  if ((now?.departmentId ?? null) === input.departmentId) return { changed: false };
  if (input.departmentId === null) await db.departmentFaculty.deleteMany({ where: { membershipId: input.membershipId, schoolId: c.schoolId } });
  else {
    const d = await db.department.findFirst({ where: { id: input.departmentId, schoolId: c.schoolId }, select: { id: true } });
    if (!d) throw new RuleRefusal("academics.refuseUnknownDepartment", 422, undefined, "departmentId");
    await db.departmentFaculty.upsert({ where: { membershipId: input.membershipId }, create: { schoolId: c.schoolId, membershipId: input.membershipId, departmentId: input.departmentId }, update: { departmentId: input.departmentId } });
  }
  await audit({ schoolId: c.schoolId, actorUserId: c.userId, action: "academics.faculty.department", targetType: "Membership", targetId: input.membershipId, meta: { departmentId: input.departmentId } });
  return { changed: true };
}

/* ------------------------------------------------- programmes and schemes */

export async function saveProgramme(ctx: ActiveContext, input: z.infer<typeof programmeSaveSchema>): Promise<{ id: string }> {
  const c = await academicsCaller(ctx, ["ADMIN"]);
  const d = await db.department.findFirst({ where: { id: input.departmentId, schoolId: c.schoolId }, select: { id: true } });
  if (!d) throw new RuleRefusal("academics.refuseUnknownDepartment", 422, undefined, "departmentId");
  const years = input.exitPoints.map((e) => e.afterYear);
  if (new Set(years).size !== years.length || years.some((y) => y > input.durationYears)) throw new RuleRefusal("academics.refuseExitPoints", 422, undefined, "exitPoints");
  const data = {
    departmentId: input.departmentId,
    code: input.code.toUpperCase(),
    name: input.name,
    level: input.level,
    durationYears: input.durationYears,
    intake: input.intake,
    regulator: input.regulator,
    attendanceThreshold: input.attendanceThreshold ?? defaultAttendanceThreshold(input.regulator),
    exitPoints: writeJson([...input.exitPoints].sort((a, b) => a.afterYear - b.afterYear)),
  };
  const row = await refuseTaken(async () => {
    if (input.id) {
      const found = await db.programme.findFirst({ where: { id: input.id, schoolId: c.schoolId }, select: { id: true } });
      if (!found) throw new AccessError("access.entryNotFound", "NOT_FOUND");
      return db.programme.update({ where: { id: input.id }, data, select: { id: true } });
    }
    return db.programme.create({ data: { schoolId: c.schoolId, ...data }, select: { id: true } });
  });
  await audit({ schoolId: c.schoolId, actorUserId: c.userId, action: "academics.programme.save", targetType: "Programme", targetId: row.id, meta: { code: data.code, threshold: data.attendanceThreshold } });
  return row;
}

/** A programme's outcomes, replaced whole (the office's, or the HOD's for their department). */
export async function saveProgrammeOutcomes(ctx: ActiveContext, input: z.infer<typeof programmeOutcomesSaveSchema>): Promise<{ count: number }> {
  const c = await academicsCaller(ctx, ["ADMIN", "HOD"]);
  const p = await db.programme.findFirst({ where: { id: input.programmeId, schoolId: c.schoolId }, select: { id: true, departmentId: true } });
  if (!p) throw new AccessError("access.entryNotFound", "NOT_FOUND");
  if (c.role === "HOD" && (await hodDepartment(c))?.id !== p.departmentId) throw new AccessError("academics.refuseOtherDepartment");
  const codes = input.outcomes.map((o) => o.code);
  if (new Set(codes).size !== codes.length) throw new RuleRefusal("academics.refuseDuplicateOutcome", 422, undefined, "outcomes");
  await db.$tenantTransaction(async (raw) => {
    const tx = raw as Tx;
    await tx.programmeOutcome.deleteMany({ where: { programmeId: p.id, code: { notIn: codes } } });
    for (const o of input.outcomes) await tx.programmeOutcome.upsert({ where: { programmeId_code: { programmeId: p.id, code: o.code } }, create: { schoolId: c.schoolId, programmeId: p.id, code: o.code, text: o.text }, update: { text: o.text } });
  });
  await audit({ schoolId: c.schoolId, actorUserId: c.userId, action: "academics.outcomes.save", targetType: "Programme", targetId: p.id, meta: { count: codes.length } });
  return { count: codes.length };
}

export async function saveScheme(ctx: ActiveContext, input: z.infer<typeof schemeSaveSchema>): Promise<{ id: string }> {
  const c = await academicsCaller(ctx, ["ADMIN"]);
  const p = await db.programme.findFirst({ where: { id: input.programmeId, schoolId: c.schoolId }, select: { id: true } });
  if (!p) throw new RuleRefusal("academics.refuseUnknownProgramme", 422, undefined, "programmeId");
  const rules = input.passingRules;
  if (rules.minTermCredits > rules.maxTermCredits) throw new RuleRefusal("academics.refuseCreditRange", 422, undefined, "passingRules");
  const grades = input.gradingTable.map((g) => g.grade);
  if (new Set(grades).size !== grades.length) throw new RuleRefusal("academics.refuseGradingTable", 422, undefined, "gradingTable");
  // The table runs downward: each grade needs less than the one above it and is worth no more points.
  const sorted = [...input.gradingTable].sort((a, b) => b.minPercent - a.minPercent);
  for (let i = 1; i < sorted.length; i += 1) if (sorted[i]!.minPercent === sorted[i - 1]!.minPercent || sorted[i]!.points > sorted[i - 1]!.points) throw new RuleRefusal("academics.refuseGradingTable", 422, undefined, "gradingTable");
  const data = { programmeId: input.programmeId, name: input.name, effectiveYear: input.effectiveYear, gradingTable: writeJson(sorted), passingRules: writeJson(rules) };
  const row = await refuseTaken(async () => {
    if (input.id) {
      const found = await db.scheme.findFirst({ where: { id: input.id, schoolId: c.schoolId }, select: { id: true } });
      if (!found) throw new AccessError("access.entryNotFound", "NOT_FOUND");
      return db.scheme.update({ where: { id: input.id }, data, select: { id: true } });
    }
    return db.scheme.create({ data: { schoolId: c.schoolId, ...data }, select: { id: true } });
  });
  await audit({ schoolId: c.schoolId, actorUserId: c.userId, action: "academics.scheme.save", targetType: "Scheme", targetId: row.id, meta: { name: input.name, internalMax: rules.internalMax } });
  return row;
}

export async function saveCourse(ctx: ActiveContext, input: z.infer<typeof courseSaveSchema>): Promise<{ id: string }> {
  const c = await academicsCaller(ctx, ["ADMIN"]);
  const s = await db.scheme.findFirst({ where: { id: input.schemeId, schoolId: c.schoolId }, select: { id: true } });
  if (!s) throw new RuleRefusal("academics.refuseUnknownScheme", 422, undefined, "schemeId");
  const codes = input.outcomes.map((o) => o.code);
  if (new Set(codes).size !== codes.length) throw new RuleRefusal("academics.refuseDuplicateOutcome", 422, undefined, "outcomes");
  if (input.creditsL + input.creditsT + input.creditsP === 0) throw new RuleRefusal("academics.refuseNoCredits", 422, undefined, "creditsL");
  const data = { schemeId: input.schemeId, code: input.code.toUpperCase(), name: input.name, semester: input.semester, creditsL: input.creditsL, creditsT: input.creditsT, creditsP: input.creditsP, kind: input.kind, outcomes: writeJson(input.outcomes) };
  const row = await refuseTaken(async () => {
    if (input.id) {
      const found = await db.course.findFirst({ where: { id: input.id, schoolId: c.schoolId }, select: { id: true } });
      if (!found) throw new AccessError("access.entryNotFound", "NOT_FOUND");
      return db.course.update({ where: { id: input.id }, data, select: { id: true } });
    }
    return db.course.create({ data: { schoolId: c.schoolId, ...data }, select: { id: true } });
  });
  await audit({ schoolId: c.schoolId, actorUserId: c.userId, action: "academics.course.save", targetType: "Course", targetId: row.id, meta: { code: data.code } });
  return row;
}

/** A course's articulation matrix, replaced whole: the office, the department's HOD, or a faculty member teaching it. */
export async function saveCourseMapping(ctx: ActiveContext, courseId: string, input: z.infer<typeof courseMappingSaveSchema>): Promise<{ count: number }> {
  const c = await academicsCaller(ctx, ["ADMIN", "HOD", "FACULTY"]);
  const course = await db.course.findFirst({ where: { id: courseId, schoolId: c.schoolId }, select: { id: true, outcomes: true, scheme: { select: { programmeId: true, programme: { select: { departmentId: true } } } } } });
  if (!course) throw new AccessError("access.entryNotFound", "NOT_FOUND");
  if (c.role === "HOD" && (await hodDepartment(c))?.id !== course.scheme.programme.departmentId) throw new AccessError("academics.refuseOtherDepartment");
  if (c.role === "FACULTY" && !(await db.courseOffering.findFirst({ where: { courseId, facultyMembershipId: c.membershipId }, select: { id: true } }))) throw new AccessError("academics.refuseNotYours");
  const cos = new Set(readOutcomes(course.outcomes).map((o) => o.code));
  const pos = new Set((await db.programmeOutcome.findMany({ where: { programmeId: course.scheme.programmeId }, select: { code: true } })).map((p) => p.code));
  for (const r of input.rows) if (!cos.has(r.coCode) || !pos.has(r.poCode)) throw new RuleRefusal("academics.refuseUnknownOutcome", 422, { code: !cos.has(r.coCode) ? r.coCode : r.poCode }, "rows");
  await db.$tenantTransaction(async (raw) => {
    const tx = raw as Tx;
    await tx.courseOutcomeMap.deleteMany({ where: { courseId } });
    if (input.rows.length) await tx.courseOutcomeMap.createMany({ data: input.rows.map((r) => ({ schoolId: c.schoolId, courseId, coCode: r.coCode, poCode: r.poCode, level: r.level })), skipDuplicates: true });
  });
  await audit({ schoolId: c.schoolId, actorUserId: c.userId, action: "academics.mapping.save", targetType: "Course", targetId: courseId, meta: { rows: input.rows.length } });
  return { count: input.rows.length };
}

export async function saveTerm(ctx: ActiveContext, input: z.infer<typeof termSaveSchema>): Promise<{ id: string }> {
  const c = await academicsCaller(ctx, ["ADMIN"]);
  if (input.startsOn > input.endsOn) throw new RuleRefusal("academics.refuseTermDates", 422, undefined, "endsOn");
  if (input.registrationOpensOn > input.registrationClosesOn || input.registrationClosesOn > input.endsOn) throw new RuleRefusal("academics.refuseWindowDates", 422, undefined, "registrationClosesOn");
  // A day falls in one term at most, as a school's terms are kept (every read of "this term" depends on it).
  const overlap = await db.academicTerm.findFirst({ where: { schoolId: c.schoolId, startsOn: { lte: input.endsOn }, endsOn: { gte: input.startsOn }, ...(input.id ? { NOT: { id: input.id } } : {}) }, select: { name: true } });
  if (overlap) throw new RuleRefusal("academics.refuseTermOverlap", 409, { name: overlap.name }, "startsOn");
  const data = { name: input.name, academicYear: input.academicYear.replace("-", "–"), startsOn: input.startsOn, endsOn: input.endsOn, registrationOpensOn: input.registrationOpensOn, registrationClosesOn: input.registrationClosesOn };
  const row = await refuseTaken(async () => {
    if (input.id) {
      const found = await db.academicTerm.findFirst({ where: { id: input.id, schoolId: c.schoolId }, select: { id: true } });
      if (!found) throw new AccessError("access.entryNotFound", "NOT_FOUND");
      return db.academicTerm.update({ where: { id: input.id }, data, select: { id: true } });
    }
    return db.academicTerm.create({ data: { schoolId: c.schoolId, ...data }, select: { id: true } });
  });
  await audit({ schoolId: c.schoolId, actorUserId: c.userId, action: "academics.term.save", targetType: "AcademicTerm", targetId: row.id, meta: { ...data } });
  return row;
}

export async function saveRoom(ctx: ActiveContext, input: z.infer<typeof roomSaveSchema>): Promise<{ id: string }> {
  const c = await academicsCaller(ctx, ["ADMIN"]);
  const data = { name: input.name, capacity: input.capacity, kind: input.kind };
  const row = await refuseTaken(async () => {
    if (input.id) {
      const found = await db.room.findFirst({ where: { id: input.id, schoolId: c.schoolId }, select: { id: true } });
      if (!found) throw new AccessError("access.entryNotFound", "NOT_FOUND");
      return db.room.update({ where: { id: input.id }, data, select: { id: true } });
    }
    return db.room.create({ data: { schoolId: c.schoolId, ...data }, select: { id: true } });
  });
  await audit({ schoolId: c.schoolId, actorUserId: c.userId, action: "academics.room.save", targetType: "Room", targetId: row.id, meta: data });
  return row;
}

/** A division: a Class of the college's and the Division naming its programme and year, in one transaction. */
export async function createDivision(ctx: ActiveContext, input: z.infer<typeof divisionSaveSchema>): Promise<{ id: string; classId: string }> {
  const c = await academicsCaller(ctx, ["ADMIN"]);
  const p = await db.programme.findFirst({ where: { id: input.programmeId, schoolId: c.schoolId }, select: { id: true, code: true, durationYears: true } });
  if (!p) throw new RuleRefusal("academics.refuseUnknownProgramme", 422, undefined, "programmeId");
  if (input.yearOfStudy > p.durationYears) throw new RuleRefusal("academics.refuseYearOfStudy", 422, undefined, "yearOfStudy");
  const academicYear = input.academicYear.replace("-", "–");
  const made = await db.$tenantTransaction(async (raw) => {
    const tx = raw as Tx;
    const klass = await tx.class.create({ data: { schoolId: c.schoolId, name: input.name, gradeLevel: String(input.yearOfStudy), section: null, subject: p.code, joinCode: classCode() }, select: { id: true } });
    const d = await tx.division.create({ data: { schoolId: c.schoolId, classId: klass.id, programmeId: p.id, yearOfStudy: input.yearOfStudy, academicYear }, select: { id: true } });
    return { id: d.id, classId: klass.id };
  });
  await audit({ schoolId: c.schoolId, actorUserId: c.userId, action: "academics.division.create", targetType: "Division", targetId: made.id, meta: { name: input.name, programme: p.code, yearOfStudy: input.yearOfStudy } });
  return made;
}

/* -------------------------------------------------------------- structure */

/** The whole structure in one read: the office writes it; the head, an HOD and faculty read it. */
export async function academicsStructure(ctx: ActiveContext): Promise<AcademicsStructure> {
  const c = await academicsCaller(ctx, ["ADMIN", "PRINCIPAL", "HOD", "FACULTY"]);
  const today = todayKey(c.timeZone);
  const [settings, departments, programmes, pos, schemes, courses, maps, terms, rooms, divisions, periods, staff, seats] = await Promise.all([
    academicsSettings(c.schoolId),
    db.department.findMany({ where: { schoolId: c.schoolId }, orderBy: { code: "asc" } }),
    db.programme.findMany({ where: { schoolId: c.schoolId, archivedAt: null }, orderBy: { code: "asc" } }),
    db.programmeOutcome.findMany({ where: { schoolId: c.schoolId }, orderBy: { code: "asc" } }),
    db.scheme.findMany({ where: { schoolId: c.schoolId }, orderBy: [{ effectiveYear: "desc" }, { name: "asc" }] }),
    db.course.findMany({ where: { schoolId: c.schoolId }, orderBy: [{ semester: "asc" }, { code: "asc" }] }),
    db.courseOutcomeMap.findMany({ where: { schoolId: c.schoolId } }),
    db.academicTerm.findMany({ where: { schoolId: c.schoolId }, orderBy: { startsOn: "desc" } }),
    db.room.findMany({ where: { schoolId: c.schoolId }, orderBy: { name: "asc" } }),
    db.division.findMany({ where: { schoolId: c.schoolId }, select: { id: true, classId: true, programmeId: true, yearOfStudy: true, academicYear: true, class: { select: { name: true, _count: { select: { enrollments: { where: { status: "ACTIVE" } } } } } } } }),
    db.timetablePeriod.findMany({ where: { schoolId: c.schoolId, archivedAt: null, kind: "LESSON" }, orderBy: [{ position: "asc" }, { startMinute: "asc" }] }),
    teachingStaff(c.schoolId),
    db.studentProgramme.groupBy({ by: ["programmeId"], where: { schoolId: c.schoolId, status: "ACTIVE" }, _count: { _all: true } }),
  ]);
  const hodNames = await namesOf(departments.map((d) => d.hodMembershipId));
  const seatsBy = new Map(seats.map((s) => [s.programmeId, s._count._all]));
  const mapBy = new Map<string, { coCode: string; poCode: string; level: number }[]>();
  for (const m of maps) (mapBy.get(m.courseId) ?? mapBy.set(m.courseId, []).get(m.courseId)!).push({ coCode: m.coCode, poCode: m.poCode, level: m.level });
  return {
    settings,
    departments: departments.map((d) => ({
      id: d.id,
      code: d.code,
      name: d.name,
      hodMembershipId: d.hodMembershipId,
      hodName: d.hodMembershipId ? (hodNames.get(d.hodMembershipId) ?? null) : null,
      condoneFloorPercent: d.condoneFloorPercent,
      faculty: staff.filter((s) => s.departmentId === d.id).length,
      students: programmes.filter((p) => p.departmentId === d.id).reduce((n, p) => n + (seatsBy.get(p.id) ?? 0), 0),
    })),
    programmes: programmes.map((p) => ({ id: p.id, departmentId: p.departmentId, code: p.code, name: p.name, level: p.level as "UG", durationYears: p.durationYears, intake: p.intake, regulator: p.regulator as "UGC", attendanceThreshold: p.attendanceThreshold, exitPoints: readExitPoints(p.exitPoints) })),
    programmeOutcomes: pos.map((o) => ({ programmeId: o.programmeId, code: o.code, text: o.text })),
    schemes: schemes.map((s) => ({ id: s.id, programmeId: s.programmeId, name: s.name, effectiveYear: s.effectiveYear, gradingTable: readGradingTable(s.gradingTable), passingRules: readPassingRules(s.passingRules) })),
    courses: courses.map((k) => ({ id: k.id, schemeId: k.schemeId, code: k.code, name: k.name, semester: k.semester, creditsL: k.creditsL, creditsT: k.creditsT, creditsP: k.creditsP, credits: creditsOf(k), kind: k.kind as "CORE", outcomes: readOutcomes(k.outcomes), mapping: mapBy.get(k.id) ?? [] })),
    terms: terms.map((t) => termView(t, today)),
    rooms: rooms.map((r) => ({ id: r.id, name: r.name, capacity: r.capacity, kind: r.kind as "CLASSROOM" })),
    divisions: divisions.map((d) => ({ id: d.id, classId: d.classId, programmeId: d.programmeId, name: d.class.name, yearOfStudy: d.yearOfStudy, academicYear: d.academicYear, students: d.class._count.enrollments })).sort((a, b) => a.name.localeCompare(b.name)),
    periods: periods.map((p) => ({ id: p.id, name: p.name, startMinute: p.startMinute, endMinute: p.endMinute })),
    faculty: staff,
    canEdit: c.role === "ADMIN",
  };
}

/* ------------------------------------------------------------------ seats */

/** Students and their seats; who has no seat yet. The office writes; the head and an HOD read. */
export async function listSeats(ctx: ActiveContext, query: { programmeId?: string }): Promise<z.infer<typeof seatsSchema>> {
  const c = await academicsCaller(ctx, ["ADMIN", "PRINCIPAL", "HOD"]);
  const dept = c.role === "HOD" ? await hodDepartment(c) : null;
  const [seats, students] = await Promise.all([
    db.studentProgramme.findMany({
      where: { schoolId: c.schoolId, ...(query.programmeId ? { programmeId: query.programmeId } : {}), ...(c.role === "HOD" ? { programme: { departmentId: dept?.id ?? "-" } } : {}) },
      select: { studentMembershipId: true, programmeId: true, schemeId: true, entryYear: true, yearOfStudy: true, semester: true, divisionId: true, prn: true, status: true, programme: { select: { code: true } }, student: { select: { studentCode: true, user: USER, enrollments: { where: { status: "ACTIVE", class: { division: { isNot: null } } }, select: { rollNumber: true, class: { select: { name: true, division: { select: { id: true } } } } } } } } },
      take: 3000,
    }),
    c.role === "ADMIN" ? db.membership.findMany({ where: { schoolId: c.schoolId, role: "STUDENT", status: "ACTIVE", leftAt: null, academicSeat: null }, select: { id: true, studentCode: true, user: USER }, take: 500, orderBy: { user: { name: "asc" } } }) : Promise.resolve([]),
  ]);
  return {
    seats: seats
      .map((s) => {
        const e = s.student.enrollments.find((x) => x.class.division?.id === s.divisionId) ?? null;
        return { studentMembershipId: s.studentMembershipId, name: nameOf(s.student.user), studentCode: s.student.studentCode, programmeId: s.programmeId, programmeCode: s.programme.code, schemeId: s.schemeId, entryYear: s.entryYear, yearOfStudy: s.yearOfStudy, semester: s.semester, divisionId: s.divisionId, divisionName: e?.class.name ?? null, rollNumber: e?.rollNumber ?? null, prn: s.prn, status: s.status as "ACTIVE" };
      })
      .sort((a, b) => a.programmeCode.localeCompare(b.programmeCode) || (a.rollNumber ?? 9999) - (b.rollNumber ?? 9999) || a.name.localeCompare(b.name)),
    unseated: students.map((m) => ({ studentMembershipId: m.id, name: nameOf(m.user), studentCode: m.studentCode })),
  };
}

/**
 * A student's seat in a programme, set by the office: the programme and the
 * scheme they study under, the year and semester, the division (an
 * enrolment in its class, with the roll number on it) and the PRN.
 * Moving division ends the old class's enrolment and opens the new one.
 */
export async function saveSeat(ctx: ActiveContext, input: z.infer<typeof seatSaveSchema>): Promise<{ changed: boolean }> {
  const c = await academicsCaller(ctx, ["ADMIN"]);
  const student = await db.membership.findFirst({ where: { id: input.studentMembershipId, schoolId: c.schoolId, role: "STUDENT", status: "ACTIVE" }, select: { id: true } });
  if (!student) throw new RuleRefusal("academics.refuseNotStudent", 422, undefined, "studentMembershipId");
  const scheme = await db.scheme.findFirst({ where: { id: input.schemeId, schoolId: c.schoolId, programmeId: input.programmeId }, select: { id: true, programme: { select: { durationYears: true } } } });
  if (!scheme) throw new RuleRefusal("academics.refuseUnknownScheme", 422, undefined, "schemeId");
  if (input.yearOfStudy > scheme.programme.durationYears || input.semester > scheme.programme.durationYears * 2) throw new RuleRefusal("academics.refuseYearOfStudy", 422, undefined, "yearOfStudy");
  const division = input.divisionId ? await db.division.findFirst({ where: { id: input.divisionId, schoolId: c.schoolId, programmeId: input.programmeId }, select: { id: true, classId: true } }) : null;
  if (input.divisionId && !division) throw new RuleRefusal("academics.refuseUnknownDivision", 422, undefined, "divisionId");
  if (input.prn) {
    const [taken, takenOnRecord] = await Promise.all([
      db.studentProgramme.findFirst({ where: { schoolId: c.schoolId, prn: input.prn, NOT: { studentMembershipId: input.studentMembershipId } }, select: { id: true } }),
      db.pupilRecord.findFirst({ where: { schoolId: c.schoolId, prn: input.prn, NOT: { studentMembershipId: input.studentMembershipId } }, select: { id: true } }),
    ]);
    if (taken || takenOnRecord) throw new RuleRefusal("academics.refusePrnTaken", 409, undefined, "prn");
  }
  if (division && input.rollNumber !== null) {
    const clash = await db.enrollment.findFirst({ where: { classId: division.classId, rollNumber: input.rollNumber, status: "ACTIVE", NOT: { studentMembershipId: input.studentMembershipId } }, select: { id: true } });
    if (clash) throw new RuleRefusal("academics.refuseRollTaken", 409, { roll: input.rollNumber }, "rollNumber");
  }
  const before = await db.studentProgramme.findUnique({ where: { studentMembershipId: input.studentMembershipId }, select: { divisionId: true } });
  const oldDivision = before?.divisionId && before.divisionId !== input.divisionId ? await db.division.findUnique({ where: { id: before.divisionId }, select: { classId: true } }) : null;
  // The seat's PRN copies the record's when the form names none, so an empty field never erases the office's PRN.
  const recordPrn = input.prn ? null : ((await db.pupilRecord.findFirst({ where: { schoolId: c.schoolId, studentMembershipId: input.studentMembershipId }, select: { prn: true } }))?.prn ?? null);
  const data = { programmeId: input.programmeId, schemeId: input.schemeId, entryYear: input.entryYear, yearOfStudy: input.yearOfStudy, semester: input.semester, divisionId: input.divisionId, prn: input.prn || recordPrn, status: "ACTIVE" };
  await db.$tenantTransaction(async (raw) => {
    const tx = raw as Tx;
    await tx.studentProgramme.upsert({ where: { studentMembershipId: input.studentMembershipId }, create: { schoolId: c.schoolId, studentMembershipId: input.studentMembershipId, ...data }, update: data });
    // ONE PRN (the integration builder, 4 Oct 2026): the office's record (PupilRecord.prn, written at admission) is
    // the truth; the seat's prn is its copy, written in the same transaction, and data:audit's college-prn check
    // holds the two equal. A student who predates admissions has no record yet, and the seat alone carries it.
    if (input.prn) await tx.pupilRecord.updateMany({ where: { schoolId: c.schoolId, studentMembershipId: input.studentMembershipId }, data: { prn: input.prn } });
    if (oldDivision) await tx.enrollment.updateMany({ where: { classId: oldDivision.classId, studentMembershipId: input.studentMembershipId, status: "ACTIVE" }, data: { status: "REMOVED", removedAt: new Date() } });
    if (division) {
      await tx.enrollment.upsert({
        where: { classId_studentMembershipId: { classId: division.classId, studentMembershipId: input.studentMembershipId } },
        create: { schoolId: c.schoolId, classId: division.classId, studentMembershipId: input.studentMembershipId, rollNumber: input.rollNumber },
        update: { status: "ACTIVE", removedAt: null, rollNumber: input.rollNumber },
      });
    }
    // Membership.gradeLevel is the live class's grade, written by one helper from every path that moves an enrolment (LIFECYCLE-5).
    if (division || oldDivision) await syncGradeLevel(tx, [input.studentMembershipId]);
  });
  await audit({ schoolId: c.schoolId, actorUserId: c.userId, action: "academics.seat.save", targetType: "Membership", targetId: input.studentMembershipId, meta: { programmeId: input.programmeId, semester: input.semester, divisionId: input.divisionId, roll: input.rollNumber } });
  return { changed: true };
}

/* -------------------------------------------------------------- offerings */

const OFFERING_SELECT = {
  id: true,
  termId: true,
  courseId: true,
  divisionId: true,
  facultyMembershipId: true,
  lectureHours: true,
  tutorialHours: true,
  practicalHours: true,
  roomId: true,
  capacity: true,
  course: { select: { code: true, name: true, kind: true, semester: true, creditsL: true, creditsT: true, creditsP: true, scheme: { select: { programme: { select: { departmentId: true } } } } } },
  _count: { select: { registrations: { where: { status: "REGISTERED" } } } },
} as const;

type OfferingRow = { id: string; termId: string; courseId: string; divisionId: string | null; facultyMembershipId: string | null; lectureHours: number; tutorialHours: number; practicalHours: number; roomId: string | null; capacity: number | null; course: { code: string; name: string; kind: string; semester: number; creditsL: number; creditsT: number; creditsP: number; scheme: { programme: { departmentId: string } } }; _count: { registrations: number } };

/** The names of divisions, by Division id. */
export async function divisionNames(ids: readonly (string | null)[]): Promise<Map<string, string>> {
  const clean = [...new Set(ids.filter((x): x is string => Boolean(x)))];
  if (!clean.length) return new Map();
  const rows = await db.division.findMany({ where: { id: { in: clean } }, select: { id: true, class: { select: { name: true } } } });
  return new Map(rows.map((r) => [r.id, r.class.name]));
}

export async function offeringViews(rows: OfferingRow[]): Promise<Offering[]> {
  const [faculty, divisions] = await Promise.all([namesOf(rows.map((r) => r.facultyMembershipId)), divisionNames(rows.map((r) => r.divisionId))]);
  return rows.map((o) => ({
    id: o.id,
    termId: o.termId,
    courseId: o.courseId,
    courseCode: o.course.code,
    courseName: o.course.name,
    kind: o.course.kind as "CORE",
    credits: creditsOf(o.course),
    semester: o.course.semester,
    departmentId: o.course.scheme.programme.departmentId,
    divisionId: o.divisionId,
    divisionName: o.divisionId ? (divisions.get(o.divisionId) ?? null) : null,
    facultyMembershipId: o.facultyMembershipId,
    facultyName: o.facultyMembershipId ? (faculty.get(o.facultyMembershipId) ?? null) : null,
    lectureHours: o.lectureHours,
    tutorialHours: o.tutorialHours,
    practicalHours: o.practicalHours,
    roomId: o.roomId,
    capacity: o.capacity,
    registered: o._count.registrations,
  }));
}

/** Each teaching member's weekly hours in a term against the band, and students per faculty member by department. */
export async function loadAndRatios(schoolId: string, termId: string | null, settings: AcademicsSettings, departmentId?: string | null) {
  const [staff, offerings, departments, seats] = await Promise.all([
    teachingStaff(schoolId),
    termId ? db.courseOffering.findMany({ where: { schoolId, termId }, select: { facultyMembershipId: true, lectureHours: true, tutorialHours: true, practicalHours: true } }) : Promise.resolve([]),
    db.department.findMany({ where: { schoolId, ...(departmentId ? { id: departmentId } : {}) }, select: { id: true, name: true, programmes: { select: { id: true } } } }),
    db.studentProgramme.groupBy({ by: ["programmeId"], where: { schoolId, status: "ACTIVE" }, _count: { _all: true } }),
  ]);
  const hours = new Map<string, number>();
  for (const o of offerings) if (o.facultyMembershipId) hours.set(o.facultyMembershipId, (hours.get(o.facultyMembershipId) ?? 0) + o.lectureHours + o.tutorialHours + o.practicalHours);
  const seatsBy = new Map(seats.map((s) => [s.programmeId, s._count._all]));
  const load = staff
    .filter((s) => !departmentId || s.departmentId === departmentId)
    .map((s) => {
      const h = hours.get(s.membershipId) ?? 0;
      return { membershipId: s.membershipId, name: s.name, departmentId: s.departmentId, hours: h, state: loadState(h, settings.loadMinHours, settings.loadMaxHours) };
    });
  const ratios = departments.map((d) => {
    const students = d.programmes.reduce((n, p) => n + (seatsBy.get(p.id) ?? 0), 0);
    const faculty = staff.filter((s) => s.departmentId === d.id).length;
    const perFaculty = faculty === 0 ? null : Math.round((students / faculty) * 10) / 10;
    return { departmentId: d.id, name: d.name, students, faculty, perFaculty, norm: settings.studentsPerFaculty, withinNorm: perFaculty !== null && perFaculty <= settings.studentsPerFaculty };
  });
  return { load, ratios };
}

export async function listOfferings(ctx: ActiveContext, query: { termId?: string; departmentId?: string }): Promise<z.infer<typeof offeringsSchema>> {
  const c = await academicsCaller(ctx, ["ADMIN", "PRINCIPAL", "HOD", "FACULTY"]);
  const today = todayKey(c.timeZone);
  const term = query.termId ? await db.academicTerm.findFirst({ where: { id: query.termId, schoolId: c.schoolId } }) : await currentTerm(c.schoolId, today);
  const settings = await academicsSettings(c.schoolId);
  const departmentId = query.departmentId ?? null;
  const rows = term
    ? await db.courseOffering.findMany({ where: { schoolId: c.schoolId, termId: term.id, ...(departmentId ? { course: { scheme: { programme: { departmentId } } } } : {}) }, select: OFFERING_SELECT, orderBy: [{ course: { semester: "asc" } }, { course: { code: "asc" } }] })
    : [];
  const { load, ratios } = await loadAndRatios(c.schoolId, term?.id ?? null, settings, departmentId);
  return { termId: term?.id ?? null, offerings: await offeringViews(rows), load, ratios, settings };
}

/** An offering made or changed: the office's, or an HOD's within their own department. */
export async function saveOffering(ctx: ActiveContext, input: z.infer<typeof offeringSaveSchema>): Promise<Offering> {
  const c = await academicsCaller(ctx, ["ADMIN", "HOD"]);
  const [term, course] = await Promise.all([
    db.academicTerm.findFirst({ where: { id: input.termId, schoolId: c.schoolId }, select: { id: true } }),
    db.course.findFirst({ where: { id: input.courseId, schoolId: c.schoolId }, select: { id: true, scheme: { select: { programmeId: true, programme: { select: { departmentId: true } } } } } }),
  ]);
  if (!term) throw new RuleRefusal("academics.refuseUnknownTerm", 422, undefined, "termId");
  if (!course) throw new RuleRefusal("academics.refuseUnknownCourse", 422, undefined, "courseId");
  if (c.role === "HOD" && (await hodDepartment(c))?.id !== course.scheme.programme.departmentId) throw new AccessError("academics.refuseOtherDepartment");
  if (input.divisionId) {
    const d = await db.division.findFirst({ where: { id: input.divisionId, schoolId: c.schoolId, programmeId: course.scheme.programmeId }, select: { id: true } });
    if (!d) throw new RuleRefusal("academics.refuseUnknownDivision", 422, undefined, "divisionId");
  }
  if (input.facultyMembershipId) {
    const f = await db.membership.findFirst({ where: { id: input.facultyMembershipId, schoolId: c.schoolId, role: { in: ["FACULTY", "HOD"] }, status: "ACTIVE" }, select: { id: true } });
    if (!f) throw new RuleRefusal("academics.refuseNotFaculty", 422, undefined, "facultyMembershipId");
  }
  if (input.roomId && !(await db.room.findFirst({ where: { id: input.roomId, schoolId: c.schoolId }, select: { id: true } }))) throw new RuleRefusal("academics.refuseUnknownRoom", 422, undefined, "roomId");
  const data = { termId: input.termId, courseId: input.courseId, divisionId: input.divisionId, facultyMembershipId: input.facultyMembershipId, lectureHours: input.lectureHours, tutorialHours: input.tutorialHours, practicalHours: input.practicalHours, roomId: input.roomId, capacity: input.capacity };
  let before: { facultyMembershipId: string | null } | null = null;
  const row = await refuseTaken(async () => {
    if (input.id) {
      const existing = await db.courseOffering.findFirst({ where: { id: input.id, schoolId: c.schoolId }, select: { facultyMembershipId: true, course: { select: { scheme: { select: { programme: { select: { departmentId: true } } } } } } } });
      if (!existing) throw new AccessError("access.entryNotFound", "NOT_FOUND");
      // The offering being rewritten must be the HOD's department's too, not only the course it is
      // pointed at: otherwise another department's offering, its marks and lectures, change hands (campaign S-7).
      if (c.role === "HOD" && (await hodDepartment(c))?.id !== existing.course.scheme.programme.departmentId) throw new AccessError("academics.refuseOtherDepartment");
      before = { facultyMembershipId: existing.facultyMembershipId };
      if (await db.internalLock.findUnique({ where: { offeringId: input.id }, select: { id: true } })) throw new RuleRefusal("academics.refuseLocked", 409);
      return db.courseOffering.update({ where: { id: input.id }, data, select: { id: true } });
    }
    // A shared offering (no division) is one per course and term: Postgres's unique index cannot see two NULLs as the same.
    if (!input.divisionId && (await db.courseOffering.findFirst({ where: { termId: input.termId, courseId: input.courseId, divisionId: null }, select: { id: true } }))) throw new RuleRefusal("academics.refuseCodeTaken", 409, undefined, "courseId");
    return db.courseOffering.create({ data: { schoolId: c.schoolId, ...data }, select: { id: true } });
  });
  const changedFaculty = (before as { facultyMembershipId: string | null } | null)?.facultyMembershipId !== input.facultyMembershipId;
  await audit({ schoolId: c.schoolId, actorUserId: c.userId, action: "academics.offering.save", targetType: "CourseOffering", targetId: row.id, meta: { courseId: input.courseId, facultyMembershipId: input.facultyMembershipId, hours: input.lectureHours + input.tutorialHours + input.practicalHours } });
  if (input.facultyMembershipId && changedFaculty) {
    const f = await db.membership.findUnique({ where: { id: input.facultyMembershipId }, select: { userId: true } });
    const k = await db.course.findUnique({ where: { id: input.courseId }, select: { code: true, name: true } });
    if (f && k) await notify({ userId: f.userId, schoolId: c.schoolId, kind: "SYSTEM", titleKey: "academics.notifyAllottedTitle", titleVars: { course: `${k.code} ${k.name}` }, bodyKey: "academics.notifyAllottedBody", bodyVars: { course: `${k.code} ${k.name}` }, url: "/faculty" });
  }
  const view = await db.courseOffering.findUniqueOrThrow({ where: { id: row.id }, select: OFFERING_SELECT });
  return (await offeringViews([view]))[0]!;
}

/* -------------------------------------------------------------- timetable */

const SLOT_SELECT = {
  id: true,
  offeringId: true,
  weekday: true,
  periodId: true,
  kind: true,
  roomId: true,
  offering: { select: { termId: true, divisionId: true, facultyMembershipId: true, roomId: true, course: { select: { code: true, name: true } } } },
} as const;

/** The weekly grid of a term: a division's, a faculty member's, a room's, or (a student) their own. */
export async function academicsTimetable(ctx: ActiveContext, query: { termId?: string; divisionId?: string; facultyMembershipId?: string; roomId?: string }): Promise<z.infer<typeof academicsTimetableSchema>> {
  const c = await academicsCaller(ctx, ["ADMIN", "PRINCIPAL", "HOD", "FACULTY", "STUDENT"]);
  return timetableFor(c, query);
}

export async function timetableFor(c: Caller, query: { termId?: string; divisionId?: string; facultyMembershipId?: string; roomId?: string }): Promise<z.infer<typeof academicsTimetableSchema>> {
  const today = todayKey(c.timeZone);
  const [term, school, periods] = await Promise.all([
    query.termId ? db.academicTerm.findFirst({ where: { id: query.termId, schoolId: c.schoolId } }) : currentTerm(c.schoolId, today),
    db.school.findUniqueOrThrow({ where: { id: c.schoolId }, select: { teachingDays: true } }),
    db.timetablePeriod.findMany({ where: { schoolId: c.schoolId, archivedAt: null, kind: "LESSON" }, orderBy: [{ position: "asc" }, { startMinute: "asc" }] }),
  ]);
  const weekdays = parseTeachingDays(school.teachingDays);
  const base = { termId: term?.id ?? null, termName: term?.name ?? null, weekdays, periods: periods.map((p) => ({ id: p.id, name: p.name, startMinute: p.startMinute, endMinute: p.endMinute })) };
  if (!term) return { ...base, cells: [] };
  let offeringFilter: Record<string, unknown> = { termId: term.id };
  if (c.role === "STUDENT") {
    const mine = await db.courseRegistration.findMany({ where: { schoolId: c.schoolId, studentMembershipId: c.membershipId, termId: term.id, status: "REGISTERED" }, select: { offeringId: true } });
    offeringFilter = { ...offeringFilter, id: { in: mine.map((m) => m.offeringId) } };
  } else if (query.divisionId) offeringFilter = { ...offeringFilter, OR: [{ divisionId: query.divisionId }, { divisionId: null, registrations: { some: { status: "REGISTERED", student: { academicSeat: { divisionId: query.divisionId } } } } }] };
  else if (query.facultyMembershipId) offeringFilter = { ...offeringFilter, facultyMembershipId: query.facultyMembershipId };
  else if (!query.roomId && (c.role === "FACULTY" || c.role === "HOD")) offeringFilter = { ...offeringFilter, facultyMembershipId: c.membershipId };
  const slots = await db.offeringSlot.findMany({ where: { schoolId: c.schoolId, offering: offeringFilter, ...(query.roomId ? { OR: [{ roomId: query.roomId }, { roomId: null, offering: { roomId: query.roomId } }] } : {}) }, select: SLOT_SELECT });
  return { ...base, cells: await cellsOf(slots, periods) };
}

type SlotRow = { id: string; offeringId: string; weekday: number; periodId: string; kind: string; roomId: string | null; offering: { termId: string; divisionId: string | null; facultyMembershipId: string | null; roomId: string | null; course: { code: string; name: string } } };

export async function cellsOf(slots: SlotRow[], periods: { id: string; startMinute: number; endMinute: number }[]) {
  const periodBy = new Map(periods.map((p) => [p.id, p]));
  const [faculty, divisions, rooms] = await Promise.all([
    namesOf(slots.map((s) => s.offering.facultyMembershipId)),
    divisionNames(slots.map((s) => s.offering.divisionId)),
    (async () => {
      const ids = [...new Set(slots.map((s) => s.roomId ?? s.offering.roomId).filter((x): x is string => Boolean(x)))];
      return new Map((ids.length ? await db.room.findMany({ where: { id: { in: ids } }, select: { id: true, name: true } }) : []).map((r) => [r.id, r.name]));
    })(),
  ]);
  return slots
    .filter((s) => periodBy.has(s.periodId))
    .map((s) => {
      const p = periodBy.get(s.periodId)!;
      const room = s.roomId ?? s.offering.roomId;
      return { slotId: s.id, offeringId: s.offeringId, weekday: s.weekday, periodId: s.periodId, kind: s.kind as "LECTURE", courseCode: s.offering.course.code, courseName: s.offering.course.name, divisionName: s.offering.divisionId ? (divisions.get(s.offering.divisionId) ?? null) : null, facultyName: s.offering.facultyMembershipId ? (faculty.get(s.offering.facultyMembershipId) ?? null) : null, roomName: room ? (rooms.get(room) ?? null) : null, startMinute: p.startMinute, endMinute: p.endMinute };
    })
    .sort((a, b) => a.weekday - b.weekday || a.startMinute - b.startMinute);
}

/**
 * One weekly hour of an offering, with the clashes refused (409, naming
 * what clashes): its faculty member elsewhere at that hour, its room
 * taken, a core course of the same division at that hour, any registered
 * student on another offering at that hour, and a room too small for it.
 * Two electives shared across divisions may sit at one hour — that is what
 * a shared elective is — so long as no student is on both.
 */
export async function saveTimetableSlot(ctx: ActiveContext, input: z.infer<typeof timetableSlotSaveSchema>): Promise<{ id: string }> {
  const c = await academicsCaller(ctx, ["ADMIN"]);
  const [offering, period, school] = await Promise.all([
    db.courseOffering.findFirst({ where: { id: input.offeringId, schoolId: c.schoolId }, select: { id: true, termId: true, divisionId: true, facultyMembershipId: true, roomId: true, capacity: true, course: { select: { code: true, kind: true } } } }),
    db.timetablePeriod.findFirst({ where: { id: input.periodId, schoolId: c.schoolId, archivedAt: null, kind: "LESSON" }, select: { id: true } }),
    db.school.findUniqueOrThrow({ where: { id: c.schoolId }, select: { teachingDays: true } }),
  ]);
  if (!offering) throw new RuleRefusal("academics.refuseUnknownOffering", 422, undefined, "offeringId");
  if (!period) throw new RuleRefusal("academics.refuseUnknownPeriod", 422, undefined, "periodId");
  if (!parseTeachingDays(school.teachingDays).includes(input.weekday)) throw new RuleRefusal("academics.refuseNotTeachingDay", 422, undefined, "weekday");
  const roomId = input.roomId ?? offering.roomId;
  if (input.roomId && !(await db.room.findFirst({ where: { id: input.roomId, schoolId: c.schoolId }, select: { id: true } }))) throw new RuleRefusal("academics.refuseUnknownRoom", 422, undefined, "roomId");

  const others = await db.offeringSlot.findMany({
    where: { schoolId: c.schoolId, weekday: input.weekday, periodId: input.periodId, offering: { termId: offering.termId }, NOT: { offeringId: offering.id } },
    select: { roomId: true, offeringId: true, offering: { select: { divisionId: true, facultyMembershipId: true, roomId: true, course: { select: { code: true, kind: true } } } } },
  });
  for (const o of others) {
    if (offering.facultyMembershipId && o.offering.facultyMembershipId === offering.facultyMembershipId) throw new RuleRefusal("academics.refuseFacultyClash", 409, { course: o.offering.course.code }, "periodId");
    if (roomId && (o.roomId ?? o.offering.roomId) === roomId) throw new RuleRefusal("academics.refuseRoomClash", 409, { course: o.offering.course.code }, "roomId");
    if (offering.divisionId && o.offering.divisionId === offering.divisionId && (offering.course.kind === "CORE" || o.offering.course.kind === "CORE")) throw new RuleRefusal("academics.refuseDivisionClash", 409, { course: o.offering.course.code }, "periodId");
  }
  const mine = await db.courseRegistration.findMany({ where: { offeringId: offering.id, status: "REGISTERED" }, select: { studentMembershipId: true } });
  if (others.length && mine.length) {
    const both = await db.courseRegistration.count({ where: { offeringId: { in: others.map((o) => o.offeringId) }, status: "REGISTERED", studentMembershipId: { in: mine.map((m) => m.studentMembershipId) } } });
    if (both > 0) throw new RuleRefusal("academics.refuseStudentClash", 409, { count: both }, "periodId");
  }
  if (roomId) {
    const room = await db.room.findUniqueOrThrow({ where: { id: roomId }, select: { capacity: true } });
    const divisionSize = offering.divisionId ? await db.enrollment.count({ where: { status: "ACTIVE", class: { division: { id: offering.divisionId } } } }) : 0;
    const need = Math.max(mine.length, divisionSize);
    if (need > room.capacity) throw new RuleRefusal("academics.refuseRoomTooSmall", 409, { capacity: room.capacity, need }, "roomId");
  }
  const row = await db.offeringSlot.upsert({
    where: { offeringId_weekday_periodId: { offeringId: offering.id, weekday: input.weekday, periodId: input.periodId } },
    create: { schoolId: c.schoolId, offeringId: offering.id, weekday: input.weekday, periodId: input.periodId, kind: input.kind, roomId: input.roomId },
    update: { kind: input.kind, roomId: input.roomId },
    select: { id: true },
  });
  await audit({ schoolId: c.schoolId, actorUserId: c.userId, action: "academics.timetable.slot", targetType: "OfferingSlot", targetId: row.id, meta: { course: offering.course.code, weekday: input.weekday, periodId: input.periodId } });
  return row;
}

export async function removeTimetableSlot(ctx: ActiveContext, slotId: string): Promise<{ changed: boolean }> {
  const c = await academicsCaller(ctx, ["ADMIN"]);
  const gone = await db.offeringSlot.deleteMany({ where: { id: slotId, schoolId: c.schoolId } });
  if (gone.count) await audit({ schoolId: c.schoolId, actorUserId: c.userId, action: "academics.timetable.remove", targetType: "OfferingSlot", targetId: slotId });
  return { changed: gone.count > 0 };
}

/** Whether two sets of weekly slots share an hour. */
export function slotsClash(a: { weekday: number; periodId: string }[], b: { weekday: number; periodId: string }[]): boolean {
  const keys = new Set(a.map(slotKey));
  return b.some((s) => keys.has(slotKey(s)));
}

/* --------------------------------------------------------------- lectures */

/**
 * The day's lectures, made from the timetable the first time the day is
 * read: one per offering, day and slot (a unique key), so two readers at
 * once make each once. Nothing on a day the college does not teach or has
 * closed. `offeringIds` narrows to some offerings.
 */
export async function ensureLecturesForDay(schoolId: string, dateKey: string, offeringIds?: string[]): Promise<{ closed: boolean }> {
  if (!isDateKey(dateKey)) return { closed: true };
  const closure = await closedOn(schoolId, dateKey);
  if (!closure.teachingDay || closure.closed) return { closed: true };
  const term = await termOn(schoolId, dateKey);
  if (!term) return { closed: false };
  const weekday = weekdayOfKey(dateKey);
  const slots = await db.offeringSlot.findMany({
    where: { schoolId, weekday, offering: { termId: term.id, ...(offeringIds ? { id: { in: offeringIds } } : {}) } },
    select: { id: true, offeringId: true, kind: true, roomId: true, periodId: true },
  });
  if (!slots.length) return { closed: false };
  const periods = new Map((await db.timetablePeriod.findMany({ where: { id: { in: [...new Set(slots.map((s) => s.periodId))] } }, select: { id: true, startMinute: true, endMinute: true } })).map((p) => [p.id, p]));
  await db.lecture.createMany({
    data: slots.filter((s) => periods.has(s.periodId)).map((s) => ({ schoolId, offeringId: s.offeringId, slotId: s.id, dateKey, startMinute: periods.get(s.periodId)!.startMinute, endMinute: periods.get(s.periodId)!.endMinute, kind: s.kind, roomId: s.roomId })),
    skipDuplicates: true,
  });
  return { closed: false };
}

/* ---------------------------------------------------------- substitutions */

/** Who of the teaching staff is away on a day: the staff register's word first, then approved leave (the school's substitution board's rule). */
async function awayOn(schoolId: string, dateKey: string): Promise<Map<string, "ON_LEAVE" | "ABSENT">> {
  const [rows, leave] = await Promise.all([
    db.staffAttendance.findMany({ where: { schoolId, dateKey }, select: { membershipId: true, status: true } }),
    db.leaveRequest.findMany({ where: { schoolId, status: "APPROVED", fromDateKey: { lte: dateKey }, toDateKey: { gte: dateKey } }, select: { teacherMembershipId: true } }),
  ]);
  const out = new Map<string, "ON_LEAVE" | "ABSENT">();
  for (const l of leave) out.set(l.teacherMembershipId, "ON_LEAVE");
  for (const r of rows) {
    if (r.status === "ABSENT") out.set(r.membershipId, "ABSENT");
    else if (r.status === "ON_LEAVE") out.set(r.membershipId, "ON_LEAVE");
    else out.delete(r.membershipId);
  }
  return out;
}

/**
 * The lecture substitution board for a day: every lecture whose faculty
 * member is away, who stands in, and who could (teaching staff who are in
 * and have no lecture of their own at that time). The school's board
 * (substitutions.ts) is keyed on TimetableSlot and its covers; a college's
 * lectures are not timetable slots, so this board is its own, on the same
 * rule for who is away. An HOD sees their department's.
 */
export async function lectureSubstitutions(ctx: ActiveContext, date?: string): Promise<z.infer<typeof lectureSubstitutionsSchema>> {
  const c = await academicsCaller(ctx, ["ADMIN", "PRINCIPAL", "HOD"]);
  const dateKey = date && isDateKey(date) ? date : todayKey(c.timeZone);
  await ensureLecturesForDay(c.schoolId, dateKey);
  const dept = c.role === "HOD" ? await hodDepartment(c) : null;
  const [away, lectures, staff] = await Promise.all([
    awayOn(c.schoolId, dateKey),
    db.lecture.findMany({ where: { schoolId: c.schoolId, dateKey, cancelledAt: null, ...(dept ? { offering: { course: { scheme: { programme: { departmentId: dept.id } } } } } : {}) }, select: { id: true, startMinute: true, endMinute: true, substituteMembershipId: true, offering: { select: { facultyMembershipId: true, divisionId: true, course: { select: { code: true, name: true } } } } }, orderBy: { startMinute: "asc" } }),
    teachingStaff(c.schoolId),
  ]);
  const affected = lectures.filter((l) => l.offering.facultyMembershipId && away.has(l.offering.facultyMembershipId));
  const names = await namesOf([...affected.map((l) => l.offering.facultyMembershipId), ...affected.map((l) => l.substituteMembershipId)]);
  const divisions = await divisionNames(affected.map((l) => l.offering.divisionId));
  return {
    dateKey,
    lectures: affected.map((l) => ({ lectureId: l.id, courseCode: l.offering.course.code, courseName: l.offering.course.name, divisionName: l.offering.divisionId ? (divisions.get(l.offering.divisionId) ?? null) : null, startMinute: l.startMinute, endMinute: l.endMinute, facultyName: names.get(l.offering.facultyMembershipId!) ?? null, reason: away.get(l.offering.facultyMembershipId!)!, substituteMembershipId: l.substituteMembershipId, substituteName: l.substituteMembershipId ? (names.get(l.substituteMembershipId) ?? null) : null })),
    candidates: staff.filter((s) => !away.has(s.membershipId)).map((s) => ({ membershipId: s.membershipId, name: s.name, departmentId: s.departmentId })),
  };
}

/** Name who stands in for one lecture, or clear it; the same name twice changes nothing. The substitute is told. */
export async function setLectureSubstitute(ctx: ActiveContext, input: { lectureId: string; substituteMembershipId: string | null }): Promise<{ changed: boolean }> {
  const c = await academicsCaller(ctx, ["ADMIN", "HOD"]);
  const lecture = await db.lecture.findFirst({ where: { id: input.lectureId, schoolId: c.schoolId }, select: { id: true, dateKey: true, startMinute: true, endMinute: true, substituteMembershipId: true, offering: { select: { facultyMembershipId: true, course: { select: { code: true, name: true, scheme: { select: { programme: { select: { departmentId: true } } } } } } } } } });
  if (!lecture) throw new AccessError("access.entryNotFound", "NOT_FOUND");
  if (c.role === "HOD" && (await hodDepartment(c))?.id !== lecture.offering.course.scheme.programme.departmentId) throw new AccessError("academics.refuseOtherDepartment");
  if (lecture.substituteMembershipId === input.substituteMembershipId) return { changed: false };
  if (input.substituteMembershipId) {
    const s = await db.membership.findFirst({ where: { id: input.substituteMembershipId, schoolId: c.schoolId, role: { in: ["FACULTY", "HOD"] }, status: "ACTIVE" }, select: { id: true, userId: true } });
    if (!s || s.id === lecture.offering.facultyMembershipId) throw new RuleRefusal("academics.refuseNotFaculty", 422, undefined, "substituteMembershipId");
    const busy = await db.lecture.findFirst({ where: { schoolId: c.schoolId, dateKey: lecture.dateKey, cancelledAt: null, startMinute: { lt: lecture.endMinute }, endMinute: { gt: lecture.startMinute }, OR: [{ offering: { facultyMembershipId: s.id } }, { substituteMembershipId: s.id }], NOT: { id: lecture.id } }, select: { id: true } });
    if (busy) throw new RuleRefusal("academics.refuseSubstituteBusy", 409, undefined, "substituteMembershipId");
  }
  await db.lecture.update({ where: { id: lecture.id }, data: { substituteMembershipId: input.substituteMembershipId } });
  await audit({ schoolId: c.schoolId, actorUserId: c.userId, action: "academics.lecture.substitute", targetType: "Lecture", targetId: lecture.id, meta: { substituteMembershipId: input.substituteMembershipId } });
  if (input.substituteMembershipId) {
    const s = await db.membership.findUniqueOrThrow({ where: { id: input.substituteMembershipId }, select: { userId: true } });
    const course = `${lecture.offering.course.code} ${lecture.offering.course.name}`;
    await notify({ userId: s.userId, schoolId: c.schoolId, kind: "SYSTEM", titleKey: "academics.notifySubstituteTitle", titleVars: { course }, bodyKey: "academics.notifySubstituteBody", bodyVars: { course, date: lecture.dateKey }, url: `/faculty/lectures/${lecture.id}` });
  }
  return { changed: true };
}
