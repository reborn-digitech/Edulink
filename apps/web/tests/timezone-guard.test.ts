/**
 * A ZONE NO RUNTIME KNOWS IS REFUSED, AND ONE ROW'S CANNOT TAKE DOWN THE
 * OPERATOR'S LIST (A3-journeys-2, audit of 5 October 2026).
 *
 * Onboarding stored "Mars/Olympus" unchecked; /root/colleges and
 * GET /api/v1/operator/colleges then answered 500 for EVERY college, because
 * each row's health cut "today" in its zone. Now the operator's onboarding and
 * correction (createSchool, updateSchool, onboardSchool), a school's own
 * settings and the registration wizard (schoolDetailsSchema) and an expert's
 * profile refuse it, with isValidTimeZone as the one test; and the list reads
 * a row written before that check in India's zone rather than failing.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { isValidTimeZone, safeTimeZone } from "@/lib/dates";
import { schoolDetailsSchema } from "@/lib/validation";
import { createSchool, updateSchool } from "@/lib/superuser";
import { onboardSchool } from "@/lib/subscriptions";
import { listColleges } from "@/lib/operator-college";
import { monthKeyFor } from "@/lib/plans";

const db = new PrismaClient();
const STAMP = Date.now();
const SUFFIX = String(STAMP).slice(-6);
let operatorUserId = "";
let collegeId = "";
const operator = () => ({ user: { id: operatorUserId, isSuperuser: true, email: `zz-tz-op-${STAMP}@test.invalid` } }) as unknown as Parameters<typeof listColleges>[0];

beforeAll(async () => {
  operatorUserId = (await db.user.create({ data: { name: "ZZ TZ Operator", email: `zz-tz-op-${STAMP}@test.invalid`, isSuperuser: true }, select: { id: true } })).id;
  collegeId = (await db.school.create({ data: { name: `ZZ TZ College ${STAMP}`, slug: `zz-tz-college-${STAMP}`, code: `ZTZ${SUFFIX}`, contactEmail: `zz-tz-${STAMP}@test.invalid`, timezone: "Asia/Kolkata", kind: "COLLEGE" }, select: { id: true } })).id;
});

afterAll(async () => {
  await db.school.deleteMany({ where: { OR: [{ id: collegeId }, { name: { startsWith: `ZZ TZ ${STAMP}` } }] } });
  await db.auditLog.deleteMany({ where: { actorUserId: operatorUserId } });
  await db.outboundEmail.deleteMany({ where: { to: { contains: `-${STAMP}@test.invalid` } } });
  await db.user.deleteMany({ where: { email: { contains: `-${STAMP}@test.invalid` } } });
  await db.$disconnect();
});

describe("the zone test", () => {
  it("passes the zones a school keeps and refuses the rest", () => {
    for (const tz of ["Asia/Kolkata", "Asia/Calcutta", "UTC", "Europe/London", "America/Argentina/Buenos_Aires", "Asia/Dili"]) expect([tz, isValidTimeZone(tz)]).toEqual([tz, true]);
    for (const tz of ["Mars/Olympus", "Asia/Atlantis", "+05:30", "", "asia kolkata", "Asia/Kolkata; drop", "Etc/GMT+99"]) expect([tz, isValidTimeZone(tz)]).toEqual([tz, false]);
    expect(safeTimeZone("Mars/Olympus")).toBe("Asia/Kolkata");
    expect(safeTimeZone("Europe/London")).toBe("Europe/London");
    expect(monthKeyFor("Mars/Olympus", new Date("2026-10-05T12:00:00Z"))).toBe("2026-10");
  });

  it("is what a school's own settings and the registration wizard check", () => {
    const base = { name: "ZZ TZ", contactEmail: "zz-tz@test.invalid" };
    expect(schoolDetailsSchema.safeParse({ ...base, timezone: "Mars/Olympus" }).success).toBe(false);
    expect(schoolDetailsSchema.safeParse({ ...base, timezone: "Asia/Kolkata" }).success).toBe(true);
  });
});

describe("the operator", () => {
  it("cannot onboard, create or correct a school into an unknown zone", async () => {
    const before = await db.school.count({ where: { name: { startsWith: `ZZ TZ ${STAMP}` } } });
    expect(
      await onboardSchool(operator(), { name: `ZZ TZ ${STAMP} Onboarded`, contactEmail: `zz-tz-onb-${STAMP}@test.invalid`, timezone: "Mars/Olympus", kind: "COLLEGE", streams: ["SCIENCE"], trial: true, adminEmail: `zz-tz-onb-admin-${STAMP}@test.invalid` }),
    ).toEqual({ ok: false, errorKey: "refusal.timezoneUnknown" });
    expect(await createSchool(operator(), { name: `ZZ TZ ${STAMP} Created`, contactEmail: `zz-tz-c-${STAMP}@test.invalid`, timezone: "Mars/Olympus" })).toEqual({ ok: false, errorKey: "refusal.timezoneUnknown" });
    expect(await db.school.count({ where: { name: { startsWith: `ZZ TZ ${STAMP}` } } })).toBe(before);
    expect(await updateSchool(operator(), collegeId, { timezone: "Mars/Olympus" })).toEqual({ ok: false, errorKey: "refusal.timezoneUnknown" });
    expect((await db.school.findUniqueOrThrow({ where: { id: collegeId }, select: { timezone: true } })).timezone).toBe("Asia/Kolkata");
  });

  it("still reads the college list when a row written before the check holds an unknown zone", async () => {
    await db.school.update({ where: { id: collegeId }, data: { timezone: "Mars/Olympus" } });
    const { items } = await listColleges(operator(), { schoolIds: [collegeId] });
    expect(items.map((i) => i.id)).toEqual([collegeId]);
  });
});
