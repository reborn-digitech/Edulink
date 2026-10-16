import type { PrismaClient } from "@prisma/client";
import type { SiteConfig, SitePicture } from "@edulink/contracts";
import { SITE_METRICS, SITE_SECTIONS } from "@edulink/contracts";
import { storeFile } from "../src/lib/storage";
import { defaultPages, defaultSiteConfig } from "../src/lib/site-config";
import { renderAndStore } from "../src/lib/site-publish";
import { addDaysToKey, todayKey } from "../src/lib/dates";
import { fixturePng } from "./png";

/**
 * ZZ NORTHGATE'S PUBLIC WEBSITE (website-builder A, 15 October 2026; website-two, 16 October 2026): the WEBSITE module
 * on, a draft with every page and every home section switched on and something on each — the academics words, how to
 * apply with a prospectus PDF, two facilities, an album, a proud moment, a download, a custom page, the hero picture,
 * an announcement for the next month, the footer's links — one approved school-wide post with a picture (the news
 * item and, with the admin's consent tick, every picture the site shows), and a published version of every page; the
 * enquiries inbox with one enquiry replied and one new; and a week of page-view counts. /admin/website opens on a
 * finished site, /sites/zz-northgate-school answers 200 to Northgate's own office and head (the public site is on the
 * school's own domain only; the fixture's www.zz-northgate.test waits for DNS) and, in development,
 * http://zz-northgate-school.localhost:3000/ serves it by host, every page.
 *
 * IDEMPOTENT. The post, the PDF, the enquiries and the visit rows are found by their names or keys before they are
 * made; the draft is written back to the fixture's own every run (a test or a hand may have changed it), keeping the
 * consent stamps it already had; a version is published only when none is live or the live one is from before
 * website-two (no pages besides home) or before 16 Oct (its form posting to a slug path). Removed with the school by
 * --teardown (every row carries the school id).
 */
export const ZZ_SITE_POST_TITLE = "ZZ Website: Annual day";
const ZZ_PDF_NAME = "zz-website-prospectus.pdf";
const ZZ_ENQUIRY_NEW = "ZZ Website: a new enquiry";
const ZZ_ENQUIRY_REPLIED = "ZZ Website: a replied enquiry";

/** A one-page PDF: enough for the store's byte sniff and a browser to open. */
function fixturePdf(): Uint8Array<ArrayBuffer> {
  return new TextEncoder().encode("%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[]/Count 0>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF\n");
}

export async function buildWebsite(db: PrismaClient, school: { id: string }, adminUserId: string): Promise<{ published: boolean; refreshed: boolean; postId: string; slug: string; enquiries: number; visits: number }> {
  await db.schoolModule.createMany({ data: [{ schoolId: school.id, module: "WEBSITE", enabledByUserId: adminUserId }], skipDuplicates: true });

  let post = await db.post.findFirst({ where: { schoolId: school.id, title: ZZ_SITE_POST_TITLE, scope: "SCHOOL" }, select: { id: true, media: true } });
  if (!post) {
    const stored = await storeFile(new File([new Uint8Array(fixturePng(800, 600))], "zz-annual-day.png", { type: "image/png" }));
    post = await db.post.create({
      data: {
        schoolId: school.id,
        authorUserId: adminUserId,
        scope: "SCHOOL",
        title: ZZ_SITE_POST_TITLE,
        body: "ZZ Northgate's annual day: songs by every class, a play by Grade 8 and the prizes. A ZZ test fixture.",
        media: JSON.stringify([{ fileId: stored.fileId, kind: "image", alt: "ZZ test picture: a white card with a dark stroke" }]),
        category: "EVENTS",
        audience: "ALL",
        status: "APPROVED",
        reviewedAt: new Date(),
      },
      select: { id: true, media: true },
    });
  }
  const fileId = (JSON.parse(post.media) as { fileId: string }[])[0]?.fileId ?? null;

  // The prospectus: a PDF uploaded for the site, made once.
  let pdf = await db.schoolSiteFile.findFirst({ where: { schoolId: school.id, name: ZZ_PDF_NAME }, select: { fileId: true } });
  if (!pdf) {
    const stored = await storeFile(new File([new Uint8Array(fixturePdf())], ZZ_PDF_NAME, { type: "application/pdf" }));
    pdf = await db.schoolSiteFile.create({ data: { schoolId: school.id, fileId: stored.fileId, kind: "PDF", mime: stored.mime, size: stored.size, name: ZZ_PDF_NAME, uploadedByUserId: adminUserId }, select: { fileId: true } });
  }

  const row = await db.school.findUniqueOrThrow({ where: { id: school.id }, select: { slug: true, locale: true, profileAbout: true, addressLine: true, city: true, region: true, postalCode: true, contactEmail: true, contactPhone: true, board: true, affiliationNumber: true, kind: true, medium: true, timezone: true } });
  const existing = await db.schoolSite.findUnique({ where: { schoolId: school.id }, select: { configJson: true } });
  const before = existing ? (JSON.parse(existing.configJson) as Partial<SiteConfig>) : {};
  const keptConsent = before.gallery?.find((g) => g.fileId === fileId && g.consent);
  const stamp = { consentByUserId: keptConsent?.consentByUserId ?? adminUserId, consentAt: keptConsent?.consentAt ?? new Date().toISOString() };
  const picture = (alt: string): SitePicture | null => (fileId ? { fileId, postId: post.id, alt, consent: true, ...stamp } : null);
  const today = todayKey(row.timezone);
  const config: SiteConfig = {
    ...defaultSiteConfig(row),
    template: "CLASSIC",
    offerOtherLanguages: true,
    motto: "ZZ Learning together, every day",
    about: row.profileAbout.trim() || "ZZ Northgate School is a ZZ test fixture. Nothing on this site describes a real school.\n\nIts pages show what a school's website looks like when every section is switched on.",
    phones: row.contactPhone ? [row.contactPhone] : ["+91 20 0000 0000"],
    hours: "Monday to Saturday, 8:30 to 3:30",
    mapUrl: "https://www.openstreetmap.org/#map=15/18.5204/73.8567",
    foundedYear: 1998,
    medium: row.medium?.trim() || "English",
    principalMessage: "ZZ A welcome from the head: a school is its people. This message is a test fixture.",
    principalNamed: false,
    sections: SITE_SECTIONS.map((code) => ({ code, on: true })),
    pages: defaultPages(),
    metrics: [...SITE_METRICS],
    admissionsText: "ZZ Admissions for the next year open in January. Ask below and the office will write back.",
    enquiryForm: true,
    enquiryFields: ["GRADE", "EMAIL", "VISIT"],
    newsPostIds: [post.id],
    gallery: fileId ? [{ postId: post.id, fileId, consent: true, ...stamp }] : [],
    // website-two (16 Oct 2026)
    heroStyle: "PICTURE",
    heroPicture: picture("ZZ test picture: the annual day stage"),
    announcement: { text: "ZZ Admissions for 2027 open in January", from: today, to: addDaysToKey(today, 30) },
    social: { facebook: "https://www.facebook.com/zz-northgate", instagram: "", youtube: "https://www.youtube.com/@zz-northgate", whatsapp: "919800000000" },
    academicsText: "ZZ We teach by doing: every class keeps a garden and a science notebook. A test fixture.",
    prospectusFileId: pdf.fileId,
    facilities: [
      { code: "LIBRARY", label: "", line: "ZZ Four thousand books and a reading corner.", picture: picture("ZZ test picture: the library") },
      { code: "CUSTOM", label: "ZZ Music room", line: "ZZ Harmoniums and tablas for every class.", picture: null },
    ],
    albums: fileId ? [{ id: "zz-annual-day", title: "ZZ Annual day", pictures: [picture("ZZ test picture: the annual day")!] }] : [],
    achievements: [{ id: "zz-science-fair", title: "ZZ District science fair, first place", dateKey: "2026-09-12", line: "ZZ The Grade 8 team's water filter. A test fixture.", picture: null }],
    downloads: [{ id: "zz-fees", kind: "FEE_STRUCTURE", title: "ZZ Fee structure 2026–27", fileId: pdf.fileId }],
    customPages: [{ id: "zz-transport", slug: "transport", title: "ZZ Transport", on: true, html: "<h2>ZZ Bus routes</h2><p>Three <strong>buses</strong> cover the town. A test fixture.</p><ul><li>ZZ North route</li><li>ZZ River route</li></ul>", seoDescription: "ZZ Northgate's bus routes." }],
  };
  await db.schoolSite.upsert({
    where: { schoolId: school.id },
    create: { schoolId: school.id, configJson: JSON.stringify(config), updatedByUserId: adminUserId },
    update: { configJson: JSON.stringify(config), updatedByUserId: adminUserId },
  });

  const live = await db.schoolSiteVersion.findFirst({ where: { schoolId: school.id, liveAt: { not: null } }, select: { id: true, html: true, pagesHtml: true } });
  // A version rendered before 16 Oct 2026 posts its enquiry form to the slug path, and one rendered before website-two
  // has no page besides home: render it again once.
  const stale = Boolean(live && (live.html.includes('action=\\"/sites/') || live.pagesHtml === "{}"));
  if (!live || stale) await renderAndStore(school.id, adminUserId, config);

  // The inbox: one new enquiry, one the office replied to.
  const enquiries = [
    { name: ZZ_ENQUIRY_NEW, contact: "zz.website.parent1@zz.test", email: "", grade: "Grade 3", wantsVisit: true, message: "ZZ Is there a seat in Grade 3 next year?", locale: "en", status: "NEW" },
    { name: ZZ_ENQUIRY_REPLIED, contact: "+91 98200 00000", email: "zz.website.parent2@zz.test", grade: "Grade 6", wantsVisit: false, message: "ZZ क्या बस की सुविधा है?", locale: "hi", status: "REPLIED", replyText: "ZZ हाँ, तीन बसें हैं।", repliedAt: new Date(), repliedByUserId: adminUserId },
  ];
  let madeEnquiries = 0;
  for (const e of enquiries) {
    if (await db.schoolSiteEnquiry.findFirst({ where: { schoolId: school.id, name: e.name }, select: { id: true } })) continue;
    await db.schoolSiteEnquiry.create({ data: { schoolId: school.id, ...e } });
    madeEnquiries += 1;
  }

  // A week of page views, the same numbers every run.
  let visits = 0;
  for (let i = 0; i < 7; i++) {
    const dateKey = addDaysToKey(today, -i);
    for (const [page, count] of [["home", 12 + i], ["admissions", 4 + (i % 3)], ["about", 2 + (i % 2)]] as const) {
      await db.schoolSiteVisit.upsert({ where: { schoolId_dateKey_page: { schoolId: school.id, dateKey, page } }, create: { schoolId: school.id, dateKey, page, count }, update: { count } });
      visits += count;
    }
  }
  return { published: !live, refreshed: stale, postId: post.id, slug: row.slug, enquiries: madeEnquiries, visits };
}
