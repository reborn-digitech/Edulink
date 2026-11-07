/**
 * Every /api/v1 endpoint, as data.
 *
 * ONE LIST, THREE READERS. The OpenAPI document is generated from it
 * (scripts/gen-openapi.ts), the API sweep walks it as every role
 * (scripts/api-sweep.ts), and a test refuses a route file that is not in it
 * or an entry with no route file. A handler that exists but is not listed is
 * a handler nobody documents and nobody sweeps, which is how the web app's
 * two "routes that did not exist" happened.
 *
 * `access` is who may call it: which roles answer 2xx/422 rather than 403.
 * `"anyone"` means signed-out too; `"signed-in"` means any session;
 * `"operator"` is the server operator alone (User.isSuperuser) and
 * `"app-admin"` the content team (User.isAppAdmin, the operator too) — neither
 * is a school role, so every role token the sweep holds expects 403 there;
 * `"account"` is decided by the PERSON'S MEMBERSHIPS, not the session's active
 * role — two-step sign-in may be turned on by anyone who is an office admin or
 * head at any school, or the operator, whatever role their session is switched
 * to, because the secret guards every sign-in they make — so the handler
 * decides, the sweep accepts 2xx/422 or 403 from any role, and the phone shows
 * such a door from the account's own read (GET /account/totp says `eligible`),
 * never from this list. The sweep sends every listed role and asserts the
 * status alone. `sample` gives a
 * concrete path for endpoints with a parameter, filled from the ZZ fixture
 * by the sweep; without one the sweep skips the endpoint and says so.
 */
import type { ZodTypeAny } from "zod";
import { dutyHolderRoles, LIMITED_ROLES, type AnyDutyCode, type FeatureCode, type InstitutionKind, type LimitedRoleCode, type RoleCode, type SchoolModuleCode } from "@edulink/contracts";

/** The /api doors outside /api/v1 that the catalog lists (api-catalog/unversioned.ts). */
export type UnversionedPath = "/api/attendance" | "/api/practice/answer";

export type Access = "anyone" | "signed-in" | "account" | "operator" | "app-admin" | RoleCode[];

/**
 * owner-batch-item13 (1 Nov 2026): REACH, the relation a door's HANDLER requires beyond the role — a closed list.
 *
 * The gate (role-gate.ts) decides the role, the module, the kind, the feature and the duty from the declaration,
 * before the handler; it does NOT enforce reach and cannot, because the row a request names (a class, a pupil, a
 * piece of work) is not known until the handler reads it. The handler enforces it through the tenancy helpers
 * (tenancy.ts assertClassAccess, assertStudentAccess, assertAssignmentAccess, teaching-reach.ts, family-child.ts
 * childAccess, the self-only and desk checks). This declaration is what the API sweep's variant walk
 * (scripts/api-sweep.ts with scripts/sweep-sessions.ts REACH_PAIRS) and the catalog test check those handlers
 * against: per role VARIANT, not per role, so a timetable-only teacher, a co-teacher, the guardian of another
 * child and the office of another school are each asked what the data model lets them be.
 *
 *   ownSchool       any row of the caller's school: the tenant fence alone (the office's and the desks' doors)
 *   teachesClass    a TEACHER through a ClassTeacher row or one timetable lesson for the class (a FACULTY or HOD:
 *                   the row); a teacher with neither is refused 404
 *   formTeacher     a TEACHER (FACULTY, HOD) only through a ClassTeacher row (LEAD or CO); a timetable-only teacher 404
 *   leadTeacher     only the class's LEAD ClassTeacher row (the report cards): a co-teacher is refused too
 *   teachesSubject  teachesClass, and a timetable-only teacher only in the subjects they take there (the syllabus,
 *                   lessons, plan templates, exam marks); a form teacher and the office any subject
 *   ownWork         a piece of work (assertAssignmentAccess): the class's form teachers all of it, a timetable-only
 *                   teacher only the work they set, a pupil only published work of their own class or offering
 *   ownChild        a guardian only a child they guard, a pupil only themselves; another family's child 404
 *   self            the caller's own row (their membership, request, booking, slot, session…); another person refused
 *   approvedExpert  an expert whose profile is published; one still under review is refused 403
 *   ownDesk         a college teacher or a desk narrowed to its own: an HOD their department, a FACULTY the offerings
 *                   they teach or the postings, juries and batches they run, a DRIVER their own bus
 */
export const REACHES = ["ownSchool", "teachesClass", "teachesSubject", "formTeacher", "leadTeacher", "ownWork", "ownChild", "self", "approvedExpert", "ownDesk"] as const;
export type Reach = (typeof REACHES)[number];

/** The roles each value can describe ("any" for every role); a door's reach names, for each of its roles, one that fits. */
export const REACH_ROLES: Record<Reach, readonly RoleCode[] | "any"> = {
  // A school's or a college's own people: never a guardian, an expert or a recruiter, who hold no school.
  ownSchool: ["ADMIN", "PRINCIPAL", "TEACHER", "STUDENT", "DRIVER", "LIBRARIAN", "WARDEN", "ALUMNUS", "FACULTY", "HOD", "EXAM_CONTROLLER", "IQAC", "TPO", "ACCOUNTS", "SUPPORT"],
  // The feed recasts a college's other staff roles as teachers (bulletin.ts asFeedReader), so they too reach a class.
  teachesClass: ["TEACHER", "FACULTY", "HOD", "EXAM_CONTROLLER", "IQAC", "TPO", "ACCOUNTS"],
  teachesSubject: ["TEACHER", "FACULTY", "HOD"],
  formTeacher: ["TEACHER", "FACULTY", "HOD", "EXAM_CONTROLLER", "IQAC", "TPO", "ACCOUNTS"],
  // The head writes a class's cards only as its LEAD too (report-cards.ts assertMayWriteCards).
  leadTeacher: ["TEACHER", "PRINCIPAL", "FACULTY", "HOD"],
  ownWork: ["TEACHER", "FACULTY", "HOD", "STUDENT"],
  ownChild: ["STUDENT", "PARENT", "ALUMNUS"],
  self: "any",
  approvedExpert: ["EXPERT"],
  ownDesk: ["FACULTY", "HOD", "DRIVER", "LIBRARIAN", "WARDEN", "EXAM_CONTROLLER", "TPO", "IQAC", "ACCOUNTS"],
};

/**
 * A door's reach as written: one value, which binds the roles it can describe while the door's other roles (the office,
 * the desks) reach `ownSchool`; or a value per role, where the roles differ in more than that (a pupil `self`, a
 * guardian `ownChild`, a teacher `teachesClass`).
 */
export type ReachDeclaration = Reach | Partial<Record<RoleCode, Reach>>;

/**
 * How a door answers a caller its reach refuses, where that is not 403 or 404 (Endpoint.reachRefusal): "filters" (a 2xx
 * narrowed to the caller's own, or having changed nothing), "unprocessable" (422), or "notAtSample" — the sweep's sample
 * is a row the refused variant does reach (a school-wide post every reader opens, a letter that is the variant's own),
 * so the refusal cannot be asked there and the walk says so.
 */
export type ReachRefusal = "filters" | "unprocessable" | "notAtSample";

/** The refusal this role meets at this door: the door's one value, or its value for the role; null for 403 or 404. */
export function reachRefusalFor(e: Pick<Endpoint, "reachRefusal">, role: RoleCode): ReachRefusal | null {
  if (!e.reachRefusal) return null;
  return typeof e.reachRefusal === "string" ? e.reachRefusal : (e.reachRefusal[role] ?? null);
}

/** Whether a value can describe this role's reach (REACH_ROLES). */
export function reachFits(reach: Reach, role: RoleCode): boolean {
  const roles = REACH_ROLES[reach];
  return roles === "any" || roles.includes(role);
}

/**
 * The reach a role meets at this door, or null where the door declares none for it: a per-role declaration's own
 * value; one value where it fits the role; otherwise `ownSchool` for a role that holds a school, and null for one that
 * does not (the catalog test refuses a door whose reach leaves one of its roles without a value).
 */
export function reachFor(e: Pick<Endpoint, "reach">, role: RoleCode): Reach | null {
  if (!e.reach) return null;
  if (typeof e.reach !== "string") return e.reach[role] ?? null;
  if (reachFits(e.reach, role)) return e.reach;
  return reachFits("ownSchool", role) ? "ownSchool" : null;
}

/** The roles a door names, for its reach: its `access` list, or the roles a per-role declaration names on an open door. */
export function reachRoles(e: Pick<Endpoint, "access" | "reach">): RoleCode[] {
  if (Array.isArray(e.access)) return [...e.access];
  if (e.reach && typeof e.reach !== "string") return Object.keys(e.reach) as RoleCode[];
  return [];
}

/** A door's reach for every role it names, as the docs publish it (`x-reach`); null without one. */
export function reachMap(e: Pick<Endpoint, "access" | "reach">): Partial<Record<RoleCode, Reach>> | null {
  if (!e.reach) return null;
  const out: Partial<Record<RoleCode, Reach>> = {};
  for (const role of reachRoles(e)) {
    const r = reachFor(e, role);
    if (r) out[role] = r;
  }
  return out;
}

export type Endpoint = {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  /**
   * Versioned, but for the doors outside /api/v1 that a person's session
   * calls and an outbox replays by URL (api-catalog/unversioned.ts,
   * A3-inventory-9): named here one by one, so a typo is a type error.
   */
  path: `/api/v1/${string}` | UnversionedPath;
  summary: string;
  access: Access;
  /**
   * THE MODULE THIS DOOR BELONGS TO (3 October 2026). A school that has not
   * switched it on answers 403 with code MODULE_OFF, for every role, before
   * the handler runs: the session's gate (src/lib/role-gate.ts) reads this
   * field. Published as `x-module`; the phone hides the door's screens by
   * /api/v1/me's `modules`.
   */
  module?: SchoolModuleCode;
  /**
   * THE KINDS OF INSTITUTION THIS DOOR IS FOR (owner-batch-item5, 27 October 2026; the nav's `kinds`, the same
   * words). At a tenant of any other kind the door is not here: the session's gate (src/lib/role-gate.ts) answers
   * 404 NOT_FOUND, for every role and before the module, the role or the handler is asked — as a feature that is
   * off does — rather than a 403 MODULE_OFF claiming a module is off that the school may well have on. A guardian's
   * session names no school, so there the handler decides for the child's. Left out, the door is every kind's.
   * Published as `x-kinds`; the API sweep expects the 404, the phone's contract matrix too, and the demo walk
   * (scripts/demo-school-check.ts) walks only the doors whose kinds include the school's.
   */
  kinds?: readonly InstitutionKind[];
  /**
   * THE PLATFORM FEATURE THIS DOOR BELONGS TO (15 October 2026; src/lib/platform-features.ts). While the
   * operator has it off, the door answers 404 with code FEATURE_OFF, for every role, before the handler
   * runs: the session's gate (src/lib/role-gate.ts) reads this field, beside `module`. A list is "any of":
   * a door two features share (the family's sessions, a provider's slots) stays open while either is on,
   * and its library hides or refuses what belongs to the one that is off. `access` stays the truth about
   * who may call it WHILE IT IS ON; the docs publish this as `x-feature`, and the sweep's expectations read
   * it (a door of a feature that is off is a 404 for every role, its `access` unchanged).
   */
  feature?: FeatureCode | readonly FeatureCode[];
  /**
   * A door of a feature that the gate leaves to its HANDLER, with why, in a sentence (15 Oct 2026): the
   * payee door stays open while a teacher is still owed money; the shared enquiries door refuses only its
   * vacancy kind. Set with `feature`, which then names the feature without the gate enforcing it.
   * Published as `x-feature-note`.
   */
  featureInHandler?: string;
  /**
   * A door of a feature that the platform switch closes but a PLAN does not (16 Oct 2026; src/lib/person-plans.ts),
   * with why, in a sentence: an expert whose plan has ended still reads what they earned and the sessions already
   * booked with them, and still gives the payout details the money owed is sent to. Without it a door of a feature
   * that needs a plan for the caller's role answers 402 PLAN_REQUIRED (the gate, role-gate.ts). Published as
   * `x-plan-free`.
   */
  planFree?: string;
  /**
   * The limited roles a "signed-in" door also opens to: the module roles
   * (DRIVER, LIBRARIAN, WARDEN, ALUMNUS), the college's six staff roles
   * (FACULTY, HOD, EXAM_CONTROLLER, IQAC, TPO, ACCOUNTS) and the RECRUITER —
   * LIMITED_ROLES in packages/contracts. "signed-in" means every role BUT
   * those, which reach only what names them — here, or in an `access` list.
   * The person's own doors name ALL_LIMITED_ROLES. Published as
   * `x-limited-roles`. See `permits` below.
   */
  limitedRoles?: LimitedRoleCode[];
  /**
   * THE DUTIES THIS DOOR ASKS OF A COLLEGE TEACHER (5 October 2026): a
   * FACULTY or HOD passes it only holding one of these on their membership
   * (Membership.dutiesJson, packages/contracts v1/duties.ts); every other role
   * is decided by `access` as before. The session's gate (role-gate.ts) reads
   * it before the handler runs, `permits` and the API sweep's expected()
   * read it with the actor's duties, and the docs publish it as `x-duties`.
   *
   * (owner-batch-item9, 27 Oct 2026) An office duty (ADMIN_DUTIES: HEAD_PAGES)
   * named here asks it of an ADMIN in the same way: the head's own doors —
   * leave decisions, trends, review rounds, the safety centre — let an admin
   * through only while the head has given them the head's pages. Each duty
   * binds only the roles it is given to (`dutyHolderRoles`).
   */
  duties?: AnyDutyCode[];
  /**
   * WHICH ROWS A PERMITTED CALLER REACHES (owner-batch-item13, 1 Nov 2026): the relation the handler requires beyond
   * the role, from the closed list REACHES above, one value or a value per role. NOT enforced by the gate — the row is
   * not known before the handler reads it — but declared so the API sweep walks the door as each role variant the
   * value implies (a subject teacher 200 and another class's teacher 404 at `teachesClass`, the subject teacher 404 at
   * `formTeacher`, another family's guardian 404 at `ownChild`…) and reports a variant answered otherwise as a
   * finding. Required (tests/api-catalog.test.ts) on every door whose path or body names a class, a pupil, a child, a
   * membership or a piece of work. Published as `x-reach`, per role.
   */
  reach?: ReachDeclaration;
  /**
   * How a variant the reach refuses is answered, where it is not 403 or 404 (owner-batch-item13): "filters" for a door
   * that answers 200 with what the caller reaches and nothing else (a list narrowed rather than refused), the variant
   * walk then taking the refused variant's 2xx and saying it read nothing of the fence; "unprocessable" for a door that
   * judges the row it names as a value of the request and refuses one it does not reach with 422 (a pupil "not here"),
   * which the walk then takes as the refusal; "notAtSample" where the sweep's sample is a row the refused variant
   * reaches after all (ReachRefusal). Left out, refused is 403 or 404. A value per role where the roles differ
   * (a guardian refused 404, a pupil whose `childId` is ignored answered their own rows: "filters").
   */
  reachRefusal?: ReachRefusal | Partial<Record<RoleCode, ReachRefusal>>;
  request?: ZodTypeAny;
  response: ZodTypeAny;
  /**
   * For the sweep: the status a permitted role gets with an empty body. On a
   * GET (which sends none) it is the status a permitted sweep actor gets for
   * the sample as it stands — an autonomous college's conduct read by the
   * affiliated college's controller is a 403 (SWEEPS-1, 4 Oct 2026). A list
   * where the honest answer depends on the server's set-up: the credits push
   * with an all-optional body is 409 while the Academic Bank is not connected
   * and 200 with the stub (STREAMS-3, 5 Oct 2026).
   */
  emptyBodyStatus?: number | number[];
  /**
   * For the sweep: a permitted role's own answer to this door's sample where
   * the sample is not that role's row — the cancel door's sample is pupil
   * 01's request, which the family's actors own and the alumnus does not, so
   * the alumnus is answered 404 (STREAMS-4, 5 Oct 2026). Read before
   * `emptyBodyStatus` by `declaredStatus` below. Read by the sweep alone and
   * not published in openapi.json (R-28, decided 5 Oct 2026: keep it so).
   */
  statusByRole?: Partial<Record<RoleCode, number | number[]>>;
  /**
   * For the sweep: the path with its parameters filled from the ZZ fixture.
   * A string for a fixed path; a function for one that needs an id. Returning
   * null (the fixture lacks that thing) makes the sweep skip and say so.
   */
  sample?: string | ((fixture: SweepFixture) => string | null);
  /**
   * WHY A DOOR WITH A `{param}` HAS NO `sample`, in a sentence (R-30, risks
   * batch of 5 Oct 2026). The catalog test (tests/api-catalog.test.ts) refuses
   * a door whose path has a parameter and that names neither: eighteen doors
   * had gone unswept with nobody saying why. Prefer a sample — a fixture row,
   * or an id no school holds (`zz-sweep-no-such-…`, answered 404) — and keep
   * this for a door that truly cannot be called without an act.
   */
  noSample?: string;
  /** For a body-taking endpoint: a valid body from the fixture, so the sweep can assert 200 as well as 422. */
  sampleBody?: (fixture: SweepFixture) => Record<string, unknown> | null;
  /**
   * FOR THE CROSS PROBES ALONE, never the ordinary sweep. A door whose valid
   * body IS the act (a decision, a leaving, a whole record) cannot carry a
   * `sampleBody`: the sweep would perform it, as every permitted role, on
   * every run. But a probe that sends no body is refused for the body and
   * never reaches the fence it came to try. So the probe has a body and a
   * path of its own, sent only with ANOTHER school's or another person's
   * ids — where the right answer is a refusal, and a 2xx is the breach the
   * probe exists to find. Naming one also says the door is a school's, for
   * an endpoint filed under a platform-wide prefix.
   */
  probe?: { path?: (fixture: SweepFixture) => string | null; body?: (fixture: SweepFixture) => Record<string, unknown> | null };
};

/**
 * What the sweep resolves once from ZZ Northgate before walking the catalog.
 * Every field may be null when the fixture lacks the thing; add a field here
 * (and to scripts/api-sweep.ts's resolver) rather than hard-coding an id.
 */
export type SweepFixture = {
  schoolId: string;
  classId: string | null;
  studentMembershipId: string | null;
  teacherMembershipId: string | null;
  adminMembershipId: string | null;
  examSeriesId: string | null;
  examSlotId: string | null;
  assignmentId: string | null;
  postId: string | null;
  /** A comment held for review at the school; the sweep sends no decision, so it stays held. */
  heldCommentId: string | null;
  /** A join and a guardian claim waiting at the school; the sweep sends no decision, so they stay waiting. */
  joinRequestId: string | null;
  guardianClaimId: string | null;
  /** A join by the code of a class the sweep's teacher does not teach, and a claim on a child the sweep's parent does not guard: theirs to be refused. */
  otherClassJoinRequestId: string | null;
  otherFamilyClaimId: string | null;
  conversationId: string | null;
  remarkThreadId: string | null;
  competitionId: string | null;
  /** decision 0007: the fixture competition's calendar row, and the event's own values for an idempotent edit. */
  competitionEventHolidayId: string | null;
  competitionEvent: Record<string, unknown> | null;
  vacancyId: string | null;
  enquiryId: string | null;
  meetingSlotId: string | null;
  inviteId: string | null;
  leaveRequestId: string | null;
  reviewRoundId: string | null;
  academicYearId: string | null;
  termId: string | null;
  notificationId: string | null;
  fileId: string | null;
  feeHeadId: string | null;
  feeStructureId: string | null;
  feePaymentId: string | null;
  feeReceiptId: string | null;
  broadcastId: string | null;
  incidentId: string | null;
  circularId: string | null;
  syllabusUnitId: string | null;
  lessonPlanId: string | null;
  /** A slot today whose teacher is away today, and a colleague who is in and free for it; null on a day with no board. */
  substitutionSlotId: string | null;
  substituteMembershipId: string | null;
  /** A published card, a draft one (for the co-scholastic write), the title of the published set, and the school's current rules as a body to send back. */
  reportCardId: string | null;
  draftReportCardId: string | null;
  reportCardTitle: string | null;
  reportCardConfig: Record<string, unknown> | null;
  /** An active template and its body to send back, a retired one for the archive no-op, an issued certificate, one that may still be revoked, and its printed code. */
  certificateTemplateId: string | null;
  certificateTemplate: Record<string, unknown> | null;
  retiredTemplateId: string | null;
  certificateId: string | null;
  revocableCertificateId: string | null;
  certificateCode: string | null;
  /** A cancelled ask and a declined one, so the sweep's cancel and decline are no-ops. */
  cancelledCertificateRequestId: string | null;
  declinedCertificateRequestId: string | null;
  /** A ZZ pupil's UDISE+ PEN, for the lookup; a pending PEN change on the sampled pupil (rejected by the sweep, which is a no-op the second time) and the number the sweep's proposal would carry (the same pending one, so proposing is the same ask). */
  penNumber: string | null;
  penChangeId: string | null;
  penChangeToPen: string | null;
  /** A settled ask to change pupil 01's record: deciding or withdrawing it answers it as it stands. */
  recordChangeId: string | null;
  /** A settled signature on a fixture certificate (deciding it answers it as it stands), and a small PNG to set one with. */
  paperSignatureId: string | null;
  /** The fixture's signed TEACHER line on a report card set: what the decide door hands its teacher, who reads back only their own line (item 14). */
  teacherPaperSignatureId: string | null;
  /** A teacher's question for the bank that waits for the content team, and one its author took back (zz-fixtures.ts `buildGigQuestions`). */
  gigContributionId: string | null;
  gigWithdrawnContributionId: string | null;
  /** Sessions (zz-fixtures.ts `buildGigSessions`): the sweep's pupil's confirmed seat, one their family said was not held, and the slot of the first. */
  gigBookingId: string | null;
  gigUnheldBookingId: string | null;
  gigSlotId: string | null;
  /** The ZZ expert's series of sessions (zz-fixtures.ts `buildGigSessions`, decision 0008): its cancel and its book answer the sweep's empty body 422, and the role variants' probes are refused. */
  gigSeriesId: string | null;
  /** The sweep's parent's own paid seat payment, on hold (zz-fixtures.ts `buildGigSessions`): read by its payer (and its receipt), retried by the operator as a no-op. */
  gigPaymentId: string | null;
  /** The fixture's PAID payout to the ZZ expert with its invoice (zz-fixtures.ts `buildGigSessions`): recording it again is refused as already paid; the invoice PDF is read by the expert. The ZZ expert's own user id, whose payee suspension the sweep's empty body answers 422. */
  gigPaidPayoutId: string | null;
  gigInvoiceId: string | null;
  gigExpertUserId: string | null;
  /** A signed line on a certificate of a pupil who is NOT the sweep's pupil, for the cross-person probe. */
  otherPupilSignatureId: string | null;
  signaturePng: string | null;
  /** Admissions: the open cycle (and its body to send back), a closed empty one for the purge, a grade it takes, the sweep parent's application with its booked sitting, a cancelled sitting, and one application in each settled state. */
  admissionCycleId: string | null;
  admissionCycle: Record<string, unknown> | null;
  closedCycleId: string | null;
  admissionGrade: string | null;
  admissionSlotId: string | null;
  cancelledSlotId: string | null;
  applicationId: string | null;
  /** This school's first attendance device (zz-college-extras.ts makes one at Vidya and one at Northgate), for the device doors. */
  attendanceDeviceId: string | null;
  offeredApplicationId: string | null;
  acceptedApplicationId: string | null;
  admittedApplicationId: string | null;
  waitlistedApplicationId: string | null;
  withdrawnApplicationId: string | null;
  /** A cover today whose substitute is the sweep's head (zz.principal; the fixture's grade-3 lead teaches every staffed period), for the acknowledge and decline doors; null when nobody asked them to cover anything. */
  myCoverId: string | null;
  /** A lesson plan template of the school, for the apply door. */
  planTemplateId: string | null;
  /**
   * The doors that were skipped for want of a sample (scripts/sweep-doors.ts builds their rows at ZZ
   * Northgate). Each is chosen so the door answers without changing what the next run reads: a
   * session minted for the office actor alone to sign out, an invitation already revoked, a series
   * and a fee structure already archived, a vacancy and an enquiry already closed, a
   * concession already revoked, an entry already consented — or a throwaway the sweep puts back
   * before every run (an appraisal, a template, an absence note, an expert's window).
   */
  mySessionId: string | null;
  revokedInviteId: string | null;
  publishedExamSeriesId: string | null;
  archivedExamSeriesId: string | null;
  closedEnquiryId: string | null;
  mentorThreadId: string | null;
  /** Pupil 01's consented entry in the school's open competition. */
  competitionEntryId: string | null;
  /** The appraisal the head's PUT rewrites with exactly what it says (and that body), and the one the DELETE removes. */
  appraisalId: string | null;
  appraisal: Record<string, unknown> | null;
  goneAppraisalId: string | null;
  gonePlanTemplateId: string | null;
  goneAbsenceNoteId: string | null;
  goneExpertSlotId: string | null;
  /** Pupil 01's published report card, which the pupil and their parent may read. */
  familyReportCardId: string | null;
  /** ZZ Northgate's departed pupil (zz-fixtures.ts `buildDepartures`), for the settle-on-leaving doors (R-61 Q2, 10 Oct 2026). */
  departedMembershipId: string | null;
  /** The sweep's expert's calendar feed token, read before the run rotates it. */
  expertCalendarToken: string | null;
  /** A period of the school day, and its name, times and kind as a body to send back unchanged. */
  periodId: string | null;
  period: Record<string, unknown> | null;
  archivedFeeStructureId: string | null;
  revokedConcessionId: string | null;
  /** One of the sweep parent's own payments, for the family's poll; the fixture's cash payment when they have none. */
  familyPaymentId: string | null;
  /** A notice with no failed or undelivered message, so a resend queues nothing; null when every notice has one. */
  quietBroadcastId: string | null;
  /** For the operator's and the content team's doors, which refuse every sweep role before reading the id. */
  expertProfileId: string | null;
  notContentTeamUserId: string | null;
  globalPostId: string | null;
  bankTopicId: string | null;
  bankQuestionId: string | null;
  /**
   * The placement fixture at ZZ Vidya College (scripts/zz-placement.ts), the same whichever school the fixture is
   * read for: zz.cstudent02's consented application in the open drive, and zz.cstudent02's membership (a college
   * student, for the TPO's dream flag and the recruiter's resume). R-30, 5 Oct 2026.
   */
  placementApplicationId: string | null;
  placementApplicantMembershipId: string | null;
  /**
   * A FINISHED generation run (stopped, finished or failed, not active), the latest, for the run doors' samples (1 Nov
   * 2026): never a queued, running or stopping one — the sweep's own guard (scripts/sweep-live-run.ts) refuses those
   * too. Null when no run has finished, and the doors fall back to an id nothing holds.
   */
  finishedQuizJobId: string | null;
  todayKey: string;
};

/**
 * Whether `role` may pass this door at all — the one reading of `access` and
 * `limitedRoles` that the session's gate, the API sweep and the docs share.
 * "anyone", "account", "operator" and "app-admin" are decided by the handler
 * from the person rather than the role, so every role passes the gate there.
 *
 * `duties` (5 Oct 2026) are the caller's own (a FACULTY's or HOD's, [] for
 * anyone else): a door that names `duties` lets those two roles through only
 * with one of them. Left out, the caller holds none.
 */
/**
 * What the catalog declares a PERMITTED role gets from this door's sample with
 * an empty body (a GET: as it stands), or undefined where it declares nothing
 * and the sweep's default applies. The sweep's expected() reads this.
 */
export function declaredStatus(e: Pick<Endpoint, "emptyBodyStatus" | "statusByRole">, role: RoleCode | null): number | number[] | undefined {
  return (role ? e.statusByRole?.[role] : undefined) ?? e.emptyBodyStatus;
}

export function permits(e: Pick<Endpoint, "access" | "limitedRoles" | "duties">, role: RoleCode, duties: readonly string[] = []): boolean {
  if (e.access === "anyone" || e.access === "account" || e.access === "operator" || e.access === "app-admin") return true;
  const byRole = e.access === "signed-in" ? !(LIMITED_ROLES as readonly string[]).includes(role) || (e.limitedRoles ?? []).includes(role as LimitedRoleCode) : e.access.includes(role);
  if (!byRole) return false;
  // A duty binds only the roles it is given to: a college teacher's FACULTY and HOD, the office's ADMIN (owner-batch-item9).
  const binding = (e.duties ?? []).filter((d) => dutyHolderRoles(d).includes(role));
  if (binding.length) return binding.some((d) => duties.includes(d));
  return true;
}

/** Whether a door is here at an institution of this kind (owner-batch-item5): every kind's unless it names `kinds`. */
export function doorForKind(e: Pick<Endpoint, "kinds">, kind: string): boolean {
  return !e.kinds || (e.kinds as readonly string[]).includes(kind);
}

/** The features a door belongs to, as a list (empty for none). */
export function featuresOf(e: Pick<Endpoint, "feature">): readonly FeatureCode[] {
  if (!e.feature) return [];
  return typeof e.feature === "string" ? [e.feature] : e.feature;
}
