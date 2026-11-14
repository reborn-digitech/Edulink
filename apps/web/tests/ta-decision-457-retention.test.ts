/**
 * The owner's decision on TA-457 of the testing analysis of 13 November 2026 (option 1, 14 November 2026): keep one
 * year, then delete, and never forget a STOP. Texts (OutboundMessage), bus boarding times (TripBoarding), closed job
 * and admission enquiries, and refused or withdrawn expert applications with their document are deleted by the
 * nightly clean-up after a year, each period an operator dial; the words of a skipped text are blanked at once; the
 * record that a number replied STOP is never deleted; numbers and words are blanked when a pupil or guardian leaves
 * the school.
 *
 * At ZZ schools of this suite's own, removed afterwards. Every sweep here is scoped to this suite's own schools or
 * applicants (a future clock is refused unscoped, and an unscoped sweep would reach the whole dev database).
 */
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { resolve } from "node:path";
import { rm } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { operatorRetentionSchema } from "@edulink/contracts";
import type { ActiveContext } from "@/lib/session";
import { RETENTION_KEYS, cutoffs, retentionPreview, sweepExpired } from "@/lib/retention";
import { RETENTION_DEFAULTS, readRetentionConfig } from "@/lib/env";
import { deliverToUser, resendBroadcastFailures } from "@/lib/messaging";
import { broadcastCounterFails } from "./audit-recounts";
import { recordDeparture } from "@/lib/school-record";
import { removeMembership } from "@/lib/membership";
import { unlinkChild } from "@/lib/guardianship";
import { blobStore } from "@/lib/blob-store";

vi.setConfig({ testTimeout: 60_000, hookTimeout: 60_000 });

const STORE = resolve(process.cwd(), ".tmp-ta-decision-457-store");
const REAL_STORAGE_DIR = process.env.STORAGE_DIR;
process.env.STORAGE_DIR = STORE;

const db = new PrismaClient();
const STAMP = Date.now();
const SUFFIX = String(STAMP).slice(-6);
const DAY = 86_400_000;
const NOW = new Date();
const daysAgo = (d: number) => new Date(NOW.getTime() - d * DAY);
const mail = (who: string) => `zz-tad457-${who}-${STAMP}@test.invalid`;
const phone = (n: number) => `+9198${SUFFIX}${String(n).padStart(2, "0")}`;
const ids: Record<string, string> = {};
const APPLICANT = mail("applicant");

function ctx(userId: string, role: ActiveContext["role"], membershipId: string | null, schoolId: string | null): ActiveContext {
  return { sessionId: "t", membershipId, schoolId, role, user: { id: userId, name: "ZZ", preferredName: null, email: null, avatarKey: null, isMinor: false, isSuperuser: false, isAppAdmin: false, prefs: {} as never } } as ActiveContext;
}
const office = () => ctx(ids.admin!, "ADMIN", ids.adminM!, ids.school!);

type TextInput = { schoolId: string; userId: string | null; to: string; createdAt?: Date; status?: string; error?: string | null; body?: string };
async function text(t: TextInput): Promise<string> {
  return (
    await db.outboundMessage.create({
      data: { schoolId: t.schoolId, userId: t.userId, to: t.to, channel: "SMS", templateKey: "circular", locale: "en", varsJson: JSON.stringify({ notice: "ZZ sports day" }), body: t.body ?? "Notice from ZZ: sports day for Asha - Shalaghar", status: t.status ?? "SENT", error: t.error ?? null, purpose: "test", ...(t.createdAt ? { createdAt: t.createdAt } : {}) },
      select: { id: true },
    })
  ).id;
}
const row = (id: string) => db.outboundMessage.findUnique({ where: { id }, select: { to: true, body: true, varsJson: true, error: true } });

beforeAll(async () => {
  const school = async (tag: string) => (await db.school.create({ data: { name: `ZZ TA-457 ${tag} ${STAMP}`, slug: `zz-tad457-${tag.toLowerCase()}-${STAMP}`, code: `Z4${tag[0]}${SUFFIX}`, contactEmail: mail(tag.toLowerCase()), timezone: "Asia/Kolkata", isTestFixture: true }, select: { id: true } })).id;
  ids.school = await school("Main");
  ids.other = await school("Other");
  for (const who of ["admin", "driver", "pupil1", "pupil2", "pupil3", "pupil4", "g1", "g2", "g3", "enquirer", "texted", "gone"]) {
    ids[who] = (await db.user.create({ data: { name: `ZZ TA-457 ${who}`, email: mail(who), isTestFixture: true, ...(who.startsWith("g") && who !== "gone" ? { phone: phone(Number(who.slice(1))) } : {}), ...(who === "gone" ? { disabledAt: new Date() } : {}) }, select: { id: true } })).id;
  }
  const member = async (who: string, role: string, joinedAt?: Date) => (await db.membership.create({ data: { userId: ids[who]!, schoolId: ids.school!, role, status: "ACTIVE", ...(joinedAt ? { joinedAt } : {}) }, select: { id: true } })).id;
  ids.adminM = await member("admin", "ADMIN");
  ids.driverM = await member("driver", "DRIVER");
  for (const p of ["pupil1", "pupil2", "pupil3", "pupil4"]) ids[`${p}M`] = await member(p, "STUDENT", daysAgo(400));
  const link = (parent: string, pupilM: string) => db.guardianship.create({ data: { parentUserId: ids[parent]!, studentMembershipId: ids[pupilM]!, studentSchoolId: ids.school!, relation: "PARENT", status: "ACTIVE" } });
  // g1 is pupil1's alone; g2 is pupil1's and pupil2's; g3 is pupil3's alone (pupil3 has no history: removable).
  await link("g1", "pupil1M");
  await link("g2", "pupil1M");
  await link("g2", "pupil2M");
  await link("g3", "pupil3M");
});

afterAll(async () => {
  const people = await db.user.findMany({ where: { email: { startsWith: "zz-tad457-", endsWith: `-${STAMP}@test.invalid` } }, select: { id: true } });
  const apps = await db.expertApplication.findMany({ where: { email: APPLICANT }, select: { documentFileId: true } });
  for (const a of apps) if (a.documentFileId) await blobStore("files").delete(`${a.documentFileId.slice(0, 2)}/${a.documentFileId}`).catch(() => {});
  await db.expertApplication.deleteMany({ where: { email: APPLICANT } });
  await db.notification.deleteMany({ where: { userId: { in: people.map((p) => p.id) } } });
  await db.auditLog.deleteMany({ where: { schoolId: { in: [ids.school!, ids.other!] } } });
  await db.school.deleteMany({ where: { id: { in: [ids.school!, ids.other!] } } });
  await db.user.deleteMany({ where: { id: { in: people.map((p) => p.id) } } });
  await db.$disconnect();
  await rm(STORE, { recursive: true, force: true });
  await rm(`${STORE}-variants`, { recursive: true, force: true });
  if (REAL_STORAGE_DIR === undefined) delete process.env.STORAGE_DIR;
  else process.env.STORAGE_DIR = REAL_STORAGE_DIR;
});

describe("TA-457: each period is an operator dial, a year by default", () => {
  it("TA-457: the four dials default to 365 days, read their RETENTION_* variables and are on the sweep's list", () => {
    const defaults = RETENTION_DEFAULTS as unknown as Record<string, number>;
    expect(defaults.textMessageDays).toBe(365);
    expect(defaults.tripBoardingDays).toBe(365);
    expect(defaults.enquiryDays).toBe(365);
    expect(defaults.expertApplicationDays).toBe(365);
    const names = ["RETENTION_TEXTS_DAYS", "RETENTION_TRIP_BOARDINGS_DAYS", "RETENTION_ENQUIRIES_DAYS", "RETENTION_EXPERT_APPLICATIONS_DAYS"] as const;
    const before = names.map((n) => process.env[n]);
    try {
      for (const n of names) process.env[n] = "400";
      const read = readRetentionConfig().config as unknown as Record<string, number>;
      expect([read.textMessageDays, read.tripBoardingDays, read.enquiryDays, read.expertApplicationDays]).toEqual([400, 400, 400, 400]);
    } finally {
      names.forEach((n, i) => (before[i] === undefined ? delete process.env[n] : (process.env[n] = before[i])));
    }
    expect(RETENTION_KEYS as string[]).toEqual(expect.arrayContaining(["textMessages", "tripBoardings", "enquiries", "expertApplications"]));
  });

  it("TA-457: the operator's retention door carries the new dials and what is waiting", async () => {
    const view = operatorRetentionSchema.parse(await retentionPreview(NOW, undefined, { schoolIds: [ids.school!] })) as unknown as { config: Record<string, number>; pending: Record<string, number> };
    expect(view.config.textMessageDays).toBe(365);
    expect(view.config.expertApplicationDays).toBe(365);
    expect(typeof view.pending.textMessages).toBe("number");
    expect(typeof view.pending.tripBoardings).toBe("number");
    expect(typeof view.pending.enquiries).toBe("number");
    expect(typeof view.pending.expertApplications).toBe("number");
  });
});

describe("TA-457: the nightly clean-up deletes after a year", () => {
  it("TA-457: a text past a year goes and one inside it stays; a STOP reply's record stays, its number kept and its words blanked", async () => {
    const old = await text({ schoolId: ids.school!, userId: ids.texted!, to: phone(50), createdAt: daysAgo(366) });
    const recent = await text({ schoolId: ids.school!, userId: ids.texted!, to: phone(50), createdAt: daysAgo(364) });
    const stop = await text({ schoolId: ids.school!, userId: ids.texted!, to: phone(51), createdAt: daysAgo(500), status: "FAILED", error: "21610: Attempt to send to unsubscribed recipient" });
    const stopAtSend = await text({ schoolId: ids.school!, userId: null, to: phone(52), createdAt: daysAgo(800), status: "FAILED", error: "Attempt to send to unsubscribed recipient (code 21610)" });
    const elsewhere = await text({ schoolId: ids.other!, userId: ids.texted!, to: phone(50), createdAt: daysAgo(366) });
    const preview = await retentionPreview(NOW, undefined, { schoolIds: [ids.school!] });
    expect((preview.pending as unknown as Record<string, number>).textMessages).toBe(1);
    const { summary } = await sweepExpired(NOW, undefined, { schoolIds: [ids.school!] });
    expect((summary as unknown as Record<string, number>).textMessages).toBe(1);
    expect(await row(old)).toBeNull();
    expect(await row(recent)).not.toBeNull();
    // Another school is outside the scope and stays.
    expect(await row(elsewhere)).not.toBeNull();
    for (const id of [stop, stopAtSend]) {
      const kept = await row(id);
      expect(kept).not.toBeNull();
      expect(kept!.to).not.toBe("");
      expect(kept!.error).toContain("21610");
      expect(kept!.body).toBe("");
      expect(kept!.varsJson).toBe("{}");
    }
    const again = await sweepExpired(NOW, undefined, { schoolIds: [ids.school!] });
    expect((again.summary as unknown as Record<string, number>).textMessages).toBe(0);
    expect(await row(stop)).not.toBeNull();
  });

  it("TA-457: a pupil's bus boarding times go a year after the trip, the recent ones stay", async () => {
    const route = await db.transportRoute.create({ data: { schoolId: ids.school!, name: "ZZ TA-457 route" }, select: { id: true } });
    const stopRow = await db.transportStop.create({ data: { schoolId: ids.school!, routeId: route.id, order: 1, name: "ZZ stop", lat: 18.5, lng: 73.8 }, select: { id: true } });
    const bus = await db.bus.create({ data: { schoolId: ids.school!, registration: `ZZ-${SUFFIX}`, capacity: 30 }, select: { id: true } });
    const assignment = await db.busAssignment.create({ data: { schoolId: ids.school!, busId: bus.id, routeId: route.id, driverMembershipId: ids.driverM!, fromDateKey: "2025-01-01" }, select: { id: true } });
    const allotment = await db.transportAllotment.create({ data: { schoolId: ids.school!, studentMembershipId: ids.pupil4M!, routeId: route.id, stopId: stopRow.id, fromDateKey: "2025-01-01" }, select: { id: true } });
    const boarding = async (dateKey: string, at: Date) => {
      const trip = await db.trip.create({ data: { schoolId: ids.school!, assignmentId: assignment.id, dateKey, direction: "MORNING", status: "ENDED", createdAt: at }, select: { id: true } });
      return (await db.tripBoarding.create({ data: { schoolId: ids.school!, tripId: trip.id, allotmentId: allotment.id, boardedAt: at, alightedAt: at, createdAt: at }, select: { id: true } })).id;
    };
    const old = await boarding("2024-01-02", daysAgo(370));
    const recent = await boarding("2024-01-03", daysAgo(20));
    const { summary } = await sweepExpired(NOW, undefined, { schoolIds: [ids.school!] });
    expect((summary as unknown as Record<string, number>).tripBoardings).toBe(1);
    expect(await db.tripBoarding.findUnique({ where: { id: old } })).toBeNull();
    expect(await db.tripBoarding.findUnique({ where: { id: recent } })).not.toBeNull();
  });

  it("TA-457: closed job and admission enquiries go a year after closing, with their messages; an open one and a recently closed one stay", async () => {
    const enquiry = async (kind: string, status: string, closedAt: Date | null, createdAt: Date) => {
      const e = await db.enquiry.create({ data: { schoolId: ids.school!, kind, fromUserId: ids.enquirer!, status, closedAt, schoolName: "ZZ", subject: kind === "JOB" ? "ZZ Teacher" : "", createdAt }, select: { id: true } });
      await db.enquiryMessage.create({ data: { schoolId: ids.school!, enquiryId: e.id, authorUserId: ids.enquirer!, body: "ZZ my phone is +91 98000 00000", createdAt } });
      return e.id;
    };
    const oldJob = await enquiry("JOB", "CLOSED", daysAgo(400), daysAgo(420));
    const oldAdmission = await enquiry("ADMISSION", "CLOSED", daysAgo(366), daysAgo(380));
    const recentlyClosed = await enquiry("JOB", "CLOSED", daysAgo(100), daysAgo(500));
    const stillOpen = await enquiry("ADMISSION", "OPEN", null, daysAgo(600));
    const { summary } = await sweepExpired(NOW, undefined, { schoolIds: [ids.school!] });
    expect((summary as unknown as Record<string, number>).enquiries).toBe(2);
    const left = (await db.enquiry.findMany({ where: { id: { in: [oldJob, oldAdmission, recentlyClosed, stillOpen] } }, select: { id: true } })).map((r) => r.id).sort();
    expect(left).toEqual([recentlyClosed, stillOpen].sort());
    expect(await db.enquiryMessage.count({ where: { enquiryId: { in: [oldJob, oldAdmission] } } })).toBe(0);
  });

  it("TA-457: refused and withdrawn expert applications go a year after the decision with their document; a pending, an approved and a recent refusal stay", async () => {
    const files = blobStore("files");
    const application = async (status: string, decidedAt: Date | null, createdAt: Date, n: number) => {
      const fileId = `${randomUUID()}.pdf`;
      await files.put(`${fileId.slice(0, 2)}/${fileId}`, Buffer.from(`%PDF-1.4 ZZ ${n}`), "application/pdf");
      const id = (await db.expertApplication.create({ data: { name: `ZZ TA-457 applicant ${n}`, email: APPLICANT, phone: "+919800000000", city: "ZZ Pune", headline: "ZZ", yearsExperience: 3, bio: "ZZ", offering: "SESSIONS", documentFileId: fileId, declarationAt: createdAt, status, decidedAt, createdAt }, select: { id: true } })).id;
      return { id, fileId };
    };
    const refused = await application("REFUSED", daysAgo(400), daysAgo(410), 1);
    const withdrawn = await application("WITHDRAWN", null, daysAgo(380), 2);
    const recentRefusal = await application("REFUSED", daysAgo(30), daysAgo(40), 3);
    const pending = await application("PENDING", null, daysAgo(500), 4);
    const approved = await application("APPROVED", daysAgo(500), daysAgo(510), 5);
    // A school scope does not reach the applicants: they belong to no school.
    const bySchool = await sweepExpired(NOW, undefined, { schoolIds: [ids.school!] });
    expect((bySchool.summary as unknown as Record<string, number>).expertApplications).toBe(0);
    const scope = { applicationEmails: [APPLICANT] } as Parameters<typeof sweepExpired>[2];
    const preview = await retentionPreview(NOW, undefined, scope);
    expect((preview.pending as unknown as Record<string, number>).expertApplications).toBe(2);
    const { summary } = await sweepExpired(NOW, undefined, scope);
    expect((summary as unknown as Record<string, number>).expertApplications).toBe(2);
    const left = (await db.expertApplication.findMany({ where: { email: APPLICANT }, select: { id: true } })).map((r) => r.id).sort();
    expect(left).toEqual([recentRefusal.id, pending.id, approved.id].sort());
    expect(await files.get(`${refused.fileId.slice(0, 2)}/${refused.fileId}`)).toBeNull();
    expect(await files.get(`${withdrawn.fileId.slice(0, 2)}/${withdrawn.fileId}`)).toBeNull();
    expect(await files.get(`${recentRefusal.fileId.slice(0, 2)}/${recentRefusal.fileId}`)).not.toBeNull();
  });
});

describe("TA-457: a skipped text keeps no words", () => {
  it("TA-457: a text that is skipped is written with its words blanked at once", async () => {
    const out = await deliverToUser({ schoolId: ids.school!, userId: ids.gone!, templateKey: "circular", vars: { notice: "ZZ Asha's fee of 4000 is due" }, purpose: "test" });
    expect(out.status).toBe("SKIPPED");
    const written = await row(out.id);
    expect(written!.body).toBe("");
    expect(written!.varsJson).toBe("{}");
  });

  it("TA-457: a skipped text written before the decision loses its words at the next sweep", async () => {
    const before = await text({ schoolId: ids.school!, userId: ids.texted!, to: phone(53), createdAt: daysAgo(3), status: "SKIPPED" });
    await sweepExpired(NOW, undefined, { schoolIds: [ids.school!] });
    const kept = await row(before);
    expect(kept).not.toBeNull();
    expect(kept!.body).toBe("");
    expect(kept!.varsJson).toBe("{}");
  });
});

describe("TA-457: a pupil or guardian who leaves the school takes their number and words with them", () => {
  it("TA-457: a pupil's departure blanks the pupil's and the leaving guardian's texts at the school, keeps a STOP's number, and spares a guardian with another child there", async () => {
    const pupilText = await text({ schoolId: ids.school!, userId: ids.pupil1!, to: phone(60) });
    const g1Text = await text({ schoolId: ids.school!, userId: ids.g1!, to: phone(1) });
    const g1Stop = await text({ schoolId: ids.school!, userId: ids.g1!, to: phone(61), status: "FAILED", error: "21610: unsubscribed" });
    const g1Elsewhere = await text({ schoolId: ids.other!, userId: ids.g1!, to: phone(1) });
    const g2Text = await text({ schoolId: ids.school!, userId: ids.g2!, to: phone(2) });
    const left = await recordDeparture(office(), ids.pupil1M!, { reason: "TRANSFERRED", conduct: "GOOD", leftOn: new Date() });
    expect(left.ok).toBe(true);
    for (const id of [pupilText, g1Text]) expect(await row(id)).toMatchObject({ to: "", body: "", varsJson: "{}" });
    expect(await row(g1Stop)).toMatchObject({ to: phone(61), body: "", varsJson: "{}" });
    // Another school's text and a guardian who still has a child on the roll are untouched.
    expect((await row(g1Elsewhere))!.to).toBe(phone(1));
    expect((await row(g2Text))!.to).toBe(phone(2));
    expect((await row(g2Text))!.body).not.toBe("");
    const audit = await db.auditLog.findFirst({ where: { schoolId: ids.school!, action: "student.leave", targetId: ids.pupil1M! }, select: { meta: true } });
    expect((JSON.parse(audit?.meta ?? "{}") as { textsBlanked?: number }).textsBlanked).toBe(3);
  });

  it("TA-457: a guardian who ends their last link at the school leaves it, and their texts there are blanked", async () => {
    const g2Text = await text({ schoolId: ids.school!, userId: ids.g2!, to: phone(2) });
    // g2's other child (pupil1) has left; ending the link to pupil2 leaves g2 with no pupil on the roll.
    await unlinkChild(ctx(ids.g2!, "PARENT", null, null), ids.pupil2M!);
    expect(await row(g2Text)).toMatchObject({ to: "", body: "", varsJson: "{}" });
    expect(await db.outboundMessage.count({ where: { schoolId: ids.school!, to: phone(2) } })).toBe(0);
  });

  it("TA-457: removing a pupil with no history leaves no row carrying the number of the guardian it leaves with nobody at the school", async () => {
    await text({ schoolId: ids.school!, userId: ids.g3!, to: phone(3) });
    await text({ schoolId: ids.school!, userId: ids.g3!, to: phone(3), status: "SKIPPED" });
    const out = await removeMembership(office(), ids.pupil3M!);
    expect(out.ok).toBe(true);
    expect(await db.outboundMessage.count({ where: { schoolId: ids.school!, to: phone(3) } })).toBe(0);
    expect(await db.outboundMessage.count({ where: { schoolId: ids.school!, userId: ids.g3!, NOT: { body: "" } } })).toBe(0);
  });
});

describe("TA-457: a STOP is never forgotten by a resend, and the data audit reads a broadcast past the year by what the clean-up leaves", () => {
  const broadcast = async (title: string, createdAt: Date, counts: { recipients: number; sent: number; failed: number; skipped: number }) =>
    (await db.broadcast.create({ data: { schoolId: ids.school!, authorUserId: ids.admin!, title: `ZZ TA-457 ${title}`, body: "ZZ notice", audienceJson: JSON.stringify({ kind: "ALL_PARENTS" }), ...counts, delivered: 0, queued: 0, status: "DONE", doneAt: createdAt, createdAt }, select: { id: true } })).id;
  const message = async (broadcastId: string, t: { to: string; status: string; error?: string; createdAt: Date; blank?: boolean }) =>
    (
      await db.outboundMessage.create({
        data: { schoolId: ids.school!, userId: ids.texted!, to: t.to, channel: "SMS", templateKey: "circular", locale: "en", varsJson: t.blank ? "{}" : JSON.stringify({ notice: "ZZ notice" }), body: t.blank ? "" : "Notice from ZZ - Shalaghar", status: t.status, error: t.error ?? null, purpose: "broadcast", broadcastId, createdAt: t.createdAt },
        select: { id: true },
      })
    ).id;

  it("TA-457: resending a notice's failures never picks up or rewrites a STOP reply's row, past the year or inside it, and never clears its error", async () => {
    const b = await broadcast("resend", daysAgo(2), { recipients: 2, sent: 0, failed: 2, skipped: 0 });
    const fresh = await message(b, { to: phone(70), status: "FAILED", error: "21610: Attempt to send to unsubscribed recipient", createdAt: daysAgo(2) });
    const blanked = await message(b, { to: phone(71), status: "FAILED", error: "Attempt to send to unsubscribed recipient (code 21610)", createdAt: daysAgo(2), blank: true });
    try {
      const out = await resendBroadcastFailures(office(), b);
      expect(out.requeued).toBe(0);
      expect(await row(fresh)).toMatchObject({ to: phone(70), error: "21610: Attempt to send to unsubscribed recipient" });
      expect(await row(blanked)).toMatchObject({ to: phone(71), error: "Attempt to send to unsubscribed recipient (code 21610)", body: "", varsJson: "{}" });
      expect(await db.outboundMessage.count({ where: { id: { in: [fresh, blanked] }, status: "FAILED" } })).toBe(2);
    } finally {
      await db.rateLimit.deleteMany({ where: { bucket: `broadcast-resend:${b}` } });
    }
  });

  it("TA-457: a resend decided for a STOP reply's row answers opted-out and leaves the row as it stands", async () => {
    const b = await broadcast("resend-direct", daysAgo(1), { recipients: 1, sent: 0, failed: 1, skipped: 0 });
    const stop = await message(b, { to: phone(72), status: "FAILED", error: "21610: unsubscribed", createdAt: daysAgo(1) });
    const out = await deliverToUser({ schoolId: ids.school!, userId: ids.texted!, templateKey: "circular", vars: {}, purpose: "broadcast", broadcastId: b, resendRowId: stop });
    expect(out).toMatchObject({ id: stop, skipReason: "opted-out" });
    expect(await row(stop)).toMatchObject({ to: phone(72), error: "21610: unsubscribed" });
    expect((await db.outboundMessage.findUnique({ where: { id: stop }, select: { status: true } }))!.status).toBe("FAILED");
  });

  it("TA-457: the data audit's broadcast counters hold once the clean-up has taken a year-old notice's texts and kept its STOP row, and still catch a notice inside the year that disagrees", async () => {
    const old = await broadcast("old", daysAgo(400), { recipients: 3, sent: 2, failed: 1, skipped: 0 });
    await message(old, { to: phone(80), status: "SENT", createdAt: daysAgo(400) });
    await message(old, { to: phone(81), status: "DELIVERED", createdAt: daysAgo(400) });
    const stop = await message(old, { to: phone(82), status: "FAILED", error: "21610: unsubscribed", createdAt: daysAgo(400) });
    const wrong = await broadcast("wrong", daysAgo(5), { recipients: 1, sent: 1, failed: 0, skipped: 0 });
    await message(wrong, { to: phone(83), status: "SKIPPED", createdAt: daysAgo(5) });
    await sweepExpired(NOW, undefined, { schoolIds: [ids.school!] });
    expect(await db.outboundMessage.count({ where: { broadcastId: old } })).toBe(1);
    expect(await row(stop)).toMatchObject({ to: phone(82) });
    const fails = await broadcastCounterFails(db, ids.school!, cutoffs(NOW, RETENTION_DEFAULTS).textMessages);
    expect(fails.filter((f) => f.includes("ZZ TA-457 old"))).toEqual([]);
    expect(fails.filter((f) => f.includes("ZZ TA-457 wrong")).length).toBeGreaterThan(0);
  });
});
