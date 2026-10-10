/**
 * WHICH PAGES A HELP ANSWER MAY NAME (Phase D, 10 October 2026): only the pages the asker's own role
 * opens. The help index carries every role's pages and every door, and an entry tagged for no role
 * matches every role, so a guardian's "how do I pay fees" was answered with an office page
 * (/admin/family/fees/plans) and help answers named programs' /api/ doors. A page belongs to a role when
 * its first segment is the first segment of one of the role's own menu entries (lib/nav.ts), the
 * account pages and the assistant's own page being everyone's. Pure.
 */
import type { Role } from "../constants";
import { NAV } from "../nav";

const EVERYONE = ["account", "assistant", "search", "notifications", "help"];

function firstSegment(path: string): string {
  return path.replace(/^\/+/, "").split(/[/?#]/)[0] ?? "";
}

const SEGMENTS = new Map<Role, Set<string>>();
function segmentsOf(role: Role): Set<string> {
  let set = SEGMENTS.get(role);
  if (!set) {
    set = new Set([...EVERYONE, ...(NAV[role] ?? []).flatMap((i) => [i.href, ...(i.also ?? [])]).map(firstSegment)]);
    SEGMENTS.set(role, set);
  }
  return set;
}

/** A page path the role's own menu reaches (by its first segment); never an /api/ door. */
export function pageIsRoles(path: string, role: Role): boolean {
  const seg = firstSegment(path);
  return seg !== "api" && segmentsOf(role).has(seg);
}

/** The platform paths an answer names that are not the role's own pages (an /api/ door is never one). */
export function foreignPaths(answer: string, role: Role): string[] {
  const paths = answer.match(/(?<![\w.:/-])\/[a-z][\w-]*(?:\/[\w\-[\]{}<>:]+)*/g) ?? [];
  return [...new Set(paths)].filter((p) => !pageIsRoles(p, role));
}

/**
 * A page of the person's own named under an invented host ("https://shalaghar.in/student/exams": the model wrote
 * one in half its Marathi answers, 10 Oct 2026) becomes the bare path the platform itself links; a link to
 * anything else is left for the answer check to discard. Pure.
 */
export function ownPathsWithoutHost(answer: string, role: Role): string {
  return answer.replace(/https?:\/\/[^\s/)\]]+(\/[a-z][\w-]*(?:\/[\w\-[\]{}<>:]+)*)\/?/gi, (whole, path: string) => (pageIsRoles(path, role) ? path : whole));
}
