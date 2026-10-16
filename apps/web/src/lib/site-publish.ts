import "server-only";
import { isCollegeKind, SITE_LANGUAGES, type SiteConfig, type SiteLanguage, type SitePicture } from "@edulink/contracts";
import { db } from "./db";
import { readJson, readJsonArray, type MediaItem } from "./json";
import { todayKey } from "./dates";
import { forSchool } from "./tenant-context";
import { isModuleOn } from "./modules";
import { publicFaculty } from "./faculty-profile";
import { defaultSiteConfig, repairSiteConfig, sectionOn, sitePictures } from "./site-config";
import { numbersHash, siteMetrics } from "./site-metrics";
import { announcementShown, pictureShown, renderSite, sectionHasContent, sitePagesShown, type SiteData, type SiteEventItem, type SiteImage, type SiteNewsItem } from "./site-render";

/**
 * PUBLISHING A SCHOOL'S WEBSITE, AND READING THE PUBLISHED ONE (website-builder A, 15 October 2026; website-two,
 * 16 October 2026: every page of the site, not one).
 *
 * The one writer of SchoolSiteVersion. Publish (site-admin.ts, the office's or the head's act) and the nightly
 * site:refresh job both come through `renderAndStore`: gather the data the pages show, render every page the site
 * shows in every language it offers, store the version and make it the live one in one transaction — the previous
 * live version loses `liveAt` there, so the partial unique index never sees two. `html` keeps the home page (what
 * builder B's sitemap and robots read), `pagesHtml` the others by path.
 *
 * THE PUBLIC READ has no session: `schoolIdForSlug` and `publishedSiteFor` read the live version through the
 * clause that opens a live row to anyone (scripts/gen-rls.ts, GLOBALLY_READABLE), as /public/disclosure/<slug>
 * reads a published disclosure; the module check then runs under the school's own binding, with the school id
 * the database returned (never one a URL named).
 *
 * THE NIGHTLY REFRESH re-renders each live site from the config it was PUBLISHED with (the version's snapshot,
 * not the draft the office may be half-way through), and stores a new version only when what the pages show by
 * date changed: the numbers, the calendar's upcoming entries, or the announcement coming into or going out of its
 * dates. A post taken down since, or a picture whose post was unpublished, drops out then.
 */

export type PublishedSite = {
  /** The home page per language. */
  html: Record<SiteLanguage, string>;
  /** Every other page by its path, per language (each language filled, falling back to the site's own). */
  pages: Record<string, Record<SiteLanguage, string>>;
  renderedAt: Date;
  /** The site's own language, served when no ?lang= is asked or the one asked is not offered. */
  language: SiteLanguage;
  /** The site's colour, for the small pages (the enquiry's thank-you) to wear. */
  colour: string;
};

/** What a version's snapshot records: the config it was cut from, the data's ids and every picture's consent tick. */
export type SiteSnapshot = {
  config: SiteConfig;
  numbers: SiteData["numbers"];
  numbersDateKey: string;
  newsPostIds: string[];
  gallery: { fileId: string; postId: string; consentByUserId: string | null; consentAt: string | null }[];
  /** website-two: every picture the pages show besides the news', with who ticked its consent and when. */
  pictures?: { fileId: string; postId: string | null; consentByUserId: string | null; consentAt: string | null }[];
  /** website-two: the paths of the pages rendered. */
  pages?: string[];
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

/** The school's live website (every page and language it offers), or null when it is not published or WEBSITE is off. */
export async function publishedSiteFor(schoolId: string): Promise<PublishedSite | null> {
  const row = await db.schoolSiteVersion.findFirst({ where: { schoolId, liveAt: { not: null } }, select: { schoolId: true, html: true, pagesHtml: true, renderedAt: true, snapshotJson: true } });
  if (!row) return null;
  // The school id is the database's own answer above, so binding to it is the rule tenant-context.ts asks for.
  if (!(await forSchool(row.schoolId, () => isModuleOn(row.schoolId, "WEBSITE")))) return null;
  const html = readJson<Partial<Record<SiteLanguage, string>>>(row.html, {});
  const snapshot = readJson<Partial<SiteSnapshot>>(row.snapshotJson, {});
  const language = (SITE_LANGUAGES as readonly string[]).includes(snapshot.config?.language ?? "") ? (snapshot.config!.language as SiteLanguage) : "en";
  const own = html[language] ?? Object.values(html).find(Boolean) ?? "";
  if (!own) return null;
  // A language the site does not offer answers with the site's own: the route never says "not found" for ?lang=.
  const fill = (per: Partial<Record<SiteLanguage, string>>, fallback: string) => Object.fromEntries(SITE_LANGUAGES.map((l) => [l, per[l] || per[language] || fallback])) as Record<SiteLanguage, string>;
  const storedPages = readJson<Record<string, Partial<Record<SiteLanguage, string>>>>(row.pagesHtml, {});
  const pages: Record<string, Record<SiteLanguage, string>> = {};
  for (const [path, per] of Object.entries(storedPages)) {
    const first = per[language] ?? Object.values(per).find(Boolean);
    if (first) pages[path] = fill(per, first);
  }
  return { html: fill(html, own), pages, renderedAt: row.renderedAt, language, colour: snapshot.config?.colour ?? "#1d4ed8" };
}

/** The HTML for one request: the page at `path` ("" home) in ?lang= when it names a language, else the site's own; null for no such page. */
export function siteHtmlFor(site: PublishedSite, lang: string | null | undefined, path = ""): { html: string; language: SiteLanguage } | null {
  const language = (SITE_LANGUAGES as readonly string[]).includes(lang ?? "") ? (lang as SiteLanguage) : site.language;
  if (!path) return { html: site.html[language], language };
  const page = site.pages[path];
  return page ? { html: page[language], language } : null;
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
export async function draftConfigFor(schoolId: string, logoSwatch?: string | null): Promise<{ config: SiteConfig; exists: boolean; publishedVersionId: string | null; updatedAt: Date | null }> {
  const [school, site] = await Promise.all([
    db.school.findUniqueOrThrow({ where: { id: schoolId }, select: { locale: true, profileAbout: true, addressLine: true, city: true, region: true, postalCode: true, contactEmail: true, contactPhone: true, board: true, affiliationNumber: true, kind: true, medium: true } }),
    db.schoolSite.findUnique({ where: { schoolId }, select: { configJson: true, publishedVersionId: true, updatedAt: true } }),
  ]);
  const defaults = defaultSiteConfig({ ...school, logoSwatch: logoSwatch ?? null });
  if (!site) return { config: await firstDraft(schoolId, defaults), exists: false, publishedVersionId: null, updatedAt: null };
  return { config: repairSiteConfig(readJson<unknown>(site.configJson, {}), defaults), exists: true, publishedVersionId: site.publishedVersionId, updatedAt: site.updatedAt };
}

/**
 * THE FIRST DRAFT, built for an office that opens the editor before anything was saved (website-two, 16 Oct 2026): the
 * defaults cut from the profile and the logo, the six latest approved school-wide posts as the news, and every home
 * section that has something to show switched on (Admissions always, with its form) — a finished site to change, not
 * an empty form. Pictures are never chosen for the office: each needs its consent tick (decision 0002). Not stored:
 * the first save, or Publish, stores it.
 */
async function firstDraft(schoolId: string, defaults: SiteConfig): Promise<SiteConfig> {
  const latest = await forSchool(schoolId, () => db.post.findMany({ where: { schoolId, ...SITE_POST_WHERE }, orderBy: { createdAt: "desc" }, take: 6, select: { id: true } }));
  const config: SiteConfig = { ...defaults, newsPostIds: latest.map((p) => p.id) };
  const data = await gatherSiteData(schoolId, config);
  config.sections = config.sections.map((s) => ({ code: s.code, on: s.code === "ADMISSIONS" || sectionHasContent(s.code, config, data) }));
  return config;
}

/** Everything the pages show besides the draft, read under the school's binding. */
export async function gatherSiteData(schoolId: string, config: SiteConfig, now: Date = new Date()): Promise<SiteData> {
  return forSchool(schoolId, async () => {
    const school = await db.school.findUniqueOrThrow({ where: { id: schoolId }, select: { name: true, slug: true, logoPath: true, timezone: true, kind: true } });
    const today = todayKey(school.timezone, now);
    const college = isCollegeKind(school.kind);
    const wantNews = sectionOn(config, "NEWS") || config.pages.some((p) => p.code === "NEWS" && p.on) ? config.newsPostIds : [];
    const wantGallery = config.gallery.filter((g) => g.consent);
    const pictures = sitePictures(config);
    const postIds = [...new Set([...wantNews, ...wantGallery.map((g) => g.postId), ...pictures.flatMap((p) => (p.picture.postId ? [p.picture.postId] : []))])];
    const [numbers, faculty, disclosure, posts, principal, events, classes, slots, departments, cycle, siteFiles] = await Promise.all([
      siteMetrics(schoolId, { board: config.board, foundedYear: config.foundedYear }, now),
      publicFaculty(school.slug),
      db.disclosurePage.findFirst({ where: { schoolId, publishedAt: { not: null } }, select: { id: true } }),
      postIds.length ? db.post.findMany({ where: { schoolId, id: { in: postIds }, ...SITE_POST_WHERE }, select: { id: true, title: true, body: true, media: true, createdAt: true } }) : Promise.resolve([]),
      config.principalNamed
        ? db.membership.findFirst({ where: { schoolId, role: "PRINCIPAL", status: "ACTIVE", leftAt: null }, orderBy: { joinedAt: "asc" }, select: { user: { select: { name: true } } } })
        : Promise.resolve(null),
      db.holiday.findMany({ where: { schoolId, endDateKey: { gte: today } }, orderBy: { startDateKey: "asc" }, take: 40, select: { name: true, startDateKey: true, endDateKey: true, kind: true } }),
      college ? Promise.resolve([]) : db.class.findMany({ where: { schoolId, archivedAt: null }, orderBy: [{ gradeLevel: "asc" }, { name: "asc" }], take: 80, select: { id: true, name: true } }),
      college ? Promise.resolve([]) : db.timetableSlot.findMany({ where: { schoolId }, select: { classId: true, subject: true }, distinct: ["classId", "subject"] }),
      college
        ? db.department.findMany({ where: { schoolId }, orderBy: { name: "asc" }, take: 40, select: { name: true, programmes: { where: { archivedAt: null }, orderBy: { name: "asc" }, select: { name: true, level: true, durationYears: true } } } })
        : Promise.resolve([]),
      isModuleOn(schoolId, "ADMISSIONS").then((on) => (on ? db.admissionCycle.findFirst({ where: { schoolId, status: "OPEN" }, orderBy: { createdAt: "desc" }, select: { name: true, opensAt: true, closesAt: true, gradesJson: true } }) : null)),
      db.schoolSiteFile.findMany({ where: { schoolId }, select: { fileId: true, size: true, kind: true } }),
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
    // The files a page may show: an uploaded file of this school's site, or a picture of a post still fit for the site.
    const files: NonNullable<SiteData["files"]> = {};
    for (const f of siteFiles) files[f.fileId] = { size: f.size, kind: f.kind === "PDF" ? "PDF" : "IMAGE" };
    for (const p of posts) for (const m of imagesOf(p.media)) files[m.fileId] = { size: 0, kind: "IMAGE" };
    const subjectsOf = new Map<string, Set<string>>();
    for (const s of slots) {
      const set = subjectsOf.get(s.classId) ?? new Set<string>();
      if (s.subject.trim()) set.add(s.subject.trim());
      subjectsOf.set(s.classId, set);
    }
    const kinds: SiteEventItem["kind"][] = ["HOLIDAY", "EXAM", "EVENT"];
    return {
      schoolName: school.name,
      slug: school.slug,
      logoFileId: school.logoPath,
      numbers,
      numbersDateKey: today,
      faculty: faculty.profiles.map((f) => ({ name: f.name, designation: f.designation, department: f.departmentName ?? "" })),
      appUrl: appUrl(),
      disclosurePublished: Boolean(disclosure),
      facultyPublished: faculty.profiles.length > 0,
      news,
      gallery,
      principalName: principal?.user.name ?? null,
      todayKey: today,
      college,
      events: events.map((e) => ({ title: e.name, startKey: e.startDateKey, endKey: e.endDateKey, kind: (kinds as string[]).includes(e.kind) ? (e.kind as SiteEventItem["kind"]) : "EVENT" })),
      academics: {
        classes: classes.map((c) => ({ name: c.name, subjects: [...(subjectsOf.get(c.id) ?? [])].sort() })),
        departments: departments.map((d) => ({ name: d.name, programmes: d.programmes.map((p) => ({ name: p.name, level: p.level, years: p.durationYears })) })),
      },
      admissionsCycle: cycle
        ? {
            name: cycle.name,
            opensKey: cycle.opensAt ? todayKey(school.timezone, cycle.opensAt) : null,
            closesKey: cycle.closesAt ? todayKey(school.timezone, cycle.closesAt) : null,
            grades: readJsonArray<{ grade?: unknown }>(cycle.gradesJson).flatMap((g) => (typeof g?.grade === "string" && g.grade.trim() ? [g.grade.trim()] : [])),
          }
        : null,
      files,
    };
  });
}

/** The languages a version carries: the site's own, and the other two when the switch offers them. */
export function languagesOf(config: SiteConfig): SiteLanguage[] {
  return config.offerOtherLanguages ? [config.language, ...SITE_LANGUAGES.filter((l) => l !== config.language)] : [config.language];
}

/**
 * What the nightly refresh compares: the numbers, the calendar's upcoming entries, and whether the announcement is
 * within its dates. A new version is cut only when this changed (stored in SchoolSiteVersion.numbersHash).
 */
export function refreshSignature(config: SiteConfig, data: SiteData): string {
  const events = (data.events ?? []).map((e) => `${e.startKey}:${e.endKey}:${e.title}`).join(",");
  return `${numbersHash(data.numbers)}|ann=${announcementShown(config, data.todayKey) ? 1 : 0}|ev=${events}`;
}

/* ------------------------------------------------------------------------------------------------ */
/* The one writer                                                                                  */
/* ------------------------------------------------------------------------------------------------ */

/** Every page the site shows rendered in every language it offers: the home page apart, the others by path. */
export function renderAllPages(config: SiteConfig, data: SiteData): { html: Record<string, string>; pagesHtml: Record<string, Record<string, string>>; paths: string[] } {
  const shown = sitePagesShown(config, data);
  const languages = languagesOf(config);
  const html = Object.fromEntries(languages.map((l) => [l, renderSite(config, data, l, "HOME")]));
  const pagesHtml: Record<string, Record<string, string>> = {};
  for (const page of shown) {
    if (!page.path) continue;
    pagesHtml[page.path] = Object.fromEntries(languages.map((l) => [l, renderSite(config, data, l, page.key)]));
  }
  return { html, pagesHtml, paths: shown.map((p) => p.path) };
}

/** The stored files the pages show (each becomes public while the version is live, files.ts). */
export function filesShown(config: SiteConfig, data: SiteData): string[] {
  const out = new Set<string>();
  for (const n of data.news) if (n.image) out.add(n.image.fileId);
  for (const g of data.gallery) out.add(g.fileId);
  for (const { picture } of sitePictures(config)) if (pictureShown(picture, data)) out.add(picture.fileId);
  const pdf = (id: string | null) => id && data.files?.[id]?.kind === "PDF";
  if (pdf(config.prospectusFileId)) out.add(config.prospectusFileId!);
  for (const d of config.downloads) if (pdf(d.fileId)) out.add(d.fileId);
  return [...out];
}

/**
 * Render `config` for the school, store it as a new version and make that the live one. `config` is the draft
 * at Publish and the live version's own at the nightly refresh. The caller has checked who may publish; this
 * binds the school itself, so the job (no session) and the office's act take the same path.
 */
export async function renderAndStore(schoolId: string, byUserId: string | null, config: SiteConfig, now: Date = new Date()): Promise<{ versionId: string; renderedAt: Date }> {
  const data = await gatherSiteData(schoolId, config, now);
  const { html, pagesHtml, paths } = renderAllPages(config, data);
  const consentOf = new Map(config.gallery.map((g) => [g.fileId, g]));
  const picture = (p: SitePicture) => ({ fileId: p.fileId, postId: p.postId, consentByUserId: p.consentByUserId ?? null, consentAt: p.consentAt ?? null });
  const snapshot: SiteSnapshot = {
    config,
    numbers: data.numbers,
    numbersDateKey: data.numbersDateKey,
    newsPostIds: data.news.map((n) => n.id),
    gallery: data.gallery.map((g) => ({ fileId: g.fileId, postId: consentOf.get(g.fileId)?.postId ?? "", consentByUserId: consentOf.get(g.fileId)?.consentByUserId ?? null, consentAt: consentOf.get(g.fileId)?.consentAt ?? null })),
    pictures: sitePictures(config).flatMap((p) => (pictureShown(p.picture, data) ? [picture(p.picture)] : [])),
    pages: paths,
    renderedAt: now.toISOString(),
  };
  const imageFileIds = filesShown(config, data);

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
        data: { schoolId, siteId: site.id, schoolSlug: school.slug, snapshotJson: JSON.stringify(snapshot), html: JSON.stringify(html), pagesHtml: JSON.stringify(pagesHtml), imageFileIds, numbersHash: refreshSignature(config, data), renderedAt: now, numbersAt: now, publishedByUserId: byUserId, liveAt: now },
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
/* The nightly refresh (site:refresh, 03:40)                                                       */
/* ------------------------------------------------------------------------------------------------ */

/**
 * Every live site's pages measured again; a new version is stored only where what they show by date changed
 * (`refreshSignature`), rendered from the config the site was published with. A school whose WEBSITE module is off
 * is left alone (its site already answers 404). `schoolIds` narrows the run to those schools (a test's own).
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
        const data = await gatherSiteData(row.schoolId, config, now);
        if (refreshSignature(config, data) === row.numbersHash) return "same" as const;
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
