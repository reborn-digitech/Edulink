/**
 * TA-532, the testing analysis of 13 November 2026, as the owner's decision of 14 November 2026 builds it: an
 * expert's count of mentee places (ExpertProfile.activeMentorships) is a stored copy that only an explicit close gave
 * back, and a pupil who left the school kept their mentorship open, so the outside expert could still write to them.
 *
 *   - each night accounts:tidy ends the mentorships of pupils who have left, and tells the expert and the guardians;
 *   - and then sets every expert's count from the mentorships really holding a place (PENDING_CONSENT or ACTIVE),
 *     across every school, through one locked recount in src/lib/mentoring.ts (skipped on a narrowed run);
 *   - closing a mentorship gives its place back in the same transaction as the status change, so a recount cannot
 *     land between the two;
 *   - the demo and sweep scripts set the count through the same recount.
 *
 * As the database's owner (the rules, not the policies). Two scratch ZZ schools of this suite's own, their people and
 * experts (the stamp in every name), removed afterwards. The phone push is stood in for; nothing leaves the machine.
 */
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/expo-push", () => ({
  sendExpoPush: async () => ({ sent: 0, failed: 0, retired: 0 }),
}));

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { PrismaClient } from "@prisma/client";
import { runJob } from "@/lib/jobs";
import * as mentoring from "@/lib/mentoring";
import { AccessError } from "@/lib/tenancy";
import type { ActiveContext } from "@/lib/session";

const db = new PrismaClient();
const STAMP = Date.now();
const DAY = 86_400_000;
const id: Record<string, string> = {};
const member: Record<string, string> = {};
const profile: Record<string, string> = {};
const school: Record<string, string> = {};
const WHY = "ZZ Choosing what to study after grade ten.";

const ctx = (key: string, role: ActiveContext["role"], schoolId: string | null): ActiveContext =>
  ({ sessionId: "test", membershipId: role === "PARENT" || role === "EXPERT" ? null : (member[key] ?? null), schoolId, role, user: { id: id[key]!, name: `ZZ TA 532 ${key} ${STAMP}`, preferredName: null, email: null, avatarKey: null, isMinor: false, isSuperuser: false, isAppAdmin: false } }) as ActiveContext;
const placesOf = async (key: string) => (await db.expertProfile.findUniqueOrThrow({ where: { id: profile[key]! }, select: { activeMentorships: true } })).activeMentorships;
const holding = (key: string) => db.mentorThread.count({ where: { expertProfileId: profile[key]!, status: { in: ["PENDING_CONSENT", "ACTIVE"] } } });
const statusOf = async (threadId: string) => (await db.mentorThread.findUniqueOrThrow({ where: { id: threadId }, select: { status: true } })).status;

/** A mentorship made as the office's approval and the guardian's yes leave it, with its place claimed. */
async function thread(expertKey: string, pupilKey: string, schoolKey: string, status: string): Promise<string> {
  const row = await db.mentorThread.create({
    data: { schoolId: school[schoolKey]!, expertProfileId: profile[expertKey]!, expertUserId: id[expertKey]!, studentMembershipId: member[pupilKey]!, createdByMembershipId: member[`admin${schoolKey}`] ?? null, purpose: WHY, status, ...(status === "ACTIVE" ? { parentConsentAt: new Date(), parentConsentUserId: id.guardian! } : {}) },
    select: { id: true },
  });
  if (status === "PENDING_CONSENT" || status === "ACTIVE") await db.expertProfile.update({ where: { id: profile[expertKey]! }, data: { activeMentorships: { increment: 1 } } });
  return row.id;
}

beforeAll(async () => {
  for (const k of ["A", "B"]) {
    school[k] = (await db.school.create({ data: { name: `ZZ TA 532 School ${k} ${STAMP}`, slug: `zz-ta532-${k.toLowerCase()}-${STAMP}`, code: `ZZ532${k}${String(STAMP).slice(-5)}`, contactEmail: `zz-ta532-${k.toLowerCase()}-${STAMP}@test.invalid`, isTestFixture: true }, select: { id: true } })).id;
  }
  const person = async (key: string, schoolKey: string | null, role: string | null, flags: Record<string, unknown> = {}) => {
    id[key] = (await db.user.create({ data: { name: `ZZ TA 532 ${key} ${STAMP}`, email: `zz-ta532-${key}-${STAMP}@test.invalid`, isTestFixture: true, ...flags }, select: { id: true } })).id;
    if (role && schoolKey) member[key] = (await db.membership.create({ data: { userId: id[key]!, schoolId: school[schoolKey]!, role, status: "ACTIVE" }, select: { id: true } })).id;
  };
  await person("adminA", "A", "ADMIN");
  await person("adminB", "B", "ADMIN");
  for (const k of ["leaver", "stayer", "later", "racer"]) await person(k, "A", "STUDENT", { isMinor: true });
  for (const k of ["b1", "removed"]) await person(k, "B", "STUDENT", { isMinor: true });
  await person("guardian", null, null);
  for (const k of ["leaver", "stayer", "later", "racer"]) await db.guardianship.create({ data: { parentUserId: id.guardian!, studentMembershipId: member[k]!, studentSchoolId: school.A!, relation: "PARENT", status: "ACTIVE" } });
  for (const k of ["e1", "e2", "e3", "e4"]) {
    await person(k, null, null);
    profile[k] = (await db.expertProfile.create({ data: { userId: id[k]!, headline: `ZZ TA 532 mentor ${k}`, offering: "BOTH", mentorCapacity: 3, activeMentorships: 0, publishedAt: new Date() }, select: { id: true } })).id;
  }
}, 120_000);

afterAll(async () => {
  const users = Object.values(id);
  const schools = Object.values(school);
  await db.auditLog.deleteMany({ where: { OR: [{ actorUserId: { in: users } }, { schoolId: { in: schools } }] } }).catch(() => {});
  await db.notification.deleteMany({ where: { OR: [{ userId: { in: users } }, { schoolId: { in: schools } }] } });
  await db.school.deleteMany({ where: { id: { in: schools } } });
  await db.expertProfile.deleteMany({ where: { userId: { in: users } } });
  await db.user.deleteMany({ where: { id: { in: users } } });
  await db.$disconnect();
}, 120_000);

describe("TA-532: mentee places and leavers' mentorships", () => {
  it("TA-532: the nightly tidy ends a leaver's mentorships, gives their places back and tells the expert and the guardians; a pupil still at school, or leaving later, keeps theirs", async () => {
    const active = await thread("e1", "leaver", "A", "ACTIVE");
    const pending = await thread("e2", "leaver", "A", "PENDING_CONSENT");
    const kept = await thread("e1", "stayer", "A", "ACTIVE");
    const notYet = await thread("e2", "later", "A", "ACTIVE");
    await db.membership.update({ where: { id: member.leaver! }, data: { leftAt: new Date(Date.now() - DAY) } });
    await db.membership.update({ where: { id: member.later! }, data: { leftAt: new Date(Date.now() + 20 * DAY) } });
    expect(await placesOf("e1")).toBe(2);
    expect(await placesOf("e2")).toBe(2);

    const out = await runJob("accounts:tidy", new Date(), { schoolIds: [school.A!] });
    expect(out.status).toBe("done");

    expect(await statusOf(active)).toBe("CLOSED");
    expect(await statusOf(pending)).toBe("CLOSED");
    expect(await statusOf(kept)).toBe("ACTIVE");
    expect(await statusOf(notYet)).toBe("ACTIVE");
    expect(await placesOf("e1")).toBe(1);
    expect(await placesOf("e2")).toBe(1);

    // The expert can no longer write to the child.
    let said = "sent";
    try {
      await mentoring.postMentorMessage(ctx("e1", "EXPERT", null), active, "ZZ are you still there?");
    } catch (error) {
      if (!(error instanceof AccessError)) throw error;
      said = error.key;
    }
    expect(said).toBe("access.thisMentorshipHasEnded");

    // Told: the guardian of each by a notice naming the thread, the expert of each by one pointing at their own list
    // (the closed thread answers an expert 404); nobody about the kept one.
    const told = await db.notification.findMany({ where: { url: { in: [`/mentoring/${active}`, `/mentoring/${pending}`, `/mentoring/${kept}`] } }, select: { userId: true, url: true, title: true, body: true } });
    expect(told.filter((n) => n.url === `/mentoring/${active}`).map((n) => n.userId)).toEqual([id.guardian!]);
    expect(told.filter((n) => n.url === `/mentoring/${pending}`).map((n) => n.userId)).toEqual([id.guardian!]);
    expect(told.filter((n) => n.url === `/mentoring/${kept}`)).toEqual([]);
    expect(told.every((n) => n.title.length > 0 && !n.title.includes("mentoring.") && n.body.includes(`ZZ TA 532 School A ${STAMP}`))).toBe(true);
    const experts = await db.notification.findMany({ where: { userId: { in: [id.e1!, id.e2!] } }, select: { userId: true, url: true } });
    expect(experts.map((n) => n.userId).sort()).toEqual([id.e1!, id.e2!].sort());
    expect(experts.every((n) => n.url === "/mentoring")).toBe(true);

    // On the record, in the school's own history, by nobody.
    const rows = await db.auditLog.findMany({ where: { schoolId: school.A!, action: "mentorship.close", targetId: { in: [active, pending] } }, select: { actorUserId: true, meta: true } });
    expect(rows).toHaveLength(2);
    expect(rows.every((r) => r.actorUserId === null && (JSON.parse(r.meta) as { by?: string }).by === "leaving")).toBe(true);

    // A second night finds nothing more to do.
    await runJob("accounts:tidy", new Date(), { schoolIds: [school.A!] });
    expect(await placesOf("e1")).toBe(1);
    expect(await db.notification.count({ where: { url: `/mentoring/${active}` } })).toBe(1);
    expect(await db.notification.count({ where: { userId: { in: [id.e1!, id.e2!] } } })).toBe(2);
  }, 120_000);

  it("TA-532: the expert of a mentorship still awaiting the guardian's yes is told without the child's name or the school's, which they were never shown", async () => {
    // The tidy of the first case closed e2's PENDING_CONSENT mentorship with the leaver.
    const notices = await db.notification.findMany({ where: { userId: id.e2! }, select: { title: true, body: true, url: true } });
    expect(notices).toHaveLength(1);
    const [notice] = notices;
    expect(notice!.body).not.toContain(`ZZ TA 532 leaver ${STAMP}`);
    expect(notice!.body).not.toContain(`ZZ TA 532 School A ${STAMP}`);
    expect(notice!.body.length).toBeGreaterThan(0);
    expect(notice!.body).not.toContain("mentoring.");
    expect(notice!.body).not.toMatch(/\{child\}|\{school\}/);
    expect(notice!.url).toBe("/mentoring");
  });

  it("TA-532: the expert of a consented mentorship is told the child's name and the school's, as their thread showed them", async () => {
    const notices = await db.notification.findMany({ where: { userId: id.e1! }, select: { body: true, url: true } });
    expect(notices).toHaveLength(1);
    expect(notices[0]!.url).toBe("/mentoring");
    expect(notices[0]!.body).toContain(`ZZ TA 532 leaver ${STAMP}`);
    expect(notices[0]!.body).toContain(`ZZ TA 532 School A ${STAMP}`);
  });

  it("TA-532: the recount sets an expert's count from the mentorships holding a place across every school, so a removed pupil's place comes back", async () => {
    await thread("e3", "racer", "A", "ACTIVE");
    await thread("e3", "b1", "B", "PENDING_CONSENT");
    await thread("e3", "removed", "B", "ACTIVE");
    await db.mentorThread.create({ data: { schoolId: school.B!, expertProfileId: profile.e3!, expertUserId: id.e3!, studentMembershipId: member.adminB!, purpose: WHY, status: "CLOSED" } });
    expect(await placesOf("e3")).toBe(3);
    // The pupil removed outright: the thread goes by cascade and nothing gave the place back.
    await db.membership.delete({ where: { id: member.removed! } });
    expect(await placesOf("e3")).toBe(3);
    expect(await holding("e3")).toBe(2);

    const done = await mentoring.recountMentorPlaces({ expertProfileIds: [profile.e3!] });
    expect(done).toEqual({ experts: 1, corrected: 1 });
    expect(await placesOf("e3")).toBe(2);
    // Again: nothing to correct.
    expect(await mentoring.recountMentorPlaces({ expertProfileIds: [profile.e3!] })).toEqual({ experts: 1, corrected: 0 });
  }, 120_000);

  it("TA-532: a run narrowed to chosen schools does not recount, and the full nightly run does", async () => {
    await db.expertProfile.update({ where: { id: profile.e4! }, data: { activeMentorships: 3 } });
    const out = await runJob("accounts:tidy", new Date(), { schoolIds: [school.B!] });
    expect(out.status).toBe("done");
    expect(await placesOf("e4")).toBe(3);
    if (out.status === "done") expect(out.summary).toMatchObject({ mentorPlacesRecounted: false });
    await db.expertProfile.update({ where: { id: profile.e4! }, data: { activeMentorships: 0 } });
    // The unscoped run reaches every tenant and is not run here; its body calls the recount after the leavers.
    const jobs = readFileSync(join(process.cwd(), "src/lib/jobs.ts"), "utf8");
    const tidy = jobs.slice(jobs.indexOf('"accounts:tidy": {'), jobs.indexOf('"digest:weekly": {'));
    expect(tidy).toMatch(/endLeaversMentorships\(/);
    expect(tidy).toMatch(/recountMentorPlaces\(\)/);
    expect(tidy.indexOf("endLeaversMentorships(")).toBeLessThan(tidy.indexOf("recountMentorPlaces()"));
  }, 120_000);

  it("TA-532: closing gives the place back in the same step as the status change, so a recount landing between them leaves the count true", async () => {
    await db.expertProfile.update({ where: { id: profile.e4! }, data: { activeMentorships: 0 } });
    const threadId = await thread("e4", "stayer", "A", "ACTIVE");
    await thread("e4", "racer", "A", "ACTIVE");
    expect(await placesOf("e4")).toBe(2);
    // A recount holds the expert's row (as recountMentorPlaces does) while the office closes the mentorship.
    let release: () => void = () => {};
    const released = new Promise<void>((resolve) => {
      release = () => resolve();
    });
    let locked: () => void = () => {};
    const isLocked = new Promise<void>((resolve) => {
      locked = () => resolve();
    });
    const recounting = db.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "ExpertProfile" WHERE id = ${profile.e4!} FOR UPDATE`;
      locked();
      await released;
      const count = await tx.mentorThread.count({ where: { expertProfileId: profile.e4!, status: { in: ["PENDING_CONSENT", "ACTIVE"] } } });
      await tx.expertProfile.update({ where: { id: profile.e4! }, data: { activeMentorships: count } });
    }, { timeout: 30_000, maxWait: 10_000 });
    await isLocked;
    const closing = mentoring.closeMentorship(ctx("adminA", "ADMIN", school.A!), threadId);
    await new Promise((resolve) => setTimeout(resolve, 2_000));
    release();
    await recounting;
    await closing;
    expect(await statusOf(threadId)).toBe("CLOSED");
    expect(await placesOf("e4")).toBe(await holding("e4"));
    expect(await placesOf("e4")).toBe(1);
  }, 120_000);

  it("TA-532: the demo and sweep scripts set the count through the recount, not by a hand-made increment", () => {
    for (const file of ["scripts/demo-schools.ts", "scripts/sweep-doors.ts"]) {
      const text = readFileSync(join(process.cwd(), file), "utf8");
      expect(text, file).not.toMatch(/activeMentorships:\s*\{\s*increment/);
      expect(text, file).toMatch(/recountMentorPlaces\(\{ expertProfileIds: \[/);
    }
  });
});
