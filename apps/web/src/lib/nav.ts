import type { Role } from "./constants";
import type { TranslationKey } from "./i18n/dictionary";
import type { SchoolModuleCode } from "@edulink/contracts";

/**
 * Navigation model.
 *
 * The spec asks for deliberately "redundant" navigation: bottom bar on phones,
 * side rail on desktop, FAB for the primary task, and a command palette. All
 * four read from this one definition so they can never disagree about what
 * exists or what a thing is called. (§7)
 *
 * KEYS, NOT WORDS. Every label here is a dictionary key rather than a string,
 * so the four surfaces above cannot disagree about the language either — and
 * because `TranslationKey` is derived from `en.ts`, a typo in a key is a build
 * error rather than a nav item labelled "nav.pracitce".
 */

export type NavGroup = "daily" | "school" | "running";

export type NavItem = {
  href: string;
  labelKey: TranslationKey;
  /** Phosphor icon name, resolved by the icon map in components/nav/icons.tsx */
  icon: string;
  /** Shown in the bottom bar on phones (max 5). */
  primary?: boolean;
  /** Matches child routes too, e.g. /teacher/classes/abc */
  prefix?: boolean;
  /** Other paths that count as "here" — a tab that lives on its own route. */
  also?: string[];
  /**
   * Where a non-primary item sits in the rail and the More sheet. FIVE
   * PRIMARIES PER ROLE, chosen by how often they are opened in a day;
   * everything else is grouped so the rail reads as three short lists
   * rather than one long one. Primaries carry no group.
   */
  group?: NavGroup;
  /**
   * The module this entry belongs to (3 Oct 2026). The shell hides it while the
   * school has the module off (signed-in-shell.tsx), and for a module role the
   * session's gate stops granting the page through it (role-gate.ts). A
   * module builder adds an entry with this field — for the office, the head,
   * a teacher, a family or the module's own role — and nothing else.
   */
  module?: SchoolModuleCode;
};

export const NAV_GROUP_KEY: Record<NavGroup, TranslationKey> = {
  daily: "nav.groupDaily",
  school: "nav.groupSchool",
  running: "nav.groupRunning",
};

export type QuickAction = {
  href: string;
  labelKey: TranslationKey;
  icon: string;
  descriptionKey: TranslationKey;
  /**
   * The pages the floating button is drawn on, by exact path. Absent for the
   * palette's actions, which float nowhere. The walk of 2026-10-01 found the
   * button on every page of a role, covering the last row of a short register,
   * a chapter picker and the icon of the next card, and beside a header button
   * that said the same; it floats only where the action belongs now, and never
   * on the page it leads to.
   */
  on?: string[];
};

/**
 * What every college staff role's menu carries after its home (4 Oct 2026):
 * the college's feed (bulletin.ts reads them as a teacher there), the global
 * feed, and the account.
 */
const COLLEGE_STAFF_COMMON: NavItem[] = [
  { href: "/bulletin", labelKey: "nav.bulletin", icon: "megaphone", primary: true, prefix: true },
  { href: "/account", labelKey: "nav.account", icon: "gear", prefix: true, group: "running" },
  // My own leave (the integration builder, 4 Oct 2026): the teacher's form and balance under /account.
  { href: "/account/leave", labelKey: "nav.leave", icon: "calendar", group: "running" },
];

export const NAV: Record<Role, NavItem[]> = {
  ADMIN: [
    { href: "/admin", labelKey: "nav.overview", icon: "house", primary: true },
    // Invites are a tab of People: one door for "who is in this school".
    { href: "/admin/people", labelKey: "nav.people", icon: "users", primary: true, prefix: true, also: ["/admin/invites", "/admin/intake"] },
    { href: "/admin/classes", labelKey: "nav.classes", icon: "chalkboard", primary: true, prefix: true, also: ["/admin/promotion"] },
    { href: "/admin/timetable", labelKey: "nav.timetable", icon: "clock", primary: true, prefix: true },
    { href: "/admin/exams", labelKey: "nav.exams", icon: "clipboard", primary: true, prefix: true },
    // How a report card is worked out and printed: the office's rules, read by every card generated.
    { href: "/admin/report-cards", labelKey: "nav.reportCards", icon: "clipboard", prefix: true, group: "running" },
    { href: "/admin/certificates", labelKey: "nav.certificates", icon: "clipboard", prefix: true, group: "running", also: ["/certificates"] },
    { href: "/admin/signatures", labelKey: "nav.signatures", icon: "clipboard", group: "running" },
    { href: "/admin/records", labelKey: "nav.pupilRecords", icon: "users", prefix: true, group: "running" },
    // The UDISE+ and board sheets cut from the records: the office cuts, the head reads.
    { href: "/admin/filings", labelKey: "nav.filings", icon: "clipboard", prefix: true, group: "running" },
    // The door for next year: the cycle, its sittings and the pipeline from form to seat.
    { href: "/admin/admissions", labelKey: "nav.admissions", icon: "users", prefix: true, group: "running" },
    { href: "/admin/syllabus", labelKey: "nav.syllabus", icon: "books", prefix: true, group: "running" },
    { href: "/admin/attendance", labelKey: "nav.attendance", icon: "checks", prefix: true, group: "running", also: ["/attendance/history"] },
    { href: "/admin/staff-attendance", labelKey: "nav.staffAttendance", icon: "checks", prefix: true, group: "running" },
    // Who covers the lessons of staff who are away: the board the staff register feeds.
    { href: "/admin/substitutions", labelKey: "nav.substitutions", icon: "users", prefix: true, group: "running" },
    { href: "/admin/calendar", labelKey: "nav.calendar", icon: "calendar", prefix: true, group: "running" },
    // Fees: what the school asked its families for and what arrived. The
    // office writes; the principal reads the same pages (see fees.ts officeOrHead).
    { href: "/admin/fees", labelKey: "nav.fees", icon: "receipt", prefix: true, group: "running" },
    // Texts to families: the office switches channels and sends notices; the
    // principal reads the same page and the delivery reports (messaging.ts officeOrHead).
    { href: "/admin/messaging", labelKey: "nav.messaging", icon: "chatsCircle", prefix: true, group: "running" },
    { href: "/admin/circulars", labelKey: "nav.circulars", icon: "megaphone", prefix: true, group: "running" },
    // The sick-room and incident log: the whole school's, and the record pages under /incidents.
    { href: "/admin/incidents", labelKey: "nav.incidents", icon: "firstAidKit", prefix: true, group: "running", also: ["/incidents"] },
    // Transport (3 Oct 2026): routes, buses, drivers, seats and today's trips on a map; the head reads.
    { href: "/admin/transport", labelKey: "transport.title", icon: "bus", prefix: true, group: "running", module: "TRANSPORT" },
    // The leave queue is genuinely an admin's to work — a school whose
    // principal is the one on leave still has to approve somebody's.
    { href: "/principal/leave", labelKey: "nav.leave", icon: "calendar", prefix: true, group: "running", also: ["/principal/staff"] },
    // The school across terms and years: the office reads what the head reads (lib/analytics-longitudinal.ts).
    { href: "/principal/trends", labelKey: "trends.title", icon: "chartLine", prefix: true, group: "running" },
    { href: "/admin/reviews", labelKey: "nav.reviews", icon: "star", prefix: true, group: "running" },
    { href: "/admin/safety", labelKey: "nav.safety", icon: "shield", prefix: true, group: "running" },
    { href: "/admin/settings", labelKey: "nav.settings", icon: "gear", prefix: true, group: "running" },
    // The school's former pupils by batch, notes to a batch, the feed's setting (the alumni module, 3 Oct 2026).
    { href: "/admin/alumni", labelKey: "modules.alumniName", icon: "graduationCap", prefix: true, group: "running", module: "ALUMNI" },
    // The office can now write to anyone at the school, so the inbox is theirs too.
    { href: "/remarks", labelKey: "nav.messages", icon: "chat", prefix: true, group: "daily" },
    // Hidden by the shell until somebody waits — see signed-in-shell.tsx.
    { href: "/joins", labelKey: "joinRequests.navLabel", icon: "userPlus", prefix: true, group: "running" },
    { href: "/bulletin", labelKey: "nav.bulletin", icon: "megaphone", prefix: true, group: "school" },
    { href: "/experts", labelKey: "nav.experts", icon: "briefcase", prefix: true, group: "school" },
    { href: "/admin/vacancies", labelKey: "nav.vacancies", icon: "briefcase", prefix: true, group: "school", also: ["/vacancies"] },
    // Hidden by the shell until the school has any — see signed-in-shell.tsx.
    { href: "/enquiries", labelKey: "nav.enquiries", icon: "envelope", prefix: true, group: "school" },
    { href: "/mentoring", labelKey: "nav.mentoring", icon: "chat", prefix: true, group: "school" },
    { href: "/admin/sessions", labelKey: "nav.sessions", icon: "calendar", prefix: true, group: "school" },
    { href: "/competitions", labelKey: "nav.competitions", icon: "trophy", prefix: true, group: "school" },
    { href: "/archive", labelKey: "nav.pastYears", icon: "archive", prefix: true, group: "school" },
    // Inventory and assets, and HR and payroll (3 Oct 2026): the office runs both; the head reads payroll's summary.
    { href: "/admin/inventory", labelKey: "inventory.title", icon: "archive", prefix: true, group: "running", module: "INVENTORY" },
    { href: "/admin/payroll", labelKey: "payroll.title", icon: "receipt", prefix: true, group: "running", module: "PAYROLL" },
    { href: "/account/payslips", labelKey: "payroll.myTitle", icon: "receipt", prefix: true, group: "running", module: "PAYROLL" },
    { href: "/account/items", labelKey: "inventory.myTitle", icon: "archive", prefix: true, group: "running", module: "INVENTORY" },
    // The library desk and its rules, and the hostel at a glance (3 Oct 2026): the office lends, sets the rules and makes the houses.
    { href: "/library", labelKey: "modules.libraryName", icon: "bookOpen", prefix: true, group: "running", module: "LIBRARY", also: ["/admin/library"] },
    { href: "/admin/hostel", labelKey: "modules.hostelName", icon: "bed", prefix: true, group: "running", module: "HOSTEL", also: ["/hostel"] },
    // The college's academics (4 Oct 2026): structure, offerings, timetable, registration, attendance and condonations.
    { href: "/admin/academics", labelKey: "academics.title", icon: "graduationCap", prefix: true, group: "running", module: "ACADEMICS" },
    // The college office (4 Oct 2026): admissions from the CET rounds, the accounts desk, and the library, hostel and bus at a college.
    { href: "/admin/college-admissions", labelKey: "collegeOffice.admissionsTitle", icon: "userPlus", prefix: true, group: "running", module: "ADMISSIONS" },
    { href: "/accounts", labelKey: "role.accounts", icon: "wallet", prefix: true, group: "running", module: "ACADEMICS" },
    { href: "/admin/college-campus", labelKey: "collegeOffice.campusTitle", icon: "buildings", prefix: true, group: "running", module: "ACADEMICS" },
    // The college exam cell (4 Oct 2026): the office reads sessions, forms, results and analytics.
    { href: "/exam-cell", labelKey: "examCell.title", icon: "exam", prefix: true, group: "running", module: "EXAMS" },
    // Placement (4 Oct 2026): the office reads the cell's pages at a college with PLACEMENT on.
    { href: "/placement", labelKey: "placement.navCell", icon: "briefcase", prefix: true, group: "running", module: "PLACEMENT" },
    // IQAC (4 Oct 2026): the accreditation desk, the committees and minutes, the faculty records.
    { href: "/iqac", labelKey: "iqac.navHome", icon: "medal", prefix: true, group: "running", module: "IQAC" },
    { href: "/admin/committees", labelKey: "iqac.navCommittees", icon: "users", prefix: true, group: "running", module: "IQAC" },
    { href: "/admin/faculty-records", labelKey: "iqac.navFacultyRecords", icon: "clipboard", prefix: true, group: "running", module: "IQAC" },
    // The college at a glance (the integration builder, 4 Oct 2026): the head's dashboard, which the office reads too; ACADEMICS stands for "is a college".
    { href: "/principal/college", labelKey: "collegeHub.title", icon: "chartLine", group: "running", module: "ACADEMICS" },
  ],
  // A principal READS and DECIDES. No register, no gradebook, no class setup —
  // those belong to the teacher and the admin respectively, and handing all
  // three to one role is how "principal" quietly becomes "can do anything".
  PRINCIPAL: [
    { href: "/principal", labelKey: "nav.dashboard", icon: "chartLine", primary: true, also: ["/attendance/history", "/principal/college"] },
    { href: "/principal/classes", labelKey: "nav.classes", icon: "chalkboard", primary: true, prefix: true },
    { href: "/principal/leave", labelKey: "nav.leave", icon: "calendar", primary: true, prefix: true, also: ["/principal/staff"] },
    { href: "/admin/reviews", labelKey: "nav.reviews", icon: "star", primary: true, prefix: true },
    { href: "/exams", labelKey: "nav.exams", icon: "clipboard", primary: true, prefix: true },
    { href: "/admin/report-cards", labelKey: "nav.reportCards", icon: "clipboard", prefix: true, group: "running" },
    { href: "/admin/certificates", labelKey: "nav.certificates", icon: "clipboard", prefix: true, group: "running", also: ["/certificates"] },
    { href: "/admin/signatures", labelKey: "nav.signatures", icon: "clipboard", group: "running" },
    { href: "/admin/records", labelKey: "nav.pupilRecords", icon: "users", prefix: true, group: "running" },
    // The UDISE+ and board sheets cut from the records: the office cuts, the head reads.
    { href: "/admin/filings", labelKey: "nav.filings", icon: "clipboard", prefix: true, group: "running" },
    // The door for next year: the cycle, its sittings and the pipeline from form to seat.
    { href: "/admin/admissions", labelKey: "nav.admissions", icon: "users", prefix: true, group: "running" },
    { href: "/admin/syllabus", labelKey: "nav.syllabus", icon: "books", prefix: true, group: "running" },
    { href: "/principal/timetable", labelKey: "nav.timetable", icon: "clock", prefix: true, group: "running" },
    // The head's own decisions, as sentences, read from the audit log (lib/decision-log.ts).
    { href: "/principal/decisions", labelKey: "decisions.title", icon: "clipboard", prefix: true, group: "running" },
    // The school across terms and years, recomputed on read (lib/analytics-longitudinal.ts).
    { href: "/principal/trends", labelKey: "trends.title", icon: "chartLine", prefix: true, group: "running" },
    { href: "/admin/staff-attendance", labelKey: "nav.staffAttendance", icon: "checks", prefix: true, group: "running" },
    // Who covers the lessons of staff who are away: the board the staff register feeds.
    { href: "/admin/substitutions", labelKey: "nav.substitutions", icon: "users", prefix: true, group: "running" },
    { href: "/admin/calendar", labelKey: "nav.calendar", icon: "calendar", prefix: true, group: "running" },
    // Read-only for the head: the overview, the dues and the structures.
    { href: "/admin/fees", labelKey: "nav.fees", icon: "receipt", prefix: true, group: "running" },
    // Read-only for the head: the counts, the notices sent and their reports.
    { href: "/admin/messaging", labelKey: "nav.messaging", icon: "chatsCircle", prefix: true, group: "running" },
    { href: "/admin/circulars", labelKey: "nav.circulars", icon: "megaphone", prefix: true, group: "running" },
    // The sick-room and incident log: the whole school's, and the record pages under /incidents.
    { href: "/admin/incidents", labelKey: "nav.incidents", icon: "firstAidKit", prefix: true, group: "running", also: ["/incidents"] },
    // Transport (3 Oct 2026): routes, buses, drivers, seats and today's trips on a map; the head reads.
    { href: "/admin/transport", labelKey: "transport.title", icon: "bus", prefix: true, group: "running", module: "TRANSPORT" },
    { href: "/remarks", labelKey: "nav.messages", icon: "chat", prefix: true, group: "daily" },
    // Hidden by the shell until somebody waits — see signed-in-shell.tsx.
    { href: "/joins", labelKey: "joinRequests.navLabel", icon: "userPlus", prefix: true, group: "running" },
    { href: "/bulletin", labelKey: "nav.bulletin", icon: "megaphone", prefix: true, group: "school" },
    { href: "/admin/vacancies", labelKey: "nav.vacancies", icon: "briefcase", prefix: true, group: "school", also: ["/vacancies"] },
    { href: "/enquiries", labelKey: "nav.enquiries", icon: "envelope", prefix: true, group: "school" },
    { href: "/competitions", labelKey: "nav.competitions", icon: "trophy", prefix: true, group: "school" },
    { href: "/admin/sessions", labelKey: "nav.sessions", icon: "calendar", prefix: true, group: "school" },
    { href: "/archive", labelKey: "nav.pastYears", icon: "archive", prefix: true, group: "school" },
    { href: "/account", labelKey: "nav.account", icon: "gear", prefix: true, group: "running" },
    // The payroll summary (no one's slip unless the office shares a run) and the stores, read; the head's own payslips and things.
    { href: "/admin/payroll", labelKey: "payroll.title", icon: "receipt", prefix: true, group: "running", module: "PAYROLL" },
    { href: "/admin/inventory", labelKey: "inventory.title", icon: "archive", prefix: true, group: "running", module: "INVENTORY" },
    { href: "/account/payslips", labelKey: "payroll.myTitle", icon: "receipt", prefix: true, group: "running", module: "PAYROLL" },
    { href: "/account/items", labelKey: "inventory.myTitle", icon: "archive", prefix: true, group: "running", module: "INVENTORY" },
    // The library's lists and reports, and the hostel at a glance (3 Oct 2026), read.
    { href: "/library", labelKey: "modules.libraryName", icon: "bookOpen", prefix: true, group: "running", module: "LIBRARY", also: ["/admin/library"] },
    { href: "/admin/hostel", labelKey: "modules.hostelName", icon: "bed", prefix: true, group: "running", module: "HOSTEL", also: ["/hostel"] },
    // The college's academics, read; late registrations and forwarded condonations decided (4 Oct 2026).
    { href: "/admin/academics", labelKey: "academics.title", icon: "graduationCap", prefix: true, group: "running", module: "ACADEMICS" },
    // The college's money and admissions, read; concessions above the office's limit approved (4 Oct 2026).
    { href: "/accounts", labelKey: "role.accounts", icon: "wallet", prefix: true, group: "running", module: "ACADEMICS" },
    { href: "/admin/college-admissions", labelKey: "collegeOffice.admissionsTitle", icon: "userPlus", prefix: true, group: "running", module: "ADMISSIONS" },
    // The college exam cell (4 Oct 2026): results and analytics to read, grace proposals to decide.
    { href: "/exam-cell", labelKey: "examCell.title", icon: "exam", prefix: true, group: "running", module: "EXAMS" },
    // Placement (4 Oct 2026): the principal reads the cell's pages.
    { href: "/placement", labelKey: "placement.navCell", icon: "briefcase", prefix: true, group: "running", module: "PLACEMENT" },
    // IQAC (4 Oct 2026): the accreditation file to read and sign off, the committees, the faculty records.
    { href: "/principal/accreditation", labelKey: "iqac.navAccreditation", icon: "medal", prefix: true, group: "running", module: "IQAC", also: ["/iqac"] },
    { href: "/admin/committees", labelKey: "iqac.navCommittees", icon: "users", prefix: true, group: "running", module: "IQAC" },
    { href: "/admin/faculty-records", labelKey: "iqac.navFacultyRecords", icon: "clipboard", prefix: true, group: "running", module: "IQAC" },
  ],
  TEACHER: [
    { href: "/teacher", labelKey: "nav.today", icon: "house", primary: true },
    { href: "/teacher/attendance", labelKey: "nav.register", icon: "checks", primary: true, prefix: true, also: ["/attendance/history"] },
    { href: "/teacher/classes", labelKey: "nav.classes", icon: "chalkboard", primary: true, prefix: true },
    { href: "/teacher/assignments", labelKey: "nav.assignments", icon: "clipboard", primary: true, prefix: true },
    { href: "/teacher/exams", labelKey: "nav.exams", icon: "clipboard", primary: true, prefix: true },
    { href: "/timetable", labelKey: "nav.timetable", icon: "clock", prefix: true, group: "daily" },
    { href: "/remarks", labelKey: "nav.messages", icon: "chat", prefix: true, group: "daily" },
    { href: "/teacher/practice", labelKey: "nav.practice", icon: "brain", prefix: true, group: "daily" },
    { href: "/teacher/meetings", labelKey: "nav.meetings", icon: "calendar", prefix: true, group: "daily" },
    { href: "/teacher/leave", labelKey: "nav.leave", icon: "calendar", prefix: true, group: "running" },
    { href: "/teacher/attendance/me", labelKey: "nav.staffAttendance", icon: "checks", prefix: true, group: "running" },
    { href: "/teacher/incidents", labelKey: "nav.incidents", icon: "firstAidKit", prefix: true, group: "running", also: ["/incidents"] },
    { href: "/teacher/signatures", labelKey: "nav.signatures", icon: "clipboard", group: "running" },
    { href: "/teacher/contributions", labelKey: "nav.contributions", icon: "books", prefix: true, group: "running" },
    { href: "/teacher/profile", labelKey: "nav.me", icon: "user", prefix: true, group: "running" },
    // What the head has shown me of my observations, targets and appraisals (lib/appraisal.ts).
    { href: "/teacher/appraisals", labelKey: "appraisal.myTitle", icon: "clipboard", prefix: true, group: "running" },
    // Hidden by the shell until somebody waits — see signed-in-shell.tsx.
    { href: "/joins", labelKey: "joinRequests.navLabel", icon: "userPlus", prefix: true, group: "running" },
    { href: "/bulletin", labelKey: "nav.bulletin", icon: "megaphone", prefix: true, group: "school" },
    { href: "/experts", labelKey: "nav.experts", icon: "briefcase", prefix: true, group: "school" },
    { href: "/vacancies", labelKey: "nav.vacancies", icon: "briefcase", prefix: true, group: "school" },
    { href: "/enquiries", labelKey: "nav.enquiries", icon: "envelope", prefix: true, group: "school" },
    { href: "/mentoring", labelKey: "nav.mentoring", icon: "chat", prefix: true, group: "school" },
    { href: "/teacher/guidance", labelKey: "nav.guidance", icon: "calendar", prefix: true, group: "school" },
    { href: "/competitions", labelKey: "nav.competitions", icon: "trophy", prefix: true, group: "school" },
    { href: "/archive", labelKey: "nav.pastYears", icon: "archive", prefix: true, group: "school" },
    // My own payslips and what the stores issued to me (3 Oct 2026), while the school has the module on.
    { href: "/account/payslips", labelKey: "payroll.myTitle", icon: "receipt", prefix: true, group: "running", module: "PAYROLL" },
    { href: "/account/items", labelKey: "inventory.myTitle", icon: "archive", prefix: true, group: "running", module: "INVENTORY" },
    // My loans, dues and reservations, and the catalogue (the library module, 3 Oct 2026).
    { href: "/teacher/library", labelKey: "modules.libraryName", icon: "bookOpen", prefix: true, group: "school", module: "LIBRARY" },
  ],
  STUDENT: [
    { href: "/student", labelKey: "nav.today", icon: "house", primary: true },
    // ONE place for "what do I owe": to do, handed in, marked — the old
    // "My work" and "Grades" folded together.
    { href: "/student/assignments", labelKey: "nav.assignments", icon: "clipboard", primary: true, prefix: true, also: ["/student/work", "/student/grades"] },
    // ONE place for "how did I do": exam marks, the exams ahead, report cards.
    { href: "/exams", labelKey: "nav.exams", icon: "chartLine", primary: true, prefix: true, also: ["/report-cards"] },
    { href: "/student/certificates", labelKey: "nav.certificates", icon: "clipboard", prefix: true, group: "school", also: ["/certificates", "/student/record"] },
    { href: "/student/practice", labelKey: "nav.practice", icon: "brain", primary: true, prefix: true },
    { href: "/timetable", labelKey: "nav.timetable", icon: "clock", prefix: true, group: "daily" },
    { href: "/remarks", labelKey: "nav.messages", icon: "chat", prefix: true, group: "daily" },
    { href: "/reviews", labelKey: "nav.feedback", icon: "star", prefix: true, group: "daily" },
    // The pupil's own health card and incident log, read-only from the age the school sets (self-read.ts); below it, "ask a grown-up".
    { href: "/student/health", labelKey: "nav.health", icon: "heart", prefix: true, group: "daily" },
    { href: "/student/incidents", labelKey: "nav.incidents", icon: "firstAidKit", prefix: true, group: "daily" },
    // Social Media sits with school life for a pupil — the bottom bar keeps
    // the four things a school day is made of.
    { href: "/bulletin", labelKey: "nav.bulletin", icon: "megaphone", prefix: true, group: "school" },
    { href: "/mentoring", labelKey: "nav.mentoring", icon: "chat", prefix: true, group: "school" },
    { href: "/sessions", labelKey: "nav.sessions", icon: "calendar", prefix: true, group: "school" },
    { href: "/competitions", labelKey: "nav.competitions", icon: "trophy", prefix: true, group: "school" },
    { href: "/archive", labelKey: "nav.pastYears", icon: "archive", prefix: true, group: "school" },
    { href: "/student/profile", labelKey: "nav.me", icon: "user", prefix: true, group: "running" },
    // What a student lets their guardians see (4 Oct 2026): an adult at a college decides. Under ACADEMICS, which every
    // college has on and no school is offered, so a school's pupils are not shown a page that only says "they see it all".
    { href: "/student/consent", labelKey: "consent.title", icon: "users", prefix: true, group: "running", module: "ACADEMICS" },
    // The library and the hostel (3 Oct 2026): my loans and the catalogue; my room, tonight's roll call and leave.
    { href: "/student/library", labelKey: "modules.libraryName", icon: "bookOpen", prefix: true, group: "school", module: "LIBRARY" },
    { href: "/student/hostel", labelKey: "modules.hostelName", icon: "bed", prefix: true, group: "school", module: "HOSTEL" },
    // My courses, lectures, attendance, internal marks and registration (the college's academics, 4 Oct 2026).
    { href: "/student/academics", labelKey: "academics.studentTitle", icon: "graduationCap", prefix: true, group: "daily", module: "ACADEMICS", also: ["/student/registration"] },
    // A college student's money net of scholarships, the scholarships, and their own account (4 Oct 2026; ACADEMICS stands for "a college").
    { href: "/student/money", labelKey: "collegeOffice.moneyTitle", icon: "wallet", prefix: true, group: "school", module: "ACADEMICS" },
    { href: "/student/scholarships", labelKey: "collegeOffice.navScholarships", icon: "receipt", prefix: true, group: "school", module: "SCHOLARSHIPS" },
    { href: "/student/account", labelKey: "collegeOffice.accountTitle", icon: "shield", prefix: true, group: "running", module: "ACADEMICS" },
    // A college student's exams (4 Oct 2026): the form, hall ticket, results, grade cards, backlogs, credits.
    { href: "/student/exams", labelKey: "examCell.mineTitle", icon: "exam", prefix: true, group: "school", module: "EXAMS" },
    // Placement (4 Oct 2026): my profile, drives, offers, internships and practice.
    { href: "/student/placement", labelKey: "placement.navStudent", icon: "briefcase", prefix: true, group: "school", module: "PLACEMENT" },
    // IQAC (4 Oct 2026): course feedback, the satisfaction survey, a grievance to the committee.
    { href: "/student/voice", labelKey: "iqac.navVoice", icon: "chat", prefix: true, group: "school", module: "IQAC" },
  ],
  PARENT: [
    { href: "/parent", labelKey: "nav.overview", icon: "house", primary: true },
    { href: "/parent/attendance", labelKey: "nav.attendance", icon: "checks", primary: true, prefix: true },
    // The homework diary and the grades page, folded into one Assignments.
    { href: "/parent/assignments", labelKey: "nav.assignments", icon: "clipboard", primary: true, prefix: true, also: ["/parent/homework", "/parent/grades"] },
    { href: "/exams", labelKey: "nav.exams", icon: "chartLine", primary: true, prefix: true, also: ["/report-cards"] },
    { href: "/remarks", labelKey: "nav.messages", icon: "chat", primary: true, prefix: true },
    { href: "/parent/certificates", labelKey: "nav.certificates", icon: "clipboard", prefix: true, group: "daily", also: ["/certificates", "/parent/record"] },
    { href: "/parent/practice", labelKey: "nav.practice", icon: "brain", prefix: true, group: "daily" },
    { href: "/parent/timetable", labelKey: "nav.timetable", icon: "clock", prefix: true, group: "daily" },
    { href: "/parent/meetings", labelKey: "nav.meetings", icon: "calendar", prefix: true, group: "daily" },
    { href: "/parent/fees", labelKey: "nav.fees", icon: "receipt", prefix: true, group: "daily" },
    // The child's health and emergency card: the family writes it, the teachers read it.
    { href: "/parent/health", labelKey: "nav.health", icon: "heart", prefix: true, group: "daily" },
    { href: "/parent/incidents", labelKey: "nav.incidents", icon: "firstAidKit", prefix: true, group: "daily" },
    // The child's bus: route, stop, and the bus on a map during a trip (transport, 3 Oct 2026).
    // A family's module entries follow the children's schools (enabledModulesForFamily, 4 Oct 2026).
    { href: "/parent/transport", labelKey: "transport.parentTitle", icon: "bus", prefix: true, group: "daily", module: "TRANSPORT" },
    { href: "/reviews", labelKey: "nav.feedback", icon: "star", prefix: true, group: "daily" },
    // Hidden by the shell until somebody asks to be linked to one of their children.
    { href: "/parent/claims", labelKey: "joinRequests.parentClaimsNav", icon: "userPlus", prefix: true, group: "daily" },
    { href: "/bulletin", labelKey: "nav.bulletin", icon: "megaphone", prefix: true, group: "school" },
    { href: "/explore", labelKey: "nav.explore", icon: "buildings", prefix: true, group: "school" },
    { href: "/parent/applications", labelKey: "nav.applications", icon: "clipboard", prefix: true, group: "school" },
    { href: "/enquiries", labelKey: "nav.enquiries", icon: "envelope", prefix: true, group: "school" },
    { href: "/competitions", labelKey: "nav.competitions", icon: "trophy", prefix: true, group: "school" },
    { href: "/mentoring", labelKey: "nav.mentoring", icon: "chat", prefix: true, group: "school" },
    { href: "/sessions", labelKey: "nav.sessions", icon: "calendar", prefix: true, group: "school" },
    { href: "/archive", labelKey: "nav.pastYears", icon: "archive", prefix: true, group: "school" },
    { href: "/parent/settings", labelKey: "nav.settings", icon: "gear", prefix: true, group: "running" },
    // The library and the hostel (3 Oct 2026): a child's loans and dues; a boarder's room, roll call and leave to consent to.
    { href: "/parent/library", labelKey: "modules.libraryName", icon: "bookOpen", prefix: true, group: "school", module: "LIBRARY" },
    { href: "/parent/hostel", labelKey: "modules.hostelName", icon: "bed", prefix: true, group: "school", module: "HOSTEL" },
    // A college child's lecture attendance: a minor's always, an adult's with ATTENDANCE granted (4 Oct 2026).
    { href: "/parent/academics", labelKey: "academics.familyTitle", icon: "graduationCap", prefix: true, group: "daily", module: "ACADEMICS" },
    // A college child's results (4 Oct 2026): a minor's always, an adult's under the RESULTS grant.
    { href: "/parent/results", labelKey: "examCell.parentTitle", icon: "exam", prefix: true, group: "school", module: "EXAMS" },
    // Placement (4 Oct 2026): a child's offers and internships (an adult's with the PLACEMENT grant).
    { href: "/parent/placement", labelKey: "placement.navParent", icon: "briefcase", prefix: true, group: "school", module: "PLACEMENT" },
    // A college child's ledger net of the scholarship (the integration builder, 4 Oct 2026): ACADEMICS stands for "is a college".
    { href: "/parent/money", labelKey: "collegeOffice.moneyTitle", icon: "wallet", prefix: true, group: "school", module: "ACADEMICS" },
  ],
  // An expert sees their own work and nothing resembling a school's internals.
  EXPERT: [
    { href: "/expert", labelKey: "nav.bookings", icon: "house", primary: true },
    { href: "/expert/availability", labelKey: "nav.availability", icon: "calendar", primary: true, prefix: true },
    { href: "/mentoring", labelKey: "nav.mentoring", icon: "chat", primary: true, prefix: true },
    { href: "/expert/sessions", labelKey: "nav.sessions", icon: "calendar", primary: true, prefix: true },
    { href: "/expert/earnings", labelKey: "gigs.earningsTitle", icon: "chartLine", prefix: true, group: "running" },
    { href: "/expert/profile", labelKey: "nav.profile", icon: "user", prefix: true, group: "running" },
    { href: "/account", labelKey: "nav.account", icon: "gear", prefix: true, group: "running" },
  ],
  /*
   * THE MODULE ROLES (3 Oct 2026). Each starts with its home, which says
   * whether the school has switched the module on, and the account. A module
   * builder adds the role's screens here with `module` set; the home itself
   * carries no module, so it stays to say "switched off" when it is.
   * Anything not listed is a page this role cannot open (role-gate.ts).
   */
  DRIVER: [
    { href: "/driver", labelKey: "modules.transportName", icon: "bus", primary: true, prefix: true },
    { href: "/account", labelKey: "nav.account", icon: "gear", prefix: true, group: "running" },
    { href: "/account/leave", labelKey: "nav.leave", icon: "calendar", group: "running" },
    // Every school's shared posts (4 Oct 2026): the module staff read the global feed as staff.
    { href: "/bulletin/global", labelKey: "bulletin.globalFeed", icon: "globe", group: "daily" },
  ],
  LIBRARIAN: [
    { href: "/library", labelKey: "modules.libraryName", icon: "bookOpen", primary: true, prefix: true },
    { href: "/account", labelKey: "nav.account", icon: "gear", prefix: true, group: "running" },
    { href: "/account/leave", labelKey: "nav.leave", icon: "calendar", group: "running" },
    { href: "/bulletin/global", labelKey: "bulletin.globalFeed", icon: "globe", group: "daily" },
    // The desk's pages (the library module, 3 Oct 2026); the home above carries no module, so it stays to say "switched off".
    { href: "/library/catalogue", labelKey: "library.tabCatalogue", icon: "books", primary: true, prefix: true, module: "LIBRARY", also: ["/library/titles"] },
    { href: "/library/overdue", labelKey: "library.tabOverdue", icon: "clock", primary: true, prefix: true, module: "LIBRARY" },
    { href: "/library/reservations", labelKey: "library.tabReservations", icon: "calendar", primary: true, prefix: true, module: "LIBRARY" },
    { href: "/library/fines", labelKey: "library.tabFines", icon: "receipt", prefix: true, group: "daily", module: "LIBRARY" },
    { href: "/library/stocktake", labelKey: "library.tabStockTake", icon: "checks", prefix: true, group: "running", module: "LIBRARY" },
    { href: "/library/reports", labelKey: "library.tabReports", icon: "chartLine", prefix: true, group: "running", module: "LIBRARY" },
    // At a college (4 Oct 2026): e-resources, the ISBN list and the criterion-4 numbers; the library's line of the no-dues.
    { href: "/library/college", labelKey: "collegeOffice.libraryTitle", icon: "books", prefix: true, group: "running", module: "ACADEMICS" },
    { href: "/accounts/no-dues", labelKey: "collegeOffice.navNoDues", icon: "checks", prefix: true, group: "daily", module: "ACADEMICS" },
  ],
  WARDEN: [
    { href: "/hostel", labelKey: "modules.hostelName", icon: "bed", primary: true, prefix: true },
    { href: "/account", labelKey: "nav.account", icon: "gear", prefix: true, group: "running" },
    { href: "/account/leave", labelKey: "nav.leave", icon: "calendar", group: "running" },
    { href: "/bulletin/global", labelKey: "bulletin.globalFeed", icon: "globe", group: "daily" },
    // The warden's pages (the hostel module, 3 Oct 2026); the home above carries no module, so it stays to say "switched off".
    { href: "/hostel/rollcall", labelKey: "hostel.tabRollCall", icon: "checks", primary: true, prefix: true, module: "HOSTEL" },
    { href: "/hostel/leave", labelKey: "hostel.tabLeave", icon: "calendar", primary: true, prefix: true, module: "HOSTEL" },
    { href: "/hostel/rooms", labelKey: "hostel.tabRooms", icon: "bed", primary: true, prefix: true, module: "HOSTEL", also: ["/hostel/health"] },
    { href: "/hostel/visitors", labelKey: "hostel.tabVisitors", icon: "users", prefix: true, group: "daily", module: "HOSTEL" },
    { href: "/hostel/menu", labelKey: "hostel.tabMenu", icon: "clipboard", prefix: true, group: "running", module: "HOSTEL" },
    { href: "/hostel/incidents", labelKey: "hostel.tabIncidents", icon: "firstAidKit", prefix: true, group: "running", module: "HOSTEL" },
    // At a college (4 Oct 2026): the anti-ragging squad's rounds, room changes and the criterion-5 numbers; the hostel's line of the no-dues.
    { href: "/hostel/squad", labelKey: "collegeOffice.squadTitle", icon: "shield", prefix: true, group: "running", module: "ACADEMICS" },
    { href: "/accounts/no-dues", labelKey: "collegeOffice.navNoDues", icon: "checks", prefix: true, group: "daily", module: "ACADEMICS" },
  ],
  // A former pupil: the school's feed to read and its staff to write to, nothing else; the alumni builder adds the rest.
  ALUMNUS: [
    { href: "/alumni", labelKey: "modules.alumniName", icon: "graduationCap", primary: true, prefix: true },
    { href: "/bulletin", labelKey: "nav.bulletin", icon: "megaphone", primary: true, prefix: true, module: "ALUMNI" },
    { href: "/remarks", labelKey: "nav.messages", icon: "chat", primary: true, prefix: true, module: "ALUMNI" },
    // The directory a former pupil may join (the alumni module): under their home, so the home's prefix already lets them in.
    { href: "/alumni/directory", labelKey: "alumni.directoryTitle", icon: "users", primary: true, module: "ALUMNI" },
    { href: "/account", labelKey: "nav.account", icon: "gear", prefix: true, group: "running" },
    // The college's alumni additions (placement, 4 Oct 2026): ACADEMICS stands for "is a college", as it does for the consent page.
    { href: "/alumni/college", labelKey: "placement.navAlumni", icon: "handshake", primary: true, module: "ACADEMICS" },
    // IQAC (4 Oct 2026): the alumni survey, under the alumnus's own home.
    { href: "/alumni/survey", labelKey: "iqac.navAlumniSurvey", icon: "star", prefix: true, group: "running", module: "IQAC" },
  ],
  /*
   * THE COLLEGE'S SEVEN (4 Oct 2026). Each starts with its home, which says
   * whether the college has the role's module on (and carries no module, so
   * it stays to say so), the college's feed, the global feed and the account.
   * Each module's builder adds the role's screens here with `module` set.
   * Anything not listed is a page this role cannot open (role-gate.ts).
   */
  FACULTY: [
    { href: "/faculty", labelKey: "role.faculty", icon: "chalkboard", primary: true, prefix: true },
    // Messages (the integration builder, 4 Oct 2026): former pupils write to their faculty, who answer here as a teacher does.
    { href: "/remarks", labelKey: "nav.messages", icon: "chat", prefix: true, group: "daily" },
    ...COLLEGE_STAFF_COMMON,
    // Exam duties (4 Oct 2026): invigilation, papers to set, bundles to assess, remuneration.
    { href: "/faculty/exams", labelKey: "examCell.dutiesTitle", icon: "exam", prefix: true, group: "daily", module: "EXAMS" },
    // Placement (4 Oct 2026): the internships I supervise and the projects I guide.
    { href: "/faculty/supervision", labelKey: "placement.supervisionTitle", icon: "briefcase", prefix: true, group: "daily", module: "PLACEMENT" },
    // IQAC (4 Oct 2026): my research items, my record, my course feedback.
    { href: "/faculty/research", labelKey: "iqac.navResearch", icon: "books", prefix: true, group: "running", module: "IQAC" },
  ],
  HOD: [
    { href: "/hod", labelKey: "role.hod", icon: "treeStructure", primary: true, prefix: true },
    // Messages (the integration builder, 4 Oct 2026): former pupils write to their faculty, who answer here as a teacher does.
    { href: "/remarks", labelKey: "nav.messages", icon: "chat", prefix: true, group: "daily" },
    // An HOD teaches too: their lectures, offerings and mentoring are the faculty pages (the college's academics, 4 Oct 2026).
    { href: "/faculty", labelKey: "academics.myTeaching", icon: "chalkboard", prefix: true, group: "daily", module: "ACADEMICS" },
    ...COLLEGE_STAFF_COMMON,
    // The lab's line of the no-dues (the college office, 4 Oct 2026).
    { href: "/accounts/no-dues", labelKey: "collegeOffice.navNoDues", icon: "checks", prefix: true, group: "running", module: "ACADEMICS" },
    // Exam duties (4 Oct 2026): an HOD invigilates, sets and assesses as faculty do.
    { href: "/faculty/exams", labelKey: "examCell.dutiesTitle", icon: "exam", prefix: true, group: "daily", module: "EXAMS" },
    // Placement (4 Oct 2026): projects and internships of the department.
    { href: "/hod/projects", labelKey: "placement.hodProjectsTitle", icon: "briefcase", prefix: true, group: "daily", module: "PLACEMENT" },
    // IQAC (4 Oct 2026): the department's research, activities and course feedback.
    { href: "/hod/research", labelKey: "iqac.navDeptResearch", icon: "books", prefix: true, group: "running", module: "IQAC" },
  ],
  EXAM_CONTROLLER: [
    { href: "/exam-cell", labelKey: "role.examController", icon: "exam", primary: true, prefix: true },
    ...COLLEGE_STAFF_COMMON,
  ],
  IQAC: [
    { href: "/iqac", labelKey: "role.iqac", icon: "medal", primary: true, prefix: true },
    ...COLLEGE_STAFF_COMMON,
    // Placement (4 Oct 2026): the placement table for the predictor and the filings.
    { href: "/placement/analytics", labelKey: "placement.tabAnalytics", icon: "chartLine", prefix: true, group: "running", module: "PLACEMENT" },
    // The IQAC desk's own pages (4 Oct 2026), and the faculty records it reads.
    { href: "/iqac/predictor", labelKey: "iqac.navPredictor", icon: "chartLine", prefix: true, group: "daily", module: "IQAC" },
    { href: "/iqac/documents", labelKey: "iqac.navDocuments", icon: "clipboard", prefix: true, group: "daily", module: "IQAC" },
    { href: "/iqac/surveys", labelKey: "iqac.navSurveys", icon: "star", prefix: true, group: "daily", module: "IQAC" },
    { href: "/iqac/registers", labelKey: "iqac.navRegisters", icon: "books", prefix: true, group: "running", module: "IQAC" },
    { href: "/iqac/grievances", labelKey: "iqac.navGrievances", icon: "shield", prefix: true, group: "running", module: "IQAC" },
    { href: "/admin/faculty-records", labelKey: "iqac.navFacultyRecords", icon: "users", prefix: true, group: "running", module: "IQAC" },
  ],
  TPO: [
    { href: "/placement", labelKey: "role.tpo", icon: "briefcase", primary: true, prefix: true },
    ...COLLEGE_STAFF_COMMON,
    // The cell's pages (the placement module, 4 Oct 2026); the home above carries no module, so it stays to say "switched off".
    { href: "/placement/drives", labelKey: "placement.tabDrives", icon: "briefcase", primary: true, prefix: true, module: "PLACEMENT" },
    { href: "/placement/students", labelKey: "placement.tabStudents", icon: "users", primary: true, prefix: true, module: "PLACEMENT" },
    { href: "/placement/companies", labelKey: "placement.tabCompanies", icon: "handshake", primary: true, prefix: true, module: "PLACEMENT" },
    { href: "/placement/internships", labelKey: "placement.tabInternships", icon: "clipboard", prefix: true, group: "daily", module: "PLACEMENT" },
    { href: "/placement/analytics", labelKey: "placement.tabAnalytics", icon: "chartLine", prefix: true, group: "running", module: "PLACEMENT" },
  ],
  ACCOUNTS: [
    { href: "/accounts", labelKey: "role.accounts", icon: "wallet", primary: true, prefix: true },
    ...COLLEGE_STAFF_COMMON,
    // The accounts desk's pages (4 Oct 2026; under its home), and the fee ledger, payroll and purchases it keeps with the office.
    { href: "/accounts/structures", labelKey: "collegeOffice.navStructures", icon: "receipt", primary: true, prefix: true },
    { href: "/accounts/scholarships", labelKey: "collegeOffice.navScholarships", icon: "wallet", primary: true, prefix: true, module: "SCHOLARSHIPS" },
    { href: "/accounts/no-dues", labelKey: "collegeOffice.navNoDues", icon: "checks", primary: true, prefix: true },
    { href: "/accounts/concessions", labelKey: "collegeOffice.navConcessions", icon: "clipboard", prefix: true, group: "daily" },
    { href: "/accounts/students", labelKey: "collegeOffice.navStudents", icon: "users", prefix: true, group: "daily" },
    { href: "/admin/fees", labelKey: "collegeOffice.navFeeLedger", icon: "receipt", prefix: true, group: "running" },
    { href: "/admin/payroll", labelKey: "payroll.title", icon: "receipt", prefix: true, group: "running", module: "PAYROLL" },
    { href: "/admin/inventory", labelKey: "inventory.title", icon: "archive", prefix: true, group: "running", module: "INVENTORY" },
  ],
  // An outside account like the expert: its home, and its account. A college reaches it only through a drive (the placement module).
  RECRUITER: [
    { href: "/recruiter", labelKey: "role.recruiter", icon: "handshake", primary: true, prefix: true },
    { href: "/account", labelKey: "nav.account", icon: "gear", prefix: true, group: "running" },
  ],
};

/** The one action each role does most. Becomes the floating action button. */
export const PRIMARY_ACTION: Record<Role, QuickAction | null> = {
  // The overview's header has its own "Invite people", so the button floats on the people pages instead.
  ADMIN: {
    href: "/admin/invites/new",
    labelKey: "action.invitePeople",
    icon: "userPlus",
    descriptionKey: "action.invitePeopleHint",
    on: ["/admin/people", "/admin/classes"],
  },
  TEACHER: {
    href: "/teacher/attendance",
    labelKey: "action.takeRegister",
    icon: "checks",
    descriptionKey: "action.takeRegisterHint",
    on: ["/teacher", "/teacher/classes"],
  },
  PRINCIPAL: null,
  STUDENT: null,
  PARENT: null,
  DRIVER: null,
  LIBRARIAN: null,
  WARDEN: null,
  ALUMNUS: null,
  FACULTY: null,
  HOD: null,
  EXAM_CONTROLLER: null,
  IQAC: null,
  TPO: null,
  ACCOUNTS: null,
  RECRUITER: null,
  EXPERT: {
    href: "/expert/availability",
    labelKey: "action.offerTime",
    icon: "calendar",
    descriptionKey: "action.offerTimeHint",
    on: ["/expert", "/expert/sessions"],
  },
};

/** Extra entries offered by the command palette beyond plain navigation. */
export const QUICK_ACTIONS: Record<Role, QuickAction[]> = {
  ADMIN: [
    { href: "/admin/invites/new", labelKey: "action.inviteTeacher", icon: "userPlus", descriptionKey: "action.inviteTeacherHint" },
    { href: "/admin/intake", labelKey: "action.admitPupils", icon: "userPlus", descriptionKey: "action.admitPupilsHint" },
    { href: "/admin/classes/new", labelKey: "action.createClass", icon: "plus", descriptionKey: "action.createClassHint" },
    { href: "/admin/timetable", labelKey: "action.buildTimetable", icon: "clock", descriptionKey: "action.buildTimetableHint" },
    { href: "/admin/exams", labelKey: "action.scheduleExam", icon: "clipboard", descriptionKey: "action.scheduleExamHint" },
    { href: "/principal/leave", labelKey: "action.reviewLeave", icon: "calendar", descriptionKey: "action.reviewLeaveHint" },
    { href: "/admin/settings", labelKey: "action.schoolBranding", icon: "palette", descriptionKey: "action.schoolBrandingHint" },
  ],
  PRINCIPAL: [
    { href: "/principal/leave", labelKey: "action.reviewLeave", icon: "calendar", descriptionKey: "action.reviewLeaveHint" },
    { href: "/principal/classes", labelKey: "action.classInsights", icon: "chartLine", descriptionKey: "action.classInsightsHint" },
  ],
  TEACHER: [
    { href: "/teacher/attendance", labelKey: "action.takeRegister", icon: "checks", descriptionKey: "action.takeRegisterHint" },
    { href: "/teacher/assignments/new", labelKey: "action.newAssignment", icon: "plus", descriptionKey: "action.newAssignmentHint" },
    { href: "/remarks/new", labelKey: "action.messageParent", icon: "chat", descriptionKey: "action.messageParentHint" },
    { href: "/teacher/leave", labelKey: "action.applyLeave", icon: "calendar", descriptionKey: "action.applyLeaveHint" },
    { href: "/teacher/attendance/me", labelKey: "staffAttendance.checkIn", icon: "checks", descriptionKey: "staffAttendance.myIntro" },
    { href: "/teacher/exams", labelKey: "action.enterMarks", icon: "clipboard", descriptionKey: "action.enterMarksHint" },
    { href: "/teacher/classes", labelKey: "action.reportCards", icon: "clipboard", descriptionKey: "action.reportCardsHint" },
  ],
  STUDENT: [
    { href: "/student/assignments", labelKey: "action.whatIsDue", icon: "clipboard", descriptionKey: "action.whatIsDueHint" },
    { href: "/remarks/new", labelKey: "action.messageTeacher", icon: "chat", descriptionKey: "action.messageTeacherHint" },
    { href: "/bulletin/new", labelKey: "action.shareSomething", icon: "plus", descriptionKey: "action.shareSomethingHint" },
    { href: "/exams", labelKey: "action.myExamMarks", icon: "clipboard", descriptionKey: "action.myExamMarksHint" },
  ],
  PARENT: [
    { href: "/remarks/new", labelKey: "action.messageTeacher", icon: "chat", descriptionKey: "action.messageTeacherHint" },
    { href: "/parent/settings", labelKey: "action.notificationSettings", icon: "bell", descriptionKey: "action.notificationSettingsHint" },
    { href: "/exams", labelKey: "action.childExamMarks", icon: "clipboard", descriptionKey: "action.childExamMarksHint" },
  ],
  EXPERT: [
    { href: "/expert/availability", labelKey: "action.offerTime", icon: "calendar", descriptionKey: "action.offerTimeHint" },
    { href: "/expert/profile", labelKey: "action.editProfile", icon: "user", descriptionKey: "action.editProfileHint" },
  ],
  DRIVER: [],
  LIBRARIAN: [],
  WARDEN: [],
  ALUMNUS: [],
  FACULTY: [],
  HOD: [],
  EXAM_CONTROLLER: [],
  IQAC: [],
  TPO: [],
  ACCOUNTS: [],
  RECRUITER: [],
};

export function isActive(pathname: string, item: NavItem): boolean {
  const hits = (href: string) =>
    item.prefix ? pathname === href || pathname.startsWith(`${href}/`) : pathname === href;
  return hits(item.href) || (item.also ?? []).some(hits);
}
