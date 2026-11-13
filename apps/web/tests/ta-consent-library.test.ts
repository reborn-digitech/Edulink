/**
 * TA-497 (testing analysis of 13 November 2026, Low): a guardian an adult college student lets see money
 * reads the library page (readerOf asks MONEY since DS-1, 10 October 2026), but the library's ready, due
 * and overdue notices returned early for every adult at a college, so that guardian was never told.
 *
 * A scratch ZZ college of this suite's own (tests/ta-consent-fixture.ts) with LIBRARY on, one title, two
 * copies, and an overdue loan each for the adult and for a second adult who grants MONEY. The office sends
 * the day's overdue notices once.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { makeCollege, type College } from "./ta-consent-fixture";
import { sendOverdueNotices } from "@/lib/library";

let c: College;
let granted: { userId: string; membershipId: string };

beforeAll(async () => {
  c = await makeCollege("library");
  granted = await c.addStudent("adultlib", true);
  await c.grant(granted.membershipId, "MONEY");
  await c.db.schoolModule.create({ data: { schoolId: c.schoolId, module: "LIBRARY" } });
  const title = await c.db.libraryTitle.create({ data: { schoolId: c.schoolId, title: `ZZ TA-497 Physics ${c.stamp}` }, select: { id: true } });
  let n = 0;
  for (const s of [c.adult, granted]) {
    n += 1;
    const copy = await c.db.libraryCopy.create({ data: { schoolId: c.schoolId, titleId: title.id, accession: `ZZ497-${n}-${c.stamp}`, status: "ISSUED" }, select: { id: true } });
    const member = await c.db.libraryMember.create({ data: { schoolId: c.schoolId, membershipId: s.membershipId, kind: "STUDENT_COLLEGE", cardNumber: `ZZ497-${n}-${c.stamp}` }, select: { id: true } });
    await c.db.libraryIssue.create({ data: { schoolId: c.schoolId, copyId: copy.id, memberId: member.id, dueOn: "2026-01-05", issuedByUserId: c.admin.userId } });
  }
}, 60_000);

afterAll(async () => {
  await c.cleanup();
});

describe("TA-497: the library's notices to an adult college student's guardians", () => {
  it("TA-497: the overdue notice reaches the guardian under the MONEY grant, and not the guardian of an adult who granted nothing", async () => {
    await sendOverdueNotices(c.ctx(c.admin, "ADMIN"));
    const told = (userId: string, membershipId: string) => c.db.notification.count({ where: { userId, titleKey: "library.notifOverdueTitle", url: `/parent/library?child=${membershipId}` } });
    expect(await told(c.guardian.userId, granted.membershipId)).toBe(1);
    expect(await told(c.guardian.userId, c.adult.membershipId)).toBe(0);
    expect(await told(c.guardianOfAdult.userId, c.adult.membershipId)).toBe(0);
    // The borrowers themselves are told either way.
    expect(await c.db.notification.count({ where: { userId: { in: [c.adult.userId, granted.userId] }, titleKey: "library.notifOverdueTitle" } })).toBe(2);
  });
});
