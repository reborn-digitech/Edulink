/**
 * TA-038 (testing analysis of 13 November 2026, Medium, Functional): a person who is an expert and also a member,
 * guardian or recruiter could not enter the expert area. resolveContext sent them to the chooser (two ways in), the
 * chooser drew no expert entry, GET /api/v1/me listed none, and setActiveContext refused EXPERT for want of a
 * school and a membership. Now setActiveContext takes EXPERT on a live ExpertProfile (as RECRUITER on a live
 * RecruiterProfile), and /me lists the expert's and the recruiter's ways in for the phone's chooser.
 *
 * Every row is one this suite makes (a stamped ZZ school, @test.invalid accounts) and removes.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { generateToken, hashToken } from "@/lib/crypto";
import { createSession, getSession, setActiveContext } from "@/lib/session";
import { meBody } from "@/lib/api-v1";
import { __resetCookies, __setHeaders } from "../tests/stubs/next-headers";

const db = new PrismaClient();
const STAMP = Date.now();
const MAIL = (who: string) => `zz-taauth-ex-${who}-${STAMP}@test.invalid`;
let schoolId = "";
let teacherId = "";
let profileId = "";

beforeAll(async () => {
  schoolId = (
    await db.school.create({
      data: { name: `ZZ TA Auth Expert ${STAMP}`, slug: `zz-taauth-ex-${STAMP}`, code: `ZTAE${String(STAMP).slice(-6)}`, contactEmail: MAIL("school"), timezone: "Asia/Kolkata" },
      select: { id: true },
    })
  ).id;
  teacherId = (await db.user.create({ data: { name: "ZZ TA Auth Teacher Expert", email: MAIL("teacher"), emailVerifiedAt: new Date(), prefs: "{}" }, select: { id: true } })).id;
  await db.membership.create({ data: { userId: teacherId, schoolId, role: "TEACHER", status: "ACTIVE" } });
  profileId = (await db.expertProfile.create({ data: { userId: teacherId, headline: `ZZ TA Auth Careers ${STAMP}` }, select: { id: true } })).id;
});

afterAll(async () => {
  __resetCookies();
  __setHeaders({});
  await db.expertProfile.deleteMany({ where: { id: profileId } });
  await db.session.deleteMany({ where: { userId: teacherId } });
  await db.auditLog.deleteMany({ where: { OR: [{ schoolId }, { actorUserId: teacherId }] } });
  await db.membership.deleteMany({ where: { schoolId } });
  await db.user.deleteMany({ where: { id: teacherId } });
  await db.school.deleteMany({ where: { id: schoolId } });
  await db.$disconnect();
});

async function freshSession(): Promise<string> {
  return (await db.session.create({ data: { userId: teacherId, tokenHash: hashToken(generateToken()), expiresAt: new Date(Date.now() + 86_400_000) }, select: { id: true } })).id;
}

describe.sequential("TA-038: a teacher who is also an expert can enter the expert area", () => {
  it("TA-038: setActiveContext takes EXPERT on a live profile, and the session reads back as EXPERT with no school", async () => {
    const sessionId = await freshSession();
    expect(await setActiveContext(sessionId, teacherId, { schoolId: null, role: "EXPERT" })).toBe(true);
    const row = await db.session.findUniqueOrThrow({ where: { id: sessionId }, select: { activeRole: true, activeSchoolId: true } });
    expect(row).toEqual({ activeRole: "EXPERT", activeSchoolId: null });
  });

  it("TA-038: GET /api/v1/me lists the expert's way in beside the school's", async () => {
    __resetCookies();
    __setHeaders({});
    await createSession(teacherId, { schoolId, role: "TEACHER" });
    const me = await meBody((await getSession())!);
    expect(me.contexts).toEqual(expect.arrayContaining([expect.objectContaining({ schoolId, role: "TEACHER" }), expect.objectContaining({ schoolId: null, role: "EXPERT" })]));
  });

  it("TA-038: a disabled profile is refused and listed nowhere", async () => {
    await db.expertProfile.update({ where: { id: profileId }, data: { disabledAt: new Date() } });
    try {
      expect(await setActiveContext(await freshSession(), teacherId, { schoolId: null, role: "EXPERT" })).toBe(false);
      const me = await meBody((await getSession())!);
      expect(me.contexts.some((c) => c.role === "EXPERT")).toBe(false);
    } finally {
      await db.expertProfile.update({ where: { id: profileId }, data: { disabledAt: null } });
    }
  });
});
