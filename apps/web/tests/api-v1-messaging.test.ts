/**
 * The /api/v1/messaging handlers and the Twilio status webhook, invoked
 * directly with a primed session: 401 signed out, 403 for a role with no
 * door, 422 for a body that does not parse, and the happy path through a
 * notice's preview, send, report and resend under the devbox transport.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createHmac } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { createSession } from "@/lib/session";
import { __resetCookies } from "../tests/stubs/next-headers";
import { GET as overviewGet } from "@/app/api/v1/messaging/overview/route";
import { POST as settingsPost } from "@/app/api/v1/messaging/settings/route";
import { POST as testPost } from "@/app/api/v1/messaging/test/route";
import { GET as broadcastsGet, POST as broadcastsPost } from "@/app/api/v1/messaging/broadcasts/route";
import { POST as previewPost } from "@/app/api/v1/messaging/broadcasts/preview/route";
import { GET as detailGet } from "@/app/api/v1/messaging/broadcasts/[broadcastId]/route";
import { POST as resendPost } from "@/app/api/v1/messaging/broadcasts/[broadcastId]/resend/route";
import { POST as twilioPost } from "@/app/api/webhooks/twilio/status/[schoolId]/route";

const db = new PrismaClient();
const STAMP = Date.now();
let schoolId = "";
let adminUserId = "";
let principalUserId = "";
let teacherUserId = "";
let parentUserId = "";

const get = (path: string) => new Request(`http://localhost${path}`);
const json = (path: string, body: unknown) => new Request(`http://localhost${path}`, { method: "POST", headers: { "content-type": "application/json" }, body: typeof body === "string" ? body : JSON.stringify(body) });
const params = <T extends Record<string, string>>(p: T) => ({ params: Promise.resolve(p) });
async function as(role: "ADMIN" | "PRINCIPAL" | "TEACHER" | null) {
  __resetCookies();
  if (role === "ADMIN") await createSession(adminUserId, { schoolId, role: "ADMIN" });
  if (role === "PRINCIPAL") await createSession(principalUserId, { schoolId, role: "PRINCIPAL" });
  if (role === "TEACHER") await createSession(teacherUserId, { schoolId, role: "TEACHER" });
}

beforeAll(async () => {
  process.env.SMS_TRANSPORT = "devbox";
  process.env.WHATSAPP_TRANSPORT = "devbox";
  const suffix = String(STAMP).slice(-6);
  schoolId = (await db.school.create({ data: { name: `ZZ MsgApi School ${STAMP}`, slug: `zz-msgapi-${STAMP}`, code: `ZN${suffix}`, contactEmail: `zz-msgapi-${STAMP}@test.invalid`, timezone: "Asia/Kolkata", msgSmsEnabled: true }, select: { id: true } })).id;
  const mk = (who: string, phone?: string) => db.user.create({ data: { name: `ZZ MsgApi ${who}`, email: `zz-msgapi-${who.toLowerCase()}-${STAMP}@test.invalid`, phone }, select: { id: true } });
  const [admin, principal, teacher, parent, pupil] = await Promise.all([mk("Admin", `+9198710${suffix}`), mk("Principal"), mk("Teacher"), mk("Parent", `+9198711${suffix}`), mk("Pupil")]);
  adminUserId = admin.id;
  principalUserId = principal.id;
  teacherUserId = teacher.id;
  parentUserId = parent.id;
  await db.membership.createMany({ data: [{ userId: adminUserId, schoolId, role: "ADMIN", status: "ACTIVE" }, { userId: principalUserId, schoolId, role: "PRINCIPAL", status: "ACTIVE" }, { userId: teacherUserId, schoolId, role: "TEACHER", status: "ACTIVE" }] });
  const pm = await db.membership.create({ data: { userId: pupil.id, schoolId, role: "STUDENT", status: "ACTIVE", studentCode: `ZNP${STAMP}`, gradeLevel: "4" }, select: { id: true } });
  await db.guardianship.create({ data: { parentUserId, studentMembershipId: pm.id, studentSchoolId: schoolId, status: "ACTIVE" } });
});

afterAll(async () => {
  __resetCookies();
  await db.session.deleteMany({ where: { userId: { in: [adminUserId, principalUserId, teacherUserId] } } });
  await db.school.deleteMany({ where: { id: schoolId } });
  await db.user.deleteMany({ where: { email: { contains: `-${STAMP}@test.invalid` } } });
  await db.$disconnect();
});

describe("doors", () => {
  it("401 signed out, 403 for a teacher, the head reads but may not write", async () => {
    await as(null);
    expect((await overviewGet()).status).toBe(401);
    await as("TEACHER");
    expect((await overviewGet()).status).toBe(403);
    expect((await broadcastsGet()).status).toBe(403);
    await as("PRINCIPAL");
    expect((await overviewGet()).status).toBe(200);
    expect((await settingsPost(json("/api/v1/messaging/settings", { smsEnabled: false }))).status).toBe(403);
    expect((await testPost()).status).toBe(403);
  });
});

describe("the office", () => {
  let broadcastId = "";
  it("reads the overview, saves settings, sends a test, previews and sends a notice, reads and resends it", async () => {
    await as("ADMIN");
    const overview = await (await overviewGet()).json();
    expect(overview.settings.smsEnabled).toBe(true);
    expect(overview.transports).toEqual({ sms: "devbox", whatsapp: "devbox", problems: [] });
    expect(overview.templates.map((t: { key: string }) => t.key)).toContain("circular");
    expect(overview.templates[0].text.hi.length).toBeGreaterThan(0);
    expect(overview.parentsTotal).toBe(1);
    expect((await settingsPost(json("/api/v1/messaging/settings", { monthlyCap: -5 }))).status).toBe(422);
    expect((await settingsPost(json("/api/v1/messaging/settings", { whatsappEnabled: true, events: { absence: false } }))).status).toBe(200);
    expect((await (await overviewGet()).json()).settings).toMatchObject({ whatsappEnabled: true, events: { absence: false } });
    const test = await (await testPost()).json();
    expect(test).toMatchObject({ status: "SENT", channel: "WHATSAPP" });

    expect((await previewPost(json("/api/v1/messaging/broadcasts/preview", { audience: { kind: "NOPE" }, body: "x" }))).status).toBe(422);
    const preview = await (await previewPost(json("/api/v1/messaging/broadcasts/preview", { audience: { kind: "ALL_PARENTS" }, body: "Holiday on Monday." }))).json();
    expect(preview).toEqual({ recipients: 1, withPhone: 1, whatsapp: 1, sms: 0, unreachable: 0, estimatedSegments: 1 });
    expect((await broadcastsPost(json("/api/v1/messaging/broadcasts", { title: "H", body: "Holiday on Monday.", audience: { kind: "ALL_PARENTS" }, channels: ["TEXT"] }))).status).toBe(422);
    const created = await broadcastsPost(json("/api/v1/messaging/broadcasts", { title: "Holiday", body: "Holiday on Monday. School reopens Tuesday.", audience: { kind: "ALL_PARENTS" }, channels: ["TEXT"] }));
    expect(created.status).toBe(201);
    const body = await created.json();
    expect(body).toMatchObject({ recipients: 1, queued: 1, skipped: 0, pushed: 0 });
    broadcastId = body.broadcastId;
    const list = await (await broadcastsGet()).json();
    expect(list.broadcasts[0].id).toBe(broadcastId);
    const detail = await (await detailGet(get("/x"), params({ broadcastId }))).json();
    expect(detail.broadcast.status).toBe("DONE");
    expect(detail.messages).toHaveLength(1);
    expect(detail.messages[0]).toMatchObject({ status: "SENT", channel: "WHATSAPP", name: "ZZ MsgApi Parent" });
    expect(detail.messages[0].to).not.toBe("");
    expect((await detailGet(get("/x"), params({ broadcastId: "nope" }))).status).toBe(404);
    expect(await (await resendPost(get("/x"), params({ broadcastId }))).json()).toEqual({ requeued: 0 });
    await as("PRINCIPAL");
    expect((await detailGet(get("/x"), params({ broadcastId }))).status).toBe(200);
    expect((await resendPost(get("/x"), params({ broadcastId }))).status).toBe(403);
  });

  it("the Twilio status webhook: 404 without Twilio, 401 on a bad signature, 200 and a moved row on a good one", async () => {
    const keys = ["TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN", "TWILIO_FROM"] as const;
    const before = Object.fromEntries(keys.map((k) => [k, process.env[k]]));
    delete process.env.TWILIO_ACCOUNT_SID;
    const post = (form: Record<string, string>, signature?: string) =>
      twilioPost(new Request(`http://localhost/api/webhooks/twilio/status/${schoolId}`, { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded", ...(signature ? { "x-twilio-signature": signature } : {}) }, body: new URLSearchParams(form).toString() }), params({ schoolId }));
    expect((await post({ MessageSid: "SM1", MessageStatus: "delivered" })).status).toBe(404);
    process.env.TWILIO_ACCOUNT_SID = "AC" + "0123456789abcdef".repeat(2);
    process.env.TWILIO_AUTH_TOKEN = "tok";
    process.env.TWILIO_FROM = "+15550001111";
    expect((await post({ MessageSid: "SM1", MessageStatus: "delivered" }, "bad")).status).toBe(401);
    const row = await db.outboundMessage.findFirstOrThrow({ where: { schoolId, broadcastId }, select: { id: true, providerSid: true } });
    const base = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
    const form = { MessageSid: row.providerSid!, MessageStatus: "delivered" };
    const sig = createHmac("sha1", "tok").update(`${base}/api/webhooks/twilio/status/${schoolId}` + Object.keys(form).sort().map((k) => k + form[k as keyof typeof form]).join("")).digest("base64");
    const good = await post(form, sig);
    expect(good.status).toBe(200);
    expect(await good.json()).toEqual({ ok: true, known: true });
    expect((await db.outboundMessage.findUniqueOrThrow({ where: { id: row.id } })).status).toBe("DELIVERED");
    expect((await db.broadcast.findUniqueOrThrow({ where: { id: broadcastId } })).delivered).toBe(1);
    for (const k of keys) {
      if (before[k] === undefined) delete process.env[k];
      else process.env[k] = before[k];
    }
  });
});
