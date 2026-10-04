import "server-only";
import { coursePlanWeekSchema, type Attainment, type CourseFile } from "@edulink/contracts";
import type { z } from "zod";
import { db } from "./db";
import { AccessError } from "./access-error";
import { RuleRefusal } from "./rule-refusal";
import { audit } from "./audit";
import { notify } from "./notify";
import { readJson, writeJson } from "./json";
import { todayKey } from "./dates";
import { academicsCaller, departmentOfMember, hodDepartment, nameOf, namesOf, readCodes, readOutcomes, type Caller } from "./academics";
import { ATTAINMENT_TARGET_PERCENT, attainmentLevel, combinedLevel, coverage, poAttainment, termElapsed } from "./academics-rules";
import type { ActiveContext } from "./session";

/**
 * THE COURSE FILE (the college's academics, 4 October 2026): an offering's
 * teaching plan by week with the course outcomes each week serves and the
 * day it was taught, its resources, lecture notes, question papers and model
 * answers (stored files or links, tagged by outcome), and the HOD's review.
 * Coverage is weeks taught against the term's elapsed fraction, on the
 * syllabus module's rule (behind at two or more weeks short), read each
 * time and never stored.
 *
 * ATTAINMENT, computed on read. DIRECT: for each course outcome, of the
 * students with marks on the internal components that test it, how many
 * reached 60 % of those components' marks — level 3 at 70 % of students,
 * 2 at 60 %, 1 at 50 %. INDIRECT: the course-exit survey, which is the IQAC
 * module's to collect; `indirectAttainment` below is its seam and returns
 * nothing until that module fills it. The final level is 80:20 when both
 * exist. A programme outcome's attainment is its course outcomes' levels
 * weighted by the articulation matrix. `attainmentForOffering(offeringId)`
 * is the read other modules call.
 */

type Week = z.infer<typeof coursePlanWeekSchema>;
const readPlan = (raw: string): Week[] =>
  readJson<unknown[]>(raw, []).flatMap((x) => {
    const p = coursePlanWeekSchema.safeParse(x);
    return p.success ? [p.data] : [];
  });

/**
 * THE IQAC MODULE'S SEAM: the course-exit survey's level (0–3) for each
 * course outcome of an offering — the IQAC module's course feedback, read
 * through iqac.ts `indirectLevelsByOutcome` (an empty map below five answers).
 */
export async function indirectAttainment(offeringId: string): Promise<Map<string, number>> {
  const { indirectLevelsByOutcome } = await import("./iqac");
  return indirectLevelsByOutcome(offeringId);
}

export async function attainmentForOffering(offeringId: string): Promise<Attainment> {
  const o = await db.courseOffering.findUnique({
    where: { id: offeringId },
    select: { courseId: true, course: { select: { outcomes: true, mapping: { select: { coCode: true, poCode: true, level: true } }, scheme: { select: { programmeId: true } } } }, components: { select: { id: true, maxMarks: true, coCodes: true, marks: { select: { studentMembershipId: true, marksTenths: true } } } } },
  });
  if (!o) return { targetPercent: ATTAINMENT_TARGET_PERCENT, cos: [], pos: [] };
  const [indirect, pos] = await Promise.all([indirectAttainment(offeringId), db.programmeOutcome.findMany({ where: { programmeId: o.course.scheme.programmeId }, orderBy: { code: "asc" }, select: { code: true } })]);
  const cos = readOutcomes(o.course.outcomes).map((co) => {
    const tests = o.components.filter((k) => readCodes(k.coCodes).includes(co.code));
    // Each student's share of the marks on the components that test this outcome.
    const per = new Map<string, { got: number; max: number }>();
    for (const k of tests) {
      for (const m of k.marks) {
        const v = per.get(m.studentMembershipId) ?? { got: 0, max: 0 };
        v.got += (m.marksTenths ?? 0) / 10;
        v.max += k.maxMarks;
        per.set(m.studentMembershipId, v);
      }
    }
    const assessed = per.size;
    const reached = [...per.values()].filter((v) => v.max > 0 && (v.got / v.max) * 100 >= ATTAINMENT_TARGET_PERCENT).length;
    const direct = attainmentLevel(reached, assessed);
    const ind = indirect.get(co.code) ?? null;
    return { code: co.code, text: co.text, assessed, reached, direct, indirect: ind, level: combinedLevel(direct, ind) };
  });
  const levelBy = new Map(cos.map((c) => [c.code, c.level]));
  return {
    targetPercent: ATTAINMENT_TARGET_PERCENT,
    cos,
    pos: pos.map((p) => ({ code: p.code, attainment: poAttainment(o.course.mapping.filter((m) => m.poCode === p.code).map((m) => ({ coLevel: levelBy.get(m.coCode) ?? null, mapLevel: m.level }))) })),
  };
}

async function fileAccess(c: Caller, offeringId: string) {
  const o = await db.courseOffering.findFirst({ where: { id: offeringId, schoolId: c.schoolId }, select: { id: true, termId: true, facultyMembershipId: true, course: { select: { code: true, name: true, outcomes: true, scheme: { select: { programme: { select: { departmentId: true } } } } } }, term: { select: { startsOn: true, endsOn: true } } } });
  if (!o) throw new AccessError("access.entryNotFound", "NOT_FOUND");
  const dept = o.course.scheme.programme.departmentId;
  const isFaculty = o.facultyMembershipId === c.membershipId;
  const isHod = c.role === "HOD" && (await hodDepartment(c))?.id === dept;
  let canRead = isFaculty || isHod || c.role === "ADMIN" || c.role === "PRINCIPAL";
  if (!canRead && (c.role === "FACULTY" || c.role === "HOD")) canRead = (await departmentOfMember(c.schoolId, c.membershipId)) === dept;
  if (!canRead && c.role === "STUDENT") canRead = Boolean(await db.courseRegistration.findFirst({ where: { offeringId, studentMembershipId: c.membershipId, status: "REGISTERED" }, select: { id: true } }));
  if (!canRead) throw new AccessError("academics.refuseNotYours");
  return { o, isFaculty, isHod };
}

/** The course file: its faculty member and the department write and read; the office and head read; a registered student reads the plan and resources. */
export async function courseFile(ctx: ActiveContext, offeringId: string): Promise<CourseFile> {
  const c = await academicsCaller(ctx, ["FACULTY", "HOD", "ADMIN", "PRINCIPAL", "STUDENT"]);
  return courseFileFor(c, offeringId);
}

export async function courseFileFor(c: Caller, offeringId: string): Promise<CourseFile> {
  const { o, isFaculty, isHod } = await fileAccess(c, offeringId);
  const file = await db.courseFile.findUnique({ where: { offeringId }, select: { planJson: true, reviewedAt: true, reviewedByUserId: true, reviewNote: true, items: { orderBy: { createdAt: "desc" }, select: { id: true, kind: true, title: true, url: true, fileId: true, coCodes: true, createdAt: true } } } });
  const plan = file ? readPlan(file.planJson) : [];
  const elapsed = termElapsed(o.term.startsOn, o.term.endsOn, todayKey((await db.school.findUniqueOrThrow({ where: { id: c.schoolId }, select: { timezone: true } })).timezone));
  const taught = plan.filter((w) => w.taughtOn).length;
  const cov = coverage(plan.length, taught, elapsed);
  const [faculty, reviewer] = await Promise.all([namesOf([o.facultyMembershipId]), file?.reviewedByUserId ? db.user.findUnique({ where: { id: file.reviewedByUserId }, select: { name: true, preferredName: true } }) : Promise.resolve(null)]);
  // A student reads the plan and the resources; the question papers and model answers are the department's.
  const items = (file?.items ?? []).filter((i) => c.role !== "STUDENT" || !["QUESTION_PAPER", "MODEL_ANSWER"].includes(i.kind));
  return {
    offeringId,
    courseCode: o.course.code,
    courseName: o.course.name,
    facultyName: o.facultyMembershipId ? (faculty.get(o.facultyMembershipId) ?? null) : null,
    outcomes: readOutcomes(o.course.outcomes),
    plan,
    taught,
    expected: cov.expected,
    behind: plan.length > 0 && cov.behind,
    termElapsedPercent: Math.round(elapsed * 100),
    // Only a web link is handed on: a row stored before the schema refused other schemes (javascript:,
    // intent:, another app's deep link) is read as no link (campaign S-21, PH-7).
    items: items.map((i) => ({ id: i.id, kind: i.kind as "RESOURCE", title: i.title, url: i.url && WEB_LINK.test(i.url) ? i.url : null, fileId: i.fileId, coCodes: readCodes(i.coCodes), createdAt: i.createdAt.toISOString() })),
    review: file?.reviewedAt ? { at: file.reviewedAt.toISOString(), byName: reviewer ? nameOf(reviewer) : null, note: file.reviewNote ?? "" } : null,
    attainment: c.role === "STUDENT" ? { targetPercent: ATTAINMENT_TARGET_PERCENT, cos: [], pos: [] } : await attainmentForOffering(offeringId),
    canEdit: isFaculty || isHod,
    canReview: isHod,
  };
}

/** The plan, replaced whole by the faculty member or the HOD: weeks in order, outcomes the course has, taught days not in the future. */
export async function saveCoursePlan(ctx: ActiveContext, offeringId: string, input: { plan: Week[] }): Promise<{ weeks: number }> {
  const c = await academicsCaller(ctx, ["FACULTY", "HOD"]);
  const { o, isFaculty, isHod } = await fileAccess(c, offeringId);
  if (!isFaculty && !isHod) throw new AccessError("academics.refuseNotYours");
  const cos = new Set(readOutcomes(o.course.outcomes).map((x) => x.code));
  const stray = input.plan.flatMap((w) => w.coCodes).find((code) => !cos.has(code));
  if (stray) throw new RuleRefusal("academics.refuseUnknownOutcome", 422, { code: stray }, "plan");
  const weeks = input.plan.map((w) => w.week);
  if (new Set(weeks).size !== weeks.length) throw new RuleRefusal("academics.refuseDuplicateWeek", 422, undefined, "plan");
  const today = todayKey(c.timeZone);
  if (input.plan.some((w) => w.taughtOn && w.taughtOn > today)) throw new RuleRefusal("academics.refuseFutureTaught", 422, undefined, "plan");
  const plan = [...input.plan].sort((a, b) => a.week - b.week);
  await db.courseFile.upsert({ where: { offeringId }, create: { schoolId: c.schoolId, offeringId, planJson: writeJson(plan) }, update: { planJson: writeJson(plan) } });
  await audit({ schoolId: c.schoolId, actorUserId: c.userId, action: "academics.coursefile.plan", targetType: "CourseOffering", targetId: offeringId, meta: { weeks: plan.length, taught: plan.filter((w) => w.taughtOn).length } });
  return { weeks: plan.length };
}

/** A resource, notes, a question paper or a model answer: a stored file (an upload ticket of the caller's, spent here, or a file the web page just stored) or a link. */
/** A link a reader may follow: http or https, nothing else. */
const WEB_LINK = /^https?:\/\//i;

export async function addCourseFileItem(ctx: ActiveContext, offeringId: string, input: { kind: string; title: string; url: string | null; fileId: string | null; coCodes: string[] }, stored: { fileId?: string | null } = {}): Promise<{ id: string }> {
  const c = await academicsCaller(ctx, ["FACULTY", "HOD"]);
  const { o, isFaculty, isHod } = await fileAccess(c, offeringId);
  if (!isFaculty && !isHod) throw new AccessError("academics.refuseNotYours");
  const cos = new Set(readOutcomes(o.course.outcomes).map((x) => x.code));
  const stray = input.coCodes.find((code) => !cos.has(code));
  if (stray) throw new RuleRefusal("academics.refuseUnknownOutcome", 422, { code: stray }, "coCodes");
  let fileId = stored.fileId ?? null;
  if (!fileId && input.fileId) {
    const spent = await db.uploadTicket.updateMany({ where: { fileId: input.fileId, userId: c.userId, consumedAt: null }, data: { consumedAt: new Date() } });
    if (spent.count === 0) throw new RuleRefusal("academics.refuseTicket", 422, undefined, "fileId");
    fileId = input.fileId;
  }
  if (!fileId && !input.url) throw new RuleRefusal("academics.refuseNoFileOrLink", 422, undefined, "url");
  if (!fileId && input.url && !WEB_LINK.test(input.url)) throw new RuleRefusal("academics.refuseNoFileOrLink", 422, undefined, "url");
  const file = await db.courseFile.upsert({ where: { offeringId }, create: { schoolId: c.schoolId, offeringId }, update: {}, select: { id: true } });
  const row = await db.courseFileItem.create({ data: { schoolId: c.schoolId, courseFileId: file.id, kind: input.kind, title: input.title, url: fileId ? null : input.url, fileId, coCodes: writeJson(input.coCodes), createdByUserId: c.userId }, select: { id: true } });
  await audit({ schoolId: c.schoolId, actorUserId: c.userId, action: "academics.coursefile.item", targetType: "CourseFileItem", targetId: row.id, meta: { offeringId, kind: input.kind, file: Boolean(fileId) } });
  return row;
}

/** The HOD marks the file reviewed, with a note the faculty member is sent. */
export async function reviewCourseFile(ctx: ActiveContext, offeringId: string, note: string): Promise<{ changed: boolean }> {
  const c = await academicsCaller(ctx, ["HOD"]);
  const { o, isHod } = await fileAccess(c, offeringId);
  if (!isHod) throw new AccessError("academics.refuseOtherDepartment");
  await db.courseFile.upsert({ where: { offeringId }, create: { schoolId: c.schoolId, offeringId, reviewedAt: new Date(), reviewedByUserId: c.userId, reviewNote: note }, update: { reviewedAt: new Date(), reviewedByUserId: c.userId, reviewNote: note } });
  await audit({ schoolId: c.schoolId, actorUserId: c.userId, action: "academics.coursefile.review", targetType: "CourseOffering", targetId: offeringId });
  if (o.facultyMembershipId && o.facultyMembershipId !== c.membershipId) {
    const f = await db.membership.findUnique({ where: { id: o.facultyMembershipId }, select: { userId: true } });
    if (f) await notify({ userId: f.userId, schoolId: c.schoolId, kind: "SYSTEM", titleKey: "academics.notifyReviewedTitle", titleVars: { course: o.course.code }, bodyKey: "academics.notifyReviewedBody", bodyVars: { course: `${o.course.code} ${o.course.name}`, note: note || "—" }, url: `/faculty/offerings/${offeringId}` });
  }
  return { changed: true };
}

/** Coverage for many offerings at once, for the homes: planned and taught weeks, and whether behind. */
export async function coverageBy(schoolId: string, offeringIds: string[], term: { startsOn: string; endsOn: string } | null, today: string): Promise<Map<string, { planned: number; taught: number; behind: boolean }>> {
  const out = new Map<string, { planned: number; taught: number; behind: boolean }>();
  if (!offeringIds.length) return out;
  const files = await db.courseFile.findMany({ where: { schoolId, offeringId: { in: offeringIds } }, select: { offeringId: true, planJson: true } });
  const elapsed = term ? termElapsed(term.startsOn, term.endsOn, today) : 0;
  for (const f of files) {
    const plan = readPlan(f.planJson);
    const taught = plan.filter((w) => w.taughtOn).length;
    out.set(f.offeringId, { planned: plan.length, taught, behind: plan.length > 0 && coverage(plan.length, taught, elapsed).behind });
  }
  return out;
}
