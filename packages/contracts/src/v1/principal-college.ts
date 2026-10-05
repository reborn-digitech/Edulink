import { z } from "zod";

/**
 * GET /api/v1/principal/college (campaign 2026-10-04, G-4): the college at a
 * glance and what waits for the head's word, for the phone. The same figures
 * as the web's /principal/college, read from the same function
 * (apps/web/src/lib/college-principal.ts): nothing is computed for the phone
 * alone. A module the college has off is a null section. Each approval names
 * the web page where the decision is made; the phone opens it there.
 */
export const PRINCIPAL_COLLEGE_APPROVALS = ["leave", "condonation", "concession", "grace", "lateRegistration", "signoff", "payroll", "refundException", "expulsion"] as const;
export const principalCollegeApprovalSchema = z.object({ key: z.enum(PRINCIPAL_COLLEGE_APPROVALS), count: z.number().int(), href: z.string() });

export const principalCollegeSchema = z.object({
  school: z.object({ name: z.string(), affiliatingUniversity: z.string().nullable() }),
  today: z.string(),
  term: z.object({ id: z.string(), name: z.string() }).nullable(),
  faculty: z.object({ total: z.number().int(), present: z.number().int(), onLeave: z.number().int(), absent: z.number().int(), unmarked: z.number().int(), closed: z.boolean() }).nullable(),
  fees: z.object({ year: z.string().nullable(), demandPaise: z.number().int(), collectedPaise: z.number().int(), outstandingPaise: z.number().int(), defaulters: z.number().int() }).nullable(),
  scholarships: z.object({ applied: z.number().int(), sanctioned: z.number().int(), disbursed: z.number().int(), disbursedPaise: z.number().int() }).nullable(),
  hostel: z.object({ occupancyPercent: z.number(), occupied: z.number().int(), beds: z.number().int() }).nullable(),
  grievances: z.object({ open: z.number().int(), overdue: z.number().int() }).nullable(),
  incidentsOpen: z.number().int().nullable(),
  predictor: z.object({ cgpa: z.number().nullable(), grade: z.string().nullable(), nextGrade: z.string().nullable(), distance: z.number().nullable() }).nullable(),
  lectures: z.array(z.object({ departmentId: z.string(), name: z.string(), lectures: z.number().int(), marked: z.number().int(), presentPercent: z.number().nullable() })),
  approvals: z.array(principalCollegeApprovalSchema),
});
export type PrincipalCollegeGlance = z.infer<typeof principalCollegeSchema>;
