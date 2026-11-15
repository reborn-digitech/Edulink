/**
 * E2 of the CI triage of 15 November 2026 (page sweep, runs 43561321855 to 43592779839): the sweep's nav walk asked the
 * college office and the college head for /admin/admissions at ZZ Vidya College, an entry nav.ts gives
 * `kinds: SCHOOL_KINDS`, which the shell does not draw at a college and whose layout answers the app's 404 there since
 * 3ccf78f4 (TA-269). The walk dropped the entries hidden for an off feature (hiddenByFeature) and not those hidden for
 * the institution's kind (hiddenByKind, signed-in-shell.tsx). scripts/sweep-nav.ts now decides the walk with both of
 * the shell's functions, and everyNavLink walks what it decides. An entry hidden by kind is still asked typed in, at an
 * answer written down: the app's 404. The admissions have answered it at a college since TA-269's layout; the school's
 * exams, syllabus and substitutions (seven lines at ZZ Vidya College) were asked at the 200 they gave until the owner
 * said, on 15 November 2026 ("Yes, all three"), that a college should not open them, and now answer it too.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { COLLEGE_KINDS, INSTITUTION_KINDS, PLATFORM_FEATURES, SCHOOL_MODULES } from "@edulink/contracts";
import { NAV, QUICK_ACTIONS, SCHOOL_KINDS, hiddenByKind } from "@/lib/nav";
import { ROLES, type Role } from "@/lib/constants";
import { navWalkPlan, OPEN_WHEN_HIDDEN_BY_KIND, type NavWalkScope } from "../scripts/sweep-nav";

const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

/** Every module on, every feature on and every duty of the role held: only the kind can hide an entry. */
const open = (role: Role, kinds: readonly string[]): NavWalkScope => ({
  modulesOn: SCHOOL_MODULES,
  duties: NAV[role].flatMap((item) => (item.duty ? [item.duty] : [])),
  featuresOn: PLATFORM_FEATURES,
  kinds,
});

/** Everything the walk asks for at an answer other than the app's 404. */
const askedToOpen = (role: Role, scope: NavWalkScope) => {
  const plan = navWalkPlan(role, scope);
  return [...plan.shown, ...plan.typedIn];
};

describe("E2: the nav walk drops what the shell drops for the institution's kind", () => {
  it("E2: at a college the office and the head are not shown the school's admissions, which a school's are", () => {
    for (const role of ["ADMIN", "PRINCIPAL"] as const) {
      for (const kind of COLLEGE_KINDS) {
        expect(askedToOpen(role, open(role, [kind])), `${role} at a ${kind}`).not.toContain("/admin/admissions");
        expect(navWalkPlan(role, open(role, [kind])).kindOff, `${role} at a ${kind}`).toContain("/admin/admissions");
      }
      for (const kind of SCHOOL_KINDS) {
        expect(navWalkPlan(role, open(role, [kind])).shown, `${role} at a ${kind}`).toContain("/admin/admissions");
        expect(navWalkPlan(role, open(role, [kind])).kindOff, `${role} at a ${kind}`).toEqual([]);
      }
    }
  });

  it("E2: at a college every page hidden by kind is asked typed in for the app's 404, the admissions (TA-269) and the school's seven (the owner, 15 Nov); at a school nothing", () => {
    const notFound: Partial<Record<Role, string[]>> = {
      ADMIN: ["/admin/admissions", "/admin/exams", "/admin/substitutions", "/admin/syllabus"],
      PRINCIPAL: ["/admin/admissions", "/admin/substitutions", "/admin/syllabus", "/exams"],
      STUDENT: ["/exams"],
      PARENT: ["/exams"],
    };
    for (const [role, hrefs] of Object.entries(notFound) as [Role, string[]][]) {
      for (const kind of COLLEGE_KINDS) expect([...navWalkPlan(role, open(role, [kind])).kindNotFound].sort(), `${role} at a ${kind}`).toEqual(hrefs);
      for (const kind of SCHOOL_KINDS) expect(navWalkPlan(role, open(role, [kind])).kindNotFound, `${role} at a ${kind}`).toEqual([]);
    }
  });

  it("E2: no page hidden by kind is asked at 200 at a college any more: the seven school's pages answer the app's 404 there (the owner, 15 Nov), none shown as a link", () => {
    // The seven lines at ZZ Vidya College that were asked at 200 until the owner's word: the office's three, the head's three, the student's one.
    const seven: Partial<Record<Role, string[]>> = {
      ADMIN: ["/admin/exams", "/admin/substitutions", "/admin/syllabus"],
      PRINCIPAL: ["/admin/substitutions", "/admin/syllabus", "/exams"],
      STUDENT: ["/exams"],
    };
    expect(OPEN_WHEN_HIDDEN_BY_KIND).toEqual([]);
    for (const kind of COLLEGE_KINDS) {
      for (const [role, hrefs] of Object.entries(seven) as [Role, string[]][]) {
        const plan = navWalkPlan(role, open(role, [kind]));
        expect(plan.typedIn, `${role} at a ${kind}`).toEqual([]);
        for (const href of hrefs) expect(plan.kindNotFound, `${role} at a ${kind}`).toContain(href);
        expect(plan.shown.filter((href) => hrefs.includes(href)), `${role} at a ${kind}`).toEqual([]);
      }
    }
    expect(Object.values(seven).flat()).toHaveLength(7);
    // At a school nothing is hidden by kind, so nothing is asked typed in: the pages are links the person is shown.
    for (const role of ["ADMIN", "PRINCIPAL", "STUDENT"] as const) {
      for (const kind of SCHOOL_KINDS) expect(navWalkPlan(role, open(role, [kind])).typedIn, `${role} at a ${kind}`).toEqual([]);
    }
  });

  it("E2: an entry is dropped exactly when the shell's hiddenByKind drops it, and each is asked typed in at one answer, for every role and kind", () => {
    for (const role of ROLES) {
      for (const kind of INSTITUTION_KINDS) {
        const plan = navWalkPlan(role, open(role, [kind]));
        expect(plan.kindOff, `${role} at a ${kind}`).toEqual(hiddenByKind(NAV[role], [kind]));
        expect(plan.shown.filter((href) => plan.kindOff.includes(href)), `${role} at a ${kind}`).toEqual([]);
        // With every module, duty and feature on, every entry hidden by kind is asked typed in, at 200 or at 404, once.
        expect([...plan.typedIn, ...plan.kindNotFound].sort(), `${role} at a ${kind}`).toEqual([...plan.kindOff].sort());
        expect(plan.typedIn.filter((href) => plan.kindNotFound.includes(href)), `${role} at a ${kind}`).toEqual([]);
      }
    }
  });

  it("E2: a palette action whose page is hidden for the kind is dropped with it, as the palette drops it", () => {
    // The office's "schedule an exam" and the student's "my exam marks" lead to the school's exams.
    expect(QUICK_ACTIONS.ADMIN.map((a) => a.href)).toContain("/admin/exams");
    expect(QUICK_ACTIONS.STUDENT.map((a) => a.href)).toContain("/exams");
    expect(navWalkPlan("ADMIN", open("ADMIN", ["COLLEGE"])).shown).not.toContain("/admin/exams");
    expect(navWalkPlan("STUDENT", open("STUDENT", ["AUTONOMOUS_COLLEGE"])).shown).not.toContain("/exams");
    expect(navWalkPlan("ADMIN", open("ADMIN", ["SCHOOL"])).shown).toContain("/admin/exams");
    expect(navWalkPlan("STUDENT", open("STUDENT", ["JUNIOR_COLLEGE"])).shown).toContain("/exams");
  });

  it("E2: no kind in scope keeps every entry (the expert, the recruiter, a guardian with no child yet), as the shell does", () => {
    for (const role of ROLES) expect(navWalkPlan(role, open(role, [])).kindOff, role).toEqual([]);
    // A guardian with a child at a school and one at a college keeps the school's exams.
    expect(navWalkPlan("PARENT", open("PARENT", ["COLLEGE", "SCHOOL"])).shown).toContain("/exams");
    expect(navWalkPlan("PARENT", open("PARENT", ["COLLEGE"])).shown).not.toContain("/exams");
  });

  it("E2: an entry hidden for its feature is still asked for the app's 404 at a college; one hidden for the kind is not asked as shown", () => {
    const plan = navWalkPlan("STUDENT", { modulesOn: SCHOOL_MODULES, featuresOn: [], kinds: ["COLLEGE"] });
    expect(plan.featureOff).toContain("/student/practice");
    expect(plan.shown).not.toContain("/student/practice");
    expect(plan.kindOff).toContain("/exams");
    expect([...plan.shown, ...plan.featureOff]).not.toContain("/exams");
    // ...and it is asked typed in for the app's 404, which its layout gives at a college since the owner's word of 15 November 2026.
    expect(plan.typedIn).toEqual([]);
    expect(plan.kindNotFound).toEqual(["/exams"]);
  });

  it("E2: sweep.ts walks the plan with each walker's kinds, asks the typed-in pages at 200 and 404, and decides nothing about the menu itself", () => {
    const sweep = read("scripts/sweep.ts");
    expect(sweep).toMatch(/import \{ navWalkPlan \} from "\.\/sweep-nav";/);
    expect(sweep).toMatch(/navWalkPlan\(role, \{ modulesOn: w\.modulesOn, duties: w\.duties, featuresOn: \[\.\.\.gate\.on\], kinds: w\.kinds, also: w\.also \}\)/);
    expect(sweep).toMatch(/for \(const href of plan\.typedIn\) \{\n\s+if \(ownOff && !keptWhenOff\(href\)\) continue;\n\s+await check\(w\.actor, href, 200, /);
    expect(sweep).toMatch(/for \(const href of plan\.kindNotFound\) \{\n\s+if \(ownOff && !keptWhenOff\(href\)\) continue;\n\s+await check\(w\.actor, href, 404, /);
    expect(sweep).not.toMatch(/hiddenByFeature\(|hiddenByKind\(|NAV\[role\]/);
    // The college's walkers carry their school's kind, the school's theirs, a guardian the children's.
    expect(sweep).toMatch(/select: \{ id: true, kind: true \} \}\);/);
    expect(sweep).toMatch(/kinds: \[at\.kind\]/);
    expect(sweep).toMatch(/kinds: await kindsForFamily\("parent@example\.com"\)/);
    // And the plan reads the shell's own function rather than a copy of its rule.
    const helper = read("scripts/sweep-nav.ts");
    expect(helper).toMatch(/import \{ NAV, PRIMARY_ACTION, QUICK_ACTIONS, hiddenByFeature, hiddenByKind \} from "@\/lib\/nav";/);
    expect(helper).toMatch(/hiddenByKind\(NAV\[role\], scope\.kinds\)/);
    expect(read("src/components/nav/signed-in-shell.tsx")).toMatch(/hiddenByKind\(NAV\[role\], kinds\)/);
  });
});
