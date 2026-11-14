/**
 * Staff leave, two findings of the testing analysis of 13 November 2026 (attendance-timetable batch):
 *
 *   TA-030  decideLeave refused self-approval by comparing membership ids, and a person holds one membership per
 *           role, so a head who also teaches applied as the teacher and approved it as the principal.
 *   TA-033  applyForLeave checked the date's shape only, so "2026-11-00" was stored PENDING, and the desk, which
 *           runs the cover search and the balance for every pending request, threw for the whole school.
 *
 * One ZZ school of this suite's own (made here, removed after): a person who is both TEACHER and PRINCIPAL, a second
 * principal, and a teacher whose stored request carries a day that is not a day.
 */
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { PrismaClient } from "@prisma/client";
import { createSession, getSession, type ActiveContext } from "@/lib/session";
import { __resetCookies, __setHeaders } from "../tests/stubs/next-headers";
import { applyForLeave, coverCandidates, decideLeave } from "@/lib/leave";
import { arrangeCover } from "@/lib/register-duty";
import { adminLeave } from "@/lib/api-reads/admin";
import { addDaysToKey, todayKey } from "@/lib/dates";
import { classCode } from "@/lib/codes";

// Under a machine shared with other runs the default five and ten seconds are not enough.
vi.setConfig({ testTimeout: 60_000, hookTimeout: 120_000 });
const db = new PrismaClient();
const STAMP = Date.now();
const TZ = "Asia/Kolkata";
const MAIL = (who: string) => `zz-taatt-leave-${who}-${STAMP}@test.invalid`;
const ids: Record<string, string> = {};
const TODAY = todayKey(TZ);

async function as(who: string, role: string): Promise<ActiveContext & { schoolId: string; membershipId: string }> {
  __resetCookies();
  __setHeaders({});
  await createSession(ids[who]!, { schoolId: ids.school!, role: role as never });
  const ctx = await getSession();
  if (!ctx || !ctx.schoolId || !ctx.membershipId) throw new Error(`no session for ${who}`);
  return ctx as ActiveContext & { schoolId: string; membershipId: string };
}

beforeAll(async () => {
  ids.school = (
    await db.school.create({
      data: { name: `ZZ TAATT Leave School ${STAMP}`, slug: `zz-taatt-leave-${STAMP}`, code: `ZTL${String(STAMP).slice(-6)}`, contactEmail: MAIL("contact"), timezone: TZ, isTestFixture: true },
      select: { id: true },
    })
  ).id;
  const S = ids.school;
  for (const who of ["dual", "head2", "odd"]) {
    ids[who] = (await db.user.create({ data: { name: `ZZ TAATT ${who}`, email: MAIL(who), prefs: "{}" }, select: { id: true } })).id;
  }
  // One person, two roles at the school: the teacher who applies and the head who decides.
  ids.dualTeacherM = (await db.membership.create({ data: { userId: ids.dual!, schoolId: S, role: "TEACHER", status: "ACTIVE" }, select: { id: true } })).id;
  ids.dualHeadM = (await db.membership.create({ data: { userId: ids.dual!, schoolId: S, role: "PRINCIPAL", status: "ACTIVE" }, select: { id: true } })).id;
  ids.head2M = (await db.membership.create({ data: { userId: ids.head2!, schoolId: S, role: "PRINCIPAL", status: "ACTIVE" }, select: { id: true } })).id;
  ids.oddM = (await db.membership.create({ data: { userId: ids.odd!, schoolId: S, role: "TEACHER", status: "ACTIVE" }, select: { id: true } })).id;
  ids.klass = (await db.class.create({ data: { schoolId: S, name: "ZZ TAATT Leave 4A", gradeLevel: "4", joinCode: classCode() }, select: { id: true } })).id;
}, 60_000);

afterAll(async () => {
  __resetCookies();
  __setHeaders({});
  const users = await db.user.findMany({ where: { email: { startsWith: "zz-taatt-leave-", endsWith: `-${STAMP}@test.invalid` } }, select: { id: true } });
  const userIds = users.map((u) => u.id);
  await db.session.deleteMany({ where: { userId: { in: userIds } } });
  await db.notification.deleteMany({ where: { userId: { in: userIds } } });
  if (ids.school) {
    await db.auditLog.deleteMany({ where: { OR: [{ schoolId: ids.school }, { actorUserId: { in: userIds } }] } });
    await db.school.deleteMany({ where: { id: ids.school } });
  }
  await db.user.deleteMany({ where: { id: { in: userIds } } });
  await db.$disconnect();
});

describe("TA-030: one person with two roles at one school", () => {
  it("TA-030: applies as the teacher and is refused deciding it as the principal; another principal may", async () => {
    const asTeacher = await as("dual", "TEACHER");
    const from = addDaysToKey(TODAY, 10);
    const applied = await applyForLeave(asTeacher, { fromDateKey: from, toDateKey: from, kind: "UNPAID", reason: "ZZ TA-030 family matter" });
    expect(applied.ok).toBe(true);
    const asHead = await as("dual", "PRINCIPAL");
    expect(asHead.membershipId).not.toBe(asTeacher.membershipId);
    const decided = await decideLeave(asHead, applied.id!, "APPROVED");
    expect(decided).toMatchObject({ ok: false, errorKey: "leaveKind.notYourOwn" });
    expect((await db.leaveRequest.findUniqueOrThrow({ where: { id: applied.id! }, select: { status: true } })).status).toBe("PENDING");
    const other = await as("head2", "PRINCIPAL");
    expect((await decideLeave(other, applied.id!, "DECLINED")).ok).toBe(true);
  });
});

describe("TA-033: a day that is not a day", () => {
  it("TA-033: applyForLeave refuses 2026-11-00 and 2026-11-99 and stores nothing", async () => {
    const teacher = await as("odd", "TEACHER");
    expect(await applyForLeave(teacher, { fromDateKey: "2026-11-00", toDateKey: "2026-11-20", kind: "UNPAID", reason: "ZZ TA-033 bad day" })).toMatchObject({ ok: false, errorKey: "leaveKind.giveBothDates" });
    expect(await applyForLeave(teacher, { fromDateKey: "2026-11-20", toDateKey: "2026-11-99", kind: "UNPAID", reason: "ZZ TA-033 bad day" })).toMatchObject({ ok: false, errorKey: "leaveKind.giveBothDates" });
    expect(await db.leaveRequest.count({ where: { schoolId: ids.school!, teacherMembershipId: ids.oddM! } })).toBe(0);
  });

  it("TA-033: arrangeCover refuses a day that is not a day", async () => {
    const head = await as("head2", "PRINCIPAL");
    expect(await arrangeCover(head, { classId: ids.klass!, coveringMembershipId: ids.oddM!, fromDateKey: "2026-02-30", toDateKey: "2026-03-01" })).toMatchObject({ ok: false, errorKey: "refusal.bothDatesYmd" });
  });

  it("TA-033: a stored request whose day is not a day does not take the leave desk down", async () => {
    // As an older build stored it, before the check: CASUAL, so the balance reads it too.
    await db.leaveRequest.create({ data: { schoolId: ids.school!, teacherMembershipId: ids.oddM!, fromDateKey: "2026-11-00", toDateKey: "2026-11-20", kind: "CASUAL", reason: "ZZ TA-033 stored", status: "PENDING" } });
    const head = await as("head2", "PRINCIPAL");
    await expect(coverCandidates(head, ids.oddM!, "2026-11-00", "2026-11-20")).resolves.toMatchObject({ lessonCount: 0 });
    const desk = await adminLeave(head);
    expect(desk.pending.map((r) => r.applicantMembershipId)).toContain(ids.oddM!);
  });
});
