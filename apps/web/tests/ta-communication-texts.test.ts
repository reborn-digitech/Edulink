/**
 * Texts to families (testing analysis of 13 November 2026, communication), under the devbox transport except where a
 * stand-in for Twilio's endpoint is named.
 *
 * TA-095 (Medium): the minute job and the request that queued a text each sent the same QUEUED row, so a family got it
 * twice. TA-097 (Medium): resending a notice's failed texts posted each row straight to the provider, past the
 * platform's switch, the school's channels, the person's own switches and the caps. TA-434 (Low): the daily cap of
 * five counted from 17:30 the evening before in India. TA-435 (Low): a number that answered STOP was recognised only
 * in the status callback's shape, not in the shape a refusal at send time is stored in. TA-553 (Low): the notice
 * preview counted families the send would skip and left out those it would reach.
 *
 * A scratch ZZ school of this suite's own (tests/ta-communication-fixture.ts), removed afterwards.
 */
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { PLATFORM_FEATURES, type FeatureCode } from "@edulink/contracts";
import { makeSchool, type CommSchool, type Person } from "./ta-communication-fixture";
import { createBroadcast, deliverToUser, previewBroadcast, resendBroadcastFailures, sendRow, DAILY_CAP_PER_PERSON } from "@/lib/messaging";
import { setFeaturesForTests } from "@/lib/platform-features";
import { todayKey, zonedStartOfDay } from "@/lib/dates";

const ALL = [...PLATFORM_FEATURES];
const WITHOUT = (code: FeatureCode) => ALL.filter((c) => c !== code);
const saved = { sms: process.env.SMS_TRANSPORT, wa: process.env.WHATSAPP_TRANSPORT };

let s: CommSchool;
let tail = "";
let n = 0;
/** A guardian of pupil A with a proved number of their own, and prefs as given. */
const guardianWithPhone = async (prefs = "{}"): Promise<Person & { phone: string }> => {
  const phone = `+9197${tail}${String(++n).padStart(2, "0")}`;
  const p = await s.person(`g${n}`, null, { phone, prefs });
  await s.db.guardianship.create({ data: { parentUserId: p.userId, studentMembershipId: s.pupilA.membershipId, studentSchoolId: s.schoolId, relation: "PARENT", status: "ACTIVE" } });
  return { ...p, phone };
};
const mailed = (to: string) => s.db.outboundEmail.count({ where: { to, purpose: { in: ["SMS", "WHATSAPP"] } } });

beforeAll(async () => {
  process.env.SMS_TRANSPORT = "devbox";
  process.env.WHATSAPP_TRANSPORT = "devbox";
  setFeaturesForTests(ALL);
  s = await makeSchool("texts");
  tail = String(s.stamp).slice(-6);
  await s.db.school.update({ where: { id: s.schoolId }, data: { msgSmsEnabled: true, msgWhatsappEnabled: false, msgMonthlyCap: 2000 } });
}, 60_000);

afterEach(() => setFeaturesForTests(ALL));

afterAll(async () => {
  setFeaturesForTests(ALL);
  process.env.SMS_TRANSPORT = saved.sms;
  process.env.WHATSAPP_TRANSPORT = saved.wa;
  const phones = (await s.db.outboundMessage.findMany({ where: { schoolId: s.schoolId }, select: { to: true } })).map((m) => m.to);
  await s.db.outboundEmail.deleteMany({ where: { to: { in: phones }, purpose: { in: ["SMS", "WHATSAPP"] } } });
  await s.cleanup();
}, 60_000);

describe("TA-095: one queued text, two senders", () => {
  it("TA-095: is sent once when the job and the request reach it together", async () => {
    const g = await guardianWithPhone();
    const queued = await deliverToUser({ schoolId: s.schoolId, userId: g.userId, templateKey: "circular", vars: { notice: "ZZ TA-095 notice" }, purpose: "broadcast", queueOnly: true });
    expect(queued.status).toBe("QUEUED");
    const row = await s.db.outboundMessage.findUniqueOrThrow({ where: { id: queued.id } });
    const results = await Promise.all([sendRow(row), sendRow(row)]);
    expect(results.map((r) => r.status).sort()).toEqual(["SENT", "TAKEN"]);
    expect(await mailed(g.phone)).toBe(1);
    expect((await s.db.outboundMessage.findUniqueOrThrow({ where: { id: row.id } })).status).toBe("SENT");
  });

  it("TA-095: a row whose sender died mid-send is taken again after the ceiling, and not before", async () => {
    const g = await guardianWithPhone();
    const queued = await deliverToUser({ schoolId: s.schoolId, userId: g.userId, templateKey: "circular", vars: { notice: "ZZ TA-095 stranded" }, purpose: "broadcast", queueOnly: true });
    const row = await s.db.outboundMessage.findUniqueOrThrow({ where: { id: queued.id } });
    await s.db.outboundMessage.update({ where: { id: row.id }, data: { providerSid: `claim:${row.id}` } });
    expect((await sendRow(row)).status).toBe("TAKEN");
    // Eleven minutes on: the claim is older than the ceiling (an explicit updatedAt is written as given).
    await s.db.outboundMessage.update({ where: { id: row.id }, data: { updatedAt: new Date(Date.now() - 11 * 60_000) } });
    expect((await sendRow(row)).status).toBe("SENT");
    expect(await mailed(g.phone)).toBe(1);
  });
});

describe("TA-097: resending a notice's failed texts", () => {
  /** A notice with one FAILED text to `g`, as a provider refusal leaves it. */
  const failedNotice = async (g: { userId: string; phone: string }) => {
    const b = await s.db.broadcast.create({ data: { schoolId: s.schoolId, authorUserId: s.admin.userId, title: "ZZ TA-097", body: "ZZ TA-097 notice", channelsJson: '["TEXT"]', audienceJson: '{"kind":"ALL_PARENTS"}', recipients: 1 }, select: { id: true } });
    const row = await s.db.outboundMessage.create({
      data: { schoolId: s.schoolId, userId: g.userId, to: g.phone, channel: "SMS", templateKey: "circular", varsJson: JSON.stringify({ notice: "ZZ TA-097 notice" }), body: "ZZ TA-097 notice", status: "FAILED", error: "Twilio refused the message: HTTP 500", segments: 1, broadcastId: b.id, purpose: "broadcast" },
      select: { id: true },
    });
    return { broadcastId: b.id, rowId: row.id };
  };
  const rowOf = (id: string) => s.db.outboundMessage.findUniqueOrThrow({ where: { id }, select: { status: true, skipReason: true } });
  const admin = () => s.ctx(s.admin, "ADMIN");

  it("TA-097: sends nothing while the platform has texts off, and says why on the row", async () => {
    const g = await guardianWithPhone();
    const { broadcastId, rowId } = await failedNotice(g);
    setFeaturesForTests(WITHOUT("TEXT_MESSAGING"));
    expect(await resendBroadcastFailures(admin(), broadcastId)).toEqual({ requeued: 0 });
    expect(await rowOf(rowId)).toEqual({ status: "SKIPPED", skipReason: "feature-off" });
    expect(await mailed(g.phone)).toBe(0);
  });

  it("TA-097: honours the person's own switch and the school's monthly cap", async () => {
    const quiet = await guardianWithPhone(JSON.stringify({ channels: { push: true, sms: false, whatsapp: false } }));
    const one = await failedNotice(quiet);
    expect(await resendBroadcastFailures(admin(), one.broadcastId)).toEqual({ requeued: 0 });
    expect(await rowOf(one.rowId)).toEqual({ status: "SKIPPED", skipReason: "opted-out" });

    const g = await guardianWithPhone();
    const two = await failedNotice(g);
    await s.db.school.update({ where: { id: s.schoolId }, data: { msgMonthlyCap: 0 } });
    try {
      expect(await resendBroadcastFailures(admin(), two.broadcastId)).toEqual({ requeued: 0 });
    } finally {
      await s.db.school.update({ where: { id: s.schoolId }, data: { msgMonthlyCap: 2000 } });
    }
    expect(await rowOf(two.rowId)).toEqual({ status: "SKIPPED", skipReason: "cap-monthly" });
    expect(await mailed(quiet.phone)).toBe(0);
    expect(await mailed(g.phone)).toBe(0);
  });

  it("TA-097: a failure the rules allow is sent again in place, once an hour", async () => {
    const g = await guardianWithPhone();
    const { broadcastId, rowId } = await failedNotice(g);
    expect(await resendBroadcastFailures(admin(), broadcastId)).toEqual({ requeued: 1 });
    expect((await rowOf(rowId)).status).toBe("SENT");
    expect(await s.db.outboundMessage.count({ where: { broadcastId } })).toBe(1);
    expect(await mailed(g.phone)).toBe(1);
    // The carrier then reports it undelivered again: a second try within the hour is refused, and sends nothing.
    await s.db.outboundMessage.update({ where: { id: rowId }, data: { status: "UNDELIVERED" } });
    await expect(resendBroadcastFailures(admin(), broadcastId)).rejects.toThrow("messaging.refuseResendSoon");
    expect(await mailed(g.phone)).toBe(1);
  });
});

describe("TA-434: the daily cap of five", () => {
  it("TA-434: counts from the school's midnight, not from the evening before", async () => {
    const g = await guardianWithPhone();
    // Five texts sent at 23:00 in India the evening before.
    const lastNight = new Date(zonedStartOfDay(todayKey("Asia/Kolkata"), "Asia/Kolkata").getTime() - 3_600_000);
    await s.db.outboundMessage.createMany({
      data: Array.from({ length: DAILY_CAP_PER_PERSON }, (_, i) => ({ schoolId: s.schoolId, userId: g.userId, to: g.phone, channel: "SMS", templateKey: "circular", varsJson: "{}", body: `ZZ TA-434 evening ${i}`, status: "SENT", segments: 1, purpose: "broadcast", createdAt: lastNight })),
    });
    const morning = await deliverToUser({ schoolId: s.schoolId, userId: g.userId, templateKey: "circular", vars: { notice: "ZZ TA-434 morning" }, purpose: "broadcast", queueOnly: true });
    expect(morning).toMatchObject({ status: "QUEUED", skipReason: null });
  });
});

describe("TA-435: a number that answered STOP", () => {
  let server: Server;
  const savedTwilio = { sid: process.env.TWILIO_ACCOUNT_SID, token: process.env.TWILIO_AUTH_TOKEN, from: process.env.TWILIO_FROM, base: process.env.TWILIO_API_BASE };

  afterAll(async () => {
    process.env.SMS_TRANSPORT = "devbox";
    for (const [key, value] of [["TWILIO_ACCOUNT_SID", savedTwilio.sid], ["TWILIO_AUTH_TOKEN", savedTwilio.token], ["TWILIO_FROM", savedTwilio.from], ["TWILIO_API_BASE", savedTwilio.base]] as const) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
    await new Promise<void>((resolve) => (server ? server.close(() => resolve()) : resolve()));
  });

  it("TA-435: is recognised when the provider refuses the send itself (code 21610), and is not texted again", async () => {
    // A stand-in for Twilio's Messages endpoint that refuses every send as a STOP'd number does.
    let posts = 0;
    server = createServer((req, res) => {
      posts += 1;
      req.resume();
      res.writeHead(400, { "content-type": "application/json" });
      res.end(JSON.stringify({ code: 21610, message: "Attempt to send to unsubscribed recipient", status: 400 }));
    });
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", () => resolve()));
    process.env.TWILIO_API_BASE = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
    process.env.TWILIO_ACCOUNT_SID = `AC${"0".repeat(32)}`;
    process.env.TWILIO_AUTH_TOKEN = "zz-test-token";
    process.env.TWILIO_FROM = "+15005550006";
    process.env.SMS_TRANSPORT = "twilio";

    // A guardian with no proved number, reached at the number the office typed on the pupil's record.
    const office = `+9196${tail}99`;
    const g = await s.person("stopped", null);
    const child = await s.person("stoppedchild", "STUDENT", { isMinor: true });
    await s.db.guardianship.create({ data: { parentUserId: g.userId, studentMembershipId: child.membershipId, studentSchoolId: s.schoolId, relation: "PARENT", status: "ACTIVE" } });
    await s.db.pupilRecord.create({ data: { schoolId: s.schoolId, studentMembershipId: child.membershipId, guardianPhone: office } });
    await s.db.school.update({ where: { id: s.schoolId }, data: { textOfficePhones: true } });
    const send = () => deliverToUser({ schoolId: s.schoolId, userId: g.userId, templateKey: "absence", vars: { child: "ZZ Child" }, purpose: "absence" });

    const first = await send();
    expect(first.status).toBe("FAILED");
    expect((await s.db.outboundMessage.findUniqueOrThrow({ where: { id: first.id } })).error).toContain("21610");
    expect(await send()).toMatchObject({ status: "SKIPPED", skipReason: "opted-out" });
    expect(posts).toBe(1);
    await s.db.school.update({ where: { id: s.schoolId }, data: { textOfficePhones: false } });
  });
});

describe("TA-553: the notice preview", () => {
  const admin = () => s.ctx(s.admin, "ADMIN");
  const body = "ZZ TA-553 sports day is on Friday.";

  it("TA-553: promises no text while the platform has texts off or the school's circulars switch is off", async () => {
    const g = await guardianWithPhone();
    const audience = { kind: "PEOPLE" as const, userIds: [g.userId] };
    setFeaturesForTests(WITHOUT("TEXT_MESSAGING"));
    expect(await previewBroadcast(admin(), { audience, body })).toMatchObject({ recipients: 1, sms: 0, whatsapp: 0, unreachable: 1 });
    setFeaturesForTests(ALL);
    await s.db.school.update({ where: { id: s.schoolId }, data: { msgEventsJson: JSON.stringify({ circulars: false }) } });
    try {
      expect(await previewBroadcast(admin(), { audience, body })).toMatchObject({ recipients: 1, sms: 0, whatsapp: 0, unreachable: 1 });
      const sent = await createBroadcast(admin(), { title: "ZZ TA-553 off", body, audience, channels: ["TEXT"] });
      expect(sent.queued).toBe(0);
    } finally {
      await s.db.school.update({ where: { id: s.schoolId }, data: { msgEventsJson: "{}" } });
    }
  });

  it("TA-553: counts a guardian the school texts at the office-entered number, as the send reaches them", async () => {
    const g = await s.person("recordonly", null);
    const child = await s.person("recordchild", "STUDENT", { isMinor: true });
    await s.db.guardianship.create({ data: { parentUserId: g.userId, studentMembershipId: child.membershipId, studentSchoolId: s.schoolId, relation: "PARENT", status: "ACTIVE" } });
    await s.db.pupilRecord.create({ data: { schoolId: s.schoolId, studentMembershipId: child.membershipId, guardianPhone: `+9195${tail}11` } });
    await s.db.school.update({ where: { id: s.schoolId }, data: { textOfficePhones: true } });
    try {
      const audience = { kind: "PEOPLE" as const, userIds: [g.userId] };
      const preview = await previewBroadcast(admin(), { audience, body });
      expect(preview).toMatchObject({ recipients: 1, withPhone: 1, sms: 1, unreachable: 0 });
      const sent = await createBroadcast(admin(), { title: "ZZ TA-553 record", body, audience, channels: ["TEXT"] });
      expect(sent.queued).toBe(preview.sms + preview.whatsapp);
    } finally {
      await s.db.school.update({ where: { id: s.schoolId }, data: { textOfficePhones: false } });
    }
  });
});
