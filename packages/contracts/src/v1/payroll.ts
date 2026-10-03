import { z } from "zod";

/**
 * HR and payroll (module PAYROLL, the owner's decision of 3 October 2026):
 * salary structures, each member of staff's salary, the monthly run drafted
 * from the staff register and approved leave, payslips, and the files the
 * school takes to EPFO, ESIC and its bank. NOTHING HERE MOVES MONEY
 * (decision 0003): the bank advice is a file the school uploads to its own
 * bank, the ECR a file it uploads to the EPFO portal.
 */
const cuid = z.string().regex(/^c[a-z0-9]{20,}$/, "id");
const iso = z.string().datetime();
const dateKey = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "date");
const monthKey = z.string().regex(/^\d{4}-\d{2}$/, "month");
const count = z.number().int().min(0);
const paise = z.number().int().min(0).max(2_000_000_000);

/* ------------------------------------------------------------------ codes */

export const SALARY_COMPONENT_CODES = [
  "BASIC",
  "HRA",
  "DA",
  "CONVEYANCE",
  "SPECIAL",
  "OTHER_EARNING",
  "PF_EMPLOYEE",
  "PF_EMPLOYER",
  "ESI_EMPLOYEE",
  "ESI_EMPLOYER",
  "PT",
  "TDS",
  "ADVANCE",
  "OTHER_DEDUCTION",
] as const;
export const salaryComponentCodeSchema = z.enum(SALARY_COMPONENT_CODES);
export type SalaryComponentCode = z.infer<typeof salaryComponentCodeSchema>;

export const SALARY_COMPONENT_KINDS = ["EARNING", "DEDUCTION", "EMPLOYER_CONTRIBUTION"] as const;
export type SalaryComponentKind = (typeof SALARY_COMPONENT_KINDS)[number];

/** What each code is, fixed: a structure cannot call PF an earning. */
export const COMPONENT_KIND: Record<SalaryComponentCode, SalaryComponentKind> = {
  BASIC: "EARNING",
  HRA: "EARNING",
  DA: "EARNING",
  CONVEYANCE: "EARNING",
  SPECIAL: "EARNING",
  OTHER_EARNING: "EARNING",
  PF_EMPLOYEE: "DEDUCTION",
  ESI_EMPLOYEE: "DEDUCTION",
  PT: "DEDUCTION",
  TDS: "DEDUCTION",
  ADVANCE: "DEDUCTION",
  OTHER_DEDUCTION: "DEDUCTION",
  PF_EMPLOYER: "EMPLOYER_CONTRIBUTION",
  ESI_EMPLOYER: "EMPLOYER_CONTRIBUTION",
};

/** Worked out by the statutory rules below, never by a value typed into a structure. */
export const STATUTORY_CODES: readonly SalaryComponentCode[] = ["PF_EMPLOYEE", "PF_EMPLOYER", "ESI_EMPLOYEE", "ESI_EMPLOYER", "PT"];

/**
 * How a non-statutory component is worked out. BASIC is the salary's own
 * figure; ADVANCE is the recorded advances' instalment; TDS is a fixed
 * figure the accountant gives (the platform does not compute income tax);
 * PERCENT_OF_GROSS is for a deduction only — an earning that is a share of
 * the gross it is part of has no answer.
 */
export const SALARY_FORMULAS = ["FIXED", "PERCENT_OF_BASIC", "PERCENT_OF_GROSS"] as const;
export const salaryFormulaSchema = z.enum(SALARY_FORMULAS);
export type SalaryFormula = z.infer<typeof salaryFormulaSchema>;

export const PAYMENT_MODES = ["BANK", "CASH", "CHEQUE"] as const;
export const paymentModeSchema = z.enum(PAYMENT_MODES);
export type PaymentMode = z.infer<typeof paymentModeSchema>;

export const PAYROLL_RUN_STATUSES = ["DRAFT", "LOCKED"] as const;
export type PayrollRunStatus = (typeof PAYROLL_RUN_STATUSES)[number];

export const PAYROLL_EXPORT_KINDS = ["PF_ECR", "ESI", "BANK_ADVICE", "PT", "TDS_SUMMARY"] as const;
export const payrollExportKindSchema = z.enum(PAYROLL_EXPORT_KINDS);
export type PayrollExportKind = z.infer<typeof payrollExportKindSchema>;
/** The URL segment of each file, as the routes name them. */
export const PAYROLL_EXPORT_SLUG: Record<PayrollExportKind, string> = { PF_ECR: "pf-ecr", ESI: "esi", BANK_ADVICE: "bank-advice", PT: "pt", TDS_SUMMARY: "tds" };

export const ADVANCE_STATUSES = ["REQUESTED", "RECORDED", "DECLINED", "CANCELLED"] as const;
export type AdvanceStatus = (typeof ADVANCE_STATUSES)[number];

/** The states whose professional-tax slabs are coded below; NONE switches PT off. */
export const PT_STATES = ["MH", "NONE"] as const;
export const ptStateSchema = z.enum(PT_STATES);
export type PtState = z.infer<typeof ptStateSchema>;

/* ------------------------------------------------- the statutory table */

/**
 * THE STATUTORY RATES, with the day each took effect. A run uses the row in
 * force on the first day of its month, so a change is a new row here with
 * its date, never an edit of an old one: a locked run keeps the figures it
 * was locked with whatever this table says later.
 *
 * As read on 3 October 2026 from the published schemes — THE SCHOOL'S
 * ACCOUNTANT CONFIRMS THEM before the first run is filed:
 *   PF  — the EPF Scheme 1952 (para 29): 12 % of basic + DA from the member
 *         and 12 % from the employer, of which 8.33 % goes to the pension
 *         scheme (EPS 1995) on wages up to the ₹15,000 ceiling (from
 *         1 September 2014). Contributions above the ceiling are optional
 *         (PayrollSettings.pfOnFullBasic). Administrative charges and EDLI
 *         are the employer's, outside the payslip, and not computed here.
 *   ESI — 0.75 % from the employee and 3.25 % from the employer (from
 *         1 July 2019) for an employee whose wages are within ₹21,000 a
 *         month (from 1 January 2017), each rounded UP to the next rupee as
 *         ESIC does. Coverage is decided per month here; the Act fixes it
 *         for a contribution period (April–September, October–March), which
 *         the accountant reconciles.
 *   PT  — Maharashtra (the Maharashtra State Tax on Professions, Trades,
 *         Callings and Employments Act 1975, Schedule I entry 1, as amended
 *         from 1 July 2023): men — up to ₹7,500 nil, ₹7,501–₹10,000 ₹175,
 *         above ₹10,000 ₹200 a month and ₹300 in February; women — up to
 *         ₹25,000 nil, above ₹25,000 ₹200 and ₹300 in February. Anyone the
 *         staff record does not name as a woman is charged on the men's slab.
 */
export const PF_RATES = [{ effectiveFrom: "2014-09-01", employeeBp: 1200, employerBp: 1200, epsBp: 833, wageCeilingPaise: 1_500_000 }] as const;
export const ESI_RATES = [{ effectiveFrom: "2019-07-01", employeeBp: 75, employerBp: 325, wageLimitPaise: 2_100_000 }] as const;
export type PtSlab = { upToPaise: number | null; monthlyPaise: number; februaryPaise: number };
export const PT_SLABS: { state: Exclude<PtState, "NONE">; effectiveFrom: string; men: PtSlab[]; women: PtSlab[] }[] = [
  {
    state: "MH",
    effectiveFrom: "2023-07-01",
    men: [
      { upToPaise: 750_000, monthlyPaise: 0, februaryPaise: 0 },
      { upToPaise: 1_000_000, monthlyPaise: 17_500, februaryPaise: 17_500 },
      { upToPaise: null, monthlyPaise: 20_000, februaryPaise: 30_000 },
    ],
    women: [
      { upToPaise: 2_500_000, monthlyPaise: 0, februaryPaise: 0 },
      { upToPaise: null, monthlyPaise: 20_000, februaryPaise: 30_000 },
    ],
  },
];

/** The row of a dated table in force on `on` (YYYY-MM-DD): the latest that began on or before it. */
export function ratesOn<T extends { effectiveFrom: string }>(table: readonly T[], on: string): T | null {
  let best: T | null = null;
  for (const row of table) if (row.effectiveFrom <= on && (!best || row.effectiveFrom > best.effectiveFrom)) best = row;
  return best;
}

/* -------------------------------------------------------------- settings */

export const payrollSettingsSchema = z.object({
  pfEnabled: z.boolean(),
  /** Contribute on the whole basic + DA rather than stopping at the wage ceiling. */
  pfOnFullBasic: z.boolean(),
  esiEnabled: z.boolean(),
  ptState: ptStateSchema,
  /** The establishment's codes as the portals know it; printed on the payslip and the files. */
  employerName: z.string().max(160),
  pfEstablishmentCode: z.string().max(40),
  esiEmployerCode: z.string().max(40),
});
export type PayrollSettings = z.infer<typeof payrollSettingsSchema>;
export const payrollSettingsSaveSchema = payrollSettingsSchema;

/* ------------------------------------------------------------- structures */

export const salaryComponentSchema = z.object({
  code: salaryComponentCodeSchema,
  /** What the payslip calls an OTHER_* line; blank uses the code's own words. */
  label: z.string().max(60),
  kind: z.enum(SALARY_COMPONENT_KINDS),
  formula: salaryFormulaSchema,
  /** Paise for FIXED, basis points (1/100 of a per cent) for a percentage; ignored for BASIC, ADVANCE and the statutory codes. */
  value: z.number().int().min(0).max(2_000_000_000),
  statutory: z.boolean(),
});
export type SalaryComponentView = z.infer<typeof salaryComponentSchema>;

export const salaryStructureSchema = z.object({
  id: z.string(),
  name: z.string(),
  components: z.array(salaryComponentSchema),
  staffCount: count,
  archived: z.boolean(),
});
export type SalaryStructureView = z.infer<typeof salaryStructureSchema>;
export const salaryStructuresSchema = z.object({ structures: z.array(salaryStructureSchema), canEdit: z.boolean() });

/** POST /api/v1/admin/payroll/structures — a structure whole: with an id it is rewritten, without one it is made. BASIC must be among its components; each code once. */
export const salaryStructureSaveSchema = z.object({
  id: cuid.optional(),
  name: z.string().trim().min(1).max(80),
  components: z
    .array(z.object({ code: salaryComponentCodeSchema, label: z.string().trim().max(60).default(""), formula: salaryFormulaSchema.default("FIXED"), value: z.number().int().min(0).max(2_000_000_000).default(0) }))
    .min(1)
    .max(SALARY_COMPONENT_CODES.length),
  archived: z.boolean().optional(),
});
export type SalaryStructureSave = z.infer<typeof salaryStructureSaveSchema>;

/* --------------------------------------------------------------- salaries */

export const staffSalarySchema = z.object({
  membershipId: z.string(),
  name: z.string(),
  role: z.string(),
  designation: z.string().nullable(),
  salary: z
    .object({
      structureId: z.string(),
      structureName: z.string(),
      effectiveFrom: dateKey,
      basicPaise: paise,
      /** Per-component figures that replace the structure's for this person, by code. */
      overrides: z.record(z.string(), z.number().int().min(0)),
      pfUan: z.string().nullable(),
      esiNumber: z.string().nullable(),
      /** The sealed numbers are never answered: the last four only. */
      panLast4: z.string().nullable(),
      bankLast4: z.string().nullable(),
      bankIfsc: z.string().nullable(),
      bankName: z.string().nullable(),
      paymentMode: paymentModeSchema,
      /** A full month's gross with no day lost, for the list. */
      monthlyGrossPaise: count,
    })
    .nullable(),
});
export type StaffSalaryView = z.infer<typeof staffSalarySchema>;
export const staffSalariesSchema = z.object({ staff: z.array(staffSalarySchema), structures: z.array(z.object({ id: z.string(), name: z.string() })), sealingAvailable: z.boolean(), canEdit: z.boolean() });

/** POST /api/v1/admin/payroll/salaries — one person's salary from a date. A blank PAN or bank account keeps the sealed one. */
export const staffSalarySaveSchema = z.object({
  membershipId: cuid,
  structureId: cuid,
  effectiveFrom: dateKey,
  basicPaise: paise.refine((n) => n > 0, "basic"),
  overrides: z.record(salaryComponentCodeSchema, z.number().int().min(0).max(2_000_000_000)).default({}),
  pfUan: z.string().trim().regex(/^(\d{12})?$/, "uan").default(""),
  esiNumber: z.string().trim().regex(/^(\d{10}|\d{17})?$/, "esi").default(""),
  pan: z.string().trim().toUpperCase().regex(/^([A-Z]{5}[0-9]{4}[A-Z])?$/, "pan").default(""),
  bankAccount: z.string().trim().regex(/^(\d{6,20})?$/, "account").default(""),
  bankIfsc: z.string().trim().toUpperCase().regex(/^([A-Z]{4}0[A-Z0-9]{6})?$/, "ifsc").default(""),
  bankName: z.string().trim().max(80).default(""),
  paymentMode: paymentModeSchema.default("BANK"),
});
export type StaffSalarySave = z.infer<typeof staffSalarySaveSchema>;

/* ------------------------------------------------------------ runs, slips */

export const payslipLineSchema = z.object({
  code: salaryComponentCodeSchema.or(z.literal("ARREARS")),
  kind: z.enum(SALARY_COMPONENT_KINDS),
  label: z.string(),
  /** What this month pays or takes, after the days lost. */
  paise: count,
  /** The full month's figure before the days lost (equal to `paise` for a deduction). */
  fullPaise: count,
  /** For an ADVANCE line: the advance it recovers. */
  advanceId: z.string().optional(),
  /** For a PF or ESI line: the wages it was worked out on (EPF wages; ESI wages). */
  basePaise: count.optional(),
  /** For the PF_EMPLOYER line: the pension (EPS) wages and share; the rest of the employer's 12 % is the EPF difference. */
  epsBasePaise: count.optional(),
  epsPaise: count.optional(),
});
export type PayslipLine = z.infer<typeof payslipLineSchema>;

export const payslipSchema = z.object({
  membershipId: z.string(),
  name: z.string(),
  department: z.string(),
  designation: z.string().nullable(),
  daysInMonth: count,
  /** Loss-of-pay days, in halves (a half day is 0.5). */
  lopDays: z.number().min(0),
  paidDays: z.number().min(0),
  lines: z.array(payslipLineSchema),
  grossPaise: count,
  deductionsPaise: count,
  employerPaise: count,
  netPaise: z.number().int(),
  arrearsPaise: count,
  tdsOverridePaise: count.nullable(),
  lopOverrideDays: z.number().min(0).nullable(),
  notes: z.string(),
  paymentMode: paymentModeSchema,
  bankLast4: z.string().nullable(),
  /** Codes of what the office should look at before locking: NEGATIVE_NET, NO_BANK, NO_UAN, NO_ESI_NUMBER. */
  warnings: z.array(z.string()),
});
export type PayslipView = z.infer<typeof payslipSchema>;

export const payrollTotalsSchema = z.object({ headcount: count, grossPaise: count, deductionsPaise: count, employerPaise: count, netPaise: z.number().int() });

export const payrollExportRowSchema = z.object({ kind: payrollExportKindSchema, fileName: z.string(), rows: count, totalPaise: count, createdAt: iso, byName: z.string() });

export const payrollRunSchema = z.object({
  month: monthKey,
  status: z.enum(PAYROLL_RUN_STATUSES),
  createdAt: iso,
  lockedAt: iso.nullable(),
  lockedByName: z.string().nullable(),
  sharedWithPrincipal: z.boolean(),
  totals: payrollTotalsSchema,
  /** Null for the head unless the office shared the run's slips. */
  slips: z.array(payslipSchema).nullable(),
  exports: z.array(payrollExportRowSchema),
  /** Staff on the roll with no salary for this month: not in the run. */
  missingSalary: z.array(z.object({ membershipId: z.string(), name: z.string() })),
  canEdit: z.boolean(),
});
export type PayrollRunView = z.infer<typeof payrollRunSchema>;

/** POST /api/v1/admin/payroll/runs — draft the month's run, or draw a DRAFT afresh from the register; a LOCKED month is refused. */
export const payrollRunDraftSchema = z.object({ month: monthKey });
/** POST /api/v1/admin/payroll/runs/{month}/slips/{membershipId} — the office's review of one slip; null clears an override. */
export const payslipEditSchema = z
  .object({
    arrearsPaise: count.max(2_000_000_000).optional(),
    tdsOverridePaise: count.max(2_000_000_000).nullable().optional(),
    lopOverrideDays: z.number().min(0).max(31).multipleOf(0.5).nullable().optional(),
    notes: z.string().trim().max(300).optional(),
  })
  .refine((b) => Object.keys(b).length > 0, "empty");
export type PayslipEdit = z.infer<typeof payslipEditSchema>;
/** POST /api/v1/admin/payroll/runs/{month}/lock — freezes the run; nothing in it changes afterwards. */
export const payrollRunLockSchema = z.object({ confirm: z.literal(true) });
/** POST /api/v1/admin/payroll/runs/{month}/share — whether the head reads the run's slips. */
export const payrollRunShareSchema = z.object({ shared: z.boolean() });

/** GET /api/v1/admin/payroll/runs/{month}/export/{kind} — one statutory or bank file, cut from a LOCKED run. Audited. */
export const payrollExportFileSchema = z.object({ kind: payrollExportKindSchema, filename: z.string(), mime: z.string(), content: z.string(), rows: count, totalPaise: count });
export type PayrollExportFile = z.infer<typeof payrollExportFileSchema>;

/* -------------------------------------------------------------- summary */

export const payrollSummarySchema = z.object({
  settings: payrollSettingsSchema,
  staffCount: count,
  withSalary: count,
  structures: count,
  runs: z.array(z.object({ month: monthKey, status: z.enum(PAYROLL_RUN_STATUSES), lockedAt: iso.nullable(), ...payrollTotalsSchema.shape })),
  /** The last twelve LOCKED months, oldest first. */
  costByMonth: z.array(z.object({ month: monthKey, grossPaise: count, employerPaise: count, netPaise: z.number().int(), headcount: count })),
  /** The latest LOCKED run, by department (the role the person is paid in). */
  costByDepartment: z.array(z.object({ department: z.string(), grossPaise: count, employerPaise: count, headcount: count })),
  latestLockedMonth: monthKey.nullable(),
  advancesWaiting: count,
  canEdit: z.boolean(),
});
export type PayrollSummary = z.infer<typeof payrollSummarySchema>;

/* -------------------------------------------------------------- advances */

export const staffAdvanceSchema = z.object({
  id: z.string(),
  membershipId: z.string(),
  name: z.string(),
  amountPaise: count,
  reason: z.string(),
  status: z.enum(ADVANCE_STATUSES),
  monthlyRecoveryPaise: count.nullable(),
  /** From the LOCKED runs' ADVANCE lines, worked out on every read. */
  recoveredPaise: count,
  outstandingPaise: count,
  decisionNote: z.string().nullable(),
  createdAt: iso,
  decidedAt: iso.nullable(),
});
export type StaffAdvanceView = z.infer<typeof staffAdvanceSchema>;
export const staffAdvancesSchema = z.object({ advances: z.array(staffAdvanceSchema), canEdit: z.boolean() });
/** POST /api/v1/account/advances — a member of staff asks the office for an advance. */
export const advanceAskSchema = z.object({ amountPaise: paise.refine((n) => n > 0, "amount"), reason: z.string().trim().min(1).max(300) });
/** POST /api/v1/admin/payroll/advances — the office records an advance it has given (outside the app), recovered in instalments. */
export const advanceRecordSchema = z.object({ membershipId: cuid, amountPaise: paise.refine((n) => n > 0, "amount"), monthlyRecoveryPaise: paise.refine((n) => n > 0, "instalment"), reason: z.string().trim().min(1).max(300) });
/** POST /api/v1/admin/payroll/advances/decide — the office answers an ask: recorded (with its instalment) or declined. */
export const advanceDecideSchema = z.object({
  advanceId: cuid,
  decision: z.enum(["RECORD", "DECLINE"]),
  amountPaise: paise.optional(),
  monthlyRecoveryPaise: paise.optional(),
  note: z.string().trim().max(300).default(""),
});

/* ------------------------------------------------------ the staff's own */

export const myPayslipsSchema = z.object({
  name: z.string(),
  structure: z
    .object({ name: z.string(), effectiveFrom: dateKey, basicPaise: count, monthlyGrossPaise: count, components: z.array(z.object({ code: salaryComponentCodeSchema, kind: z.enum(SALARY_COMPONENT_KINDS), label: z.string(), monthlyPaise: count })) })
    .nullable(),
  slips: z.array(z.object({ month: monthKey, grossPaise: count, deductionsPaise: count, netPaise: z.number().int(), lockedAt: iso })),
  advances: z.array(staffAdvanceSchema),
  /** Financial years ("2026-27") the person has a locked slip in, newest first. */
  years: z.array(z.string()),
});
export type MyPayslips = z.infer<typeof myPayslipsSchema>;

/** A financial year April–March: "2026-27". */
export const financialYearSchema = z.string().regex(/^\d{4}-\d{2}$/, "year");
export const payrollStatementQuerySchema = z.object({ year: financialYearSchema.optional() });
export const payrollStatementSchema = z.object({
  membershipId: z.string(),
  name: z.string(),
  year: z.string(),
  months: z.array(z.object({ month: monthKey, grossPaise: count, deductionsPaise: count, employerPaise: count, netPaise: z.number().int() })),
  components: z.array(z.object({ code: z.string(), kind: z.enum(SALARY_COMPONENT_KINDS), label: z.string(), paise: count })),
  grossPaise: count,
  deductionsPaise: count,
  employerPaise: count,
  netPaise: z.number().int(),
});
export type PayrollStatement = z.infer<typeof payrollStatementSchema>;
