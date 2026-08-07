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

export type NavItem = {
  href: string;
  labelKey: TranslationKey;
  /** Phosphor icon name, resolved by the icon map in components/nav/icons.tsx */
  icon: string;
  /** Shown in the bottom bar on phones (max 5). */
  primary?: boolean;
  /** Matches child routes too, e.g. /teacher/classes/abc */
  prefix?: boolean;
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
    { href: "/admin/people", labelKey: "nav.directory", icon: "users", primary: true, prefix: true },
    { href: "/admin/classes", labelKey: "nav.classes", icon: "chalkboard", primary: true, prefix: true },
    { href: "/admin/invites", labelKey: "nav.invites", icon: "envelope", primary: true, prefix: true },
    { href: "/admin/timetable", labelKey: "nav.timetable", icon: "clock", prefix: true },
    { href: "/admin/attendance", labelKey: "nav.attendance", icon: "checks", prefix: true },
    { href: "/admin/exams", labelKey: "nav.exams", icon: "clipboard", prefix: true },
    { href: "/bulletin", labelKey: "nav.bulletin", icon: "megaphone", prefix: true },
    { href: "/experts", labelKey: "nav.experts", icon: "briefcase", prefix: true },
    { href: "/mentoring", labelKey: "nav.mentoring", icon: "chat", prefix: true },
    { href: "/competitions", labelKey: "nav.competitions", icon: "trophy", prefix: true },
    { href: "/admin/calendar", labelKey: "nav.calendar", icon: "calendar", prefix: true },
    // The leave queue is genuinely an admin's to work. `decideLeave` has always
    // accepted ADMIN — a school whose principal is the one on leave still has to
    // be able to approve somebody's — but nothing linked here, so the only way
    // in was typing the URL. The route lives under /principal because that is
    // whose queue it usually is; the capability is shared.
    { href: "/principal/leave", labelKey: "nav.leave", icon: "calendar", prefix: true },
    { href: "/admin/safety", labelKey: "nav.safety", icon: "shield", prefix: true },
    { href: "/admin/settings", labelKey: "nav.settings", icon: "gear", prefix: true },
  ],
  // A principal READS and DECIDES. No register, no gradebook, no class setup —
  // those belong to the teacher and the admin respectively, and handing all
  // three to one role is how "principal" quietly becomes "can do anything".
  // What is here is the school seen whole, and the one decision only they make.
  PRINCIPAL: [
    { href: "/principal", labelKey: "nav.dashboard", icon: "chartLine", primary: true },
    { href: "/principal/classes", labelKey: "nav.classes", icon: "chalkboard", primary: true, prefix: true },
    { href: "/principal/timetable", labelKey: "nav.timetable", icon: "clock", primary: true, prefix: true },
    { href: "/principal/leave", labelKey: "nav.leave", icon: "calendar", primary: true, prefix: true },
    { href: "/bulletin", labelKey: "nav.bulletin", icon: "megaphone", primary: true, prefix: true },
    { href: "/admin/calendar", labelKey: "nav.calendar", icon: "calendar", prefix: true },
    { href: "/remarks", labelKey: "nav.messages", icon: "chat", prefix: true },
    { href: "/competitions", labelKey: "nav.competitions", icon: "trophy", prefix: true },
    { href: "/account", labelKey: "nav.account", icon: "gear", prefix: true },
  ],
  TEACHER: [
    { href: "/teacher", labelKey: "nav.today", icon: "house", primary: true },
    { href: "/teacher/attendance", labelKey: "nav.register", icon: "checks", primary: true, prefix: true },
    { href: "/teacher/classes", labelKey: "nav.classes", icon: "chalkboard", primary: true, prefix: true },
    { href: "/timetable", labelKey: "nav.timetable", icon: "clock", prefix: true },
    { href: "/teacher/assignments", labelKey: "nav.work", icon: "clipboard", primary: true, prefix: true },
    { href: "/teacher/practice", labelKey: "nav.practice", icon: "brain", prefix: true },
    { href: "/teacher/exams", labelKey: "nav.exams", icon: "clipboard", prefix: true },
    { href: "/remarks", labelKey: "nav.messages", icon: "chat", prefix: true },
    { href: "/teacher/leave", labelKey: "nav.leave", icon: "calendar", prefix: true },
    { href: "/bulletin", labelKey: "nav.bulletin", icon: "megaphone", prefix: true },
    { href: "/experts", labelKey: "nav.experts", icon: "briefcase", prefix: true },
    { href: "/mentoring", labelKey: "nav.mentoring", icon: "chat", prefix: true },
    { href: "/competitions", labelKey: "nav.competitions", icon: "trophy", prefix: true },
  ],
  STUDENT: [
    { href: "/student", labelKey: "nav.today", icon: "house", primary: true },
    { href: "/student/work", labelKey: "nav.myWork", icon: "clipboard", primary: true, prefix: true },
    { href: "/student/grades", labelKey: "nav.grades", icon: "chartLine", primary: true, prefix: true },
    { href: "/timetable", labelKey: "nav.timetable", icon: "clock", prefix: true },
    { href: "/exams", labelKey: "nav.exams", icon: "clipboard", prefix: true },
    { href: "/student/practice", labelKey: "nav.practice", icon: "brain", primary: true, prefix: true },
    { href: "/bulletin", labelKey: "nav.bulletin", icon: "megaphone", primary: true, prefix: true },
    // A pupil's own conversations with their teachers. Their guardians are in
    // every one of them by construction — see assertRemarkAccess.
    { href: "/remarks", labelKey: "nav.messages", icon: "chat", prefix: true },
    // A pupil can now ASK for a mentor. The page was already theirs to read;
    // without a link they had to be sent one.
    { href: "/mentoring", labelKey: "nav.mentoring", icon: "chat", prefix: true },
    { href: "/competitions", labelKey: "nav.competitions", icon: "trophy", prefix: true },
    { href: "/student/profile", labelKey: "nav.me", icon: "user", prefix: true },
  ],
  PARENT: [
    { href: "/parent", labelKey: "nav.overview", icon: "house", primary: true },
    { href: "/parent/attendance", labelKey: "nav.attendance", icon: "checks", primary: true, prefix: true },
    { href: "/parent/grades", labelKey: "nav.grades", icon: "chartLine", primary: true, prefix: true },
    { href: "/parent/practice", labelKey: "nav.practice", icon: "brain", primary: true, prefix: true },
    { href: "/parent/homework", labelKey: "nav.homework", icon: "clipboard", prefix: true },
    { href: "/parent/timetable", labelKey: "nav.timetable", icon: "clock", prefix: true },
    { href: "/exams", labelKey: "nav.exams", icon: "clipboard", prefix: true },
    { href: "/remarks", labelKey: "nav.messages", icon: "chat", primary: true, prefix: true },
    { href: "/competitions", labelKey: "nav.competitions", icon: "trophy", prefix: true },
    { href: "/mentoring", labelKey: "nav.mentoring", icon: "chat", prefix: true },
    { href: "/parent/settings", labelKey: "nav.settings", icon: "gear", prefix: true },
  ],
  // An expert sees their own work and nothing resembling a school's internals:
  // no directory, no register, no bulletin. Every entry here is either their own
  // availability or a school that has actually booked them.
  EXPERT: [
    { href: "/expert", labelKey: "nav.bookings", icon: "house", primary: true },
    { href: "/expert/availability", labelKey: "nav.availability", icon: "calendar", primary: true, prefix: true },
    { href: "/mentoring", labelKey: "nav.mentoring", icon: "chat", primary: true, prefix: true },
    { href: "/expert/profile", labelKey: "nav.profile", icon: "user", prefix: true },
    { href: "/account", labelKey: "nav.account", icon: "gear", prefix: true },
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
    { href: "/admin/classes/new", labelKey: "action.createClass", icon: "plus", descriptionKey: "action.createClassHint" },
    { href: "/admin/timetable", labelKey: "action.buildTimetable", icon: "clock", descriptionKey: "action.buildTimetableHint" },
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
  ],
  STUDENT: [
    { href: "/student/work", labelKey: "action.whatIsDue", icon: "clipboard", descriptionKey: "action.whatIsDueHint" },
    { href: "/remarks/new", labelKey: "action.messageTeacher", icon: "chat", descriptionKey: "action.messageTeacherHint" },
    { href: "/bulletin/new", labelKey: "action.shareSomething", icon: "plus", descriptionKey: "action.shareSomethingHint" },
  ],
  PARENT: [
    { href: "/remarks/new", labelKey: "action.messageTeacher", icon: "chat", descriptionKey: "action.messageTeacherHint" },
    { href: "/parent/settings", labelKey: "action.notificationSettings", icon: "bell", descriptionKey: "action.notificationSettingsHint" },
  ],
  EXPERT: [
    { href: "/expert/availability", labelKey: "action.offerTime", icon: "calendar", descriptionKey: "action.offerTimeHint" },
    { href: "/expert/profile", labelKey: "action.editProfile", icon: "user", descriptionKey: "action.editProfileHint" },
  ],
};

export function isActive(pathname: string, item: NavItem): boolean {
  if (item.prefix) return pathname === item.href || pathname.startsWith(`${item.href}/`);
  return pathname === item.href;
}
