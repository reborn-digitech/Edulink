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
export const ROLES = [
  "ADMIN", "PRINCIPAL", "TEACHER", "STUDENT", "PARENT", "EXPERT", "DRIVER", "LIBRARIAN", "WARDEN", "ALUMNUS",
  // The college's seven (4 Oct 2026): six staff Memberships, and the recruiter — an outside account like EXPERT.
  "FACULTY", "HOD", "EXAM_CONTROLLER", "IQAC", "TPO", "ACCOUNTS", "RECRUITER",
] as const;
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
export const SCHOOL_ROLES = [
  "ADMIN", "PRINCIPAL", "TEACHER", "STUDENT", "DRIVER", "LIBRARIAN", "WARDEN", "ALUMNUS",
  "FACULTY", "HOD", "EXAM_CONTROLLER", "IQAC", "TPO", "ACCOUNTS",
] as const;
export type SchoolRole = (typeof SCHOOL_ROLES)[number];

/**
 * THE FOUR ROLES THAT CAME WITH THE MODULES (3 October 2026): a bus driver or
 * attendant, the library's desk, a hostel's warden, and a former pupil. Each
 * is a Membership like a teacher's, and each is LIMITED: it reaches only the
 * doors its module names, whatever a library function would let a role it has
 * never heard of do. The gate is `role-gate.ts`, read by `getSession`: on an
 * /api/v1 door the catalog does not open to the role it answers 403, and on
 * a school page outside the role's own nav the session carries no school.
 *
 * Everything written before them branches on the four roles below, and many
 * of those branches fall through to "an admin sees everything" for a role
 * they do not name — which is why the gate is a default-deny and not a list
 * of the places to patch.
 */
export const MODULE_ROLES = ["DRIVER", "LIBRARIAN", "WARDEN", "ALUMNUS"] as const;
export type ModuleRole = (typeof MODULE_ROLES)[number];
export function isModuleRole(role: string | null | undefined): role is ModuleRole {
  return role !== null && role !== undefined && (MODULE_ROLES as readonly string[]).includes(role);
}

/**
 * THE COLLEGE'S SIX STAFF ROLES (4 October 2026): FACULTY (a college teacher;
 * TEACHER stays for schools and junior colleges), HOD, EXAM_CONTROLLER, IQAC,
 * TPO and ACCOUNTS. Memberships at a college, behind the same default-deny
 * gate as the module roles (role-gate.ts): each passes only the doors that
 * name it. Mirrors COLLEGE_ROLES in packages/contracts.
 */
export const COLLEGE_ROLES = ["FACULTY", "HOD", "EXAM_CONTROLLER", "IQAC", "TPO", "ACCOUNTS"] as const;
export type CollegeRole = (typeof COLLEGE_ROLES)[number];
export function isCollegeRole(role: string | null | undefined): role is CollegeRole {
  return role !== null && role !== undefined && (COLLEGE_ROLES as readonly string[]).includes(role);
}

/**
 * EVERY ROLE BEHIND THE DEFAULT-DENY GATE: the four module roles, the
 * college's six, and the RECRUITER (an outside account with no school, which
 * reaches a college only through a placement drive). role-gate.ts refuses
 * such a role every /api/v1 door that does not name it, and every school page
 * outside its own home and NAV.
 */
export const LIMITED_ROLES = [...MODULE_ROLES, ...COLLEGE_ROLES, "RECRUITER"] as const;
export type LimitedRole = (typeof LIMITED_ROLES)[number];
export function isLimitedRole(role: string | null | undefined): role is LimitedRole {
  return role !== null && role !== undefined && (LIMITED_ROLES as readonly string[]).includes(role);
}

/**
 * The roles that TEACH: a school's teacher, and a college's faculty and head
 * of department. The class, pupil and assignment assertions (tenancy.ts) and
 * the feed (bulletin.ts) scope FACULTY and HOD exactly as a TEACHER — to the
 * classes they are assigned — once a door names them; the academics builder
 * gives the HOD the department's read on top.
 */
export const TEACHING_ROLES = ["TEACHER", "FACULTY", "HOD"] as const;
export function isTeachingRole(role: string | null | undefined): role is (typeof TEACHING_ROLES)[number] {
  return role !== null && role !== undefined && (TEACHING_ROLES as readonly string[]).includes(role);
}

/** The roles with no school of their own, which a session carries with no school: the expert and the recruiter (and a guardian, by Guardianship). */
export const OUTSIDE_ROLES = ["EXPERT", "RECRUITER"] as const;
export function isOutsideRole(role: string | null | undefined): boolean {
  return role === "EXPERT" || role === "RECRUITER";
}

/** The school roles every feature before the modules was written for. */
export const CORE_SCHOOL_ROLES = ["ADMIN", "PRINCIPAL", "TEACHER", "STUDENT"] as const;
export function isCoreSchoolRole(role: string | null | undefined): role is (typeof CORE_SCHOOL_ROLES)[number] {
  return role !== null && role !== undefined && (CORE_SCHOOL_ROLES as readonly string[]).includes(role);
}

/**
 * Who the office may invite. Every school role but the ALUMNUS, who is never
 * invited: a former pupil's alumni membership is made by their departure
 * (`school-record.ts` recordDeparture) and by nothing else.
 */
export const INVITABLE_ROLES = ["ADMIN", "PRINCIPAL", "TEACHER", "STUDENT", "DRIVER", "LIBRARIAN", "WARDEN", ...COLLEGE_ROLES] as const;
export type InvitableRole = (typeof INVITABLE_ROLES)[number];
/**
 * The invitable roles an institution of this kind is offered: a college's six
 * staff roles at a college only, and the school's TEACHER everywhere but a
 * college (a junior college keeps its teachers; a college's teacher is FACULTY).
 * RECRUITER is never invited: it registers itself (src/lib/recruiters.ts).
 */
export function invitableRolesFor(kind: string | null | undefined): InvitableRole[] {
  const college = kind === "COLLEGE" || kind === "AUTONOMOUS_COLLEGE";
  return INVITABLE_ROLES.filter((role) => (college ? role !== "TEACHER" : !isCollegeRole(role)));
}

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

/**
 * Every social-media post carries exactly one of these. The keys are stable
 * database values; the display names ("People & Spotlights", …) live in the
 * dictionaries, and the English hashtag forms in `bulletin.ts`. UPDATES is the
 * default because it is what every post written before categories existed was:
 * an announcement.
 */
export const POST_CATEGORIES = ["PEOPLE", "CAMPUS", "EVENTS", "LEARNING", "UPDATES", "COUNCIL"] as const;
export type PostCategory = (typeof POST_CATEGORIES)[number];
/**
 * The categories anyone may choose when writing a post. COUNCIL (risks batch
 * 5A, 5 Oct 2026) is a student council's notice, written only through the
 * council's own door (council-notices.ts): it is read and filtered like the
 * others, never offered in the composer, and refused by createPost without
 * the council behind it.
 */
export const POSTABLE_CATEGORIES = ["PEOPLE", "CAMPUS", "EVENTS", "LEARNING", "UPDATES"] as const satisfies readonly PostCategory[];

/**
 * The reaction set — fixed and kid-safe, deliberately: no thumbs-down and
 * nothing to weaponise. The last three are the school's own vocabulary,
 * added when the bulletin became social media: CELEBRATE for events and
 * results, PROUD for the spotlight on somebody's work, THANKS for the
 * gratitude a school runs on. Additions are welcome here; a dislike is not.
 */
export const REACTION_KINDS = [
  "CLAP",
  "STAR",
  "IDEA",
  "HEART",
  "CELEBRATE",
  "PROUD",
  "THANKS",
] as const;
export type ReactionKind = (typeof REACTION_KINDS)[number];

/**
 * The teacher-review questionnaire — RATINGS ON FIXED QUESTIONS, deliberately
 * no free text. Fixed, because a question that every respondent answers is the
 * only kind that aggregates; keys, because every reader must meet it in their
 * own language; and this list, because these five are answerable by a child
 * without asking the child to editorialise about an adult.
 */
export const REVIEW_QUESTIONS = [
  "CLARITY", //    explains things clearly
  "SUPPORT", //    helps when someone is stuck
  "FAIRNESS", //   fair to everyone
  "ENGAGEMENT", // makes lessons interesting
  "RESPECT", //    treats pupils with respect
] as const;
export type ReviewQuestion = (typeof REVIEW_QUESTIONS)[number];

export const REVIEW_SCALE_MIN = 1;
export const REVIEW_SCALE_MAX = 5;

/** Who a review round asks. */
export const REVIEW_AUDIENCES = ["STUDENTS", "PARENTS", "BOTH"] as const;
export type ReviewAudience = (typeof REVIEW_AUDIENCES)[number];

export const REVIEW_ROUND_STATUSES = ["OPEN", "CLOSED"] as const;

/**
 * What kind of exam round a series is. THE REPORT CARD IS BUILT FROM THESE —
 * unit tests, the mid-term, the final — and from nothing else: homework and
 * classwork marks are for watching progress as the term runs, not for the
 * document that closes it. Fixed keys so a card says "Mid-term" in the
 * reader's language rather than whatever the office typed.
 */
export const EXAM_KINDS = ["UNIT_TEST", "MID_TERM", "FINAL"] as const;
export type ExamKind = (typeof EXAM_KINDS)[number];

export const EXAM_KIND_KEY: Record<ExamKind, TranslationKey> = {
  UNIT_TEST: "exams.kindUnitTest",
  MID_TERM: "exams.kindMidTerm",
  FINAL: "exams.kindFinal",
};

export const INVITE_STATUSES = ["PENDING", "ACCEPTED", "REVOKED", "EXPIRED"] as const;
export type InviteStatus = (typeof INVITE_STATUSES)[number];

export const AUTH_TOKEN_PURPOSES = [
  "MAGIC_LINK",
  // The SSO hand-off to the phone: minted by the web callback, spent once by
  // POST /api/v1/auth/sso/exchange, two minutes long.
  "APP_EXCHANGE",
  "EMAIL_VERIFY",
  "PASSWORD_RESET",
  "PARENT_CLAIM",
  // Proving you hold a contact you just typed into your own settings. Both
  // added late; `PHONE_VERIFY` had already drifted out of this list, which is
  // what a list nothing validates against does.
  "PHONE_VERIFY",
  "EMAIL_CHANGE",
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
  "ENQUIRY",
  "FEES",
  "INCIDENT",
  "ADMISSION",
  "SYSTEM",
] as const;
export type NotificationKind = (typeof NOTIFICATION_KINDS)[number];
export const NOTIFICATION_KIND_KEY: Record<NotificationKind, TranslationKey> = {
  EXPERT: "notif.kindExpert",
  ATTENDANCE: "notif.kindAttendance",
  GRADE: "notif.kindGrade",
  ASSIGNMENT: "notif.kindAssignment",
  REMARK: "notif.kindRemark",
  POST: "notif.kindPost",
  INVITE: "notif.kindInvite",
  COMPETITION: "notif.kindCompetition",
  ENQUIRY: "notif.kindEnquiry",
  FEES: "notif.kindFees",
  INCIDENT: "notif.kindIncident",
  ADMISSION: "notif.kindAdmission",
  SYSTEM: "notif.kindSystem",
};

/* -------------------------------------------------------------------------- */
/* Fees                                                                        */
/* -------------------------------------------------------------------------- */

/** A grouping for reports, not behaviour: every head is charged the same way. */
export const FEE_HEAD_KINDS = ["TUITION", "TRANSPORT", "EXAM", "ACTIVITY", "OTHER", "DEVELOPMENT", "LIBRARY", "LABORATORY", "HOSTEL", "MESS", "CAUTION_DEPOSIT"] as const;
export type FeeHeadKind = (typeof FEE_HEAD_KINDS)[number];

/** ONLINE is the school's gateway; UPI is the school's own UPI id, confirmed by the office; the rest are taken at the counter. */
export const FEE_METHODS = ["ONLINE", "UPI", "CASH", "CHEQUE", "BANK"] as const;
export type FeeMethod = (typeof FEE_METHODS)[number];
/** What the office may record itself. ONLINE only ever arrives through the gateway. */
export const COUNTER_METHODS = ["CASH", "CHEQUE", "BANK", "UPI"] as const;

/** UNALLOCATED: an online capture that arrived with nothing due, held for the office to refund (QA-03, 24 Oct 2026). */
export const FEE_PAYMENT_STATUSES = ["INITIATED", "CLAIMED", "PAID", "FAILED", "REVERSED", "REFUNDED", "UNALLOCATED"] as const;
export type FeePaymentStatus = (typeof FEE_PAYMENT_STATUSES)[number];

export const FEE_DEMAND_STATUSES = ["OPEN", "PART", "PAID", "WAIVED", "CANCELLED", "CARRIED"] as const;
export type FeeDemandStatus = (typeof FEE_DEMAND_STATUSES)[number];

export const FEE_CONCESSION_KINDS = ["PERCENT", "AMOUNT"] as const;
export type FeeConcessionKind = (typeof FEE_CONCESSION_KINDS)[number];

/** A UPI claim the office has not confirmed after this many days is flagged on the overview. */
export const FEE_CLAIM_STALE_DAYS = 3;
/** An online order nobody paid within this long is closed as failed by the reconcile job. */
export const FEE_ORDER_EXPIRY_MS = 24 * 60 * 60_000;
/** …and one older than this is asked about at the gateway, in case the webhook never arrived. */
export const FEE_ORDER_RECONCILE_AFTER_MS = 30 * 60_000;

export const COMPETITION_ENTRY_STATUSES = ["REGISTERED", "SUBMITTED", "RESULTS"] as const;
export type CompetitionEntryStatus = (typeof COMPETITION_ENTRY_STATUSES)[number];

export const GUARDIAN_RELATIONS = ["PARENT", "GUARDIAN", "OTHER"] as const;

/** What a vacancy is offering. Kept to three: a school hiring a physics
 *  teacher and a school hiring maternity cover both fit, and a finer taxonomy
 *  is a form field nobody fills honestly. */
export const EMPLOYMENT_TYPES = ["FULL_TIME", "PART_TIME", "TEMPORARY"] as const;
export type EmploymentType = (typeof EMPLOYMENT_TYPES)[number];

/** Dictionary keys for the three, so pages cannot disagree about the words. */
export const EMPLOYMENT_TYPE_KEYS = {
  FULL_TIME: "vacancies.typeFullTime",
  PART_TIME: "vacancies.typePartTime",
  TEMPORARY: "vacancies.typeTemporary",
} as const;

/** The two doors an outsider may knock on. */
export const ENQUIRY_KINDS = ["ADMISSION", "JOB"] as const;
export type EnquiryKind = (typeof ENQUIRY_KINDS)[number];

/** Who may be named as a school's admissions or hiring contact. */
export const CONTACTABLE_ROLES = ["ADMIN", "PRINCIPAL", "TEACHER", "FACULTY", "HOD"] as const;

/**
 * What an expert is offering, which is not one thing.
 *
 * A one-off workshop for a hall and a term of mentoring one child are different
 * commitments, and somebody willing to do the first is not thereby willing to do
 * the second. Before this every published expert was silently offered for both.
 */
export const EXPERT_OFFERINGS = ["SESSIONS", "MENTORING", "BOTH"] as const;
export type ExpertOffering = (typeof EXPERT_OFFERINGS)[number];

/**
 * ⚠ KEYS, NOT WORDS — the `ROLE_META` and `ATTENDANCE_META` precedent, and this
 * table had the widest reach of any of them. It is read on the expert's own
 * profile form, on the school's marketplace card, and in the operator's
 * curation queue: three roles, three languages, one English answer.
 */
export const EXPERT_OFFERING_META: Record<
  ExpertOffering,
  { labelKey: TranslationKey; hintKey: TranslationKey }
> = {
  SESSIONS: {
    labelKey: "expert.offeringSessions",
    hintKey: "expert.offeringSessionsHint",
  },
  MENTORING: {
    labelKey: "expert.offeringMentoring",
    hintKey: "expert.offeringMentoringHint",
  },
  BOTH: { labelKey: "expert.offeringBoth", hintKey: "expert.offeringBothHint" },
};

export const EXPERT_BOOKING_STATUSES = ["CONFIRMED", "CANCELLED", "COMPLETED"] as const;
export type ExpertBookingStatus = (typeof EXPERT_BOOKING_STATUSES)[number];

/**
 * What a booking currently IS, as a word.
 *
 * ⚠ Rendered by `.toLowerCase()` on the raw column on the expert's own bookings
 * list — the same defect `LEAVE_STATUS_KEY` was written for. It printed
 * "confirmed" in the middle of a Marathi page, and would have printed nothing
 * readable at all for a status nobody thought of.
 */
export const EXPERT_BOOKING_STATUS_KEY: Record<ExpertBookingStatus, TranslationKey> = {
  CONFIRMED: "expert.statusConfirmed",
  CANCELLED: "expert.statusCancelled",
  COMPLETED: "expert.statusCompleted",
};
export type GuardianRelation = (typeof GUARDIAN_RELATIONS)[number];

/* -------------------------------------------------------------------------- */
/* Presentation metadata                                                       */
/* -------------------------------------------------------------------------- */

export const ATTENDANCE_META: Record<
  AttendanceStatus,
  { labelKey: TranslationKey; shortKey: TranslationKey; token: string; softToken: string; hintKey: TranslationKey }
> = {
  PRESENT: {
    labelKey: "attendance.present",
    shortKey: "attendance.presentShort",
    token: "present",
    softToken: "present-soft",
    hintKey: "attendance.presentHint",
  },
  LATE: {
    labelKey: "attendance.late",
    shortKey: "attendance.lateShort",
    token: "late",
    softToken: "late-soft",
    hintKey: "attendance.lateHint",
  },
  ABSENT: {
    labelKey: "attendance.absent",
    shortKey: "attendance.absentShort",
    token: "absent",
    softToken: "absent-soft",
    hintKey: "attendance.absentHint",
  },
  EXCUSED: {
    labelKey: "attendance.excused",
    shortKey: "attendance.excusedShort",
    token: "excused",
    softToken: "excused-soft",
    hintKey: "attendance.excusedHint",
  },
};
/**
 * ⚠ ENGLISH WORDS, FOR STORED TEXT ONLY.
 *
 * `ATTENDANCE_META` above holds KEYS, resolved in the reader's language at
 * render time. A notification is different: it is written once by a teacher and
 * read later by a guardian, and the finished sentence is stored on the row — so
 * a key resolved at write time would stamp the writer's language onto the
 * reader's screen. Until notifications store a key and its parameters instead
 * of a sentence, the one place that composes them uses these.
 *
 * Nothing else may use this. If you are rendering, you want `ATTENDANCE_META`.
 */
export const ATTENDANCE_STATUS_EN: Record<AttendanceStatus, string> = {
  PRESENT: "Present",
  LATE: "Late",
  ABSENT: "Absent",
  EXCUSED: "Excused",
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
  DRIVER: { labelKey: "role.driver", pluralKey: "role.driverPlural", accent: "driver" },
  LIBRARIAN: { labelKey: "role.librarian", pluralKey: "role.librarianPlural", accent: "librarian" },
  WARDEN: { labelKey: "role.warden", pluralKey: "role.wardenPlural", accent: "warden" },
  ALUMNUS: { labelKey: "role.alumnus", pluralKey: "role.alumnusPlural", accent: "alumnus" },
  FACULTY: { labelKey: "role.faculty", pluralKey: "role.facultyPlural", accent: "faculty" },
  HOD: { labelKey: "role.hod", pluralKey: "role.hodPlural", accent: "hod" },
  EXAM_CONTROLLER: { labelKey: "role.examController", pluralKey: "role.examControllerPlural", accent: "exam_controller" },
  IQAC: { labelKey: "role.iqac", pluralKey: "role.iqacPlural", accent: "iqac" },
  TPO: { labelKey: "role.tpo", pluralKey: "role.tpoPlural", accent: "tpo" },
  ACCOUNTS: { labelKey: "role.accounts", pluralKey: "role.accountsPlural", accent: "accounts" },
  RECRUITER: { labelKey: "role.recruiter", pluralKey: "role.recruiterPlural", accent: "recruiter" },
};

/** Where each role lands after login. */
export const ROLE_HOME: Record<Role, string> = {
  ADMIN: "/admin",
  PRINCIPAL: "/principal",
  TEACHER: "/teacher",
  STUDENT: "/student",
  PARENT: "/parent",
  EXPERT: "/expert",
  DRIVER: "/driver",
  LIBRARIAN: "/library",
  WARDEN: "/hostel",
  ALUMNUS: "/alumni",
  // The college's seven (4 Oct 2026). The exam controller's is /exam-cell, not /exams: /exams is the school's
  // page of marks and date sheets that pupils and parents read, and a home's prefix would open all of it.
  FACULTY: "/faculty",
  HOD: "/hod",
  EXAM_CONTROLLER: "/exam-cell",
  IQAC: "/iqac",
  TPO: "/placement",
  ACCOUNTS: "/accounts",
  RECRUITER: "/recruiter",
};

/* -------------------------------------------------------------------------- */
/* Lifetimes                                                                   */
/* -------------------------------------------------------------------------- */

export const SESSION_TTL_DAYS = 30;
export const MAGIC_LINK_TTL_MINUTES = 20;
export const INVITE_TTL_DAYS = 14;
export const EMAIL_VERIFY_TTL_HOURS = 48;

/**
 * `__Host-` IN PRODUCTION. A browser accepts a cookie with that prefix only
 * over HTTPS, only with Path=/, and only with no Domain — so it cannot be
 * set by, or sent to, any other host under the same domain, and a page on a
 * subdomain cannot plant a session on this one. The prefix needs Secure,
 * which a development server on http cannot always give, so development
 * keeps the plain name.
 */
export const SESSION_COOKIE = process.env.NODE_ENV === "production" ? "__Host-edulink_session" : "edulink_session";

/** Age below which parental consent gates apply. (§6 COPPA / GDPR-K) */
export const CONSENT_AGE = 13;
