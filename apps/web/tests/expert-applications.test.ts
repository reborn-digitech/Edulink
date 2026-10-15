import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { PrismaClient } from "@prisma/client";
import { expertApplicationReceivedSchema, operatorExpertApplicationDecidedSchema, operatorExpertApplicationsSchema, type ExpertApplicationBody } from "@edulink/contracts";
import { checkApplication, decideExpertApplication, EXPERT_APPLICATIONS_PER_HOUR, listExpertApplications, readExpertApplicationDocument, submitExpertApplication } from "@/lib/expert-applications";
import { acceptExpertInvite, readExpertInvite } from "@/lib/experts";
import { authorizeFileRead } from "@/lib/files";
import { FILE_REFERENCES } from "@/lib/orphans";
import { createSession } from "@/lib/session";
import { AccessError } from "@/lib/tenancy";
import { translator } from "@/lib/i18n/dictionary";
import { __resetCookies, __setHeaders } from "../tests/stubs/next-headers";
import { POST as applyPost } from "@/app/api/v1/public/expert-applications/route";
import { GET as listGet } from "@/app/api/v1/operator/expert-applications/route";
import { POST as decidePost } from "@/app/api/v1/operator/expert-applications/[id]/decide/route";
import { GET as documentGet } from "@/app/api/v1/operator/expert-applications/[id]/document/route";
import type { ActiveContext } from "@/lib/session";

/**
 * An expert applies from the login page and the operator decides (expert-registration, 15 Oct 2026).
 *
 * The form's every refusal names its field; a valid application stores its document privately, makes no
 * account, mails the applicant in their language and is audited; a second one from an address still waiting,
 * or from an address that is already an expert's, is refused; the caller's address is limited to five valid
 * applications an hour. The operator alone lists, opens the document and decides: approval makes the account
 * with no password, an unpublished profile from the application and an ExpertInvite bound to the address, and
 * the invitation's link — taken from the mail itself — sets the password through the existing acceptance,
 * keeping the profile; an address that already had an account gets the profile at acceptance, from the
 * application. A refusal needs a reason (OTHER a note) and mails it in the applicant's language.
 * Every ZZ row here is made and removed by this file: addresses `zz-expapp-…-<stamp>@test.invalid`.
 */
const db = new PrismaClient();
const STAMP = Date.now();
const mail = (key: string) => `zz-expapp-${key}-${STAMP}@test.invalid`;
const STORE = mkdtempSync(join(tmpdir(), "zz-expapp-"));
const REAL_STORAGE_DIR = process.env.STORAGE_DIR;
process.env.STORAGE_DIR = STORE;
const ADDRESS = `zz-expapp-${STAMP}`;

const id: Record<string, string> = {};
const ctx = (key: string, flags: { isSuperuser?: boolean } = {}, role: ActiveContext["role"] = null, schoolId: string | null = null): ActiveContext =>
  ({ sessionId: "test", membershipId: null, schoolId, role, user: { id: id[key]!, name: key, preferredName: null, email: null, avatarKey: null, isMinor: false, isSuperuser: Boolean(flags.isSuperuser), isAppAdmin: false } }) as ActiveContext;
const operator = () => ctx("operator", { isSuperuser: true });
const stranger = () => ctx("stranger", {}, "EXPERT");

const PDF = () => new File([Buffer.from("%PDF-1.4\n% ZZ expert application document\n1 0 obj <<>> endobj\ntrailer <<>>\n%%EOF\n")], "zz-degree.pdf", { type: "application/pdf" });
const GIF = () => new File([Buffer.from("GIF89a\x01\x00\x01\x00\x00\x00\x00;", "binary")], "zz.gif", { type: "image/gif" });

const body = (over: Partial<ExpertApplicationBody> = {}): ExpertApplicationBody => ({
  name: "ZZ Meera Kulkarni",
  email: mail("meera"),
  phone: "98765 43210",
  city: "Pune",
  organisation: "ZZ Robotics Lab",
  headline: "ZZ structural engineer and robotics coach",
  specialisms: ["ENGINEERING", "CODING"],
  languages: ["en", "mr"],
  yearsExperience: 12,
  bio: "ZZ fixture: twelve years designing bridges, five coaching school robotics teams on Saturdays.",
  links: ["https://example.org/zz-meera"],
  offering: "SESSIONS",
  declaration: true,
  ...over,
});

beforeAll(async () => {
  const person = async (key: string, flags: Record<string, unknown> = {}) => {
    id[key] = (await db.user.create({ data: { name: `ZZ ${key} ${STAMP}`, email: mail(key), ...flags }, select: { id: true } })).id;
  };
  await person("operator", { isSuperuser: true });
  await person("stranger");
  await person("expert");
  await person("teacher", { emailVerifiedAt: new Date(), passwordHash: "zz-unknowable" });
  await db.expertProfile.create({ data: { userId: id.expert!, headline: "ZZ already an expert" } });
  // Each test sets its own caller address; the limiter's bucket is this file's alone.
  __setHeaders({ "x-forwarded-for": ADDRESS });
});

afterAll(async () => {
  __resetCookies();
  __setHeaders({});
  const apps = await db.expertApplication.findMany({ where: { email: { contains: `-${STAMP}@test.invalid` } }, select: { id: true } });
  const users = await db.user.findMany({ where: { email: { contains: `-${STAMP}@test.invalid` } }, select: { id: true } });
  await db.auditLog.deleteMany({ where: { OR: [{ targetId: { in: apps.map((a) => a.id) } }, { actorUserId: { in: users.map((u) => u.id) } }] } }).catch(() => {});
  await db.expertApplication.deleteMany({ where: { email: { contains: `-${STAMP}@test.invalid` } } });
  await db.expertInvite.deleteMany({ where: { email: { contains: `-${STAMP}@test.invalid` } } });
  await db.session.deleteMany({ where: { userId: { in: users.map((u) => u.id) } } });
  await db.outboundEmail.deleteMany({ where: { to: { contains: `-${STAMP}@test.invalid` } } });
  await db.user.deleteMany({ where: { id: { in: users.map((u) => u.id) } } });
  await db.rateLimit.deleteMany({ where: { bucket: { contains: ADDRESS } } });
  await db.$disconnect();
  rmSync(STORE, { recursive: true, force: true });
  if (REAL_STORAGE_DIR === undefined) delete process.env.STORAGE_DIR;
  else process.env.STORAGE_DIR = REAL_STORAGE_DIR;
});

describe("the form's checks", () => {
  it("cleans a good application: the phone to E.164, the address lower-cased, the links as URLs", () => {
    const checked = checkApplication(body({ email: `  ZZ-ExpApp-Meera-${STAMP}@Test.Invalid `, phone: "+91 98765-43210", links: ["https://example.org/zz-meera", " "] }));
    expect(checked).toMatchObject({ ok: true, value: { email: mail("meera"), phone: "+919876543210", links: ["https://example.org/zz-meera"], organisation: "ZZ Robotics Lab" } });
  });

  it.each([
    [{ name: "Z" }, "expertApply.refuseName", "name"],
    [{ email: "not-an-address" }, "expertApply.refuseEmail", "email"],
    [{ phone: "12345 67890" }, "expertApply.refusePhone", "phone"],
    [{ phone: "+44 7700 900123" }, "expertApply.refusePhone", "phone"],
    [{ city: " " }, "expertApply.refuseCity", "city"],
    [{ organisation: "x".repeat(161) }, "expertApply.refuseOrganisation", "organisation"],
    [{ headline: "x".repeat(121) }, "expertApply.refuseHeadline", "headline"],
    [{ specialisms: [] }, "expertApply.refuseSpecialisms", "specialisms"],
    [{ specialisms: ["LAW", "SCIENCE", "CODING", "CAREERS", "MATHEMATICS", "WELLBEING"] }, "expertApply.refuseSpecialisms", "specialisms"],
    [{ specialisms: ["ASTROLOGY"] }, "expertApply.refuseSpecialisms", "specialisms"],
    [{ languages: [] }, "expertApply.refuseLanguages", "languages"],
    [{ languages: ["fr"] }, "expertApply.refuseLanguages", "languages"],
    [{ yearsExperience: -1 }, "expertApply.refuseYears", "yearsExperience"],
    [{ yearsExperience: 2.5 }, "expertApply.refuseYears", "yearsExperience"],
    [{ bio: "Too short." }, "expertApply.refuseBio", "bio"],
    [{ links: ["http://example.org/plain"] }, "expertApply.refuseLinks", "links"],
    [{ links: ["javascript:alert(1)"] }, "expertApply.refuseLinks", "links"],
    [{ links: ["https://a.example", "https://b.example", "https://c.example", "https://d.example"] }, "expertApply.refuseLinks", "links"],
    [{ offering: "WORKSHOP" }, "expertApply.refuseOffering", "offering"],
    [{ declaration: false }, "expertApply.refuseDeclaration", "declaration"],
  ] as [Partial<ExpertApplicationBody>, string, string][])("%o is refused with %s on %s", (over, errorKey, field) => {
    expect(checkApplication(body(over))).toMatchObject({ ok: false, errorKey, field });
  });
});

describe("applying", () => {
  it("needs a document, and only a PDF, JPG or PNG of at most 5 MB", async () => {
    expect(await submitExpertApplication(body({ email: mail("nodoc") }), null, "en")).toMatchObject({ ok: false, errorKey: "expertApply.refuseDocumentMissing", field: "document" });
    expect(await submitExpertApplication(body({ email: mail("gif") }), GIF(), "en")).toMatchObject({ ok: false, errorKey: "expertApply.refuseDocumentType", field: "document" });
    const big = new File([Buffer.alloc(5 * 1024 * 1024 + 1, 0x25)], "zz-big.pdf", { type: "application/pdf" });
    expect(await submitExpertApplication(body({ email: mail("big") }), big, "en")).toMatchObject({ ok: false, errorKey: "refusal.fileTooLargeLimit", field: "document" });
    expect(await db.expertApplication.count({ where: { email: { in: [mail("nodoc"), mail("gif"), mail("big")] } } })).toBe(0);
  });

  it("keeps a valid application with its document, makes no account, tells the applicant in their language and audits it", async () => {
    const made = await submitExpertApplication(body(), PDF(), "hi");
    expect(made).toMatchObject({ ok: true, email: mail("meera") });
    if (!made.ok) return;
    id.meeraApp = made.id;
    const row = await db.expertApplication.findUniqueOrThrow({ where: { id: made.id } });
    expect(row).toMatchObject({ status: "PENDING", phone: "+919876543210", locale: "hi", offering: "SESSIONS", yearsExperience: 12 });
    expect(JSON.parse(row.specialisms)).toEqual(["ENGINEERING", "CODING"]);
    expect(row.documentFileId).toMatch(/^[0-9a-f-]{36}\.pdf$/);
    expect(await db.user.count({ where: { email: mail("meera") } })).toBe(0);
    const told = await db.outboundEmail.findFirstOrThrow({ where: { to: mail("meera"), purpose: "EXPERT_APPLICATION" } });
    expect(told.subject).toBe(translator("hi")("expertApply.mailReceivedSubject"));
    expect(await db.auditLog.count({ where: { action: "expert.application.submit", targetId: made.id } })).toBe(1);
  });

  it("refuses a second application while one waits, and an address that is already an expert's", async () => {
    expect(await submitExpertApplication(body(), PDF(), "en")).toMatchObject({ ok: false, errorKey: "expertApply.refusePending", field: "email" });
    expect(await submitExpertApplication(body({ email: mail("expert") }), PDF(), "en")).toMatchObject({ ok: false, errorKey: "expertApply.refuseAlreadyExpert", field: "email" });
  });

  it("limits a caller's address to five valid applications an hour", async () => {
    // Four valid forms above reached the gate (the GIF, Meera's, the second while hers waits, the expert's address);
    // the fifth passes it (and is refused as waiting), the sixth is refused for the rate.
    for (let i = 0; i < EXPERT_APPLICATIONS_PER_HOUR.limit - 4; i++) {
      expect(await submitExpertApplication(body(), PDF(), "en")).toMatchObject({ ok: false, errorKey: "expertApply.refusePending" });
    }
    const limited = await submitExpertApplication(body(), PDF(), "en");
    expect(limited).toMatchObject({ ok: false, errorKey: "expertApply.refuseTooMany" });
    expect(limited.ok === false && limited.retryAfterSeconds).toBeGreaterThan(0);
    // An invalid form is refused for its field and spends nothing (another address would; this one is full).
    expect(await submitExpertApplication(body({ name: "Z" }), PDF(), "en")).toMatchObject({ ok: false, errorKey: "expertApply.refuseName" });
    __setHeaders({ "x-forwarded-for": `${ADDRESS}-b` });
  });

  it("the public door: a multipart body is 201 with the address, an empty body 422", async () => {
    const form = new FormData();
    form.set("application", JSON.stringify(body({ email: mail("asha"), name: "ZZ Asha Rao", specialisms: ["LAW"], offering: "MENTORING", languages: ["hi"] })));
    form.set("document", PDF());
    const response = await applyPost(new Request("http://localhost/api/v1/public/expert-applications", { method: "POST", body: form }));
    expect(response.status).toBe(201);
    expect(expertApplicationReceivedSchema.parse(await response.json())).toEqual({ ok: true, email: mail("asha") });
    const empty = await applyPost(new Request("http://localhost/api/v1/public/expert-applications", { method: "POST", headers: { "content-type": "application/json" }, body: "" }));
    expect(empty.status).toBe(422);
    const refused = await applyPost(new Request("http://localhost/api/v1/public/expert-applications", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body({ email: mail("nofile") })) }));
    expect(refused.status).toBe(422);
    expect((await refused.json()).issues).toHaveProperty("document");
  });
});

describe("the operator's queue", () => {
  it("lists the waiting applications and opens the document to the operator alone", async () => {
    await expect(listExpertApplications(stranger())).rejects.toBeInstanceOf(AccessError);
    const queue = await listExpertApplications(operator());
    const meera = queue.find((a) => a.id === id.meeraApp);
    expect(meera).toMatchObject({ name: "ZZ Meera Kulkarni", hasDocument: true, specialisms: ["ENGINEERING", "CODING"], languages: ["en", "mr"], links: ["https://example.org/zz-meera"], status: "PENDING" });
    const doc = await readExpertApplicationDocument(operator(), id.meeraApp!);
    expect(doc?.mime).toBe("application/pdf");
    expect(doc?.bytes.subarray(0, 4).toString()).toBe("%PDF");
    expect(await readExpertApplicationDocument(operator(), "zz-no-such-application")).toBeNull();
    await expect(readExpertApplicationDocument(stranger(), id.meeraApp!)).rejects.toBeInstanceOf(AccessError);
    // The file route: the operator, and nobody else; the orphan sweep claims the column.
    const fileId = (await db.expertApplication.findUniqueOrThrow({ where: { id: id.meeraApp! } })).documentFileId!;
    expect(await authorizeFileRead(fileId, operator())).toEqual({ allowed: true, kind: "kyc", public: false });
    expect(await authorizeFileRead(fileId, stranger())).toEqual({ allowed: false, reason: "not-found" });
    expect(FILE_REFERENCES).toContain("expertApplication.documentFileId");
  });

  it("the doors: the list and the document 200 for the operator, 403 for anybody else, 404 for no such application", async () => {
    await createSession(id.operator!);
    const list = await listGet(new Request("http://localhost/api/v1/operator/expert-applications"));
    expect(list.status).toBe(200);
    expect(operatorExpertApplicationsSchema.parse(await list.json()).items.some((a) => a.id === id.meeraApp)).toBe(true);
    const doc = await documentGet(new Request("http://localhost/x"), { params: Promise.resolve({ id: id.meeraApp! }) });
    expect(doc.status).toBe(200);
    expect(doc.headers.get("cache-control")).toContain("no-store");
    expect((await documentGet(new Request("http://localhost/x"), { params: Promise.resolve({ id: "zz-no-such-application" }) })).status).toBe(404);
    expect((await decidePost(new Request("http://localhost/x", { method: "POST", body: JSON.stringify({ decision: "APPROVE" }) }), { params: Promise.resolve({ id: "zz-no-such-application" }) })).status).toBe(404);
    await createSession(id.stranger!, { role: "EXPERT" });
    expect((await listGet(new Request("http://localhost/api/v1/operator/expert-applications"))).status).toBe(403);
    expect((await documentGet(new Request("http://localhost/x"), { params: Promise.resolve({ id: id.meeraApp! }) })).status).toBe(403);
    __resetCookies();
  });

  it("approval makes the account with no password, an unpublished profile from the application and the invitation bound to the address; its link sets the password and keeps the profile", async () => {
    await expect(decideExpertApplication(stranger(), id.meeraApp!, { decision: "APPROVE" })).rejects.toBeInstanceOf(AccessError);
    const decided = await decideExpertApplication(operator(), id.meeraApp!, { decision: "APPROVE" });
    expect(decided).toMatchObject({ ok: true, status: "APPROVED", inviteSent: true });
    if (!decided.ok) return;
    const user = await db.user.findUniqueOrThrow({ where: { email: mail("meera") }, select: { id: true, name: true, passwordHash: true, emailVerifiedAt: true, phone: true, prefs: true, expertProfile: true } });
    expect(user.id).toBe(decided.userId);
    expect(user).toMatchObject({ name: "ZZ Meera Kulkarni", passwordHash: null, emailVerifiedAt: null, phone: null });
    expect(JSON.parse(user.prefs).locale).toBe("hi");
    expect(user.expertProfile).toMatchObject({ headline: "ZZ structural engineer and robotics coach", organisation: "ZZ Robotics Lab", offering: "SESSIONS", publishedAt: null, kycStatus: "NONE", verifiedAt: null });
    expect(JSON.parse(user.expertProfile!.specialisms)).toEqual(["Engineering and technology", "Coding and computers"]);
    const app = await db.expertApplication.findUniqueOrThrow({ where: { id: id.meeraApp! } });
    expect(app).toMatchObject({ status: "APPROVED", decidedByUserId: id.operator, createdUserId: user.id });
    const invite = await db.expertInvite.findUniqueOrThrow({ where: { id: app.inviteId! } });
    expect(invite).toMatchObject({ schoolId: null, email: mail("meera"), name: "ZZ Meera Kulkarni", acceptedAt: null });
    expect(Math.round((invite.expiresAt.getTime() - Date.now()) / 86_400_000)).toBe(14);
    expect(await db.auditLog.count({ where: { action: "operator.expertApplication.approve", targetId: id.meeraApp, actorUserId: id.operator } })).toBe(1);
    // The invitation's own mail, in the applicant's language, carries the one copy of the token.
    const sent = await db.outboundEmail.findFirstOrThrow({ where: { to: mail("meera"), purpose: "INVITE" }, orderBy: { createdAt: "desc" } });
    expect(sent.subject).toBe(translator("hi")("email.expertSubject"));
    const token = /\/expert\/invite\/([A-Za-z0-9_-]+)/.exec(sent.text)?.[1];
    expect(token).toBeTruthy();
    expect(await readExpertInvite(token!)).toMatchObject({ ok: true, inviteId: invite.id, email: mail("meera") });
    // The acceptance as the invite page's action makes it for an unproved address it reclaims: the existing account.
    const accepted = await acceptExpertInvite(token!, { userId: user.id }, { headline: "typed on the form" });
    expect(accepted).toEqual({ expertProfileId: user.expertProfile!.id, userId: user.id });
    expect((await db.expertProfile.findUniqueOrThrow({ where: { userId: user.id } })).headline).toBe("ZZ structural engineer and robotics coach");
    expect((await db.expertInvite.findUniqueOrThrow({ where: { id: invite.id } })).acceptedUserId).toBe(user.id);
    // Decided once.
    expect(await decideExpertApplication(operator(), id.meeraApp!, { decision: "REFUSE", reason: "DUPLICATE" })).toEqual({ ok: false, errorKey: "expertApply.alreadyDecided" });
  });

  it("an address that already has an account gets no second one: the invitation, and the profile from the application at acceptance", async () => {
    __setHeaders({ "x-forwarded-for": `${ADDRESS}-c` });
    const made = await submitExpertApplication(body({ email: mail("teacher"), name: "ZZ Teacher Applicant", headline: "ZZ physics teacher and olympiad coach", specialisms: ["OLYMPIADS", "SCIENCE"], offering: "BOTH" }), PDF(), "en");
    expect(made.ok).toBe(true);
    if (!made.ok) return;
    const decided = await decideExpertApplication(operator(), made.id, { decision: "APPROVE" });
    expect(decided).toMatchObject({ ok: true, status: "APPROVED", userId: null });
    expect(await db.user.count({ where: { email: mail("teacher") } })).toBe(1);
    expect(await db.expertProfile.count({ where: { userId: id.teacher } })).toBe(0);
    const sent = await db.outboundEmail.findFirstOrThrow({ where: { to: mail("teacher"), purpose: "INVITE" }, orderBy: { createdAt: "desc" } });
    const token = /\/expert\/invite\/([A-Za-z0-9_-]+)/.exec(sent.text)![1]!;
    // Signed in as themselves, the owner of the account attaches the profile: made from the application, not the form.
    await acceptExpertInvite(token, { userId: id.teacher! }, { headline: "typed on the form" });
    const profile = await db.expertProfile.findUniqueOrThrow({ where: { userId: id.teacher } });
    expect(profile).toMatchObject({ headline: "ZZ physics teacher and olympiad coach", offering: "BOTH", publishedAt: null, kycStatus: "NONE" });
    expect(JSON.parse(profile.specialisms)).toEqual(["Olympiads and competitions", "Science"]);
    // Approving another application for an address that is now an expert's is refused for the duplicate it is.
    await db.expertApplication.create({ data: { name: "ZZ Again", email: mail("teacher"), phone: "+919876500002", city: "Pune", headline: "ZZ again", yearsExperience: 1, bio: "ZZ fixture applying a second time.", offering: "BOTH", declarationAt: new Date() } });
    const again = await db.expertApplication.findFirstOrThrow({ where: { email: mail("teacher"), status: "PENDING" } });
    expect(await decideExpertApplication(operator(), again.id, { decision: "APPROVE" })).toEqual({ ok: false, errorKey: "expertApply.addressIsExpert" });
  });

  it("a refusal needs a reason, OTHER a note, and tells the applicant in their language; the door answers 200", async () => {
    const asha = await db.expertApplication.findFirstOrThrow({ where: { email: mail("asha") } });
    expect(await decideExpertApplication(operator(), asha.id, { decision: "REFUSE" })).toEqual({ ok: false, errorKey: "expertApply.needReason" });
    expect(await decideExpertApplication(operator(), asha.id, { decision: "REFUSE", reason: "OTHER", note: "  " })).toEqual({ ok: false, errorKey: "expertApply.needNote" });
    await db.expertApplication.update({ where: { id: asha.id }, data: { locale: "mr" } });
    await createSession(id.operator!);
    const response = await decidePost(
      new Request("http://localhost/x", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ decision: "REFUSE", reason: "OTHER", note: "ZZ please apply once your mentoring course ends" }) }),
      { params: Promise.resolve({ id: asha.id }) },
    );
    expect(response.status).toBe(200);
    expect(operatorExpertApplicationDecidedSchema.parse(await response.json())).toEqual({ ok: true, status: "REFUSED", userId: null, inviteSent: false });
    __resetCookies();
    expect(await db.expertApplication.findUniqueOrThrow({ where: { id: asha.id } })).toMatchObject({ status: "REFUSED", refusalCode: "OTHER", refusalNote: "ZZ please apply once your mentoring course ends", decidedByUserId: id.operator });
    const told = await db.outboundEmail.findFirstOrThrow({ where: { to: mail("asha"), purpose: "EXPERT_APPLICATION" }, orderBy: { createdAt: "desc" } });
    const mr = translator("mr");
    expect(told.subject).toBe(mr("expertApply.mailRefusedSubject"));
    expect(told.text).toContain(mr("expertApply.mailReasonOTHER"));
    expect(told.text).toContain("ZZ please apply once your mentoring course ends");
    expect(await db.user.count({ where: { email: mail("asha") } })).toBe(0);
    expect(await db.auditLog.count({ where: { action: "operator.expertApplication.refuse", targetId: asha.id } })).toBe(1);
    // A refused applicant may apply again: the one-waiting rule is for PENDING only.
    __setHeaders({ "x-forwarded-for": `${ADDRESS}-d` });
    expect(await submitExpertApplication(body({ email: mail("asha"), name: "ZZ Asha Rao" }), PDF(), "en")).toMatchObject({ ok: true });
  });
});
