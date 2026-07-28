import type { Role } from "./constants";

/**
 * Navigation model.
 *
 * The spec asks for deliberately "redundant" navigation: bottom bar on phones,
 * side rail on desktop, FAB for the primary task, and a command palette. All
 * four read from this one definition so they can never disagree about what
 * exists or what a thing is called. (§7)
 */

export type NavItem = {
  href: string;
  label: string;
  /** Phosphor icon name, resolved by the icon map in components/nav/icons.tsx */
  icon: string;
  /** Shown in the bottom bar on phones (max 5). */
  primary?: boolean;
  /** Matches child routes too, e.g. /teacher/classes/abc */
  prefix?: boolean;
};

export type QuickAction = {
  href: string;
  label: string;
  icon: string;
  description: string;
};

export const NAV: Record<Role, NavItem[]> = {
  ADMIN: [
    { href: "/admin", label: "Overview", icon: "house", primary: true },
    { href: "/admin/people", label: "Directory", icon: "users", primary: true, prefix: true },
    { href: "/admin/classes", label: "Classes", icon: "chalkboard", primary: true, prefix: true },
    { href: "/admin/invites", label: "Invites", icon: "envelope", primary: true, prefix: true },
    { href: "/bulletin", label: "Bulletin", icon: "megaphone", prefix: true },
    { href: "/admin/safety", label: "Safety", icon: "shield", prefix: true },
    { href: "/admin/settings", label: "Settings", icon: "gear", prefix: true },
  ],
  TEACHER: [
    { href: "/teacher", label: "Today", icon: "house", primary: true },
    { href: "/teacher/attendance", label: "Register", icon: "checks", primary: true, prefix: true },
    { href: "/teacher/classes", label: "Classes", icon: "chalkboard", primary: true, prefix: true },
    { href: "/teacher/assignments", label: "Work", icon: "clipboard", primary: true, prefix: true },
    { href: "/remarks", label: "Messages", icon: "chat", prefix: true },
    { href: "/bulletin", label: "Bulletin", icon: "megaphone", prefix: true },
  ],
  STUDENT: [
    { href: "/student", label: "Today", icon: "house", primary: true },
    { href: "/student/work", label: "My work", icon: "clipboard", primary: true, prefix: true },
    { href: "/student/grades", label: "Grades", icon: "chartLine", primary: true, prefix: true },
    { href: "/bulletin", label: "Bulletin", icon: "megaphone", primary: true, prefix: true },
    { href: "/student/profile", label: "Me", icon: "user", prefix: true },
  ],
  PARENT: [
    { href: "/parent", label: "Overview", icon: "house", primary: true },
    { href: "/parent/attendance", label: "Attendance", icon: "checks", primary: true, prefix: true },
    { href: "/parent/grades", label: "Grades", icon: "chartLine", primary: true, prefix: true },
    { href: "/remarks", label: "Messages", icon: "chat", primary: true, prefix: true },
    { href: "/parent/settings", label: "Settings", icon: "gear", prefix: true },
  ],
};

/** The one action each role does most. Becomes the floating action button. */
export const PRIMARY_ACTION: Record<Role, QuickAction | null> = {
  ADMIN: {
    href: "/admin/invites/new",
    label: "Invite people",
    icon: "userPlus",
    description: "Add teachers or students to your school",
  },
  TEACHER: {
    href: "/teacher/attendance",
    label: "Take the register",
    icon: "checks",
    description: "Mark today's attendance",
  },
  STUDENT: null,
  PARENT: null,
};

/** Extra entries offered by the command palette beyond plain navigation. */
export const QUICK_ACTIONS: Record<Role, QuickAction[]> = {
  ADMIN: [
    { href: "/admin/invites/new", label: "Invite a teacher", icon: "userPlus", description: "Send an invitation email" },
    { href: "/admin/classes/new", label: "Create a class", icon: "plus", description: "Add a new class or section" },
    { href: "/admin/settings", label: "School branding", icon: "palette", description: "Logo and colours" },
  ],
  TEACHER: [
    { href: "/teacher/attendance", label: "Take the register", icon: "checks", description: "Mark today's attendance" },
    { href: "/teacher/assignments/new", label: "New assignment", icon: "plus", description: "Post work to a class" },
    { href: "/remarks/new", label: "Message a parent", icon: "chat", description: "Start a private thread" },
  ],
  STUDENT: [
    { href: "/student/work", label: "What is due", icon: "clipboard", description: "Your upcoming work" },
    { href: "/bulletin/new", label: "Share something", icon: "plus", description: "Post to your class bulletin" },
  ],
  PARENT: [
    { href: "/remarks", label: "Message a teacher", icon: "chat", description: "Open a conversation" },
    { href: "/parent/settings", label: "Notification settings", icon: "bell", description: "Choose what you are told" },
  ],
};

export function isActive(pathname: string, item: NavItem): boolean {
  if (item.prefix) return pathname === item.href || pathname.startsWith(`${item.href}/`);
  return pathname === item.href;
}
