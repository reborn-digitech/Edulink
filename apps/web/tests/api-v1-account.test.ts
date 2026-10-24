/**
 * The /api/v1/account handlers — the account page, the avatar, the devices,
 * the two code steps, the composer's choices and a booking's conversation —
 * invoked directly with a primed session, the way api-v1-shared.test.ts does:
 * the happy path, 401 signed out, 403 for a role the endpoint refuses, 404 for
 * what is not yours, 422 for a bad body, 429 at the code limit.
 *
 * Everything here is ZZ-prefixed and removed in afterAll.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { hashPassword } from "@/lib/crypto";
import { accountBookingSchema, accountOverviewSchema, accountPostOptionsSchema } from "@edulink/contracts";
import { createApiSession, createSession, getSession } from "@/lib/session";
import { __resetCookies } from "../tests/stubs/next-headers";
import { bookSlot } from "@/lib/experts";
import { normalisePhone } from "@/lib/phone";
import { PHONE_VERIFY_REQUESTS } from "@/lib/rate-limit";
import { GET as accountGet } from "@/app/api/v1/account/route";
import { POST as prefsPost } from "@/app/api/v1/account/prefs/route";
import { ENDPOINTS } from "@/lib/api-catalog";
import { POST as localePost } from "@/app/api/v1/account/locale/route";
import { POST as avatarPost } from "@/app/api/v1/account/avatar/route";
import { POST as signOutPost } from "@/app/api/v1/account/devices/sign-out/route";
import { POST as signOutOthersPost } from "@/app/api/v1/account/devices/sign-out-others/route";
import { DELETE as mobileDelete } from "@/app/api/v1/account/mobile/route";
import { POST as mobileCodePost } from "@/app/api/v1/account/mobile/code/route";
import { POST as mobileConfirmPost } from "@/app/api/v1/account/mobile/confirm/route";
import { POST as emailCodePost } from "@/app/api/v1/account/email/code/route";
import { POST as emailConfirmPost } from "@/app/api/v1/account/email/confirm/route";
import { GET as postOptionsGet } from "@/app/api/v1/account/post-options/route";
import { GET as bookingGet } from "@/app/api/v1/account/bookings/[bookingId]/route";
import { POST as bookingMessagePost } from "@/app/api/v1/account/bookings/[bookingId]/messages/route";
import { POST as bookingCancelPost } from "@/app/api/v1/account/bookings/[bookingId]/cancel/route";

const db = new PrismaClient();
const STAMP = Date.now();
const tail = String(STAMP).slice(-6);
const address = (tag: string) => `zz-account-${tag}-${STAMP}@test.invalid`;
/** A mobile nobody else holds: a 9, then the stamp's last nine digits. */
const RAW_PHONE = `9${String(STAMP).slice(-9)}`;
const PHONE = normalisePhone(RAW_PHONE)!;
const NEW_ADDRESS = address("newaddress");
/** Changing a contact detail asks for the password now (passwords.ts); every fixture person holds this one. */
const PASSWORD = `Zz-Account-${STAMP}-Kestrel`;
const TAGS = ["admin", "teacher", "pupil", "parent", "expert", "stranger"] as const;

let schoolId = "";
let classId = "";
let profileId = "";
let bookingId = "";
const users: Record<(typeof TAGS)[number], string> = { admin: "", teacher: "", pupil: "", parent: "", expert: "", stranger: "" };

const json = (body: unknown, method = "POST") =>
  new Request("http://localhost/x", {
    method,
    headers: { "content-type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
const get = () => new Request("http://localhost/x");
const post = () => new Request("http://localhost/x", { method: "POST" });
const p = (bookingIdParam: string) => ({ params: Promise.resolve({ bookingId: bookingIdParam }) });
type Envelope = { error: string; code: string; issues?: Record<string, string>; retryAfterSeconds?: number };

/** Signs in as one of the fixture's people; answers the new session's id. */
async function as(userId: string, opts: { schoolId?: string | null; role: "ADMIN" | "TEACHER" | "STUDENT" | "PARENT" | "EXPERT" }) {
  __resetCookies();
  return createSession(userId, opts);
}
const asAdmin = () => as(users.admin, { schoolId, role: "ADMIN" });
const asTeacher = () => as(users.teacher, { schoolId, role: "TEACHER" });
const asPupil = () => as(users.pupil, { schoolId, role: "STUDENT" });
const asParent = () => as(users.parent, { role: "PARENT" });
const asExpert = () => as(users.expert, { role: "EXPERT" });

/** The code, out of the devbox mailbox it was texted or mailed to — as a person reads it. */
async function codeSentTo(to: string, purpose: string): Promise<string> {
  const message = await db.outboundEmail.findFirst({ where: { to, purpose }, orderBy: { createdAt: "desc" }, select: { text: true } });
  const code = message ? /\b(\d{6})\b/.exec(message.text)?.[1] : undefined;
  if (!code) throw new Error(`no ${purpose} code went to ${to}`);
  return code;
}
const wrongCode = (code: string) => (code === "000000" ? "111111" : "000000");

beforeAll(async () => {
  const school = await db.school.create({
    data: { name: `ZZ Account School ${STAMP}`, slug: `zz-account-${STAMP}`, code: `ZAC${tail}`, contactEmail: address("school"), timezone: "Asia/Kolkata" },
    select: { id: true },
  });
  schoolId = school.id;

  for (const tag of TAGS) {
    users[tag] = (await db.user.create({ data: { name: `ZZ Account ${tag}`, email: address(tag) }, select: { id: true } })).id;
  }

  const [admin, teacher, pupil] = await Promise.all([
    db.membership.create({ data: { userId: users.admin, schoolId, role: "ADMIN", status: "ACTIVE" }, select: { id: true } }),
    db.membership.create({ data: { userId: users.teacher, schoolId, role: "TEACHER", status: "ACTIVE" }, select: { id: true } }),
    db.membership.create({ data: { userId: users.pupil, schoolId, role: "STUDENT", status: "ACTIVE", studentCode: `ZAC${STAMP}` }, select: { id: true } }),
  ]);
  void admin;

  // A class the teacher leads and the pupil is in, so the composer has one to offer.
  classId = (await db.class.create({ data: { schoolId, name: "ZZ Account Class 5", gradeLevel: "5", joinCode: `ZAC${tail}` }, select: { id: true } })).id;
  await db.classTeacher.create({ data: { classId, schoolId, teacherMembershipId: teacher.id, role: "LEAD" } });
  await db.enrollment.create({ data: { classId, schoolId, studentMembershipId: pupil.id, status: "ACTIVE" } });
  await db.guardianship.create({ data: { parentUserId: users.parent, studentMembershipId: pupil.id, studentSchoolId: schoolId, status: "ACTIVE" } });

  // A published expert, an hour a month out, booked by the school through the lib.
  profileId = (await db.expertProfile.create({ data: { userId: users.expert, headline: "ZZ Bridges", offering: "SESSIONS", publishedAt: new Date() }, select: { id: true } })).id;
  const startsAt = new Date(Date.now() + 30 * 86_400_000);
  const slot = await db.expertSlot.create({ data: { expertProfileId: profileId, startsAt, endsAt: new Date(startsAt.getTime() + 3_600_000) }, select: { id: true } });
  await asAdmin();
  ({ bookingId } = await bookSlot((await getSession())!, slot.id, "ZZ A talk about bridges"));

  __resetCookies();
});

beforeAll(async () => {
  await db.user.updateMany({ where: { id: { in: Object.values(users).filter(Boolean) } }, data: { passwordHash: await hashPassword(PASSWORD) } });
});

afterAll(async () => {
  __resetCookies();
  const userIds = Object.values(users).filter(Boolean);
  await db.expertMessage.deleteMany({ where: { schoolId } });
  await db.expertBooking.deleteMany({ where: { schoolId } });
  // Cancelling puts the hour back as a new slot, so by the profile rather than by id.
  await db.expertSlot.deleteMany({ where: { expertProfileId: profileId } });
  await db.expertProfile.deleteMany({ where: { userId: { in: userIds } } });
  await db.notification.deleteMany({ where: { userId: { in: userIds } } });
  await db.session.deleteMany({ where: { userId: { in: userIds } } });
  await db.authToken.deleteMany({ where: { userId: { in: userIds } } });
  await db.rateLimit.deleteMany({ where: { OR: userIds.map((id) => ({ bucket: { contains: id } })) } });
  // Everything the devbox transport wrote: the texts to the number, the codes to the new address, any notice to an old one.
  await db.outboundEmail.deleteMany({ where: { to: { in: [PHONE, NEW_ADDRESS, ...TAGS.map(address)] } } });
  await db.auditLog.deleteMany({ where: { actorUserId: { in: userIds } } });
  await db.school.deleteMany({ where: { id: schoolId } });
  await db.user.deleteMany({ where: { id: { in: userIds } } });
  await db.$disconnect();
});

describe("signed out", () => {
  it("every handler answers 401 in the contract's envelope", async () => {
    __resetCookies();
    const calls: Promise<Response>[] = [
      accountGet(),
      prefsPost(json({ channels: { push: true, email: true }, quietHours: null })),
      localePost(json({ locale: "hi" })),
      avatarPost(json({ avatarKey: "preset:fox-sunset" })),
      signOutPost(json({ sessionId: "anything" })),
      signOutOthersPost(json({ confirm: true })),
      mobileDelete(json({ confirm: true }, "DELETE")),
      mobileCodePost(json({ phone: RAW_PHONE, password: PASSWORD })),
      mobileConfirmPost(json({ code: "123456" })),
      emailCodePost(json({ email: NEW_ADDRESS, password: PASSWORD })),
      emailConfirmPost(json({ code: "123456" })),
      postOptionsGet(),
      bookingGet(get(), p(bookingId)),
      bookingMessagePost(json({ body: "hello" }), p(bookingId)),
      bookingCancelPost(post(), p(bookingId)),
    ];
    for (const res of await Promise.all(calls)) {
      expect(res.status).toBe(401);
      expect(await res.json()).toMatchObject({ code: "UNAUTHORIZED" });
    }
    // …and the signed-out cancel really did nothing.
    expect((await db.expertBooking.findUniqueOrThrow({ where: { id: bookingId } })).status).not.toBe("CANCELLED");
  });
});

describe("the account page", () => {
  it("reads in the contract's shape", async () => {
    await asAdmin();
    const res = await accountGet();
    expect(res.status).toBe(200);
    const body = accountOverviewSchema.parse(await res.json());
    expect(body.name).toBe("ZZ Account admin");
    expect(body.email).toBe(address("admin"));
    expect(body.loginName).toBeNull();
    expect(body.phone).toBeNull();
    expect(body.showRecord).toBe(false);

    // A guardian has a record to open.
    await asParent();
    expect(accountOverviewSchema.parse(await (await accountGet()).json()).showRecord).toBe(true);
  });
});

describe("preferences", () => {
  it("an empty body is a 422", async () => {
    await asAdmin();
    const res = await prefsPost(json({}));
    expect(res.status).toBe(422);
    expect(await res.json()).toMatchObject({ code: "BAD_REQUEST" });
  });

  it("QA-55/56: a clock time that does not exist is refused naming the field, and the channels are required as the summary says", async () => {
    await asAdmin();
    // Before QA-55 "25:99" was saved: 200 {"ok":true}.
    for (const start of ["25:99", "24:00", "7:60"]) {
      const res = await prefsPost(json({ channels: { push: true, email: true }, quietHours: { start, end: "06:00" } }));
      expect(res.status, start).toBe(422);
      expect(((await res.json()) as Envelope).issues?.["quietHours.start"]).toBeTruthy();
    }
    expect((await prefsPost(json({ channels: { push: true, email: true }, quietHours: { start: "7:30", end: "23:59" } }))).status).toBe(200);
    // QA-56: quiet hours alone are refused for want of the channels, which the catalog's summary now says.
    const alone = await prefsPost(json({ quietHours: { start: "22:00", end: "06:00" } }));
    expect(alone.status).toBe(422);
    expect(((await alone.json()) as Envelope).issues?.channels).toBeTruthy();
    expect(ENDPOINTS.find((e) => e.method === "POST" && e.path === "/api/v1/account/prefs")?.summary).toMatch(/channels and the quiet hours are required/);
    await prefsPost(json({ channels: { push: true, email: true }, quietHours: null }));
  });

  it("quiet hours that start and end at the same minute are the lib's refusal, against quietHours.end", async () => {
    await asAdmin();
    const res = await prefsPost(json({ channels: { push: true, email: true }, quietHours: { start: "22:00", end: "22:00" } }));
    expect(res.status).toBe(422);
    const body = (await res.json()) as Envelope;
    expect(body.code).toBe("BAD_REQUEST");
    expect(body.issues?.["quietHours.end"]).toBeTruthy();
    expect(body.issues?.["quietHours.end"]).toBe(body.error);
  });

  it("saves only what was sent: a theme chosen elsewhere survives a notifications-only save", async () => {
    await db.user.update({
      where: { id: users.admin },
      data: { prefs: JSON.stringify({ theme: "dark", contrast: "high", font: "default", motion: "full", locale: "en", channels: { push: false, email: false }, quietHours: null }) },
    });
    await asAdmin();
    const res = await prefsPost(json({ channels: { push: true, email: false }, quietHours: { start: "21:30", end: "06:45" } }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });

    const prefs = JSON.parse((await db.user.findUniqueOrThrow({ where: { id: users.admin }, select: { prefs: true } })).prefs) as Record<string, unknown>;
    expect(prefs.theme).toBe("dark");
    expect(prefs.contrast).toBe("high");
    expect(prefs.channels).toEqual({ push: true, email: false });
    expect(prefs.quietHours).toEqual({ start: "21:30", end: "06:45" });

    const overview = accountOverviewSchema.parse(await (await accountGet()).json());
    expect(overview.prefs.theme).toBe("dark");
    expect(overview.prefs.quietHours).toEqual({ start: "21:30", end: "06:45" });
  });
});

describe("language", () => {
  it("writes prefs.locale; an unknown locale is a 422", async () => {
    await asAdmin();
    const res = await localePost(json({ locale: "hi" }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ locale: "hi" });
    const prefs = JSON.parse((await db.user.findUniqueOrThrow({ where: { id: users.admin }, select: { prefs: true } })).prefs) as { locale: string; theme: string };
    expect(prefs.locale).toBe("hi");
    expect(prefs.theme).toBe("dark");

    expect((await localePost(json({ locale: "xx" }))).status).toBe(422);
    expect((await localePost(json({}))).status).toBe(422);
    // Back to English, so the sentences below are read in one language.
    expect((await localePost(json({ locale: "en" }))).status).toBe(200);
  });
});

describe("avatar", () => {
  it("refuses anything that is not a preset, and sets a preset", async () => {
    await asExpert();
    const refused = await avatarPost(json({ avatarKey: "not-a-preset" }));
    expect(refused.status).toBe(422);
    const body = (await refused.json()) as Envelope;
    expect(body.code).toBe("BAD_REQUEST");
    expect(body.issues?.avatarKey).toBe(body.error);
    expect((await db.user.findUniqueOrThrow({ where: { id: users.expert } })).avatarKey).toBeNull();

    const res = await avatarPost(json({ avatarKey: "preset:fox-sunset" }));
    expect(res.status).toBe(200);
    expect((await db.user.findUniqueOrThrow({ where: { id: users.expert } })).avatarKey).toBe("preset:fox-sunset");
  });
});

describe("devices", () => {
  it("this device is a 403, another of mine is signed out, a stranger's is a 404", async () => {
    const current = await asAdmin();
    const self = await signOutPost(json({ sessionId: current }));
    expect(self.status).toBe(403);
    expect(await self.json()).toMatchObject({ code: "FORBIDDEN" });

    const second = await createApiSession(users.admin, { schoolId, role: "ADMIN", userAgent: "ZZ second phone" });
    const res = await signOutPost(json({ sessionId: second.sessionId }));
    expect(res.status).toBe(200);
    expect((await db.session.findUniqueOrThrow({ where: { id: second.sessionId } })).revokedAt).not.toBeNull();
    // Already out.
    expect((await signOutPost(json({ sessionId: second.sessionId }))).status).toBe(404);

    const theirs = await createApiSession(users.stranger, { userAgent: "ZZ stranger" });
    const refused = await signOutPost(json({ sessionId: theirs.sessionId }));
    expect(refused.status).toBe(404);
    expect(await refused.json()).toMatchObject({ code: "NOT_FOUND" });
    expect((await db.session.findUniqueOrThrow({ where: { id: theirs.sessionId } })).revokedAt).toBeNull();

    expect((await signOutPost(json({}))).status).toBe(422);
  });

  it("everywhere else needs { confirm: true }, and keeps this one", async () => {
    const current = await asAdmin();
    const extra = await createApiSession(users.admin, { schoolId, role: "ADMIN", userAgent: "ZZ old tablet" });
    expect((await signOutOthersPost(json({}))).status).toBe(422);
    expect((await signOutOthersPost(json({ confirm: false }))).status).toBe(422);
    expect((await db.session.findUniqueOrThrow({ where: { id: extra.sessionId } })).revokedAt).toBeNull();

    const res = await signOutOthersPost(json({ confirm: true }));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { count: number };
    expect(body.count).toBeGreaterThanOrEqual(1);
    expect((await db.session.findUniqueOrThrow({ where: { id: extra.sessionId } })).revokedAt).not.toBeNull();
    expect((await db.session.findUniqueOrThrow({ where: { id: current } })).revokedAt).toBeNull();
    expect((await getSession())?.sessionId).toBe(current);
  });
});

describe("the mobile number", () => {
  it("a junk number is a 422 against phone; a real one gets a code and a hint, and nothing is saved yet", async () => {
    await asAdmin();
    const junk = await mobileCodePost(json({ phone: "not a number", password: PASSWORD }));
    expect(junk.status).toBe(422);
    const refusal = (await junk.json()) as Envelope;
    expect(refusal.code).toBe("BAD_REQUEST");
    expect(refusal.issues?.phone).toBe(refusal.error);
    expect((await mobileCodePost(json({}))).status).toBe(422);

    const res = await mobileCodePost(json({ phone: RAW_PHONE, password: PASSWORD }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ hint: PHONE.slice(-4) });
    expect((await db.user.findUniqueOrThrow({ where: { id: users.admin } })).phone).toBeNull();
  });

  it("a wrong code is a 422 against code; the right one puts the number on the account", async () => {
    await asAdmin();
    const code = await codeSentTo(PHONE, "PHONE_VERIFY");
    const wrong = await mobileConfirmPost(json({ code: wrongCode(code) }));
    expect(wrong.status).toBe(422);
    const refusal = (await wrong.json()) as Envelope;
    expect(refusal.issues?.code).toBe(refusal.error);
    expect((await db.user.findUniqueOrThrow({ where: { id: users.admin } })).phone).toBeNull();

    const res = await mobileConfirmPost(json({ code }));
    expect(res.status).toBe(200);
    const user = await db.user.findUniqueOrThrow({ where: { id: users.admin } });
    expect(user.phone).toBe(PHONE);
    expect(user.phoneVerifiedAt).not.toBeNull();
    const overview = accountOverviewSchema.parse(await (await accountGet()).json());
    expect(overview.phone).toBe(PHONE);
    expect(overview.phoneConfirmed).toBe(true);
  });

  it("taking it off needs { confirm: true } and no code", async () => {
    await asAdmin();
    expect((await mobileDelete(json({}, "DELETE"))).status).toBe(422);
    const res = await mobileDelete(json({ confirm: true }, "DELETE"));
    expect(res.status).toBe(200);
    const user = await db.user.findUniqueOrThrow({ where: { id: users.admin } });
    expect(user.phone).toBeNull();
    expect(user.phoneVerifiedAt).toBeNull();
  });

  it("the code step is limited as the web's is: a 429 with Retry-After", async () => {
    await asAdmin();
    let last: Response | undefined;
    // One code already went above; ask until the allowance is spent.
    for (let i = 0; i <= PHONE_VERIFY_REQUESTS.limit; i++) {
      last = await mobileCodePost(json({ phone: RAW_PHONE, password: PASSWORD }));
      if (last.status === 429) break;
    }
    expect(last!.status).toBe(429);
    expect(last!.headers.get("Retry-After")).toMatch(/^\d+$/);
    const body = (await last!.json()) as Envelope;
    expect(body.code).toBe("RATE_LIMITED");
    expect(body.retryAfterSeconds).toBeGreaterThan(0);
    expect(body.error.length).toBeGreaterThan(0);
  });
});

describe("the email address", () => {
  it("not an address is a 422 against email; a real one gets a code and nothing changes yet", async () => {
    await asTeacher();
    const junk = await emailCodePost(json({ email: "not-an-email", password: PASSWORD }));
    expect(junk.status).toBe(422);
    const refusal = (await junk.json()) as Envelope;
    expect(refusal.issues?.email).toBe(refusal.error);

    const res = await emailCodePost(json({ email: NEW_ADDRESS, password: PASSWORD }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ sentTo: NEW_ADDRESS });
    expect((await db.user.findUniqueOrThrow({ where: { id: users.teacher } })).email).toBe(address("teacher"));
  });

  it("a wrong code is a 422 against code, and the address stays", async () => {
    await asTeacher();
    const code = await codeSentTo(NEW_ADDRESS, "EMAIL_CHANGE");
    const res = await emailConfirmPost(json({ code: wrongCode(code) }));
    expect(res.status).toBe(422);
    const refusal = (await res.json()) as Envelope;
    expect(refusal.code).toBe("BAD_REQUEST");
    expect(refusal.issues?.code).toBe(refusal.error);
    expect((await emailConfirmPost(json({ code: "12" }))).status).toBe(422);
    expect((await db.user.findUniqueOrThrow({ where: { id: users.teacher } })).email).toBe(address("teacher"));
  });
});

describe("the composer's choices", () => {
  it("a teacher gets the class they lead and the whole school", async () => {
    await asTeacher();
    const res = await postOptionsGet();
    expect(res.status).toBe(200);
    const body = accountPostOptionsSchema.parse(await res.json());
    expect(body.role).toBe("TEACHER");
    expect(body.classes.map((c) => c.id)).toContain(classId);
    expect(body.grades).toContain("5");
    expect(body.allowSchoolWide).toBe(true);
    expect(body.reviewedFirst).toBe(false);
  });

  it("a pupil's post is read first and never school-wide", async () => {
    await asPupil();
    const res = await postOptionsGet();
    expect(res.status).toBe(200);
    const body = accountPostOptionsSchema.parse(await res.json());
    expect(body.reviewedFirst).toBe(true);
    expect(body.allowSchoolWide).toBe(false);
    expect(body.grades).toEqual([]);
  });

  it("a guardian and an expert are refused", async () => {
    await asParent();
    expect((await postOptionsGet()).status).toBe(403);
    await asExpert();
    expect((await postOptionsGet()).status).toBe(403);
  });
});

describe("an expert booking", () => {
  it("the expert and the school's teacher read it; a pupil and a guardian get a 404", async () => {
    await asExpert();
    const res = await bookingGet(get(), p(bookingId));
    expect(res.status).toBe(200);
    const body = accountBookingSchema.parse(await res.json());
    expect(body.id).toBe(bookingId);
    expect(body.topic).toBe("ZZ A talk about bridges");
    expect(body.schoolName).toBe(`ZZ Account School ${STAMP}`);
    expect(body.viewerIsExpert).toBe(true);
    expect(body.canCancel).toBe(true);

    await asTeacher();
    const staff = accountBookingSchema.parse(await (await bookingGet(get(), p(bookingId))).json());
    expect(staff.viewerIsExpert).toBe(false);
    expect(staff.canCancel).toBe(true);

    // A side the door is not for is refused by role, before the id or the body is read (the API sweep of 6 Oct 2026):
    // 403 for a real booking and for an id nobody holds alike, so a pupil learns nothing from the difference.
    await asPupil();
    const pupil = await bookingGet(get(), p(bookingId));
    expect(pupil.status).toBe(403);
    expect(await pupil.json()).toMatchObject({ code: "FORBIDDEN" });
    expect((await bookingGet(get(), p("zz-no-such-booking"))).status).toBe(403);
    expect((await bookingMessagePost(json({}), p(bookingId))).status).toBe(403);
    expect((await bookingCancelPost(post(), p(bookingId))).status).toBe(403);
    await asParent();
    expect((await bookingGet(get(), p(bookingId))).status).toBe(403);
  });

  it("a message needs a body; one lands and reads back as mine", async () => {
    await asTeacher();
    expect((await bookingMessagePost(json({}), p(bookingId))).status).toBe(422);
    expect((await bookingMessagePost(json({ body: "   " }), p(bookingId))).status).toBe(422);
    const res = await bookingMessagePost(json({ body: "ZZ Could you bring a model?" }), p(bookingId));
    expect(res.status).toBe(200);
    expect(await db.expertMessage.count({ where: { bookingId } })).toBe(1);

    const mine = accountBookingSchema.parse(await (await bookingGet(get(), p(bookingId))).json());
    expect(mine.messages.map((m) => [m.body, m.mine])).toEqual([["ZZ Could you bring a model?", true]]);
    await asExpert();
    const theirs = accountBookingSchema.parse(await (await bookingGet(get(), p(bookingId))).json());
    expect(theirs.messages[0]?.mine).toBe(false);

    // A pupil cannot write into it.
    await asPupil();
    expect((await bookingMessagePost(json({ body: "ZZ hi" }), p(bookingId))).status).toBe(403);
    expect(await db.expertMessage.count({ where: { bookingId } })).toBe(1);
  });

  it("a pupil cannot cancel it; the school can, and then it cannot be cancelled again", async () => {
    await asPupil();
    expect((await bookingCancelPost(post(), p(bookingId))).status).toBe(403);
    expect((await db.expertBooking.findUniqueOrThrow({ where: { id: bookingId } })).status).not.toBe("CANCELLED");

    await asTeacher();
    const res = await bookingCancelPost(post(), p(bookingId));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect((await db.expertBooking.findUniqueOrThrow({ where: { id: bookingId } })).status).toBe("CANCELLED");

    await asExpert();
    const after = accountBookingSchema.parse(await (await bookingGet(get(), p(bookingId))).json());
    expect(after.status).toBe("CANCELLED");
    expect(after.canCancel).toBe(false);
  });
});
