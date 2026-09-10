/** community: request and response shapes for the phone's remaining screens. Area-prefixed export names. */
import { z } from "zod";

/**
 * community: the flows the phone used to hand to the web — setting up
 * mentoring (a pupil asking, the school pairing and deciding, a guardian
 * agreeing, either ending it), closing an enquiry, a school's public
 * profile, one vacancy, and a guardian linking a child. Dates travel as ISO
 * strings; every body is the one the web's server action takes.
 */

const cuid = z.string().regex(/^c[a-z0-9]{20,}$/, "id");
const iso = z.string().datetime();
const count = z.number().int().nonnegative();

/* -------------------------------------------------------------------------- */
/* Mentoring                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * GET /api/v1/community/mentoring/options — what the set-up screen offers
 * this reader: staff (admin, teacher) the pairing lists, a pupil the mentors
 * they may ask and how many of their asks are still waiting. Everyone else
 * gets empty lists, as the web page fetches nothing for them.
 */
export const communityMentoringOptionsSchema = z.object({
  pairing: z.object({
    experts: z.array(z.object({ id: z.string(), name: z.string(), headline: z.string(), verified: z.boolean() })),
    pupils: z.array(z.object({ id: z.string(), name: z.string() })),
  }),
  askable: z.array(
    z.object({ id: z.string(), name: z.string(), headline: z.string(), bio: z.string(), specialisms: z.array(z.string()), verified: z.boolean() }),
  ),
  openRequests: count,
  maxOpenRequests: count,
});
export type CommunityMentoringOptions = z.infer<typeof communityMentoringOptionsSchema>;

/** POST /api/v1/community/mentoring/pair — staff pair a pupil with a published expert; a guardian is asked next. */
export const communityMentorPairSchema = z.object({
  expertProfileId: cuid,
  studentMembershipId: cuid,
  purpose: z.string().trim().min(5).max(1_000),
});

/**
 * POST /api/v1/community/mentoring/ask — a pupil asks their school for a
 * mentor. The purpose is not length-checked here: the library says "a bit
 * more" in the pupil's own words, and that sentence should reach them.
 */
export const communityMentorAskSchema = z.object({
  expertProfileId: cuid,
  purpose: z.string().max(2_000),
});

/** POST /api/v1/community/mentoring/{threadId}/decide — the office agrees (a guardian is asked) or declines with a reason the pupil reads. */
export const communityMentorDecideSchema = z.object({
  approve: z.boolean(),
  reason: z.string().trim().max(1_000).optional(),
});

/** The pair and the ask answer with the thread they made (or found). */
export const communityMentorThreadSchema = z.object({ threadId: z.string() });

/* -------------------------------------------------------------------------- */
/* A school's public profile                                                   */
/* -------------------------------------------------------------------------- */

/**
 * GET /api/v1/community/schools/{schoolId} — the prospectus: the school's
 * own words, counts and only counts, public standings, its latest
 * platform-wide posts and open vacancies; for a guardian, whether they may
 * ask about admission and the thread they already have open.
 */
export const communitySchoolProfileSchema = z.object({
  schoolId: z.string(),
  name: z.string(),
  city: z.string().nullable(),
  region: z.string().nullable(),
  country: z.string().nullable(),
  addressLine: z.string().nullable(),
  postalCode: z.string().nullable(),
  website: z.string().nullable(),
  logoPath: z.string().nullable(),
  gradeLow: z.string().nullable(),
  gradeHigh: z.string().nullable(),
  about: z.string(),
  openVacancies: count,
  ours: z.boolean(),
  published: z.boolean(),
  verified: z.boolean(),
  sinceYear: z.number().int(),
  metrics: z.object({ pupils: count, teachers: count, classes: count }),
  achievements: z.array(z.object({ competitionTitle: z.string(), bestRank: z.number().int().nullable(), participants: count })),
  highlights: z.array(z.object({ id: z.string(), title: z.string(), category: z.string(), createdAt: iso })),
  canEnquire: z.boolean(),
  vacancies: z.array(z.object({ id: z.string(), title: z.string(), employmentType: z.string(), createdAt: iso })),
  /** The reader's own open admissions thread with this school, if any. */
  myEnquiryId: z.string().nullable(),
});
export type CommunitySchoolProfile = z.infer<typeof communitySchoolProfileSchema>;

/* -------------------------------------------------------------------------- */
/* One vacancy                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * GET /api/v1/community/vacancies/{postingId} — the advertisement and the
 * school behind it; for a teacher of another school, whether they may ask
 * and the thread they already have; for the posting school's own staff, the
 * contact's name and how many enquiries the post has drawn.
 */
export const communityVacancySchema = z.object({
  id: z.string(),
  title: z.string(),
  body: z.string(),
  subjects: z.array(z.string()),
  employmentType: z.string(),
  status: z.string(),
  createdAt: iso,
  schoolId: z.string(),
  schoolName: z.string(),
  city: z.string().nullable(),
  region: z.string().nullable(),
  logoPath: z.string().nullable(),
  ours: z.boolean(),
  canEnquire: z.boolean(),
  contactName: z.string().nullable(),
  enquiryCount: count.nullable(),
  myEnquiryId: z.string().nullable(),
  /**
   * For the posting school's own staff: the enquiries this post drew, as far
   * as the reader's desk reaches (the office and the head all of them, the
   * hiring contact theirs) — newest first. Empty for everyone else.
   */
  enquiries: z.array(z.object({ id: z.string(), fromName: z.string(), status: z.string(), lastMessageAt: iso, lastMessagePreview: z.string(), unread: z.boolean() })),
});
export type CommunityVacancy = z.infer<typeof communityVacancySchema>;

/* -------------------------------------------------------------------------- */
/* A guardian linking a child                                                  */
/* -------------------------------------------------------------------------- */

export const guardianRelationSchema = z.enum(["PARENT", "GUARDIAN", "OTHER"]);

/** GET /api/v1/community/link-child — the children this account is already linked to. */
export const communityLinkChildPageSchema = z.object({
  children: z.array(z.object({ guardianshipId: z.string(), name: z.string(), schoolName: z.string() })),
});

/** POST /api/v1/community/link-child — both factors: the code off the letter home, and the child's date of birth. */
export const communityLinkChildSchema = z.object({
  studentCode: z.string().trim().min(6).max(32),
  birthdate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "date"),
  relation: guardianRelationSchema.default("PARENT"),
});

export const communityChildLinkedSchema = z.object({ child: z.object({ name: z.string(), schoolName: z.string() }) });
