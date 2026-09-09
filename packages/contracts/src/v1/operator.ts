import { z } from "zod";

/**
 * operator: the server operator's pages (the web's /root) and the content
 * team's (the web's /appadmin) as read-only JSON for the phone. Neither
 * person has a school role, so these are the only endpoints they can reach;
 * every write stays on the web. Dates are ISO strings, ids are strings.
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
  /** live (default): not removed; removed; noadmin: live with an admin invite still pending; all. */
  state: z.enum(["live", "removed", "noadmin", "all"]).default("live"),
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
  pendingAdminInvites: count,
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
  counts: z.object({ live: count, removed: count, noAdmin: count, appAdmins: count, expertsWaiting: count }),
  /** Live first, newest first, at most 200 — narrowed by the query's q and state. */
  schools: z.array(operatorSchoolSchema),
  jobs: z.array(operatorJobSchema),
});
export type OperatorOverview = z.infer<typeof operatorOverviewSchema>;

/* ---------------------------------------------------------------------- */
/* /root/audit — the server log                                            */
/* ---------------------------------------------------------------------- */

export const operatorAuditQuerySchema = z.object({ limit: z.coerce.number().int().min(1).max(200).default(50) });

export const operatorAuditSchema = z.object({
  items: z.array(
    z.object({
      id,
      at: iso,
      action: z.string(),
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
