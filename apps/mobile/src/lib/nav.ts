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
    { labelKey: "nav.me", icon: "user", group: "running", screen: "/(app)/profile" },
    { labelKey: "nav.bulletin", icon: "megaphone", group: "school", screen: "/(app)/bulletin" },
    { labelKey: "nav.experts", icon: "briefcase", group: "school", screen: "/(app)/experts" },
    { labelKey: "nav.vacancies", icon: "briefcase", group: "school", screen: "/(app)/vacancies" },
    { labelKey: "nav.enquiries", icon: "envelope", group: "school", screen: "/(app)/enquiries" },
    { labelKey: "nav.mentoring", icon: "chat", group: "school", screen: "/(app)/mentoring" },
    { labelKey: "nav.competitions", icon: "trophy", group: "school", screen: "/(app)/competitions" },
    { labelKey: "nav.pastYears", icon: "archive", group: "school", screen: "/(app)/archive" },
  ],
  STUDENT: [
    { labelKey: "nav.exams", icon: "chartLine", group: "daily", screen: "/(app)/exams" },
    { labelKey: "nav.timetable", icon: "clock", group: "daily", screen: "/(app)/timetable" },
    { labelKey: "nav.feedback", icon: "star", group: "daily", screen: "/(app)/reviews" },
    { labelKey: "nav.bulletin", icon: "megaphone", group: "school", screen: "/(app)/bulletin" },
    { labelKey: "nav.mentoring", icon: "chat", group: "school", screen: "/(app)/mentoring" },
    { labelKey: "nav.competitions", icon: "trophy", group: "school", screen: "/(app)/competitions" },
    { labelKey: "nav.pastYears", icon: "archive", group: "school", screen: "/(app)/archive" },
    { labelKey: "nav.me", icon: "user", group: "running", screen: "/(app)/profile" },
  ],
  PARENT: [
    { labelKey: "nav.exams", icon: "chartLine", group: "daily", screen: "/(app)/exams" },
    { labelKey: "nav.practice", icon: "brain", group: "daily", screen: "/(app)/practice" },
    { labelKey: "nav.timetable", icon: "clock", group: "daily", screen: "/(app)/timetable" },
    { labelKey: "nav.meetings", icon: "calendar", group: "daily", screen: "/(app)/meetings" },
    { labelKey: "nav.feedback", icon: "star", group: "daily", screen: "/(app)/reviews" },
    { labelKey: "nav.bulletin", icon: "megaphone", group: "school", screen: "/(app)/bulletin" },
    { labelKey: "nav.explore", icon: "buildings", group: "school", screen: "/(app)/explore" },
    { labelKey: "nav.enquiries", icon: "envelope", group: "school", screen: "/(app)/enquiries" },
    { labelKey: "nav.competitions", icon: "trophy", group: "school", screen: "/(app)/competitions" },
    { labelKey: "nav.mentoring", icon: "chat", group: "school", screen: "/(app)/mentoring" },
    { labelKey: "nav.pastYears", icon: "archive", group: "school", screen: "/(app)/archive" },
    { labelKey: "nav.settings", icon: "gear", group: "running", screen: "/(app)/settings" },
  ],
  ADMIN: [
    { labelKey: "nav.classes", icon: "chalkboard", group: "daily", screen: "/(app)/classes" },
    { labelKey: "nav.timetable", icon: "clock", group: "daily", screen: "/(app)/timetable" },
    { labelKey: "nav.exams", icon: "clipboard", group: "daily", screen: "/(app)/exams" },
    { labelKey: "nav.attendance", icon: "checks", group: "running", screen: "/(app)/attendance" },
    { labelKey: "nav.calendar", icon: "calendar", group: "running", screen: "/(app)/calendar" },
    { labelKey: "nav.staff", icon: "users", group: "running", screen: "/(app)/staff" },
    { labelKey: "nav.reviews", icon: "star", group: "running", screen: "/(app)/reviews" },
    { labelKey: "nav.safety", icon: "shield", group: "running", screen: "/(app)/safety" },
    { labelKey: "nav.settings", icon: "gear", group: "running", screen: "/(app)/settings" },
    { labelKey: "nav.invites", icon: "plus", group: "running", web: "/admin/invites/new" },
    { labelKey: "nav.directory", icon: "users", group: "running", web: "/admin/directory" },
    { labelKey: "nav.bulletin", icon: "megaphone", group: "school", screen: "/(app)/bulletin" },
    { labelKey: "nav.experts", icon: "briefcase", group: "school", screen: "/(app)/experts" },
    { labelKey: "nav.vacancies", icon: "briefcase", group: "school", screen: "/(app)/vacancies" },
    { labelKey: "nav.enquiries", icon: "envelope", group: "school", screen: "/(app)/enquiries" },
    { labelKey: "nav.mentoring", icon: "chat", group: "school", screen: "/(app)/mentoring" },
    { labelKey: "nav.competitions", icon: "trophy", group: "school", screen: "/(app)/competitions" },
    { labelKey: "nav.pastYears", icon: "archive", group: "school", screen: "/(app)/archive" },
  ],
  PRINCIPAL: [
    { labelKey: "nav.reviews", icon: "star", group: "daily", screen: "/(app)/reviews" },
    { labelKey: "nav.exams", icon: "clipboard", group: "daily", screen: "/(app)/exams" },
    { labelKey: "nav.attendance", icon: "checks", group: "daily", screen: "/(app)/attendance" },
    { labelKey: "nav.timetable", icon: "clock", group: "running", screen: "/(app)/timetable" },
    { labelKey: "nav.calendar", icon: "calendar", group: "running", screen: "/(app)/calendar" },
    { labelKey: "nav.staff", icon: "users", group: "running", screen: "/(app)/staff" },
    { labelKey: "nav.bulletin", icon: "megaphone", group: "school", screen: "/(app)/bulletin" },
    { labelKey: "nav.vacancies", icon: "briefcase", group: "school", screen: "/(app)/vacancies" },
    { labelKey: "nav.enquiries", icon: "envelope", group: "school", screen: "/(app)/enquiries" },
    { labelKey: "nav.competitions", icon: "trophy", group: "school", screen: "/(app)/competitions" },
    { labelKey: "nav.pastYears", icon: "archive", group: "school", screen: "/(app)/archive" },
  ],
  EXPERT: [
    { labelKey: "nav.profile", icon: "user", group: "running", screen: "/(app)/profile" },
    { labelKey: "nav.account", icon: "gear", group: "running", web: "/account" },
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
] as const;

/** The More sheet's entries for a role, grouped in the web's order. */
export function menuFor(role: RoleCode): { group: MenuGroup; items: MenuItem[] }[] {
  return MENU_GROUPS.map((group) => ({ group, items: MENU[role].filter((item) => item.group === group) })).filter((g) => g.items.length > 0);
}
