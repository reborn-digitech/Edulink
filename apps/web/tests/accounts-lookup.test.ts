/**
 * The accounts desk's look-up (5 Oct 2026, the campaign's ACCOUNTS phone recommendation): a student of the caller's
 * college by the start of the PRN or college code, or part of the name, for the desk to open the ledger and the
 * no-dues from a phone. Read only; the desk roles the ledger names; never another college's student; live students
 * only; at most twenty.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { createSession } from "@/lib/session";
import { __resetCookies, __setHeaders } from "../tests/stubs/next-headers";
import { GET as lookupGet } from "@/app/api/v1/accounts/lookup/route";

const db = new PrismaClient();
const STAMP = Date.now();
const SUFFIX = String(STAMP).slice(-6);
const ids = { college: "", other: "", school: "", accounts: "", librarian: "", schoolAdmin: "", users: [] as string[], s1: "", s2: "", left: "", foreign: "" };

async function as(userId: string, schoolId: string, role: string) {
  __resetCookies();
  __setHeaders({});
  await createSession(userId, { schoolId, role: role as never });
}
const lookup = async (q: string) => {
  const res = await lookupGet(new Request(`http://localhost/api/v1/accounts/lookup?q=${encodeURIComponent(q)}`));
  return { status: res.status, body: (await res.json()) as { items?: { studentMembershipId: string; name: string; prn: string | null; studentCode: string | null }[]; code?: string } };
};

beforeAll(async () => {
  const mk = (tag: string, kind: string) => db.school.create({ data: { name: `ZZ Lookup ${tag} ${STAMP}`, slug: `zz-lookup-${tag.toLowerCase()}-${STAMP}`, code: `ZL${tag[0]}${SUFFIX}`, contactEmail: `zz-lookup-${tag.toLowerCase()}-${STAMP}@test.invalid`, timezone: "Asia/Kolkata", kind }, select: { id: true } });
  ids.college = (await mk("College", "COLLEGE")).id;
  ids.other = (await mk("Other", "COLLEGE")).id;
  ids.school = (await mk("School", "SCHOOL")).id;
  const user = async (who: string) => {
    const u = await db.user.create({ data: { name: `ZZ Lookup ${who}`, email: `zz-lookup-${who.toLowerCase().replace(/\W/g, "")}-${STAMP}@test.invalid` }, select: { id: true } });
    ids.users.push(u.id);
    return u.id;
  };
  ids.accounts = await user("Accounts");
  ids.librarian = await user("Librarian");
  ids.schoolAdmin = await user("SchoolAdmin");
  await db.membership.createMany({
    data: [
      { userId: ids.accounts, schoolId: ids.college, role: "ACCOUNTS", status: "ACTIVE" },
      { userId: ids.librarian, schoolId: ids.college, role: "LIBRARIAN", status: "ACTIVE" },
      { userId: ids.schoolAdmin, schoolId: ids.school, role: "ADMIN", status: "ACTIVE" },
    ],
  });
  const student = async (who: string, schoolId: string, prn: string, code: string, leftAt: Date | null = null) => {
    const m = await db.membership.create({ data: { userId: await user(who), schoolId, role: "STUDENT", status: "ACTIVE", studentCode: code, leftAt }, select: { id: true } });
    await db.pupilRecord.create({ data: { schoolId, studentMembershipId: m.id, prn } });
    return m.id;
  };
  ids.s1 = await student("Asha Patil", ids.college, `ZZPRN${SUFFIX}01`, `ZZL-${SUFFIX}-01`);
  ids.s2 = await student("Kunal Rao", ids.college, `ZZPRN${SUFFIX}02`, `ZZL-${SUFFIX}-02`);
  ids.left = await student("Left Long Ago", ids.college, `ZZPRN${SUFFIX}03`, `ZZL-${SUFFIX}-03`, new Date("2025-05-01T00:00:00Z"));
  ids.foreign = await student("Asha Elsewhere", ids.other, `ZZPRN${SUFFIX}09`, `ZZL-${SUFFIX}-09`);
});

afterAll(async () => {
  __resetCookies();
  await db.rateLimit.deleteMany({ where: { bucket: { in: [`heavy:${ids.accounts}`, `heavy:${ids.librarian}`, `heavy:${ids.schoolAdmin}`] } } });
  await db.session.deleteMany({ where: { userId: { in: ids.users } } });
  await db.school.deleteMany({ where: { id: { in: [ids.college, ids.other, ids.school] } } });
  await db.user.deleteMany({ where: { id: { in: ids.users } } });
  await db.$disconnect();
});

describe("the accounts desk's look-up", () => {
  it("finds a student by the start of the PRN, and by part of the name, at this college only", async () => {
    await as(ids.accounts, ids.college, "ACCOUNTS");
    const byPrn = await lookup(`zzprn${SUFFIX}01`);
    expect(byPrn.status).toBe(200);
    expect(byPrn.body.items).toEqual([{ studentMembershipId: ids.s1, name: "ZZ Lookup Asha Patil", prn: `ZZPRN${SUFFIX}01`, studentCode: `ZZL-${SUFFIX}-01`, programme: null, yearOfStudy: null }]);
    // "Asha" is at both colleges: only this one's.
    const byName = await lookup("asha");
    expect(byName.body.items?.map((i) => i.studentMembershipId)).toEqual([ids.s1]);
    // Every PRN of this college's live students, never the one who left, never the other college's.
    const all = await lookup(`ZZPRN${SUFFIX}`);
    expect(all.body.items?.map((i) => i.studentMembershipId).sort()).toEqual([ids.s1, ids.s2].sort());
    // By the college code.
    expect((await lookup(`ZZL-${SUFFIX}-02`)).body.items?.map((i) => i.studentMembershipId)).toEqual([ids.s2]);
  });

  it("refuses a query too short, a role the ledger does not name, and a school", async () => {
    await as(ids.accounts, ids.college, "ACCOUNTS");
    expect((await lookup("a")).status).toBe(422);
    await as(ids.librarian, ids.college, "LIBRARIAN");
    expect((await lookup("asha")).status).toBe(403);
    await as(ids.schoolAdmin, ids.school, "ADMIN");
    const school = await lookup("asha");
    expect(school.status).toBe(403);
  });
});
