import { z } from "zod";

/**
 * AN EXPERT'S APPLICATION FROM THE LOGIN PAGE (the owner's ask of 15 October 2026).
 *
 * Somebody who wants to mentor pupils applies at /register/expert (the phone, later, through
 * POST /api/v1/public/expert-applications); no account is made, and only the operator turns an
 * application into one. Experts meet minors, so activation is never self-serve: the operator
 * approves (an account, an unpublished profile and the invitation's link that sets the password)
 * or refuses with a coded reason, and the applicant is told by email in their own language.
 * The library is apps/web/src/lib/expert-applications.ts.
 */

/**
 * What an expert can help with, as codes: the application picks one to five. The words are the
 * dictionaries' (`expertApply.specialism<CODE>`); the profile made on approval carries the English
 * words, as every profile's free-text specialisms do.
 */
export const EXPERT_SPECIALISMS = [
  "CAREERS",
  "HIGHER_EDUCATION",
  "MATHEMATICS",
  "SCIENCE",
  "CODING",
  "ENGINEERING",
  "MEDICINE_HEALTH",
  "LAW",
  "COMMERCE_FINANCE",
  "ARTS_DESIGN",
  "MUSIC_PERFORMING",
  "LANGUAGES_WRITING",
  "SPORTS_FITNESS",
  "WELLBEING",
  "LEARNING_SUPPORT",
  "OLYMPIADS",
  "ENTREPRENEURSHIP",
  "AGRICULTURE_ENVIRONMENT",
] as const;
export type ExpertSpecialism = (typeof EXPERT_SPECIALISMS)[number];
export const EXPERT_SPECIALISMS_MAX = 5;

/** The languages an expert can teach in: the platform's three. */
export const EXPERT_TEACHING_LANGUAGES = ["en", "hi", "mr"] as const;

/**
 * What they offer: the ExpertProfile's own list (EXPERT_OFFERINGS in the web app's constants), so
 * the value is copied onto the profile as it stands. SESSIONS: talks and sessions a school or a
 * pupil books; MENTORING: a term with one pupil; BOTH.
 */
export const EXPERT_APPLICATION_OFFERINGS = ["SESSIONS", "MENTORING", "BOTH"] as const;

export const EXPERT_APPLICATION_STATUSES = ["PENDING", "APPROVED", "REFUSED", "WITHDRAWN"] as const;
export type ExpertApplicationStatus = (typeof EXPERT_APPLICATION_STATUSES)[number];

/** Why the operator refused; OTHER carries a note. */
export const EXPERT_APPLICATION_REFUSALS = ["NOT_QUALIFIED", "DOCUMENT_UNCLEAR", "DUPLICATE", "OTHER"] as const;
export type ExpertApplicationRefusal = (typeof EXPERT_APPLICATION_REFUSALS)[number];

export const EXPERT_APPLICATION_LIMITS = { name: 120, city: 80, organisation: 160, headline: 120, bio: 1000, links: 3, link: 300, years: 60 } as const;

/** One PDF, JPG or PNG of at most 5 MB. */
export const EXPERT_APPLICATION_DOCUMENT_MAX_BYTES = 5 * 1024 * 1024;

/**
 * The form's fields (the multipart body's `application` part, as JSON; the file is its `document`
 * part). Shape only: the sentences — a name too short, a phone that is not an Indian mobile, a link
 * that is not https — are the library's, each with the field it is about.
 */
export const expertApplicationBodySchema = z.object({
  name: z.string().max(400),
  email: z.string().max(400),
  phone: z.string().max(40),
  city: z.string().max(400),
  organisation: z.string().max(400).nullable().optional(),
  headline: z.string().max(400),
  specialisms: z.array(z.string().max(40)).max(20),
  languages: z.array(z.string().max(8)).max(10),
  /** Any number: a fraction or one out of range is the library's refusal, with its sentence. */
  yearsExperience: z.number(),
  bio: z.string().max(4000),
  links: z.array(z.string().max(1000)).max(10).default([]),
  offering: z.string().max(20),
  declaration: z.boolean(),
});
export type ExpertApplicationBody = z.infer<typeof expertApplicationBodySchema>;

/** 201 from the public door: no account, only the address the operator will write to. */
export const expertApplicationReceivedSchema = z.object({ ok: z.literal(true), email: z.string() });

/** GET /api/v1/operator/expert-applications — ?status= (PENDING by default). */
export const operatorExpertApplicationsQuerySchema = z.object({ status: z.enum(EXPERT_APPLICATION_STATUSES).optional() });

export const operatorExpertApplicationSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  phone: z.string(),
  city: z.string(),
  organisation: z.string().nullable(),
  headline: z.string(),
  specialisms: z.array(z.string()),
  languages: z.array(z.string()),
  yearsExperience: z.number().int(),
  bio: z.string(),
  links: z.array(z.string()),
  offering: z.string(),
  /** True when a document was sent; it opens at /api/v1/operator/expert-applications/{id}/document. */
  hasDocument: z.boolean(),
  declarationAt: z.string().datetime(),
  status: z.enum(EXPERT_APPLICATION_STATUSES),
  refusalCode: z.enum(EXPERT_APPLICATION_REFUSALS).nullable(),
  refusalNote: z.string().nullable(),
  decidedAt: z.string().datetime().nullable(),
  locale: z.string(),
  createdAt: z.string().datetime(),
});
export type OperatorExpertApplication = z.infer<typeof operatorExpertApplicationSchema>;
export const operatorExpertApplicationsSchema = z.object({ items: z.array(operatorExpertApplicationSchema) });

/** POST /api/v1/operator/expert-applications/{id}/decide. */
export const operatorExpertApplicationDecideBodySchema = z.object({
  decision: z.enum(["APPROVE", "REFUSE"]),
  reason: z.enum(EXPERT_APPLICATION_REFUSALS).optional(),
  note: z.string().trim().max(500).optional(),
});
export type OperatorExpertApplicationDecideBody = z.infer<typeof operatorExpertApplicationDecideBodySchema>;

export const operatorExpertApplicationDecidedSchema = z.object({
  ok: z.literal(true),
  status: z.enum(["APPROVED", "REFUSED"]),
  /** The account made on approval; null when refused, or when the address already had an account the invitation attaches to. */
  userId: z.string().nullable(),
  /** Whether the invitation's email went (approval only; a mail failure leaves the decision standing). */
  inviteSent: z.boolean(),
});
