import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { PLATFORM_FEATURES } from "@edulink/contracts";
import { AccessError } from "@/lib/tenancy";
import { gigSettings } from "@/lib/gig-questions";
import { bookSeries, cancelSeries, expandSeriesRule, familySessions, mySlots, offerSeries, offerSlot, SERIES_MAX_SESSIONS, SERIES_MIN_SESSIONS } from "@/lib/gig-sessions";
import { familyAgenda } from "@/lib/agenda";
import { setFeaturesForTests } from "@/lib/platform-features";
import { setActivePlansForTests } from "@/lib/person-plans";
import { ENDPOINTS } from "@/lib/api-catalog";
import type { ActiveContext } from "@/lib/session";

/**
 * SESSIONS IN SERIES (decision 0008, the owner's decision of 7 November 2026): a provider offers a fixed set of dated
 * sessions or a weekly pattern in one go, each session a slot of its own; a family books each seat, and "book the
 * rest" is one order of individual seats — no pass, no standing access. Everything is ZZ and made here; the rules,
 * not the policies, as the database's owner.
 */
const db = new PrismaClient();
const STAMP = Date.now();
const HOUR = 3_600_000;
const DAY = 24 * HOUR;
let saved: Awaited<ReturnType<typeof gigSettings>>;
let schoolId = "";
const id: Record<string, string> = {};
const member: Record<string, string> = {};
const ctx = (key: string, role: ActiveContext["role"], school: string | null): ActiveContext =>
  ({ sessionId: "test", membershipId: member[key] ?? null, schoolId: school, role, user: { id: id[key]!, name: `ZZ ${key}`, preferredName: null, email: null, avatarKey: null, isMinor: false, isSuperuser: false, isAppAdmin: false, prefs: { locale: "en" } } }) as ActiveContext;
const expert = () => ctx("expert", "EXPERT", null);
const teacher = () => ctx("teacher", "TEACHER", schoolId);
const p2 = () => ctx("p2", "STUDENT", schoolId);
const g1 = () => ctx("g1", "PARENT", null);
const g2 = () => ctx("g2", "PARENT", null);
const refusal = async (work: Promise<unknown>) => {
  try {
    await work;
    return "let through";
  } catch (error) {
    return error instanceof AccessError ? `${error.code}:${error.key}` : String(error);
  }
};
/** Whole hours `days` ahead, at `hour` UTC, so nothing lands within the hour or past 120 days. */
const at = (days: number, hour = 10) => {
  const d = new Date(Date.now() + days * DAY);
  d.setUTCHours(hour, 0, 0, 0);
  return d;
};
let n = 0;
const link = () => `https://meet.jit.si/zz-series-${STAMP}-${++n}`;

beforeAll(async () => {
  setFeaturesForTests([...PLATFORM_FEATURES]);
  setActivePlansForTests([]);
  saved = await gigSettings();
  await db.gigSettings.update({ where: { id: "gigs" }, data: { pupilFreeOneToOnes: 2, pupilFreeWorkshops: 2, freeCancelHours: 12, workshopMaxSeats: 30, expertStartOneToOnes: 0, expertStartWorkshops: 0, expertMonthlyOneToOnes: 0, expertQuarterlyWorkshops: 0 } });
  schoolId = (await db.school.create({ data: { name: `ZZ Series School ${STAMP}`, slug: `zz-series-${STAMP}`, code: `ZSR${String(STAMP).slice(-6)}`, contactEmail: `zz-series-${STAMP}@test.invalid`, teacherGuidanceOn: true, timezone: "Asia/Kolkata" }, select: { id: true } })).id;
  await db.academicYear.create({ data: { schoolId, name: "2026–27", startDate: new Date("2026-06-01T00:00:00Z"), endDate: new Date("2027-04-30T00:00:00Z"), isCurrent: true } });
  const person = async (key: string, role: string | null, flags: Record<string, unknown> = {}) => {
    id[key] = (await db.user.create({ data: { name: `ZZ Series ${key} ${STAMP}`, email: `zz-series-${key}-${STAMP}@test.invalid`, ...flags }, select: { id: true } })).id;
    if (role) member[key] = (await db.membership.create({ data: { userId: id[key]!, schoolId, role, status: "ACTIVE" }, select: { id: true } })).id;
  };
  await person("expert", null);
  await db.expertProfile.create({ data: { userId: id.expert!, headline: "ZZ Bridge engineer", offering: "BOTH", publishedAt: new Date(), timezone: "Asia/Kolkata" } });
  await person("teacher", "TEACHER");
  await person("p1", "STUDENT", { isMinor: true, birthdate: new Date(Date.UTC(new Date().getUTCFullYear() - 12, 0, 15)) });
  await person("p2", "STUDENT", { isMinor: true });
  await person("g1", null);
  await person("g2", null);
  await db.guardianship.create({ data: { parentUserId: id.g1!, studentMembershipId: member.p1!, studentSchoolId: schoolId, status: "ACTIVE" } });
});

afterAll(async () => {
  setActivePlansForTests([]);
  setFeaturesForTests([...PLATFORM_FEATURES]);
  const users = Object.values(id);
  await db.gigSlot.deleteMany({ where: { providerUserId: { in: users } } });
  await db.gigSeries.deleteMany({ where: { providerUserId: { in: users } } });
  await db.auditLog.deleteMany({ where: { OR: [{ actorUserId: { in: users } }, { schoolId }] } }).catch(() => {});
  await db.notification.deleteMany({ where: { userId: { in: users } } });
  await db.school.deleteMany({ where: { id: schoolId } });
  await db.user.deleteMany({ where: { id: { in: users } } });
  if (saved) await db.gigSettings.update({ where: { id: "gigs" }, data: saved });
  await db.$disconnect();
});

describe("the rule", () => {
  it("a weekly pattern gives the chosen weekdays at the wall-clock time in the provider's zone, from a day until a day; a list of dates is sorted with repeats dropped; an unreadable rule gives nothing", () => {
    // 2030-01-07 is a Monday: Monday and Wednesday at 17:00 IST, one week → two starts at 11:30Z.
    const weekly = expandSeriesRule({ mode: "WEEKLY", weekdays: [1, 3], time: "17:00", from: "2030-01-07", until: "2030-01-13" }, "Asia/Kolkata");
    expect(weekly.map((d) => d.toISOString())).toEqual(["2030-01-07T11:30:00.000Z", "2030-01-09T11:30:00.000Z"]);
    const dates = expandSeriesRule({ mode: "DATES", startsAt: ["2030-02-02T10:00:00.000Z", "2030-02-01T10:00:00.000Z", "2030-02-02T10:00:00.000Z", "not a date"] }, "Asia/Kolkata");
    expect(dates.map((d) => d.toISOString())).toEqual(["2030-02-01T10:00:00.000Z", "2030-02-02T10:00:00.000Z"]);
    expect(expandSeriesRule({ mode: "WEEKLY", weekdays: [1], time: "25:00", from: "2030-01-07", until: "2030-01-13" }, "Asia/Kolkata")).toEqual([]);
    expect(expandSeriesRule({ mode: "WEEKLY", weekdays: [1], time: "17:00", from: "2030-01-13", until: "2030-01-07" }, "Asia/Kolkata")).toEqual([]);
  });
});

describe("offering a series", () => {
  it("writes the series and one slot per start, each a session of its own, and lists it to the provider with its sessions ahead; too few, too many, overlapping and too-soon starts are refused by name", async () => {
    const made = await offerSeries(expert(), { kind: "ONE_TO_ONE", title: `ZZ Series one-to-ones ${STAMP}`, meetingUrl: link(), rule: { mode: "DATES", startsAt: [at(2), at(4), at(6)].map((d) => d.toISOString()) } });
    expect(made).toMatchObject({ ok: true });
    if (!made.ok) return;
    expect(made.slotIds).toHaveLength(3);
    const slots = await db.gigSlot.findMany({ where: { id: { in: made.slotIds } }, orderBy: { startsAt: "asc" } });
    expect(slots.every((s) => s.seriesId === made.seriesId && s.kind === "ONE_TO_ONE" && s.seats === 1 && s.pricePaise === 0)).toBe(true);
    expect(slots.map((s) => s.startsAt.toISOString())).toEqual([at(2), at(4), at(6)].map((d) => d.toISOString()));
    const view = await mySlots(expert());
    expect(view.series.find((s) => s.id === made.seriesId)).toMatchObject({ kind: "ONE_TO_ONE", sessions: 3, remaining: 3, cancelled: false, rule: { mode: "DATES" } });
    expect(view.slots.filter((s) => s.seriesId === made.seriesId)).toHaveLength(3);
    id.series1 = made.seriesId;

    expect(await offerSeries(expert(), { kind: "ONE_TO_ONE", title: `ZZ one date ${STAMP}`, meetingUrl: link(), rule: { mode: "DATES", startsAt: [at(8).toISOString()] } })).toMatchObject({ ok: false, errorKey: "gigs.refuseSeriesFew", vars: { count: SERIES_MIN_SESSIONS } });
    expect(await offerSeries(expert(), { kind: "ONE_TO_ONE", title: `ZZ many ${STAMP}`, meetingUrl: link(), rule: { mode: "DATES", startsAt: Array.from({ length: SERIES_MAX_SESSIONS + 1 }, (_, i) => new Date(at(10).getTime() + i * 2 * HOUR).toISOString()) } })).toMatchObject({ ok: false, errorKey: "gigs.refuseSeriesMany" });
    // Overlapping the first series' second session, and one of its own starts within the hour.
    expect(await offerSeries(expert(), { kind: "ONE_TO_ONE", title: `ZZ clash ${STAMP}`, meetingUrl: link(), rule: { mode: "DATES", startsAt: [at(4).toISOString(), at(9).toISOString()] } })).toMatchObject({ ok: false, errorKey: "gigs.refuseSlotOverlap" });
    expect(await offerSeries(expert(), { kind: "ONE_TO_ONE", title: `ZZ soon ${STAMP}`, meetingUrl: link(), rule: { mode: "DATES", startsAt: [new Date(Date.now() + 10 * 60_000).toISOString(), at(9).toISOString()] } })).toMatchObject({ ok: false, errorKey: "gigs.refuseSlotTooSoon" });
    expect(await offerSeries(expert(), { kind: "WORKSHOP", title: `ZZ twins ${STAMP}`, meetingUrl: link(), minutes: 60, seats: 10, rule: { mode: "DATES", startsAt: [at(20).toISOString(), new Date(at(20).getTime() + 30 * 60_000).toISOString()] } })).toMatchObject({ ok: false, errorKey: "gigs.refuseSlotOverlap" });
    // A workshop series on a free Zoom account longer than its cap is refused as a single workshop is (decision 0008).
    expect(await offerSeries(expert(), { kind: "WORKSHOP", title: `ZZ zoom ${STAMP}`, meetingUrl: `https://us02web.zoom.us/j/${STAMP}`, minutes: 90, seats: 10, rule: { mode: "DATES", startsAt: [at(21).toISOString(), at(22).toISOString()] } })).toMatchObject({ ok: false, errorKey: "seats.refuseFreeLimit" });
  });

  it("a teacher offers a weekly series of one-to-ones to their own school, not workshops; nothing of it clashes with what they already offer", async () => {
    expect(await offerSeries(teacher(), { kind: "WORKSHOP", title: `ZZ teacher workshop ${STAMP}`, meetingUrl: link(), rule: { mode: "DATES", startsAt: [at(3).toISOString(), at(5).toISOString()] } })).toMatchObject({ ok: false, errorKey: "gigs.refuseTeacherWorkshop" });
    const single = await offerSlot(teacher(), { kind: "ONE_TO_ONE", title: `ZZ a single half hour ${STAMP}`, startsAt: at(3, 12).toISOString(), meetingUrl: link() });
    expect(single).toMatchObject({ ok: true });
    const from = new Date(Date.now() + 2 * DAY).toISOString().slice(0, 10);
    const until = new Date(Date.now() + 16 * DAY).toISOString().slice(0, 10);
    const made = await offerSeries(teacher(), { kind: "ONE_TO_ONE", title: `ZZ Reading aloud, weekly ${STAMP}`, meetingUrl: link(), rule: { mode: "WEEKLY", weekdays: [0, 1, 2, 3, 4, 5, 6], time: "09:00", from, until } });
    expect(made).toMatchObject({ ok: true });
    if (!made.ok) return;
    expect(made.slotIds.length).toBeGreaterThanOrEqual(SERIES_MIN_SESSIONS);
    const slots = await db.gigSlot.findMany({ where: { seriesId: made.seriesId }, select: { teacherSchoolId: true, providerKind: true } });
    expect(slots.every((s) => s.teacherSchoolId === schoolId && s.providerKind === "TEACHER")).toBe(true);
    id.series2 = made.seriesId;
  });
});

describe("booking the rest", () => {
  it("the family sees the series with each session and how many are open; a guardian's one order books every remaining seat as a single seat is booked, the one past the allowance set aside with its reason, and the agenda carries each booked session", async () => {
    const before = (await familySessions(g1())).children.find((c) => c.id === member.p1)!;
    const series = before.series.find((s) => s.id === id.series1)!;
    expect(series).toMatchObject({ kind: "ONE_TO_ONE", providerKind: "EXPERT", remaining: 3 });
    expect(series.sessions.map((s) => s.booked)).toEqual([false, false, false]);
    expect(before.open.filter((o) => o.seriesId === id.series1)).toHaveLength(3);

    const order = await bookSeries(g1(), { seriesId: id.series1!, studentMembershipId: member.p1, purpose: "ZZ All three, to learn how bridges stand." });
    expect(order).toMatchObject({ ok: true });
    if (!order.ok) return;
    // Two free one-to-ones a year: the third seat is refused by the allowance and the first two stand.
    expect(order.bookings.map((b) => b.status)).toEqual(["CONFIRMED", "CONFIRMED"]);
    expect(order.refused).toEqual([{ slotId: expect.any(String), errorKey: "gigs.refuseAllowanceOneToOne", vars: { count: 2 } }]);
    expect(await db.gigBooking.count({ where: { studentMembershipId: member.p1, slot: { seriesId: id.series1 }, status: "CONFIRMED" } })).toBe(2);

    const after = (await familySessions(g1())).children.find((c) => c.id === member.p1)!;
    const again = after.series.find((s) => s.id === id.series1)!;
    expect(again.sessions.map((s) => s.booked)).toEqual([true, true, false]);
    expect(again.remaining).toBe(1);
    // Nothing left to book that the allowance allows: the next order is refused with the allowance's sentence.
    expect(await bookSeries(g1(), { seriesId: id.series1!, studentMembershipId: member.p1, purpose: "ZZ Once more, the last one." })).toMatchObject({ ok: false, errorKey: "gigs.refuseAllowanceOneToOne" });
    // The agenda: each booked session is a SESSION row of its own, the web's and the phone's alike.
    const agenda = await familyAgenda(g1(), { student: member.p1, days: 14 });
    expect(agenda.rows.filter((r) => r.kind === "SESSION" && r.title === `ZZ Series one-to-ones ${STAMP}`)).toHaveLength(2);
  });

  it("a pupil under eighteen's order waits for a guardian, session by session; the ticked sessions alone are booked; a cancelled or invented series is not found", async () => {
    // Pupil 2, whose free one-to-ones are untouched (pupil 1 spent both on the expert's series above).
    const own = (await familySessions(p2())).children[0]!;
    const series = own.series.find((s) => s.id === id.series2)!;
    const first = series.sessions.find((s) => !s.booked)!;
    const order = await bookSeries(p2(), { seriesId: id.series2!, purpose: "ZZ Reading before the test.", slotIds: [first.slotId] });
    expect(order).toMatchObject({ ok: true });
    if (!order.ok) return;
    expect(order.bookings).toEqual([{ slotId: first.slotId, bookingId: expect.any(String), status: "PENDING_CONSENT", checkout: null }]);
    expect(await refusal(bookSeries(g1(), { seriesId: "czzseriesnosuch0000000000", studentMembershipId: member.p1, purpose: "ZZ nothing here." }))).toBe("NOT_FOUND:gigs.noSuchSeries");
    // The guardian fence is bookSeat's own (`child`): a guardian who does not guard the pupil reaches nothing.
    expect(await refusal(bookSeries(g2(), { seriesId: id.series2!, studentMembershipId: member.p1, purpose: "ZZ not my child." }))).toMatch(/^NOT_FOUND:/);
  });
});

describe("cancelling a series", () => {
  it("the provider takes the whole series back: every session ahead is cancelled with its seats, the families told, the series marked; another provider's series is not found; a repeat cancels nothing more", async () => {
    expect(await refusal(cancelSeries(teacher(), id.series1!, "ZZ not mine"))).toBe("NOT_FOUND:gigs.noSuchSeries");
    const r = await cancelSeries(expert(), id.series1!, "ZZ the bridge is closed");
    expect(r).toMatchObject({ ok: true, cancelled: 3 });
    expect(await db.gigSlot.count({ where: { seriesId: id.series1, cancelledAt: { not: null } } })).toBe(3);
    expect(await db.gigBooking.count({ where: { slot: { seriesId: id.series1 }, status: "CANCELLED" } })).toBe(2);
    expect((await mySlots(expert())).series.find((s) => s.id === id.series1)).toMatchObject({ cancelled: true, remaining: 0 });
    expect(await cancelSeries(expert(), id.series1!, "ZZ again")).toMatchObject({ ok: true, cancelled: 0 });
    expect(await db.notification.count({ where: { userId: id.g1 } })).toBeGreaterThan(0);
    expect(await cancelSeries(teacher(), id.series2!, "ZZ")).toMatchObject({ ok: false, errorKey: "gigs.needReason" });
  });

  it("the doors are in the catalog under both session features with their reach", () => {
    const door = (method: string, path: string) => ENDPOINTS.find((e) => e.method === method && e.path === path)!;
    expect(door("POST", "/api/v1/gigs/series")).toMatchObject({ access: ["EXPERT", "TEACHER"], feature: ["EXPERT_SESSIONS", "TEACHER_SESSIONS"] });
    expect(door("POST", "/api/v1/gigs/series/{seriesId}/cancel")).toMatchObject({ access: ["EXPERT", "TEACHER"], reach: "self" });
    expect(door("POST", "/api/v1/gigs/series/{seriesId}/book")).toMatchObject({ access: ["STUDENT", "PARENT"], reach: { STUDENT: "self", PARENT: "ownChild" } });
  });
});
