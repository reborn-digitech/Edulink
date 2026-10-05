/**
 * A DUTY DOES NOT OUTLIVE ITS STREAM (A3-S-2, audit of 5 October 2026).
 *
 * The security layer set ZZ Shastri's streams to Engineering + Education,
 * gave a teacher the lab and the practice-teaching duties, set the streams
 * back to Engineering, and found the practice-teaching duty still held — and
 * the registrar's panel, which re-sends the held list, refused on every save
 * (422 "The college's streams do not offer that duty."), so the web could not
 * take it away. Now a stream change takes off every duty the new streams do
 * not offer (audited as people.duties.set with the reason), and setDuties
 * refuses only a duty being GIVEN that is not offered: a held one is dropped.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { createSession, getSession, type ActiveContext } from "@/lib/session";
import { __resetCookies, __setHeaders } from "./stubs/next-headers";
import { createSchool } from "@/lib/superuser";
import { setStreams } from "@/lib/streams";
import { dutiesOfMembership, setDuties } from "@/lib/duties";

const db = new PrismaClient();
const STAMP = Date.now();
const MAIL = (who: string) => `zz-dutydrop-${who}-${STAMP}@test.invalid`;
const ids = { operator: "", college: "", admin: "", faculty: "", facultyM: "", hod: "", hodM: "" };
const operator = () => ({ user: { id: ids.operator, isSuperuser: true, email: MAIL("op") } }) as unknown as ActiveContext;

async function asAdmin(): Promise<ActiveContext> {
  __resetCookies();
  __setHeaders({});
  await createSession(ids.admin, { schoolId: ids.college, role: "ADMIN" });
  return (await getSession())!;
}
const held = async (membershipId: string) => JSON.parse((await db.membership.findUniqueOrThrow({ where: { id: membershipId }, select: { dutiesJson: true } })).dutiesJson) as string[];

beforeAll(async () => {
  ids.operator = (await db.user.create({ data: { name: "ZZ DutyDrop Operator", email: MAIL("op"), isSuperuser: true }, select: { id: true } })).id;
  const made = await createSchool(operator(), { name: `ZZ DutyDrop College ${STAMP}`, contactEmail: MAIL("contact"), timezone: "Asia/Kolkata", kind: "COLLEGE", streams: ["SCIENCE", "EDUCATION"] });
  if (!made.ok) throw new Error(made.errorKey);
  ids.college = made.schoolId;
  await db.school.update({ where: { id: ids.college }, data: { isTestFixture: true } });
  const person = async (who: string, role: string) => {
    const userId = (await db.user.create({ data: { name: `ZZ DutyDrop ${who}`, email: MAIL(who.toLowerCase()) }, select: { id: true } })).id;
    const membershipId = (await db.membership.create({ data: { userId, schoolId: ids.college, role, status: "ACTIVE" }, select: { id: true } })).id;
    return { userId, membershipId };
  };
  ids.admin = (await person("Admin", "ADMIN")).userId;
  ({ userId: ids.faculty, membershipId: ids.facultyM } = await person("Faculty", "FACULTY"));
  ({ userId: ids.hod, membershipId: ids.hodM } = await person("Hod", "HOD"));
});

afterAll(async () => {
  __resetCookies();
  __setHeaders({});
  const users = await db.user.findMany({ where: { email: { contains: `-${STAMP}@test.invalid` } }, select: { id: true } });
  await db.session.deleteMany({ where: { userId: { in: users.map((u) => u.id) } } });
  await db.auditLog.deleteMany({ where: { OR: [{ schoolId: ids.college }, { targetId: ids.college }, { actorUserId: { in: users.map((u) => u.id) } }] } });
  await db.invite.deleteMany({ where: { schoolId: ids.college } });
  await db.school.deleteMany({ where: { id: ids.college } });
  await db.user.deleteMany({ where: { email: { contains: `-${STAMP}@test.invalid` } } });
  await db.$disconnect();
});

describe("a college that drops a stream", () => {
  it("takes off every teacher's duty the new streams do not offer, audited with the reason, and the desk closes", async () => {
    const admin = await asAdmin();
    await setDuties(admin, ids.facultyM, ["LAB_INCHARGE", "PRACTICE_TEACHING_COORDINATOR"]);
    await setDuties(admin, ids.hodM, ["PRACTICE_TEACHING_COORDINATOR", "ANTI_RAGGING_SQUAD"]);
    expect(await setStreams(admin, ["SCIENCE"])).toEqual({ streams: ["SCIENCE"], changed: true });
    expect(await held(ids.facultyM)).toEqual(["LAB_INCHARGE"]);
    expect(await held(ids.hodM)).toEqual(["ANTI_RAGGING_SQUAD"]);
    expect(await dutiesOfMembership(ids.facultyM)).not.toContain("PRACTICE_TEACHING_COORDINATOR");
    const rows = await db.auditLog.findMany({ where: { schoolId: ids.college, action: "people.duties.set", meta: { contains: "college.streams.set" } }, select: { targetId: true } });
    expect(rows.map((r) => r.targetId).sort()).toEqual([ids.facultyM, ids.hodM].sort());
  });

  it("lets the registrar's panel save what it was drawn with: a held duty no longer offered is dropped, a new one still refused", async () => {
    // A college whose duties outlived a change made before this fix: the row as the security probe left it.
    await db.membership.update({ where: { id: ids.facultyM }, data: { dutiesJson: JSON.stringify(["LAB_INCHARGE", "PRACTICE_TEACHING_COORDINATOR"]) } });
    const admin = await asAdmin();
    const saved = await setDuties(admin, ids.facultyM, ["LAB_INCHARGE", "PRACTICE_TEACHING_COORDINATOR"]);
    expect(saved.duties).toEqual(["LAB_INCHARGE"]);
    expect(await held(ids.facultyM)).toEqual(["LAB_INCHARGE"]);
    await expect(setDuties(admin, ids.facultyM, ["LAB_INCHARGE", "STUDIO_COORDINATOR"])).rejects.toMatchObject({ key: "duties.refuseNotOffered" });
    // Saving the same streams again puts a leftover right too.
    await db.membership.update({ where: { id: ids.hodM }, data: { dutiesJson: JSON.stringify(["PRACTICE_TEACHING_COORDINATOR"]) } });
    expect(await setStreams(admin, ["SCIENCE"])).toEqual({ streams: ["SCIENCE"], changed: false });
    expect(await held(ids.hodM)).toEqual([]);
  });
});
