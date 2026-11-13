/**
 * A school's published website: six findings of the testing analysis of 13 November 2026, each held by a case that
 * fails while the defect stands.
 *
 *   TA-394  A review link opened the draft's pictures only when the draft's JSON named the file, so its news pictures
 *           (named by post id) and a first draft never saved were broken images to the reviewer.
 *   TA-224  A post taken down after publishing stayed on the public site, words and picture, until an unrelated number
 *           changed: the nightly refresh's signature held neither the news nor the pictures.
 *   TA-226  The enquiry form answered "no website here" when the home page's Admissions section was off, though the
 *           Admissions and Contact pages still drew the form.
 *   TA-397  The head's name under the message was held to a role: the office could rewrite the message under the
 *           head's name, or restore a version with the tick after the head took it off.
 *   TA-228  A school the operator removed kept its public website, its enquiry form and its public pictures, and a
 *           named admissions contact who had left was still told of each enquiry.
 *
 * As tests/site-flow.test.ts: the owner connection, two scratch ZZ schools of this suite's own with their own people,
 * posts and LIVE domains (the stamp in every name), removed afterwards.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { createSession, getSession, type ActiveContext } from "@/lib/session";
import { __resetCookies, __setHeaders } from "../tests/stubs/next-headers";
import { publishSite, restoreSiteVersion, saveSite } from "@/lib/site-admin";
import { publishedSiteFor, refreshPublishedSites } from "@/lib/site-publish";
import { createSiteShare, siteReviewFileOpen } from "@/lib/site-share";
import { removeContent } from "@/lib/safety";
import { removeSchool } from "@/lib/superuser";
import { authorizeFileRead } from "@/lib/files";
import { forgetSiteHosts } from "@/lib/site-hosts";
import { GET as hostGet } from "@/app/sites/by-host/[host]/route";
import { POST as hostEnquiryPost } from "@/app/sites/by-host/[host]/enquiry/route";

const db = new PrismaClient();
const STAMP = Date.now();
const MAIL = (who: string) => `zz-taws-${who}-${STAMP}@test.invalid`;
const PIC_A = `zz-taws-pic-a-${STAMP}`;
const PIC_B = `zz-taws-pic-b-${STAMP}`;
const PIC_R = `zz-taws-pic-r-${STAMP}`;
const DOMAIN = `www.zz-taws-main-${STAMP}.test`;
const DOMAIN_R = `www.zz-taws-gone-${STAMP}.test`;
const ids = { school: "", gone: "", admin: "", head: "", goneAdmin: "", leaver: "", leaverMembership: "", operator: "", postA: "", postB: "", postR: "" };

async function as(userId: string, role: string | null, schoolId: string | null): Promise<ActiveContext> {
  __resetCookies();
  __setHeaders({});
  await createSession(userId, { schoolId, role: role as never });
  const ctx = await getSession();
  if (!ctx) throw new Error("no session");
  return ctx;
}
function signedOut() {
  __resetCookies();
  __setHeaders({});
}
const hostParams = (host: string) => ({ params: Promise.resolve({ host }) });
const page = (host: string) => hostGet(new Request("http://localhost/", { headers: { host } }), hostParams(host));
const enquire = (host: string, name: string) =>
  hostEnquiryPost(
    new Request("http://localhost/enquiry", { method: "POST", headers: { host, "content-type": "application/x-www-form-urlencoded", referer: `https://${host}/` }, body: new URLSearchParams({ name, contact: `${name.replace(/\s/g, "").toLowerCase()}@zz-taws.test`, grade: "5", message: "Is there a seat?", lang: "en" }) }),
    hostParams(host),
  );

const ON = (codes: string[]) => ["NUMBERS", "NEWS", "GALLERY", "ADMISSIONS", "CONTACT"].map((code) => ({ code, on: codes.includes(code) })) as never;

beforeAll(async () => {
  const school = (key: string) =>
    db.school.create({ data: { name: `ZZ TA Site ${key} ${STAMP}`, slug: `zz-taws-${key.toLowerCase()}-${STAMP}`, code: `ZTWS${key[0]}${String(STAMP).slice(-6)}`, contactEmail: MAIL(`office-${key}`), timezone: "Asia/Kolkata", profileAbout: "A ZZ school for the website findings.", isTestFixture: true }, select: { id: true } });
  ids.school = (await school("Main")).id;
  ids.gone = (await school("Gone")).id;
  await db.schoolModule.createMany({ data: [{ schoolId: ids.school, module: "WEBSITE" }, { schoolId: ids.gone, module: "WEBSITE" }] });
  const user = (who: string, extra: object = {}) => db.user.create({ data: { name: `ZZ TA Site ${who}`, email: MAIL(who.toLowerCase()), isTestFixture: true, ...extra }, select: { id: true } });
  ids.admin = (await user("Admin")).id;
  ids.head = (await user("Head")).id;
  ids.goneAdmin = (await user("GoneAdmin")).id;
  ids.leaver = (await user("Leaver")).id;
  ids.operator = (await user("Operator", { isSuperuser: true })).id;
  await db.membership.createMany({
    data: [
      { userId: ids.admin, schoolId: ids.school, role: "ADMIN", status: "ACTIVE" },
      { userId: ids.head, schoolId: ids.school, role: "PRINCIPAL", status: "ACTIVE" },
      { userId: ids.goneAdmin, schoolId: ids.gone, role: "ADMIN", status: "ACTIVE" },
    ],
  });
  // A teacher who has left (status still ACTIVE, leftAt stamped), named as the admissions contact.
  ids.leaverMembership = (await db.membership.create({ data: { userId: ids.leaver, schoolId: ids.gone, role: "TEACHER", status: "ACTIVE", leftAt: new Date(Date.now() - 86_400_000) }, select: { id: true } })).id;
  await db.school.update({ where: { id: ids.gone }, data: { admissionsContactMembershipId: ids.leaverMembership } });
  const post = (schoolId: string, title: string, fileId: string) =>
    db.post.create({ data: { schoolId, authorUserId: ids.admin, scope: "SCHOOL", title, body: `${title}, in words.`, media: JSON.stringify([{ fileId, kind: "image", alt: `${title} picture` }]), status: "APPROVED" }, select: { id: true } });
  ids.postA = (await post(ids.school, `ZZ TA Sports day ${STAMP}`, PIC_A)).id;
  ids.postB = (await post(ids.school, `ZZ TA Science fair ${STAMP}`, PIC_B)).id;
  ids.postR = (await post(ids.gone, `ZZ TA Gone news ${STAMP}`, PIC_R)).id;
});

afterAll(async () => {
  signedOut();
  const schools = [ids.school, ids.gone];
  await db.notification.deleteMany({ where: { schoolId: { in: schools } } });
  await db.auditLog.deleteMany({ where: { OR: [{ schoolId: { in: schools } }, { targetId: { in: schools } }] } });
  await db.session.deleteMany({ where: { user: { email: { contains: `-${STAMP}@test.invalid` } } } });
  await db.schoolRecord.deleteMany({ where: { schoolId: { in: schools } } });
  await db.school.deleteMany({ where: { id: { in: schools } } });
  await db.user.deleteMany({ where: { email: { contains: `-${STAMP}@test.invalid` } } });
  await db.$disconnect();
  forgetSiteHosts();
});

describe("TA-394: a review link opens the draft's news pictures", () => {
  it("TA-394: opens the first picture of a news post of a first draft that was never saved", async () => {
    expect(await db.schoolSite.count({ where: { schoolId: ids.school } })).toBe(0);
    const { url } = await createSiteShare(await as(ids.admin, "ADMIN", ids.school), 1);
    const token = url.split("/").pop()!;
    signedOut();
    expect(await siteReviewFileOpen(PIC_A, token)).toBe(true);
    expect(await siteReviewFileOpen(`zz-taws-unknown-${STAMP}`, token)).toBe(false);
  });

  it("TA-394: opens a news post's picture the saved draft names by post id only", async () => {
    const saved = await saveSite(await as(ids.admin, "ADMIN", ids.school), { newsPostIds: [ids.postB], gallery: [], sections: ON(["NEWS", "ADMISSIONS", "CONTACT"]) });
    expect(saved.ok).toBe(true);
    const { url } = await createSiteShare(await as(ids.admin, "ADMIN", ids.school), 1);
    signedOut();
    expect(await siteReviewFileOpen(PIC_B, url.split("/").pop()!)).toBe(true);
  });
});

describe("TA-224: a post taken down leaves the public site", () => {
  it("TA-224: drops the post's words and picture once the post is removed in the Safety Centre", async () => {
    const saved = await saveSite(await as(ids.admin, "ADMIN", ids.school), {
      newsPostIds: [ids.postA],
      gallery: [{ postId: ids.postA, fileId: PIC_A, consent: true }],
      sections: ON(["NEWS", "GALLERY", "ADMISSIONS", "CONTACT"]),
    });
    expect(saved.ok).toBe(true);
    await publishSite(await as(ids.admin, "ADMIN", ids.school));
    await db.schoolSiteDomain.create({ data: { schoolId: ids.school, domain: DOMAIN, status: "LIVE", verifiedAt: new Date(), createdByUserId: ids.admin } });
    forgetSiteHosts();
    // Arrange: the post is on the live site and its picture is public.
    expect((await publishedSiteFor(ids.school))?.html.en).toContain(`ZZ TA Sports day ${STAMP}`);
    expect(await authorizeFileRead(PIC_A, null)).toMatchObject({ allowed: true, public: true });

    await removeContent(await as(ids.admin, "ADMIN", ids.school), { targetType: "POST", targetId: ids.postA, note: "Taken down at a parent's request." });
    await refreshPublishedSites(new Date(), { schoolIds: [ids.school] });

    const live = await publishedSiteFor(ids.school);
    expect(live).not.toBeNull();
    expect(live!.html.en).not.toContain(`ZZ TA Sports day ${STAMP}`);
    for (const html of Object.values(live!.pages)) expect(html.en).not.toContain(`ZZ TA Sports day ${STAMP}`);
    expect(await authorizeFileRead(PIC_A, null)).toMatchObject({ allowed: false });
  });
});

describe("TA-226: the enquiry form wherever the published site draws it", () => {
  it("TA-226: takes an enquiry from the Admissions page while the home page's Admissions section is off", async () => {
    // The post taken down above leaves the draft (a draft naming it would not save).
    const saved = await saveSite(await as(ids.admin, "ADMIN", ids.school), { newsPostIds: [ids.postB], gallery: [], enquiryForm: true, admissionsText: "Forms open in January.", sections: ON(["NEWS", "CONTACT"]) });
    expect(saved.ok).toBe(true);
    await publishSite(await as(ids.admin, "ADMIN", ids.school));
    // Arrange: the Admissions page is published and carries the form.
    const live = await publishedSiteFor(ids.school);
    expect(live?.pages.admissions?.en).toContain('action="/enquiry"');
    forgetSiteHosts();
    signedOut();
    const res = await enquire(DOMAIN, "ZZ TA Parent");
    expect(res.status).toBe(200);
    expect(await db.schoolSiteEnquiry.count({ where: { schoolId: ids.school, name: "ZZ TA Parent" } })).toBe(1);
  });

  it("TA-226: still refuses when the published site draws no form at all", async () => {
    const saved = await saveSite(await as(ids.admin, "ADMIN", ids.school), { enquiryForm: false });
    expect(saved.ok).toBe(true);
    await publishSite(await as(ids.admin, "ADMIN", ids.school));
    signedOut();
    expect((await enquire(DOMAIN, "ZZ TA Nobody")).status).toBe(404);
    expect(await db.schoolSiteEnquiry.count({ where: { schoolId: ids.school, name: "ZZ TA Nobody" } })).toBe(0);
  });
});

describe("TA-397: the head's name stays the head's choice", () => {
  it("TA-397: an office that rewrites the message takes the head's name off it", async () => {
    expect(await saveSite(await as(ids.head, "PRINCIPAL", ids.school), { principalMessage: "Welcome, from the head.", principalNamed: true })).toMatchObject({ ok: true });
    const saved = await saveSite(await as(ids.admin, "ADMIN", ids.school), { principalMessage: "Words the head never saw." });
    expect(saved.ok).toBe(true);
    if (!saved.ok) return;
    expect(saved.config.principalMessage).toBe("Words the head never saw.");
    expect(saved.config.principalNamed).toBe(false);
    // The office may still save other fields while the head's tick stands.
    expect(await saveSite(await as(ids.head, "PRINCIPAL", ids.school), { principalMessage: "Welcome, from the head.", principalNamed: true })).toMatchObject({ ok: true });
    const other = await saveSite(await as(ids.admin, "ADMIN", ids.school), { motto: "Learning together" });
    expect(other).toMatchObject({ ok: true, config: { principalNamed: true } });
  });

  it("TA-397: an office that restores a version with the tick, after the head took it off, does not bring the name back", async () => {
    const ticked = await publishSite(await as(ids.head, "PRINCIPAL", ids.school));
    expect(await saveSite(await as(ids.head, "PRINCIPAL", ids.school), { principalNamed: false })).toMatchObject({ ok: true, config: { principalNamed: false } });
    const restored = await restoreSiteVersion(await as(ids.admin, "ADMIN", ids.school), ticked.versionId);
    expect(restored.principalNamed).toBe(false);
    // The head restoring it is the head's own choice.
    expect((await restoreSiteVersion(await as(ids.head, "PRINCIPAL", ids.school), ticked.versionId)).principalNamed).toBe(true);
  });
});

describe("TA-228: a removed school's website", () => {
  it("TA-228: tells the school's admins, not a named admissions contact who has left", async () => {
    const saved = await saveSite(await as(ids.goneAdmin, "ADMIN", ids.gone), {
      newsPostIds: [ids.postR],
      gallery: [{ postId: ids.postR, fileId: PIC_R, consent: true }],
      enquiryForm: true,
      sections: ON(["NEWS", "GALLERY", "ADMISSIONS", "CONTACT"]),
    });
    expect(saved.ok).toBe(true);
    await publishSite(await as(ids.goneAdmin, "ADMIN", ids.gone));
    await db.schoolSiteDomain.create({ data: { schoolId: ids.gone, domain: DOMAIN_R, status: "LIVE", verifiedAt: new Date(), createdByUserId: ids.goneAdmin } });
    forgetSiteHosts();
    signedOut();
    expect((await enquire(DOMAIN_R, "ZZ TA Early")).status).toBe(200);
    expect(await db.notification.count({ where: { userId: ids.leaver, schoolId: ids.gone, kind: "ENQUIRY" } })).toBe(0);
    expect(await db.notification.count({ where: { userId: ids.goneAdmin, schoolId: ids.gone, kind: "ENQUIRY" } })).toBe(1);
  });

  it("TA-228: takes the site, its form and its pictures down when the operator removes the school", async () => {
    signedOut();
    expect((await page(DOMAIN_R)).status).toBe(200);
    expect(await authorizeFileRead(PIC_R, null)).toMatchObject({ allowed: true });
    expect(await removeSchool(await as(ids.operator, null, null), ids.gone)).toEqual({ ok: true });
    forgetSiteHosts();
    signedOut();
    expect(await publishedSiteFor(ids.gone)).toBeNull();
    expect((await page(DOMAIN_R)).status).toBe(404);
    expect((await enquire(DOMAIN_R, "ZZ TA Late")).status).toBe(404);
    expect(await db.schoolSiteEnquiry.count({ where: { schoolId: ids.gone, name: "ZZ TA Late" } })).toBe(0);
    expect(await authorizeFileRead(PIC_R, null)).toMatchObject({ allowed: false });
    expect(await refreshPublishedSites(new Date(), { schoolIds: [ids.gone] })).toMatchObject({ refreshed: 0, failed: 0 });
    expect(await db.schoolSiteVersion.count({ where: { schoolId: ids.gone, liveAt: { not: null } } })).toBe(0);
  });

  it("TA-228: a school removed before removeSchool took sites down: its pictures are refused and the refresh takes the site down", async () => {
    // As removeSchool left a removed school before this fix: removedAt stamped and a version still live.
    const latest = await db.schoolSiteVersion.findFirst({ where: { schoolId: ids.gone }, orderBy: { renderedAt: "desc" }, select: { id: true } });
    expect(latest).not.toBeNull();
    await db.schoolSiteVersion.update({ where: { id: latest!.id }, data: { liveAt: new Date() } });
    await db.schoolSite.updateMany({ where: { schoolId: ids.gone }, data: { publishedVersionId: latest!.id } });
    expect((await db.school.findUnique({ where: { id: ids.gone }, select: { removedAt: true } }))?.removedAt).not.toBeNull();
    signedOut();
    expect(await authorizeFileRead(PIC_R, null)).toMatchObject({ allowed: false });
    expect(await publishedSiteFor(ids.gone)).toBeNull();
    expect(await refreshPublishedSites(new Date(), { schoolIds: [ids.gone] })).toMatchObject({ checked: 1, refreshed: 0, failed: 0 });
    expect(await db.schoolSiteVersion.count({ where: { schoolId: ids.gone, liveAt: { not: null } } })).toBe(0);
    expect((await db.schoolSite.findFirst({ where: { schoolId: ids.gone }, select: { publishedVersionId: true } }))?.publishedVersionId).toBeNull();
  });
});
