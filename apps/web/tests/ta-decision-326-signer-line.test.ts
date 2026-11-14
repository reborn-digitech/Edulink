/**
 * The owner's decision on TA-326 (testing analysis of 13 November 2026, decided 14 November 2026): print who signed
 * under each signed line.
 *
 *   TA-326  A signature line's caption is free text, independent of who signs it: an admin could save a template whose
 *           admin-signed line reads "Principal", and the paper, on the screen and in the PDF, printed the admin's
 *           picture above "Principal" with nothing saying whose it was (the name was in the picture's alt text alone).
 *           Now, under each signature already given, the paper also prints the signer's name and office ("Signed by
 *           A. Patil, Office"), from what the paper stored at signing; the school's caption stays as typed. A line that
 *           still waits, or was declined, prints nothing more.
 *
 * At a ZZ school of this suite's own, removed afterwards.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { isValidElement, type ReactNode } from "react";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { issuedCertificateSchema, type IssuedCertificateView, type PaperSignatureView } from "@edulink/contracts";
import type { ActiveContext } from "@/lib/session";
import { translator } from "@/lib/i18n/dictionary";
import { paperSignatures, signOnIssue } from "@/lib/signatures";

const db = new PrismaClient();
const STAMP = Date.now();
const SUFFIX = String(STAMP).slice(-6);
const mail = (who: string) => `zz-ta326-${who}-${STAMP}@test.invalid`;
const ids: Record<string, string> = {};
const INK = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 1]);
const ADMIN_NAME = `ZZ TA326 Admin ${SUFFIX}`;
const WEB = join(__dirname, "..");
const REPO = join(WEB, "..", "..");
const read = (path: string) => readFileSync(join(REPO, path), "utf8");

function ctx(userId: string, name: string, role: ActiveContext["role"], membershipId: string): ActiveContext {
  return { sessionId: "t", membershipId, schoolId: ids.school!, role, user: { id: userId, name, preferredName: null, email: null, avatarKey: null, isMinor: false, isSuperuser: false, isAppAdmin: false, prefs: {} as never } } as ActiveContext;
}
const admin = () => ctx(ids.admin!, ADMIN_NAME, "ADMIN", ids.adminM!);

/** Every text the PDF's page draws, one string per drawn Text, its parts joined as the renderer joins them. */
function drawnTexts(node: ReactNode): string[] {
  const out: string[] = [];
  const flat = (n: ReactNode): string => {
    if (n === null || n === undefined || typeof n === "boolean") return "";
    if (typeof n === "string" || typeof n === "number") return String(n);
    if (Array.isArray(n)) return n.map(flat).join("");
    return "";
  };
  const walk = (n: ReactNode) => {
    if (Array.isArray(n)) return n.forEach(walk);
    if (!isValidElement(n)) return;
    const props = n.props as { children?: ReactNode };
    if (n.type === "TEXT") out.push(flat(props.children));
    walk(props.children);
  };
  walk(node);
  return out;
}

const signed = (role: PaperSignatureView["role"], name: string | null, slot: "LEFT" | "RIGHT" = "RIGHT"): PaperSignatureView => ({ id: `zz-${slot}`, slot, role, status: "SIGNED", signerName: name, image: "/api/v1/shared/signatures/zz", decidedAt: new Date().toISOString(), can: { decide: false } });

function certificate(over: { locale: "en" | "hi" | "mr"; signatures: PaperSignatureView[] }): IssuedCertificateView {
  return issuedCertificateSchema.parse({
    id: "zz-cert",
    kind: "BONAFIDE",
    locale: over.locale,
    serial: "ZZ/2026-27/0001",
    title: "ZZ Bonafide Certificate",
    intro: "ZZ intro.",
    rows: [],
    outro: "",
    layout: { signerLeft: "PRINCIPAL", signerRight: "ADMIN", showSeal: false, showLogo: false, showAddress: false, useBrandColour: false, signatureLeft: "Office", signatureRight: "Principal", footerNote: null, paper: "A4" },
    purpose: null,
    remark: null,
    studentMembershipId: "zz-pupil",
    studentName: "ZZ Pupil",
    className: null,
    school: { name: "ZZ School", code: "ZZ", logoPath: null, addressLine: null, city: null, region: null, postalCode: null, contactPhone: null, contactEmail: null, brandPrimary: null },
    code: "ZZ-CODE",
    signatures: over.signatures,
    seal: null,
    issuedAt: new Date().toISOString(),
    issuedByName: ADMIN_NAME,
    revokedAt: null,
    revokedReason: null,
    missing: [],
    canRevoke: false,
  });
}

beforeAll(async () => {
  ids.school = (await db.school.create({ data: { name: `ZZ TA326 Signer ${STAMP}`, slug: `zz-ta326-${STAMP}`, code: `Z326${SUFFIX}`, contactEmail: mail("school"), timezone: "Asia/Kolkata", locale: "en", isTestFixture: true }, select: { id: true } })).id;
  ids.admin = (await db.user.create({ data: { name: ADMIN_NAME, email: mail("admin"), isTestFixture: true }, select: { id: true } })).id;
  ids.head = (await db.user.create({ data: { name: `ZZ TA326 Head ${SUFFIX}`, email: mail("head"), isTestFixture: true }, select: { id: true } })).id;
  ids.pupil = (await db.user.create({ data: { name: `ZZ TA326 Pupil ${SUFFIX}`, email: mail("pupil"), isTestFixture: true }, select: { id: true } })).id;
  ids.adminM = (await db.membership.create({ data: { userId: ids.admin, schoolId: ids.school, role: "ADMIN", status: "ACTIVE" }, select: { id: true } })).id;
  ids.headM = (await db.membership.create({ data: { userId: ids.head, schoolId: ids.school, role: "PRINCIPAL", status: "ACTIVE" }, select: { id: true } })).id;
  ids.pupilM = (await db.membership.create({ data: { userId: ids.pupil, schoolId: ids.school, role: "STUDENT", status: "ACTIVE" }, select: { id: true } })).id;
  await db.signatureImage.create({ data: { schoolId: ids.school, kind: "PERSON", membershipId: ids.adminM, png: INK } });
});

afterAll(async () => {
  const people = await db.user.findMany({ where: { email: { startsWith: "zz-ta326-", endsWith: `-${STAMP}@test.invalid` } }, select: { id: true } });
  if (ids.school) {
    await db.notification.deleteMany({ where: { userId: { in: people.map((p) => p.id) } } });
    await db.paperSignature.deleteMany({ where: { schoolId: ids.school } });
    await db.auditLog.deleteMany({ where: { schoolId: ids.school } });
    await db.school.deleteMany({ where: { id: ids.school } });
  }
  await db.user.deleteMany({ where: { id: { in: people.map((p) => p.id) } } });
  await db.$disconnect();
});

describe("the line under a signature already given", () => {
  it("TA-326: names the signer and the office they signed as, in English, Hindi and Marathi, reusing the office words", async () => {
    const { signerLine } = await import("@/lib/signer-line");
    const en = translator("en");
    expect(signerLine(signed("ADMIN", "A. Patil"), en)).toBe("Signed by A. Patil, Office");
    expect(signerLine(signed("PRINCIPAL", "B. Rao"), en)).toBe("Signed by B. Rao, Principal");
    expect(signerLine(signed("TEACHER", "C. Joshi"), en)).toBe("Signed by C. Joshi, Class teacher");
    expect(signerLine(signed("ADMIN", "A. Patil"), translator("hi"))).toBe("A. Patil के हस्ताक्षर, कार्यालय");
    expect(signerLine(signed("PRINCIPAL", "B. Rao"), translator("mr"))).toBe("B. Rao यांची स्वाक्षरी, मुख्याध्यापक");
    // A line that waits, one declined, and one with no name stored print nothing more.
    expect(signerLine({ ...signed("ADMIN", "A. Patil"), status: "PENDING" }, en)).toBeNull();
    expect(signerLine({ ...signed("ADMIN", "A. Patil"), status: "DECLINED" }, en)).toBeNull();
    expect(signerLine(signed("ADMIN", null), en)).toBeNull();
    expect(signerLine(undefined, en)).toBeNull();
  });

  it("TA-326: an admin's own line captioned 'Principal' is read back from what the paper stored as signed by the admin, as the Office; the head's waiting line prints nothing", async () => {
    const { signerLine } = await import("@/lib/signer-line");
    const cert = await db.issuedCertificate.create({ data: { schoolId: ids.school!, studentMembershipId: ids.pupilM!, kind: "BONAFIDE", locale: "en", serial: `ZZ-TA326-${SUFFIX}`, number: 1, title: "ZZ Bonafide", code: `ZZ326${STAMP}` }, select: { id: true } });
    await signOnIssue(admin(), { kind: "CERTIFICATE", id: cert.id, schoolId: ids.school!, title: "ZZ Bonafide", studentName: "ZZ Pupil" }, { signerLeft: "PRINCIPAL", signerRight: "ADMIN", showSeal: false });
    const { signatures } = await paperSignatures(admin(), { kind: "CERTIFICATE", id: cert.id, schoolId: ids.school! });
    const right = signatures.find((s) => s.slot === "RIGHT");
    const left = signatures.find((s) => s.slot === "LEFT");
    expect(right).toMatchObject({ role: "ADMIN", status: "SIGNED", signerName: ADMIN_NAME });
    expect(left).toMatchObject({ role: "PRINCIPAL", status: "PENDING" });
    expect(signerLine(right, translator("en"))).toBe(`Signed by ${ADMIN_NAME}, Office`);
    expect(signerLine(left, translator("en"))).toBeNull();
  });

  it("TA-326: the certificate's PDF prints it under the caption, which stays as typed, in the paper's own language", async () => {
    const { CertificatePage } = await import("@/lib/certificate-pdf");
    const en = drawnTexts(CertificatePage({ cert: certificate({ locale: "en", signatures: [signed("ADMIN", ADMIN_NAME)] }), logo: null, verifyUrl: "https://zz.invalid/certificates/check", issuedOn: "01/11/2026", pictures: {} }));
    expect(en).toContain("Principal");
    expect(en).toContain("Office");
    expect(en).toContain(`Signed by ${ADMIN_NAME}, Office`);
    expect(en.indexOf(`Signed by ${ADMIN_NAME}, Office`)).toBe(en.indexOf("Principal") + 1);
    // A Hindi paper says it in Hindi, as the rest of its PDF does; a paper with nothing signed prints no such line.
    const hi = drawnTexts(CertificatePage({ cert: certificate({ locale: "hi", signatures: [signed("ADMIN", ADMIN_NAME)] }), logo: null, verifyUrl: "https://zz.invalid/certificates/check", issuedOn: "01/11/2026", pictures: {} }));
    expect(hi).toContain(`${ADMIN_NAME} के हस्ताक्षर, कार्यालय`);
    const bare = drawnTexts(CertificatePage({ cert: certificate({ locale: "en", signatures: [{ ...signed("ADMIN", ADMIN_NAME), status: "PENDING", signerName: null, image: null }] }), logo: null, verifyUrl: "https://zz.invalid/certificates/check", issuedOn: "01/11/2026", pictures: {} }));
    expect(bare.some((line) => line.startsWith("Signed by"))).toBe(false);
  });

  it("TA-326: the on-screen certificate, the report card's page and its PDF, and the phone's certificate print the same line under each signed caption", () => {
    const certPage = read("apps/web/src/app/(app)/certificates/[certificateId]/page.tsx");
    expect(certPage).toMatch(/signerLine\(signature, paperWords\)/);
    expect(certPage).toContain("wordsFor(cert.locale");
    const cardPage = read("apps/web/src/app/(app)/report-cards/[cardId]/page.tsx");
    expect(cardPage).toMatch(/signerLine\(signature, t\)/);
    const cardPdf = read("apps/web/src/lib/report-card-pdf.tsx");
    expect(cardPdf).toMatch(/signerLine\(card\.signatures\.find\(\(s\) => s\.slot === slot\), t\)/);
    const phone = read("apps/mobile/src/screens/shared/certificate.tsx");
    expect(phone).toContain("signatures.signedByOffice");
  });

  it("TA-326: the guides say a signed line also prints who signed it, and that the caption stays as typed", () => {
    for (const guide of ["docs/guide/office-school.md", "docs/guide/principal.md", "docs/guide/teacher.md"]) {
      expect(read(guide), guide).toContain('"Signed by {name}, {office}"');
    }
  });
});
