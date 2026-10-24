import "server-only";
import {
  CLINICAL_REQUIREMENTS,
  CLINICAL_STREAMS,
  isDutyRole,
  type ClinicalDesk,
  type ClinicalDepartmentSave,
  type ClinicalPosting,
  type ClinicalPostingSave,
  type ClinicalSite,
  type ClinicalSiteKind,
  type ClinicalSiteSave,
  type ClinicalSupervision,
  type ClinicalContactRole,
  type FamilyClinical,
  type LogbookEntry,
  type LogbookEntrySave,
  type LogbookKind,
  type LogbookQueueRow,
  type LogbookState,
} from "@edulink/contracts";
import { db } from "./db";
import { AccessError } from "./access-error";
import { RuleRefusal } from "./rule-refusal";
import { audit } from "./audit";
import { notify } from "./notify";
import { streamsOf } from "./streams";
import { todayKey } from "./dates";
import { deskCaller } from "./duty-desks";
import { hasDuty } from "./duties";
import { assertCollege, assertModuleOn } from "./modules";
import { stripIdentifiers } from "./assistant/strip";
import type { ActiveContext } from "./session";

/**
 * THE CLINICAL COORDINATOR'S DESK (R-56, the clinical half; 10 October 2026),
 * after the teaching-practice desk's model (teaching-practice.ts). A
 * health-sciences or pharmacy college keeps the sites its students are posted
 * to (the teaching hospital, a PHC, a clinic, a hospital pharmacy) with their
 * departments, posts a division or one of its lab batches to a department for
 * a span of days under a supervising faculty member in a rotation's order,
 * and each student keeps a logbook of the posting — a case, a procedure, a
 * skill, dispensing — which the posting's supervisor or the coordinator signs
 * or returns.
 *
 * WHO DOES WHAT. The coordinator (a FACULTY or HOD holding
 * CLINICAL_COORDINATOR) and the office keep sites and departments; the
 * coordinator alone posts; the posting's supervisor or the coordinator signs
 * or returns an entry; the head and the office read the desk; a student
 * writes and hands in their own entries and reads their own logbook — and no
 * guardian reads any of it (adult students' own records; no family door).
 * A college with neither clinical stream is answered `offered: false` and
 * refused every write (409).
 *
 * NO PATIENT IDENTIFIERS (decision 0002's stripping rule): a note that carries
 * a phone number, an e-mail, a link, a platform id, a hospital-style code or a
 * run of six digits or more is refused on save (422), never stored. The
 * student's counts on the desk are counted from the rows on read.
 */

const nameOf = (u: { name: string; preferredName: string | null }) => u.preferredName ?? u.name;
const DUTY = "CLINICAL_COORDINATOR" as const;

export async function clinicalOffered(schoolId: string): Promise<boolean> {
  const streams = await streamsOf(schoolId);
  return streams.some((s) => CLINICAL_STREAMS.includes(s));
}

async function todayAt(schoolId: string): Promise<string> {
  const school = await db.school.findUniqueOrThrow({ where: { id: schoolId }, select: { timezone: true } });
  return todayKey(school.timezone);
}

/**
 * A NAME, BY THE WORDS THAT INTRODUCE ONE (QA-49, 24 Oct 2026). "Patient Ramesh Gaikwad, bed 4: dressing changed"
 * passed, though the refusal promises "what looks like a name". A name the app has never seen cannot be told from a
 * word, so the check reads the words a note names a patient with: a patient word ("patient", "pt", "name") or an
 * honorific (Mr, Mrs, Ms, Miss, Shri, Smt, Kumari, Master, "Baby of") followed by a capitalised word that is not a
 * clinical word ("Patient education given" stays), and the Devanagari honorifics (श्री, श्रीमती, सौ., कु.) before a
 * word. A capitalised name with no such word before it ("Ramesh Gaikwad dressed") is still not found: the honest
 * limit, stated in docs/qa's register; the supervisor's sign-off is the second line.
 */
const NAME_CUE = /(?<![\p{L}\p{N}])(patient's|patient|pt|named|name|mrs|mr|ms|miss|shree|shri|sri|smt|kumari|kum|master|baby\s+of)(?![\p{L}\p{N}])\.?\s*[:\-–]?\s*(\p{L}+)/giu;
/** Capitalised words that follow "Patient" in a clinical note without naming anyone. */
const NOT_A_PATIENT_NAME = new Set(["education", "history", "counselling", "counseling", "care", "safety", "positioning", "assessment", "admission", "admitted", "discharge", "discharged", "transfer", "transferred", "monitoring", "teaching", "records", "record", "handover", "file", "chart", "satisfaction", "examination", "complained", "complains", "seen", "reviewed", "shifted", "stable", "afebrile", "conscious", "ambulatory"]);
const DEVANAGARI_HONORIFIC = /(?<![\p{L}\p{M}])(?:(?:श्रीमती|श्री)\s+|(?:सौ|कु)\.\s*)[\u0900-\u097F]{2,}/u;
/** A hospital's number for the patient: a UHID or MRN with digits, or an IP, IPD, OPD, registration, case or file number written as one. Bed and ward numbers stay: a bed names nobody. */
const HOSPITAL_NUMBER = /(?<![\p{L}\p{N}])(?:uhid|mrn)\s*(?:no\.?|number|#)?\s*[:\-.]?\s*\d/iu;
const NUMBERED_RECORD = /(?<![\p{L}\p{N}])(?:ipd?|opd|reg|registration|hospital|case|file)\.?\s*(?:no\.?|number|#)\s*[:\-.]?\s*\d/iu;

function namesSomeone(note: string): boolean {
  for (const m of note.matchAll(NAME_CUE)) {
    const [cue, word] = [m[1]!, m[2]!];
    // In capitals the short cues are clinical abbreviations: PT INR (prothrombin time), MR (mitral regurgitation), MS.
    if (cue.length === 2 && cue === cue.toUpperCase()) continue;
    if (/^\p{Lu}/u.test(word) && !NOT_A_PATIENT_NAME.has(word.toLowerCase())) return true;
  }
  return DEVANAGARI_HONORIFIC.test(note);
}

/**
 * A logbook note must name no patient: the assistant's stripping finds e-mails,
 * phone numbers, links, platform ids and codes with digits and capitals (an
 * MRN "MRN/2026/0041"); a bare run of six digits or more is a hospital number,
 * and so is an IP, UHID or registration number however short; a name is found
 * by the words that introduce one (namesSomeone). The supervisor's remark is
 * held to the same rule. Pure: tests/clinical.test.ts.
 */
export function noteCarriesIdentifier(note: string): boolean {
  if (/\d{6,}/.test(note)) return true;
  if (HOSPITAL_NUMBER.test(note) || NUMBERED_RECORD.test(note) || namesSomeone(note)) return true;
  const { replacements } = stripIdentifiers(note);
  return replacements.some((r) => r.kind === "EMAIL" || r.kind === "PHONE" || r.kind === "LINK" || r.kind === "ID" || r.kind === "CODE");
}

/* ----------------------------------------------------------- the students */

type Roster = { membershipId: string; name: string; rollNumber: number | null }[];

/** The students of a posting on read: the division's active enrolment, narrowed to the batch's current members when the posting names one. */
async function rosterOf(schoolId: string, classId: string, labBatchId: string | null): Promise<Roster> {
  const rows = await db.enrollment.findMany({ where: { schoolId, classId, status: "ACTIVE", student: { status: "ACTIVE", leftAt: null } }, select: { studentMembershipId: true, rollNumber: true, student: { select: { user: { select: { name: true, preferredName: true } } } } } });
  let keep = new Set(rows.map((r) => r.studentMembershipId));
  if (labBatchId) {
    const members = await db.labBatchMember.findMany({ where: { batchId: labBatchId, untilKey: null }, select: { studentMembershipId: true } });
    keep = new Set(members.map((m) => m.studentMembershipId).filter((id) => keep.has(id)));
  }
  return rows
    .filter((r) => keep.has(r.studentMembershipId))
    .map((r) => ({ membershipId: r.studentMembershipId, name: nameOf(r.student.user), rollNumber: r.rollNumber }))
    .sort((a, b) => (a.rollNumber ?? 9999) - (b.rollNumber ?? 9999) || a.name.localeCompare(b.name));
}

/** Whether a student is among a posting's students today. */
async function postedHere(schoolId: string, studentMembershipId: string, posting: { divisionId: string; labBatchId: string | null }): Promise<boolean> {
  const division = await db.division.findFirst({ where: { id: posting.divisionId, schoolId }, select: { classId: true } });
  if (!division) return false;
  const enrolled = await db.enrollment.findFirst({ where: { schoolId, classId: division.classId, studentMembershipId, status: "ACTIVE" }, select: { id: true } });
  if (!enrolled) return false;
  if (!posting.labBatchId) return true;
  return Boolean(await db.labBatchMember.findFirst({ where: { batchId: posting.labBatchId, studentMembershipId, untilKey: null }, select: { id: true } }));
}

const postingSelect = {
  id: true,
  siteId: true,
  departmentId: true,
  divisionId: true,
  labBatchId: true,
  supervisorMembershipId: true,
  fromKey: true,
  toKey: true,
  rotationOrder: true,
  site: { select: { name: true } },
  department: { select: { name: true } },
  division: { select: { classId: true, class: { select: { name: true } }, programme: { select: { code: true } } } },
  labBatch: { select: { name: true } },
  supervisor: { select: { user: { select: { name: true, preferredName: true } } } },
} as const;

type PostingRow = {
  id: string;
  siteId: string;
  departmentId: string;
  divisionId: string;
  labBatchId: string | null;
  supervisorMembershipId: string;
  fromKey: string;
  toKey: string;
  rotationOrder: number;
  site: { name: string };
  department: { name: string };
  division: { classId: string; class: { name: string }; programme: { code: string } };
  labBatch: { name: string } | null;
  supervisor: { user: { name: string; preferredName: string | null } };
};

/** Today's postings first, then by rotation and start. */
function orderPostings<P extends { fromKey: string; toKey: string; rotationOrder: number }>(rows: P[], today: string): P[] {
  const current = (p: P) => (p.fromKey <= today && today <= p.toKey ? 0 : 1);
  return [...rows].sort((a, b) => current(a) - current(b) || a.rotationOrder - b.rotationOrder || a.fromKey.localeCompare(b.fromKey));
}

type Counts = Map<string, Record<LogbookState, number>>;
const zero = (): Record<LogbookState, number> => ({ DRAFT: 0, SUBMITTED: 0, SIGNED: 0, RETURNED: 0 });

/** The logbook counts per posting and student, from the rows. */
async function countsOf(schoolId: string, postingIds: string[]): Promise<Counts> {
  if (!postingIds.length) return new Map();
  const groups = await db.logbookEntry.groupBy({ by: ["postingId", "studentMembershipId", "state"], where: { schoolId, postingId: { in: postingIds } }, _count: { _all: true } });
  const out: Counts = new Map();
  for (const g of groups) {
    const key = `${g.postingId}:${g.studentMembershipId}`;
    const row = out.get(key) ?? zero();
    row[g.state as LogbookState] = g._count._all;
    out.set(key, row);
  }
  return out;
}

async function postingsView(schoolId: string, rows: PostingRow[], today: string): Promise<ClinicalPosting[]> {
  const counts = await countsOf(schoolId, rows.map((r) => r.id));
  const out: ClinicalPosting[] = [];
  for (const p of orderPostings(rows, today)) {
    const roster = await rosterOf(schoolId, p.division.classId, p.labBatchId);
    out.push({
      id: p.id,
      siteId: p.siteId,
      siteName: p.site.name,
      departmentId: p.departmentId,
      departmentName: p.department.name,
      divisionId: p.divisionId,
      divisionName: p.division.class.name,
      programmeCode: p.division.programme.code,
      labBatchId: p.labBatchId,
      batchName: p.labBatch?.name ?? null,
      supervisorMembershipId: p.supervisorMembershipId,
      supervisorName: nameOf(p.supervisor.user),
      from: p.fromKey,
      to: p.toKey,
      rotationOrder: p.rotationOrder,
      current: p.fromKey <= today && today <= p.toKey,
      students: roster.map((s) => {
        const c = counts.get(`${p.id}:${s.membershipId}`) ?? zero();
        return { membershipId: s.membershipId, name: s.name, rollNumber: s.rollNumber, signed: c.SIGNED, waiting: c.SUBMITTED, returned: c.RETURNED, draft: c.DRAFT };
      }),
    });
  }
  return out;
}

async function queueOf(schoolId: string, where: { supervisorMembershipId?: string }, canSign: (supervisorMembershipId: string) => boolean): Promise<LogbookQueueRow[]> {
  const rows = await db.logbookEntry.findMany({
    where: { schoolId, state: "SUBMITTED", posting: where },
    orderBy: [{ submittedAt: "asc" }],
    take: 300,
    select: { id: true, postingId: true, studentMembershipId: true, onKey: true, kind: true, count: true, note: true, submittedAt: true, student: { select: { user: { select: { name: true, preferredName: true } } } }, posting: { select: { supervisorMembershipId: true, site: { select: { name: true } }, department: { select: { name: true } } } } },
  });
  return rows.map((e) => ({
    id: e.id,
    postingId: e.postingId,
    studentMembershipId: e.studentMembershipId,
    studentName: nameOf(e.student.user),
    departmentName: e.posting.department.name,
    siteName: e.posting.site.name,
    on: e.onKey,
    kind: e.kind as LogbookKind,
    count: e.count,
    note: e.note,
    submittedAt: e.submittedAt?.toISOString() ?? null,
    canSign: canSign(e.posting.supervisorMembershipId),
  }));
}

function siteView(s: { id: string; name: string; kind: string; address: string; agreementFromKey: string | null; agreementToKey: string | null; contactRole: string; departments: { id: string; name: string; beds: number | null; _count: { postings: number } }[] }, today: string): ClinicalSite {
  return {
    id: s.id,
    name: s.name,
    kind: s.kind as ClinicalSiteKind,
    address: s.address,
    agreementFrom: s.agreementFromKey,
    agreementTo: s.agreementToKey,
    agreementLapsed: !s.agreementToKey || s.agreementToKey < today,
    contactRole: s.contactRole as ClinicalContactRole,
    departments: s.departments.map((d) => ({ id: d.id, name: d.name, beds: d.beds, postings: d._count.postings })),
  };
}

/* ----------------------------------------------------------------- reads */

/** The divisions a posting may name: seats on a clinical-stream programme, or every division at a college whose streams are all clinical. */
async function postableDivisions(schoolId: string) {
  const streams = await streamsOf(schoolId);
  const onlyClinical = streams.length > 0 && streams.every((s) => CLINICAL_STREAMS.includes(s));
  const rows = await db.division.findMany({
    where: { schoolId, ...(onlyClinical ? {} : { programme: { stream: { in: [...CLINICAL_STREAMS] } } }) },
    orderBy: [{ programme: { code: "asc" } }, { yearOfStudy: "asc" }],
    select: { id: true, class: { select: { name: true, _count: { select: { enrollments: { where: { status: "ACTIVE" } } } } } }, programme: { select: { code: true } }, labBatches: { orderBy: { name: "asc" }, select: { id: true, name: true } } },
  });
  return rows.map((d) => ({ id: d.id, name: d.class.name, programmeCode: d.programme.code, students: d.class._count.enrollments, batches: d.labBatches }));
}

export async function clinicalDesk(ctx: ActiveContext): Promise<ClinicalDesk> {
  const c = await deskCaller(ctx, DUTY, "ACADEMICS");
  const [today, offered] = await Promise.all([todayAt(c.schoolId), clinicalOffered(c.schoolId)]);
  const [sites, postingRows, supervisors, divisions, entryCounts] = await Promise.all([
    db.clinicalSite.findMany({ where: { schoolId: c.schoolId, archivedAt: null }, orderBy: { name: "asc" }, select: { id: true, name: true, kind: true, address: true, agreementFromKey: true, agreementToKey: true, contactRole: true, departments: { orderBy: { name: "asc" }, select: { id: true, name: true, beds: true, _count: { select: { postings: true } } } } } }),
    db.clinicalPosting.findMany({ where: { schoolId: c.schoolId }, orderBy: [{ fromKey: "desc" }], take: 300, select: postingSelect }),
    db.membership.findMany({ where: { schoolId: c.schoolId, role: { in: ["FACULTY", "HOD"] }, status: "ACTIVE", leftAt: null }, select: { id: true, user: { select: { name: true, preferredName: true } } } }),
    offered ? postableDivisions(c.schoolId) : Promise.resolve([]),
    db.logbookEntry.groupBy({ by: ["state"], where: { schoolId: c.schoolId }, _count: { _all: true } }),
  ]);
  const postings = await postingsView(c.schoolId, postingRows, today);
  const queue = await queueOf(c.schoolId, {}, (supervisor) => c.holder || supervisor === c.membershipId);
  const count = (state: LogbookState) => entryCounts.find((g) => g.state === state)?._count._all ?? 0;
  return {
    offered,
    canManage: offered && (c.role === "ADMIN" || c.holder),
    canPost: offered && c.holder,
    today,
    sites: sites.map((s) => siteView(s, today)),
    postings,
    queue,
    divisions,
    supervisors: supervisors.map((m) => ({ membershipId: m.id, name: nameOf(m.user) })).sort((a, b) => a.name.localeCompare(b.name)),
    requirements: [...CLINICAL_REQUIREMENTS],
    summary: {
      sites: sites.length,
      postings: postings.length,
      current: postings.filter((p) => p.current).length,
      students: new Set(postings.flatMap((p) => p.students.map((s) => s.membershipId))).size,
      entries: count("DRAFT") + count("SUBMITTED") + count("SIGNED") + count("RETURNED"),
      signed: count("SIGNED"),
      waiting: count("SUBMITTED"),
    },
  };
}

/** A teacher's own side of the desk: the postings they supervise and the entries waiting for their signature; no duty needed. */
export async function clinicalSupervision(ctx: ActiveContext): Promise<ClinicalSupervision> {
  if (!ctx.schoolId || !ctx.membershipId || !ctx.role) throw new AccessError("access.noActiveSchoolSelected");
  if (!isDutyRole(ctx.role)) throw new AccessError("access.wrongRoleForThisAction");
  await assertCollege(ctx.schoolId);
  await assertModuleOn(ctx.schoolId, "ACADEMICS");
  const [today, offered] = await Promise.all([todayAt(ctx.schoolId), clinicalOffered(ctx.schoolId)]);
  const rows = await db.clinicalPosting.findMany({ where: { schoolId: ctx.schoolId, supervisorMembershipId: ctx.membershipId }, orderBy: [{ fromKey: "desc" }], take: 100, select: postingSelect });
  const postings = await postingsView(ctx.schoolId, rows, today);
  const queue = await queueOf(ctx.schoolId, { supervisorMembershipId: ctx.membershipId }, () => true);
  return { offered, today, postings, queue };
}

/* ---------------------------------------------------------------- writes */

async function manager(ctx: ActiveContext) {
  const c = await deskCaller(ctx, DUTY, "ACADEMICS", ["ADMIN"]);
  if (!(await clinicalOffered(c.schoolId))) throw new RuleRefusal("duties.clinical.refuseNotOffered", 409);
  return c;
}

/** A site added or corrected by the coordinator or the office; a second of one name is refused; the agreement cannot end before it starts. */
export async function saveClinicalSite(ctx: ActiveContext, input: ClinicalSiteSave): Promise<{ id: string }> {
  const c = await manager(ctx);
  const name = input.name.trim();
  if (input.agreementFrom && input.agreementTo && input.agreementTo < input.agreementFrom) throw new RuleRefusal("duties.clinical.refuseAgreementDates", 422, undefined, "agreementTo");
  const clash = await db.clinicalSite.findFirst({ where: { schoolId: c.schoolId, name, ...(input.id ? { NOT: { id: input.id } } : {}) }, select: { id: true } });
  if (clash) throw new RuleRefusal("duties.clinical.refuseDuplicateSite", 409, undefined, "name");
  const data = { name, kind: input.kind, address: input.address.trim(), agreementFromKey: input.agreementFrom, agreementToKey: input.agreementTo, contactRole: input.contactRole };
  let id = input.id;
  if (id) {
    const done = await db.clinicalSite.updateMany({ where: { id, schoolId: c.schoolId }, data });
    if (!done.count) throw new AccessError("access.entryNotFound", "NOT_FOUND");
  } else id = (await db.clinicalSite.create({ data: { schoolId: c.schoolId, ...data }, select: { id: true } })).id;
  await audit({ schoolId: c.schoolId, actorUserId: c.userId, action: "duties.clinical.site", targetType: "ClinicalSite", targetId: id, meta: { kind: input.kind, edit: Boolean(input.id) } });
  return { id };
}

/** A ward or department of a site; a second of one name at the site is refused. */
export async function saveClinicalDepartment(ctx: ActiveContext, input: ClinicalDepartmentSave): Promise<{ id: string }> {
  const c = await manager(ctx);
  const site = await db.clinicalSite.findFirst({ where: { id: input.siteId, schoolId: c.schoolId, archivedAt: null }, select: { id: true } });
  if (!site) throw new RuleRefusal("duties.clinical.refuseSite", 422, undefined, "siteId");
  const name = input.name.trim();
  const clash = await db.clinicalDepartment.findFirst({ where: { siteId: site.id, name, ...(input.id ? { NOT: { id: input.id } } : {}) }, select: { id: true } });
  if (clash) throw new RuleRefusal("duties.clinical.refuseDuplicateDepartment", 409, undefined, "name");
  const data = { siteId: site.id, name, beds: input.beds };
  let id = input.id;
  if (id) {
    const done = await db.clinicalDepartment.updateMany({ where: { id, schoolId: c.schoolId }, data });
    if (!done.count) throw new AccessError("access.entryNotFound", "NOT_FOUND");
  } else id = (await db.clinicalDepartment.create({ data: { schoolId: c.schoolId, ...data }, select: { id: true } })).id;
  await audit({ schoolId: c.schoolId, actorUserId: c.userId, action: "duties.clinical.department", targetType: "ClinicalDepartment", targetId: id, meta: { siteId: site.id, beds: input.beds ?? 0, edit: Boolean(input.id) } });
  return { id };
}

/**
 * A division, or one of its lab batches, posted to a department under a
 * supervisor: the coordinator alone. Two postings of the same students may
 * not overlap — a whole division's and any of its batches' count as the same.
 */
export async function saveClinicalPosting(ctx: ActiveContext, input: ClinicalPostingSave): Promise<{ id: string }> {
  const c = await deskCaller(ctx, DUTY, "ACADEMICS", []);
  if (!(await clinicalOffered(c.schoolId))) throw new RuleRefusal("duties.clinical.refuseNotOffered", 409);
  if (input.to < input.from) throw new RuleRefusal("duties.clinical.refuseDates", 422, undefined, "to");
  const [department, division, supervisor] = await Promise.all([
    db.clinicalDepartment.findFirst({ where: { id: input.departmentId, schoolId: c.schoolId, site: { archivedAt: null } }, select: { id: true, siteId: true } }),
    db.division.findFirst({ where: { id: input.divisionId, schoolId: c.schoolId }, select: { id: true } }),
    db.membership.findFirst({ where: { id: input.supervisorMembershipId, schoolId: c.schoolId, role: { in: ["FACULTY", "HOD"] }, status: "ACTIVE", leftAt: null }, select: { id: true } }),
  ]);
  if (!department) throw new RuleRefusal("duties.clinical.refuseDepartment", 422, undefined, "departmentId");
  if (!division) throw new RuleRefusal("duties.clinical.refuseDivision", 422, undefined, "divisionId");
  if (!supervisor) throw new RuleRefusal("duties.clinical.refuseSupervisor", 422, undefined, "supervisorMembershipId");
  if (input.labBatchId) {
    const batch = await db.labBatch.findFirst({ where: { id: input.labBatchId, divisionId: division.id }, select: { id: true } });
    if (!batch) throw new RuleRefusal("duties.clinical.refuseBatch", 422, undefined, "labBatchId");
  }
  const overlap = await db.clinicalPosting.findFirst({
    where: { schoolId: c.schoolId, divisionId: division.id, fromKey: { lte: input.to }, toKey: { gte: input.from }, ...(input.labBatchId ? { OR: [{ labBatchId: null }, { labBatchId: input.labBatchId }] } : {}), ...(input.id ? { NOT: { id: input.id } } : {}) },
    select: { id: true },
  });
  if (overlap) throw new RuleRefusal("duties.clinical.refuseOverlap", 409, undefined, "from");
  const data = { siteId: department.siteId, departmentId: department.id, divisionId: division.id, labBatchId: input.labBatchId, supervisorMembershipId: supervisor.id, fromKey: input.from, toKey: input.to, rotationOrder: input.rotationOrder };
  let id = input.id;
  if (id) {
    const done = await db.clinicalPosting.updateMany({ where: { id, schoolId: c.schoolId }, data });
    if (!done.count) throw new AccessError("access.entryNotFound", "NOT_FOUND");
  } else id = (await db.clinicalPosting.create({ data: { schoolId: c.schoolId, createdByUserId: c.userId, ...data }, select: { id: true } })).id;
  await audit({ schoolId: c.schoolId, actorUserId: c.userId, action: "duties.clinical.posting", targetType: "ClinicalPosting", targetId: id, meta: { departmentId: department.id, divisionId: division.id, batch: Boolean(input.labBatchId), rotationOrder: input.rotationOrder, edit: Boolean(input.id) } });
  return { id };
}

/** Who may sign or return: a FACULTY or HOD at a college with the module on; the right itself is the posting's (the supervisor) or the duty's. */
async function signer(ctx: ActiveContext, entryId: string) {
  if (!ctx.schoolId || !ctx.membershipId || !ctx.role) throw new AccessError("access.noActiveSchoolSelected");
  if (!isDutyRole(ctx.role)) throw new AccessError("access.wrongRoleForThisAction");
  await assertCollege(ctx.schoolId);
  await assertModuleOn(ctx.schoolId, "ACADEMICS");
  const entry = await db.logbookEntry.findFirst({ where: { id: entryId, schoolId: ctx.schoolId }, select: { id: true, state: true, studentMembershipId: true, posting: { select: { id: true, supervisorMembershipId: true } }, student: { select: { userId: true } } } });
  if (!entry) throw new AccessError("access.entryNotFound", "NOT_FOUND");
  const holder = await hasDuty(ctx, DUTY);
  if (!holder && entry.posting.supervisorMembershipId !== ctx.membershipId) throw new AccessError("duties.clinical.refuseNotSupervisor");
  if (entry.state !== "SUBMITTED") throw new RuleRefusal("duties.clinical.refuseNotSubmitted", 409);
  return { schoolId: ctx.schoolId, userId: ctx.user.id, membershipId: ctx.membershipId, entry };
}

/** The supervisor's signature on a handed-in entry: final. */
export async function signLogbookEntry(ctx: ActiveContext, entryId: string, input: { remark: string }, now: Date = new Date()): Promise<{ id: string }> {
  if (noteCarriesIdentifier(input.remark)) throw new RuleRefusal("duties.clinical.refuseRemarkIdentifier", 422, undefined, "remark");
  const c = await signer(ctx, entryId);
  await db.logbookEntry.update({ where: { id: c.entry.id }, data: { state: "SIGNED", signedAt: now, signedByMembershipId: c.membershipId, remark: input.remark.trim() } });
  await audit({ schoolId: c.schoolId, actorUserId: c.userId, action: "duties.clinical.sign", targetType: "LogbookEntry", targetId: c.entry.id, meta: { postingId: c.entry.posting.id } });
  await notify({ userId: c.entry.student.userId, schoolId: c.schoolId, kind: "SYSTEM", titleKey: "duties.clinical.notifySigned", url: "/student/clinical" }).catch(() => undefined);
  return { id: c.entry.id };
}

/** A handed-in entry sent back with a reason: the student corrects it and hands it in again. */
export async function returnLogbookEntry(ctx: ActiveContext, entryId: string, input: { remark: string }): Promise<{ id: string }> {
  if (noteCarriesIdentifier(input.remark)) throw new RuleRefusal("duties.clinical.refuseRemarkIdentifier", 422, undefined, "remark");
  const c = await signer(ctx, entryId);
  await db.logbookEntry.update({ where: { id: c.entry.id }, data: { state: "RETURNED", signedAt: null, signedByMembershipId: c.membershipId, remark: input.remark.trim() } });
  await audit({ schoolId: c.schoolId, actorUserId: c.userId, action: "duties.clinical.return", targetType: "LogbookEntry", targetId: c.entry.id, meta: { postingId: c.entry.posting.id } });
  await notify({ userId: c.entry.student.userId, schoolId: c.schoolId, kind: "SYSTEM", titleKey: "duties.clinical.notifyReturned", url: "/student/clinical" }).catch(() => undefined);
  return { id: c.entry.id };
}

/* -------------------------------------------------------- the student's own */

async function student(ctx: ActiveContext) {
  if (!ctx.schoolId || !ctx.membershipId || ctx.role !== "STUDENT") throw new AccessError("access.wrongRoleForThisAction");
  await assertCollege(ctx.schoolId);
  await assertModuleOn(ctx.schoolId, "ACADEMICS");
  return { schoolId: ctx.schoolId, userId: ctx.user.id, membershipId: ctx.membershipId };
}

/** The postings a student is among: their active enrolments' divisions, and the batch's where the posting names one. */
async function myPostingRows(schoolId: string, membershipId: string): Promise<PostingRow[]> {
  const [enrolments, batches] = await Promise.all([
    db.enrollment.findMany({ where: { schoolId, studentMembershipId: membershipId, status: "ACTIVE" }, select: { classId: true } }),
    db.labBatchMember.findMany({ where: { schoolId, studentMembershipId: membershipId, untilKey: null }, select: { batchId: true } }),
  ]);
  if (!enrolments.length) return [];
  const mine = new Set(batches.map((b) => b.batchId));
  const rows = await db.clinicalPosting.findMany({ where: { schoolId, division: { classId: { in: enrolments.map((e) => e.classId) } } }, orderBy: [{ fromKey: "desc" }], take: 100, select: postingSelect });
  return rows.filter((p) => !p.labBatchId || mine.has(p.labBatchId));
}

function entryView(e: { id: string; clientId: string; postingId: string; onKey: string; kind: string; count: number; note: string; state: string; submittedAt: Date | null; signedAt: Date | null; remark: string; posting: { site: { name: string }; department: { name: string } } }, signedByName: string | null): LogbookEntry {
  return { id: e.id, clientId: e.clientId, postingId: e.postingId, departmentName: e.posting.department.name, siteName: e.posting.site.name, on: e.onKey, kind: e.kind as LogbookKind, count: e.count, note: e.note, state: e.state as LogbookState, submittedAt: e.submittedAt?.toISOString() ?? null, signedAt: e.signedAt?.toISOString() ?? null, signedByName, remark: e.remark };
}

export async function myClinical(ctx: ActiveContext): Promise<FamilyClinical> {
  const c = await student(ctx);
  const [today, offered, rows, entries] = await Promise.all([
    todayAt(c.schoolId),
    clinicalOffered(c.schoolId),
    myPostingRows(c.schoolId, c.membershipId),
    db.logbookEntry.findMany({ where: { schoolId: c.schoolId, studentMembershipId: c.membershipId }, orderBy: [{ onKey: "desc" }, { createdAt: "desc" }], take: 500, select: { id: true, clientId: true, postingId: true, onKey: true, kind: true, count: true, note: true, state: true, submittedAt: true, signedAt: true, signedByMembershipId: true, remark: true, posting: { select: { site: { select: { name: true } }, department: { select: { name: true } } } } } }),
  ]);
  const signerIds = [...new Set(entries.map((e) => e.signedByMembershipId).filter((x): x is string => Boolean(x)))];
  const signers = signerIds.length ? await db.membership.findMany({ where: { id: { in: signerIds } }, select: { id: true, user: { select: { name: true, preferredName: true } } } }) : [];
  const signerName = new Map(signers.map((s) => [s.id, nameOf(s.user)]));
  const postings = orderPostings(rows, today).map((p) => ({
    id: p.id,
    siteId: p.siteId,
    siteName: p.site.name,
    departmentId: p.departmentId,
    departmentName: p.department.name,
    divisionId: p.divisionId,
    divisionName: p.division.class.name,
    programmeCode: p.division.programme.code,
    labBatchId: p.labBatchId,
    batchName: p.labBatch?.name ?? null,
    supervisorMembershipId: p.supervisorMembershipId,
    supervisorName: nameOf(p.supervisor.user),
    from: p.fromKey,
    to: p.toKey,
    rotationOrder: p.rotationOrder,
    current: p.fromKey <= today && today <= p.toKey,
  }));
  const by = (state: LogbookState) => entries.filter((e) => e.state === state).length;
  return { offered, today, postings, entries: entries.map((e) => entryView(e, e.signedByMembershipId ? (signerName.get(e.signedByMembershipId) ?? null) : null)), summary: { signed: by("SIGNED"), waiting: by("SUBMITTED"), returned: by("RETURNED"), draft: by("DRAFT") } };
}

/**
 * A student's entry: new, or a DRAFT or RETURNED one corrected. Idempotent by
 * `clientId` — a replay of the same new entry answers the row it made. The
 * day must be one of the posting's, not in the future; the note must name no
 * patient.
 */
export async function saveLogbookEntry(ctx: ActiveContext, input: LogbookEntrySave): Promise<{ id: string }> {
  const c = await student(ctx);
  if (!(await clinicalOffered(c.schoolId))) throw new RuleRefusal("duties.clinical.refuseNotOffered", 409);
  if (!input.id) {
    const seen = await db.logbookEntry.findUnique({ where: { studentMembershipId_clientId: { studentMembershipId: c.membershipId, clientId: input.clientId } }, select: { id: true } });
    if (seen) return seen;
  }
  const posting = await db.clinicalPosting.findFirst({ where: { id: input.postingId, schoolId: c.schoolId }, select: { id: true, divisionId: true, labBatchId: true, fromKey: true, toKey: true } });
  if (!posting || !(await postedHere(c.schoolId, c.membershipId, posting))) throw new RuleRefusal("duties.clinical.refusePosting", 422, undefined, "postingId");
  const today = await todayAt(c.schoolId);
  if (input.on < posting.fromKey || input.on > posting.toKey || input.on > today) throw new RuleRefusal("duties.clinical.refuseDay", 422, undefined, "on");
  const note = input.note.trim();
  if (noteCarriesIdentifier(note)) throw new RuleRefusal("duties.clinical.refuseIdentifier", 422, undefined, "note");
  const data = { postingId: posting.id, onKey: input.on, kind: input.kind, count: input.count, note };
  let id = input.id;
  if (id) {
    const mine = await db.logbookEntry.findFirst({ where: { id, schoolId: c.schoolId, studentMembershipId: c.membershipId }, select: { id: true, state: true } });
    if (!mine) throw new AccessError("access.entryNotFound", "NOT_FOUND");
    if (mine.state !== "DRAFT" && mine.state !== "RETURNED") throw new RuleRefusal("duties.clinical.refuseNotEditable", 409);
    await db.logbookEntry.update({ where: { id: mine.id }, data });
  } else {
    // The outbox's replay racing the first send (QA-35): both found no row by the clientId and the second create hit
    // the unique key, a 500 the phone kept as a retry. The door is idempotent by clientId, so the loser answers the
    // one entry the winner wrote (and the winner alone audits it).
    try {
      id = (await db.logbookEntry.create({ data: { schoolId: c.schoolId, studentMembershipId: c.membershipId, clientId: input.clientId, ...data }, select: { id: true } })).id;
    } catch (error) {
      if (typeof error !== "object" || error === null || (error as { code?: string }).code !== "P2002") throw error;
      const seen = await db.logbookEntry.findUnique({ where: { studentMembershipId_clientId: { studentMembershipId: c.membershipId, clientId: input.clientId } }, select: { id: true } });
      if (!seen) throw error;
      return seen;
    }
  }
  await audit({ schoolId: c.schoolId, actorUserId: c.userId, action: "clinical.logbook.save", targetType: "LogbookEntry", targetId: id, meta: { kind: input.kind, count: input.count, edit: Boolean(input.id) } });
  return { id };
}

/** The student hands an entry in: DRAFT or RETURNED to SUBMITTED; one already handed in is a no-op; a signed one is refused. */
export async function submitLogbookEntry(ctx: ActiveContext, entryId: string, now: Date = new Date()): Promise<{ id: string }> {
  const c = await student(ctx);
  const mine = await db.logbookEntry.findFirst({ where: { id: entryId, schoolId: c.schoolId, studentMembershipId: c.membershipId }, select: { id: true, state: true } });
  if (!mine) throw new AccessError("access.entryNotFound", "NOT_FOUND");
  if (mine.state === "SUBMITTED") return { id: mine.id };
  if (mine.state === "SIGNED") throw new RuleRefusal("duties.clinical.refuseSigned", 409);
  await db.logbookEntry.update({ where: { id: mine.id }, data: { state: "SUBMITTED", submittedAt: now } });
  await audit({ schoolId: c.schoolId, actorUserId: c.userId, action: "clinical.logbook.submit", targetType: "LogbookEntry", targetId: mine.id, meta: { from: mine.state } });
  return { id: mine.id };
}
