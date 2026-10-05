import "server-only";
import {
  academicYearOf,
  DUTY_STREAMS,
  LAB_BATCH_DEFAULT_SIZE,
  type LabBatches,
  type MootCourtSave,
  type PracticalSheet,
  type StreamCode,
  type StreamRecordsSummary,
} from "@edulink/contracts";
import type { z } from "zod";
import type { labDivisionSchema, mootCourtsSchema } from "@edulink/contracts";
import { db } from "./db";
import { AccessError } from "./access-error";
import { RuleRefusal } from "./rule-refusal";
import { audit } from "./audit";
import { assertCollege, assertModuleOn } from "./modules";
import { streamsOf } from "./streams";
import { myDuties } from "./duties";
import { todayKey } from "./dates";
import { readJsonArray } from "./json";
import type { ActiveContext } from "./session";
import type { Role } from "./constants";
import type { SchoolModuleCode } from "@edulink/contracts";
import { lawInternshipSummary, nssSummary, practicalRecordSummary, teachingPracticeSummary } from "./stream-summaries";

/**
 * STREAM RECORDS (the owner's decision of 5 October 2026; the codes and the
 * councils' rules are packages/contracts v1/stream-records.ts):
 *
 *   LAB BATCHES. The office splits a division evenly into batches of at most
 *   a size (LAB_BATCH_DEFAULT_SIZE, twenty, unless it says), by roll number,
 *   named A, B, C…; re-splitting moves the students and keeps a batch's id
 *   while its name survives, so a timetable hour naming batch A still does.
 *   A LAB hour may name a batch (academics.ts saveTimetableSlot) and its
 *   lectures carry it: the roster, the marks and the practical record are
 *   then the batch's members only (academics-attendance.ts).
 *
 *   THE PRACTICAL RECORD. The offering's teacher (or the HOD of its
 *   department) writes each experiment a student performed and its marks;
 *   that teacher or a member holding LAB_INCHARGE signs; a signed row is not
 *   changed again. The office and the head read.
 *
 *   MOOT COURTS (a law college's): the office, an HOD or a faculty member
 *   records one with its teams, their outcome, the result and the judges'
 *   notes. Refused (409) at a college with no LAW stream; the read says
 *   whether the college offers it.
 *
 * Every door asks for its roles first and then the college and the module, so
 * the wrong role is a 403 before anything is parsed. Every write is audited
 * with what changed, never a name.
 */

type Tx = typeof db;
type Caller = { schoolId: string; userId: string; membershipId: string; role: Role; timeZone: string };
type LabDivision = z.infer<typeof labDivisionSchema>;

const nameOf = (u: { name: string; preferredName: string | null }) => u.preferredName ?? u.name;
const BATCH_NAMES = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

export async function recordsCaller(ctx: ActiveContext, roles: readonly Role[], module: SchoolModuleCode = "ACADEMICS"): Promise<Caller> {
  if (!ctx.schoolId || !ctx.membershipId || !ctx.role || !roles.includes(ctx.role)) throw new AccessError("access.wrongRoleForThisAction");
  await assertCollege(ctx.schoolId);
  await assertModuleOn(ctx.schoolId, module);
  const school = await db.school.findUniqueOrThrow({ where: { id: ctx.schoolId }, select: { timezone: true } });
  return { schoolId: ctx.schoolId, userId: ctx.user.id, membershipId: ctx.membershipId, role: ctx.role, timeZone: school.timezone };
}

/** Whether a college's streams keep labs: those that offer a lab in-charge (DUTY_STREAMS.LAB_INCHARGE). */
export function labStreams(streams: readonly StreamCode[]): boolean {
  const offering = DUTY_STREAMS.LAB_INCHARGE;
  return streams.some((s) => offering === "ALL" || offering.includes(s));
}

/** The academic year today falls in, by the college's clock (June onwards). */
export function currentRecordsYear(timeZone: string, now: Date = new Date()): number {
  return academicYearOf(todayKey(timeZone, now));
}

/* ------------------------------------------------------------ lab batches */

/**
 * Divisions of the college (or one) with their students — the seats in the
 * division, by roll number — and their batches. The roll number is the
 * division's class enrolment's.
 */
export async function labDivisions(schoolId: string, divisionId?: string): Promise<LabDivision[]> {
  const divisions = await db.division.findMany({
    where: { schoolId, ...(divisionId ? { id: divisionId } : {}) },
    orderBy: [{ academicYear: "desc" }, { yearOfStudy: "asc" }],
    take: 200,
    select: { id: true, academicYear: true, yearOfStudy: true, classId: true, programme: { select: { code: true } }, class: { select: { name: true } }, labBatches: { orderBy: { name: "asc" }, select: { id: true, name: true, capacity: true, members: { select: { studentMembershipId: true } } } } },
  });
  if (!divisions.length) return [];
  const [seats, rolls] = await Promise.all([
    db.studentProgramme.findMany({ where: { schoolId, status: "ACTIVE", divisionId: { in: divisions.map((d) => d.id) } }, select: { studentMembershipId: true, divisionId: true, student: { select: { user: { select: { name: true, preferredName: true } } } } } }),
    db.enrollment.findMany({ where: { schoolId, status: "ACTIVE", classId: { in: divisions.map((d) => d.classId) } }, select: { classId: true, studentMembershipId: true, rollNumber: true } }),
  ]);
  const rollBy = new Map(rolls.map((r) => [`${r.classId}|${r.studentMembershipId}`, r.rollNumber]));
  return divisions.map((d) => {
    const people = seats
      .filter((s) => s.divisionId === d.id)
      .map((s) => ({ studentMembershipId: s.studentMembershipId, name: nameOf(s.student.user), rollNumber: rollBy.get(`${d.classId}|${s.studentMembershipId}`) ?? null }))
      .sort((a, b) => (a.rollNumber ?? 9999) - (b.rollNumber ?? 9999) || a.name.localeCompare(b.name));
    const byId = new Map(people.map((p) => [p.studentMembershipId, p]));
    const inBatch = new Set(d.labBatches.flatMap((b) => b.members.map((m) => m.studentMembershipId)));
    return {
      divisionId: d.id,
      name: d.class.name,
      programmeCode: d.programme.code,
      yearOfStudy: d.yearOfStudy,
      academicYear: d.academicYear,
      students: people.length,
      batches: d.labBatches.map((b) => ({ id: b.id, name: b.name, capacity: b.capacity, members: b.members.map((m) => byId.get(m.studentMembershipId)).filter((x): x is NonNullable<typeof x> => Boolean(x)) })),
      unbatched: people.filter((p) => !inBatch.has(p.studentMembershipId)),
    };
  });
}

export async function labBatches(ctx: ActiveContext, query: { divisionId?: string } = {}): Promise<LabBatches> {
  const c = await recordsCaller(ctx, ["ADMIN", "PRINCIPAL", "HOD", "FACULTY"]);
  return { offered: labStreams(await streamsOf(c.schoolId)), defaultSize: LAB_BATCH_DEFAULT_SIZE, canEdit: c.role === "ADMIN", divisions: await labDivisions(c.schoolId, query.divisionId) };
}

/** Sizes of `n` batches sharing `count` students as evenly as can be: the first ones one larger. */
export function evenSplit(count: number, size: number): number[] {
  if (count <= 0) return [];
  const n = Math.max(1, Math.ceil(count / Math.max(1, size)));
  const base = Math.floor(count / n);
  const extra = count % n;
  return Array.from({ length: n }, (_, i) => base + (i < extra ? 1 : 0));
}

/** The office splits a division evenly into batches by roll number (re-splitting re-files everyone; a batch whose name is no longer used is removed, and a timetable hour naming it falls back to the whole division). */
export async function splitLabBatches(ctx: ActiveContext, input: { divisionId: string; size?: number }): Promise<LabBatches> {
  const c = await recordsCaller(ctx, ["ADMIN"]);
  if (!labStreams(await streamsOf(c.schoolId))) throw new RuleRefusal("streamRecords.refuseNoLabs", 409);
  const size = input.size ?? LAB_BATCH_DEFAULT_SIZE;
  const [division] = await labDivisions(c.schoolId, input.divisionId);
  if (!division || division.divisionId !== input.divisionId) throw new RuleRefusal("streamRecords.refuseUnknownDivision", 422, undefined, "divisionId");
  const people = [...division.batches.flatMap((b) => b.members), ...division.unbatched].sort((a, b) => (a.rollNumber ?? 9999) - (b.rollNumber ?? 9999) || a.name.localeCompare(b.name));
  if (!people.length) throw new RuleRefusal("streamRecords.refuseEmptyDivision", 409);
  const sizes = evenSplit(people.length, size);
  if (sizes.length > BATCH_NAMES.length) throw new RuleRefusal("streamRecords.refuseTooManyBatches", 422, undefined, "size");
  const names = sizes.map((_, i) => BATCH_NAMES[i]!);
  await db.$tenantTransaction(async (raw) => {
    const tx = raw as Tx;
    await tx.labBatch.deleteMany({ where: { divisionId: division.divisionId, name: { notIn: names } } });
    await tx.labBatchMember.deleteMany({ where: { divisionId: division.divisionId } });
    let at = 0;
    for (const [i, name] of names.entries()) {
      const batch = await tx.labBatch.upsert({ where: { divisionId_name: { divisionId: division.divisionId, name } }, create: { schoolId: c.schoolId, divisionId: division.divisionId, name, capacity: size }, update: { capacity: size }, select: { id: true } });
      const slice = people.slice(at, at + sizes[i]!);
      at += sizes[i]!;
      await tx.labBatchMember.createMany({ data: slice.map((p) => ({ schoolId: c.schoolId, batchId: batch.id, divisionId: division.divisionId, studentMembershipId: p.studentMembershipId })) });
    }
  });
  await audit({ schoolId: c.schoolId, actorUserId: c.userId, action: "streamRecords.labBatches.split", targetType: "Division", targetId: division.divisionId, meta: { batches: names.length, size, students: people.length } });
  return labBatches(ctx, { divisionId: division.divisionId });
}

/** The office moves some of a division's students into one of its batches (out of whichever batch of the division they were in). */
export async function moveToLabBatch(ctx: ActiveContext, batchId: string, studentMembershipIds: readonly string[]): Promise<LabBatches> {
  const c = await recordsCaller(ctx, ["ADMIN"]);
  const batch = await db.labBatch.findFirst({ where: { id: batchId, schoolId: c.schoolId }, select: { id: true, divisionId: true } });
  if (!batch) throw new AccessError("access.entryNotFound", "NOT_FOUND");
  const ids = [...new Set(studentMembershipIds)];
  const seated = await db.studentProgramme.count({ where: { schoolId: c.schoolId, status: "ACTIVE", divisionId: batch.divisionId, studentMembershipId: { in: ids } } });
  if (seated !== ids.length) throw new RuleRefusal("streamRecords.refuseNotInDivision", 422, undefined, "studentMembershipIds");
  await db.$tenantTransaction(async (raw) => {
    const tx = raw as Tx;
    await tx.labBatchMember.deleteMany({ where: { divisionId: batch.divisionId, studentMembershipId: { in: ids } } });
    await tx.labBatchMember.createMany({ data: ids.map((id) => ({ schoolId: c.schoolId, batchId: batch.id, divisionId: batch.divisionId, studentMembershipId: id })) });
  });
  await audit({ schoolId: c.schoolId, actorUserId: c.userId, action: "streamRecords.labBatches.move", targetType: "LabBatch", targetId: batch.id, meta: { students: ids.length } });
  return labBatches(ctx, { divisionId: batch.divisionId });
}

/** The members of a lab batch, for a lecture that names it (academics-attendance.ts). */
export async function batchMemberIds(batchId: string): Promise<Set<string>> {
  const rows = await db.labBatchMember.findMany({ where: { batchId }, select: { studentMembershipId: true } });
  return new Set(rows.map((r) => r.studentMembershipId));
}

/* ------------------------------------------------------ practical record */

type OfferingFacts = { id: string; facultyMembershipId: string | null; divisionId: string | null; practicalHours: number; departmentId: string; course: { code: string; name: string; creditsP: number } };

const OFFERING_SELECT = { id: true, facultyMembershipId: true, divisionId: true, practicalHours: true, course: { select: { code: true, name: true, creditsP: true, scheme: { select: { programme: { select: { departmentId: true } } } } } } } as const;
const toFacts = (o: { id: string; facultyMembershipId: string | null; divisionId: string | null; practicalHours: number; course: { code: string; name: string; creditsP: number; scheme: { programme: { departmentId: string } } } }): OfferingFacts => ({ id: o.id, facultyMembershipId: o.facultyMembershipId, divisionId: o.divisionId, practicalHours: o.practicalHours, departmentId: o.course.scheme.programme.departmentId, course: { code: o.course.code, name: o.course.name, creditsP: o.course.creditsP } });

async function hodDepartmentId(c: Caller): Promise<string | null> {
  if (c.role !== "HOD") return null;
  return (await db.department.findFirst({ where: { schoolId: c.schoolId, hodMembershipId: c.membershipId }, select: { id: true } }))?.id ?? null;
}

/** Who may write an offering's record: its teacher, or the HOD of its department. */
function writes(c: Caller, o: OfferingFacts, hodDept: string | null): boolean {
  return (c.role === "FACULTY" || c.role === "HOD") && (o.facultyMembershipId === c.membershipId || (hodDept !== null && o.departmentId === hodDept));
}

export async function practicalSheet(ctx: ActiveContext, query: { offeringId?: string } = {}): Promise<PracticalSheet> {
  const c = await recordsCaller(ctx, ["FACULTY", "HOD", "ADMIN", "PRINCIPAL"]);
  const [duties, hodDept] = await Promise.all([myDuties(ctx), hodDepartmentId(c)]);
  const labIncharge = duties.includes("LAB_INCHARGE");
  const office = c.role === "ADMIN" || c.role === "PRINCIPAL";
  const lab = { OR: [{ practicalHours: { gt: 0 } }, { course: { creditsP: { gt: 0 } } }] };
  const scope = office || labIncharge ? {} : { OR: [{ facultyMembershipId: c.membershipId }, ...(hodDept ? [{ course: { scheme: { programme: { departmentId: hodDept } } } }] : [])] };
  const rows = await db.courseOffering.findMany({ where: { schoolId: c.schoolId, AND: [lab, scope] }, orderBy: [{ term: { startsOn: "desc" } }, { course: { code: "asc" } }], take: 200, select: OFFERING_SELECT });
  const offerings = rows.map(toFacts);
  const [faculty, divisions] = await Promise.all([
    db.membership.findMany({ where: { id: { in: offerings.map((o) => o.facultyMembershipId).filter((x): x is string => Boolean(x)) } }, select: { id: true, user: { select: { name: true, preferredName: true } } } }),
    db.division.findMany({ where: { id: { in: offerings.map((o) => o.divisionId).filter((x): x is string => Boolean(x)) } }, select: { id: true, class: { select: { name: true } } } }),
  ]);
  const facultyName = new Map(faculty.map((f) => [f.id, nameOf(f.user)]));
  const divisionName = new Map(divisions.map((d) => [d.id, d.class.name]));
  const chosen = offerings.find((o) => o.id === query.offeringId) ?? offerings.find((o) => o.facultyMembershipId === c.membershipId) ?? offerings[0] ?? null;
  if (query.offeringId && chosen?.id !== query.offeringId) throw new AccessError("streamRecords.refuseNotYourOffering");
  const list = offerings.map((o) => ({ offeringId: o.id, courseCode: o.course.code, courseName: o.course.name, divisionName: o.divisionId ? (divisionName.get(o.divisionId) ?? null) : null, facultyName: o.facultyMembershipId ? (facultyName.get(o.facultyMembershipId) ?? null) : null, practicalHours: o.practicalHours, mine: o.facultyMembershipId === c.membershipId }));
  if (!chosen) return { offerings: list, offeringId: null, students: [], records: [], canWrite: false, canSign: false };
  const [regs, records, batches] = await Promise.all([
    db.courseRegistration.findMany({ where: { offeringId: chosen.id, status: "REGISTERED" }, select: { studentMembershipId: true, student: { select: { user: { select: { name: true, preferredName: true } }, enrollments: { where: { status: "ACTIVE", class: { division: { isNot: null } } }, select: { rollNumber: true, class: { select: { division: { select: { id: true } } } } } } } } } }),
    db.practicalRecord.findMany({ where: { offeringId: chosen.id }, orderBy: [{ experimentNo: "asc" }, { performedOn: "asc" }] }),
    chosen.divisionId ? db.labBatchMember.findMany({ where: { divisionId: chosen.divisionId }, select: { studentMembershipId: true, batch: { select: { name: true } } } }) : Promise.resolve([]),
  ]);
  const batchOf = new Map(batches.map((b) => [b.studentMembershipId, b.batch.name]));
  const students = regs
    .map((r) => ({ studentMembershipId: r.studentMembershipId, name: nameOf(r.student.user), rollNumber: r.student.enrollments.find((e) => !chosen.divisionId || e.class.division?.id === chosen.divisionId)?.rollNumber ?? null, batchName: batchOf.get(r.studentMembershipId) ?? null }))
    .sort((a, b) => (a.rollNumber ?? 9999) - (b.rollNumber ?? 9999) || a.name.localeCompare(b.name));
  const studentName = new Map(students.map((s) => [s.studentMembershipId, s.name]));
  const signers = await db.membership.findMany({ where: { id: { in: records.map((r) => r.signedByMembershipId).filter((x): x is string => Boolean(x)) } }, select: { id: true, user: { select: { name: true, preferredName: true } } } });
  const signerName = new Map(signers.map((s) => [s.id, nameOf(s.user)]));
  const canWrite = writes(c, chosen, hodDept);
  return {
    offerings: list,
    offeringId: chosen.id,
    students,
    records: records.map((r) => ({ id: r.id, studentMembershipId: r.studentMembershipId, studentName: studentName.get(r.studentMembershipId) ?? "", experimentNo: r.experimentNo, title: r.title, performedOn: r.performedOn, marks: r.marks, signed: Boolean(r.signedAt), signedByName: r.signedByMembershipId ? (signerName.get(r.signedByMembershipId) ?? null) : null, signedAt: r.signedAt?.toISOString() ?? null })),
    canWrite,
    canSign: canWrite || (labIncharge && (c.role === "FACULTY" || c.role === "HOD")),
  };
}

/** One experiment for some of an offering's students: written (or re-written, while unsigned) by the offering's teacher or its department's HOD. */
export async function savePracticals(ctx: ActiveContext, input: { offeringId: string; experimentNo: number; title: string; performedOn: string; entries: { studentMembershipId: string; marks: number | null }[] }): Promise<{ count: number }> {
  const c = await recordsCaller(ctx, ["FACULTY", "HOD"]);
  const row = await db.courseOffering.findFirst({ where: { id: input.offeringId, schoolId: c.schoolId }, select: OFFERING_SELECT });
  if (!row) throw new AccessError("access.entryNotFound", "NOT_FOUND");
  const offering = toFacts(row);
  if (!writes(c, offering, await hodDepartmentId(c))) throw new AccessError("streamRecords.refuseNotYourOffering");
  if (input.performedOn > todayKey(c.timeZone)) throw new RuleRefusal("streamRecords.refuseFutureDay", 422, undefined, "performedOn");
  const marks = new Map(input.entries.map((e) => [e.studentMembershipId, e.marks]));
  const ids = [...marks.keys()];
  const registered = await db.courseRegistration.count({ where: { offeringId: offering.id, status: "REGISTERED", studentMembershipId: { in: ids } } });
  if (registered !== ids.length) throw new RuleRefusal("streamRecords.refuseNotRegistered", 422, undefined, "entries");
  const count = await db.$tenantTransaction(async (raw) => {
    const tx = raw as Tx;
    const signed = await tx.practicalRecord.count({ where: { offeringId: offering.id, experimentNo: input.experimentNo, studentMembershipId: { in: ids }, signedAt: { not: null } } });
    if (signed) throw new RuleRefusal("streamRecords.refuseSigned", 409);
    for (const id of ids) {
      const data = { title: input.title.trim(), performedOn: input.performedOn, marks: marks.get(id) ?? null };
      await tx.practicalRecord.upsert({ where: { offeringId_studentMembershipId_experimentNo: { offeringId: offering.id, studentMembershipId: id, experimentNo: input.experimentNo } }, create: { schoolId: c.schoolId, offeringId: offering.id, studentMembershipId: id, experimentNo: input.experimentNo, createdByUserId: c.userId, ...data }, update: data });
    }
    return ids.length;
  });
  await audit({ schoolId: c.schoolId, actorUserId: c.userId, action: "streamRecords.practical.save", targetType: "CourseOffering", targetId: offering.id, meta: { experimentNo: input.experimentNo, entries: count } });
  return { count };
}

/** Rows signed by the offering's teacher, its department's HOD, or a member holding LAB_INCHARGE; already-signed rows are left as they are. */
export async function signPracticals(ctx: ActiveContext, recordIds: readonly string[]): Promise<{ count: number }> {
  const c = await recordsCaller(ctx, ["FACULTY", "HOD"]);
  const ids = [...new Set(recordIds)];
  const rows = await db.practicalRecord.findMany({ where: { id: { in: ids }, schoolId: c.schoolId }, select: { id: true, offering: { select: OFFERING_SELECT } } });
  if (rows.length !== ids.length) throw new AccessError("access.entryNotFound", "NOT_FOUND");
  const labIncharge = (await myDuties(ctx)).includes("LAB_INCHARGE");
  if (!labIncharge) {
    const hodDept = await hodDepartmentId(c);
    if (rows.some((r) => !writes(c, toFacts(r.offering), hodDept))) throw new AccessError("streamRecords.refuseNotYourOffering");
  }
  const done = await db.practicalRecord.updateMany({ where: { id: { in: ids }, schoolId: c.schoolId, signedAt: null }, data: { signedAt: new Date(), signedByMembershipId: c.membershipId } });
  if (done.count) await audit({ schoolId: c.schoolId, actorUserId: c.userId, action: "streamRecords.practical.sign", targetType: "PracticalRecord", targetId: ids[0]!, meta: { count: done.count, asLabIncharge: labIncharge } });
  return { count: done.count };
}

/* ------------------------------------------------------------ moot courts */

type MootCourts = z.infer<typeof mootCourtsSchema>;
type Team = { name: string; membershipIds: string[]; outcome: string };

/** The college's law students (ACTIVE seats on a LAW programme), or — at a college whose programmes carry no stream — every active student. */
async function lawStudents(schoolId: string): Promise<{ membershipId: string; name: string }[]> {
  const law = await db.studentProgramme.findMany({ where: { schoolId, status: "ACTIVE", programme: { stream: "LAW" } }, select: { studentMembershipId: true, student: { select: { user: { select: { name: true, preferredName: true } } } } } });
  if (law.length) return law.map((s) => ({ membershipId: s.studentMembershipId, name: nameOf(s.student.user) })).sort((a, b) => a.name.localeCompare(b.name));
  const all = await db.membership.findMany({ where: { schoolId, role: "STUDENT", status: "ACTIVE", leftAt: null }, take: 1000, select: { id: true, user: { select: { name: true, preferredName: true } } } });
  return all.map((m) => ({ membershipId: m.id, name: nameOf(m.user) })).sort((a, b) => a.name.localeCompare(b.name));
}

export async function mootCourts(ctx: ActiveContext): Promise<MootCourts> {
  const c = await recordsCaller(ctx, ["ADMIN", "PRINCIPAL", "HOD", "FACULTY"]);
  const offered = (await streamsOf(c.schoolId)).includes("LAW");
  const rows = await db.mootCourt.findMany({ where: { schoolId: c.schoolId }, orderBy: { at: "desc" }, take: 200 });
  const ids = rows.flatMap((r) => readJsonArray<Team>(r.teamsJson).flatMap((t) => t.membershipIds ?? []));
  const people = ids.length ? await db.membership.findMany({ where: { id: { in: [...new Set(ids)] } }, select: { id: true, user: { select: { name: true, preferredName: true } } } }) : [];
  const name = new Map(people.map((p) => [p.id, nameOf(p.user)]));
  return {
    offered,
    canEdit: offered && c.role !== "PRINCIPAL",
    items: rows.map((r) => ({ id: r.id, name: r.name, at: r.at, kind: r.kind as "INTRA", result: r.result, judgeNotes: r.judgeNotes, teams: readJsonArray<Team>(r.teamsJson).map((t) => ({ name: t.name, outcome: t.outcome as "WINNER", members: (t.membershipIds ?? []).map((id) => ({ membershipId: id, name: name.get(id) ?? "" })) })) })),
    students: offered && c.role !== "PRINCIPAL" ? await lawStudents(c.schoolId) : [],
  };
}

/** A moot recorded (or corrected, by its id): the office, an HOD or a faculty member, at a college with LAW; every team member a student of the college. */
export async function saveMootCourt(ctx: ActiveContext, input: MootCourtSave): Promise<{ id: string }> {
  const c = await recordsCaller(ctx, ["ADMIN", "HOD", "FACULTY"]);
  if (!(await streamsOf(c.schoolId)).includes("LAW")) throw new RuleRefusal("streamRecords.refuseNotLaw", 409);
  const ids = [...new Set(input.teams.flatMap((t) => t.membershipIds))];
  if (ids.length) {
    const students = await db.membership.count({ where: { id: { in: ids }, schoolId: c.schoolId, role: "STUDENT" } });
    if (students !== ids.length) throw new RuleRefusal("streamRecords.refuseTeamMember", 422, undefined, "teams");
  }
  const data = { name: input.name.trim(), at: input.at, kind: input.kind, teamsJson: JSON.stringify(input.teams.map((t) => ({ name: t.name.trim(), membershipIds: [...new Set(t.membershipIds)], outcome: t.outcome }))), result: input.result.trim(), judgeNotes: input.judgeNotes.trim() };
  let id = input.id;
  if (id) {
    const done = await db.mootCourt.updateMany({ where: { id, schoolId: c.schoolId }, data });
    if (!done.count) throw new AccessError("access.entryNotFound", "NOT_FOUND");
  } else id = (await db.mootCourt.create({ data: { schoolId: c.schoolId, createdByUserId: c.userId, ...data }, select: { id: true } })).id;
  await audit({ schoolId: c.schoolId, actorUserId: c.userId, action: "streamRecords.moot.save", targetType: "MootCourt", targetId: id, meta: { kind: input.kind, teams: input.teams.length, edit: Boolean(input.id) } });
  return { id };
}

/* ------------------------------------------------------------- summaries */

function yearOrCurrent(year: number | undefined, c: Caller): number {
  return year ?? currentRecordsYear(c.timeZone);
}

/** GET /api/v1/stream-records/law-internships — the BCI's weeks per law student and the year's moots: the office, the head, an HOD and the placement cell. */
export async function lawInternships(ctx: ActiveContext, year?: number) {
  const c = await recordsCaller(ctx, ["ADMIN", "PRINCIPAL", "HOD", "TPO"], "PLACEMENT");
  return lawInternshipSummary(c.schoolId, yearOrCurrent(year, c));
}

/** GET /api/v1/stream-records/summary — every summary of a year for the office and the head, with which of the college's streams make each its own. */
export async function streamRecordsSummary(ctx: ActiveContext, year?: number): Promise<StreamRecordsSummary> {
  const c = await recordsCaller(ctx, ["ADMIN", "PRINCIPAL"]);
  const y = yearOrCurrent(year, c);
  const streams = await streamsOf(c.schoolId);
  const [practical, lawInternshipsRow, teachingPractice, corps] = await Promise.all([practicalRecordSummary(c.schoolId, y), lawInternshipSummary(c.schoolId, y), teachingPracticeSummary(c.schoolId, y), nssSummary(c.schoolId, y)]);
  return { year: y, streams, labs: labStreams(streams), law: streams.includes("LAW"), education: streams.includes("EDUCATION"), practical, lawInternships: lawInternshipsRow, teachingPractice, corps };
}
