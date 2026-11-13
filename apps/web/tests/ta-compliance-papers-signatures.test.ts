/**
 * Paper signatures of the compliance-papers batch (testing analysis of 13 November 2026), each case failing while
 * its finding stands:
 *
 *   TA-344  signOnIssue upserted each line with `update: {}`, so a card published later into a set the head had
 *           already signed carried that signature (and the count under it grew) with no new request, while the head was
 *           told that a set waited with nothing waiting.
 *   TA-325  The menu's count of papers to sign counted every PENDING line of the reader's role, while the list shows one
 *           row per live paper: a revoked certificate's waiting line was counted for ever, and a paper with both lines
 *           waiting for one role counted two.
 *
 * At a ZZ school of this suite's own, removed afterwards.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import type { ActiveContext } from "@/lib/session";
import { cardSetId, signOnIssue, signaturesView, waitingSignatureCount } from "@/lib/signatures";

const db = new PrismaClient();
const STAMP = Date.now();
const SUFFIX = String(STAMP).slice(-6);
const mail = (who: string) => `zz-tacp-sign-${who}-${STAMP}@test.invalid`;
const ids: Record<string, string> = {};
const INK = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 1]);

function ctx(userId: string, role: ActiveContext["role"], membershipId: string): ActiveContext {
  return { sessionId: "t", membershipId, schoolId: ids.school!, role, user: { id: userId, name: "ZZ TACP", preferredName: null, email: null, avatarKey: null, isMinor: false, isSuperuser: false, isAppAdmin: false, prefs: {} as never } } as ActiveContext;
}
const admin = () => ctx(ids.admin!, "ADMIN", ids.adminM!);
const head = () => ctx(ids.head!, "PRINCIPAL", ids.headM!);

beforeAll(async () => {
  ids.school = (await db.school.create({ data: { name: `ZZ TA Signatures ${STAMP}`, slug: `zz-tacp-sign-${STAMP}`, code: `ZCS${SUFFIX}`, contactEmail: mail("school"), timezone: "Asia/Kolkata", locale: "en", isTestFixture: true }, select: { id: true } })).id;
  for (const who of ["admin", "head", "pupilA", "pupilB", "pupilC"]) ids[who] = (await db.user.create({ data: { name: `ZZ TACP Sign ${who}`, email: mail(who.toLowerCase()), isTestFixture: true }, select: { id: true } })).id;
  ids.adminM = (await db.membership.create({ data: { userId: ids.admin!, schoolId: ids.school, role: "ADMIN", status: "ACTIVE" }, select: { id: true } })).id;
  ids.headM = (await db.membership.create({ data: { userId: ids.head!, schoolId: ids.school, role: "PRINCIPAL", status: "ACTIVE" }, select: { id: true } })).id;
  await db.signatureImage.create({ data: { schoolId: ids.school, kind: "PERSON", membershipId: ids.adminM, png: INK } });
  ids.class = (await db.class.create({ data: { schoolId: ids.school, name: "ZZ 5A", gradeLevel: "5", joinCode: `ZCS${SUFFIX}` }, select: { id: true } })).id;
  for (const who of ["pupilA", "pupilB", "pupilC"]) {
    ids[`${who}M`] = (await db.membership.create({ data: { userId: ids[who]!, schoolId: ids.school, role: "STUDENT", status: "ACTIVE" }, select: { id: true } })).id;
    await db.enrollment.create({ data: { schoolId: ids.school, classId: ids.class, studentMembershipId: ids[`${who}M`]!, status: "ACTIVE" } });
  }
});

afterAll(async () => {
  const people = await db.user.findMany({ where: { email: { contains: `-${STAMP}@test.invalid` } }, select: { id: true } });
  await db.notification.deleteMany({ where: { userId: { in: people.map((p) => p.id) } } });
  await db.paperSignature.deleteMany({ where: { schoolId: ids.school } });
  await db.auditLog.deleteMany({ where: { schoolId: ids.school } });
  await db.school.deleteMany({ where: { id: ids.school } });
  await db.user.deleteMany({ where: { id: { in: people.map((p) => p.id) } } });
  await db.$disconnect();
});

describe("a card published into a set already signed", () => {
  it("TA-344: the head's signed line waits again for the head, unsigned, and the head is told", async () => {
    const title = `ZZ Term ${STAMP}`;
    const setId = cardSetId(ids.class!, title);
    const layout = { signerLeft: "ADMIN" as const, signerRight: "PRINCIPAL" as const, showSeal: false };
    const paper = { kind: "REPORT_CARD_SET" as const, id: setId, schoolId: ids.school!, title, studentName: "ZZ 5A" };
    // Two cards published; the admin's own line signed at once, the head's waits, and the head signs it.
    await signOnIssue(admin(), { ...paper, count: 2 }, layout);
    const headLine = await db.paperSignature.findUniqueOrThrow({ where: { paperKind_paperId_slot: { paperKind: "REPORT_CARD_SET", paperId: setId, slot: "RIGHT" } } });
    expect(headLine.status).toBe("PENDING");
    await db.paperSignature.update({ where: { id: headLine.id }, data: { status: "SIGNED", signerUserId: ids.head!, signerName: "ZZ Head", png: INK, decidedAt: new Date() } });
    const toldBefore = await db.notification.count({ where: { userId: ids.head! } });
    // A pupil joins; one more card is published under the set.
    await signOnIssue(admin(), { ...paper, count: 1 }, layout);
    const after = await db.paperSignature.findUniqueOrThrow({ where: { id: headLine.id }, select: { status: true, png: true, signerUserId: true } });
    expect(after).toEqual({ status: "PENDING", png: null, signerUserId: null });
    expect(await db.notification.count({ where: { userId: ids.head! } })).toBe(toldBefore + 1);
    // The publisher's own line stays signed by the publisher.
    expect((await db.paperSignature.findUniqueOrThrow({ where: { paperKind_paperId_slot: { paperKind: "REPORT_CARD_SET", paperId: setId, slot: "LEFT" } }, select: { status: true } })).status).toBe("SIGNED");
  });
});

describe("the count of papers to sign", () => {
  it("TA-325: counts what the list shows: a revoked certificate's waiting line is not counted, a paper with two waiting lines counts once", async () => {
    const cert = (n: number, revoked: boolean) => db.issuedCertificate.create({ data: { schoolId: ids.school!, studentMembershipId: ids.pupilAM!, kind: "BONAFIDE", locale: "en", serial: `ZZ-TA325-${SUFFIX}-${n}`, number: n, title: "ZZ Bonafide", code: `ZZ325${n}${STAMP}`, revokedAt: revoked ? new Date() : null }, select: { id: true } });
    const live = await cert(1, false);
    const revoked = await cert(2, true);
    const pending = (paperId: string, slot: "LEFT" | "RIGHT") => db.paperSignature.create({ data: { schoolId: ids.school!, paperKind: "CERTIFICATE", paperId, slot, role: "PRINCIPAL", status: "PENDING", requestedByUserId: ids.admin! } });
    await pending(live.id, "LEFT");
    await pending(live.id, "RIGHT");
    await pending(revoked.id, "RIGHT");
    const view = await signaturesView(head());
    const certificates = view.waiting.filter((w) => w.paperKind === "CERTIFICATE");
    expect(certificates.map((w) => w.paperId)).toEqual([live.id]);
    // The set of TA-344 has no published card here, so the list leaves it out, and so does the count.
    expect(view.waiting).toHaveLength(1);
    expect(await waitingSignatureCount(head())).toBe(1);
  });
});
