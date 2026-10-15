/**
 * A school's public website, the flow half (website-builder A, 15 October 2026).
 *
 * The renderer is pure, so its four templates are snapshotted from one fixture draft, and the rules every
 * template must keep (no script, a skip link, one h1, alt text on every picture, escaped words) are asserted
 * outright. Then one ZZ school of this suite's own walks the library: the aggregate numbers, the draft's
 * checks (a foreign post, an http map link, the consent stamp, the head's own name tick), Publish, the office's own
 * view by slug and the public site on the school's own LIVE domain (16 Oct 2026: never by slug to anybody else),
 * the file route opening a consented picture, the enquiry form on the domain, the nightly refresh, and Unpublish
 * and the module switch answering 404 with noindex. Every row it makes is its own school's.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import type { SiteConfig } from "@edulink/contracts";
import { createSession, getSession } from "@/lib/session";
import { __resetCookies, __setHeaders } from "../tests/stubs/next-headers";
import { AccessError, ModuleOffError } from "@/lib/access-error";
import { renderSite, escapeHtml, tint, type SiteData } from "@/lib/site-render";
import { defaultSiteConfig, repairSiteConfig, isPhoneish, isEmailish } from "@/lib/site-config";
import { dominantColour, nearestSwatch } from "@/lib/site-logo-colour";
import { siteMetrics } from "@/lib/site-metrics";
import { loadSite, publishSite, saveSite, siteEnquiries, unpublishSite, previewHtml } from "@/lib/site-admin";
import { publishedSiteFor, refreshPublishedSites, schoolIdForSlug } from "@/lib/site-publish";
import { authorizeFileRead } from "@/lib/files";
import { actionKey } from "@/lib/safety-labels";
import { todayKey } from "@/lib/dates";
import { forgetSiteHosts } from "@/lib/site-hosts";
import { GET as siteGet } from "@/app/sites/[slug]/route";
import { GET as hostGet } from "@/app/sites/by-host/[host]/route";
import { GET as hostEnquiryGet, POST as hostEnquiryPost } from "@/app/sites/by-host/[host]/enquiry/route";
import { GET as adminSiteGet } from "@/app/api/v1/admin/site/route";

const db = new PrismaClient();
const STAMP = Date.now();
const SLUG = `zz-site-${STAMP}`;
const PIC = `zz-site-pic-${STAMP}`;
const ids = { school: "", other: "", admin: "", head: "", teacher: "", otherAdmin: "", pupil1: "", pupil2: "", klass: "", post: "", otherPost: "" };
/** The school's own domain, made LIVE by hand once the suite has published (the domain flow is site-domains.test.ts's). */
const DOMAIN = `www.zz-site-${STAMP}.test`;

async function as(userId: string, role: string, schoolId: string) {
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
const params = (slug: string) => ({ params: Promise.resolve({ slug }) });
const hostParams = (host: string) => ({ params: Promise.resolve({ host }) });
const bySlug = (query = "") => siteGet(new Request(`http://localhost/sites/${SLUG}${query}`), params(SLUG));

/* ------------------------------------------------------------------------------------------------ */
/* The pure parts                                                                                  */
/* ------------------------------------------------------------------------------------------------ */

const FIXTURE_CONFIG: SiteConfig = {
  ...defaultSiteConfig({ locale: "en", profileAbout: "A school by the river.\n\nWe teach <b>everyone</b> & we mean it.", addressLine: "1 River Road", city: "Pune", region: "Maharashtra", postalCode: "411001", contactEmail: "office@zz-river.test", contactPhone: "+91 20 1234 5678", board: "CBSE", affiliationNumber: "1130456", kind: "SCHOOL" }),
  motto: "Learning by the river",
  offerOtherLanguages: true,
  foundedYear: 1990,
  principalMessage: "Welcome to our school.",
  principalNamed: true,
  sections: [
    { code: "NUMBERS", on: true },
    { code: "NEWS", on: true },
    { code: "GALLERY", on: true },
    { code: "ADMISSIONS", on: true },
    { code: "CONTACT", on: true },
    { code: "FACULTY", on: false },
    { code: "DISCLOSURE", on: false },
  ],
  metrics: ["PUPILS", "TEACHING_STAFF", "ATTENDANCE_MONTH", "BOARD", "YEARS_SINCE_FOUNDING"],
  mapUrl: "https://maps.example.test/river",
  hours: "Monday to Saturday, 9 to 4",
  admissionsText: "Forms open in January.",
  newsPostIds: ["p1"],
  gallery: [{ postId: "p1", fileId: "f-gallery", consent: true, consentByUserId: "u1", consentAt: "2026-10-01T00:00:00.000Z" }],
};
const FIXTURE_DATA: SiteData = {
  schoolName: "ZZ River School",
  slug: "zz-river",
  logoFileId: "f-logo",
  numbers: [
    { metric: "PUPILS", kind: "count", value: 1234 },
    { metric: "TEACHING_STAFF", kind: "count", value: 56 },
    { metric: "ATTENDANCE_MONTH", kind: "percent", value: 93 },
    { metric: "BOARD", kind: "text", value: "CBSE · 1130456" },
    { metric: "YEARS_SINCE_FOUNDING", kind: "years", value: 36 },
  ],
  numbersDateKey: "2026-10-15",
  faculty: [],
  appUrl: "https://app.example.test",
  disclosurePublished: false,
  facultyPublished: false,
  news: [{ id: "p1", title: "Sports day", body: "Races and a <script>alert(1)</script> tug of war.", dateKey: "2026-10-01", image: { fileId: "f-news", alt: "Children racing" } }],
  gallery: [{ fileId: "f-gallery", alt: "The prize table" }],
  principalName: "ZZ Head",
};

describe("the renderer (pure)", () => {
  for (const template of ["CLASSIC", "MODERN", "WARM", "MINIMAL"] as const) {
    it(`draws the ${template} template the same way every time`, () => {
      const html = renderSite({ ...FIXTURE_CONFIG, template }, FIXTURE_DATA, "en");
      expect(html).toMatchSnapshot();
    });
  }

  it("keeps the rules every template shares: no script, a skip link, one h1, alt text on each picture, escaped words", () => {
    for (const template of ["CLASSIC", "MODERN", "WARM", "MINIMAL"] as const) {
      for (const locale of ["en", "hi", "mr"] as const) {
        const html = renderSite({ ...FIXTURE_CONFIG, template }, FIXTURE_DATA, locale);
        expect(html).not.toMatch(/<script/i);
        expect(html).toContain('<a class="skip" href="#main">');
        expect(html.match(/<h1[ >]/g)).toHaveLength(1);
        for (const img of html.match(/<img [^>]*>/g) ?? []) expect(img).toMatch(/ alt="[^"]+"/);
        expect(html).toContain(`<html lang="${locale}">`);
        expect(html).toContain("&lt;b&gt;everyone&lt;/b&gt; &amp; we mean it.");
        expect(html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
        // No outside host: pictures through the file route, faces from /fonts, links only to the app's own address.
        expect(html).not.toMatch(/src="https?:/);
      }
    }
  });

  it("says the page's own words in the page's language and offers the other two as links", () => {
    const hi = renderSite(FIXTURE_CONFIG, FIXTURE_DATA, "hi");
    expect(hi).toContain("हमारे बारे में");
    expect(hi).toContain('href="?lang=en"');
    expect(hi).toContain('href="?lang=mr"');
    expect(hi).toContain('aria-current="page">हिन्दी');
    const one = renderSite({ ...FIXTURE_CONFIG, offerOtherLanguages: false }, FIXTURE_DATA, "en");
    expect(one).not.toContain("?lang=");
  });

  it("leaves a section that is on with nothing in it off the page, and a picture without consent never reaches the data", () => {
    const html = renderSite(FIXTURE_CONFIG, { ...FIXTURE_DATA, news: [], gallery: [] }, "en");
    expect(html).not.toContain('id="news"');
    expect(html).not.toContain('id="gallery"');
    expect(html).toContain('id="admissions"');
    // The form posts to its own host's /enquiry (the by-host route), never to a slug path (16 Oct 2026).
    expect(html).toContain('action="/enquiry"');
    expect(html).not.toContain("/sites/zz-river");
  });

  it("prints the head's name only when ticked", () => {
    expect(renderSite(FIXTURE_CONFIG, FIXTURE_DATA, "en")).toContain("<cite>ZZ Head</cite>");
    expect(renderSite({ ...FIXTURE_CONFIG, principalNamed: false }, FIXTURE_DATA, "en")).not.toContain("ZZ Head");
  });

  it("escapes and tints", () => {
    expect(escapeHtml(`<a href="x">'&'</a>`)).toBe("&lt;a href=&quot;x&quot;&gt;&#39;&amp;&#39;&lt;/a&gt;");
    expect(tint("#000000", 1)).toBe("#ffffff");
    expect(tint("#1d4ed8", 0)).toBe("#1d4ed8");
  });
});

describe("the draft's shape (pure)", () => {
  it("repairs a stored draft: bad fields fall back, sections listed once each, an http map link dropped", () => {
    const defaults = defaultSiteConfig({ locale: "mr", profileAbout: "", addressLine: null, city: null, region: null, postalCode: null, contactEmail: "a@b.test", contactPhone: null, board: null, affiliationNumber: null, kind: "COLLEGE" });
    expect(defaults.language).toBe("mr");
    expect(defaults.sections.find((s) => s.code === "FACULTY")?.on).toBe(true);
    const fixed = repairSiteConfig({ template: "GAUDY", font: "comic-sans", mapUrl: "http://maps.test/x", sections: [{ code: "NEWS", on: true }, { code: "NEWS", on: false }], metrics: ["PUPILS", "NOPE"] }, defaults);
    expect(fixed.template).toBe(defaults.template);
    expect(fixed.font).toBe("default");
    expect(fixed.mapUrl).toBe("");
    expect(fixed.sections.map((s) => s.code)).toEqual(["NEWS", "NUMBERS", "FACULTY", "DISCLOSURE", "ADMISSIONS", "GALLERY", "CONTACT"]);
    expect(fixed.sections[0]).toEqual({ code: "NEWS", on: true });
    expect(fixed.metrics).toEqual(defaults.metrics);
  });

  it("knows a phone and an email when it sees one", () => {
    expect(isPhoneish("+91 20 1234 5678")).toBe(true);
    expect(isPhoneish("12-34")).toBe(false);
    expect(isEmailish("office@school.in")).toBe(true);
    expect(isEmailish("not an email")).toBe(false);
  });

  it("finds a logo's main colour and the nearest swatch, skipping white, black and grey", () => {
    const px = (r: number, g: number, b: number, n: number) => Array.from({ length: n }, () => [r, g, b]).flat();
    const logo = Uint8Array.from([...px(255, 255, 255, 50), ...px(0, 0, 0, 20), ...px(128, 128, 128, 20), ...px(20, 120, 110, 30), ...px(200, 30, 40, 5)]);
    const main = dominantColour(logo, 3);
    expect(main).toEqual([20, 120, 110]);
    expect(nearestSwatch(main!)).toBe("#0f766e");
    expect(dominantColour(Uint8Array.from(px(255, 255, 255, 10)), 3)).toBeNull();
  });
});

/* ------------------------------------------------------------------------------------------------ */
/* One ZZ school through the library                                                               */
/* ------------------------------------------------------------------------------------------------ */

beforeAll(async () => {
  const mkSchool = (tag: string, slug: string) =>
    db.school.create({ data: { name: `ZZ Site ${tag} ${STAMP}`, slug, code: `ZST${tag[0]}${String(STAMP).slice(-5)}`, contactEmail: `zz-site-${tag.toLowerCase()}-${STAMP}@test.invalid`, timezone: "Asia/Kolkata", board: "CBSE", affiliationNumber: "1130999", profileAbout: "A ZZ school for the website suite.", isTestFixture: true }, select: { id: true } });
  ids.school = (await mkSchool("Main", SLUG)).id;
  ids.other = (await mkSchool("Other", `${SLUG}-other`)).id;
  await db.schoolModule.createMany({ data: [{ schoolId: ids.school, module: "WEBSITE" }, { schoolId: ids.other, module: "WEBSITE" }] });
  const mk = (who: string) => db.user.create({ data: { name: `ZZ Site ${who}`, email: `zz-site-${who.toLowerCase()}-${STAMP}@test.invalid` }, select: { id: true } });
  const [a, h, t, p1, p2, oa] = await Promise.all([mk("Admin"), mk("Head"), mk("Teacher"), mk("PupilOne"), mk("PupilTwo"), mk("OtherAdmin")]);
  Object.assign(ids, { admin: a.id, head: h.id, teacher: t.id, otherAdmin: oa.id });
  await db.membership.createMany({
    data: [
      { userId: oa.id, schoolId: ids.other, role: "ADMIN", status: "ACTIVE" },
      { userId: a.id, schoolId: ids.school, role: "ADMIN", status: "ACTIVE" },
      { userId: h.id, schoolId: ids.school, role: "PRINCIPAL", status: "ACTIVE" },
      { userId: t.id, schoolId: ids.school, role: "TEACHER", status: "ACTIVE" },
    ],
  });
  ids.pupil1 = (await db.membership.create({ data: { userId: p1.id, schoolId: ids.school, role: "STUDENT", status: "ACTIVE", studentCode: `ZSTP1${STAMP}` }, select: { id: true } })).id;
  ids.pupil2 = (await db.membership.create({ data: { userId: p2.id, schoolId: ids.school, role: "STUDENT", status: "ACTIVE", studentCode: `ZSTP2${STAMP}` }, select: { id: true } })).id;
  ids.klass = (await db.class.create({ data: { schoolId: ids.school, name: `ZZ Site Class ${STAMP}`, subject: "Maths", joinCode: `ZSTC${STAMP}`, gradeLevel: "5" }, select: { id: true } })).id;
  const session = await db.attendanceSession.create({ data: { schoolId: ids.school, classId: ids.klass, dateKey: todayKey("Asia/Kolkata") }, select: { id: true } });
  await db.attendanceRecord.createMany({
    data: [
      { sessionId: session.id, schoolId: ids.school, studentMembershipId: ids.pupil1, status: "PRESENT" },
      { sessionId: session.id, schoolId: ids.school, studentMembershipId: ids.pupil2, status: "ABSENT" },
    ],
  });
  const media = JSON.stringify([{ fileId: PIC, kind: "image", alt: "ZZ sports day" }]);
  ids.post = (await db.post.create({ data: { schoolId: ids.school, authorUserId: a.id, scope: "SCHOOL", title: "ZZ Sports day", body: "Races on the field.", media, status: "APPROVED" }, select: { id: true } })).id;
  ids.otherPost = (await db.post.create({ data: { schoolId: ids.other, authorUserId: a.id, scope: "SCHOOL", title: "ZZ Other news", body: "Not ours.", media: "[]", status: "APPROVED" }, select: { id: true } })).id;
});

afterAll(async () => {
  signedOut();
  await db.notification.deleteMany({ where: { schoolId: { in: [ids.school, ids.other] } } });
  await db.auditLog.deleteMany({ where: { schoolId: { in: [ids.school, ids.other] } } });
  await db.session.deleteMany({ where: { user: { email: { contains: `-${STAMP}@test.invalid` } } } });
  await db.school.deleteMany({ where: { id: { in: [ids.school, ids.other] } } });
  await db.user.deleteMany({ where: { email: { contains: `-${STAMP}@test.invalid` } } });
  await db.$disconnect();
});

describe("the numbers a site may show", () => {
  it("counts the whole school and nothing about one person; a number with no data is left out", async () => {
    const numbers = await siteMetrics(ids.school, { board: "CBSE · 1130999", foundedYear: 2000 });
    const by = Object.fromEntries(numbers.map((n) => [n.metric, n.value]));
    expect(by.PUPILS).toBe(2);
    expect(by.TEACHING_STAFF).toBe(2); // the head and the teacher; the office is not teaching staff
    expect(by.ATTENDANCE_MONTH).toBe(50);
    expect(by.CLASSES).toBe(1);
    expect(by.BOARD).toBe("CBSE · 1130999");
    expect(Number(by.YEARS_SINCE_FOUNDING)).toBeGreaterThanOrEqual(26);
    expect(by.PASS_RATE).toBeUndefined();
    expect(by.PROGRAMMES).toBeUndefined();
  });
});

describe("the draft", () => {
  it("opens with defaults cut from the school, for the office and the head only", async () => {
    const view = await loadSite(await as(ids.admin, "ADMIN", ids.school));
    expect(view.config.about).toBe("A ZZ school for the website suite.");
    expect(view.config.board).toBe("CBSE · 1130999");
    expect(view.published).toBe(false);
    expect(view.warnings).toContain("NO_LOGO");
    await expect(loadSite(await as(ids.teacher, "TEACHER", ids.school))).rejects.toBeInstanceOf(AccessError);
  });

  it("refuses another school's post, an http map link and a phone with letters, naming the field", async () => {
    const ctx = await as(ids.admin, "ADMIN", ids.school);
    expect(await saveSite(ctx, { newsPostIds: [ids.otherPost] })).toMatchObject({ ok: false, field: "newsPostIds" });
    expect(await saveSite(ctx, { mapUrl: "http://maps.test/x" })).toMatchObject({ ok: false, field: "mapUrl" });
    expect(await saveSite(ctx, { phones: ["call me"] })).toMatchObject({ ok: false, field: "phones" });
    expect(await saveSite(ctx, { gallery: [{ postId: ids.post, fileId: "zz-not-in-the-post", consent: true }] })).toMatchObject({ ok: false, field: "gallery" });
  });

  it("stamps a picture's consent with who ticked it and when, whatever the form sent", async () => {
    const ctx = await as(ids.admin, "ADMIN", ids.school);
    const saved = await saveSite(ctx, {
      offerOtherLanguages: true,
      newsPostIds: [ids.post],
      gallery: [{ postId: ids.post, fileId: PIC, consent: true, consentByUserId: "someone-else", consentAt: "2000-01-01T00:00:00.000Z" }],
      sections: [
        { code: "NUMBERS", on: true },
        { code: "NEWS", on: true },
        { code: "GALLERY", on: true },
        { code: "ADMISSIONS", on: true },
        { code: "CONTACT", on: true },
      ],
    });
    expect(saved.ok).toBe(true);
    if (!saved.ok) return;
    expect(saved.config.gallery[0]).toMatchObject({ consent: true, consentByUserId: ids.admin });
    expect(saved.config.gallery[0]!.consentAt).not.toBe("2000-01-01T00:00:00.000Z");
  });

  it("lets only the head tick their own name under the message", async () => {
    expect(await saveSite(await as(ids.admin, "ADMIN", ids.school), { principalMessage: "Welcome.", principalNamed: true })).toMatchObject({ ok: false, field: "principalNamed" });
    expect(await saveSite(await as(ids.head, "PRINCIPAL", ids.school), { principalMessage: "Welcome.", principalNamed: true })).toMatchObject({ ok: true });
    const html = await previewHtml(await as(ids.admin, "ADMIN", ids.school), "en");
    expect(html).toContain("<cite>ZZ Site Head</cite>");
  });

  it("answers the door as the office and refuses a teacher", async () => {
    await as(ids.admin, "ADMIN", ids.school);
    const res = await adminSiteGet();
    expect(res.status).toBe(200);
    const body = (await res.json()) as { config: SiteConfig; published: boolean };
    expect(body.config.newsPostIds).toEqual([ids.post]);
    await as(ids.teacher, "TEACHER", ids.school);
    expect((await adminSiteGet()).status).toBe(403);
  });
});

describe("publish, the office's view by slug, the public site on its own domain, and unpublish", () => {
  it("is not there before Publish: 404 with noindex, even to the office", async () => {
    signedOut();
    expect(await schoolIdForSlug(SLUG)).toBeNull();
    const res = await bySlug();
    expect(res.status).toBe(404);
    expect(res.headers.get("x-robots-tag")).toBe("noindex");
    await as(ids.admin, "ADMIN", ids.school);
    expect((await bySlug()).status).toBe(404);
  });

  it("publishes every language before any domain (the version is stored, the address null), audited", async () => {
    const made = await publishSite(await as(ids.admin, "ADMIN", ids.school));
    expect(made.address).toBeNull();
    const audit = await db.auditLog.findFirst({ where: { schoolId: ids.school, action: "site.publish" } });
    expect(audit?.targetId).toBe(made.versionId);
    expect(actionKey("site.publish")).toBe("audit.sitePublish");
    const view = await loadSite(await as(ids.admin, "ADMIN", ids.school));
    expect(view).toMatchObject({ published: true, address: null, localPath: `/sites/${SLUG}` });
  });

  it("⚠ shows the published version by slug to that school's office and head only, privately; 404 to anyone else", async () => {
    for (const [who, role, school] of [[ids.admin, "ADMIN", ids.school], [ids.head, "PRINCIPAL", ids.school]] as const) {
      await as(who, role, school);
      const res = await bySlug();
      expect(res.status, role).toBe(200);
      expect(res.headers.get("cache-control")).toBe("private, no-store");
      expect(res.headers.get("x-robots-tag")).toBe("noindex");
      expect(res.headers.get("set-cookie")).toBeNull();
      const html = await res.text();
      expect(html).toContain(`ZZ Site Main ${STAMP}`);
      expect(html).toContain("ZZ Sports day");
      expect(html).not.toMatch(/<script/i);
    }
    await as(ids.admin, "ADMIN", ids.school);
    expect(await (await bySlug("?lang=hi")).text()).toContain('<html lang="hi">');
    // Signed out, another role, another school's office: the 404 with noindex, never the site.
    signedOut();
    const out = await bySlug();
    expect(out.status).toBe(404);
    expect(out.headers.get("x-robots-tag")).toBe("noindex");
    await as(ids.teacher, "TEACHER", ids.school);
    expect((await bySlug()).status).toBe(404);
    await as(ids.otherAdmin, "ADMIN", ids.other);
    expect((await bySlug()).status).toBe(404);
  });

  it("serves the site publicly on the school's own domain once it is LIVE, and gives that as the address", async () => {
    signedOut();
    const call = (host: string, query = "") => hostGet(new Request(`http://localhost/${query}`, { headers: { host } }), hostParams(host));
    await db.schoolSiteDomain.create({ data: { schoolId: ids.school, domain: DOMAIN, status: "PENDING_DNS", createdByUserId: ids.admin } });
    forgetSiteHosts();
    expect((await call(DOMAIN)).status).toBe(404);
    await db.schoolSiteDomain.updateMany({ where: { schoolId: ids.school }, data: { status: "LIVE", verifiedAt: new Date() } });
    forgetSiteHosts();
    const res = await call(DOMAIN);
    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toBe("public, max-age=300");
    expect(res.headers.get("content-type")).toContain("text/html");
    expect(res.headers.get("set-cookie")).toBeNull();
    expect(res.headers.get("x-robots-tag")).toBeNull();
    const html = await res.text();
    expect(html).toContain(`ZZ Site Main ${STAMP}`);
    expect(html).toContain('action="/enquiry"');
    expect(await (await call(DOMAIN, "?lang=hi")).text()).toContain('<html lang="hi">');
    expect((await loadSite(await as(ids.admin, "ADMIN", ids.school))).address).toBe(`https://${DOMAIN}`);
    expect((await publishSite(await as(ids.admin, "ADMIN", ids.school))).address).toBe(`https://${DOMAIN}`);
  });

  it("opens a consented picture of the live site to anyone, and nothing else", async () => {
    const access = await authorizeFileRead(PIC, null);
    expect(access).toMatchObject({ allowed: true, public: true });
    expect(await authorizeFileRead(`zz-site-unknown-${STAMP}`, null)).toMatchObject({ allowed: false });
  });

  it("takes an enquiry signed out through the form on the school's own domain, tells the office and keeps a robot's out", async () => {
    signedOut();
    const post = (fields: Record<string, string>, host = DOMAIN) =>
      hostEnquiryPost(new Request("http://localhost/enquiry", { method: "POST", headers: { host, "content-type": "application/x-www-form-urlencoded", referer: `https://${host}/?lang=en` }, body: new URLSearchParams(fields) }), hostParams(host));
    const ok = await post({ name: "ZZ Parent", contact: "parent@zz-site.test", grade: "5", message: "Is there a seat in class 5?", lang: "en" });
    expect(ok.status).toBe(200);
    expect(ok.headers.get("content-security-policy")).toContain("default-src 'none'");
    const page = await ok.text();
    expect(page).toContain('href="/?lang=en"');
    expect(page).not.toMatch(/<script/i);
    expect((await post({ name: "ZZ Robot", contact: "robot@zz-site.test", message: "Buy now", website: "http://spam.test" })).status).toBe(200);
    expect((await post({ name: "ZZ Parent", contact: "nothing", message: "Hello" })).status).toBe(422);
    expect((await post({})).status).toBe(422);
    // A host that is nobody's LIVE domain takes nothing.
    expect((await post({ name: "ZZ Lost", contact: "lost@zz-site.test", message: "Hello?" }, "www.nobody-zz-site.test")).status).toBe(404);
    expect((await hostEnquiryGet(new Request("http://localhost/enquiry", { headers: { host: DOMAIN } }))).status).toBe(404);
    const rows = await db.schoolSiteEnquiry.findMany({ where: { schoolId: ids.school } });
    expect(rows.map((r) => r.name)).toEqual(["ZZ Parent"]);
    const told = await db.notification.findFirst({ where: { userId: ids.admin, schoolId: ids.school, kind: "ENQUIRY" } });
    expect(told?.title).toContain("ZZ Parent");
    expect((await siteEnquiries(await as(ids.head, "PRINCIPAL", ids.school))).map((q) => q.message)).toEqual(["Is there a seat in class 5?"]);
  });

  it("re-renders at night only when a number changed", async () => {
    const before = await db.schoolSiteVersion.count({ where: { schoolId: ids.school } });
    expect(await refreshPublishedSites(new Date(), { schoolIds: [ids.school] })).toMatchObject({ checked: 1, refreshed: 0, failed: 0 });
    const pupil = await db.user.create({ data: { name: "ZZ Site PupilThree", email: `zz-site-pupilthree-${STAMP}@test.invalid` }, select: { id: true } });
    await db.membership.create({ data: { userId: pupil.id, schoolId: ids.school, role: "STUDENT", status: "ACTIVE", studentCode: `ZSTP3${STAMP}` } });
    expect(await refreshPublishedSites(new Date(), { schoolIds: [ids.school] })).toMatchObject({ checked: 1, refreshed: 1, failed: 0 });
    expect(await db.schoolSiteVersion.count({ where: { schoolId: ids.school } })).toBe(before + 1);
    expect(await db.schoolSiteVersion.count({ where: { schoolId: ids.school, liveAt: { not: null } } })).toBe(1);
    const live = await publishedSiteFor(ids.school);
    expect(live?.html.en).toContain(">3<");
  });

  it("answers 404 with noindex while the module is off, and serves again when it is back on", async () => {
    const onDomain = () => hostGet(new Request("http://localhost/", { headers: { host: DOMAIN } }), hostParams(DOMAIN));
    await db.schoolModule.deleteMany({ where: { schoolId: ids.school, module: "WEBSITE" } });
    signedOut();
    expect(await publishedSiteFor(ids.school)).toBeNull();
    expect((await onDomain()).status).toBe(404);
    await expect(loadSite(await as(ids.admin, "ADMIN", ids.school))).rejects.toBeInstanceOf(ModuleOffError);
    expect((await bySlug()).status).toBe(404);
    await db.schoolModule.create({ data: { schoolId: ids.school, module: "WEBSITE" } });
    signedOut();
    expect((await onDomain()).status).toBe(200);
    await as(ids.admin, "ADMIN", ids.school);
    expect((await bySlug()).status).toBe(200);
  });

  it("unpublishes, audited: 404 with noindex, the picture closed again, the versions kept", async () => {
    const versions = await db.schoolSiteVersion.count({ where: { schoolId: ids.school } });
    expect(await unpublishSite(await as(ids.head, "PRINCIPAL", ids.school))).toEqual({ changed: true });
    expect(await unpublishSite(await as(ids.head, "PRINCIPAL", ids.school))).toEqual({ changed: false });
    expect(await db.auditLog.count({ where: { schoolId: ids.school, action: "site.unpublish" } })).toBe(1);
    signedOut();
    const res = await hostGet(new Request("http://localhost/", { headers: { host: DOMAIN } }), hostParams(DOMAIN));
    expect(res.status).toBe(404);
    expect(res.headers.get("x-robots-tag")).toBe("noindex");
    await as(ids.admin, "ADMIN", ids.school);
    expect((await bySlug()).status).toBe(404);
    expect(await schoolIdForSlug(SLUG)).toBeNull();
    expect(await authorizeFileRead(PIC, null)).toMatchObject({ allowed: false });
    expect(await db.schoolSiteVersion.count({ where: { schoolId: ids.school } })).toBe(versions);
    expect((await loadSite(await as(ids.admin, "ADMIN", ids.school))).published).toBe(false);
  });
});
