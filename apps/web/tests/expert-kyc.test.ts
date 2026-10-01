import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { expertKycSchema, okSchema } from "@edulink/contracts";
import { decideKyc, readKyc, submitKyc } from "@/lib/expert-kyc";
import { authorizeFileRead } from "@/lib/files";
import { getOwnProfile, listMarketplace } from "@/lib/experts";
import { listExpertsForCuration, setExpertStanding } from "@/lib/superuser";
import { AccessError } from "@/lib/tenancy";
import { createSession } from "@/lib/session";
import { __resetCookies } from "../tests/stubs/next-headers";
import { GET as kycGet, POST as kycPost } from "@/app/api/v1/expert/kyc/route";
import { POST as decidePost } from "@/app/api/v1/operator/experts/[profileId]/kyc/route";
import type { ActiveContext } from "@/lib/session";

/**
 * KYC: an expert sends identity papers through the upload-ticket pipeline
 * (their own tickets, unspent — never a file they merely saw), the operator
 * verifies or rejects with a reason, the expert is told, and the marketplace
 * badge follows ONE truth: `kycStatus === "VERIFIED"`, which the older
 * "mark identity checked" keeps in step. The stored ids open through
 * files.ts to the expert and the operator alone: another expert, a school's
 * admin, are 404.
 */
const db = new PrismaClient();
const STAMP = Date.now();
let schoolId = "";
const id: Record<string, string> = {};
const member: Record<string, string> = {};
const profile: Record<string, string> = {};
const fileA = `zz-kyc-a-${STAMP}.pdf`;
const fileB = `zz-kyc-b-${STAMP}.png`;
const fileOther = `zz-kyc-other-${STAMP}.pdf`;
const fileSpent = `zz-kyc-spent-${STAMP}.pdf`;

const ctx = (key: string, role: ActiveContext["role"], school: string | null, flags: { isSuperuser?: boolean } = {}): ActiveContext =>
  ({ sessionId: "test", membershipId: member[key] ?? null, schoolId: school, role, user: { id: id[key]!, name: key, preferredName: null, email: null, avatarKey: null, isMinor: false, isSuperuser: Boolean(flags.isSuperuser), isAppAdmin: false } }) as ActiveContext;
const expert = () => ctx("expert", "EXPERT", null);
const other = () => ctx("other", "EXPERT", null);
const operator = () => ctx("operator", null, null, { isSuperuser: true });
const admin = () => ctx("admin", "ADMIN", schoolId);

const params = (profileId: string) => ({ params: Promise.resolve({ profileId }) });
const send = (path: string, body: unknown) => new Request(`http://localhost${path}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });

beforeAll(async () => {
  const s = await db.school.create({ data: { name: `ZZ KYC School ${STAMP}`, slug: `zz-kyc-${STAMP}`, code: `ZZK${String(STAMP).slice(-7)}`, contactEmail: `zz-kyc-${STAMP}@test.invalid`, isTestFixture: true }, select: { id: true } });
  schoolId = s.id;
  const person = async (key: string, role: string | null, flags: Record<string, unknown> = {}) => {
    const user = await db.user.create({ data: { name: `ZZ ${key} ${STAMP}`, email: `zz-kyc-${key}-${STAMP}@test.invalid`, ...flags }, select: { id: true } });
    id[key] = user.id;
    if (role) member[key] = (await db.membership.create({ data: { userId: user.id, schoolId, role, status: "ACTIVE" }, select: { id: true } })).id;
  };
  await person("expert", null);
  await person("other", null);
  await person("admin", "ADMIN");
  await person("operator", null, { isSuperuser: true });
  profile.expert = (await db.expertProfile.create({ data: { userId: id.expert!, headline: "ZZ KYC expert", offering: "BOTH", publishedAt: new Date() }, select: { id: true } })).id;
  profile.other = (await db.expertProfile.create({ data: { userId: id.other!, headline: "ZZ Other expert", offering: "BOTH", publishedAt: new Date() }, select: { id: true } })).id;
  await db.uploadTicket.createMany({
    data: [
      { userId: id.expert!, fileId: fileA, mime: "application/pdf", size: 1200 },
      { userId: id.expert!, fileId: fileB, mime: "image/png", size: 800 },
      { userId: id.expert!, fileId: fileSpent, mime: "application/pdf", size: 10, consumedAt: new Date() },
      { userId: id.other!, fileId: fileOther, mime: "application/pdf", size: 900 },
    ],
  });
});

afterAll(async () => {
  __resetCookies();
  const users = Object.values(id);
  await db.session.deleteMany({ where: { userId: { in: users } } });
  await db.uploadTicket.deleteMany({ where: { fileId: { in: [fileA, fileB, fileOther, fileSpent] } } });
  await db.auditLog.deleteMany({ where: { actorUserId: { in: users } } }).catch(() => {});
  await db.notification.deleteMany({ where: { userId: { in: users } } });
  await db.outboundEmail.deleteMany({ where: { to: { contains: `-${STAMP}@test.invalid` } } });
  await db.school.deleteMany({ where: { id: schoolId } });
  await db.user.deleteMany({ where: { id: { in: users } } });
  await db.$disconnect();
});

describe("expert KYC", () => {
  it("starts at NONE with nothing to show; another expert's ticket, a spent ticket and an empty list are refused; the expert's own two are taken and their tickets spent", async () => {
    expect(await readKyc(expert())).toMatchObject({ status: "NONE", documents: [], canSubmit: true, submittedAt: null });
    await expect(submitKyc(expert(), { documentIds: [fileOther] })).rejects.toMatchObject({ key: "access.fileNotYours" });
    await expect(submitKyc(expert(), { documentIds: [fileSpent] })).rejects.toMatchObject({ key: "access.fileNotYours" });
    await expect(submitKyc(expert(), { documentIds: [] })).rejects.toBeInstanceOf(AccessError);
    await expect(submitKyc(admin(), { documentIds: [fileA] })).rejects.toMatchObject({ key: "access.notAnExpert" });
    await submitKyc(expert(), { documentIds: [fileA, fileB], note: "ZZ passport and a utility bill" });
    const view = await readKyc(expert());
    expect(view).toMatchObject({ status: "SUBMITTED", note: "ZZ passport and a utility bill", canSubmit: true });
    expect(view.submittedAt).not.toBeNull();
    expect(view.documents.map((d) => d.fileId)).toEqual([fileA, fileB]);
    expect(view.documents[0]).toMatchObject({ mime: "application/pdf", size: 1200 });
    expect((await db.uploadTicket.findMany({ where: { fileId: { in: [fileA, fileB] } }, select: { consumedAt: true } })).every((t) => t.consumedAt !== null)).toBe(true);
    // Sending again keeps the same ids without needing a fresh ticket, and the operator's queue carries the papers.
    await submitKyc(expert(), { documentIds: [fileA], note: "ZZ just the passport" });
    expect((await readKyc(expert())).documents.map((d) => d.fileId)).toEqual([fileA]);
    const queue = await listExpertsForCuration(operator());
    expect(queue.find((e) => e.profileId === profile.expert)?.kyc).toMatchObject({ status: "SUBMITTED", note: "ZZ just the passport", documents: [{ fileId: fileA }] });
    expect(await db.auditLog.count({ where: { actorUserId: id.expert, action: "expert.kyc.submit" } })).toBe(2);
  });

  it("the file read rule: the expert 200, a superuser 200, another expert 404, a school's admin 404, signed out 401", async () => {
    expect(await authorizeFileRead(fileA, expert())).toEqual({ allowed: true, kind: "kyc", public: false });
    expect(await authorizeFileRead(fileA, operator())).toEqual({ allowed: true, kind: "kyc", public: false });
    expect(await authorizeFileRead(fileA, other())).toEqual({ allowed: false, reason: "not-found" });
    expect(await authorizeFileRead(fileA, admin())).toEqual({ allowed: false, reason: "not-found" });
    expect(await authorizeFileRead(fileA, null)).toEqual({ allowed: false, reason: "unauthenticated" });
    // An id no profile names is nobody's, superuser or not.
    expect(await authorizeFileRead(fileB, operator())).toEqual({ allowed: false, reason: "not-found" });
  });

  it("the operator decides: a rejection needs its reason and tells the expert; nobody else may decide", async () => {
    await expect(decideKyc(admin(), profile.expert!, { decision: "REJECTED", note: "x" })).rejects.toBeInstanceOf(AccessError);
    expect(await decideKyc(operator(), profile.expert!, { decision: "REJECTED", note: "  " })).toEqual({ ok: false, errorKey: "expert.kycNeedReason" });
    expect(await decideKyc(operator(), "nope", { decision: "VERIFIED" })).toEqual({ ok: false, errorKey: "root.noSuchExpert" });
    expect(await decideKyc(operator(), profile.other!, { decision: "VERIFIED" })).toEqual({ ok: false, errorKey: "expert.kycNothingSent" });
    expect(await decideKyc(operator(), profile.expert!, { decision: "REJECTED", note: "ZZ the scan is unreadable" })).toEqual({ ok: true });
    const view = await readKyc(expert());
    expect(view).toMatchObject({ status: "REJECTED", note: "ZZ the scan is unreadable", canSubmit: true });
    expect(view.decidedAt).not.toBeNull();
    expect((await getOwnProfile(expert())).verified).toBe(false);
    // Told by mail (the devbox transport keeps it): the reason in the body and a door to the profile.
    const told = await db.outboundEmail.findFirst({ where: { to: `zz-kyc-expert-${STAMP}@test.invalid`, purpose: "EXPERT_KYC" }, orderBy: { createdAt: "desc" }, select: { subject: true, text: true } });
    expect(told?.subject).toBe("Your identity papers were not accepted");
    expect(told?.text).toContain("ZZ the scan is unreadable");
    expect(told?.text).toContain("/expert/profile");
    // …and in the app: one notice of their own that belongs to no school (an expert has none), keyed so the page can say it again in their language.
    const notice = await db.notification.findMany({ where: { userId: id.expert }, select: { schoolId: true, kind: true, title: true, body: true, titleKey: true, bodyKey: true, url: true, readAt: true } });
    expect(notice).toEqual([{ schoolId: null, kind: "EXPERT", title: "Your identity papers were not accepted", body: "The operator wrote: ZZ the scan is unreadable", titleKey: "expert.kycRejectedNotif", bodyKey: "expert.kycRejectedNotifBody", url: "/expert/profile", readAt: null }]);
    // Nobody else is told: not the other expert, not the operator who decided.
    expect(await db.notification.count({ where: { userId: { in: [id.other!, id.operator!] } } })).toBe(0);
  });

  it("verified sets the one badge the marketplace reads, and a later 'take off the list' puts the papers back in the queue rather than leaving the columns apart", async () => {
    expect(await decideKyc(operator(), profile.expert!, { decision: "VERIFIED" })).toEqual({ ok: true });
    expect(await readKyc(expert())).toMatchObject({ status: "VERIFIED", canSubmit: false });
    await expect(submitKyc(expert(), { documentIds: [fileA] })).rejects.toMatchObject({ key: "expert.kycAlreadyVerified" });
    expect((await getOwnProfile(expert())).verified).toBe(true);
    expect((await listMarketplace(admin())).find((e) => e.id === profile.expert)?.verified).toBe(true);
    const row = await db.expertProfile.findUniqueOrThrow({ where: { id: profile.expert! }, select: { verifiedAt: true, verifiedBy: true } });
    expect(row.verifiedAt).not.toBeNull();
    expect(row.verifiedBy).toBe(id.operator);
    expect(await db.outboundEmail.count({ where: { to: `zz-kyc-expert-${STAMP}@test.invalid`, subject: "Your identity has been verified" } })).toBe(1);
    expect(await db.notification.count({ where: { userId: id.expert, schoolId: null, titleKey: "expert.kycVerifiedNotif", title: "Your identity has been verified" } })).toBe(1);
    expect(await db.auditLog.count({ where: { actorUserId: id.operator, action: { in: ["expert.kyc.verify", "expert.kyc.reject"] } } })).toBe(2);

    // The older door, the other way round: off the list clears the badge and the status returns to the queue with its papers.
    expect(await setExpertStanding(operator(), profile.expert!, { published: false, verified: false })).toEqual({ ok: true });
    expect(await readKyc(expert())).toMatchObject({ status: "SUBMITTED", documents: [{ fileId: fileA }] });
    expect((await db.expertProfile.findUniqueOrThrow({ where: { id: profile.expert! } })).verifiedAt).toBeNull();
    // And "list and check" on the other expert, who sent nothing, is a VERIFIED standing in both columns.
    expect(await setExpertStanding(operator(), profile.other!, { published: true, verified: true })).toEqual({ ok: true });
    expect(await readKyc(other())).toMatchObject({ status: "VERIFIED" });
    expect((await listMarketplace(admin())).find((e) => e.id === profile.other)?.verified).toBe(true);
  });

  it("through the doors: GET and POST /api/v1/expert/kyc as the expert, 403 for an admin; the operator's decision 403 for the expert", async () => {
    __resetCookies();
    await createSession(id.expert!, { role: "EXPERT" });
    const got = await kycGet();
    expect(got.status).toBe(200);
    expect(expertKycSchema.parse(await got.json())).toMatchObject({ status: "SUBMITTED" });
    const empty = await kycPost(send("/api/v1/expert/kyc", {}));
    expect(empty.status).toBe(422);
    const notMine = await kycPost(send("/api/v1/expert/kyc", { documentIds: [fileOther] }));
    expect(notMine.status).toBe(404);
    const decided = await decidePost(send(`/api/v1/operator/experts/${profile.expert}/kyc`, { decision: "VERIFIED" }), params(profile.expert!));
    expect(decided.status).toBe(403);

    __resetCookies();
    await createSession(id.admin!, { schoolId, role: "ADMIN" });
    expect((await kycGet()).status).toBe(403);

    __resetCookies();
    await createSession(id.operator!);
    const verified = await decidePost(send(`/api/v1/operator/experts/${profile.expert}/kyc`, { decision: "VERIFIED" }), params(profile.expert!));
    expect(verified.status).toBe(200);
    expect(okSchema.parse(await verified.json())).toEqual({ ok: true });
    const refused = await decidePost(send(`/api/v1/operator/experts/${profile.expert}/kyc`, { decision: "REJECTED", note: "" }), params(profile.expert!));
    expect(refused.status).toBe(422);
    expect((await decidePost(send("/api/v1/operator/experts/nope/kyc", { decision: "VERIFIED" }), params("nope"))).status).toBe(404);
    __resetCookies();
  });
});
