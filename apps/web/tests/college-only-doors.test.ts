/**
 * ONE ANSWER FOR A COLLEGE'S DOOR AT A SCHOOL (W-17, the campaign of
 * 4 October 2026). A college-only door called at a school used to answer
 * three ways: the module gate's 403 MODULE_OFF, a 403 FORBIDDEN "This is for
 * a college." (the alumni college doors, the college profile), and a 404
 * "this is for a college" (the accounts desk, the student's ledger and
 * scholarships, the college settings of the library, hostel and bus) — and a
 * guardian, whose session names no school, got the 404 where the pupil got
 * MODULE_OFF. Now every one answers 403 with code MODULE_OFF, the envelope
 * the gate itself writes, so the phone and the sweep read "college-only" the
 * way they read "switched off".
 *
 * Read at ZZ Northgate (a school) with sessions minted for its ZZ people and
 * deleted again; nothing is written but the sessions.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { createSession } from "@/lib/session";
import { __resetCookies, __setHeaders } from "../tests/stubs/next-headers";
import { GET as adminAlumniCollegeGet } from "@/app/api/v1/admin/alumni/college/route";
import { GET as alumniCollegeGet } from "@/app/api/v1/alumni/college/route";
import { GET as accountsOverviewGet } from "@/app/api/v1/accounts/overview/route";
import { GET as accountsSettingsGet, POST as accountsSettingsPost } from "@/app/api/v1/accounts/settings/route";
import { POST as raiseDemandsPost } from "@/app/api/v1/accounts/demands/raise/route";
import { GET as studentLedgerGet } from "@/app/api/v1/student/ledger/route";
import { GET as studentScholarshipsGet } from "@/app/api/v1/student/scholarships/route";
import { POST as libraryCollegeSettingsPost } from "@/app/api/v1/library/college-settings/route";
import { POST as collegeProfilePost } from "@/app/api/v1/admin/college-profile/route";
import { GET as examCellGet } from "@/app/api/v1/exam-cell/route";

const db = new PrismaClient();
const minted: string[] = [];
const who = { school: "", admin: "", pupil: "", parent: "", alumnus: "" };

const get = (path: string) => new Request(`http://localhost${path}`);
const json = (path: string, body: unknown) => new Request(`http://localhost${path}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });

async function as(userId: string, schoolId: string | null, role: string, route?: string) {
  __resetCookies();
  __setHeaders(route ? { "x-edulink-route": route } : {});
  minted.push(await createSession(userId, { schoolId, role: role as never }));
}

/** The answer, read as the phone reads it. */
async function answer(res: Response): Promise<{ status: number; code: unknown; keys: string[]; error: unknown }> {
  const body = (await res.json()) as Record<string, unknown>;
  return { status: res.status, code: body.code, keys: Object.keys(body).sort(), error: body.error };
}

beforeAll(async () => {
  const school = await db.school.findUniqueOrThrow({ where: { slug: "zz-northgate-school" }, select: { id: true, kind: true } });
  expect(school.kind).toBe("SCHOOL");
  who.school = school.id;
  const member = async (email: string, role: string) => (await db.membership.findFirstOrThrow({ where: { schoolId: school.id, role, status: "ACTIVE", leftAt: null, user: { email } }, select: { userId: true, id: true } }));
  who.admin = (await member("zz.admin@zz.test", "ADMIN")).userId;
  const pupil = await member("zz.pupil01@zz.test", "STUDENT");
  who.pupil = pupil.userId;
  who.alumnus = (await member("zz.alumni01@zz.test", "ALUMNUS")).userId;
  who.parent = (await db.guardianship.findFirstOrThrow({ where: { studentMembershipId: pupil.id, status: "ACTIVE" }, select: { parentUserId: true } })).parentUserId;
});

afterAll(async () => {
  if (minted.length) await db.session.deleteMany({ where: { id: { in: minted } } });
  await db.$disconnect();
});

describe("a college's door at ZZ Northgate answers 403 MODULE_OFF, the gate's own envelope", () => {
  it("the module gate's answer, for the shape every college-only door now copies", async () => {
    await as(who.admin, who.school, "ADMIN", "GET /api/v1/exam-cell");
    const gate = await answer(await examCellGet());
    expect(gate).toMatchObject({ status: 403, code: "MODULE_OFF", keys: ["code", "error"] });
  });

  it("the alumni college doors, which said 403 FORBIDDEN \"This is for a college.\"", async () => {
    await as(who.admin, who.school, "ADMIN");
    const office = await answer(await adminAlumniCollegeGet());
    expect(office).toMatchObject({ status: 403, code: "MODULE_OFF", keys: ["code", "error"] });
    await as(who.alumnus, who.school, "ALUMNUS");
    const alumnus = await answer(await alumniCollegeGet());
    expect(alumnus).toMatchObject({ status: 403, code: "MODULE_OFF", keys: ["code", "error"] });
    expect(typeof alumnus.error).toBe("string");
  });

  it("the accounts desk and the college settings, which said 404 \"this is for a college\"", async () => {
    await as(who.admin, who.school, "ADMIN");
    for (const res of [
      await accountsOverviewGet(),
      await accountsSettingsGet(),
      await accountsSettingsPost(json("/api/v1/accounts/settings", { concessionLimitPaise: 500000 })),
      await raiseDemandsPost(json("/api/v1/accounts/demands/raise", {})),
      await libraryCollegeSettingsPost(json("/api/v1/library/college-settings", { facultyLimit: 10, facultyLoanDays: 90, collegeStudentLimit: 4, collegeStudentLoanDays: 15, bookBankExtra: 2 })),
    ]) {
      expect(await answer(res)).toMatchObject({ status: 403, code: "MODULE_OFF", keys: ["code", "error"] });
    }
  });

  it("the college profile, which said 403 FORBIDDEN \"Only a college keeps these references.\"", async () => {
    await as(who.admin, who.school, "ADMIN");
    const res = await answer(await collegeProfilePost(json("/api/v1/admin/college-profile", { aisheCode: "C-12345" })));
    expect(res).toMatchObject({ status: 403, code: "MODULE_OFF" });
    expect((await db.school.findUniqueOrThrow({ where: { id: who.school }, select: { aisheCode: true } })).aisheCode).not.toBe("C-12345");
  });

  it("the student's ledger and scholarships: the pupil and the guardian (no school on the session) are answered alike", async () => {
    await as(who.pupil, who.school, "STUDENT");
    expect(await answer(await studentLedgerGet(get("/api/v1/student/ledger")))).toMatchObject({ status: 403, code: "MODULE_OFF" });
    await as(who.parent, null, "PARENT");
    expect(await answer(await studentLedgerGet(get("/api/v1/student/ledger")))).toMatchObject({ status: 403, code: "MODULE_OFF" });
    expect(await answer(await studentScholarshipsGet(get("/api/v1/student/scholarships")))).toMatchObject({ status: 403, code: "MODULE_OFF" });
  });
});
