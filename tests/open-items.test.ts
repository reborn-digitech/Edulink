import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { openConversation } from "@/lib/conversations";
import { notify } from "@/lib/notify";
import { translator } from "@/lib/i18n/dictionary";
import { createHoliday } from "@/lib/holidays";
import { leaveDaysFor } from "@/lib/staff-records";
import { createCompetition, enterCompetition, getCompetition, refreshStanding } from "@/lib/competitions";
import type { ActiveContext } from "@/lib/session";

/**
 * The items the test audit left open, closed: one room per pair is the
 * database's promise; a notification keeps its key so it can be said again
 * in a new language; leave draws school days with the calendar's closures
 * taken out and a span split at the year's edge; a competition's counts
 * respect consent only where it asks for it; a pupil enters at their grade.
 */
const db = new PrismaClient();
const STAMP = Date.now();
let schoolId = "";
let adminCtx: ActiveContext;
let teacherCtx: ActiveContext;
let pupilCtx: ActiveContext;
let seniorCtx: ActiveContext;
let teacherUserId = "";
let adminUserId = "";
let pupilUserId = "";
let pupilMembershipId = "";

function ctx(over: { userId: string; membershipId?: string | null; role: ActiveContext["role"] }): ActiveContext {
  return {
    sessionId: "test",
    membershipId: over.membershipId ?? null,
    schoolId,
    role: over.role,
    user: { id: over.userId, name: "Test", preferredName: null, email: null, avatarKey: null, isMinor: false, isSuperuser: false, isAppAdmin: false },
  } as ActiveContext;
}

beforeAll(async () => {
  const school = await db.school.create({
    data: { name: `ZZ Open Items ${STAMP}`, slug: `zz-open-${STAMP}`, code: `ZO${String(STAMP).slice(-6)}`, contactEmail: `zz-open-${STAMP}@test.invalid`, timezone: "Asia/Kolkata" },
    select: { id: true },
  });
  schoolId = school.id;
  const mkUser = (name: string) => db.user.create({ data: { name, email: `zz-open-${name.toLowerCase().replace(/ /g, "-")}-${STAMP}@test.invalid` }, select: { id: true } });
  const [admin, teacher, pupil, senior] = await Promise.all([mkUser("Admin"), mkUser("Teacher"), mkUser("Pupil"), mkUser("Senior")]);
  adminUserId = admin.id; teacherUserId = teacher.id; pupilUserId = pupil.id;
  const mk = (userId: string, role: string, extra: Record<string, unknown> = {}) =>
    db.membership.create({ data: { userId, schoolId, role, status: "ACTIVE", ...extra }, select: { id: true } });
  const [am, tm, pm, sm] = await Promise.all([
    mk(admin.id, "ADMIN"), mk(teacher.id, "TEACHER"), mk(pupil.id, "STUDENT", { studentCode: `ZOP${STAMP}`, gradeLevel: "3" }), mk(senior.id, "STUDENT", { studentCode: `ZOS${STAMP}`, gradeLevel: "10" }),
  ]);
  pupilMembershipId = pm.id;
  adminCtx = ctx({ userId: admin.id, membershipId: am.id, role: "ADMIN" });
  teacherCtx = ctx({ userId: teacher.id, membershipId: tm.id, role: "TEACHER" });
  pupilCtx = ctx({ userId: pupil.id, membershipId: pm.id, role: "STUDENT" });
  seniorCtx = ctx({ userId: senior.id, membershipId: sm.id, role: "STUDENT" });
});

afterAll(async () => {
  await db.notification.deleteMany({ where: { schoolId } });
  await db.school.deleteMany({ where: { id: schoolId } });
  await db.user.deleteMany({ where: { email: { contains: `-${STAMP}@test.invalid` } } });
  await db.$disconnect();
});

describe("one room per pair", () => {
  it("two opens at once make one room, keyed", async () => {
    const [a, b] = await Promise.all([
      openConversation(teacherCtx, schoolId, adminUserId),
      openConversation(adminCtx, schoolId, teacherUserId),
    ]);
    expect(a.conversationId).toBe(b.conversationId);
    expect([a.created, b.created].filter(Boolean)).toHaveLength(1);
    const rooms = await db.conversation.findMany({ where: { schoolId, participants: { some: { userId: teacherUserId } } } });
    expect(rooms).toHaveLength(1);
    expect(rooms[0]!.pairKey).toBe(`${schoolId}:${[teacherUserId, adminUserId].sort().join(":")}`);
  });

  it("a room from before the key existed is found and keyed on the way past", async () => {
    const legacy = await db.conversation.create({
      data: { schoolId, createdById: teacherUserId, participants: { create: [{ schoolId, userId: teacherUserId }, { schoolId, userId: pupilUserId }] } },
      select: { id: true },
    });
    const found = await openConversation(teacherCtx, schoolId, pupilUserId);
    expect(found).toEqual({ conversationId: legacy.id, created: false });
    expect((await db.conversation.findUniqueOrThrow({ where: { id: legacy.id } })).pairKey).not.toBeNull();
  });
});

describe("a notification keeps its key", () => {
  it("is stored with key and variables, and can be said again in another language", async () => {
    await notify({ userId: teacherUserId, schoolId, kind: "SYSTEM", titleKey: "notifTitle.newWorkSet", body: "ZZ sheet", url: "/x" });
    const row = await db.notification.findFirstOrThrow({ where: { userId: teacherUserId, schoolId }, orderBy: { createdAt: "desc" } });
    expect(row.titleKey).toBe("notifTitle.newWorkSet");
    expect(row.titleVars).toBe("{}");
    expect(row.title).toBe(translator("en")("notifTitle.newWorkSet"));
    expect(translator("hi")("notifTitle.newWorkSet")).not.toBe(row.title);
  });
});

describe("leave days against the calendar", () => {
  it("takes the closed days out and splits a span at a window's edge", async () => {
    await createHoliday(adminCtx, { name: "ZZ closed Wednesday", startDateKey: "2026-05-06", endDateKey: "2026-05-06", kind: "HOLIDAY" });
    // Mon 4 → Sat 9: six school days, the closed Wednesday not among them.
    expect(await leaveDaysFor(schoolId, "2026-05-04", "2026-05-09")).toBe(5);
    // Only the part inside the window: Thu, Fri, Sat.
    expect(await leaveDaysFor(schoolId, "2026-05-04", "2026-05-09", { from: "2026-05-07", to: "2026-12-31" })).toBe(3);
    expect(await leaveDaysFor(schoolId, "2026-05-04", "2026-05-09", { from: "2026-06-01", to: "2026-12-31" })).toBe(0);
  });
});

describe("competitions", () => {
  let consentFree = "";
  let withConsent = "";
  beforeAll(async () => {
    consentFree = await createCompetition(adminCtx, { title: "ZZ open quiz", summary: "x", requiresParentConsent: false, gradeLow: "9", gradeHigh: "12" });
    withConsent = await createCompetition(adminCtx, { title: "ZZ consent quiz", summary: "x", requiresParentConsent: true });
    await db.competition.updateMany({ where: { id: { in: [consentFree, withConsent] } }, data: { status: "PUBLISHED" } });
  });

  it("a pupil outside the grade band is refused; one inside enters", async () => {
    await expect(enterCompetition(pupilCtx, consentFree)).rejects.toMatchObject({ key: "access.notForYourGrade" });
    const entered = await enterCompetition(seniorCtx, consentFree);
    expect(entered.awaitingConsent).toBe(false); // nothing needs consent here
  });

  it("counts and standings respect consent only where the competition asks for it", async () => {
    expect((await getCompetition(adminCtx, consentFree)).enteredCount).toBe(1);
    const entry = await db.competitionEntry.findFirstOrThrow({ where: { competitionId: consentFree } });
    await db.competitionEntry.update({ where: { id: entry.id }, data: { rank: 1 } });
    await refreshStanding(schoolId, consentFree);
    expect(await db.competitionStanding.count({ where: { competitionId: consentFree, schoolId } })).toBe(1);

    // The same result on an unconsented entry where consent IS required stands nowhere.
    await db.competitionEntry.create({ data: { competitionId: withConsent, studentMembershipId: pupilMembershipId, schoolId, status: "REGISTERED", rank: 1 } });
    await refreshStanding(schoolId, withConsent);
    expect(await db.competitionStanding.count({ where: { competitionId: withConsent, schoolId } })).toBe(0);
    expect((await getCompetition(adminCtx, withConsent)).enteredCount).toBe(0);
  });
});
