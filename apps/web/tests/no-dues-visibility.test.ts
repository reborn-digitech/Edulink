/**
 * The role audit of 5 Oct 2026, one over-exposure fixed: the librarian, the warden and an HOD each keep one line of
 * a student's no-dues, and read the others only as cleared or not. Before, the single read handed them every desk's
 * amounts — the fee arrears in rupees among them — and the list named every desk holding every student up. The
 * accounts desk, the office and the head read everything, as before.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { createSession, getSession } from "@/lib/session";
import { __resetCookies, __setHeaders } from "../tests/stubs/next-headers";
import { noDuesList, noDuesView } from "@/lib/no-dues";

const db = new PrismaClient();
const STAMP = Date.now();
const SUFFIX = String(STAMP).slice(-6);
const ids = { college: "", users: [] as string[], accounts: "", librarian: "", hod: "", owesFees: "", owesBoth: "" };

async function as(userId: string, role: string) {
  __resetCookies();
  __setHeaders({});
  await createSession(userId, { schoolId: ids.college, role: role as never });
  return (await getSession())!;
}

beforeAll(async () => {
  ids.college = (await db.school.create({ data: { name: `ZZ NoDues ${STAMP}`, slug: `zz-nodues-${STAMP}`, code: `ZND${SUFFIX}`, contactEmail: `zz-nodues-${STAMP}@test.invalid`, timezone: "Asia/Kolkata", kind: "COLLEGE" }, select: { id: true } })).id;
  await db.schoolModule.createMany({ data: ["ACADEMICS", "LIBRARY"].map((module) => ({ schoolId: ids.college, module })) });
  const person = async (who: string, role: string) => {
    const u = await db.user.create({ data: { name: `ZZ NoDues ${who}`, email: `zz-nodues-${who.toLowerCase().replace(/\W/g, "")}-${STAMP}@test.invalid`, isMinor: false, birthdate: new Date("2004-01-01T00:00:00Z") }, select: { id: true } });
    ids.users.push(u.id);
    return { userId: u.id, membershipId: (await db.membership.create({ data: { userId: u.id, schoolId: ids.college, role, status: "ACTIVE" }, select: { id: true } })).id };
  };
  ids.accounts = (await person("Accounts", "ACCOUNTS")).userId;
  ids.librarian = (await person("Librarian", "LIBRARIAN")).userId;
  ids.hod = (await person("Hod", "HOD")).userId;
  ids.owesFees = (await person("Owes Fees", "STUDENT")).membershipId;
  ids.owesBoth = (await person("Owes Both", "STUDENT")).membershipId;
  const year = await db.academicYear.create({ data: { schoolId: ids.college, name: "2026–27", startDate: new Date("2026-06-01T00:00:00Z"), endDate: new Date("2027-05-31T00:00:00Z"), isCurrent: true }, select: { id: true } });
  for (const s of [ids.owesFees, ids.owesBoth]) {
    await db.feeDemand.create({ data: { schoolId: ids.college, studentMembershipId: s, academicYearId: year.id, label: "ZZ Odd term", dueDate: new Date("2026-07-15T00:00:00Z"), grossPaise: 2_500_000, netPaise: 2_500_000, status: "OPEN" } });
  }
  const title = await db.libraryTitle.create({ data: { schoolId: ids.college, title: "ZZ NoDues Book" }, select: { id: true } });
  const copy = await db.libraryCopy.create({ data: { schoolId: ids.college, titleId: title.id, accession: `ZND-${SUFFIX}` }, select: { id: true } });
  const member = await db.libraryMember.create({ data: { schoolId: ids.college, membershipId: ids.owesBoth, kind: "STUDENT_COLLEGE", cardNumber: `ZND${SUFFIX}` }, select: { id: true } });
  const issue = await db.libraryIssue.create({ data: { schoolId: ids.college, copyId: copy.id, memberId: member.id, dueOn: "2026-08-01", returnedAt: new Date(), issuedByUserId: ids.librarian }, select: { id: true } });
  await db.libraryFine.create({ data: { schoolId: ids.college, issueId: issue.id, memberId: member.id, paise: 700, reason: "OVERDUE", raisedByUserId: ids.librarian } });
});

afterAll(async () => {
  __resetCookies();
  await db.session.deleteMany({ where: { userId: { in: ids.users } } });
  await db.school.deleteMany({ where: { id: ids.college } });
  await db.user.deleteMany({ where: { id: { in: ids.users } } });
  await db.$disconnect();
});

describe("a single desk's read of the no-dues", () => {
  it("shows the librarian the library's fine and only whether the fees are cleared", async () => {
    const librarian = await as(ids.librarian, "LIBRARIAN");
    const v = await noDuesView(librarian, ids.owesBoth, "EXAM_FORM");
    expect(v.lines.find((l) => l.desk === "LIBRARY")).toMatchObject({ owedPaise: 700, cleared: false });
    expect(v.lines.find((l) => l.desk === "ACCOUNTS")).toMatchObject({ owedPaise: 0, itemsOut: 0, cleared: false });
    const accounts = await as(ids.accounts, "ACCOUNTS");
    expect((await noDuesView(accounts, ids.owesBoth, "EXAM_FORM")).lines.find((l) => l.desk === "ACCOUNTS")?.owedPaise).toBe(2_500_000);
  });

  it("lists for a single desk only the students its own line holds up, naming only its line", async () => {
    const librarian = await as(ids.librarian, "LIBRARIAN");
    expect((await noDuesList(librarian, "EXAM_FORM")).items.map((i) => [i.studentMembershipId, i.uncleared])).toEqual([[ids.owesBoth, ["LIBRARY"]]]);
    // An HOD keeps the lab's line, which nobody owes: nobody listed, and nobody's fees named.
    const hod = await as(ids.hod, "HOD");
    expect((await noDuesList(hod, "EXAM_FORM")).items).toEqual([]);
    const accounts = await as(ids.accounts, "ACCOUNTS");
    const all = (await noDuesList(accounts, "EXAM_FORM")).items.map((i) => [i.studentMembershipId, [...i.uncleared].sort()]).sort();
    expect(all).toEqual([[ids.owesBoth, ["ACCOUNTS", "LIBRARY"]], [ids.owesFees, ["ACCOUNTS"]]].sort());
  });
});
