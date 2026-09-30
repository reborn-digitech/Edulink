import { z } from "zod";

/**
 * operator: the server operator's pages (the web's /root) and the content
 * team's (the web's /appadmin) as JSON for the phone. Neither person has a
 * school role, so these are the only endpoints they can reach. The operator's
 * writes — a school's details, its admin invitations, removing and restoring
 * it, the expert queue, the content team — are here too; erasing a school
 * entirely stays on the web on purpose. Dates are ISO strings, ids strings.
 */

const iso = z.string().datetime();
const isoOrNull = iso.nullable();
const id = z.string().min(1).max(64);
const count = z.number().int().min(0);

/* ---------------------------------------------------------------------- */
/* /root — schools and jobs                                                */
/* ---------------------------------------------------------------------- */

export const operatorOverviewQuerySchema = z.object({
  q: z.string().trim().max(200).optional(),
  /** live (default): not removed; removed; noadmin: live with an admin invite still pending; unverified: live and not yet checked by the operator; all. */
  state: z.enum(["live", "removed", "noadmin", "unverified", "test", "all"]).default("live"),
});
export type OperatorOverviewQuery = z.infer<typeof operatorOverviewQuerySchema>;

export const operatorSchoolSchema = z.object({
  id,
  name: z.string(),
  city: z.string().nullable(),
  country: z.string().nullable(),
  code: z.string(),
  gradeLow: z.string().nullable(),
  gradeHigh: z.string().nullable(),
  createdAt: iso,
  removedAt: isoOrNull,
  /** When the operator marked the school checked; null while it waits. */
  verifiedAt: isoOrNull,
  pendingAdminInvites: count,
  /** A school the tests make; the list's default state leaves these out. */
  isTestFixture: z.boolean().default(false),
});
export type OperatorSchool = z.infer<typeof operatorSchoolSchema>;

export const operatorJobSchema = z.object({
  name: z.string(),
  /** Five-field crontab schedule. */
  schedule: z.string(),
  /** A dictionary key (root.jobDesc…) the phone renders in the reader's language. */
  describeKey: z.string(),
  lastRun: z
    .object({ startedAt: iso, finishedAt: isoOrNull, ok: z.boolean().nullable(), summary: z.string(), error: z.string().nullable() })
    .nullable(),
  lastSuccessAt: isoOrNull,
  overdue: z.boolean(),
  lastFailed: z.boolean(),
  running: z.boolean(),
});
export type OperatorJob = z.infer<typeof operatorJobSchema>;

export const operatorOverviewSchema = z.object({
  counts: z.object({ live: count, removed: count, noAdmin: count, unverified: count, appAdmins: count, expertsWaiting: count }),
  /** Live first, newest first, at most 200 — narrowed by the query's q and state. */
  schools: z.array(operatorSchoolSchema),
  jobs: z.array(operatorJobSchema),
});
export type OperatorOverview = z.infer<typeof operatorOverviewSchema>;

/* ---------------------------------------------------------------------- */
/* /root/audit — the server log                                            */
/* ---------------------------------------------------------------------- */

const dayKey = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

/**
 * The web's /root/audit filters, in the query: an exact action or a family
 * with a trailing dot ("superuser."), a search over person, school, email and
 * IP, a UTC date range (both ends inclusive), only accounts that still exist,
 * and a 1-based page of `limit` rows. `?limit=` alone still means what it did.
 */
export const operatorAuditQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).default(50),
  page: z.coerce.number().int().min(1).max(10_000).default(1),
  action: z.string().trim().max(120).optional(),
  q: z.string().trim().max(200).optional(),
  from: dayKey.optional(),
  to: dayKey.optional(),
  live: z.enum(["0", "1"]).optional(),
});
export type OperatorAuditQuery = z.infer<typeof operatorAuditQuerySchema>;

export const operatorAuditSchema = z.object({
  items: z.array(
    z.object({
      id,
      at: iso,
      action: z.string(),
      /** A dictionary key (audit.…) naming the action in the reader's language; null for one with no label. */
      actionKey: z.string().nullable(),
      /** Null for a script with no actor (system) and for an actor whose account is gone. */
      actorName: z.string().nullable(),
      /** True when no account did this — a script or a job. */
      system: z.boolean(),
      /** The school the row names, when it names one. */
      schoolName: z.string().nullable(),
      ip: z.string().nullable(),
      /** The row's details in one line: the email invited, the reason given. */
      summary: z.string().nullable(),
    }),
  ),
  /** Every row the filters match, across pages. */
  total: count,
  /** Every action present in the server log, for the filter menu. */
  actions: z.array(z.string()),
});
export type OperatorAudit = z.infer<typeof operatorAuditSchema>;

/* ---------------------------------------------------------------------- */
/* /root/experts — the curation queue                                      */
/* ---------------------------------------------------------------------- */

export const operatorExpertsSchema = z.object({
  /** Unpublished first: that is the queue. */
  items: z.array(
    z.object({
      profileId: id,
      name: z.string(),
      email: z.string().nullable(),
      headline: z.string(),
      organisation: z.string().nullable(),
      specialisms: z.array(z.string()),
      offering: z.string(),
      mentorCapacity: z.number().int().nullable(),
      activeMentorships: count,
      publishedAt: isoOrNull,
      verifiedAt: isoOrNull,
      createdAt: iso,
    }),
  ),
});
export type OperatorExperts = z.infer<typeof operatorExpertsSchema>;

/* ---------------------------------------------------------------------- */
/* /root/[schoolId] — one school: details, invitations, removal            */
/* ---------------------------------------------------------------------- */

const optionalText = (max: number) => z.string().trim().max(max).nullable().optional();

/**
 * The web's school form (root/school-form.tsx): creating and correcting are
 * the same fields. The lib is the gate for what a sentence can say better —
 * a name under two letters, an empty contact email, a lowest grade above the
 * highest — so those arrive as 422 with its words, not as a bare "check the form".
 */
export const operatorSchoolDetailsBodySchema = z.object({
  name: z.string().max(200),
  contactEmail: z.string().trim().max(320),
  contactPhone: optionalText(40),
  website: optionalText(300),
  addressLine: optionalText(300),
  city: optionalText(120),
  region: optionalText(120),
  postalCode: optionalText(20),
  country: optionalText(120),
  gradeLow: optionalText(20),
  gradeHigh: optionalText(20),
  /** An IANA zone; every attendance date is resolved against it. */
  timezone: z.string().trim().min(1).max(64),
});
export type OperatorSchoolDetailsBody = z.infer<typeof operatorSchoolDetailsBodySchema>;

/** A correction sends only what it changes — updateSchool takes a partial. */
export const operatorSchoolUpdateBodySchema = operatorSchoolDetailsBodySchema.partial();
export type OperatorSchoolUpdateBody = z.infer<typeof operatorSchoolUpdateBodySchema>;

export const operatorSchoolCreatedSchema = z.object({ ok: z.literal(true), schoolId: id, code: z.string() });
export type OperatorSchoolCreated = z.infer<typeof operatorSchoolCreatedSchema>;

export const operatorSchoolDetailSchema = z.object({
  school: z.object({
    id,
    name: z.string(),
    code: z.string(),
    contactEmail: z.string(),
    contactPhone: z.string().nullable(),
    website: z.string().nullable(),
    addressLine: z.string().nullable(),
    city: z.string().nullable(),
    region: z.string().nullable(),
    postalCode: z.string().nullable(),
    country: z.string().nullable(),
    gradeLow: z.string().nullable(),
    gradeHigh: z.string().nullable(),
    timezone: z.string(),
    createdAt: iso,
    removedAt: isoOrNull,
    /** When the operator marked the school checked; null while it waits. */
    verifiedAt: isoOrNull,
  }),
  /** Its administrator and principal invitations, newest first, at most 50. */
  invites: z.array(
    z.object({
      id,
      email: z.string().nullable(),
      name: z.string().nullable(),
      /** ADMIN or PRINCIPAL. */
      role: z.string(),
      /** PENDING, ACCEPTED, REVOKED or EXPIRED. */
      status: z.string(),
      createdAt: iso,
      expiresAt: iso,
    }),
  ),
  /** Every time the school has been opened by the operator, newest first — the list the school reads too. */
  access: z.array(z.object({ id, operatorName: z.string(), reason: z.string(), startedAt: iso, live: z.boolean() })),
});
export type OperatorSchoolDetail = z.infer<typeof operatorSchoolDetailSchema>;

/**
 * Removal asks for the school's exact name, and the name travels with the
 * request so the server checks it too: the dialog is a courtesy, the handler
 * is the gate — a POST is its own entry point.
 */
export const operatorSchoolRemoveBodySchema = z.object({ confirmName: z.string().max(200) });
export type OperatorSchoolRemoveBody = z.infer<typeof operatorSchoolRemoveBodySchema>;

/**
 * The operator's mark that a school has been checked, given or withdrawn. It
 * is what lets a school bring over a pupil who already has an account, by
 * student code or PEN; a school already in the state asked for is left as it is.
 */
export const operatorSchoolVerificationBodySchema = z.object({ verified: z.boolean() });
export type OperatorSchoolVerificationBody = z.infer<typeof operatorSchoolVerificationBodySchema>;

export const operatorInviteAdminBodySchema = z.object({
  email: z.string().trim().max(320),
  name: z.string().trim().max(120).optional(),
  role: z.enum(["ADMIN", "PRINCIPAL"]).default("ADMIN"),
});
export type OperatorInviteAdminBody = z.infer<typeof operatorInviteAdminBodySchema>;

/* ---------------------------------------------------------------------- */
/* /root/experts — an expert's standing                                    */
/* ---------------------------------------------------------------------- */

/** Published ("may schools find them") and verified ("has a human checked who they are") travel together, as on the web. */
export const operatorExpertStandingBodySchema = z.object({ published: z.boolean(), verified: z.boolean() });
export type OperatorExpertStandingBody = z.infer<typeof operatorExpertStandingBodySchema>;

/* ---------------------------------------------------------------------- */
/* /root/content-team — who holds the content-team flag                    */
/* ---------------------------------------------------------------------- */

export const operatorContentTeamSchema = z.object({
  items: z.array(
    z.object({
      id,
      name: z.string(),
      email: z.string().nullable(),
      /** The account is disabled; the flag is still on it. */
      disabled: z.boolean(),
      /** Also runs the server. */
      isOperator: z.boolean(),
      /** The person asking. */
      you: z.boolean(),
    }),
  ),
});
export type OperatorContentTeam = z.infer<typeof operatorContentTeamSchema>;

/** Appoint by email, to an account that already exists — the person registers first. */
export const operatorAppointBodySchema = z.object({ email: z.string().trim().max(320) });
export type OperatorAppointBody = z.infer<typeof operatorAppointBodySchema>;

/* ---------------------------------------------------------------------- */
/* /appadmin — platform competitions                                       */
/* ---------------------------------------------------------------------- */

export const appAdminCompetitionStatusSchema = z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]);

export const appAdminCompetitionsSchema = z.object({
  items: z.array(
    z.object({
      id,
      title: z.string(),
      summary: z.string(),
      status: appAdminCompetitionStatusSchema,
      organizerName: z.string(),
      registrationClosesAt: isoOrNull,
      createdAt: iso,
    }),
  ),
});
export type AppAdminCompetitions = z.infer<typeof appAdminCompetitionsSchema>;

/** GET /api/v1/operator/retention — the sweep's day counts and what is waiting for tonight. */
const retentionCount = z.number().int().min(0);
export const operatorRetentionSchema = z.object({
  config: z.object({ sessionDays: retentionCount, tokenDays: retentionCount, rateLimitDays: retentionCount, uploadTicketDays: retentionCount, outboxDays: retentionCount, jobRunDays: retentionCount, auditDays: retentionCount }),
  pending: z.object({ sessions: retentionCount, tokens: retentionCount, rateLimits: retentionCount, uploadTickets: retentionCount, outbox: retentionCount, jobRuns: retentionCount, auditRows: retentionCount }),
});
export type OperatorRetention = z.infer<typeof operatorRetentionSchema>;
