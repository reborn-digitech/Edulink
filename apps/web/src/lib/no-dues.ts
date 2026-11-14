import "server-only";
import { isCollegeKind } from "@edulink/contracts";
import { db } from "./db";
import { AccessError } from "./access-error";
import { assertCollege } from "./modules";
import { audit } from "./audit";
import { readJson, writeJson } from "./json";
import { currentAcademicYear } from "./academic-year";
import { claimReceivable } from "./college-fees";
import { cautionPaidOn } from "./college-admissions";
import { collegeStudent, nameOf, yearKeyOf } from "./college-office";
import type { ActiveContext } from "./session";
import type { Role } from "./constants";
import { todayKey } from "./dates";

/**
 * NO-DUES (the college office, 4 October 2026): before an exam form, on
 * leaving the hostel and on leaving the college, every desk that could be
 * owed something says the student owes it nothing.
 *
 * THE LINES ARE READ, NOT KEPT. Each desk's line is worked out from the rows
 * that hold the debt, every time:
 *   ACCOUNTS — the fee ledger's outstanding demands (every year), net of the
 *              scholarship receivable the state still owes on this year's;
 *   LIBRARY  — fines neither waived nor settled (one on the ledger counts
 *              while its demand is unpaid), and books still out;
 *   HOSTEL   — the hostel's and the mess's demands still unpaid, and a bed
 *              still held;
 *   LAB      — stores issued to the student and not returned (the inventory
 *              module's movements to the person), at leaving.
 * The hostel's demands are the hostel's line and not the accounts line, the
 * library's fines the library's, so one debt is cleared by one desk.
 *
 * WHICH LINES AN EVENT ASKS FOR: an exam form the accounts, the library's
 * fines and the hostel's dues (books and the bed do not stop a form), and of
 * the ledger's demands only those already due on the school's today — the
 * December instalment does not stop an October form (LIFECYCLE-3); leaving
 * the hostel the hostel alone, bed included; leaving the college all four
 * with everything out counted. The hostel's line appears only for a student
 * who has boarded, the lab's only for one the stores have issued to.
 *
 * A DESK MAY CLEAR ITS LINE BY HAND (a fee the trust will carry, a book the
 * library wrote off), recorded with what was owed at that moment
 * (NoDuesClearance.clearsJson): the line stands cleared while what is owed
 * and out is no more than then, so a new due afterwards reopens it. The
 * clearance's `completedAt` is when every line first stood cleared.
 *
 * `noDuesFor` is the function the exams builder calls before a form; it reads
 * with the plain client (the caller has bound the person).
 */

export const NO_DUES_EVENTS = ["EXAM_FORM", "HOSTEL_EXIT", "LEAVING"] as const;
export type NoDuesEvent = (typeof NO_DUES_EVENTS)[number];

/** The desk a line belongs to; the same desk clears it. */
export type NoDuesDesk = "ACCOUNTS" | "LIBRARY" | "HOSTEL" | "LAB";

export type NoDuesLine = {
  desk: NoDuesDesk;
  /** What is owed on this line, in paise (0 when nothing is). */
  owedPaise: number;
  /** Items still out (books on loan, lab issues not returned, a bed held). */
  itemsOut: number;
  /** True when nothing is owed and nothing is out, or a desk cleared it by hand and nothing new has come since. */
  cleared: boolean;
  clearedByUserId: string | null;
  clearedAt: Date | null;
};

export type NoDuesResult = {
  studentMembershipId: string;
  event: NoDuesEvent;
  lines: NoDuesLine[];
  /** Every line cleared. */
  completed: boolean;
  /** When every line first stood cleared (recorded by a desk's clear), or null. */
  completedAt: Date | null;
};

/**
 * `openAtClear` (TA-084): the debts and items the line held when it was cleared, by id (`demand:…`, `fine:…`,
 * `issue:…`, `bed:…`, `item:…`). A hand clearance covers those and nothing else: an amount alone let a new debt no
 * larger than the waived one, after the waived one was paid, read as cleared in the first clerk's name for the rest
 * of the cycle. A clearance written before the ids were kept has none, and keeps the amount's rule.
 */
type HandClear = { clearedByUserId: string; clearedAt: string; owedAtClearPaise: number; itemsAtClear: number; note: string | null; openAtClear?: string[] };

/** Who clears a desk's line: the desk and the office. */
export const DESK_ROLES: Record<NoDuesDesk, readonly Role[]> = {
  ACCOUNTS: ["ACCOUNTS", "ADMIN"],
  LIBRARY: ["LIBRARIAN", "ADMIN"],
  HOSTEL: ["WARDEN", "ADMIN"],
  LAB: ["HOD", "ADMIN"],
};

/** The clearance's cycle: an exam form is cleared once per academic year; leaving and the hostel once. */
async function cycleKeyFor(schoolId: string, event: NoDuesEvent): Promise<string> {
  if (event !== "EXAM_FORM") return "";
  return (await currentAcademicYear(schoolId))?.id ?? "";
}

const outstanding = (d: { status: string; netPaise: number; paidPaise: number }) => (d.status === "OPEN" || d.status === "PART" ? Math.max(0, d.netPaise - d.paidPaise) : 0);

/** One desk's live line: what is owed and out, and the ids of the debts (`owedIds`) and items (`outIds`) behind them. */
type LiveLine = { owed: number; out: number; present: boolean; owedIds: string[]; outIds: string[] };
type Live = Record<NoDuesDesk, LiveLine>;

/**
 * The scholarship receivable set against each of this year's demands, as `ledgerFor` spreads it (each student's
 * claims' receivable over their open demands in due order, never more than a demand still owes), for many students
 * in two reads. Keyed by demand id.
 */
async function receivableByDemand(schoolId: string, studentIds: string[]): Promise<Map<string, number>> {
  const out = new Map<string, number>();
  const year = await currentAcademicYear(schoolId);
  if (!year || studentIds.length === 0) return out;
  const [demands, claims] = await Promise.all([
    db.feeDemand.findMany({ where: { schoolId, studentMembershipId: { in: studentIds }, academicYearId: year.id, status: { notIn: ["CANCELLED", "CARRIED"] } }, orderBy: [{ dueDate: "asc" }, { createdAt: "asc" }], select: { id: true, studentMembershipId: true, status: true, netPaise: true, paidPaise: true } }),
    db.scholarshipClaim.findMany({ where: { schoolId, studentMembershipId: { in: studentIds }, academicYear: yearKeyOf(year.startDate) }, select: { studentMembershipId: true, status: true, expectedPaise: true, sanctionedPaise: true, disbursedPaise: true } }),
  ]);
  const pool = new Map<string, number>();
  for (const c of claims) pool.set(c.studentMembershipId, (pool.get(c.studentMembershipId) ?? 0) + claimReceivable(c));
  for (const x of demands) {
    const left = pool.get(x.studentMembershipId) ?? 0;
    const take = Math.min(left, outstanding(x));
    if (take <= 0) continue;
    pool.set(x.studentMembershipId, left - take);
    out.set(x.id, take);
  }
  return out;
}

/**
 * The four desks' live state for each student named; `dueBy` (a UTC-midnight day) counts only demands due on or
 * before it. TA-085: one student at a time this was about fifteen reads a student, so the desk's list of a college of
 * two thousand made some thirty thousand on every load; the reads are now grouped, a fixed number whatever the count.
 */
async function liveStates(schoolId: string, studentIds: string[], dueBy: Date | null = null): Promise<Map<string, Live>> {
  const [demands, members, allotments, movements, hostelHeads, receivable] = await Promise.all([
    db.feeDemand.findMany({ where: { schoolId, studentMembershipId: { in: studentIds }, status: { in: ["OPEN", "PART"] }, ...(dueBy ? { dueDate: { lte: dueBy } } : {}) }, select: { id: true, studentMembershipId: true, status: true, netPaise: true, paidPaise: true, linesJson: true } }),
    db.libraryMember.findMany({ where: { membershipId: { in: studentIds } }, select: { membershipId: true, fines: { where: { waivedAt: null, settledAt: null }, select: { id: true, paise: true, demandId: true } }, issues: { where: { returnedAt: null }, select: { id: true } } } }),
    db.hostelAllotment.findMany({ where: { schoolId, membershipId: { in: studentIds } }, select: { id: true, membershipId: true, status: true, feeDemandId: true } }),
    db.stockMovement.groupBy({ by: ["toMembershipId", "itemId"], where: { schoolId, toMembershipId: { in: studentIds }, kind: { in: ["ISSUE", "RETURN"] } }, _sum: { delta: true } }),
    db.feeHead.findMany({ where: { schoolId, kind: { in: ["HOSTEL", "MESS"] } }, select: { id: true } }),
    receivableByDemand(schoolId, studentIds),
  ]);
  const hostelHeadIds = new Set(hostelHeads.map((h) => h.id));
  const out = new Map<string, Live>();
  for (const sid of studentIds) {
    const member = members.find((m) => m.membershipId === sid);
    const mine = allotments.filter((a) => a.membershipId === sid);
    const moves = movements.filter((m) => m.toMembershipId === sid);
    const fineDemands = new Set((member?.fines ?? []).map((f) => f.demandId).filter((x): x is string => Boolean(x)));
    const hostelDemandIds = new Set(mine.map((a) => a.feeDemandId).filter((x): x is string => Boolean(x)));
    const isHostelDemand = (d: { id: string; linesJson: string }) => {
      if (hostelDemandIds.has(d.id)) return true;
      const lines = readJson<{ headId: string }[]>(d.linesJson, []);
      return lines.length > 0 && lines.every((l) => hostelHeadIds.has(l.headId));
    };
    const line = (): LiveLine => ({ owed: 0, out: 0, present: true, owedIds: [], outIds: [] });
    const live: Live = { ACCOUNTS: line(), LIBRARY: line(), HOSTEL: line(), LAB: line() };
    // The accounts line is net of the receivable set against ITS OWN demands (TA-310): the year's whole receivable,
    // set partly against instalments not yet due, used to wipe out an earlier year's arrears on an exam form.
    let accountsReceivable = 0;
    for (const d of demands) {
      if (d.studentMembershipId !== sid) continue;
      const o = outstanding(d);
      if (o <= 0) continue;
      const desk: NoDuesDesk = fineDemands.has(d.id) ? "LIBRARY" : isHostelDemand(d) ? "HOSTEL" : "ACCOUNTS";
      live[desk].owed += o;
      live[desk].owedIds.push(`demand:${d.id}`);
      if (desk === "ACCOUNTS") accountsReceivable += receivable.get(d.id) ?? 0;
    }
    live.ACCOUNTS.owed = Math.max(0, live.ACCOUNTS.owed - accountsReceivable);
    for (const f of member?.fines ?? []) {
      if (f.demandId) continue;
      live.LIBRARY.owed += f.paise;
      live.LIBRARY.owedIds.push(`fine:${f.id}`);
    }
    live.LIBRARY.out = member?.issues.length ?? 0;
    live.LIBRARY.outIds = (member?.issues ?? []).map((i) => `issue:${i.id}`);
    const beds = mine.filter((a) => a.status === "ACTIVE");
    live.HOSTEL.out = beds.length;
    live.HOSTEL.outIds = beds.map((a) => `bed:${a.id}`);
    live.HOSTEL.present = mine.length > 0;
    const outItems = moves.filter((m) => (m._sum.delta ?? 0) < 0);
    live.LAB.out = outItems.reduce((a, m) => a + Math.max(0, -(m._sum.delta ?? 0)), 0);
    live.LAB.outIds = outItems.map((m) => `item:${m.itemId}`);
    live.LAB.present = moves.length > 0;
    out.set(sid, live);
  }
  return out;
}

/** One desk's line from its live state and the desk's hand clearance, if any. */
function lineOf(desk: NoDuesDesk, event: NoDuesEvent, live: LiveLine, hand: HandClear | undefined): NoDuesLine {
  const owed = live.owed;
  // An exam form is not stopped by books or a bed; leaving is.
  const out = event === "EXAM_FORM" ? 0 : live.out;
  const open = [...(owed > 0 ? live.owedIds : []), ...(out > 0 ? live.outIds : [])];
  const kept = hand?.openAtClear;
  const covered = kept ? open.every((x) => kept.includes(x)) : true;
  const byHand = hand !== undefined && owed <= hand.owedAtClearPaise && out <= hand.itemsAtClear && covered;
  return { desk, owedPaise: owed, itemsOut: out, cleared: (owed === 0 && out === 0) || byHand, clearedByUserId: byHand ? hand.clearedByUserId : null, clearedAt: byHand ? new Date(hand.clearedAt) : null };
}

const DESKS_FOR: Record<NoDuesEvent, NoDuesDesk[]> = {
  EXAM_FORM: ["ACCOUNTS", "LIBRARY", "HOSTEL"],
  HOSTEL_EXIT: ["HOSTEL"],
  LEAVING: ["ACCOUNTS", "LIBRARY", "HOSTEL", "LAB"],
};

/**
 * THE FUNCTION THE EXAM FORM CALLS. One line per desk the event asks for,
 * each with what is owed and out and whether it stands cleared; `completed`
 * when every line does. A student at a school (not a college) has nothing to
 * clear and is answered completed with no lines.
 */
export async function noDuesFor(studentMembershipId: string, event: NoDuesEvent, now: Date = new Date()): Promise<NoDuesResult> {
  const m = await db.membership.findFirst({ where: { id: studentMembershipId, role: "STUDENT" }, select: { id: true, schoolId: true, school: { select: { kind: true, timezone: true } } } });
  if (!m) throw new AccessError("collegeOffice.notFound", "NOT_FOUND");
  if (!isCollegeKind(m.school.kind)) return { studentMembershipId, event, lines: [], completed: true, completedAt: null };
  // An exam form asks what is owed today; leaving and the hostel ask for everything.
  const dueBy = event === "EXAM_FORM" ? new Date(`${todayKey(m.school.timezone, now)}T00:00:00.000Z`) : null;
  const [lives, cycleKey] = await Promise.all([liveStates(m.schoolId, [m.id], dueBy), cycleKeyFor(m.schoolId, event)]);
  const row = await db.noDuesClearance.findUnique({ where: { studentMembershipId_event_cycleKey: { studentMembershipId: m.id, event, cycleKey } }, select: { clearsJson: true, completedAt: true } });
  return resultOf(m.id, event, lives.get(m.id)!, row);
}

function resultOf(studentMembershipId: string, event: NoDuesEvent, live: Live, row: { clearsJson: string; completedAt: Date | null } | null): NoDuesResult {
  const clears = readJson<Partial<Record<NoDuesDesk, HandClear>>>(row?.clearsJson, {});
  const lines: NoDuesLine[] = DESKS_FOR[event].filter((desk) => live[desk].present).map((desk) => lineOf(desk, event, live[desk], clears[desk]));
  return { studentMembershipId, event, lines, completed: lines.every((l) => l.cleared), completedAt: row?.completedAt ?? null };
}

/** What a line holds open right now, by id, for a hand clearance to record (TA-084). */
async function openOnLine(schoolId: string, timezone: string, studentMembershipId: string, event: NoDuesEvent, desk: NoDuesDesk): Promise<string[]> {
  const dueBy = event === "EXAM_FORM" ? new Date(`${todayKey(timezone)}T00:00:00.000Z`) : null;
  const live = (await liveStates(schoolId, [studentMembershipId], dueBy)).get(studentMembershipId)![desk];
  return [...live.owedIds, ...(event === "EXAM_FORM" ? [] : live.outIds)];
}

async function deskStudent(ctx: ActiveContext, studentMembershipId: string, roles: readonly Role[]) {
  if (!ctx.schoolId || !ctx.role || !roles.includes(ctx.role)) throw new AccessError("access.wrongRoleForThisAction");
  await assertCollege(ctx.schoolId);
  return collegeStudent(ctx.schoolId, studentMembershipId);
}

const ANY_DESK: readonly Role[] = ["ACCOUNTS", "ADMIN", "PRINCIPAL", "LIBRARIAN", "WARDEN", "HOD"];

export type NoDuesView = Omit<NoDuesResult, "lines" | "completedAt"> & { studentName: string; completedAt: string | null; lines: (Omit<NoDuesLine, "clearedByUserId" | "clearedAt"> & { clearedByName: string | null; clearedAt: string | null })[] };

async function view(r: NoDuesResult, studentName: string): Promise<NoDuesView> {
  const ids = [...new Set(r.lines.map((l) => l.clearedByUserId).filter((x): x is string => Boolean(x)))];
  const names = new Map((ids.length ? await db.user.findMany({ where: { id: { in: ids } }, select: { id: true, name: true } }) : []).map((u) => [u.id, u.name]));
  return {
    studentMembershipId: r.studentMembershipId,
    studentName,
    event: r.event,
    completed: r.completed,
    completedAt: r.completedAt?.toISOString() ?? null,
    lines: r.lines.map((l) => ({ desk: l.desk, owedPaise: l.owedPaise, itemsOut: l.itemsOut, cleared: l.cleared, clearedByName: l.clearedByUserId ? (names.get(l.clearedByUserId) ?? null) : null, clearedAt: l.clearedAt?.toISOString() ?? null })),
  };
}

/**
 * WHAT A DESK SEES OF ANOTHER DESK'S LINE (the role audit of 5 Oct 2026). The librarian, the warden and an HOD keep
 * one line each — the library's, the hostel's, the lab's — and need of the others only whether they stand cleared:
 * the fee arrears the accounts line carries, in rupees, are the accounts desk's and the office's to read. Their
 * reads of another desk's line say cleared or not, with no amount and no count.
 */
const FULL_READ: readonly Role[] = ["ACCOUNTS", "ADMIN", "PRINCIPAL"];
function forDesk(role: Role, v: NoDuesView): NoDuesView {
  if (FULL_READ.includes(role)) return v;
  return { ...v, lines: v.lines.map((l) => (DESK_ROLES[l.desk].includes(role) ? l : { ...l, owedPaise: 0, itemsOut: 0 })) };
}

/** A desk's read of one student's clearance (another desk's amounts withheld from a single desk, `forDesk`). */
export async function noDuesView(ctx: ActiveContext, studentMembershipId: string, event: NoDuesEvent): Promise<NoDuesView> {
  const s = await deskStudent(ctx, studentMembershipId, ANY_DESK);
  return forDesk(ctx.role!, await view(await noDuesFor(s.id, event), nameOf(s.user)));
}

/** The student's own clearances, every event. */
export async function myNoDues(ctx: ActiveContext): Promise<{ items: NoDuesView[] }> {
  if (ctx.role !== "STUDENT" || !ctx.membershipId || !ctx.schoolId) throw new AccessError("access.wrongRoleForThisAction");
  await assertCollege(ctx.schoolId);
  const s = await collegeStudent(ctx.schoolId, ctx.membershipId);
  return { items: await Promise.all(NO_DUES_EVENTS.map(async (e) => view(await noDuesFor(s.id, e), nameOf(s.user)))) };
}

/**
 * A desk clears its line by hand, with what is owed and out at this moment
 * recorded so a later due reopens it. The desk must be the caller's (the
 * library's line by the librarian or the office, and so on). When every
 * line then stands cleared, the clearance is recorded complete.
 */
export async function clearLine(ctx: ActiveContext, studentMembershipId: string, input: { event: NoDuesEvent; desk: NoDuesDesk; note?: string }): Promise<NoDuesView> {
  const s = await deskStudent(ctx, studentMembershipId, ANY_DESK);
  if (!DESK_ROLES[input.desk].includes(ctx.role!)) throw new AccessError("collegeOffice.refuseNotYourDesk");
  const before = await noDuesFor(s.id, input.event);
  const line = before.lines.find((l) => l.desk === input.desk);
  if (!line) throw new AccessError("collegeOffice.refuseNoSuchLine");
  // A line cleared by hand with money owed or items still out is a waiver, and a waiver says why (A3-journeys-8).
  if ((line.owedPaise > 0 || line.itemsOut > 0) && !input.note?.trim()) throw new AccessError("collegeOffice.refuseClearNeedsNote");
  const cycleKey = await cycleKeyFor(ctx.schoolId!, input.event);
  const key = { studentMembershipId: s.id, event: input.event, cycleKey };
  const existing = await db.noDuesClearance.findUnique({ where: { studentMembershipId_event_cycleKey: key }, select: { clearsJson: true } });
  const clears = readJson<Partial<Record<NoDuesDesk, HandClear>>>(existing?.clearsJson, {});
  const { timezone } = await db.school.findUniqueOrThrow({ where: { id: ctx.schoolId! }, select: { timezone: true } });
  const openAtClear = await openOnLine(ctx.schoolId!, timezone, s.id, input.event, input.desk);
  clears[input.desk] = { clearedByUserId: ctx.user.id, clearedAt: new Date().toISOString(), owedAtClearPaise: line.owedPaise, itemsAtClear: line.itemsOut, note: input.note?.trim().slice(0, 300) || null, openAtClear };
  await db.noDuesClearance.upsert({ where: { studentMembershipId_event_cycleKey: key }, create: { schoolId: ctx.schoolId!, ...key, clearsJson: writeJson(clears) }, update: { clearsJson: writeJson(clears) } });
  const after = await noDuesFor(s.id, input.event);
  if (after.completed && !after.completedAt) await db.noDuesClearance.update({ where: { studentMembershipId_event_cycleKey: key }, data: { completedAt: new Date() } });
  await audit({ schoolId: ctx.schoolId, actorUserId: ctx.user.id, action: "nodues.clear", targetType: "Membership", targetId: s.id, meta: { event: input.event, desk: input.desk, owedPaise: line.owedPaise, itemsOut: line.itemsOut } });
  return view(await noDuesFor(s.id, input.event), nameOf(s.user));
}

/** How many students the desk's list works out per round of grouped reads. */
const LIST_CHUNK = 500;

/** The desk's list: active students with an uncleared line for the event, the lines named. */
export async function noDuesList(ctx: ActiveContext, event: NoDuesEvent): Promise<{ items: { studentMembershipId: string; studentName: string; completed: boolean; uncleared: NoDuesDesk[] }[] }> {
  if (!ctx.schoolId || !ctx.role || !ANY_DESK.includes(ctx.role)) throw new AccessError("access.wrongRoleForThisAction");
  await assertCollege(ctx.schoolId);
  // Every active student, in a fixed order (TA-085: the old cut at 3,000, with no order, dropped whoever fell past it
  // without a word), worked out a chunk at a time with grouped reads, by the same rules as noDuesFor.
  const students = await db.membership.findMany({ where: { schoolId: ctx.schoolId, role: "STUDENT", status: "ACTIVE", leftAt: null }, select: { id: true, user: { select: { name: true, preferredName: true } } }, orderBy: { id: "asc" } });
  const { timezone } = await db.school.findUniqueOrThrow({ where: { id: ctx.schoolId }, select: { timezone: true } });
  const dueBy = event === "EXAM_FORM" ? new Date(`${todayKey(timezone)}T00:00:00.000Z`) : null;
  const cycleKey = await cycleKeyFor(ctx.schoolId, event);
  const items = [];
  // A single desk lists the students its own line holds up, and names only its own line (the role audit of 5 Oct 2026).
  const mine = (desk: NoDuesDesk) => FULL_READ.includes(ctx.role!) || DESK_ROLES[desk].includes(ctx.role!);
  for (let i = 0; i < students.length; i += LIST_CHUNK) {
    const chunk = students.slice(i, i + LIST_CHUNK);
    const ids = chunk.map((s) => s.id);
    const [lives, rows] = await Promise.all([liveStates(ctx.schoolId, ids, dueBy), db.noDuesClearance.findMany({ where: { studentMembershipId: { in: ids }, event, cycleKey }, select: { studentMembershipId: true, clearsJson: true, completedAt: true } })]);
    for (const s of chunk) {
      const r = resultOf(s.id, event, lives.get(s.id)!, rows.find((x) => x.studentMembershipId === s.id) ?? null);
      const uncleared = r.lines.filter((l) => !l.cleared && mine(l.desk)).map((l) => l.desk);
      if (!r.completed && uncleared.length > 0) items.push({ studentMembershipId: s.id, studentName: nameOf(s.user), completed: false, uncleared });
    }
  }
  return { items };
}

/** At leaving: the caution deposit paid, which the college returns net of what is still owed — recorded on the clearance, paid from the college's bank. */
export async function cautionReturnFor(schoolId: string, studentMembershipId: string): Promise<number> {
  const demands = await db.feeDemand.findMany({ where: { schoolId, studentMembershipId, status: { not: "CANCELLED" } }, select: { paidPaise: true, netPaise: true, linesJson: true, status: true } });
  const caution = await cautionPaidOn(schoolId, demands);
  const owed = demands.reduce((a, d) => a + outstanding(d), 0);
  return Math.max(0, caution - owed);
}
