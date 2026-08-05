import type { TranslationKey } from "./i18n/dictionary";

/**
 * Single source of truth for every status/role string in the database.
 *
 * SQLite has no native enums and the schema stays portable by using String
 * columns (see prisma/schema.prisma). That safety has to be paid back here:
 * these const tuples feed both the TypeScript unions and the zod validators,
 * so an invalid value cannot reach a write.
 */

/**
 * Every role a SESSION can be acting as.
 *
 * EXPERT is here and deliberately NOT in SCHOOL_ROLES below: an expert has no
 * Membership row, belongs to no school, and reaches a school only through a
 * confirmed booking. Adding them here is what lets `requireExpert()`, the nav
 * and the switcher treat them as a first-class signed-in actor; leaving them
 * out of SCHOOL_ROLES is what stops any of the membership machinery trying to
 * enrol them somewhere.
 */
export const ROLES = ["ADMIN", "PRINCIPAL", "TEACHER", "STUDENT", "PARENT", "EXPERT"] as const;
export type Role = (typeof ROLES)[number];

/**
 * Roles that exist as a Membership row. PARENT is modelled by Guardianship.
 *
 * PRINCIPAL is a PEER OF ADMIN, not a rank above it, and the split is the one a
 * school actually runs on. The admin sets the school up — classes, sections, who
 * teaches what, who takes which register. The principal reads what came out of
 * it and decides who may be away. Neither can do the other's job, which is why
 * this is two roles and not a seniority flag on one.
 */
export const SCHOOL_ROLES = ["ADMIN", "PRINCIPAL", "TEACHER", "STUDENT"] as const;
export type SchoolRole = (typeof SCHOOL_ROLES)[number];

export const MEMBERSHIP_STATUSES = ["PENDING", "ACTIVE", "SUSPENDED"] as const;
export type MembershipStatus = (typeof MEMBERSHIP_STATUSES)[number];

export const ATTENDANCE_STATUSES = ["PRESENT", "LATE", "ABSENT", "EXCUSED"] as const;
export type AttendanceStatus = (typeof ATTENDANCE_STATUSES)[number];

export const SUBMISSION_STATUSES = ["DRAFT", "SUBMITTED", "RETURNED"] as const;
export type SubmissionStatus = (typeof SUBMISSION_STATUSES)[number];

export const POST_SCOPES = ["CLASS", "SCHOOL", "GLOBAL"] as const;
export type PostScope = (typeof POST_SCOPES)[number];

export const POST_STATUSES = ["DRAFT", "PENDING", "APPROVED", "REJECTED"] as const;
export type PostStatus = (typeof POST_STATUSES)[number];

export const REACTION_KINDS = ["CLAP", "STAR", "IDEA", "HEART"] as const;
export type ReactionKind = (typeof REACTION_KINDS)[number];

export const INVITE_STATUSES = ["PENDING", "ACCEPTED", "REVOKED", "EXPIRED"] as const;
export type InviteStatus = (typeof INVITE_STATUSES)[number];

export const AUTH_TOKEN_PURPOSES = [
  "MAGIC_LINK",
  "EMAIL_VERIFY",
  "PASSWORD_RESET",
  "PARENT_CLAIM",
] as const;
export type AuthTokenPurpose = (typeof AUTH_TOKEN_PURPOSES)[number];

export const NOTIFICATION_KINDS = [
  "EXPERT",
  "ATTENDANCE",
  "GRADE",
  "ASSIGNMENT",
  "REMARK",
  "POST",
  "INVITE",
  "COMPETITION",
  "SYSTEM",
] as const;
export type NotificationKind = (typeof NOTIFICATION_KINDS)[number];

export const COMPETITION_ENTRY_STATUSES = ["REGISTERED", "SUBMITTED", "RESULTS"] as const;
export type CompetitionEntryStatus = (typeof COMPETITION_ENTRY_STATUSES)[number];

export const GUARDIAN_RELATIONS = ["PARENT", "GUARDIAN", "OTHER"] as const;

/**
 * What an expert is offering, which is not one thing.
 *
 * A one-off workshop for a hall and a term of mentoring one child are different
 * commitments, and somebody willing to do the first is not thereby willing to do
 * the second. Before this every published expert was silently offered for both.
 */
export const EXPERT_OFFERINGS = ["SESSIONS", "MENTORING", "BOTH"] as const;
export type ExpertOffering = (typeof EXPERT_OFFERINGS)[number];

export const EXPERT_OFFERING_META: Record<ExpertOffering, { label: string; hint: string }> = {
  SESSIONS: {
    label: "Workshops and sessions",
    hint: "One-off talks or virtual sessions a school books for a class or a year group.",
  },
  MENTORING: {
    label: "Mentoring one child at a time",
    hint: "A continuing relationship with one pupil, with their guardian's agreement.",
  },
  BOTH: { label: "Both", hint: "Available for sessions and for mentoring." },
};
export type GuardianRelation = (typeof GUARDIAN_RELATIONS)[number];

/* -------------------------------------------------------------------------- */
/* Presentation metadata                                                       */
/* -------------------------------------------------------------------------- */

export const ATTENDANCE_META: Record<
  AttendanceStatus,
  { label: string; short: string; token: string; softToken: string; hint: string }
> = {
  PRESENT: {
    label: "Present",
    short: "P",
    token: "present",
    softToken: "present-soft",
    hint: "Here on time",
  },
  LATE: {
    label: "Late",
    short: "L",
    token: "late",
    softToken: "late-soft",
    hint: "Arrived after the bell",
  },
  ABSENT: {
    label: "Absent",
    short: "A",
    token: "absent",
    softToken: "absent-soft",
    hint: "Not here, no reason given",
  },
  EXCUSED: {
    label: "Excused",
    short: "E",
    token: "excused",
    softToken: "excused-soft",
    hint: "Away with a known reason",
  },
};

/**
 * How a role is shown. KEYS, NOT WORDS — the label is looked up through `t`.
 *
 * A role badge appears on a bulletin post, in the directory, on an invite, in
 * the side rail and in the switcher. That makes these the most-rendered strings
 * in the app and the ones most obviously wrong if the rest of the page changed
 * language and they did not. `accent` stays a literal because it names a CSS
 * token, which is not language at all.
 */
export const ROLE_META: Record<
  Role,
  { labelKey: TranslationKey; pluralKey: TranslationKey; accent: string }
> = {
  ADMIN: { labelKey: "role.admin", pluralKey: "role.adminPlural", accent: "admin" },
  PRINCIPAL: { labelKey: "role.principal", pluralKey: "role.principalPlural", accent: "admin" },
  TEACHER: { labelKey: "role.teacher", pluralKey: "role.teacherPlural", accent: "teacher" },
  STUDENT: { labelKey: "role.student", pluralKey: "role.studentPlural", accent: "student" },
  PARENT: { labelKey: "role.parent", pluralKey: "role.parentPlural", accent: "parent" },
  EXPERT: { labelKey: "role.expert", pluralKey: "role.expertPlural", accent: "teacher" },
};

/** Where each role lands after login. */
export const ROLE_HOME: Record<Role, string> = {
  ADMIN: "/admin",
  PRINCIPAL: "/principal",
  TEACHER: "/teacher",
  STUDENT: "/student",
  PARENT: "/parent",
  EXPERT: "/expert",
};

/* -------------------------------------------------------------------------- */
/* Lifetimes                                                                   */
/* -------------------------------------------------------------------------- */

export const SESSION_TTL_DAYS = 30;
export const MAGIC_LINK_TTL_MINUTES = 20;
export const INVITE_TTL_DAYS = 14;
export const EMAIL_VERIFY_TTL_HOURS = 48;

export const SESSION_COOKIE = "edulink_session";

/** Age below which parental consent gates apply. (§6 COPPA / GDPR-K) */
export const CONSENT_AGE = 13;
