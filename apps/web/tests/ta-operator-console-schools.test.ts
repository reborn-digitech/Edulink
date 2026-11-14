/**
 * The operator's schools, invitations, onboarding and server log (testing analysis of 13 November 2026,
 * operator-console batch).
 *
 * TA-174 (Medium, Security): a removed school still took in whoever held a pending invitation; removal revoked none
 *   and acceptance did not look at removedAt. Now removal revokes the school's pending invitations in its own
 *   transaction, and acceptance refuses an invitation of a removed school.
 * TA-172 (Medium, Functional): guided onboarding answered 500 for a school whose name's slug was taken, because
 *   createSchool's retry loop ran inside the onboarding transaction the first collision had aborted. Now a create
 *   inside a caller's transaction tries one slug and onboarding retries the whole transaction with the next number;
 *   a typed slug is created as typed.
 * TA-361 (Low, Concurrency): a second press of Remove re-stamped the school, and Restore then brought nobody back.
 *   Now the removal claims the flag first, in the same transaction as the roll, and a second press is refused.
 * TA-364 (Low, Security): "withdraw a pending admin invitation" withdrew any invitation of any school, with no trace
 *   in the school's log. Now only an ADMIN or PRINCIPAL invitation is withdrawn, and a row is written in the school's
 *   own log beside the operator's.
 * TA-594 (Low, Functional): bulk removal and bulk erasure stopped at 100 schools without saying so. Now every school
 *   past the hundredth is named in the failures, and an erasure of more than 100 is refused with the limit.
 * TA-593 (Low, Functional): a day that matches YYYY-MM-DD but is not on the calendar answered 500 on the subscription
 *   and onboarding doors. Now it is refused by name.
 * TA-362 (Low, Ops): the operator's log left out the content team's actions and the operator's own expert decisions.
 * TA-454 (Low, Performance): the log's action list loaded every server audit row to list the names in memory.
 *
 * Every row is one this suite makes (stamped ZZ schools, @test.invalid accounts) and removes.
 */
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { PrismaClient } from "@prisma/client";
import type { OperatorOnboardBody } from "@edulink/contracts";
import { generateToken, hashToken } from "@/lib/crypto";
import { acceptInvite } from "@/app/invite/[token]/actions";
import { db as appDb } from "@/lib/db";
import {
  deleteSchoolsEntirely,
  inviteAdmin,
  listServerAudit,
  removeSchool,
  removeSchools,
  restoreSchool,
  revokeInvite,
} from "@/lib/superuser";
import { onboardSchool, setSubscription } from "@/lib/subscriptions";
import { actionKey } from "@/lib/safety-labels";
import type { ActiveContext } from "@/lib/session";
import { __resetCookies, __setHeaders } from "../tests/stubs/next-headers";

const db = new PrismaClient();
const STAMP = Date.now();
const MAIL = (who: string) => `zz-taopc-sc-${who}-${STAMP}@test.invalid`;
const PASSWORD = `Zz-taopc-${STAMP}-Kingfisher`;
const CALLER = `2001:db8:7a:79:${Math.floor(STAMP / 65536).toString(16).slice(-4)}:${(STAMP % 65536).toString(16)}::1`;
const schools: string[] = [];
const users: string[] = [];
let operator: ActiveContext;

function ctx(userId: string): ActiveContext {
  return {
    sessionId: `zz-taopc-sc-${STAMP}`,
    membershipId: null,
    schoolId: null,
    role: null,
    user: {
      id: userId,
      name: "ZZ TA Operator",
      preferredName: null,
      email: MAIL("operator"),
      avatarKey: null,
      isMinor: false,
      isSuperuser: true,
      isAppAdmin: false,
      prefs: { theme: "system", contrast: "normal", font: "default", motion: "full", locale: "en", channels: { push: false, email: false }, quietHours: null },
    },
  };
}

let serial = 0;
async function school(label: string): Promise<string> {
  serial++;
  const id = (
    await db.school.create({
      data: { name: `ZZ TA OPC ${label} ${STAMP}`, slug: `zz-taopc-sc-${serial}-${STAMP}`, code: `ZOPS${serial}${String(STAMP).slice(-5)}`, contactEmail: MAIL("contact"), timezone: "Asia/Kolkata" },
      select: { id: true },
    })
  ).id;
  schools.push(id);
  return id;
}

async function person(who: string, schoolId: string, role: string): Promise<{ userId: string; membershipId: string }> {
  const userId = (await db.user.create({ data: { name: `ZZ TA OPC ${who}`, email: MAIL(who), prefs: "{}" }, select: { id: true } })).id;
  users.push(userId);
  const membershipId = (await db.membership.create({ data: { userId, schoolId, role, status: "ACTIVE" }, select: { id: true } })).id;
  return { userId, membershipId };
}

async function invite(schoolId: string, who: string, role: string): Promise<{ id: string; token: string }> {
  const token = generateToken();
  const row = await db.invite.create({
    data: { schoolId, role, email: MAIL(who), tokenHash: hashToken(token), status: "PENDING", expiresAt: new Date(Date.now() + 14 * 86_400_000) },
    select: { id: true },
  });
  return { id: row.id, token };
}

function onboardBody(name: string, extra: Partial<OperatorOnboardBody> = {}): OperatorOnboardBody {
  return { name, contactEmail: MAIL("contact"), timezone: "Asia/Kolkata", trial: false, adminEmail: MAIL(`head-${serial++}`), ...extra };
}

beforeAll(async () => {
  process.env.EMAIL_TRANSPORT ??= "devbox";
  const op = (await db.user.create({ data: { name: "ZZ TA Operator", email: MAIL("operator"), isSuperuser: true, prefs: "{}" }, select: { id: true } })).id;
  users.push(op);
  operator = ctx(op);
  __resetCookies();
  __setHeaders({ "x-forwarded-for": CALLER });
}, 60_000);

afterAll(async () => {
  __resetCookies();
  __setHeaders({});
  const made = await db.school.findMany({ where: { OR: [{ id: { in: schools } }, { name: { startsWith: "ZZ TA OPC ", endsWith: ` ${STAMP}` } }] }, select: { id: true } });
  const schoolIds = made.map((s) => s.id);
  const members = await db.membership.findMany({ where: { schoolId: { in: schoolIds } }, select: { userId: true } });
  const accounts = await db.user.findMany({ where: { email: { startsWith: "zz-taopc-sc-", endsWith: `-${STAMP}@test.invalid` } }, select: { id: true } });
  const userIds = [...new Set([...users, ...members.map((m) => m.userId), ...accounts.map((u) => u.id)])];
  await db.rateLimit.deleteMany({ where: { OR: [{ bucket: { contains: CALLER } }, { bucket: { contains: "zz-taopc-sc-" } }] } });
  await db.session.deleteMany({ where: { userId: { in: userIds } } });
  await db.authToken.deleteMany({ where: { userId: { in: userIds } } });
  await db.notification.deleteMany({ where: { userId: { in: userIds } } });
  await db.guardianship.deleteMany({ where: { studentSchoolId: { in: schoolIds } } });
  await db.auditLog.deleteMany({ where: { OR: [{ schoolId: { in: schoolIds } }, { actorUserId: { in: userIds } }] } });
  await db.operatorAccess.deleteMany({ where: { schoolId: { in: schoolIds } } });
  await db.schoolRecord.deleteMany({ where: { schoolId: { in: schoolIds } } });
  await db.school.deleteMany({ where: { id: { in: schoolIds } } });
  await db.user.deleteMany({ where: { id: { in: userIds } } });
  await db.outboundEmail.deleteMany({ where: { to: { startsWith: "zz-taopc-sc-", endsWith: `-${STAMP}@test.invalid` } } });
  await db.$disconnect();
});

describe.sequential("TA-174: a removed school takes in nobody by a pending invitation", () => {
  it("TA-174: removal revokes the pending invitations, and the link then says it is no longer valid", async () => {
    const id = await school("Removed With Invite");
    await person("rm-admin", id, "ADMIN");
    const pending = await invite(id, "rm-invitee", "ADMIN");
    expect((await removeSchool(operator, id)).ok).toBe(true);
    expect((await db.invite.findUniqueOrThrow({ where: { id: pending.id }, select: { status: true } })).status).toBe("REVOKED");

    __resetCookies();
    const out = await acceptInvite({ token: pending.token, name: "ZZ TA OPC Invitee", password: PASSWORD });
    expect(out).toMatchObject({ ok: false, errors: { _form: "That invitation is no longer valid." } });
    const joined = await db.membership.count({ where: { schoolId: id, user: { email: MAIL("rm-invitee") } } });
    expect(joined).toBe(0);
  });

  it("TA-174: an invitation still pending at a school already removed is refused at acceptance", async () => {
    const id = await school("Removed Before");
    await db.school.update({ where: { id }, data: { removedAt: new Date() } });
    const pending = await invite(id, "old-invitee", "TEACHER");
    __resetCookies();
    const out = await acceptInvite({ token: pending.token, name: "ZZ TA OPC Old Invitee", password: PASSWORD });
    expect(out).toMatchObject({ ok: false, errors: { _form: "That invitation is no longer valid." } });
    expect(await db.membership.count({ where: { schoolId: id } })).toBe(0);
  });
});

describe.sequential("TA-361: two presses of Remove leave a school Restore can bring back", () => {
  it("TA-361: of two overlapping removals one is refused, and Restore brings every member back", async () => {
    const id = await school("Double Remove");
    await person("dr-admin", id, "ADMIN");
    await person("dr-teacher", id, "TEACHER");
    await person("dr-pupil", id, "STUDENT");

    const [a, b] = await Promise.all([removeSchool(operator, id), removeSchool(operator, id)]);
    expect([a.ok, b.ok].filter(Boolean)).toHaveLength(1);
    const flagged = await db.school.findUniqueOrThrow({ where: { id }, select: { removedAt: true } });
    expect(flagged.removedAt).not.toBeNull();
    // Every membership carries the stamp the school carries: the undo list.
    expect(await db.membership.count({ where: { schoolId: id, leftAt: flagged.removedAt } })).toBe(3);

    expect((await restoreSchool(operator, id)).ok).toBe(true);
    expect(await db.membership.count({ where: { schoolId: id, leftAt: null } })).toBe(3);
    expect(await db.schoolRecord.count({ where: { schoolId: id } })).toBe(0);
  });
});

describe.sequential("TA-364: the operator withdraws admin invitations only, and the school is told", () => {
  it("TA-364: a teacher's invitation is not the operator's to withdraw", async () => {
    const id = await school("Teacher Invite");
    const pending = await invite(id, "t-invitee", "TEACHER");
    expect((await revokeInvite(operator, pending.id)).ok).toBe(false);
    expect((await db.invite.findUniqueOrThrow({ where: { id: pending.id }, select: { status: true } })).status).toBe("PENDING");
  });

  it("TA-364: an admin invitation withdrawn by the operator is written in the school's own log", async () => {
    const id = await school("Admin Invite");
    expect((await inviteAdmin(operator, id, { email: MAIL("a-invitee") })).ok).toBe(true);
    const pending = await db.invite.findFirstOrThrow({ where: { schoolId: id, status: "PENDING" }, select: { id: true } });
    expect((await revokeInvite(operator, pending.id)).ok).toBe(true);
    const row = await db.auditLog.findFirst({ where: { schoolId: id, action: "superuser.invite.revoke", targetId: pending.id } });
    expect(row).not.toBeNull();
    expect(row!.meta).not.toContain(MAIL("a-invitee"));
    expect((await revokeInvite(operator, pending.id)).ok).toBe(false);
  });
});

describe.sequential("TA-594: a bulk action past one hundred schools says so", () => {
  it("TA-594: the 101st school of a bulk removal is named in the failures, not dropped", async () => {
    const real = await school("Bulk 101st");
    const fakes = Array.from({ length: 100 }, (_, i) => `zz-taopc-none-${STAMP}-${i}`);
    const out = await removeSchools(operator, [...fakes, real]);
    expect(out.done + out.failed.length).toBe(101);
    const removed = (await db.school.findUniqueOrThrow({ where: { id: real }, select: { removedAt: true } })).removedAt !== null;
    const named = out.failed.find((f) => f.id === real);
    expect(removed || named?.errorKey === "root.bulkTooMany").toBe(true);
  });

  it("TA-594: an erasure of 101 schools is refused with the limit, not as a wrong phrase", async () => {
    const fakes = Array.from({ length: 101 }, (_, i) => `zz-taopc-none-${STAMP}-${i}`);
    const out = await deleteSchoolsEntirely(operator, fakes, "DELETE 101");
    expect(out).toMatchObject({ ok: false, errorKey: "root.bulkTooMany", done: 0 });
  });
});

describe.sequential("TA-172: guided onboarding numbers a name already taken", () => {
  it("TA-172: a second school of the same name is onboarded with a numbered slug", async () => {
    const name = `ZZ TA OPC Same Name ${STAMP}`;
    const first = await onboardSchool(operator, onboardBody(name));
    expect(first.ok).toBe(true);
    const second = await onboardSchool(operator, onboardBody(name));
    expect(second.ok).toBe(true);
    if (!first.ok || !second.ok) return;
    expect(second.slug).not.toBe(first.slug);
    expect(second.slug.startsWith(first.slug)).toBe(true);
  });

  it("TA-172: with a slug of the operator's own, the school is made with that slug even when the name's is taken", async () => {
    const name = `ZZ TA OPC Same Name ${STAMP}`;
    const slug = `zz-taopc-own-${STAMP}`;
    const out = await onboardSchool(operator, onboardBody(name, { slug }));
    expect(out).toMatchObject({ ok: true, slug });
  });
});

describe.sequential("TA-593: a day not on the calendar is refused by name", () => {
  it("TA-593: a subscription due on 2026-13-01 is refused and nothing is written", async () => {
    const id = await school("Subscription Day");
    await expect(setSubscription(operator, id, { dueAt: "2026-13-01", reason: "ZZ typing slip" })).resolves.toEqual({ ok: false, errorKey: "root.subscriptionDayNotReal" });
    expect((await db.school.findUniqueOrThrow({ where: { id }, select: { subscriptionDueAt: true } })).subscriptionDueAt).toBeNull();
  });

  it("TA-593: onboarding that starts on 2026-02-30 is refused before anything is made", async () => {
    const name = `ZZ TA OPC Bad Day ${STAMP}`;
    await expect(onboardSchool(operator, onboardBody(name, { startsAt: "2026-02-30" }))).resolves.toEqual({ ok: false, errorKey: "root.subscriptionDayNotReal" });
    expect(await db.school.count({ where: { name } })).toBe(0);
  });
});

describe.sequential("TA-362 and TA-454: the operator's log", () => {
  it("TA-362: the content team's actions and the operator's expert decisions are on the operator's log, with words", async () => {
    const marker = `zz-taopc-log-${STAMP}`;
    for (const action of ["appadmin.question.delete", "expert.publish", "expert.unpublish", "expert.kyc.verify", "expert.kyc.reject"]) {
      await db.auditLog.create({ data: { schoolId: null, actorUserId: operator.user.id, action, targetType: "Test", targetId: marker, meta: JSON.stringify({ marker }) } });
    }
    const page = await listServerAudit(operator, { q: marker, take: 50 });
    expect(page.rows.map((r) => r.action).sort()).toEqual(["appadmin.question.delete", "expert.kyc.reject", "expert.kyc.verify", "expert.publish", "expert.unpublish"]);
    expect(page.actions).toEqual(expect.arrayContaining(["appadmin.question.delete", "expert.publish"]));
    expect(actionKey("expert.publish")).not.toBeNull();
    expect(actionKey("expert.unpublish")).not.toBeNull();
  });

  it("TA-454: the list of action names is asked of the database as a grouping, not as every row", async () => {
    const real = appDb.auditLog.findMany.bind(appDb.auditLog);
    const findMany = vi.spyOn(appDb.auditLog, "findMany").mockImplementation(((args: Parameters<typeof real>[0]) => real(args)) as unknown as typeof appDb.auditLog.findMany);
    try {
      await listServerAudit(operator, { take: 5 });
      const distinct = findMany.mock.calls.filter(([args]) => Boolean((args as unknown as { distinct?: unknown } | undefined)?.distinct));
      expect(distinct).toHaveLength(0);
    } finally {
      findMany.mockRestore();
    }
  });
});
