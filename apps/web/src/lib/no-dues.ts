import "server-only";
import { isCollegeKind } from "@edulink/contracts";
import { db } from "./db";
import { AccessError } from "./access-error";
import { assertCollege } from "./modules";
import { audit } from "./audit";
import { readJson, writeJson } from "./json";
import { currentAcademicYear } from "./academic-year";
import { ledgerFor } from "./college-fees";
import { cautionPaidOn } from "./college-admissions";
import { collegeStudent, nameOf } from "./college-office";
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

type HandClear = { clearedByUserId: string; clearedAt: string; owedAtClearPaise: number; itemsAtClear: number; note: string | null };

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

/** The four desks' live state for one student; `dueBy` (a UTC-midnight day) counts only demands due on or before it. */
async function liveState(schoolId: string, studentMembershipId: string, dueBy: Date | null = null) {
  const [demands, member, allotments, movements, hostelHeads] = await Promise.all([
    db.feeDemand.findMany({ where: { schoolId, studentMembershipId, status: { in: ["OPEN", "PART"] }, ...(dueBy ? { dueDate: { lte: dueBy } } : {}) }, select: { id: true, status: true, netPaise: true, paidPaise: true, linesJson: true } }),
    db.libraryMember.findUnique({ where: { membershipId: studentMembershipId }, select: { id: true, fines: { where: { waivedAt: null, settledAt: null }, select: { paise: true, demandId: true } }, issues: { where: { returnedAt: null }, select: { id: true } } } }),
    db.hostelAllotment.findMany({ where: { schoolId, membershipId: studentMembershipId }, select: { status: true, feeDemandId: true } }),
    db.stockMovement.groupBy({ by: ["itemId"], where: { schoolId, toMembershipId: studentMembershipId, kind: { in: ["ISSUE", "RETURN"] } }, _sum: { delta: true } }),
    db.feeHead.findMany({ where: { schoolId, kind: { in: ["HOSTEL", "MESS"] } }, select: { id: true } }),
  ]);
  const fineDemands = new Set((member?.fines ?? []).map((f) => f.demandId).filter((x): x is string => Boolean(x)));
  const hostelDemandIds = new Set(allotments.map((a) => a.feeDemandId).filter((x): x is string => Boolean(x)));
  const hostelHeadIds = new Set(hostelHeads.map((h) => h.id));
  const isHostelDemand = (d: { id: string; linesJson: string }) => {
    if (hostelDemandIds.has(d.id)) return true;
    const lines = readJson<{ headId: string }[]>(d.linesJson, []);
    return lines.length > 0 && lines.every((l) => hostelHeadIds.has(l.headId));
  };
  let accounts = 0;
  let hostel = 0;
  let libraryOnLedger = 0;
  for (const d of demands) {
    const o = outstanding(d);
    if (fineDemands.has(d.id)) libraryOnLedger += o;
    else if (isHostelDemand(d)) hostel += o;
    else accounts += o;
  }
  const ledger = await ledgerFor(studentMembershipId).catch(() => null);
  const receivable = ledger?.totals.scholarshipReceivablePaise ?? 0;
  const counterFines = (member?.fines ?? []).filter((f) => !f.demandId).reduce((a, f) => a + f.paise, 0);
  const labOut = movements.reduce((a, m) => a + Math.max(0, -(m._sum.delta ?? 0)), 0);
  return {
    ACCOUNTS: { owed: Math.max(0, accounts - receivable), out: 0, present: true },
    LIBRARY: { owed: libraryOnLedger + counterFines, out: member?.issues.length ?? 0, present: true },
    HOSTEL: { owed: hostel, out: allotments.filter((a) => a.status === "ACTIVE").length, present: allotments.length > 0 },
    LAB: { owed: 0, out: labOut, present: movements.length > 0 },
  } satisfies Record<NoDuesDesk, { owed: number; out: number; present: boolean }>;
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
  const [live, cycleKey] = await Promise.all([liveState(m.schoolId, m.id, dueBy), cycleKeyFor(m.schoolId, event)]);
  const row = await db.noDuesClearance.findUnique({ where: { studentMembershipId_event_cycleKey: { studentMembershipId: m.id, event, cycleKey } }, select: { clearsJson: true, completedAt: true } });
  const clears = readJson<Partial<Record<NoDuesDesk, HandClear>>>(row?.clearsJson, {});
  const lines: NoDuesLine[] = DESKS_FOR[event]
    .filter((desk) => live[desk].present)
    .map((desk) => {
      const owed = live[desk].owed;
      // An exam form is not stopped by books or a bed; leaving is.
      const out = event === "EXAM_FORM" ? 0 : live[desk].out;
      const hand = clears[desk];
      const byHand = hand !== undefined && owed <= hand.owedAtClearPaise && out <= hand.itemsAtClear;
      return { desk, owedPaise: owed, itemsOut: out, cleared: (owed === 0 && out === 0) || byHand, clearedByUserId: byHand ? hand.clearedByUserId : null, clearedAt: byHand ? new Date(hand.clearedAt) : null };
    });
  return { studentMembershipId: m.id, event, lines, completed: lines.every((l) => l.cleared), completedAt: row?.completedAt ?? null };
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
  clears[input.desk] = { clearedByUserId: ctx.user.id, clearedAt: new Date().toISOString(), owedAtClearPaise: line.owedPaise, itemsAtClear: line.itemsOut, note: input.note?.trim().slice(0, 300) || null };
  await db.noDuesClearance.upsert({ where: { studentMembershipId_event_cycleKey: key }, create: { schoolId: ctx.schoolId!, ...key, clearsJson: writeJson(clears) }, update: { clearsJson: writeJson(clears) } });
  const after = await noDuesFor(s.id, input.event);
  if (after.completed && !after.completedAt) await db.noDuesClearance.update({ where: { studentMembershipId_event_cycleKey: key }, data: { completedAt: new Date() } });
  await audit({ schoolId: ctx.schoolId, actorUserId: ctx.user.id, action: "nodues.clear", targetType: "Membership", targetId: s.id, meta: { event: input.event, desk: input.desk, owedPaise: line.owedPaise, itemsOut: line.itemsOut } });
  return view(await noDuesFor(s.id, input.event), nameOf(s.user));
}

/** The desk's list: active students with an uncleared line for the event, the lines named. */
export async function noDuesList(ctx: ActiveContext, event: NoDuesEvent): Promise<{ items: { studentMembershipId: string; studentName: string; completed: boolean; uncleared: NoDuesDesk[] }[] }> {
  if (!ctx.schoolId || !ctx.role || !ANY_DESK.includes(ctx.role)) throw new AccessError("access.wrongRoleForThisAction");
  await assertCollege(ctx.schoolId);
  const students = await db.membership.findMany({ where: { schoolId: ctx.schoolId, role: "STUDENT", status: "ACTIVE", leftAt: null }, select: { id: true, user: { select: { name: true, preferredName: true } } }, take: 3000 });
  const items = [];
  // A single desk lists the students its own line holds up, and names only its own line (the role audit of 5 Oct 2026).
  const mine = (desk: NoDuesDesk) => FULL_READ.includes(ctx.role!) || DESK_ROLES[desk].includes(ctx.role!);
  for (const s of students) {
    const r = await noDuesFor(s.id, event);
    const uncleared = r.lines.filter((l) => !l.cleared && mine(l.desk)).map((l) => l.desk);
    if (!r.completed && uncleared.length > 0) items.push({ studentMembershipId: s.id, studentName: nameOf(s.user), completed: false, uncleared });
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
