/**
 * QA-19 (QA campaign of 24 October 2026, UI-01): pages a limited role shares
 * with the older roles drew links its gate refuses — the global feed's "Our
 * school's feed", "Upcoming birthdays" and Comment for a driver, the library
 * desk and a warden; the placement tabs for the IQAC; a person's name for an
 * alumnus and the college desks — and each landed on "Where would you like to
 * go?". `pageOpener` answers, by the gate's own page rule, which links to draw.
 *
 * Read-only against the ZZ fixtures (zz-fixtures.ts buildModuleRoles and
 * buildColleges): Northgate's module roles and ZZ Vidya College's desks.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { pageOpener } from "@/lib/page-links";
import { modulePagePermitted } from "@/lib/role-gate";
import { enabledModules } from "@/lib/modules";
import type { Role } from "@/lib/constants";

const db = new PrismaClient();
type Member = { role: Role; schoolId: string; membershipId: string };
const members: Partial<Record<Role, Member>> = {};

async function memberOf(slug: string, role: Role): Promise<Member> {
  const m = await db.membership.findFirstOrThrow({ where: { school: { slug }, role, status: "ACTIVE", leftAt: null }, select: { id: true, schoolId: true }, orderBy: { joinedAt: "asc" } });
  return { role, schoolId: m.schoolId, membershipId: m.id };
}

beforeAll(async () => {
  for (const role of ["DRIVER", "LIBRARIAN", "WARDEN", "ALUMNUS", "TEACHER"] as Role[]) members[role] = await memberOf("zz-northgate-school", role);
  for (const role of ["IQAC", "FACULTY", "TPO"] as Role[]) members[role] = await memberOf("zz-vidya-college", role);
});
afterAll(async () => {
  await db.$disconnect();
});

describe("pageOpener draws only what the gate opens (QA-19)", () => {
  it("a driver, the library desk and a warden: the global feed, not the school's feed, the birthdays or a post's page", async () => {
    for (const role of ["DRIVER", "LIBRARIAN", "WARDEN"] as Role[]) {
      const opens = await pageOpener(members[role]!);
      expect(opens("/bulletin/global"), role).toBe(true);
      expect(opens("/bulletin/global?category=EVENTS"), role).toBe(true);
      expect(opens("/bulletin"), role).toBe(false);
      expect(opens("/bulletin/celebrations"), role).toBe(false);
      expect(opens("/bulletin/cmt7f4491000gy2exrsvmdzp3"), role).toBe(false);
      expect(opens("/notifications"), role).toBe(true);
    }
  });

  it("an alumnus: the school's feed, its posts and (under the feed's prefix) the global feed, but no profile", async () => {
    const opens = await pageOpener(members.ALUMNUS!);
    expect(opens("/bulletin")).toBe(true);
    expect(opens("/bulletin/cmt7f4491000gy2exrsvmdzp3")).toBe(true);
    expect(opens("/people/cmut2zwqy00040rf81yd4htvl")).toBe(false);
    expect(opens("/bulletin/global")).toBe(true);
  });

  it("the IQAC: the placement analytics, none of the cell's other tabs", async () => {
    const opens = await pageOpener(members.IQAC!);
    expect(opens("/placement/analytics")).toBe(true);
    for (const tab of ["/placement", "/placement/drives", "/placement/students", "/placement/companies", "/placement/internships", "/placement/talks", "/placement/training"]) expect(opens(tab), tab).toBe(false);
    // The placement officer holds the whole cell.
    const tpo = await pageOpener(members.TPO!);
    expect(tpo("/placement/drives")).toBe(true);
  });

  it("the college desks read no profiles; a teacher is never second-guessed", async () => {
    expect((await pageOpener(members.FACULTY!))("/people/x")).toBe(false);
    const teacher = await pageOpener(members.TEACHER!);
    expect(teacher("/people/x")).toBe(true);
    expect(teacher("/anything/at/all")).toBe(true);
  });

  it("answers exactly as the gate's page rule does", async () => {
    const m = members.LIBRARIAN!;
    const on = await enabledModules(m.schoolId);
    const opens = await pageOpener(m);
    for (const path of ["/library", "/library/catalogue", "/bulletin", "/bulletin/global", "/people/x", "/admin", "/accounts/no-dues"]) expect(opens(path), path).toBe(modulePagePermitted("LIBRARIAN", path, on));
  });
});
