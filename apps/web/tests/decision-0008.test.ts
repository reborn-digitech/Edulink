import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { PLAN_FEATURES, PLAN_PRICE_PAISE, PLATFORM_FEATURES } from "@edulink/contracts";
import { gigSettings, saveGigSettings } from "@/lib/gig-questions";
import { figuresOf } from "@/lib/gig-payments";
import { meetingAccountOf, mySlots, offerSlot, setPremiumMeeting } from "@/lib/gig-sessions";
import { meetingCapFor, meetingCapsOf, MEETING_SERVICE_NAMES } from "@/lib/meeting-links";
import { setFeaturesForTests } from "@/lib/platform-features";
import { setActivePlansForTests } from "@/lib/person-plans";
import { ENDPOINTS } from "@/lib/api-catalog";
import type { ActiveContext } from "@/lib/session";

/**
 * DECISION 0008 (the owner's decisions of 7 November 2026): the three plans priced alike, the TEACHER plan holding
 * the question bank, the company's share of a paid seat 20 percent, and a session on a provider's free meeting
 * account held to the service's own length unless the provider has said their account is premium. The pure rules
 * (the figures, the cap by service) and the library's refusal and lifting of the cap, as the database's owner.
 */
const db = new PrismaClient();
const STAMP = Date.now();
const HOUR = 3_600_000;
let saved: Awaited<ReturnType<typeof gigSettings>>;
let schoolId = "";
const id: Record<string, string> = {};
const member: Record<string, string> = {};
const ctx = (key: string, role: ActiveContext["role"], school: string | null, flags: { isSuperuser?: boolean } = {}): ActiveContext =>
  ({ sessionId: "test", membershipId: member[key] ?? null, schoolId: school, role, user: { id: id[key]!, name: `ZZ ${key}`, preferredName: null, email: `zz-0008-${key}-${STAMP}@test.invalid`, avatarKey: null, isMinor: false, isSuperuser: Boolean(flags.isSuperuser), isAppAdmin: false } }) as ActiveContext;
const expert = () => ctx("expert", "EXPERT", null);
const teacher = () => ctx("teacher", "TEACHER", schoolId);
const operator = () => ctx("operator", null, null, { isSuperuser: true });
let n = 0;
const slot = (kind: "ONE_TO_ONE" | "WORKSHOP", meetingUrl: string, over: Record<string, unknown> = {}) => {
  n += 1;
  return { kind, title: `ZZ 0008 ${STAMP}-${n}`, startsAt: new Date(Date.now() + 48 * HOUR + n * 4 * HOUR).toISOString(), meetingUrl, ...over };
};

beforeAll(async () => {
  setFeaturesForTests([...PLATFORM_FEATURES]);
  setActivePlansForTests([]);
  saved = await gigSettings();
  await db.gigSettings.update({ where: { id: "gigs" }, data: { workshopMaxSeats: 30, freeLimitZoomMinutes: 40, freeLimitMeetMinutes: 60, freeLimitTeamsMinutes: 60, freeLimitJitsiMinutes: 0 } });
  schoolId = (await db.school.create({ data: { name: `ZZ 0008 School ${STAMP}`, slug: `zz-0008-${STAMP}`, code: `ZD8${String(STAMP).slice(-6)}`, contactEmail: `zz-0008-${STAMP}@test.invalid`, teacherGuidanceOn: true }, select: { id: true } })).id;
  const person = async (key: string, role: string | null, flags: Record<string, unknown> = {}) => {
    id[key] = (await db.user.create({ data: { name: `ZZ ${key} ${STAMP}`, email: `zz-0008-${key}-${STAMP}@test.invalid`, ...flags }, select: { id: true } })).id;
    if (role) member[key] = (await db.membership.create({ data: { userId: id[key]!, schoolId, role, status: "ACTIVE" }, select: { id: true } })).id;
  };
  await person("expert", null);
  await db.expertProfile.create({ data: { userId: id.expert!, headline: "ZZ Bridge engineer", offering: "BOTH", publishedAt: new Date() } });
  await person("teacher", "TEACHER");
  await person("operator", null, { isSuperuser: true });
});

afterAll(async () => {
  setActivePlansForTests([]);
  setFeaturesForTests([...PLATFORM_FEATURES]);
  const users = Object.values(id);
  await db.gigSlot.deleteMany({ where: { providerUserId: { in: users } } });
  await db.auditLog.deleteMany({ where: { OR: [{ actorUserId: { in: users } }, { schoolId }] } }).catch(() => {});
  await db.school.deleteMany({ where: { id: schoolId } });
  await db.user.deleteMany({ where: { id: { in: users } } });
  if (saved) await db.gigSettings.update({ where: { id: "gigs" }, data: saved });
  await db.$disconnect();
});

describe("the plans and the share (decision 0008)", () => {
  it("every plan is priced alike, and the TEACHER plan holds the question bank beside what 0006 gave it", async () => {
    expect(PLAN_PRICE_PAISE).toEqual({ MONTH: 9900, YEAR: 99900 });
    expect([...PLAN_FEATURES.TEACHER].sort()).toEqual(["ASSISTANT", "JOB_BOARD", "QUESTION_BANK", "QUESTION_GIG", "TEACHER_SESSIONS"]);
    expect([...PLAN_FEATURES.STUDENT].sort()).toEqual(["ASSISTANT", "COMPETITIONS", "QUESTION_BANK"]);
    expect(PLAN_FEATURES.EXPERT).toEqual(["EXPERT_SESSIONS"]);
    // The data migration of 7 November 2026 appended the bank to the TEACHER row, from which grants and passes write.
    const row = await db.personPlan.findUnique({ where: { code: "TEACHER" }, select: { features: true } });
    expect(row?.features).toContain("QUESTION_BANK");
  });

  it("the company's share of a paid seat is 20 percent, the GST on it, and the rest the provider's", () => {
    expect(figuresOf(10_000, { commissionPercent: 20, gstPercent: 18 })).toEqual({ commissionPaise: 2000, gstPaise: 360, netPaise: 7640 });
    expect(figuresOf(6_000, { commissionPercent: 20, gstPercent: 18 })).toEqual({ commissionPaise: 1200, gstPaise: 216, netPaise: 4584 });
    expect(figuresOf(5_000, { commissionPercent: 20, gstPercent: 18 })).toEqual({ commissionPaise: 1000, gstPaise: 180, netPaise: 3820 });
  });

  it("the settings row stands at 20 percent (the migration moved it from 15, the schema's default is 20)", async () => {
    const row = await db.gigSettings.findUniqueOrThrow({ where: { id: "gigs" }, select: { commissionPercent: true } });
    expect(row.commissionPercent).toBe(20);
  });
});

describe("the free-account cap by service (decision 0008)", () => {
  const caps = meetingCapsOf({ freeLimitZoomMinutes: 40, freeLimitMeetMinutes: 60, freeLimitTeamsMinutes: 60, freeLimitJitsiMinutes: 0 });

  it("names the service and its minutes for a capped link, and nothing for Jitsi, an unknown link or a premium account", () => {
    expect(meetingCapFor("https://us02web.zoom.us/j/123", caps, false)).toEqual({ service: "ZOOM", minutes: 40 });
    expect(meetingCapFor("https://meet.google.com/abc-defg-hij", caps, false)).toEqual({ service: "MEET", minutes: 60 });
    expect(meetingCapFor("https://teams.microsoft.com/l/meetup-join/x", caps, false)).toEqual({ service: "TEAMS", minutes: 60 });
    expect(meetingCapFor("https://meet.jit.si/zz-room", caps, false)).toBeNull();
    expect(meetingCapFor("https://example.com/room", caps, false)).toBeNull();
    expect(meetingCapFor("https://us02web.zoom.us/j/123", caps, true)).toBeNull();
    expect(meetingCapFor("https://meet.google.com/abc", { ...caps, MEET: 0 }, false)).toBeNull();
    expect(MEETING_SERVICE_NAMES.ZOOM).toBe("Zoom");
  });

  it("refuses a workshop longer than the free limit of its room's service, by name, and takes one inside it", async () => {
    const refused = await offerSlot(expert(), slot("WORKSHOP", `https://us02web.zoom.us/j/${STAMP}1`, { minutes: 60, seats: 10 }));
    expect(refused).toMatchObject({ ok: false, errorKey: "seats.refuseFreeLimit", vars: { service: "Zoom", minutes: 40 } });
    expect(await offerSlot(expert(), slot("WORKSHOP", `https://us02web.zoom.us/j/${STAMP}2`, { minutes: 40, seats: 10 }))).toMatchObject({ ok: true });
    expect(await offerSlot(expert(), slot("WORKSHOP", `https://meet.google.com/zz-${STAMP}`, { minutes: 60, seats: 10 }))).toMatchObject({ ok: true });
    expect(await offerSlot(expert(), slot("WORKSHOP", `https://meet.google.com/zz-${STAMP}-b`, { minutes: 90, seats: 10 }))).toMatchObject({ ok: false, errorKey: "seats.refuseFreeLimit", vars: { service: "Google Meet", minutes: 60 } });
    // A one-to-one is thirty minutes, inside every cap; Jitsi has none.
    expect(await offerSlot(expert(), slot("ONE_TO_ONE", `https://us02web.zoom.us/j/${STAMP}3`))).toMatchObject({ ok: true });
    expect(await offerSlot(expert(), slot("WORKSHOP", `https://meet.jit.si/zz-${STAMP}`, { minutes: 180, seats: 10 }))).toMatchObject({ ok: true });
  });

  it("the provider's word that their account is premium lifts the cap, is read back with their slots, and is audited once", async () => {
    expect((await mySlots(expert())).meeting).toEqual({ premium: false, caps: { MEET: 60, ZOOM: 40, TEAMS: 60, JITSI: 0 } });
    expect(await setPremiumMeeting(expert(), true)).toMatchObject({ ok: true, meeting: { premium: true } });
    expect(await setPremiumMeeting(expert(), true)).toMatchObject({ ok: true, meeting: { premium: true } });
    expect(await db.auditLog.count({ where: { actorUserId: id.expert, action: "gig.meeting.premium" } })).toBe(1);
    expect(await offerSlot(expert(), slot("WORKSHOP", `https://us02web.zoom.us/j/${STAMP}4`, { minutes: 90, seats: 10 }))).toMatchObject({ ok: true });
    expect(await setPremiumMeeting(expert(), false)).toMatchObject({ ok: true, meeting: { premium: false } });
    expect(await offerSlot(expert(), slot("WORKSHOP", `https://us02web.zoom.us/j/${STAMP}5`, { minutes: 90, seats: 10 }))).toMatchObject({ ok: false, errorKey: "seats.refuseFreeLimit" });
  });

  it("a teacher is held to the same cap on the same word, and a pupil cannot say it", async () => {
    expect((await meetingAccountOf(id.teacher!)).premium).toBe(false);
    expect(await setPremiumMeeting(teacher(), true)).toMatchObject({ ok: true, meeting: { premium: true } });
    expect((await mySlots(teacher())).meeting.premium).toBe(true);
    expect(await setPremiumMeeting(ctx("teacher", "STUDENT", schoolId), true)).toMatchObject({ ok: false, errorKey: "access.wrongRoleForThisAction" });
  });

  it("the operator's dials hold a cap to 0–180 minutes, and 0 is no cap", async () => {
    const s = await gigSettings();
    expect(await saveGigSettings(operator(), { ...s, freeLimitZoomMinutes: 200 })).toMatchObject({ ok: false, errorKey: "gigs.refuseSetting" });
    expect(await saveGigSettings(operator(), { ...s, freeLimitZoomMinutes: 0 })).toMatchObject({ ok: true, settings: { freeLimitZoomMinutes: 0 } });
    await setPremiumMeeting(expert(), false);
    expect(await offerSlot(expert(), slot("WORKSHOP", `https://us02web.zoom.us/j/${STAMP}6`, { minutes: 120, seats: 10 }))).toMatchObject({ ok: true });
    await saveGigSettings(operator(), s);
  });

  it("the door is in the catalog for both provider kinds, under both session features, reaching the caller alone", () => {
    const door = ENDPOINTS.find((e) => e.method === "POST" && e.path === "/api/v1/gigs/meeting-account")!;
    expect(door).toBeTruthy();
    expect(door.access).toEqual(["EXPERT", "TEACHER"]);
    expect(door.feature).toEqual(["EXPERT_SESSIONS", "TEACHER_SESSIONS"]);
    expect(door.reach).toBe("self");
  });
});
