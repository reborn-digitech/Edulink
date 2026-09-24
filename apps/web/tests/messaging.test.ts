/**
 * Texts to families, end to end against the database under the devbox
 * transport: the templates in three languages and their registration
 * forms, segment counting, the routing rule refusal by refusal (no number,
 * channel off, opted out, event off, monthly cap, daily cap), WhatsApp
 * before SMS, the notify() hook, a broadcast's audience, preview, queue,
 * drain and counts, the provider's status callback with its signature, the
 * resend, and the office's forced test message.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createHmac } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import type { ActiveContext } from "@/lib/session";
import { addDaysToKey, todayKey } from "@/lib/dates";
import { notify } from "@/lib/notify";
import { MESSAGE_TEMPLATES, dltForm, renderTemplate, smsSegments, whatsappForm, whatsappVarOrder } from "@/lib/message-templates";
import {
  DAILY_CAP_PER_PERSON,
  broadcastDetail,
  createBroadcast,
  deliverToUser,
  drainQueue,
  listBroadcasts,
  messagingOverview,
  messagingSettings,
  previewBroadcast,
  recordProviderStatus,
  resendBroadcastFailures,
  resolveAudience,
  saveMessagingSettings,
  sendTestMessage,
  transportStatus,
  twilioSignatureValid,
} from "@/lib/messaging";

const db = new PrismaClient();
const STAMP = Date.now();
const TODAY = todayKey("Asia/Kolkata");
let schoolId = "";
let adminUserId = "";
let adminMembershipId = "";
let principalUserId = "";
let classId = "";
let parentA = "";
let parentB = "";
let parentNoPhone = "";
let pupilA = "";
let pupilB = "";
let pupilC = "";

function ctx(over: Partial<ActiveContext> & { userId: string }): ActiveContext {
  return { sessionId: "t", membershipId: over.membershipId ?? null, schoolId: over.schoolId ?? null, role: over.role ?? null, user: { id: over.userId, name: "ZZ Msg", preferredName: null, email: null, avatarKey: null, isMinor: false, isSuperuser: false, isAppAdmin: false, prefs: {} as never } };
}
const admin = () => ctx({ userId: adminUserId, membershipId: adminMembershipId, schoolId, role: "ADMIN" });
const principal = () => ctx({ userId: principalUserId, membershipId: "x", schoolId, role: "PRINCIPAL" });
const rows = (where: object) => db.outboundMessage.findMany({ where: { schoolId, ...where }, orderBy: { createdAt: "asc" } });

beforeAll(async () => {
  process.env.SMS_TRANSPORT = "devbox";
  process.env.WHATSAPP_TRANSPORT = "devbox";
  delete process.env.MESSAGE_TEMPLATE_IDS;
  schoolId = (await db.school.create({ data: { name: `ZZ Msg School ${STAMP}`, slug: `zz-msg-${STAMP}`, code: `ZM${String(STAMP).slice(-6)}`, contactEmail: `zz-msg-${STAMP}@test.invalid`, timezone: "Asia/Kolkata" }, select: { id: true } })).id;
  const mk = (who: string, phone?: string) => db.user.create({ data: { name: `ZZ Msg ${who}`, email: `zz-msg-${who.toLowerCase()}-${STAMP}@test.invalid`, phone, phoneVerifiedAt: phone ? new Date() : null }, select: { id: true } });
  const suffix = String(STAMP).slice(-6);
  const [a, p, pa, pb, pn, ca, cb, cc] = await Promise.all([mk("Admin", `+9198700${suffix}`), mk("Principal"), mk("ParentA", `+9198701${suffix}`), mk("ParentB", `+9198702${suffix}`), mk("ParentNoPhone"), mk("PupilA"), mk("PupilB"), mk("PupilC")]);
  adminUserId = a.id;
  principalUserId = p.id;
  parentA = pa.id;
  parentB = pb.id;
  parentNoPhone = pn.id;
  adminMembershipId = (await db.membership.create({ data: { userId: adminUserId, schoolId, role: "ADMIN", status: "ACTIVE" }, select: { id: true } })).id;
  await db.membership.create({ data: { userId: principalUserId, schoolId, role: "PRINCIPAL", status: "ACTIVE" } });
  pupilA = (await db.membership.create({ data: { userId: ca.id, schoolId, role: "STUDENT", status: "ACTIVE", studentCode: `ZMA${STAMP}`, gradeLevel: "3" }, select: { id: true } })).id;
  pupilB = (await db.membership.create({ data: { userId: cb.id, schoolId, role: "STUDENT", status: "ACTIVE", studentCode: `ZMB${STAMP}`, gradeLevel: "3" }, select: { id: true } })).id;
  pupilC = (await db.membership.create({ data: { userId: cc.id, schoolId, role: "STUDENT", status: "ACTIVE", studentCode: `ZMC${STAMP}`, gradeLevel: "5" }, select: { id: true } })).id;
  classId = (await db.class.create({ data: { schoolId, name: "ZZ Msg 3A", gradeLevel: "3", joinCode: `ZM${suffix}` }, select: { id: true } })).id;
  await db.enrollment.createMany({ data: [pupilA, pupilB].map((id) => ({ classId, schoolId, studentMembershipId: id, status: "ACTIVE" })) });
  await db.guardianship.createMany({
    data: [
      { parentUserId: parentA, studentMembershipId: pupilA, studentSchoolId: schoolId, status: "ACTIVE" },
      { parentUserId: parentB, studentMembershipId: pupilB, studentSchoolId: schoolId, status: "ACTIVE" },
      { parentUserId: parentB, studentMembershipId: pupilC, studentSchoolId: schoolId, status: "ACTIVE" },
      { parentUserId: parentNoPhone, studentMembershipId: pupilC, studentSchoolId: schoolId, status: "ACTIVE" },
    ],
  });
});

afterAll(async () => {
  await db.school.deleteMany({ where: { id: schoolId } });
  await db.user.deleteMany({ where: { email: { contains: `-${STAMP}@test.invalid` } } });
  await db.$disconnect();
});

describe("templates", () => {
  it("render in the reader's language, trim a variable to the DLT limit, and fall back to English", () => {
    expect(renderTemplate("absence", "en", { child: "Asha", school: "ZZ School" })).toBe("Asha has been missing school lately. Please speak to the office at ZZ School. - Relay");
    expect(renderTemplate("absence", "hi", { child: "आशा", school: "ZZ School" })).toContain("आशा इन दिनों स्कूल नहीं");
    expect(renderTemplate("absence", "mr", { child: "आशा", school: "ZZ School" })).toContain("शाळेत");
    expect(renderTemplate("absence", "fr", { child: "Asha", school: "S" })).toContain("has been missing");
    const long = "A".repeat(40);
    expect(renderTemplate("absence", "en", { child: long, school: "S" })).toContain(`${"A".repeat(29)}…`);
    expect(renderTemplate("circular", "en", { school: "S", notice: "N".repeat(400) })).toContain(`${"N".repeat(299)}…`);
  });

  it("print the DLT and WhatsApp forms with the variables in order", () => {
    expect(dltForm("feeDueSoon", "en")).toBe("Fees of {#var#} for {#var#} are due on {#var#} at {#var#}. Pay in the Relay app or at the office. - Relay");
    expect(whatsappForm("feeDueSoon", "en")).toBe("Fees of {{1}} for {{2}} are due on {{3}} at {{4}}. Pay in the Relay app or at the office. - Relay");
    expect(whatsappVarOrder("feeDueSoon", "en")).toEqual(["amount", "child", "date", "school"]);
    expect(whatsappVarOrder("feeDueSoon", "hi")).toEqual(["school", "child", "amount", "date"]);
    for (const [key, t] of Object.entries(MESSAGE_TEMPLATES)) for (const lang of ["en", "hi", "mr"] as const) expect(t.text[lang], `${key}/${lang}`).toContain("Relay");
  });

  it("count SMS segments: GSM-7 at 160/153, Devanagari at 70/67", () => {
    expect(smsSegments("A".repeat(160))).toBe(1);
    expect(smsSegments("A".repeat(161))).toBe(2);
    expect(smsSegments("A".repeat(306))).toBe(2);
    expect(smsSegments("A".repeat(307))).toBe(3);
    expect(smsSegments("क".repeat(70))).toBe(1);
    expect(smsSegments("क".repeat(71))).toBe(2);
  });
});

describe("routing", () => {
  it("off by default at a new school; the office switches channels and events; the head may not", async () => {
    expect(transportStatus()).toEqual({ sms: "devbox", whatsapp: "devbox", problems: [] });
    expect(await messagingSettings(schoolId)).toEqual({ smsEnabled: false, whatsappEnabled: false, monthlyCap: 2000, events: { absence: true, feeReminders: true, feeReceipts: true, circulars: true, incidents: true } });
    const off = await deliverToUser({ schoolId, userId: parentA, templateKey: "absence", vars: { child: "A" }, purpose: "absence" });
    expect(off).toMatchObject({ status: "SKIPPED", skipReason: "channel-off" });
    await expect(saveMessagingSettings(principal(), { smsEnabled: true })).rejects.toThrow("messaging.refuseOffice");
    await expect(saveMessagingSettings(admin(), { monthlyCap: -1 })).rejects.toThrow("messaging.refuseCap");
    await saveMessagingSettings(admin(), { smsEnabled: true, events: { feeReceipts: false } });
    expect(await messagingSettings(schoolId)).toMatchObject({ smsEnabled: true, whatsappEnabled: false, events: { feeReceipts: false, absence: true } });
  });

  it("no number, an event switched off, an opt-out: each a SKIPPED row with its reason, never a throw", async () => {
    expect(await deliverToUser({ schoolId, userId: parentNoPhone, templateKey: "absence", vars: { child: "C" }, purpose: "absence" })).toMatchObject({ status: "SKIPPED", skipReason: "no-phone" });
    expect(await deliverToUser({ schoolId, userId: parentA, templateKey: "feeReceived", vars: { child: "A", amount: "₹1", serial: "R/1" }, purpose: "fees:received" })).toMatchObject({ status: "SKIPPED", skipReason: "event-off" });
    await db.user.update({ where: { id: parentB }, data: { prefs: JSON.stringify({ locale: "hi", channels: { push: true, email: true, sms: false, whatsapp: true } }) } });
    expect(await deliverToUser({ schoolId, userId: parentB, templateKey: "absence", vars: { child: "B" }, purpose: "absence" })).toMatchObject({ status: "SKIPPED", skipReason: "opted-out" });
  });

  it("sends by SMS under devbox, in the person's language, and files it for /dev/mailbox", async () => {
    const out = await deliverToUser({ schoolId, userId: parentA, templateKey: "absence", vars: { child: "Asha" }, purpose: "absence" });
    expect(out).toMatchObject({ status: "SENT", channel: "SMS", skipReason: null });
    const row = await db.outboundMessage.findUniqueOrThrow({ where: { id: out.id } });
    expect(row.body).toBe(`Asha has been missing school lately. Please speak to the office at ZZ Msg School ${STAMP}. - Relay`);
    expect(row.providerSid).toBe(`devbox_${row.id}`);
    expect(row.segments).toBe(1);
    expect(await db.outboundEmail.count({ where: { to: row.to, purpose: "SMS", text: row.body } })).toBe(1);
  });

  it("WhatsApp is tried before SMS once the school opens it, and Hindi stays Hindi", async () => {
    await saveMessagingSettings(admin(), { whatsappEnabled: true });
    const out = await deliverToUser({ schoolId, userId: parentB, templateKey: "absence", vars: { child: "Bina" }, purpose: "absence" });
    expect(out).toMatchObject({ status: "SENT", channel: "WHATSAPP" });
    const row = await db.outboundMessage.findUniqueOrThrow({ where: { id: out.id } });
    expect(row.locale).toBe("hi");
    expect(row.body).toContain("Bina इन दिनों");
    // Parent B said no to SMS, not to WhatsApp — so the opt-out above no longer applies.
  });

  it("the daily cap per person and the monthly cap per school both refuse with their reason", async () => {
    for (let i = 0; i < DAILY_CAP_PER_PERSON; i++) await deliverToUser({ schoolId, userId: parentA, templateKey: "feeDueSoon", vars: { child: "A", amount: "₹1", date: "d" }, purpose: "fees:dueSoon" });
    expect(await deliverToUser({ schoolId, userId: parentA, templateKey: "feeDueSoon", vars: { child: "A", amount: "₹1", date: "d" }, purpose: "fees:dueSoon" })).toMatchObject({ status: "SKIPPED", skipReason: "cap-daily" });
    // Forced (the office's test) ignores the daily cap but not the monthly one.
    await saveMessagingSettings(admin(), { monthlyCap: 1 });
    expect(await sendTestMessage(admin())).toMatchObject({ status: "SKIPPED", skipReason: "cap-monthly" });
    await saveMessagingSettings(admin(), { monthlyCap: 2000 });
    const test = await sendTestMessage(admin());
    expect(test).toMatchObject({ status: "SENT", channel: "WHATSAPP" });
  });

  it("notify() carries a text beside the in-app row, and a text failure never fails the notification", async () => {
    const before = await db.outboundMessage.count({ where: { schoolId, userId: parentB, purpose: "fees:received" } });
    await saveMessagingSettings(admin(), { events: { feeReceipts: true } });
    await notify({ userId: parentB, schoolId, kind: "FEES", title: "t", body: "b", text: { templateKey: "feeReceived", vars: { child: "Bina", amount: "₹500", serial: "RCPT/1" }, purpose: "fees:received" } });
    expect(await db.outboundMessage.count({ where: { schoolId, userId: parentB, purpose: "fees:received" } })).toBe(before + 1);
    expect(await db.notification.count({ where: { userId: parentB, title: "t" } })).toBe(1);
    // No schoolId: no text, no error.
    await notify({ userId: parentB, kind: "FEES", title: "t2", body: "b", text: { templateKey: "feeReceived", vars: {}, purpose: "fees:received" } });
    expect(await db.outboundMessage.count({ where: { schoolId, userId: parentB, purpose: "fees:received" } })).toBe(before + 1);
  });
});

describe("broadcasts", () => {
  it("resolves an audience to distinct active guardians", async () => {
    expect((await resolveAudience(schoolId, { kind: "ALL_PARENTS" })).parentUserIds.sort()).toEqual([parentA, parentB, parentNoPhone].sort());
    expect((await resolveAudience(schoolId, { kind: "CLASS", classId })).parentUserIds.sort()).toEqual([parentA, parentB].sort());
    expect((await resolveAudience(schoolId, { kind: "GRADE", gradeLevel: "5" })).parentUserIds.sort()).toEqual([parentB, parentNoPhone].sort());
    expect((await resolveAudience(schoolId, { kind: "PEOPLE", userIds: [parentA, "nobody"] })).parentUserIds).toEqual([parentA]);
    expect((await resolveAudience(schoolId, { kind: "OVERDUE_FEES" })).parentUserIds).toEqual([]);
    await expect(resolveAudience(schoolId, { kind: "CLASS", classId: "nope" })).rejects.toThrow("messaging.notFound");
  });

  it("the overdue-fees audience is this year's overdue demands of pupils on the roll: not a leaver's, not last year's, not one due tomorrow", async () => {
    const past = new Date(`${addDaysToKey(TODAY, -5)}T00:00:00.000Z`);
    const [thisYear, lastYear] = await Promise.all([
      db.academicYear.create({ data: { schoolId, name: "2026–27", startDate: new Date("2026-06-01T00:00:00Z"), endDate: new Date("2027-04-30T00:00:00Z"), isCurrent: true }, select: { id: true } }),
      db.academicYear.create({ data: { schoolId, name: "2025–26", startDate: new Date("2025-06-01T00:00:00Z"), endDate: new Date("2026-04-30T00:00:00Z"), isCurrent: false }, select: { id: true } }),
    ]);
    // A pupil who has left, with their own guardian, owing this year.
    const [lu, lp] = await Promise.all([db.user.create({ data: { name: "ZZ Msg Leaver", email: `zz-msg-leaver-${STAMP}@test.invalid` }, select: { id: true } }), db.user.create({ data: { name: "ZZ Msg LeaverParent", email: `zz-msg-leaverparent-${STAMP}@test.invalid`, phone: `+9198709${String(STAMP).slice(-6)}`, phoneVerifiedAt: new Date() }, select: { id: true } })]);
    const leaver = (await db.membership.create({ data: { userId: lu.id, schoolId, role: "STUDENT", status: "ACTIVE", leftAt: new Date(), studentCode: `ZML${STAMP}`, gradeLevel: "3" }, select: { id: true } })).id;
    await db.guardianship.create({ data: { parentUserId: lp.id, studentMembershipId: leaver, studentSchoolId: schoolId, status: "ACTIVE" } });
    await db.feeDemand.createMany({
      data: [
        { schoolId, studentMembershipId: pupilA, academicYearId: thisYear.id, label: "Term 1", dueDate: past, grossPaise: 500_00, netPaise: 500_00, status: "OPEN" },
        { schoolId, studentMembershipId: leaver, academicYearId: thisYear.id, label: "Term 1", dueDate: past, grossPaise: 500_00, netPaise: 500_00, status: "OPEN" },
        { schoolId, studentMembershipId: pupilB, academicYearId: lastYear.id, label: "Term 3", dueDate: past, grossPaise: 500_00, netPaise: 500_00, status: "PART", paidPaise: 100_00 },
        { schoolId, studentMembershipId: pupilC, academicYearId: thisYear.id, label: "Term 1", dueDate: new Date(`${addDaysToKey(TODAY, 1)}T00:00:00.000Z`), grossPaise: 500_00, netPaise: 500_00, status: "OPEN" },
      ],
    });
    expect((await resolveAudience(schoolId, { kind: "OVERDUE_FEES" })).parentUserIds).toEqual([parentA]);
    await db.feeDemand.deleteMany({ where: { schoolId } });
    await db.academicYear.deleteMany({ where: { schoolId } });
  });

  it("previews reach, then sends a notice, queued and drained inline, and reports per person", async () => {
    // Parent A is at the daily cap from the test above; a fresh day is not
    // available, so the preview counts them anyway (it does not know caps)
    // and the send records them SKIPPED.
    const preview = await previewBroadcast(admin(), { audience: { kind: "ALL_PARENTS" }, body: "Sports day on Friday." });
    expect(preview).toEqual({ recipients: 3, withPhone: 2, whatsapp: 2, sms: 0, unreachable: 1, estimatedSegments: 2 });
    await expect(createBroadcast(admin(), { title: "S", body: "Sports day on Friday.", audience: { kind: "ALL_PARENTS" }, channels: ["TEXT"] })).rejects.toThrow("messaging.refuseTitle");
    await expect(createBroadcast(admin(), { title: "Sports", body: "Hi", audience: { kind: "ALL_PARENTS" }, channels: ["TEXT"] })).rejects.toThrow("messaging.refuseBody");
    const created = await createBroadcast(admin(), { title: "Sports day", body: "Sports day is on Friday. Pupils come in house colours.", audience: { kind: "ALL_PARENTS" }, channels: ["TEXT", "PUSH"] });
    expect(created.recipients).toBe(3);
    expect(created.pushed).toBe(3);
    expect(created.queued + created.skipped).toBe(3);
    const detail = await broadcastDetail(admin(), created.broadcastId);
    expect(detail.broadcast.status).toBe("DONE");
    expect(detail.broadcast.sent).toBe(created.queued);
    expect(detail.broadcast.skipped).toBe(created.skipped);
    const byUser = Object.fromEntries(detail.messages.map((m) => [m.userId, m]));
    expect(byUser[parentNoPhone]).toMatchObject({ status: "SKIPPED", skipReason: "no-phone" });
    expect(byUser[parentB]).toMatchObject({ status: "SENT", channel: "WHATSAPP" });
    expect(byUser[parentA]).toMatchObject({ status: "SKIPPED", skipReason: "cap-daily" });
    expect((await listBroadcasts(principal())).map((b) => b.id)).toContain(created.broadcastId);
    await expect(createBroadcast(principal(), { title: "Sports day", body: "Sports day is on Friday.", audience: { kind: "ALL_PARENTS" }, channels: ["TEXT"] })).rejects.toThrow("messaging.refuseOffice");
  });

  it("a large notice is queued for the job, which drains it school by school", async () => {
    const b = await db.broadcast.create({ data: { schoolId, authorUserId: adminUserId, title: "Queued", body: "x", audienceJson: "{}", recipients: 1 }, select: { id: true } });
    const queued = await deliverToUser({ schoolId, userId: parentB, templateKey: "circular", vars: { notice: "Queued notice" }, purpose: "broadcast", broadcastId: b.id, queueOnly: true });
    expect(queued.status).toBe("QUEUED");
    const report = await drainQueue();
    expect(report.perSchool[schoolId]?.sent).toBeGreaterThanOrEqual(1);
    expect((await db.outboundMessage.findUniqueOrThrow({ where: { id: queued.id } })).status).toBe("SENT");
    expect((await db.broadcast.findUniqueOrThrow({ where: { id: b.id } })).status).toBe("DONE");
  });

  it("the provider's status callback moves a row on and the counts follow; the resend queues the failed ones again", async () => {
    const sent = (await rows({ userId: parentB, purpose: "broadcast", status: "SENT" }))[0]!;
    expect(await recordProviderStatus(schoolId, { sid: sent.providerSid!, status: "delivered" })).toBe(true);
    expect((await db.outboundMessage.findUniqueOrThrow({ where: { id: sent.id } })).status).toBe("DELIVERED");
    expect(await recordProviderStatus(schoolId, { sid: "SMnope", status: "delivered" })).toBe(false);
    const other = (await rows({ userId: parentB, purpose: "broadcast", status: "SENT" }))[0];
    if (other) {
      await recordProviderStatus(schoolId, { sid: other.providerSid!, status: "undelivered", errorCode: "30003", errorMessage: "Unreachable" });
      const failed = await db.outboundMessage.findUniqueOrThrow({ where: { id: other.id } });
      expect(failed.status).toBe("UNDELIVERED");
      expect(failed.error).toBe("30003: Unreachable");
      const b = await db.broadcast.findUniqueOrThrow({ where: { id: other.broadcastId! } });
      expect(b.failed).toBeGreaterThanOrEqual(1);
      const resent = await resendBroadcastFailures(admin(), other.broadcastId!);
      expect(resent.requeued).toBeGreaterThanOrEqual(1);
      expect((await db.outboundMessage.findUniqueOrThrow({ where: { id: other.id } })).status).toBe("SENT");
    }
  });

  it("the overview adds up", async () => {
    const o = await messagingOverview(principal());
    expect(o.settings.smsEnabled).toBe(true);
    expect(o.parentsTotal).toBe(3);
    expect(o.parentsWithPhone).toBe(2);
    expect(o.month.sent).toBeGreaterThan(0);
    expect(o.month.skipped).toBeGreaterThan(0);
    expect(o.skippedByReason["no-phone"]).toBeGreaterThanOrEqual(2);
    expect(o.templates.map((t) => t.key)).toEqual(Object.keys(MESSAGE_TEMPLATES));
    expect(o.recent.length).toBeGreaterThanOrEqual(1);
  });
});

describe("the provider signature", () => {
  it("is HMAC-SHA1 over the URL and the sorted parameters, keyed on the auth token", () => {
    const url = "https://app.example/api/webhooks/twilio/status/s1";
    const params = { MessageSid: "SM1", MessageStatus: "delivered" };
    // Computed the same way the adapter does, then checked both ways.
    const sig = createHmac("sha1", "tok").update(url + "MessageSidSM1MessageStatusdelivered").digest("base64");
    expect(twilioSignatureValid("tok", url, params, sig)).toBe(true);
    expect(twilioSignatureValid("other", url, params, sig)).toBe(false);
    expect(twilioSignatureValid("tok", url, { ...params, MessageStatus: "failed" }, sig)).toBe(false);
    expect(twilioSignatureValid("tok", url, params, null)).toBe(false);
  });
});
