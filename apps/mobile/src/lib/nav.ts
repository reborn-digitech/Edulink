import type { RoleCode } from "@edulink/contracts";
import type { TranslationKey } from "@edulink/i18n";

/**
 * The bottom tab bar per role: the web NAV's primaries, at most four plus
 * "More", which holds the rest of that role's entries as a sheet. Routes are
 * the app's own (expo-router), named after the web's paths so a notification
 * URL the server already writes maps across (see lib/links.ts).
 */
export type Tab = { name: string; labelKey: TranslationKey; icon: string };

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
  ],
};

/** Every screen name any role has a tab for; the tab layout declares them all and hides the rest per role. */
export const ALL_TAB_SCREENS = ["index", "attendance", "classes", "messages", "assignments", "practice", "people", "leave", "availability", "mentoring", "more"] as const;

/**
 * The rest of the web's NAV for each role — what the web's rail and More
 * sheet list under "Day to day", "School life" and "Running things". Each
 * entry is either a screen the app has (`screen`, an expo-router path) or a
 * page the phone does not carry and opens on the web, signed in there
 * (`web`). The order is the web's. A role's primaries (TABS) are not
 * repeated here: the bar already has them.
 */
export type MenuGroup = "daily" | "school" | "running";
export type MenuItem = { labelKey: TranslationKey; icon: string; group: MenuGroup } & ({ screen: string; web?: undefined } | { web: string; screen?: undefined });

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
    { labelKey: "nav.bulletin", icon: "megaphone", group: "school", screen: "/(app)/bulletin" },
    { labelKey: "nav.experts", icon: "briefcase", group: "school", screen: "/(app)/experts" },
    { labelKey: "nav.vacancies", icon: "briefcase", group: "school", screen: "/(app)/vacancies" },
    { labelKey: "nav.enquiries", icon: "envelope", group: "school", screen: "/(app)/enquiries" },
    { labelKey: "nav.mentoring", icon: "chat", group: "school", screen: "/(app)/mentoring" },
    { labelKey: "nav.competitions", icon: "trophy", group: "school", screen: "/(app)/competitions" },
    { labelKey: "nav.pastYears", icon: "archive", group: "school", screen: "/(app)/archive" },
    { labelKey: "nav.account", icon: "user", group: "running", screen: "/(app)/account" },
  ],
  STUDENT: [
    { labelKey: "nav.exams", icon: "chartLine", group: "daily", screen: "/(app)/exams" },
    { labelKey: "nav.certificates", icon: "fileText", group: "daily", screen: "/(app)/certificates" },
    { labelKey: "nav.timetable", icon: "clock", group: "daily", screen: "/(app)/timetable" },
    { labelKey: "nav.feedback", icon: "star", group: "daily", screen: "/(app)/reviews" },
    { labelKey: "nav.bulletin", icon: "megaphone", group: "school", screen: "/(app)/bulletin" },
    { labelKey: "nav.mentoring", icon: "chat", group: "school", screen: "/(app)/mentoring" },
    { labelKey: "nav.competitions", icon: "trophy", group: "school", screen: "/(app)/competitions" },
    { labelKey: "nav.pastYears", icon: "archive", group: "school", screen: "/(app)/archive" },
    { labelKey: "nav.me", icon: "user", group: "running", screen: "/(app)/profile" },
    { labelKey: "nav.account", icon: "user", group: "running", screen: "/(app)/account" },
  ],
  PARENT: [
    { labelKey: "nav.exams", icon: "chartLine", group: "daily", screen: "/(app)/exams" },
    { labelKey: "nav.practice", icon: "brain", group: "daily", screen: "/(app)/practice" },
    { labelKey: "nav.timetable", icon: "clock", group: "daily", screen: "/(app)/timetable" },
    { labelKey: "nav.meetings", icon: "calendar", group: "daily", screen: "/(app)/meetings" },
    { labelKey: "nav.fees", icon: "receipt", group: "daily", screen: "/(app)/fees" },
    { labelKey: "nav.health", icon: "heart", group: "daily", screen: "/(app)/health" },
    { labelKey: "nav.certificates", icon: "fileText", group: "daily", screen: "/(app)/certificates" },
    { labelKey: "nav.incidents", icon: "firstAid", group: "daily", screen: "/(app)/family-incidents" },
    { labelKey: "nav.feedback", icon: "star", group: "daily", screen: "/(app)/reviews" },
    { labelKey: "nav.bulletin", icon: "megaphone", group: "school", screen: "/(app)/bulletin" },
    { labelKey: "nav.explore", icon: "buildings", group: "school", screen: "/(app)/explore" },
    { labelKey: "nav.enquiries", icon: "envelope", group: "school", screen: "/(app)/enquiries" },
    { labelKey: "nav.competitions", icon: "trophy", group: "school", screen: "/(app)/competitions" },
    { labelKey: "nav.mentoring", icon: "chat", group: "school", screen: "/(app)/mentoring" },
    { labelKey: "nav.pastYears", icon: "archive", group: "school", screen: "/(app)/archive" },
    { labelKey: "nav.settings", icon: "gear", group: "running", screen: "/(app)/settings" },
    { labelKey: "nav.account", icon: "user", group: "running", screen: "/(app)/account" },
  ],
  ADMIN: [
    { labelKey: "nav.classes", icon: "chalkboard", group: "daily", screen: "/(app)/classes" },
    { labelKey: "nav.timetable", icon: "clock", group: "daily", screen: "/(app)/timetable" },
    { labelKey: "nav.exams", icon: "clipboard", group: "daily", screen: "/(app)/exams" },
    { labelKey: "nav.syllabus", icon: "books", group: "daily", screen: "/(app)/syllabus-coverage" },
    { labelKey: "nav.attendance", icon: "checks", group: "running", screen: "/(app)/attendance" },
    { labelKey: "nav.staffAttendance", icon: "checks", group: "running", screen: "/(app)/staff-attendance" },
    { labelKey: "nav.substitutions", icon: "arrowsClockwise", group: "running", screen: "/(app)/substitutions" },
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
    { labelKey: "nav.settings", icon: "gear", group: "running", screen: "/(app)/settings" },
    { labelKey: "nav.invites", icon: "plus", group: "running", screen: "/(app)/invites" },
    { labelKey: "nav.directory", icon: "buildings", group: "running", screen: "/(app)/directory-profile" },
    { labelKey: "nav.bulletin", icon: "megaphone", group: "school", screen: "/(app)/bulletin" },
    { labelKey: "nav.experts", icon: "briefcase", group: "school", screen: "/(app)/experts" },
    { labelKey: "nav.vacancies", icon: "briefcase", group: "school", screen: "/(app)/vacancies" },
    { labelKey: "nav.enquiries", icon: "envelope", group: "school", screen: "/(app)/enquiries" },
    { labelKey: "nav.mentoring", icon: "chat", group: "school", screen: "/(app)/mentoring" },
    { labelKey: "nav.competitions", icon: "trophy", group: "school", screen: "/(app)/competitions" },
    { labelKey: "nav.pastYears", icon: "archive", group: "school", screen: "/(app)/archive" },
    { labelKey: "nav.account", icon: "user", group: "running", screen: "/(app)/account" },
  ],
  PRINCIPAL: [
    { labelKey: "nav.reviews", icon: "star", group: "daily", screen: "/(app)/reviews" },
    { labelKey: "nav.exams", icon: "clipboard", group: "daily", screen: "/(app)/exams" },
    { labelKey: "nav.syllabus", icon: "books", group: "daily", screen: "/(app)/syllabus-coverage" },
    { labelKey: "nav.attendance", icon: "checks", group: "daily", screen: "/(app)/attendance" },
    { labelKey: "nav.staffAttendance", icon: "checks", group: "running", screen: "/(app)/staff-attendance" },
    { labelKey: "nav.substitutions", icon: "arrowsClockwise", group: "running", screen: "/(app)/substitutions" },
    { labelKey: "nav.timetable", icon: "clock", group: "running", screen: "/(app)/timetable" },
    { labelKey: "nav.fees", icon: "receipt", group: "running", screen: "/(app)/fees" },
    { labelKey: "nav.messaging", icon: "chats", group: "running", screen: "/(app)/messaging" },
    { labelKey: "nav.circulars", icon: "megaphone", group: "running", screen: "/(app)/circulars" },
    { labelKey: "nav.calendar", icon: "calendar", group: "running", screen: "/(app)/calendar" },
    { labelKey: "nav.staff", icon: "users", group: "running", screen: "/(app)/staff" },
    { labelKey: "nav.incidents", icon: "firstAid", group: "running", screen: "/(app)/incidents" },
    { labelKey: "nav.pupilRecords", icon: "clipboard", group: "running", screen: "/(app)/pupil-records" },
    { labelKey: "nav.certificates", icon: "fileText", group: "running", screen: "/(app)/staff-certificates" },
    { labelKey: "nav.bulletin", icon: "megaphone", group: "school", screen: "/(app)/bulletin" },
    { labelKey: "nav.vacancies", icon: "briefcase", group: "school", screen: "/(app)/vacancies" },
    { labelKey: "nav.enquiries", icon: "envelope", group: "school", screen: "/(app)/enquiries" },
    { labelKey: "nav.competitions", icon: "trophy", group: "school", screen: "/(app)/competitions" },
    { labelKey: "nav.pastYears", icon: "archive", group: "school", screen: "/(app)/archive" },
    { labelKey: "nav.account", icon: "user", group: "running", screen: "/(app)/account" },
  ],
  EXPERT: [
    { labelKey: "nav.profile", icon: "user", group: "running", screen: "/(app)/profile" },
    { labelKey: "nav.account", icon: "user", group: "running", screen: "/(app)/account" },
  ],
};

/**
 * Every route under (app) that is not a tab: the Tabs navigator lists every
 * file it finds and, on the web target, shows an unnamed one in the bar with
 * a default icon, so each is declared with href: null. A test checks this
 * list against the files on disk.
 */
export const HIDDEN_SCREENS = [
  "notifications",
  "report",
  "marks",
  "exams",
  "meetings",
  "bulletin",
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
  "fees",
  "fees-dues",
  "fee-pupil",
  "fee-claims",
  "messaging",
  "messaging-new",
  "messaging-broadcast",
  "health",
  "pupil-health",
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
] as const;

/** The More sheet's entries for a role, grouped in the web's order. */
export function menuFor(role: RoleCode): { group: MenuGroup; items: MenuItem[] }[] {
  return MENU_GROUPS.map((group) => ({ group, items: MENU[role].filter((item) => item.group === group) })).filter((g) => g.items.length > 0);
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
