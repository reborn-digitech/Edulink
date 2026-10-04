/**
 * GET /api/v1/principal/college (campaign 2026-10-04, G-4): the head's and
 * the registrar's college on the phone, read from principalCollege() — the
 * web's /principal/college — and cut to a card. A school answers 404, a
 * teacher 403, signed out 401; the registrar reads what the head reads.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { principalCollegeSchema } from "@edulink/contracts";
import { createSession } from "@/lib/session";
import { __resetCookies } from "../tests/stubs/next-headers";
import { GET } from "@/app/api/v1/principal/college/route";

const db = new PrismaClient();
const STAMP = Date.now();
const SUFFIX = String(STAMP).slice(-5);
const ids = { college: "", school: "", principal: "", registrar: "", faculty: "", schoolHead: "", teacher: "" };
const MAIL = (who: string) => `zz-pcol-${who}-${STAMP}@test.invalid`;

beforeAll(async () => {
  ids.college = (await db.school.create({ data: { name: `ZZ PCol College ${STAMP}`, slug: `zz-pcol-c-${STAMP}`, code: `ZPCC${SUFFIX}`, contactEmail: MAIL("college"), timezone: "Asia/Kolkata", kind: "COLLEGE" }, select: { id: true } })).id;
  ids.school = (await db.school.create({ data: { name: `ZZ PCol School ${STAMP}`, slug: `zz-pcol-s-${STAMP}`, code: `ZPCS${SUFFIX}`, contactEmail: MAIL("school"), timezone: "Asia/Kolkata" }, select: { id: true } })).id;
  const mk = async (who: keyof typeof ids) => (ids[who] = (await db.user.create({ data: { name: `ZZ PCol ${who}`, email: MAIL(who) }, select: { id: true } })).id);
  await Promise.all([mk("principal"), mk("registrar"), mk("faculty"), mk("schoolHead"), mk("teacher")]);
  await db.membership.createMany({
    data: [
      { userId: ids.principal, schoolId: ids.college, role: "PRINCIPAL", status: "ACTIVE" },
      { userId: ids.registrar, schoolId: ids.college, role: "ADMIN", status: "ACTIVE" },
      { userId: ids.faculty, schoolId: ids.college, role: "FACULTY", status: "ACTIVE" },
      { userId: ids.schoolHead, schoolId: ids.school, role: "PRINCIPAL", status: "ACTIVE" },
      { userId: ids.teacher, schoolId: ids.college, role: "TEACHER", status: "ACTIVE" },
    ],
  });
});

afterAll(async () => {
  __resetCookies();
  const users = [ids.principal, ids.registrar, ids.faculty, ids.schoolHead, ids.teacher];
  await db.session.deleteMany({ where: { userId: { in: users } } });
  await db.school.deleteMany({ where: { id: { in: [ids.college, ids.school] } } });
  await db.user.deleteMany({ where: { email: { contains: `-${STAMP}@test.invalid` } } });
  await db.$disconnect();
});

async function as(userId: string | null, schoolId: string, role: "PRINCIPAL" | "ADMIN" | "TEACHER") {
  __resetCookies();
  if (userId) await createSession(userId, { schoolId, role });
}

describe("the college card's door", () => {
  it("answers the head and the registrar with the card, the approvals named by key with their web page", async () => {
    for (const [userId, role] of [[ids.principal, "PRINCIPAL"], [ids.registrar, "ADMIN"]] as const) {
      await as(userId, ids.college, role);
      const res = await GET();
      expect({ role, status: res.status }).toEqual({ role, status: 200 });
      const card = principalCollegeSchema.parse(await res.json());
      expect(card.school.name).toBe(`ZZ PCol College ${STAMP}`);
      expect(card.approvals.map((a) => a.key).sort()).toEqual(["concession", "condonation", "grace", "lateRegistration", "leave", "payroll", "signoff"]);
      expect(card.approvals.every((a) => a.href.startsWith("/") && a.count >= 0)).toBe(true);
      // The faculty member on the register, unmarked until they check in or the office marks them.
      expect(card.faculty).toMatchObject({ total: 1 });
    }
  });

  it("is a 404 at a school, a 403 to a teacher, and a 401 signed out", async () => {
    await as(ids.schoolHead, ids.school, "PRINCIPAL");
    expect((await GET()).status).toBe(404);
    await as(ids.teacher, ids.college, "TEACHER");
    expect((await GET()).status).toBe(403);
    await as(null, ids.college, "PRINCIPAL");
    expect((await GET()).status).toBe(401);
  });
});
