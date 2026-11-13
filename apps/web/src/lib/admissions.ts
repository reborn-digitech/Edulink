import "server-only";
import { closeAlumnus } from "./alumni-membership";
import type {
  AdmissionStatus,
  ApplicationSave,
  ApplicationView,
  CycleSave,
  CycleView,
} from "@edulink/contracts";
import { isCollegeKind } from "@edulink/contracts";
import { db } from "./db";
import { AccessError } from "./tenancy";
import { NotForThisKindError } from "./access-error";
import { institutionKindOf } from "./modules";
import { APPLICATION_TRIES, consume } from "./rate-limit";
import { audit } from "./audit";
import { notify } from "./notify";
import { forSchool } from "./tenant-context";
import { readJsonArray, writeJson, type Attachment } from "./json";
import { discard } from "./uploads";
import { studentCode } from "./codes";
import { HANDLE_DOMAIN } from "./login-name";
import { addDaysToKey, ageInYears, dateKeyInZone, formatDateKey, isDateKey, parseDateOnly, todayKey, zonedStartOfDay } from "./dates";
import { schoolBirthdateProblem } from "./birthdate-rules";
import { CONSENT_AGE, CONTACTABLE_ROLES, type Role } from "./constants";
import { regenerateDemands } from "./fees";
import { issueFirstSignIn } from "./first-signin";
import { syncStandinGuardian } from "./standin-guardian";
import { sendAdmissionOffer } from "./email";
import { matchPen, mayBringOver } from "./pen";
import { wordsFor } from "./certificate-rules";
import { normaliseLocale } from "./i18n/locales";
import { readJson } from "./json";
import type { ActiveContext } from "./session";
import { syncGradeLevel } from "./grade-level";
import { closeLeavingRecord } from "./school-record";

/**
 * Admissions: the whole road from a family's form to a seat on the roll.
 *
 * THE CYCLE is the school's open door for one academic year — the grades it
 * takes and how many seats each has, the documents it asks for, whether
 * there is an entrance test, the fee structure a new pupil goes on. The
 * office opens it and closes it; while it is open the school's page in the
 * directory carries the form.
 *
 * THE APPLICATION is one child's. A guardian signed in on the platform
 * writes it themselves — no school yet, no membership, only an account —
 * and the office writes it for a family that walked in with a paper form.
 * From there it moves in order: documents attached and verified, an
 * entrance-test sitting booked from the ones the office published, a
 * result recorded, an offer made and answered, the seat given. Every step
 * that changes hands tells the other side.
 *
 * WHO READS WHAT. The office reads every application to its school and
 * nothing beyond it. The applicant reads their own — the row is readable by
 * its applicant before any school binding exists (scripts/gen-rls.ts) —
 * and every write the family makes goes through here under the school's own
 * binding, after this file has checked the row is theirs. The child's
 * details live on the application, under the applicant, until admission
 * moves them onto a membership and its pupil record (policy 0002, row 29).
 *
 * THE HANDOFF mirrors intake.ts: a pupil account on a login handle, a
 * STUDENT membership with a student code, the enrolment, the guardianship
 * for the applicant who asked for the seat, the pupil record pre-filled
 * from the form, and the fee plan with its demands — one transaction, so a
 * half-admitted child cannot exist.
 *
 * REPEATING A STEP CHANGES NOTHING. The same child applied for twice is one
 * application; the same slot booked twice is one booking; an offer already
 * made, an answer already given, a seat already taken are answered as they
 * stand. A form sent twice from a slow connection must not make two
 * children.
 */

const OFFICE: readonly Role[] = ["ADMIN", "PRINCIPAL"];
type Office = ActiveContext & { schoolId: string; membershipId: string; role: Role };

function office(ctx: ActiveContext): Office {
  if (!ctx.schoolId || !ctx.membershipId || !ctx.role || !OFFICE.includes(ctx.role)) throw new AccessError("admissions.refuseOffice");
  return ctx as Office;
}

/**
 * THE SCHOOL'S ROAD, NOT A COLLEGE'S (TA-269). A college admits through its own desk (college-admissions: the CET list,
 * scrutiny, both anti-ragging undertakings and the academic seat); this road mints a pupil with a class and a school
 * fee plan and none of those. At a college a cycle cannot be made, applied to or admitted from, answered as the doors
 * at the wrong kind of institution are (404, role-gate.ts rule 4).
 */
async function refuseAtACollege(schoolId: string): Promise<void> {
  const kind = await institutionKindOf(schoolId);
  if (isCollegeKind(kind)) throw new NotForThisKindError(kind ?? "COLLEGE", "schoolCampus.refuseNotThisKind");
}

/** How many applications one account may have standing in one cycle (TA-181): a family's children, not a list of names. */
const LIVE_APPLICATIONS_PER_CYCLE = 5;

/** A signed-in guardian account; a child is not required, because applying is how the first one arrives. */
function family(ctx: ActiveContext): ActiveContext {
  if (ctx.role !== "PARENT") throw new AccessError("admissions.refuseFamily");
  return ctx;
}

type CycleGrade = { grade: string; seats: number };
type CycleDocument = { key: string; name: string; required: boolean };
type ApplicationDocument = { key: string; fileId: string; name: string; mime: string; size: number; uploadedAt: string };

const STATUSES: AdmissionStatus[] = ["SUBMITTED", "OFFERED", "ACCEPTED", "ADMITTED", "DECLINED", "WAITLISTED", "WITHDRAWN", "EXPIRED"];
/**
 * The states a family may still act in; everything else is settled. A
 * settled application also stops holding its entrance-test sitting: the
 * `testSlotId` stays as the record of where the child sat, but only a LIVE
 * application counts toward a sitting's `booked` figure.
 */
const LIVE: AdmissionStatus[] = ["SUBMITTED", "OFFERED", "ACCEPTED", "WAITLISTED"];

/**
 * What an application's status IS, whatever the row says: an OFFERED one
 * whose date has passed is EXPIRED. The hourly job writes that onto the row
 * (`expireOffers`); until it does, every reader — the cycle's counts, the
 * pipeline, the application itself — reads it the same way, so a seat is
 * never counted as offered on the strength of a date nobody kept.
 */
function effectiveStatus(a: { status: string; offerExpiresAt: Date | null }, now: Date = new Date()): AdmissionStatus {
  if (a.status === "OFFERED" && a.offerExpiresAt && a.offerExpiresAt.getTime() < now.getTime()) return "EXPIRED";
  return a.status as AdmissionStatus;
}

function parseGrades(raw: string): CycleGrade[] {
  return readJsonArray<CycleGrade>(raw).filter((g) => g && typeof g.grade === "string" && Number.isFinite(g.seats)).map((g) => ({ grade: String(g.grade), seats: Math.max(0, Math.floor(g.seats)) }));
}
function parseDocuments(raw: string): CycleDocument[] {
  return readJsonArray<CycleDocument>(raw).filter((d) => d && typeof d.key === "string" && typeof d.name === "string").map((d) => ({ key: d.key, name: d.name, required: Boolean(d.required) }));
}
function parseAttached(raw: string): ApplicationDocument[] {
  return readJsonArray<ApplicationDocument>(raw).filter((d) => d && typeof d.key === "string" && typeof d.fileId === "string");
}
function missingKeys(required: CycleDocument[], attached: ApplicationDocument[]): string[] {
  const have = new Set(attached.map((d) => d.key));
  return required.filter((d) => d.required && !have.has(d.key)).map((d) => d.key);
}
const dateKeyOf = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : null);
const iso = (d: Date | null) => (d ? d.toISOString() : null);

/* -------------------------------------------------------------------------- */
/* Cycles                                                                       */
/* -------------------------------------------------------------------------- */

type CycleRow = {
  id: string; academicYearId: string; name: string; gradesJson: string; documentsJson: string; testRequired: boolean; notice: string; feeStructureId: string | null; opensAt: Date | null; closesAt: Date | null; status: string; updatedAt: Date;
  academicYear: { name: string }; feeStructure: { name: string } | null;
  applications: { gradeApplied: string; status: string; offerExpiresAt: Date | null }[];
};

function cycleView(c: CycleRow): CycleView {
  const grades = parseGrades(c.gradesJson);
  const now = new Date();
  // Counted by what each application IS: an offer past its date is EXPIRED
  // here even before the hourly job has written it.
  const applications = c.applications.map((a) => ({ gradeApplied: a.gradeApplied, status: effectiveStatus(a, now) }));
  const counts = Object.fromEntries(STATUSES.map((s) => [s, 0])) as Record<AdmissionStatus, number>;
  for (const a of applications) if (a.status in counts) counts[a.status] += 1;
  const tally = (grade: string, status: string) => applications.filter((a) => a.gradeApplied === grade && a.status === status).length;
  return {
    id: c.id,
    academicYearId: c.academicYearId,
    academicYearName: c.academicYear.name,
    name: c.name,
    grades,
    documents: parseDocuments(c.documentsJson),
    testRequired: c.testRequired,
    notice: c.notice,
    feeStructureId: c.feeStructureId,
    feeStructureName: c.feeStructure?.name ?? null,
    opensAt: dateKeyOf(c.opensAt),
    closesAt: dateKeyOf(c.closesAt),
    status: c.status as CycleView["status"],
    seats: grades.map((g) => ({
      grade: g.grade,
      seats: g.seats,
      applied: applications.filter((a) => a.gradeApplied === g.grade && a.status !== "WITHDRAWN").length,
      offered: tally(g.grade, "OFFERED"),
      accepted: tally(g.grade, "ACCEPTED"),
      admitted: tally(g.grade, "ADMITTED"),
      waitlisted: tally(g.grade, "WAITLISTED"),
    })),
    counts,
    updatedAt: c.updatedAt.toISOString(),
  };
}

const CYCLE_INCLUDE = { academicYear: { select: { name: true } }, feeStructure: { select: { name: true } }, applications: { select: { gradeApplied: true, status: true, offerExpiresAt: true } } } as const;

/** Every cycle of the school, newest first, with the years and the published structures the editor offers. */
export async function cyclesView(ctx: ActiveContext) {
  const caller = office(ctx);
  const [cycles, years, structures] = await Promise.all([
    db.admissionCycle.findMany({ where: { schoolId: caller.schoolId }, orderBy: [{ createdAt: "desc" }], include: CYCLE_INCLUDE }),
    db.academicYear.findMany({ where: { schoolId: caller.schoolId }, orderBy: { startDate: "desc" }, select: { id: true, name: true, isCurrent: true } }),
    db.feeStructure.findMany({ where: { schoolId: caller.schoolId, publishedAt: { not: null }, archivedAt: null }, orderBy: { name: "asc" }, select: { id: true, name: true, academicYearId: true, gradeLevel: true } }),
  ]);
  return { cycles: cycles.map(cycleView), years, structures };
}

function normaliseCycle(input: CycleSave): CycleSave {
  const seen = new Set<string>();
  const grades = input.grades.filter((g) => (seen.has(g.grade) ? false : (seen.add(g.grade), true)));
  const keys = new Set<string>();
  const documents = input.documents.filter((d) => (keys.has(d.key) ? false : (keys.add(d.key), true)));
  if (input.opensAt && input.closesAt && input.closesAt < input.opensAt) throw new AccessError("admissions.refuseDates");
  return { ...input, grades, documents };
}

async function checkCycleRefs(schoolId: string, input: CycleSave) {
  const year = await db.academicYear.findFirst({ where: { id: input.academicYearId, schoolId }, select: { id: true } });
  if (!year) throw new AccessError("admissions.notFound", "NOT_FOUND");
  if (input.feeStructureId) {
    const structure = await db.feeStructure.findFirst({ where: { id: input.feeStructureId, schoolId, publishedAt: { not: null }, archivedAt: null }, select: { id: true } });
    if (!structure) throw new AccessError("admissions.refuseStructure");
  }
}

function cycleData(input: CycleSave) {
  return {
    academicYearId: input.academicYearId,
    name: input.name,
    gradesJson: writeJson(input.grades),
    documentsJson: writeJson(input.documents),
    testRequired: input.testRequired,
    notice: input.notice,
    feeStructureId: input.feeStructureId,
    opensAt: input.opensAt ? parseDateOnly(input.opensAt) : null,
    closesAt: input.closesAt ? parseDateOnly(input.closesAt) : null,
  };
}

/** Create a cycle. The same name for the same year is the same cycle: it is returned, not doubled. */
export async function createCycle(ctx: ActiveContext, raw: CycleSave): Promise<CycleView> {
  const caller = office(ctx);
  // Designing a cycle is setting the school up: the admin's. The head decides on the families in it.
  if (caller.role !== "ADMIN") throw new AccessError("access.onlyAnAdminSetsUpTheSchool");
  await refuseAtACollege(caller.schoolId);
  const input = normaliseCycle(raw);
  await checkCycleRefs(caller.schoolId, input);
  const existing = await db.admissionCycle.findUnique({ where: { schoolId_academicYearId_name: { schoolId: caller.schoolId, academicYearId: input.academicYearId, name: input.name } }, include: CYCLE_INCLUDE });
  if (existing) return cycleView(existing);
  const created = await db.admissionCycle.create({ data: { schoolId: caller.schoolId, createdByUserId: caller.user.id, ...cycleData(input) }, include: CYCLE_INCLUDE });
  await audit({ schoolId: caller.schoolId, actorUserId: caller.user.id, action: "admissions.cycle", targetType: "AdmissionCycle", targetId: created.id, meta: { grades: input.grades.length, documents: input.documents.length, testRequired: input.testRequired } });
  return cycleView(created);
}

/** Rewrite a cycle's grades, documents, notice, dates and structure; applications already made stand. */
export async function updateCycle(ctx: ActiveContext, cycleId: string, raw: CycleSave): Promise<CycleView> {
  const caller = office(ctx);
  const input = normaliseCycle(raw);
  const cycle = await db.admissionCycle.findFirst({ where: { id: cycleId, schoolId: caller.schoolId }, select: { id: true } });
  if (!cycle) throw new AccessError("admissions.notFound", "NOT_FOUND");
  await checkCycleRefs(caller.schoolId, input);
  const twin = await db.admissionCycle.findUnique({ where: { schoolId_academicYearId_name: { schoolId: caller.schoolId, academicYearId: input.academicYearId, name: input.name } }, select: { id: true } });
  if (twin && twin.id !== cycleId) throw new AccessError("admissions.refuseNameTaken");
  const updated = await db.admissionCycle.update({ where: { id: cycleId }, data: cycleData(input), include: CYCLE_INCLUDE });
  await audit({ schoolId: caller.schoolId, actorUserId: caller.user.id, action: "admissions.cycle", targetType: "AdmissionCycle", targetId: cycleId, meta: { grades: input.grades.length, documents: input.documents.length, testRequired: input.testRequired } });
  return cycleView(updated);
}

/** Open or close the door. Opening needs at least one grade; the same state again is a no-op. */
export async function setCycleStatus(ctx: ActiveContext, cycleId: string, status: "OPEN" | "CLOSED"): Promise<CycleView> {
  const caller = office(ctx);
  const cycle = await db.admissionCycle.findFirst({ where: { id: cycleId, schoolId: caller.schoolId }, include: CYCLE_INCLUDE });
  if (!cycle) throw new AccessError("admissions.notFound", "NOT_FOUND");
  if (cycle.status === status) return cycleView(cycle);
  if (status === "OPEN" && parseGrades(cycle.gradesJson).length === 0) throw new AccessError("admissions.refuseNoGrades");
  const updated = await db.admissionCycle.update({ where: { id: cycleId }, data: { status }, include: CYCLE_INCLUDE });
  await audit({ schoolId: caller.schoolId, actorUserId: caller.user.id, action: status === "OPEN" ? "admissions.open" : "admissions.close", targetType: "AdmissionCycle", targetId: cycleId });
  return cycleView(updated);
}

/**
 * Delete what a closed cycle still holds about families it did not admit —
 * the forms and their documents. An admitted child's application stays as
 * the record of how they arrived. Only a CLOSED cycle; the office chooses
 * when (policy 0002, row 29).
 */
export async function purgeCycle(ctx: ActiveContext, cycleId: string): Promise<{ removed: number }> {
  const caller = office(ctx);
  // Deleting families' forms is the admin's call, as creating the cycle was.
  if (caller.role !== "ADMIN") throw new AccessError("access.onlyAnAdminSetsUpTheSchool");
  const cycle = await db.admissionCycle.findFirst({ where: { id: cycleId, schoolId: caller.schoolId }, select: { id: true, status: true } });
  if (!cycle) throw new AccessError("admissions.notFound", "NOT_FOUND");
  if (cycle.status !== "CLOSED") throw new AccessError("admissions.refusePurgeOpen");
  const rows = await db.application.findMany({ where: { cycleId, status: { not: "ADMITTED" } }, select: { id: true, documentsJson: true } });
  const fileIds = rows.flatMap((r) => parseAttached(r.documentsJson).map((d) => d.fileId));
  if (rows.length) await db.application.deleteMany({ where: { id: { in: rows.map((r) => r.id) } } });
  await discard(fileIds);
  await audit({ schoolId: caller.schoolId, actorUserId: caller.user.id, action: "admissions.purge", targetType: "AdmissionCycle", targetId: cycleId, meta: { removed: rows.length, files: fileIds.length } });
  return { removed: rows.length };
}

/* -------------------------------------------------------------------------- */
/* Entrance-test sittings                                                       */
/* -------------------------------------------------------------------------- */

type SlotRow = { id: string; startsAt: Date; endsAt: Date; location: string | null; note: string | null; capacity: number; cancelledAt: Date | null; _count: { applications: number } };
const slotView = (s: SlotRow) => ({ id: s.id, startsAt: s.startsAt.toISOString(), endsAt: s.endsAt.toISOString(), location: s.location, note: s.note, capacity: s.capacity, booked: s._count.applications, cancelledAt: iso(s.cancelledAt) });
/** A sitting's `booked` counts the applications still standing on it; a declined, withdrawn, admitted or expired one keeps its `testSlotId` as the record of where the child sat, and holds no seat. */
const SLOT_INCLUDE = { _count: { select: { applications: { where: { status: { in: LIVE } } } } } } as const;

export async function listSlots(ctx: ActiveContext, cycleId: string) {
  const caller = office(ctx);
  const cycle = await db.admissionCycle.findFirst({ where: { id: cycleId, schoolId: caller.schoolId }, select: { id: true } });
  if (!cycle) throw new AccessError("admissions.notFound", "NOT_FOUND");
  const slots = await db.entranceSlot.findMany({ where: { cycleId }, orderBy: { startsAt: "asc" }, include: SLOT_INCLUDE });
  return { slots: slots.map(slotView) };
}

/** Publish `count` sittings back to back from `startsAt`. A sitting already standing at the same minute is kept, not doubled. */
export async function publishSlots(ctx: ActiveContext, cycleId: string, input: { startsAt: string; durationMinutes: number; count: number; capacity: number; location?: string; note?: string }): Promise<{ created: number }> {
  const caller = office(ctx);
  const cycle = await db.admissionCycle.findFirst({ where: { id: cycleId, schoolId: caller.schoolId }, select: { id: true } });
  if (!cycle) throw new AccessError("admissions.notFound", "NOT_FOUND");
  const start = new Date(input.startsAt);
  if (Number.isNaN(start.getTime())) throw new AccessError("admissions.refuseDates");
  let created = 0;
  for (let i = 0; i < input.count; i += 1) {
    const startsAt = new Date(start.getTime() + i * input.durationMinutes * 60_000);
    const endsAt = new Date(startsAt.getTime() + input.durationMinutes * 60_000);
    const twin = await db.entranceSlot.findFirst({ where: { cycleId, startsAt, cancelledAt: null }, select: { id: true } });
    if (twin) continue;
    await db.entranceSlot.create({ data: { schoolId: caller.schoolId, cycleId, startsAt, endsAt, capacity: input.capacity, location: input.location?.trim() || null, note: input.note?.trim() || null } });
    created += 1;
  }
  await audit({ schoolId: caller.schoolId, actorUserId: caller.user.id, action: "admissions.slots", targetType: "AdmissionCycle", targetId: cycleId, meta: { created, count: input.count, capacity: input.capacity } });
  return { created };
}

/** Cancel a sitting; the families booked on it are released and told. Cancelling twice is a no-op. */
export async function cancelSlot(ctx: ActiveContext, slotId: string): Promise<{ released: number }> {
  const caller = office(ctx);
  const slot = await db.entranceSlot.findFirst({ where: { id: slotId, schoolId: caller.schoolId }, select: { id: true, cycleId: true, cancelledAt: true, applications: { where: { status: { in: LIVE } }, select: { id: true, applicantUserId: true, childName: true } } } });
  if (!slot) throw new AccessError("admissions.notFound", "NOT_FOUND");
  if (slot.cancelledAt) return { released: 0 };
  await db.entranceSlot.update({ where: { id: slotId }, data: { cancelledAt: new Date() } });
  await db.application.updateMany({ where: { testSlotId: slotId, status: { in: LIVE } }, data: { testSlotId: null } });
  for (const a of slot.applications) {
    if (a.applicantUserId) await notify({ userId: a.applicantUserId, schoolId: caller.schoolId, kind: "ADMISSION", titleKey: "admissions.notifSlotCancelled", titleVars: { name: a.childName }, bodyKey: "admissions.notifSlotCancelledBody", url: `/parent/applications/${a.id}` });
  }
  await audit({ schoolId: caller.schoolId, actorUserId: caller.user.id, action: "admissions.slotCancel", targetType: "EntranceSlot", targetId: slotId, meta: { released: slot.applications.length } });
  return { released: slot.applications.length };
}

/* -------------------------------------------------------------------------- */
/* The school's page: what a family sees                                        */
/* -------------------------------------------------------------------------- */

/**
 * The open cycles on a school's page, for any signed-in reader, and the
 * reader's own applications there. A school that has not published its
 * profile is not taking applications through the platform, whatever its
 * cycles say: the directory is the door.
 *
 * EVERY cycle that is OPEN and within its dates is offered (QA-17, 24 October
 * 2026): a mid-year transfer cycle beside next year's admissions is the
 * ordinary case, and only the newest used to be shown or take applications.
 * `open` is the first of them, kept for a phone build that reads one.
 */
export async function schoolAdmissions(ctx: ActiveContext, schoolId: string) {
  const school = await db.school.findFirst({ where: { id: schoolId, removedAt: null, profilePublishedAt: { not: null } }, select: { id: true, kind: true } });
  // A college's page carries no school admission form (TA-269): it admits from its own desk.
  if (!school || isCollegeKind(school.kind)) return { open: null, cycles: [] as OpenCycle[], mine: [] as ApplicationRow[] };
  const [cycles, mine] = await Promise.all([
    forSchool(schoolId, () => openCyclesOf(schoolId)),
    ctx.role === "PARENT" ? familyApplications(ctx, schoolId) : Promise.resolve({ items: [] as ApplicationRow[] }),
  ]);
  return { open: cycles[0] ?? null, cycles, mine: mine.items };
}

/** Open, and within its dates by the school's own calendar day. */
function openTodayWhere(schoolId: string, today: Date) {
  return { schoolId, status: "OPEN", OR: [{ opensAt: null }, { opensAt: { lte: today } }], AND: [{ OR: [{ closesAt: null }, { closesAt: { gte: today } }] }] };
}

async function schoolToday(schoolId: string): Promise<Date> {
  const { timezone } = await db.school.findUniqueOrThrow({ where: { id: schoolId }, select: { timezone: true } });
  return new Date(`${todayKey(timezone)}T00:00:00Z`);
}

type OpenCycle = Awaited<ReturnType<typeof openCyclesOf>>[number];

/** Every cycle taking applications today, the earliest academic year first (this year's mid-year round before next year's). */
async function openCyclesOf(schoolId: string) {
  const today = await schoolToday(schoolId);
  const cycles = await db.admissionCycle.findMany({
    where: openTodayWhere(schoolId, today),
    orderBy: [{ academicYear: { startDate: "asc" } }, { createdAt: "asc" }],
    include: { academicYear: { select: { name: true } }, applications: { where: { status: "ADMITTED" }, select: { gradeApplied: true } } },
  });
  return cycles.map((cycle) => ({
    cycleId: cycle.id,
    name: cycle.name,
    academicYearName: cycle.academicYear.name,
    grades: parseGrades(cycle.gradesJson).map((g) => ({ grade: g.grade, seats: g.seats, remaining: Math.max(0, g.seats - cycle.applications.filter((a) => a.gradeApplied === g.grade).length) })),
    documents: parseDocuments(cycle.documentsJson),
    testRequired: cycle.testRequired,
    notice: cycle.notice,
    closesAt: dateKeyOf(cycle.closesAt),
  }));
}

/* -------------------------------------------------------------------------- */
/* Applying                                                                     */
/* -------------------------------------------------------------------------- */

export type ApplicationRow = {
  id: string; serial: string; status: AdmissionStatus; childName: string; gradeApplied: string; applicantName: string; cycleName: string; schoolName: string; documentsMissing: number; testBooked: boolean; createdAt: string; updatedAt: string;
};

/** Where a new application is announced: the admissions contact if named and still here, else the admins. Same routing as enquiries.ts. */
async function officeUserIds(schoolId: string): Promise<string[]> {
  return forSchool(schoolId, async () => {
    const school = await db.school.findFirst({ where: { id: schoolId }, select: { admissionsContactMembershipId: true } });
    if (school?.admissionsContactMembershipId) {
      const named = await db.membership.findFirst({ where: { id: school.admissionsContactMembershipId, schoolId, status: "ACTIVE", role: { in: [...CONTACTABLE_ROLES] } }, select: { userId: true } });
      if (named) return [named.userId];
    }
    const admins = await db.membership.findMany({ where: { schoolId, status: "ACTIVE", leftAt: null, role: "ADMIN" }, select: { userId: true } });
    return admins.map((a) => a.userId);
  });
}

/** Next number under a lock on the cycle's row, so two forms at once cannot share a serial. */
async function nextSerial(tx: typeof db, cycleId: string, yearName: string): Promise<{ number: number; serial: string }> {
  await tx.$queryRaw`SELECT "id" FROM "AdmissionCycle" WHERE "id" = ${cycleId} FOR UPDATE`;
  const last = await tx.application.aggregate({ where: { cycleId }, _max: { number: true } });
  const number = (last._max.number ?? 0) + 1;
  return { number, serial: `APP/${yearName}/${String(number).padStart(4, "0")}` };
}

async function openCycleForApplying(schoolId: string, cycleId: string) {
  const cycle = await db.admissionCycle.findFirst({ where: { id: cycleId, schoolId }, include: { academicYear: { select: { name: true, startDate: true } } } });
  if (!cycle) throw new AccessError("admissions.notFound", "NOT_FOUND");
  return cycle;
}

/**
 * The child's date of birth on an application or an admission (A3-journeys-5):
 * not in the future, and of an age the grade takes at the start of the
 * cycle's year (birthdate-rules.ts: grade + 3 to grade + 8). Refused with a
 * sentence; an absent date is not checked here (the PEN link asks for it).
 */
function checkBirthdate(birthdate: Date | null, grade: string, yearStart: Date): void {
  const problem = schoolBirthdateProblem(birthdate, grade, yearStart);
  if (!problem) return;
  if (problem.kind === "grade") throw new AccessError("admissions.refuseBirthdateGrade", "FORBIDDEN", { grade: problem.grade, min: problem.min, max: problem.max });
  throw new AccessError("admissions.refuseBirthdateFuture");
}

/**
 * The entrance-test score (A3-journeys-24): a number from 0 to 100, or marks
 * out of a total ("38/50", the total at most 1,000), with at most two
 * decimals; blank is no score (a note alone may be recorded). The note is its
 * own field — "78; excellent!!" is refused here and the words go in the note.
 */
export function parseTestScore(raw: string | null | undefined): { ok: true; score: string | null } | { ok: false } {
  const text = (raw ?? "").trim();
  if (text === "") return { ok: true, score: null };
  const num = String.raw`\d{1,4}(?:\.\d{1,2})?`;
  const out = new RegExp(`^(${num})\\s*/\\s*(${num})$`).exec(text);
  if (out) {
    const got = Number(out[1]);
    const of = Number(out[2]);
    return of > 0 && of <= 1000 && got <= of ? { ok: true, score: `${out[1]}/${out[2]}` } : { ok: false };
  }
  if (!new RegExp(`^${num}$`).test(text)) return { ok: false };
  return Number(text) <= 100 ? { ok: true, score: text } : { ok: false };
}

/**
 * A guardian applies for a child. The cycle must be open and within its
 * dates and the grade one it takes; the applicant's name, phone and email
 * come from their account, never from the form. The same child in the same
 * cycle from the same account is the same application.
 */
export async function apply(ctx: ActiveContext, input: ApplicationSave & { schoolId: string }): Promise<ApplicationView> {
  const caller = family(ctx);
  // A PER-PERSON BUDGET (TA-181): each new application takes a serial, a row in the school's pipeline and a notice to
  // the office, and a new child's name is a new application. Counted per account, before anything is read.
  const gate = await consume(`admissions-apply:${caller.user.id}`, APPLICATION_TRIES.limit, APPLICATION_TRIES.windowMs);
  if (!gate.allowed) throw new AccessError("admissions.refuseTooManyTries");
  const school = await db.school.findFirst({ where: { id: input.schoolId, removedAt: null, profilePublishedAt: { not: null } }, select: { id: true, name: true, kind: true } });
  if (!school) throw new AccessError("admissions.notFound", "NOT_FOUND");
  // Not at a college (TA-269), read off the row the family can see.
  if (isCollegeKind(school.kind)) throw new NotForThisKindError(school.kind, "schoolCampus.refuseNotThisKind");
  const { id, created } = await forSchool(school.id, async () => {
    const cycle = await openCycleForApplying(school.id, input.cycleId);
    // Any cycle open by its status and dates takes applications, not only the newest (QA-17).
    const openNow = await db.admissionCycle.count({ where: { id: cycle.id, ...openTodayWhere(school.id, await schoolToday(school.id)) } });
    if (openNow === 0) throw new AccessError("admissions.refuseClosed");
    if (!parseGrades(cycle.gradesJson).some((g) => g.grade === input.gradeApplied)) throw new AccessError("admissions.refuseGrade");
    checkBirthdate(input.childBirthdate ? parseDateOnly(input.childBirthdate) : null, input.gradeApplied, cycle.academicYear.startDate);
    const made = await db.$tenantTransaction(async (raw) => {
      const tx = raw as typeof db;
      const { number, serial } = await nextSerial(tx, cycle.id, cycle.academicYear.name);
      // ⚠ THE TWIN UNDER THE CYCLE'S LOCK (TA-182): looked for before the transaction, two presses of a slow apply both
      // found none and made two applications with two serials. nextSerial has locked the cycle, so the second waits here
      // and finds the first.
      const twin = await tx.application.findFirst({ where: { cycleId: cycle.id, applicantUserId: caller.user.id, childName: { equals: input.childName, mode: "insensitive" }, status: { not: "WITHDRAWN" } }, select: { id: true } });
      if (twin) return { twinId: twin.id };
      // A ceiling on one account's live applications in a cycle (TA-181): a family applies for its children, not for a list of names.
      const live = await tx.application.count({ where: { cycleId: cycle.id, applicantUserId: caller.user.id, status: { in: LIVE } } });
      if (live >= LIVE_APPLICATIONS_PER_CYCLE) throw new AccessError("admissions.refuseTooManyLive", "FORBIDDEN", { max: LIVE_APPLICATIONS_PER_CYCLE });
      return tx.application.create({
        data: {
          schoolId: school.id, cycleId: cycle.id, number, serial,
          applicantUserId: caller.user.id, applicantName: caller.user.preferredName ?? caller.user.name, applicantPhone: null, applicantEmail: caller.user.email,
          relation: input.relation ?? "PARENT",
          childName: input.childName, childBirthdate: input.childBirthdate ? parseDateOnly(input.childBirthdate) : null, gradeApplied: input.gradeApplied,
          previousSchool: input.previousSchool?.trim() || null, penNumber: input.penNumber?.trim() || null, addressLine: input.addressLine?.trim() || null, city: input.city?.trim() || null, note: input.note?.trim() || null,
          createdByUserId: caller.user.id,
        },
        select: { id: true, serial: true },
      });
    });
    if ("twinId" in made) return { id: made.twinId, created: false };
    await audit({ schoolId: school.id, actorUserId: caller.user.id, action: "admissions.apply", targetType: "Application", targetId: made.id, meta: { cycleId: cycle.id, grade: input.gradeApplied, byOffice: false } });
    return { id: made.id, created: true };
  });
  if (created) {
    const recipients = await officeUserIds(school.id);
    await forSchool(school.id, () => Promise.all(recipients.map((userId) => notify({ userId, schoolId: school.id, kind: "ADMISSION", titleKey: "admissions.notifNew", titleVars: { grade: input.gradeApplied }, body: input.childName, url: `/admin/admissions/applications/${id}` }))));
  }
  return applicationView(ctx, id);
}

/** The office enters a family that walked in. The applicant's name is required; there is no account behind it. */
export async function officeApply(ctx: ActiveContext, input: ApplicationSave): Promise<ApplicationView> {
  const caller = office(ctx);
  await refuseAtACollege(caller.schoolId);
  if (!input.applicantName?.trim()) throw new AccessError("admissions.refuseApplicantName");
  const cycle = await openCycleForApplying(caller.schoolId, input.cycleId);
  if (cycle.status === "CLOSED") throw new AccessError("admissions.refuseClosed");
  if (!parseGrades(cycle.gradesJson).some((g) => g.grade === input.gradeApplied)) throw new AccessError("admissions.refuseGrade");
  checkBirthdate(input.childBirthdate ? parseDateOnly(input.childBirthdate) : null, input.gradeApplied, cycle.academicYear.startDate);
  const applicantName = input.applicantName.trim();
  const created = await db.$tenantTransaction(async (raw) => {
    const tx = raw as typeof db;
    const { number, serial } = await nextSerial(tx, cycle.id, cycle.academicYear.name);
    // The twin under the cycle's lock, as apply looks for it (TA-182): two presses of Save make one walk-in.
    const twin = await tx.application.findFirst({ where: { cycleId: cycle.id, applicantUserId: null, applicantName: { equals: applicantName, mode: "insensitive" }, childName: { equals: input.childName, mode: "insensitive" }, status: { not: "WITHDRAWN" } }, select: { id: true } });
    if (twin) return { twinId: twin.id };
    return tx.application.create({
      data: {
        schoolId: caller.schoolId, cycleId: cycle.id, number, serial,
        applicantUserId: null, applicantName: input.applicantName!.trim(), applicantPhone: input.applicantPhone?.trim() || null, applicantEmail: input.applicantEmail?.trim() || null,
        relation: input.relation ?? "PARENT",
        childName: input.childName, childBirthdate: input.childBirthdate ? parseDateOnly(input.childBirthdate) : null, gradeApplied: input.gradeApplied,
        previousSchool: input.previousSchool?.trim() || null, penNumber: input.penNumber?.trim() || null, addressLine: input.addressLine?.trim() || null, city: input.city?.trim() || null, note: input.note?.trim() || null,
        createdByUserId: caller.user.id,
      },
      select: { id: true },
    });
  });
  if ("twinId" in created) return applicationView(ctx, created.twinId);
  await audit({ schoolId: caller.schoolId, actorUserId: caller.user.id, action: "admissions.apply", targetType: "Application", targetId: created.id, meta: { cycleId: cycle.id, grade: input.gradeApplied, byOffice: true } });
  return applicationView(ctx, created.id);
}

/* -------------------------------------------------------------------------- */
/* Reading                                                                      */
/* -------------------------------------------------------------------------- */

type Bare = { id: string; schoolId: string; applicantUserId: string | null };

/** The row, and whose it is: the office of its school, or its applicant. Anyone else: 404. */
async function bare(ctx: ActiveContext, applicationId: string): Promise<Bare & { asOffice: boolean }> {
  const row = await db.application.findFirst({ where: { id: applicationId }, select: { id: true, schoolId: true, applicantUserId: true } });
  if (!row) throw new AccessError("admissions.notFound", "NOT_FOUND");
  const asOffice = Boolean(ctx.role && OFFICE.includes(ctx.role) && ctx.schoolId === row.schoolId);
  const asApplicant = ctx.role === "PARENT" && row.applicantUserId === ctx.user.id;
  if (!asOffice && !asApplicant) throw new AccessError("admissions.notFound", "NOT_FOUND");
  return { ...row, asOffice };
}

const APP_INCLUDE = {
  cycle: { select: { id: true, name: true, testRequired: true, documentsJson: true, status: true, academicYear: { select: { name: true } } } },
  school: { select: { id: true, name: true, timezone: true } },
  testSlot: { include: SLOT_INCLUDE },
  feeStructure: { select: { name: true } },
} as const;

export async function applicationView(ctx: ActiveContext, applicationId: string): Promise<ApplicationView> {
  const who = await bare(ctx, applicationId);
  return forSchool(who.schoolId, async () => {
    const a = await db.application.findUniqueOrThrow({ where: { id: applicationId }, include: APP_INCLUDE });
    const documents = parseAttached(a.documentsJson);
    const required = parseDocuments(a.cycle.documentsJson);
    const status = effectiveStatus(a);
    const live = LIVE.includes(status);
    const offerOpen = status === "OFFERED" && (!a.offerExpiresAt || a.offerExpiresAt.getTime() >= Date.now());
    const needsSlot = a.cycle.testRequired && !a.testedAt && live;
    const openSlots = needsSlot
      ? (await db.entranceSlot.findMany({ where: { cycleId: a.cycle.id, cancelledAt: null, startsAt: { gte: new Date() } }, orderBy: { startsAt: "asc" }, include: SLOT_INCLUDE })).map(slotView).filter((s) => s.booked < s.capacity || s.id === a.testSlotId)
      : [];
    const office = who.asOffice;
    return {
      id: a.id,
      serial: a.serial,
      status,
      cycle: { id: a.cycle.id, name: a.cycle.name, academicYearName: a.cycle.academicYear.name, testRequired: a.cycle.testRequired, documents: required, status: a.cycle.status as "DRAFT" | "OPEN" | "CLOSED" },
      school: { id: a.school.id, name: a.school.name },
      applicantUserId: a.applicantUserId,
      applicantName: a.applicantName,
      applicantPhone: a.applicantPhone,
      applicantEmail: a.applicantEmail,
      relation: a.relation,
      childName: a.childName,
      childBirthdate: dateKeyOf(a.childBirthdate),
      gradeApplied: a.gradeApplied,
      previousSchool: a.previousSchool,
      penNumber: a.penNumber,
      addressLine: a.addressLine,
      city: a.city,
      note: a.note,
      documents,
      documentsMissing: missingKeys(required, documents),
      documentsVerifiedAt: iso(a.documentsVerifiedAt),
      testSlot: a.testSlot ? slotView(a.testSlot) : null,
      testScore: a.testScore,
      testNote: a.testNote,
      testedAt: iso(a.testedAt),
      offeredAt: iso(a.offeredAt),
      offerExpiresAt: iso(a.offerExpiresAt),
      // The day, read in the school's zone: the instant is that day's end there (R-62).
      offerExpiresOn: a.offerExpiresAt ? dateKeyInZone(a.offerExpiresAt, a.school.timezone) : null,
      offerNote: a.offerNote,
      respondedAt: iso(a.respondedAt),
      decisionNote: a.decisionNote,
      decidedAt: iso(a.decidedAt),
      admittedMembershipId: a.admittedMembershipId,
      admittedAt: iso(a.admittedAt),
      feeStructureName: a.feeStructure?.name ?? null,
      createdAt: a.createdAt.toISOString(),
      can: {
        uploadDocuments: live && !a.documentsVerifiedAt,
        bookTest: needsSlot,
        // The family answers its own offer; the office records only a walk-in's, which no account can (TA-179).
        respond: offerOpen && (!office || !a.applicantUserId),
        withdraw: !office && status !== "ADMITTED" && status !== "WITHDRAWN",
        verifyDocuments: office && live && !a.documentsVerifiedAt && documents.length > 0,
        recordTest: office && live && a.cycle.testRequired,
        offer: office && (status === "SUBMITTED" || status === "WAITLISTED" || status === "EXPIRED"),
        decide: office && (status === "SUBMITTED" || status === "WAITLISTED" || status === "OFFERED" || status === "EXPIRED"),
        admit: office && status === "ACCEPTED",
      },
      openSlots,
    };
  });
}

type ListRow = { id: string; serial: string; status: string; offerExpiresAt: Date | null; childName: string; gradeApplied: string; applicantName: string; documentsJson: string; testSlotId: string | null; createdAt: Date; updatedAt: Date; cycle: { name: string; documentsJson: string }; school: { name: string } };
const listRow = (a: ListRow): ApplicationRow => ({
  id: a.id, serial: a.serial, status: effectiveStatus(a), childName: a.childName, gradeApplied: a.gradeApplied, applicantName: a.applicantName,
  cycleName: a.cycle.name, schoolName: a.school.name, documentsMissing: missingKeys(parseDocuments(a.cycle.documentsJson), parseAttached(a.documentsJson)).length, testBooked: Boolean(a.testSlotId),
  createdAt: a.createdAt.toISOString(), updatedAt: a.updatedAt.toISOString(),
});
const LIST_INCLUDE = { cycle: { select: { name: true, documentsJson: true } }, school: { select: { name: true } } } as const;

/** The filter's idea of a status is the reader's (`effectiveStatus`): "offered" is an offer still open, "expired" one past its date whether or not the job has written it yet. */
function statusWhere(status: AdmissionStatus, now: Date) {
  if (status === "OFFERED") return { status: "OFFERED", OR: [{ offerExpiresAt: null }, { offerExpiresAt: { gte: now } }] };
  if (status === "EXPIRED") return { OR: [{ status: "EXPIRED" }, { status: "OFFERED", offerExpiresAt: { lt: now } }] };
  return { status };
}

/** The office's pipeline: every application to the school, filtered by cycle, status or grade, newest first. */
export async function officeApplications(ctx: ActiveContext, query: { cycleId?: string; status?: AdmissionStatus; grade?: string }): Promise<{ items: ApplicationRow[] }> {
  const caller = office(ctx);
  const rows = await db.application.findMany({ where: { schoolId: caller.schoolId, ...(query.cycleId ? { cycleId: query.cycleId } : {}), ...(query.status ? statusWhere(query.status, new Date()) : {}), ...(query.grade ? { gradeApplied: query.grade } : {}) }, orderBy: { createdAt: "desc" }, include: LIST_INCLUDE });
  return { items: rows.map(listRow) };
}

/** A family's own applications, everywhere — read by the applicant clause, then named under each school's binding. */
export async function familyApplications(ctx: ActiveContext, schoolId?: string): Promise<{ items: ApplicationRow[] }> {
  const caller = family(ctx);
  const mine = await db.application.findMany({ where: { applicantUserId: caller.user.id, ...(schoolId ? { schoolId } : {}) }, select: { id: true, schoolId: true }, orderBy: { createdAt: "desc" } });
  const bySchool = new Map<string, string[]>();
  for (const m of mine) bySchool.set(m.schoolId, [...(bySchool.get(m.schoolId) ?? []), m.id]);
  const items: ApplicationRow[] = [];
  for (const [sid, ids] of bySchool) {
    const rows = await forSchool(sid, () => db.application.findMany({ where: { id: { in: ids } }, include: LIST_INCLUDE }));
    items.push(...rows.map(listRow));
  }
  items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return { items };
}

/* -------------------------------------------------------------------------- */
/* The family's steps                                                           */
/* -------------------------------------------------------------------------- */

/**
 * Attach documents, one per key of the cycle's list. The attachments are
 * already stored and already this person's (the web action stored them in
 * this request; the phone's came through tickets the route checked). A key
 * sent again replaces the earlier file, which is discarded.
 */
export async function attachDocuments(ctx: ActiveContext, applicationId: string, documents: { key: string; attachment: Attachment }[]): Promise<ApplicationView> {
  const who = await bare(ctx, applicationId);
  await forSchool(who.schoolId, async () => {
    const a = await db.application.findUniqueOrThrow({ where: { id: applicationId }, select: { status: true, documentsJson: true, documentsVerifiedAt: true, cycle: { select: { documentsJson: true } } } });
    if (!LIVE.includes(a.status as AdmissionStatus) || a.documentsVerifiedAt) throw new AccessError("admissions.refuseDocumentsClosed");
    const allowed = new Set(parseDocuments(a.cycle.documentsJson).map((d) => d.key));
    for (const d of documents) if (!allowed.has(d.key)) throw new AccessError("admissions.refuseDocumentKey");
    const current = parseAttached(a.documentsJson);
    const replaced: string[] = [];
    const now = new Date().toISOString();
    for (const d of documents) {
      const old = current.find((c) => c.key === d.key);
      if (old) replaced.push(old.fileId);
      const next: ApplicationDocument = { key: d.key, fileId: d.attachment.fileId, name: d.attachment.name, mime: d.attachment.mime, size: d.attachment.size, uploadedAt: now };
      const at = current.findIndex((c) => c.key === d.key);
      if (at >= 0) current[at] = next;
      else current.push(next);
    }
    await db.application.update({ where: { id: applicationId }, data: { documentsJson: writeJson(current) } });
    await discard(replaced.filter((id) => !documents.some((d) => d.attachment.fileId === id)));
    await audit({ schoolId: who.schoolId, actorUserId: ctx.user.id, action: "admissions.documents", targetType: "Application", targetId: applicationId, meta: { keys: documents.map((d) => d.key), byOffice: who.asOffice } });
  });
  return applicationView(ctx, applicationId);
}

/** Book a sitting, or move to another; the count is checked under a lock on the slot's row. The same sitting again is a no-op. */
export async function bookSlot(ctx: ActiveContext, applicationId: string, slotId: string): Promise<ApplicationView> {
  const who = await bare(ctx, applicationId);
  await forSchool(who.schoolId, async () => {
    const a = await db.application.findUniqueOrThrow({ where: { id: applicationId }, select: { status: true, testSlotId: true, testedAt: true, cycleId: true, childName: true, cycle: { select: { testRequired: true } } } });
    // The sitting already held is answered as it stands, even once the test
    // is sat — a form sent twice must not become a refusal.
    if (a.testSlotId === slotId) return;
    if (!a.cycle.testRequired) throw new AccessError("admissions.refuseNoTest");
    if (!LIVE.includes(a.status as AdmissionStatus) || a.testedAt) throw new AccessError("admissions.refuseTestDone");
    await db.$tenantTransaction(async (raw) => {
      const tx = raw as typeof db;
      await tx.$queryRaw`SELECT "id" FROM "EntranceSlot" WHERE "id" = ${slotId} FOR UPDATE`;
      const slot = await tx.entranceSlot.findFirst({ where: { id: slotId, cycleId: a.cycleId, cancelledAt: null, startsAt: { gte: new Date() } }, select: { id: true, capacity: true, ...SLOT_INCLUDE } });
      if (!slot) throw new AccessError("admissions.notFound", "NOT_FOUND");
      if (slot._count.applications >= slot.capacity) throw new AccessError("admissions.refuseSlotFull");
      await tx.application.update({ where: { id: applicationId }, data: { testSlotId: slotId } });
    });
    await audit({ schoolId: who.schoolId, actorUserId: ctx.user.id, action: "admissions.book", targetType: "Application", targetId: applicationId, meta: { slotId, moved: Boolean(a.testSlotId), byOffice: who.asOffice } });
  });
  return applicationView(ctx, applicationId);
}

/** Accept or decline an offer. Expired offers cannot be answered; the same answer twice is a no-op. */
export async function respond(ctx: ActiveContext, applicationId: string, input: { answer: "ACCEPT" | "DECLINE"; note?: string }): Promise<ApplicationView> {
  const who = await bare(ctx, applicationId);
  // A family with an account answers for itself (TA-179): the office records the answer of a walk-in only, whom no
  // account stands behind and who said yes or no at the counter.
  if (who.asOffice && who.applicantUserId) throw new AccessError("admissions.refuseFamilyAnswers");
  const next = input.answer === "ACCEPT" ? "ACCEPTED" : "DECLINED";
  await forSchool(who.schoolId, async () => {
    const a = await db.application.findUniqueOrThrow({ where: { id: applicationId }, select: { status: true, offerExpiresAt: true, respondedAt: true, childName: true, gradeApplied: true } });
    if (a.status === next && a.respondedAt) return;
    if (effectiveStatus(a) === "EXPIRED") throw new AccessError("admissions.refuseOfferExpired");
    if (a.status !== "OFFERED") throw new AccessError("admissions.refuseNoOffer");
    // ⚠ ON THE STATE IT READ (TA-182): the office taking the offer back, or the hour's expiry, landing between the read
    // and this write wins, and the answer is refused as the state that now stands says, not written over it.
    const now = new Date();
    const moved = await db.application.updateMany({ where: { id: applicationId, status: "OFFERED", OR: [{ offerExpiresAt: null }, { offerExpiresAt: { gte: now } }] }, data: { status: next, respondedAt: now, decisionNote: input.note?.trim() || null } });
    if (moved.count === 0) {
      const stands = await db.application.findUniqueOrThrow({ where: { id: applicationId }, select: { status: true, offerExpiresAt: true, respondedAt: true } });
      if (stands.status === next && stands.respondedAt) return;
      throw new AccessError(effectiveStatus(stands) === "EXPIRED" ? "admissions.refuseOfferExpired" : "admissions.refuseNoOffer");
    }
    await audit({ schoolId: who.schoolId, actorUserId: ctx.user.id, action: "admissions.respond", targetType: "Application", targetId: applicationId, meta: { answer: input.answer, byOffice: who.asOffice } });
    const recipients = await officeUserIds(who.schoolId);
    await Promise.all(recipients.map((userId) => notify({ userId, schoolId: who.schoolId, kind: "ADMISSION", titleKey: input.answer === "ACCEPT" ? "admissions.notifAccepted" : "admissions.notifDeclined", titleVars: { name: a.childName, grade: a.gradeApplied }, url: `/admin/admissions/applications/${applicationId}` })));
  });
  return applicationView(ctx, applicationId);
}

/** The family takes the application back. Not after admission; twice is a no-op. */
export async function withdraw(ctx: ActiveContext, applicationId: string): Promise<ApplicationView> {
  const who = await bare(ctx, applicationId);
  if (who.asOffice && ctx.role !== "PARENT") throw new AccessError("admissions.refuseFamily");
  await forSchool(who.schoolId, async () => {
    const a = await db.application.findUniqueOrThrow({ where: { id: applicationId }, select: { status: true, childName: true, testSlotId: true } });
    if (a.status === "WITHDRAWN") return;
    if (a.status === "ADMITTED") throw new AccessError("admissions.refuseAdmitted");
    // ⚠ NOT OVER AN ADMISSION (TA-182). Admit holds the row's lock while it seats the child; a Withdraw that read
    // ACCEPTED before Admit committed waited on that lock and then wrote WITHDRAWN over ADMITTED, leaving a child on
    // the roll whose application says withdrawn and whose seat the grade gives again. The write is conditional, so
    // it is re-checked once the lock is released.
    const moved = await db.application.updateMany({ where: { id: applicationId, status: { notIn: ["WITHDRAWN", "ADMITTED"] } }, data: { status: "WITHDRAWN", testSlotId: null, decidedAt: new Date() } });
    if (moved.count === 0) {
      const stands = await db.application.findUniqueOrThrow({ where: { id: applicationId }, select: { status: true } });
      if (stands.status === "WITHDRAWN") return;
      throw new AccessError("admissions.refuseAdmitted");
    }
    await audit({ schoolId: who.schoolId, actorUserId: ctx.user.id, action: "admissions.withdraw", targetType: "Application", targetId: applicationId });
    const recipients = await officeUserIds(who.schoolId);
    await Promise.all(recipients.map((userId) => notify({ userId, schoolId: who.schoolId, kind: "ADMISSION", titleKey: "admissions.notifWithdrawn", titleVars: { name: a.childName }, url: `/admin/admissions/applications/${applicationId}` })));
  });
  return applicationView(ctx, applicationId);
}

/* -------------------------------------------------------------------------- */
/* The office's steps                                                           */
/* -------------------------------------------------------------------------- */

async function officeApplication(ctx: ActiveContext, applicationId: string) {
  const caller = office(ctx);
  const a = await db.application.findFirst({ where: { id: applicationId, schoolId: caller.schoolId }, include: { cycle: { select: { id: true, testRequired: true, gradesJson: true, feeStructureId: true, academicYearId: true, academicYear: { select: { name: true, startDate: true } } } }, testSlot: { select: { startsAt: true } } } });
  if (!a) throw new AccessError("admissions.notFound", "NOT_FOUND");
  return { caller, a };
}

async function tellApplicant(a: { id: string; schoolId: string; applicantUserId: string | null; childName: string }, titleKey: "admissions.notifOffer" | "admissions.notifDecided" | "admissions.notifAdmitted" | "admissions.notifVerified" | "admissions.notifTested" | "admissions.notifOfferExpired", vars: Record<string, string | number> = {}) {
  if (!a.applicantUserId) return;
  await notify({ userId: a.applicantUserId, schoolId: a.schoolId, kind: "ADMISSION", titleKey, titleVars: { name: a.childName, ...vars }, url: `/parent/applications/${a.id}` });
}

/** Mark the documents checked. Twice is a no-op. */
export async function verifyDocuments(ctx: ActiveContext, applicationId: string): Promise<ApplicationView> {
  const { caller, a } = await officeApplication(ctx, applicationId);
  if (!a.documentsVerifiedAt) {
    if (parseAttached(a.documentsJson).length === 0) throw new AccessError("admissions.refuseNoDocuments");
    await db.application.update({ where: { id: applicationId }, data: { documentsVerifiedAt: new Date() } });
    await audit({ schoolId: caller.schoolId, actorUserId: caller.user.id, action: "admissions.verify", targetType: "Application", targetId: applicationId });
    await tellApplicant(a, "admissions.notifVerified");
  }
  return applicationView(ctx, applicationId);
}

/** Record the entrance-test result. A blank score with a note is allowed; recording again overwrites. */
export async function recordTest(ctx: ActiveContext, applicationId: string, input: { score: string | null; note?: string }): Promise<ApplicationView> {
  const { caller, a } = await officeApplication(ctx, applicationId);
  if (!a.cycle.testRequired) throw new AccessError("admissions.refuseNoTest");
  if (!LIVE.includes(a.status as AdmissionStatus)) throw new AccessError("admissions.refuseSettled");
  const score = parseTestScore(input.score);
  if (!score.ok) throw new AccessError("admissions.refuseTestScore");
  // Not before the sitting (A3-journeys-24): a result for a sitting booked a fortnight ahead is not a result. By the school's day; no sitting booked (a test the office held in person) is not checked.
  if (a.testSlot) {
    const { timezone } = await db.school.findUniqueOrThrow({ where: { id: caller.schoolId }, select: { timezone: true } });
    const sittingKey = dateKeyInZone(a.testSlot.startsAt, timezone);
    if (todayKey(timezone) < sittingKey) throw new AccessError("admissions.refuseTestBeforeSitting", "FORBIDDEN", { date: formatDateKey(sittingKey, { day: "numeric", month: "numeric", year: "numeric" }) });
  }
  const first = !a.testedAt;
  await db.application.update({ where: { id: applicationId }, data: { testScore: score.score, testNote: input.note?.trim() || null, testedAt: a.testedAt ?? new Date() } });
  await audit({ schoolId: caller.schoolId, actorUserId: caller.user.id, action: "admissions.test", targetType: "Application", targetId: applicationId, meta: { hasScore: score.score !== null } });
  if (first) await tellApplicant(a, "admissions.notifTested");
  return applicationView(ctx, applicationId);
}

/** Offer the seat. From the pool, the waitlist, or after an offer the family let lapse; an offer already standing is left as it is. */
export async function offer(ctx: ActiveContext, applicationId: string, input: { expiresOn: string | null; note?: string; feeStructureId?: string | null }): Promise<ApplicationView> {
  const { caller, a } = await officeApplication(ctx, applicationId);
  if (a.status === "OFFERED" && effectiveStatus(a) === "OFFERED") return applicationView(ctx, applicationId);
  if (a.status !== "SUBMITTED" && a.status !== "WAITLISTED" && a.status !== "EXPIRED" && a.status !== "OFFERED") throw new AccessError("admissions.refuseSettled");
  const feeStructureId = input.feeStructureId === undefined ? a.cycle.feeStructureId : input.feeStructureId;
  if (feeStructureId) {
    const structure = await db.feeStructure.findFirst({ where: { id: feeStructureId, schoolId: caller.schoolId, publishedAt: { not: null }, archivedAt: null }, select: { id: true } });
    if (!structure) throw new AccessError("admissions.refuseStructure");
  }
  // THE ANSWER-BY DAY (A3-journeys-3 and -4): today or later on the school's calendar, and the offer closes at the
  // end of that day in the SCHOOL'S zone — the last instant before its midnight — so every reader in that zone prints
  // the day the office typed and the family has the whole of it. It was 23:59:59.999 UTC: printed a day late in
  // Kolkata and open until 05:29 the next morning; and a day already gone was accepted and the family told.
  const { timezone } = await db.school.findUniqueOrThrow({ where: { id: caller.schoolId }, select: { timezone: true } });
  if (input.expiresOn && (!isDateKey(input.expiresOn) || input.expiresOn < todayKey(timezone))) throw new AccessError("admissions.refuseOfferPast");
  const expires = input.expiresOn ? new Date(zonedStartOfDay(addDaysToKey(input.expiresOn, 1), timezone).getTime() - 1) : null;
  // On the state it read (TA-182): a family's Withdraw or another desk's step landing first stands.
  const moved = await db.application.updateMany({ where: { id: applicationId, status: a.status }, data: { status: "OFFERED", offeredAt: new Date(), offerExpiresAt: expires, offerNote: input.note?.trim() || null, respondedAt: null, decidedAt: null, decisionNote: null, feeStructureId } });
  if (moved.count === 0) {
    const stands = await db.application.findUniqueOrThrow({ where: { id: applicationId }, select: { status: true, offerExpiresAt: true } });
    if (stands.status === "OFFERED" && effectiveStatus(stands) === "OFFERED") return applicationView(ctx, applicationId);
    throw new AccessError("admissions.refuseSettled");
  }
  await audit({ schoolId: caller.schoolId, actorUserId: caller.user.id, action: "admissions.offer", targetType: "Application", targetId: applicationId, meta: { expires: input.expiresOn, hasStructure: Boolean(feeStructureId), from: effectiveStatus(a) } });
  await tellApplicant(a, "admissions.notifOffer", { grade: a.gradeApplied });
  const school = await db.school.findUniqueOrThrow({ where: { id: caller.schoolId }, select: { name: true, locale: true } });
  if (a.applicantEmail) {
    // In the applicant's own language when they have an account that says, else the school's.
    const applicant = a.applicantUserId ? await db.user.findUnique({ where: { id: a.applicantUserId }, select: { prefs: true } }) : null;
    const prefs = applicant ? readJson<{ locale?: string }>(applicant.prefs, {}) : {};
    const locale = normaliseLocale(prefs.locale ?? school.locale);
    const w = wordsFor(locale);
    const vars = { name: a.childName, school: school.name, grade: a.gradeApplied };
    const lines = [w("admissions.emailBody", vars)];
    if (input.expiresOn) lines.push(w("admissions.respondBy", { date: formatDateKey(input.expiresOn, { day: "numeric", month: "numeric", year: "numeric" }) }));
    lines.push(a.applicantUserId ? w("admissions.emailOpen") : w("admissions.emailContactOffice"));
    await sendAdmissionOffer({ to: a.applicantEmail, subject: w("admissions.emailSubject", vars), heading: w("admissions.emailHeading", vars), lines, cta: a.applicantUserId ? { label: w("admissions.emailCta"), path: `/parent/applications/${applicationId}` } : null, locale }).catch((error) => console.error("[admissions] offer email failed", error));
  }
  return applicationView(ctx, applicationId);
}

/** Decline, waitlist, or put back into the pool (which also takes back an unanswered or lapsed offer). The same state again is a no-op. */
export async function decide(ctx: ActiveContext, applicationId: string, input: { status: "DECLINED" | "WAITLISTED" | "SUBMITTED"; note?: string }): Promise<ApplicationView> {
  const { caller, a } = await officeApplication(ctx, applicationId);
  if (a.status === input.status) return applicationView(ctx, applicationId);
  if (a.status !== "SUBMITTED" && a.status !== "WAITLISTED" && a.status !== "OFFERED" && a.status !== "EXPIRED") throw new AccessError("admissions.refuseSettled");
  const from = effectiveStatus(a);
  // On the state it read (TA-182): a family's Accept or Withdraw landing first stands, and is not written over.
  const moved = await db.application.updateMany({ where: { id: applicationId, status: a.status }, data: { status: input.status, decisionNote: input.note?.trim() || null, decidedAt: new Date(), ...(from === "OFFERED" || from === "EXPIRED" ? { offeredAt: null, offerExpiresAt: null, offerNote: null } : {}) } });
  if (moved.count === 0) {
    const stands = await db.application.findUniqueOrThrow({ where: { id: applicationId }, select: { status: true } });
    if (stands.status === input.status) return applicationView(ctx, applicationId);
    throw new AccessError("admissions.refuseSettled");
  }
  await audit({ schoolId: caller.schoolId, actorUserId: caller.user.id, action: "admissions.decide", targetType: "Application", targetId: applicationId, meta: { from, to: input.status } });
  if (input.status !== "SUBMITTED") await tellApplicant(a, "admissions.notifDecided");
  return applicationView(ctx, applicationId);
}

/**
 * The hourly job `admissions:expire-offers`: every OFFERED application whose
 * date has passed becomes EXPIRED, decided now with no note, and the family
 * is told the way a decline tells them. Readers already treat such a row as
 * EXPIRED (`effectiveStatus`); this writes it down so the pipeline's filter,
 * the exports and the row itself agree with what every page has been
 * showing. One audit row per run with the count and no names — the run is
 * the operator's, outside any tenant, and stays safe to be so. Per school
 * the count only. The second run finds nothing and changes nothing.
 */
export async function expireOffers(now: Date = new Date()): Promise<{ summary: { expired: number; schools: number }; perSchool: Record<string, Record<string, number>> }> {
  const schools = await db.school.findMany({ where: { removedAt: null }, select: { id: true } });
  const perSchool: Record<string, Record<string, number>> = {};
  let expired = 0;
  for (const school of schools) {
    await forSchool(school.id, async () => {
      const due = await db.application.findMany({ where: { schoolId: school.id, status: "OFFERED", offerExpiresAt: { lt: now } }, select: { id: true, schoolId: true, applicantUserId: true, childName: true, gradeApplied: true } });
      for (const a of due) {
        // Guarded on the status, so an answer that landed between the read and this write wins.
        const moved = await db.application.updateMany({ where: { id: a.id, status: "OFFERED" }, data: { status: "EXPIRED", decidedAt: now, decisionNote: null } });
        if (moved.count === 0) continue;
        expired += 1;
        perSchool[school.id] = { expired: (perSchool[school.id]?.expired ?? 0) + 1 };
        await tellApplicant(a, "admissions.notifOfferExpired", { grade: a.gradeApplied });
      }
    });
  }
  await audit({ schoolId: null, actorUserId: null, action: "admissions.expireOffers", meta: { expired, schools: Object.keys(perSchool).length } });
  return { summary: { expired, schools: Object.keys(perSchool).length }, perSchool };
}

/** The login handle `joinAsStudent` and intake mint, so an admitted pupil's looks like any other's. */
function handleFor(name: string, code: string): string {
  const base = name.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 12) || "student";
  return `${base}.${code.slice(-4).toLowerCase()}`;
}

export type Admitted = {
  studentMembershipId: string;
  studentCode: string;
  className: string | null;
  feePlan: boolean;
  guardianLinked: boolean;
  firstSignInCode: string | null;
  /** Why `guardianLinked` is false when the applicant had an account: the seat went to an existing pupil, whose guardians were told. */
  noteKey?: "admissions.guardianNotLinked";
};

/** An admission already made, answered as it stands: the second press of Admit, and a replay. */
async function asAdmitted(membershipId: string): Promise<Admitted> {
  const m = await db.membership.findUniqueOrThrow({ where: { id: membershipId }, select: { id: true, studentCode: true, enrollments: { where: { status: "ACTIVE" }, select: { class: { select: { name: true } } }, take: 1 }, feePlans: { select: { id: true }, take: 1 }, guardianships: { where: { status: "ACTIVE" }, select: { id: true }, take: 1 } } });
  return { studentMembershipId: m.id, studentCode: m.studentCode ?? "", className: m.enrollments[0]?.class.name ?? null, feePlan: m.feePlans.length > 0, guardianLinked: m.guardianships.length > 0, firstSignInCode: null };
}

/**
 * The seat. From an ACCEPTED application: the pupil's account, membership,
 * enrolment, guardianship for the applicant, pupil record and fee plan in
 * one transaction; then the first sign-in code and the class teacher as
 * stand-in guardian when nobody accepted from an account. Seats are counted
 * against the grade's number. Already admitted: answered as it stands.
 */
export async function admit(ctx: ActiveContext, applicationId: string, input: { classId?: string | null; feeStructureId?: string | null; admissionNumber?: string; admittedOn?: string }): Promise<Admitted> {
  const { caller, a } = await officeApplication(ctx, applicationId);
  if (a.status === "ADMITTED" && a.admittedMembershipId) return asAdmitted(a.admittedMembershipId);
  await refuseAtACollege(caller.schoolId);
  if (a.status !== "ACCEPTED") throw new AccessError("admissions.refuseNotAccepted");
  const seats = parseGrades(a.cycle.gradesJson).find((g) => g.grade === a.gradeApplied)?.seats ?? 0;
  const taken = await db.application.count({ where: { cycleId: a.cycle.id, gradeApplied: a.gradeApplied, status: "ADMITTED" } });
  if (taken >= seats) throw new AccessError("admissions.refuseSeatsFull", "FORBIDDEN", { grade: a.gradeApplied, seats });

  const klass = input.classId ? await db.class.findFirst({ where: { id: input.classId, schoolId: caller.schoolId, archivedAt: null }, select: { id: true, name: true, gradeLevel: true } }) : null;
  if (input.classId && !klass) throw new AccessError("admissions.notFound", "NOT_FOUND");
  // The seat is in the grade applied for (A3-journeys-40): a class of another grade is refused, not quietly given.
  // A class the school has given no grade cannot be checked and is taken as the office chose it.
  if (klass?.gradeLevel && klass.gradeLevel.trim().toLowerCase() !== a.gradeApplied.trim().toLowerCase()) throw new AccessError("admissions.refuseClassGrade", "FORBIDDEN", { grade: a.gradeApplied });
  // A date of birth written before the rule (A3-journeys-5) is not carried onto the roll.
  checkBirthdate(a.childBirthdate, a.gradeApplied, a.cycle.academicYear.startDate);
  const feeStructureId = input.feeStructureId === undefined ? a.feeStructureId : input.feeStructureId;
  const structure = feeStructureId ? await db.feeStructure.findFirst({ where: { id: feeStructureId, schoolId: caller.schoolId, publishedAt: { not: null }, archivedAt: null }, select: { id: true, academicYearId: true } }) : null;
  if (feeStructureId && !structure) throw new AccessError("admissions.refuseStructure");
  const applicantUser = a.applicantUserId ? await db.user.findUnique({ where: { id: a.applicantUserId }, select: { id: true, prefs: true } }) : null;
  const { locale, timezone } = await db.school.findUniqueOrThrow({ where: { id: caller.schoolId }, select: { locale: true, timezone: true } });

  const birthdate = a.childBirthdate;
  const age = birthdate ? ageInYears(birthdate) : null;
  const code = studentCode();
  const handle = handleFor(a.childName, code);
  // THE ADMISSION DATE (R-68, the transfer walk of 6 October): a transfer recorded late carried today's date on the
  // membership, the record and the re-dated instalments (the boy joined on 15 June; the record said 6 October). The
  // office may now say the day: not before the cycle's year began, not after today on the school's clock; today otherwise.
  const today = todayKey(timezone);
  const yearStart = a.cycle.academicYear.startDate.toISOString().slice(0, 10);
  // AHEAD OF THE YEAR (QA-43, the owner's decision of 24 October 2026): a seat in a cycle whose year has not begun may be
  // given now, as schools do in the spring. The admission is dated the year's first day (nothing else; a date the year
  // has not reached cannot be a day the pupil joined), and no class is given yet: the school's classes run this year, so
  // a pupil placed in one now would sit in this year's registers and be promoted at this year's close.
  const ahead = yearStart > today;
  const admittedOn = input.admittedOn ?? (ahead ? yearStart : today);
  if (ahead) {
    if (admittedOn !== yearStart) throw new AccessError("admissions.refuseAheadDate", "FORBIDDEN", { date: yearStart });
    if (klass) throw new AccessError("admissions.refuseAheadClass");
  } else if (!isDateKey(admittedOn) || admittedOn > today || admittedOn < yearStart) throw new AccessError("familyGaps.refuseAdmittedOn");
  const todayIso = new Date(`${admittedOn}T00:00:00Z`);

  // A PEN with the date of birth names an account already on Shalaghar: the seat
  // goes to that pupil, as a transfer by student code would give it, and
  // their certificates and records follow them. A PEN nobody holds goes on
  // the new account.
  //
  // ⚠ THE SAME HANDSHAKE AS INTAKE (pen.ts, `mayBringOver`): the child is on
  // no other school's roll and this school is verified by the operator. A
  // mismatched birthdate, a child still elsewhere and an unverified school
  // are refused with the ONE key intake carries, so an application is not a
  // second way to test a birthday against a number. And the applicant is
  // NOT made a guardian of an account that already exists — an application
  // form is not proof of parenthood over a child the platform already knows;
  // the child's existing guardians are told instead, and the office is shown
  // why the family is not linked.
  let existingUserId: string | null = null;
  if (a.penNumber) {
    const match = await matchPen(a.penNumber, birthdate);
    if (match && "reasonKey" in match) throw new AccessError(match.reasonKey === "intake.penNeedsBirthdate" ? "admissions.refusePenNeedsBirthdate" : "intake.identityRefused");
    if (match) existingUserId = match.userId;
  }
  if (existingUserId) {
    const here = await db.membership.findFirst({ where: { userId: existingUserId, schoolId: caller.schoolId, role: "STUDENT", status: { in: ["ACTIVE", "PENDING"] }, leftAt: null }, select: { id: true } });
    if (here) throw new AccessError("admissions.refuseAlreadyOnRoll");
    if (!(await mayBringOver(caller.schoolId, existingUserId))) throw new AccessError("intake.identityRefused");
  }
  // A KNOWN PUPIL'S OWN GUARDIAN (R-67, the transfer walk): when the PEN names an account the platform knows, the
  // applicant is linked at the new school only if they already hold an ACTIVE guardianship on that child somewhere —
  // the father who filed the walk-in had to claim his son again, and a stand-in guardian sat there meanwhile. The
  // link carries the consents a claim's approval would set; a stranger applicant still claims.
  const priorGuardian = applicantUser && existingUserId ? await db.guardianship.findFirst({ where: { parentUserId: applicantUser.id, status: "ACTIVE", student: { userId: existingUserId, role: "STUDENT" } }, select: { id: true } }) : null;
  const guardianLinked = Boolean(applicantUser) && (!existingUserId || priorGuardian !== null);
  const minted = await db.$tenantTransaction(async (raw) => {
    const tx = raw as typeof db;
    // ⚠ LOCK, THEN READ AGAIN (QA-04, QA campaign of 24 October 2026). The office and the head pressing Admit on one
    // application at the same moment each passed the status check and the seat count above, read before this
    // transaction, and each made a pupil: two accounts, two memberships, two enrolments, the guardian linked to both, a
    // seat count of one of one. Now the cycle is locked first (every admit of the cycle queues here, so two different
    // applications cannot both take a grade's last seat) and then the application, and both are read again under the
    // lock: the second press finds the application ADMITTED and is answered with that admission as it stands, before
    // anything is created.
    await tx.$queryRaw`SELECT "id" FROM "AdmissionCycle" WHERE "id" = ${a.cycle.id} FOR UPDATE`;
    await tx.$queryRaw`SELECT "id" FROM "Application" WHERE "id" = ${applicationId} FOR UPDATE`;
    const now = await tx.application.findUniqueOrThrow({ where: { id: applicationId }, select: { status: true, admittedMembershipId: true } });
    if (now.status === "ADMITTED" && now.admittedMembershipId) return { kind: "already" as const, membershipId: now.admittedMembershipId, feePlan: false };
    if (now.status !== "ACCEPTED") throw new AccessError("admissions.refuseNotAccepted");
    if ((await tx.application.count({ where: { cycleId: a.cycle.id, gradeApplied: a.gradeApplied, status: "ADMITTED" } })) >= seats) throw new AccessError("admissions.refuseSeatsFull", "FORBIDDEN", { grade: a.gradeApplied, seats });
    const user = existingUserId
      ? { id: existingUserId }
      : await tx.user.create({ data: { name: a.childName, preferredName: null, email: `${handle}@${HANDLE_DOMAIN}`, passwordHash: null, birthdate, isMinor: age === null ? true : age < 18, penNumber: a.penNumber, prefs: writeJson({ theme: "system", locale }) }, select: { id: true } });
    // A pupil who once left this school and comes back through the PEN takes their old membership up again: one row per person and school, as the schema says.
    const prior = existingUserId ? await tx.membership.findUnique({ where: { userId_schoolId_role: { userId: existingUserId, schoolId: caller.schoolId, role: "STUDENT" } }, select: { id: true } }) : null;
    // Back on the roll: the departure record is closed (kept on the TC register, LIFECYCLE-7) and its scheduled leaving goes, as the join-code path does, so no certificate prints the old leaving date.
    if (prior) {
      await closeLeavingRecord(tx, caller.schoolId, prior.id, "READMITTED");
      await tx.scheduledDeparture.deleteMany({ where: { membershipId: prior.id, schoolId: caller.schoolId } });
      // Back on the roll, so no longer an alumnus here (alumni-membership.ts).
      if (existingUserId) await closeAlumnus(tx as unknown as Parameters<typeof closeAlumnus>[0], existingUserId, caller.schoolId);
    }
    const membership = prior
      ? await tx.membership.update({ where: { id: prior.id }, data: { status: "ACTIVE", leftAt: null, suspendedAt: null, suspendedReason: null, studentCode: code, joinedAt: todayIso }, select: { id: true } })
      : await tx.membership.create({ data: { userId: user.id, schoolId: caller.schoolId, role: "STUDENT", status: "ACTIVE", studentCode: code, joinedAt: todayIso }, select: { id: true } });
    if (klass) await tx.enrollment.upsert({ where: { classId_studentMembershipId: { classId: klass.id, studentMembershipId: membership.id } }, create: { classId: klass.id, schoolId: caller.schoolId, studentMembershipId: membership.id, status: "ACTIVE" }, update: { status: "ACTIVE", removedAt: null } });
    await syncGradeLevel(tx, [membership.id]);
    if (applicantUser && guardianLinked) {
      // Upserted: a pupil who once left this school and comes back keeps their old membership, and may keep its guardianship row too.
      const now = new Date();
      await tx.guardianship.upsert({
        where: { parentUserId_studentMembershipId: { parentUserId: applicantUser.id, studentMembershipId: membership.id } },
        create: { parentUserId: applicantUser.id, studentMembershipId: membership.id, studentSchoolId: caller.schoolId, relation: a.relation, status: "ACTIVE", consentSharingAt: now, consentNotificationsAt: now },
        update: { status: "ACTIVE", relation: a.relation, consentSharingAt: now, consentNotificationsAt: now },
      });
    }
    const recordData = { addressLine: a.addressLine, city: a.city, admissionNumber: input.admissionNumber?.trim() || a.serial, admissionDate: todayIso, admittedToGrade: a.gradeApplied, previousSchool: a.previousSchool, penNumber: a.penNumber, updatedByUserId: caller.user.id };
    await tx.pupilRecord.upsert({ where: { studentMembershipId: membership.id }, create: { schoolId: caller.schoolId, studentMembershipId: membership.id, ...recordData }, update: recordData });
    let feePlan = false;
    if (structure) {
      await tx.studentFeePlan.upsert({ where: { studentMembershipId_academicYearId: { studentMembershipId: membership.id, academicYearId: structure.academicYearId } }, create: { schoolId: caller.schoolId, studentMembershipId: membership.id, structureId: structure.id, academicYearId: structure.academicYearId }, update: { structureId: structure.id } });
      await regenerateDemands(tx, caller.schoolId, membership.id, structure.academicYearId);
      feePlan = true;
    }
    await tx.application.update({ where: { id: applicationId }, data: { status: "ADMITTED", admittedMembershipId: membership.id, admittedAt: new Date(), feeStructureId: structure?.id ?? null } });
    return { kind: "minted" as const, membershipId: membership.id, feePlan };
  });
  if (minted.kind === "already") return asAdmitted(minted.membershipId);

  // The existing guardians of a linked account — at whichever school they
  // guard the child — hear that a school has admitted the child on the PEN.
  // Guardianship rows are unfenced; the sentence names the school and the
  // child, never the applicant.
  let guardiansTold = 0;
  if (existingUserId) {
    const existingGuardians = await db.guardianship.findMany({ where: { status: "ACTIVE", student: { userId: existingUserId, role: "STUDENT" }, studentMembershipId: { not: minted.membershipId } }, select: { parentUserId: true } });
    const schoolName = (await db.school.findUniqueOrThrow({ where: { id: caller.schoolId }, select: { name: true } })).name;
    const recipients = [...new Set(existingGuardians.map((g) => g.parentUserId))].filter((id) => id !== a.applicantUserId);
    await Promise.all(recipients.map((userId) => notify({ userId, schoolId: caller.schoolId, kind: "ADMISSION", titleKey: "admissions.notifLinkedByPen", titleVars: { name: a.childName, school: schoolName }, bodyKey: "admissions.notifLinkedByPenBody", bodyVars: { school: schoolName }, urgent: true }).catch((error) => console.error("[admissions] existing guardian not told", error))));
    guardiansTold = recipients.length;
  }
  await audit({ schoolId: caller.schoolId, actorUserId: caller.user.id, action: "admissions.admit", targetType: "Application", targetId: applicationId, meta: { membershipId: minted.membershipId, classId: klass?.id ?? null, feePlan: minted.feePlan, guardianLinked, guardianNotLinked: Boolean(applicantUser) && !guardianLinked, guardianCarried: priorGuardian !== null, existingGuardiansTold: guardiansTold, hasBirthdate: birthdate !== null, needsConsent: age !== null && age < CONSENT_AGE, linkedByPen: Boolean(existingUserId), admittedOn } });
  await audit({ schoolId: caller.schoolId, actorUserId: caller.user.id, action: "student.admit", targetType: "Membership", targetId: minted.membershipId, meta: { classId: klass?.id ?? null, hasBirthdate: birthdate !== null, ownAddress: false, fromApplication: true } });
  if (!guardianLinked) {
    await syncStandinGuardian({ schoolId: caller.schoolId, studentMembershipId: minted.membershipId, actorUserId: caller.user.id }).catch((error) => console.error("[admissions] standin sync failed", error));
  }
  let firstSignInCode: string | null = null;
  // A pupil who already had a login keeps it; a new account gets its slip.
  if (caller.role === "ADMIN" && !existingUserId) {
    const issued = await issueFirstSignIn(ctx, minted.membershipId).catch((error) => { console.error("[admissions] first sign-in not issued", error); return null; });
    if (issued?.ok) firstSignInCode = issued.issued.code;
  }
  await tellApplicant(a, "admissions.notifAdmitted", { grade: a.gradeApplied });
  return { studentMembershipId: minted.membershipId, studentCode: code, className: klass?.name ?? null, feePlan: minted.feePlan, guardianLinked, firstSignInCode, ...(applicantUser && !guardianLinked ? { noteKey: "admissions.guardianNotLinked" as const } : {}) };
}

/* -------------------------------------------------------------------------- */
/* Files                                                                        */
/* -------------------------------------------------------------------------- */

/** For files.ts: the application a stored document belongs to, and who may open it — its applicant and its school's office. */
export async function applicationOwningFile(ref: string): Promise<{ schoolId: string; applicantUserId: string | null } | null> {
  return db.application.findFirst({ where: { documentsJson: { contains: ref } }, select: { schoolId: true, applicantUserId: true } });
}
