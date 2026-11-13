/**
 * The school's daily ceiling on invitation mail, two findings of the testing
 * analysis of 13 November 2026.
 *
 * TA-180 (Medium, Security): INVITE_EMAILS_DAILY was read only by the list
 * import of staff invitations. inviteParent created the Invite row and mailed
 * it with no count, and it is what the people page, its door and every intake
 * row with a guardian's address go through; and an intake list that linked
 * nobody (no code, no PEN) was never limited at all, so a just-registered
 * school could mint accounts and mail addresses of its choosing in the
 * platform's name, list after list.
 *
 * TA-286 (Low, Security): the same ceiling was not applied to a resend either,
 * and resending one pending invitation mailed a fresh link every call.
 *
 * Now a parent's invitation and a resend are refused once the school has
 * written its day's invitations, a resend of one invitation is refused past a
 * few a day, and every intake list counts against an hourly ceiling of its own.
 *
 * One ZZ school of this suite's own (made through the owner connection, with
 * the day's invitations written as rows), removed afterwards with every
 * account it made.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { createSession, getSession, type ActiveContext } from "@/lib/session";
import { __resetCookies, __setHeaders } from "../tests/stubs/next-headers";
import { inviteParent } from "@/lib/parent-link";
import { resendInviteFor } from "@/lib/invites";
import { admitPupils, IntakeLimited } from "@/lib/intake";
import { INTAKE_LISTS, INVITE_EMAILS_DAILY, INVITE_RESENDS } from "@/lib/rate-limit";

const db = new PrismaClient();
const STAMP = Date.now();
const MAIL = (who: string) => `zz-tapia-caps-${who}-${STAMP}@test.invalid`;
const ids: Record<string, string> = {};
let admin: ActiveContext;

const row = (over: Record<string, unknown> = {}) => ({
  line: 1, name: `ZZ TAPIA Caps Newcomer ${STAMP}`, birthdateKey: "2016-02-02", className: null,
  pupilEmail: null, guardianEmail: null, guardianName: null, relation: "PARENT" as const, studentCode: null, pen: null, ...over,
});

async function fillTheDay(): Promise<void> {
  await db.invite.createMany({
    data: Array.from({ length: INVITE_EMAILS_DAILY.limit }, (_, i) => ({
      schoolId: ids.school!, role: "TEACHER", email: `zz-tapia-caps-day${i}-${STAMP}@test.invalid`, tokenHash: `zz-tapia-caps-${STAMP}-${i}`, status: "PENDING", expiresAt: new Date(Date.now() + 86_400_000),
    })),
  });
}
async function emptyTheDay(): Promise<void> {
  await db.invite.deleteMany({ where: { schoolId: ids.school!, tokenHash: { startsWith: `zz-tapia-caps-${STAMP}-` } } });
}

beforeAll(async () => {
  process.env.EMAIL_TRANSPORT ??= "devbox";
  ids.school = (
    await db.school.create({
      data: { name: `ZZ TAPIA Caps ${STAMP}`, slug: `zz-tapia-caps-${STAMP}`, code: `ZPK${String(STAMP).slice(-6)}`, contactEmail: MAIL("contact"), timezone: "Asia/Kolkata", isTestFixture: true },
      select: { id: true },
    })
  ).id;
  ids.admin = (await db.user.create({ data: { name: "ZZ TAPIA Caps Admin", email: MAIL("admin"), prefs: "{}" }, select: { id: true } })).id;
  ids.adminM = (await db.membership.create({ data: { userId: ids.admin!, schoolId: ids.school!, role: "ADMIN", status: "ACTIVE" }, select: { id: true } })).id;
  ids.pupil = (await db.user.create({ data: { name: "ZZ TAPIA Caps Pupil", email: MAIL("pupil"), prefs: "{}", birthdate: new Date("2015-05-05T00:00:00Z"), isMinor: true }, select: { id: true } })).id;
  ids.pupilM = (await db.membership.create({ data: { userId: ids.pupil!, schoolId: ids.school!, role: "STUDENT", status: "ACTIVE", studentCode: `STU-ZZPK-${String(STAMP).slice(-6)}` }, select: { id: true } })).id;
  __resetCookies();
  __setHeaders({});
  await createSession(ids.admin!, { schoolId: ids.school!, role: "ADMIN" });
  admin = (await getSession())!;
}, 60_000);

afterAll(async () => {
  __resetCookies();
  __setHeaders({});
  const members = ids.school ? await db.membership.findMany({ where: { schoolId: ids.school }, select: { userId: true } }) : [];
  const userIds = [...new Set([...members.map((m) => m.userId), ids.admin, ids.pupil].filter((x): x is string => Boolean(x)))];
  const invites = ids.school ? await db.invite.findMany({ where: { schoolId: ids.school }, select: { id: true } }) : [];
  await db.rateLimit.deleteMany({ where: { OR: [{ bucket: `intake:lists:${ids.school}` }, { bucket: `intake:links:${ids.school}` }, ...invites.map((i) => ({ bucket: `invite-resend:${i.id}` }))] } });
  await db.session.deleteMany({ where: { userId: { in: userIds } } });
  await db.notification.deleteMany({ where: { userId: { in: userIds } } });
  if (ids.school) {
    await db.guardianship.deleteMany({ where: { studentSchoolId: ids.school } });
    await db.auditLog.deleteMany({ where: { OR: [{ schoolId: ids.school }, { actorUserId: { in: userIds } }] } });
    await db.school.deleteMany({ where: { id: ids.school } });
  }
  await db.user.deleteMany({ where: { id: { in: userIds } } });
  await db.outboundEmail.deleteMany({ where: { to: { startsWith: "zz-tapia-caps-", endsWith: `-${STAMP}@test.invalid` } } });
  await db.$disconnect();
});

describe("TA-180: a parent's invitation counts against the school's day", () => {
  it("TA-180: with the day's invitations written, inviteParent is refused and mails nothing", async () => {
    await fillTheDay();
    const result = await inviteParent(admin, ids.pupilM!, { email: MAIL("parent-one"), relation: "PARENT" });
    expect(result).toEqual({ ok: false, errorKey: "invites.dailyCapToday" });
    expect(await db.invite.count({ where: { schoolId: ids.school!, email: MAIL("parent-one") } })).toBe(0);
    expect(await db.outboundEmail.count({ where: { to: MAIL("parent-one") } })).toBe(0);
  });

  it("TA-180: an intake row's guardian is reported not sent, for the day's ceiling", async () => {
    const result = await admitPupils(admin, [row({ guardianEmail: MAIL("parent-two") })] as never, { locale: "en" });
    expect(result.outcomes[0]).toMatchObject({ status: "admitted", guardian: "notSent", guardianReasonKey: "invites.dailyCapToday" });
    expect(await db.outboundEmail.count({ where: { to: MAIL("parent-two") } })).toBe(0);
  });

  it("TA-180: under the ceiling a parent's invitation still goes (unchanged)", async () => {
    await emptyTheDay();
    const result = await inviteParent(admin, ids.pupilM!, { email: MAIL("parent-three"), relation: "PARENT" });
    expect(result.ok).toBe(true);
  });

  it("TA-180: a list that links nobody counts too: past the hour's lists it is refused whole", async () => {
    const bucket = `intake:lists:${ids.school}`;
    const windowEndsAt = new Date(Date.now() + INTAKE_LISTS.windowMs);
    await db.rateLimit.upsert({ where: { bucket }, create: { bucket, hits: INTAKE_LISTS.limit, windowEndsAt }, update: { hits: INTAKE_LISTS.limit, windowEndsAt } });
    const before = await db.membership.count({ where: { schoolId: ids.school!, role: "STUDENT" } });
    const refused = await admitPupils(admin, [row({ name: `ZZ TAPIA Caps Late ${STAMP}` })] as never, { locale: "en" }).then(
      () => null,
      (error: unknown) => error,
    );
    expect(refused).toBeInstanceOf(IntakeLimited);
    expect((refused as IntakeLimited).key).toBe("intake.tooManyLists");
    expect(await db.membership.count({ where: { schoolId: ids.school!, role: "STUDENT" } })).toBe(before);
    await db.rateLimit.deleteMany({ where: { bucket } });
  });
});

describe("TA-286: a resend counts as well", () => {
  it("TA-286: with the day's invitations written, a resend is refused", async () => {
    const invite = await db.invite.findFirstOrThrow({ where: { schoolId: ids.school!, email: MAIL("parent-three") }, select: { id: true } });
    await fillTheDay();
    const ctx = admin as ActiveContext & { schoolId: string };
    expect(await resendInviteFor(ctx, invite.id)).toEqual({ ok: false, errorKey: "invites.dailyCapToday" });
    await emptyTheDay();
  });

  it("TA-286: one invitation resent in a loop is refused after a few", async () => {
    const invite = await db.invite.findFirstOrThrow({ where: { schoolId: ids.school!, email: MAIL("parent-three") }, select: { id: true } });
    const ctx = admin as ActiveContext & { schoolId: string };
    const answers: boolean[] = [];
    for (let i = 0; i < INVITE_RESENDS.limit + 2; i++) answers.push((await resendInviteFor(ctx, invite.id)).ok);
    expect(answers).toEqual([...Array.from({ length: INVITE_RESENDS.limit }, () => true), false, false]);
    expect(await resendInviteFor(ctx, invite.id)).toEqual({ ok: false, errorKey: "invites.resendLimit" });
  });
});
