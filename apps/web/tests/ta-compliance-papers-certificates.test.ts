/**
 * Certificates of the compliance-papers batch (testing analysis of 13 November 2026), each case failing while its
 * finding stands:
 *
 *   TA-577  A template token the placeholder pattern cannot read ([[Pupil.name]], [[pupil.date_of_birth]]) was neither
 *           refused as an unknown detail nor filled, and printed its brackets on every paper issued from it.
 *   TA-323  The picture door of a paper's signature or seal admitted only a pupil, a guardian, a teacher, the office
 *           and the head, so a librarian, driver, warden or college staff member reading their own appointment letter
 *           saw broken images where the signatures and the seal should be.
 *
 * At a ZZ school of this suite's own, removed afterwards.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import type { ActiveContext } from "@/lib/session";
import { createSession } from "@/lib/session";
import { __resetCookies } from "../tests/stubs/next-headers";
import { presetsFor } from "@/lib/certificate-rules";
import { saveTemplate } from "@/lib/certificates";
import { AccessError } from "@/lib/tenancy";
import { GET as signatureGet } from "@/app/api/v1/shared/signatures/[signatureId]/route";

const db = new PrismaClient();
const STAMP = Date.now();
const SUFFIX = String(STAMP).slice(-6);
const mail = (who: string) => `zz-tacp-cert-${who}-${STAMP}@test.invalid`;
const ids: Record<string, string> = {};

function ctx(userId: string, role: ActiveContext["role"], membershipId: string): ActiveContext {
  return { sessionId: "t", membershipId, schoolId: ids.school!, role, user: { id: userId, name: "ZZ", preferredName: null, email: null, avatarKey: null, isMinor: false, isSuperuser: false, isAppAdmin: false, prefs: {} as never } } as ActiveContext;
}

beforeAll(async () => {
  ids.school = (await db.school.create({ data: { name: `ZZ TA Certificates ${STAMP}`, slug: `zz-tacp-cert-${STAMP}`, code: `ZCC${SUFFIX}`, contactEmail: mail("school"), timezone: "Asia/Kolkata", locale: "en", isTestFixture: true }, select: { id: true } })).id;
  for (const who of ["admin", "librarian", "otherLibrarian"]) ids[who] = (await db.user.create({ data: { name: `ZZ TACP Cert ${who}`, email: mail(who.toLowerCase()), isTestFixture: true }, select: { id: true } })).id;
  ids.adminM = (await db.membership.create({ data: { userId: ids.admin!, schoolId: ids.school, role: "ADMIN", status: "ACTIVE" }, select: { id: true } })).id;
  ids.librarianM = (await db.membership.create({ data: { userId: ids.librarian!, schoolId: ids.school, role: "LIBRARIAN", status: "ACTIVE" }, select: { id: true } })).id;
  ids.otherLibrarianM = (await db.membership.create({ data: { userId: ids.otherLibrarian!, schoolId: ids.school, role: "LIBRARIAN", status: "ACTIVE" }, select: { id: true } })).id;
  // The librarian's appointment letter, the head's line signed on it.
  ids.letter = (await db.issuedCertificate.create({ data: { schoolId: ids.school, studentMembershipId: ids.librarianM, kind: "APPOINTMENT", locale: "en", serial: `AL-ZZ-${SUFFIX}`, number: 1, title: "ZZ Appointment letter", code: `ZZTA323${STAMP}`, issuedByUserId: ids.admin! }, select: { id: true } })).id;
  ids.signature = (await db.paperSignature.create({ data: { schoolId: ids.school, paperKind: "CERTIFICATE", paperId: ids.letter, slot: "RIGHT", role: "PRINCIPAL", status: "SIGNED", signerName: "ZZ Head", png: new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]), decidedAt: new Date() }, select: { id: true } })).id;
});

afterAll(async () => {
  __resetCookies();
  const people = await db.user.findMany({ where: { email: { contains: `-${STAMP}@test.invalid` } }, select: { id: true } });
  await db.session.deleteMany({ where: { userId: { in: people.map((p) => p.id) } } });
  await db.paperSignature.deleteMany({ where: { schoolId: ids.school } });
  await db.auditLog.deleteMany({ where: { schoolId: ids.school } });
  await db.school.deleteMany({ where: { id: ids.school } });
  await db.user.deleteMany({ where: { id: { in: people.map((p) => p.id) } } });
  await db.$disconnect();
});

describe("a template token the pattern cannot read", () => {
  it("TA-577: [[Pupil.name]] and [[pupil.date_of_birth]] are refused as unknown details, both named", async () => {
    const preset = presetsFor("en").find((x) => x.kind === "BONAFIDE")!;
    const saving = saveTemplate(ctx(ids.admin!, "ADMIN", ids.adminM!), { ...preset, name: `ZZ TA577 ${STAMP}`, intro: "This is to certify that [[Pupil.name]], born on [[pupil.date_of_birth]], is a pupil here.", active: true });
    const error = await saving.then(() => null, (e: unknown) => e);
    expect(error).toBeInstanceOf(AccessError);
    expect((error as AccessError).key).toBe("certificates.unknownDetails");
    expect(String((error as AccessError).vars?.list)).toContain("[[Pupil.name]]");
    expect(String((error as AccessError).vars?.list)).toContain("[[pupil.date_of_birth]]");
    expect(await db.certificateTemplate.count({ where: { schoolId: ids.school, name: `ZZ TA577 ${STAMP}` } })).toBe(0);
  });

  it("TA-577: a template whose tokens are all known still saves", async () => {
    const preset = presetsFor("en").find((x) => x.kind === "BONAFIDE")!;
    const saved = await saveTemplate(ctx(ids.admin!, "ADMIN", ids.adminM!), { ...preset, name: `ZZ TA577 ok ${STAMP}`, active: true });
    expect(saved.id).toBeTruthy();
  });
});

describe("the signatures on a member of staff's own appointment letter", () => {
  const fetchAs = async (userId: string) => {
    __resetCookies();
    await createSession(userId, { schoolId: ids.school!, role: "LIBRARIAN" });
    return signatureGet(new Request(`http://localhost/api/v1/shared/signatures/${ids.signature}`), { params: Promise.resolve({ signatureId: ids.signature! }) });
  };

  it("TA-323: the librarian the letter was issued to loads the signed line as a PNG", async () => {
    const res = await fetchAs(ids.librarian!);
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("image/png");
  });

  it("TA-323: another librarian of the school is answered 404, as the paper's own rule says", async () => {
    expect((await fetchAs(ids.otherLibrarian!)).status).toBe(404);
  });
});
