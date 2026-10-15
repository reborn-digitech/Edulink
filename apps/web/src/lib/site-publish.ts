import "server-only";
import { SITE_LANGUAGES, type SiteConfig, type SiteLanguage } from "@edulink/contracts";
import { db } from "./db";
import { readJson, readJsonArray, type MediaItem } from "./json";
import { todayKey } from "./dates";
import { forSchool } from "./tenant-context";
import { isModuleOn } from "./modules";
import { publicFaculty } from "./faculty-profile";
import { defaultSiteConfig, repairSiteConfig, sectionOn } from "./site-config";
import { numbersHash, siteMetrics } from "./site-metrics";
import { renderSite, type SiteData, type SiteImage, type SiteNewsItem } from "./site-render";

/**
 * PUBLISHING A SCHOOL'S WEBSITE, AND READING THE PUBLISHED ONE (website-builder A, 15 October 2026).
 *
 * The one writer of SchoolSiteVersion. Publish (site-admin.ts, the office's or the head's act) and the nightly
 * site:refresh job both come through `renderAndStore`: gather the data the page shows, render every language
 * the site offers, store the version and make it the live one in one transaction — the previous live version
 * loses `liveAt` there, so the partial unique index never sees two.
 *
 * THE PUBLIC READ has no session: `schoolIdForSlug` and `publishedSiteFor` read the live version through the
 * clause that opens a live row to anyone (scripts/gen-rls.ts, GLOBALLY_READABLE), as /public/disclosure/<slug>
 * reads a published disclosure; the module check then runs under the school's own binding, with the school id
 * the database returned (never one a URL named). Builder B's host routing (site-hosts.ts, /sites/by-host/<host>)
 * calls these two and nothing else of this file.
 *
 * THE NIGHTLY REFRESH re-renders each live site from the config it was PUBLISHED with (the version's snapshot,
 * not the draft the office may be half-way through), and stores a new version only when the numbers changed.
 * A post taken down since, or a picture whose consent was withdrawn by unpublishing the post, drops out then.
 */

export type PublishedSite = {
  html: Record<SiteLanguage, string>;
  renderedAt: Date;
  /** The site's own language, served when no ?lang= is asked or the one asked is not offered. */
  language: SiteLanguage;
  /** The site's colour, for the small pages (the enquiry's thank-you) to wear. */
  colour: string;
};

/** What a version's snapshot records: the config it was cut from, the data's ids and the gallery's consent ticks. */
export type SiteSnapshot = {
  config: SiteConfig;
  numbers: SiteData["numbers"];
  numbersDateKey: string;
  newsPostIds: string[];
  gallery: { fileId: string; postId: string; consentByUserId: string | null; consentAt: string | null }[];
  renderedAt: string;
};

/** The app's own address, for the links that live on it (the disclosure, faculty pages, the footer). */
export function appUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/+$/, "");
}

/** The versions kept per school besides the live one: Unpublish keeps versions, but not forever. */
const VERSIONS_KEPT = 20;

/* ------------------------------------------------------------------------------------------------ */
/* The public read                                                                                 */
/* ------------------------------------------------------------------------------------------------ */

/**
 * The school whose website is live at this slug, or null. Readable signed out. Only `<slug>.localhost` in a
 * development process reaches a site by its slug (src/lib/site-hosts.ts, 16 Oct 2026); the public site is on the
 * school's own domain, and /sites/<slug> is the office's signed-in view.
 */
export async function schoolIdForSlug(slug: string): Promise<string | null> {
  if (!/^[a-z0-9-]{1,80}$/.test(slug)) return null;
  const row = await db.schoolSiteVersion.findFirst({ where: { schoolSlug: slug, liveAt: { not: null } }, select: { schoolId: true } });
  return row?.schoolId ?? null;
}

/** The school's live website (every language it offers), or null when it is not published or WEBSITE is off. */
export async function publishedSiteFor(schoolId: string): Promise<PublishedSite | null> {
  const row = await db.schoolSiteVersion.findFirst({ where: { schoolId, liveAt: { not: null } }, select: { schoolId: true, html: true, renderedAt: true, snapshotJson: true } });
  if (!row) return null;
  // The school id is the database's own answer above, so binding to it is the rule tenant-context.ts asks for.
  if (!(await forSchool(row.schoolId, () => isModuleOn(row.schoolId, "WEBSITE")))) return null;
  const html = readJson<Partial<Record<SiteLanguage, string>>>(row.html, {});
  const snapshot = readJson<Partial<SiteSnapshot>>(row.snapshotJson, {});
  const language = (SITE_LANGUAGES as readonly string[]).includes(snapshot.config?.language ?? "") ? (snapshot.config!.language as SiteLanguage) : "en";
  const own = html[language] ?? Object.values(html).find(Boolean) ?? "";
  if (!own) return null;
  // A language the site does not offer answers with the site's own: the route never says "not found" for ?lang=.
  const full = Object.fromEntries(SITE_LANGUAGES.map((l) => [l, html[l] || own])) as Record<SiteLanguage, string>;
  return { html: full, renderedAt: row.renderedAt, language, colour: snapshot.config?.colour ?? "#1d4ed8" };
}

/** The HTML for one request: ?lang= when it names a language, else the site's own. */
export function siteHtmlFor(site: PublishedSite, lang: string | null | undefined): { html: string; language: SiteLanguage } {
  const language = (SITE_LANGUAGES as readonly string[]).includes(lang ?? "") ? (lang as SiteLanguage) : site.language;
  return { html: site.html[language], language };
}

/* ------------------------------------------------------------------------------------------------ */
/* Gathering the data a page shows                                                                 */
/* ------------------------------------------------------------------------------------------------ */

/** A post a site may carry: the school's own, school-wide, approved, addressed to everyone. */
export const SITE_POST_WHERE = { scope: "SCHOOL", status: "APPROVED", audience: "ALL", audienceGrade: null, audienceTarget: null } as const;

function imagesOf(media: string): MediaItem[] {
  return readJsonArray<MediaItem>(media).filter((m) => m && m.kind === "image" && typeof m.fileId === "string" && m.fileId.length > 0);
}

/** The school's draft, brought to the current shape (the defaults when there is none yet). Caller binds the school. */
export async function draftConfigFor(schoolId: string, logoSwatch?: string | null): Promise<{ config: SiteConfig; exists: boolean; publishedVersionId: string | null }> {
  const [school, site] = await Promise.all([
    db.school.findUniqueOrThrow({ where: { id: schoolId }, select: { locale: true, profileAbout: true, addressLine: true, city: true, region: true, postalCode: true, contactEmail: true, contactPhone: true, board: true, affiliationNumber: true, kind: true } }),
    db.schoolSite.findUnique({ where: { schoolId }, select: { configJson: true, publishedVersionId: true } }),
  ]);
  const defaults = defaultSiteConfig({ ...school, logoSwatch: logoSwatch ?? null });
  if (!site) return { config: defaults, exists: false, publishedVersionId: null };
  return { config: repairSiteConfig(readJson<unknown>(site.configJson, {}), defaults), exists: true, publishedVersionId: site.publishedVersionId };
}

/** Everything a page shows besides the draft, read under the school's binding. */
export async function gatherSiteData(schoolId: string, config: SiteConfig, now: Date = new Date()): Promise<SiteData> {
  return forSchool(schoolId, async () => {
    const school = await db.school.findUniqueOrThrow({ where: { id: schoolId }, select: { name: true, slug: true, logoPath: true, timezone: true } });
    const wantNews = sectionOn(config, "NEWS") ? config.newsPostIds : [];
    const wantGallery = sectionOn(config, "GALLERY") ? config.gallery.filter((g) => g.consent) : [];
    const postIds = [...new Set([...wantNews, ...wantGallery.map((g) => g.postId)])];
    const [numbers, faculty, disclosure, posts, principal] = await Promise.all([
      siteMetrics(schoolId, { board: config.board, foundedYear: config.foundedYear }, now),
      sectionOn(config, "FACULTY") ? publicFaculty(school.slug) : Promise.resolve({ collegeName: null, profiles: [] }),
      db.disclosurePage.findFirst({ where: { schoolId, publishedAt: { not: null } }, select: { id: true } }),
      postIds.length ? db.post.findMany({ where: { schoolId, id: { in: postIds }, ...SITE_POST_WHERE }, select: { id: true, title: true, body: true, media: true, createdAt: true } }) : Promise.resolve([]),
      config.principalNamed
        ? db.membership.findFirst({ where: { schoolId, role: "PRINCIPAL", status: "ACTIVE", leftAt: null }, orderBy: { joinedAt: "asc" }, select: { user: { select: { name: true } } } })
        : Promise.resolve(null),
    ]);
    const postById = new Map(posts.map((p) => [p.id, p]));
    const news: SiteNewsItem[] = wantNews.flatMap((id) => {
      const p = postById.get(id);
      if (!p) return [];
      const first = imagesOf(p.media)[0];
      return [{ id: p.id, title: p.title, body: p.body, dateKey: todayKey(school.timezone, p.createdAt), image: first ? { fileId: first.fileId, alt: first.alt } : null }];
    });
    const gallery: SiteImage[] = wantGallery.flatMap((g) => {
      const media = postById.get(g.postId) ? imagesOf(postById.get(g.postId)!.media).find((m) => m.fileId === g.fileId) : undefined;
      return media ? [{ fileId: media.fileId, alt: media.alt }] : [];
    });
    return {
      schoolName: school.name,
      slug: school.slug,
      logoFileId: school.logoPath,
      numbers,
      numbersDateKey: todayKey(school.timezone, now),
      faculty: faculty.profiles.map((f) => ({ name: f.name, designation: f.designation, department: f.departmentName ?? "" })),
      appUrl: appUrl(),
      disclosurePublished: Boolean(disclosure),
      facultyPublished: faculty.profiles.length > 0,
      news,
      gallery,
      principalName: principal?.user.name ?? null,
    };
  });
}

/** The languages a version carries: the site's own, and the other two when the switch offers them. */
export function languagesOf(config: SiteConfig): SiteLanguage[] {
  return config.offerOtherLanguages ? [config.language, ...SITE_LANGUAGES.filter((l) => l !== config.language)] : [config.language];
}

/* ------------------------------------------------------------------------------------------------ */
/* The one writer                                                                                  */
/* ------------------------------------------------------------------------------------------------ */

/**
 * Render `config` for the school, store it as a new version and make that the live one. `config` is the draft
 * at Publish and the live version's own at the nightly refresh. The caller has checked who may publish; this
 * binds the school itself, so the job (no session) and the office's act take the same path.
 */
export async function renderAndStore(schoolId: string, byUserId: string | null, config: SiteConfig, now: Date = new Date()): Promise<{ versionId: string; renderedAt: Date }> {
  const data = await gatherSiteData(schoolId, config, now);
  const html = Object.fromEntries(languagesOf(config).map((l) => [l, renderSite(config, data, l)]));
  const consentOf = new Map(config.gallery.map((g) => [g.fileId, g]));
  const snapshot: SiteSnapshot = {
    config,
    numbers: data.numbers,
    numbersDateKey: data.numbersDateKey,
    newsPostIds: data.news.map((n) => n.id),
    gallery: data.gallery.map((g) => ({ fileId: g.fileId, postId: consentOf.get(g.fileId)?.postId ?? "", consentByUserId: consentOf.get(g.fileId)?.consentByUserId ?? null, consentAt: consentOf.get(g.fileId)?.consentAt ?? null })),
    renderedAt: now.toISOString(),
  };
  const imageFileIds = [...new Set([...data.news.flatMap((n) => (n.image ? [n.image.fileId] : [])), ...data.gallery.map((g) => g.fileId)])];

  return forSchool(schoolId, async () => {
    const school = await db.school.findUniqueOrThrow({ where: { id: schoolId }, select: { slug: true } });
    const made = await db.$tenantTransaction(async (raw) => {
      const tx = raw as typeof db;
      const site = await tx.schoolSite.upsert({
        where: { schoolId },
        create: { schoolId, configJson: JSON.stringify(config), updatedByUserId: byUserId },
        update: {},
        select: { id: true },
      });
      await tx.schoolSiteVersion.updateMany({ where: { schoolId, liveAt: { not: null } }, data: { liveAt: null } });
      const version = await tx.schoolSiteVersion.create({
        data: { schoolId, siteId: site.id, schoolSlug: school.slug, snapshotJson: JSON.stringify(snapshot), html: JSON.stringify(html), imageFileIds, numbersHash: numbersHash(data.numbers), renderedAt: now, numbersAt: now, publishedByUserId: byUserId, liveAt: now },
        select: { id: true, renderedAt: true },
      });
      await tx.schoolSite.update({ where: { id: site.id }, data: { publishedVersionId: version.id } });
      return version;
    });
    await pruneVersions(schoolId);
    return { versionId: made.id, renderedAt: made.renderedAt };
  });
}

/** Take the live version down: the public route answers 404 from the next request. Versions are kept. Caller binds the school. */
export async function takeDown(schoolId: string): Promise<boolean> {
  return forSchool(schoolId, async () => {
    const gone = await db.$tenantTransaction(async (raw) => {
      const tx = raw as typeof db;
      const down = await tx.schoolSiteVersion.updateMany({ where: { schoolId, liveAt: { not: null } }, data: { liveAt: null } });
      await tx.schoolSite.updateMany({ where: { schoolId }, data: { publishedVersionId: null } });
      return down.count;
    });
    return gone > 0;
  });
}

/** Keep the newest VERSIONS_KEPT versions besides the live one. */
async function pruneVersions(schoolId: string): Promise<void> {
  const old = await db.schoolSiteVersion.findMany({ where: { schoolId, liveAt: null }, orderBy: { renderedAt: "desc" }, skip: VERSIONS_KEPT, select: { id: true } });
  if (old.length) await db.schoolSiteVersion.deleteMany({ where: { schoolId, id: { in: old.map((o) => o.id) } } });
}

/* ------------------------------------------------------------------------------------------------ */
/* The nightly refresh (site:refresh, 03:30)                                                       */
/* ------------------------------------------------------------------------------------------------ */

/**
 * Every live site's numbers counted again; a new version is stored only where they changed, rendered from
 * the config the site was published with. A school whose WEBSITE module is off is left alone (its site
 * already answers 404). `schoolIds` narrows the run to those schools (a test's own).
 */
export async function refreshPublishedSites(now: Date = new Date(), scope: { schoolIds?: string[] } = {}): Promise<{ checked: number; refreshed: number; failed: number; perSchool: Record<string, Record<string, number>> }> {
  const live = await db.schoolSiteVersion.findMany({
    where: { liveAt: { not: null }, ...(scope.schoolIds ? { schoolId: { in: scope.schoolIds } } : {}) },
    select: { schoolId: true, snapshotJson: true, numbersHash: true },
  });
  let refreshed = 0;
  let failed = 0;
  const perSchool: Record<string, Record<string, number>> = {};
  for (const row of live) {
    try {
      const outcome = await forSchool(row.schoolId, async () => {
        if (!(await isModuleOn(row.schoolId, "WEBSITE"))) return "off" as const;
        const snapshot = readJson<Partial<SiteSnapshot>>(row.snapshotJson, {});
        const { config: draftDefaults } = await draftConfigFor(row.schoolId);
        const config = repairSiteConfig(snapshot.config ?? {}, draftDefaults);
        const numbers = await siteMetrics(row.schoolId, { board: config.board, foundedYear: config.foundedYear }, now);
        if (numbersHash(numbers) === row.numbersHash) return "same" as const;
        await renderAndStore(row.schoolId, null, config, now);
        return "refreshed" as const;
      });
      if (outcome === "refreshed") {
        refreshed += 1;
        perSchool[row.schoolId] = { refreshed: 1 };
      }
    } catch (error) {
      failed += 1;
      perSchool[row.schoolId] = { failed: 1 };
      console.error("[site:refresh]", row.schoolId, error);
    }
  }
  return { checked: live.length, refreshed, failed, perSchool };
}
