import "server-only";
import type { InternalSheet } from "@edulink/contracts";
import { db } from "./db";
import { AccessError } from "./access-error";
import { RuleRefusal } from "./rule-refusal";
import { audit } from "./audit";
import { notify } from "./notify";
import { readJson, writeJson } from "./json";
import { academicsCaller, departmentOfMember, headsDepartment, nameOf, namesOf, readCodes, readOutcomes, readPassingRules, registeredStudying, type Caller } from "./academics";
import { internalTotalHundredths, parseMarks, sumWeights } from "./academics-rules";
import type { ActiveContext } from "./session";

/**
 * INTERNAL ASSESSMENT (the college's academics, 4 October 2026).
 *
 * An offering's internal marks are components — unit tests, assignments,
 * practicals, a viva, a project — each with its maximum and its WEIGHT, the
 * marks it contributes to the scheme's internal total
 * (passingRules.internalMax); the weights must add to exactly that before
 * the marks can be locked. The faculty member enters marks (by hand or from
 * a pasted sheet of roll numbers or student codes); a SECOND member of the
 * department — not the one who teaches it, not anyone who entered its marks
 * — countersigns a component; only then may the HOD release it to the
 * students; and the HOD locks the offering, which freezes every student's
 * total into InternalLock. After the lock every change is refused 409.
 *
 * A change to marks after the countersign takes the countersign away (the
 * colleague signed for other numbers); a released component's marks are
 * fixed.
 *
 * FOR THE EXAMS MODULE: InternalLock, one row per offering, read through
 * `internalTotalsFor(offeringId)` — { outOf, lockedAt, totals: [{
 * studentMembershipId, total }] } with `total` in marks to two decimals out
 * of `outOf` (the scheme's internalMax). Stored once by `lockInternal`, the
 * one writer, and recomputed by data:audit "academics-internal-lock".
 */

type Tx = typeof db;

const OFFERING = {
  id: true,
  termId: true,
  facultyMembershipId: true,
  course: { select: { code: true, name: true, outcomes: true, scheme: { select: { passingRules: true, programme: { select: { departmentId: true } } } } } },
} as const;

async function offeringOf(c: Caller, offeringId: string) {
  const o = await db.courseOffering.findFirst({ where: { id: offeringId, schoolId: c.schoolId }, select: OFFERING });
  if (!o) throw new AccessError("access.entryNotFound", "NOT_FOUND");
  const departmentId = o.course.scheme.programme.departmentId;
  const isFaculty = o.facultyMembershipId === c.membershipId;
  const isHod = c.role === "HOD" && (await headsDepartment(c, departmentId));
  const sameDepartment = c.role === "FACULTY" || c.role === "HOD" ? (await departmentOfMember(c.schoolId, c.membershipId)) === departmentId : false;
  return { o, departmentId, isFaculty, isHod, sameDepartment, internalMax: readPassingRules(o.course.scheme.passingRules).internalMax };
}

const isLocked = async (offeringId: string) => Boolean(await db.internalLock.findUnique({ where: { offeringId }, select: { id: true } }));

async function registeredOn(offeringId: string) {
  // The sheet's roster, the countersign's and the lock's (TA-003): not one who left before the term's last day.
  const term = await db.courseOffering.findUnique({ where: { id: offeringId }, select: { term: { select: { endsOn: true } } } });
  const regs = await db.courseRegistration.findMany({
    where: { offeringId, ...registeredStudying(term?.term.endsOn) },
    select: { studentMembershipId: true, student: { select: { studentCode: true, user: { select: { name: true, preferredName: true } }, academicSeat: { select: { divisionId: true } }, enrollments: { where: { status: "ACTIVE", class: { division: { isNot: null } } }, select: { rollNumber: true, class: { select: { division: { select: { id: true } } } } } } } } },
  });
  return regs
    .map((r) => ({ studentMembershipId: r.studentMembershipId, name: nameOf(r.student.user), studentCode: r.student.studentCode, rollNumber: r.student.enrollments.find((e) => e.class.division?.id === r.student.academicSeat?.divisionId)?.rollNumber ?? null }))
    .sort((a, b) => (a.rollNumber ?? 9999) - (b.rollNumber ?? 9999) || a.name.localeCompare(b.name));
}

/** The marks sheet: the faculty member, a colleague of the department (to countersign), the HOD, and the office and head to read. */
export async function internalSheet(ctx: ActiveContext, offeringId: string): Promise<InternalSheet> {
  const c = await academicsCaller(ctx, ["FACULTY", "HOD", "ADMIN", "PRINCIPAL"]);
  const { o, isFaculty, isHod, sameDepartment, internalMax } = await offeringOf(c, offeringId);
  const office = c.role === "ADMIN" || c.role === "PRINCIPAL";
  if (!isFaculty && !isHod && !sameDepartment && !office) throw new AccessError("academics.refuseNotYours");
  const [components, students, lock] = await Promise.all([
    db.internalComponent.findMany({ where: { offeringId }, orderBy: [{ position: "asc" }, { createdAt: "asc" }], select: { id: true, name: true, kind: true, maxMarks: true, weight: true, coCodes: true, moderatedByUserId: true, moderatedAt: true, releasedAt: true, marks: { select: { studentMembershipId: true, marksTenths: true, enteredByUserId: true } } } }),
    registeredOn(offeringId),
    db.internalLock.findUnique({ where: { offeringId }, select: { lockedAt: true, lockedByUserId: true } }),
  ]);
  const userNames = await db.user.findMany({ where: { id: { in: [...components.map((k) => k.moderatedByUserId), lock?.lockedByUserId].filter((x): x is string => Boolean(x)) } }, select: { id: true, name: true, preferredName: true } });
  const userName = new Map(userNames.map((u) => [u.id, nameOf(u)]));
  const rules = components.map((k) => ({ id: k.id, maxMarks: k.maxMarks, weight: k.weight }));
  const enteredByMe = components.some((k) => k.marks.some((m) => m.enteredByUserId === c.userId));
  return {
    offeringId,
    courseCode: o.course.code,
    courseName: o.course.name,
    internalMax,
    weightTotal: sumWeights(components),
    components: components.map((k) => ({ id: k.id, name: k.name, kind: k.kind as "UNIT_TEST", maxMarks: k.maxMarks, weight: k.weight, coCodes: readCodes(k.coCodes), enteredCount: k.marks.length, moderated: Boolean(k.moderatedAt), moderatedByName: k.moderatedByUserId ? (userName.get(k.moderatedByUserId) ?? null) : null, released: Boolean(k.releasedAt) })),
    students: students.map((s) => {
      const marks: Record<string, number | null> = {};
      const byComponent = new Map<string, number | null>();
      for (const k of components) {
        const m = k.marks.find((x) => x.studentMembershipId === s.studentMembershipId);
        if (m) {
          marks[k.id] = m.marksTenths === null ? null : m.marksTenths / 10;
          byComponent.set(k.id, m.marksTenths);
        }
      }
      const any = byComponent.size > 0;
      return { studentMembershipId: s.studentMembershipId, name: s.name, rollNumber: s.rollNumber, marks, total: any ? internalTotalHundredths(rules, byComponent) / 100 : null };
    }),
    locked: lock ? { at: lock.lockedAt.toISOString(), byName: userName.get(lock.lockedByUserId) ?? null } : null,
    canEnter: !lock && (isFaculty || isHod),
    canModerate: !lock && sameDepartment && !isFaculty && !enteredByMe,
    canRelease: !lock && isHod,
    canLock: !lock && isHod,
  };
}

/** A component added or changed by the faculty member or the HOD; refused once locked or released, or when the weights would pass the scheme's internal total. */
export async function saveComponent(ctx: ActiveContext, offeringId: string, input: { id?: string; name: string; kind: string; maxMarks: number; weight: number; coCodes: string[] }): Promise<{ id: string }> {
  const c = await academicsCaller(ctx, ["FACULTY", "HOD"]);
  const { o, isFaculty, isHod, internalMax } = await offeringOf(c, offeringId);
  if (!isFaculty && !isHod) throw new AccessError("academics.refuseNotYours");
  if (await isLocked(offeringId)) throw new RuleRefusal("academics.refuseLocked", 409);
  const cos = new Set(readOutcomes(o.course.outcomes).map((x) => x.code));
  const stray = input.coCodes.find((code) => !cos.has(code));
  if (stray) throw new RuleRefusal("academics.refuseUnknownOutcome", 422, { code: stray }, "coCodes");
  const others = await db.internalComponent.findMany({ where: { offeringId, ...(input.id ? { NOT: { id: input.id } } : {}) }, select: { weight: true } });
  if (sumWeights(others) + input.weight > internalMax) throw new RuleRefusal("academics.refuseWeightsOver", 422, { max: internalMax }, "weight");
  const data = { name: input.name, kind: input.kind, maxMarks: input.maxMarks, weight: input.weight, coCodes: writeJson(input.coCodes) };
  let id: string;
  try {
    if (input.id) {
      const k = await db.internalComponent.findFirst({ where: { id: input.id, offeringId }, select: { id: true, releasedAt: true, marks: { select: { marksTenths: true } } } });
      if (!k) throw new AccessError("access.entryNotFound", "NOT_FOUND");
      if (k.releasedAt) throw new RuleRefusal("academics.refuseReleased", 409);
      if (k.marks.some((m) => (m.marksTenths ?? 0) > input.maxMarks * 10)) throw new RuleRefusal("academics.refuseOverMax", 422, { max: input.maxMarks }, "maxMarks");
      await db.internalComponent.update({ where: { id: k.id }, data: { ...data, moderatedAt: null, moderatedByUserId: null } });
      id = k.id;
    } else id = (await db.internalComponent.create({ data: { schoolId: c.schoolId, offeringId, position: others.length, ...data }, select: { id: true } })).id;
  } catch (e) {
    if (typeof e === "object" && e !== null && (e as { code?: string }).code === "P2002") throw new RuleRefusal("academics.refuseCodeTaken", 409, undefined, "name");
    throw e;
  }
  await audit({ schoolId: c.schoolId, actorUserId: c.userId, action: "academics.internal.component", targetType: "InternalComponent", targetId: id, meta: { offeringId, name: input.name, maxMarks: input.maxMarks, weight: input.weight } });
  return { id };
}

/**
 * Marks for one component: a list of { student, marks } (null for absent),
 * or a pasted sheet whose lines are a roll number or student code and the
 * marks ("AB" absent). Lines that name nobody on the offering, or give no
 * number, or more than the maximum, are skipped and said. A change after the
 * countersign takes it away; a released component is fixed.
 */
export async function saveInternalMarks(ctx: ActiveContext, offeringId: string, input: { componentId: string; entries?: { studentMembershipId: string; marks: number | null }[]; sheet?: string }): Promise<{ saved: number; skipped: { line: number; reason: "UNKNOWN_STUDENT" | "AMBIGUOUS_STUDENT" | "BAD_MARKS" | "OVER_MAX" }[] }> {
  const c = await academicsCaller(ctx, ["FACULTY", "HOD"]);
  const { isFaculty, isHod } = await offeringOf(c, offeringId);
  if (!isFaculty && !isHod) throw new AccessError("academics.refuseNotYours");
  if (await isLocked(offeringId)) throw new RuleRefusal("academics.refuseLocked", 409);
  const k = await db.internalComponent.findFirst({ where: { id: input.componentId, offeringId }, select: { id: true, maxMarks: true, releasedAt: true, moderatedAt: true, name: true } });
  if (!k) throw new RuleRefusal("academics.refuseUnknownComponent", 422, undefined, "componentId");
  if (k.releasedAt) throw new RuleRefusal("academics.refuseReleased", 409);
  const students = await registeredOn(offeringId);
  const ids = new Set(students.map((s) => s.studentMembershipId));
  const skipped: { line: number; reason: "UNKNOWN_STUDENT" | "AMBIGUOUS_STUDENT" | "BAD_MARKS" | "OVER_MAX" }[] = [];
  const rows: { studentMembershipId: string; tenths: number | null }[] = [];
  if (input.entries) {
    for (const e of input.entries) {
      if (!ids.has(e.studentMembershipId)) throw new RuleRefusal("academics.refuseNotRegistered", 422, undefined, "entries");
      const tenths = e.marks === null ? null : Math.round(e.marks * 10);
      if (tenths !== null && tenths > k.maxMarks * 10) throw new RuleRefusal("academics.refuseOverMax", 422, { max: k.maxMarks }, "entries");
      rows.push({ studentMembershipId: e.studentMembershipId, tenths });
    }
  } else if (input.sheet) {
    // A roll number is its own division's (TA-055): on an offering shared across divisions two students hold
    // roll 7, so a key held by more than one student names nobody, and its line is skipped as ambiguous.
    const byKey = new Map<string, Set<string>>();
    const keep = (key: string, id: string) => byKey.set(key, (byKey.get(key) ?? new Set<string>()).add(id));
    for (const s of students) {
      if (s.rollNumber !== null) keep(String(s.rollNumber), s.studentMembershipId);
      if (s.studentCode) keep(s.studentCode.toUpperCase(), s.studentMembershipId);
    }
    input.sheet.split(/\r?\n/).forEach((raw, i) => {
      const line = raw.trim();
      if (!line) return;
      const [who = "", value = ""] = line.split(/[,\t;]/).map((x) => x.trim().replace(/^"|"$/g, ""));
      const named = byKey.get(who.toUpperCase());
      if (named && named.size > 1) return void skipped.push({ line: i + 1, reason: "AMBIGUOUS_STUDENT" });
      const id = named ? [...named][0] : undefined;
      if (!id) {
        // A header line is not a student; anything else that names nobody is said.
        if (i > 0 || /\d/.test(who)) skipped.push({ line: i + 1, reason: "UNKNOWN_STUDENT" });
        return;
      }
      const tenths = parseMarks(value);
      if (tenths === undefined) return void skipped.push({ line: i + 1, reason: "BAD_MARKS" });
      if (tenths !== null && tenths > k.maxMarks * 10) return void skipped.push({ line: i + 1, reason: "OVER_MAX" });
      rows.push({ studentMembershipId: id, tenths });
    });
  } else throw new RuleRefusal("common.checkTheForm", 422, undefined, "entries");
  if (rows.length) {
    // Under the offering's row lock (TA-238), the lock the countersign and the HOD's lock take too: the lock,
    // the release, the countersign and the earlier marks are read again here, so a countersign or a lock that
    // landed since the reads above is seen, and never stands over marks written after it.
    const written = await db.$tenantTransaction(async (raw) => {
      const tx = raw as Tx;
      await lockOffering(tx, offeringId);
      if (await tx.internalLock.findUnique({ where: { offeringId }, select: { id: true } })) throw new RuleRefusal("academics.refuseLocked", 409);
      const now = await tx.internalComponent.findUniqueOrThrow({ where: { id: k.id }, select: { releasedAt: true, moderatedAt: true } });
      if (now.releasedAt) throw new RuleRefusal("academics.refuseReleased", 409);
      const existing = new Map((await tx.internalMark.findMany({ where: { componentId: k.id }, select: { studentMembershipId: true, marksTenths: true } })).map((m) => [m.studentMembershipId, m.marksTenths]));
      const changed = rows.filter((r) => !existing.has(r.studentMembershipId) || existing.get(r.studentMembershipId) !== r.tenths);
      for (const r of changed) {
        await tx.internalMark.upsert({
          where: { componentId_studentMembershipId: { componentId: k.id, studentMembershipId: r.studentMembershipId } },
          create: { schoolId: c.schoolId, componentId: k.id, studentMembershipId: r.studentMembershipId, marksTenths: r.tenths, enteredByUserId: c.userId },
          update: { marksTenths: r.tenths, enteredByUserId: c.userId, enteredAt: new Date(), moderatedByUserId: null, moderatedAt: null },
        });
      }
      // The countersign was for the numbers as they were.
      const cleared = changed.length > 0 && Boolean(now.moderatedAt);
      if (cleared) {
        await tx.internalComponent.update({ where: { id: k.id }, data: { moderatedAt: null, moderatedByUserId: null } });
        await tx.internalMark.updateMany({ where: { componentId: k.id }, data: { moderatedAt: null, moderatedByUserId: null } });
      }
      return { changed: changed.length, cleared };
    });
    if (written.changed) await audit({ schoolId: c.schoolId, actorUserId: c.userId, action: "academics.internal.marks", targetType: "InternalComponent", targetId: k.id, meta: { offeringId, changed: written.changed, countersignCleared: written.cleared } });
  }
  return { saved: rows.length, skipped };
}

/** The offering's row, held to the end of the transaction: the one lock a save, a countersign, a release and the HOD's lock of its internal marks queue on (TA-238). */
async function lockOffering(tx: Tx, offeringId: string): Promise<void> {
  await tx.$queryRaw`SELECT 1 FROM "CourseOffering" WHERE "id" = ${offeringId} FOR UPDATE`;
}

/** A second member of the department countersigns a component: not its teacher, not anyone who entered its marks; every registered student must have an entry. */
export async function moderateComponent(ctx: ActiveContext, componentId: string): Promise<{ changed: boolean }> {
  const c = await academicsCaller(ctx, ["FACULTY", "HOD"]);
  const k = await db.internalComponent.findFirst({ where: { id: componentId, schoolId: c.schoolId }, select: { id: true, offeringId: true, moderatedAt: true, marks: { select: { studentMembershipId: true, enteredByUserId: true } } } });
  if (!k) throw new AccessError("access.entryNotFound", "NOT_FOUND");
  const { isFaculty, sameDepartment } = await offeringOf(c, k.offeringId);
  if (!sameDepartment) throw new AccessError("academics.refuseOtherDepartment");
  if (isFaculty || k.marks.some((m) => m.enteredByUserId === c.userId)) throw new RuleRefusal("academics.refuseOwnModeration", 409);
  if (await isLocked(k.offeringId)) throw new RuleRefusal("academics.refuseLocked", 409);
  if (k.moderatedAt) return { changed: false };
  const students = await registeredOn(k.offeringId);
  const now = new Date();
  // The marks the countersign stands over are read under the offering's lock (TA-238): a save waiting on it
  // writes after, and takes the countersign away; one that went first is what is countersigned.
  const changed = await db.$tenantTransaction(async (raw) => {
    const tx = raw as Tx;
    await lockOffering(tx, k.offeringId);
    if (await tx.internalLock.findUnique({ where: { offeringId: k.offeringId }, select: { id: true } })) throw new RuleRefusal("academics.refuseLocked", 409);
    const fresh = await tx.internalComponent.findUniqueOrThrow({ where: { id: k.id }, select: { moderatedAt: true, marks: { select: { studentMembershipId: true, enteredByUserId: true } } } });
    if (fresh.moderatedAt) return false;
    if (fresh.marks.some((m) => m.enteredByUserId === c.userId)) throw new RuleRefusal("academics.refuseOwnModeration", 409);
    const entered = new Set(fresh.marks.map((m) => m.studentMembershipId));
    if (!students.length || students.some((s) => !entered.has(s.studentMembershipId))) throw new RuleRefusal("academics.refuseIncomplete", 409);
    const moved = await tx.internalComponent.updateMany({ where: { id: k.id, moderatedAt: null }, data: { moderatedAt: now, moderatedByUserId: c.userId } });
    if (!moved.count) return false;
    await tx.internalMark.updateMany({ where: { componentId: k.id }, data: { moderatedAt: now, moderatedByUserId: c.userId } });
    return true;
  });
  if (!changed) return { changed: false };
  await audit({ schoolId: c.schoolId, actorUserId: c.userId, action: "academics.internal.moderate", targetType: "InternalComponent", targetId: k.id, meta: { offeringId: k.offeringId } });
  return { changed: true };
}

/** The HOD releases a countersigned component to the students, who are told. */
export async function releaseComponent(ctx: ActiveContext, componentId: string): Promise<{ changed: boolean }> {
  const c = await academicsCaller(ctx, ["HOD"]);
  const k = await db.internalComponent.findFirst({ where: { id: componentId, schoolId: c.schoolId }, select: { id: true, name: true, offeringId: true, moderatedAt: true, releasedAt: true } });
  if (!k) throw new AccessError("access.entryNotFound", "NOT_FOUND");
  const { o, isHod } = await offeringOf(c, k.offeringId);
  if (!isHod) throw new AccessError("academics.refuseOtherDepartment");
  if (k.releasedAt) return { changed: false };
  if (!k.moderatedAt) throw new RuleRefusal("academics.refuseNotModerated", 409);
  // Released only while still countersigned, read under the offering's lock (TA-238): a save that took the countersign away since is seen.
  const released = await db.$tenantTransaction(async (raw) => {
    const tx = raw as Tx;
    await lockOffering(tx, k.offeringId);
    const fresh = await tx.internalComponent.findUniqueOrThrow({ where: { id: k.id }, select: { moderatedAt: true, releasedAt: true } });
    if (fresh.releasedAt) return false;
    if (!fresh.moderatedAt) throw new RuleRefusal("academics.refuseNotModerated", 409);
    await tx.internalComponent.update({ where: { id: k.id }, data: { releasedAt: new Date(), releasedByUserId: c.userId } });
    return true;
  });
  if (!released) return { changed: false };
  await audit({ schoolId: c.schoolId, actorUserId: c.userId, action: "academics.internal.release", targetType: "InternalComponent", targetId: k.id, meta: { offeringId: k.offeringId } });
  const students = await db.courseRegistration.findMany({ where: { offeringId: k.offeringId, status: "REGISTERED" }, select: { student: { select: { userId: true } } } });
  const vars = { course: `${o.course.code} ${o.course.name}`, component: k.name };
  for (const s of students) await notify({ userId: s.student.userId, schoolId: c.schoolId, kind: "GRADE", titleKey: "academics.notifyReleasedTitle", titleVars: vars, bodyKey: "academics.notifyReleasedBody", bodyVars: vars, url: "/student/academics" });
  return { changed: true };
}

/**
 * The HOD locks an offering's internal marks: the weights add to the
 * scheme's internal total, every component is countersigned, every
 * registered student has an entry in each. The totals are frozen into
 * InternalLock (the exams module's to read); from here every change is 409.
 */
export async function lockInternal(ctx: ActiveContext, offeringId: string): Promise<{ changed: boolean }> {
  const c = await academicsCaller(ctx, ["HOD"]);
  const { o, isHod, internalMax } = await offeringOf(c, offeringId);
  if (!isHod) throw new AccessError("academics.refuseOtherDepartment");
  if (await isLocked(offeringId)) return { changed: false };
  const students = await registeredOn(offeringId);
  // The marks are read and the totals frozen under the offering's lock (TA-238), so a save that passed its own
  // lock check either wrote before (and is in the totals, or took a countersign away) or waits and is refused.
  const totals = await db.$tenantTransaction(async (raw) => {
    const tx = raw as Tx;
    await lockOffering(tx, offeringId);
    if (await tx.internalLock.findUnique({ where: { offeringId }, select: { id: true } })) return null;
    const components = await tx.internalComponent.findMany({ where: { offeringId }, select: { id: true, maxMarks: true, weight: true, moderatedAt: true, marks: { select: { studentMembershipId: true, marksTenths: true } } } });
    if (!components.length || sumWeights(components) !== internalMax) throw new RuleRefusal("academics.refuseWeightsNotTotal", 409, { max: internalMax, total: sumWeights(components) });
    if (components.some((k) => !k.moderatedAt)) throw new RuleRefusal("academics.refuseNotModerated", 409);
    if (components.some((k) => students.some((s) => !k.marks.some((m) => m.studentMembershipId === s.studentMembershipId)))) throw new RuleRefusal("academics.refuseIncomplete", 409);
    const frozen = lockTotals(components, students.map((s) => s.studentMembershipId));
    await tx.internalLock.create({ data: { schoolId: c.schoolId, offeringId, termId: o.termId, outOf: internalMax, totalsJson: writeJson(frozen), lockedByUserId: c.userId } });
    return frozen;
  });
  if (!totals) return { changed: false };
  await audit({ schoolId: c.schoolId, actorUserId: c.userId, action: "academics.internal.lock", targetType: "CourseOffering", targetId: offeringId, meta: { students: totals.length, outOf: internalMax } });
  return { changed: true };
}

/** The frozen totals, in the order of the students: the one computation the lock and the audit share. */
export function lockTotals(components: { id: string; maxMarks: number; weight: number; marks: { studentMembershipId: string; marksTenths: number | null }[] }[], studentIds: string[]): { studentMembershipId: string; totalHundredths: number }[] {
  return studentIds.map((sid) => {
    const marks = new Map<string, number | null>();
    for (const k of components) {
      const m = k.marks.find((x) => x.studentMembershipId === sid);
      if (m) marks.set(k.id, m.marksTenths);
    }
    return { studentMembershipId: sid, totalHundredths: internalTotalHundredths(components, marks) };
  });
}

/**
 * THE EXAMS MODULE'S READ: an offering's locked internal totals, or null
 * while it is not locked. `total` is in marks to two decimals, out of
 * `outOf` (the scheme's internalMax).
 */
export async function internalTotalsFor(offeringId: string): Promise<{ offeringId: string; termId: string; outOf: number; lockedAt: string; totals: { studentMembershipId: string; total: number }[] } | null> {
  const lock = await db.internalLock.findUnique({ where: { offeringId }, select: { offeringId: true, termId: true, outOf: true, lockedAt: true, totalsJson: true } });
  if (!lock) return null;
  const totals = readJson<{ studentMembershipId: string; totalHundredths: number }[]>(lock.totalsJson, []);
  return { offeringId: lock.offeringId, termId: lock.termId, outOf: lock.outOf, lockedAt: lock.lockedAt.toISOString(), totals: totals.map((t) => ({ studentMembershipId: t.studentMembershipId, total: t.totalHundredths / 100 })) };
}

/** What a student sees: the components released to them, with their marks. */
export async function releasedMarksFor(studentMembershipId: string, termId: string) {
  const regs = await db.courseRegistration.findMany({ where: { studentMembershipId, termId, status: "REGISTERED" }, select: { offeringId: true, offering: { select: { course: { select: { code: true, name: true } }, components: { where: { releasedAt: { not: null } }, orderBy: { position: "asc" }, select: { name: true, kind: true, maxMarks: true, weight: true, marks: { where: { studentMembershipId }, select: { marksTenths: true } } } } } } } });
  return regs
    .filter((r) => r.offering.components.length)
    .map((r) => ({ offeringId: r.offeringId, courseCode: r.offering.course.code, courseName: r.offering.course.name, components: r.offering.components.map((k) => ({ name: k.name, kind: k.kind as "UNIT_TEST", maxMarks: k.maxMarks, weight: k.weight, marks: k.marks[0]?.marksTenths === null || k.marks[0] === undefined ? null : k.marks[0].marksTenths / 10 })) }));
}

/** The components of the department's offerings this member may countersign (for their home). */
export async function toModerateFor(c: Caller): Promise<{ componentId: string; offeringId: string; courseCode: string; name: string; facultyName: string | null }[]> {
  const dept = await departmentOfMember(c.schoolId, c.membershipId);
  if (!dept) return [];
  const rows = await db.internalComponent.findMany({
    where: { schoolId: c.schoolId, moderatedAt: null, offering: { lock: null, course: { scheme: { programme: { departmentId: dept } } }, NOT: { facultyMembershipId: c.membershipId } }, marks: { some: {}, none: { enteredByUserId: c.userId } } },
    select: { id: true, name: true, offeringId: true, offering: { select: { facultyMembershipId: true, course: { select: { code: true } } } } },
    take: 50,
  });
  const names = await namesOf(rows.map((r) => r.offering.facultyMembershipId));
  return rows.map((r) => ({ componentId: r.id, offeringId: r.offeringId, courseCode: r.offering.course.code, name: r.name, facultyName: r.offering.facultyMembershipId ? (names.get(r.offering.facultyMembershipId) ?? null) : null }));
}
