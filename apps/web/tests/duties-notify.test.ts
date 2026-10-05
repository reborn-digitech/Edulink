/**
 * A NEW DUTY IS TOLD TO THE TEACHER (audit of 5 October 2026, from A3-journeys-40).
 *
 * The registrar granted the NSS duty and faculty02 was not told: the desk
 * simply appeared. Now each duty newly given is a notification to the
 * teacher, in their language (the duty's own name as the title, a fixed
 * sentence as the body); a save that changes nothing, a duty already held
 * and a duty taken away tell nobody.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { createSession, getSession, type ActiveContext } from "@/lib/session";
import { __resetCookies, __setHeaders } from "./stubs/next-headers";
import { createSchool } from "@/lib/superuser";
import { setDuties } from "@/lib/duties";

const db = new PrismaClient();
const STAMP = Date.now();
const MAIL = (who: string) => `zz-dutytell-${who}-${STAMP}@test.invalid`;
const ids = { operator: "", college: "", admin: "", faculty: "", facultyM: "" };
const operator = () => ({ user: { id: ids.operator, isSuperuser: true, email: MAIL("op") } }) as unknown as ActiveContext;

async function asAdmin(): Promise<ActiveContext> {
  __resetCookies();
  __setHeaders({});
  await createSession(ids.admin, { schoolId: ids.college, role: "ADMIN" });
  return (await getSession())!;
}
const told = () => db.notification.findMany({ where: { userId: ids.faculty, bodyKey: "duties.notifyGivenBody" }, orderBy: { createdAt: "asc" }, select: { titleKey: true, title: true, url: true, schoolId: true } });

beforeAll(async () => {
  ids.operator = (await db.user.create({ data: { name: "ZZ DutyTell Operator", email: MAIL("op"), isSuperuser: true }, select: { id: true } })).id;
  const made = await createSchool(operator(), { name: `ZZ DutyTell College ${STAMP}`, contactEmail: MAIL("contact"), timezone: "Asia/Kolkata", kind: "COLLEGE", streams: ["SCIENCE"] });
  if (!made.ok) throw new Error(made.errorKey);
  ids.college = made.schoolId;
  await db.school.update({ where: { id: ids.college }, data: { isTestFixture: true } });
  const person = async (who: string, role: string) => {
    const userId = (await db.user.create({ data: { name: `ZZ DutyTell ${who}`, email: MAIL(who.toLowerCase()) }, select: { id: true } })).id;
    const membershipId = (await db.membership.create({ data: { userId, schoolId: ids.college, role, status: "ACTIVE" }, select: { id: true } })).id;
    return { userId, membershipId };
  };
  ids.admin = (await person("Admin", "ADMIN")).userId;
  ({ userId: ids.faculty, membershipId: ids.facultyM } = await person("Faculty", "FACULTY"));
});

afterAll(async () => {
  __resetCookies();
  __setHeaders({});
  const users = await db.user.findMany({ where: { email: { contains: `-${STAMP}@test.invalid` } }, select: { id: true } });
  await db.session.deleteMany({ where: { userId: { in: users.map((u) => u.id) } } });
  await db.notification.deleteMany({ where: { userId: { in: users.map((u) => u.id) } } });
  await db.auditLog.deleteMany({ where: { OR: [{ schoolId: ids.college }, { targetId: ids.college }, { actorUserId: { in: users.map((u) => u.id) } }] } });
  await db.invite.deleteMany({ where: { schoolId: ids.college } });
  await db.school.deleteMany({ where: { id: ids.college } });
  await db.user.deleteMany({ where: { email: { contains: `-${STAMP}@test.invalid` } } });
  await db.$disconnect();
});

describe("the registrar gives a duty", () => {
  it("tells the teacher of each duty newly given, and of nothing else", async () => {
    const admin = await asAdmin();
    await setDuties(admin, ids.facultyM, ["NSS_OFFICER"]);
    expect(await told()).toEqual([{ titleKey: "duties.NSS_OFFICER.name", title: "NSS programme officer", url: "/faculty", schoolId: ids.college }]);
    // The same list again: nothing changes, nobody is told.
    await setDuties(admin, ids.facultyM, ["NSS_OFFICER"]);
    expect(await told()).toHaveLength(1);
    // One more beside the one held: told of the new one only.
    await setDuties(admin, ids.facultyM, ["NSS_OFFICER", "LAB_INCHARGE"]);
    expect((await told()).map((n) => n.titleKey)).toEqual(["duties.NSS_OFFICER.name", "duties.LAB_INCHARGE.name"]);
    // Taken away: nobody is told.
    await setDuties(admin, ids.facultyM, ["LAB_INCHARGE"]);
    expect(await told()).toHaveLength(2);
  });
});
