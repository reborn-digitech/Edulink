/**
 * THE MENU THE NAV WALK ASKS FOR, DECIDED BY THE SHELL'S OWN RULES (E2 of the CI triage of 15 November 2026).
 *
 * sweep.ts's everyNavLink requests every static link a role is shown. It dropped the entries the shell hides while
 * their platform feature is off (nav.ts hiddenByFeature) and not those it hides for the institution's kind (nav.ts
 * hiddenByKind, which signed-in-shell.tsx applies and the palette follows through its hidden list). So at ZZ Vidya
 * College it asked the office and the head for /admin/admissions, which nav.ts gives `kinds: SCHOOL_KINDS`: no college
 * person is shown it, and since 3ccf78f4 (TA-269) its layout answers the app's 404 at a college, as intended. CI's page
 * sweep failed on those two lines from e6fe7757 on. The walk now drops what the shell drops, with the shell's own
 * functions: hiddenByKind over the role's menu, given the kinds the shell reads (the school's own kind, a guardian's
 * children's schools' kinds, none without a school), beside hiddenByFeature as before.
 *
 * An entry hidden by kind is not asked as a link the person is shown, but it is still asked typed in, at an answer
 * written down: the school's exams, syllabus and substitutions, whose pages still open at a college by address, at the
 * 200 they give today (OPEN_WHEN_HIDDEN_BY_KIND), and every other one, the admissions, at the app's 404.
 *
 * Pure: the walker's school, modules, duties and kinds are read by the sweep and passed in.
 */
import { NAV, PRIMARY_ACTION, QUICK_ACTIONS, hiddenByFeature, hiddenByKind } from "@/lib/nav";
import type { Role } from "@/lib/constants";

/**
 * Entries the shell hides by kind at a college whose pages still open there when the address is typed in: a 200, the
 * page rendered, not a redirect. At ZZ Vidya College they are seven of the walk's lines: the office's /admin/exams,
 * /admin/syllabus and /admin/substitutions, the head's /exams, /admin/syllabus and /admin/substitutions, and the
 * student's /exams, each asked as a link the person was shown until the kinds rule above. They are kept as typed-in
 * checks at today's answer so that a page that stops rendering is still caught. Whether a college person should reach
 * the school's pages by address at all is an open product question for the owner, not decided here. Every other entry
 * hidden by kind is asked typed in for the app's 404 (kindNotFound): /admin/admissions, whose layout answers it at a
 * college since 3ccf78f4 (TA-269), for the office and the head at ZZ Vidya College.
 */
export const OPEN_WHEN_HIDDEN_BY_KIND: readonly string[] = ["/admin/exams", "/admin/syllabus", "/admin/substitutions", "/exams"];

export type NavWalkScope = {
  /** The modules the walker's school has on (a guardian's: the children's schools'). */
  modulesOn: readonly string[];
  /** The walker's duties: an entry carrying `duty` is shown only to its holder. */
  duties?: readonly string[];
  /** The platform features on for the run. */
  featuresOn: readonly string[];
  /** The institution kinds the shell reads for the walker; none keeps every entry, as the shell does. */
  kinds: readonly string[];
  /** Pages the walker asks for beside its menu. */
  also?: readonly string[];
};

export type NavWalkPlan = {
  /** An admin's entries for the head's pages they do not hold: hidden, and typed in, the app's 404. */
  headless: string[];
  /** The entries hidden while their platform feature is off: typed in, the app's 404. */
  featureOff: string[];
  /** The entries hidden for the institution's kind: not asked as links the person is shown. */
  kindOff: string[];
  /** Of those, the ones whose pages still open by address (OPEN_WHEN_HIDDEN_BY_KIND): asked typed in, at 200. */
  typedIn: string[];
  /** And the rest of them: asked typed in for the app's 404, so every entry hidden by kind is asked with an answer. */
  kindNotFound: string[];
  /** Every static link the walker is shown: the menu's entries, the palette's actions and the floating action. */
  shown: string[];
};

export function navWalkPlan(role: Role, scope: NavWalkScope): NavWalkPlan {
  const duties = scope.duties ?? [];
  const inScope = NAV[role].filter((item) => (!item.module || scope.modulesOn.includes(item.module)) && (!item.duty || duties.includes(item.duty)));
  const featureOff = new Set(hiddenByFeature(inScope, scope.featuresOn));
  // As signed-in-shell.tsx asks it: over the role's whole menu, with the kinds in scope.
  const kindOff = new Set(hiddenByKind(NAV[role], scope.kinds));
  const headless = role === "ADMIN" ? NAV.ADMIN.filter((item) => item.duty && !duties.includes(item.duty) && (!item.module || scope.modulesOn.includes(item.module))).map((item) => item.href) : [];
  const hrefs = [
    ...inScope.filter((item) => !featureOff.has(item.href)).map((item) => item.href),
    ...QUICK_ACTIONS[role].map((action) => action.href).filter((href) => !headless.includes(href)),
    ...(PRIMARY_ACTION[role] ? [PRIMARY_ACTION[role]!.href] : []),
    ...(scope.also ?? []),
  ].filter((href) => !href.includes("["));
  // The entries in scope that the kind hides and the feature switch does not (a feature's are asked for its 404 above).
  const hiddenByKindOnly = [...new Set(inScope.map((item) => item.href))].filter((href) => kindOff.has(href) && !featureOff.has(href) && !href.includes("["));
  return {
    headless,
    featureOff: [...featureOff].filter((href) => !href.includes("[")),
    kindOff: [...kindOff],
    typedIn: hiddenByKindOnly.filter((href) => OPEN_WHEN_HIDDEN_BY_KIND.includes(href)),
    kindNotFound: hiddenByKindOnly.filter((href) => !OPEN_WHEN_HIDDEN_BY_KIND.includes(href)),
    shown: [...new Set(hrefs)].filter((href) => !featureOff.has(href) && !kindOff.has(href)),
  };
}
