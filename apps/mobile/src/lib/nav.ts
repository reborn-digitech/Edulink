import { DUTY_STREAMS, PLATFORM_FEATURES, type AnyDutyCode, type FeatureCode, type RoleCode, type SchoolModuleCode, type StreamCode } from "@edulink/contracts";
import type { TranslationKey } from "@edulink/i18n";

/** The streams that keep labs and a practical record (those that offer a lab in-charge, 5 Oct 2026). */
const LAB_STREAMS: readonly StreamCode[] = DUTY_STREAMS.LAB_INCHARGE === "ALL" ? [] : DUTY_STREAMS.LAB_INCHARGE;
/** The streams that post students to a hospital (R-56, the clinical half; 10 Oct 2026). */
const CLINICAL_STREAMS: readonly StreamCode[] = DUTY_STREAMS.CLINICAL_COORDINATOR === "ALL" ? [] : DUTY_STREAMS.CLINICAL_COORDINATOR;

/**
 * The bottom tab bar per role: the web NAV's primaries, at most four plus
 * "More", which holds the rest of that role's entries as a sheet. Routes are
 * the app's own (expo-router), named after the web's paths so a notification
 * URL the server already writes maps across (see lib/links.ts).
 */
/**
 * `module` (3 Oct 2026): the tab exists only while the active school has that
 * module on (/api/v1/me's `modules`); the layout hides it otherwise. A module
 * builder adds a role's tabs and More entries with this field, as on the web.
 */
/**
 * `duty` (5 Oct 2026): the tab or entry exists only for a FACULTY or HOD who
 * holds that duty (/api/v1/me's `duties`), as the web's NAV entries with `duty`.
 * (owner-batch-item9, 27 Oct 2026) An office duty — HEAD_PAGES, the head's pages
 * the PRINCIPAL gives an ADMIN — hides an ADMIN's tab or entry the same way, read
 * from /api/v1/me's `adminDuties` (`dutiesOfMe`).
 */
/**
 * `feature` (15 Oct 2026): the tab or entry exists only while the platform feature is on for this person
 * (/api/v1/me's `features`), as the web's NAV entries with `feature`; a list is "any of" (sessions, shared by
 * expert and teacher sessions). The operator switches them at /root/features on the web.
 */
type FeatureField = FeatureCode | readonly FeatureCode[];
export type Tab = { name: string; labelKey: TranslationKey; icon: string; module?: SchoolModuleCode; duty?: AnyDutyCode; feature?: FeatureField };

/** Both kinds of sessions: the sessions screen stays while either is on. */
export const SESSION_FEATURES: readonly FeatureCode[] = ["EXPERT_SESSIONS", "TEACHER_SESSIONS"];

/**
 * What a server older than the switches meant (its /me says nothing of `features`): everything ran as it
 * always had, and the teachers' question gig was off by a constant. So an older server keeps every entry
 * but the gig's, as before.
 */
export const FEATURES_BEFORE_SWITCHES: readonly FeatureCode[] = PLATFORM_FEATURES.filter((code) => code !== "QUESTION_GIG");

/** The features this person may use, from /me; an older server's answer reads as FEATURES_BEFORE_SWITCHES. */
export function featuresOf(me: { features?: readonly FeatureCode[] } | null | undefined): readonly FeatureCode[] {
  return me?.features ?? FEATURES_BEFORE_SWITCHES;
}

/** Whether an entry's feature (any of a list) is among `on`; an entry with none always is. */
export function featureShown(item: { feature?: FeatureField }, on: readonly string[]): boolean {
  if (!item.feature) return true;
  return (typeof item.feature === "string" ? [item.feature] : item.feature).some((f) => on.includes(f));
}

export const TABS: Record<RoleCode, Tab[]> = {
  TEACHER: [
    { name: "index", labelKey: "nav.today", icon: "house" },
    { name: "attendance", labelKey: "nav.register", icon: "checks" },
    { name: "classes", labelKey: "nav.classes", icon: "chalkboard" },
    { name: "messages", labelKey: "nav.messages", icon: "chat" },
  ],
  PARENT: [
    { name: "index", labelKey: "nav.overview", icon: "house" },
    { name: "attendance", labelKey: "nav.attendance", icon: "checks" },
    { name: "assignments", labelKey: "nav.assignments", icon: "clipboard" },
    { name: "messages", labelKey: "nav.messages", icon: "chat" },
  ],
  STUDENT: [
    { name: "index", labelKey: "nav.today", icon: "house" },
    { name: "assignments", labelKey: "nav.assignments", icon: "clipboard" },
    { name: "practice", labelKey: "nav.practice", icon: "brain", feature: "QUESTION_BANK" },
    { name: "messages", labelKey: "nav.messages", icon: "chat" },
  ],
  ADMIN: [
    { name: "index", labelKey: "nav.overview", icon: "house" },
    { name: "people", labelKey: "nav.people", icon: "users" },
    // The leave queue, for an admin the head has given the head's pages (owner-batch-item9).
    { name: "leave", labelKey: "nav.leave", icon: "calendar", duty: "HEAD_PAGES" },
    { name: "messages", labelKey: "nav.messages", icon: "chat" },
  ],
  PRINCIPAL: [
    { name: "index", labelKey: "nav.dashboard", icon: "chartLine" },
    { name: "classes", labelKey: "nav.classes", icon: "chalkboard" },
    { name: "leave", labelKey: "nav.leave", icon: "calendar" },
    { name: "messages", labelKey: "nav.messages", icon: "chat" },
  ],
  EXPERT: [
    { name: "index", labelKey: "nav.bookings", icon: "house" },
    { name: "availability", labelKey: "nav.availability", icon: "calendar", feature: "EXPERT_SESSIONS" },
    { name: "mentoring", labelKey: "nav.mentoring", icon: "chat", feature: "EXPERT_SESSIONS" },
    // Sessions and workshops with pupils (gigs): a primary of the expert's on the web, and their fourth tab here. For every other role it is a More entry.
    { name: "sessions", labelKey: "nav.sessions", icon: "users", feature: "EXPERT_SESSIONS" },
  ],
  // The module roles (3 Oct 2026): a home that says whether the module is on; a module builder adds the rest.
  DRIVER: [{ name: "index", labelKey: "modules.transportName", icon: "bus" }],
  LIBRARIAN: [{ name: "index", labelKey: "modules.libraryName", icon: "bookOpen" }],
  WARDEN: [{ name: "index", labelKey: "modules.hostelName", icon: "bed" }],
  // A former pupil reads the school's feed and writes to its staff.
  ALUMNUS: [
    { name: "index", labelKey: "modules.alumniName", icon: "graduationCap" },
    { name: "messages", labelKey: "nav.messages", icon: "chat", module: "ALUMNI" },
  ],
  // The college's seven (4 Oct 2026): a home that says whether the role's module is on; each module's builder adds the rest.
  // The bars (the integration's phone helper, 4 Oct 2026): the web NAV's primaries — the home and the college's feed
  // (GET /api/v1/shared/bulletin names the six in limitedRoles) — and, for FACULTY and HOD, the academics screen
  // their doors name (mentoring; an HOD's own teaching) and Messages (5 Oct 2026: the rooms' doors, the people to
  // write to and POST /api/v1/messages name FACULTY and HOD, as the web's /remarks does for them). G4-30 (risks batch,
  // 5 Oct 2026): the exam cell, the IQAC, placement and accounts desks have Messages too, the same inbox, rooms and
  // people picker, now that those doors name them (ADMIN and PRINCIPAL had it already).
  // A home tab's label is a word or two (B-14, campaign 2026-10-04): "Head of department" and "Training and placement
  // officer" were cut off at 390 px; the department, the exam cell and placement name the desk instead.
  FACULTY: [
    { name: "index", labelKey: "role.faculty", icon: "chalkboard" },
    { name: "academics-mentoring", labelKey: "academics.mentoringTitle", icon: "chat", module: "ACADEMICS" },
    { name: "bulletin", labelKey: "nav.bulletin", icon: "megaphone" },
    { name: "messages", labelKey: "nav.messages", icon: "envelope" },
  ],
  HOD: [
    { name: "index", labelKey: "mobile.tabDepartment", icon: "users" },
    { name: "teaching", labelKey: "academics.myTeaching", icon: "chalkboard", module: "ACADEMICS" },
    { name: "bulletin", labelKey: "nav.bulletin", icon: "megaphone" },
    { name: "messages", labelKey: "nav.messages", icon: "envelope" },
  ],
  EXAM_CONTROLLER: [
    { name: "index", labelKey: "mobile.tabExamCell", icon: "clipboard" },
    { name: "bulletin", labelKey: "nav.bulletin", icon: "megaphone" },
    { name: "messages", labelKey: "nav.messages", icon: "envelope" },
  ],
  IQAC: [
    { name: "index", labelKey: "role.iqac", icon: "medal" },
    { name: "bulletin", labelKey: "nav.bulletin", icon: "megaphone" },
    { name: "messages", labelKey: "nav.messages", icon: "envelope" },
  ],
  TPO: [
    { name: "index", labelKey: "mobile.tabPlacement", icon: "chartLine" },
    { name: "bulletin", labelKey: "nav.bulletin", icon: "megaphone" },
    { name: "messages", labelKey: "nav.messages", icon: "envelope" },
  ],
  ACCOUNTS: [
    { name: "index", labelKey: "role.accounts", icon: "receipt" },
    { name: "bulletin", labelKey: "nav.bulletin", icon: "megaphone" },
    { name: "messages", labelKey: "nav.messages", icon: "envelope" },
  ],
  // An outside account like the expert: its home, and its account in More.
  RECRUITER: [{ name: "index", labelKey: "role.recruiter", icon: "handshake" }],
  // owner-batch-item2a (27 Oct 2026): support staff, given a login, read their own payslips (the home tab) and their account.
  SUPPORT: [{ name: "index", labelKey: "supportStaff.tabPayslips", icon: "receipt" }],
};

/** Every screen name any role has a tab for; the tab layout declares them all and hides the rest per role. */
export const ALL_TAB_SCREENS = ["index", "attendance", "classes", "messages", "assignments", "practice", "people", "leave", "availability", "mentoring", "sessions", "teaching", "academics-mentoring", "bulletin", "more"] as const;

/**
 * The rest of the web's NAV for each role — what the web's rail and More
 * sheet list under its groups: the office's and the head's seven (Teaching,
 * People and records, Attendance and cover, Money, Communication, Modules,
 * Setup; the owner's decision of 27 October 2026, item 3), every other role's
 * three ("Day to day", "School life" and "Running things"), and `me`, the
 * person's own pages, which the More screen draws in its own "Me" area under
 * the person, as the web's account menu does. Each entry is either a screen
 * the app has (`screen`, an expo-router path) or a page the phone does not
 * carry and opens on the web, signed in there (`web`). The order is the web's.
 * A role's primaries (TABS) are not repeated here: the bar already has them.
 * The web's tests/nav-groups.test.ts holds the groups to the web's.
 */
export type MenuGroup = "daily" | "school" | "running" | "teaching" | "people" | "attendance" | "money" | "communication" | "modules" | "setup" | "me";
/** `streams` (5 Oct 2026): hidden at a college whose recorded streams include none of them (the practical record at a law college); none recorded keeps it. */
/** `schoolOnly` (TA-269, 14 Nov 2026): the school version's page, hidden while the active place is a college (the web's `kinds: SCHOOL_KINDS`). */
export type MenuItem = { labelKey: TranslationKey; icon: string; group: MenuGroup; module?: SchoolModuleCode; duty?: AnyDutyCode; streams?: readonly StreamCode[]; feature?: FeatureField; schoolOnly?: true } & ({ screen: string; web?: undefined } | { web: string; screen?: undefined });

/**
 * What every college staff role's More carries (4 Oct 2026): the account, and my own leave (GET/POST
 * /api/v1/staff/leave name the six since the integration). The college's feed is a tab of theirs now.
 */
/**
 * What every member of staff without a teacher's menu keeps for themselves (campaign 2026-10-04, G-1 and G-2):
 * "I'm in" and my own days (/api/v1/staff/attendance/me and check-in name every staff role), and my payslips
 * while the institution runs payroll in the app (/api/v1/account/payslips likewise).
 */
const OWN_STAFF_ENTRIES: MenuItem[] = [
  { labelKey: "nav.staffAttendance", icon: "checks", group: "running", screen: "/(app)/my-attendance" },
  { labelKey: "payroll.myTitle", icon: "receipt", group: "me", screen: "/(app)/payslips", module: "PAYROLL" },
];

/**
 * Read-only pages the web has and the phone opens there, signed in (QA-66, QA campaign of 24 October 2026): my
 * appointment letters, and the student council's notices. A letter is a PDF the web already serves; the parity table
 * (test/lib/parity.test.ts) records them as web pages on purpose.
 */
const MY_LETTERS: MenuItem = { labelKey: "appointmentLetters.mineTitle", icon: "receipt", group: "me", web: "/account/letters" };
const COUNCIL_NOTICES: MenuItem = { labelKey: "councilNotices.navTitle", icon: "megaphone", group: "school", web: "/bulletin/council" };

const COLLEGE_STAFF_MENU: MenuItem[] = [
  { labelKey: "nav.account", icon: "user", group: "me", screen: "/(app)/account" },
  { labelKey: "nav.leave", icon: "calendar", group: "running", screen: "/(app)/leave" },
  ...OWN_STAFF_ENTRIES,
  MY_LETTERS,
];

export const MENU_GROUP_KEY: Record<MenuGroup, TranslationKey> = {
  daily: "nav.groupDaily",
  school: "nav.groupSchool",
  running: "nav.groupRunning",
  teaching: "navGroup.teaching",
  people: "navGroup.people",
  attendance: "navGroup.attendance",
  money: "navGroup.money",
  communication: "navGroup.communication",
  modules: "navGroup.modules",
  setup: "navGroup.setup",
  me: "navGroup.me",
};
/** The office's and the head's seven groups, in the web rail's order (src/lib/nav.ts OFFICE_GROUPS). */
export const OFFICE_MENU_GROUPS: readonly MenuGroup[] = ["teaching", "people", "attendance", "money", "communication", "modules", "setup"];
/** Every other role's three. */
export const CLASSIC_MENU_GROUPS: readonly MenuGroup[] = ["daily", "school", "running"];
/** The person's own pages: the More screen's "Me" area, first, under the person. */
export const ME_MENU_GROUP: MenuGroup = "me";
/** A More section starts closed until the person opens it (as on the web). */
export const MENU_GROUPS_CLOSED_BY_DEFAULT: readonly MenuGroup[] = ["setup"];
/** The More screen's collapsible groups for a role, in order (the web's navGroupsFor); `me` is not one of them. */
export function menuGroupsFor(role: RoleCode): readonly MenuGroup[] {
  return role === "ADMIN" || role === "PRINCIPAL" ? OFFICE_MENU_GROUPS : CLASSIC_MENU_GROUPS;
}
/** Where the More screen remembers which sections are open, per role (the web keeps its own in localStorage). */
export function menuOpenKey(role: RoleCode): string {
  return `edulink.more.groups.${role}`;
}

export const MENU: Record<RoleCode, MenuItem[]> = {
  TEACHER: [
    { labelKey: "nav.assignments", icon: "clipboard", group: "daily", screen: "/(app)/assignments" },
    { labelKey: "nav.exams", icon: "clipboard", group: "daily", screen: "/(app)/exams" },
    { labelKey: "nav.timetable", icon: "clock", group: "daily", screen: "/(app)/timetable" },
    { labelKey: "nav.practice", icon: "brain", group: "daily", screen: "/(app)/practice", feature: "QUESTION_BANK" },
    { labelKey: "nav.meetings", icon: "calendar", group: "daily", screen: "/(app)/meetings" },
    { labelKey: "nav.leave", icon: "calendar", group: "running", screen: "/(app)/leave" },
    { labelKey: "nav.staffAttendance", icon: "checks", group: "running", screen: "/(app)/my-attendance" },
    { labelKey: "substitutions.myCoversTitle", icon: "arrowsClockwise", group: "running", screen: "/(app)/my-covers" },
    { labelKey: "nav.incidents", icon: "firstAid", group: "running", screen: "/(app)/incidents" },
    { labelKey: "nav.me", icon: "user", group: "me", screen: "/(app)/profile" },
    // What the head has shown me of my observations, targets and appraisals (the web's /teacher/appraisals).
    { labelKey: "appraisal.myTitle", icon: "clipboard", group: "running", screen: "/(app)/my-appraisals" },
    { labelKey: "joinRequests.navLabel", icon: "userPlus", group: "running", screen: "/(app)/joins" },
    { labelKey: "nav.bulletin", icon: "megaphone", group: "school", screen: "/(app)/bulletin" },
    { labelKey: "nav.experts", icon: "briefcase", group: "school", screen: "/(app)/experts", feature: "EXPERT_SESSIONS" },
    { labelKey: "nav.vacancies", icon: "briefcase", group: "school", screen: "/(app)/vacancies", feature: "JOB_BOARD" },
    { labelKey: "nav.enquiries", icon: "envelope", group: "school", screen: "/(app)/enquiries" },
    { labelKey: "nav.mentoring", icon: "chat", group: "school", screen: "/(app)/mentoring", feature: "EXPERT_SESSIONS" },
    { labelKey: "nav.pastYears", icon: "archive", group: "school", screen: "/(app)/archive" },
    { labelKey: "nav.account", icon: "user", group: "me", screen: "/(app)/account" },
    { labelKey: "nav.guidance", icon: "calendar", group: "school", screen: "/(app)/sessions", feature: "TEACHER_SESSIONS" },
    // The question gig (review-queue, 10 Oct 2026): since 15 Oct 2026 the QUESTION_GIG platform feature, from /me's `features`.
    { labelKey: "nav.contributions", icon: "clipboard", group: "running", screen: "/(app)/contributions", feature: "QUESTION_GIG" },
    { labelKey: "nav.signatures", icon: "pencil", group: "running", screen: "/(app)/signatures" },
    // My own payslips while the school runs payroll in the app (3 Oct 2026).
    { labelKey: "payroll.myTitle", icon: "receipt", group: "me", screen: "/(app)/payslips", module: "PAYROLL" },
    // My loans and the catalogue (the library module, 3 Oct 2026).
    { labelKey: "modules.libraryName", icon: "bookOpen", group: "school", screen: "/(app)/library", module: "LIBRARY" },
    // Things issued to me (the parity batch, 10 Oct 2026, R-4): the web's /account/items.
    { labelKey: "inventory.myTitle", icon: "archive", group: "me", screen: "/(app)/my-items", module: "INVENTORY" },
    MY_LETTERS,
  ],
  STUDENT: [
    { labelKey: "nav.exams", icon: "chartLine", group: "daily", screen: "/(app)/exams" },
    { labelKey: "agenda.title", icon: "calendar", group: "daily", screen: "/(app)/agenda" },
    { labelKey: "fees.myFeesTitle", icon: "receipt", group: "daily", screen: "/(app)/fees" },
    { labelKey: "nav.certificates", icon: "fileText", group: "daily", screen: "/(app)/certificates" },
    { labelKey: "nav.timetable", icon: "clock", group: "daily", screen: "/(app)/timetable" },
    { labelKey: "nav.feedback", icon: "star", group: "daily", screen: "/(app)/reviews" },
    // The pupil's own health card and incident log, read-only from the age the school sets; below it, "ask a grown-up".
    { labelKey: "nav.health", icon: "heart", group: "daily", screen: "/(app)/health" },
    { labelKey: "nav.incidents", icon: "firstAid", group: "daily", screen: "/(app)/family-incidents" },
    { labelKey: "nav.bulletin", icon: "megaphone", group: "school", screen: "/(app)/bulletin" },
    { labelKey: "nav.mentoring", icon: "chat", group: "school", screen: "/(app)/mentoring", feature: "EXPERT_SESSIONS" },
    // What an adult student at a college lets their guardians see (4 Oct 2026); under ACADEMICS, which only a college has.
    { labelKey: "consent.title", icon: "users", group: "running", screen: "/(app)/consent", module: "ACADEMICS" },
    { labelKey: "nav.pastYears", icon: "archive", group: "school", screen: "/(app)/archive" },
    { labelKey: "nav.me", icon: "user", group: "me", screen: "/(app)/profile" },
    { labelKey: "nav.account", icon: "user", group: "me", screen: "/(app)/account" },
    { labelKey: "nav.sessions", icon: "calendar", group: "school", screen: "/(app)/sessions", feature: SESSION_FEATURES },
    // The library and the hostel (3 Oct 2026): my loans and the catalogue; my room, tonight's roll call and leave.
    { labelKey: "modules.libraryName", icon: "bookOpen", group: "school", screen: "/(app)/library", module: "LIBRARY" },
    { labelKey: "modules.hostelName", icon: "bed", group: "school", screen: "/(app)/hostel", module: "HOSTEL" },
    // owner-batch-item5 (27 Oct 2026): the rider's own bus, the family's transport screen read as the pupil (the web's /student/transport).
    { labelKey: "schoolCampus.myBus", icon: "bus", group: "school", screen: "/(app)/transport", module: "TRANSPORT" },
    // My courses, lectures, attendance, internal marks and registration (the college's academics, 4 Oct 2026).
    { labelKey: "academics.studentTitle", icon: "graduationCap", group: "daily", screen: "/(app)/academics", module: "ACADEMICS" },
    { labelKey: "academics.registrationTitle", icon: "clipboard", group: "daily", screen: "/(app)/registration", module: "ACADEMICS" },
    // An architecture student's studios: stages, a submission note and the signed jury results (R-56, the studio half, 10 Oct 2026).
    { labelKey: "duties.studio.studentTitle", icon: "palette", group: "daily", screen: "/(app)/student-studios", module: "ACADEMICS", streams: ["ARCHITECTURE"] },
    // A college student's money net of scholarships, the scholarships and their own account (the college office, 4 Oct 2026; ACADEMICS stands for "a college").
    { labelKey: "collegeOffice.moneyTitle", icon: "receipt", group: "daily", screen: "/(app)/money", module: "ACADEMICS" },
    { labelKey: "collegeOffice.navScholarships", icon: "receipt", group: "daily", screen: "/(app)/scholarships", module: "SCHOLARSHIPS" },
    { labelKey: "collegeOffice.accountTitle", icon: "user", group: "running", screen: "/(app)/student-account", module: "ACADEMICS" },
    // The IQAC module (4 Oct 2026): course feedback, the satisfaction survey and a grievance.
    { labelKey: "iqac.navVoice", icon: "star", group: "school", screen: "/(app)/voice", module: "IQAC" },
    // A college student's exams (the exam cell, 4 Oct 2026): the form, hall ticket, results, grade cards, backlogs, credits.
    { labelKey: "examCell.mineTitle", icon: "chartLine", group: "daily", screen: "/(app)/college-exams", module: "EXAMS" },
    // Placement (4 Oct 2026): drives, offers, internships, the aptitude bank.
    { labelKey: "placement.navStudent", icon: "briefcase", group: "school", screen: "/(app)/placement", module: "PLACEMENT" },
    // Pre-placement talks and soft-skills training (R-2, 5 Oct 2026): answer a talk, enrol in a training.
    { labelKey: "talks.studentTitle", icon: "megaphone", group: "school", screen: "/(app)/placement-talks", module: "PLACEMENT" },
    { labelKey: "softSkills.studentTitle", icon: "graduationCap", group: "school", screen: "/(app)/soft-skills", module: "PLACEMENT" },
    // A health-sciences or pharmacy student's clinical logbook (R-56, the clinical half; 10 Oct 2026); no guardian screen.
    { labelKey: "duties.clinical.myTitle", icon: "firstAid", group: "daily", screen: "/(app)/clinical-logbook", module: "ACADEMICS", streams: CLINICAL_STREAMS },
    COUNCIL_NOTICES,
  ],
  PARENT: [
    { labelKey: "nav.exams", icon: "chartLine", group: "daily", screen: "/(app)/exams" },
    { labelKey: "nav.practice", icon: "brain", group: "daily", screen: "/(app)/practice", feature: "QUESTION_BANK" },
    { labelKey: "nav.timetable", icon: "clock", group: "daily", screen: "/(app)/timetable" },
    { labelKey: "nav.meetings", icon: "calendar", group: "daily", screen: "/(app)/meetings" },
    { labelKey: "nav.fees", icon: "receipt", group: "daily", screen: "/(app)/fees" },
    { labelKey: "agenda.title", icon: "calendar", group: "daily", screen: "/(app)/agenda" },
    { labelKey: "nav.health", icon: "heart", group: "daily", screen: "/(app)/health" },
    { labelKey: "nav.certificates", icon: "fileText", group: "daily", screen: "/(app)/certificates" },
    { labelKey: "nav.incidents", icon: "firstAid", group: "daily", screen: "/(app)/family-incidents" },
    // The child's bus (transport, 3 Oct 2026): route, stop, and the bus on a map during a trip; a family's module entries follow the children's schools (/me's modules, 4 Oct 2026).
    { labelKey: "transport.parentTitle", icon: "bus", group: "daily", screen: "/(app)/transport", module: "TRANSPORT" },
    { labelKey: "nav.feedback", icon: "star", group: "daily", screen: "/(app)/reviews" },
    { labelKey: "joinRequests.parentClaimsNav", icon: "userPlus", group: "daily", screen: "/(app)/joins" },
    { labelKey: "nav.bulletin", icon: "megaphone", group: "school", screen: "/(app)/bulletin" },
    { labelKey: "nav.explore", icon: "buildings", group: "school", screen: "/(app)/explore" },
    { labelKey: "nav.applications", icon: "clipboard", group: "school", screen: "/(app)/my-applications" },
    { labelKey: "nav.enquiries", icon: "envelope", group: "school", screen: "/(app)/enquiries" },
    { labelKey: "nav.mentoring", icon: "chat", group: "school", screen: "/(app)/mentoring", feature: "EXPERT_SESSIONS" },
    { labelKey: "nav.pastYears", icon: "archive", group: "school", screen: "/(app)/archive" },
    { labelKey: "nav.settings", icon: "gear", group: "running", screen: "/(app)/settings" },
    { labelKey: "nav.account", icon: "user", group: "me", screen: "/(app)/account" },
    { labelKey: "nav.sessions", icon: "calendar", group: "school", screen: "/(app)/sessions", feature: SESSION_FEATURES },
    // The library and the hostel (3 Oct 2026). No `module`: a parent's /me names no school, so each screen says when the child's school has it off.
    { labelKey: "modules.libraryName", icon: "bookOpen", group: "daily", screen: "/(app)/library" },
    { labelKey: "modules.hostelName", icon: "bed", group: "daily", screen: "/(app)/hostel" },
    // A college child's lecture attendance (4 Oct 2026): /me's modules are the children's schools' for a family.
    { labelKey: "academics.familyTitle", icon: "graduationCap", group: "daily", screen: "/(app)/academics", module: "ACADEMICS" },
    // A college child's results (the exam cell, 4 Oct 2026): a minor's always, an adult's under the RESULTS grant.
    { labelKey: "examCell.parentTitle", icon: "chartLine", group: "daily", screen: "/(app)/college-exams", module: "EXAMS" },
    // A child's offers and internships (placement, 4 Oct 2026), on the web; the page says when the grant is off.
    { labelKey: "placement.navParent", icon: "briefcase", group: "school", web: "/parent/placement" },
    // The parent survey of a child's college (campaign 2026-10-04, G-5): the voice screen, with no grievance line for a guardian.
    { labelKey: "iqac.navParentVoice", icon: "star", group: "school", screen: "/(app)/voice", module: "IQAC" },
    // A college child's money net of the scholarship (5 Oct 2026, the web's /parent/money): a minor's always, an adult's under the MONEY grant.
    { labelKey: "collegeOffice.moneyTitle", icon: "receipt", group: "school", screen: "/(app)/money", module: "ACADEMICS" },
  ],
  ADMIN: [
    { labelKey: "nav.classes", icon: "chalkboard", group: "teaching", screen: "/(app)/classes" },
    { labelKey: "nav.timetable", icon: "clock", group: "teaching", screen: "/(app)/timetable" },
    { labelKey: "nav.exams", icon: "clipboard", group: "teaching", screen: "/(app)/exams" },
    { labelKey: "nav.syllabus", icon: "books", group: "teaching", screen: "/(app)/syllabus-coverage" },
    { labelKey: "nav.reportCards", icon: "clipboard", group: "teaching", screen: "/(app)/report-card-rules" },
    { labelKey: "nav.substitutions", icon: "arrowsClockwise", group: "teaching", screen: "/(app)/substitutions" },
    { labelKey: "academics.title", icon: "graduationCap", group: "teaching", screen: "/(app)/office-academics", module: "ACADEMICS" },
    { labelKey: "examCell.title", icon: "clipboard", group: "teaching", screen: "/(app)/exam-cell", module: "EXAMS" },
    { labelKey: "streamRecords.title", icon: "clipboard", group: "teaching", screen: "/(app)/stream-records", module: "ACADEMICS" },
    { labelKey: "nav.staff", icon: "users", group: "people", screen: "/(app)/staff" },
    { labelKey: "nav.invites", icon: "plus", group: "people", screen: "/(app)/invites" },
    { labelKey: "nav.pupilRecords", icon: "clipboard", group: "people", screen: "/(app)/pupil-records" },
    { labelKey: "nav.certificates", icon: "fileText", group: "people", screen: "/(app)/staff-certificates" },
    { labelKey: "nav.admissions", icon: "users", group: "people", screen: "/(app)/admissions", schoolOnly: true },
    { labelKey: "nav.enquiries", icon: "envelope", group: "people", screen: "/(app)/enquiries" },
    { labelKey: "joinRequests.navLabel", icon: "userPlus", group: "people", screen: "/(app)/joins" },
    { labelKey: "nav.pastYears", icon: "archive", group: "people", screen: "/(app)/archive" },
    // The alumni module (3 Oct 2026): the office's page on the web, and the directory here.
    { labelKey: "modules.alumniName", icon: "graduationCap", group: "people", screen: "/(app)/office-alumni", module: "ALUMNI" },
    { labelKey: "alumni.directoryTitle", icon: "users", group: "people", screen: "/(app)/alumni-directory", module: "ALUMNI" },
    { labelKey: "collegeOffice.admissionsTitle", icon: "userPlus", group: "people", screen: "/(app)/office-admissions", module: "ADMISSIONS" },
    { labelKey: "iqac.navFacultyRecords", icon: "clipboard", group: "people", screen: "/(app)/faculty-records", module: "IQAC" },
    { labelKey: "nav.attendance", icon: "checks", group: "attendance", screen: "/(app)/attendance" },
    { labelKey: "nav.staffAttendance", icon: "checks", group: "attendance", screen: "/(app)/staff-attendance" },
    { labelKey: "nav.calendar", icon: "calendar", group: "attendance", screen: "/(app)/calendar" },
    { labelKey: "nav.fees", icon: "receipt", group: "money", screen: "/(app)/fees" },
    { labelKey: "payroll.title", icon: "receipt", group: "money", screen: "/(app)/payroll", module: "PAYROLL" },
    // Inventory and payroll (3 Oct 2026): the office's summaries, read-only here, and its own payslips.
    { labelKey: "inventory.title", icon: "archive", group: "money", screen: "/(app)/inventory", module: "INVENTORY" },
    { labelKey: "role.accounts", icon: "receipt", group: "money", screen: "/(app)/accounts", module: "ACADEMICS" },
    { labelKey: "nav.bulletin", icon: "megaphone", group: "communication", screen: "/(app)/bulletin" },
    { labelKey: "nav.circulars", icon: "megaphone", group: "communication", screen: "/(app)/circulars" },
    { labelKey: "nav.messaging", icon: "chats", group: "communication", screen: "/(app)/messaging" },
    { ...COUNCIL_NOTICES, group: "communication" },
    { labelKey: "nav.incidents", icon: "firstAid", group: "communication", screen: "/(app)/incidents" },
    { labelKey: "nav.safety", icon: "shield", group: "communication", screen: "/(app)/safety", duty: "HEAD_PAGES" },
    { labelKey: "nav.experts", icon: "briefcase", group: "communication", screen: "/(app)/experts", feature: "EXPERT_SESSIONS" },
    { labelKey: "nav.vacancies", icon: "briefcase", group: "communication", screen: "/(app)/vacancies", feature: "JOB_BOARD" },
    { labelKey: "nav.mentoring", icon: "chat", group: "communication", screen: "/(app)/mentoring", feature: "EXPERT_SESSIONS" },
    { labelKey: "nav.sessions", icon: "calendar", group: "communication", screen: "/(app)/sessions", feature: SESSION_FEATURES },
    // Transport (3 Oct 2026): the office's routes, buses, seats and the day's trips on a map, on the web.
    { labelKey: "transport.title", icon: "bus", group: "modules", screen: "/(app)/office-transport", module: "TRANSPORT" },
    // The library desk on the web; the hostel at a glance native since the parity batch (10 Oct 2026).
    { labelKey: "modules.libraryName", icon: "bookOpen", group: "modules", web: "/library", module: "LIBRARY" },
    { labelKey: "modules.hostelName", icon: "bed", group: "modules", screen: "/(app)/office-hostel", module: "HOSTEL" },
    // website-three (17 Oct 2026): the school's website at a glance, read-only; built and changed on the web.
    { labelKey: "modules.websiteName", icon: "globe", group: "modules", screen: "/(app)/website", module: "WEBSITE" },
    // end website-three
    // The college's office (campaign 2026-10-04, G-4; native reads since the parity batch, 10 Oct 2026, R-4): the registrar's
    // entries the web's NAV lists, each under its module; ACADEMICS stands for "is a college". The structure, the admission
    // rounds, the accounts, exam cell, placement and IQAC homes, the faculty records and the stream records are screens;
    // the campus settings and the committees stay on the web.
    { labelKey: "collegeHub.title", icon: "chartLine", group: "modules", screen: "/(app)/college", module: "ACADEMICS" },
    { labelKey: "collegeOffice.campusTitle", icon: "buildings", group: "modules", web: "/admin/college-campus", module: "ACADEMICS" },
    { labelKey: "placement.navCell", icon: "briefcase", group: "modules", screen: "/(app)/placement-cell", module: "PLACEMENT" },
    { labelKey: "iqac.navHome", icon: "medal", group: "modules", screen: "/(app)/iqac-desk", module: "IQAC" },
    { labelKey: "iqac.navCommittees", icon: "users", group: "modules", web: "/admin/committees", module: "IQAC" },
    { labelKey: "nav.signatures", icon: "pencil", group: "setup", screen: "/(app)/signatures" },
    { labelKey: "nav.filings", icon: "fileText", group: "setup", screen: "/(app)/filings" },
    { labelKey: "nav.reviews", icon: "star", group: "setup", screen: "/(app)/reviews", duty: "HEAD_PAGES" },
    // The school across terms and years: the office reads what the head reads (the web's /principal/trends), holding the head's pages.
    { labelKey: "trends.title", icon: "chartLine", group: "setup", screen: "/(app)/trends", duty: "HEAD_PAGES" },
    { labelKey: "nav.directory", icon: "buildings", group: "setup", screen: "/(app)/directory-profile" },
    { labelKey: "nav.settings", icon: "gear", group: "setup", screen: "/(app)/settings" },
    { labelKey: "nav.account", icon: "user", group: "me", screen: "/(app)/account" },
    { labelKey: "payroll.myTitle", icon: "receipt", group: "me", screen: "/(app)/payslips", module: "PAYROLL" },
    MY_LETTERS,
    // Things issued to me (the parity batch, 10 Oct 2026, R-4): the web's /account/items.
    { labelKey: "inventory.myTitle", icon: "archive", group: "me", screen: "/(app)/my-items", module: "INVENTORY" },
  ],
  PRINCIPAL: [
    { labelKey: "nav.exams", icon: "clipboard", group: "teaching", screen: "/(app)/exams" },
    { labelKey: "nav.timetable", icon: "clock", group: "teaching", screen: "/(app)/timetable" },
    { labelKey: "nav.syllabus", icon: "books", group: "teaching", screen: "/(app)/syllabus-coverage" },
    { labelKey: "nav.reportCards", icon: "clipboard", group: "teaching", screen: "/(app)/report-card-rules" },
    { labelKey: "nav.substitutions", icon: "arrowsClockwise", group: "teaching", screen: "/(app)/substitutions" },
    { labelKey: "academics.title", icon: "graduationCap", group: "teaching", screen: "/(app)/office-academics", module: "ACADEMICS" },
    { labelKey: "examCell.title", icon: "clipboard", group: "teaching", screen: "/(app)/exam-cell", module: "EXAMS" },
    { labelKey: "streamRecords.title", icon: "clipboard", group: "teaching", screen: "/(app)/stream-records", module: "ACADEMICS" },
    { labelKey: "nav.staff", icon: "users", group: "people", screen: "/(app)/staff" },
    { labelKey: "nav.pupilRecords", icon: "clipboard", group: "people", screen: "/(app)/pupil-records" },
    { labelKey: "nav.certificates", icon: "fileText", group: "people", screen: "/(app)/staff-certificates" },
    { labelKey: "nav.admissions", icon: "users", group: "people", screen: "/(app)/admissions", schoolOnly: true },
    { labelKey: "nav.enquiries", icon: "envelope", group: "people", screen: "/(app)/enquiries" },
    { labelKey: "joinRequests.navLabel", icon: "userPlus", group: "people", screen: "/(app)/joins" },
    { labelKey: "nav.pastYears", icon: "archive", group: "people", screen: "/(app)/archive" },
    { labelKey: "collegeOffice.admissionsTitle", icon: "userPlus", group: "people", screen: "/(app)/office-admissions", module: "ADMISSIONS" },
    { labelKey: "iqac.navFacultyRecords", icon: "clipboard", group: "people", screen: "/(app)/faculty-records", module: "IQAC" },
    { labelKey: "nav.attendance", icon: "checks", group: "attendance", screen: "/(app)/attendance" },
    { labelKey: "nav.staffAttendance", icon: "checks", group: "attendance", screen: "/(app)/staff-attendance" },
    { labelKey: "nav.calendar", icon: "calendar", group: "attendance", screen: "/(app)/calendar" },
    { labelKey: "nav.fees", icon: "receipt", group: "money", screen: "/(app)/fees" },
    // The payroll summary and the stores, read; the head's own payslips (3 Oct 2026).
    { labelKey: "payroll.title", icon: "receipt", group: "money", screen: "/(app)/payroll", module: "PAYROLL" },
    { labelKey: "inventory.title", icon: "archive", group: "money", screen: "/(app)/inventory", module: "INVENTORY" },
    { labelKey: "role.accounts", icon: "receipt", group: "money", screen: "/(app)/accounts", module: "ACADEMICS" },
    { labelKey: "nav.bulletin", icon: "megaphone", group: "communication", screen: "/(app)/bulletin" },
    { labelKey: "nav.circulars", icon: "megaphone", group: "communication", screen: "/(app)/circulars" },
    { labelKey: "nav.messaging", icon: "chats", group: "communication", screen: "/(app)/messaging" },
    { ...COUNCIL_NOTICES, group: "communication" },
    { labelKey: "nav.incidents", icon: "firstAid", group: "communication", screen: "/(app)/incidents" },
    // The safety centre (owner-batch-item9): one of the head's pages, which the head always holds.
    { labelKey: "nav.safety", icon: "shield", group: "communication", screen: "/(app)/safety" },
    { labelKey: "nav.vacancies", icon: "briefcase", group: "communication", screen: "/(app)/vacancies", feature: "JOB_BOARD" },
    { labelKey: "nav.sessions", icon: "calendar", group: "communication", screen: "/(app)/sessions", feature: SESSION_FEATURES },
    // Transport (3 Oct 2026): the head reads the day's trips on the web.
    { labelKey: "transport.title", icon: "bus", group: "modules", screen: "/(app)/office-transport", module: "TRANSPORT" },
    // The library's reports on the web; the hostel at a glance native since the parity batch (10 Oct 2026).
    { labelKey: "modules.libraryName", icon: "bookOpen", group: "modules", web: "/library/reports", module: "LIBRARY" },
    { labelKey: "modules.hostelName", icon: "bed", group: "modules", screen: "/(app)/office-hostel", module: "HOSTEL" },
    // website-three (17 Oct 2026): the school's website at a glance, read-only; built and changed on the web.
    { labelKey: "modules.websiteName", icon: "globe", group: "modules", screen: "/(app)/website", module: "WEBSITE" },
    // end website-three
    // The college (campaign 2026-10-04, G-4; native reads since the parity batch, 10 Oct 2026, R-4): the head's entries the web's
    // NAV lists, each under its module; the accreditation file and the committees stay on the web, the filings' sign-off is
    // on the filings screen.
    { labelKey: "collegeHub.title", icon: "chartLine", group: "modules", screen: "/(app)/college", module: "ACADEMICS" },
    { labelKey: "placement.navCell", icon: "briefcase", group: "modules", screen: "/(app)/placement-cell", module: "PLACEMENT" },
    { labelKey: "iqac.navAccreditation", icon: "medal", group: "modules", web: "/principal/accreditation", module: "IQAC" },
    { labelKey: "iqac.navDocuments", icon: "clipboard", group: "modules", screen: "/(app)/iqac-filings", module: "IQAC" },
    { labelKey: "insightsPhone.title", icon: "lightbulb", group: "modules", screen: "/(app)/iqac-insights", module: "IQAC" },
    { labelKey: "iqac.navCommittees", icon: "users", group: "modules", web: "/admin/committees", module: "IQAC" },
    { labelKey: "nav.signatures", icon: "pencil", group: "setup", screen: "/(app)/signatures" },
    { labelKey: "nav.filings", icon: "fileText", group: "setup", screen: "/(app)/filings" },
    { labelKey: "nav.reviews", icon: "star", group: "setup", screen: "/(app)/reviews" },
    // The head's own decisions as sentences, read from the audit log (the web's /principal/decisions).
    { labelKey: "decisions.title", icon: "clipboard", group: "setup", screen: "/(app)/decisions" },
    // The school across terms and years, recomputed on every read (the web's /principal/trends).
    { labelKey: "trends.title", icon: "chartLine", group: "setup", screen: "/(app)/trends" },
    { labelKey: "nav.account", icon: "user", group: "me", screen: "/(app)/account" },
    { labelKey: "payroll.myTitle", icon: "receipt", group: "me", screen: "/(app)/payslips", module: "PAYROLL" },
    MY_LETTERS,
    // Things issued to me (the parity batch, 10 Oct 2026, R-4): the web's /account/items.
    { labelKey: "inventory.myTitle", icon: "archive", group: "me", screen: "/(app)/my-items", module: "INVENTORY" },
  ],
  EXPERT: [
    { labelKey: "nav.profile", icon: "user", group: "me", screen: "/(app)/profile" },
    { labelKey: "nav.account", icon: "user", group: "me", screen: "/(app)/account" },
  ],
  DRIVER: [
    { labelKey: "nav.account", icon: "user", group: "me", screen: "/(app)/account" },
    // My own leave (4 Oct 2026): GET/POST /api/v1/staff/leave name the three module staff roles.
    { labelKey: "nav.leave", icon: "calendar", group: "running", screen: "/(app)/leave" },
    ...OWN_STAFF_ENTRIES,
  ],
  LIBRARIAN: [
    { labelKey: "nav.account", icon: "user", group: "me", screen: "/(app)/account" },
    { labelKey: "nav.leave", icon: "calendar", group: "running", screen: "/(app)/leave" },
    ...OWN_STAFF_ENTRIES,
    // The desk is the home tab; the catalogue, fines and reports are the web's (the library module, 3 Oct 2026).
    { labelKey: "library.tabCatalogue", icon: "bookOpen", group: "daily", web: "/library/catalogue", module: "LIBRARY" },
    { labelKey: "library.tabFines", icon: "receipt", group: "daily", web: "/library/fines", module: "LIBRARY" },
    { labelKey: "library.tabReports", icon: "chartLine", group: "running", web: "/library/reports", module: "LIBRARY" },
    // The parity batch (10 Oct 2026, R-4): at a college, the e-resources with their open counts and the borrowing terms, and the library's line of the no-dues.
    { labelKey: "collegeOffice.libraryTitle", icon: "books", group: "running", screen: "/(app)/e-resources", module: "ACADEMICS" },
    { labelKey: "collegeOffice.navNoDues", icon: "checks", group: "daily", screen: "/(app)/no-dues", module: "ACADEMICS" },
  ],
  WARDEN: [
    { labelKey: "nav.account", icon: "user", group: "me", screen: "/(app)/account" },
    { labelKey: "nav.leave", icon: "calendar", group: "running", screen: "/(app)/leave" },
    ...OWN_STAFF_ENTRIES,
    // Roll call, leave and visitors are the home tab; rooms, the menu and incidents are the web's (the hostel module, 3 Oct 2026).
    { labelKey: "hostel.tabRooms", icon: "bed", group: "daily", web: "/hostel/rooms", module: "HOSTEL" },
    { labelKey: "hostel.tabMenu", icon: "clipboard", group: "running", web: "/hostel/menu", module: "HOSTEL" },
    { labelKey: "hostel.tabIncidents", icon: "firstAid", group: "running", web: "/hostel/incidents", module: "HOSTEL" },
    // The parity batch (10 Oct 2026, R-4): a proposal to end a boarder's place, the anti-ragging squad's rounds, the hostel's line of the no-dues.
    { labelKey: "collegeDesks.expulsionsTab", icon: "shield", group: "running", screen: "/(app)/hostel-expulsions", module: "HOSTEL" },
    { labelKey: "collegeOffice.squadRoundsTitle", icon: "shield", group: "running", screen: "/(app)/hostel-squad", module: "ACADEMICS" },
    { labelKey: "collegeOffice.navNoDues", icon: "checks", group: "daily", screen: "/(app)/no-dues", module: "ACADEMICS" },
  ],
  ALUMNUS: [
    { labelKey: "nav.bulletin", icon: "megaphone", group: "school", screen: "/(app)/bulletin", module: "ALUMNI" },
    // The leaving record lives on the web's /record; the phone's record screen is the family's form.
    { labelKey: "modules.alumniRecord", icon: "fileText", group: "school", web: "/record" },
    // The directory a former pupil may join (the alumni module).
    { labelKey: "alumni.directoryTitle", icon: "users", group: "school", screen: "/(app)/alumni-directory", module: "ALUMNI" },
    { labelKey: "nav.account", icon: "user", group: "me", screen: "/(app)/account" },
    // The IQAC module (4 Oct 2026): the alumni survey.
    { labelKey: "iqac.navAlumniSurvey", icon: "star", group: "running", screen: "/(app)/voice", module: "IQAC" },
    // A paper asked for again — a copy of the leaving certificate, a bonafide (campaign 2026-10-04, G-6); the doors carry no module.
    { labelKey: "certificateRequests.alumniTitle", icon: "fileText", group: "school", screen: "/(app)/certificates" },
    // The college's alumni additions (5 Oct 2026; the web's /alumni/college): ACADEMICS stands for "is a college", as on the web.
    { labelKey: "placement.navAlumni", icon: "handshake", group: "school", screen: "/(app)/alumni-college", module: "ACADEMICS" },
  ],
  // The college's staff keep their account and their leave here; the college's feed is their tab (4 Oct 2026).
  // The teachers' survey (the IQAC module, 4 Oct 2026).
  FACULTY: [
    ...COLLEGE_STAFF_MENU,
    { labelKey: "iqac.navVoice", icon: "star", group: "running", screen: "/(app)/voice", module: "IQAC" },
    // What the head has shown me of my appraisals (A3-inventory-5, audit of 5 Oct 2026): the head may appraise a FACULTY or HOD member.
    { labelKey: "appraisal.myTitle", icon: "clipboard", group: "running", screen: "/(app)/my-appraisals" },
    // The college's academics (4 Oct 2026): the home tab is the day; mentoring is a tab of theirs.
    // Exam duties (the exam cell, 4 Oct 2026): invigilation, papers to set, bundles, remuneration.
    { labelKey: "examCell.dutiesTitle", icon: "clipboard", group: "daily", screen: "/(app)/exam-duties", module: "EXAMS" },
    // The library's e-resources, opened through the app so each open counts (campaign 2026-10-04, G-3).
    { labelKey: "collegeOffice.eResourcesTitle", icon: "globe", group: "school", screen: "/(app)/e-resources", module: "LIBRARY" },
    // Duties (5 Oct 2026): the anti-ragging register, for a member of the squad.
    { labelKey: "duties.antiRagging.title", icon: "shield", group: "running", screen: "/(app)/anti-ragging", module: "IQAC", duty: "ANTI_RAGGING_SQUAD" },
    // The duties' desks (S2, 5 Oct 2026): each only for a FACULTY member holding the duty; the practical record for any teacher of a course with practicals.
    { labelKey: "duties.lab.title", icon: "lightbulb", group: "running", screen: "/(app)/lab-desk", module: "ACADEMICS", duty: "LAB_INCHARGE" },
    { labelKey: "duties.teachingPractice.title", icon: "chalkboard", group: "running", screen: "/(app)/teaching-practice", module: "ACADEMICS", duty: "PRACTICE_TEACHING_COORDINATOR" },
    { labelKey: "duties.corps.nssTitle", icon: "handHeart", group: "running", screen: "/(app)/nss", module: "IQAC", duty: "NSS_OFFICER" },
    { labelKey: "duties.corps.nccTitle", icon: "flag", group: "running", screen: "/(app)/ncc", module: "IQAC", duty: "NCC_OFFICER" },
    { labelKey: "duties.research.title", icon: "medal", group: "running", screen: "/(app)/research-desk", module: "IQAC", duty: "RESEARCH_DEAN" },
    { labelKey: "duties.examSquad.title", icon: "eye", group: "running", screen: "/(app)/exam-squad", module: "EXAMS", duty: "EXAM_SQUAD" },
    // The clinical desk (R-56, the clinical half; 10 Oct 2026): the coordinator's whole desk with the duty; any teacher's own postings and signing queue at a clinical stream.
    { labelKey: "duties.clinical.title", icon: "firstAid", group: "running", screen: "/(app)/clinical-desk", module: "ACADEMICS", duty: "CLINICAL_COORDINATOR" },
    { labelKey: "duties.clinical.supervisingTitle", icon: "firstAid", group: "daily", screen: "/(app)/clinical-desk", module: "ACADEMICS", streams: CLINICAL_STREAMS },
    { labelKey: "streamRecords.practicals.title", icon: "clipboard", group: "daily", screen: "/(app)/practicals", module: "ACADEMICS", streams: LAB_STREAMS },
    // A law college's moot courts (A3-inventory-4, audit of 5 Oct 2026): the doors name FACULTY and HOD; hidden where the recorded streams have no LAW.
    { labelKey: "streamRecords.moots.title", icon: "trophy", group: "daily", screen: "/(app)/moot-courts", module: "ACADEMICS", streams: ["LAW"] },
    // Homework for the offerings I teach (and an HOD's department's), set, marked and posted into internal marks (R-48, risks batch 5 Oct 2026).
    { labelKey: "collegeWork.title", icon: "clipboard", group: "daily", screen: "/(app)/college-work", module: "ACADEMICS" },
    // An architecture college's studios and juries: marks for a jury I sit on, the chair's signature (R-56, the studio half, 10 Oct 2026).
    { labelKey: "duties.studio.facultyTitle", icon: "palette", group: "daily", screen: "/(app)/studios", module: "ACADEMICS", streams: ["ARCHITECTURE"] },
    // The parity batch (10 Oct 2026, R-4): the web's /faculty/supervision, /faculty/research and /faculty/profile.
    { labelKey: "placement.supervisionTitle", icon: "briefcase", group: "daily", screen: "/(app)/supervision", module: "PLACEMENT" },
    { labelKey: "iqac.navResearch", icon: "books", group: "running", screen: "/(app)/research", module: "IQAC" },
    { labelKey: "collegeDesks.profileNav", icon: "user", group: "me", screen: "/(app)/faculty-profile", module: "IQAC" },
  ],
  HOD: [
    ...COLLEGE_STAFF_MENU,
    { labelKey: "iqac.navVoice", icon: "star", group: "running", screen: "/(app)/voice", module: "IQAC" },
    // What the head has shown me of my appraisals (A3-inventory-5, audit of 5 Oct 2026): the head may appraise a FACULTY or HOD member.
    { labelKey: "appraisal.myTitle", icon: "clipboard", group: "running", screen: "/(app)/my-appraisals" },
    // The college's academics (4 Oct 2026): the home tab is the department; an HOD's own teaching is a tab, mentoring is here.
    { labelKey: "academics.mentoringTitle", icon: "chat", group: "daily", screen: "/(app)/academics-mentoring", module: "ACADEMICS" },
    // The department's lectures to cover and who stands in (5 Oct 2026; the web's /hod board).
    { labelKey: "academics.tabSubstitutions", icon: "arrowsClockwise", group: "daily", screen: "/(app)/lecture-substitutions", module: "ACADEMICS" },
    { labelKey: "examCell.dutiesTitle", icon: "clipboard", group: "daily", screen: "/(app)/exam-duties", module: "EXAMS" },
    // The library's e-resources, opened through the app so each open counts (campaign 2026-10-04, G-3).
    { labelKey: "collegeOffice.eResourcesTitle", icon: "globe", group: "school", screen: "/(app)/e-resources", module: "LIBRARY" },
    // Duties (5 Oct 2026): the anti-ragging register, for an HOD on the squad.
    { labelKey: "duties.antiRagging.title", icon: "shield", group: "running", screen: "/(app)/anti-ragging", module: "IQAC", duty: "ANTI_RAGGING_SQUAD" },
    // The duties' desks (S2, 5 Oct 2026): each only for an HOD holding the duty; the practical record for any teacher of a course with practicals.
    { labelKey: "duties.lab.title", icon: "lightbulb", group: "running", screen: "/(app)/lab-desk", module: "ACADEMICS", duty: "LAB_INCHARGE" },
    { labelKey: "duties.teachingPractice.title", icon: "chalkboard", group: "running", screen: "/(app)/teaching-practice", module: "ACADEMICS", duty: "PRACTICE_TEACHING_COORDINATOR" },
    { labelKey: "duties.corps.nssTitle", icon: "handHeart", group: "running", screen: "/(app)/nss", module: "IQAC", duty: "NSS_OFFICER" },
    { labelKey: "duties.corps.nccTitle", icon: "flag", group: "running", screen: "/(app)/ncc", module: "IQAC", duty: "NCC_OFFICER" },
    { labelKey: "duties.research.title", icon: "medal", group: "running", screen: "/(app)/research-desk", module: "IQAC", duty: "RESEARCH_DEAN" },
    { labelKey: "duties.examSquad.title", icon: "eye", group: "running", screen: "/(app)/exam-squad", module: "EXAMS", duty: "EXAM_SQUAD" },
    // The clinical desk (R-56, the clinical half; 10 Oct 2026): the coordinator's whole desk with the duty; any teacher's own postings and signing queue at a clinical stream.
    { labelKey: "duties.clinical.title", icon: "firstAid", group: "running", screen: "/(app)/clinical-desk", module: "ACADEMICS", duty: "CLINICAL_COORDINATOR" },
    { labelKey: "duties.clinical.supervisingTitle", icon: "firstAid", group: "daily", screen: "/(app)/clinical-desk", module: "ACADEMICS", streams: CLINICAL_STREAMS },
    { labelKey: "streamRecords.practicals.title", icon: "clipboard", group: "daily", screen: "/(app)/practicals", module: "ACADEMICS", streams: LAB_STREAMS },
    // A law college's moot courts (A3-inventory-4, audit of 5 Oct 2026): the doors name FACULTY and HOD; hidden where the recorded streams have no LAW.
    { labelKey: "streamRecords.moots.title", icon: "trophy", group: "daily", screen: "/(app)/moot-courts", module: "ACADEMICS", streams: ["LAW"] },
    // Homework for the offerings I teach (and an HOD's department's), set, marked and posted into internal marks (R-48, risks batch 5 Oct 2026).
    { labelKey: "collegeWork.title", icon: "clipboard", group: "daily", screen: "/(app)/college-work", module: "ACADEMICS" },
    // An architecture college's studios and juries: marks for a jury I sit on, the chair's signature (R-56, the studio half, 10 Oct 2026).
    { labelKey: "duties.studio.facultyTitle", icon: "palette", group: "daily", screen: "/(app)/studios", module: "ACADEMICS", streams: ["ARCHITECTURE"] },
    // The parity batch (10 Oct 2026, R-4): the web's /hod/projects, /hod/research, /accounts/no-dues (the lab's line) and /faculty/profile.
    { labelKey: "placement.hodProjectsTitle", icon: "briefcase", group: "daily", screen: "/(app)/supervision", module: "PLACEMENT" },
    { labelKey: "iqac.navDeptResearch", icon: "books", group: "running", screen: "/(app)/research", module: "IQAC" },
    { labelKey: "collegeOffice.navNoDues", icon: "checks", group: "running", screen: "/(app)/no-dues", module: "ACADEMICS" },
    { labelKey: "collegeDesks.profileNav", icon: "user", group: "me", screen: "/(app)/faculty-profile", module: "IQAC" },
  ],
  EXAM_CONTROLLER: [
    ...COLLEGE_STAFF_MENU,
    // The exam flying squad's desk (S2, 5 Oct 2026): the controller reads it without the duty, as the web's NAV.
    { labelKey: "duties.examSquad.title", icon: "eye", group: "running", screen: "/(app)/exam-squad", module: "EXAMS" },
  ],
  // The desks' own pages (5 Oct 2026, the link walk's role audit): the web's NAV lists them for the IQAC, the TPO and the
  // accounts desk, and the phone's More had none — only the home's numbers. Each opens the web signed in, under its module,
  // as the registrar's college entries do; what the phone does itself (the IQAC's filings, the TPO's rounds) is on the home.
  IQAC: [
    ...COLLEGE_STAFF_MENU,
    // Native since the parity batch (10 Oct 2026, R-4): the predictor, filings, surveys, registers, grievances, records and the table.
    { labelKey: "iqac.navPredictor", icon: "chartLine", group: "daily", screen: "/(app)/iqac-predictor", module: "IQAC" },
    // Actionable insights and the simulator's saved scenarios (5 Oct 2026): the phone reads them, the web changes the figures.
    { labelKey: "insightsPhone.title", icon: "lightbulb", group: "daily", screen: "/(app)/iqac-insights", module: "IQAC" },
    { labelKey: "insightsPhone.scenariosTitle", icon: "chartLine", group: "daily", screen: "/(app)/iqac-scenarios", module: "IQAC" },
    { labelKey: "iqac.navDocuments", icon: "clipboard", group: "daily", screen: "/(app)/iqac-filings", module: "IQAC" },
    { labelKey: "iqac.navSurveys", icon: "star", group: "daily", screen: "/(app)/iqac-surveys", module: "IQAC" },
    { labelKey: "iqac.navRegisters", icon: "books", group: "running", screen: "/(app)/research", module: "IQAC" },
    { labelKey: "iqac.navGrievances", icon: "shield", group: "running", screen: "/(app)/iqac-grievances", module: "IQAC" },
    { labelKey: "iqac.navFacultyRecords", icon: "users", group: "running", screen: "/(app)/faculty-records", module: "IQAC" },
    { labelKey: "placement.tabAnalytics", icon: "chartLine", group: "running", screen: "/(app)/placement-table", module: "PLACEMENT" },
  ],
  TPO: [
    ...COLLEGE_STAFF_MENU,
    // Native since the parity batch (10 Oct 2026, R-4): drives, the roll, the companies, the internships and the table.
    { labelKey: "placement.tabDrives", icon: "briefcase", group: "daily", screen: "/(app)/placement-drives", module: "PLACEMENT" },
    { labelKey: "placement.tabStudents", icon: "users", group: "daily", screen: "/(app)/placement-students", module: "PLACEMENT" },
    { labelKey: "placement.tabCompanies", icon: "handshake", group: "daily", screen: "/(app)/placement-companies", module: "PLACEMENT" },
    { labelKey: "placement.tabInternships", icon: "clipboard", group: "daily", screen: "/(app)/supervision", module: "PLACEMENT" },
    // A talk's attendance and a training session's marks at the door (R-2, 5 Oct 2026); setting them up stays on the web.
    { labelKey: "talks.title", icon: "megaphone", group: "daily", screen: "/(app)/placement-talks", module: "PLACEMENT" },
    { labelKey: "softSkills.title", icon: "graduationCap", group: "daily", screen: "/(app)/soft-skills", module: "PLACEMENT" },
    { labelKey: "placement.tabAnalytics", icon: "chartLine", group: "running", screen: "/(app)/placement-table", module: "PLACEMENT" },
  ],
  ACCOUNTS: [
    ...COLLEGE_STAFF_MENU,
    // Native since the parity batch (10 Oct 2026, R-4): the look-up stands for the web's "A student's account" (/accounts/students);
    // the structures, claims, no-dues, concessions, the fee ledger, payroll and the stores are the phone's own screens.
    { labelKey: "collegeDesks.lookupTitle", icon: "users", group: "daily", screen: "/(app)/accounts-lookup" },
    { labelKey: "collegeOffice.navStructures", icon: "receipt", group: "daily", screen: "/(app)/fee-structures" },
    { labelKey: "collegeOffice.navScholarships", icon: "receipt", group: "daily", screen: "/(app)/scholarship-claims", module: "SCHOLARSHIPS" },
    { labelKey: "collegeOffice.navNoDues", icon: "checks", group: "daily", screen: "/(app)/no-dues" },
    { labelKey: "collegeOffice.navConcessions", icon: "clipboard", group: "daily", screen: "/(app)/concessions" },
    { labelKey: "collegeOffice.navFeeLedger", icon: "receipt", group: "running", screen: "/(app)/fees" },
    { labelKey: "payroll.title", icon: "receipt", group: "running", screen: "/(app)/payroll", module: "PAYROLL" },
    { labelKey: "inventory.title", icon: "archive", group: "running", screen: "/(app)/inventory", module: "INVENTORY" },
  ],
  RECRUITER: [{ labelKey: "nav.account", icon: "user", group: "me", screen: "/(app)/account" }],
  SUPPORT: [{ labelKey: "nav.account", icon: "user", group: "me", screen: "/(app)/account" }], // owner-batch-item2a
};

/**
 * Vidura, the assistant (pass 1, 17 Oct 2026; docs/plans/vidura.md): NO MENU ENTRY. The one entry point is the round
 * button above the tab bar on every screen (screens/shared/vidura.tsx, drawn by (app)/_layout.tsx), opening a bottom
 * sheet; the Phase C entry under More is gone. The route /(app)/assistant stays only to open the sheet for an old link.
 */
/** Not for the outside accounts (an expert, a recruiter): they belong to no school, and the doors refuse them. */
export const ASSISTANT_NOT_FOR: readonly RoleCode[] = ["EXPERT", "RECRUITER", "SUPPORT"]; // SUPPORT: owner-batch-item2a

/**
 * Every route under (app) that is not a tab: the Tabs navigator lists every
 * file it finds and, on the web target, shows an unnamed one in the bar with
 * a default icon, so each is declared with href: null. A test checks this
 * list against the files on disk.
 */
export const HIDDEN_SCREENS = [
  // website-three (17 Oct 2026): the school's website at a glance for the office and the head.
  "website",
  // end website-three
  // Vidura (pass 1, 17 Oct 2026): the old route, which opens the sheet for an old link.
  "assistant",
  // The college at a glance for the head and the registrar (campaign 2026-10-04, G-4).
  "college",
  // The exam cell (4 Oct 2026): a student's (or a guardian's child's) exams, a faculty member's duties.
  "college-exams",
  "exam-duties",
  // The IQAC module (4 Oct 2026): the surveys open to me and the grievance line.
  "voice",
  // Accreditation insights (5 Oct 2026): the ranked steps to the next band and the simulator's saved scenarios.
  "iqac-insights",
  "iqac-scenarios",
  // The college office (4 Oct 2026): a college student's money, scholarships and own account.
  "money",
  "scholarships",
  "student-account",
  // The college foundation (4 Oct 2026): an adult student's grants to their guardians.
  "consent",
  "inventory",
  "payroll",
  "payslips",
  "notifications",
  "report",
  "marks",
  "exams",
  "meetings",
  "timetable",
  "staff",
  "calendar",
  "reviews",
  "profile",
  "settings",
  "safety",
  "experts",
  "vacancies",
  "explore",
  "archive",
  "operator",
  "appadmin",
  "classes/detail",
  "messages/room",
  "messages/thread",
  "mentoring/thread",
  "competitions",
  "competitions/detail",
  "enquiries",
  "enquiries/detail",
  "joins",
  "quiz",
  "worksheets",
  "mentoring-setup",
  "school",
  "vacancy",
  "link-child",
  "competition-new",
  "competition-entries",
  "question-bank",
  "assignment",
  "report-cards",
  "remark-new",
  "invites",
  "intake",
  "directory-profile",
  "class-new",
  "timetable-editor",
  "account",
  "avatar",
  "booking",
  "post-new",
  "post",
  "operator-school",
  "operator-new-school",
  "operator-metrics",
  "operator-payouts",
  "fees",
  "fees-dues",
  "fee-pupil",
  "fee-claims",
  "messaging",
  "messaging-new",
  "messaging-broadcast",
  "health",
  "pupil-health",
  "person",
  "staff-record",
  "incidents",
  "incident",
  "incident-new",
  "family-incidents",
  "circulars",
  "circular-reach",
  "staff-attendance",
  "my-attendance",
  "substitutions",
  "my-covers",
  "syllabus",
  "syllabus-coverage",
  "record",
  "certificates",
  "certificate",
  "pupil-records",
  "pupil-record",
  "certificate-issue",
  "staff-certificates",
  "admissions",
  "admission-slots",
  "applications",
  "application-new",
  "application",
  "my-applications",
  "my-application",
  "apply",
  "filings",
  "contributions",
  "contribution",
  "search",
  "agenda",
  "signatures",
  "report-card-rules",
  "contribution-queue",
  "decisions",
  "class-analytics",
  "staff-appraisal",
  "my-appraisals",
  "trends",
  "moderation",
  // The alumni module (3 Oct 2026): the directory, opened from the alumnus's home and More.
  "alumni-directory",
  // Transport (3 Oct 2026): the family's bus screen.
  "transport",
  // The library and hostel modules (3 Oct 2026): a member's library and a boarder's hostel.
  "library",
  "hostel",
  // The college's academics (4 Oct 2026): a lecture to mark, a course I teach, a student's (or a guardian's) academics, registration (mentoring and an HOD's own teaching are tabs; ALL_TAB_SCREENS).
  "lecture",
  "offering",
  "academics",
  "registration",
  // The placement module (4 Oct 2026): a student's placement, and one drive of a recruiter's company.
  "placement",
  "recruiter-drive",
  // The library's e-resources at a college (campaign 2026-10-04, G-3): FACULTY and HOD from More, a student from the library screen.
  "e-resources",
  // Duties (5 Oct 2026): the anti-ragging register, from More and the duty card on the faculty's home.
  "anti-ragging",
  // The duties' desks and the practical record (S2, 5 Oct 2026), from More and the duty card.
  "lab-desk",
  "practicals",
  "teaching-practice",
  "nss",
  "ncc",
  "research-desk",
  "exam-squad",
  // The clinical desk and a student's logbook (R-56, the clinical half; 10 Oct 2026), from More, the duty card and the registrar's tile.
  "clinical-desk",
  "clinical-logbook",
  // The S3 fixes (5 Oct 2026): the TPO's drive with its rounds, from the TPO's home; an HOD's lecture substitutions.
  "placement-drive",
  "lecture-substitutions",
  // A college alumnus's college: mentoring, referrals, meets and gifts (5 Oct 2026).
  "alumni-college",
  // The accounts desk's look-up of a student by PRN: the ledger and the exam form's no-dues, read only (5 Oct 2026).
  "accounts-lookup",
  // A law college's moot courts, for FACULTY and HOD from More (A3-inventory-4, audit of 5 Oct 2026).
  "moot-courts",
  // Pre-placement talks and soft-skills training (R-2, 5 Oct 2026): a student's and the TPO's, from More.
  "placement-talks",
  "soft-skills",
  // Homework at a college (R-48, risks batch 5A, 5 Oct 2026): the teacher's list from More, and one piece of work to mark.
  "college-work",
  "college-work-item",
  // Birthdays and anniversaries from a home's card, and the pupil's own practice journey (A3-inventory-14, risks batch 5 Oct 2026).
  "celebrations",
  "practice-journey",
  // The college desks' parity batch (10 Oct 2026, R-4): the link-outs and the web-only pages as the phone's own screens.
  "placement-drives",
  "placement-students",
  "placement-companies",
  "placement-table",
  "supervision",
  "fee-structures",
  "scholarship-claims",
  "no-dues",
  "concessions",
  "exam-session",
  "exam-after",
  "iqac-grievances",
  "iqac-surveys",
  "iqac-filings",
  "research",
  "iqac-predictor",
  "faculty-records",
  "faculty-profile",
  "hostel-expulsions",
  "hostel-squad",
  "my-items",
  "stream-records",
  "office-transport",
  "office-alumni",
  "office-hostel",
  "office-academics",
  "office-admissions",
  // The desks' homes for the office and the head (the parity batch): the accounts, exam cell, placement and IQAC homes.
  "accounts",
  "exam-cell",
  "placement-cell",
  "iqac-desk",
  // The studio desk (R-56, the studio half, 10 Oct 2026): a teacher's studios and juries, a student's studios.
  "studios",
  "student-studios",
] as const;

/**
 * The More sheet's entries for a role, grouped in the web's order with the person's own pages (`me`) first; an entry
 * whose module the school has off, or whose duty the person does not hold (5 Oct 2026), is left out; so is a school-only
 * entry while the active place is a college (TA-269).
 */
export function menuFor(role: RoleCode, modules?: readonly string[], duties: readonly string[] = [], streams: readonly string[] = [], features: readonly string[] = FEATURES_BEFORE_SWITCHES, college = false): { group: MenuGroup; items: MenuItem[] }[] {
  const shown = MENU[role].filter((item) => (!item.module || !modules || modules.includes(item.module)) && (!item.duty || duties.includes(item.duty)) && (!item.streams || streams.length === 0 || item.streams.some((s) => streams.includes(s))) && featureShown(item, features) && !(college && item.schoolOnly));
  return [ME_MENU_GROUP, ...menuGroupsFor(role)].map((group) => ({ group, items: shown.filter((item) => item.group === group) })).filter((g) => g.items.length > 0);
}

/** Every duty the person holds on the active membership: a college teacher's (`duties`) and the office's (`adminDuties`, owner-batch-item9). */
export function dutiesOfMe(me: { duties?: readonly string[]; adminDuties?: readonly string[] } | null | undefined): string[] {
  return [...(me?.duties ?? []), ...(me?.adminDuties ?? [])];
}

/** Whether a tab is drawn: always, unless it belongs to a module the school has off, a duty the person does not hold, or a platform feature that is off (15 Oct 2026). */
export function tabShown(tab: Tab, modules: readonly string[], duties: readonly string[] = [], features: readonly string[] = FEATURES_BEFORE_SWITCHES): boolean {
  return (!tab.module || modules.includes(tab.module)) && (!tab.duty || duties.includes(tab.duty)) && featureShown(tab, features);
}

/**
 * The one-tap shortcuts on a role's home screen — the web's QUICK_ACTIONS,
 * made phone-sized: the three or four things this person does most, as big
 * tiles under the day's numbers, each going straight to the screen that does
 * it. The hint is what a screen reader says after the label.
 */
export type QuickAction = { labelKey: TranslationKey; hintKey: TranslationKey; icon: string; href: string };

export const QUICK: Partial<Record<RoleCode, QuickAction[]>> = {
  TEACHER: [
    { labelKey: "action.takeRegister", hintKey: "action.takeRegisterHint", icon: "checks", href: "/(app)/attendance" },
    { labelKey: "action.newAssignment", hintKey: "action.newAssignmentHint", icon: "plus", href: "/(app)/assignments" },
    { labelKey: "action.messageParent", hintKey: "action.messageParentHint", icon: "chat", href: "/(app)/remark-new" },
    { labelKey: "action.applyLeave", hintKey: "action.applyLeaveHint", icon: "calendar", href: "/(app)/leave" },
  ],
  STUDENT: [
    { labelKey: "action.whatIsDue", hintKey: "action.whatIsDueHint", icon: "clipboard", href: "/(app)/assignments" },
    { labelKey: "action.myExamMarks", hintKey: "action.myExamMarksHint", icon: "chartLine", href: "/(app)/exams" },
    { labelKey: "action.shareSomething", hintKey: "action.shareSomethingHint", icon: "megaphone", href: "/(app)/post-new" },
    { labelKey: "action.messageTeacher", hintKey: "action.messageTeacherHint", icon: "chat", href: "/(app)/messages" },
  ],
  ADMIN: [
    { labelKey: "action.admitPupils", hintKey: "action.admitPupilsHint", icon: "users", href: "/(app)/intake" },
    { labelKey: "action.createClass", hintKey: "action.createClassHint", icon: "chalkboard", href: "/(app)/class-new" },
    { labelKey: "action.buildTimetable", hintKey: "action.buildTimetableHint", icon: "clock", href: "/(app)/timetable-editor" },
    // Not "Invite people": the People card on the same screen already has that button.
    { labelKey: "action.schoolBranding", hintKey: "action.schoolBrandingHint", icon: "palette", href: "/(app)/settings" },
  ],
  PARENT: [
    { labelKey: "action.messageTeacher", hintKey: "action.messageTeacherHint", icon: "chat", href: "/(app)/messages" },
    { labelKey: "action.childExamMarks", hintKey: "action.childExamMarksHint", icon: "chartLine", href: "/(app)/exams" },
    { labelKey: "action.notificationSettings", hintKey: "action.notificationSettingsHint", icon: "bell", href: "/(app)/settings" },
  ],
};
