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
import type { Prisma } from "@prisma/client";
import { db } from "./db";
import { AccessError } from "./access-error";
import { RuleRefusal } from "./rule-refusal";
import { audit } from "./audit";
import { assertCollege, assertModuleOn } from "./modules";
import { streamsOf } from "./streams";
import { myDuties } from "./duties";
import { addDaysToKey, todayKey } from "./dates";
import { readJsonArray } from "./json";
import type { ActiveContext } from "./session";
import type { Role } from "./constants";
import type { SchoolModuleCode } from "@edulink/contracts";
import { lawInternshipSummary, nssSummary, practicalRecordSummary, teachingPracticeSummary } from "./stream-summaries";
import { SEATED_NOW } from "./academics";

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
 *   MEMBERSHIP IS DATED (S4B-0, 5 Oct 2026). A re-split or a move used to
 *   rewrite the rows, so a past LAB lecture of batch A listed today's A: a
 *   student moved to B vanished from the sheets of the labs they sat (their
 *   marks still counted, unseen and uncorrectable) and a student moved in
 *   appeared on labs held before they came. Now a change takes effect on a
 *   day (`effectiveFrom`): today, or the day after the division's latest
 *   marked batch lecture when that is today; a changed row is closed the day
 *   before and a new one opened (`refile`), a row that had not begun yet is
 *   replaced. Until a batch lecture of the division has marks, the rows are
 *   rewritten whole, as before (setting the batches up is not history). A
 *   lecture reads the batch on its own day (`memberOn`, `holdsOn`); the office's
 *   page, the practical sheet and the timetable read the open rows. A batch a
 *   re-split no longer names is kept while a marked lecture names it (its slots fall
 *   back to the whole division) and removed otherwise. Refusing a re-split
 *   once a batch had a marked lecture was the other way; it would have stopped
 *   the even semester's re-batching and every move after the first lab.
 *
 *   THE PRACTICAL RECORD. The offering's teacher (or the HOD of its
 *   department) writes each experiment a student performed and its marks;
 *   that teacher or a member holding LAB_INCHARGE signs; a signed row is not
 *   changed again. The office and the head read.
 *
 *   MOOT COURTS (a law college's): the office, an HOD or a faculty member
 *   records one with its teams, their outcome, the result and the judges'
 *   notes; a correction is the office's, its author's or the law
 *   department's HOD's. Refused (409) at a college with no LAW stream; the
 *   read says whether the college offers it.
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

/** A batch row that holds on a day: opened on or before it ("" is since the batch began), not closed before it. */
export const memberOn = (dateKey: string) => ({ fromKey: { lte: dateKey }, OR: [{ untilKey: null }, { untilKey: { gte: dateKey } }] });
export const holdsOn = (m: { fromKey: string; untilKey: string | null }, dateKey: string): boolean => m.fromKey <= dateKey && (m.untilKey === null || m.untilKey >= dateKey);

/**
 * The day a change to a division's batches takes effect. "" (since the start:
 * the rows are rewritten) while no batch lecture of the division has marks;
 * after that today by the college's clock, or the day after the latest marked
 * one when that is today — a marked lecture keeps the roster it was marked on.
 */
async function effectiveFrom(divisionId: string, timeZone: string): Promise<string> {
  const last = await db.lecture.findFirst({ where: { labBatch: { divisionId }, attendance: { some: {} } }, orderBy: { dateKey: "desc" }, select: { dateKey: true } });
  return dayAfterMarked(last?.dateKey ?? null, todayKey(timeZone));
}

/** The rule of `effectiveFrom` on its facts: "" with nothing marked, else today or the day after the last marked lecture, whichever is later. */
export function dayAfterMarked(lastMarked: string | null, today: string): string {
  if (!lastMarked) return "";
  const after = addDaysToKey(lastMarked, 1);
  return after > today ? after : today;
}

/** Divisions with the day a change made now takes effect (R-24): the office's page and the lab in-charge's desk read the same field. */
export async function withChangesFrom<D extends { divisionId: string }>(divisions: D[], schoolId: string): Promise<(D & { changesFrom: string | null })[]> {
  const zone = (await db.school.findUnique({ where: { id: schoolId }, select: { timezone: true } }))?.timezone ?? "Asia/Kolkata";
  const from = await changesFromOf(divisions.map((d) => d.divisionId), zone);
  return divisions.map((d) => ({ ...d, changesFrom: from.get(d.divisionId) || null }));
}

/** `effectiveFrom` for many divisions in one read (R-24): divisionId → the day a change made now takes effect ("" from the start). */
async function changesFromOf(divisionIds: string[], timeZone: string): Promise<Map<string, string>> {
  const today = todayKey(timeZone);
  const marked = divisionIds.length ? await db.lecture.findMany({ where: { labBatch: { divisionId: { in: divisionIds } }, attendance: { some: {} } }, orderBy: { dateKey: "desc" }, distinct: ["labBatchId"], select: { dateKey: true, labBatch: { select: { divisionId: true } } } }) : [];
  const last = new Map<string, string>();
  for (const l of marked) {
    const d = l.labBatch?.divisionId;
    if (d && (!last.has(d) || last.get(d)! < l.dateKey)) last.set(d, l.dateKey);
  }
  return new Map(divisionIds.map((id) => [id, dayAfterMarked(last.get(id) ?? null, today)]));
}

/**
 * Files the division's students as `want` (student → batch id) from `from` on,
 * the one writer of the rows' dates: an open row that already says so stays; a
 * changed one closes the day before `from` (or goes, if it begins on or after
 * it); the new row opens on `from`. With `wholeDivision`, an open row of a
 * student `want` does not name (no longer seated in the division) closes too.
 */
async function refile(tx: Tx, schoolId: string, divisionId: string, want: Map<string, string>, from: string, wholeDivision: boolean): Promise<void> {
  const whose = wholeDivision ? {} : { studentMembershipId: { in: [...want.keys()] } };
  // Closed rows that begin on or after `from` hold no day any more (and, with "", nothing is marked: no history to keep).
  await tx.labBatchMember.deleteMany({ where: { divisionId, ...whose, untilKey: { not: null }, fromKey: { gte: from } } });
  const open = await tx.labBatchMember.findMany({ where: { divisionId, untilKey: null, ...whose }, select: { id: true, batchId: true, fromKey: true, studentMembershipId: true } });
  const changed = open.filter((r) => want.get(r.studentMembershipId) !== r.batchId);
  const close = changed.filter((r) => r.fromKey < from).map((r) => r.id);
  const drop = changed.filter((r) => r.fromKey >= from).map((r) => r.id);
  if (close.length) await tx.labBatchMember.updateMany({ where: { id: { in: close } }, data: { untilKey: addDaysToKey(from, -1) } });
  if (drop.length) await tx.labBatchMember.deleteMany({ where: { id: { in: drop } } });
  const kept = new Set(open.filter((r) => want.get(r.studentMembershipId) === r.batchId).map((r) => r.studentMembershipId));
  const fresh = [...want].filter(([student]) => !kept.has(student));
  if (fresh.length) await tx.labBatchMember.createMany({ data: fresh.map(([student, batchId]) => ({ schoolId, batchId, divisionId, studentMembershipId: student, fromKey: from })) });
}

/**
 * Divisions of the college (or one) with their students — the seats in the
 * division, by roll number — and their batches. The roll number is the
 * division's class enrolment's.
 */
export async function labDivisions(schoolId: string, divisionId?: string, scope: Prisma.DivisionWhereInput = {}): Promise<LabDivision[]> {
  const divisions = await db.division.findMany({
    where: { schoolId, ...(divisionId ? { id: divisionId } : {}), ...scope },
    orderBy: [{ academicYear: "desc" }, { yearOfStudy: "asc" }],
    take: 200,
    select: { id: true, academicYear: true, yearOfStudy: true, classId: true, programme: { select: { code: true } }, class: { select: { name: true } }, labBatches: { orderBy: { name: "asc" }, select: { id: true, name: true, capacity: true, members: { where: { untilKey: null }, select: { studentMembershipId: true } }, _count: { select: { slots: true } } } } },
  });
  if (!divisions.length) return [];
  const [seats, rolls] = await Promise.all([
    db.studentProgramme.findMany({ where: { schoolId, ...SEATED_NOW, divisionId: { in: divisions.map((d) => d.id) } }, select: { studentMembershipId: true, divisionId: true, student: { select: { user: { select: { name: true, preferredName: true } } } } } }),
    db.enrollment.findMany({ where: { schoolId, status: "ACTIVE", classId: { in: divisions.map((d) => d.classId) } }, select: { classId: true, studentMembershipId: true, rollNumber: true } }),
  ]);
  const rollBy = new Map(rolls.map((r) => [`${r.classId}|${r.studentMembershipId}`, r.rollNumber]));
  return divisions.map((d) => {
    const people = seats
      .filter((s) => s.divisionId === d.id)
      .map((s) => ({ studentMembershipId: s.studentMembershipId, name: nameOf(s.student.user), rollNumber: rollBy.get(`${d.classId}|${s.studentMembershipId}`) ?? null }))
      .sort((a, b) => (a.rollNumber ?? 9999) - (b.rollNumber ?? 9999) || a.name.localeCompare(b.name));
    // A batch a re-split retired (kept for its past lectures: no open member and no timetable hour) is not shown.
    const shown = d.labBatches.filter((b) => b.members.length > 0 || b._count.slots > 0);
    const inBatch = new Set(shown.flatMap((b) => b.members.map((m) => m.studentMembershipId)));
    return {
      divisionId: d.id,
      name: d.class.name,
      programmeCode: d.programme.code,
      yearOfStudy: d.yearOfStudy,
      academicYear: d.academicYear,
      students: people.length,
      batches: shown.map((b) => ({ id: b.id, name: b.name, capacity: b.capacity, members: people.filter((p) => b.members.some((m) => m.studentMembershipId === p.studentMembershipId)) })),
      unbatched: people.filter((p) => !inBatch.has(p.studentMembershipId)),
    };
  });
}

/**
 * The divisions a reader of the batches sees (A3-S-11, audit of 5 Oct 2026):
 * the office and the head the whole college; a FACULTY the divisions they
 * teach an offering in; an HOD those and every division of a programme of a
 * department they head. The batches carry the students' names, which a
 * teacher of another department has no reason to read.
 */
async function labScope(c: Caller): Promise<Prisma.DivisionWhereInput> {
  if (c.role === "ADMIN" || c.role === "PRINCIPAL") return {};
  const [taught, headed] = await Promise.all([
    db.courseOffering.findMany({ where: { schoolId: c.schoolId, facultyMembershipId: c.membershipId, divisionId: { not: null } }, select: { divisionId: true } }),
    c.role === "HOD" ? hodDepartmentIds(c) : Promise.resolve([] as string[]),
  ]);
  const own = [...new Set(taught.map((o) => o.divisionId).filter((x): x is string => Boolean(x)))];
  return { OR: [{ id: { in: own } }, ...(headed.length ? [{ programme: { departmentId: { in: headed } } }] : [])] };
}

export async function labBatches(ctx: ActiveContext, query: { divisionId?: string } = {}): Promise<LabBatches> {
  const c = await recordsCaller(ctx, ["ADMIN", "PRINCIPAL", "HOD", "FACULTY"]);
  const divisions = await labDivisions(c.schoolId, query.divisionId, await labScope(c));
  // The day a change made now would take effect, per division (R-24, risks batch 5 Oct 2026): the office is told before it acts.
  const from = await changesFromOf(divisions.map((d) => d.divisionId), c.timeZone);
  return { offered: labStreams(await streamsOf(c.schoolId)), defaultSize: LAB_BATCH_DEFAULT_SIZE, canEdit: c.role === "ADMIN", divisions: divisions.map((d) => ({ ...d, changesFrom: from.get(d.divisionId) || null })) };
}

/** Sizes of `n` batches sharing `count` students as evenly as can be: the first ones one larger. */
export function evenSplit(count: number, size: number): number[] {
  if (count <= 0) return [];
  const n = Math.max(1, Math.ceil(count / Math.max(1, size)));
  const base = Math.floor(count / n);
  const extra = count % n;
  return Array.from({ length: n }, (_, i) => base + (i < extra ? 1 : 0));
}

/** The office splits a division evenly into batches by roll number (re-splitting re-files everyone from the day it takes effect; a batch whose name is no longer used is removed — or kept for its past lectures — and a timetable hour naming it falls back to the whole division). */
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
  const from = await effectiveFrom(division.divisionId, c.timeZone);
  const keptForPostings = await db.$tenantTransaction(async (raw) => {
    const tx = raw as Tx;
    const want = new Map<string, string>();
    let at = 0;
    for (const [i, name] of names.entries()) {
      const batch = await tx.labBatch.upsert({ where: { divisionId_name: { divisionId: division.divisionId, name } }, create: { schoolId: c.schoolId, divisionId: division.divisionId, name, capacity: size }, update: { capacity: size }, select: { id: true } });
      for (const p of people.slice(at, at + sizes[i]!)) want.set(p.studentMembershipId, batch.id);
      at += sizes[i]!;
    }
    await refile(tx, c.schoolId, division.divisionId, want, from, true);
    // The names no longer used: kept while a marked lecture names one (its past rosters) or a clinical posting does
    // (TA-016: the posting, and every logbook entry under it, signed ones too, cascade from the batch), its hours
    // falling back to the whole division; removed otherwise (an unmarked lecture of it then falls back to the whole
    // division too).
    const unused = await tx.labBatch.findMany({ where: { divisionId: division.divisionId, name: { notIn: names } }, select: { id: true, _count: { select: { lectures: { where: { attendance: { some: {} } } }, clinicalPostings: true } } } });
    const held = (b: (typeof unused)[number]) => b._count.lectures > 0 || b._count.clinicalPostings > 0;
    const keep = unused.filter(held).map((b) => b.id);
    if (keep.length) await tx.offeringSlot.updateMany({ where: { labBatchId: { in: keep } }, data: { labBatchId: null } });
    const remove = unused.filter((b) => !held(b)).map((b) => b.id);
    if (remove.length) await tx.labBatch.deleteMany({ where: { id: { in: remove } } });
    return unused.filter((b) => b._count.clinicalPostings > 0).length;
  });
  await audit({ schoolId: c.schoolId, actorUserId: c.userId, action: "streamRecords.labBatches.split", targetType: "Division", targetId: division.divisionId, meta: { batches: names.length, size, students: people.length, from, keptForPostings } });
  // The answer names the day the change took effect (R-24): "" (from the start) is null.
  return { ...(await labBatches(ctx, { divisionId: division.divisionId })), effectiveFrom: from || null };
}

/** The office moves some of a division's students into one of its batches (out of whichever batch of the division they were in), from the day it takes effect. */
export async function moveToLabBatch(ctx: ActiveContext, batchId: string, studentMembershipIds: readonly string[]): Promise<LabBatches> {
  const c = await recordsCaller(ctx, ["ADMIN"]);
  const batch = await db.labBatch.findFirst({ where: { id: batchId, schoolId: c.schoolId }, select: { id: true, divisionId: true } });
  if (!batch) throw new AccessError("access.entryNotFound", "NOT_FOUND");
  const ids = [...new Set(studentMembershipIds)];
  const seated = await db.studentProgramme.count({ where: { schoolId: c.schoolId, ...SEATED_NOW, divisionId: batch.divisionId, studentMembershipId: { in: ids } } });
  if (seated !== ids.length) throw new RuleRefusal("streamRecords.refuseNotInDivision", 422, undefined, "studentMembershipIds");
  const from = await effectiveFrom(batch.divisionId, c.timeZone);
  await db.$tenantTransaction(async (raw) => {
    await refile(raw as Tx, c.schoolId, batch.divisionId, new Map(ids.map((id) => [id, batch.id])), from, false);
  });
  await audit({ schoolId: c.schoolId, actorUserId: c.userId, action: "streamRecords.labBatches.move", targetType: "LabBatch", targetId: batch.id, meta: { students: ids.length, from } });
  return { ...(await labBatches(ctx, { divisionId: batch.divisionId })), effectiveFrom: from || null };
}

/** The members of a lab batch on a lecture's day, for a lecture that names it (academics-attendance.ts). */
export async function batchMemberIds(batchId: string, dateKey: string): Promise<Set<string>> {
  const rows = await db.labBatchMember.findMany({ where: { batchId, ...memberOn(dateKey) }, select: { studentMembershipId: true } });
  return new Set(rows.map((r) => r.studentMembershipId));
}

/* ------------------------------------------------------ practical record */

type OfferingFacts = { id: string; facultyMembershipId: string | null; divisionId: string | null; practicalHours: number; departmentId: string; course: { code: string; name: string; creditsP: number } };

const OFFERING_SELECT = { id: true, facultyMembershipId: true, divisionId: true, practicalHours: true, course: { select: { code: true, name: true, creditsP: true, scheme: { select: { programme: { select: { departmentId: true } } } } } } } as const;
const toFacts = (o: { id: string; facultyMembershipId: string | null; divisionId: string | null; practicalHours: number; course: { code: string; name: string; creditsP: number; scheme: { programme: { departmentId: string } } } }): OfferingFacts => ({ id: o.id, facultyMembershipId: o.facultyMembershipId, divisionId: o.divisionId, practicalHours: o.practicalHours, departmentId: o.course.scheme.programme.departmentId, course: { code: o.course.code, name: o.course.name, creditsP: o.course.creditsP } });

/** Every department an HOD heads ([] for any other role). */
async function hodDepartmentIds(c: Pick<Caller, "role" | "schoolId" | "membershipId">): Promise<string[]> {
  if (c.role !== "HOD") return [];
  return (await db.department.findMany({ where: { schoolId: c.schoolId, hodMembershipId: c.membershipId }, select: { id: true } })).map((d) => d.id);
}

/** Who may write an offering's record: its teacher, or the HOD of its department (TA-383: of any department they head). */
function writes(c: Caller, o: OfferingFacts, hodDepts: readonly string[]): boolean {
  return (c.role === "FACULTY" || c.role === "HOD") && (o.facultyMembershipId === c.membershipId || hodDepts.includes(o.departmentId));
}

/** An offering that keeps a practical record: practical hours, or practical credits on its course (the sheet's own filter). */
const keepsPracticals = (o: OfferingFacts): boolean => o.practicalHours > 0 || o.course.creditsP > 0;

export async function practicalSheet(ctx: ActiveContext, query: { offeringId?: string } = {}): Promise<PracticalSheet> {
  const c = await recordsCaller(ctx, ["FACULTY", "HOD", "ADMIN", "PRINCIPAL"]);
  const [duties, hodDepts] = await Promise.all([myDuties(ctx), hodDepartmentIds(c)]);
  const labIncharge = duties.includes("LAB_INCHARGE");
  const office = c.role === "ADMIN" || c.role === "PRINCIPAL";
  const lab = { OR: [{ practicalHours: { gt: 0 } }, { course: { creditsP: { gt: 0 } } }] };
  const scope = office || labIncharge ? {} : { OR: [{ facultyMembershipId: c.membershipId }, ...(hodDepts.length ? [{ course: { scheme: { programme: { departmentId: { in: hodDepts } } } } }] : [])] };
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
    chosen.divisionId ? db.labBatchMember.findMany({ where: { divisionId: chosen.divisionId, untilKey: null }, select: { studentMembershipId: true, batch: { select: { name: true } } } }) : Promise.resolve([]),
  ]);
  const batchOf = new Map(batches.map((b) => [b.studentMembershipId, b.batch.name]));
  const students = regs
    .map((r) => ({ studentMembershipId: r.studentMembershipId, name: nameOf(r.student.user), rollNumber: r.student.enrollments.find((e) => !chosen.divisionId || e.class.division?.id === chosen.divisionId)?.rollNumber ?? null, batchName: batchOf.get(r.studentMembershipId) ?? null }))
    .sort((a, b) => (a.rollNumber ?? 9999) - (b.rollNumber ?? 9999) || a.name.localeCompare(b.name));
  const studentName = new Map(students.map((s) => [s.studentMembershipId, s.name]));
  const signers = await db.membership.findMany({ where: { id: { in: records.map((r) => r.signedByMembershipId).filter((x): x is string => Boolean(x)) } }, select: { id: true, user: { select: { name: true, preferredName: true } } } });
  const signerName = new Map(signers.map((s) => [s.id, nameOf(s.user)]));
  const canWrite = writes(c, chosen, hodDepts);
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
  if (!writes(c, offering, await hodDepartmentIds(c))) throw new AccessError("streamRecords.refuseNotYourOffering");
  // The record is a lab course's at a college whose streams keep labs (TA-494), as the sheet and the batch split read it:
  // rows on a course with no practicals were written and then never shown, though the lab desk signed and counted them.
  if (!labStreams(await streamsOf(c.schoolId))) throw new RuleRefusal("streamRecords.refuseNoLabs", 409);
  if (!keepsPracticals(offering)) throw new RuleRefusal("streamRecords.refuseNoPracticals", 422, undefined, "offeringId");
  if (input.performedOn > todayKey(c.timeZone)) throw new RuleRefusal("streamRecords.refuseFutureDay", 422, undefined, "performedOn");
  const marks = new Map(input.entries.map((e) => [e.studentMembershipId, e.marks]));
  const ids = [...marks.keys()];
  const registered = await db.courseRegistration.count({ where: { offeringId: offering.id, status: "REGISTERED", studentMembershipId: { in: ids } } });
  if (registered !== ids.length) throw new RuleRefusal("streamRecords.refuseNotRegistered", 422, undefined, "entries");
  const count = await db.$tenantTransaction(async (raw) => {
    const tx = raw as Tx;
    // The experiment's rows are held first (TA-208): a signature landing between the count and the writes waits, and one
    // that landed before is counted, so a signed row is never rewritten.
    await tx.$queryRaw`SELECT "id" FROM "PracticalRecord" WHERE "offeringId" = ${offering.id} AND "experimentNo" = ${input.experimentNo} FOR UPDATE`;
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

/** Rows signed by the offering's teacher, its department's HOD, or a member holding LAB_INCHARGE (any department's: the in-charge signs college-wide, R-8, decided 5 Oct 2026: keep); already-signed rows are left as they are. */
export async function signPracticals(ctx: ActiveContext, recordIds: readonly string[]): Promise<{ count: number }> {
  const c = await recordsCaller(ctx, ["FACULTY", "HOD"]);
  const ids = [...new Set(recordIds)];
  const rows = await db.practicalRecord.findMany({ where: { id: { in: ids }, schoolId: c.schoolId }, select: { id: true, offering: { select: OFFERING_SELECT } } });
  if (rows.length !== ids.length) throw new AccessError("access.entryNotFound", "NOT_FOUND");
  // The same lab rule as the save (TA-494).
  if (!labStreams(await streamsOf(c.schoolId))) throw new RuleRefusal("streamRecords.refuseNoLabs", 409);
  if (rows.some((r) => !keepsPracticals(toFacts(r.offering)))) throw new RuleRefusal("streamRecords.refuseNoPracticals", 422, undefined, "recordIds");
  const labIncharge = (await myDuties(ctx)).includes("LAB_INCHARGE");
  if (!labIncharge) {
    const hodDepts = await hodDepartmentIds(c);
    if (rows.some((r) => !writes(c, toFacts(r.offering), hodDepts))) throw new AccessError("streamRecords.refuseNotYourOffering");
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
  const law = await db.studentProgramme.findMany({ where: { schoolId, ...SEATED_NOW, programme: { stream: "LAW" } }, select: { studentMembershipId: true, student: { select: { user: { select: { name: true, preferredName: true } } } } } });
  if (law.length) return law.map((s) => ({ membershipId: s.studentMembershipId, name: nameOf(s.student.user) })).sort((a, b) => a.name.localeCompare(b.name));
  const all = await db.membership.findMany({ where: { schoolId, role: "STUDENT", status: "ACTIVE", leftAt: null }, take: 1000, select: { id: true, user: { select: { name: true, preferredName: true } } } });
  return all.map((m) => ({ membershipId: m.id, name: nameOf(m.user) })).sort((a, b) => a.name.localeCompare(b.name));
}

export async function mootCourts(ctx: ActiveContext): Promise<MootCourts> {
  const c = await recordsCaller(ctx, ["ADMIN", "PRINCIPAL", "HOD", "FACULTY"]);
  const offered = (await streamsOf(c.schoolId)).includes("LAW");
  const rows = await db.mootCourt.findMany({ where: { schoolId: c.schoolId }, orderBy: { at: "desc" }, take: 200 });
  // Per moot (R-59, R-53; risks batch 5 Oct 2026): who may correct it, and whether its year's BCI return froze it.
  const [mayCorrect, filed] = await Promise.all([mootCorrector(c), bciFiledYears(c.schoolId)]);
  const ids = rows.flatMap((r) => readJsonArray<Team>(r.teamsJson).flatMap((t) => t.membershipIds ?? []));
  const people = ids.length ? await db.membership.findMany({ where: { id: { in: [...new Set(ids)] } }, select: { id: true, user: { select: { name: true, preferredName: true } } } }) : [];
  const name = new Map(people.map((p) => [p.id, nameOf(p.user)]));
  return {
    offered,
    canEdit: offered && c.role !== "PRINCIPAL",
    items: rows.map((r) => {
      const frozen = filed.has(academicYearOf(r.at));
      return { id: r.id, name: r.name, at: r.at, kind: r.kind as "INTRA", result: r.result, judgeNotes: r.judgeNotes, teams: readJsonArray<Team>(r.teamsJson).map((t) => ({ name: t.name, outcome: t.outcome as "WINNER", members: (t.membershipIds ?? []).map((id) => ({ membershipId: id, name: name.get(id) ?? "" })) })), canEdit: offered && !frozen && mayCorrect(r.createdByUserId), frozen };
    }),
    students: offered && c.role !== "PRINCIPAL" ? await lawStudents(c.schoolId) : [],
  };
}

/**
 * Who may correct a recorded moot (A3-S-10, audit of 5 Oct 2026): the office,
 * the member who recorded it, or the HOD of a department that runs a law
 * programme — where no programme of the college carries the LAW stream yet
 * (a law-only college before its programmes were tagged), any HOD. Any FACULTY
 * or HOD used to rewrite any moot by its id, and the BCI return reads them.
 */
async function mayCorrectMoot(c: Caller, createdByUserId: string | null): Promise<boolean> {
  return (await mootCorrector(c))(createdByUserId);
}

/** The same rule as a test of a moot's author, read once for a list (R-59): the office, the author, or a law department's HOD. */
async function mootCorrector(c: Caller): Promise<(createdByUserId: string | null) => boolean> {
  if (c.role === "ADMIN") return () => true;
  if (c.role !== "HOD") return (createdByUserId) => c.role !== "PRINCIPAL" && createdByUserId === c.userId;
  const lawDepartments = await db.programme.findMany({ where: { schoolId: c.schoolId, stream: "LAW" }, select: { departmentId: true } });
  const headed = lawDepartments.length ? await hodDepartmentIds(c) : [];
  const anyHod = !lawDepartments.length || lawDepartments.some((p) => headed.includes(p.departmentId));
  return (createdByUserId) => anyHod || createdByUserId === c.userId;
}

/**
 * THE MOOTS OF A FILED YEAR ARE FROZEN (R-53, risks batch 5 Oct 2026; 08's recommended option): once the BCI return
 * for an academic year has been generated (council-filings.ts reads the year's moots into it), a moot of that year —
 * by its date, the year starting in June — is neither added nor corrected, so the return and the record agree.
 */
async function bciFiledYears(schoolId: string): Promise<Set<number>> {
  const rows = await db.collegeFiling.findMany({ where: { schoolId, kind: "BCI_RETURN" }, select: { year: true }, distinct: ["year"] });
  return new Set(rows.map((r) => r.year));
}

function refuseFiledMoot(filed: Set<number>, at: string): void {
  const year = academicYearOf(at);
  if (filed.has(year)) throw new RuleRefusal("riskDecisions.refuseMootFiled", 409, { year: `${year}-${String((year + 1) % 100).padStart(2, "0")}` }, "at");
}

/** A moot recorded (or corrected, by its id): the office, an HOD or a faculty member, at a college with LAW; every team member a student of the college. A correction is the office's, its author's or the law department's HOD's. */
export async function saveMootCourt(ctx: ActiveContext, input: MootCourtSave): Promise<{ id: string }> {
  const c = await recordsCaller(ctx, ["ADMIN", "HOD", "FACULTY"]);
  if (!(await streamsOf(c.schoolId)).includes("LAW")) throw new RuleRefusal("streamRecords.refuseNotLaw", 409);
  const ids = [...new Set(input.teams.flatMap((t) => t.membershipIds))];
  if (ids.length) {
    const students = await db.membership.count({ where: { id: { in: ids }, schoolId: c.schoolId, role: "STUDENT" } });
    if (students !== ids.length) throw new RuleRefusal("streamRecords.refuseTeamMember", 422, undefined, "teams");
  }
  const data = { name: input.name.trim(), at: input.at, kind: input.kind, teamsJson: JSON.stringify(input.teams.map((t) => ({ name: t.name.trim(), membershipIds: [...new Set(t.membershipIds)], outcome: t.outcome }))), result: input.result.trim(), judgeNotes: input.judgeNotes.trim() };
  const filed = await bciFiledYears(c.schoolId);
  refuseFiledMoot(filed, input.at);
  let id = input.id;
  if (id) {
    const row = await db.mootCourt.findFirst({ where: { id, schoolId: c.schoolId }, select: { createdByUserId: true, at: true } });
    if (!row) throw new AccessError("access.entryNotFound", "NOT_FOUND");
    if (!(await mayCorrectMoot(c, row.createdByUserId))) throw new AccessError("streamRecords.refuseNotYourMoot");
    refuseFiledMoot(filed, row.at);
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

/**
 * GET /api/v1/stream-records/law-internships — the BCI's weeks per law student and the year's moots: the office, the
 * head, an HOD and the placement cell. An HOD reads the per-student weeks of their own department's programmes only
 * (A3-S-11); the college's totals stay as they are, since they name nobody.
 */
export async function lawInternships(ctx: ActiveContext, year?: number) {
  const c = await recordsCaller(ctx, ["ADMIN", "PRINCIPAL", "HOD", "TPO"], "PLACEMENT");
  const summary = await lawInternshipSummary(c.schoolId, yearOrCurrent(year, c));
  if (c.role !== "HOD") return summary;
  const headed = await hodDepartmentIds(c);
  const own = new Set((headed.length ? await db.programme.findMany({ where: { schoolId: c.schoolId, departmentId: { in: headed } }, select: { code: true } }) : []).map((p) => p.code));
  return { ...summary, perStudent: summary.perStudent.filter((s) => own.has(s.programmeCode)) };
}

/** GET /api/v1/stream-records/summary — every summary of a year for the office and the head, with which of the college's streams make each its own. */
export async function streamRecordsSummary(ctx: ActiveContext, year?: number): Promise<StreamRecordsSummary> {
  const c = await recordsCaller(ctx, ["ADMIN", "PRINCIPAL"]);
  const y = yearOrCurrent(year, c);
  const streams = await streamsOf(c.schoolId);
  const [practical, lawInternshipsRow, teachingPractice, corps] = await Promise.all([practicalRecordSummary(c.schoolId, y), lawInternshipSummary(c.schoolId, y), teachingPracticeSummary(c.schoolId, y), nssSummary(c.schoolId, y)]);
  return { year: y, streams, labs: labStreams(streams), law: streams.includes("LAW"), education: streams.includes("EDUCATION"), practical, lawInternships: lawInternshipsRow, teachingPractice, corps };
}
