import type { Role } from "./constants";
import type { TranslationKey } from "./i18n/dictionary";
import { DUTY_STREAMS, type DutyCode, type FeatureCode, type InstitutionKind, type SchoolModuleCode, type StreamCode } from "@edulink/contracts";

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

/**
 * WHERE AN ENTRY SITS (the owner's decision of 27 October 2026, item 3). The office and the head read their menu in
 * SEVEN groups named for the work — Teaching, People and records, Attendance and cover, Money, Communication, Modules
 * and Setup — each collapsible in the rail and the More sheet (components/nav/nav-groups.tsx). Every other role keeps
 * the three it had (Day to day, School life, Running things). `me` is a person's own pages — my letters, my payslips,
 * my items, my profile, my account — which sit under the account menu (the avatar), never in the rail.
 */
export type NavGroup = "daily" | "school" | "running" | "teaching" | "people" | "attendance" | "money" | "communication" | "modules" | "setup" | "me";

/** The office's and the head's seven groups, in the rail's order. */
export const OFFICE_GROUPS = ["teaching", "people", "attendance", "money", "communication", "modules", "setup"] as const satisfies readonly NavGroup[];
/** Every other role's three. */
export const CLASSIC_GROUPS = ["daily", "school", "running"] as const satisfies readonly NavGroup[];
/** The roles whose menu reads in the seven groups. */
export const OFFICE_GROUP_ROLES: readonly Role[] = ["ADMIN", "PRINCIPAL"];
/** The person's own pages: under the account menu, not in the rail. */
export const ME_GROUP: NavGroup = "me";

/** The groups a role's rail and More sheet draw, in order (`me` is never one of them). */
export function navGroupsFor(role: Role): readonly NavGroup[] {
  return OFFICE_GROUP_ROLES.includes(role) ? OFFICE_GROUPS : CLASSIC_GROUPS;
}

/** A group starts closed until the person opens it (and stays open while it holds the page they are on). */
export const GROUPS_CLOSED_BY_DEFAULT: readonly NavGroup[] = ["setup"];

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
   * Where an item sits in the rail and the More sheet. FIVE PRIMARIES PER ROLE,
   * chosen by how often they are opened in a day, stand on top of the rail
   * whatever their group; everything else is grouped so the rail reads as short
   * lists rather than one long one (navGroupsFor). A primary may carry a group:
   * it is where the More sheet lists it at a phone's width when the bar does not
   * carry it (the office's Classes under Teaching). `me` puts the entry under the
   * account menu instead of the rail.
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
  /**
   * The duty this entry belongs to (5 Oct 2026): a FACULTY's or HOD's lab
   * in-charge, squad, NSS… (packages/contracts v1/duties.ts). The shell hides
   * it from a member without the duty, and the session's gate stops granting
   * the page through it (role-gate.ts `modulePagePermitted`).
   */
  duty?: DutyCode;
  /**
   * The streams this entry is for (5 Oct 2026): the shell hides it at a
   * college whose recorded streams include none of them — the practical
   * record at a law or an arts-only college. A college with no stream recorded
   * and a school keep it, as before; the page itself still opens.
   */
  streams?: readonly StreamCode[];
  /**
   * The institution kinds this entry is for (DS-4, 10 Oct 2026): the shell hides
   * it elsewhere — the school's exams, syllabus, substitutions and admissions at a
   * college, where their pages were always empty beside the college's own. A
   * guardian's menu follows the children's institutions: the entry stays while any
   * child is at one of these kinds (hiddenByKind). The page itself still opens.
   */
  kinds?: readonly InstitutionKind[];
  /**
   * The PLATFORM FEATURE this entry belongs to (15 Oct 2026; src/lib/platform-features.ts): the shell drops
   * it, for every role, while the operator has the feature off (hiddenByFeature below, read with the
   * person's `mayUse`). A list is "any of": the family's /sessions and the office's /admin/sessions stay
   * while expert or teacher sessions are on. The page itself also refuses (assertFeatureOn), so a typed-in
   * address is the app's 404.
   */
  feature?: FeatureCode | readonly FeatureCode[];
};

/** Both kinds of sessions: a page two features share, open while either is on. */
export const SESSION_FEATURES: readonly FeatureCode[] = ["EXPERT_SESSIONS", "TEACHER_SESSIONS"];

/** The hrefs of a role's entries whose platform feature (any of them, for a list) is not among `on`. */
export function hiddenByFeature(items: readonly NavItem[], on: readonly string[]): string[] {
  return items
    .filter((item) => item.feature && !(typeof item.feature === "string" ? [item.feature] : item.feature).some((f) => on.includes(f)))
    .map((item) => item.href);
}

/** The kinds that run the school version's day: classes, the day register, exam series, the syllabus (DS-4). */
export const SCHOOL_KINDS: readonly InstitutionKind[] = ["SCHOOL", "JUNIOR_COLLEGE"];

/**
 * The hrefs of a role's entries to hide for these institution kinds (DS-4): an
 * entry naming `kinds` goes when none of the kinds in scope is among them. No
 * kind in scope (a guardian with no child yet) keeps everything, as the
 * streams rule does with none recorded.
 */
export function hiddenByKind(items: readonly NavItem[], kinds: readonly string[]): string[] {
  if (kinds.length === 0) return [];
  return items.filter((item) => item.kinds && !item.kinds.some((k) => kinds.includes(k))).map((item) => item.href);
}

/** The streams that keep labs and a practical record (those that offer a lab in-charge). */
const LAB_STREAMS: readonly StreamCode[] = DUTY_STREAMS.LAB_INCHARGE === "ALL" ? [] : DUTY_STREAMS.LAB_INCHARGE;
/** The streams that post students to a hospital (those that offer a clinical coordinator; R-56, 10 Oct 2026). */
const CLINICAL_STREAMS: readonly StreamCode[] = DUTY_STREAMS.CLINICAL_COORDINATOR === "ALL" ? [] : DUTY_STREAMS.CLINICAL_COORDINATOR;

export const NAV_GROUP_KEY: Record<NavGroup, TranslationKey> = {
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
  { href: "/account", labelKey: "nav.account", icon: "gear", prefix: true, group: "me" },
  // My own leave (the integration builder, 4 Oct 2026): the teacher's form and balance under /account.
  { href: "/account/leave", labelKey: "nav.leave", icon: "calendar", group: "running" },
  // "I'm in" and my own days (campaign 2026-10-04, G-2): the staff register's check-in for every member of staff.
  { href: "/account/attendance", labelKey: "nav.staffAttendance", icon: "checks", group: "running" },
  // My appointment letters (risks batch 5A, 5 Oct 2026).
  { href: "/account/letters", labelKey: "appointmentLetters.mineTitle", icon: "receipt", prefix: true, group: "me" },
];

export const NAV: Record<Role, NavItem[]> = {
  // In the rail's order (27 Oct 2026, item 3): the five primaries, then Teaching, People and records, Attendance and
  // cover, Money, Communication, Modules and Setup, each the school's pages first and a college's after; my own last.
  ADMIN: [
    { href: "/admin", labelKey: "nav.overview", icon: "house", primary: true },
    // Invites are a tab of People: one door for "who is in this school".
    { href: "/admin/people", labelKey: "nav.people", icon: "users", primary: true, group: "people", prefix: true, also: ["/admin/invites", "/admin/intake"] },
    { href: "/admin/classes", labelKey: "nav.classes", icon: "chalkboard", primary: true, group: "teaching", prefix: true, also: ["/admin/promotion"] },
    { href: "/admin/timetable", labelKey: "nav.timetable", icon: "clock", primary: true, group: "teaching", prefix: true },
    { href: "/admin/exams", labelKey: "nav.exams", icon: "clipboard", primary: true, group: "teaching", prefix: true, kinds: SCHOOL_KINDS },
    { href: "/admin/syllabus", labelKey: "nav.syllabus", icon: "books", prefix: true, group: "teaching", kinds: SCHOOL_KINDS },
    // How a report card is worked out and printed: the office's rules, read by every card generated.
    { href: "/admin/report-cards", labelKey: "nav.reportCards", icon: "clipboard", prefix: true, group: "teaching" },
    // Who covers the lessons of staff who are away: the board the staff register feeds.
    { href: "/admin/substitutions", labelKey: "nav.substitutions", icon: "users", prefix: true, group: "teaching", kinds: SCHOOL_KINDS },
    { href: "/competitions", labelKey: "nav.competitions", icon: "trophy", prefix: true, group: "teaching" },
    // The college's academics (4 Oct 2026): structure, offerings, timetable, registration, attendance and condonations.
    { href: "/admin/academics", labelKey: "academics.title", icon: "graduationCap", prefix: true, group: "teaching", module: "ACADEMICS" },
    // The college exam cell (4 Oct 2026): the office reads sessions, forms, results and analytics.
    { href: "/exam-cell", labelKey: "examCell.title", icon: "exam", prefix: true, group: "teaching", module: "EXAMS" },
    // Stream records (5 Oct 2026): lab batches, the practical record, moot courts, and the year's figures of each stream's records.
    { href: "/admin/stream-records", labelKey: "streamRecords.title", icon: "flask", prefix: true, group: "teaching", module: "ACADEMICS" },
    { href: "/admin/records", labelKey: "nav.pupilRecords", icon: "users", prefix: true, group: "people" },
    { href: "/admin/certificates", labelKey: "nav.certificates", icon: "clipboard", prefix: true, group: "people", also: ["/certificates"] },
    // The door for next year: the cycle, its sittings and the pipeline from form to seat.
    // School-only entries (DS-4, 10 Oct 2026): a college has its own admissions, no syllabus units and no day register to cover.
    { href: "/admin/admissions", labelKey: "nav.admissions", icon: "users", prefix: true, group: "people", kinds: SCHOOL_KINDS },
    // Hidden by the shell until the school has any — see signed-in-shell.tsx.
    { href: "/enquiries", labelKey: "nav.enquiries", icon: "envelope", prefix: true, group: "people" },
    // Hidden by the shell until somebody waits — see signed-in-shell.tsx.
    { href: "/joins", labelKey: "joinRequests.navLabel", icon: "userPlus", prefix: true, group: "people" },
    { href: "/archive", labelKey: "nav.pastYears", icon: "archive", prefix: true, group: "people" },
    // The school's former pupils by batch, notes to a batch, the feed's setting (the alumni module, 3 Oct 2026).
    { href: "/admin/alumni", labelKey: "modules.alumniName", icon: "graduationCap", prefix: true, group: "people", module: "ALUMNI" },
    // The college office (4 Oct 2026): admissions from the CET rounds, the accounts desk, and the library, hostel and bus at a college.
    { href: "/admin/college-admissions", labelKey: "collegeOffice.admissionsTitle", icon: "userPlus", prefix: true, group: "people", module: "ADMISSIONS" },
    { href: "/admin/faculty-records", labelKey: "iqac.navFacultyRecords", icon: "clipboard", prefix: true, group: "people", module: "IQAC" },
    { href: "/admin/attendance", labelKey: "nav.attendance", icon: "checks", prefix: true, group: "attendance", also: ["/attendance/history"] },
    { href: "/admin/staff-attendance", labelKey: "nav.staffAttendance", icon: "checks", prefix: true, group: "attendance" },
    // The leave queue is genuinely an admin's to work — a school whose
    // principal is the one on leave still has to approve somebody's.
    { href: "/principal/leave", labelKey: "nav.leave", icon: "calendar", prefix: true, group: "attendance", also: ["/principal/staff"] },
    { href: "/admin/calendar", labelKey: "nav.calendar", icon: "calendar", prefix: true, group: "attendance" },
    // Fees: what the school asked its families for and what arrived. The
    // office writes; the principal reads the same pages (see fees.ts officeOrHead).
    { href: "/admin/fees", labelKey: "nav.fees", icon: "receipt", prefix: true, group: "money" },
    { href: "/admin/payroll", labelKey: "payroll.title", icon: "receipt", prefix: true, group: "money", module: "PAYROLL" },
    // Inventory and assets, and HR and payroll (3 Oct 2026): the office runs both; the head reads payroll's summary.
    { href: "/admin/inventory", labelKey: "inventory.title", icon: "archive", prefix: true, group: "money", module: "INVENTORY" },
    // The Tally export of receipts and payroll (R-2, 5 Oct 2026): export only, money stays outside (decision 0003).
    { href: "/admin/fees/tally", labelKey: "tally.navTitle", icon: "receipt", group: "money" },
    { href: "/accounts", labelKey: "role.accounts", icon: "wallet", prefix: true, group: "money", module: "ACADEMICS" },
    // The office can now write to anyone at the school, so the inbox is theirs too.
    { href: "/remarks", labelKey: "nav.messages", icon: "chat", prefix: true, group: "communication" },
    { href: "/bulletin", labelKey: "nav.bulletin", icon: "megaphone", prefix: true, group: "communication" },
    { href: "/admin/circulars", labelKey: "nav.circulars", icon: "megaphone", prefix: true, group: "communication" },
    // Texts to families: the office switches channels and sends notices; the
    // principal reads the same page and the delivery reports (messaging.ts officeOrHead).
    { href: "/admin/messaging", labelKey: "nav.messaging", icon: "chatsCircle", prefix: true, group: "communication" },
    // The student council's notices and members (risks batch 5A, 5 Oct 2026).
    { href: "/bulletin/council", labelKey: "councilNotices.navTitle", icon: "megaphone", group: "communication" },
    // The sick-room and incident log: the whole school's, and the record pages under /incidents.
    { href: "/admin/incidents", labelKey: "nav.incidents", icon: "firstAidKit", prefix: true, group: "communication", also: ["/incidents"] },
    { href: "/admin/safety", labelKey: "nav.safety", icon: "shield", prefix: true, group: "communication" },
    { href: "/experts", labelKey: "nav.experts", icon: "briefcase", prefix: true, group: "communication", feature: "EXPERT_SESSIONS" },
    { href: "/admin/vacancies", labelKey: "nav.vacancies", icon: "briefcase", prefix: true, group: "communication", also: ["/vacancies"], feature: "JOB_BOARD" },
    { href: "/mentoring", labelKey: "nav.mentoring", icon: "chat", prefix: true, group: "communication", feature: "EXPERT_SESSIONS" },
    { href: "/admin/sessions", labelKey: "nav.sessions", icon: "calendar", prefix: true, group: "communication", feature: SESSION_FEATURES },
    // Transport (3 Oct 2026): routes, buses, drivers, seats and today's trips on a map; the head reads.
    { href: "/admin/transport", labelKey: "transport.title", icon: "bus", prefix: true, group: "modules", module: "TRANSPORT" },
    // The library desk and its rules, and the hostel at a glance (3 Oct 2026): the office lends, sets the rules and makes the houses.
    { href: "/library", labelKey: "modules.libraryName", icon: "bookOpen", prefix: true, group: "modules", module: "LIBRARY", also: ["/admin/library"] },
    { href: "/admin/hostel", labelKey: "modules.hostelName", icon: "bed", prefix: true, group: "modules", module: "HOSTEL", also: ["/hostel"] },
    // website-builder A (15 Oct 2026): the school's public website, built in six screens (the WEBSITE module).
    { href: "/admin/website", labelKey: "modules.websiteName", icon: "globe", prefix: true, group: "modules", module: "WEBSITE" },
    // end website-builder A
    // The college at a glance (the integration builder, 4 Oct 2026): the head's dashboard, which the office reads too; ACADEMICS stands for "is a college".
    { href: "/principal/college", labelKey: "collegeHub.title", icon: "chartLine", group: "modules", module: "ACADEMICS" },
    { href: "/admin/college-campus", labelKey: "collegeOffice.campusTitle", icon: "buildings", prefix: true, group: "modules", module: "ACADEMICS" },
    // Placement (4 Oct 2026): the office reads the cell's pages at a college with PLACEMENT on.
    { href: "/placement", labelKey: "placement.navCell", icon: "briefcase", prefix: true, group: "modules", module: "PLACEMENT" },
    // IQAC (4 Oct 2026): the accreditation desk, the committees and minutes, the faculty records.
    { href: "/iqac", labelKey: "iqac.navHome", icon: "medal", prefix: true, group: "modules", module: "IQAC" },
    { href: "/admin/committees", labelKey: "iqac.navCommittees", icon: "users", prefix: true, group: "modules", module: "IQAC" },
    { href: "/admin/signatures", labelKey: "nav.signatures", icon: "clipboard", group: "setup" },
    // The attendance devices (R-2, 5 Oct 2026): biometric and RFID readers, their keys, the badges, the punches.
    { href: "/admin/attendance-devices", labelKey: "punch.navTitle", icon: "checks", prefix: true, group: "setup" },
    // The UDISE+ and board sheets cut from the records: the office cuts, the head reads.
    { href: "/admin/filings", labelKey: "nav.filings", icon: "clipboard", prefix: true, group: "setup" },
    { href: "/admin/reviews", labelKey: "nav.reviews", icon: "star", prefix: true, group: "setup" },
    // The school across terms and years: the office reads what the head reads (lib/analytics-longitudinal.ts).
    { href: "/principal/trends", labelKey: "trends.title", icon: "chartLine", prefix: true, group: "setup" },
    { href: "/admin/settings", labelKey: "nav.settings", icon: "gear", prefix: true, group: "setup" },
    { href: "/account/payslips", labelKey: "payroll.myTitle", icon: "receipt", prefix: true, group: "me", module: "PAYROLL" },
    // My appointment letters (risks batch 5A, 5 Oct 2026).
    { href: "/account/letters", labelKey: "appointmentLetters.mineTitle", icon: "receipt", prefix: true, group: "me" },
    { href: "/account/items", labelKey: "inventory.myTitle", icon: "archive", prefix: true, group: "me", module: "INVENTORY" },
  ],
  // A principal READS and DECIDES. No register, no gradebook, no class setup —
  // those belong to the teacher and the admin respectively, and handing all
  // three to one role is how "principal" quietly becomes "can do anything".
  // In the rail's order, as the office's (27 Oct 2026, item 3).
  PRINCIPAL: [
    { href: "/principal", labelKey: "nav.dashboard", icon: "chartLine", primary: true, also: ["/attendance/history", "/principal/college"] },
    { href: "/principal/classes", labelKey: "nav.classes", icon: "chalkboard", primary: true, group: "teaching", prefix: true },
    { href: "/principal/leave", labelKey: "nav.leave", icon: "calendar", primary: true, group: "attendance", prefix: true, also: ["/principal/staff"] },
    { href: "/admin/reviews", labelKey: "nav.reviews", icon: "star", primary: true, group: "setup", prefix: true },
    { href: "/exams", labelKey: "nav.exams", icon: "clipboard", primary: true, group: "teaching", prefix: true, kinds: SCHOOL_KINDS },
    { href: "/principal/timetable", labelKey: "nav.timetable", icon: "clock", prefix: true, group: "teaching" },
    { href: "/admin/syllabus", labelKey: "nav.syllabus", icon: "books", prefix: true, group: "teaching", kinds: SCHOOL_KINDS },
    { href: "/admin/report-cards", labelKey: "nav.reportCards", icon: "clipboard", prefix: true, group: "teaching" },
    // Who covers the lessons of staff who are away: the board the staff register feeds.
    { href: "/admin/substitutions", labelKey: "nav.substitutions", icon: "users", prefix: true, group: "teaching", kinds: SCHOOL_KINDS },
    { href: "/competitions", labelKey: "nav.competitions", icon: "trophy", prefix: true, group: "teaching" },
    // The college's academics, read; late registrations and forwarded condonations decided (4 Oct 2026).
    { href: "/admin/academics", labelKey: "academics.title", icon: "graduationCap", prefix: true, group: "teaching", module: "ACADEMICS" },
    // The college exam cell (4 Oct 2026): results and analytics to read, grace proposals to decide.
    { href: "/exam-cell", labelKey: "examCell.title", icon: "exam", prefix: true, group: "teaching", module: "EXAMS" },
    // Stream records (5 Oct 2026), read: the year's figures, batches, the practical record, moots; the duties' desks open from it.
    { href: "/admin/stream-records", labelKey: "streamRecords.title", icon: "flask", prefix: true, group: "teaching", module: "ACADEMICS" },
    { href: "/admin/records", labelKey: "nav.pupilRecords", icon: "users", prefix: true, group: "people" },
    { href: "/admin/certificates", labelKey: "nav.certificates", icon: "clipboard", prefix: true, group: "people", also: ["/certificates"] },
    // The door for next year: the cycle, its sittings and the pipeline from form to seat.
    // School-only entries (DS-4, 10 Oct 2026), as in the office's menu.
    { href: "/admin/admissions", labelKey: "nav.admissions", icon: "users", prefix: true, group: "people", kinds: SCHOOL_KINDS },
    { href: "/enquiries", labelKey: "nav.enquiries", icon: "envelope", prefix: true, group: "people" },
    // Hidden by the shell until somebody waits — see signed-in-shell.tsx.
    { href: "/joins", labelKey: "joinRequests.navLabel", icon: "userPlus", prefix: true, group: "people" },
    { href: "/archive", labelKey: "nav.pastYears", icon: "archive", prefix: true, group: "people" },
    { href: "/admin/college-admissions", labelKey: "collegeOffice.admissionsTitle", icon: "userPlus", prefix: true, group: "people", module: "ADMISSIONS" },
    { href: "/admin/faculty-records", labelKey: "iqac.navFacultyRecords", icon: "clipboard", prefix: true, group: "people", module: "IQAC" },
    { href: "/admin/staff-attendance", labelKey: "nav.staffAttendance", icon: "checks", prefix: true, group: "attendance" },
    { href: "/admin/calendar", labelKey: "nav.calendar", icon: "calendar", prefix: true, group: "attendance" },
    // Read-only for the head: the overview, the dues and the structures.
    { href: "/admin/fees", labelKey: "nav.fees", icon: "receipt", prefix: true, group: "money" },
    // The payroll summary (no one's slip unless the office shares a run) and the stores, read; the head's own payslips and things.
    { href: "/admin/payroll", labelKey: "payroll.title", icon: "receipt", prefix: true, group: "money", module: "PAYROLL" },
    { href: "/admin/inventory", labelKey: "inventory.title", icon: "archive", prefix: true, group: "money", module: "INVENTORY" },
    // The college's money and admissions, read; concessions above the office's limit approved (4 Oct 2026).
    { href: "/accounts", labelKey: "role.accounts", icon: "wallet", prefix: true, group: "money", module: "ACADEMICS" },
    { href: "/remarks", labelKey: "nav.messages", icon: "chat", prefix: true, group: "communication" },
    { href: "/bulletin", labelKey: "nav.bulletin", icon: "megaphone", prefix: true, group: "communication" },
    { href: "/admin/circulars", labelKey: "nav.circulars", icon: "megaphone", prefix: true, group: "communication" },
    // Read-only for the head: the counts, the notices sent and their reports.
    { href: "/admin/messaging", labelKey: "nav.messaging", icon: "chatsCircle", prefix: true, group: "communication" },
    // The student council's notices and members (risks batch 5A, 5 Oct 2026).
    { href: "/bulletin/council", labelKey: "councilNotices.navTitle", icon: "megaphone", group: "communication" },
    // The sick-room and incident log: the whole school's, and the record pages under /incidents.
    { href: "/admin/incidents", labelKey: "nav.incidents", icon: "firstAidKit", prefix: true, group: "communication", also: ["/incidents"] },
    { href: "/admin/vacancies", labelKey: "nav.vacancies", icon: "briefcase", prefix: true, group: "communication", also: ["/vacancies"], feature: "JOB_BOARD" },
    { href: "/admin/sessions", labelKey: "nav.sessions", icon: "calendar", prefix: true, group: "communication", feature: SESSION_FEATURES },
    // Transport (3 Oct 2026): routes, buses, drivers, seats and today's trips on a map; the head reads.
    { href: "/admin/transport", labelKey: "transport.title", icon: "bus", prefix: true, group: "modules", module: "TRANSPORT" },
    // The library's lists and reports, and the hostel at a glance (3 Oct 2026), read.
    { href: "/library", labelKey: "modules.libraryName", icon: "bookOpen", prefix: true, group: "modules", module: "LIBRARY", also: ["/admin/library"] },
    { href: "/admin/hostel", labelKey: "modules.hostelName", icon: "bed", prefix: true, group: "modules", module: "HOSTEL", also: ["/hostel"] },
    // website-builder A (15 Oct 2026): the school's public website, built in six screens (the WEBSITE module).
    { href: "/admin/website", labelKey: "modules.websiteName", icon: "globe", prefix: true, group: "modules", module: "WEBSITE" },
    // end website-builder A
    // Placement (4 Oct 2026): the principal reads the cell's pages.
    { href: "/placement", labelKey: "placement.navCell", icon: "briefcase", prefix: true, group: "modules", module: "PLACEMENT" },
    // IQAC (4 Oct 2026): the accreditation file to read and sign off, the committees, the faculty records.
    { href: "/principal/accreditation", labelKey: "iqac.navAccreditation", icon: "medal", prefix: true, group: "modules", module: "IQAC", also: ["/iqac"] },
    { href: "/admin/committees", labelKey: "iqac.navCommittees", icon: "users", prefix: true, group: "modules", module: "IQAC" },
    { href: "/admin/signatures", labelKey: "nav.signatures", icon: "clipboard", group: "setup" },
    // The attendance devices (R-2, 5 Oct 2026): biometric and RFID readers, their keys, the badges, the punches.
    { href: "/admin/attendance-devices", labelKey: "punch.navTitle", icon: "checks", prefix: true, group: "setup" },
    // The UDISE+ and board sheets cut from the records: the office cuts, the head reads.
    { href: "/admin/filings", labelKey: "nav.filings", icon: "clipboard", prefix: true, group: "setup" },
    // The head's own decisions, as sentences, read from the audit log (lib/decision-log.ts).
    { href: "/principal/decisions", labelKey: "decisions.title", icon: "clipboard", prefix: true, group: "setup" },
    // The school across terms and years, recomputed on read (lib/analytics-longitudinal.ts).
    { href: "/principal/trends", labelKey: "trends.title", icon: "chartLine", prefix: true, group: "setup" },
    { href: "/account", labelKey: "nav.account", icon: "gear", prefix: true, group: "me" },
    { href: "/account/payslips", labelKey: "payroll.myTitle", icon: "receipt", prefix: true, group: "me", module: "PAYROLL" },
    // My appointment letters (risks batch 5A, 5 Oct 2026).
    { href: "/account/letters", labelKey: "appointmentLetters.mineTitle", icon: "receipt", prefix: true, group: "me" },
    { href: "/account/items", labelKey: "inventory.myTitle", icon: "archive", prefix: true, group: "me", module: "INVENTORY" },
  ],
  TEACHER: [
    { href: "/teacher", labelKey: "nav.today", icon: "house", primary: true },
    { href: "/teacher/attendance", labelKey: "nav.register", icon: "checks", primary: true, prefix: true, also: ["/attendance/history"] },
    { href: "/teacher/classes", labelKey: "nav.classes", icon: "chalkboard", primary: true, prefix: true },
    { href: "/teacher/assignments", labelKey: "nav.assignments", icon: "clipboard", primary: true, prefix: true },
    { href: "/teacher/exams", labelKey: "nav.exams", icon: "clipboard", primary: true, prefix: true },
    { href: "/timetable", labelKey: "nav.timetable", icon: "clock", prefix: true, group: "daily" },
    { href: "/remarks", labelKey: "nav.messages", icon: "chat", prefix: true, group: "daily" },
    { href: "/teacher/practice", labelKey: "nav.practice", icon: "brain", prefix: true, group: "daily", feature: "QUESTION_BANK" },
    { href: "/teacher/meetings", labelKey: "nav.meetings", icon: "calendar", prefix: true, group: "daily" },
    { href: "/teacher/leave", labelKey: "nav.leave", icon: "calendar", prefix: true, group: "running" },
    { href: "/teacher/attendance/me", labelKey: "nav.staffAttendance", icon: "checks", prefix: true, group: "running" },
    { href: "/teacher/incidents", labelKey: "nav.incidents", icon: "firstAidKit", prefix: true, group: "running", also: ["/incidents"] },
    { href: "/teacher/signatures", labelKey: "nav.signatures", icon: "clipboard", group: "running" },
    // The question gig (review-queue, 10 Oct 2026): since 15 Oct 2026 the QUESTION_GIG platform feature, dropped by the shell while off.
    { href: "/teacher/contributions", labelKey: "nav.contributions", icon: "books", prefix: true, group: "running", feature: "QUESTION_GIG" },
    { href: "/teacher/profile", labelKey: "nav.me", icon: "user", prefix: true, group: "me" },
    // What the head has shown me of my observations, targets and appraisals (lib/appraisal.ts).
    { href: "/teacher/appraisals", labelKey: "appraisal.myTitle", icon: "clipboard", prefix: true, group: "running" },
    // Hidden by the shell until somebody waits — see signed-in-shell.tsx.
    { href: "/joins", labelKey: "joinRequests.navLabel", icon: "userPlus", prefix: true, group: "running" },
    { href: "/bulletin", labelKey: "nav.bulletin", icon: "megaphone", prefix: true, group: "school" },
    { href: "/experts", labelKey: "nav.experts", icon: "briefcase", prefix: true, group: "school", feature: "EXPERT_SESSIONS" },
    { href: "/vacancies", labelKey: "nav.vacancies", icon: "briefcase", prefix: true, group: "school", feature: "JOB_BOARD" },
    { href: "/enquiries", labelKey: "nav.enquiries", icon: "envelope", prefix: true, group: "school" },
    { href: "/mentoring", labelKey: "nav.mentoring", icon: "chat", prefix: true, group: "school", feature: "EXPERT_SESSIONS" },
    { href: "/teacher/guidance", labelKey: "nav.guidance", icon: "calendar", prefix: true, group: "school", feature: "TEACHER_SESSIONS" },
    { href: "/competitions", labelKey: "nav.competitions", icon: "trophy", prefix: true, group: "school" },
    { href: "/archive", labelKey: "nav.pastYears", icon: "archive", prefix: true, group: "school" },
    // My own payslips and what the stores issued to me (3 Oct 2026), while the school has the module on.
    { href: "/account/payslips", labelKey: "payroll.myTitle", icon: "receipt", prefix: true, group: "me", module: "PAYROLL" },
    // My appointment letters (risks batch 5A, 5 Oct 2026).
    { href: "/account/letters", labelKey: "appointmentLetters.mineTitle", icon: "receipt", prefix: true, group: "me" },
    { href: "/account/items", labelKey: "inventory.myTitle", icon: "archive", prefix: true, group: "me", module: "INVENTORY" },
    // My loans, dues and reservations, and the catalogue (the library module, 3 Oct 2026).
    { href: "/teacher/library", labelKey: "modules.libraryName", icon: "bookOpen", prefix: true, group: "school", module: "LIBRARY" },
  ],
  STUDENT: [
    { href: "/student", labelKey: "nav.today", icon: "house", primary: true },
    // ONE place for "what do I owe": to do, handed in, marked — the old
    // "My work" and "Grades" folded together.
    { href: "/student/assignments", labelKey: "nav.assignments", icon: "clipboard", primary: true, prefix: true, also: ["/student/work", "/student/grades"] },
    // ONE place for "how did I do": exam marks, the exams ahead, report cards.
    // The school's exams and report cards (DS-4, 10 Oct 2026): a college student's are under /student/exams.
    { href: "/exams", labelKey: "nav.exams", icon: "chartLine", primary: true, prefix: true, also: ["/report-cards"], kinds: SCHOOL_KINDS },
    { href: "/student/certificates", labelKey: "nav.certificates", icon: "clipboard", prefix: true, group: "school", also: ["/certificates", "/student/record"] },
    { href: "/student/practice", labelKey: "nav.practice", icon: "brain", primary: true, prefix: true, feature: "QUESTION_BANK" },
    { href: "/timetable", labelKey: "nav.timetable", icon: "clock", prefix: true, group: "daily" },
    { href: "/remarks", labelKey: "nav.messages", icon: "chat", prefix: true, group: "daily" },
    { href: "/reviews", labelKey: "nav.feedback", icon: "star", prefix: true, group: "daily" },
    // The pupil's own health card and incident log, read-only from the age the school sets (self-read.ts); below it, "ask a grown-up".
    { href: "/student/health", labelKey: "nav.health", icon: "heart", prefix: true, group: "daily" },
    { href: "/student/incidents", labelKey: "nav.incidents", icon: "firstAidKit", prefix: true, group: "daily" },
    // Social Media sits with school life for a pupil — the bottom bar keeps
    // the four things a school day is made of.
    { href: "/bulletin", labelKey: "nav.bulletin", icon: "megaphone", prefix: true, group: "school" },
    // The student council's notices and members (risks batch 5A, 5 Oct 2026).
    { href: "/bulletin/council", labelKey: "councilNotices.navTitle", icon: "megaphone", group: "school" },
    { href: "/mentoring", labelKey: "nav.mentoring", icon: "chat", prefix: true, group: "school", feature: "EXPERT_SESSIONS" },
    { href: "/sessions", labelKey: "nav.sessions", icon: "calendar", prefix: true, group: "school", feature: SESSION_FEATURES },
    { href: "/competitions", labelKey: "nav.competitions", icon: "trophy", prefix: true, group: "school" },
    { href: "/archive", labelKey: "nav.pastYears", icon: "archive", prefix: true, group: "school" },
    { href: "/student/profile", labelKey: "nav.me", icon: "user", prefix: true, group: "me" },
    // What a student lets their guardians see (4 Oct 2026): an adult at a college decides. Under ACADEMICS, which every
    // college has on and no school is offered, so a school's pupils are not shown a page that only says "they see it all".
    { href: "/student/consent", labelKey: "consent.title", icon: "users", prefix: true, group: "running", module: "ACADEMICS" },
    // The library and the hostel (3 Oct 2026): my loans and the catalogue; my room, tonight's roll call and leave.
    { href: "/student/library", labelKey: "modules.libraryName", icon: "bookOpen", prefix: true, group: "school", module: "LIBRARY" },
    { href: "/student/hostel", labelKey: "modules.hostelName", icon: "bed", prefix: true, group: "school", module: "HOSTEL" },
    // My courses, lectures, attendance, internal marks and registration (the college's academics, 4 Oct 2026).
    { href: "/student/academics", labelKey: "academics.studentTitle", icon: "graduationCap", prefix: true, group: "daily", module: "ACADEMICS", also: ["/student/registration"] },
    // An architecture student's studios: the brief, the stages, their submissions and the signed jury results (R-56, the studio half, 10 Oct 2026).
    { href: "/student/studios", labelKey: "duties.studio.studentTitle", icon: "palette", prefix: true, group: "daily", module: "ACADEMICS", streams: ["ARCHITECTURE"] },
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
    // A health-sciences or pharmacy student's clinical postings and logbook (R-56, the clinical half; 10 Oct 2026); no guardian page.
    { href: "/student/clinical", labelKey: "duties.clinical.myTitle", icon: "firstAidKit", prefix: true, group: "daily", module: "ACADEMICS", streams: CLINICAL_STREAMS },
  ],
  PARENT: [
    { href: "/parent", labelKey: "nav.overview", icon: "house", primary: true },
    { href: "/parent/attendance", labelKey: "nav.attendance", icon: "checks", primary: true, prefix: true },
    // The homework diary and the grades page, folded into one Assignments.
    { href: "/parent/assignments", labelKey: "nav.assignments", icon: "clipboard", primary: true, prefix: true, also: ["/parent/homework", "/parent/grades"] },
    // The school's exams and report cards (DS-4, 10 Oct 2026): kept while any child is at a school; a college child's results are /parent/results.
    { href: "/exams", labelKey: "nav.exams", icon: "chartLine", primary: true, prefix: true, also: ["/report-cards"], kinds: SCHOOL_KINDS },
    { href: "/remarks", labelKey: "nav.messages", icon: "chat", primary: true, prefix: true },
    { href: "/parent/certificates", labelKey: "nav.certificates", icon: "clipboard", prefix: true, group: "daily", also: ["/certificates", "/parent/record"] },
    { href: "/parent/practice", labelKey: "nav.practice", icon: "brain", prefix: true, group: "daily", feature: "QUESTION_BANK" },
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
    { href: "/mentoring", labelKey: "nav.mentoring", icon: "chat", prefix: true, group: "school", feature: "EXPERT_SESSIONS" },
    { href: "/sessions", labelKey: "nav.sessions", icon: "calendar", prefix: true, group: "school", feature: SESSION_FEATURES },
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
    // The parent survey of a child's college, answered here (G-5, 4 Oct 2026).
    { href: "/parent/voice", labelKey: "iqac.navParentVoice", icon: "star", group: "school", module: "IQAC" },
  ],
  // An expert sees their own work and nothing resembling a school's internals.
  EXPERT: [
    { href: "/expert", labelKey: "nav.bookings", icon: "house", primary: true },
    { href: "/expert/availability", labelKey: "nav.availability", icon: "calendar", primary: true, prefix: true, feature: "EXPERT_SESSIONS" },
    { href: "/mentoring", labelKey: "nav.mentoring", icon: "chat", primary: true, prefix: true, feature: "EXPERT_SESSIONS" },
    { href: "/expert/sessions", labelKey: "nav.sessions", icon: "calendar", primary: true, prefix: true, feature: "EXPERT_SESSIONS" },
    { href: "/expert/earnings", labelKey: "gigs.earningsTitle", icon: "chartLine", prefix: true, group: "running", feature: "EXPERT_SESSIONS" },
    { href: "/expert/profile", labelKey: "nav.profile", icon: "user", prefix: true, group: "me" },
    { href: "/account", labelKey: "nav.account", icon: "gear", prefix: true, group: "me" },
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
    { href: "/account", labelKey: "nav.account", icon: "gear", prefix: true, group: "me" },
    { href: "/account/leave", labelKey: "nav.leave", icon: "calendar", group: "running" },
    // "I'm in" and my own days (campaign 2026-10-04, G-2): the staff register's check-in for every member of staff.
    { href: "/account/attendance", labelKey: "nav.staffAttendance", icon: "checks", group: "running" },
    // Every school's shared posts (4 Oct 2026): the module staff read the global feed as staff.
    { href: "/bulletin/global", labelKey: "bulletin.globalFeed", icon: "globe", group: "daily" },
  ],
  LIBRARIAN: [
    { href: "/library", labelKey: "modules.libraryName", icon: "bookOpen", primary: true, prefix: true },
    { href: "/account", labelKey: "nav.account", icon: "gear", prefix: true, group: "me" },
    { href: "/account/leave", labelKey: "nav.leave", icon: "calendar", group: "running" },
    // "I'm in" and my own days (campaign 2026-10-04, G-2): the staff register's check-in for every member of staff.
    { href: "/account/attendance", labelKey: "nav.staffAttendance", icon: "checks", group: "running" },
    { href: "/bulletin/global", labelKey: "bulletin.globalFeed", icon: "globe", group: "daily" },
    // The desk's pages (the library module, 3 Oct 2026); the home above carries no module, so it stays to say "switched off".
    { href: "/library/catalogue", labelKey: "library.tabCatalogue", icon: "books", primary: true, prefix: true, module: "LIBRARY", also: ["/library/titles"] },
    { href: "/library/overdue", labelKey: "library.tabOverdue", icon: "clock", primary: true, prefix: true, module: "LIBRARY" },
    { href: "/library/reservations", labelKey: "library.tabReservations", icon: "calendar", primary: true, prefix: true, module: "LIBRARY" },
    { href: "/library/fines", labelKey: "library.tabFines", icon: "receipt", prefix: true, group: "daily", module: "LIBRARY" },
    { href: "/library/stocktake", labelKey: "library.tabStockTake", icon: "checks", prefix: true, group: "running", module: "LIBRARY" },
    { href: "/library/reports", labelKey: "library.tabReports", icon: "chartLine", prefix: true, group: "running", module: "LIBRARY" },
    // The reading-room register: in and out at the desk, the day report (risks batch 5A, 5 Oct 2026).
    { href: "/library/reading-room", labelKey: "readingRoom.tab", icon: "books", prefix: true, group: "daily", module: "LIBRARY" },
    // At a college (4 Oct 2026): e-resources, the ISBN list and the criterion-4 numbers; the library's line of the no-dues.
    { href: "/library/college", labelKey: "collegeOffice.libraryTitle", icon: "books", prefix: true, group: "running", module: "ACADEMICS" },
    { href: "/accounts/no-dues", labelKey: "collegeOffice.navNoDues", icon: "checks", prefix: true, group: "daily", module: "ACADEMICS" },
  ],
  WARDEN: [
    { href: "/hostel", labelKey: "modules.hostelName", icon: "bed", primary: true, prefix: true },
    { href: "/account", labelKey: "nav.account", icon: "gear", prefix: true, group: "me" },
    { href: "/account/leave", labelKey: "nav.leave", icon: "calendar", group: "running" },
    // "I'm in" and my own days (campaign 2026-10-04, G-2): the staff register's check-in for every member of staff.
    { href: "/account/attendance", labelKey: "nav.staffAttendance", icon: "checks", group: "running" },
    { href: "/bulletin/global", labelKey: "bulletin.globalFeed", icon: "globe", group: "daily" },
    // The warden's pages (the hostel module, 3 Oct 2026); the home above carries no module, so it stays to say "switched off".
    { href: "/hostel/rollcall", labelKey: "hostel.tabRollCall", icon: "checks", primary: true, prefix: true, module: "HOSTEL" },
    { href: "/hostel/leave", labelKey: "hostel.tabLeave", icon: "calendar", primary: true, prefix: true, module: "HOSTEL" },
    // The night-out register and the curfew at the gate (5 Oct 2026).
    { href: "/hostel/night", labelKey: "collegeDesks.nightTab", icon: "calendar", prefix: true, group: "daily", module: "HOSTEL" },
    // A proposal to end a boarder's place, decided by the principal (5 Oct 2026).
    { href: "/hostel/expulsions", labelKey: "collegeDesks.expulsionsTab", icon: "shield", prefix: true, group: "running", module: "HOSTEL" },
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
    { href: "/account", labelKey: "nav.account", icon: "gear", prefix: true, group: "me" },
    // The college's alumni additions (placement, 4 Oct 2026): ACADEMICS stands for "is a college", as it does for the consent page.
    { href: "/alumni/college", labelKey: "placement.navAlumni", icon: "handshake", primary: true, module: "ACADEMICS" },
    // IQAC (4 Oct 2026): the alumni survey, under the alumnus's own home.
    { href: "/alumni/survey", labelKey: "iqac.navAlumniSurvey", icon: "star", prefix: true, group: "running", module: "IQAC" },
    // A paper asked for again — a TC copy, a bonafide, a transcript — with the fee the office sets (G-6, 4 Oct 2026).
    { href: "/alumni/papers", labelKey: "certificateRequests.alumniTitle", icon: "receipt", group: "running" },
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
    // My public page for the college's website, my own opt-in (5 Oct 2026).
    { href: "/faculty/profile", labelKey: "collegeDesks.profileNav", icon: "user", group: "me", module: "IQAC" },
    // What the head has shown me of my appraisals (A3-inventory-5, audit of 5 Oct 2026): the school's teacher page, no module.
    { href: "/teacher/appraisals", labelKey: "appraisal.myTitle", icon: "clipboard", prefix: true, group: "running" },
    // The library's e-resources, opened through the app so each open counts (campaign 2026-10-04, G-3).
    { href: "/library/e-resources", labelKey: "collegeOffice.eResourcesTitle", icon: "globe", prefix: true, group: "school", module: "LIBRARY" },
    // Duties (5 Oct 2026): the anti-ragging squad's register, for a member who holds the duty; the other duties' pages follow it.
    { href: "/duties/anti-ragging", labelKey: "duties.antiRagging.title", icon: "shield", prefix: true, group: "running", module: "IQAC", duty: "ANTI_RAGGING_SQUAD" },
    // Homework for the offerings I teach, set, marked and posted into internal marks (R-48, risks batch, 5 Oct 2026).
    { href: "/faculty/work", labelKey: "collegeWork.title", icon: "clipboard", prefix: true, group: "daily", module: "ACADEMICS" },
    // The practical record of the offerings I teach with practicals (stream records, 5 Oct 2026).
    { href: "/faculty/practicals", labelKey: "streamRecords.practicals.title", icon: "flask", prefix: true, group: "daily", module: "ACADEMICS", streams: LAB_STREAMS },
    // A law college's moot courts, recorded and read by its teachers (A3-inventory-4, audit of 5 Oct 2026).
    { href: "/faculty/moot-courts", labelKey: "streamRecords.moots.title", icon: "gavel", prefix: true, group: "daily", module: "ACADEMICS", streams: ["LAW"] },
    // An architecture college's studios and juries, for the teachers who teach, coordinate or sit on them (R-56, the studio half, 10 Oct 2026).
    { href: "/faculty/studios", labelKey: "duties.studio.facultyTitle", icon: "palette", prefix: true, group: "daily", module: "ACADEMICS", streams: ["ARCHITECTURE"] },
    // The duties' desks (S2, 5 Oct 2026), each for a member who holds the duty; every one is built since the clinical and studio desks (R-56, 10 Oct 2026).
    { href: "/duties/lab", labelKey: "duties.lab.title", icon: "flask", prefix: true, group: "running", module: "ACADEMICS", duty: "LAB_INCHARGE" },
    { href: "/duties/teaching-practice", labelKey: "duties.teachingPractice.title", icon: "chalkboard", prefix: true, group: "running", module: "ACADEMICS", duty: "PRACTICE_TEACHING_COORDINATOR" },
    { href: "/duties/nss", labelKey: "duties.corps.nssTitle", icon: "handHeart", prefix: true, group: "running", module: "IQAC", duty: "NSS_OFFICER" },
    { href: "/duties/ncc", labelKey: "duties.corps.nccTitle", icon: "handHeart", prefix: true, group: "running", module: "IQAC", duty: "NCC_OFFICER" },
    { href: "/duties/research", labelKey: "duties.research.title", icon: "books", prefix: true, group: "running", module: "IQAC", duty: "RESEARCH_DEAN" },
    { href: "/duties/exam-squad", labelKey: "duties.examSquad.title", icon: "siren", prefix: true, group: "running", module: "EXAMS", duty: "EXAM_SQUAD" },
    { href: "/duties/clinical", labelKey: "duties.CLINICAL_COORDINATOR.name", icon: "firstAidKit", prefix: true, group: "running", module: "ACADEMICS", duty: "CLINICAL_COORDINATOR" },
    // The clinical postings I supervise and the entries waiting for my signature (R-56, the clinical half; 10 Oct 2026): any teacher at a clinical stream, no duty.
    { href: "/faculty/clinical", labelKey: "duties.clinical.supervisingTitle", icon: "firstAidKit", prefix: true, group: "daily", module: "ACADEMICS", streams: CLINICAL_STREAMS },
    { href: "/duties/studio", labelKey: "duties.STUDIO_COORDINATOR.name", icon: "palette", prefix: true, group: "running", module: "ACADEMICS", duty: "STUDIO_COORDINATOR" },
  ],
  HOD: [
    { href: "/hod", labelKey: "nav.hodHome", icon: "treeStructure", primary: true, prefix: true },
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
    // The department's NBA visit file (R-2, 5 Oct 2026).
    // NBA visits only for an HOD (peer-visits.ts listVisits), so the entry is an engineering college's (DS-6, 10 Oct 2026).
    { href: "/hod/visits", labelKey: "peerVisit.nav", icon: "clipboard", prefix: true, group: "running", module: "IQAC", streams: ["ENGINEERING"] },
    // IQAC (4 Oct 2026): the department's research, activities and course feedback.
    { href: "/hod/research", labelKey: "iqac.navDeptResearch", icon: "books", prefix: true, group: "running", module: "IQAC" },
    // My public page for the college's website, my own opt-in (5 Oct 2026); under /faculty, which an HOD's teaching opens.
    { href: "/faculty/profile", labelKey: "collegeDesks.profileNav", icon: "user", group: "me", module: "IQAC" },
    // What the head has shown me of my appraisals (A3-inventory-5, audit of 5 Oct 2026): the school's teacher page, no module.
    { href: "/teacher/appraisals", labelKey: "appraisal.myTitle", icon: "clipboard", prefix: true, group: "running" },
    // The library's e-resources, opened through the app so each open counts (campaign 2026-10-04, G-3).
    { href: "/library/e-resources", labelKey: "collegeOffice.eResourcesTitle", icon: "globe", prefix: true, group: "school", module: "LIBRARY" },
    // Duties (5 Oct 2026): the anti-ragging squad's register, for an HOD who holds the duty.
    { href: "/duties/anti-ragging", labelKey: "duties.antiRagging.title", icon: "shield", prefix: true, group: "running", module: "IQAC", duty: "ANTI_RAGGING_SQUAD" },
    // Homework for the offerings I teach and my department's (R-48, risks batch, 5 Oct 2026).
    { href: "/faculty/work", labelKey: "collegeWork.title", icon: "clipboard", prefix: true, group: "daily", module: "ACADEMICS" },
    // The practical record of the department's offerings with practicals (stream records, 5 Oct 2026).
    { href: "/hod/practicals", labelKey: "streamRecords.practicals.title", icon: "flask", prefix: true, group: "daily", module: "ACADEMICS", streams: LAB_STREAMS },
    // A law college's moot courts, recorded and read by its teachers (A3-inventory-4, audit of 5 Oct 2026).
    { href: "/faculty/moot-courts", labelKey: "streamRecords.moots.title", icon: "gavel", prefix: true, group: "daily", module: "ACADEMICS", streams: ["LAW"] },
    // An architecture college's studios and juries, for the teachers who teach, coordinate or sit on them (R-56, the studio half, 10 Oct 2026).
    { href: "/faculty/studios", labelKey: "duties.studio.facultyTitle", icon: "palette", prefix: true, group: "daily", module: "ACADEMICS", streams: ["ARCHITECTURE"] },
    // The duties' desks (S2, 5 Oct 2026), each for a member who holds the duty; every one is built since the clinical and studio desks (R-56, 10 Oct 2026).
    { href: "/duties/lab", labelKey: "duties.lab.title", icon: "flask", prefix: true, group: "running", module: "ACADEMICS", duty: "LAB_INCHARGE" },
    { href: "/duties/teaching-practice", labelKey: "duties.teachingPractice.title", icon: "chalkboard", prefix: true, group: "running", module: "ACADEMICS", duty: "PRACTICE_TEACHING_COORDINATOR" },
    { href: "/duties/nss", labelKey: "duties.corps.nssTitle", icon: "handHeart", prefix: true, group: "running", module: "IQAC", duty: "NSS_OFFICER" },
    { href: "/duties/ncc", labelKey: "duties.corps.nccTitle", icon: "handHeart", prefix: true, group: "running", module: "IQAC", duty: "NCC_OFFICER" },
    { href: "/duties/research", labelKey: "duties.research.title", icon: "books", prefix: true, group: "running", module: "IQAC", duty: "RESEARCH_DEAN" },
    { href: "/duties/exam-squad", labelKey: "duties.examSquad.title", icon: "siren", prefix: true, group: "running", module: "EXAMS", duty: "EXAM_SQUAD" },
    { href: "/duties/clinical", labelKey: "duties.CLINICAL_COORDINATOR.name", icon: "firstAidKit", prefix: true, group: "running", module: "ACADEMICS", duty: "CLINICAL_COORDINATOR" },
    // The clinical postings I supervise and the entries waiting for my signature (R-56, the clinical half; 10 Oct 2026): any teacher at a clinical stream, no duty.
    { href: "/faculty/clinical", labelKey: "duties.clinical.supervisingTitle", icon: "firstAidKit", prefix: true, group: "daily", module: "ACADEMICS", streams: CLINICAL_STREAMS },
    { href: "/duties/studio", labelKey: "duties.STUDIO_COORDINATOR.name", icon: "palette", prefix: true, group: "running", module: "ACADEMICS", duty: "STUDIO_COORDINATOR" },
  ],
  EXAM_CONTROLLER: [
    { href: "/exam-cell", labelKey: "role.examController", icon: "exam", primary: true, prefix: true },
    // Messages (G4-30, risks batch 5 Oct 2026): the college desks answer here as FACULTY and HOD do; the phone has the same tab.
    { href: "/remarks", labelKey: "nav.messages", icon: "chat", prefix: true, group: "daily" },
    ...COLLEGE_STAFF_COMMON,
    // The exam flying squad's visits and the cases (5 Oct 2026), read.
    { href: "/duties/exam-squad", labelKey: "duties.examSquad.title", icon: "siren", prefix: true, group: "running", module: "EXAMS" },
  ],
  IQAC: [
    { href: "/iqac", labelKey: "role.iqac", icon: "medal", primary: true, prefix: true },
    // Messages (G4-30, risks batch 5 Oct 2026): the college desks answer here as FACULTY and HOD do; the phone has the same tab.
    { href: "/remarks", labelKey: "nav.messages", icon: "chat", prefix: true, group: "daily" },
    ...COLLEGE_STAFF_COMMON,
    // Placement (4 Oct 2026): the placement table for the predictor and the filings.
    { href: "/placement/analytics", labelKey: "placement.tabAnalytics", icon: "chartLine", prefix: true, group: "running", module: "PLACEMENT" },
    // The IQAC desk's own pages (4 Oct 2026), and the faculty records it reads.
    { href: "/iqac/predictor", labelKey: "iqac.navPredictor", icon: "chartLine", prefix: true, group: "daily", module: "IQAC" },
    { href: "/iqac/documents", labelKey: "iqac.navDocuments", icon: "clipboard", prefix: true, group: "daily", module: "IQAC" },
    { href: "/iqac/surveys", labelKey: "iqac.navSurveys", icon: "star", prefix: true, group: "daily", module: "IQAC" },
    { href: "/iqac/registers", labelKey: "iqac.navRegisters", icon: "books", prefix: true, group: "running", module: "IQAC" },
    { href: "/iqac/grievances", labelKey: "iqac.navGrievances", icon: "shield", prefix: true, group: "running", module: "IQAC" },
    // The peer-team visit file (R-2, 5 Oct 2026): the schedule, the evidence index and the SAR pack.
    { href: "/iqac/visits", labelKey: "peerVisit.nav", icon: "clipboard", prefix: true, group: "running", module: "IQAC" },
    { href: "/admin/faculty-records", labelKey: "iqac.navFacultyRecords", icon: "users", prefix: true, group: "running", module: "IQAC" },
  ],
  TPO: [
    { href: "/placement", labelKey: "nav.placementHome", icon: "briefcase", primary: true, prefix: true },
    // Messages (G4-30, risks batch 5 Oct 2026): the college desks answer here as FACULTY and HOD do; the phone has the same tab.
    { href: "/remarks", labelKey: "nav.messages", icon: "chat", prefix: true, group: "daily" },
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
    // Messages (G4-30, risks batch 5 Oct 2026): the college desks answer here as FACULTY and HOD do; the phone has the same tab.
    { href: "/remarks", labelKey: "nav.messages", icon: "chat", prefix: true, group: "daily" },
    ...COLLEGE_STAFF_COMMON,
    // The accounts desk's pages (4 Oct 2026; under its home), and the fee ledger, payroll and purchases it keeps with the office.
    { href: "/accounts/structures", labelKey: "collegeOffice.navStructures", icon: "receipt", primary: true, prefix: true },
    { href: "/accounts/scholarships", labelKey: "collegeOffice.navScholarships", icon: "wallet", primary: true, prefix: true, module: "SCHOLARSHIPS" },
    { href: "/accounts/no-dues", labelKey: "collegeOffice.navNoDues", icon: "checks", primary: true, prefix: true },
    { href: "/accounts/concessions", labelKey: "collegeOffice.navConcessions", icon: "clipboard", prefix: true, group: "daily" },
    { href: "/accounts/students", labelKey: "collegeOffice.navStudents", icon: "users", prefix: true, group: "daily" },
    { href: "/admin/fees", labelKey: "collegeOffice.navFeeLedger", icon: "receipt", prefix: true, group: "running" },
    // The Tally export of receipts and payroll (R-2, 5 Oct 2026): export only, money stays outside (decision 0003).
    { href: "/admin/fees/tally", labelKey: "tally.navTitle", icon: "receipt", group: "running" },
    { href: "/admin/payroll", labelKey: "payroll.title", icon: "receipt", prefix: true, group: "running", module: "PAYROLL" },
    { href: "/admin/inventory", labelKey: "inventory.title", icon: "archive", prefix: true, group: "running", module: "INVENTORY" },
    // The admission fee and the refund on a cancelled seat (A3-inventory-3): the refunds list, one application, never the list of all.
    { href: "/admin/college-admissions/refunds", labelKey: "collegeDesks.refundsTitle", icon: "receipt", prefix: true, also: ["/admin/college-admissions"], group: "running", module: "ADMISSIONS" },
  ],
  // An outside account like the expert: its home, and its account. A college reaches it only through a drive (the placement module).
  RECRUITER: [
    { href: "/recruiter", labelKey: "role.recruiter", icon: "handshake", primary: true, prefix: true },
    { href: "/account", labelKey: "nav.account", icon: "gear", prefix: true, group: "me" },
  ],
  // owner-batch-item2a (27 Oct 2026): support staff, given a login, read their own payslips (their home) and their profile, nothing else.
  SUPPORT: [
    // Their home (ROLE_HOME), and like everyone's own pages under the account menu, not the rail.
    { href: "/account/payslips", labelKey: "payroll.myTitle", icon: "receipt", prefix: true, group: "me" },
    { href: "/account", labelKey: "nav.account", icon: "gear", prefix: true, group: "me" },
  ],
};

/**
 * THE BOTTOM BAR AT A PHONE'S WIDTH IS THE PHONE APP'S (QA-65, QA campaign of 24 October 2026). The web drew the
 * first five `primary` entries there and the phone app its own four tabs and More, so one person found Today,
 * Attendance, Classes, Assignments and Exams on one and Today, Attendance, Classes, Messages and More on the other.
 * Below `lg` the web now draws these, in this order, with More after them (the sheet holds every other entry); the
 * desk's rail keeps `primary`. Each list is the phone's TABS (apps/mobile/src/lib/nav.ts) with the web page each tab
 * is, the same words, icons, module and feature; tests/nav-phone-bar.test.ts holds the two lists against each other.
 * An entry is hidden as the shell hides a menu entry: by the NAV entry of the same href, or by its own module and
 * feature (signed-in-shell.tsx).
 */
const MESSAGES_TAB: NavItem = { href: "/remarks", labelKey: "nav.messages", icon: "chat", prefix: true };
const COLLEGE_DESK_TABS: NavItem[] = [
  { href: "/bulletin", labelKey: "nav.bulletin", icon: "megaphone", prefix: true },
  { href: "/remarks", labelKey: "nav.messages", icon: "envelope", prefix: true },
];
export const PHONE_BAR: Record<Role, NavItem[]> = {
  TEACHER: [
    { href: "/teacher", labelKey: "nav.today", icon: "house" },
    { href: "/teacher/attendance", labelKey: "nav.register", icon: "checks", prefix: true, also: ["/attendance/history"] },
    { href: "/teacher/classes", labelKey: "nav.classes", icon: "chalkboard", prefix: true },
    MESSAGES_TAB,
  ],
  PARENT: [
    { href: "/parent", labelKey: "nav.overview", icon: "house" },
    { href: "/parent/attendance", labelKey: "nav.attendance", icon: "checks", prefix: true },
    { href: "/parent/assignments", labelKey: "nav.assignments", icon: "clipboard", prefix: true },
    MESSAGES_TAB,
  ],
  STUDENT: [
    { href: "/student", labelKey: "nav.today", icon: "house" },
    { href: "/student/assignments", labelKey: "nav.assignments", icon: "clipboard", prefix: true },
    { href: "/student/practice", labelKey: "nav.practice", icon: "brain", prefix: true, feature: "QUESTION_BANK" },
    MESSAGES_TAB,
  ],
  ADMIN: [
    { href: "/admin", labelKey: "nav.overview", icon: "house" },
    { href: "/admin/people", labelKey: "nav.people", icon: "users", prefix: true, also: ["/admin/invites", "/admin/intake"] },
    { href: "/principal/leave", labelKey: "nav.leave", icon: "calendar", prefix: true, also: ["/principal/staff"] },
    MESSAGES_TAB,
  ],
  PRINCIPAL: [
    { href: "/principal", labelKey: "nav.dashboard", icon: "chartLine", also: ["/attendance/history", "/principal/college"] },
    { href: "/principal/classes", labelKey: "nav.classes", icon: "chalkboard", prefix: true },
    { href: "/principal/leave", labelKey: "nav.leave", icon: "calendar", prefix: true, also: ["/principal/staff"] },
    MESSAGES_TAB,
  ],
  EXPERT: [
    { href: "/expert", labelKey: "nav.bookings", icon: "house" },
    { href: "/expert/availability", labelKey: "nav.availability", icon: "calendar", prefix: true, feature: "EXPERT_SESSIONS" },
    { href: "/mentoring", labelKey: "nav.mentoring", icon: "chat", prefix: true, feature: "EXPERT_SESSIONS" },
    { href: "/expert/sessions", labelKey: "nav.sessions", icon: "users", prefix: true, feature: "EXPERT_SESSIONS" },
  ],
  DRIVER: [{ href: "/driver", labelKey: "modules.transportName", icon: "bus", prefix: true }],
  LIBRARIAN: [{ href: "/library", labelKey: "modules.libraryName", icon: "bookOpen" }],
  WARDEN: [{ href: "/hostel", labelKey: "modules.hostelName", icon: "bed" }],
  ALUMNUS: [
    { href: "/alumni", labelKey: "modules.alumniName", icon: "graduationCap" },
    { ...MESSAGES_TAB, module: "ALUMNI" },
  ],
  FACULTY: [
    { href: "/faculty", labelKey: "role.faculty", icon: "chalkboard" },
    { href: "/faculty/mentoring", labelKey: "academics.mentoringTitle", icon: "chat", prefix: true, module: "ACADEMICS" },
    ...COLLEGE_DESK_TABS,
  ],
  HOD: [
    { href: "/hod", labelKey: "mobile.tabDepartment", icon: "users" },
    { href: "/faculty", labelKey: "academics.myTeaching", icon: "chalkboard", module: "ACADEMICS" },
    ...COLLEGE_DESK_TABS,
  ],
  EXAM_CONTROLLER: [{ href: "/exam-cell", labelKey: "mobile.tabExamCell", icon: "clipboard" }, ...COLLEGE_DESK_TABS],
  IQAC: [{ href: "/iqac", labelKey: "role.iqac", icon: "medal" }, ...COLLEGE_DESK_TABS],
  TPO: [{ href: "/placement", labelKey: "mobile.tabPlacement", icon: "chartLine" }, ...COLLEGE_DESK_TABS],
  ACCOUNTS: [{ href: "/accounts", labelKey: "role.accounts", icon: "receipt" }, ...COLLEGE_DESK_TABS],
  RECRUITER: [{ href: "/recruiter", labelKey: "role.recruiter", icon: "handshake", prefix: true }],
  SUPPORT: [{ href: "/account/payslips", labelKey: "supportStaff.tabPayslips", icon: "receipt", prefix: true }], // owner-batch-item2a
};

/**
 * The assistant, Vidura (pass 1, 17 Oct 2026; docs/plans/vidura.md): NO MENU ENTRY. Its one entry point is the round
 * button at the bottom right of every page (components/nav/app-shell.tsx), drawn by the shell where the person may use
 * it; the Phase C entry under "Day to day" and the /assistant page's place in the menus are gone. /assistant itself now
 * sends the person back to the page they were on with the drawer open (and draws the plan card for a person whose
 * plan is missing); every role may open it (role-gate.ts MODULE_ROLE_PAGES).
 */
export const ASSISTANT_HREF = "/assistant";
/** Not for the outside accounts: an expert and a recruiter belong to no school, and the assistant's doors refuse them (Phase B). */
export const ASSISTANT_NOT_FOR: readonly Role[] = ["EXPERT", "RECRUITER", "SUPPORT"]; // SUPPORT: owner-batch-item2a, payslips and profile only

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
  SUPPORT: null,
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
  SUPPORT: [],
};

export function isActive(pathname: string, item: NavItem): boolean {
  const hits = (href: string) =>
    item.prefix ? pathname === href || pathname.startsWith(`${href}/`) : pathname === href;
  return hits(item.href) || (item.also ?? []).some(hits);
}

/**
 * THE RAIL (desk) FOR A ROLE: its first five primaries on top, then each of its groups with the entries left, in the
 * menu's order; an empty group is not drawn. The person's own pages (`me`) are not in it: they are the account menu's
 * (personalItems). `items` are the role's entries already filtered by the shell (modules, features, duties, kinds).
 */
export function railFor(role: Role, items: readonly NavItem[]): { primary: NavItem[]; groups: { group: NavGroup; items: NavItem[] }[] } {
  const primary = items.filter((i) => i.primary).slice(0, 5);
  const order = navGroupsFor(role);
  const rest = items.filter((i) => !i.primary && i.group !== ME_GROUP);
  const groups = order.map((group) => ({ group, items: rest.filter((i) => (i.group ?? order[0]) === group) })).filter((g) => g.items.length > 0);
  return { primary, groups };
}

/**
 * THE MORE SHEET AT A PHONE'S WIDTH: every entry the bar does not carry, primaries included, under the role's groups
 * (a primary without a group under the first). The person's own pages are the top bar's account menu's.
 */
export function sheetFor(role: Role, items: readonly NavItem[], onBar: (item: NavItem) => boolean): { group: NavGroup; items: NavItem[] }[] {
  const order = navGroupsFor(role);
  const rest = items.filter((i) => !onBar(i) && i.group !== ME_GROUP);
  return order.map((group) => ({ group, items: rest.filter((i) => (i.group ?? order[0]) === group) })).filter((g) => g.items.length > 0);
}

/** The account page: the account menu's first line, and the avatar's link where the person has no pages of their own. */
export const ACCOUNT_HREF = "/account";

/** The person's own pages for the account menu, in the menu's order, without the account page itself (the menu's first line). */
export function personalItems(items: readonly NavItem[]): NavItem[] {
  return items.filter((i) => i.group === ME_GROUP && i.href !== ACCOUNT_HREF);
}

/**
 * Where the rail remembers which groups are open: one key per role (an office manager who is also a teacher keeps
 * two), holding { group: open } for the groups the person has opened or closed. Read and written by
 * components/nav/nav-groups.tsx; a group not in it takes its default (GROUPS_CLOSED_BY_DEFAULT).
 */
export function navOpenStorageKey(role: Role): string {
  return `edulink.nav.groups.${role}`;
}

/** Whether a group is drawn open: always while it holds the page; else as remembered; else closed only if closed by default. */
export function groupOpen(group: NavGroup, remembered: Partial<Record<string, boolean>>, holdsPage: boolean): boolean {
  if (holdsPage) return true;
  const kept = remembered[group];
  return typeof kept === "boolean" ? kept : !GROUPS_CLOSED_BY_DEFAULT.includes(group);
}
