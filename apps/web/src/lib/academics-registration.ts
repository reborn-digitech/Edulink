import "server-only";
import type { z } from "zod";
import type { lateRegistrationsSchema, RegistrationView } from "@edulink/contracts";
import { db } from "./db";
import { AccessError } from "./access-error";
import { RuleRefusal } from "./rule-refusal";
import { audit } from "./audit";
import { notify } from "./notify";
import { todayKey } from "./dates";
import { academicsCaller, currentTerm, divisionNames, nameOf, readExitPoints, readPassingRules, termView, type Caller } from "./academics";
import { creditsOf, slotKey } from "./academics-rules";
import type { ActiveContext } from "./session";

/**
 * COURSE REGISTRATION (the college's academics, 4 October 2026).
 *
 * Each term a student registers on the offerings of their scheme and
 * semester: every CORE course of it (required, and added for them), and the
 * electives, minors, honours and open courses they choose, within the
 * scheme's credits for a term (passingRules.minTermCredits and
 * maxTermCredits). An offering for another division is not theirs; a full
 * one, or one whose hour clashes with another they chose, is refused.
 *
 * THE WINDOW. Registration is open between the term's registrationOpensOn
 * and registrationClosesOn (school-local days, inclusive). Outside it, only
 * a late registration the principal approved opens it, for that student and
 * term, until the day it names. The office may register on a student's
 * behalf, inside the same window or the same approval. A choice is the whole
 * set: sending it again changes nothing; leaving an offering out drops it
 * (the row stays, DROPPED, so lectures already marked keep their owner).
 */

type Subject = { membershipId: string; name: string };

async function subjectOf(c: Caller, studentMembershipId?: string): Promise<Subject> {
  if (c.role === "STUDENT") {
    if (studentMembershipId && studentMembershipId !== c.membershipId) throw new AccessError("access.wrongRoleForThisAction");
    const me = await db.membership.findUniqueOrThrow({ where: { id: c.membershipId }, select: { user: { select: { name: true, preferredName: true } } } });
    return { membershipId: c.membershipId, name: nameOf(me.user) };
  }
  if (!studentMembershipId) throw new RuleRefusal("academics.refuseNotStudent", 422, undefined, "studentMembershipId");
  const m = await db.membership.findFirst({ where: { id: studentMembershipId, schoolId: c.schoolId, role: "STUDENT", status: "ACTIVE" }, select: { id: true, user: { select: { name: true, preferredName: true } } } });
  if (!m) throw new AccessError("access.entryNotFound", "NOT_FOUND");
  return { membershipId: m.id, name: nameOf(m.user) };
}

/** Whether registration is open for this student and term today, and until when a late one runs. */
async function windowOf(schoolId: string, studentMembershipId: string, term: { id: string; registrationOpensOn: string; registrationClosesOn: string }, today: string): Promise<{ open: boolean; lateUntil: string | null }> {
  if (today >= term.registrationOpensOn && today <= term.registrationClosesOn) return { open: true, lateUntil: null };
  const late = await db.lateRegistration.findFirst({ where: { schoolId, studentMembershipId, termId: term.id, status: "APPROVED", openUntil: { gte: today } }, orderBy: { openUntil: "desc" }, select: { openUntil: true } });
  return late && today >= term.registrationOpensOn ? { open: true, lateUntil: late.openUntil } : { open: false, lateUntil: null };
}

async function viewFor(c: Caller, subject: Subject, termId?: string): Promise<RegistrationView> {
  const today = todayKey(c.timeZone);
  const seat = await db.studentProgramme.findUnique({
    where: { studentMembershipId: subject.membershipId },
    select: { schemeId: true, semester: true, yearOfStudy: true, divisionId: true, prn: true, status: true, programme: { select: { code: true, name: true, exitPoints: true } }, scheme: { select: { name: true, passingRules: true } } },
  });
  const term = termId ? await db.academicTerm.findFirst({ where: { id: termId, schoolId: c.schoolId } }) : await currentTerm(c.schoolId, today);
  const roll = seat?.divisionId ? await db.enrollment.findFirst({ where: { studentMembershipId: subject.membershipId, status: "ACTIVE", class: { division: { id: seat.divisionId } } }, select: { rollNumber: true, class: { select: { name: true } } } }) : null;
  const empty: RegistrationView = { studentMembershipId: subject.membershipId, name: subject.name, programme: null, term: term ? termView(term, today) : null, open: false, lateUntil: null, minCredits: 0, maxCredits: 0, chosenCredits: 0, offerings: [], exitPoints: [], creditsEarned: 0 };
  if (!seat || seat.status !== "ACTIVE") return empty;
  const rules = readPassingRules(seat.scheme.passingRules);
  const programme = { code: seat.programme.code, name: seat.programme.name, schemeName: seat.scheme.name, semester: seat.semester, yearOfStudy: seat.yearOfStudy, divisionName: roll?.class.name ?? null, rollNumber: roll?.rollNumber ?? null, prn: seat.prn };
  if (!term) return { ...empty, programme, minCredits: rules.minTermCredits, maxCredits: rules.maxTermCredits, exitPoints: readExitPoints(seat.programme.exitPoints) };
  const [offerings, mine, window] = await Promise.all([
    availableOfferings(c.schoolId, term.id, seat.schemeId, seat.semester, seat.divisionId),
    db.courseRegistration.findMany({ where: { studentMembershipId: subject.membershipId, termId: term.id, status: "REGISTERED" }, select: { offeringId: true } }),
    windowOf(c.schoolId, subject.membershipId, term, today),
  ]);
  const chosen = new Set(mine.map((m) => m.offeringId));
  const [faculty, divisions] = await Promise.all([
    db.membership.findMany({ where: { id: { in: offerings.map((o) => o.facultyMembershipId).filter((x): x is string => Boolean(x)) } }, select: { id: true, user: { select: { name: true, preferredName: true } } } }),
    divisionNames(offerings.map((o) => o.divisionId)),
  ]);
  const facultyBy = new Map(faculty.map((f) => [f.id, nameOf(f.user)]));
  const rows = offerings.map((o) => ({
    offeringId: o.id,
    courseCode: o.course.code,
    courseName: o.course.name,
    kind: o.course.kind as "CORE",
    credits: creditsOf(o.course),
    facultyName: o.facultyMembershipId ? (facultyBy.get(o.facultyMembershipId) ?? null) : null,
    divisionName: o.divisionId ? (divisions.get(o.divisionId) ?? null) : null,
    seatsLeft: o.capacity === null ? null : Math.max(0, o.capacity - o._count.registrations),
    chosen: chosen.has(o.id),
    required: o.course.kind === "CORE",
  }));
  // Earned credits are the exams module's to say once results are in; until then, nothing is counted.
  return { ...empty, programme, open: window.open, lateUntil: window.lateUntil, minCredits: rules.minTermCredits, maxCredits: rules.maxTermCredits, chosenCredits: rows.filter((r) => r.chosen).reduce((n, r) => n + r.credits, 0), offerings: rows, exitPoints: readExitPoints(seat.programme.exitPoints) };
}

/** The offerings a student of this scheme, semester and division may register on in a term. */
async function availableOfferings(schoolId: string, termId: string, schemeId: string, semester: number, divisionId: string | null) {
  return db.courseOffering.findMany({
    where: { schoolId, termId, course: { schemeId, semester }, OR: [{ divisionId: null }, ...(divisionId ? [{ divisionId }] : [])] },
    select: { id: true, divisionId: true, facultyMembershipId: true, capacity: true, course: { select: { code: true, name: true, kind: true, creditsL: true, creditsT: true, creditsP: true } }, slots: { select: { weekday: true, periodId: true, labBatchId: true } }, _count: { select: { registrations: { where: { status: "REGISTERED" } } } } },
    orderBy: [{ course: { kind: "asc" } }, { course: { code: "asc" } }],
  });
}

/** A student's registration for a term: their own, or (the office) anyone's. */
export async function registrationView(ctx: ActiveContext, query: { termId?: string; studentMembershipId?: string }): Promise<RegistrationView> {
  const c = await academicsCaller(ctx, ["STUDENT", "ADMIN"]);
  return viewFor(c, await subjectOf(c, query.studentMembershipId), query.termId);
}

/** For the student's home: the same view, without asking again who is calling. */
export async function registrationViewFor(c: Caller, termId?: string): Promise<RegistrationView> {
  return viewFor(c, await subjectOf(c), termId);
}

export async function saveRegistration(ctx: ActiveContext, input: { termId: string; offeringIds: string[]; studentMembershipId?: string }): Promise<RegistrationView> {
  const c = await academicsCaller(ctx, ["STUDENT", "ADMIN"]);
  const subject = await subjectOf(c, input.studentMembershipId);
  const today = todayKey(c.timeZone);
  const term = await db.academicTerm.findFirst({ where: { id: input.termId, schoolId: c.schoolId } });
  if (!term) throw new RuleRefusal("academics.refuseUnknownTerm", 422, undefined, "termId");
  const seat = await db.studentProgramme.findUnique({ where: { studentMembershipId: subject.membershipId }, select: { schemeId: true, semester: true, divisionId: true, status: true, scheme: { select: { passingRules: true } } } });
  if (!seat || seat.status !== "ACTIVE") throw new RuleRefusal("academics.refuseNoSeat", 422);
  const window = await windowOf(c.schoolId, subject.membershipId, term, today);
  if (!window.open) throw new RuleRefusal("academics.refuseWindowClosed", 409, { from: term.registrationOpensOn, to: term.registrationClosesOn });

  const available = await availableOfferings(c.schoolId, term.id, seat.schemeId, seat.semester, seat.divisionId);
  const byId = new Map(available.map((o) => [o.id, o]));
  const unknown = input.offeringIds.find((id) => !byId.has(id));
  if (unknown) throw new RuleRefusal("academics.refuseNotYourOffering", 422, undefined, "offeringIds");
  // Every core course of the semester is on the list, asked for or not; a core course offered to the
  // student's division wins over the same course shared across divisions.
  const chosen = new Set(input.offeringIds);
  for (const o of available) if (o.course.kind === "CORE" && ![...chosen].some((id) => byId.get(id)!.course.code === o.course.code)) chosen.add(o.id);
  const set = [...chosen].map((id) => byId.get(id)!);
  const codes = set.map((o) => o.course.code);
  if (new Set(codes).size !== codes.length) throw new RuleRefusal("academics.refuseSameCourseTwice", 422, undefined, "offeringIds");
  const rules = readPassingRules(seat.scheme.passingRules);
  const credits = set.reduce((n, o) => n + creditsOf(o.course), 0);
  if (credits > rules.maxTermCredits) throw new RuleRefusal("academics.refuseOverCredits", 422, { credits, max: rules.maxTermCredits }, "offeringIds");
  if (credits < rules.minTermCredits) throw new RuleRefusal("academics.refuseUnderCredits", 422, { credits, min: rules.minTermCredits }, "offeringIds");
  // A lab hour of one batch is that batch's students' hour alone (TA-061): batch A and batch B of a division may sit
  // two courses' labs at one hour, as the timetable allows, and only the student's own batch's hour can clash.
  const batchSlots = set.some((o) => o.slots.some((s) => s.labBatchId));
  const myBatches = batchSlots ? new Set((await db.labBatchMember.findMany({ where: { studentMembershipId: subject.membershipId, untilKey: null }, select: { batchId: true } })).map((b) => b.batchId)) : new Set<string>();
  const seen = new Map<string, string>();
  for (const o of set) {
    for (const s of o.slots.filter((x) => !x.labBatchId || myBatches.has(x.labBatchId))) {
      const k = slotKey(s);
      const other = seen.get(k);
      if (other && other !== o.course.code) throw new RuleRefusal("academics.refuseClash", 409, { a: other, b: o.course.code }, "offeringIds");
      seen.set(k, o.course.code);
    }
  }
  const before = await db.courseRegistration.findMany({ where: { studentMembershipId: subject.membershipId, termId: term.id }, select: { offeringId: true, status: true } });
  const had = new Set(before.filter((b) => b.status === "REGISTERED").map((b) => b.offeringId));
  const adding = set.filter((o) => !had.has(o.id));
  const dropping = [...had].filter((id) => !chosen.has(id));
  const late = !(today >= term.registrationOpensOn && today <= term.registrationClosesOn);
  if (adding.length || dropping.length) {
    await db.$tenantTransaction(async (raw) => {
      const tx = raw as typeof db;
      for (const o of adding) {
        // Seats are counted under the offering's own row lock, so two students taking the last seat are one taken and one refused.
        await tx.$queryRaw`SELECT 1 FROM "CourseOffering" WHERE "id" = ${o.id} FOR UPDATE`;
        if (o.capacity !== null && (await tx.courseRegistration.count({ where: { offeringId: o.id, status: "REGISTERED" } })) >= o.capacity) throw new RuleRefusal("academics.refuseFull", 409, { course: o.course.code }, "offeringIds");
        await tx.courseRegistration.upsert({
          where: { offeringId_studentMembershipId: { offeringId: o.id, studentMembershipId: subject.membershipId } },
          create: { schoolId: c.schoolId, studentMembershipId: subject.membershipId, offeringId: o.id, termId: term.id, kind: o.course.kind, byUserId: c.userId, late },
          update: { status: "REGISTERED", registeredAt: new Date(), byUserId: c.userId, late },
        });
      }
      if (dropping.length) await tx.courseRegistration.updateMany({ where: { studentMembershipId: subject.membershipId, termId: term.id, offeringId: { in: dropping } }, data: { status: "DROPPED" } });
    });
    await audit({ schoolId: c.schoolId, actorUserId: c.userId, action: "academics.registration", targetType: "Membership", targetId: subject.membershipId, meta: { termId: term.id, added: adding.map((o) => o.course.code), dropped: dropping.length, credits, late, onBehalf: c.role !== "STUDENT" } });
  }
  return viewFor(c, subject, term.id);
}

/* ---------------------------------------------------- late registrations */

export async function listLateRegistrations(ctx: ActiveContext): Promise<z.infer<typeof lateRegistrationsSchema>> {
  const c = await academicsCaller(ctx, ["ADMIN", "PRINCIPAL"]);
  const rows = await db.lateRegistration.findMany({ where: { schoolId: c.schoolId }, orderBy: [{ status: "asc" }, { askedAt: "desc" }], take: 200, select: { id: true, studentMembershipId: true, termId: true, reason: true, openUntil: true, status: true, askedAt: true, decidedAt: true, term: { select: { name: true } }, student: { select: { user: { select: { name: true, preferredName: true } } } } } });
  return {
    items: rows.map((r) => ({ id: r.id, studentMembershipId: r.studentMembershipId, studentName: nameOf(r.student.user), termId: r.termId, termName: r.term.name, reason: r.reason, openUntil: r.openUntil, status: r.status as "ASKED", askedAt: r.askedAt.toISOString(), decidedAt: r.decidedAt?.toISOString() ?? null })),
    canDecide: c.role === "PRINCIPAL",
  };
}

/** The office asks for a student's registration to open after the window; the principal decides. */
export async function askLateRegistration(ctx: ActiveContext, input: { studentMembershipId: string; termId: string; reason: string; openUntil: string }): Promise<{ id: string }> {
  const c = await academicsCaller(ctx, ["ADMIN"]);
  const [student, term] = await Promise.all([
    db.membership.findFirst({ where: { id: input.studentMembershipId, schoolId: c.schoolId, role: "STUDENT", status: "ACTIVE" }, select: { id: true } }),
    db.academicTerm.findFirst({ where: { id: input.termId, schoolId: c.schoolId }, select: { id: true, name: true, endsOn: true } }),
  ]);
  if (!student) throw new RuleRefusal("academics.refuseNotStudent", 422, undefined, "studentMembershipId");
  if (!term) throw new RuleRefusal("academics.refuseUnknownTerm", 422, undefined, "termId");
  const today = todayKey(c.timeZone);
  if (input.openUntil < today || input.openUntil > term.endsOn) throw new RuleRefusal("academics.refuseLateUntil", 422, undefined, "openUntil");
  const open = await db.lateRegistration.findFirst({ where: { schoolId: c.schoolId, studentMembershipId: student.id, termId: term.id, status: "ASKED" }, select: { id: true } });
  if (open) return open;
  const row = await db.lateRegistration.create({ data: { schoolId: c.schoolId, studentMembershipId: student.id, termId: term.id, reason: input.reason, openUntil: input.openUntil, askedByUserId: c.userId }, select: { id: true } });
  await audit({ schoolId: c.schoolId, actorUserId: c.userId, action: "academics.late.ask", targetType: "LateRegistration", targetId: row.id, meta: { termId: term.id, openUntil: input.openUntil } });
  const principals = await db.membership.findMany({ where: { schoolId: c.schoolId, role: "PRINCIPAL", status: "ACTIVE" }, select: { userId: true } });
  for (const p of principals) await notify({ userId: p.userId, schoolId: c.schoolId, kind: "SYSTEM", titleKey: "academics.notifyLateAskTitle", bodyKey: "academics.notifyLateAskBody", bodyVars: { term: term.name }, url: "/admin/academics/registration" });
  return row;
}

export async function decideLateRegistration(ctx: ActiveContext, id: string, approve: boolean): Promise<{ changed: boolean }> {
  const c = await academicsCaller(ctx, ["PRINCIPAL"]);
  const row = await db.lateRegistration.findFirst({ where: { id, schoolId: c.schoolId }, select: { id: true, status: true, studentMembershipId: true, openUntil: true, term: { select: { name: true } }, student: { select: { userId: true } } } });
  if (!row) throw new AccessError("access.entryNotFound", "NOT_FOUND");
  const status = approve ? "APPROVED" : "REFUSED";
  if (row.status === status) return { changed: false };
  if (row.status !== "ASKED") throw new RuleRefusal("academics.refuseDecided", 409);
  const moved = await db.lateRegistration.updateMany({ where: { id, status: "ASKED" }, data: { status, decidedByUserId: c.userId, decidedAt: new Date() } });
  if (!moved.count) {
    // Another decision landed between the read and the write (TA-541): the same one is the no-op it says; the other is refused.
    const now = await db.lateRegistration.findFirst({ where: { id, schoolId: c.schoolId }, select: { status: true } });
    if (now?.status === status) return { changed: false };
    throw new RuleRefusal("academics.refuseDecided", 409);
  }
  await audit({ schoolId: c.schoolId, actorUserId: c.userId, action: approve ? "academics.late.approve" : "academics.late.refuse", targetType: "LateRegistration", targetId: id });
  if (approve) await notify({ userId: row.student.userId, schoolId: c.schoolId, kind: "SYSTEM", titleKey: "academics.notifyLateOpenTitle", bodyKey: "academics.notifyLateOpenBody", bodyVars: { term: row.term.name, until: row.openUntil }, url: "/student/registration" });
  return { changed: true };
}
