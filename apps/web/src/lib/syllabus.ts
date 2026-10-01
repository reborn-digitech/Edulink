import "server-only";
import type { z } from "zod";
import type { lessonPlanSaveSchema, officeSyllabusSaveSchema, officeSyllabusSchema, staffSyllabusSchema, syllabusCoverageSchema, planTemplateApplySchema, planTemplateSaveSchema, planTemplatesSchema } from "@edulink/contracts";
import { db } from "./db";
import { AccessError, assertClassAccess } from "./tenancy";
import { audit } from "./audit";
import { currentAcademicYear } from "./academic-year";
import { todayKey } from "./dates";
import { readJson, writeJson } from "./json";
import type { ActiveContext } from "./session";
import type { Role } from "./constants";

/**
 * Syllabus coverage.
 *
 * The office writes the chapter list for a grade and a subject, once, in
 * teaching order; every class of that grade then ticks its way through it,
 * and a teacher's lesson plans hang off the units. Coverage is done units
 * over all units for a class and a subject; "behind" is measured against
 * the academic year — by today the year is this far through, so the class
 * should be this far through the list — because a head who is told "60 %"
 * in November needs to know whether that is fine or two chapters short.
 * Progress and lessons are the class's teachers' to write (assertClassAccess,
 * which admits the office too); the head reads the whole school.
 */

const OFFICE: readonly Role[] = ["ADMIN", "PRINCIPAL"];
type Office = ActiveContext & { schoolId: string; membershipId: string; role: Role };
type Staff = ActiveContext & { schoolId: string; membershipId: string; role: Role };

function office(ctx: ActiveContext): Office {
  if (!ctx.schoolId || !ctx.membershipId || !ctx.role || !OFFICE.includes(ctx.role)) throw new AccessError("access.notAllowed");
  return ctx as Office;
}
function staff(ctx: ActiveContext): Staff {
  if (!ctx.schoolId || !ctx.membershipId || !ctx.role || !["ADMIN", "PRINCIPAL", "TEACHER"].includes(ctx.role)) throw new AccessError("access.notAllowed");
  return ctx as Staff;
}

const norm = (s: string) => s.trim().replace(/\s+/g, " ");

/** The subjects a class teaches: its timetable's, its own, and any list its grade already has. */
async function subjectsOf(schoolId: string, klass: { id: string; gradeLevel: string | null; subject: string | null }): Promise<string[]> {
  const [slots, units] = await Promise.all([
    db.timetableSlot.findMany({ where: { classId: klass.id }, select: { subject: true }, distinct: ["subject"] }),
    klass.gradeLevel ? db.syllabusUnit.findMany({ where: { schoolId, gradeLevel: klass.gradeLevel }, select: { subject: true }, distinct: ["subject"] }) : [],
  ]);
  const set = new Set<string>([...slots.map((s) => norm(s.subject)), ...units.map((u) => u.subject), ...(klass.subject ? [norm(klass.subject)] : [])].filter(Boolean));
  return [...set].sort((a, b) => a.localeCompare(b));
}

/* -------------------------------------------------------------------------- */
/* The office's lists                                                          */
/* -------------------------------------------------------------------------- */

export async function officeSyllabus(ctx: ActiveContext, query: { gradeLevel?: string; subject?: string }): Promise<z.infer<typeof officeSyllabusSchema>> {
  const caller = office(ctx);
  const [grouped, classes, slots] = await Promise.all([
    db.syllabusUnit.groupBy({ by: ["gradeLevel", "subject"], where: { schoolId: caller.schoolId }, _count: { _all: true }, orderBy: [{ gradeLevel: "asc" }, { subject: "asc" }] }),
    db.class.findMany({ where: { schoolId: caller.schoolId, archivedAt: null }, select: { gradeLevel: true }, distinct: ["gradeLevel"] }),
    db.timetableSlot.findMany({ where: { class: { schoolId: caller.schoolId, archivedAt: null } }, select: { subject: true }, distinct: ["subject"] }),
  ]);
  const gradeLevel = query.gradeLevel ? norm(query.gradeLevel) : null;
  const subject = query.subject ? norm(query.subject) : null;
  const units = gradeLevel && subject ? await db.syllabusUnit.findMany({ where: { schoolId: caller.schoolId, gradeLevel, subject }, orderBy: { position: "asc" } }) : [];
  const grades = [...new Set([...classes.map((c) => c.gradeLevel).filter((g): g is string => Boolean(g)), ...grouped.map((g) => g.gradeLevel)])].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  const subjects = [...new Set([...slots.map((s) => norm(s.subject)), ...grouped.map((g) => g.subject)])].filter(Boolean).sort((a, b) => a.localeCompare(b));
  return {
    lists: grouped.map((g) => ({ gradeLevel: g.gradeLevel, subject: g.subject, units: g._count._all })),
    grades,
    subjects,
    gradeLevel,
    subject,
    units: units.map((u) => ({ id: u.id, position: u.position, title: u.title, periodsPlanned: u.periodsPlanned })),
  };
}

/** Replaces one list in order. A unit sent with its id keeps that id and every class's progress on it; the rest are new; anything not sent is removed with its progress. */
export async function saveOfficeSyllabus(ctx: ActiveContext, input: z.infer<typeof officeSyllabusSaveSchema>): Promise<{ units: number; removed: number }> {
  const caller = office(ctx);
  // The lists are set up by the admin; the head reads them and the coverage.
  if (caller.role !== "ADMIN") throw new AccessError("access.onlyAnAdminSetsUpTheSchool");
  const gradeLevel = norm(input.gradeLevel);
  const subject = norm(input.subject);
  const existing = await db.syllabusUnit.findMany({ where: { schoolId: caller.schoolId, gradeLevel, subject }, select: { id: true } });
  const keep = new Set(input.units.map((u) => u.id).filter((id): id is string => Boolean(id)));
  const known = new Set(existing.map((u) => u.id));
  for (const id of keep) if (!known.has(id)) throw new AccessError("syllabus.refuseUnknownUnit", "NOT_FOUND");
  const removed = existing.filter((u) => !keep.has(u.id)).map((u) => u.id);
  await db.$tenantTransaction(async (tx: unknown) => {
    const t = tx as { syllabusUnit: { deleteMany(args: unknown): Promise<unknown>; update(args: unknown): Promise<unknown>; create(args: unknown): Promise<unknown> } };
    if (removed.length) await t.syllabusUnit.deleteMany({ where: { id: { in: removed } } });
    let position = 0;
    for (const u of input.units) {
      position += 1;
      const data = { position, title: norm(u.title), periodsPlanned: u.periodsPlanned ?? null };
      if (u.id) await t.syllabusUnit.update({ where: { id: u.id }, data });
      else await t.syllabusUnit.create({ data: { schoolId: caller.schoolId, gradeLevel, subject, ...data } });
    }
  });
  await audit({ schoolId: caller.schoolId, actorUserId: caller.user.id, action: "syllabus.save", targetType: "School", targetId: caller.schoolId, meta: { gradeLevel, subject, units: input.units.length, removed: removed.length } });
  return { units: input.units.length, removed: removed.length };
}

/* -------------------------------------------------------------------------- */
/* Coverage                                                                     */
/* -------------------------------------------------------------------------- */

async function yearProgress(schoolId: string): Promise<{ yearName: string | null; elapsed: number }> {
  const year = await currentAcademicYear(schoolId);
  if (!year) return { yearName: null, elapsed: 0 };
  const span = year.endDate.getTime() - year.startDate.getTime();
  const gone = Date.now() - year.startDate.getTime();
  return { yearName: year.name, elapsed: span <= 0 ? 0 : Math.min(1, Math.max(0, gone / span)) };
}

/** The head's picture: every class × subject that has a list, with done, expected and behind. */
export async function syllabusCoverage(ctx: ActiveContext): Promise<z.infer<typeof syllabusCoverageSchema>> {
  const caller = office(ctx);
  const [{ yearName, elapsed }, classes, units, progress, lastLessons] = await Promise.all([
    yearProgress(caller.schoolId),
    db.class.findMany({ where: { schoolId: caller.schoolId, archivedAt: null }, select: { id: true, name: true, gradeLevel: true, subject: true }, orderBy: { name: "asc" } }),
    db.syllabusUnit.findMany({ where: { schoolId: caller.schoolId }, select: { id: true, gradeLevel: true, subject: true } }),
    db.syllabusProgress.findMany({ where: { schoolId: caller.schoolId }, select: { classId: true, unitId: true, status: true } }),
    db.lessonPlan.groupBy({ by: ["classId", "subject"], where: { schoolId: caller.schoolId, status: "TAUGHT" }, _max: { dateKey: true } }),
  ]);
  const unitsBy = new Map<string, string[]>();
  for (const u of units) (unitsBy.get(`${u.gradeLevel}|${u.subject}`) ?? unitsBy.set(`${u.gradeLevel}|${u.subject}`, []).get(`${u.gradeLevel}|${u.subject}`)!).push(u.id);
  const statusOf = new Map(progress.map((p) => [`${p.classId}|${p.unitId}`, p.status]));
  const lastBy = new Map(lastLessons.map((l) => [`${l.classId}|${l.subject}`, l._max.dateKey]));
  const rows: z.infer<typeof syllabusCoverageSchema>["rows"] = [];
  for (const k of classes) {
    if (!k.gradeLevel) continue;
    for (const [key, ids] of unitsBy) {
      const [gradeLevel, subject] = key.split("|") as [string, string];
      if (gradeLevel !== k.gradeLevel) continue;
      const done = ids.filter((id) => statusOf.get(`${k.id}|${id}`) === "DONE").length;
      const inProgress = ids.filter((id) => statusOf.get(`${k.id}|${id}`) === "IN_PROGRESS").length;
      const expected = Math.round(elapsed * ids.length);
      rows.push({ classId: k.id, className: k.name, gradeLevel: k.gradeLevel, subject, units: ids.length, done, inProgress, percent: Math.round((done / ids.length) * 100), expected, behind: expected - done >= 2, lastTaughtOn: lastBy.get(`${k.id}|${subject}`) ?? null });
    }
  }
  const totalUnits = rows.reduce((n, r) => n + r.units, 0);
  const totalDone = rows.reduce((n, r) => n + r.done, 0);
  return { yearName, yearElapsedPercent: Math.round(elapsed * 100), overallPercent: totalUnits === 0 ? null : Math.round((totalDone / totalUnits) * 100), classesBehind: new Set(rows.filter((r) => r.behind).map((r) => r.classId)).size, rows };
}

/* -------------------------------------------------------------------------- */
/* A class's view                                                               */
/* -------------------------------------------------------------------------- */

export async function staffSyllabus(ctx: ActiveContext, query: { classId: string; subject?: string }): Promise<z.infer<typeof staffSyllabusSchema>> {
  const caller = staff(ctx);
  const klass = await assertClassAccess({ schoolId: caller.schoolId, membershipId: caller.membershipId, role: caller.role }, query.classId);
  const subjects = await subjectsOf(caller.schoolId, klass);
  const subject = query.subject ? norm(query.subject) : (subjects[0] ?? null);
  const [units, lessons] = await Promise.all([
    subject && klass.gradeLevel ? db.syllabusUnit.findMany({ where: { schoolId: caller.schoolId, gradeLevel: klass.gradeLevel, subject }, orderBy: { position: "asc" }, include: { progress: { where: { classId: klass.id }, include: { by: { select: { user: { select: { name: true, preferredName: true } } } } } }, _count: { select: { lessons: { where: { classId: klass.id } } } } } }) : [],
    subject ? db.lessonPlan.findMany({ where: { classId: klass.id, subject }, orderBy: [{ dateKey: "desc" }, { createdAt: "desc" }], take: 60, include: { unit: { select: { title: true } }, teacher: { select: { user: { select: { name: true, preferredName: true } } } } } }) : [],
  ]);
  const done = units.filter((u) => u.progress[0]?.status === "DONE").length;
  return {
    classId: klass.id,
    className: klass.name,
    gradeLevel: klass.gradeLevel,
    subjects,
    subject,
    units: units.map((u) => ({ id: u.id, position: u.position, title: u.title, periodsPlanned: u.periodsPlanned, status: (u.progress[0]?.status as "NOT_STARTED" | "IN_PROGRESS" | "DONE" | undefined) ?? "NOT_STARTED", doneOn: u.progress[0]?.doneOn ?? null, byName: u.progress[0]?.by?.user.preferredName ?? u.progress[0]?.by?.user.name ?? null, lessons: u._count.lessons })),
    percent: units.length === 0 ? null : Math.round((done / units.length) * 100),
    lessons: lessons.map((l) => ({ id: l.id, subject: l.subject, unitId: l.unitId, unitTitle: l.unit?.title ?? null, dateKey: l.dateKey, topic: l.topic, notes: l.notes, homework: l.homework, status: l.status as "PLANNED" | "TAUGHT" | "SKIPPED", teacherName: l.teacher.user.preferredName ?? l.teacher.user.name, updatedAt: l.updatedAt.toISOString() })),
    canEdit: true,
  };
}

/** A class's teacher (or the office) moves a unit along; done takes a day, and the audit says the kind, never the chapter's words. */
export async function saveSyllabusProgress(ctx: ActiveContext, input: { classId: string; unitId: string; status: "NOT_STARTED" | "IN_PROGRESS" | "DONE"; doneOn?: string }): Promise<void> {
  const caller = staff(ctx);
  const klass = await assertClassAccess({ schoolId: caller.schoolId, membershipId: caller.membershipId, role: caller.role }, input.classId);
  const unit = await db.syllabusUnit.findFirst({ where: { id: input.unitId, schoolId: caller.schoolId, gradeLevel: klass.gradeLevel ?? "" }, select: { id: true } });
  if (!unit) throw new AccessError("syllabus.refuseUnknownUnit", "NOT_FOUND");
  const school = await db.school.findUniqueOrThrow({ where: { id: caller.schoolId }, select: { timezone: true } });
  const doneOn = input.status === "DONE" ? (input.doneOn ?? todayKey(school.timezone)) : null;
  await db.syllabusProgress.upsert({
    where: { classId_unitId: { classId: klass.id, unitId: unit.id } },
    create: { schoolId: caller.schoolId, classId: klass.id, unitId: unit.id, status: input.status, doneOn, byMembershipId: caller.membershipId },
    update: { status: input.status, doneOn, byMembershipId: caller.membershipId },
  });
  await audit({ schoolId: caller.schoolId, actorUserId: caller.user.id, action: "syllabus.progress", targetType: "Class", targetId: klass.id, meta: { unitId: unit.id, status: input.status } });
}

/** A lesson planned or logged; marking it taught moves its unit to in progress if the unit has not moved yet. */
export async function saveLessonPlan(ctx: ActiveContext, input: z.infer<typeof lessonPlanSaveSchema>): Promise<{ id: string }> {
  const caller = staff(ctx);
  const klass = await assertClassAccess({ schoolId: caller.schoolId, membershipId: caller.membershipId, role: caller.role }, input.classId);
  if (input.unitId) {
    const unit = await db.syllabusUnit.findFirst({ where: { id: input.unitId, schoolId: caller.schoolId, gradeLevel: klass.gradeLevel ?? "" }, select: { id: true } });
    if (!unit) throw new AccessError("syllabus.refuseUnknownUnit", "NOT_FOUND");
  }
  const lesson = await db.lessonPlan.create({
    data: { schoolId: caller.schoolId, classId: klass.id, teacherMembershipId: caller.membershipId, subject: norm(input.subject), unitId: input.unitId ?? null, dateKey: input.dateKey, topic: norm(input.topic), notes: input.notes, homework: input.homework, status: input.status },
    select: { id: true },
  });
  if (input.status === "TAUGHT" && input.unitId) await nudgeUnit(caller, klass.id, input.unitId);
  await audit({ schoolId: caller.schoolId, actorUserId: caller.user.id, action: "syllabus.lesson", targetType: "Class", targetId: klass.id, meta: { lessonId: lesson.id, status: input.status } });
  return lesson;
}

export async function setLessonStatus(ctx: ActiveContext, lessonId: string, status: "PLANNED" | "TAUGHT" | "SKIPPED"): Promise<void> {
  const caller = staff(ctx);
  const lesson = await db.lessonPlan.findFirst({ where: { id: lessonId, schoolId: caller.schoolId }, select: { id: true, classId: true, unitId: true } });
  if (!lesson) throw new AccessError("syllabus.refuseUnknownLesson", "NOT_FOUND");
  await assertClassAccess({ schoolId: caller.schoolId, membershipId: caller.membershipId, role: caller.role }, lesson.classId);
  await db.lessonPlan.update({ where: { id: lesson.id }, data: { status } });
  if (status === "TAUGHT" && lesson.unitId) await nudgeUnit(caller, lesson.classId, lesson.unitId);
  await audit({ schoolId: caller.schoolId, actorUserId: caller.user.id, action: "syllabus.lesson", targetType: "Class", targetId: lesson.classId, meta: { lessonId: lesson.id, status } });
}

async function nudgeUnit(caller: Staff, classId: string, unitId: string): Promise<void> {
  const current = await db.syllabusProgress.findUnique({ where: { classId_unitId: { classId, unitId } }, select: { status: true } });
  if (current && current.status !== "NOT_STARTED") return;
  await db.syllabusProgress.upsert({ where: { classId_unitId: { classId, unitId } }, create: { schoolId: caller.schoolId, classId, unitId, status: "IN_PROGRESS", byMembershipId: caller.membershipId }, update: { status: "IN_PROGRESS", byMembershipId: caller.membershipId } });
}

/* -------------------------------------------------------------------------- */
/* Lesson plan templates                                                       */
/* -------------------------------------------------------------------------- */

/**
 * A plan kept to use again. A template is the WORDS of a lesson — topic,
 * notes, homework — with the subject and grade it was written for, shared
 * with every teacher of the school. Applying one copies the words into a
 * new plan for a class the caller teaches; the template is never linked, so
 * a plan applied last term stands as it was taught even if the template is
 * rewritten or removed. The author or the office may remove one.
 */
type TemplateBody = { topic: string; notes: string; homework: string };
const EMPTY_BODY: TemplateBody = { topic: "", notes: "", homework: "" };

export async function listPlanTemplates(ctx: ActiveContext, query: { subject?: string } = {}): Promise<z.infer<typeof planTemplatesSchema>> {
  const caller = staff(ctx);
  const subject = query.subject ? norm(query.subject) : null;
  const rows = await db.lessonPlanTemplate.findMany({
    where: { schoolId: caller.schoolId, ...(subject ? { subject } : {}) },
    orderBy: [{ createdAt: "desc" }],
    take: 200,
  });
  const authors = await db.user.findMany({ where: { id: { in: [...new Set(rows.map((r) => r.authorUserId))] } }, select: { id: true, name: true, preferredName: true } });
  const nameBy = new Map(authors.map((u) => [u.id, u.preferredName ?? u.name]));
  const items = rows.map((r) => {
    const body = readJson<TemplateBody>(r.body, EMPTY_BODY);
    return { id: r.id, subject: r.subject, grade: r.grade, title: r.title, topic: body.topic ?? "", notes: body.notes ?? "", homework: body.homework ?? "", authorName: nameBy.get(r.authorUserId) ?? "", own: r.authorUserId === caller.user.id, createdAt: r.createdAt.toISOString() };
  });
  // Mine first, newest first inside each half.
  items.sort((a, b) => Number(b.own) - Number(a.own) || b.createdAt.localeCompare(a.createdAt));
  return { items };
}

/** Keep a lesson of a class I teach as a template; the title is the plan's topic unless another is given. */
export async function savePlanTemplate(ctx: ActiveContext, input: z.infer<typeof planTemplateSaveSchema>): Promise<{ id: string }> {
  const caller = staff(ctx);
  const lesson = await db.lessonPlan.findFirst({ where: { id: input.lessonId, schoolId: caller.schoolId }, select: { id: true, classId: true, subject: true, topic: true, notes: true, homework: true, class: { select: { gradeLevel: true } } } });
  if (!lesson) throw new AccessError("syllabus.refuseUnknownLesson", "NOT_FOUND");
  await assertClassAccess({ schoolId: caller.schoolId, membershipId: caller.membershipId, role: caller.role }, lesson.classId);
  const template = await db.lessonPlanTemplate.create({
    data: { schoolId: caller.schoolId, authorUserId: caller.user.id, subject: lesson.subject, grade: lesson.class.gradeLevel, title: norm(input.title ?? lesson.topic), body: writeJson({ topic: lesson.topic, notes: lesson.notes, homework: lesson.homework }) },
    select: { id: true },
  });
  await audit({ schoolId: caller.schoolId, actorUserId: caller.user.id, action: "syllabus.template.save", targetType: "LessonPlanTemplate", targetId: template.id, meta: { lessonId: lesson.id, subject: lesson.subject } });
  return template;
}

/** Copy a template into a new PLANNED lesson for a class I teach, under a chapter of its grade when one is named, on the day given or today. */
export async function applyPlanTemplate(ctx: ActiveContext, templateId: string, input: z.infer<typeof planTemplateApplySchema>): Promise<{ lessonId: string }> {
  const caller = staff(ctx);
  const template = await db.lessonPlanTemplate.findFirst({ where: { id: templateId, schoolId: caller.schoolId } });
  if (!template) throw new AccessError("syllabus.refuseUnknownTemplate", "NOT_FOUND");
  const klass = await assertClassAccess({ schoolId: caller.schoolId, membershipId: caller.membershipId, role: caller.role }, input.classId, { write: true });
  if (input.unitId) {
    const unit = await db.syllabusUnit.findFirst({ where: { id: input.unitId, schoolId: caller.schoolId, gradeLevel: klass.gradeLevel ?? "" }, select: { id: true } });
    if (!unit) throw new AccessError("syllabus.refuseUnknownUnit", "NOT_FOUND");
  }
  const school = await db.school.findUniqueOrThrow({ where: { id: caller.schoolId }, select: { timezone: true } });
  const body = readJson<TemplateBody>(template.body, EMPTY_BODY);
  const lesson = await db.lessonPlan.create({
    data: { schoolId: caller.schoolId, classId: klass.id, teacherMembershipId: caller.membershipId, subject: template.subject, unitId: input.unitId ?? null, dateKey: input.dateKey ?? todayKey(school.timezone), topic: norm(body.topic || template.title), notes: body.notes ?? "", homework: body.homework ?? "", status: "PLANNED" },
    select: { id: true },
  });
  await audit({ schoolId: caller.schoolId, actorUserId: caller.user.id, action: "syllabus.template.apply", targetType: "Class", targetId: klass.id, meta: { templateId: template.id, lessonId: lesson.id } });
  return { lessonId: lesson.id };
}

/** The author, or the office, takes a template out of the list; plans already copied from it stand. Nothing there is a no-op. */
export async function deletePlanTemplate(ctx: ActiveContext, templateId: string): Promise<{ changed: boolean }> {
  const caller = staff(ctx);
  const template = await db.lessonPlanTemplate.findFirst({ where: { id: templateId, schoolId: caller.schoolId }, select: { id: true, authorUserId: true } });
  if (!template) return { changed: false };
  if (template.authorUserId !== caller.user.id && !OFFICE.includes(caller.role)) throw new AccessError("syllabus.refuseNotYourTemplate");
  await db.lessonPlanTemplate.delete({ where: { id: template.id } });
  await audit({ schoolId: caller.schoolId, actorUserId: caller.user.id, action: "syllabus.template.delete", targetType: "LessonPlanTemplate", targetId: template.id });
  return { changed: true };
}
