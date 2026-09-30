/**
 * Signatures and the seal on the school's papers. Proved here: only a PNG of
 * a sane size is taken; an admin and the head each keep their own and only
 * the admin sets the seal; a signature is drawn at once on a paper its owner
 * issues and WAITS on a paper somebody else issues, until its owner approves
 * that paper; nobody signs a line that is another role's; a decision is
 * made once; the paper keeps the picture it was signed with when the
 * signature is changed or removed; a template that asks for nobody prints
 * as papers always did; another school finds nothing; the audit names the
 * paper and never holds a picture.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { createSession } from "@/lib/session";
import { __resetCookies } from "../tests/stubs/next-headers";
import { fixturePng } from "../scripts/png";
import { GET as signaturesGet } from "@/app/api/v1/office/signatures/route";
import { POST as minePost } from "@/app/api/v1/office/signatures/mine/route";
import { POST as mineRemove } from "@/app/api/v1/office/signatures/mine/remove/route";
import { POST as sealPost } from "@/app/api/v1/office/signatures/seal/route";
import { POST as sealRemove } from "@/app/api/v1/office/signatures/seal/remove/route";
import { POST as decidePost } from "@/app/api/v1/office/signatures/[signatureId]/decide/route";
import { GET as ownImageGet } from "@/app/api/v1/office/signatures/image/route";
import { GET as paperImageGet } from "@/app/api/v1/shared/signatures/[signatureId]/route";
import { POST as templatesPost } from "@/app/api/v1/office/certificate-templates/route";
import { POST as issuePost } from "@/app/api/v1/office/certificates/route";
import { GET as certificateGet } from "@/app/api/v1/shared/certificates/[certificateId]/route";
import { GET as certificatePdf } from "@/app/api/v1/shared/certificates/[certificateId]/pdf/route";

const db = new PrismaClient();
const STAMP = Date.now();
let schoolId = "";
let otherSchoolId = "";
const users: Record<string, string> = {};
let pupil = "";

const url = (bytes: Buffer) => `data:image/png;base64,${bytes.toString("base64")}`;
const ADMIN_INK = url(fixturePng(300, 100));
const HEAD_INK = url(fixturePng(320, 110));
const NEW_INK = url(fixturePng(280, 90));
const SEAL = url(fixturePng(200, 200));

const get = (path: string) => new Request(`http://localhost${path}`);
/** What a picture's address gives, as the data URL the picture was set from; null for a refusal. */
async function fetched(url: string | null): Promise<string | null> {
  if (!url) return null;
  const id = url.match(/\/api\/v1\/shared\/signatures\/([a-z0-9]+)/)?.[1];
  const res = id ? await paperImageGet(get(url), params({ signatureId: id })) : await ownImageGet(get(url));
  if (res.status !== 200) return null;
  return `data:image/png;base64,${Buffer.from(await res.arrayBuffer()).toString("base64")}`;
}
const pictures = async (view: { signatures: { image: string | null }[]; seal: string | null }) => ({ signatures: await Promise.all(view.signatures.map((s) => fetched(s.image))), seal: await fetched(view.seal) });
const own = async (view: { mine: { image: string | null }; seal: { image: string | null } }) => ({ mine: await fetched(view.mine.image), seal: await fetched(view.seal.image) });
const json = (path: string, body: unknown) => new Request(`http://localhost${path}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
const params = <T extends object>(p: T) => ({ params: Promise.resolve(p) });
type Who = "ADMIN" | "ADMIN2" | "PRINCIPAL" | "TEACHER" | "PARENT" | "OTHER_ADMIN";
async function as(who: Who | null) {
  __resetCookies();
  if (who === "ADMIN" || who === "ADMIN2") await createSession(users[who]!, { schoolId, role: "ADMIN" });
  if (who === "PRINCIPAL" || who === "TEACHER") await createSession(users[who]!, { schoolId, role: who });
  if (who === "PARENT") await createSession(users.PARENT!, { schoolId: null, role: "PARENT" });
  if (who === "OTHER_ADMIN") await createSession(users.OTHER_ADMIN!, { schoolId: otherSchoolId, role: "ADMIN" });
}
const decide = (id: string, approve: boolean) => decidePost(json(`/api/v1/office/signatures/${id}/decide`, { approve }), params({ signatureId: id }));
const paper = async (id: string) => (await certificateGet(get(`/api/v1/shared/certificates/${id}`), params({ certificateId: id }))).json();
const layout = (extra: Record<string, unknown>) => ({ showLogo: false, showAddress: true, useBrandColour: false, signatureLeft: "Office", signatureRight: "Principal", footerNote: null, paper: "A4", ...extra });
async function template(name: string, extra: Record<string, unknown>): Promise<string> {
  const res = await templatesPost(json("/api/v1/office/certificate-templates", { kind: "BONAFIDE", name, locale: "en", title: "Bonafide Certificate", intro: "Certified that [[pupil.name]] is a pupil here.", rows: [], outro: "", layout: layout(extra), serialPrefix: "BC", active: true }));
  expect(res.status).toBe(200);
  return ((await res.json()) as { id: string }).id;
}
async function issue(templateId: string): Promise<string> {
  const res = await issuePost(json("/api/v1/office/certificates", { templateId, studentMembershipId: pupil, purpose: "ZZ test" }));
  expect(res.status).toBe(200);
  return ((await res.json()) as { id: string }).id;
}

beforeAll(async () => {
  const suffix = String(STAMP).slice(-6);
  const school = (tag: string, code: string) => db.school.create({ data: { name: `ZZ Sign ${tag} ${STAMP}`, slug: `zz-sign-${tag}-${STAMP}`, code: `${code}${suffix}`, contactEmail: `zz-sign-${tag}-${STAMP}@test.invalid`, timezone: "Asia/Kolkata" }, select: { id: true } });
  schoolId = (await school("a", "ZG")).id;
  otherSchoolId = (await school("b", "ZH")).id;
  for (const who of ["ADMIN", "ADMIN2", "PRINCIPAL", "TEACHER", "PARENT", "OTHER_ADMIN", "PUPIL"]) {
    users[who] = (await db.user.create({ data: { name: `ZZ Sign ${who}`, email: `zz-sign-${who.toLowerCase()}-${STAMP}@test.invalid` }, select: { id: true } })).id;
  }
  for (const [who, role] of [["ADMIN", "ADMIN"], ["ADMIN2", "ADMIN"], ["PRINCIPAL", "PRINCIPAL"], ["TEACHER", "TEACHER"]] as const) await db.membership.create({ data: { userId: users[who]!, schoolId, role, status: "ACTIVE" } });
  await db.membership.create({ data: { userId: users.OTHER_ADMIN!, schoolId: otherSchoolId, role: "ADMIN", status: "ACTIVE" } });
  pupil = (await db.membership.create({ data: { userId: users.PUPIL!, schoolId, role: "STUDENT", status: "ACTIVE", studentCode: `ZGA${STAMP}` }, select: { id: true } })).id;
  await db.guardianship.create({ data: { parentUserId: users.PARENT!, studentMembershipId: pupil, studentSchoolId: schoolId, status: "ACTIVE" } });
  await db.academicYear.create({ data: { schoolId, name: "2026–27", startDate: new Date("2026-06-01T00:00:00Z"), endDate: new Date("2027-04-30T00:00:00Z"), isCurrent: true } });
});

afterAll(async () => {
  __resetCookies();
  await db.session.deleteMany({ where: { userId: { in: Object.values(users) } } });
  await db.school.deleteMany({ where: { id: { in: [schoolId, otherSchoolId] } } });
  await db.user.deleteMany({ where: { email: { contains: `-${STAMP}@test.invalid` } } });
  await db.$disconnect();
});

describe("a signature and the seal are set", () => {
  it("by an admin and the head for themselves, the seal by the admin alone; a parent has neither, and a certificate's line cannot be a teacher's", async () => {
    await as(null);
    expect((await signaturesGet()).status).toBe(401);
    await as("PARENT");
    expect((await signaturesGet()).status).toBe(403);
    expect((await minePost(json("/api/v1/office/signatures/mine", { image: ADMIN_INK }))).status).toBe(403);
    // A teacher signs report cards (tests/card-set-signatures.test.ts) and no certificate: a template cannot name one.
    await as("ADMIN");
    expect((await templatesPost(json("/api/v1/office/certificate-templates", { kind: "BONAFIDE", name: "ZZ teacher line", locale: "en", title: "Bonafide Certificate", intro: "", rows: [], outro: "", layout: layout({ signerLeft: "TEACHER" }), serialPrefix: "BC", active: true }))).status).toBe(422);
    await as("ADMIN");
    expect(await (await signaturesGet()).json()).toEqual({ mine: { image: null, updatedAt: null }, seal: { image: null, updatedAt: null }, canSetSeal: true, waiting: [] });
    expect((await minePost(json("/api/v1/office/signatures/mine", { image: ADMIN_INK }))).status).toBe(200);
    expect((await sealPost(json("/api/v1/office/signatures/seal", { image: SEAL }))).status).toBe(200);
    expect(await own(await (await signaturesGet()).json())).toEqual({ mine: ADMIN_INK, seal: SEAL });
    await as("PRINCIPAL");
    expect((await sealPost(json("/api/v1/office/signatures/seal", { image: SEAL }))).status).toBe(403);
    expect((await sealRemove()).status).toBe(403);
    expect((await minePost(json("/api/v1/office/signatures/mine", { image: HEAD_INK }))).status).toBe(200);
    // The head reads the seal and their own signature, and nobody else's.
    expect(await (await signaturesGet()).json()).toMatchObject({ canSetSeal: false });
    expect(await own(await (await signaturesGet()).json())).toEqual({ mine: HEAD_INK, seal: SEAL });
    await as("OTHER_ADMIN");
    expect(await (await signaturesGet()).json()).toMatchObject({ mine: { image: null }, seal: { image: null } });
  });

  it("only from a PNG of a sane size: not a JPEG called a PNG, not text, not a picture a thousand wide too many, not one too heavy", async () => {
    await as("ADMIN");
    const send = (image: string) => minePost(json("/api/v1/office/signatures/mine", { image }));
    expect((await send("data:image/jpeg;base64,/9j/4AAQ")).status).toBe(422);
    expect((await send(`data:image/png;base64,${Buffer.from("not a picture at all, only words that are long enough").toString("base64")}`)).status).toBe(403);
    expect((await send(url(fixturePng(8, 8)))).status).toBe(403);
    expect((await send(url(fixturePng(1300, 100)))).status).toBe(403);
    expect((await send("javascript:alert(1)")).status).toBe(422);
    expect((await send(`data:image/png;base64,${"A".repeat(500_000)}`)).status).toBe(422);
    // Nothing of those replaced what was kept.
    expect((await own(await (await signaturesGet()).json())).mine).toBe(ADMIN_INK);
  });
});

describe("a paper is signed", () => {
  let both = "";
  let waiting = "";

  it("a template that asks for nobody prints as papers always did", async () => {
    await as("ADMIN");
    const plain = await issue(await template("ZZ plain", {}));
    expect(await paper(plain)).toMatchObject({ signatures: [], seal: null });
    expect(await db.paperSignature.count({ where: { paperId: plain } })).toBe(0);
  });

  it("the admin's own line is signed at once, the head's waits, the seal is drawn; the head is told and the admin is not", async () => {
    await as("ADMIN");
    both = await issue(await template("ZZ signed", { signerLeft: "ADMIN", signerRight: "PRINCIPAL", showSeal: true }));
    const view = await paper(both);
    expect(await pictures(view)).toEqual({ signatures: [ADMIN_INK, null], seal: SEAL });
    expect(view.signatures).toEqual([
      expect.objectContaining({ slot: "LEFT", role: "ADMIN", status: "SIGNED", signerName: "ZZ Sign ADMIN", can: { decide: false } }),
      expect.objectContaining({ slot: "RIGHT", role: "PRINCIPAL", status: "PENDING", image: null, signerName: null, can: { decide: false } }),
    ]);
    expect(view.signatures[0].image).toMatch(/^\/api\/v1\/shared\/signatures\//);
    waiting = view.signatures[1].id;
    const told = await db.notification.findMany({ where: { schoolId, titleKey: "signatures.notifWaiting" }, select: { userId: true, url: true } });
    expect(told).toEqual([{ userId: users.PRINCIPAL, url: "/admin/signatures" }]);
    // The family reads the paper with the one signature it has.
    await as("PARENT");
    const family = await paper(both);
    expect(family.signatures.map((s: { status: string; can: { decide: boolean } }) => [s.status, s.can.decide])).toEqual([["SIGNED", false], ["PENDING", false]]);
    // The family fetches the picture; a stranger to the paper is refused it.
    expect(await fetched(family.signatures[0].image)).toBe(ADMIN_INK);
    await as("OTHER_ADMIN");
    expect(await fetched(family.signatures[0].image)).toBeNull();
    await as("PARENT");
    const pdf = await certificatePdf(get(`/api/v1/shared/certificates/${both}/pdf`), params({ certificateId: both }));
    expect(pdf.status).toBe(200);
    expect(Buffer.from(await pdf.arrayBuffer()).subarray(0, 5).toString("latin1")).toBe("%PDF-");
  });

  it("⚠ nobody puts the head's signature on a paper but the head: not the admin who issued it, not another admin, not a teacher, not another school", async () => {
    for (const who of ["ADMIN", "ADMIN2"] as const) {
      await as(who);
      expect((await decide(waiting, true)).status).toBe(403);
    }
    await as("TEACHER");
    expect((await decide(waiting, true)).status).toBe(403);
    await as("PARENT");
    expect((await decide(waiting, true)).status).toBe(403);
    await as("OTHER_ADMIN");
    expect((await decide(waiting, true)).status).toBe(404);
    expect((await db.paperSignature.findUniqueOrThrow({ where: { id: waiting } })).status).toBe("PENDING");
  });

  it("the head finds the paper waiting, signs it once, and the admin who issued it is told; signing or declining again changes nothing", async () => {
    await as("PRINCIPAL");
    const view = await (await signaturesGet()).json();
    expect(view.waiting).toEqual([expect.objectContaining({ id: waiting, paperKind: "CERTIFICATE", paperId: both, title: "Bonafide Certificate", studentName: "ZZ Sign PUPIL", requestedByName: "ZZ Sign ADMIN" })]);
    expect((await paper(both)).signatures[1].can).toEqual({ decide: true });
    expect(await (await decide(waiting, true)).json()).toEqual({ paperKind: "CERTIFICATE", paperId: both, status: "SIGNED" });
    expect(await (await decide(waiting, false)).json()).toMatchObject({ status: "SIGNED" });
    expect((await paper(both)).signatures[1]).toMatchObject({ status: "SIGNED", signerName: "ZZ Sign PRINCIPAL", can: { decide: false } });
    expect((await pictures(await paper(both))).signatures).toEqual([ADMIN_INK, HEAD_INK]);
    expect((await (await signaturesGet()).json()).waiting).toEqual([]);
    const told = await db.notification.findMany({ where: { schoolId, titleKey: "signatures.notifSigned" }, select: { userId: true } });
    expect(told).toEqual([{ userId: users.ADMIN }]);
  });

  it("the head issues one: the head's line is signed at once and the admin's waits for an admin, either of them", async () => {
    await as("PRINCIPAL");
    const mine = await issue((await db.certificateTemplate.findFirstOrThrow({ where: { schoolId, name: "ZZ signed" } })).id);
    const view = await paper(mine);
    expect(view.signatures.map((s: { slot: string; status: string }) => [s.slot, s.status])).toEqual([["LEFT", "PENDING"], ["RIGHT", "SIGNED"]]);
    // The second admin has no signature of their own yet: told to add one, and the line still waits.
    await as("ADMIN2");
    const refused = await decide(view.signatures[0].id, true);
    expect(refused.status).toBe(403);
    expect((await refused.json()).error).toBe("Add your signature first, then sign.");
    // Declining needs no signature.
    expect(await (await decide(view.signatures[0].id, false)).json()).toMatchObject({ status: "DECLINED" });
    expect((await paper(mine)).signatures[0]).toMatchObject({ status: "DECLINED", image: null, signerName: "ZZ Sign ADMIN2" });
  });

  it("the paper keeps the picture it was signed with when the signature is changed, removed, and the seal taken away", async () => {
    await as("ADMIN");
    expect((await minePost(json("/api/v1/office/signatures/mine", { image: NEW_INK }))).status).toBe(200);
    expect((await sealRemove()).status).toBe(200);
    await as("PRINCIPAL");
    expect((await mineRemove()).status).toBe(200);
    expect(await pictures(await paper(both))).toEqual({ signatures: [ADMIN_INK, HEAD_INK], seal: SEAL });
    // The next paper has the new signature, no seal, and the head's line waiting on a head who now has none.
    await as("ADMIN");
    const next = await paper(await issue((await db.certificateTemplate.findFirstOrThrow({ where: { schoolId, name: "ZZ signed" } })).id));
    expect(await pictures(next)).toEqual({ signatures: [NEW_INK, null], seal: null });
    expect(next.signatures[1]).toMatchObject({ status: "PENDING", image: null });
  });

  it("the audit names who set, signed and declined and which paper, and holds no picture", async () => {
    const rows = await db.auditLog.findMany({ where: { schoolId, action: { in: ["signature.set", "signature.remove", "seal.set", "seal.remove", "paper.sign", "paper.sign.decline"] } }, select: { action: true, meta: true, targetId: true } });
    const count = (action: string) => rows.filter((r) => r.action === action).length;
    expect([count("signature.set"), count("signature.remove"), count("seal.set"), count("seal.remove"), count("paper.sign.decline")]).toEqual([3, 1, 1, 1, 1]);
    // The admin's own twice, the head's own once, the head's approval once.
    expect(count("paper.sign")).toBe(4);
    expect(rows.every((r) => !r.meta.includes("base64") && !r.meta.includes("iVBOR"))).toBe(true);
    expect(rows.filter((r) => r.action === "paper.sign").map((r) => r.targetId)).toContain(both);
  });
});
