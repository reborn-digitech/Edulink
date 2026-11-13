import "server-only";
import {
  normaliseIsbn,
  LIBRARY_CATEGORIES,
  type LibraryCopyStatus,
  type LibraryFine,
  type LibraryImportResult,
  type LibraryLoan,
  type LibraryLookup,
  type LibraryMemberSummary,
  type LibraryMemberView,
  type LibraryMine,
  type LibraryReports,
  type LibraryReservation,
  type LibraryReturnResult,
  type LibrarySettingsSave,
  type LibrarySettingsView,
  type LibraryStockTake,
  type LibraryTitleCreate,
  type LibraryTitleRow,
  type LibraryTitleSave,
  type LibraryTitleView,
} from "@edulink/contracts";
import type { Prisma } from "@prisma/client";
import { db } from "./db";
import { AccessError, assertGuardianAccess } from "./tenancy";
import { assertModuleOn } from "./modules";
import { audit } from "./audit";
import { notify, notifyGuardians } from "./notify";
import { consentApplies } from "./student-consent";
import { forSchool } from "./tenant-context";
import { addDaysToKey, todayKey } from "./dates";
import { currentAcademicYear } from "./academic-year";
import { dayToDate } from "./fees";
import { parseCsv } from "./csv";
import { writeJson } from "./json";
import { getT } from "./i18n/server";
import { isCollegeKind } from "./institution";
import type { ActiveContext } from "./session";
import type { Role } from "./constants";

/**
 * THE LIBRARY (module LIBRARY, role LIBRARIAN; the owner's decision of
 * 3 October 2026).
 *
 * WHO: the desk is the LIBRARIAN and the office (ADMIN) — they catalogue,
 * lend, take back, renew, keep the queue, raise and waive fines and run the
 * stock-take; the head (PRINCIPAL) reads the desk's lists and reports. A
 * member is a school membership — a pupil's or a member of staff's — and
 * reads their own loans, dues and queue; a guardian reads their child's and
 * may reserve for them. The rules are the school's (LibrarySettings): how
 * many books and for how many days, by kind; how many renewals; the overdue
 * fine per day.
 *
 * ONE LOAN PER COPY, under a lock. A copy goes AVAILABLE → ISSUED only by a
 * conditional update, so two desks scanning one book at once lend it once.
 *
 * THE QUEUE. A title's reservations are served in the order placed: a copy
 * on the shelf with nobody waiting is anyone's; once somebody waits, the
 * next copy back is held for the first in the queue (`readyCopyId`) and lent
 * to nobody else. `rehold` restores that after every change that could
 * break it — a return, a new place in the queue, a cancellation, a copy
 * mended, lost or added — under a lock on the title.
 *
 * MONEY NEVER TOUCHES THE PLATFORM (decision 0003). A fine on a pupil, where
 * the office has named a fee head for fines, is a FeeDemand on the pupil's
 * ledger under that head in the current year, paid with the fees by the
 * family's usual routes; without a head, or for staff, it is a due the
 * office settles at its own counter and records here. Whether a fine is
 * paid is read from that demand, never stored a second time.
 */

const DESK: readonly Role[] = ["LIBRARIAN", "ADMIN"];
const DESK_READ: readonly Role[] = ["LIBRARIAN", "ADMIN", "PRINCIPAL"];
/** The roles whose membership may borrow: the pupil and every member of staff. */
const MEMBER_ROLES: readonly Role[] = ["STUDENT", "TEACHER", "ADMIN", "PRINCIPAL", "LIBRARIAN", "WARDEN", "DRIVER", "FACULTY", "HOD", "EXAM_CONTROLLER", "IQAC", "TPO", "ACCOUNTS"];
const READER_ROLES: readonly Role[] = ["STUDENT", "TEACHER", "ADMIN", "PRINCIPAL", "LIBRARIAN", "FACULTY", "HOD"];
const LENT = ["AVAILABLE", "ISSUED", "REPAIR"];

type Tx = typeof db;
type Desk = { schoolId: string; userId: string; role: Role; membershipId: string; timeZone: string };

export const LIBRARY_DEFAULTS = { pupilLimit: 2, pupilLoanDays: 14, staffLimit: 5, staffLoanDays: 30, maxRenewals: 2, finePerDayPaise: 100, fineHeadId: null as string | null, stockTakeStartedAt: null as Date | null, facultyLimit: 10, facultyLoanDays: 90, collegeStudentLimit: 4, collegeStudentLoanDays: 15, bookBankExtra: 2 };
type Settings = typeof LIBRARY_DEFAULTS;

async function zoneOf(schoolId: string): Promise<string> {
  return (await db.school.findUnique({ where: { id: schoolId }, select: { timezone: true } }))?.timezone ?? "Asia/Kolkata";
}

/** The desk at the session's school, with the module on. `read` lets the head in. */
async function deskOf(ctx: ActiveContext, mode: "write" | "read" = "write"): Promise<Desk> {
  const roles = mode === "write" ? DESK : DESK_READ;
  if (!ctx.schoolId || !ctx.membershipId || !ctx.role || !roles.includes(ctx.role)) throw new AccessError("access.wrongRoleForThisAction");
  await assertModuleOn(ctx.schoolId, "LIBRARY");
  return { schoolId: ctx.schoolId, userId: ctx.user.id, role: ctx.role, membershipId: ctx.membershipId, timeZone: await zoneOf(ctx.schoolId) };
}

export async function librarySettings(schoolId: string): Promise<Settings> {
  const row = await db.librarySettings.findUnique({ where: { schoolId } });
  if (!row) return { ...LIBRARY_DEFAULTS };
  return { pupilLimit: row.pupilLimit, pupilLoanDays: row.pupilLoanDays, staffLimit: row.staffLimit, staffLoanDays: row.staffLoanDays, maxRenewals: row.maxRenewals, finePerDayPaise: row.finePerDayPaise, fineHeadId: row.fineHeadId, stockTakeStartedAt: row.stockTakeStartedAt, facultyLimit: row.facultyLimit, facultyLoanDays: row.facultyLoanDays, collegeStudentLimit: row.collegeStudentLimit, collegeStudentLoanDays: row.collegeStudentLoanDays, bookBankExtra: row.bookBankExtra };
}

/**
 * A member's kind decides their limit and loan length. At a college (4 Oct
 * 2026) a student borrows as STUDENT_COLLEGE and faculty (and heads of
 * department) as FACULTY, each on the college's own terms; everyone else is a
 * PUPIL or STAFF as at a school. A pupil's kind — PUPIL or STUDENT_COLLEGE —
 * is the one whose fines go to the fee ledger and whose guardians are told.
 */
const limitOf = (s: Settings, kind: string) => (kind === "PUPIL" ? s.pupilLimit : kind === "STUDENT_COLLEGE" ? s.collegeStudentLimit : kind === "FACULTY" ? s.facultyLimit : s.staffLimit);
const loanDaysOf = (s: Settings, kind: string) => (kind === "PUPIL" ? s.pupilLoanDays : kind === "STUDENT_COLLEGE" ? s.collegeStudentLoanDays : kind === "FACULTY" ? s.facultyLoanDays : s.staffLoanDays);
export const isPupilKind = (kind: string) => kind === "PUPIL" || kind === "STUDENT_COLLEGE";

/** The kind a new borrower row takes, by the person's role and the institution's kind. */
async function memberKindFor(schoolId: string, role: string): Promise<string> {
  const school = await db.school.findUnique({ where: { id: schoolId }, select: { kind: true } });
  if (!isCollegeKind(school?.kind ?? "SCHOOL")) return role === "STUDENT" ? "PUPIL" : "STAFF";
  return role === "STUDENT" ? "STUDENT_COLLEGE" : role === "FACULTY" || role === "HOD" ? "FACULTY" : "STAFF";
}

/**
 * THE BOOK BANK: a college student holding a scholarship this year (a claim
 * applied for, sanctioned or paid) may take `bookBankExtra` more books.
 */
async function bookBankExtraFor(s: Settings, member: { kind: string; membershipId: string }): Promise<number> {
  if (member.kind !== "STUDENT_COLLEGE" || s.bookBankExtra <= 0) return 0;
  const claim = await db.scholarshipClaim.findFirst({ where: { studentMembershipId: member.membershipId, status: { in: ["APPLIED", "SANCTIONED", "DISBURSED"] } }, select: { id: true } });
  return claim ? s.bookBankExtra : 0;
}

/** Whole days from `a` to `b`, two date keys. */
export function daysBetween(a: string, b: string): number {
  const [ay, am, ad] = a.split("-").map(Number) as [number, number, number];
  const [by, bm, bd] = b.split("-").map(Number) as [number, number, number];
  return Math.round((Date.UTC(by, bm - 1, bd) - Date.UTC(ay, am - 1, ad)) / 86_400_000);
}

/** The overdue fine for a book back on `returnedOn` that was due on `dueOn`. */
export function overdueFine(dueOn: string, returnedOn: string, perDayPaise: number): { days: number; paise: number } {
  const days = Math.max(0, daysBetween(dueOn, returnedOn));
  return { days, paise: days * Math.max(0, perDayPaise) };
}

/* -------------------------------------------------------------------------- */
/* Settings                                                                    */
/* -------------------------------------------------------------------------- */

export async function librarySettingsFor(ctx: ActiveContext): Promise<LibrarySettingsView> {
  const desk = await deskOf(ctx, "read");
  const [s, heads] = await Promise.all([librarySettings(desk.schoolId), db.feeHead.findMany({ where: { schoolId: desk.schoolId, retiredAt: null }, orderBy: [{ sortOrder: "asc" }, { name: "asc" }], select: { id: true, name: true, code: true } })]);
  return {
    pupilLimit: s.pupilLimit,
    pupilLoanDays: s.pupilLoanDays,
    staffLimit: s.staffLimit,
    staffLoanDays: s.staffLoanDays,
    maxRenewals: s.maxRenewals,
    finePerDayPaise: s.finePerDayPaise,
    fineHeadId: s.fineHeadId,
    fineHeads: heads,
    stockTakeStartedAt: s.stockTakeStartedAt?.toISOString() ?? null,
    canEdit: desk.role === "ADMIN",
  };
}

/** The office's alone: the school's lending rules. */
export async function saveLibrarySettings(ctx: ActiveContext, input: LibrarySettingsSave): Promise<LibrarySettingsView> {
  const desk = await deskOf(ctx, "read");
  if (desk.role !== "ADMIN") throw new AccessError("access.wrongRoleForThisAction");
  if (input.fineHeadId) {
    const head = await db.feeHead.findFirst({ where: { id: input.fineHeadId, schoolId: desk.schoolId, retiredAt: null }, select: { id: true } });
    if (!head) throw new AccessError("library.refuseFineHead");
  }
  const data = { pupilLimit: input.pupilLimit, pupilLoanDays: input.pupilLoanDays, staffLimit: input.staffLimit, staffLoanDays: input.staffLoanDays, maxRenewals: input.maxRenewals, finePerDayPaise: input.finePerDayPaise, fineHeadId: input.fineHeadId, updatedByUserId: desk.userId };
  await db.librarySettings.upsert({ where: { schoolId: desk.schoolId }, create: { schoolId: desk.schoolId, ...data }, update: data });
  await audit({ schoolId: desk.schoolId, actorUserId: desk.userId, action: "library.settings", targetType: "School", targetId: desk.schoolId, meta: { ...input } });
  return librarySettingsFor(ctx);
}

/* -------------------------------------------------------------------------- */
/* Members                                                                     */
/* -------------------------------------------------------------------------- */

type MemberRow = { id: string; membershipId: string; kind: string; cardNumber: string };
type PersonRow = { id: string; role: string; status: string; schoolId: string; userId: string; user: { name: string; preferredName: string | null }; enrollments: { class: { name: string } }[] };
const PERSON_SELECT = { id: true, role: true, status: true, schoolId: true, userId: true, user: { select: { name: true, preferredName: true } }, enrollments: { where: { status: "ACTIVE" as const }, select: { class: { select: { name: true } } }, take: 1 } } as const;
const nameOf = (p: { user: { name: string; preferredName: string | null } }) => p.user.preferredName ?? p.user.name;

/** The person behind a membership, refused unless they belong to this school as a borrower. */
async function personAt(schoolId: string, membershipId: string): Promise<PersonRow> {
  const p = await db.membership.findFirst({ where: { id: membershipId, schoolId }, select: PERSON_SELECT });
  if (!p || p.status !== "ACTIVE" || !MEMBER_ROLES.includes(p.role as Role)) throw new AccessError("library.refuseNotMember", "NOT_FOUND");
  return p;
}

/** The borrower row, made at the first loan or reservation; the card number is the next free one. */
async function memberOf(schoolId: string, person: PersonRow): Promise<MemberRow> {
  const existing = await db.libraryMember.findUnique({ where: { membershipId: person.id }, select: { id: true, membershipId: true, kind: true, cardNumber: true } });
  if (existing) return existing;
  const kind = await memberKindFor(schoolId, person.role);
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const last = await db.libraryMember.findFirst({ where: { schoolId, cardNumber: { startsWith: "L" } }, orderBy: { cardNumber: "desc" }, select: { cardNumber: true } });
    const n = (Number(last?.cardNumber.slice(1)) || 0) + 1 + attempt;
    try {
      return await db.libraryMember.create({ data: { schoolId, membershipId: person.id, kind, cardNumber: `L${String(n).padStart(5, "0")}` }, select: { id: true, membershipId: true, kind: true, cardNumber: true } });
    } catch {
      // A card number taken by a member made at the same moment, or this person's row made by the other press.
      const again = await db.libraryMember.findUnique({ where: { membershipId: person.id }, select: { id: true, membershipId: true, kind: true, cardNumber: true } });
      if (again) return again;
    }
  }
  throw new AccessError("common.tryAgain");
}

async function summaryOf(person: PersonRow, member: MemberRow | null, s: Settings): Promise<LibraryMemberSummary> {
  const kind = member?.kind ?? (await memberKindFor(person.schoolId, person.role));
  const [onLoan, fines] = member
    ? await Promise.all([db.libraryIssue.count({ where: { memberId: member.id, returnedAt: null } }), db.libraryFine.findMany({ where: { memberId: member.id, waivedAt: null, settledAt: null }, select: FINE_SELECT })])
    : [0, []];
  const owed = (await finesOf(fines)).reduce((a, f) => a + (f.status === "DUE" ? f.paise : 0), 0);
  return { membershipId: person.id, name: nameOf(person), kind: kind as LibraryMemberSummary["kind"], className: person.enrollments[0]?.class.name ?? null, cardNumber: member?.cardNumber ?? null, onLoan, limit: limitOf(s, kind) + (member ? await bookBankExtraFor(s, member) : 0), owedPaise: owed };
}

/** People of the school the desk may lend to, by name, pupil code or library card. */
export async function searchMembers(ctx: ActiveContext, q: string): Promise<{ items: LibraryMemberSummary[] }> {
  const desk = await deskOf(ctx, "read");
  const s = await librarySettings(desk.schoolId);
  const byCard = await db.libraryMember.findFirst({ where: { schoolId: desk.schoolId, cardNumber: q.toUpperCase() }, select: { membershipId: true } });
  const people = await db.membership.findMany({
    where: {
      schoolId: desk.schoolId,
      status: "ACTIVE",
      role: { in: [...MEMBER_ROLES] },
      OR: [{ user: { name: { contains: q, mode: "insensitive" } } }, { user: { preferredName: { contains: q, mode: "insensitive" } } }, { studentCode: q }, ...(byCard ? [{ id: byCard.membershipId }] : [])],
    },
    select: PERSON_SELECT,
    orderBy: { user: { name: "asc" } },
    take: 20,
  });
  const members = await db.libraryMember.findMany({ where: { membershipId: { in: people.map((p) => p.id) } }, select: { id: true, membershipId: true, kind: true, cardNumber: true } });
  const byMembership = new Map(members.map((m) => [m.membershipId, m]));
  return { items: await Promise.all(people.map((p) => summaryOf(p, byMembership.get(p.id) ?? null, s))) };
}

/** One member at the desk: what they hold, what they owe, what they wait for. */
export async function memberView(ctx: ActiveContext, membershipId: string): Promise<LibraryMemberView> {
  const desk = await deskOf(ctx, "read");
  const person = await personAt(desk.schoolId, membershipId);
  return viewForPerson(desk.schoolId, desk.timeZone, person, { includeReturned: false });
}

async function viewForPerson(schoolId: string, timeZone: string, person: PersonRow, opts: { includeReturned: boolean }): Promise<LibraryMemberView> {
  const s = await librarySettings(schoolId);
  const member = await db.libraryMember.findUnique({ where: { membershipId: person.id }, select: { id: true, membershipId: true, kind: true, cardNumber: true } });
  const summary = await summaryOf(person, member, s);
  if (!member) return { member: summary, loans: [], fines: [], reservations: [] };
  const today = todayKey(timeZone);
  const [open, returned, fines, reservations] = await Promise.all([
    db.libraryIssue.findMany({ where: { memberId: member.id, returnedAt: null }, orderBy: { dueOn: "asc" }, include: LOAN_INCLUDE }),
    opts.includeReturned ? db.libraryIssue.findMany({ where: { memberId: member.id, returnedAt: { not: null } }, orderBy: { returnedAt: "desc" }, take: 10, include: LOAN_INCLUDE }) : Promise.resolve([]),
    db.libraryFine.findMany({ where: { memberId: member.id }, orderBy: { createdAt: "desc" }, take: 50, select: FINE_SELECT }),
    db.libraryReservation.findMany({ where: { memberId: member.id, fulfilledAt: null, cancelledAt: null }, orderBy: { placedAt: "asc" }, include: RES_INCLUDE }),
  ]);
  const loans = await Promise.all([...open, ...returned].map((i) => loanOf(i, today, s)));
  return { member: summary, loans, fines: await finesOf(fines), reservations: await withAccessions(reservations, await titleQueues(reservations.map((r) => r.titleId))) };
}

/* -------------------------------------------------------------------------- */
/* Views                                                                       */
/* -------------------------------------------------------------------------- */

const LOAN_INCLUDE = {
  copy: { select: { id: true, accession: true, titleId: true, title: { select: { id: true, title: true, author: true } } } },
  member: { select: { kind: true, membership: { select: PERSON_SELECT } } },
} as const;
type LoanRow = { id: string; copyId: string; issuedAt: Date; dueOn: string; returnedAt: Date | null; renewedCount: number; copy: { id: string; accession: string; titleId: string; title: { id: string; title: string; author: string } }; member: { kind: string; membership: PersonRow } };

/**
 * A reservation still WAITING for a copy (QA-44): one already ready has a copy held on the shelf for its reader, so
 * nobody is kept waiting by a renewal. "Ready" is readyAt and readyCopyId both set, as everywhere in this file.
 */
const STILL_WAITING: Prisma.LibraryReservationWhereInput = { OR: [{ readyAt: null }, { readyCopyId: null }] };

async function loanOf(i: LoanRow, today: string, s: Settings): Promise<LibraryLoan> {
  const overdueDays = i.returnedAt ? 0 : Math.max(0, daysBetween(i.dueOn, today));
  const queue = i.returnedAt ? 0 : await db.libraryReservation.count({ where: { titleId: i.copy.titleId, fulfilledAt: null, cancelledAt: null, ...STILL_WAITING, member: { membershipId: { not: i.member.membership.id } } } });
  return {
    id: i.id,
    copyId: i.copyId,
    accession: i.copy.accession,
    titleId: i.copy.titleId,
    title: i.copy.title.title,
    author: i.copy.title.author,
    membershipId: i.member.membership.id,
    memberName: nameOf(i.member.membership),
    className: i.member.membership.enrollments[0]?.class.name ?? null,
    issuedAt: i.issuedAt.toISOString(),
    dueOn: i.dueOn,
    returnedAt: i.returnedAt?.toISOString() ?? null,
    renewedCount: i.renewedCount,
    overdueDays,
    canRenew: !i.returnedAt && overdueDays === 0 && i.renewedCount < s.maxRenewals && queue === 0,
  };
}

const FINE_SELECT = {
  id: true,
  issueId: true,
  paise: true,
  reason: true,
  createdAt: true,
  waivedAt: true,
  waivedReason: true,
  demandId: true,
  settledAt: true,
  issue: { select: { copy: { select: { title: { select: { title: true } } } } } },
  member: { select: { membership: { select: { id: true, user: { select: { name: true, preferredName: true } } } } } },
} as const;
type FineRow = { id: string; issueId: string; paise: number; reason: string; createdAt: Date; waivedAt: Date | null; waivedReason: string | null; demandId: string | null; settledAt: Date | null; issue: { copy: { title: { title: string } } }; member: { membership: { id: string; user: { name: string; preferredName: string | null } } } };

type DemandStates = Map<string, string>;
/** Read with the demand's state where the fine went to the ledger: the ledger is the one writer of "paid". */
function fineStatusOf(f: Pick<FineRow, "waivedAt" | "demandId" | "settledAt" | "paise">, states: DemandStates): { status: "DUE" | "PAID" | "WAIVED"; paise: number } {
  if (f.waivedAt) return { status: "WAIVED", paise: f.paise };
  if (f.settledAt) return { status: "PAID", paise: f.paise };
  const d = f.demandId ? states.get(f.demandId) : undefined;
  if (d === "PAID") return { status: "PAID", paise: f.paise };
  if (d === "WAIVED" || d === "CANCELLED") return { status: "WAIVED", paise: f.paise };
  return { status: "DUE", paise: f.paise };
}

/** The states of the demands these fines raised, read fresh. */
async function demandStatesOf(fines: { demandId: string | null }[]): Promise<DemandStates> {
  const ids = [...new Set(fines.map((f) => f.demandId).filter((x): x is string => Boolean(x)))];
  if (ids.length === 0) return new Map();
  const rows = await db.feeDemand.findMany({ where: { id: { in: ids } }, select: { id: true, status: true } });
  return new Map(rows.map((r) => [r.id, r.status]));
}

async function finesOf(rows: FineRow[]): Promise<LibraryFine[]> {
  const states = await demandStatesOf(rows);
  return rows.map((f) => fineView(f, states));
}

function fineView(f: FineRow, states: DemandStates): LibraryFine {
  return {
    id: f.id,
    issueId: f.issueId,
    title: f.issue.copy.title.title,
    membershipId: f.member.membership.id,
    memberName: f.member.membership.user.preferredName ?? f.member.membership.user.name,
    paise: f.paise,
    reason: f.reason as LibraryFine["reason"],
    createdAt: f.createdAt.toISOString(),
    status: fineStatusOf(f, states).status,
    onLedger: Boolean(f.demandId),
    waivedReason: f.waivedReason,
  };
}

const RES_INCLUDE = {
  title: { select: { title: true } },
  member: { select: { membership: { select: { id: true, user: { select: { name: true, preferredName: true } } } } } },
} as const;
type ResRow = { id: string; titleId: string; memberId: string; placedAt: Date; readyAt: Date | null; readyCopyId: string | null; title: { title: string }; member: { membership: { id: string; user: { name: string; preferredName: string | null } } } };

/** Each title's open queue in order, for positions. */
async function titleQueues(titleIds: string[]): Promise<Map<string, string[]>> {
  const ids = [...new Set(titleIds)];
  if (ids.length === 0) return new Map();
  const rows = await db.libraryReservation.findMany({ where: { titleId: { in: ids }, fulfilledAt: null, cancelledAt: null }, orderBy: [{ placedAt: "asc" }, { id: "asc" }], select: { id: true, titleId: true } });
  const out = new Map<string, string[]>();
  for (const r of rows) (out.get(r.titleId) ?? out.set(r.titleId, []).get(r.titleId)!).push(r.id);
  return out;
}

function reservationOf(r: ResRow, queues: Map<string, string[]>, readyAccession: string | null = null): LibraryReservation {
  return {
    id: r.id,
    titleId: r.titleId,
    title: r.title.title,
    membershipId: r.member.membership.id,
    memberName: r.member.membership.user.preferredName ?? r.member.membership.user.name,
    placedAt: r.placedAt.toISOString(),
    ready: Boolean(r.readyAt && r.readyCopyId),
    readyAccession,
    position: (queues.get(r.titleId)?.indexOf(r.id) ?? -1) + 1,
  };
}

async function withAccessions(rows: ResRow[], queues: Map<string, string[]>): Promise<LibraryReservation[]> {
  const copyIds = rows.map((r) => r.readyCopyId).filter((x): x is string => Boolean(x));
  const copies = copyIds.length ? await db.libraryCopy.findMany({ where: { id: { in: copyIds } }, select: { id: true, accession: true } }) : [];
  const acc = new Map(copies.map((c) => [c.id, c.accession]));
  return rows.map((r) => reservationOf(r, queues, r.readyCopyId && r.readyAt ? (acc.get(r.readyCopyId) ?? null) : null));
}

/** Counts for a page of titles: copies lent, on the shelf and free, and the queue. */
async function titleRows(titles: { id: string; isbn: string | null; title: string; author: string; publisher: string; year: number | null; subject: string; language: string; category: string }[]): Promise<LibraryTitleRow[]> {
  const ids = titles.map((t) => t.id);
  if (ids.length === 0) return [];
  const [copies, open] = await Promise.all([
    db.libraryCopy.findMany({ where: { titleId: { in: ids } }, select: { id: true, titleId: true, status: true } }),
    db.libraryReservation.findMany({ where: { titleId: { in: ids }, fulfilledAt: null, cancelledAt: null }, select: { titleId: true, readyAt: true, readyCopyId: true } }),
  ]);
  const held = new Set(open.filter((r) => r.readyAt && r.readyCopyId).map((r) => r.readyCopyId!));
  return titles.map((t) => {
    const mine = copies.filter((c) => c.titleId === t.id);
    return {
      id: t.id,
      isbn: t.isbn,
      title: t.title,
      author: t.author,
      publisher: t.publisher,
      year: t.year,
      subject: t.subject,
      language: t.language as LibraryTitleRow["language"],
      category: t.category as LibraryTitleRow["category"],
      copies: mine.filter((c) => LENT.includes(c.status)).length,
      available: mine.filter((c) => c.status === "AVAILABLE" && !held.has(c.id)).length,
      waiting: open.filter((r) => r.titleId === t.id && !(r.readyAt && r.readyCopyId)).length,
    };
  });
}

/* -------------------------------------------------------------------------- */
/* Who is reading: the desk, a member, or a guardian for a child               */
/* -------------------------------------------------------------------------- */

type Reader = { schoolId: string; timeZone: string; desk: boolean; canEdit: boolean; person: PersonRow | null; userId: string };

/** The school whose catalogue this person reads, and the membership they read it as. */
async function readerOf(ctx: ActiveContext, childId?: string | null): Promise<Reader> {
  if (ctx.role === "PARENT") {
    const child = childId ?? (await db.guardianship.findFirst({ where: { parentUserId: ctx.user.id, status: "ACTIVE" }, orderBy: { createdAt: "asc" }, select: { studentMembershipId: true } }))?.studentMembershipId;
    if (!child) throw new AccessError("access.notYourChild", "NOT_FOUND");
    // An adult at a college shares their loans and dues under MONEY (DS-1, 10 Oct 2026).
    const link = await assertGuardianAccess(ctx.user.id, child, "MONEY");
    await assertModuleOn(link.student.schoolId, "LIBRARY");
    const person = await db.membership.findFirst({ where: { id: child }, select: PERSON_SELECT });
    if (!person) throw new AccessError("access.notYourChild", "NOT_FOUND");
    return { schoolId: link.student.schoolId, timeZone: link.student.school.timezone, desk: false, canEdit: false, person, userId: ctx.user.id };
  }
  if (!ctx.schoolId || !ctx.membershipId || !ctx.role || !READER_ROLES.includes(ctx.role)) throw new AccessError("access.wrongRoleForThisAction");
  await assertModuleOn(ctx.schoolId, "LIBRARY");
  const desk = DESK_READ.includes(ctx.role);
  const person = ctx.role === "LIBRARIAN" ? null : await db.membership.findFirst({ where: { id: ctx.membershipId, schoolId: ctx.schoolId }, select: PERSON_SELECT });
  return { schoolId: ctx.schoolId, timeZone: await zoneOf(ctx.schoolId), desk, canEdit: DESK.includes(ctx.role), person, userId: ctx.user.id };
}

/* -------------------------------------------------------------------------- */
/* The catalogue                                                               */
/* -------------------------------------------------------------------------- */

/** The catalogue, searched by title, author, subject or ISBN, a page at a time. */
export async function searchCatalogue(ctx: ActiveContext, query: { q?: string; childId?: string; cursor?: string; limit: number }): Promise<{ items: LibraryTitleRow[]; nextCursor: string | null }> {
  const reader = await readerOf(ctx, query.childId);
  const q = query.q?.trim();
  const isbn = q ? normaliseIsbn(q) : null;
  const where = {
    schoolId: reader.schoolId,
    ...(q ? { OR: [{ title: { contains: q, mode: "insensitive" as const } }, { author: { contains: q, mode: "insensitive" as const } }, { subject: { contains: q, mode: "insensitive" as const } }, ...(isbn ? [{ isbn }] : [])] } : {}),
  };
  const rows = await db.libraryTitle.findMany({ where, orderBy: [{ title: "asc" }, { id: "asc" }], take: query.limit + 1, ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}) });
  const page = rows.slice(0, query.limit);
  return { items: await titleRows(page), nextCursor: rows.length > query.limit ? page[page.length - 1]!.id : null };
}

export async function titleView(ctx: ActiveContext, titleId: string, childId?: string | null): Promise<LibraryTitleView> {
  const reader = await readerOf(ctx, childId);
  const t = await db.libraryTitle.findFirst({ where: { id: titleId, schoolId: reader.schoolId } });
  if (!t) throw new AccessError("library.refuseNoTitle", "NOT_FOUND");
  const [row] = await titleRows([t]);
  const s = await librarySettings(reader.schoolId);
  const queueRows = await db.libraryReservation.findMany({ where: { titleId, fulfilledAt: null, cancelledAt: null }, orderBy: [{ placedAt: "asc" }, { id: "asc" }], include: RES_INCLUDE });
  let copies: LibraryTitleView["copies"] = [];
  if (reader.desk) {
    const list = await db.libraryCopy.findMany({ where: { titleId }, orderBy: { accession: "asc" }, include: { issues: { where: { returnedAt: null }, take: 1, include: { member: { select: { membership: { select: { user: { select: { name: true, preferredName: true } } } } } } } } } });
    const heldBy = new Map(queueRows.filter((r) => r.readyAt && r.readyCopyId).map((r) => [r.readyCopyId!, r.member.membership.user.preferredName ?? r.member.membership.user.name]));
    copies = list.map((c) => ({
      id: c.id,
      accession: c.accession,
      rack: c.rack,
      status: c.status as LibraryTitleView["copies"][number]["status"],
      seen: Boolean(s.stockTakeStartedAt && c.seenAt && c.seenAt >= s.stockTakeStartedAt),
      borrowerName: c.issues[0] ? (c.issues[0].member.membership.user.preferredName ?? c.issues[0].member.membership.user.name) : null,
      dueOn: c.issues[0]?.dueOn ?? null,
      heldFor: heldBy.get(c.id) ?? null,
    }));
  }
  const mine = reader.person ? queueRows.findIndex((r) => r.member.membership.id === reader.person!.id) : -1;
  const own = mine >= 0 ? queueRows[mine]! : null;
  return {
    title: row!,
    copies,
    queue: reader.desk ? queueRows.map((r) => ({ id: r.id, memberName: r.member.membership.user.preferredName ?? r.member.membership.user.name, placedAt: r.placedAt.toISOString(), ready: Boolean(r.readyAt && r.readyCopyId) })) : [],
    mine: own ? { id: own.id, placedAt: own.placedAt.toISOString(), ready: Boolean(own.readyAt && own.readyCopyId), position: mine + 1 } : null,
    canEdit: reader.canEdit,
    canReserve: Boolean(reader.person) && !own && row!.copies > 0,
  };
}

async function assertAccessionFree(schoolId: string, accession: string, exceptCopyId?: string) {
  const taken = await db.libraryCopy.findUnique({ where: { schoolId_accession: { schoolId, accession } }, select: { id: true } });
  if (taken && taken.id !== exceptCopyId) throw new AccessError("library.refuseAccessionTaken", "FORBIDDEN", { accession });
}

/** A new title, with any copies the desk has in hand. An ISBN the school already holds is refused: add a copy to that title instead. */
export async function createTitle(ctx: ActiveContext, input: LibraryTitleCreate): Promise<LibraryTitleView> {
  const desk = await deskOf(ctx);
  if (input.isbn && (await db.libraryTitle.findUnique({ where: { schoolId_isbn: { schoolId: desk.schoolId, isbn: input.isbn } }, select: { id: true } }))) throw new AccessError("library.refuseIsbnTaken");
  const accessions = input.copies.map((c) => c.accession);
  if (new Set(accessions).size !== accessions.length) throw new AccessError("library.refuseAccessionTaken", "FORBIDDEN", { accession: accessions.find((a, i) => accessions.indexOf(a) !== i)! });
  for (const a of accessions) await assertAccessionFree(desk.schoolId, a);
  const { copies, ...title } = input;
  const created = await db.$tenantTransaction(async (raw) => {
    const tx = raw as Tx;
    const t = await tx.libraryTitle.create({ data: { schoolId: desk.schoolId, ...title }, select: { id: true } });
    for (const c of copies) await tx.libraryCopy.create({ data: { schoolId: desk.schoolId, titleId: t.id, accession: c.accession, rack: c.rack } });
    return t;
  });
  await audit({ schoolId: desk.schoolId, actorUserId: desk.userId, action: "library.title.create", targetType: "LibraryTitle", targetId: created.id, meta: { copies: copies.length } });
  return titleView(ctx, created.id);
}

export async function updateTitle(ctx: ActiveContext, titleId: string, input: LibraryTitleSave): Promise<LibraryTitleView> {
  const desk = await deskOf(ctx);
  const t = await db.libraryTitle.findFirst({ where: { id: titleId, schoolId: desk.schoolId }, select: { id: true } });
  if (!t) throw new AccessError("library.refuseNoTitle", "NOT_FOUND");
  if (input.isbn) {
    const other = await db.libraryTitle.findUnique({ where: { schoolId_isbn: { schoolId: desk.schoolId, isbn: input.isbn } }, select: { id: true } });
    if (other && other.id !== titleId) throw new AccessError("library.refuseIsbnTaken");
  }
  await db.libraryTitle.update({ where: { id: titleId }, data: input });
  await audit({ schoolId: desk.schoolId, actorUserId: desk.userId, action: "library.title.update", targetType: "LibraryTitle", targetId: titleId });
  return titleView(ctx, titleId);
}

export async function addCopy(ctx: ActiveContext, input: { titleId: string; accession: string; rack: string }): Promise<LibraryTitleView> {
  const desk = await deskOf(ctx);
  const t = await db.libraryTitle.findFirst({ where: { id: input.titleId, schoolId: desk.schoolId }, select: { id: true } });
  if (!t) throw new AccessError("library.refuseNoTitle", "NOT_FOUND");
  await assertAccessionFree(desk.schoolId, input.accession);
  const copy = await db.libraryCopy.create({ data: { schoolId: desk.schoolId, titleId: input.titleId, accession: input.accession, rack: input.rack }, select: { id: true } });
  const ready = await reholdInTx(input.titleId);
  await audit({ schoolId: desk.schoolId, actorUserId: desk.userId, action: "library.copy.add", targetType: "LibraryCopy", targetId: copy.id, meta: { titleId: input.titleId } });
  await tellReady(desk.schoolId, ready);
  return titleView(ctx, input.titleId);
}

/** A copy sent for repair, lost, withdrawn or back on the shelf, or moved to another rack. ISSUED is the loan's alone. */
export async function updateCopy(ctx: ActiveContext, copyId: string, input: { status?: "AVAILABLE" | "LOST" | "WITHDRAWN" | "REPAIR"; rack?: string }): Promise<LibraryTitleView> {
  const desk = await deskOf(ctx);
  const copy = await db.libraryCopy.findFirst({ where: { id: copyId, schoolId: desk.schoolId }, select: { id: true, status: true, titleId: true } });
  if (!copy) throw new AccessError("library.refuseNoCopy", "NOT_FOUND");
  if (input.status && copy.status === "ISSUED") throw new AccessError("library.refuseOnLoan");
  await db.libraryCopy.update({ where: { id: copyId }, data: { ...(input.status ? { status: input.status } : {}), ...(input.rack !== undefined ? { rack: input.rack } : {}) } });
  const ready = input.status ? await reholdInTx(copy.titleId) : [];
  if (input.status && input.status !== copy.status) await audit({ schoolId: desk.schoolId, actorUserId: desk.userId, action: "library.copy.status", targetType: "LibraryCopy", targetId: copyId, meta: { from: copy.status, to: input.status } });
  await tellReady(desk.schoolId, ready);
  return titleView(ctx, copy.titleId);
}

/** A scan or a typed code at the desk: a copy's accession, a member's card, or an ISBN. */
export async function lookup(ctx: ActiveContext, code: string): Promise<LibraryLookup> {
  const desk = await deskOf(ctx, "read");
  const s = await librarySettings(desk.schoolId);
  const copy = await db.libraryCopy.findFirst({
    where: { schoolId: desk.schoolId, accession: { equals: code, mode: "insensitive" } },
    include: { title: { select: { id: true, title: true, author: true } }, issues: { where: { returnedAt: null }, take: 1, include: { member: { select: { membership: { select: { user: { select: { name: true, preferredName: true } } } } } } } } },
  });
  if (copy) {
    const held = await db.libraryReservation.findFirst({ where: { readyCopyId: copy.id, readyAt: { not: null }, fulfilledAt: null, cancelledAt: null }, include: RES_INCLUDE });
    const loan = copy.issues[0];
    return {
      kind: "COPY",
      copy: {
        id: copy.id,
        accession: copy.accession,
        rack: copy.rack,
        status: copy.status as LibraryCopyStatus,
        seen: Boolean(s.stockTakeStartedAt && copy.seenAt && copy.seenAt >= s.stockTakeStartedAt),
        borrowerName: loan ? (loan.member.membership.user.preferredName ?? loan.member.membership.user.name) : null,
        dueOn: loan?.dueOn ?? null,
        heldFor: held ? (held.member.membership.user.preferredName ?? held.member.membership.user.name) : null,
        titleId: copy.title.id,
        title: copy.title.title,
        author: copy.title.author,
        loanId: loan?.id ?? null,
      },
      member: null,
      title: null,
    };
  }
  const card = await db.libraryMember.findFirst({ where: { schoolId: desk.schoolId, cardNumber: code.toUpperCase() }, select: { id: true, membershipId: true, kind: true, cardNumber: true } });
  if (card) {
    const person = await db.membership.findFirst({ where: { id: card.membershipId }, select: PERSON_SELECT });
    if (person) return { kind: "MEMBER", copy: null, member: await summaryOf(person, card, s), title: null };
  }
  const isbn = normaliseIsbn(code);
  if (isbn) {
    const t = await db.libraryTitle.findUnique({ where: { schoolId_isbn: { schoolId: desk.schoolId, isbn } } });
    if (t) return { kind: "TITLE", copy: null, member: null, title: (await titleRows([t]))[0]! };
  }
  return { kind: "NONE", copy: null, member: null, title: null };
}

/* -------------------------------------------------------------------------- */
/* The queue                                                                   */
/* -------------------------------------------------------------------------- */

type Ready = { reservationId: string; memberId: string; titleId: string };

/**
 * Serves a title's queue in order, inside the caller's transaction and under
 * a lock on the title: a hold on a copy that is no longer on the shelf is
 * let go, and every free copy on the shelf is held for the next person
 * waiting. Returns the reservations that have just become ready.
 */
async function rehold(tx: Tx, titleId: string): Promise<Ready[]> {
  await tx.$queryRaw`SELECT 1 FROM "LibraryTitle" WHERE "id" = ${titleId} FOR UPDATE`;
  const open = await tx.libraryReservation.findMany({ where: { titleId, fulfilledAt: null, cancelledAt: null }, orderBy: [{ placedAt: "asc" }, { id: "asc" }], select: { id: true, memberId: true, readyAt: true, readyCopyId: true } });
  if (open.length === 0) return [];
  const shelf = await tx.libraryCopy.findMany({ where: { titleId, status: "AVAILABLE" }, orderBy: { accession: "asc" }, select: { id: true } });
  const onShelf = new Set(shelf.map((c) => c.id));
  const held = new Set<string>();
  for (const r of open) {
    if (r.readyCopyId && onShelf.has(r.readyCopyId) && !held.has(r.readyCopyId)) held.add(r.readyCopyId);
    else if (r.readyCopyId || r.readyAt) {
      await tx.libraryReservation.update({ where: { id: r.id }, data: { readyAt: null, readyCopyId: null } });
      r.readyAt = null;
      r.readyCopyId = null;
    }
  }
  const free = shelf.filter((c) => !held.has(c.id));
  const ready: Ready[] = [];
  for (const r of open) {
    if (r.readyCopyId) continue;
    const copy = free.shift();
    if (!copy) break;
    await tx.libraryReservation.update({ where: { id: r.id }, data: { readyAt: new Date(), readyCopyId: copy.id } });
    ready.push({ reservationId: r.id, memberId: r.memberId, titleId });
  }
  return ready;
}

async function reholdInTx(titleId: string): Promise<Ready[]> {
  return db.$tenantTransaction(async (raw) => rehold(raw as Tx, titleId));
}

/** Tells each member whose reservation has just become ready (and a pupil's guardians). */
async function tellReady(schoolId: string, ready: Ready[]): Promise<void> {
  for (const r of ready) {
    const row = await db.libraryReservation.findUnique({ where: { id: r.reservationId }, include: { title: { select: { title: true } }, member: { select: { kind: true, membership: { select: { id: true, userId: true, role: true } } } } } });
    if (!row) continue;
    await tellMember(schoolId, row.member, "ready", { title: row.title.title }).catch((error) => console.error("[library] ready notice failed", error));
  }
}

const NOTICE_KEYS = {
  ready: { title: "library.notifReadyTitle", self: "library.notifReadyBody", child: "library.notifReadyBodyChild" },
  overdue: { title: "library.notifOverdueTitle", self: "library.notifOverdueBody", child: "library.notifOverdueBodyChild" },
  due: { title: "library.notifDueTitle", self: "library.notifDueBody", child: "library.notifDueBodyChild" },
} as const;

/** A notice to a member, and for a pupil to their guardians too; each opens their own library page. */
async function tellMember(schoolId: string, member: { kind: string; membership: { id: string; userId: string; role: string } }, what: keyof typeof NOTICE_KEYS, vars: Record<string, string>): Promise<void> {
  const keys = NOTICE_KEYS[what];
  const own = member.membership.role === "STUDENT" ? "/student/library" : member.membership.role === "TEACHER" ? "/teacher/library" : "/notifications";
  await notify({ userId: member.membership.userId, schoolId, kind: "SYSTEM", titleKey: keys.title, titleVars: vars, bodyKey: keys.self, bodyVars: vars, url: own });
  if (!isPupilKind(member.kind)) return;
  // An adult college student's library is theirs (5 Oct 2026): the family's library page names no grant, so it is refused
  // to their guardians (default-deny, tenancy.ts), and the notice is not sent either.
  if (await consentApplies(member.membership.id)) return;
  await notifyGuardians(member.membership.id, (childName) => ({ schoolId, kind: "SYSTEM", titleKey: keys.title, titleVars: vars, bodyKey: keys.child, bodyVars: { ...vars, name: childName }, url: `/parent/library?child=${member.membership.id}` }));
}

/** A place in a title's queue: a member for themselves, a guardian for their child, the desk for anyone. Placing twice is the same place. */
export async function reserveTitle(ctx: ActiveContext, input: { titleId: string; childId?: string; membershipId?: string }): Promise<LibraryReservation> {
  let schoolId: string;
  let person: PersonRow;
  if (ctx.role === "LIBRARIAN" || (ctx.role === "ADMIN" && input.membershipId)) {
    const desk = await deskOf(ctx);
    if (!input.membershipId) throw new AccessError("library.refuseNotMember", "NOT_FOUND");
    schoolId = desk.schoolId;
    person = await personAt(schoolId, input.membershipId);
  } else {
    const reader = await readerOf(ctx, input.childId);
    if (!reader.person) throw new AccessError("access.wrongRoleForThisAction");
    schoolId = reader.schoolId;
    person = await personAt(schoolId, reader.person.id);
  }
  const title = await db.libraryTitle.findFirst({ where: { id: input.titleId, schoolId }, select: { id: true, title: true } });
  if (!title) throw new AccessError("library.refuseNoTitle", "NOT_FOUND");
  const lending = await db.libraryCopy.count({ where: { titleId: title.id, status: { in: LENT } } });
  if (lending === 0) throw new AccessError("library.refuseNoCopies");
  const member = await memberOf(schoolId, person);
  const holding = await db.libraryIssue.count({ where: { memberId: member.id, returnedAt: null, copy: { titleId: title.id } } });
  if (holding > 0) throw new AccessError("library.refuseAlreadyHave");
  const existing = await db.libraryReservation.findFirst({ where: { titleId: title.id, memberId: member.id, fulfilledAt: null, cancelledAt: null }, select: { id: true } });
  let id = existing?.id;
  let ready: Ready[] = [];
  if (!id) {
    const made = await db.$tenantTransaction(async (raw) => {
      const tx = raw as Tx;
      await tx.$queryRaw`SELECT 1 FROM "LibraryTitle" WHERE "id" = ${title.id} FOR UPDATE`;
      const again = await tx.libraryReservation.findFirst({ where: { titleId: title.id, memberId: member.id, fulfilledAt: null, cancelledAt: null }, select: { id: true } });
      if (again) return { id: again.id, ready: [] as Ready[] };
      const r = await tx.libraryReservation.create({ data: { schoolId, titleId: title.id, memberId: member.id, placedByUserId: ctx.user.id }, select: { id: true } });
      return { id: r.id, ready: await rehold(tx, title.id) };
    });
    id = made.id;
    ready = made.ready.filter((r) => r.reservationId !== id);
    await audit({ schoolId, actorUserId: ctx.user.id, action: "library.reserve", targetType: "LibraryReservation", targetId: id, meta: { titleId: title.id, membershipId: person.id } });
  }
  await tellReady(schoolId, ready);
  const row = await db.libraryReservation.findUniqueOrThrow({ where: { id }, include: RES_INCLUDE });
  return (await withAccessions([row], await titleQueues([row.titleId])))[0]!;
}

/** Leaves the queue: the member, their guardian, or the desk. A held copy passes to the next in line. */
export async function cancelReservation(ctx: ActiveContext, reservationId: string): Promise<LibraryReservation> {
  const r = await db.libraryReservation.findUnique({ where: { id: reservationId }, include: { ...RES_INCLUDE, member: { select: { membership: { select: { id: true, userId: true, schoolId: true, user: { select: { name: true, preferredName: true } } } } } } } });
  if (!r) throw new AccessError("library.refuseNoReservation", "NOT_FOUND");
  const schoolId = r.schoolId;
  const isDesk = ctx.schoolId === schoolId && ctx.role !== null && DESK.includes(ctx.role);
  const isOwner = r.member.membership.userId === ctx.user.id && ctx.schoolId === schoolId;
  let isGuardian = false;
  if (!isDesk && !isOwner && ctx.role === "PARENT") {
    // MONEY, the grant placing and viewing the reservation ask (reserveTitle, myLibrary): an adult college
    // student's guardian who may place one may take it back, and one who may not is refused (owner's item 14).
    await assertGuardianAccess(ctx.user.id, r.member.membership.id, "MONEY");
    isGuardian = true;
  }
  if (!isDesk && !isOwner && !isGuardian) throw new AccessError("library.refuseNoReservation", "NOT_FOUND");
  await assertModuleOn(schoolId, "LIBRARY");
  let ready: Ready[] = [];
  if (!r.cancelledAt && !r.fulfilledAt) {
    ready = await forSchool(schoolId, () =>
      db.$tenantTransaction(async (raw) => {
        const tx = raw as Tx;
        await tx.libraryReservation.update({ where: { id: reservationId }, data: { cancelledAt: new Date(), readyAt: null, readyCopyId: null } });
        return rehold(tx, r.titleId);
      }),
    );
    await audit({ schoolId, actorUserId: ctx.user.id, action: "library.reserve.cancel", targetType: "LibraryReservation", targetId: reservationId });
  }
  await tellReady(schoolId, ready);
  const row = await db.libraryReservation.findUniqueOrThrow({ where: { id: reservationId }, include: RES_INCLUDE });
  return reservationOf(row, await titleQueues([row.titleId]));
}

/** The desk's queue: every open reservation, ready ones first. */
export async function reservationQueue(ctx: ActiveContext): Promise<{ items: LibraryReservation[] }> {
  const desk = await deskOf(ctx, "read");
  const rows = await db.libraryReservation.findMany({ where: { schoolId: desk.schoolId, fulfilledAt: null, cancelledAt: null }, orderBy: [{ placedAt: "asc" }, { id: "asc" }], include: RES_INCLUDE, take: 500 });
  const list = await withAccessions(rows, await titleQueues(rows.map((r) => r.titleId)));
  return { items: [...list.filter((r) => r.ready), ...list.filter((r) => !r.ready)] };
}

/* -------------------------------------------------------------------------- */
/* Lending                                                                     */
/* -------------------------------------------------------------------------- */

async function loanById(issueId: string, today: string, s: Settings): Promise<LibraryLoan> {
  const i = await db.libraryIssue.findUniqueOrThrow({ where: { id: issueId }, include: LOAN_INCLUDE });
  return loanOf(i, today, s);
}

/** Lends a copy, found by its accession, to a member: within their limit, and never a copy held for someone else. */
export async function issueCopy(ctx: ActiveContext, input: { accession: string; membershipId: string }): Promise<LibraryLoan> {
  const desk = await deskOf(ctx);
  const s = await librarySettings(desk.schoolId);
  const copy = await db.libraryCopy.findUnique({ where: { schoolId_accession: { schoolId: desk.schoolId, accession: input.accession } }, select: { id: true, status: true, titleId: true } });
  if (!copy) throw new AccessError("library.refuseNoCopy", "NOT_FOUND");
  if (copy.status !== "AVAILABLE") throw new AccessError("library.refuseNotAvailable");
  const person = await personAt(desk.schoolId, input.membershipId);
  const member = await memberOf(desk.schoolId, person);
  const today = todayKey(desk.timeZone);
  const dueOn = addDaysToKey(today, loanDaysOf(s, member.kind));
  const bookBank = await bookBankExtraFor(s, member);
  const outcome = await db.$tenantTransaction(async (raw) => {
    const tx = raw as Tx;
    await tx.$queryRaw`SELECT 1 FROM "LibraryTitle" WHERE "id" = ${copy.titleId} FOR UPDATE`;
    const holding = await tx.libraryIssue.count({ where: { memberId: member.id, returnedAt: null } });
    const limit = limitOf(s, member.kind) + bookBank;
    if (holding >= limit) return { refused: "library.refuseLimit" as const, vars: { limit } as Record<string, string | number> };
    const hold = await tx.libraryReservation.findFirst({ where: { readyCopyId: copy.id, readyAt: { not: null }, fulfilledAt: null, cancelledAt: null }, select: { id: true, memberId: true, member: { select: { membership: { select: { user: { select: { name: true, preferredName: true } } } } } } } });
    if (hold && hold.memberId !== member.id) return { refused: "library.refuseHeld" as const, vars: { name: hold.member.membership.user.preferredName ?? hold.member.membership.user.name } as Record<string, string | number> };
    const flipped = await tx.libraryCopy.updateMany({ where: { id: copy.id, status: "AVAILABLE" }, data: { status: "ISSUED" } });
    if (flipped.count !== 1) return { refused: "library.refuseNotAvailable" as const, vars: {} as Record<string, string | number> };
    const issue = await tx.libraryIssue.create({ data: { schoolId: desk.schoolId, copyId: copy.id, memberId: member.id, dueOn, issuedByUserId: desk.userId }, select: { id: true } });
    // The member's own place in this title's queue is served by this loan, whichever copy it is.
    await tx.libraryReservation.updateMany({ where: { titleId: copy.titleId, memberId: member.id, fulfilledAt: null, cancelledAt: null }, data: { fulfilledAt: new Date() } });
    const ready = await rehold(tx, copy.titleId);
    return { issueId: issue.id, ready };
  });
  if ("refused" in outcome && outcome.refused) throw new AccessError(outcome.refused, "FORBIDDEN", outcome.vars);
  if (!("issueId" in outcome) || !outcome.issueId) throw new AccessError("common.tryAgain");
  await audit({ schoolId: desk.schoolId, actorUserId: desk.userId, action: "library.issue", targetType: "LibraryIssue", targetId: outcome.issueId, meta: { copyId: copy.id, membershipId: person.id, dueOn } });
  await tellReady(desk.schoolId, outcome.ready);
  return loanById(outcome.issueId, today, s);
}

/**
 * Raises a fine's money where it belongs: a demand on a pupil's ledger under
 * the school's fine head in the current year, or nothing (a counter due).
 * Inside the caller's transaction, so the fine and its demand stand together.
 */
async function chargeFine(tx: Tx, schoolId: string, memberKind: string, membershipId: string, s: Settings, paise: number, label: string, today: string): Promise<string | null> {
  if (!isPupilKind(memberKind) || !s.fineHeadId || paise <= 0) return null;
  const [head, year] = await Promise.all([tx.feeHead.findFirst({ where: { id: s.fineHeadId, schoolId, retiredAt: null }, select: { id: true, code: true, name: true } }), currentAcademicYear(schoolId, tx)]);
  if (!head || !year) return null;
  const demand = await tx.feeDemand.create({
    data: { schoolId, studentMembershipId: membershipId, academicYearId: year.id, instalmentId: null, label, dueDate: dayToDate(today), grossPaise: paise, concessionPaise: 0, netPaise: paise, linesJson: writeJson([{ headId: head.id, code: head.code, name: head.name, grossPaise: paise, concessionPaise: 0 }]), status: "OPEN" },
    select: { id: true },
  });
  return demand.id;
}

/** Takes a copy back. Late, it writes the overdue fine; if anyone waits for the title, the copy is held for the first of them. */
export async function returnCopy(ctx: ActiveContext, input: { accession: string }): Promise<LibraryReturnResult> {
  const desk = await deskOf(ctx);
  const s = await librarySettings(desk.schoolId);
  const t = await getT();
  const copy = await db.libraryCopy.findUnique({ where: { schoolId_accession: { schoolId: desk.schoolId, accession: input.accession } }, select: { id: true, titleId: true, title: { select: { title: true } } } });
  if (!copy) throw new AccessError("library.refuseNoCopy", "NOT_FOUND");
  const open = await db.libraryIssue.findFirst({ where: { copyId: copy.id, returnedAt: null }, select: { id: true, dueOn: true, member: { select: { id: true, kind: true, membershipId: true } } } });
  if (!open) throw new AccessError("library.refuseNotOnLoan");
  const today = todayKey(desk.timeZone);
  const late = overdueFine(open.dueOn, today, s.finePerDayPaise);
  const outcome = await db.$tenantTransaction(async (raw) => {
    const tx = raw as Tx;
    const closed = await tx.libraryIssue.updateMany({ where: { id: open.id, returnedAt: null }, data: { returnedAt: new Date(), returnedByUserId: desk.userId } });
    if (closed.count !== 1) return null;
    await tx.libraryCopy.updateMany({ where: { id: copy.id, status: "ISSUED" }, data: { status: "AVAILABLE" } });
    let fineId: string | null = null;
    if (late.paise > 0) {
      const demandId = await chargeFine(tx, desk.schoolId, open.member.kind, open.member.membershipId, s, late.paise, t("library.fineLabel", { title: copy.title.title }), today);
      fineId = (await tx.libraryFine.create({ data: { schoolId: desk.schoolId, issueId: open.id, memberId: open.member.id, paise: late.paise, reason: "OVERDUE", raisedByUserId: desk.userId, demandId }, select: { id: true } })).id;
    }
    return { fineId, ready: await rehold(tx, copy.titleId) };
  });
  if (!outcome) throw new AccessError("library.refuseNotOnLoan");
  await audit({ schoolId: desk.schoolId, actorUserId: desk.userId, action: "library.return", targetType: "LibraryIssue", targetId: open.id, meta: { copyId: copy.id, daysLate: late.days, finePaise: late.paise } });
  await tellReady(desk.schoolId, outcome.ready);
  let fine: LibraryFine | null = null;
  if (outcome.fineId) {
    const row = await db.libraryFine.findUniqueOrThrow({ where: { id: outcome.fineId }, select: FINE_SELECT });
    fine = (await finesOf([row]))[0]!;
  }
  const heldRow = outcome.ready[0] ? await db.libraryReservation.findUnique({ where: { id: outcome.ready[0].reservationId }, include: RES_INCLUDE }) : null;
  return {
    loan: await loanById(open.id, today, s),
    fine,
    heldFor: heldRow && heldRow.readyCopyId === copy.id ? { reservationId: heldRow.id, memberName: heldRow.member.membership.user.preferredName ?? heldRow.member.membership.user.name } : null,
  };
}

/** One more loan period from today: within the school's renewals, never late, and never while someone else waits for the title. */
export async function renewLoan(ctx: ActiveContext, issueId: string): Promise<LibraryLoan> {
  const desk = await deskOf(ctx);
  const s = await librarySettings(desk.schoolId);
  const i = await db.libraryIssue.findFirst({ where: { id: issueId, schoolId: desk.schoolId }, select: { id: true, dueOn: true, returnedAt: true, renewedCount: true, memberId: true, member: { select: { kind: true } }, copy: { select: { titleId: true } } } });
  if (!i || i.returnedAt) throw new AccessError("library.refuseNotOnLoan", "NOT_FOUND");
  const today = todayKey(desk.timeZone);
  if (daysBetween(i.dueOn, today) > 0) throw new AccessError("library.refuseRenewOverdue");
  if (i.renewedCount >= s.maxRenewals) throw new AccessError("library.refuseRenewLimit", "FORBIDDEN", { count: s.maxRenewals });
  const waiting = await db.libraryReservation.count({ where: { titleId: i.copy.titleId, memberId: { not: i.memberId }, fulfilledAt: null, cancelledAt: null, ...STILL_WAITING } });
  if (waiting > 0) throw new AccessError("library.refuseRenewQueue");
  const dueOn = addDaysToKey(today, loanDaysOf(s, i.member.kind));
  const updated = await db.libraryIssue.updateMany({ where: { id: i.id, returnedAt: null, renewedCount: i.renewedCount }, data: { dueOn, renewedCount: { increment: 1 }, remindedOn: null } });
  if (updated.count !== 1) throw new AccessError("common.tryAgain");
  await audit({ schoolId: desk.schoolId, actorUserId: desk.userId, action: "library.renew", targetType: "LibraryIssue", targetId: i.id, meta: { dueOn } });
  return loanById(i.id, today, s);
}

/** Every loan past its due day, oldest due first. */
export async function overdueLoans(ctx: ActiveContext): Promise<{ todayKey: string; items: LibraryLoan[] }> {
  const desk = await deskOf(ctx, "read");
  const s = await librarySettings(desk.schoolId);
  const today = todayKey(desk.timeZone);
  const rows = await db.libraryIssue.findMany({ where: { schoolId: desk.schoolId, returnedAt: null, dueOn: { lt: today } }, orderBy: [{ dueOn: "asc" }, { id: "asc" }], include: LOAN_INCLUDE, take: 500 });
  return { todayKey: today, items: await Promise.all(rows.map((r) => loanOf(r, today, s))) };
}

/** Tells each overdue borrower (and a pupil's guardians) once a day, through the usual notices. */
export async function sendOverdueNotices(ctx: ActiveContext): Promise<{ sent: number; already: number }> {
  const desk = await deskOf(ctx);
  const today = todayKey(desk.timeZone);
  const rows = await db.libraryIssue.findMany({ where: { schoolId: desk.schoolId, returnedAt: null, dueOn: { lt: today } }, include: { copy: { select: { title: { select: { title: true } } } }, member: { select: { kind: true, membership: { select: { id: true, userId: true, role: true } } } } }, take: 500 });
  let sent = 0;
  let already = 0;
  for (const r of rows) {
    const claimed = await db.libraryIssue.updateMany({ where: { id: r.id, OR: [{ noticedOn: null }, { noticedOn: { not: today } }] }, data: { noticedOn: today } });
    if (claimed.count === 0) {
      already += 1;
      continue;
    }
    await tellMember(desk.schoolId, r.member, "overdue", { title: r.copy.title.title, due: r.dueOn }).catch((error) => console.error("[library] overdue notice failed", error));
    sent += 1;
  }
  if (sent) await audit({ schoolId: desk.schoolId, actorUserId: desk.userId, action: "library.notices", targetType: "School", targetId: desk.schoolId, meta: { sent } });
  return { sent, already };
}

/**
 * THE "DUE TOMORROW" PUSH (job library:remind, daily): every loan due back
 * tomorrow in its school's zone, at every school with the library on, told
 * once to the borrower and a pupil's guardians.
 */
export async function remindDueTomorrow(now: Date = new Date(), only?: { schoolId: string }): Promise<{ sent: number; perSchool: Record<string, { reminders: number }> }> {
  const on = await db.schoolModule.findMany({ where: { module: "LIBRARY", ...(only ? { schoolId: only.schoolId } : {}) }, select: { schoolId: true, school: { select: { timezone: true, removedAt: true } } } });
  const perSchool: Record<string, { reminders: number }> = {};
  let sent = 0;
  for (const m of on) {
    if (m.school.removedAt) continue;
    const today = todayKey(m.school.timezone, now);
    const tomorrow = addDaysToKey(today, 1);
    await forSchool(m.schoolId, async () => {
      const due = await db.libraryIssue.findMany({ where: { schoolId: m.schoolId, returnedAt: null, dueOn: tomorrow, OR: [{ remindedOn: null }, { remindedOn: { not: today } }] }, include: { copy: { select: { title: { select: { title: true } } } }, member: { select: { kind: true, membership: { select: { id: true, userId: true, role: true } } } } }, take: 2000 });
      for (const r of due) {
        const claimed = await db.libraryIssue.updateMany({ where: { id: r.id, OR: [{ remindedOn: null }, { remindedOn: { not: today } }] }, data: { remindedOn: today } });
        if (claimed.count === 0) continue;
        await tellMember(m.schoolId, r.member, "due", { title: r.copy.title.title, due: r.dueOn }).catch((error) => console.error("[library] due notice failed", error));
        sent += 1;
        (perSchool[m.schoolId] ??= { reminders: 0 }).reminders += 1;
      }
    });
  }
  return { sent, perSchool };
}

/* -------------------------------------------------------------------------- */
/* Fines                                                                       */
/* -------------------------------------------------------------------------- */

export async function listFines(ctx: ActiveContext, status: "DUE" | "ALL"): Promise<{ items: LibraryFine[]; duePaise: number }> {
  const desk = await deskOf(ctx, "read");
  const rows = await db.libraryFine.findMany({ where: { schoolId: desk.schoolId, ...(status === "DUE" ? { waivedAt: null, settledAt: null } : {}) }, orderBy: { createdAt: "desc" }, take: 500, select: FINE_SELECT });
  const items = (await finesOf(rows)).filter((f) => status === "ALL" || f.status === "DUE");
  return { items, duePaise: items.filter((f) => f.status === "DUE").reduce((a, f) => a + f.paise, 0) };
}

/** A fine for a damaged or lost book. LOST also ends the loan and marks the copy lost. One of each per loan. */
export async function raiseFine(ctx: ActiveContext, input: { issueId: string; reason: "DAMAGE" | "LOST"; paise: number }): Promise<LibraryFine> {
  const desk = await deskOf(ctx);
  const s = await librarySettings(desk.schoolId);
  const t = await getT();
  const i = await db.libraryIssue.findFirst({ where: { id: input.issueId, schoolId: desk.schoolId }, select: { id: true, copyId: true, returnedAt: true, member: { select: { id: true, kind: true, membershipId: true } }, copy: { select: { titleId: true, title: { select: { title: true } } } } } });
  if (!i) throw new AccessError("library.refuseNotOnLoan", "NOT_FOUND");
  if (input.reason === "LOST" && i.returnedAt) throw new AccessError("library.refuseNotOnLoan");
  const exists = await db.libraryFine.findUnique({ where: { issueId_reason: { issueId: i.id, reason: input.reason } }, select: { id: true } });
  if (exists) throw new AccessError("library.refuseFineExists");
  const today = todayKey(desk.timeZone);
  const outcome = await db.$tenantTransaction(async (raw) => {
    const tx = raw as Tx;
    if (input.reason === "LOST") {
      await tx.libraryIssue.updateMany({ where: { id: i.id, returnedAt: null }, data: { returnedAt: new Date(), returnedByUserId: desk.userId } });
      await tx.libraryCopy.update({ where: { id: i.copyId }, data: { status: "LOST" } });
    }
    const demandId = await chargeFine(tx, desk.schoolId, i.member.kind, i.member.membershipId, s, input.paise, t("library.fineLabel", { title: i.copy.title.title }), today);
    const fine = await tx.libraryFine.create({ data: { schoolId: desk.schoolId, issueId: i.id, memberId: i.member.id, paise: input.paise, reason: input.reason, raisedByUserId: desk.userId, demandId }, select: { id: true } });
    return { fineId: fine.id, ready: input.reason === "LOST" ? await rehold(tx, i.copy.titleId) : [] };
  });
  await audit({ schoolId: desk.schoolId, actorUserId: desk.userId, action: "library.fine.raise", targetType: "LibraryFine", targetId: outcome.fineId, meta: { reason: input.reason, paise: input.paise } });
  await tellReady(desk.schoolId, outcome.ready);
  const row = await db.libraryFine.findUniqueOrThrow({ where: { id: outcome.fineId }, select: FINE_SELECT });
  return (await finesOf([row]))[0]!;
}

/** Waives a fine with a reason: its demand on the ledger is waived with it, unless money has already gone to it. */
export async function waiveFine(ctx: ActiveContext, fineId: string, reason: string): Promise<LibraryFine> {
  const desk = await deskOf(ctx);
  const f = await db.libraryFine.findFirst({ where: { id: fineId, schoolId: desk.schoolId }, select: { id: true, waivedAt: true, settledAt: true, demandId: true, paise: true } });
  if (!f) throw new AccessError("library.refuseNoFine", "NOT_FOUND");
  if (!f.waivedAt) {
    if (f.settledAt) throw new AccessError("library.refuseFinePaid");
    const outcome = await db.$tenantTransaction(async (raw) => {
      const tx = raw as Tx;
      if (f.demandId) {
        const d = await tx.feeDemand.findUnique({ where: { id: f.demandId }, select: { paidPaise: true, status: true, _count: { select: { allocations: true } } } });
        if (d && (d.paidPaise > 0 || d._count.allocations > 0 || d.status === "PAID")) return "paid" as const;
        if (d && d.status === "OPEN") await tx.feeDemand.update({ where: { id: f.demandId }, data: { status: "WAIVED" } });
      }
      await tx.libraryFine.update({ where: { id: f.id }, data: { waivedAt: new Date(), waivedByUserId: desk.userId, waivedReason: reason } });
      return "waived" as const;
    });
    if (outcome === "paid") throw new AccessError("library.refuseFinePaid");
    await audit({ schoolId: desk.schoolId, actorUserId: desk.userId, action: "library.fine.waive", targetType: "LibraryFine", targetId: f.id, meta: { paise: f.paise, onLedger: Boolean(f.demandId) } });
  }
  const row = await db.libraryFine.findUniqueOrThrow({ where: { id: f.id }, select: FINE_SELECT });
  return (await finesOf([row]))[0]!;
}

/** The office records a counter due as settled — the money taken at its own counter; a fine on the ledger is paid there instead. */
export async function settleFine(ctx: ActiveContext, fineId: string): Promise<LibraryFine> {
  const desk = await deskOf(ctx);
  if (desk.role !== "ADMIN") throw new AccessError("access.wrongRoleForThisAction");
  const f = await db.libraryFine.findFirst({ where: { id: fineId, schoolId: desk.schoolId }, select: { id: true, waivedAt: true, settledAt: true, demandId: true, paise: true } });
  if (!f) throw new AccessError("library.refuseNoFine", "NOT_FOUND");
  if (f.demandId) throw new AccessError("library.refuseOnLedger");
  if (f.waivedAt) throw new AccessError("library.refuseFineWaived");
  if (!f.settledAt) {
    await db.libraryFine.update({ where: { id: f.id }, data: { settledAt: new Date(), settledByUserId: desk.userId } });
    await audit({ schoolId: desk.schoolId, actorUserId: desk.userId, action: "library.fine.settle", targetType: "LibraryFine", targetId: f.id, meta: { paise: f.paise } });
  }
  const row = await db.libraryFine.findUniqueOrThrow({ where: { id: f.id }, select: FINE_SELECT });
  return (await finesOf([row]))[0]!;
}

/* -------------------------------------------------------------------------- */
/* Stock-take                                                                  */
/* -------------------------------------------------------------------------- */

export async function stockTake(ctx: ActiveContext): Promise<LibraryStockTake> {
  const desk = await deskOf(ctx, "read");
  const s = await librarySettings(desk.schoolId);
  const expected = { schoolId: desk.schoolId, status: { in: ["AVAILABLE", "REPAIR"] } };
  const total = await db.libraryCopy.count({ where: expected });
  if (!s.stockTakeStartedAt) return { startedAt: null, total, seen: 0, unseen: [] };
  const [seen, unseen] = await Promise.all([
    db.libraryCopy.count({ where: { ...expected, seenAt: { gte: s.stockTakeStartedAt } } }),
    db.libraryCopy.findMany({ where: { ...expected, OR: [{ seenAt: null }, { seenAt: { lt: s.stockTakeStartedAt } }] }, orderBy: [{ rack: "asc" }, { accession: "asc" }], take: 200, select: { accession: true, rack: true, status: true, title: { select: { title: true } } } }),
  ]);
  return { startedAt: s.stockTakeStartedAt.toISOString(), total, seen, unseen: unseen.map((c) => ({ accession: c.accession, title: c.title.title, rack: c.rack, status: c.status as "AVAILABLE" })) };
}

export async function stockTakeAction(ctx: ActiveContext, action: "START" | "FINISH"): Promise<LibraryStockTake> {
  const desk = await deskOf(ctx);
  const s = await librarySettings(desk.schoolId);
  if (action === "START" && !s.stockTakeStartedAt) {
    await db.librarySettings.upsert({ where: { schoolId: desk.schoolId }, create: { schoolId: desk.schoolId, stockTakeStartedAt: new Date() }, update: { stockTakeStartedAt: new Date() } });
    await audit({ schoolId: desk.schoolId, actorUserId: desk.userId, action: "library.stocktake.start", targetType: "School", targetId: desk.schoolId });
  }
  if (action === "FINISH" && s.stockTakeStartedAt) {
    const summary = await stockTake(ctx);
    await db.librarySettings.update({ where: { schoolId: desk.schoolId }, data: { stockTakeStartedAt: null } });
    await audit({ schoolId: desk.schoolId, actorUserId: desk.userId, action: "library.stocktake.finish", targetType: "School", targetId: desk.schoolId, meta: { total: summary.total, seen: summary.seen } });
    return { ...summary, startedAt: null };
  }
  return stockTake(ctx);
}

/** Marks a copy seen in the running stock-take; seeing it twice is the same. */
export async function stockTakeSeen(ctx: ActiveContext, accession: string): Promise<LibraryStockTake> {
  const desk = await deskOf(ctx);
  const s = await librarySettings(desk.schoolId);
  if (!s.stockTakeStartedAt) throw new AccessError("library.refuseNoStockTake");
  const copy = await db.libraryCopy.findUnique({ where: { schoolId_accession: { schoolId: desk.schoolId, accession } }, select: { id: true, seenAt: true } });
  if (!copy) throw new AccessError("library.refuseNoCopy", "NOT_FOUND");
  if (!copy.seenAt || copy.seenAt < s.stockTakeStartedAt) await db.libraryCopy.update({ where: { id: copy.id }, data: { seenAt: new Date() } });
  return stockTake(ctx);
}

/* -------------------------------------------------------------------------- */
/* Reports and the member's own page                                           */
/* -------------------------------------------------------------------------- */

export async function libraryReports(ctx: ActiveContext, now: Date = new Date()): Promise<LibraryReports> {
  const desk = await deskOf(ctx, "read");
  const today = todayKey(desk.timeZone, now);
  const [ty, tm] = today.split("-").map(Number) as [number, number];
  const months = Array.from({ length: 12 }, (_, k) => new Date(Date.UTC(ty, tm - 1 - (11 - k), 1)).toISOString().slice(0, 7));
  const firstMonth = `${months[0]}-01`;
  const [titles, copies, onLoan, overdue, members, issued, fines] = await Promise.all([
    db.libraryTitle.count({ where: { schoolId: desk.schoolId } }),
    db.libraryCopy.count({ where: { schoolId: desk.schoolId, status: { in: LENT } } }),
    db.libraryIssue.count({ where: { schoolId: desk.schoolId, returnedAt: null } }),
    db.libraryIssue.findMany({ where: { schoolId: desk.schoolId, returnedAt: null, dueOn: { lt: today } }, select: { member: { select: { membership: { select: { enrollments: { where: { status: "ACTIVE" }, select: { class: { select: { name: true } } }, take: 1 } } } } } } }),
    db.libraryMember.count({ where: { schoolId: desk.schoolId } }),
    db.libraryIssue.findMany({ where: { schoolId: desk.schoolId, issuedAt: { gte: new Date(`${firstMonth}T00:00:00Z`) } }, select: { issuedAt: true, copy: { select: { titleId: true, title: { select: { title: true } } } } } }),
    listFines(ctx, "DUE"),
  ]);
  const byMonth = new Map(months.map((m) => [m, 0]));
  const byTitle = new Map<string, { title: string; count: number }>();
  for (const i of issued) {
    const m = todayKey(desk.timeZone, i.issuedAt).slice(0, 7);
    if (byMonth.has(m)) byMonth.set(m, byMonth.get(m)! + 1);
    const e = byTitle.get(i.copy.titleId) ?? { title: i.copy.title.title, count: 0 };
    e.count += 1;
    byTitle.set(i.copy.titleId, e);
  }
  const byClass = new Map<string | null, number>();
  for (const o of overdue) {
    const c = o.member.membership.enrollments[0]?.class.name ?? null;
    byClass.set(c, (byClass.get(c) ?? 0) + 1);
  }
  return {
    totals: { titles, copies, onLoan, overdue: overdue.length, members, duePaise: fines.duePaise },
    issuesByMonth: months.map((month) => ({ month, count: byMonth.get(month) ?? 0 })),
    mostBorrowed: [...byTitle.entries()].sort((a, b) => b[1].count - a[1].count || a[1].title.localeCompare(b[1].title)).slice(0, 10).map(([titleId, e]) => ({ titleId, title: e.title, count: e.count })),
    overdueByClass: [...byClass.entries()].sort((a, b) => b[1] - a[1] || String(a[0]).localeCompare(String(b[0]))).map(([className, count]) => ({ className, count })),
  };
}

/** A member's own library — a pupil's, a teacher's, or a guardian's child's: loans (with the last ten returned), dues and queue. */
export async function myLibrary(ctx: ActiveContext, childId?: string | null): Promise<LibraryMine> {
  const reader = await readerOf(ctx, childId);
  if (!reader.person) throw new AccessError("access.wrongRoleForThisAction");
  const view = await viewForPerson(reader.schoolId, reader.timeZone, reader.person, { includeReturned: true });
  return { membershipId: reader.person.id, name: view.member.name, limit: view.member.limit, loans: view.loans, fines: view.fines, reservations: view.reservations };
}

/* -------------------------------------------------------------------------- */
/* Import from a spreadsheet                                                   */
/* -------------------------------------------------------------------------- */

const HEADERS: Record<string, string[]> = {
  title: ["title", "book", "book title", "name"],
  author: ["author", "authors", "writer"],
  isbn: ["isbn", "isbn13", "isbn10"],
  publisher: ["publisher"],
  year: ["year", "published", "year of publication"],
  subject: ["subject"],
  language: ["language", "lang"],
  category: ["category", "type"],
  copies: ["copies", "qty", "quantity", "count"],
  accession: ["accession", "accession no", "accession number", "acc no", "accessions"],
  rack: ["rack", "shelf", "location"],
};

const LANGUAGE_WORDS: Record<string, string> = { en: "EN", english: "EN", hi: "HI", hindi: "HI", "हिंदी": "HI", mr: "MR", marathi: "MR", "मराठी": "MR", sa: "SA", sanskrit: "SA", ur: "UR", urdu: "UR" };

function pick(row: Record<string, string>, field: string): string {
  for (const h of HEADERS[field]!) if (row[h] !== undefined && row[h] !== "") return row[h]!.trim();
  return "";
}

/** The accessions a row gives: a list (split on ; , space or |), or one number counted on for `copies` books. */
export function accessionsOf(raw: string, copies: number): string[] | null {
  const listed = raw.split(/[;|\s,]+/).map((a) => a.trim()).filter(Boolean);
  if (listed.length > 1) return listed;
  if (listed.length === 0) return copies > 0 ? null : [];
  const one = listed[0]!;
  if (copies <= 1) return [one];
  // An accession is at most 30 characters (importCatalogue refuses longer), and the pattern below backtracks in time
  // growing with the square of a long one (TA-247), so a long one is refused before it is matched.
  if (one.length > 30) return null;
  const m = /^(.*?)(\d+)$/.exec(one);
  if (!m) return null;
  const width = m[2]!.length;
  const start = Number(m[2]);
  return Array.from({ length: copies }, (_, k) => `${m[1]}${String(start + k).padStart(width, "0")}`);
}

/**
 * The catalogue from a pasted sheet (CSV, or tab-separated as a spreadsheet
 * copies). A row with an ISBN the school holds, or the same title and author,
 * adds copies to that title; a row naming a taken accession keeps the title
 * and skips the copy. Running the same sheet twice adds nothing.
 */
export async function importCatalogue(ctx: ActiveContext, text: string): Promise<LibraryImportResult> {
  const desk = await deskOf(ctx);
  const firstLine = text.split(/\r?\n/, 1)[0] ?? "";
  const csv = firstLine.includes("\t") && !firstLine.includes(",") ? text.split(/\r?\n/).map((l) => l.split("\t").map((c) => (/[",\n]/.test(c) ? `"${c.replace(/"/g, '""')}"` : c)).join(",")).join("\n") : text;
  const parsed = parseCsv(csv);
  const result: LibraryImportResult = { titlesCreated: 0, titlesMatched: 0, copiesCreated: 0, skipped: [], noHeader: false };
  if (!HEADERS.title!.some((h) => parsed.headers.includes(h))) return { ...result, noHeader: true };
  for (let k = 0; k < Math.min(parsed.rows.length, 5000); k += 1) {
    const row = parsed.rows[k]!;
    const line = parsed.lineNumbers[k] ?? k + 2;
    const title = pick(row, "title").slice(0, 200);
    if (!title) {
      if (Object.values(row).some((v) => v)) result.skipped.push({ line, reason: "NO_TITLE" });
      continue;
    }
    const rawIsbn = pick(row, "isbn");
    const isbn = rawIsbn ? normaliseIsbn(rawIsbn) : null;
    if (rawIsbn && !isbn) {
      result.skipped.push({ line, reason: "BAD_ISBN" });
      continue;
    }
    const rawYear = pick(row, "year");
    const year = rawYear ? Number(rawYear) : null;
    if (year !== null && (!Number.isInteger(year) || year < 1000 || year > 2100)) {
      result.skipped.push({ line, reason: "BAD_YEAR" });
      continue;
    }
    const author = pick(row, "author").slice(0, 120);
    const copiesRaw = pick(row, "copies");
    const copies = copiesRaw ? Number(copiesRaw) : 0;
    if (!Number.isInteger(copies) || copies < 0 || copies > 50) {
      result.skipped.push({ line, reason: "TOO_MANY_COPIES" });
      continue;
    }
    const accessions = accessionsOf(pick(row, "accession"), copies);
    if (accessions === null || accessions.some((a) => !/^[A-Za-z0-9][A-Za-z0-9\-/.]*$/.test(a) || a.length > 30)) {
      result.skipped.push({ line, reason: "BAD_ACCESSION" });
      continue;
    }
    const category = pick(row, "category").toUpperCase().replace(/[\s-]+/g, "_");
    const data = {
      title,
      author,
      isbn,
      publisher: pick(row, "publisher").slice(0, 120),
      year,
      subject: pick(row, "subject").slice(0, 80),
      language: LANGUAGE_WORDS[pick(row, "language").toLowerCase()] ?? "OTHER",
      category: (LIBRARY_CATEGORIES as readonly string[]).includes(category) ? category : "GENERAL",
    };
    let titleRow = isbn ? await db.libraryTitle.findUnique({ where: { schoolId_isbn: { schoolId: desk.schoolId, isbn } }, select: { id: true } }) : null;
    if (!titleRow && !isbn) titleRow = await db.libraryTitle.findFirst({ where: { schoolId: desk.schoolId, title: { equals: title, mode: "insensitive" }, author: { equals: author, mode: "insensitive" } }, select: { id: true } });
    if (titleRow) result.titlesMatched += 1;
    else {
      titleRow = await db.libraryTitle.create({ data: { schoolId: desk.schoolId, ...data }, select: { id: true } });
      result.titlesCreated += 1;
    }
    const rack = pick(row, "rack").slice(0, 40);
    for (const accession of accessions) {
      const taken = await db.libraryCopy.findUnique({ where: { schoolId_accession: { schoolId: desk.schoolId, accession } }, select: { id: true } });
      if (taken) {
        result.skipped.push({ line, reason: "ACCESSION_TAKEN" });
        continue;
      }
      try {
        await db.libraryCopy.create({ data: { schoolId: desk.schoolId, titleId: titleRow.id, accession, rack } });
        result.copiesCreated += 1;
      } catch {
        result.skipped.push({ line, reason: "ACCESSION_TAKEN" });
      }
    }
  }
  await audit({ schoolId: desk.schoolId, actorUserId: desk.userId, action: "library.import", targetType: "School", targetId: desk.schoolId, meta: { titlesCreated: result.titlesCreated, titlesMatched: result.titlesMatched, copiesCreated: result.copiesCreated, skipped: result.skipped.length } });
  return result;
}
