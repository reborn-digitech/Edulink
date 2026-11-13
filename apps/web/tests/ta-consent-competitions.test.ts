/**
 * Competitions and an adult college student (testing analysis of 13 November 2026, the 'consent' batch).
 *
 *   TA-101  At a college the default consent rule could never be met for an adult: the entry waited on a
 *           guardian whose Allow (giveConsent, assertGuardianAccess with no grant) is refused for an adult,
 *           so the entry waited for ever and submitEntry refused the student's work.
 *   TA-099  A guardian was told and shown an adult's entry and result without the RESULTS grant: the result
 *           notice named no grant, and the guardian's own entries (getCompetition, pendingConsents, the
 *           internal board's `mine`) came straight from the guardianship.
 *
 * A scratch ZZ college of this suite's own (tests/ta-consent-fixture.ts) organises one competition on its
 * calendar the way the office leaves it (consent on, board SCHOOL); the adult and the minor enter.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { makeCollege, type College } from "./ta-consent-fixture";
import { enterCompetition, getCompetition, giveConsent, internalBoard, pendingConsents, recordResult, submitEntry } from "@/lib/competitions";

let c: College;
let competitionId = "";
const entry = { adult: "", minor: "" };

beforeAll(async () => {
  c = await makeCollege("compete");
  competitionId = (
    await c.db.competition.create({
      data: { organizerSchoolId: c.schoolId, organizerName: "ZZ TA Consent college", title: `ZZ TA-099 Quiz ${c.stamp}`, summary: "ZZ a quiz", status: "PUBLISHED", requiresParentConsent: true, internalBoard: "SCHOOL", enrolmentOpen: true },
      select: { id: true },
    })
  ).id;
}, 60_000);

afterAll(async () => {
  await c.cleanup();
});

describe("TA-101: an adult college student's entry", () => {
  it("TA-101: an adult's own entry needs no guardian's yes and takes their work; a minor's still waits for the guardian", async () => {
    const adult = await enterCompetition(c.ctx(c.adult, "STUDENT"), competitionId);
    entry.adult = adult.entryId;
    expect(adult.awaitingConsent).toBe(false);
    await expect(submitEntry(c.ctx(c.adult, "STUDENT"), competitionId, "https://example.invalid/zz-ta101")).resolves.toBeUndefined();
    const minor = await enterCompetition(c.ctx(c.minor, "STUDENT"), competitionId);
    entry.minor = minor.entryId;
    expect(minor.awaitingConsent).toBe(true);
    await giveConsent(c.ctx(c.guardian, "PARENT"), minor.entryId);
    expect((await c.db.competitionEntry.findUniqueOrThrow({ where: { id: minor.entryId }, select: { parentConsentAt: true } })).parentConsentAt).not.toBeNull();
    // Nobody was asked about the adult.
    expect(await c.db.notification.count({ where: { userId: c.guardianOfAdult.userId, titleKey: "notifTitle.childWantsToEnter" } })).toBe(0);
  });

  it("TA-101: an adult's entry left waiting from before is consented on their own word when they enter again, with its audit row", async () => {
    const adult2 = await c.addStudent("adultagain", true);
    const waiting = await c.db.competitionEntry.create({ data: { competitionId, studentMembershipId: adult2.membershipId, schoolId: c.schoolId, status: "REGISTERED" }, select: { id: true } });
    const again = await enterCompetition(c.ctx(adult2, "STUDENT"), competitionId);
    expect(again).toEqual({ entryId: waiting.id, awaitingConsent: false });
    expect((await c.db.competitionEntry.findUniqueOrThrow({ where: { id: waiting.id }, select: { parentConsentBy: true } })).parentConsentBy).toBe(adult2.userId);
    const rows = await c.db.auditLog.findMany({ where: { schoolId: c.schoolId, actorUserId: adult2.userId, action: "competition.consent" }, select: { meta: true } });
    expect(rows.map((r) => JSON.parse(r.meta) as Record<string, unknown>)).toEqual([{ entryId: waiting.id, competitionId, by: "STUDENT" }]);
  });
});

describe("TA-099: what a guardian is told and shown of an adult's competition", () => {
  it("TA-099: the result is not told, and the entry, the waiting list and the board's own row are not shown, without RESULTS", async () => {
    await recordResult(c.ctx(c.admin, "ADMIN"), entry.adult, { scoreMilli: 9000, rank: 1 });
    expect(await c.db.notification.count({ where: { userId: c.guardianOfAdult.userId, titleKey: "notifTitle.childResult" } })).toBe(0);
    const parent = c.ctx(c.guardianOfAdult, "PARENT");
    expect((await getCompetition(parent, competitionId)).entry).toBeNull();
    expect(await pendingConsents(parent)).toEqual([]);
    expect((await internalBoard(parent, competitionId, { studentMembershipId: c.adult.membershipId })).mine).toBeNull();
  });

  it("TA-099: under the RESULTS grant the guardian sees the adult's entry and place", async () => {
    await c.grant(c.adult.membershipId, "RESULTS");
    const parent = c.ctx(c.guardianOfAdult, "PARENT");
    const seen = (await getCompetition(parent, competitionId)).entry;
    expect(seen?.studentMembershipId).toBe(c.adult.membershipId);
    expect(seen?.rank).toBe(1);
    await recordResult(c.ctx(c.admin, "ADMIN"), entry.adult, { scoreMilli: 9500, rank: 1 });
    expect(await c.db.notification.count({ where: { userId: c.guardianOfAdult.userId, titleKey: "notifTitle.childResult" } })).toBe(1);
  });
});
