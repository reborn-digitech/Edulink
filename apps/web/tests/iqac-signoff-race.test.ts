/**
 * QA-34 (QA campaign of 24 October 2026, E2E-B13).
 *
 * At sac the principal sent SIGN (web) and RETURN with a note (phone) for the
 * AQAR at the same moment: both answered 200, the row read RETURNED with
 * signedOffAt set, the decision log held both decisions 2 ms apart and the
 * IQAC was told both, because the status was read before an unconditional
 * update. Now the decision is a conditional update that matches only while
 * the filing waits: one decision stands, the other is refused
 * iqac.refuseNotAwaiting (409), one audit row, one notice, and a return
 * carries no sign-off.
 *
 * At a ZZ college of this suite's own, removed afterwards.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import type { ActiveContext } from "@/lib/session";
import { signOffFiling } from "@/lib/iqac-filings";
import { RuleRefusal } from "@/lib/rule-refusal";

const db = new PrismaClient();
const STAMP = Date.now();
const SUFFIX = String(STAMP).slice(-6);
const MAIL = (who: string) => `zz-iqac-race-${who.toLowerCase()}-${STAMP}@test.invalid`;
const id: Record<string, string> = {};

const principal = (): ActiveContext => ({
  sessionId: "test-session",
  membershipId: id.headM!,
  schoolId: id.college!,
  role: "PRINCIPAL",
  user: { id: id.head!, name: "ZZ IQAC Race Principal", preferredName: null, email: null, avatarKey: null, isMinor: false, isSuperuser: false, isAppAdmin: false, prefs: { theme: "system", contrast: "normal", locale: "en", channels: { push: true, email: true }, quietHours: null } as never },
});

async function awaiting(year: number) {
  return (await db.collegeFiling.create({ data: { schoolId: id.college!, kind: "AQAR", year, format: "PDF", body: "{}", hash: `zz-${STAMP}-${year}`, status: "AWAITING_SIGNOFF", submittedAt: new Date(), generatedByUserId: id.iqac! }, select: { id: true } })).id;
}

beforeAll(async () => {
  const c = (id.college = (await db.school.create({ data: { name: `ZZ IQAC Race ${STAMP}`, slug: `zz-iqac-race-${STAMP}`, code: `ZIR${SUFFIX}`, contactEmail: MAIL("school"), timezone: "Asia/Kolkata", kind: "COLLEGE", affiliatingUniversity: "ZZ University" }, select: { id: true } })).id);
  await db.schoolModule.createMany({ data: [{ schoolId: c, module: "IQAC" }, { schoolId: c, module: "ACADEMICS" }] });
  id.head = (await db.user.create({ data: { name: "ZZ IQAC Race Principal", email: MAIL("head") }, select: { id: true } })).id;
  id.headM = (await db.membership.create({ data: { userId: id.head, schoolId: c, role: "PRINCIPAL", status: "ACTIVE" }, select: { id: true } })).id;
  id.iqac = (await db.user.create({ data: { name: "ZZ IQAC Race Coordinator", email: MAIL("iqac") }, select: { id: true } })).id;
  await db.membership.create({ data: { userId: id.iqac, schoolId: c, role: "IQAC", status: "ACTIVE" } });
  id.f1 = await awaiting(2026);
  id.f2 = await awaiting(2025);
});

afterAll(async () => {
  await db.notification.deleteMany({ where: { user: { email: { contains: `-${STAMP}@test.invalid` } } } });
  await db.auditLog.deleteMany({ where: { schoolId: id.college } });
  await db.school.deleteMany({ where: { id: id.college } });
  await db.user.deleteMany({ where: { email: { contains: `-${STAMP}@test.invalid` } } });
  await db.$disconnect();
});

const refusalKey = (r: PromiseSettledResult<unknown>) => (r.status === "rejected" ? (r.reason instanceof RuleRefusal ? `${r.reason.key} ${r.reason.status}` : String(r.reason)) : null);

describe("QA-34: a sign-off and a return at the same moment", () => {
  it.each([
    ["f1", "SIGN first in the call order"],
    ["f2", "RETURN first in the call order"],
  ] as const)("%s (%s): one decision stands, the other is refused as not waiting", async (key, order) => {
    const sign = () => signOffFiling(principal(), id[key]!, { decision: "SIGN", note: "" });
    const ret = () => signOffFiling(principal(), id[key]!, { decision: "RETURN", note: "ZZ Criterion 3 figures are last year's." });
    const results = await Promise.allSettled(order.startsWith("SIGN") ? [sign(), ret()] : [ret(), sign()]);
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    expect(results.map(refusalKey).filter(Boolean)).toEqual(["iqac.refuseNotAwaiting 409"]);
    const row = await db.collegeFiling.findUniqueOrThrow({ where: { id: id[key] }, select: { status: true, signedOffAt: true, signedOffByUserId: true } });
    if (row.status === "SIGNED_OFF") expect(row.signedOffAt).not.toBeNull();
    else {
      expect(row.status).toBe("RETURNED");
      expect(row.signedOffAt).toBeNull();
      expect(row.signedOffByUserId).toBeNull();
    }
    expect(await db.auditLog.count({ where: { schoolId: id.college, targetId: id[key], action: { in: ["iqac.filing.signoff", "iqac.filing.return"] } } })).toBe(1);
  });

  it("the IQAC is told one decision per filing", async () => {
    expect(await db.notification.count({ where: { userId: id.iqac, titleKey: { in: ["iqac.notifySignedTitle", "iqac.notifyReturnedTitle"] } } })).toBe(2);
  });
});
