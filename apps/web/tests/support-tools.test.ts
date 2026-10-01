/**
 * The operator's three support doors on a school's office, each proven the
 * same way: refused to a teacher and to a signed-out caller over the API,
 * refused for a person who is not the school's admin, done for one who is
 * — the email in the dev mailbox, the audit row written twice (the
 * operator's own and the school's), the office told — and nothing of a
 * password touched. Sign-out-everywhere ends every session and unspent
 * token of the admin and nobody else's. Every row is a ZZ row made here
 * and deleted after, scoped by school.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { operatorSchoolSupportSchema, operatorSignOutEverywhereSchema } from "@edulink/contracts";
import { createSession } from "@/lib/session";
import { generateToken, hashToken } from "@/lib/crypto";
import { __resetCookies } from "../tests/stubs/next-headers";
import { listSchoolAdmins, resendAdminInvite, sendAdminResetLink, signOutAdminEverywhere } from "@/lib/superuser";
import { GET as supportGet } from "@/app/api/v1/operator/schools/[schoolId]/support/route";
import { POST as resendPost } from "@/app/api/v1/operator/schools/[schoolId]/support/resend-invite/route";
import { POST as linkPost } from "@/app/api/v1/operator/schools/[schoolId]/support/sign-in-link/route";
import { POST as signOutPost } from "@/app/api/v1/operator/schools/[schoolId]/support/sign-out/route";

const db = new PrismaClient();
const STAMP = Date.now();
const ADMIN_EMAIL = `zz-support-admin-${STAMP}@test.invalid`.replace(".invalid", ".example");
const INVITE_EMAIL = `zz-support-invite-${STAMP}@test.example`;

let schoolId = "";
let operatorUserId = "";
let adminUserId = "";
let headUserId = "";
let teacherUserId = "";
let inviteId = "";
let oldTokenHash = "";

const operator = () => ({ user: { id: operatorUserId, isSuperuser: true, email: null } }) as unknown as Parameters<typeof listSchoolAdmins>[0];
const P = "http://localhost/api/v1/operator/schools";
const get = (path: string) => new Request(`${P}${path}`);
const send = (path: string, body: unknown) => new Request(`${P}${path}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
const params = () => ({ params: Promise.resolve({ schoolId }) });

async function signIn(who: "OPERATOR" | "TEACHER" | "NOBODY") {
  __resetCookies();
  if (who === "OPERATOR") await createSession(operatorUserId);
  else if (who === "TEACHER") await createSession(teacherUserId, { schoolId, role: "TEACHER" });
}

beforeAll(async () => {
  process.env.EMAIL_TRANSPORT = "devbox";
  schoolId = (await db.school.create({ data: { name: `ZZ Support ${STAMP}`, slug: `zz-support-${STAMP}`, code: `ZS${String(STAMP).slice(-6)}`, contactEmail: `zz-support-${STAMP}@test.invalid`, timezone: "Asia/Kolkata" }, select: { id: true } })).id;
  const [op, admin, head, teacher] = await Promise.all([
    db.user.create({ data: { name: "ZZ Support Operator", email: `zz-support-op-${STAMP}@test.invalid`, isSuperuser: true }, select: { id: true } }),
    db.user.create({ data: { name: "ZZ Support Admin", email: ADMIN_EMAIL, passwordHash: "zz-unknowable" }, select: { id: true } }),
    db.user.create({ data: { name: "ZZ Support Head", email: `zz-support-head-${STAMP}@test.invalid` }, select: { id: true } }),
    db.user.create({ data: { name: "ZZ Support Teacher", email: `zz-support-teacher-${STAMP}@test.invalid` }, select: { id: true } }),
  ]);
  operatorUserId = op.id;
  adminUserId = admin.id;
  headUserId = head.id;
  teacherUserId = teacher.id;
  await db.membership.createMany({
    data: [
      { userId: adminUserId, schoolId, role: "ADMIN", status: "ACTIVE" },
      { userId: headUserId, schoolId, role: "PRINCIPAL", status: "ACTIVE" },
      { userId: teacherUserId, schoolId, role: "TEACHER", status: "ACTIVE" },
    ],
  });
  oldTokenHash = hashToken(generateToken());
  inviteId = (await db.invite.create({ data: { schoolId, role: "ADMIN", email: INVITE_EMAIL, tokenHash: oldTokenHash, createdByMembershipId: null, expiresAt: new Date(Date.now() + 86_400_000) }, select: { id: true } })).id;
});

afterAll(async () => {
  __resetCookies();
  const users = [operatorUserId, adminUserId, headUserId, teacherUserId].filter(Boolean);
  await db.session.deleteMany({ where: { userId: { in: users } } });
  await db.authToken.deleteMany({ where: { userId: { in: users } } });
  await db.notification.deleteMany({ where: { userId: { in: users } } });
  await db.outboundEmail.deleteMany({ where: { to: { in: [ADMIN_EMAIL, INVITE_EMAIL] } } });
  await db.auditLog.deleteMany({ where: { OR: [{ schoolId }, { actorUserId: { in: users } }] } });
  await db.school.deleteMany({ where: { id: schoolId } });
  await db.user.deleteMany({ where: { id: { in: users } } });
  await db.$disconnect();
});

describe("support tooling", () => {
  it("every door is 401 signed out and 403 to a teacher, and the lib refuses a non-superuser", async () => {
    const doors = [
      () => supportGet(get(`/${schoolId}/support`), params()),
      () => resendPost(send(`/${schoolId}/support/resend-invite`, { inviteId }), params()),
      () => linkPost(send(`/${schoolId}/support/sign-in-link`, { userId: adminUserId }), params()),
      () => signOutPost(send(`/${schoolId}/support/sign-out`, { userId: adminUserId }), params()),
    ];
    await signIn("NOBODY");
    for (const door of doors) expect((await door()).status).toBe(401);
    await signIn("TEACHER");
    for (const door of doors) expect((await door()).status).toBe(403);
    const teacher = { user: { id: teacherUserId, isSuperuser: false } } as unknown as Parameters<typeof listSchoolAdmins>[0];
    await expect(resendAdminInvite(teacher, schoolId, inviteId)).rejects.toThrow();
    await expect(sendAdminResetLink(teacher, schoolId, adminUserId)).rejects.toThrow();
    await expect(signOutAdminEverywhere(teacher, schoolId, adminUserId)).rejects.toThrow();
    // Nothing moved.
    expect(await db.outboundEmail.count({ where: { to: { in: [ADMIN_EMAIL, INVITE_EMAIL] } } })).toBe(0);
    expect(await db.auditLog.count({ where: { schoolId, action: { startsWith: "superuser." } } })).toBe(0);
  });

  it("the support read lists the school's admin and head with their live sessions", async () => {
    await createSession(adminUserId, { schoolId, role: "ADMIN" });
    await createSession(adminUserId, { schoolId, role: "ADMIN" });
    await signIn("OPERATOR");
    const res = await supportGet(get(`/${schoolId}/support`), params());
    expect(res.status).toBe(200);
    const body = operatorSchoolSupportSchema.parse(await res.json());
    expect(body.admins.map((a) => a.userId).sort()).toEqual([adminUserId, headUserId].sort());
    expect(body.admins.find((a) => a.userId === adminUserId)).toMatchObject({ role: "ADMIN", liveSessions: 2 });
    expect(body.admins.find((a) => a.userId === headUserId)).toMatchObject({ role: "PRINCIPAL", liveSessions: 0 });
    expect(body.plan).toBeNull();
    expect((await supportGet(get("/nope/support"), { params: Promise.resolve({ schoolId: "nope" }) })).status).toBe(404);
  });

  it("resending an invitation rotates its link, emails it, and is audited twice with the office told", async () => {
    await signIn("OPERATOR");
    const res = await resendPost(send(`/${schoolId}/support/resend-invite`, { inviteId }), params());
    expect(res.status).toBe(200);
    const invite = await db.invite.findUniqueOrThrow({ where: { id: inviteId } });
    expect(invite.tokenHash).not.toBe(oldTokenHash);
    expect(invite.status).toBe("PENDING");
    expect(await db.outboundEmail.count({ where: { to: INVITE_EMAIL, purpose: "INVITE" } })).toBe(1);
    expect(await db.auditLog.count({ where: { action: "superuser.invite.resend", targetId: inviteId, schoolId: null, actorUserId: operatorUserId } })).toBe(1);
    expect(await db.auditLog.count({ where: { action: "superuser.invite.resend", targetId: inviteId, schoolId } })).toBe(1);
    expect(await db.notification.count({ where: { userId: { in: [adminUserId, headUserId] }, schoolId, title: { contains: "invitation" } } })).toBe(2);
    // A revoked invitation cannot be sent again; an unknown id is the same refusal.
    await db.invite.update({ where: { id: inviteId }, data: { status: "REVOKED" } });
    expect((await resendPost(send(`/${schoolId}/support/resend-invite`, { inviteId }), params())).status).toBe(422);
    expect(await resendAdminInvite(operator(), schoolId, "nope")).toEqual({ ok: false, errorKey: "root.inviteNotPending" });
  });

  it("a sign-in link is a one-time MAGIC_LINK token emailed to the admin, never a password; a teacher cannot be its target", async () => {
    await signIn("OPERATOR");
    const before = await db.user.findUniqueOrThrow({ where: { id: adminUserId }, select: { passwordHash: true } });
    const res = await linkPost(send(`/${schoolId}/support/sign-in-link`, { userId: adminUserId }), params());
    expect(res.status).toBe(200);
    const token = await db.authToken.findFirst({ where: { userId: adminUserId, purpose: "MAGIC_LINK", consumedAt: null }, orderBy: { createdAt: "desc" } });
    expect(token).not.toBeNull();
    expect(token!.expiresAt.getTime()).toBeGreaterThan(Date.now());
    expect(token!.expiresAt.getTime()).toBeLessThanOrEqual(Date.now() + 21 * 60_000);
    const mail = await db.outboundEmail.findFirst({ where: { to: ADMIN_EMAIL, purpose: "MAGIC_LINK" } });
    expect(mail?.text).toContain("/magic?token=");
    expect(mail?.text).not.toContain(token!.tokenHash);
    const after = await db.user.findUniqueOrThrow({ where: { id: adminUserId }, select: { passwordHash: true } });
    expect(after.passwordHash).toBe(before.passwordHash);
    expect(await db.auditLog.count({ where: { action: "superuser.admin.signInLink", targetId: adminUserId, schoolId: null } })).toBe(1);
    expect(await db.auditLog.count({ where: { action: "superuser.admin.signInLink", targetId: adminUserId, schoolId } })).toBe(1);
    expect(await db.notification.count({ where: { userId: headUserId, schoolId, title: { contains: "sign-in link" } } })).toBe(1);
    // The teacher is not the school's admin; the head's address does not route.
    expect((await linkPost(send(`/${schoolId}/support/sign-in-link`, { userId: teacherUserId }), params())).status).toBe(422);
    expect(await sendAdminResetLink(operator(), schoolId, teacherUserId)).toEqual({ ok: false, errorKey: "root.notAnAdminHere" });
    expect(await sendAdminResetLink(operator(), schoolId, headUserId)).toEqual({ ok: false, errorKey: "root.adminHasNoEmail" });
    expect(await db.authToken.count({ where: { userId: { in: [teacherUserId, headUserId] } } })).toBe(0);
  });

  it("sign out everywhere ends the admin's sessions and unspent tokens and nobody else's", async () => {
    await createSession(headUserId, { schoolId, role: "PRINCIPAL" });
    await signIn("OPERATOR");
    expect(await db.session.count({ where: { userId: adminUserId, revokedAt: null } })).toBe(2);
    const res = await signOutPost(send(`/${schoolId}/support/sign-out`, { userId: adminUserId }), params());
    expect(res.status).toBe(200);
    const body = operatorSignOutEverywhereSchema.parse(await res.json());
    expect(body.sessionsEnded).toBe(2);
    expect(await db.session.count({ where: { userId: adminUserId, revokedAt: null } })).toBe(0);
    expect(await db.authToken.count({ where: { userId: adminUserId, consumedAt: null } })).toBe(0);
    // The head's session and the operator's own are untouched.
    expect(await db.session.count({ where: { userId: headUserId, revokedAt: null } })).toBe(1);
    expect(await db.session.count({ where: { userId: operatorUserId, revokedAt: null } })).toBeGreaterThan(0);
    expect(await db.auditLog.count({ where: { action: "superuser.admin.signOut", targetId: adminUserId, schoolId: null } })).toBe(1);
    expect(await db.auditLog.count({ where: { action: "superuser.admin.signOut", targetId: adminUserId, schoolId } })).toBe(1);
    expect(await db.notification.count({ where: { userId: adminUserId, schoolId, title: { contains: "signed" } } })).toBe(1);
    expect(await signOutAdminEverywhere(operator(), schoolId, teacherUserId)).toEqual({ ok: false, errorKey: "root.notAnAdminHere" });
    const admins = await listSchoolAdmins(operator(), schoolId);
    expect(admins.find((a) => a.userId === adminUserId)?.liveSessions).toBe(0);
  });
});
