import "server-only";
import sharp from "sharp";
import { SITE_GALLERY_MAX, SITE_NEWS_MAX, siteConfigSchema, type SiteConfig, type SiteLanguage, type SiteWarning } from "@edulink/contracts";
import { db } from "./db";
import { audit } from "./audit";
import { AccessError } from "./access-error";
import { assertModuleOn } from "./modules";
import { readJsonArray, type MediaItem } from "./json";
import { readStoredFile } from "./storage";
import { FONT_KEYS } from "./fonts";
import { isEmailish, isHttpsUrl, isPhoneish, repairSiteConfig, sectionOn } from "./site-config";
import { dominantColour, nearestSwatch } from "./site-logo-colour";
import { draftConfigFor, gatherSiteData, renderAndStore, SITE_POST_WHERE, takeDown } from "./site-publish";
import { renderSite, sectionHasContent, type SiteData } from "./site-render";
import { siteHostFor } from "./site-hosts";
import type { ActiveContext } from "./session";
import type { TranslationKey } from "./i18n/dictionary";

/**
 * THE OFFICE'S SIDE OF A SCHOOL'S WEBSITE (website-builder A, 15 October 2026): the draft, the choices it is
 * built from, the preview, Publish and Unpublish. ADMIN and PRINCIPAL alike (the brief: "its admin or
 * principal"), at a school or college with the WEBSITE module on; every other role is refused, and so is a
 * school with the module off (ModuleOffError, 403 MODULE_OFF at a door).
 *
 * The draft is checked field by field on every save: a face from the bundled list, a map link that is https,
 * an email and phones that look like one, news only from the school's own approved school-wide posts addressed
 * to everyone, gallery pictures only from those posts' images, at most twelve and twenty-four. The consent tick
 * on a picture is stamped with who ticked it and when HERE, never taken from the form (decision 0002).
 */

export type SiteEditor = { schoolId: string; userId: string; role: "ADMIN" | "PRINCIPAL" };

export async function siteEditor(ctx: ActiveContext): Promise<SiteEditor> {
  if (!ctx.schoolId || (ctx.role !== "ADMIN" && ctx.role !== "PRINCIPAL")) throw new AccessError("access.wrongRoleForThisAction");
  await assertModuleOn(ctx.schoolId, "WEBSITE");
  return { schoolId: ctx.schoolId, userId: ctx.user.id, role: ctx.role };
}

/* ------------------------------------------------------------------------------------------------ */
/* The logo's colour, for the Look screen's default                                                */
/* ------------------------------------------------------------------------------------------------ */

const swatchByLogo = new Map<string, string | null>();

/** The swatch nearest the school's logo, or null with no logo or no colour in it. Kept per logo in this process. */
export async function logoSwatchFor(logoFileId: string | null): Promise<string | null> {
  if (!logoFileId) return null;
  if (swatchByLogo.has(logoFileId)) return swatchByLogo.get(logoFileId) ?? null;
  let swatch: string | null = null;
  try {
    const stored = await readStoredFile(logoFileId);
    if (stored && /^image\/(png|jpeg|webp)$/.test(stored.mime)) {
      const { data, info } = await sharp(stored.bytes, { failOn: "none" }).resize(24, 24, { fit: "inside" }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
      const colour = dominantColour(new Uint8Array(data.buffer, data.byteOffset, data.byteLength), info.channels === 4 ? 4 : 3);
      swatch = colour ? nearestSwatch(colour) : null;
    }
  } catch {
    swatch = null;
  }
  swatchByLogo.set(logoFileId, swatch);
  return swatch;
}

/* ------------------------------------------------------------------------------------------------ */
/* Reading                                                                                         */
/* ------------------------------------------------------------------------------------------------ */

export type SiteView = {
  config: SiteConfig;
  published: boolean;
  publishedAt: Date | null;
  /** https://<host>, the school's own domain once it is live (site-hosts.ts), else its subdomain. */
  address: string;
  /** /sites/<slug> on this server: the published site, reachable while DNS for the subdomain is not set up. */
  localPath: string;
  warnings: SiteWarning[];
  school: { name: string; slug: string; logoFileId: string | null; kind: string };
};

export async function loadSite(ctx: ActiveContext): Promise<SiteView> {
  const ed = await siteEditor(ctx);
  const school = await db.school.findUniqueOrThrow({ where: { id: ed.schoolId }, select: { name: true, slug: true, logoPath: true, kind: true } });
  const { config, publishedVersionId } = await draftConfigFor(ed.schoolId, await logoSwatchFor(school.logoPath));
  const live = publishedVersionId ? await db.schoolSiteVersion.findFirst({ where: { schoolId: ed.schoolId, liveAt: { not: null } }, select: { liveAt: true } }) : null;
  const data = await gatherSiteData(ed.schoolId, config);
  return {
    config,
    published: Boolean(live),
    publishedAt: live?.liveAt ?? null,
    address: `https://${await siteHostFor(ed.schoolId)}`,
    localPath: `/sites/${school.slug}`,
    warnings: siteWarnings(config, data),
    school: { name: school.name, slug: school.slug, logoFileId: school.logoPath, kind: school.kind },
  };
}

/** What the preview lists: no logo, no about text, a section switched on with nothing in it, a picture without consent. */
export function siteWarnings(config: SiteConfig, data: SiteData): SiteWarning[] {
  const out: SiteWarning[] = [];
  if (!data.logoFileId) out.push("NO_LOGO");
  if (!config.about.trim()) out.push("NO_ABOUT");
  const empty: Partial<Record<SiteConfig["sections"][number]["code"], SiteWarning>> = { NUMBERS: "EMPTY_NUMBERS", FACULTY: "EMPTY_FACULTY", DISCLOSURE: "EMPTY_DISCLOSURE", NEWS: "EMPTY_NEWS", GALLERY: "EMPTY_GALLERY", CONTACT: "EMPTY_CONTACT" };
  for (const s of config.sections) {
    const w = empty[s.code];
    if (s.on && w && !sectionHasContent(s.code, config, data)) out.push(w);
  }
  if (sectionOn(config, "GALLERY") && config.gallery.some((g) => !g.consent)) out.push("GALLERY_NO_CONSENT");
  return out;
}

/** A post the office may put on the site: its title, day and images (each with its alt text). */
export type SitePostChoice = { id: string; title: string; createdAt: Date; images: { fileId: string; alt: string }[] };

/** The school's posts a site may carry, newest first (at most sixty to choose from). */
export async function sitePostChoices(ctx: ActiveContext): Promise<SitePostChoice[]> {
  const ed = await siteEditor(ctx);
  const posts = await db.post.findMany({ where: { schoolId: ed.schoolId, ...SITE_POST_WHERE }, orderBy: { createdAt: "desc" }, take: 60, select: { id: true, title: true, createdAt: true, media: true } });
  return posts.map((p) => ({ id: p.id, title: p.title, createdAt: p.createdAt, images: readJsonArray<MediaItem>(p.media).filter((m) => m?.kind === "image" && m.fileId).map((m) => ({ fileId: m.fileId, alt: m.alt })) }));
}

/** The draft rendered in one language, with today's data: the preview's frame and GET /api/v1/admin/site/preview. */
export async function previewHtml(ctx: ActiveContext, lang?: SiteLanguage | null): Promise<string> {
  const ed = await siteEditor(ctx);
  const school = await db.school.findUniqueOrThrow({ where: { id: ed.schoolId }, select: { logoPath: true } });
  const { config } = await draftConfigFor(ed.schoolId, await logoSwatchFor(school.logoPath));
  const data = await gatherSiteData(ed.schoolId, config);
  return renderSite(config, data, lang ?? config.language);
}

/* ------------------------------------------------------------------------------------------------ */
/* Saving the draft                                                                                */
/* ------------------------------------------------------------------------------------------------ */

export type SiteSaveResult = { ok: true; config: SiteConfig } | { ok: false; field: string; errorKey: TranslationKey };

/**
 * Save the draft: `patch` is the fields one screen changed (the whole config from PUT). Checked here, field by
 * field; the stored draft is replaced only when everything holds.
 */
export async function saveSite(ctx: ActiveContext, patch: Partial<SiteConfig>): Promise<SiteSaveResult> {
  const ed = await siteEditor(ctx);
  const school = await db.school.findUniqueOrThrow({ where: { id: ed.schoolId }, select: { logoPath: true } });
  const { config: current } = await draftConfigFor(ed.schoolId, await logoSwatchFor(school.logoPath));
  const merged = { ...current, ...patch };
  const parsed = siteConfigSchema.safeParse(merged);
  if (!parsed.success) return { ok: false, field: String(parsed.error.issues[0]?.path[0] ?? "config"), errorKey: "website.refuseForm" };
  const next = repairSiteConfig(parsed.data, current);
  next.phones = parsed.data.phones.map((p) => p.trim()).filter(Boolean);
  next.email = parsed.data.email.trim();
  next.mapUrl = parsed.data.mapUrl.trim();

  if (!(FONT_KEYS as readonly string[]).includes(parsed.data.font)) return { ok: false, field: "font", errorKey: "website.refuseFont" };
  if (next.mapUrl && !isHttpsUrl(next.mapUrl)) return { ok: false, field: "mapUrl", errorKey: "website.refuseMapUrl" };
  if (next.email && !isEmailish(next.email)) return { ok: false, field: "email", errorKey: "website.refuseEmail" };
  if (next.phones.some((p) => !isPhoneish(p))) return { ok: false, field: "phones", errorKey: "website.refusePhone" };
  // The head's name under the message is the head's own choice: only a PRINCIPAL ticks it (anyone may untick it).
  if (next.principalNamed && !current.principalNamed && ed.role !== "PRINCIPAL") return { ok: false, field: "principalNamed", errorKey: "website.refusePrincipalNamed" };

  // News and pictures only from the school's own posts a site may carry.
  const ids = [...new Set([...next.newsPostIds, ...next.gallery.map((g) => g.postId)])];
  const posts = ids.length ? await db.post.findMany({ where: { schoolId: ed.schoolId, id: { in: ids }, ...SITE_POST_WHERE }, select: { id: true, media: true } }) : [];
  const byId = new Map(posts.map((p) => [p.id, readJsonArray<MediaItem>(p.media).filter((m) => m?.kind === "image").map((m) => m.fileId)]));
  if (next.newsPostIds.length > SITE_NEWS_MAX || next.newsPostIds.some((id) => !byId.has(id))) return { ok: false, field: "newsPostIds", errorKey: "website.refusePost" };
  if (next.gallery.length > SITE_GALLERY_MAX || next.gallery.some((g) => !byId.get(g.postId)?.includes(g.fileId))) return { ok: false, field: "gallery", errorKey: "website.refusePicture" };

  // The consent tick: stamped here with who and when; kept as it was when it did not change; cleared when unticked.
  const before = new Map(current.gallery.map((g) => [g.fileId, g]));
  const now = new Date().toISOString();
  next.gallery = next.gallery.map((g) => {
    const was = before.get(g.fileId);
    if (!g.consent) return { postId: g.postId, fileId: g.fileId, consent: false, consentByUserId: null, consentAt: null };
    if (was?.consent && was.consentByUserId && was.consentAt) return { postId: g.postId, fileId: g.fileId, consent: true, consentByUserId: was.consentByUserId, consentAt: was.consentAt };
    return { postId: g.postId, fileId: g.fileId, consent: true, consentByUserId: ed.userId, consentAt: now };
  });

  await db.schoolSite.upsert({
    where: { schoolId: ed.schoolId },
    create: { schoolId: ed.schoolId, configJson: JSON.stringify(next), updatedByUserId: ed.userId },
    update: { configJson: JSON.stringify(next), updatedByUserId: ed.userId },
  });
  return { ok: true, config: next };
}

/* ------------------------------------------------------------------------------------------------ */
/* Publish and unpublish                                                                           */
/* ------------------------------------------------------------------------------------------------ */

/** Render the draft in every language the site offers and make it the live version. Audited site.publish. */
export async function publishSite(ctx: ActiveContext): Promise<{ versionId: string; renderedAt: Date; address: string }> {
  const ed = await siteEditor(ctx);
  const school = await db.school.findUniqueOrThrow({ where: { id: ed.schoolId }, select: { logoPath: true } });
  const { config } = await draftConfigFor(ed.schoolId, await logoSwatchFor(school.logoPath));
  const made = await renderAndStore(ed.schoolId, ed.userId, config);
  await audit({ schoolId: ed.schoolId, actorUserId: ed.userId, action: "site.publish", targetType: "SchoolSiteVersion", targetId: made.versionId, meta: { template: config.template, language: config.language, sections: config.sections.filter((s) => s.on).map((s) => s.code) } });
  return { ...made, address: `https://${await siteHostFor(ed.schoolId)}` };
}

/** Take the site down: the public route answers 404 with noindex; the versions are kept. Audited site.unpublish. */
export async function unpublishSite(ctx: ActiveContext): Promise<{ changed: boolean }> {
  const ed = await siteEditor(ctx);
  const changed = await takeDown(ed.schoolId);
  if (changed) await audit({ schoolId: ed.schoolId, actorUserId: ed.userId, action: "site.unpublish", targetType: "School", targetId: ed.schoolId });
  return { changed };
}

/* ------------------------------------------------------------------------------------------------ */
/* The website's enquiries, for the office                                                         */
/* ------------------------------------------------------------------------------------------------ */

export type SiteEnquiryRow = { id: string; name: string; contact: string; grade: string; message: string; createdAt: Date; read: boolean };

/** The newest fifty enquiries from the site. */
export async function siteEnquiries(ctx: ActiveContext): Promise<SiteEnquiryRow[]> {
  const ed = await siteEditor(ctx);
  const rows = await db.schoolSiteEnquiry.findMany({ where: { schoolId: ed.schoolId }, orderBy: { createdAt: "desc" }, take: 50 });
  return rows.map((r) => ({ id: r.id, name: r.name, contact: r.contact, grade: r.grade, message: r.message, createdAt: r.createdAt, read: Boolean(r.readAt) }));
}

/** Mark one enquiry read (or unread). */
export async function markSiteEnquiry(ctx: ActiveContext, enquiryId: string, read: boolean): Promise<void> {
  const ed = await siteEditor(ctx);
  const done = await db.schoolSiteEnquiry.updateMany({ where: { id: enquiryId, schoolId: ed.schoolId }, data: read ? { readAt: new Date(), readByUserId: ed.userId } : { readAt: null, readByUserId: null } });
  if (done.count === 0) throw new AccessError("website.enquiryNotFound", "NOT_FOUND");
}
