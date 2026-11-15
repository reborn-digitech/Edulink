/**
 * The owner's word of 15 November 2026 ("Yes, all three"): the school pages a college's menu hides (nav.ts, kinds:
 * SCHOOL_KINDS), which still opened there when the address was typed in, answer the app's 404 at a college, as
 * /admin/admissions has since TA-269: the office's /admin/exams, /admin/syllabus and /admin/substitutions, the head's
 * /exams, /admin/syllabus and /admin/substitutions, and the student's /exams. At a school, and signed out, they open as
 * before (the page's own role gate then answers). A guardian follows the menu's rule (signed-in-shell.tsx): the kinds
 * of the schools the children are at, so a family with a child at a school keeps the school's exams page.
 *
 * The real ZZ fixture schools are read by slug (ZZ Vidya College, ZZ Northgate School); nothing is written. A guardian's
 * children's kinds are given through institutionKindsForFamily, the function the menu and the rule both read.
 */
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { PrismaClient } from "@prisma/client";
import type { ReactNode } from "react";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { ActiveContext } from "@/lib/session";

const session = vi.hoisted(() => ({ current: null as null | { schoolId: string | null; role: string; user: { id: string } }, familyKinds: [] as string[] }));
vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
  redirect: (to: string) => {
    throw new Error(`NEXT_REDIRECT ${to}`);
  },
}));
vi.mock("@/lib/session", async (importOriginal) => ({ ...(await importOriginal<typeof import("@/lib/session")>()), getSession: async () => session.current }));
vi.mock("@/lib/family-child", async (importOriginal) => ({ ...(await importOriginal<typeof import("@/lib/family-child")>()), institutionKindsForFamily: async () => session.familyKinds }));
// A guardian's session carries no school (session.ts), as here: its kinds are its children's schools'.
const as = (schoolId: string | null, role = "ADMIN") => ({ schoolId, role, user: { id: "zz-not-a-user" } });
const ctx = (schoolId: string | null, role = "ADMIN") => as(schoolId, role) as unknown as ActiveContext;

const db = new PrismaClient();
let college = "";
let school = "";

beforeAll(async () => {
  college = (await db.school.findUniqueOrThrow({ where: { slug: "zz-vidya-college" }, select: { id: true } })).id;
  school = (await db.school.findUniqueOrThrow({ where: { slug: "zz-northgate-school" }, select: { id: true } })).id;
});

afterAll(async () => {
  await db.$disconnect();
});

type Layout = (props: { children: ReactNode }) => Promise<ReactNode>;
const LAYOUTS: { path: string; who: string; load: () => Promise<{ default: Layout }> }[] = [
  { path: "/admin/exams", who: "the office", load: () => import("@/app/(app)/admin/exams/layout") },
  { path: "/admin/syllabus", who: "the office and the head", load: () => import("@/app/(app)/admin/syllabus/layout") },
  { path: "/admin/substitutions", who: "the office and the head", load: () => import("@/app/(app)/admin/substitutions/layout") },
  { path: "/exams", who: "the head and a student", load: () => import("@/app/(app)/exams/layout") },
  // TA-269's, now through the same rule: it must answer as before.
  { path: "/admin/admissions", who: "the office and the head (TA-269)", load: () => import("@/app/(app)/admin/admissions/layout") },
];

describe("the school pages a college's menu hides answer the app's 404 at a college", () => {
  for (const layout of LAYOUTS) {
    it(`${layout.path} (${layout.who}): not found at ZZ Vidya College; open at ZZ Northgate and signed out`, async () => {
      const { default: Layout } = await layout.load();
      const page = "the page";
      session.current = as(college, layout.path === "/exams" ? "STUDENT" : "ADMIN");
      await expect(Layout({ children: page })).rejects.toThrow("NEXT_NOT_FOUND");
      session.current = as(school, layout.path === "/exams" ? "STUDENT" : "ADMIN");
      await expect(Layout({ children: page })).resolves.toBe(page);
      session.current = null;
      await expect(Layout({ children: page })).resolves.toBe(page);
    });
  }

  it("/exams for a guardian, whose session has no school: kept while a child is at a school, not found when every child is at a college, kept with no child yet", async () => {
    const { default: Layout } = await import("@/app/(app)/exams/layout");
    const page = "the page";
    session.current = as(null, "PARENT");
    session.familyKinds = ["SCHOOL", "COLLEGE"];
    await expect(Layout({ children: page })).resolves.toBe(page);
    session.familyKinds = ["COLLEGE"];
    await expect(Layout({ children: page })).rejects.toThrow("NEXT_NOT_FOUND");
    session.familyKinds = [];
    await expect(Layout({ children: page })).resolves.toBe(page);
  });

  it("the phone's search leaves out what the menu hides for the kind (kindHiddenHrefs, read by searchEverything)", async () => {
    const { kindHiddenHrefs } = await import("@/lib/school-only-page");
    expect([...(await kindHiddenHrefs(ctx(college)))].sort()).toEqual(["/admin/admissions", "/admin/exams", "/admin/substitutions", "/admin/syllabus"]);
    expect([...(await kindHiddenHrefs(ctx(college, "PRINCIPAL")))].sort()).toEqual(["/admin/admissions", "/admin/substitutions", "/admin/syllabus", "/exams"]);
    expect(await kindHiddenHrefs(ctx(college, "STUDENT"))).toEqual(["/exams"]);
    expect(await kindHiddenHrefs(ctx(school))).toEqual([]);
    session.familyKinds = ["COLLEGE"];
    expect(await kindHiddenHrefs(ctx(null, "PARENT"))).toEqual(["/exams"]);
    session.familyKinds = ["SCHOOL", "COLLEGE"];
    expect(await kindHiddenHrefs(ctx(null, "PARENT"))).toEqual([]);
    expect(await kindHiddenHrefs(null)).toEqual([]);
    const search = readFileSync(join(process.cwd(), "src/lib/search.ts"), "utf8");
    expect(search).toMatch(/kindHiddenHrefs\(ctx\)/);
    expect(search).toMatch(/if \(seen\.has\(entry\.href\) \|\| hidden\.includes\(entry\.href\)\) continue;/);
  });
});
