/**
 * The UDISE+ students sheet read UNDER ROW SECURITY (TA-107, testing analysis of 13 November 2026). The sheet's
 * "CLASS ATTENDED DAYS (Previous Year)" column came from a raw statement on the shared client, which runs with no
 * school bound; the app role reads no AttendanceRecord then, so the column was blank for every pupil on the running
 * app while every owner-role suite saw the days.
 *
 * Every other suite connects as the OWNER (tests/setup.ts). Here src/lib/db.ts connects as the app role (DATABASE_URL
 * put back to it before anything imports db.ts) and the school is bound the way a request binds it; fixtures are
 * written through a second, owner client. Skipped, and says so, when the configuration has one role. Every row belongs
 * to a scratch ZZ school and ZZ people of this suite's own, removed afterwards.
 */
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

const ENV = await vi.hoisted(async () => {
  const app = process.env.DATABASE_APP_URL;
  const admin = process.env.DATABASE_ADMIN_URL;
  let appUser: string | null = null;
  try {
    if (app && admin && new URL(app).username !== new URL(admin).username) appUser = new URL(app).username;
  } catch {
    appUser = null;
  }
  if (appUser) process.env.DATABASE_URL = app;
  return { appUser, admin };
});

import { PrismaClient } from "@prisma/client";
import { db } from "@/lib/db";
import { forTenant } from "@/lib/tenant-context";
import { udiseStudentsExport } from "@/lib/filings";
import { parseCsvRecords } from "@/lib/csv";
import type { ActiveContext } from "@/lib/session";

const owner = new PrismaClient(ENV.admin ? { datasourceUrl: ENV.admin } : undefined);
const STAMP = Date.now();
const ids: Record<string, string> = {};

beforeAll(async () => {
  if (!ENV.appUser) return;
  const suffix = String(STAMP).slice(-6);
  ids.school = (await owner.school.create({ data: { name: `ZZ TA Filing RLS ${STAMP}`, slug: `zz-tacp-rls-${STAMP}`, code: `ZCR${suffix}`, contactEmail: `zz-tacp-rls-${STAMP}@test.invalid`, timezone: "Asia/Kolkata", isTestFixture: true }, select: { id: true } })).id;
  const mk = async (key: string) => (ids[key] = (await owner.user.create({ data: { name: `ZZ TACP ${key} ${STAMP}`, email: `zz-tacp-rls-${key}-${STAMP}@test.invalid` }, select: { id: true } })).id);
  await mk("admin");
  await mk("pupil");
  ids.adminMember = (await owner.membership.create({ data: { userId: ids.admin!, schoolId: ids.school!, role: "ADMIN", status: "ACTIVE" }, select: { id: true } })).id;
  ids.pupilMember = (await owner.membership.create({ data: { userId: ids.pupil!, schoolId: ids.school!, role: "STUDENT", status: "ACTIVE", joinedAt: new Date("2024-06-10T00:00:00Z") }, select: { id: true } })).id;
  await owner.academicYear.createMany({ data: [{ schoolId: ids.school!, name: "2025–26", startDate: new Date("2025-06-01T00:00:00Z"), endDate: new Date("2026-04-30T00:00:00Z"), isCurrent: false }, { schoolId: ids.school!, name: "2026–27", startDate: new Date("2026-06-01T00:00:00Z"), endDate: new Date("2027-04-30T00:00:00Z"), isCurrent: true }] });
  ids.class = (await owner.class.create({ data: { schoolId: ids.school!, name: "ZZ 5A", gradeLevel: "5", section: "A", joinCode: `ZCR${suffix}A` }, select: { id: true } })).id;
  await owner.enrollment.create({ data: { schoolId: ids.school!, classId: ids.class!, studentMembershipId: ids.pupilMember!, status: "ACTIVE" } });
  // Last year: present on the 4th, late on the 5th, absent on the 6th: two days.
  const session = (dateKey: string) => owner.attendanceSession.create({ data: { schoolId: ids.school!, classId: ids.class!, dateKey }, select: { id: true } });
  const [a, b, c] = [await session("2025-08-04"), await session("2025-08-05"), await session("2025-08-06")];
  await owner.attendanceRecord.createMany({ data: [{ schoolId: ids.school!, sessionId: a.id, studentMembershipId: ids.pupilMember!, status: "PRESENT" }, { schoolId: ids.school!, sessionId: b.id, studentMembershipId: ids.pupilMember!, status: "LATE" }, { schoolId: ids.school!, sessionId: c.id, studentMembershipId: ids.pupilMember!, status: "ABSENT" }] });
});

afterAll(async () => {
  if (ids.school) {
    await owner.auditLog.deleteMany({ where: { schoolId: ids.school } }).catch(() => {});
    await owner.school.deleteMany({ where: { id: ids.school } });
  }
  const users = [ids.admin, ids.pupil].filter((x): x is string => Boolean(x));
  if (users.length) await owner.user.deleteMany({ where: { id: { in: users } } });
  await owner.$disconnect();
});

describe.skipIf(!ENV.appUser)("the UDISE+ students sheet as the application role", () => {
  it("arrange: the app's own client is the app role, which neither owns the tables nor bypasses row security", async () => {
    const [who] = await db.$queryRaw<{ name: string; bypass: boolean }[]>`SELECT current_user::text AS name, r.rolbypassrls AS bypass FROM pg_roles r WHERE r.rolname = current_user`;
    expect(who).toEqual({ name: ENV.appUser, bypass: false });
  });

  it("TA-107: last year's attended days reach the sheet with the school bound as a request binds it", async () => {
    const ctx = { sessionId: "test", schoolId: ids.school!, membershipId: ids.adminMember!, role: "ADMIN", user: { id: ids.admin!, name: "ZZ TACP admin", preferredName: null, email: null, avatarKey: null, isMinor: false, isSuperuser: false, isAppAdmin: false } } as unknown as ActiveContext;
    const sheet = await forTenant({ schoolIds: [ids.school!], userId: ids.admin!, joinCode: null, isSuperuser: false }, () => udiseStudentsExport(ctx));
    const { records } = parseCsvRecords(sheet.csv);
    const [headers = [], ...rows] = records;
    const row = rows.map((r) => Object.fromEntries(headers.map((h, i) => [h, r[i] ?? ""]))).find((r) => r["Name of Student"] === `ZZ TACP PUPIL ${STAMP}`);
    expect(row?.["CLASS ATTENDED DAYS (Previous Year)"]).toBe("2");
  });
});
