/**
 * A report card is signed a class at a time. Proved here: the rules say who
 * signs each line; the teacher who publishes a set has their own line signed
 * at once on every card of it and the head's waits; ONE approval by the head
 * signs every card; a teacher of another class, an admin and another school
 * sign nothing of it; a set taken back loses its signatures and asks again
 * when it is published again; a card keeps the picture it was signed with;
 * a family reads the signatures and is offered no decision; a teacher keeps
 * a signature and no seal, and signs no certificate.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { createSession, getSession } from "@/lib/session";
import { __resetCookies } from "../tests/stubs/next-headers";
import { fixturePng } from "../scripts/png";
import { getCard, publishCards, withdrawCards } from "@/lib/report-cards";
import { DEFAULT_REPORT_CARD_CONFIG } from "@/lib/report-card-rules";
import { GET as signaturesGet } from "@/app/api/v1/office/signatures/route";
import { POST as minePost } from "@/app/api/v1/office/signatures/mine/route";
import { POST as sealPost } from "@/app/api/v1/office/signatures/seal/route";
import { POST as decidePost } from "@/app/api/v1/office/signatures/[signatureId]/decide/route";
import { POST as configPost } from "@/app/api/v1/office/report-card-config/route";
import { GET as cardPdfGet } from "@/app/api/v1/shared/report-cards/[cardId]/pdf/route";

const db = new PrismaClient();
const STAMP = Date.now();
const TITLE = "ZZ Term 1";
let schoolId = "";
let otherSchoolId = "";
let classId = "";
const users: Record<string, string> = {};
const cards: string[] = [];

const url = (bytes: Buffer) => `data:image/png;base64,${bytes.toString("base64")}`;
const TEACHER_INK = url(fixturePng(300, 100));
const HEAD_INK = url(fixturePng(320, 110));
const SEAL = url(fixturePng(200, 200));

const get = (path: string) => new Request(`http://localhost${path}`);
const json = (path: string, body: unknown) => new Request(`http://localhost${path}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
const params = <T extends object>(p: T) => ({ params: Promise.resolve(p) });
type Who = "ADMIN" | "PRINCIPAL" | "TEACHER" | "OTHER_TEACHER" | "PARENT" | "OTHER_ADMIN";
async function as(who: Who) {
  __resetCookies();
  if (who === "ADMIN" || who === "PRINCIPAL") await createSession(users[who]!, { schoolId, role: who });
  if (who === "TEACHER" || who === "OTHER_TEACHER") await createSession(users[who]!, { schoolId, role: "TEACHER" });
  if (who === "PARENT") await createSession(users.PARENT!, { schoolId: null, role: "PARENT" });
  if (who === "OTHER_ADMIN") await createSession(users.OTHER_ADMIN!, { schoolId: otherSchoolId, role: "ADMIN" });
  return (await getSession())!;
}
const decide = (id: string, approve: boolean) => decidePost(json(`/api/v1/office/signatures/${id}/decide`, { approve }), params({ signatureId: id }));
const lines = (card: { signatures: { slot: string; status: string; image: string | null }[] }) => card.signatures.map((s) => [s.slot, s.status, s.image]);
const drafts = () => db.reportCard.updateMany({ where: { id: { in: cards } }, data: { status: "DRAFT", publishedAt: null } });

beforeAll(async () => {
  const suffix = String(STAMP).slice(-6);
  const school = (tag: string, code: string) => db.school.create({ data: { name: `ZZ SetSign ${tag} ${STAMP}`, slug: `zz-setsign-${tag}-${STAMP}`, code: `${code}${suffix}`, contactEmail: `zz-setsign-${tag}-${STAMP}@test.invalid`, timezone: "Asia/Kolkata" }, select: { id: true } });
  schoolId = (await school("a", "ZJ")).id;
  otherSchoolId = (await school("b", "ZK")).id;
  for (const who of ["ADMIN", "PRINCIPAL", "TEACHER", "OTHER_TEACHER", "PARENT", "OTHER_ADMIN", "PUPIL_A", "PUPIL_B", "PUPIL_C"]) {
    users[who] = (await db.user.create({ data: { name: `ZZ SetSign ${who}`, email: `zz-setsign-${who.toLowerCase()}-${STAMP}@test.invalid` }, select: { id: true } })).id;
  }
  await db.membership.create({ data: { userId: users.ADMIN!, schoolId, role: "ADMIN", status: "ACTIVE" } });
  await db.membership.create({ data: { userId: users.PRINCIPAL!, schoolId, role: "PRINCIPAL", status: "ACTIVE" } });
  await db.membership.create({ data: { userId: users.OTHER_ADMIN!, schoolId: otherSchoolId, role: "ADMIN", status: "ACTIVE" } });
  const teacher = await db.membership.create({ data: { userId: users.TEACHER!, schoolId, role: "TEACHER", status: "ACTIVE" }, select: { id: true } });
  const other = await db.membership.create({ data: { userId: users.OTHER_TEACHER!, schoolId, role: "TEACHER", status: "ACTIVE" }, select: { id: true } });
  classId = (await db.class.create({ data: { schoolId, name: "ZZ 5A", gradeLevel: "5", joinCode: `ZJ1${suffix}` }, select: { id: true } })).id;
  const otherClass = await db.class.create({ data: { schoolId, name: "ZZ 6B", gradeLevel: "6", joinCode: `ZJ2${suffix}` }, select: { id: true } });
  await db.classTeacher.create({ data: { schoolId, classId, teacherMembershipId: teacher.id, role: "LEAD" } });
  await db.classTeacher.create({ data: { schoolId, classId: otherClass.id, teacherMembershipId: other.id, role: "LEAD" } });
  for (const who of ["PUPIL_A", "PUPIL_B", "PUPIL_C"]) {
    const pupil = await db.membership.create({ data: { userId: users[who]!, schoolId, role: "STUDENT", status: "ACTIVE", studentCode: `ZJ${who.slice(-1)}${STAMP}` }, select: { id: true } });
    await db.enrollment.create({ data: { schoolId, classId, studentMembershipId: pupil.id, status: "ACTIVE" } });
    if (who === "PUPIL_A") await db.guardianship.create({ data: { parentUserId: users.PARENT!, studentMembershipId: pupil.id, studentSchoolId: schoolId, status: "ACTIVE" } });
    cards.push((await db.reportCard.create({ data: { schoolId, classId, studentMembershipId: pupil.id, title: TITLE, fromDateKey: "2026-06-01", toDateKey: "2026-10-31", createdByMembershipId: teacher.id }, select: { id: true } })).id);
  }
});

afterAll(async () => {
  __resetCookies();
  await db.session.deleteMany({ where: { userId: { in: Object.values(users) } } });
  await db.school.deleteMany({ where: { id: { in: [schoolId, otherSchoolId] } } });
  await db.user.deleteMany({ where: { email: { contains: `-${STAMP}@test.invalid` } } });
  await db.$disconnect();
});

describe("a set of report cards is signed as one", () => {
  it("a teacher keeps a signature and no seal; the rules say who signs each line", async () => {
    await as("TEACHER");
    expect((await minePost(json("/api/v1/office/signatures/mine", { image: TEACHER_INK }))).status).toBe(200);
    expect((await sealPost(json("/api/v1/office/signatures/seal", { image: SEAL }))).status).toBe(403);
    expect(await (await signaturesGet()).json()).toMatchObject({ mine: { image: TEACHER_INK }, canSetSeal: false, waiting: [] });
    await as("PRINCIPAL");
    expect((await minePost(json("/api/v1/office/signatures/mine", { image: HEAD_INK }))).status).toBe(200);
    await as("ADMIN");
    expect((await sealPost(json("/api/v1/office/signatures/seal", { image: SEAL }))).status).toBe(200);
    const res = await configPost(json("/api/v1/office/report-card-config", { ...DEFAULT_REPORT_CARD_CONFIG, layout: { ...DEFAULT_REPORT_CARD_CONFIG.layout, signerLeft: "TEACHER", signerRight: "PRINCIPAL", showSeal: true } }));
    expect(res.status).toBe(200);
    expect((await res.json()).layout).toMatchObject({ signerLeft: "TEACHER", signerRight: "PRINCIPAL", showSeal: true });
  });

  it("a draft has no signatures; published by its teacher, every card has the teacher's and waits for the head's, and the head is told once", async () => {
    let ctx = await as("TEACHER");
    expect((await getCard(ctx, cards[0]!))?.signatures).toEqual([]);
    expect(await publishCards(ctx, classId, TITLE)).toMatchObject({ ok: true, published: 3 });
    for (const id of cards) {
      const card = (await getCard(ctx, id))!;
      expect(lines(card)).toEqual([["LEFT", "SIGNED", TEACHER_INK], ["RIGHT", "PENDING", null]]);
      expect(card.seal).toBe(SEAL);
      expect(card.setCount).toBe(3);
    }
    // One row for the head's line, however many the cards.
    expect(await db.paperSignature.count({ where: { schoolId, paperKind: "REPORT_CARD_SET", slot: "RIGHT" } })).toBe(1);
    const told = await db.notification.findMany({ where: { schoolId, titleKey: "signatures.notifSetWaiting" }, select: { userId: true, url: true, titleVars: true } });
    expect(told.map((n) => [n.userId, n.url])).toEqual([[users.PRINCIPAL, "/admin/signatures"]]);
    expect(JSON.parse(told[0]!.titleVars)).toMatchObject({ className: "ZZ 5A", title: TITLE, count: 3 });
    ctx = await as("PARENT");
    const family = (await getCard(ctx, cards[0]!))!;
    expect(family.signatures.map((s) => [s.status, s.can.decide])).toEqual([["SIGNED", false], ["PENDING", false]]);
  });

  it("⚠ the head's line is the head's: the teacher who published, a teacher of another class, an admin and another school sign nothing", async () => {
    const waiting = (await db.paperSignature.findFirstOrThrow({ where: { schoolId, slot: "RIGHT" } })).id;
    for (const who of ["TEACHER", "OTHER_TEACHER", "ADMIN", "PARENT"] as const) {
      await as(who);
      expect((await decide(waiting, true)).status).toBe(403);
    }
    await as("OTHER_ADMIN");
    expect((await decide(waiting, true)).status).toBe(404);
    expect((await db.paperSignature.findUniqueOrThrow({ where: { id: waiting } })).status).toBe("PENDING");
  });

  it("the head finds the set waiting as one entry of three cards, signs once, and all three cards carry it; the PDF is made with them", async () => {
    const ctx = await as("PRINCIPAL");
    const view = await (await signaturesGet()).json();
    expect(view.waiting).toEqual([expect.objectContaining({ paperKind: "REPORT_CARD_SET", title: TITLE, studentName: "ZZ 5A", count: 3, requestedByName: "ZZ SetSign TEACHER" })]);
    // What it opens is a card of the set, to read before signing.
    expect(cards).toContain(view.waiting[0].paperId);
    expect((await getCard(ctx, cards[1]!))!.signatures[1]!.can).toEqual({ decide: true });
    const decided = await (await decide(view.waiting[0].id, true)).json();
    expect(decided).toMatchObject({ paperKind: "REPORT_CARD_SET", status: "SIGNED" });
    for (const id of cards) expect(lines((await getCard(ctx, id))!)).toEqual([["LEFT", "SIGNED", TEACHER_INK], ["RIGHT", "SIGNED", HEAD_INK]]);
    expect((await (await signaturesGet()).json()).waiting).toEqual([]);
    const pdf = await cardPdfGet(get(`/api/v1/shared/report-cards/${cards[0]}/pdf`), params({ cardId: cards[0]! }));
    expect(pdf.status).toBe(200);
    expect(Buffer.from(await pdf.arrayBuffer()).subarray(0, 5).toString("latin1")).toBe("%PDF-");
  });

  it("a set taken back loses its signatures and asks again when published again; published by an admin, the teacher's line waits for the class's teacher and no other", async () => {
    let ctx = await as("TEACHER");
    expect(await withdrawCards(ctx, classId, TITLE)).toMatchObject({ ok: true, withdrawn: 3 });
    expect(await db.paperSignature.count({ where: { schoolId, paperKind: "REPORT_CARD_SET" } })).toBe(0);
    expect((await getCard(ctx, cards[0]!))?.signatures).toEqual([]);
    ctx = await as("ADMIN");
    expect(await publishCards(ctx, classId, TITLE)).toMatchObject({ ok: true, published: 3 });
    expect(lines((await getCard(ctx, cards[0]!))!)).toEqual([["LEFT", "PENDING", null], ["RIGHT", "PENDING", null]]);
    const left = (await db.paperSignature.findFirstOrThrow({ where: { schoolId, slot: "LEFT" } })).id;
    await as("OTHER_TEACHER");
    expect((await (await signaturesGet()).json()).waiting).toEqual([]);
    expect((await decide(left, true)).status).toBe(403);
    await as("TEACHER");
    expect((await (await signaturesGet()).json()).waiting).toHaveLength(1);
    expect(await (await decide(left, true)).json()).toMatchObject({ status: "SIGNED" });
    expect(lines((await getCard(await as("PRINCIPAL"), cards[2]!))!)).toEqual([["LEFT", "SIGNED", TEACHER_INK], ["RIGHT", "PENDING", null]]);
    await drafts();
  });

  it("rules that ask for nobody print the lines bare, as cards always did", async () => {
    await as("ADMIN");
    expect((await configPost(json("/api/v1/office/report-card-config", DEFAULT_REPORT_CARD_CONFIG))).status).toBe(200);
    await db.paperSignature.deleteMany({ where: { schoolId } });
    const ctx = await as("TEACHER");
    expect(await publishCards(ctx, classId, TITLE)).toMatchObject({ ok: true, published: 3 });
    expect(await getCard(ctx, cards[0]!)).toMatchObject({ signatures: [], seal: null, setCount: 1 });
    expect(await db.paperSignature.count({ where: { schoolId } })).toBe(0);
  });
});
