/**
 * TA-179 (testing analysis of 13 November 2026, Medium, Functional): a walk-in
 * family's offer could not be accepted through any page or door.
 *
 * The office enters a walk-in (no applicant account) and offers the seat; the
 * offer email tells the family to contact the office; the family says yes at
 * the counter. The only answer door was the family's, PARENT only, and Admit
 * refuses an application that is not ACCEPTED, so the offer lapsed on its
 * date. And the other way round, the web's respond action let the office
 * answer for a family that has an account.
 *
 * Now POST /api/v1/office/admissions/applications/{id}/respond (ADMIN and
 * PRINCIPAL, a school's door) records a walk-in's answer, the web page and the
 * phone's screen draw it while `can.respond` holds, and the office's answer
 * for an application with an account is refused.
 *
 * One ZZ school of this suite's own, removed afterwards with the pupils it
 * admitted and the people made here.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { createSession, getSession, type ActiveContext } from "@/lib/session";
import { __resetCookies, __setHeaders } from "../tests/stubs/next-headers";
import { admit, applicationView, offer, officeApply, respond } from "@/lib/admissions";
import { AccessError } from "@/lib/access-error";
import { POST as officeRespond } from "@/app/api/v1/office/admissions/applications/[applicationId]/respond/route";

const db = new PrismaClient();
const STAMP = Date.now();
const SUFFIX = String(STAMP).slice(-6);
const MAIL = (who: string) => `zz-tapia-respond-${who}-${STAMP}@test.invalid`;
const ids = { school: "", year: "", cycle: "", admin: "", adminM: "", family: "", walkIn: "", familyApp: "" };
let office: ActiveContext;

async function door(applicationId: string, body: unknown): Promise<Response> {
  const path = `/api/v1/office/admissions/applications/${applicationId}/respond`;
  __resetCookies();
  __setHeaders({ "x-edulink-route": `POST ${path}` });
  await createSession(ids.admin, { schoolId: ids.school, role: "ADMIN" });
  return officeRespond(new Request(`http://localhost${path}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }), { params: Promise.resolve({ applicationId }) });
}

beforeAll(async () => {
  process.env.EMAIL_TRANSPORT ??= "devbox";
  ids.school = (
    await db.school.create({
      data: { name: `ZZ TAPIA Respond ${STAMP}`, slug: `zz-tapia-respond-${STAMP}`, code: `ZPS${SUFFIX}`, contactEmail: MAIL("contact"), timezone: "Asia/Kolkata", locale: "en", verifiedAt: new Date(), profilePublishedAt: new Date(), isTestFixture: true },
      select: { id: true },
    })
  ).id;
  ids.admin = (await db.user.create({ data: { name: "ZZ TAPIA Respond Admin", email: MAIL("admin"), prefs: "{}" }, select: { id: true } })).id;
  ids.adminM = (await db.membership.create({ data: { userId: ids.admin, schoolId: ids.school, role: "ADMIN", status: "ACTIVE" }, select: { id: true } })).id;
  ids.family = (await db.user.create({ data: { name: "ZZ TAPIA Respond Family", email: MAIL("family"), prefs: "{}" }, select: { id: true } })).id;
  ids.year = (await db.academicYear.create({ data: { schoolId: ids.school, name: "2026–27", startDate: new Date("2026-06-01T00:00:00Z"), endDate: new Date("2027-04-30T00:00:00Z"), isCurrent: true }, select: { id: true } })).id;
  ids.cycle = (await db.admissionCycle.create({ data: { schoolId: ids.school, academicYearId: ids.year, name: "ZZ TAPIA Respond cycle", gradesJson: JSON.stringify([{ grade: "5", seats: 5 }]), testRequired: false, status: "OPEN" }, select: { id: true } })).id;
  __resetCookies();
  __setHeaders({});
  await createSession(ids.admin, { schoolId: ids.school, role: "ADMIN" });
  office = (await getSession())!;

  // A walk-in, offered; and a family's own application (an account behind it), offered too.
  ids.walkIn = (await officeApply(office, { cycleId: ids.cycle, childName: "ZZ TAPIA Walk-in Child", childBirthdate: "2016-02-02", gradeApplied: "5", applicantName: "ZZ TAPIA Walk-in Parent", applicantPhone: "+919800000077" })).id;
  await offer(office, ids.walkIn, { expiresOn: null });
  ids.familyApp = (
    await db.application.create({
      data: { schoolId: ids.school, cycleId: ids.cycle, number: 900, serial: `ZZS-${SUFFIX}-900`, applicantUserId: ids.family, applicantName: "ZZ TAPIA Respond Family", childName: "ZZ TAPIA Family Child", childBirthdate: new Date("2016-03-03T00:00:00Z"), gradeApplied: "5", status: "OFFERED", offeredAt: new Date(), relation: "PARENT" },
      select: { id: true },
    })
  ).id;
}, 60_000);

afterAll(async () => {
  __resetCookies();
  __setHeaders({});
  const pupils = ids.school ? await db.membership.findMany({ where: { schoolId: ids.school, role: "STUDENT" }, select: { userId: true } }) : [];
  const userIds = [ids.admin, ids.family, ...pupils.map((p) => p.userId)].filter(Boolean);
  await db.session.deleteMany({ where: { userId: { in: userIds } } });
  await db.notification.deleteMany({ where: { OR: [{ schoolId: ids.school }, { userId: { in: userIds } }] } });
  if (ids.school) {
    await db.guardianship.deleteMany({ where: { studentSchoolId: ids.school } });
    await db.auditLog.deleteMany({ where: { schoolId: ids.school } });
    await db.school.deleteMany({ where: { id: ids.school } });
  }
  await db.user.deleteMany({ where: { id: { in: userIds } } });
  await db.$disconnect();
});

describe("TA-179: the office records a walk-in family's answer", () => {
  it("TA-179: the office's view of a walk-in's open offer says it may record the answer; of a family's own, it may not", async () => {
    expect((await applicationView(office, ids.walkIn)).can.respond).toBe(true);
    expect((await applicationView(office, ids.familyApp)).can.respond).toBe(false);
  });

  it("TA-179: POST …/respond records the walk-in's yes (200), and Admit then gives the seat", async () => {
    const res = await door(ids.walkIn, { answer: "ACCEPT" });
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ id: ids.walkIn, status: "ACCEPTED" });
    const admitted = await admit(office, ids.walkIn, {});
    expect(admitted.studentMembershipId).toBeTruthy();
    expect((await db.application.findUniqueOrThrow({ where: { id: ids.walkIn }, select: { status: true } })).status).toBe("ADMITTED");
    expect(await db.auditLog.count({ where: { schoolId: ids.school, action: "admissions.respond", targetId: ids.walkIn, actorUserId: ids.admin } })).toBe(1);
  });

  it("TA-179: the office's answer for a family with an account is refused (403), by the door and the library, and the offer stands", async () => {
    const res = await door(ids.familyApp, { answer: "ACCEPT" });
    expect(res.status).toBe(403);
    const refused = await respond(office, ids.familyApp, { answer: "ACCEPT" }).then(() => null, (error: unknown) => error);
    expect(refused).toBeInstanceOf(AccessError);
    expect((refused as AccessError).key).toBe("admissions.refuseFamilyAnswers");
    expect((await db.application.findUniqueOrThrow({ where: { id: ids.familyApp }, select: { status: true } })).status).toBe("OFFERED");
  });
});
