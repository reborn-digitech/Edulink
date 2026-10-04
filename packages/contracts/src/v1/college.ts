import { z } from "zod";
import { GLOBAL_FEED_KIND_CHOICES, institutionKindSchema } from "./modules";
import { streamListSchema, streamSchema } from "./streams";

/**
 * college: the shapes of the college foundation's doors (the owner's plan of
 * 4 October 2026) — an adult student's grants to their guardians, a
 * recruiter's own account, a college's profile, and the global feed's kind
 * filter. The college modules' own doors (academics, exams, IQAC, placement,
 * admissions, scholarships) live in files of their own.
 */

/**
 * WHAT AN ADULT STUDENT LETS A GUARDIAN SEE (4 October 2026), one grant at a
 * time and revocable whenever they like (src/lib/student-consent.ts). A minor's
 * guardian sees everything without asking, as at a school.
 */
export const STUDENT_CONSENT_GRANTS = ["ATTENDANCE", "RESULTS", "MONEY", "HOSTEL_TRANSPORT", "PLACEMENT", "MESSAGES"] as const;
export const studentConsentGrantSchema = z.enum(STUDENT_CONSENT_GRANTS);
export type StudentConsentGrant = z.infer<typeof studentConsentGrantSchema>;

/** GET /api/v1/student/consent — the reader's grants, and whether their guardians need them at all. */
export const studentConsentSchema = z.object({
  /** False for a minor, or a pupil at a school: the guardian sees everything and the grants are not asked. */
  applies: z.boolean(),
  grants: z.array(z.object({ grant: studentConsentGrantSchema, on: z.boolean(), grantedAt: z.string().datetime().nullable() })),
  guardians: z.array(z.object({ name: z.string() })),
});
export type StudentConsent = z.infer<typeof studentConsentSchema>;

/** POST /api/v1/student/consent — grant or revoke one. */
export const studentConsentSetSchema = z.object({ grant: studentConsentGrantSchema, on: z.boolean() });

/** POST /api/v1/auth/recruiter/register — a recruiter's own account (never invited). */
export const recruiterRegisterSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(200),
  password: z.string().min(8).max(200),
  companyName: z.string().trim().min(2).max(160),
  device: z.string().trim().max(120).optional(),
});
export type RecruiterRegister = z.infer<typeof recruiterRegisterSchema>;

/**
 * NAAC's grades as the council awards them (the revised accreditation
 * framework's seven-point scale), and NIRF's ranking categories a college
 * can file under. Coded, never free text: the IQAC desk and the filings read
 * them.
 */
export const NAAC_GRADES = ["A++", "A+", "A", "B++", "B+", "B", "C", "D"] as const;
export const naacGradeSchema = z.enum(NAAC_GRADES);
export const NIRF_CATEGORIES = ["OVERALL", "COLLEGE", "ENGINEERING", "MANAGEMENT", "PHARMACY", "LAW", "MEDICAL", "ARCHITECTURE", "DENTAL", "AGRICULTURE", "RESEARCH", "INNOVATION"] as const;
export const nirfCategorySchema = z.enum(NIRF_CATEGORIES);

/** GET /api/v1/admin/college-profile — the college's regulator references, as the office keeps them. */
export const collegeProfileSchema = z.object({
  kind: institutionKindSchema,
  /** The college's streams (5 Oct 2026), STREAMS order. */
  streams: z.array(streamSchema).default([]),
  affiliatingUniversity: z.string().nullable(),
  aisheCode: z.string().nullable(),
  aicteApprovalRef: z.string().nullable(),
  ugcApprovalRef: z.string().nullable(),
  naacGrade: naacGradeSchema.nullable(),
  /** YYYY-MM-DD. */
  naacValidUntil: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
  nirfCategory: nirfCategorySchema.nullable(),
});
export type CollegeProfile = z.infer<typeof collegeProfileSchema>;

const ref = (max: number) => z.string().trim().max(max).nullable().optional();
/** POST /api/v1/admin/college-profile — a key left out stays as it was; null clears it. */
export const collegeProfileSetSchema = z.object({
  /** The college's streams, the whole list (5 Oct 2026): at least one; audited as college.streams.set. */
  streams: streamListSchema.optional(),
  affiliatingUniversity: ref(200),
  /** AISHE's code: a letter, a hyphen and digits (C-12345, S-1234, U-0123). */
  aisheCode: z.string().trim().regex(/^[CSU]-\d{3,7}$/).nullable().optional(),
  aicteApprovalRef: ref(120),
  ugcApprovalRef: ref(120),
  naacGrade: naacGradeSchema.nullable().optional(),
  naacValidUntil: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  nirfCategory: nirfCategorySchema.nullable().optional(),
});
export type CollegeProfileSet = z.infer<typeof collegeProfileSetSchema>;

/** GET and POST /api/v1/admin/feed-kinds — which kinds of institution this tenant's people read on the global feed. */
export const globalFeedKindsSchema = z.object({ choice: z.enum(GLOBAL_FEED_KIND_CHOICES) });
export type GlobalFeedKinds = z.infer<typeof globalFeedKindsSchema>;

/** GET /api/v1/recruiter/me — the recruiter's own account. */
export const recruiterMeSchema = z.object({
  name: z.string(),
  companyName: z.string(),
  createdAt: z.string().datetime(),
  emailVerified: z.boolean(),
});
export type RecruiterMe = z.infer<typeof recruiterMeSchema>;
