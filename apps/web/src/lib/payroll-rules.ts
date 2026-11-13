import { createHash } from "node:crypto";
import {
  COMPONENT_KIND,
  ESI_RATES,
  PF_RATES,
  PT_SLABS,
  ratesOn,
  STATUTORY_CODES,
  type PayslipLine,
  type PtState,
  type SalaryComponentCode,
  type SalaryFormula,
} from "@edulink/contracts";

/**
 * The payroll's arithmetic, with no database: what a month pays one person,
 * the loss of pay a month's register and leave come to, and the digest a
 * locked run is held to. Pure so the suite can prove each rule against the
 * coded rates, and so data:audit recomputes what payroll.ts stored with the
 * very same functions.
 *
 * ALL MONEY IS INTEGER PAISE, rounded to the paisa at each line (ESI to the
 * rupee upwards, as ESIC rounds). Proration is by calendar day: a month of
 * thirty days with two days' loss of pay pays 28/30 of each earning, which
 * is how most Indian payrolls count; half days are kept as halves.
 */

export type ComponentInput = { code: SalaryComponentCode; label: string; formula: SalaryFormula; value: number };
export type StatutorySettings = { pfEnabled: boolean; pfOnFullBasic: boolean; esiEnabled: boolean; ptState: PtState };
export type SlipInput = {
  /** "2026-09": the rates in force on its first day apply. */
  month: string;
  daysInMonth: number;
  /** Days without pay, in halves. */
  lopHalfDays: number;
  basicPaise: number;
  /** The structure's lines with the person's overrides applied (an override replaces a FIXED value, or a percentage's result). */
  components: ComponentInput[];
  overrides: Partial<Record<SalaryComponentCode, number>>;
  settings: StatutorySettings;
  /** "F" takes the women's PT slab; anything else the men's. */
  gender: string | null;
  arrearsPaise: number;
  /** The accountant's TDS for this month, which wins over the structure's. */
  tdsOverridePaise: number | null;
  /** Recorded advances still owed, oldest first, each with what this month may recover. */
  advances: { id: string; instalmentPaise: number }[];
};
export type SlipFigures = { lines: PayslipLine[]; grossPaise: number; deductionsPaise: number; employerPaise: number; netPaise: number };

const bp = (paise: number, basisPoints: number) => Math.round((paise * basisPoints) / 10_000);
/** Up to the next whole rupee, in paise: ESIC's rounding. */
const ceilRupee = (paise: number) => Math.ceil(paise / 100) * 100;

/** Calendar days in "YYYY-MM". */
export function daysInMonthOf(month: string): number {
  const [y, m] = month.split("-").map(Number) as [number, number];
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

/** Every date key of "YYYY-MM". */
export function dayKeysOf(month: string): string[] {
  const n = daysInMonthOf(month);
  return Array.from({ length: n }, (_, i) => `${month}-${String(i + 1).padStart(2, "0")}`);
}

/** The words a line is printed with when the structure gives none: a dictionary key's tail under `payroll.code*`. */
export const CODE_LABEL_KEY: Record<SalaryComponentCode | "ARREARS", string> = {
  BASIC: "payroll.codeBasic",
  HRA: "payroll.codeHra",
  DA: "payroll.codeDa",
  CONVEYANCE: "payroll.codeConveyance",
  SPECIAL: "payroll.codeSpecial",
  OTHER_EARNING: "payroll.codeOtherEarning",
  PF_EMPLOYEE: "payroll.codePfEmployee",
  PF_EMPLOYER: "payroll.codePfEmployer",
  ESI_EMPLOYEE: "payroll.codeEsiEmployee",
  ESI_EMPLOYER: "payroll.codeEsiEmployer",
  PT: "payroll.codePt",
  TDS: "payroll.codeTds",
  ADVANCE: "payroll.codeAdvance",
  OTHER_DEDUCTION: "payroll.codeOtherDeduction",
  ARREARS: "payroll.codeArrears",
};

/** Professional tax on a month's gross under the state's slab. */
export function professionalTax(grossPaise: number, state: PtState, gender: string | null, month: string): number {
  if (state === "NONE") return 0;
  const table = ratesOn(PT_SLABS.filter((s) => s.state === state), `${month}-01`);
  if (!table) return 0;
  const slabs = gender === "F" ? table.women : table.men;
  const february = month.endsWith("-02");
  for (const slab of slabs) if (slab.upToPaise === null || grossPaise <= slab.upToPaise) return february ? slab.februaryPaise : slab.monthlyPaise;
  return 0;
}

/**
 * One person's month. Earnings are prorated by the days paid; FIXED
 * deductions are not; a percentage deduction is of what was earned. PF is
 * on basic + DA as earned, stopped at the wage ceiling unless the school
 * contributes on the whole; ESI applies while the gross is within the wage
 * limit; PT by the slab. An advance's instalment is cut so the net never
 * goes below nothing; a TDS or other deduction can still take it there, and
 * the run refuses to lock while it does.
 */
export function computeSlip(input: SlipInput): SlipFigures {
  const on = `${input.month}-01`;
  const pf = ratesOn(PF_RATES, on)!;
  const esi = ratesOn(ESI_RATES, on)!;
  const fullDays = 2 * input.daysInMonth;
  const lop = Math.min(Math.max(0, input.lopHalfDays), fullDays);
  const prorate = (paise: number) => Math.round((paise * (fullDays - lop)) / fullDays);
  const has = (code: SalaryComponentCode) => input.components.some((c) => c.code === code);
  const label = (c: ComponentInput) => c.label;
  const override = (code: SalaryComponentCode) => input.overrides[code];

  const lines: PayslipLine[] = [];
  // Earnings, BASIC first.
  const basicFull = override("BASIC") ?? input.basicPaise;
  const earnings = [...input.components.filter((c) => COMPONENT_KIND[c.code] === "EARNING")].sort((a, b) => (a.code === "BASIC" ? -1 : b.code === "BASIC" ? 1 : 0));
  if (!earnings.some((c) => c.code === "BASIC")) earnings.unshift({ code: "BASIC", label: "", formula: "FIXED", value: 0 });
  let basicEarned = 0;
  let daEarned = 0;
  for (const c of earnings) {
    const full = c.code === "BASIC" ? basicFull : (override(c.code) ?? (c.formula === "PERCENT_OF_BASIC" ? bp(basicFull, c.value) : c.formula === "FIXED" ? c.value : 0));
    const paise = prorate(full);
    if (c.code === "BASIC") basicEarned = paise;
    if (c.code === "DA") daEarned = paise;
    lines.push({ code: c.code, kind: "EARNING", label: label(c), paise, fullPaise: full });
  }
  if (input.arrearsPaise > 0) lines.push({ code: "ARREARS", kind: "EARNING", label: "", paise: input.arrearsPaise, fullPaise: input.arrearsPaise });
  const grossPaise = lines.reduce((a, l) => a + l.paise, 0);

  // Statutory.
  const pfBase = basicEarned + daEarned;
  const pfWage = input.settings.pfOnFullBasic ? pfBase : Math.min(pfBase, pf.wageCeilingPaise);
  const epsBase = Math.min(pfBase, pf.wageCeilingPaise);
  const deductions: PayslipLine[] = [];
  const employer: PayslipLine[] = [];
  if (input.settings.pfEnabled && has("PF_EMPLOYEE")) {
    const ee = bp(pfWage, pf.employeeBp);
    deductions.push({ code: "PF_EMPLOYEE", kind: "DEDUCTION", label: "", paise: ee, fullPaise: ee, basePaise: pfWage });
  }
  if (input.settings.pfEnabled && has("PF_EMPLOYER")) {
    const er = bp(pfWage, pf.employerBp);
    const eps = Math.min(er, bp(epsBase, pf.epsBp));
    employer.push({ code: "PF_EMPLOYER", kind: "EMPLOYER_CONTRIBUTION", label: "", paise: er, fullPaise: er, basePaise: pfWage, epsBasePaise: epsBase, epsPaise: eps });
  }
  // TA-292: cover is decided on the full month's rate of wages (the earnings before loss of pay, arrears left out), so
  // unpaid days or a month's arrears do not switch it on or off; the contribution is worked on what was earned.
  const rateOfWages = lines.filter((l) => l.code !== "ARREARS").reduce((a, l) => a + l.fullPaise, 0);
  const esiCovered = input.settings.esiEnabled && grossPaise > 0 && rateOfWages <= esi.wageLimitPaise;
  if (esiCovered && has("ESI_EMPLOYEE")) {
    const ee = ceilRupee((grossPaise * esi.employeeBp) / 10_000);
    deductions.push({ code: "ESI_EMPLOYEE", kind: "DEDUCTION", label: "", paise: ee, fullPaise: ee, basePaise: grossPaise });
  }
  if (esiCovered && has("ESI_EMPLOYER")) {
    const er = ceilRupee((grossPaise * esi.employerBp) / 10_000);
    employer.push({ code: "ESI_EMPLOYER", kind: "EMPLOYER_CONTRIBUTION", label: "", paise: er, fullPaise: er, basePaise: grossPaise });
  }
  if (has("PT")) {
    const pt = professionalTax(grossPaise, input.settings.ptState, input.gender, input.month);
    if (pt > 0) deductions.push({ code: "PT", kind: "DEDUCTION", label: "", paise: pt, fullPaise: pt });
  }
  // The structure's own deductions.
  const ownDeduction = (c: ComponentInput) => {
    const set = override(c.code);
    if (set !== undefined) return set;
    if (c.formula === "FIXED") return c.value;
    if (c.formula === "PERCENT_OF_BASIC") return bp(basicEarned, c.value);
    return bp(grossPaise, c.value);
  };
  for (const c of input.components) {
    if (c.code === "TDS") {
      const tds = input.tdsOverridePaise ?? ownDeduction(c);
      if (tds > 0) deductions.push({ code: "TDS", kind: "DEDUCTION", label: label(c), paise: tds, fullPaise: tds });
    } else if (c.code === "OTHER_DEDUCTION") {
      const v = ownDeduction(c);
      if (v > 0) deductions.push({ code: "OTHER_DEDUCTION", kind: "DEDUCTION", label: label(c), paise: v, fullPaise: v });
    }
  }
  // A TDS the accountant gave for a person whose structure has no TDS line still applies.
  if (!has("TDS") && input.tdsOverridePaise && input.tdsOverridePaise > 0) deductions.push({ code: "TDS", kind: "DEDUCTION", label: "", paise: input.tdsOverridePaise, fullPaise: input.tdsOverridePaise });
  // Advances last, and never past what is left.
  let room = grossPaise - deductions.reduce((a, l) => a + l.paise, 0);
  for (const adv of input.advances) {
    const take = Math.max(0, Math.min(adv.instalmentPaise, room));
    if (take <= 0) continue;
    deductions.push({ code: "ADVANCE", kind: "DEDUCTION", label: "", paise: take, fullPaise: adv.instalmentPaise, advanceId: adv.id });
    room -= take;
  }
  lines.push(...deductions, ...employer);
  const deductionsPaise = deductions.reduce((a, l) => a + l.paise, 0);
  const employerPaise = employer.reduce((a, l) => a + l.paise, 0);
  return { lines, grossPaise, deductionsPaise, employerPaise, netPaise: grossPaise - deductionsPaise };
}

/** What a line list adds up to — the check data:audit runs on every stored slip. */
export function totalsOf(lines: PayslipLine[]): { grossPaise: number; deductionsPaise: number; employerPaise: number; netPaise: number } {
  const sum = (kind: PayslipLine["kind"]) => lines.filter((l) => l.kind === kind).reduce((a, l) => a + l.paise, 0);
  const grossPaise = sum("EARNING");
  const deductionsPaise = sum("DEDUCTION");
  return { grossPaise, deductionsPaise, employerPaise: sum("EMPLOYER_CONTRIBUTION"), netPaise: grossPaise - deductionsPaise };
}

/** A full month's gross for a salary, with no day lost and no arrears: the lists' "monthly gross". */
export function monthlyGross(basicPaise: number, components: ComponentInput[], overrides: Partial<Record<SalaryComponentCode, number>>): number {
  let total = overrides.BASIC ?? basicPaise;
  const basic = total;
  for (const c of components) {
    if (COMPONENT_KIND[c.code] !== "EARNING" || c.code === "BASIC") continue;
    total += overrides[c.code] ?? (c.formula === "PERCENT_OF_BASIC" ? bp(basic, c.value) : c.formula === "FIXED" ? c.value : 0);
  }
  return total;
}

export const isStatutory = (code: SalaryComponentCode) => STATUTORY_CODES.includes(code);

/* --------------------------------------------------------- loss of pay */

export type DayFacts = {
  /** The person was on the roll that day (joined, not yet left). */
  employed: boolean;
  /** A day the school works: not a Sunday or a closing holiday. */
  working: boolean;
  /** What the staff register says, if anything. */
  status: "PRESENT" | "LATE" | "HALF_DAY" | "ABSENT" | "ON_LEAVE" | null;
  /** The kind of approved leave covering the day, if any. */
  leaveKind: string | null;
};

/**
 * Half days without pay, one day at a time. A day off the roll costs the
 * whole day, whatever kind of day it was. On a day the school is shut
 * nothing is lost. Otherwise: present or late, nothing; a half day, half;
 * absent, the day — unless approved paid leave covers it; on leave (marked,
 * or only the approved leave), nothing — unless the leave is UNPAID; and a
 * day nobody marked is paid, unless unpaid leave covers it. The office sees
 * every figure and may set its own before the lock.
 */
export function lopHalfDaysFor(days: DayFacts[]): number {
  let half = 0;
  for (const d of days) {
    if (!d.employed) {
      half += 2;
      continue;
    }
    if (!d.working) continue;
    const unpaid = d.leaveKind === "UNPAID";
    if (d.status === "PRESENT" || d.status === "LATE") continue;
    if (d.status === "HALF_DAY") half += 1;
    else if (d.status === "ABSENT") half += d.leaveKind && !unpaid ? 0 : 2;
    else if (unpaid) half += 2;
  }
  return half;
}

/* ----------------------------------------------------------- the digest */

export type DigestSlip = { membershipId: string; daysInMonth: number; lopHalfDays: number; lopOverrideHalfDays: number | null; linesJson: string; grossPaise: number; deductionsPaise: number; employerPaise: number; netPaise: number; arrearsPaise: number; tdsOverridePaise: number | null };

/** SHA-256 of a run's slips as they stand, in membership order: taken at the lock, and recomputed by data:audit to prove nothing moved since. */
export function slipDigest(slips: DigestSlip[]): string {
  const rows = [...slips]
    .sort((a, b) => (a.membershipId < b.membershipId ? -1 : a.membershipId > b.membershipId ? 1 : 0))
    .map((s) => [s.membershipId, s.daysInMonth, s.lopHalfDays, s.lopOverrideHalfDays, s.linesJson, s.grossPaise, s.deductionsPaise, s.employerPaise, s.netPaise, s.arrearsPaise, s.tdsOverridePaise]);
  return createHash("sha256").update(JSON.stringify(rows)).digest("hex");
}

/** "2026-27" for any month from April 2026 to March 2027. */
export function financialYearOf(month: string): string {
  const [y, m] = month.split("-").map(Number) as [number, number];
  const start = m >= 4 ? y : y - 1;
  return `${start}-${String((start + 1) % 100).padStart(2, "0")}`;
}

/** The twelve months of "2026-27", April first. */
export function monthsOfFinancialYear(year: string): string[] {
  const start = Number(year.slice(0, 4));
  return Array.from({ length: 12 }, (_, i) => {
    const m = ((i + 3) % 12) + 1;
    const y = i < 9 ? start : start + 1;
    return `${y}-${String(m).padStart(2, "0")}`;
  });
}
