/**
 * /api/v1/me names each context's kind of institution (4 Oct 2026), so the
 * phone's picker reads "ZZ Vidya College · College" for a college and the
 * bare name for a school. Two ZZ tenants of this suite's own, one person with
 * a membership at each, all removed after.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { meSchema } from "@edulink/contracts";
import { createSession } from "@/lib/session";
import { __resetCookies, __setHeaders } from "../tests/stubs/next-headers";
import { GET as meGet } from "@/app/api/v1/me/route";

const db = new PrismaClient();
const STAMP = Date.now();
const ids = { college: "", school: "", user: "" };

beforeAll(async () => {
  const mk = (tag: string, kind: string) =>
    db.school.create({ data: { name: `ZZ Kind ${tag} ${STAMP}`, slug: `zz-kind-${tag.toLowerCase()}-${STAMP}`, code: `ZKD${tag[0]}${String(STAMP).slice(-5)}`, contactEmail: `zz-kind-${tag.toLowerCase()}-${STAMP}@test.invalid`, timezone: "Asia/Kolkata", kind }, select: { id: true } });
  ids.college = (await mk("College", "COLLEGE")).id;
  ids.school = (await mk("School", "SCHOOL")).id;
  ids.user = (await db.user.create({ data: { name: "ZZ Kind Person", email: `zz-kind-person-${STAMP}@test.invalid` }, select: { id: true } })).id;
  await db.membership.createMany({
    data: [
      { userId: ids.user, schoolId: ids.college, role: "FACULTY", status: "ACTIVE" },
      { userId: ids.user, schoolId: ids.school, role: "TEACHER", status: "ACTIVE" },
    ],
  });
});

afterAll(async () => {
  __resetCookies();
  __setHeaders({});
  await db.session.deleteMany({ where: { userId: ids.user } });
  await db.membership.deleteMany({ where: { userId: ids.user, schoolId: { in: [ids.college, ids.school] } } });
  await db.school.deleteMany({ where: { id: { in: [ids.college, ids.school] } } });
  await db.user.deleteMany({ where: { id: ids.user } });
  await db.$disconnect();
});

describe("/api/v1/me's contexts", () => {
  it("carry each school's kind, whichever school is active", async () => {
    __resetCookies();
    __setHeaders({});
    await createSession(ids.user, { schoolId: ids.school, role: "TEACHER" });
    const res = await meGet();
    expect(res.status).toBe(200);
    const me = meSchema.parse(await res.json());
    expect(me.institutionKind).toBe("SCHOOL");
    expect(me.contexts).toContainEqual({ schoolId: ids.college, schoolName: `ZZ Kind College ${STAMP}`, role: "FACULTY", institutionKind: "COLLEGE" });
    expect(me.contexts).toContainEqual({ schoolId: ids.school, schoolName: `ZZ Kind School ${STAMP}`, role: "TEACHER", institutionKind: "SCHOOL" });
  });
});
