import type { Role } from "./constants";
import type { TranslationKey } from "./i18n/dictionary";

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
};

export const NAV: Record<Role, NavItem[]> = {
  ADMIN: [
    { href: "/admin", labelKey: "nav.overview", icon: "house", primary: true },
    // Invites are a tab of People: one door for "who is in this school".
    { href: "/admin/people", labelKey: "nav.people", icon: "users", primary: true, prefix: true, also: ["/admin/invites", "/admin/intake"] },
    { href: "/admin/classes", labelKey: "nav.classes", icon: "chalkboard", primary: true, prefix: true, also: ["/admin/promotion"] },
    { href: "/admin/timetable", labelKey: "nav.timetable", icon: "clock", primary: true, prefix: true },
    { href: "/admin/exams", labelKey: "nav.exams", icon: "clipboard", primary: true, prefix: true },
    { href: "/admin/attendance", labelKey: "nav.attendance", icon: "checks", prefix: true, group: "running", also: ["/attendance/history"] },
    { href: "/admin/calendar", labelKey: "nav.calendar", icon: "calendar", prefix: true, group: "running" },
    // Fees: what the school asked its families for and what arrived. The
    // office writes; the principal reads the same pages (see fees.ts officeOrHead).
    { href: "/admin/fees", labelKey: "nav.fees", icon: "receipt", prefix: true, group: "running" },
    // The leave queue is genuinely an admin's to work — a school whose
    // principal is the one on leave still has to approve somebody's.
    { href: "/principal/leave", labelKey: "nav.leave", icon: "calendar", prefix: true, group: "running", also: ["/principal/staff"] },
    { href: "/admin/reviews", labelKey: "nav.reviews", icon: "star", prefix: true, group: "running" },
    { href: "/admin/safety", labelKey: "nav.safety", icon: "shield", prefix: true, group: "running" },
    { href: "/admin/settings", labelKey: "nav.settings", icon: "gear", prefix: true, group: "running" },
    // The office can now write to anyone at the school, so the inbox is theirs too.
    { href: "/remarks", labelKey: "nav.messages", icon: "chat", prefix: true, group: "daily" },
    { href: "/bulletin", labelKey: "nav.bulletin", icon: "megaphone", prefix: true, group: "school" },
    { href: "/experts", labelKey: "nav.experts", icon: "briefcase", prefix: true, group: "school" },
    { href: "/admin/vacancies", labelKey: "nav.vacancies", icon: "briefcase", prefix: true, group: "school", also: ["/vacancies"] },
    // Hidden by the shell until the school has any — see signed-in-shell.tsx.
    { href: "/enquiries", labelKey: "nav.enquiries", icon: "envelope", prefix: true, group: "school" },
    { href: "/mentoring", labelKey: "nav.mentoring", icon: "chat", prefix: true, group: "school" },
    { href: "/competitions", labelKey: "nav.competitions", icon: "trophy", prefix: true, group: "school" },
    { href: "/archive", labelKey: "nav.pastYears", icon: "archive", prefix: true, group: "school" },
  ],
  // A principal READS and DECIDES. No register, no gradebook, no class setup —
  // those belong to the teacher and the admin respectively, and handing all
  // three to one role is how "principal" quietly becomes "can do anything".
  PRINCIPAL: [
    { href: "/principal", labelKey: "nav.dashboard", icon: "chartLine", primary: true, also: ["/attendance/history"] },
    { href: "/principal/classes", labelKey: "nav.classes", icon: "chalkboard", primary: true, prefix: true },
    { href: "/principal/leave", labelKey: "nav.leave", icon: "calendar", primary: true, prefix: true, also: ["/principal/staff"] },
    { href: "/admin/reviews", labelKey: "nav.reviews", icon: "star", primary: true, prefix: true },
    { href: "/exams", labelKey: "nav.exams", icon: "clipboard", primary: true, prefix: true },
    { href: "/principal/timetable", labelKey: "nav.timetable", icon: "clock", prefix: true, group: "running" },
    { href: "/admin/calendar", labelKey: "nav.calendar", icon: "calendar", prefix: true, group: "running" },
    // Read-only for the head: the overview, the dues and the structures.
    { href: "/admin/fees", labelKey: "nav.fees", icon: "receipt", prefix: true, group: "running" },
    { href: "/remarks", labelKey: "nav.messages", icon: "chat", prefix: true, group: "daily" },
    { href: "/bulletin", labelKey: "nav.bulletin", icon: "megaphone", prefix: true, group: "school" },
    { href: "/admin/vacancies", labelKey: "nav.vacancies", icon: "briefcase", prefix: true, group: "school", also: ["/vacancies"] },
    { href: "/enquiries", labelKey: "nav.enquiries", icon: "envelope", prefix: true, group: "school" },
    { href: "/competitions", labelKey: "nav.competitions", icon: "trophy", prefix: true, group: "school" },
    { href: "/archive", labelKey: "nav.pastYears", icon: "archive", prefix: true, group: "school" },
    { href: "/account", labelKey: "nav.account", icon: "gear", prefix: true, group: "running" },
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
    { href: "/teacher/profile", labelKey: "nav.me", icon: "user", prefix: true, group: "running" },
    { href: "/bulletin", labelKey: "nav.bulletin", icon: "megaphone", prefix: true, group: "school" },
    { href: "/experts", labelKey: "nav.experts", icon: "briefcase", prefix: true, group: "school" },
    { href: "/vacancies", labelKey: "nav.vacancies", icon: "briefcase", prefix: true, group: "school" },
    { href: "/enquiries", labelKey: "nav.enquiries", icon: "envelope", prefix: true, group: "school" },
    { href: "/mentoring", labelKey: "nav.mentoring", icon: "chat", prefix: true, group: "school" },
    { href: "/competitions", labelKey: "nav.competitions", icon: "trophy", prefix: true, group: "school" },
    { href: "/archive", labelKey: "nav.pastYears", icon: "archive", prefix: true, group: "school" },
  ],
  STUDENT: [
    { href: "/student", labelKey: "nav.today", icon: "house", primary: true },
    // ONE place for "what do I owe": to do, handed in, marked — the old
    // "My work" and "Grades" folded together.
    { href: "/student/assignments", labelKey: "nav.assignments", icon: "clipboard", primary: true, prefix: true, also: ["/student/work", "/student/grades"] },
    // ONE place for "how did I do": exam marks, the exams ahead, report cards.
    { href: "/exams", labelKey: "nav.exams", icon: "chartLine", primary: true, prefix: true, also: ["/report-cards"] },
    { href: "/student/practice", labelKey: "nav.practice", icon: "brain", primary: true, prefix: true },
    { href: "/timetable", labelKey: "nav.timetable", icon: "clock", prefix: true, group: "daily" },
    { href: "/remarks", labelKey: "nav.messages", icon: "chat", prefix: true, group: "daily" },
    { href: "/reviews", labelKey: "nav.feedback", icon: "star", prefix: true, group: "daily" },
    // Social Media sits with school life for a pupil — the bottom bar keeps
    // the four things a school day is made of.
    { href: "/bulletin", labelKey: "nav.bulletin", icon: "megaphone", prefix: true, group: "school" },
    { href: "/mentoring", labelKey: "nav.mentoring", icon: "chat", prefix: true, group: "school" },
    { href: "/competitions", labelKey: "nav.competitions", icon: "trophy", prefix: true, group: "school" },
    { href: "/archive", labelKey: "nav.pastYears", icon: "archive", prefix: true, group: "school" },
    { href: "/student/profile", labelKey: "nav.me", icon: "user", prefix: true, group: "running" },
  ],
  PARENT: [
    { href: "/parent", labelKey: "nav.overview", icon: "house", primary: true },
    { href: "/parent/attendance", labelKey: "nav.attendance", icon: "checks", primary: true, prefix: true },
    // The homework diary and the grades page, folded into one Assignments.
    { href: "/parent/assignments", labelKey: "nav.assignments", icon: "clipboard", primary: true, prefix: true, also: ["/parent/homework", "/parent/grades"] },
    { href: "/exams", labelKey: "nav.exams", icon: "chartLine", primary: true, prefix: true, also: ["/report-cards"] },
    { href: "/remarks", labelKey: "nav.messages", icon: "chat", primary: true, prefix: true },
    { href: "/parent/practice", labelKey: "nav.practice", icon: "brain", prefix: true, group: "daily" },
    { href: "/parent/timetable", labelKey: "nav.timetable", icon: "clock", prefix: true, group: "daily" },
    { href: "/parent/meetings", labelKey: "nav.meetings", icon: "calendar", prefix: true, group: "daily" },
    { href: "/parent/fees", labelKey: "nav.fees", icon: "receipt", prefix: true, group: "daily" },
    { href: "/reviews", labelKey: "nav.feedback", icon: "star", prefix: true, group: "daily" },
    { href: "/bulletin", labelKey: "nav.bulletin", icon: "megaphone", prefix: true, group: "school" },
    { href: "/explore", labelKey: "nav.explore", icon: "buildings", prefix: true, group: "school" },
    { href: "/enquiries", labelKey: "nav.enquiries", icon: "envelope", prefix: true, group: "school" },
    { href: "/competitions", labelKey: "nav.competitions", icon: "trophy", prefix: true, group: "school" },
    { href: "/mentoring", labelKey: "nav.mentoring", icon: "chat", prefix: true, group: "school" },
    { href: "/archive", labelKey: "nav.pastYears", icon: "archive", prefix: true, group: "school" },
    { href: "/parent/settings", labelKey: "nav.settings", icon: "gear", prefix: true, group: "running" },
  ],
  // An expert sees their own work and nothing resembling a school's internals.
  EXPERT: [
    { href: "/expert", labelKey: "nav.bookings", icon: "house", primary: true },
    { href: "/expert/availability", labelKey: "nav.availability", icon: "calendar", primary: true, prefix: true },
    { href: "/mentoring", labelKey: "nav.mentoring", icon: "chat", primary: true, prefix: true },
    { href: "/expert/profile", labelKey: "nav.profile", icon: "user", prefix: true, group: "running" },
    { href: "/account", labelKey: "nav.account", icon: "gear", prefix: true, group: "running" },
  ],
};

/** The one action each role does most. Becomes the floating action button. */
export const PRIMARY_ACTION: Record<Role, QuickAction | null> = {
  ADMIN: {
    href: "/admin/invites/new",
    labelKey: "action.invitePeople",
    icon: "userPlus",
    descriptionKey: "action.invitePeopleHint",
  },
  TEACHER: {
    href: "/teacher/attendance",
    labelKey: "action.takeRegister",
    icon: "checks",
    descriptionKey: "action.takeRegisterHint",
  },
  PRINCIPAL: null,
  STUDENT: null,
  PARENT: null,
  EXPERT: {
    href: "/expert/availability",
    labelKey: "action.offerTime",
    icon: "calendar",
    descriptionKey: "action.offerTimeHint",
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
};

export function isActive(pathname: string, item: NavItem): boolean {
  const hits = (href: string) =>
    item.prefix ? pathname === href || pathname.startsWith(`${href}/`) : pathname === href;
  return hits(item.href) || (item.also ?? []).some(hits);
}
