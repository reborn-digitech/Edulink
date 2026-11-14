import { z } from "zod";
import { institutionKindSchema, schoolModuleSchema, type InstitutionKind } from "./modules";
import { subscriptionStatusSchema } from "./operator-dashboard";
import { streamSchema } from "./streams";

/**
 * operator-college: the operator's college console (4 October 2026) — the
 * colleges beside the schools with their regulators, programmes and roll;
 * their health in numbers read from the rows; the college tiers; the modules
 * switched for an institution on its behalf; and the recruiter accounts the
 * operator may shut out of every college at once. Everything is computed on
 * read; nothing here is stored except what the operator switches.
 */

/**
 * THE COLLEGE TIERS (the owner's college plan, 4 October 2026): a college is
 * priced per student a year, not a month — ₹199 a student for an affiliated
 * college, ₹299 for an autonomous or a professional (AICTE) one. A tier is a
 * Plan row whose code is the tier's code, added from /root/plans; what it
 * comes to is the tier's price times the students on the roll, computed on
 * read (subscriptions.ts for a partner's share, the colleges view for the
 * year's figure) and never stored. Recorded, never collected (decision 0003).
 * Offered to a college only: assignPlan refuses one for a school.
 */
export const COLLEGE_TIERS = [
  { code: "college-affiliated", perStudentYearPaise: 19_900, suits: ["COLLEGE"] as readonly InstitutionKind[] },
  { code: "college-autonomous", perStudentYearPaise: 29_900, suits: ["AUTONOMOUS_COLLEGE", "COLLEGE"] as readonly InstitutionKind[] },
] as const;
export type CollegeTierCode = (typeof COLLEGE_TIERS)[number]["code"];
export const COLLEGE_TIER_CODES = COLLEGE_TIERS.map((t) => t.code) as readonly CollegeTierCode[];

/** The tier a plan code names, or null for an ordinary plan. */
export function collegeTierOf(planCode: string | null | undefined) {
  return COLLEGE_TIERS.find((t) => t.code === planCode) ?? null;
}

/**
 * TA-488 (the owner's decision, 14 November 2026): whether a plan may be set on an institution of this kind. An
 * ordinary plan suits every kind; a tier suits only the kinds its list names, so an autonomous college is never
 * put on the affiliated price (a deliberate discount is an ordinary flat-priced plan). Read by assignPlan and
 * updatePlan, and by the web's school page and new-school form to offer only what fits.
 */
export function planSuitsKind(planCode: string | null | undefined, kind: string | null | undefined): boolean {
  const tier = collegeTierOf(planCode);
  return !tier || (tier.suits as readonly string[]).includes(kind ?? "");
}

/** A tier's year for this many students, in paise. */
export function tierYearPaise(planCode: string | null | undefined, students: number): number | null {
  const tier = collegeTierOf(planCode);
  return tier ? tier.perStudentYearPaise * Math.max(0, students) : null;
}

/** A tier's month for this many students — a twelfth of the year, rounded to the paisa — the figure a partner's share is taken of. */
export function tierMonthPaise(planCode: string | null | undefined, students: number): number | null {
  const year = tierYearPaise(planCode, students);
  return year === null ? null : Math.round(year / 12);
}

const iso = z.string().datetime();
const count = z.number().int().min(0);

/** The health numbers of one college, each from its rows (or another builder's function) on read. */
export const collegeHealthSchema = z.object({
  /** Lectures dated in the last seven days (today included), not cancelled. */
  lecturesScheduled: count,
  /** …of which at least one student's attendance is marked. */
  lecturesMarked: count,
  /** Exam sessions whose forms are open (status FORMS). */
  examFormsOpen: count,
  /** Result runs PUBLISHED within the current academic term; null with no term running today. */
  resultsPublishedThisTerm: count.nullable(),
  termName: z.string().nullable(),
  /** The open (or submitted) NAAC cycle's stored CGPA and its band, as the college's own IQAC desk reads it. */
  naac: z.object({ cgpa: z.number().nullable(), grade: z.string().nullable() }).nullable(),
  /** placementSummary (placement-analytics.ts). */
  placement: z.object({ on: z.boolean(), batchYear: z.number().int().nullable(), drivesOpen: count, drivesClosed: count, offers: count, placed: count, finalYear: count, placedPct: z.number().nullable() }),
  /** Scholarship claims APPLIED or SANCTIONED and not yet disbursed. */
  scholarshipsPending: count,
  /** Grievances still OPEN or ACKNOWLEDGED past their due day. */
  grievancesPastDue: count,
});
export type CollegeHealth = z.infer<typeof collegeHealthSchema>;

export const operatorCollegeRowSchema = z.object({
  id: z.string(),
  name: z.string(),
  city: z.string().nullable(),
  kind: institutionKindSchema,
  /** The college's streams (5 Oct 2026), STREAMS order; empty until chosen. */
  streams: z.array(streamSchema).default([]),
  isTestFixture: z.boolean(),
  affiliatingUniversity: z.string().nullable(),
  aisheCode: z.string().nullable(),
  regulators: z.object({ aicte: z.string().nullable(), ugc: z.string().nullable(), naacGrade: z.string().nullable(), naacValidUntil: z.string().nullable() }),
  programmes: z.array(z.object({ code: z.string(), name: z.string(), intake: count })),
  intake: count,
  students: count,
  modulesOn: z.array(schoolModuleSchema),
  subscription: z.object({ status: subscriptionStatusSchema.nullable(), dueAt: z.string().nullable() }),
  plan: z.object({ code: z.string(), name: z.string() }).nullable(),
  /** The tier's year at today's roll, when the plan is a college tier; null otherwise. */
  tierYearPaise: z.number().int().nullable(),
  health: collegeHealthSchema,
});
export type OperatorCollegeRow = z.infer<typeof operatorCollegeRowSchema>;

/** GET /api/v1/operator/colleges — every college (fixtures with ?test=1) with its profile, roll, subscription and health. */
export const operatorCollegesQuerySchema = z.object({ test: z.enum(["0", "1"]).optional() });
export const operatorCollegesSchema = z.object({ today: z.string(), items: z.array(operatorCollegeRowSchema) });
export type OperatorColleges = z.infer<typeof operatorCollegesSchema>;

/** GET /api/v1/operator/schools/{schoolId}/modules — what this institution is offered, on or off, since when and whether the platform switched it. */
export const operatorSchoolModulesSchema = z.object({
  kind: institutionKindSchema,
  modules: z.array(z.object({ module: schoolModuleSchema, on: z.boolean(), alwaysOn: z.boolean(), enabledAt: iso.nullable(), byPlatform: z.boolean() })),
});
export type OperatorSchoolModules = z.infer<typeof operatorSchoolModulesSchema>;
/** POST /api/v1/operator/schools/{schoolId}/modules — switch one module on or off on the institution's behalf. */
export const operatorModuleSwitchBodySchema = z.object({ module: schoolModuleSchema, on: z.boolean() });
export type OperatorModuleSwitchBody = z.infer<typeof operatorModuleSwitchBodySchema>;

/** GET /api/v1/operator/recruiters — every recruiter account, disabled ones included. */
export const operatorRecruitersSchema = z.object({
  items: z.array(
    z.object({
      userId: z.string(),
      name: z.string(),
      email: z.string().nullable(),
      companyName: z.string(),
      createdAt: iso,
      disabledAt: iso.nullable(),
      liveSessions: count,
    }),
  ),
});
export type OperatorRecruiters = z.infer<typeof operatorRecruitersSchema>;
/** POST /api/v1/operator/recruiters/{userId}/standing — shut a recruiter out of every college (and end every session), or let them back. */
export const operatorRecruiterStandingBodySchema = z.object({ disabled: z.boolean(), reason: z.string().max(500).optional() });
export type OperatorRecruiterStandingBody = z.infer<typeof operatorRecruiterStandingBodySchema>;
export const operatorRecruiterStandingSchema = z.object({ ok: z.literal(true), sessionsEnded: count });
