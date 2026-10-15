import type { PrismaClient } from "@prisma/client";
import type { SiteConfig } from "@edulink/contracts";
import { SITE_METRICS, SITE_SECTIONS } from "@edulink/contracts";
import { storeFile } from "../src/lib/storage";
import { defaultSiteConfig } from "../src/lib/site-config";
import { renderAndStore } from "../src/lib/site-publish";
import { fixturePng } from "./png";

/**
 * ZZ NORTHGATE'S PUBLIC WEBSITE (website-builder A, 15 October 2026): the WEBSITE module on, a draft with every
 * section and every number switched on, one approved school-wide post with a picture (the News item and, with
 * the admin's consent tick, the Gallery's one picture), and a published version — so /admin/website opens on a
 * live site, /sites/zz-northgate-school answers 200 to Northgate's own office and head (the public site is on the
 * school's own domain only, 16 Oct 2026; the fixture's www.zz-northgate.test waits for DNS) and, in development,
 * http://zz-northgate-school.localhost:3000/ serves it by host.
 *
 * IDEMPOTENT. The post is found by its title before it is made; the draft is written back to the fixture's own
 * every run (a test or a hand may have changed it); a version is published only when none is live, so a run
 * leaves an unpublished-by-hand site published again and a published one as it was. Removed with the school by
 * --teardown (every row carries the school id).
 */
export const ZZ_SITE_POST_TITLE = "ZZ Website: Annual day";

export async function buildWebsite(db: PrismaClient, school: { id: string }, adminUserId: string): Promise<{ published: boolean; refreshed: boolean; postId: string; slug: string }> {
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

  const row = await db.school.findUniqueOrThrow({ where: { id: school.id }, select: { slug: true, locale: true, profileAbout: true, addressLine: true, city: true, region: true, postalCode: true, contactEmail: true, contactPhone: true, board: true, affiliationNumber: true, kind: true } });
  const existing = await db.schoolSite.findUnique({ where: { schoolId: school.id }, select: { configJson: true } });
  const before = existing ? (JSON.parse(existing.configJson) as Partial<SiteConfig>) : {};
  const keptConsent = before.gallery?.find((g) => g.fileId === fileId && g.consent);
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
    principalMessage: "ZZ A welcome from the head: a school is its people. This message is a test fixture.",
    principalNamed: false,
    sections: SITE_SECTIONS.map((code) => ({ code, on: true })),
    metrics: [...SITE_METRICS],
    admissionsText: "ZZ Admissions for the next year open in January. Ask below and the office will write back.",
    enquiryForm: true,
    newsPostIds: [post.id],
    gallery: fileId ? [{ postId: post.id, fileId, consent: true, consentByUserId: keptConsent?.consentByUserId ?? adminUserId, consentAt: keptConsent?.consentAt ?? new Date().toISOString() }] : [],
  };
  await db.schoolSite.upsert({
    where: { schoolId: school.id },
    create: { schoolId: school.id, configJson: JSON.stringify(config), updatedByUserId: adminUserId },
    update: { configJson: JSON.stringify(config), updatedByUserId: adminUserId },
  });

  const live = await db.schoolSiteVersion.findFirst({ where: { schoolId: school.id, liveAt: { not: null } }, select: { id: true, html: true } });
  // A version rendered before 16 Oct 2026 posts its enquiry form to the slug path /sites/<slug>/enquiry, which no
  // longer exists (a site is public only on its own domain, where the form posts to /enquiry): render it again once.
  const stale = Boolean(live && live.html.includes('action=\\"/sites/'));
  if (!live || stale) await renderAndStore(school.id, adminUserId, config);
  return { published: !live, refreshed: stale, postId: post.id, slug: row.slug };
}
