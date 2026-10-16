import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * The shape tenancy relies on, checked against the schema itself.
 *
 * `tenancy.ts` puts `schoolId` in the WHERE clause of every scoped query, and
 * the Postgres migration intends to turn that into an RLS policy per table. Both
 * depend on a property of the DATA MODEL rather than of any one query: that a
 * row can say which school it belongs to.
 *
 * The schema header claimed every school-owned row carried `schoolId` directly.
 * Five did not — they reached their tenant through a join, and nothing said so,
 * which would have meant five hand-written `EXISTS` policies discovered one at a
 * time. They have one now. Prose cannot be run; this can, which is the point:
 * the claim was wrong for as long as it was only prose.
 *
 * A new model has to land in one of three lists below, deliberately. Adding one
 * and forgetting fails this test rather than being discovered when a policy is
 * written against a column that is not there.
 */

const SCHEMA = readFileSync(resolve(process.cwd(), "prisma/schema.prisma"), "utf8");

/** Every .ts/.tsx file under a directory, recursively. */
function globSource(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = resolve(dir, entry.name);
    if (entry.isDirectory()) out.push(...globSource(full));
    else if (/\.tsx?$/.test(entry.name)) out.push(full);
  }
  return out;
}

/** Models that carry `schoolId` and can take a one-line RLS predicate. */
const DIRECT = [
  /**
   * The operator's visitor book. Carries `schoolId` directly like everything
   * else here, but its policy is bespoke: readable by the school, writable only
   * by whoever runs the server, and DELETABLE BY NOBODY — see
   * OPERATOR_LOG_TABLES in scripts/gen-rls.ts. It is in this list because the
   * question this file asks is "how does it reach its tenant", and the answer
   * is the ordinary one.
   */
  "OperatorAccess",
  /** The pupil's health card and its check-ups: the school's, read by the child's teachers and guardians through the app's own rules. */
  "HealthCard",
  "HealthCheck",
  /** The incident log and its follow-up notes: the school's record of a child's bad day, read by the family through the app's own rules. */
  "Incident",
  "IncidentNote",
  /** A circular opened by a reader: denormalised schoolId like PostAck beside it. */
  "PostRead",
  /** The S3 fixes (5 Oct 2026): a family's yes or no to a permission slip, a hostel expulsion waiting for the principal, a faculty member's published profile (also opened to anyone in gen-rls.ts, as DisclosurePage is). */
  "PostConsent",
  "HostelExpulsion",
  "FacultyPublicProfile",
  /** The staff register: a staff member's day, the school's row. */
  "StaffAttendance",
  /** A module of the school version the school has switched on (3 Oct 2026): the school's row, one per module that is on. */
  "SchoolModule",
  // An adult student's grants to their guardians (college foundation, 4 Oct 2026).
  "StudentConsent",
  /** The alumni module (3 Oct 2026): a former pupil's directory entry and the office's flags, and the office's notes to a batch — the school's rows. */
  "AlumniProfile",
  "AlumniNote",
  /** A family's word that a child will be away, and who read a child's health card: the school's rows, written and read through the family rules (2026-10-01). */
  "AbsenceNote",
  "HealthCardRead",
  /** The syllabus: the school's chapter list per grade and subject, a class's progress on each, and the lessons planned and taught. */
  /** The head's notes on a member of staff, and a lesson plan kept to copy into another class (2026-10-01). */
  "StaffAppraisal",
  "LessonPlanTemplate",
  "SyllabusUnit",
  "SyllabusProgress",
  "LessonPlan",
  /** The clinical desk (R-56, the clinical half; 10 Oct 2026): sites, their departments, postings and logbook entries, the college's rows. */
  "ClinicalSite",
  "ClinicalDepartment",
  "ClinicalPosting",
  "LogbookEntry",
  // R-61 Q2 (decisions builder, 10 Oct 2026): the office's settlement on leaving, one row per leaver.
  "LeavingSettlement",
  /** A lesson covered on a day: the school's row on its own timetable slot. */
  "Substitution",
  /** The pupil record, the certificate templates and the certificates issued from them. */
  "PupilRecord",
  "CertificateTemplate",
  "IssuedCertificate",
  /** Admissions: the cycle, a family's application and the entrance-test sittings. */
  "AdmissionCycle",
  "Application",
  "EntranceSlot",
  /** A family's ask for a certificate. */
  "CertificateRequest",
  /** A proposed correction to a pupil's PEN, awaiting the head and a guardian. */
  "PenChangeRequest",
  /** A family's ask to change the pupil record, awaiting the office. */
  "RecordChangeRequest",
  /** A signature or the seal as a picture, and the copy an issued paper keeps. */
  "SignatureImage",
  "PaperSignature",
  "AcademicYear",
  "Term",
  "StaffRecord",
  "ScheduledDeparture",
  "ReviewRound",
  "ReviewRoundTeacher",
  "ReviewResponse",
  /**
   * The outreach trio. All three carry `schoolId` — the TARGET school's, which
   * is the tenant that answers them — and each also opens by exactly one
   * extra clause in gen-rls.ts: a published-or-hiring school to everyone, an
   * enquiry to its opener, a message to its enquiry's opener. The pinned
   * cross-tenant INSERTs are the same file's Enquiry/EnquiryMessage blocks.
   */
  "JobPosting",
  "Enquiry",
  "EnquiryMessage",
  "Assignment",
  "AttendanceRecord",
  "AttendanceCover",
  "AttendanceSession",
  "AuditLog",
  "TimetablePeriod",
  "TimetableSlot",
  "Class",
  "ClassTeacher",
  /**
   * The cross-school leaderboard's one table. Carries `schoolId` and reaches its
   * tenant the ordinary way; its policy additionally opens the row to OTHER
   * schools when the organiser has switched the leaderboard on — see
   * GLOBALLY_READABLE in scripts/gen-rls.ts. It is in this list because the
   * question here is how it reaches its tenant, and the answer is the ordinary
   * one. What it may NOT carry is a child: see the model.
   */
  "CompetitionStanding",
  "Comment",
  "EarnedBadge",
  "QuizAttempt",
  "QuizResponse",
  "QuizMastery",
  "PracticeAssignment",
  "CompetitionEntry",
  "Enrollment",
  "ExpertBooking",
  "ExpertMessage",
  "ExpertInvite",
  "Grade",
  "GradeCategory",
  "MentorThread",
  "MentorMessage",
  "GlobalPostHide",
  "Holiday",
  "Invite",
  "LeaveRequest",
  "Membership",
  "Notification",
  "Post",
  "PostAck",
  "Reaction",
  "ExamSeries",
  "ExamSlot",
  "MeetingSlot",
  "MeetingBooking",
  /** A pupil's seat in a gig slot (decision 0004): the pupil's school's row. Its provider, who may be an expert with no school, reads their own through SELF_READABLE. */
  "GigBooking",
  /**
   * The fees ledger. Every table carries the school's id directly — a
   * demand, a payment, a receipt, an allocation are the school's rows about
   * one of its pupils — and none opens to anybody else by policy: a guardian
   * reads their child's dues through the API, which checks the guardianship
   * itself, and the webhook writes under forSchool(schoolId) after proving
   * the signature with that school's own secret.
   */
  "FeeHead",
  "FeeStructure",
  "FeeInstalment",
  "FeeLine",
  "StudentFeePlan",
  "FeeConcession",
  "FeeDemand",
  "FeePayment",
  "FeeAllocation",
  "FeeReceipt",
  "FeeRefund",
  "FeeGatewayAccount",
  "GatewayEvent",
  // Texts to families: a message and a broadcast are the school's rows about
  // its own guardians; the status webhook writes under forSchool with the
  // school in its URL, like the gateway's.
  "OutboundMessage",
  "Broadcast",
  "RemarkMessage",
  "Conversation",
  "ConversationParticipant",
  "ConversationMessage",
  "RemarkThread",
  "Report",
  "ReportCard",
  "ReportCardItem",
  "SchoolRecord",
  "Submission",
  // A request to join and a claim to be a guardian: filed under the school asked, decided by it.
  "JoinRequest",
  "GuardianClaim",
  /** A school's month of usage — pupils, texts, storage, people active — written by the nightly usage:sample job; the operator also reads every school's (SUPERUSER_READABLE in gen-rls.ts). */
  "UsageSample",
  /** The inventory module (3 Oct 2026): categories, vendors, items and their stock at each place, the movements, the asset register and its events, the bills, and staff asks — the school's rows. */
  "InventoryCategory",
  "Vendor",
  "InventoryItem",
  "InventoryStock",
  "StockMovement",
  "Asset",
  "AssetEvent",
  "PurchaseRecord",
  "InventoryRequest",
  /** The payroll module (3 Oct 2026): the statutory settings, structures and their components, salaries (PAN and bank sealed), the monthly runs, payslips, the files cut from a run, and advances — the school's rows. */
  "PayrollSettings",
  "SalaryStructure",
  "SalaryComponent",
  "StaffSalary",
  "PayrollRun",
  "Payslip",
  "PayrollExport",
  "StaffAdvance",
  /** The library module (3 Oct 2026): the school's rules, its books and copies, who borrows, loans, the reservation queue and fines — the school's rows, read by families through the library's own rules. */
  "LibrarySettings",
  "LibraryTitle",
  "LibraryCopy",
  "LibraryMember",
  "LibraryIssue",
  "LibraryReservation",
  "LibraryFine",
  /** A periodical's volumes and issues received (G4-21, risks batch package 1B, 5 Oct 2026). */
  "LibraryVolume",
  /** The hostel module (3 Oct 2026): houses, rooms, beds, leave, roll calls, the mess and the visitor book — the school's rows, read by a boarder's family through the hostel's own rules. */
  "Hostel",
  "HostelRoom",
  "HostelAllotment",
  "HostelLeave",
  "HostelRollCall",
  "HostelRollCallEntry",
  "MessMenu",
  "MessAttendance",
  "HostelVisitor",
  /** The transport module (3 Oct 2026): routes, stops, buses, who drives which, who rides where, the day's trips, the bus's positions, the roster ticks, a guardian's alert switch and a driver's location consent — the school's rows; a family reads its own child's through lib/transport.ts. */
  "TransportRoute",
  "TransportStop",
  "Bus",
  "BusAssignment",
  "TransportAllotment",
  "Trip",
  "TripPosition",
  "TripBoarding",
  "TransportAlertPref",
  "TransportConsent",
  /** The college's academics (4 Oct 2026): the structure the office keeps, offerings and the grid, registration, lectures and their marks, condonation, internal assessment and its lock, the course file and mentoring — the college's rows, read by students and consented guardians through lib/academics*.ts. */
  "AcademicsSettings",
  "Department",
  "DepartmentFaculty",
  "Programme",
  "ProgrammeOutcome",
  "Scheme",
  "Course",
  "CourseOutcomeMap",
  "AcademicTerm",
  "Room",
  "Division",
  "StudentProgramme",
  "CourseOffering",
  "OfferingSlot",
  "CourseRegistration",
  "LateRegistration",
  "Lecture",
  "LectureAttendance",
  "AttendanceCondonation",
  "DefaulterNotice",
  "InternalComponent",
  "InternalMark",
  "InternalLock",
  "CourseFile",
  "CourseFileItem",
  "MentoringGroup",
  "MentoringMember",
  "MentoringNote",
  /** The college exam cell (4 Oct 2026): sessions, forms, hall tickets, the date sheet, halls, seats, invigilation, malpractice, remuneration, external marks, grace, moderation notes, result runs and their course and term rows, revaluation, backlogs, credits for the Academic Bank, question papers, printing lists, assessment bundles, the convocation and the papers issued — the college's rows; a student and a consented guardian read their own through lib/exam-cell*.ts. */
  "ExamSession",
  "ExamForm",
  "HallTicket",
  "ExamSchedule",
  "ExamRoom",
  "Seating",
  "Invigilation",
  "Malpractice",
  "Remuneration",
  "ExamMark",
  "ExamGrace",
  "ExamModerationNote",
  "ResultRun",
  "CourseResult",
  "TermResult",
  "Revaluation",
  "Backlog",
  "CreditPush",
  "QuestionPaper",
  "PrintingList",
  "AssessmentAllocation",
  "Convocation",
  "ExamDocument",
  // Placement (4 Oct 2026): a college's companies, profiles, drives (a pooled drive is the host's row), applications, rounds, offers, internships, projects, seasons; the alumni college additions.
  "CompanyTenantLink",
  "PlacementProfile",
  "Drive",
  "DriveApplication",
  "RoundResult",
  "Offer",
  "Internship",
  "Project",
  "PlacementSeason",
  "AlumniGift",
  "AlumniReferral",
  "AlumniCompanyLink",
  "AlumniMeet",
  "AlumniMeetRegistration",
  /** The college office (4 Oct 2026): a student's seat in a programme, admission rounds, the CET Cell's allotment rows, college applications, scholarship claims, no-dues clearances, the office's dials, a library's e-resources and a hostel's squad rounds — each the college's row. */
  "ProgrammeEnrolment",
  "AdmissionRound",
  "CapAllotment",
  "CollegeApplication",
  "ScholarshipClaim",
  "NoDuesClearance",
  "CollegeOfficeSettings",
  "LibraryEResource",
  "HostelSquadRound",
  /** IQAC (4 Oct 2026): the NAAC cycle and its scores, the research and activity registers, committees and minutes, surveys and their responses and action-taken reports, grievances, faculty records, filings, the files the desk cites, and the published disclosure — each the college's row. */
  "AccreditationCycle",
  "MetricScore",
  "ResearchItem",
  "Activity",
  "Committee",
  "CommitteeMeeting",
  "Survey",
  "SurveyResponse",
  "ActionTakenReport",
  "Grievance",
  "FacultyRecord",
  "CollegeFiling",
  "IqacFile",
  "DisclosurePage",
  /** Stream records and the duties' desks (5 Oct 2026): lab batches and their members, the practical record, moot courts, practice schools, postings and lesson observations, NSS/NCC enrolments, the exam squad's visits. */
  "LabBatch",
  "LabBatchMember",
  "PracticalRecord",
  "MootCourt",
  "PracticeSchool",
  "TeachingPracticePosting",
  "LessonObservation",
  "CorpsEnrolment",
  "ExamSquadVisit",
  /** The councils' worksheets behind the BCI, NCTE and NBA returns (5 Oct 2026, filings by stream). */
  "FilingWorksheet",
  /** The simulator's saved what-ifs (5 Oct 2026, actionable insights). */
  "IqacScenario",
  /** The risks batch's college builds (package 5B, 5 Oct 2026): pre-placement talks and their RSVPs, soft-skills trainings with sessions, enrolment and attendance, the attendance devices with their badges and punches, the peer-team visit file and its lines. */
  "PlacementTalk",
  "PlacementTalkRsvp",
  "SoftSkillsTraining",
  "SoftSkillsSession",
  "SoftSkillsEnrolment",
  "SoftSkillsAttendance",
  "AttendanceDevice",
  "AttendanceBadge",
  "AttendancePunch",
  "PeerTeamVisit",
  "PeerVisitItem",
  /** The library's reading-room register (risks batch 5A, 5 Oct 2026): a visit in and out per reader. */
  "ReadingRoomVisit",
  /** The assistant (Phase B, 10 Oct 2026): a person's conversations and their messages, the daily counts, a guardian's opt-out per child. */
  "AssistantConversation",
  "AssistantMessage",
  "AssistantUsage",
  "AssistantChildSetting",
  /** The studio desk (R-56, the studio half, 10 Oct 2026): a studio, a student's submission, a jury and its marks. */
  "Studio",
  "StudioSubmission",
  "StudioJury",
  "StudioJuryMark",
  // website-builder A (15 Oct 2026): a school's public website — the draft, its rendered versions (the live one also readable by anyone), the enquiries its form took.
  "SchoolSite",
  "SchoolSiteVersion",
  "SchoolSiteEnquiry",
  // end website-builder A
  // website-builder B (15 Oct 2026): a school's own domain for its public website (a LIVE row is also readable by anyone).
  "SchoolSiteDomain",
  // end website-builder B
  // website-two (16 Oct 2026): a website draft's review links (an open one also readable by anyone, by its token's hash), its page-view counts, the files uploaded for it.
  "SchoolSiteShare",
  "SchoolSiteVisit",
  "SchoolSiteFile",
  // end website-two
  // meta-posting (16 Oct 2026): a school's Facebook Page connection (its Page token sealed) and the copies of its posts sent to Meta.
  "SocialConnection",
  "SocialPost",
  // end meta-posting
];

/**
 * School-owned but reaching the tenant only through a join.
 *
 * EMPTY, and worth keeping empty. It had five entries — ClassTeacher and
 * Enrollment via classId, Comment and Reaction via postId, RemarkMessage via
 * threadId — each of which would have needed its own `EXISTS (...)` policy.
 * Those are the policies most likely to be written wrong and the ones that run
 * per row, so the five were given a `schoolId` instead and every policy is now
 * the same one-line predicate.
 *
 * A new entry here is a decision to write a bespoke policy. Prefer denormalising.
 */
const VIA_JOIN: Record<string, { fk: string; parent: string }> = {};

/** Not school-owned, each for a stated reason. */
const NOT_TENANT_SCOPED: Record<string, string> = {
  School: "is the tenant itself — its policy is on id, not schoolId",
  User: "spans schools on purpose — a parent has children in two, a teacher may work at two",
  Session: "belongs to a user, not a school; a session survives switching school",
  AuthToken: "belongs to a user, before any school is chosen",
  SsoIdentity: "an external login bound to a user, before any school is chosen — like AuthToken",
  TwoFactorChallenge: "the second step of a sign-in, minted before any school is chosen — like AuthToken",
  PushSubscription: "belongs to a user's device",
  DeviceToken: "the phone's push token — belongs to a user's device, like PushSubscription",
  UploadTicket: "a file a person uploaded and has not attached yet; the post that consumes it is the tenant-scoped row",
  Guardianship: "deliberately cross-school: it is the link between a parent and a child",
  Competition: "organizerSchoolId is nullable because a competition may be run by nobody's school",
  OutboundEmail: "a dev mailbox of sent mail; has no tenant and holds no school data",
  JobRun: "a scheduled job runs for the whole server; the row is the lock and the log",
  RateLimit: "counts attempts made before any session exists; a bucket name and an integer",
  QuizTopic: "a shared practice catalogue, like Competition — a chapter belongs to no school",
  QuizQuestion: "belongs to a QuizTopic, which belongs to no school",
  QuizTopicTranslation: "a translation of the shared catalogue is still the shared catalogue",
  QuizQuestionTranslation: "a translation of the shared catalogue is still the shared catalogue",
  ContentDocument: "a public textbook or syllabus in the assistant's corpus — a shared catalogue like QuizTopic; written by the owner only",
  ContentChunk: "belongs to a ContentDocument, which belongs to no school",
  HelpEntry: "the platform's own help (door summaries, docs, nav labels), the same for every school; written by the owner only",
  ExpertProfile: "an expert belongs to no school — the marketplace is shared, like Competition",
  ExpertSlot: "belongs to an ExpertProfile, so it belongs to no school either",
  RecruiterProfile: "a recruiter is an outside account like an expert: belongs to no college, reaches one only through a placement drive (4 Oct 2026)",
  GigSettings: "the operator's dials for work done for the platform itself; one row, no school",
  QuestionContribution: "a teacher's question for the shared bank, reviewed by the content team — bound to its author, not to a school",
  GigEarning: "what the company owes a contributor — bound to the person",
  GigPayment: "the operator's record of a transfer to a contributor — bound to the person",
  GigPayee: "a contributor's own UPI id — bound to the person",
  GigSlot: "a time a provider offers; an expert's is open to every school, a teacher's names its school in teacherSchoolId and is held to it in the library",
  ExpertPayoutAccount: "an expert's own payee details (a sealed bank account and PAN) and their Razorpay Route linked account — bound to the person, no school",
  SessionPayment: "a guardian's payment for one paid seat, the expert's share held by Razorpay as a transfer on hold — the payer's and the expert's row, read by their user ids in src/lib/gig-payments.ts; the booking it pays for is the pupil's school's row",
  ExpertPayout: "what the company owes one expert for the seats whose hold has run, and the reference of the transfer it then made — bound to the person",
  GigGatewayEvent: "a delivery from the company's gateway about a session payment, stored once by its id; no school, like GigGatewayEvent's cousin GatewayEvent carries one for school fees",
  GigInvoice: "the company's GST tax invoice to an expert for the commission on one payout — the expert's row by their user id, the operator's to read; no school",
  QuestionStat: "the bank's own count of how a question is doing across every school, written by the nightly bank:stats job alone — belongs to a QuizQuestion, which belongs to no school",
  PlatformTakedown: "the platform's record of taking a shared post down for every school; postSchoolId names the publishing school for the restore, the row is nobody's tenant",
  Plan: "a plan the operator offers — a name, caps and a recorded price; the office reads its own through School.planId, and nothing in it belongs to a school",
  CommissionPartner: "the operator's record of who brought a school in and what share they are owed (recorded, never paid here); a school points at it through School.commissionPartnerId, and nothing in it belongs to a school",
  Company: "a company that recruits is the same row for every college on the platform, like ExpertProfile; what a college does with it — its drives — is the college's row (placement, 4 Oct 2026)",
  CompanyRecruiter: "a recruiter's binding to a company — the person's, not a college's; the fence is src/lib/placement-recruiter.ts and PLACEMENT_READABLE in gen-rls",
  Requirement: "a company's ask addressed to colleges by id; the cell reads those naming its own school, the recruiter its own company's",
  // ---- review-queue (10 Oct 2026) ----
  QuizReviewStamp: "one act of review on a QuizQuestion by the content team or the operator — the bank belongs to no school and neither do its reviewers",
  QuizGenJob: "one run of the quiz bank generator started from the bank desk by the content team or the operator — the bank belongs to no school and neither do they (quiz-publish-jobs, 11 Oct 2026)",
  // ---- competitions-crawler (12 Oct 2026) ----
  CompetitionSource: "an organiser's own site the competitions crawler reads — a platform list like Competition, which no school owns",
  CompetitionCrawlPage: "the crawler's cache of one organiser's page by URL — public web pages, no school's data",
  CompetitionCrawl: "where a platform competition suggested from the web came from — hangs off Competition, which no school owns",
  CompetitionCrawlJob: "one crawl of the organisers' sites started from the competitions desk by the content team or the operator — no school",
  PlatformFeature: "one of the platform's feature switches (15 Oct 2026), the same for every school, switched by the operator alone — no school",
  // expert-registration (15 Oct 2026)
  ExpertApplication: "an expert's application from the login page (15 Oct 2026): the applicant has no school and no session, the operator alone reads and decides — no school",
  // end expert-registration
  // plans (16 Oct 2026)
  PersonPlan: "a plan sold per person (STUDENT, TEACHER, EXPERT; 16 Oct 2026): the platform's price list, the same for every school, written by the operator alone — no school",
  Entitlement: "one feature open to one person for a window (16 Oct 2026): the person's own, bought for themselves or by a guardian, and it follows them across every school — no school",
  // end plans
  // ---- end competitions-crawler ----
  // ---- end review-queue ----
};

function modelBodies(): Map<string, string> {
  const bodies = new Map<string, string>();
  const re = /^model\s+(\w+)\s*\{([\s\S]*?)^\}/gm;
  let match: RegExpExecArray | null;
  while ((match = re.exec(SCHEMA)) !== null) bodies.set(match[1]!, match[2]!);
  return bodies;
}

const MODELS = modelBodies();

function hasField(body: string, field: string): boolean {
  return new RegExp(`^\\s*${field}\\s`, "m").test(body);
}

describe("the schema parses at all", () => {
  it("finds every model", () => {
    expect(
      MODELS.size,
      "If this FELL, the regex above has stopped matching and every assertion " +
        "below is passing vacuously. If it ROSE, a model was added — say how it " +
        "is scoped in one of the three lists and update this number.",
    ).toBe(339); // + SchoolSiteShare, SchoolSiteVisit, SchoolSiteFile (website-two, 16 Oct 2026); 336 before; + PersonPlan, Entitlement (plans, 16 Oct 2026) and SocialConnection, SocialPost (meta-posting, 16 Oct 2026); 332 before; + SchoolSiteDomain (website-builder B) and SchoolSite, SchoolSiteVersion, SchoolSiteEnquiry (website-builder A), a school's public website, 15 Oct 2026; 328 before; + ExpertApplication (an expert's application from the login page, 15 Oct 2026; 327 before); + PlatformFeature (the platform's feature switches, 15 Oct 2026; 326 before); + CompetitionSource, CompetitionCrawlPage, CompetitionCrawl, CompetitionCrawlJob (the competitions crawler, 12 Oct 2026; 322 before); + QuizGenJob (generation started from the bank desk, 11 Oct 2026; 321 before); + QuizReviewStamp (the generated bank's review queue, 10 Oct 2026; 320 before); + LeavingSettlement (settle on leaving, R-61 Q2, 10 Oct 2026; 319 before); + ClinicalSite, ClinicalDepartment, ClinicalPosting, LogbookEntry (the clinical desk, R-56, 10 Oct 2026; 315 before); + Studio, StudioSubmission, StudioJury, StudioJuryMark (the studio desk, R-56, 10 Oct 2026; 311 before); + AssistantConversation, AssistantMessage, AssistantUsage, AssistantChildSetting (the assistant service, Phase B, 10 Oct 2026; 307 before); + ContentDocument, ContentChunk, HelpEntry (the assistant's content, Phase A, 8 Oct 2026; 304 before); + ReadingRoomVisit (the reading-room register, risks batch 5A, 5 Oct 2026; 304 counts LibraryVolume of package 1B too); + 11 college builds of the risks batch (PlacementTalk, PlacementTalkRsvp, SoftSkillsTraining, SoftSkillsSession, SoftSkillsEnrolment, SoftSkillsAttendance, AttendanceDevice, AttendanceBadge, AttendancePunch, PeerTeamVisit, PeerVisitItem; package 5B, 5 Oct 2026); + IqacScenario (actionable insights and the simulator, 5 Oct 2026); + PostConsent, HostelExpulsion, FacultyPublicProfile (the S3 fixes, 5 Oct 2026); + FilingWorksheet (the councils' returns, 5 Oct 2026); + 9 stream-record models (LabBatch, LabBatchMember, PracticalRecord, MootCourt, PracticeSchool, TeachingPracticePosting, LessonObservation, CorpsEnrolment, ExamSquadVisit; 5 Oct 2026); + 28 academics models (AcademicsSettings, Department, DepartmentFaculty, Programme, ProgrammeOutcome, Scheme, Course, CourseOutcomeMap, AcademicTerm, Room, Division, StudentProgramme, CourseOffering, OfferingSlot, CourseRegistration, LateRegistration, Lecture, LectureAttendance, AttendanceCondonation, DefaulterNotice, InternalComponent, InternalMark, InternalLock, CourseFile, CourseFileItem, MentoringGroup, MentoringMember, MentoringNote; 4 Oct 2026), already counted in 277; + 14 IQAC models (AccreditationCycle, MetricScore, ResearchItem, Activity, Committee, CommitteeMeeting, Survey, SurveyResponse, ActionTakenReport, Grievance, FacultyRecord, CollegeFiling, IqacFile, DisclosurePage; 4 Oct 2026), already in the schema when the office builder counted 277; + 9 college office models (ProgrammeEnrolment, AdmissionRound, CapAllotment, CollegeApplication, ScholarshipClaim, NoDuesClearance, CollegeOfficeSettings, LibraryEResource, HostelSquadRound; 4 Oct 2026), counted with every model then in the schema; + 17 placement models (Company, CompanyRecruiter, Requirement not tenant-scoped; 14 tenant-scoped; 4 Oct 2026), counted with the academics and office models then in the schema; + 23 college exam cell models (4 Oct 2026); 184 + StudentConsent, RecruiterProfile (college foundation, 4 Oct 2026); 139 + AlumniProfile, AlumniNote (alumni module, 3 Oct 2026) + 16 library and hostel models (LibrarySettings, LibraryTitle, LibraryCopy, LibraryMember, LibraryIssue, LibraryReservation, LibraryFine, Hostel, HostelRoom, HostelAllotment, HostelLeave, HostelRollCall, HostelRollCallEntry, MessMenu, MessAttendance, HostelVisitor) + 10 transport models (TransportRoute, TransportStop, Bus, BusAssignment, TransportAllotment, Trip, TripPosition, TripBoarding, TransportAlertPref, TransportConsent) + 17 inventory and payroll models (InventoryCategory, Vendor, InventoryItem, InventoryStock, StockMovement, Asset, AssetEvent, PurchaseRecord, InventoryRequest, PayrollSettings, SalaryStructure, SalaryComponent, StaffSalary, PayrollRun, Payslip, PayrollExport, StaffAdvance)
  });
});

describe("every model declares how it is scoped", () => {
  it("⚠ has no model missing from all three lists", () => {
    const accounted = new Set([...DIRECT, ...Object.keys(VIA_JOIN), ...Object.keys(NOT_TENANT_SCOPED)]);
    const orphans = [...MODELS.keys()].filter((m) => !accounted.has(m));

    expect(
      orphans,
      `New model(s) with no stated tenancy: ${orphans.join(", ")}. Add a schoolId ` +
        "and list it in DIRECT, or say how it reaches its tenant in VIA_JOIN, or " +
        "why it has none in NOT_TENANT_SCOPED.",
    ).toEqual([]);
  });

  it("lists nothing that does not exist", () => {
    const listed = [...DIRECT, ...Object.keys(VIA_JOIN), ...Object.keys(NOT_TENANT_SCOPED)];
    const ghosts = listed.filter((m) => !MODELS.has(m));
    expect(ghosts, `Listed but not in the schema: ${ghosts.join(", ")}`).toEqual([]);
  });
});

describe("direct scoping", () => {
  it("⚠ every model claiming a schoolId actually has one", () => {
    // A one-line RLS predicate against a column that is not there fails closed
    // in Postgres, but only when the policy is written — months later.
    const missing = DIRECT.filter((m) => !hasField(MODELS.get(m)!, "schoolId"));
    expect(missing, `Claim schoolId but do not have it: ${missing.join(", ")}`).toEqual([]);
  });
});

describe("scoping through a join", () => {
  it("⚠ each one still has the foreign key its policy would go through", () => {
    const broken: string[] = [];
    for (const [model, { fk }] of Object.entries(VIA_JOIN)) {
      if (!hasField(MODELS.get(model)!, fk)) broken.push(`${model}.${fk}`);
    }
    expect(broken, `Missing the key their RLS policy needs: ${broken.join(", ")}`).toEqual([]);
  });

  it("the parent it joins to is itself directly scoped", () => {
    // Otherwise the policy needs two joins, and nobody has written that down.
    for (const [model, { parent }] of Object.entries(VIA_JOIN)) {
      expect(DIRECT, `${model} joins to ${parent}, which is not directly scoped`).toContain(parent);
    }
  });

  it("⚠ is empty, so every policy is the same predicate", () => {
    // Not a style preference. Each entry here is a hand-written EXISTS policy,
    // and those are both the easiest to get wrong and the ones that cost per row.
    expect(Object.keys(VIA_JOIN)).toEqual([]);
  });
});

describe("models with no tenant", () => {
  it("each has a stated reason, not just an absence", () => {
    for (const [model, reason] of Object.entries(NOT_TENANT_SCOPED)) {
      expect(reason.length, `${model} needs a reason`).toBeGreaterThan(20);
    }
  });

  it("⚠ none of them quietly grew a schoolId", () => {
    // If one does, it is probably tenant-scoped after all and its queries should
    // be going through the scoped layer.
    const surprising = Object.keys(NOT_TENANT_SCOPED).filter(
      (m) => m !== "School" && hasField(MODELS.get(m)!, "schoolId"),
    );
    expect(surprising, `Now carry schoolId — should these be scoped? ${surprising.join(", ")}`).toEqual([]);
  });
});

/**
 * ⚠ NOBODY MAY CALL `db.$transaction` — AND THE REASON IS NOT STYLE.
 *
 * `db` is extended: to bind `app.school_ids` for row-level security, the
 * extension re-issues EVERY query inside its own `base.$transaction` (see
 * db.ts). So a `db.$transaction` — in either form, the array batch or the
 * interactive callback — hands its statements to an outer transaction that they
 * never actually join, and the outer one holds nothing together. Atomicity is
 * silently gone.
 *
 * DEMONSTRATED, NOT REASONED ABOUT. With a tenant bound and a deliberate failure
 * on the second statement of three otherwise-identical transactions:
 *
 *     db.$transaction([...])            first statement PERSISTED   (not atomic)
 *     db.$transaction(async (tx) => …)  first statement PERSISTED   (not atomic)
 *     db.$tenantTransaction(…)          first statement ROLLED BACK (atomic)
 *
 * It was found at five call sites. What made it survive is that no test could
 * see it: `npm test` has no session cookie, so the tenant resolves empty, the
 * extension short-circuits, and both broken forms behave like a normal Prisma
 * transaction. The bug only exists in a real request — which is exactly the
 * property that makes a grep the right check rather than a runtime one.
 *
 * The stakes, from those five: recovery codes deleted and not replaced (a second
 * factor with no way past it), a leave request cancelled with its cover still
 * standing, a class left with no weighting categories at all.
 */
describe("⚠ transactions bind the tenant", () => {
  const SOURCES = globSource(resolve(process.cwd(), "src"));

  it("no source file calls db.$transaction", () => {
    const offenders: string[] = [];
    for (const file of SOURCES) {
      const body = readFileSync(file, "utf8");
      // Comments discussing the hazard are the point of this rule, not a breach
      // of it — so only lines that actually CALL it count.
      body.split("\n").forEach((line, index) => {
        const code = line.replace(/^\s*(\/\/|\*|\/\*).*$/, "");
        if (/\bdb\s*\.\s*\$transaction\s*\(/.test(code)) {
          offenders.push(`${file.replace(process.cwd() + "/", "")}:${index + 1}`);
        }
      });
    }

    expect(
      offenders,
      "db.$transaction is not atomic on the extended client — the per-query " +
        "extension re-issues each statement in its own transaction. Use " +
        "db.$tenantTransaction, which binds the tenant once and keeps them " +
        "together. See src/lib/school-record.ts for the idiom.",
    ).toEqual([]);
  });

  it("⚠ and the rule can actually fail", () => {
    // A guard that cannot go red is decoration. This proves the matcher sees
    // the thing it is looking for, in both the forms that were found broken.
    const pattern = /\bdb\s*\.\s*\$transaction\s*\(/;
    expect(pattern.test("await db.$transaction([a, b]);")).toBe(true);
    expect(pattern.test("return db.$transaction(async (tx) => {")).toBe(true);
    expect(pattern.test("await db . $transaction ( [")).toBe(true);
    // …and does not trip on the replacement, which is the whole point.
    expect(pattern.test("await db.$tenantTransaction(async (tx) => {")).toBe(false);
  });
});
