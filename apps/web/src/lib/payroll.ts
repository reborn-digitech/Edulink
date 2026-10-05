import "server-only";
import { openPan, writePan } from "./pan";
import { createHash } from "node:crypto";
import {
  COMPONENT_KIND,
  PAYROLL_EXPORT_SLUG,
  type AdvanceStatus,
  type MyPayslips,
  type PaymentMode,
  type PayrollExportFile,
  type PayrollExportKind,
  type PayrollRunView,
  type PayrollSettings,
  type PayrollStatement,
  type PayrollSummary,
  type PayslipEdit,
  type PayslipLine,
  type PayslipView,
  type SalaryComponentCode,
  type SalaryFormula,
  type SalaryStructureSave,
  type SalaryStructureView,
  type StaffAdvanceView,
  type StaffSalarySave,
  type StaffSalaryView,
  type PtState,
} from "@edulink/contracts";
import { normaliseLocale, type Locale } from "@edulink/i18n";
import { db } from "./db";
import { AccessError } from "./access-error";
import { assertModuleOn } from "./modules";
import { audit } from "./audit";
import { notify } from "./notify";
import { open, seal, sealingAvailable } from "./secret-box";
import { readJson, readJsonArray } from "./json";
import { toCsv } from "./csv";
import { FILE_HEADINGS, rowOf, salaryNarration } from "./module-file-headings";
import { closedDayKeys, listHolidays } from "./holidays";
import { dateKeyInZone, isTeachingDay, parseTeachingDays } from "./dates";
import { SCHOOL_STAFF_ROLES } from "./staff-records";
import { RuleRefusal } from "./rule-refusal";
import {
  computeSlip,
  dayKeysOf,
  daysInMonthOf,
  financialYearOf,
  isStatutory,
  lopHalfDaysFor,
  monthlyGross,
  monthsOfFinancialYear,
  slipDigest,
  totalsOf,
  type ComponentInput,
  type DayFacts,
} from "./payroll-rules";
import type { ActiveContext } from "./session";
import type { Role } from "./constants";

/**
 * HR and payroll — the PAYROLL module (the owner's decision of 3 October
 * 2026), the ADMIN's to run.
 *
 * THE MONTH. `draftRun` makes (or draws afresh) a DRAFT run: everyone on the
 * staff roll with a salary in force that month gets a slip, its days paid
 * from the staff register and approved leave (payroll-rules.ts
 * `lopHalfDaysFor`: unpaid leave and unexcused absence lose pay), its
 * figures from the salary structure and the coded statutory rates. The
 * office reviews each slip (arrears, a month's TDS, its own loss-of-pay
 * figure, a note) and LOCKS the run; from then on nothing in it changes —
 * every write checks the status inside the run's row lock, and the lock
 * stores the SHA-256 of the slips, which data:audit recomputes. Staff are
 * told their slip is ready and read it (and its PDF) on their own account.
 *
 * MONEY NEVER MOVES (decision 0003). The bank advice is a file the school
 * uploads to its own bank; the ECR and the ESI file go to the portals by
 * the school's own hand. The bank account and the PAN are sealed
 * (secret-box) and opened only into those files — each cut audited, the
 * numbers never in an answer, a page or the log.
 *
 * WHO. The admin writes everything. The head reads the summary (cost by
 * month and department, headcount) and a run's totals, and a run's slips
 * only once the admin has shared that run. Every member of staff reads their
 * own slips, statement and structure — never anyone else's.
 */

type Office = ActiveContext & { schoolId: string; membershipId: string; role: Role };
type Tx = typeof db;

/** The office, and at a college the accounts desk: who writes here. */
const keeps = (role: string | null) => role === "ADMIN" || role === "ACCOUNTS";

async function office(ctx: ActiveContext, write: boolean): Promise<Office> {
  // At a college the ACCOUNTS desk keeps this with the office (4 Oct 2026); the principal reads.
  const roles: Role[] = write ? ["ADMIN", "ACCOUNTS"] : ["ADMIN", "PRINCIPAL", "ACCOUNTS"];
  if (!ctx.schoolId || !ctx.membershipId || !ctx.role || !roles.includes(ctx.role)) throw new AccessError("access.wrongRoleForThisAction");
  await assertModuleOn(ctx.schoolId, "PAYROLL");
  return ctx as Office;
}

async function staffMember(ctx: ActiveContext): Promise<Office> {
  if (!ctx.schoolId || !ctx.membershipId || !ctx.role || !(SCHOOL_STAFF_ROLES as readonly string[]).includes(ctx.role)) throw new AccessError("access.wrongRoleForThisAction");
  await assertModuleOn(ctx.schoolId, "PAYROLL");
  return ctx as Office;
}

const MONTH = /^\d{4}-(0[1-9]|1[0-2])$/;
function assertMonth(month: string): void {
  if (!MONTH.test(month)) throw new RuleRefusal("payroll.refuseMonth", 422, undefined, "month");
}
const nameOf = (u: { name: string; preferredName: string | null }) => u.preferredName ?? u.name;
const bankBound = (schoolId: string, membershipId: string) => `payroll:${schoolId}:${membershipId}:bank`;

/* --------------------------------------------------------------- settings */

const DEFAULT_SETTINGS: PayrollSettings = { pfEnabled: true, pfOnFullBasic: false, esiEnabled: true, ptState: "MH", employerName: "", pfEstablishmentCode: "", esiEmployerCode: "" };

export async function settingsOf(schoolId: string): Promise<PayrollSettings> {
  const row = await db.payrollSettings.findUnique({ where: { schoolId } });
  if (!row) return { ...DEFAULT_SETTINGS };
  return { pfEnabled: row.pfEnabled, pfOnFullBasic: row.pfOnFullBasic, esiEnabled: row.esiEnabled, ptState: row.ptState as PtState, employerName: row.employerName, pfEstablishmentCode: row.pfEstablishmentCode, esiEmployerCode: row.esiEmployerCode };
}

export async function savePayrollSettings(ctx: ActiveContext, input: PayrollSettings): Promise<PayrollSettings> {
  const caller = await office(ctx, true);
  await db.payrollSettings.upsert({ where: { schoolId: caller.schoolId }, create: { schoolId: caller.schoolId, ...input, updatedByUserId: caller.user.id }, update: { ...input, updatedByUserId: caller.user.id } });
  await audit({ schoolId: caller.schoolId, actorUserId: caller.user.id, action: "payroll.settings", targetType: "School", targetId: caller.schoolId, meta: { pf: input.pfEnabled, pfFull: input.pfOnFullBasic, esi: input.esiEnabled, pt: input.ptState } });
  return settingsOf(caller.schoolId);
}

/* ------------------------------------------------------------- structures */

type StructureRow = { id: string; name: string; archivedAt: Date | null; components: { code: string; label: string; kind: string; formula: string; value: number; statutory: boolean; position: number }[]; _count: { salaries: number } };
const STRUCTURE_SELECT = { id: true, name: true, archivedAt: true, components: { orderBy: { position: "asc" as const }, select: { code: true, label: true, kind: true, formula: true, value: true, statutory: true, position: true } }, _count: { select: { salaries: true } } } as const;

function structureView(r: StructureRow): SalaryStructureView {
  return {
    id: r.id,
    name: r.name,
    components: r.components.map((c) => ({ code: c.code as SalaryComponentCode, label: c.label, kind: c.kind as SalaryStructureView["components"][number]["kind"], formula: c.formula as SalaryFormula, value: c.value, statutory: c.statutory })),
    staffCount: r._count.salaries,
    archived: Boolean(r.archivedAt),
  };
}

export async function listStructures(ctx: ActiveContext): Promise<{ structures: SalaryStructureView[]; canEdit: boolean }> {
  const caller = await office(ctx, false);
  const rows = await db.salaryStructure.findMany({ where: { schoolId: caller.schoolId }, orderBy: [{ archivedAt: "asc" }, { name: "asc" }], select: STRUCTURE_SELECT });
  return { structures: rows.map(structureView), canEdit: keeps(caller.role) };
}

/**
 * A structure whole. Each code once, BASIC among them; an earning's formula
 * is FIXED or a share of basic (a share of the gross it is part of has no
 * answer); the statutory codes, BASIC and ADVANCE take no value of their own.
 */
export async function saveStructure(ctx: ActiveContext, input: SalaryStructureSave): Promise<SalaryStructureView> {
  const caller = await office(ctx, true);
  const codes = input.components.map((c) => c.code);
  if (new Set(codes).size !== codes.length) throw new RuleRefusal("payroll.refuseDuplicateCode", 422, undefined, "components");
  if (!codes.includes("BASIC")) throw new RuleRefusal("payroll.refuseNoBasic", 422, undefined, "components");
  for (const c of input.components) {
    if (COMPONENT_KIND[c.code] === "EARNING" && c.formula === "PERCENT_OF_GROSS") throw new RuleRefusal("payroll.refuseEarningOfGross", 422, { code: c.code }, "components");
    if (c.formula !== "FIXED" && c.value > 10_000 && !isStatutory(c.code)) throw new RuleRefusal("payroll.refusePercent", 422, { code: c.code }, "components");
  }
  const clash = await db.salaryStructure.findFirst({ where: { schoolId: caller.schoolId, name: input.name, ...(input.id ? { id: { not: input.id } } : {}) }, select: { id: true } });
  if (clash) throw new RuleRefusal("payroll.refuseStructureTaken", 409, undefined, "name");
  const rows = input.components.map((c, i) => {
    const fixedOnly = c.code === "BASIC" || c.code === "ADVANCE" || isStatutory(c.code);
    return { schoolId: caller.schoolId, code: c.code, label: c.label, kind: COMPONENT_KIND[c.code], formula: fixedOnly ? "FIXED" : c.formula, value: fixedOnly ? 0 : c.value, statutory: isStatutory(c.code), position: i };
  });
  const id = await db.$tenantTransaction(async (raw) => {
    const tx = raw as Tx;
    let structureId = input.id;
    if (structureId) {
      const found = await tx.salaryStructure.findFirst({ where: { id: structureId, schoolId: caller.schoolId }, select: { id: true } });
      if (!found) throw new AccessError("access.entryNotFound", "NOT_FOUND");
      await tx.salaryStructure.update({ where: { id: structureId }, data: { name: input.name, ...(input.archived === undefined ? {} : { archivedAt: input.archived ? new Date() : null }) } });
      await tx.salaryComponent.deleteMany({ where: { structureId } });
    } else {
      structureId = (await tx.salaryStructure.create({ data: { schoolId: caller.schoolId, name: input.name }, select: { id: true } })).id;
    }
    await tx.salaryComponent.createMany({ data: rows.map((r) => ({ ...r, structureId: structureId! })) });
    return structureId;
  });
  await audit({ schoolId: caller.schoolId, actorUserId: caller.user.id, action: "payroll.structure.save", targetType: "SalaryStructure", targetId: id, meta: { created: !input.id, codes } });
  return structureView(await db.salaryStructure.findUniqueOrThrow({ where: { id }, select: STRUCTURE_SELECT }));
}

/* --------------------------------------------------------------- salaries */

const SALARY_SELECT = { id: true, membershipId: true, structureId: true, effectiveFromKey: true, basicPaise: true, overridesJson: true, pfUan: true, esiNumber: true, panSealed: true, panLast4: true, bankAccountSealed: true, bankLast4: true, bankIfsc: true, bankName: true, paymentMode: true, structure: { select: { name: true, components: { orderBy: { position: "asc" as const }, select: { code: true, label: true, formula: true, value: true } } } } } as const;
type SalaryRow = { id: string; membershipId: string; structureId: string; effectiveFromKey: string; basicPaise: number; overridesJson: string; pfUan: string | null; esiNumber: string | null; panSealed: string | null; panLast4: string | null; bankAccountSealed: string | null; bankLast4: string | null; bankIfsc: string | null; bankName: string | null; paymentMode: string; structure: { name: string; components: { code: string; label: string; formula: string; value: number }[] } };

const componentsOf = (s: SalaryRow): ComponentInput[] => s.structure.components.map((c) => ({ code: c.code as SalaryComponentCode, label: c.label, formula: c.formula as SalaryFormula, value: c.value }));
const overridesOf = (s: SalaryRow) => readJson<Partial<Record<SalaryComponentCode, number>>>(s.overridesJson, {});

/** The salary in force on the month's last day for each person: a revision dated inside the month pays the month. */
async function salariesFor(schoolId: string, membershipIds: string[], month: string): Promise<Map<string, SalaryRow>> {
  if (!membershipIds.length) return new Map();
  const last = `${month}-${String(daysInMonthOf(month)).padStart(2, "0")}`;
  const rows = await db.staffSalary.findMany({ where: { schoolId, membershipId: { in: membershipIds }, effectiveFromKey: { lte: last } }, orderBy: { effectiveFromKey: "desc" }, select: SALARY_SELECT });
  const out = new Map<string, SalaryRow>();
  for (const r of rows) if (!out.has(r.membershipId)) out.set(r.membershipId, r);
  return out;
}

/** The staff roll for a month: on the roll at some point in it. Today's roll when no month is given. */
async function rollFor(schoolId: string, monthStart?: Date) {
  return db.membership.findMany({
    where: { schoolId, role: { in: [...SCHOOL_STAFF_ROLES] }, status: "ACTIVE", ...(monthStart ? { OR: [{ leftAt: null }, { leftAt: { gte: monthStart } }] } : { leftAt: null }) },
    select: { id: true, role: true, leftAt: true, user: { select: { name: true, preferredName: true } }, staffRecord: { select: { designation: true, gender: true, joinedOn: true } } },
    orderBy: [{ user: { name: "asc" } }],
  });
}

function salaryView(s: SalaryRow | undefined): StaffSalaryView["salary"] {
  if (!s) return null;
  return {
    structureId: s.structureId,
    structureName: s.structure.name,
    effectiveFrom: s.effectiveFromKey,
    basicPaise: s.basicPaise,
    overrides: overridesOf(s) as Record<string, number>,
    pfUan: s.pfUan,
    esiNumber: s.esiNumber,
    panLast4: s.panLast4,
    bankLast4: s.bankLast4,
    bankIfsc: s.bankIfsc,
    bankName: s.bankName,
    paymentMode: s.paymentMode as PaymentMode,
    monthlyGrossPaise: monthlyGross(s.basicPaise, componentsOf(s), overridesOf(s)),
  };
}

export async function listSalaries(ctx: ActiveContext): Promise<{ staff: StaffSalaryView[]; structures: { id: string; name: string }[]; sealingAvailable: boolean; canEdit: boolean }> {
  const caller = await office(ctx, true);
  const tz = await zoneOf(caller.schoolId);
  const thisMonth = dateKeyInZone(new Date(), tz).slice(0, 7);
  const [roll, structures] = await Promise.all([rollFor(caller.schoolId), db.salaryStructure.findMany({ where: { schoolId: caller.schoolId, archivedAt: null }, orderBy: { name: "asc" }, select: { id: true, name: true } })]);
  // The salary in force today, or the next one when the first starts later.
  const now = await salariesFor(caller.schoolId, roll.map((r) => r.id), "9999-12");
  const current = await salariesFor(caller.schoolId, roll.map((r) => r.id), thisMonth);
  return {
    staff: roll.map((m) => ({ membershipId: m.id, name: nameOf(m.user), role: m.role, designation: m.staffRecord?.designation ?? null, salary: salaryView(current.get(m.id) ?? now.get(m.id)) })),
    structures,
    sealingAvailable: sealingAvailable(),
    canEdit: true,
  };
}

/**
 * One person's salary from a date: a new revision, or the same date
 * rewritten. A blank PAN or account keeps the sealed one already held (the
 * office never sees it again to type it back); the numbers are sealed
 * before they reach the row, and only their last four are kept beside.
 */
export async function saveSalary(ctx: ActiveContext, input: StaffSalarySave): Promise<StaffSalaryView> {
  const caller = await office(ctx, true);
  const member = await db.membership.findFirst({ where: { id: input.membershipId, schoolId: caller.schoolId, role: { in: [...SCHOOL_STAFF_ROLES] }, status: "ACTIVE" }, select: { id: true, role: true, user: { select: { name: true, preferredName: true } }, staffRecord: { select: { designation: true } } } });
  if (!member) throw new RuleRefusal("payroll.refuseNotStaff", 422, undefined, "membershipId");
  const structure = await db.salaryStructure.findFirst({ where: { id: input.structureId, schoolId: caller.schoolId, archivedAt: null }, select: { id: true } });
  if (!structure) throw new RuleRefusal("payroll.refuseUnknownStructure", 422, undefined, "structureId");
  if ((input.pan || input.bankAccount) && !sealingAvailable()) throw new RuleRefusal("payroll.refuseNoSealing", 409);
  if (input.paymentMode === "BANK" && input.bankAccount && !input.bankIfsc) throw new RuleRefusal("payroll.refuseNoIfsc", 422, undefined, "bankIfsc");
  // What the latest revision holds sealed, carried into a new one when the form left it blank.
  const previous = await db.staffSalary.findFirst({ where: { membershipId: member.id }, orderBy: { effectiveFromKey: "desc" }, select: { panSealed: true, panLast4: true, bankAccountSealed: true, bankLast4: true, bankIfsc: true, bankName: true } });
  // A new PAN is written below by the one writer (G4-14), to every revision and the faculty record; a blank keeps the held copy.
  const pan = { panSealed: previous?.panSealed ?? null, panLast4: previous?.panLast4 ?? null };
  const bank = input.bankAccount ? { bankAccountSealed: seal(input.bankAccount, bankBound(caller.schoolId, member.id)), bankLast4: input.bankAccount.slice(-4) } : { bankAccountSealed: previous?.bankAccountSealed ?? null, bankLast4: previous?.bankLast4 ?? null };
  const data = {
    structureId: structure.id,
    basicPaise: input.basicPaise,
    overridesJson: JSON.stringify(input.overrides ?? {}),
    pfUan: input.pfUan || null,
    esiNumber: input.esiNumber || null,
    ...pan,
    ...bank,
    bankIfsc: input.bankIfsc || previous?.bankIfsc || null,
    bankName: input.bankName || previous?.bankName || null,
    paymentMode: input.paymentMode,
    updatedByUserId: caller.user.id,
  };
  let row = await db.staffSalary.upsert({ where: { membershipId_effectiveFromKey: { membershipId: member.id, effectiveFromKey: input.effectiveFrom } }, create: { schoolId: caller.schoolId, membershipId: member.id, effectiveFromKey: input.effectiveFrom, ...data }, update: data, select: SALARY_SELECT });
  if (input.pan) {
    await writePan({ kind: "STAFF", schoolId: caller.schoolId, membershipId: member.id }, input.pan);
    row = await db.staffSalary.findUniqueOrThrow({ where: { id: row.id }, select: SALARY_SELECT });
  }
  // What changed, never the numbers: the log is read by the whole office.
  await audit({ schoolId: caller.schoolId, actorUserId: caller.user.id, action: "payroll.salary.save", targetType: "Membership", targetId: member.id, meta: { effectiveFrom: input.effectiveFrom, structureId: structure.id, panChanged: Boolean(input.pan), bankChanged: Boolean(input.bankAccount), mode: input.paymentMode } });
  return { membershipId: member.id, name: nameOf(member.user), role: member.role, designation: member.staffRecord?.designation ?? null, salary: salaryView(row) };
}

/* -------------------------------------------------------------- the run */

async function zoneOf(schoolId: string): Promise<string> {
  const s = await db.school.findUnique({ where: { id: schoolId }, select: { timezone: true } });
  return s?.timezone ?? "Asia/Kolkata";
}

/** What a recorded advance has had back: the ADVANCE lines of LOCKED runs that name it. Read, never stored. */
async function recoveredByAdvance(schoolId: string, membershipIds: string[]): Promise<Map<string, number>> {
  const out = new Map<string, number>();
  if (!membershipIds.length) return out;
  const slips = await db.payslip.findMany({ where: { schoolId, membershipId: { in: membershipIds }, run: { status: "LOCKED" } }, select: { linesJson: true } });
  for (const s of slips) for (const l of readJsonArray<PayslipLine>(s.linesJson)) if (l.code === "ADVANCE" && l.advanceId) out.set(l.advanceId, (out.get(l.advanceId) ?? 0) + l.paise);
  return out;
}

type DraftPerson = { membershipId: string; name: string; department: string; designation: string | null; gender: string | null; salary: SalaryRow; lopHalfDays: number };

/** Each person's loss of pay for the month, from the register, approved leave, the calendar and the days they were on the roll. */
async function lossOfPay(schoolId: string, month: string, people: { id: string; leftAt: Date | null; joinedOn: Date | null }[], tz: string): Promise<Map<string, number>> {
  const days = dayKeysOf(month);
  const from = days[0]!;
  const to = days[days.length - 1]!;
  const ids = people.map((p) => p.id);
  const [school, spans, marks, leave] = await Promise.all([
    db.school.findUnique({ where: { id: schoolId }, select: { teachingDays: true } }),
    listHolidays(schoolId, { fromKey: from, toKey: to }),
    db.staffAttendance.findMany({ where: { schoolId, membershipId: { in: ids }, dateKey: { gte: from, lte: to } }, select: { membershipId: true, dateKey: true, status: true } }),
    db.leaveRequest.findMany({ where: { schoolId, teacherMembershipId: { in: ids }, status: "APPROVED", fromDateKey: { lte: to }, toDateKey: { gte: from } }, select: { teacherMembershipId: true, kind: true, fromDateKey: true, toDateKey: true } }),
  ]);
  const week = parseTeachingDays(school?.teachingDays);
  const closed = closedDayKeys(spans);
  const status = new Map(marks.map((m) => [`${m.membershipId}|${m.dateKey}`, m.status as DayFacts["status"]]));
  const leaveOn = new Map<string, string>();
  for (const l of leave) for (const d of days) if (d >= l.fromDateKey && d <= l.toDateKey) {
    const k = `${l.teacherMembershipId}|${d}`;
    // Two approvals on one day: unpaid wins only if it is all there is.
    if (!leaveOn.has(k) || leaveOn.get(k) === "UNPAID") leaveOn.set(k, l.kind);
  }
  const out = new Map<string, number>();
  for (const p of people) {
    const joined = p.joinedOn ? p.joinedOn.toISOString().slice(0, 10) : null;
    const left = p.leftAt ? dateKeyInZone(p.leftAt, tz) : null;
    out.set(
      p.id,
      lopHalfDaysFor(
        days.map((d) => ({
          employed: (!joined || d >= joined) && (!left || d <= left),
          working: isTeachingDay(d, week) && !closed.has(d),
          status: status.get(`${p.id}|${d}`) ?? null,
          leaveKind: leaveOn.get(`${p.id}|${d}`) ?? null,
        })),
      ),
    );
  }
  return out;
}

type SlipCarry = { arrearsPaise: number; tdsOverridePaise: number | null; lopOverrideHalfDays: number | null; notes: string };

/** The figures of one slip from its person, the month and what the office set by hand. */
function figuresFor(p: DraftPerson, month: string, settings: PayrollSettings, carry: SlipCarry, advances: { id: string; instalmentPaise: number }[]) {
  const lop = carry.lopOverrideHalfDays ?? p.lopHalfDays;
  return computeSlip({
    month,
    daysInMonth: daysInMonthOf(month),
    lopHalfDays: lop,
    basicPaise: p.salary.basicPaise,
    components: componentsOf(p.salary),
    overrides: overridesOf(p.salary),
    settings,
    gender: p.gender,
    arrearsPaise: carry.arrearsPaise,
    tdsOverridePaise: carry.tdsOverridePaise,
    advances,
  });
}

/** Advances each person still owes, and this month's instalment of each, oldest first. */
async function instalmentsFor(schoolId: string, membershipIds: string[], month: string): Promise<Map<string, { id: string; instalmentPaise: number }[]>> {
  const last = new Date(`${month}-${String(daysInMonthOf(month)).padStart(2, "0")}T23:59:59Z`);
  const [advances, recovered] = await Promise.all([
    db.staffAdvance.findMany({ where: { schoolId, membershipId: { in: membershipIds }, status: "RECORDED", decidedAt: { lte: last } }, orderBy: { decidedAt: "asc" }, select: { id: true, membershipId: true, amountPaise: true, monthlyRecoveryPaise: true } }),
    recoveredByAdvance(schoolId, membershipIds),
  ]);
  const out = new Map<string, { id: string; instalmentPaise: number }[]>();
  for (const a of advances) {
    const owed = a.amountPaise - (recovered.get(a.id) ?? 0);
    if (owed <= 0) continue;
    const list = out.get(a.membershipId) ?? [];
    list.push({ id: a.id, instalmentPaise: Math.min(a.monthlyRecoveryPaise ?? owed, owed) });
    out.set(a.membershipId, list);
  }
  return out;
}

async function lockRunRow(tx: Tx, schoolId: string, month: string): Promise<{ id: string; status: string } | null> {
  const [row] = await tx.$queryRaw<{ id: string; status: string }[]>`SELECT "id", "status" FROM "PayrollRun" WHERE "schoolId" = ${schoolId} AND "month" = ${month} FOR UPDATE`;
  return row ?? null;
}

async function writeTotals(tx: Tx, runId: string): Promise<void> {
  const slips = await tx.payslip.findMany({ where: { runId }, select: { grossPaise: true, deductionsPaise: true, employerPaise: true, netPaise: true } });
  const sum = (k: "grossPaise" | "deductionsPaise" | "employerPaise" | "netPaise") => slips.reduce((a, s) => a + s[k], 0);
  await tx.payrollRun.update({ where: { id: runId }, data: { headcount: slips.length, grossPaise: sum("grossPaise"), deductionsPaise: sum("deductionsPaise"), employerPaise: sum("employerPaise"), netPaise: sum("netPaise") } });
}

/**
 * Makes the month's DRAFT run, or draws an existing DRAFT afresh from the
 * register, the leave and today's salaries — keeping what the office set by
 * hand on each slip. A LOCKED month is refused; a month that has not begun
 * is refused too (there is no register to read).
 */
export async function draftRun(ctx: ActiveContext, month: string): Promise<PayrollRunView> {
  const caller = await office(ctx, true);
  assertMonth(month);
  const tz = await zoneOf(caller.schoolId);
  if (month > dateKeyInZone(new Date(), tz).slice(0, 7)) throw new RuleRefusal("payroll.refuseFutureMonth", 422, undefined, "month");
  const settings = await settingsOf(caller.schoolId);
  const monthStart = new Date(`${month}-01T00:00:00Z`);
  const roll = await rollFor(caller.schoolId, monthStart);
  const salaries = await salariesFor(caller.schoolId, roll.map((r) => r.id), month);
  const paid = roll.filter((m) => salaries.has(m.id));
  const [lop, instalments] = await Promise.all([
    lossOfPay(caller.schoolId, month, paid.map((m) => ({ id: m.id, leftAt: m.leftAt, joinedOn: m.staffRecord?.joinedOn ?? null })), tz),
    instalmentsFor(caller.schoolId, paid.map((m) => m.id), month),
  ]);
  const people: DraftPerson[] = paid.map((m) => ({ membershipId: m.id, name: nameOf(m.user), department: m.role, designation: m.staffRecord?.designation ?? null, gender: m.staffRecord?.gender ?? null, salary: salaries.get(m.id)!, lopHalfDays: lop.get(m.id) ?? 0 }));
  await db.$tenantTransaction(
    async (raw) => {
      const tx = raw as Tx;
      await tx.payrollRun.upsert({ where: { schoolId_month: { schoolId: caller.schoolId, month } }, create: { schoolId: caller.schoolId, month, createdByUserId: caller.user.id }, update: {}, select: { id: true } });
      const run = (await lockRunRow(tx, caller.schoolId, month))!;
      if (run.status === "LOCKED") throw new RuleRefusal("payroll.refuseLocked", 409, { month });
      const existing = await tx.payslip.findMany({ where: { runId: run.id }, select: { membershipId: true, arrearsPaise: true, tdsOverridePaise: true, lopOverrideHalfDays: true, notes: true } });
      const carry = new Map(existing.map((e) => [e.membershipId, e]));
      const keep = new Set(people.map((p) => p.membershipId));
      await tx.payslip.deleteMany({ where: { runId: run.id, membershipId: { notIn: [...keep] } } });
      for (const p of people) {
        const c: SlipCarry = carry.get(p.membershipId) ?? { arrearsPaise: 0, tdsOverridePaise: null, lopOverrideHalfDays: null, notes: "" };
        const f = figuresFor(p, month, settings, c, instalments.get(p.membershipId) ?? []);
        const data = {
          staffName: p.name,
          department: p.department,
          designation: p.designation,
          daysInMonth: daysInMonthOf(month),
          lopHalfDays: p.lopHalfDays,
          linesJson: JSON.stringify(f.lines),
          grossPaise: f.grossPaise,
          deductionsPaise: f.deductionsPaise,
          employerPaise: f.employerPaise,
          netPaise: f.netPaise,
          paymentMode: p.salary.paymentMode,
          bankLast4: p.salary.bankLast4,
        };
        await tx.payslip.upsert({ where: { runId_membershipId: { runId: run.id, membershipId: p.membershipId } }, create: { schoolId: caller.schoolId, runId: run.id, membershipId: p.membershipId, ...data }, update: data });
      }
      await writeTotals(tx, run.id);
    },
    { timeout: 30_000 },
  );
  await audit({ schoolId: caller.schoolId, actorUserId: caller.user.id, action: "payroll.run.draft", targetType: "PayrollRun", targetId: month, meta: { month, slips: people.length, missingSalary: roll.length - people.length } });
  return runView(ctx, month);
}

const SLIP_SELECT = { membershipId: true, staffName: true, department: true, designation: true, daysInMonth: true, lopHalfDays: true, lopOverrideHalfDays: true, linesJson: true, grossPaise: true, deductionsPaise: true, employerPaise: true, netPaise: true, arrearsPaise: true, tdsOverridePaise: true, notes: true, paymentMode: true, bankLast4: true } as const;
type SlipRow = { membershipId: string; staffName: string; department: string; designation: string | null; daysInMonth: number; lopHalfDays: number; lopOverrideHalfDays: number | null; linesJson: string; grossPaise: number; deductionsPaise: number; employerPaise: number; netPaise: number; arrearsPaise: number; tdsOverridePaise: number | null; notes: string; paymentMode: string; bankLast4: string | null };

function slipView(s: SlipRow, salary: SalaryRow | undefined): PayslipView {
  const lines = readJsonArray<PayslipLine>(s.linesJson);
  const lop = s.lopOverrideHalfDays ?? s.lopHalfDays;
  const warnings: string[] = [];
  if (s.netPaise < 0) warnings.push("NEGATIVE_NET");
  if (s.paymentMode === "BANK" && !(salary?.bankAccountSealed && salary.bankIfsc)) warnings.push("NO_BANK");
  if (lines.some((l) => l.code === "PF_EMPLOYEE") && !salary?.pfUan) warnings.push("NO_UAN");
  if (lines.some((l) => l.code === "ESI_EMPLOYEE") && !salary?.esiNumber) warnings.push("NO_ESI_NUMBER");
  return {
    membershipId: s.membershipId,
    name: s.staffName,
    department: s.department,
    designation: s.designation,
    daysInMonth: s.daysInMonth,
    lopDays: lop / 2,
    paidDays: (2 * s.daysInMonth - lop) / 2,
    lines,
    grossPaise: s.grossPaise,
    deductionsPaise: s.deductionsPaise,
    employerPaise: s.employerPaise,
    netPaise: s.netPaise,
    arrearsPaise: s.arrearsPaise,
    tdsOverridePaise: s.tdsOverridePaise,
    lopOverrideDays: s.lopOverrideHalfDays === null ? null : s.lopOverrideHalfDays / 2,
    notes: s.notes,
    paymentMode: s.paymentMode as PaymentMode,
    bankLast4: s.bankLast4,
    warnings,
  };
}

async function runRow(schoolId: string, month: string) {
  return db.payrollRun.findUnique({ where: { schoolId_month: { schoolId, month } }, select: { id: true, month: true, status: true, createdAt: true, lockedAt: true, lockedByUserId: true, sharedWithPrincipal: true, headcount: true, grossPaise: true, deductionsPaise: true, employerPaise: true, netPaise: true } });
}

export async function runView(ctx: ActiveContext, month: string): Promise<PayrollRunView> {
  const caller = await office(ctx, false);
  assertMonth(month);
  const run = await runRow(caller.schoolId, month);
  if (!run) throw new AccessError("access.entryNotFound", "NOT_FOUND");
  const mayReadSlips = keeps(caller.role) || run.sharedWithPrincipal;
  const monthStart = new Date(`${month}-01T00:00:00Z`);
  const [slips, exports, lockedBy, roll] = await Promise.all([
    mayReadSlips ? db.payslip.findMany({ where: { runId: run.id }, orderBy: { staffName: "asc" }, select: SLIP_SELECT }) : Promise.resolve([] as SlipRow[]),
    db.payrollExport.findMany({ where: { runId: run.id }, orderBy: { createdAt: "desc" }, take: 50, select: { kind: true, fileName: true, rows: true, totalPaise: true, createdAt: true, createdByUserId: true } }),
    run.lockedByUserId ? db.user.findUnique({ where: { id: run.lockedByUserId }, select: { name: true, preferredName: true } }) : Promise.resolve(null),
    keeps(caller.role) ? rollFor(caller.schoolId, monthStart) : Promise.resolve([]),
  ]);
  const salaries = mayReadSlips ? await salariesFor(caller.schoolId, slips.map((s) => s.membershipId), month) : new Map<string, SalaryRow>();
  const exporters = new Map((await db.user.findMany({ where: { id: { in: [...new Set(exports.map((e) => e.createdByUserId).filter((x): x is string => Boolean(x)))] } }, select: { id: true, name: true, preferredName: true } })).map((u) => [u.id, nameOf(u)]));
  const inRun = new Set(slips.map((s) => s.membershipId));
  const withSalary = keeps(caller.role) ? await salariesFor(caller.schoolId, roll.map((r) => r.id), month) : new Map<string, SalaryRow>();
  return {
    month: run.month,
    status: run.status as PayrollRunView["status"],
    createdAt: run.createdAt.toISOString(),
    lockedAt: run.lockedAt?.toISOString() ?? null,
    lockedByName: lockedBy ? nameOf(lockedBy) : null,
    sharedWithPrincipal: run.sharedWithPrincipal,
    totals: { headcount: run.headcount, grossPaise: run.grossPaise, deductionsPaise: run.deductionsPaise, employerPaise: run.employerPaise, netPaise: run.netPaise },
    slips: mayReadSlips ? slips.map((s) => slipView(s, salaries.get(s.membershipId))) : null,
    exports: exports.map((e) => ({ kind: e.kind as PayrollExportKind, fileName: e.fileName, rows: e.rows, totalPaise: e.totalPaise, createdAt: e.createdAt.toISOString(), byName: e.createdByUserId ? (exporters.get(e.createdByUserId) ?? "") : "" })),
    missingSalary: keeps(caller.role) && run.status === "DRAFT" ? roll.filter((r) => !withSalary.has(r.id) && !inRun.has(r.id)).map((r) => ({ membershipId: r.id, name: nameOf(r.user) })) : [],
    canEdit: keeps(caller.role) && run.status === "DRAFT",
  };
}

/** The office's review of one slip in a DRAFT run: the figures are worked out again with what it set. */
export async function editSlip(ctx: ActiveContext, month: string, membershipId: string, edit: PayslipEdit): Promise<PayslipView> {
  const caller = await office(ctx, true);
  assertMonth(month);
  const settings = await settingsOf(caller.schoolId);
  const tz = await zoneOf(caller.schoolId);
  const member = await db.membership.findFirst({ where: { id: membershipId, schoolId: caller.schoolId }, select: { id: true, role: true, leftAt: true, user: { select: { name: true, preferredName: true } }, staffRecord: { select: { designation: true, gender: true, joinedOn: true } } } });
  if (!member) throw new AccessError("access.entryNotFound", "NOT_FOUND");
  const salary = (await salariesFor(caller.schoolId, [member.id], month)).get(member.id);
  if (!salary) throw new RuleRefusal("payroll.refuseNoSalary", 409);
  if (edit.lopOverrideDays !== undefined && edit.lopOverrideDays !== null && edit.lopOverrideDays > daysInMonthOf(month)) throw new RuleRefusal("payroll.refuseLopDays", 422, undefined, "lopOverrideDays");
  const [lop, instalments] = await Promise.all([lossOfPay(caller.schoolId, month, [{ id: member.id, leftAt: member.leftAt, joinedOn: member.staffRecord?.joinedOn ?? null }], tz), instalmentsFor(caller.schoolId, [member.id], month)]);
  await db.$tenantTransaction(async (raw) => {
    const tx = raw as Tx;
    const run = await lockRunRow(tx, caller.schoolId, month);
    if (!run) throw new AccessError("access.entryNotFound", "NOT_FOUND");
    if (run.status === "LOCKED") throw new RuleRefusal("payroll.refuseLocked", 409, { month });
    const slip = await tx.payslip.findUnique({ where: { runId_membershipId: { runId: run.id, membershipId } }, select: { arrearsPaise: true, tdsOverridePaise: true, lopOverrideHalfDays: true, notes: true } });
    if (!slip) throw new AccessError("access.entryNotFound", "NOT_FOUND");
    const carry: SlipCarry = {
      arrearsPaise: edit.arrearsPaise ?? slip.arrearsPaise,
      tdsOverridePaise: edit.tdsOverridePaise === undefined ? slip.tdsOverridePaise : edit.tdsOverridePaise,
      lopOverrideHalfDays: edit.lopOverrideDays === undefined ? slip.lopOverrideHalfDays : edit.lopOverrideDays === null ? null : Math.round(edit.lopOverrideDays * 2),
      notes: edit.notes ?? slip.notes,
    };
    const person: DraftPerson = { membershipId: member.id, name: nameOf(member.user), department: member.role, designation: member.staffRecord?.designation ?? null, gender: member.staffRecord?.gender ?? null, salary, lopHalfDays: lop.get(member.id) ?? 0 };
    const f = figuresFor(person, month, settings, carry, instalments.get(member.id) ?? []);
    await tx.payslip.update({
      where: { runId_membershipId: { runId: run.id, membershipId } },
      data: { ...carry, lopHalfDays: person.lopHalfDays, linesJson: JSON.stringify(f.lines), grossPaise: f.grossPaise, deductionsPaise: f.deductionsPaise, employerPaise: f.employerPaise, netPaise: f.netPaise },
    });
    await writeTotals(tx, run.id);
  });
  await audit({ schoolId: caller.schoolId, actorUserId: caller.user.id, action: "payroll.slip.edit", targetType: "Membership", targetId: membershipId, meta: { month, fields: Object.keys(edit) } });
  const row = await db.payslip.findFirstOrThrow({ where: { membershipId, run: { schoolId: caller.schoolId, month } }, select: SLIP_SELECT });
  return slipView(row, salary);
}

/**
 * Locks the run. Refused while a slip's net is below nothing; afterwards
 * every write to the run or its slips is refused, the lock's digest is
 * stored, and each person is told their slip is ready.
 */
export async function lockRun(ctx: ActiveContext, month: string): Promise<PayrollRunView> {
  const caller = await office(ctx, true);
  assertMonth(month);
  const people = await db.$tenantTransaction(async (raw) => {
    const tx = raw as Tx;
    const run = await lockRunRow(tx, caller.schoolId, month);
    if (!run) throw new AccessError("access.entryNotFound", "NOT_FOUND");
    if (run.status === "LOCKED") throw new RuleRefusal("payroll.refuseLocked", 409, { month });
    const slips = await tx.payslip.findMany({ where: { runId: run.id }, select: { ...SLIP_SELECT, membership: { select: { userId: true } } } });
    if (!slips.length) throw new RuleRefusal("payroll.refuseEmptyRun", 409);
    const negative = slips.find((s) => s.netPaise < 0);
    if (negative) throw new RuleRefusal("payroll.refuseNegativeNet", 409, { name: negative.staffName });
    await writeTotals(tx, run.id);
    await tx.payrollRun.update({ where: { id: run.id }, data: { status: "LOCKED", lockedAt: new Date(), lockedByUserId: caller.user.id, lockDigest: slipDigest(slips) } });
    return slips.map((s) => s.membership.userId);
  });
  await audit({ schoolId: caller.schoolId, actorUserId: caller.user.id, action: "payroll.run.lock", targetType: "PayrollRun", targetId: month, meta: { month, slips: people.length } });
  const [y, m] = month.split("-");
  for (const userId of people) {
    await notify({ userId, schoolId: caller.schoolId, kind: "SYSTEM", titleKey: "payroll.notifySlipTitle", bodyKey: "payroll.notifySlipBody", bodyVars: { month: `${m}/${y}` }, url: "/account/payslips" }).catch(() => {});
  }
  return runView(ctx, month);
}

/** Whether the head reads this run's slips. The admin's to decide; the run's figures are not touched, so a locked run may be shared. */
export async function shareRun(ctx: ActiveContext, month: string, shared: boolean): Promise<PayrollRunView> {
  const caller = await office(ctx, true);
  assertMonth(month);
  const run = await runRow(caller.schoolId, month);
  if (!run) throw new AccessError("access.entryNotFound", "NOT_FOUND");
  if (run.sharedWithPrincipal !== shared) {
    await db.payrollRun.update({ where: { id: run.id }, data: { sharedWithPrincipal: shared } });
    await audit({ schoolId: caller.schoolId, actorUserId: caller.user.id, action: shared ? "payroll.run.share" : "payroll.run.unshare", targetType: "PayrollRun", targetId: month, meta: { month } });
  }
  return runView(ctx, month);
}

/* ---------------------------------------------------------------- exports */

const rupees = (paise: number) => Math.round(paise / 100);
const line = (lines: PayslipLine[], code: SalaryComponentCode) => lines.find((l) => l.code === code);

/**
 * One file from a LOCKED run, cut afresh from the frozen slips every time
 * (the same bytes; the row keeps its SHA-256). The bank advice and the TDS
 * summary open the sealed numbers INTO THE FILE and nowhere else, and are
 * audited as such; every cut is audited. Formats, as published and NOT YET
 * CHECKED against a live portal or a bank (the report says so):
 *   PF_ECR — EPFO's ECR 2.0 text: one member a line, eleven fields joined by
 *     "#~#" (UAN, name, gross, EPF/EPS/EDLI wages, EE share, EPS share, ER
 *     difference, NCP days, refunds), whole rupees, no header.
 *   ESI — the ESIC monthly contribution sheet's six columns.
 *   BANK_ADVICE — one credit a line: name, account, IFSC, amount, narration.
 *   PT, TDS_SUMMARY — the accountant's sheets.
 */
export async function payrollExport(ctx: ActiveContext, month: string, kind: PayrollExportKind): Promise<PayrollExportFile> {
  const caller = await office(ctx, true);
  assertMonth(month);
  const run = await runRow(caller.schoolId, month);
  if (!run) throw new AccessError("access.entryNotFound", "NOT_FOUND");
  if (run.status !== "LOCKED") throw new RuleRefusal("payroll.refuseNotLocked", 409, { month });
  const [slips, settings, school] = await Promise.all([
    db.payslip.findMany({ where: { runId: run.id }, orderBy: { staffName: "asc" }, select: SLIP_SELECT }),
    settingsOf(caller.schoolId),
    db.school.findUniqueOrThrow({ where: { id: caller.schoolId }, select: { code: true } }),
  ]);
  const salaries = await salariesFor(caller.schoolId, slips.map((s) => s.membershipId), month);
  const linesOf = (s: SlipRow) => readJsonArray<PayslipLine>(s.linesJson);
  let content = "";
  let mime = "text/csv";
  let rows = 0;
  let totalPaise = 0;
  let ext = "csv";
  if (kind === "PF_ECR") {
    const out: string[] = [];
    for (const s of slips) {
      const ls = linesOf(s);
      const ee = line(ls, "PF_EMPLOYEE");
      const er = line(ls, "PF_EMPLOYER");
      const uan = salaries.get(s.membershipId)?.pfUan;
      if (!ee || !uan) continue;
      const epfWage = ee.basePaise ?? 0;
      const epsWage = er?.epsBasePaise ?? Math.min(epfWage, 1_500_000);
      const eps = er?.epsPaise ?? 0;
      const diff = (er?.paise ?? 0) - eps;
      const ncp = Math.round((s.lopOverrideHalfDays ?? s.lopHalfDays) / 2);
      out.push([uan, s.staffName.toUpperCase().replace(/#~#/g, " "), rupees(s.grossPaise), rupees(epfWage), rupees(epsWage), rupees(epsWage), rupees(ee.paise), rupees(eps), rupees(diff), ncp, 0].join("#~#"));
      totalPaise += ee.paise + (er?.paise ?? 0);
    }
    content = out.length ? out.join("\n") + "\n" : "";
    rows = out.length;
    mime = "text/plain";
    ext = "txt";
  } else if (kind === "ESI") {
    const out = [] as Record<string, unknown>[];
    for (const s of slips) {
      const ls = linesOf(s);
      const ee = line(ls, "ESI_EMPLOYEE");
      const er = line(ls, "ESI_EMPLOYER");
      const ip = salaries.get(s.membershipId)?.esiNumber;
      if (!ee || !ip) continue;
      out.push(rowOf(FILE_HEADINGS.ESI, [ip, s.staffName, Math.floor((2 * s.daysInMonth - (s.lopOverrideHalfDays ?? s.lopHalfDays)) / 2), rupees(ee.basePaise ?? s.grossPaise), 0, ""]));
      totalPaise += ee.paise + (er?.paise ?? 0);
    }
    content = toCsv(out, [...FILE_HEADINGS.ESI]);
    rows = out.length;
  } else if (kind === "BANK_ADVICE") {
    const out = [] as Record<string, unknown>[];
    for (const s of slips) {
      const sal = salaries.get(s.membershipId);
      if (s.paymentMode !== "BANK" || s.netPaise <= 0 || !sal?.bankAccountSealed || !sal.bankIfsc) continue;
      const account = open(sal.bankAccountSealed, bankBound(caller.schoolId, s.membershipId));
      out.push(rowOf(FILE_HEADINGS.BANK_ADVICE, [out.length + 1, s.staffName, account, sal.bankIfsc, (s.netPaise / 100).toFixed(2), salaryNarration(month)]));
      totalPaise += s.netPaise;
    }
    content = toCsv(out, [...FILE_HEADINGS.BANK_ADVICE]);
    rows = out.length;
  } else if (kind === "PT") {
    const out = [] as Record<string, unknown>[];
    for (const s of slips) {
      const pt = line(linesOf(s), "PT");
      out.push(rowOf(FILE_HEADINGS.PT, [s.staffName, (s.grossPaise / 100).toFixed(2), ((pt?.paise ?? 0) / 100).toFixed(2), settings.ptState]));
      totalPaise += pt?.paise ?? 0;
    }
    content = toCsv(out, [...FILE_HEADINGS.PT]);
    rows = out.length;
  } else {
    const out = [] as Record<string, unknown>[];
    for (const s of slips) {
      const tds = line(linesOf(s), "TDS");
      if (!tds) continue;
      const sal = salaries.get(s.membershipId);
      const pan = openPan({ kind: "STAFF", schoolId: caller.schoolId, membershipId: s.membershipId }, "SALARY", sal?.panSealed) ?? "";
      out.push(rowOf(FILE_HEADINGS.TDS_SUMMARY, [s.staffName, pan, (s.grossPaise / 100).toFixed(2), (tds.paise / 100).toFixed(2)]));
      totalPaise += tds.paise;
    }
    content = toCsv(out, [...FILE_HEADINGS.TDS_SUMMARY]);
    rows = out.length;
  }
  const filename = `${school.code}-${PAYROLL_EXPORT_SLUG[kind]}-${month}.${ext}`;
  const sha256 = createHash("sha256").update(content).digest("hex");
  await db.payrollExport.create({ data: { schoolId: caller.schoolId, runId: run.id, kind, fileName: filename, sha256, rows, totalPaise, createdByUserId: caller.user.id } });
  await audit({ schoolId: caller.schoolId, actorUserId: caller.user.id, action: kind === "BANK_ADVICE" || kind === "TDS_SUMMARY" ? "payroll.export.sealed" : "payroll.export", targetType: "PayrollRun", targetId: month, meta: { month, kind, rows, totalPaise, sha256: sha256.slice(0, 12) } });
  return { kind, filename, mime, content, rows, totalPaise };
}

/* ---------------------------------------------------------- the payslip PDF */

export type PayslipDocument = {
  locale: Locale;
  schoolName: string;
  employerName: string;
  pfEstablishmentCode: string;
  esiEmployerCode: string;
  month: string;
  slip: PayslipView;
  pfUan: string | null;
  esiNumber: string | null;
  panLast4: string | null;
  lockedAt: string | null;
};

/**
 * One locked slip, for its PDF: the admin may read anyone's, the head
 * anyone's in a run shared with them, a member of staff their own. Printed
 * in the language of the person it belongs to, whoever downloads it.
 */
export async function payslipDocument(ctx: ActiveContext, month: string, membershipId: string | "self"): Promise<PayslipDocument> {
  assertMonth(month);
  let schoolId: string;
  let who: string;
  if (membershipId === "self") {
    const caller = await staffMember(ctx);
    schoolId = caller.schoolId;
    who = caller.membershipId;
  } else {
    const caller = await office(ctx, false);
    schoolId = caller.schoolId;
    who = membershipId;
  }
  const run = await runRow(schoolId, month);
  if (!run) throw new AccessError("access.entryNotFound", "NOT_FOUND");
  // The staff member reads a slip once it is locked; the office reads a draft too.
  if (membershipId === "self" && run.status !== "LOCKED") throw new AccessError("access.entryNotFound", "NOT_FOUND");
  if (membershipId !== "self" && ctx.role === "PRINCIPAL" && !run.sharedWithPrincipal) throw new AccessError("payroll.refuseNotShared");
  const slip = await db.payslip.findUnique({ where: { runId_membershipId: { runId: run.id, membershipId: who } }, select: { ...SLIP_SELECT, membership: { select: { user: { select: { prefs: true } } } } } });
  if (!slip) throw new AccessError("access.entryNotFound", "NOT_FOUND");
  const [salary, settings, school] = await Promise.all([salariesFor(schoolId, [who], month).then((m) => m.get(who)), settingsOf(schoolId), db.school.findUniqueOrThrow({ where: { id: schoolId }, select: { name: true } })]);
  const prefs = readJson<{ locale?: string }>(slip.membership.user.prefs, {});
  return {
    locale: normaliseLocale(prefs.locale),
    schoolName: school.name,
    employerName: settings.employerName || school.name,
    pfEstablishmentCode: settings.pfEstablishmentCode,
    esiEmployerCode: settings.esiEmployerCode,
    month,
    slip: slipView(slip, salary),
    pfUan: salary?.pfUan ?? null,
    esiNumber: salary?.esiNumber ?? null,
    panLast4: salary?.panLast4 ?? null,
    lockedAt: run.lockedAt?.toISOString() ?? null,
  };
}

/* ------------------------------------------------------------- statements */

/** A person's financial year from the LOCKED runs: each month, and each component's year total. */
async function statement(schoolId: string, membershipId: string, year: string | undefined): Promise<PayrollStatement> {
  const member = await db.membership.findFirst({ where: { id: membershipId, schoolId }, select: { id: true, user: { select: { name: true, preferredName: true } } } });
  if (!member) throw new AccessError("access.entryNotFound", "NOT_FOUND");
  const slips = await db.payslip.findMany({ where: { schoolId, membershipId, run: { status: "LOCKED" } }, select: { linesJson: true, grossPaise: true, deductionsPaise: true, employerPaise: true, netPaise: true, run: { select: { month: true } } } });
  const fy = year && /^\d{4}-\d{2}$/.test(year) ? year : slips.length ? financialYearOf(slips.map((s) => s.run.month).sort().at(-1)!) : financialYearOf(new Date().toISOString().slice(0, 7));
  const months = new Set(monthsOfFinancialYear(fy));
  const inYear = slips.filter((s) => months.has(s.run.month)).sort((a, b) => a.run.month.localeCompare(b.run.month));
  const byCode = new Map<string, { code: string; kind: PayslipLine["kind"]; label: string; paise: number }>();
  for (const s of inYear) for (const l of readJsonArray<PayslipLine>(s.linesJson)) {
    const key = `${l.code}|${l.label}`;
    const row = byCode.get(key) ?? { code: l.code, kind: l.kind, label: l.label, paise: 0 };
    row.paise += l.paise;
    byCode.set(key, row);
  }
  const sum = (k: "grossPaise" | "deductionsPaise" | "employerPaise" | "netPaise") => inYear.reduce((a, s) => a + s[k], 0);
  return {
    membershipId,
    name: nameOf(member.user),
    year: fy,
    months: inYear.map((s) => ({ month: s.run.month, grossPaise: s.grossPaise, deductionsPaise: s.deductionsPaise, employerPaise: s.employerPaise, netPaise: s.netPaise })),
    components: [...byCode.values()],
    grossPaise: sum("grossPaise"),
    deductionsPaise: sum("deductionsPaise"),
    employerPaise: sum("employerPaise"),
    netPaise: sum("netPaise"),
  };
}

export async function statementFor(ctx: ActiveContext, membershipId: string, year?: string): Promise<PayrollStatement> {
  const caller = await office(ctx, true);
  return statement(caller.schoolId, membershipId, year);
}

export async function myStatement(ctx: ActiveContext, year?: string): Promise<PayrollStatement> {
  const caller = await staffMember(ctx);
  return statement(caller.schoolId, caller.membershipId, year);
}

/* ---------------------------------------------------------------- summary */

export async function payrollSummary(ctx: ActiveContext): Promise<PayrollSummary> {
  const caller = await office(ctx, false);
  const [settings, roll, structures, runs, waiting] = await Promise.all([
    settingsOf(caller.schoolId),
    rollFor(caller.schoolId),
    db.salaryStructure.count({ where: { schoolId: caller.schoolId, archivedAt: null } }),
    db.payrollRun.findMany({ where: { schoolId: caller.schoolId }, orderBy: { month: "desc" }, take: 24, select: { id: true, month: true, status: true, lockedAt: true, headcount: true, grossPaise: true, deductionsPaise: true, employerPaise: true, netPaise: true } }),
    db.staffAdvance.count({ where: { schoolId: caller.schoolId, status: "REQUESTED" } }),
  ]);
  const salaries = await salariesFor(caller.schoolId, roll.map((r) => r.id), "9999-12");
  const locked = runs.filter((r) => r.status === "LOCKED");
  const latest = locked[0] ?? null;
  const byDept = latest ? await db.payslip.groupBy({ by: ["department"], where: { runId: latest.id }, _sum: { grossPaise: true, employerPaise: true }, _count: { _all: true } }) : [];
  return {
    settings,
    staffCount: roll.length,
    withSalary: salaries.size,
    structures,
    runs: runs.map((r) => ({ month: r.month, status: r.status as "DRAFT" | "LOCKED", lockedAt: r.lockedAt?.toISOString() ?? null, headcount: r.headcount, grossPaise: r.grossPaise, deductionsPaise: r.deductionsPaise, employerPaise: r.employerPaise, netPaise: r.netPaise })),
    costByMonth: locked.slice(0, 12).reverse().map((r) => ({ month: r.month, grossPaise: r.grossPaise, employerPaise: r.employerPaise, netPaise: r.netPaise, headcount: r.headcount })),
    costByDepartment: byDept.map((d) => ({ department: d.department, grossPaise: d._sum.grossPaise ?? 0, employerPaise: d._sum.employerPaise ?? 0, headcount: d._count._all })).sort((a, b) => b.grossPaise - a.grossPaise),
    latestLockedMonth: latest?.month ?? null,
    advancesWaiting: keeps(caller.role) ? waiting : 0,
    canEdit: keeps(caller.role),
  };
}

/* --------------------------------------------------------------- advances */

async function advanceViews(schoolId: string, rows: { id: string; membershipId: string; amountPaise: number; reason: string; status: string; monthlyRecoveryPaise: number | null; decisionNote: string | null; createdAt: Date; decidedAt: Date | null; membership: { user: { name: string; preferredName: string | null } } }[]): Promise<StaffAdvanceView[]> {
  const recovered = await recoveredByAdvance(schoolId, [...new Set(rows.map((r) => r.membershipId))]);
  return rows.map((r) => {
    const back = r.status === "RECORDED" ? (recovered.get(r.id) ?? 0) : 0;
    return {
      id: r.id,
      membershipId: r.membershipId,
      name: nameOf(r.membership.user),
      amountPaise: r.amountPaise,
      reason: r.reason,
      status: r.status as AdvanceStatus,
      monthlyRecoveryPaise: r.monthlyRecoveryPaise,
      recoveredPaise: back,
      outstandingPaise: r.status === "RECORDED" ? Math.max(0, r.amountPaise - back) : 0,
      decisionNote: r.decisionNote,
      createdAt: r.createdAt.toISOString(),
      decidedAt: r.decidedAt?.toISOString() ?? null,
    };
  });
}
const ADVANCE_SELECT = { id: true, membershipId: true, amountPaise: true, reason: true, status: true, monthlyRecoveryPaise: true, decisionNote: true, createdAt: true, decidedAt: true, membership: { select: { user: { select: { name: true, preferredName: true } } } } } as const;

export async function listAdvances(ctx: ActiveContext): Promise<{ advances: StaffAdvanceView[]; canEdit: boolean }> {
  const caller = await office(ctx, true);
  const rows = await db.staffAdvance.findMany({ where: { schoolId: caller.schoolId }, orderBy: [{ createdAt: "desc" }], take: 300, select: ADVANCE_SELECT });
  const views = await advanceViews(caller.schoolId, rows);
  return { advances: [...views.filter((v) => v.status === "REQUESTED"), ...views.filter((v) => v.status !== "REQUESTED")], canEdit: true };
}

/** The office records an advance it has handed over (outside the app), with what each month takes back. */
export async function recordAdvance(ctx: ActiveContext, input: { membershipId: string; amountPaise: number; monthlyRecoveryPaise: number; reason: string }): Promise<StaffAdvanceView> {
  const caller = await office(ctx, true);
  const member = await db.membership.findFirst({ where: { id: input.membershipId, schoolId: caller.schoolId, role: { in: [...SCHOOL_STAFF_ROLES] }, status: "ACTIVE" }, select: { id: true } });
  if (!member) throw new RuleRefusal("payroll.refuseNotStaff", 422, undefined, "membershipId");
  if (input.monthlyRecoveryPaise > input.amountPaise) throw new RuleRefusal("payroll.refuseInstalment", 422, undefined, "monthlyRecoveryPaise");
  const row = await db.staffAdvance.create({ data: { schoolId: caller.schoolId, membershipId: member.id, amountPaise: input.amountPaise, reason: input.reason, status: "RECORDED", monthlyRecoveryPaise: input.monthlyRecoveryPaise, decidedByUserId: caller.user.id, decidedAt: new Date() }, select: ADVANCE_SELECT });
  await audit({ schoolId: caller.schoolId, actorUserId: caller.user.id, action: "payroll.advance.record", targetType: "StaffAdvance", targetId: row.id, meta: { amountPaise: input.amountPaise, monthlyRecoveryPaise: input.monthlyRecoveryPaise } });
  return (await advanceViews(caller.schoolId, [row]))[0]!;
}

/** The office answers an ask: recorded (the amount it gave and the instalment) or declined. */
export async function decideAdvance(ctx: ActiveContext, input: { advanceId: string; decision: "RECORD" | "DECLINE"; amountPaise?: number; monthlyRecoveryPaise?: number; note: string }): Promise<StaffAdvanceView> {
  const caller = await office(ctx, true);
  const adv = await db.staffAdvance.findFirst({ where: { id: input.advanceId, schoolId: caller.schoolId }, select: { id: true, status: true, amountPaise: true, membership: { select: { userId: true } } } });
  if (!adv) throw new AccessError("access.entryNotFound", "NOT_FOUND");
  if (adv.status !== "REQUESTED") throw new RuleRefusal("payroll.refuseAnswered", 409);
  const amount = input.amountPaise ?? adv.amountPaise;
  if (input.decision === "RECORD") {
    if (!input.monthlyRecoveryPaise || input.monthlyRecoveryPaise <= 0) throw new RuleRefusal("payroll.refuseNoInstalment", 422, undefined, "monthlyRecoveryPaise");
    if (input.monthlyRecoveryPaise > amount) throw new RuleRefusal("payroll.refuseInstalment", 422, undefined, "monthlyRecoveryPaise");
  }
  const done = await db.staffAdvance.updateMany({
    where: { id: adv.id, status: "REQUESTED" },
    data: input.decision === "RECORD" ? { status: "RECORDED", amountPaise: amount, monthlyRecoveryPaise: input.monthlyRecoveryPaise, decidedByUserId: caller.user.id, decidedAt: new Date(), decisionNote: input.note || null } : { status: "DECLINED", decidedByUserId: caller.user.id, decidedAt: new Date(), decisionNote: input.note || null },
  });
  if (done.count === 0) throw new RuleRefusal("payroll.refuseAnswered", 409);
  await audit({ schoolId: caller.schoolId, actorUserId: caller.user.id, action: input.decision === "RECORD" ? "payroll.advance.record" : "payroll.advance.decline", targetType: "StaffAdvance", targetId: adv.id, meta: { amountPaise: amount } });
  await notify({ userId: adv.membership.userId, schoolId: caller.schoolId, kind: "SYSTEM", titleKey: input.decision === "RECORD" ? "payroll.notifyAdvanceRecordedTitle" : "payroll.notifyAdvanceDeclinedTitle", bodyKey: "payroll.notifyAdvanceBody", url: "/account/payslips" }).catch(() => {});
  const row = await db.staffAdvance.findUniqueOrThrow({ where: { id: adv.id }, select: ADVANCE_SELECT });
  return (await advanceViews(caller.schoolId, [row]))[0]!;
}

/** A member of staff asks for an advance. One waiting ask at a time. */
export async function askAdvance(ctx: ActiveContext, input: { amountPaise: number; reason: string }): Promise<StaffAdvanceView> {
  const caller = await staffMember(ctx);
  const waiting = await db.staffAdvance.count({ where: { membershipId: caller.membershipId, status: "REQUESTED" } });
  if (waiting > 0) throw new RuleRefusal("payroll.refuseAdvanceWaiting", 409);
  const row = await db.staffAdvance.create({ data: { schoolId: caller.schoolId, membershipId: caller.membershipId, amountPaise: input.amountPaise, reason: input.reason }, select: ADVANCE_SELECT });
  await audit({ schoolId: caller.schoolId, actorUserId: caller.user.id, action: "payroll.advance.ask", targetType: "StaffAdvance", targetId: row.id, meta: { amountPaise: input.amountPaise } });
  const admins = await db.membership.findMany({ where: { schoolId: caller.schoolId, role: "ADMIN", status: "ACTIVE", leftAt: null }, select: { userId: true } });
  for (const a of admins) {
    if (a.userId === caller.user.id) continue;
    await notify({ userId: a.userId, schoolId: caller.schoolId, kind: "SYSTEM", titleKey: "payroll.notifyAdvanceAskTitle", bodyKey: "payroll.notifyAdvanceAskBody", bodyVars: { name: nameOf(row.membership.user) }, url: "/admin/payroll/advances" }).catch(() => {});
  }
  return (await advanceViews(caller.schoolId, [row]))[0]!;
}

/* ------------------------------------------------------- the staff's own */

/** My locked slips, the structure I am paid on (not anyone else's), my advances and the years I have statements for. */
export async function myPayslips(ctx: ActiveContext): Promise<MyPayslips> {
  const caller = await staffMember(ctx);
  const tz = await zoneOf(caller.schoolId);
  const thisMonth = dateKeyInZone(new Date(), tz).slice(0, 7);
  const [salary, slips, advances, me] = await Promise.all([
    salariesFor(caller.schoolId, [caller.membershipId], thisMonth).then((m) => m.get(caller.membershipId)),
    db.payslip.findMany({ where: { schoolId: caller.schoolId, membershipId: caller.membershipId, run: { status: "LOCKED" } }, select: { grossPaise: true, deductionsPaise: true, netPaise: true, run: { select: { month: true, lockedAt: true } } } }),
    db.staffAdvance.findMany({ where: { membershipId: caller.membershipId }, orderBy: { createdAt: "desc" }, take: 20, select: ADVANCE_SELECT }),
    db.membership.findUniqueOrThrow({ where: { id: caller.membershipId }, select: { user: { select: { name: true, preferredName: true } } } }),
  ]);
  const sorted = slips.sort((a, b) => b.run.month.localeCompare(a.run.month));
  const basic = salary ? (overridesOf(salary).BASIC ?? salary.basicPaise) : 0;
  return {
    name: nameOf(me.user),
    structure: salary
      ? {
          name: salary.structure.name,
          effectiveFrom: salary.effectiveFromKey,
          basicPaise: basic,
          monthlyGrossPaise: monthlyGross(salary.basicPaise, componentsOf(salary), overridesOf(salary)),
          components: componentsOf(salary).map((c) => {
            const ov = overridesOf(salary)[c.code];
            const kind = COMPONENT_KIND[c.code];
            const monthly = c.code === "BASIC" ? basic : isStatutory(c.code) || c.code === "ADVANCE" ? 0 : (ov ?? (c.formula === "PERCENT_OF_BASIC" ? Math.round((basic * c.value) / 10_000) : c.formula === "FIXED" ? c.value : 0));
            return { code: c.code, kind, label: c.label, monthlyPaise: monthly };
          }),
        }
      : null,
    slips: sorted.map((s) => ({ month: s.run.month, grossPaise: s.grossPaise, deductionsPaise: s.deductionsPaise, netPaise: s.netPaise, lockedAt: (s.run.lockedAt ?? new Date(0)).toISOString() })),
    advances: await advanceViews(caller.schoolId, advances),
    years: [...new Set(sorted.map((s) => financialYearOf(s.run.month)))],
  };
}

/** For data:audit and the suite: what the stored figures of a slip add up to. */
export { totalsOf };
