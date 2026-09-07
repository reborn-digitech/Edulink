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
    { name: "messages", labelKey: "nav.mentoring", icon: "chat" },
  ],
};

/** Every screen name any role has a tab for; the tab layout declares them all and hides the rest per role. */
export const ALL_TAB_SCREENS = ["index", "attendance", "classes", "messages", "assignments", "practice", "people", "leave", "availability", "more"] as const;
