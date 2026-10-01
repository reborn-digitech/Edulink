import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { calendarFeed, calendarTokenUrl, renderIcs, rotateCalendarToken } from "@/lib/expert-kyc";
import { GET as feedGet } from "@/app/api/v1/expert/calendar.ics/route";
import type { ActiveContext } from "@/lib/session";

/**
 * The expert's calendar feed: an iCalendar document of their offered times
 * (decision 0004's slots and their consultation windows) and booked
 * sessions, opened by a per-expert token in the URL. School names and
 * session kinds only — no pupil, no guardian, no topic a school typed — and
 * a rotated token refuses the old one at once.
 */
const db = new PrismaClient();
const STAMP = Date.now();
const HOUR = 3_600_000;
let schoolId = "";
const SCHOOL_NAME = `ZZ Feed School ${STAMP}`;
const PUPIL_NAME = `ZZ Pupilname${STAMP}`;
const GUARDIAN_NAME = `ZZ Guardianname${STAMP}`;
const TOPIC = `ZZ topic about ${PUPIL_NAME}`;
const id: Record<string, string> = {};
const member: Record<string, string> = {};
let gigSlotId = "";
let windowId = "";
let bookedWindowId = "";

const expert = (): ActiveContext => ({ sessionId: "test", membershipId: null, schoolId: null, role: "EXPERT", user: { id: id.expert!, name: "ZZ Feed Expert", preferredName: null, email: null, avatarKey: null, isMinor: false, isSuperuser: false, isAppAdmin: false } }) as ActiveContext;
const t = (key: string, vars?: Record<string, string | number>) => `${key}${vars ? " " + JSON.stringify(vars) : ""}`;
const request = (token: string) => new Request(`http://localhost/api/v1/expert/calendar.ics?token=${encodeURIComponent(token)}`);

beforeAll(async () => {
  const s = await db.school.create({ data: { name: SCHOOL_NAME, slug: `zz-feed-${STAMP}`, code: `ZZF${String(STAMP).slice(-7)}`, contactEmail: `zz-feed-${STAMP}@test.invalid`, isTestFixture: true }, select: { id: true } });
  schoolId = s.id;
  const person = async (key: string, name: string, role: string | null) => {
    const user = await db.user.create({ data: { name, email: `zz-feed-${key}-${STAMP}@test.invalid` }, select: { id: true } });
    id[key] = user.id;
    if (role) member[key] = (await db.membership.create({ data: { userId: user.id, schoolId, role, status: "ACTIVE" }, select: { id: true } })).id;
  };
  await person("expert", "ZZ Feed Expert", null);
  await person("pupil", PUPIL_NAME, "STUDENT");
  await person("guardian", GUARDIAN_NAME, null);
  await person("admin", `ZZ Feed Admin ${STAMP}`, "ADMIN");
  const profile = await db.expertProfile.create({ data: { userId: id.expert!, headline: "ZZ Feed expert", offering: "BOTH", publishedAt: new Date() }, select: { id: true } });
  id.profile = profile.id;
  // A workshop next week with the pupil's confirmed seat, booked by the guardian.
  const slot = await db.gigSlot.create({ data: { providerUserId: id.expert!, providerKind: "EXPERT", kind: "WORKSHOP", title: `ZZ Careers; evening, "Q&A" ${STAMP}`, startsAt: new Date(Date.now() + 7 * 24 * HOUR), endsAt: new Date(Date.now() + 7 * 24 * HOUR + HOUR), meetingUrl: "https://meet.example.test/zz-feed", seats: 20, seatsTaken: 1 }, select: { id: true } });
  gigSlotId = slot.id;
  await db.gigBooking.create({ data: { schoolId, slotId: slot.id, studentMembershipId: member.pupil!, providerUserId: id.expert!, kind: "WORKSHOP", bookedByUserId: id.guardian!, purpose: `ZZ ${PUPIL_NAME} wants careers advice`, status: "CONFIRMED", consentAt: new Date(), consentUserId: id.guardian! } });
  // A free consultation window, and one a school booked with a topic that names the pupil.
  windowId = (await db.expertSlot.create({ data: { expertProfileId: profile.id, startsAt: new Date(Date.now() + 3 * 24 * HOUR), endsAt: new Date(Date.now() + 3 * 24 * HOUR + HOUR), note: "ZZ free window" }, select: { id: true } })).id;
  bookedWindowId = (await db.expertSlot.create({ data: { expertProfileId: profile.id, startsAt: new Date(Date.now() + 4 * 24 * HOUR), endsAt: new Date(Date.now() + 4 * 24 * HOUR + HOUR), bookedAt: new Date() }, select: { id: true } })).id;
  await db.expertBooking.create({ data: { schoolId, expertProfileId: profile.id, expertUserId: id.expert!, slotId: bookedWindowId, bookedByMembershipId: member.admin!, topic: TOPIC, status: "CONFIRMED" } });
});

afterAll(async () => {
  await db.gigSlot.deleteMany({ where: { id: gigSlotId } });
  await db.auditLog.deleteMany({ where: { actorUserId: { in: Object.values(id) } } }).catch(() => {});
  await db.school.deleteMany({ where: { id: schoolId } });
  await db.user.deleteMany({ where: { id: { in: [id.expert!, id.pupil!, id.guardian!, id.admin!] } } });
  await db.$disconnect();
});

describe("the expert's calendar feed", () => {
  it("renders a valid document: CRLF, folded lines, escaped text, one VEVENT per slot", () => {
    const long = "x".repeat(200);
    const ics = renderIcs([{ uid: "one", startsAt: new Date("2026-10-10T09:00:00Z"), endsAt: new Date("2026-10-10T09:30:00Z"), summary: "Workshop: a; b, c\nd", description: long, cancelled: false }], new Date("2026-10-01T00:00:00Z"), "ZZ cal");
    expect(ics.startsWith("BEGIN:VCALENDAR\r\nVERSION:2.0\r\n")).toBe(true);
    expect(ics.endsWith("END:VCALENDAR\r\n")).toBe(true);
    expect(ics).toContain("DTSTART:20261010T090000Z\r\nDTEND:20261010T093000Z\r\n");
    expect(ics).toContain("SUMMARY:Workshop: a\\; b\\, c\\nd\r\n");
    for (const line of ics.split("\r\n")) expect(Buffer.byteLength(line, "utf8")).toBeLessThanOrEqual(75);
    expect(ics).toMatch(/\r\n [x]+\r\n/);
  });

  it("no token, no feed; a minted token answers text/calendar with the slots, the school's name and the kinds, and no pupil, guardian or topic", async () => {
    expect(await calendarTokenUrl(expert())).toEqual({ url: null });
    expect(await calendarFeed("", t)).toBeNull();
    expect((await feedGet(request("not-a-token"))).status).toBe(404);
    const minted = await rotateCalendarToken(expert());
    expect(minted.url.startsWith("/api/v1/expert/calendar.ics?token=")).toBe(true);
    expect(await calendarTokenUrl(expert())).toEqual({ url: minted.url });
    const token = new URL(`http://localhost${minted.url}`).searchParams.get("token")!;
    const response = await feedGet(request(token));
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("text/calendar; charset=utf-8");
    expect(response.headers.get("cache-control")).toContain("no-store");
    const served = await response.text();
    expect(served).toContain("BEGIN:VCALENDAR");
    expect(served.replace(/\r\n /g, "")).not.toContain(PUPIL_NAME);
    expect(served).toContain("SUMMARY:Workshop: ");
    const ics = (await calendarFeed(token, t))!;
    expect(ics).toContain(`UID:gig-slot-${gigSlotId}@relay`);
    expect(ics).toContain(`UID:expert-slot-${windowId}@relay`);
    expect(ics).toContain(`UID:expert-slot-${bookedWindowId}@relay`);
    expect(ics).toContain("gigs.kindWORKSHOP");
    expect(ics).toContain("expert.icsConsultationWith");
    expect(ics).toContain("expert.icsWindowFree");
    // The school is named; the pupil, the guardian, the seat's purpose, the topic and the meeting link are not.
    const unfolded = ics.replace(/\r\n /g, "");
    expect(unfolded).toContain(SCHOOL_NAME.replace(/,/g, "\\,"));
    expect(unfolded).not.toContain(PUPIL_NAME);
    expect(unfolded).not.toContain(GUARDIAN_NAME);
    expect(unfolded).not.toContain("careers advice");
    expect(unfolded).not.toContain("ZZ topic");
    expect(unfolded).not.toContain("meet.example.test");
  });

  it("a rotated token refuses the old one at once and answers with the new", async () => {
    const before = new URL(`http://localhost${(await calendarTokenUrl(expert())).url!}`).searchParams.get("token")!;
    const rotated = await rotateCalendarToken(expert());
    const after = new URL(`http://localhost${rotated.url}`).searchParams.get("token")!;
    expect(after).not.toBe(before);
    expect((await feedGet(request(before))).status).toBe(404);
    expect((await feedGet(request(after))).status).toBe(200);
    expect(await db.auditLog.count({ where: { actorUserId: id.expert, action: "expert.calendar.token" } })).toBe(2);
  });
});
