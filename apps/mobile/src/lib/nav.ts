import type { DutyCode, RoleCode, SchoolModuleCode } from "@edulink/contracts";
import type { TranslationKey } from "@edulink/i18n";

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
 */
export type Tab = { name: string; labelKey: TranslationKey; icon: string; module?: SchoolModuleCode; duty?: DutyCode };

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
    { name: "practice", labelKey: "nav.practice", icon: "brain" },
    { name: "messages", labelKey: "nav.messages", icon: "chat" },
  ],
  ADMIN: [
    { name: "index", labelKey: "nav.overview", icon: "house" },
    { name: "people", labelKey: "nav.people", icon: "users" },
    { name: "leave", labelKey: "nav.leave", icon: "calendar" },
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
    { name: "availability", labelKey: "nav.availability", icon: "calendar" },
    { name: "mentoring", labelKey: "nav.mentoring", icon: "chat" },
    // Sessions and workshops with pupils (gigs): a primary of the expert's on the web, and their fourth tab here. For every other role it is a More entry.
    { name: "sessions", labelKey: "nav.sessions", icon: "users" },
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
  // write to and POST /api/v1/messages name FACULTY and HOD, as the web's /remarks does for them).
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
  ],
  IQAC: [
    { name: "index", labelKey: "role.iqac", icon: "medal" },
    { name: "bulletin", labelKey: "nav.bulletin", icon: "megaphone" },
  ],
  TPO: [
    { name: "index", labelKey: "mobile.tabPlacement", icon: "chartLine" },
    { name: "bulletin", labelKey: "nav.bulletin", icon: "megaphone" },
  ],
  ACCOUNTS: [
    { name: "index", labelKey: "role.accounts", icon: "receipt" },
    { name: "bulletin", labelKey: "nav.bulletin", icon: "megaphone" },
  ],
  // An outside account like the expert: its home, and its account in More.
  RECRUITER: [{ name: "index", labelKey: "role.recruiter", icon: "handshake" }],
};

/** Every screen name any role has a tab for; the tab layout declares them all and hides the rest per role. */
export const ALL_TAB_SCREENS = ["index", "attendance", "classes", "messages", "assignments", "practice", "people", "leave", "availability", "mentoring", "sessions", "teaching", "academics-mentoring", "bulletin", "more"] as const;

/**
 * The rest of the web's NAV for each role — what the web's rail and More
 * sheet list under "Day to day", "School life" and "Running things". Each
 * entry is either a screen the app has (`screen`, an expo-router path) or a
 * page the phone does not carry and opens on the web, signed in there
 * (`web`). The order is the web's. A role's primaries (TABS) are not
 * repeated here: the bar already has them.
 */
export type MenuGroup = "daily" | "school" | "running";
export type MenuItem = { labelKey: TranslationKey; icon: string; group: MenuGroup; module?: SchoolModuleCode; duty?: DutyCode } & ({ screen: string; web?: undefined } | { web: string; screen?: undefined });

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
  { labelKey: "payroll.myTitle", icon: "receipt", group: "running", screen: "/(app)/payslips", module: "PAYROLL" },
];

const COLLEGE_STAFF_MENU: MenuItem[] = [
  { labelKey: "nav.account", icon: "user", group: "running", screen: "/(app)/account" },
  { labelKey: "nav.leave", icon: "calendar", group: "running", screen: "/(app)/leave" },
  ...OWN_STAFF_ENTRIES,
];

export const MENU_GROUP_KEY: Record<MenuGroup, TranslationKey> = { daily: "nav.groupDaily", school: "nav.groupSchool", running: "nav.groupRunning" };
export const MENU_GROUPS: MenuGroup[] = ["daily", "school", "running"];

export const MENU: Record<RoleCode, MenuItem[]> = {
  TEACHER: [
    { labelKey: "nav.assignments", icon: "clipboard", group: "daily", screen: "/(app)/assignments" },
    { labelKey: "nav.exams", icon: "clipboard", group: "daily", screen: "/(app)/exams" },
    { labelKey: "nav.timetable", icon: "clock", group: "daily", screen: "/(app)/timetable" },
    { labelKey: "nav.practice", icon: "brain", group: "daily", screen: "/(app)/practice" },
    { labelKey: "nav.meetings", icon: "calendar", group: "daily", screen: "/(app)/meetings" },
    { labelKey: "nav.leave", icon: "calendar", group: "running", screen: "/(app)/leave" },
    { labelKey: "nav.staffAttendance", icon: "checks", group: "running", screen: "/(app)/my-attendance" },
    { labelKey: "substitutions.myCoversTitle", icon: "arrowsClockwise", group: "running", screen: "/(app)/my-covers" },
    { labelKey: "nav.incidents", icon: "firstAid", group: "running", screen: "/(app)/incidents" },
    { labelKey: "nav.me", icon: "user", group: "running", screen: "/(app)/profile" },
    // What the head has shown me of my observations, targets and appraisals (the web's /teacher/appraisals).
    { labelKey: "appraisal.myTitle", icon: "clipboard", group: "running", screen: "/(app)/my-appraisals" },
    { labelKey: "joinRequests.navLabel", icon: "userPlus", group: "running", screen: "/(app)/joins" },
    { labelKey: "nav.bulletin", icon: "megaphone", group: "school", screen: "/(app)/bulletin" },
    { labelKey: "nav.experts", icon: "briefcase", group: "school", screen: "/(app)/experts" },
    { labelKey: "nav.vacancies", icon: "briefcase", group: "school", screen: "/(app)/vacancies" },
    { labelKey: "nav.enquiries", icon: "envelope", group: "school", screen: "/(app)/enquiries" },
    { labelKey: "nav.mentoring", icon: "chat", group: "school", screen: "/(app)/mentoring" },
    { labelKey: "nav.competitions", icon: "trophy", group: "school", screen: "/(app)/competitions" },
    { labelKey: "nav.pastYears", icon: "archive", group: "school", screen: "/(app)/archive" },
    { labelKey: "nav.account", icon: "user", group: "running", screen: "/(app)/account" },
    { labelKey: "nav.guidance", icon: "calendar", group: "school", screen: "/(app)/sessions" },
    { labelKey: "nav.contributions", icon: "clipboard", group: "running", screen: "/(app)/contributions" },
    { labelKey: "nav.signatures", icon: "pencil", group: "running", screen: "/(app)/signatures" },
    // My own payslips while the school runs payroll in the app (3 Oct 2026).
    { labelKey: "payroll.myTitle", icon: "receipt", group: "running", screen: "/(app)/payslips", module: "PAYROLL" },
    // My loans and the catalogue (the library module, 3 Oct 2026).
    { labelKey: "modules.libraryName", icon: "bookOpen", group: "school", screen: "/(app)/library", module: "LIBRARY" },
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
    { labelKey: "nav.mentoring", icon: "chat", group: "school", screen: "/(app)/mentoring" },
    // What an adult student at a college lets their guardians see (4 Oct 2026); under ACADEMICS, which only a college has.
    { labelKey: "consent.title", icon: "users", group: "running", screen: "/(app)/consent", module: "ACADEMICS" },
    { labelKey: "nav.competitions", icon: "trophy", group: "school", screen: "/(app)/competitions" },
    { labelKey: "nav.pastYears", icon: "archive", group: "school", screen: "/(app)/archive" },
    { labelKey: "nav.me", icon: "user", group: "running", screen: "/(app)/profile" },
    { labelKey: "nav.account", icon: "user", group: "running", screen: "/(app)/account" },
    { labelKey: "nav.sessions", icon: "calendar", group: "school", screen: "/(app)/sessions" },
    // The library and the hostel (3 Oct 2026): my loans and the catalogue; my room, tonight's roll call and leave.
    { labelKey: "modules.libraryName", icon: "bookOpen", group: "school", screen: "/(app)/library", module: "LIBRARY" },
    { labelKey: "modules.hostelName", icon: "bed", group: "school", screen: "/(app)/hostel", module: "HOSTEL" },
    // My courses, lectures, attendance, internal marks and registration (the college's academics, 4 Oct 2026).
    { labelKey: "academics.studentTitle", icon: "graduationCap", group: "daily", screen: "/(app)/academics", module: "ACADEMICS" },
    { labelKey: "academics.registrationTitle", icon: "clipboard", group: "daily", screen: "/(app)/registration", module: "ACADEMICS" },
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
  ],
  PARENT: [
    { labelKey: "nav.exams", icon: "chartLine", group: "daily", screen: "/(app)/exams" },
    { labelKey: "nav.practice", icon: "brain", group: "daily", screen: "/(app)/practice" },
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
    { labelKey: "nav.competitions", icon: "trophy", group: "school", screen: "/(app)/competitions" },
    { labelKey: "nav.mentoring", icon: "chat", group: "school", screen: "/(app)/mentoring" },
    { labelKey: "nav.pastYears", icon: "archive", group: "school", screen: "/(app)/archive" },
    { labelKey: "nav.settings", icon: "gear", group: "running", screen: "/(app)/settings" },
    { labelKey: "nav.account", icon: "user", group: "running", screen: "/(app)/account" },
    { labelKey: "nav.sessions", icon: "calendar", group: "school", screen: "/(app)/sessions" },
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
    { labelKey: "nav.classes", icon: "chalkboard", group: "daily", screen: "/(app)/classes" },
    { labelKey: "nav.timetable", icon: "clock", group: "daily", screen: "/(app)/timetable" },
    { labelKey: "nav.exams", icon: "clipboard", group: "daily", screen: "/(app)/exams" },
    { labelKey: "nav.syllabus", icon: "books", group: "daily", screen: "/(app)/syllabus-coverage" },
    { labelKey: "nav.attendance", icon: "checks", group: "running", screen: "/(app)/attendance" },
    { labelKey: "nav.staffAttendance", icon: "checks", group: "running", screen: "/(app)/staff-attendance" },
    { labelKey: "nav.substitutions", icon: "arrowsClockwise", group: "running", screen: "/(app)/substitutions" },
    // The school across terms and years: the office reads what the head reads (the web's /principal/trends).
    { labelKey: "trends.title", icon: "chartLine", group: "running", screen: "/(app)/trends" },
    { labelKey: "nav.fees", icon: "receipt", group: "running", screen: "/(app)/fees" },
    { labelKey: "nav.messaging", icon: "chats", group: "running", screen: "/(app)/messaging" },
    { labelKey: "nav.circulars", icon: "megaphone", group: "running", screen: "/(app)/circulars" },
    { labelKey: "nav.calendar", icon: "calendar", group: "running", screen: "/(app)/calendar" },
    { labelKey: "nav.staff", icon: "users", group: "running", screen: "/(app)/staff" },
    { labelKey: "nav.reviews", icon: "star", group: "running", screen: "/(app)/reviews" },
    { labelKey: "nav.safety", icon: "shield", group: "running", screen: "/(app)/safety" },
    { labelKey: "nav.incidents", icon: "firstAid", group: "running", screen: "/(app)/incidents" },
    { labelKey: "nav.pupilRecords", icon: "clipboard", group: "running", screen: "/(app)/pupil-records" },
    { labelKey: "nav.certificates", icon: "fileText", group: "running", screen: "/(app)/staff-certificates" },
    { labelKey: "nav.admissions", icon: "users", group: "running", screen: "/(app)/admissions" },
    { labelKey: "nav.filings", icon: "fileText", group: "running", screen: "/(app)/filings" },
    // Transport (3 Oct 2026): the office's routes, buses, seats and the day's trips on a map, on the web.
    { labelKey: "transport.title", icon: "bus", group: "running", web: "/admin/transport", module: "TRANSPORT" },
    { labelKey: "nav.settings", icon: "gear", group: "running", screen: "/(app)/settings" },
    { labelKey: "nav.invites", icon: "plus", group: "running", screen: "/(app)/invites" },
    { labelKey: "nav.directory", icon: "buildings", group: "running", screen: "/(app)/directory-profile" },
    { labelKey: "joinRequests.navLabel", icon: "userPlus", group: "running", screen: "/(app)/joins" },
    { labelKey: "nav.bulletin", icon: "megaphone", group: "school", screen: "/(app)/bulletin" },
    { labelKey: "nav.experts", icon: "briefcase", group: "school", screen: "/(app)/experts" },
    { labelKey: "nav.vacancies", icon: "briefcase", group: "school", screen: "/(app)/vacancies" },
    { labelKey: "nav.enquiries", icon: "envelope", group: "school", screen: "/(app)/enquiries" },
    { labelKey: "nav.mentoring", icon: "chat", group: "school", screen: "/(app)/mentoring" },
    { labelKey: "nav.competitions", icon: "trophy", group: "school", screen: "/(app)/competitions" },
    { labelKey: "nav.pastYears", icon: "archive", group: "school", screen: "/(app)/archive" },
    { labelKey: "nav.account", icon: "user", group: "running", screen: "/(app)/account" },
    { labelKey: "nav.sessions", icon: "calendar", group: "school", screen: "/(app)/sessions" },
    { labelKey: "nav.reportCards", icon: "clipboard", group: "running", screen: "/(app)/report-card-rules" },
    { labelKey: "nav.signatures", icon: "pencil", group: "running", screen: "/(app)/signatures" },
    // The alumni module (3 Oct 2026): the office's page on the web, and the directory here.
    { labelKey: "modules.alumniName", icon: "graduationCap", group: "running", web: "/admin/alumni", module: "ALUMNI" },
    { labelKey: "alumni.directoryTitle", icon: "users", group: "school", screen: "/(app)/alumni-directory", module: "ALUMNI" },
    // Inventory and payroll (3 Oct 2026): the office's summaries, read-only here, and its own payslips.
    { labelKey: "inventory.title", icon: "archive", group: "running", screen: "/(app)/inventory", module: "INVENTORY" },
    { labelKey: "payroll.title", icon: "receipt", group: "running", screen: "/(app)/payroll", module: "PAYROLL" },
    { labelKey: "payroll.myTitle", icon: "receipt", group: "running", screen: "/(app)/payslips", module: "PAYROLL" },
    // The library desk and the hostel at a glance (3 Oct 2026), on the web.
    { labelKey: "modules.libraryName", icon: "bookOpen", group: "running", web: "/library", module: "LIBRARY" },
    { labelKey: "modules.hostelName", icon: "bed", group: "running", web: "/admin/hostel", module: "HOSTEL" },
    // The college's office on the web (campaign 2026-10-04, G-4): the registrar's entries the web's NAV lists, each under its module;
    // ACADEMICS stands for "is a college". The college at a glance is a screen here.
    { labelKey: "collegeHub.title", icon: "chartLine", group: "running", screen: "/(app)/college", module: "ACADEMICS" },
    { labelKey: "academics.title", icon: "graduationCap", group: "running", web: "/admin/academics", module: "ACADEMICS" },
    { labelKey: "collegeOffice.admissionsTitle", icon: "userPlus", group: "running", web: "/admin/college-admissions", module: "ADMISSIONS" },
    { labelKey: "role.accounts", icon: "receipt", group: "running", web: "/accounts", module: "ACADEMICS" },
    { labelKey: "collegeOffice.campusTitle", icon: "buildings", group: "running", web: "/admin/college-campus", module: "ACADEMICS" },
    { labelKey: "examCell.title", icon: "clipboard", group: "running", web: "/exam-cell", module: "EXAMS" },
    { labelKey: "placement.navCell", icon: "briefcase", group: "running", web: "/placement", module: "PLACEMENT" },
    { labelKey: "iqac.navHome", icon: "medal", group: "running", web: "/iqac", module: "IQAC" },
    { labelKey: "iqac.navCommittees", icon: "users", group: "running", web: "/admin/committees", module: "IQAC" },
    { labelKey: "iqac.navFacultyRecords", icon: "clipboard", group: "running", web: "/admin/faculty-records", module: "IQAC" },
  ],
  PRINCIPAL: [
    { labelKey: "nav.reviews", icon: "star", group: "daily", screen: "/(app)/reviews" },
    { labelKey: "nav.exams", icon: "clipboard", group: "daily", screen: "/(app)/exams" },
    { labelKey: "nav.syllabus", icon: "books", group: "daily", screen: "/(app)/syllabus-coverage" },
    { labelKey: "nav.attendance", icon: "checks", group: "daily", screen: "/(app)/attendance" },
    { labelKey: "nav.staffAttendance", icon: "checks", group: "running", screen: "/(app)/staff-attendance" },
    { labelKey: "nav.substitutions", icon: "arrowsClockwise", group: "running", screen: "/(app)/substitutions" },
    { labelKey: "nav.timetable", icon: "clock", group: "running", screen: "/(app)/timetable" },
    // The head's own decisions as sentences, read from the audit log (the web's /principal/decisions).
    { labelKey: "decisions.title", icon: "clipboard", group: "running", screen: "/(app)/decisions" },
    // The school across terms and years, recomputed on every read (the web's /principal/trends).
    { labelKey: "trends.title", icon: "chartLine", group: "running", screen: "/(app)/trends" },
    { labelKey: "nav.fees", icon: "receipt", group: "running", screen: "/(app)/fees" },
    { labelKey: "nav.messaging", icon: "chats", group: "running", screen: "/(app)/messaging" },
    { labelKey: "nav.circulars", icon: "megaphone", group: "running", screen: "/(app)/circulars" },
    { labelKey: "nav.calendar", icon: "calendar", group: "running", screen: "/(app)/calendar" },
    { labelKey: "nav.staff", icon: "users", group: "running", screen: "/(app)/staff" },
    { labelKey: "nav.incidents", icon: "firstAid", group: "running", screen: "/(app)/incidents" },
    { labelKey: "nav.pupilRecords", icon: "clipboard", group: "running", screen: "/(app)/pupil-records" },
    { labelKey: "nav.certificates", icon: "fileText", group: "running", screen: "/(app)/staff-certificates" },
    { labelKey: "nav.admissions", icon: "users", group: "running", screen: "/(app)/admissions" },
    { labelKey: "nav.filings", icon: "fileText", group: "running", screen: "/(app)/filings" },
    // Transport (3 Oct 2026): the head reads the day's trips on the web.
    { labelKey: "transport.title", icon: "bus", group: "running", web: "/admin/transport", module: "TRANSPORT" },
    { labelKey: "joinRequests.navLabel", icon: "userPlus", group: "running", screen: "/(app)/joins" },
    { labelKey: "nav.bulletin", icon: "megaphone", group: "school", screen: "/(app)/bulletin" },
    { labelKey: "nav.vacancies", icon: "briefcase", group: "school", screen: "/(app)/vacancies" },
    { labelKey: "nav.enquiries", icon: "envelope", group: "school", screen: "/(app)/enquiries" },
    { labelKey: "nav.competitions", icon: "trophy", group: "school", screen: "/(app)/competitions" },
    { labelKey: "nav.pastYears", icon: "archive", group: "school", screen: "/(app)/archive" },
    { labelKey: "nav.account", icon: "user", group: "running", screen: "/(app)/account" },
    { labelKey: "nav.sessions", icon: "calendar", group: "school", screen: "/(app)/sessions" },
    { labelKey: "nav.reportCards", icon: "clipboard", group: "running", screen: "/(app)/report-card-rules" },
    { labelKey: "nav.signatures", icon: "pencil", group: "running", screen: "/(app)/signatures" },
    // The payroll summary and the stores, read; the head's own payslips (3 Oct 2026).
    { labelKey: "payroll.title", icon: "receipt", group: "running", screen: "/(app)/payroll", module: "PAYROLL" },
    { labelKey: "inventory.title", icon: "archive", group: "running", screen: "/(app)/inventory", module: "INVENTORY" },
    { labelKey: "payroll.myTitle", icon: "receipt", group: "running", screen: "/(app)/payslips", module: "PAYROLL" },
    // The library's reports and the hostel at a glance (3 Oct 2026), on the web.
    { labelKey: "modules.libraryName", icon: "bookOpen", group: "running", web: "/library/reports", module: "LIBRARY" },
    { labelKey: "modules.hostelName", icon: "bed", group: "running", web: "/admin/hostel", module: "HOSTEL" },
    // The college on the web (campaign 2026-10-04, G-4): the head's entries the web's NAV lists, each under its module; the
    // college at a glance is the card on the home and a screen here.
    { labelKey: "collegeHub.title", icon: "chartLine", group: "running", screen: "/(app)/college", module: "ACADEMICS" },
    { labelKey: "academics.title", icon: "graduationCap", group: "running", web: "/admin/academics", module: "ACADEMICS" },
    { labelKey: "role.accounts", icon: "receipt", group: "running", web: "/accounts", module: "ACADEMICS" },
    { labelKey: "collegeOffice.admissionsTitle", icon: "userPlus", group: "running", web: "/admin/college-admissions", module: "ADMISSIONS" },
    { labelKey: "examCell.title", icon: "clipboard", group: "running", web: "/exam-cell", module: "EXAMS" },
    { labelKey: "placement.navCell", icon: "briefcase", group: "running", web: "/placement", module: "PLACEMENT" },
    { labelKey: "iqac.navAccreditation", icon: "medal", group: "running", web: "/principal/accreditation", module: "IQAC" },
    { labelKey: "iqac.navCommittees", icon: "users", group: "running", web: "/admin/committees", module: "IQAC" },
    { labelKey: "iqac.navFacultyRecords", icon: "clipboard", group: "running", web: "/admin/faculty-records", module: "IQAC" },
  ],
  EXPERT: [
    { labelKey: "nav.profile", icon: "user", group: "running", screen: "/(app)/profile" },
    { labelKey: "nav.account", icon: "user", group: "running", screen: "/(app)/account" },
  ],
  DRIVER: [
    { labelKey: "nav.account", icon: "user", group: "running", screen: "/(app)/account" },
    // My own leave (4 Oct 2026): GET/POST /api/v1/staff/leave name the three module staff roles.
    { labelKey: "nav.leave", icon: "calendar", group: "running", screen: "/(app)/leave" },
    ...OWN_STAFF_ENTRIES,
  ],
  LIBRARIAN: [
    { labelKey: "nav.account", icon: "user", group: "running", screen: "/(app)/account" },
    { labelKey: "nav.leave", icon: "calendar", group: "running", screen: "/(app)/leave" },
    ...OWN_STAFF_ENTRIES,
    // The desk is the home tab; the catalogue, fines and reports are the web's (the library module, 3 Oct 2026).
    { labelKey: "library.tabCatalogue", icon: "bookOpen", group: "daily", web: "/library/catalogue", module: "LIBRARY" },
    { labelKey: "library.tabFines", icon: "receipt", group: "daily", web: "/library/fines", module: "LIBRARY" },
    { labelKey: "library.tabReports", icon: "chartLine", group: "running", web: "/library/reports", module: "LIBRARY" },
  ],
  WARDEN: [
    { labelKey: "nav.account", icon: "user", group: "running", screen: "/(app)/account" },
    { labelKey: "nav.leave", icon: "calendar", group: "running", screen: "/(app)/leave" },
    ...OWN_STAFF_ENTRIES,
    // Roll call, leave and visitors are the home tab; rooms, the menu and incidents are the web's (the hostel module, 3 Oct 2026).
    { labelKey: "hostel.tabRooms", icon: "bed", group: "daily", web: "/hostel/rooms", module: "HOSTEL" },
    { labelKey: "hostel.tabMenu", icon: "clipboard", group: "running", web: "/hostel/menu", module: "HOSTEL" },
    { labelKey: "hostel.tabIncidents", icon: "firstAid", group: "running", web: "/hostel/incidents", module: "HOSTEL" },
  ],
  ALUMNUS: [
    { labelKey: "nav.bulletin", icon: "megaphone", group: "school", screen: "/(app)/bulletin", module: "ALUMNI" },
    // The leaving record lives on the web's /record; the phone's record screen is the family's form.
    { labelKey: "modules.alumniRecord", icon: "fileText", group: "school", web: "/record" },
    // The directory a former pupil may join (the alumni module).
    { labelKey: "alumni.directoryTitle", icon: "users", group: "school", screen: "/(app)/alumni-directory", module: "ALUMNI" },
    { labelKey: "nav.account", icon: "user", group: "running", screen: "/(app)/account" },
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
    { labelKey: "streamRecords.practicals.title", icon: "clipboard", group: "daily", screen: "/(app)/practicals", module: "ACADEMICS" },
  ],
  HOD: [
    ...COLLEGE_STAFF_MENU,
    { labelKey: "iqac.navVoice", icon: "star", group: "running", screen: "/(app)/voice", module: "IQAC" },
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
    { labelKey: "streamRecords.practicals.title", icon: "clipboard", group: "daily", screen: "/(app)/practicals", module: "ACADEMICS" },
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
    { labelKey: "iqac.navPredictor", icon: "chartLine", group: "daily", web: "/iqac/predictor", module: "IQAC" },
    { labelKey: "iqac.navDocuments", icon: "clipboard", group: "daily", web: "/iqac/documents", module: "IQAC" },
    { labelKey: "iqac.navSurveys", icon: "star", group: "daily", web: "/iqac/surveys", module: "IQAC" },
    { labelKey: "iqac.navRegisters", icon: "books", group: "running", web: "/iqac/registers", module: "IQAC" },
    { labelKey: "iqac.navGrievances", icon: "shield", group: "running", web: "/iqac/grievances", module: "IQAC" },
    { labelKey: "iqac.navFacultyRecords", icon: "users", group: "running", web: "/admin/faculty-records", module: "IQAC" },
    { labelKey: "placement.tabAnalytics", icon: "chartLine", group: "running", web: "/placement/analytics", module: "PLACEMENT" },
  ],
  TPO: [
    ...COLLEGE_STAFF_MENU,
    { labelKey: "placement.tabDrives", icon: "briefcase", group: "daily", web: "/placement/drives", module: "PLACEMENT" },
    { labelKey: "placement.tabStudents", icon: "users", group: "daily", web: "/placement/students", module: "PLACEMENT" },
    { labelKey: "placement.tabCompanies", icon: "handshake", group: "daily", web: "/placement/companies", module: "PLACEMENT" },
    { labelKey: "placement.tabInternships", icon: "clipboard", group: "daily", web: "/placement/internships", module: "PLACEMENT" },
    { labelKey: "placement.tabAnalytics", icon: "chartLine", group: "running", web: "/placement/analytics", module: "PLACEMENT" },
  ],
  ACCOUNTS: [
    ...COLLEGE_STAFF_MENU,
    { labelKey: "collegeDesks.lookupTitle", icon: "users", group: "daily", screen: "/(app)/accounts-lookup" },
    { labelKey: "collegeOffice.navStructures", icon: "receipt", group: "daily", web: "/accounts/structures" },
    { labelKey: "collegeOffice.navScholarships", icon: "receipt", group: "daily", web: "/accounts/scholarships", module: "SCHOLARSHIPS" },
    { labelKey: "collegeOffice.navNoDues", icon: "checks", group: "daily", web: "/accounts/no-dues" },
    { labelKey: "collegeOffice.navConcessions", icon: "clipboard", group: "daily", web: "/accounts/concessions" },
    { labelKey: "collegeOffice.navStudents", icon: "users", group: "daily", web: "/accounts/students" },
    { labelKey: "collegeOffice.navFeeLedger", icon: "receipt", group: "running", web: "/admin/fees" },
    { labelKey: "payroll.title", icon: "receipt", group: "running", web: "/admin/payroll", module: "PAYROLL" },
    { labelKey: "inventory.title", icon: "archive", group: "running", web: "/admin/inventory", module: "INVENTORY" },
  ],
  RECRUITER: [{ labelKey: "nav.account", icon: "user", group: "running", screen: "/(app)/account" }],
};

/**
 * Every route under (app) that is not a tab: the Tabs navigator lists every
 * file it finds and, on the web target, shows an unnamed one in the bar with
 * a default icon, so each is declared with href: null. A test checks this
 * list against the files on disk.
 */
export const HIDDEN_SCREENS = [
  // The college at a glance for the head and the registrar (campaign 2026-10-04, G-4).
  "college",
  // The exam cell (4 Oct 2026): a student's (or a guardian's child's) exams, a faculty member's duties.
  "college-exams",
  "exam-duties",
  // The IQAC module (4 Oct 2026): the surveys open to me and the grievance line.
  "voice",
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
  // The S3 fixes (5 Oct 2026): the TPO's drive with its rounds, from the TPO's home; an HOD's lecture substitutions.
  "placement-drive",
  "lecture-substitutions",
  // A college alumnus's college: mentoring, referrals, meets and gifts (5 Oct 2026).
  "alumni-college",
  // The accounts desk's look-up of a student by PRN: the ledger and the exam form's no-dues, read only (5 Oct 2026).
  "accounts-lookup",
] as const;

/** The More sheet's entries for a role, grouped in the web's order; an entry whose module the school has off, or whose duty the person does not hold (5 Oct 2026), is left out. */
export function menuFor(role: RoleCode, modules?: readonly string[], duties: readonly string[] = []): { group: MenuGroup; items: MenuItem[] }[] {
  const shown = MENU[role].filter((item) => (!item.module || !modules || modules.includes(item.module)) && (!item.duty || duties.includes(item.duty)));
  return MENU_GROUPS.map((group) => ({ group, items: shown.filter((item) => item.group === group) })).filter((g) => g.items.length > 0);
}

/** Whether a tab is drawn: always, unless it belongs to a module the school has off or a duty the person does not hold. */
export function tabShown(tab: Tab, modules: readonly string[], duties: readonly string[] = []): boolean {
  return (!tab.module || modules.includes(tab.module)) && (!tab.duty || duties.includes(tab.duty));
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
