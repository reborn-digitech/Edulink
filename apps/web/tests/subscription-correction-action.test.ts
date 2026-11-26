/**
 * The school page's corrections action (setSubscriptionAction, src/app/root/actions.ts). A server action is a public POST,
 * so it parses its input with the corrections door's contract before the library is called, and a body the contract
 * refuses is answered with a sentence, never an issue list: a missing reason, a status not on the list (what the card's
 * "Not recorded" option sends), anything else, among it a body with no standing. A correction refused because the record
 * changed since its form was drawn is marked `stale`, so the page draws itself again.
 *
 * On one ZZ school made here, with an operator of its own; each is removed afterwards, scoped to them.
 */
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { PrismaClient } from "@prisma/client";
import { createSession } from "@/lib/session";
import { __resetCookies, __setHeaders } from "../tests/stubs/next-headers";
import { translator } from "@/lib/i18n/dictionary";
import { setSubscriptionAction } from "@/app/root/actions";

// A suite has no request for Next to revalidate in; the house stub (as tests/subscription-actions.test.ts).
vi.mock("next/cache", () => ({ revalidatePath: () => undefined, revalidateTag: () => undefined }));

const db = new PrismaClient();
const STAMP = Date.now();
const t = translator("en");
let operator = "";
let school = "";

beforeAll(async () => {
  operator = (await db.user.create({ data: { name: "ZZ Correction Action Operator", email: `zz-correction-action-${STAMP}@test.invalid`, isSuperuser: true, isTestFixture: true }, select: { id: true } })).id;
  school = (await db.school.create({
    data: { name: `ZZ Correction Action ${STAMP}`, slug: `zz-correction-action-${STAMP}`, code: `ZCA${String(STAMP).slice(-6)}`, contactEmail: `zz-correction-action-school-${STAMP}@test.invalid`, timezone: "Asia/Kolkata", isTestFixture: true, subscriptionStatus: "ACTIVE", subscriptionStartsAt: new Date("2026-06-01T00:00:00.000Z"), subscriptionDueAt: new Date("2027-06-01T00:00:00.000Z"), subscriptionPaidAt: new Date("2026-06-01T00:00:00.000Z") },
    select: { id: true },
  })).id;
  __resetCookies();
  __setHeaders({});
  await createSession(operator, {});
});

afterAll(async () => {
  __resetCookies();
  await db.session.deleteMany({ where: { userId: operator } });
  await db.auditLog.deleteMany({ where: { OR: [{ schoolId: school }, { targetId: school }, { actorUserId: operator }] } });
  await db.school.deleteMany({ where: { id: school } });
  await db.user.deleteMany({ where: { id: operator } });
  await db.$disconnect();
});

const STANDING = { status: "ACTIVE", startsAt: "2026-06-01", dueAt: "2027-06-01", paidAt: "2026-06-01" } as const;
const invoiceRef = async () => (await db.school.findUniqueOrThrow({ where: { id: school }, select: { subscriptionInvoiceRef: true } })).subscriptionInvoiceRef;

describe("the corrections action parses its input with the door's contract", () => {
  it("a body the contract refuses is answered with a sentence: a missing reason, a status not on the list, a body with no standing; nothing is written", async () => {
    expect(await setSubscriptionAction(school, { invoiceRef: "ZZ-1", expect: STANDING })).toEqual({ ok: false, error: t("root.subscriptionReasonRequired") });
    expect(await setSubscriptionAction(school, { status: "", reason: "ZZ not recorded", expect: STANDING })).toEqual({ ok: false, error: t("root.subscriptionMoveRefused") });
    expect(await setSubscriptionAction(school, { invoiceRef: "ZZ-1", reason: "ZZ an older card" })).toEqual({ ok: false, error: t("common.checkTheForm") });
    expect(await invoiceRef()).toBeNull();
  });

  it("a correction drawn before the record changed is refused and marked stale; one against the record as it stands is written", async () => {
    expect(await setSubscriptionAction(school, { invoiceRef: "ZZ-2", reason: "ZZ a card drawn before", expect: { ...STANDING, dueAt: "2026-12-01", paidAt: null } })).toEqual({ ok: false, error: t("root.subscriptionChangedMeanwhile"), stale: true });
    expect(await invoiceRef()).toBeNull();
    expect(await setSubscriptionAction(school, { invoiceRef: "ZZ-3", reason: "ZZ the invoice went out", expect: STANDING })).toEqual({ ok: true });
    expect(await invoiceRef()).toBe("ZZ-3");
  });
});
