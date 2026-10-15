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
import { LIMITED_ROLES, type DutyCode, type FeatureCode, type LimitedRoleCode, type RoleCode, type SchoolModuleCode } from "@edulink/contracts";

/** The /api doors outside /api/v1 that the catalog lists (api-catalog/unversioned.ts). */
export type UnversionedPath = "/api/attendance" | "/api/practice/answer";

export type Access = "anyone" | "signed-in" | "account" | "operator" | "app-admin" | RoleCode[];

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
   */
  duties?: DutyCode[];
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
  /** A teacher's question for the bank that waits for the content team, and one its author took back (zz-fixtures.ts `buildGigQuestions`). */
  gigContributionId: string | null;
  gigWithdrawnContributionId: string | null;
  /** Sessions (zz-fixtures.ts `buildGigSessions`): the sweep's pupil's confirmed seat, one their family said was not held, and the slot of the first. */
  gigBookingId: string | null;
  gigUnheldBookingId: string | null;
  gigSlotId: string | null;
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
  if (e.duties?.length && (role === "FACULTY" || role === "HOD")) return e.duties.some((d) => duties.includes(d));
  return true;
}

/** The features a door belongs to, as a list (empty for none). */
export function featuresOf(e: Pick<Endpoint, "feature">): readonly FeatureCode[] {
  if (!e.feature) return [];
  return typeof e.feature === "string" ? [e.feature] : e.feature;
}
