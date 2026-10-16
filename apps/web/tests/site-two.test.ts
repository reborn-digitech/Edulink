/**
 * The school website's second pass (website-two, 16 October 2026): one editor, more customisation, more pages.
 *
 * Pure first: the six templates and every page snapshotted from one fixture draft, the rules every page keeps (no
 * script, a skip link, one h1, alt text on every picture, escaped words, no outside host), the colours a pair is
 * refused for, the rich text a custom page keeps, the announcement's dates, a page with nothing to show hidden, an
 * older draft opened with the new fields at their defaults. Then one ZZ school of this suite's own walks the library
 * and the routes: the first draft built for the office, the save's new checks and consent stamps, uploads, Publish
 * of every page served on the school's own domain and counted, versions with Restore and Back to published, a review
 * link opened signed out and closed, the enquiries inbox with a reply by email in the enquirer's language, the weekly
 * tidy, the post page's tick, and the doors. Every row it makes is its own school's.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { SITE_PALETTE, SITE_PAGES, SITE_TEMPLATES, type SiteConfig } from "@edulink/contracts";
import { createSession, getSession } from "@/lib/session";
import { __resetCookies, __setHeaders } from "../tests/stubs/next-headers";
import { AccessError } from "@/lib/access-error";
import { finishSiteHtml, renderSite, sitePagesShown, type SiteData } from "@/lib/site-render";
import { announcementShown, pageHasContent, siteChecklist } from "@/lib/site-content";
import { defaultSiteConfig, repairSiteConfig } from "@/lib/site-config";
import { colourProblem, contrastRatio, readableFromLogo } from "@/lib/site-colour";
import { sanitiseRichText, safeLinkHref } from "@/lib/site-rich-text";
import { loadSite, postOnSite, previewHtml, publishSite, restoreSiteVersion, saveSite, setPostOnSite, siteVersions } from "@/lib/site-admin";
import { draftConfigFor } from "@/lib/site-publish";
import { uploadSiteFile } from "@/lib/site-files";
import { createSiteShare, revokeSiteShare, schoolForReviewToken, siteReviewFileOpen } from "@/lib/site-share";
import { replyToSiteEnquiry, setSiteEnquiryStatus, siteInbox, tidySiteEnquiries } from "@/lib/site-inbox";
import { siteVisits } from "@/lib/site-visits";
import { authorizeFileRead } from "@/lib/files";
import { deleteStoredFile } from "@/lib/storage";
import { forgetSiteHosts } from "@/lib/site-hosts";
import { sitemapXml } from "@/lib/site-host-routes";
import { publishedSiteFor } from "@/lib/site-publish";
import { ENDPOINTS } from "@/lib/api-catalog";
import { JOBS } from "@/lib/jobs";
import { actionKey } from "@/lib/safety-labels";
import { fixturePng } from "../scripts/png";
import { GET as hostHome } from "@/app/sites/by-host/[host]/route";
import { GET as hostRest } from "@/app/sites/by-host/[host]/[...rest]/route";
import { POST as hostEnquiry } from "@/app/sites/by-host/[host]/enquiry/route";
import { GET as reviewHome } from "@/app/sites/review/[token]/route";
import { GET as reviewPage } from "@/app/sites/review/[token]/[page]/route";
import { GET as slugPage } from "@/app/sites/[slug]/[page]/route";
import { POST as previewPost } from "@/app/(app)/admin/website/preview/route";
import { GET as versionsGet } from "@/app/api/v1/admin/site/versions/route";
import { POST as restorePost } from "@/app/api/v1/admin/site/versions/[versionId]/restore/route";
import { POST as sharesPost } from "@/app/api/v1/admin/site/shares/route";
import { DELETE as shareDelete } from "@/app/api/v1/admin/site/shares/[shareId]/route";
import { GET as enquiriesGet } from "@/app/api/v1/admin/site/enquiries/route";
import { POST as replyPost } from "@/app/api/v1/admin/site/enquiries/[enquiryId]/reply/route";
import { GET as visitsGet } from "@/app/api/v1/admin/site/visits/route";

const db = new PrismaClient();
const STAMP = Date.now();
const SLUG = `zz-two-${STAMP}`;
const DOMAIN = `www.zz-two-${STAMP}.test`;
const ids = { school: "", admin: "", head: "", teacher: "", post: "", postPic: "", hero: "", pdf: "", klass: "" };
const stored: string[] = [];

async function as(userId: string, role: string, schoolId: string) {
  __resetCookies();
  __setHeaders({});
  await createSession(userId, { schoolId, role: role as never });
  const ctx = await getSession();
  if (!ctx) throw new Error("no session");
  return ctx;
}
const admin = () => as(ids.admin, "ADMIN", ids.school);
function signedOut() {
  __resetCookies();
  __setHeaders({});
}

/* ------------------------------------------------------------------------------------------------ */
/* The pure parts                                                                                  */
/* ------------------------------------------------------------------------------------------------ */

const BASE: SiteConfig = defaultSiteConfig({ locale: "en", profileAbout: "A school by the hill.\n\nWe teach everyone.", addressLine: "2 Hill Road", city: "Nashik", region: "Maharashtra", postalCode: "422001", contactEmail: "office@zz-hill.test", contactPhone: "+91 253 123 4567", board: "SSC", affiliationNumber: "", kind: "SCHOOL", medium: "Marathi" });
const pic = (fileId: string, alt = "A picture") => ({ fileId, postId: null, alt, consent: true, consentByUserId: "u1", consentAt: "2026-10-01T00:00:00.000Z" });
const CONFIG: SiteConfig = {
  ...BASE,
  motto: "Learning on the hill",
  offerOtherLanguages: true,
  heroStyle: "PICTURE",
  heroPicture: pic("f-hero", "The school building"),
  announcement: { text: "Admissions open for 2027", from: "2026-10-01", to: "2026-10-31" },
  social: { facebook: "https://www.facebook.com/zz-hill", instagram: "", youtube: "https://youtu.be/zz", whatsapp: "919800000000" },
  academicsText: "We teach by doing.",
  admissionsText: "Forms in January.",
  prospectusFileId: "f-prospectus",
  enquiryFields: ["GRADE", "EMAIL", "VISIT"],
  facilities: [
    { code: "LIBRARY", label: "", line: "Six thousand books.", picture: pic("f-library", "Shelves of books") },
    { code: "CUSTOM", label: "Music room", line: "", picture: null },
  ],
  albums: [{ id: "a1", title: "Sports day", pictures: [pic("f-album", "A race"), { ...pic("f-no-consent", "A crowd"), consent: false }] }],
  achievements: [{ id: "x1", title: "District science fair, first place", dateKey: "2026-09-12", line: "The Grade 8 team's water filter.", picture: null }],
  downloads: [{ id: "d1", kind: "FEE_STRUCTURE", title: "Fees 2026–27", fileId: "f-fees" }],
  customPages: [{ id: "c1", slug: "transport-routes", title: "Bus routes", on: true, html: "<h2>Routes</h2><p>Three <strong>buses</strong>.</p><ul><li>North</li></ul>", seoDescription: "" }],
  sections: BASE.sections.map((s) => ({ ...s, on: true })),
};
const DATA: SiteData = {
  schoolName: "ZZ Hill School",
  slug: "zz-hill",
  logoFileId: "f-logo",
  numbers: [{ metric: "PUPILS", kind: "count", value: 640 }],
  numbersDateKey: "2026-10-16",
  faculty: [],
  appUrl: "https://app.example.test",
  disclosurePublished: true,
  facultyPublished: false,
  news: [{ id: "p1", title: "Annual day", body: "Songs and a play.", dateKey: "2026-10-10", image: null }],
  gallery: [],
  principalName: null,
  todayKey: "2026-10-16",
  college: false,
  events: [{ title: "Diwali break", startKey: "2026-10-20", endKey: "2026-10-27", kind: "HOLIDAY" }],
  academics: { classes: [{ name: "Grade 5 A", subjects: ["English", "Maths"] }], departments: [] },
  admissionsCycle: { name: "Admissions 2027", opensKey: "2026-11-01", closesKey: "2027-01-31", grades: ["Grade 1", "Grade 5"] },
  files: { "f-hero": { size: 1, kind: "IMAGE" }, "f-library": { size: 1, kind: "IMAGE" }, "f-album": { size: 1, kind: "IMAGE" }, "f-no-consent": { size: 1, kind: "IMAGE" }, "f-prospectus": { size: 204800, kind: "PDF" }, "f-fees": { size: 1024, kind: "PDF" } },
};

describe("the renderer, every page (pure)", () => {
  for (const template of ["HERITAGE", "BOLD"] as const) {
    it(`draws the ${template} template the same way every time`, () => {
      expect(renderSite({ ...CONFIG, template }, DATA, "en")).toMatchSnapshot();
    });
  }

  it("draws a dark page and each header style the same way every time", () => {
    expect(renderSite({ ...CONFIG, theme: "DARK", headerStyle: "WORDMARK" }, DATA, "en")).toMatchSnapshot();
    expect(renderSite({ ...CONFIG, headerStyle: "LOGO_LEFT", heroStyle: "MOTTO" }, DATA, "hi")).toMatchSnapshot();
  });

  it("draws every page the same way every time", () => {
    for (const page of [...SITE_PAGES.filter((p) => p !== "HOME"), "custom:c1"]) expect(renderSite(CONFIG, DATA, "en", page), page).toMatchSnapshot();
  });

  it("keeps the shared rules on every page, template and language: no script, a skip link, one h1, alt text, no outside host", () => {
    const pages = sitePagesShown(CONFIG, DATA).map((p) => p.key);
    expect(pages).toEqual(["HOME", "ABOUT", "ACADEMICS", "ADMISSIONS", "FACILITIES", "GALLERY", "NEWS", "EVENTS", "ACHIEVEMENTS", "DOWNLOADS", "CONTACT", "custom:c1"]);
    for (const template of SITE_TEMPLATES)
      for (const locale of ["en", "hi", "mr"] as const)
        for (const page of pages) {
          const html = renderSite({ ...CONFIG, template }, DATA, locale, page);
          expect(html, `${template} ${locale} ${page}`).not.toMatch(/<script/i);
          expect(html).toContain('<a class="skip" href="#main">');
          expect(html.match(/<h1[ >]/g)).toHaveLength(1);
          for (const img of html.match(/<img [^>]*>/g) ?? []) expect(img).toMatch(/ alt="[^"]+"/);
          expect(html).not.toMatch(/(src|href)="https?:\/\/(?!app\.example\.test|www\.facebook\.com|youtu\.be|wa\.me)/);
          expect(html).not.toContain("f-no-consent");
        }
  });

  it("links pages and languages under the base the route fills in, with canonical and hreflang addresses", () => {
    const about = renderSite(CONFIG, DATA, "en", "ABOUT");
    expect(about).toContain('href="__SITE_BASE__/about" aria-current="page"');
    const served = finishSiteHtml(about, { base: "", origin: "https://www.zz-hill.test" });
    expect(served).toContain('<link rel="canonical" href="https://www.zz-hill.test/about">');
    expect(served).toContain('<link rel="alternate" hreflang="mr" href="https://www.zz-hill.test/about?lang=mr">');
    expect(served).toContain('href="/academics"');
    expect(served).toContain('<meta property="og:image" content="https://www.zz-hill.test/api/files/f-hero?w=1280">');
    expect(finishSiteHtml(about, { base: "/sites/zz-hill", origin: "https://app.test" })).toContain('href="/sites/zz-hill/academics"');
  });

  it("shows the announcement only within its dates, the footer's links, the form's chosen fields and its retention line", () => {
    expect(announcementShown(CONFIG, "2026-10-16")).toBe(true);
    expect(announcementShown(CONFIG, "2026-11-01")).toBe(false);
    expect(announcementShown(CONFIG, "2026-09-30")).toBe(false);
    const home = renderSite(CONFIG, DATA, "en");
    expect(home).toContain("Admissions open for 2027");
    expect(renderSite(CONFIG, { ...DATA, todayKey: "2026-11-02" }, "en")).not.toContain("Admissions open for 2027");
    expect(home).toContain('href="https://wa.me/919800000000"');
    expect(home).toContain("Mandatory disclosure");
    const contact = renderSite(CONFIG, DATA, "en", "CONTACT");
    expect(contact).toContain('name="email"');
    expect(contact).toContain('name="visit"');
    expect(contact).toContain("180 days");
    expect(renderSite({ ...CONFIG, enquiryFields: [] }, DATA, "en", "CONTACT")).not.toContain('name="grade"');
  });

  it("hides a page or a section with nothing to show, and says what Academics and Admissions know", () => {
    const empty: SiteData = { ...DATA, events: [], news: [] };
    expect(pageHasContent("EVENTS", CONFIG, empty)).toBe(false);
    expect(sitePagesShown(CONFIG, empty).map((p) => p.key)).not.toContain("NEWS");
    expect(renderSite(CONFIG, empty, "en")).not.toContain('id="events"');
    const academics = renderSite(CONFIG, DATA, "en", "ACADEMICS");
    expect(academics).toContain("Grade 5 A");
    expect(academics).toContain("English, Maths");
    expect(renderSite({ ...CONFIG, academicsSubjects: false }, DATA, "en", "ACADEMICS")).not.toContain("English, Maths");
    const admissions = renderSite(CONFIG, DATA, "en", "ADMISSIONS");
    expect(admissions).toContain("Admissions 2027");
    expect(admissions).toContain("/api/files/f-prospectus");
    expect(renderSite(CONFIG, DATA, "en", "ACHIEVEMENTS")).toContain("only with the family");
  });

  it("refuses a pair of colours whose words cannot be read; the palette and the logo's colour made readable all pass", () => {
    for (const c of SITE_PALETTE) expect(contrastRatio(c, "#ffffff"), c).toBeGreaterThanOrEqual(4.5);
    expect(colourProblem("#1d4ed8", "#b45309", "LIGHT")).toBeNull();
    expect(colourProblem("#1d4ed8", "#b45309", "DARK")).toBeNull();
    expect(colourProblem("#facc15", "#b45309", "LIGHT")).toBe("PRIMARY_TEXT");
    expect(colourProblem("#1d4ed8", "#a3e635", "LIGHT")).toBe("ACCENT_TEXT");
    const fromLogo = readableFromLogo([250, 204, 21]);
    expect(fromLogo).not.toBeNull();
    expect(contrastRatio(fromLogo!, "#ffffff")).toBeGreaterThanOrEqual(4.5);
    expect(readableFromLogo(null)).toBeNull();
  });

  it("keeps a custom page's headings, paragraphs, lists, bold and links, and nothing else", () => {
    const dirty = `<h1 onclick="x()">Title</h1><script>alert(1)</script><p style="color:red">Hello <b>world</b> <a href="javascript:alert(1)">bad</a> <a href="https://ok.test/a?b=1&c=2" target="_blank">good</a></p><li>loose</li><img src=x onerror=alert(1)><iframe src="https://evil.test"></iframe><div>block</div>`;
    const clean = sanitiseRichText(dirty);
    expect(clean).toBe('<h2>Title</h2><p>Hello <strong>world</strong> bad <a href="https://ok.test/a?b=1&amp;c=2" rel="noopener">good</a></p><ul><li>loose</li></ul><p>block</p>');
    expect(clean).not.toMatch(/script|onclick|onerror|iframe|style|javascript/i);
    expect(sanitiseRichText("<ul><li>one<li>two</ul><strong>open")).toBe("<ul><li>one</li><li>two</li></ul><strong>open</strong>");
    expect(sanitiseRichText("a &lt;b&gt; &amp; c")).toBe("a &lt;b&gt; &amp; c");
    expect(safeLinkHref("mailto:office@zz.test")).toBe("mailto:office@zz.test");
    expect(safeLinkHref("http://plain.test")).toBeNull();
  });

  it("opens a draft saved before website-two with the new fields at their defaults, the new sections off", () => {
    const old = { template: "WARM", colour: "#0f766e", sections: [{ code: "NEWS", on: true }], motto: "Old words" };
    const fixed = repairSiteConfig(old, BASE);
    expect(fixed.template).toBe("WARM");
    expect(fixed.accent).toBe("#b45309");
    expect(fixed.pages.map((p) => p.code)).toEqual([...SITE_PAGES]);
    expect(fixed.sections.find((s) => s.code === "EVENTS")?.on).toBe(false);
    expect(fixed.customPages).toEqual([]);
  });

  it("lists every page and language in the sitemap", () => {
    const xml = sitemapXml({ html: { en: "a", hi: "b", mr: "c" }, pages: { about: { en: "a", hi: "b", mr: "c" } }, language: "en", renderedAt: new Date("2026-10-16T00:00:00Z") }, "https://www.zz-hill.test");
    expect(xml).toContain("<loc>https://www.zz-hill.test/about?lang=hi</loc>");
    expect(xml).toContain('hreflang="mr" href="https://www.zz-hill.test/about?lang=mr"');
    expect(xml).toContain("<loc>https://www.zz-hill.test/</loc>");
  });

  it("counts what is ready to publish", () => {
    const list = siteChecklist(CONFIG, DATA, false);
    expect(list.map((c) => c.code)).toEqual(["LOGO", "ABOUT", "HERO_PICTURE", "CONTACT", "ADMISSIONS", "PICTURE_CONSENT", "DOMAIN"]);
    expect(list.filter((c) => c.done).map((c) => c.code)).toEqual(["LOGO", "ABOUT", "HERO_PICTURE", "CONTACT", "ADMISSIONS"]);
  });
});

/* ------------------------------------------------------------------------------------------------ */
/* One ZZ school through the library and the routes                                                 */
/* ------------------------------------------------------------------------------------------------ */

beforeAll(async () => {
  ids.school = (await db.school.create({ data: { name: `ZZ Two ${STAMP}`, slug: SLUG, code: `ZTW${String(STAMP).slice(-6)}`, contactEmail: `zz-two-${STAMP}@test.invalid`, timezone: "Asia/Kolkata", board: "CBSE", profileAbout: "A ZZ school for the second website suite.", isTestFixture: true }, select: { id: true } })).id;
  await db.schoolModule.create({ data: { schoolId: ids.school, module: "WEBSITE" } });
  const mk = (who: string) => db.user.create({ data: { name: `ZZ Two ${who}`, email: `zz-two-${who.toLowerCase()}-${STAMP}@test.invalid` }, select: { id: true } });
  const [a, h, t] = await Promise.all([mk("Admin"), mk("Head"), mk("Teacher")]);
  Object.assign(ids, { admin: a.id, head: h.id, teacher: t.id });
  await db.membership.createMany({
    data: [
      { userId: a.id, schoolId: ids.school, role: "ADMIN", status: "ACTIVE" },
      { userId: h.id, schoolId: ids.school, role: "PRINCIPAL", status: "ACTIVE" },
      { userId: t.id, schoolId: ids.school, role: "TEACHER", status: "ACTIVE" },
    ],
  });
  ids.postPic = `zz-two-pic-${STAMP}.png`;
  ids.post = (await db.post.create({ data: { schoolId: ids.school, authorUserId: a.id, scope: "SCHOOL", title: "ZZ Two annual day", body: "Songs.", media: JSON.stringify([{ fileId: ids.postPic, kind: "image", alt: "ZZ stage" }]), status: "APPROVED" }, select: { id: true } })).id;
  ids.klass = (await db.class.create({ data: { schoolId: ids.school, name: `ZZ Two Grade 6 ${STAMP}`, gradeLevel: "6", joinCode: `ZTWC${STAMP}` }, select: { id: true } })).id;
  await db.holiday.create({ data: { schoolId: ids.school, name: "ZZ Two sports meet", startDateKey: "2099-01-10", endDateKey: "2099-01-10", kind: "EVENT" } });
});

afterAll(async () => {
  signedOut();
  for (const fileId of stored) await deleteStoredFile(fileId).catch(() => undefined);
  await db.outboundEmail.deleteMany({ where: { to: { contains: `-${STAMP}@` } } });
  await db.notification.deleteMany({ where: { schoolId: ids.school } });
  await db.auditLog.deleteMany({ where: { schoolId: ids.school } });
  await db.session.deleteMany({ where: { user: { email: { contains: `-${STAMP}@test.invalid` } } } });
  await db.school.deleteMany({ where: { id: ids.school } });
  await db.user.deleteMany({ where: { email: { contains: `-${STAMP}@test.invalid` } } });
  await db.$disconnect();
});

describe("the first draft and the save's checks", () => {
  it("builds a whole draft on the first open from what the school has, and stores nothing until a save", async () => {
    const view = await loadSite(await admin());
    expect(view.config.newsPostIds).toEqual([ids.post]);
    expect(view.config.sections.find((s) => s.code === "NEWS")?.on).toBe(true);
    expect(view.config.sections.find((s) => s.code === "EVENTS")?.on).toBe(true);
    expect(view.config.sections.find((s) => s.code === "GALLERY")?.on).toBe(false);
    expect(view.draftSavedAt).toBeNull();
    expect(view.checklist.find((c) => c.code === "ABOUT")?.done).toBe(true);
    expect(await db.schoolSite.count({ where: { schoolId: ids.school } })).toBe(0);
  });

  it("takes an uploaded picture and PDF, refuses one for the other, and lets the office read a draft-only file, not a teacher", async () => {
    const png = await uploadSiteFile(await admin(), new File([new Uint8Array(fixturePng(640, 480))], "hero.png", { type: "image/png" }), "IMAGE");
    expect(png.ok).toBe(true);
    if (!png.ok) return;
    ids.hero = png.file.fileId;
    stored.push(ids.hero);
    const pdfBytes = new TextEncoder().encode("%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n");
    const pdf = await uploadSiteFile(await admin(), new File([pdfBytes], "prospectus.pdf", { type: "application/pdf" }), "PDF");
    expect(pdf.ok).toBe(true);
    if (!pdf.ok) return;
    ids.pdf = pdf.file.fileId;
    stored.push(ids.pdf);
    expect(await uploadSiteFile(await admin(), new File([pdfBytes], "not-a-picture.png", { type: "image/png" }), "IMAGE")).toMatchObject({ ok: false, errorKey: "siteEditor.refuseNotPicture" });
    expect(await authorizeFileRead(ids.hero, await admin())).toMatchObject({ allowed: true, kind: "site", public: false });
    expect(await authorizeFileRead(ids.hero, await as(ids.teacher, "TEACHER", ids.school))).toMatchObject({ allowed: false });
    expect(await authorizeFileRead(ids.hero, null)).toMatchObject({ allowed: false });
  });

  it("refuses an unreadable pair, a social link off its network, a bad WhatsApp number, a picture with no words and a reserved page path", async () => {
    const ctx = await admin();
    expect(await saveSite(ctx, { colour: "#facc15" })).toMatchObject({ ok: false, field: "colour", errorKey: "siteEditor.refuseContrastPrimary" });
    expect(await saveSite(ctx, { social: { facebook: "https://evil.test/x", instagram: "", youtube: "", whatsapp: "" } })).toMatchObject({ ok: false, field: "social" });
    expect(await saveSite(ctx, { social: { facebook: "", instagram: "", youtube: "", whatsapp: "12" } })).toMatchObject({ ok: false, errorKey: "siteEditor.refuseWhatsapp" });
    expect(await saveSite(ctx, { heroStyle: "PICTURE", heroPicture: { fileId: ids.hero, postId: null, alt: " ", consent: true } })).toMatchObject({ ok: false, field: "heroPicture", errorKey: "siteEditor.refuseAlt" });
    expect(await saveSite(ctx, { heroPicture: { fileId: "zz-not-ours.png", postId: null, alt: "x", consent: true } })).toMatchObject({ ok: false, field: "heroPicture", errorKey: "website.refusePicture" });
    expect(await saveSite(ctx, { prospectusFileId: ids.hero })).toMatchObject({ ok: false, field: "prospectusFileId" });
    expect(await saveSite(ctx, { customPages: [{ id: "c1", slug: "about", title: "Clash", on: true, html: "<p>x</p>", seoDescription: "" }] })).toMatchObject({ ok: false, errorKey: "siteEditor.refuseCustomSlug" });
    expect(await saveSite(ctx, { announcement: { text: "x", from: "2026-10-20", to: "2026-10-01" } })).toMatchObject({ ok: false, field: "announcement" });
  });

  it("saves the rest, sanitising a custom page and stamping every picture's consent with who ticked it", async () => {
    const ctx = await admin();
    const saved = await saveSite(ctx, {
      heroStyle: "PICTURE",
      heroPicture: { fileId: ids.hero, postId: null, alt: "The school gate", consent: true, consentByUserId: "someone-else" },
      albums: [{ id: "a1", title: "Annual day", pictures: [{ fileId: ids.postPic, postId: ids.post, alt: "ZZ stage", consent: true }] }],
      prospectusFileId: ids.pdf,
      downloads: [{ id: "d1", kind: "FEE_STRUCTURE", title: "Fees", fileId: ids.pdf }],
      enquiryFields: ["GRADE", "EMAIL", "VISIT"],
      customPages: [{ id: "c1", slug: "bus-routes", title: "Bus routes", on: true, html: '<p onclick="x">Three <b>buses</b></p><script>alert(1)</script>', seoDescription: "" }],
      offerOtherLanguages: true,
      motto: "ZZ Learning together",
    });
    expect(saved.ok).toBe(true);
    if (!saved.ok) return;
    expect(saved.config.heroPicture).toMatchObject({ consent: true, consentByUserId: ids.admin });
    expect(saved.config.albums[0]!.pictures[0]).toMatchObject({ consent: true, consentByUserId: ids.admin });
    expect(saved.config.customPages[0]!.html).toBe("<p>Three <strong>buses</strong></p>");
  });

  it("draws an unsaved draft in the editor's frame, sanitised, and refuses a teacher", async () => {
    await admin();
    const res = await previewPost(new Request("http://localhost/admin/website/preview?lang=en", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ config: { ...(await draftConfigFor(ids.school)).config, motto: "ZZ Typed but not saved", customPages: [{ id: "c1", slug: "bus-routes", title: "Bus routes", on: true, html: "<p>Hi<script>x</script></p>", seoDescription: "" }] }, page: "bus-routes" }) }));
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain("ZZ Typed but not saved");
    expect(html).not.toMatch(/<script/i);
    expect(html).toContain('href="/admin/website/preview/about"');
    await as(ids.teacher, "TEACHER", ids.school);
    expect((await previewPost(new Request("http://localhost/admin/website/preview", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ config: {} }) }))).status).toBe(404);
    await expect(previewHtml(await as(ids.teacher, "TEACHER", ids.school), "en")).rejects.toBeInstanceOf(AccessError);
  });
});

describe("publish every page, served on the school's own domain and counted", () => {
  it("stores the pages besides home, makes the uploaded picture and PDF public with the version, and serves each page", async () => {
    await publishSite(await admin());
    const site = await publishedSiteFor(ids.school);
    expect(site).not.toBeNull();
    expect(Object.keys(site!.pages).sort()).toEqual(expect.arrayContaining(["about", "admissions", "bus-routes", "downloads", "events", "gallery", "news", "contact"]));
    expect(await authorizeFileRead(ids.hero, null)).toMatchObject({ allowed: true, public: true });
    expect(await authorizeFileRead(ids.pdf, null)).toMatchObject({ allowed: true, public: true });

    await db.schoolSiteDomain.create({ data: { schoolId: ids.school, domain: DOMAIN, status: "LIVE", verifiedAt: new Date(), createdByUserId: ids.admin } });
    forgetSiteHosts();
    signedOut();
    const page = (path: string, query = "") => hostRest(new Request(`http://localhost/${path}${query}`, { headers: { host: DOMAIN, "x-forwarded-proto": "https" } }), { params: Promise.resolve({ host: DOMAIN, rest: path.split("/") }) });
    const home = await hostHome(new Request("http://localhost/", { headers: { host: DOMAIN, "x-forwarded-proto": "https" } }), { params: Promise.resolve({ host: DOMAIN }) });
    expect(home.status).toBe(200);
    const homeHtml = await home.text();
    expect(homeHtml).toContain('href="/about"');
    expect(homeHtml).toContain(`<link rel="canonical" href="https://${DOMAIN}/">`);
    const about = await page("about", "?lang=hi");
    expect(about.status).toBe(200);
    expect(about.headers.get("cache-control")).toBe("public, max-age=300");
    expect(about.headers.get("content-security-policy")).toContain("default-src 'none'");
    expect(await about.text()).toContain('<html lang="hi">');
    expect(await (await page("bus-routes")).text()).toContain("<strong>buses</strong>");
    expect((await page("achievements")).status).toBe(404);
    expect((await page("about/deeper")).status).toBe(404);
    expect((await page("login")).status).toBe(404);
  });

  it("counts each page served, a number a day and nothing about the visitor, read by the office as thirty days", async () => {
    const rows = await db.schoolSiteVisit.findMany({ where: { schoolId: ids.school }, select: { page: true, count: true, dateKey: true } });
    const byPage = Object.fromEntries(rows.map((r) => [r.page, r.count]));
    expect(byPage).toMatchObject({ home: 1, about: 1, "bus-routes": 1 });
    expect(byPage.achievements).toBeUndefined();
    const visits = await siteVisits(await admin());
    expect(visits.days).toHaveLength(30);
    expect(visits.total).toBe(3);
    await admin();
    const res = await visitsGet();
    expect(res.status).toBe(200);
  });

  it("serves the office's own view of another page under /sites/<slug>, with its links kept there", async () => {
    await admin();
    const res = await slugPage(new Request(`http://localhost/sites/${SLUG}/about`), { params: Promise.resolve({ slug: SLUG, page: "about" }) });
    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toBe("private, no-store");
    expect(await res.text()).toContain(`href="/sites/${SLUG}/news"`);
    await as(ids.teacher, "TEACHER", ids.school);
    expect((await slugPage(new Request(`http://localhost/sites/${SLUG}/about`), { params: Promise.resolve({ slug: SLUG, page: "about" }) })).status).toBe(404);
  });

  it("takes the form's optional fields on the domain, and the office's inbox counts it", async () => {
    signedOut();
    const post = (fields: Record<string, string>) => hostEnquiry(new Request("http://localhost/enquiry", { method: "POST", headers: { host: DOMAIN, "content-type": "application/x-www-form-urlencoded" }, body: new URLSearchParams(fields) }), { params: Promise.resolve({ host: DOMAIN }) });
    expect((await post({ name: "ZZ Hindi Parent", contact: "+91 98200 00000", email: `zz-two-parent-${STAMP}@test.invalid`, visit: "yes", grade: "6", message: "क्या प्रवेश खुला है?", lang: "hi" })).status).toBe(200);
    expect((await post({ name: "ZZ Phone Parent", contact: "+91 98200 11111", message: "Call me", lang: "en" })).status).toBe(200);
    const inbox = await siteInbox(await admin());
    expect(inbox.counts).toEqual({ NEW: 2, REPLIED: 0, CLOSED: 0 });
    const hindi = inbox.enquiries.find((e) => e.name === "ZZ Hindi Parent")!;
    expect(hindi).toMatchObject({ wantsVisit: true, grade: "6", language: "hi", replyTo: `zz-two-parent-${STAMP}@test.invalid` });
    expect(inbox.enquiries.find((e) => e.name === "ZZ Phone Parent")!.replyTo).toBeNull();
  });
});

describe("the enquiries inbox", () => {
  it("replies by email in the enquirer's language, keeps the words, audits it; a phone-only enquiry is 409", async () => {
    const inbox = await siteInbox(await admin());
    const hindi = inbox.enquiries.find((e) => e.name === "ZZ Hindi Parent")!;
    const phone = inbox.enquiries.find((e) => e.name === "ZZ Phone Parent")!;
    const made = await replyToSiteEnquiry(await admin(), hindi.id, "हाँ, जनवरी में।");
    expect(made).toMatchObject({ ok: true, enquiry: { status: "REPLIED", replyText: "हाँ, जनवरी में।" } });
    const mail = await db.outboundEmail.findFirst({ where: { to: `zz-two-parent-${STAMP}@test.invalid` }, orderBy: { createdAt: "desc" } });
    expect(mail?.purpose).toBe("SITE_ENQUIRY_REPLY");
    expect(mail?.subject).toContain("की ओर से उत्तर");
    expect(mail?.text).toContain("प्रिय ZZ Hindi Parent");
    expect(await db.auditLog.count({ where: { schoolId: ids.school, action: "site.enquiry.reply", targetId: hindi.id } })).toBe(1);
    expect(actionKey("site.enquiry.reply")).toBe("audit.siteEnquiryReply");
    expect(await replyToSiteEnquiry(await admin(), phone.id, "Hello")).toMatchObject({ ok: false, status: 409 });
    await admin();
    const door = await replyPost(new Request("http://localhost", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ text: "Hi" }) }), { params: Promise.resolve({ enquiryId: phone.id }) });
    expect(door.status).toBe(409);
    expect((await replyPost(new Request("http://localhost", { method: "POST", headers: { "content-type": "application/json" }, body: "{}" }), { params: Promise.resolve({ enquiryId: phone.id }) })).status).toBe(422);
  });

  it("closes and opens again, audited; the door lists by state", async () => {
    const inbox = await siteInbox(await admin());
    const phone = inbox.enquiries.find((e) => e.name === "ZZ Phone Parent")!;
    expect((await setSiteEnquiryStatus(await admin(), phone.id, "CLOSED")).status).toBe("CLOSED");
    expect((await setSiteEnquiryStatus(await admin(), phone.id, "CLOSED")).status).toBe("CLOSED");
    expect(await db.auditLog.count({ where: { schoolId: ids.school, action: "site.enquiry.status", targetId: phone.id } })).toBe(1);
    expect((await setSiteEnquiryStatus(await admin(), phone.id, "NEW")).status).toBe("NEW");
    await setSiteEnquiryStatus(await admin(), phone.id, "CLOSED");
    await admin();
    const res = await enquiriesGet(new Request("http://localhost/api/v1/admin/site/enquiries?status=CLOSED"));
    expect(res.status).toBe(200);
    expect(((await res.json()) as { enquiries: unknown[] }).enquiries).toHaveLength(1);
  });

  it("the weekly tidy deletes what was closed or untouched for 180 days and keeps the rest, and old visit counts", async () => {
    const old = new Date(Date.now() - 200 * 24 * 60 * 60_000);
    await db.schoolSiteEnquiry.updateMany({ where: { schoolId: ids.school, name: "ZZ Phone Parent" }, data: { closedAt: old, lastActivityAt: old } });
    await db.schoolSiteVisit.create({ data: { schoolId: ids.school, dateKey: "2024-01-01", page: "home", count: 5 } });
    const run = await tidySiteEnquiries(new Date(), { schoolIds: [ids.school] });
    expect(run).toMatchObject({ deleted: 1, visitsPruned: 1 });
    expect((await db.schoolSiteEnquiry.findMany({ where: { schoolId: ids.school } })).map((e) => e.name)).toEqual(["ZZ Hindi Parent"]);
    expect(JOBS["site:enquiries"].schedule).toBe("30 4 * * 0");
  });
});

describe("versions, restore and back to published", () => {
  it("lists the versions with who published them, restores one as the draft and goes back to the published, audited", async () => {
    await saveSite(await admin(), { motto: "ZZ A changed motto" });
    expect((await loadSite(await admin())).unpublishedChanges).toBe(true);
    await publishSite(await as(ids.head, "PRINCIPAL", ids.school));
    const versions = await siteVersions(await admin());
    expect(versions.length).toBe(2);
    expect(versions[0]).toMatchObject({ live: true, byName: "ZZ Two Head", nightly: false });
    const restored = await restoreSiteVersion(await admin(), versions[1]!.id);
    expect(restored.motto).toBe("ZZ Learning together");
    expect((await loadSite(await admin())).unpublishedChanges).toBe(true);
    const back = await restoreSiteVersion(await admin(), null);
    expect(back.motto).toBe("ZZ A changed motto");
    expect((await loadSite(await admin())).unpublishedChanges).toBe(false);
    expect(await db.auditLog.count({ where: { schoolId: ids.school, action: "site.restore" } })).toBe(2);
    await admin();
    expect((await versionsGet()).status).toBe(200);
    expect((await restorePost(new Request("http://localhost", { method: "POST", body: "{}", headers: { "content-type": "application/json" } }), { params: Promise.resolve({ versionId: versions[1]!.id }) })).status).toBe(422);
    expect((await restorePost(new Request("http://localhost", { method: "POST", body: JSON.stringify({ confirm: true }), headers: { "content-type": "application/json" } }), { params: Promise.resolve({ versionId: "zz-no-such" }) })).status).toBe(404);
    await as(ids.teacher, "TEACHER", ids.school);
    expect((await versionsGet()).status).toBe(403);
  });
});

describe("a link to review the draft", () => {
  it("opens the draft signed out, with its pictures, until it is revoked; a new link closes the old one", async () => {
    const first = await createSiteShare(await admin(), 7);
    const token = first.url.split("/sites/review/")[1]!;
    expect(token.length).toBeGreaterThanOrEqual(32);
    expect(await db.schoolSiteShare.count({ where: { schoolId: ids.school, tokenHash: token } })).toBe(0);
    signedOut();
    const res = await reviewHome(new Request(`http://localhost/sites/review/${token}`), { params: Promise.resolve({ token }) });
    expect(res.status).toBe(200);
    expect(res.headers.get("x-robots-tag")).toBe("noindex");
    expect(res.headers.get("cache-control")).toBe("private, no-store");
    const html = await res.text();
    expect(html).toContain("A draft shared for review");
    expect(html).toContain(`?w=1280&amp;review=${token}`);
    expect(html).toContain(`href="/sites/review/${token}/about"`);
    expect((await reviewPage(new Request(`http://localhost/sites/review/${token}/about`), { params: Promise.resolve({ token, page: "about" }) })).status).toBe(200);
    expect((await reviewPage(new Request(`http://localhost/sites/review/${token}/nope`), { params: Promise.resolve({ token, page: "nope" }) })).status).toBe(404);
    expect(await siteReviewFileOpen(ids.hero, token)).toBe(true);
    expect(await siteReviewFileOpen("zz-not-in-the-draft.png", token)).toBe(false);

    const second = await createSiteShare(await admin(), 1);
    expect(await schoolForReviewToken(token)).toBeNull();
    const secondToken = second.url.split("/sites/review/")[1]!;
    expect(await schoolForReviewToken(secondToken)).toBe(ids.school);
    await revokeSiteShare(await admin(), second.id);
    signedOut();
    expect((await reviewHome(new Request(`http://localhost/sites/review/${secondToken}`), { params: Promise.resolve({ token: secondToken }) })).status).toBe(404);
    expect(await db.auditLog.count({ where: { schoolId: ids.school, action: { in: ["site.share.create", "site.share.revoke"] } } })).toBe(3);
    // An expired link is closed too.
    const third = await createSiteShare(await admin(), 7);
    await db.schoolSiteShare.update({ where: { id: third.id }, data: { expiresAt: new Date(Date.now() - 1000) } });
    expect(await schoolForReviewToken(third.url.split("/sites/review/")[1]!)).toBeNull();
  });

  it("the doors: 422 for an empty body, 404 for a link that is not one, 403 for a teacher", async () => {
    await admin();
    expect((await sharesPost(new Request("http://localhost", { method: "POST", body: "{}", headers: { "content-type": "application/json" } }))).status).toBe(422);
    expect((await shareDelete(new Request("http://localhost", { method: "DELETE" }), { params: Promise.resolve({ shareId: "zz-no-such" }) })).status).toBe(404);
    await as(ids.teacher, "TEACHER", ids.school);
    expect((await sharesPost(new Request("http://localhost", { method: "POST", body: JSON.stringify({ days: 7 }), headers: { "content-type": "application/json" } }))).status).toBe(403);
  });
});

describe("the post page's tick, and the catalog", () => {
  it("takes a post out of the news and puts it back from the post itself", async () => {
    expect(await postOnSite(await admin(), ids.post)).toEqual({ on: true, allowed: true });
    expect((await setPostOnSite(await admin(), ids.post, false)).ok).toBe(true);
    expect(await postOnSite(await admin(), ids.post)).toEqual({ on: false, allowed: true });
    expect((await setPostOnSite(await admin(), ids.post, true)).ok).toBe(true);
    expect((await draftConfigFor(ids.school)).config.newsPostIds).toContain(ids.post);
    expect(await postOnSite(await as(ids.teacher, "TEACHER", ids.school), ids.post)).toBeNull();
  });

  it("lists every new door for the office and the head behind the WEBSITE module, with words for its audit actions", () => {
    const doors = ENDPOINTS.filter((e) => /^\/api\/v1\/admin\/site\/(versions|revert|shares|enquiries|visits|files)/.test(e.path));
    expect(doors).toHaveLength(11);
    for (const d of doors) {
      expect(d.module, d.path).toBe("WEBSITE");
      expect(d.access).toEqual(["ADMIN", "PRINCIPAL"]);
    }
    for (const a of ["site.restore", "site.share.create", "site.share.revoke", "site.enquiry.reply", "site.enquiry.status"]) expect(actionKey(a), a).toMatch(/^audit\.site/);
  });
});
