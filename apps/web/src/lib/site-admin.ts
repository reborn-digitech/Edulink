import "server-only";
import sharp from "sharp";
import { SITE_CUSTOM_PAGES_MAX, SITE_GALLERY_MAX, SITE_NEWS_MAX, siteConfigSchema, type SiteCheck, type SiteConfig, type SiteLanguage, type SitePicture, type SiteWarning } from "@edulink/contracts";
import { db } from "./db";
import { audit } from "./audit";
import { AccessError } from "./access-error";
import { assertModuleOn } from "./modules";
import { readJson, readJsonArray, type MediaItem } from "./json";
import { readStoredFile } from "./storage";
import { FONT_KEYS } from "./fonts";
import { isEmailish, isHttpsUrl, isPhoneish, repairSiteConfig, sectionOn, sitePictures, socialLinkOk, whatsappOk } from "./site-config";
import { colourProblem } from "./site-colour";
import { dominantColour, nearestSwatch } from "./site-logo-colour";
import { draftConfigFor, gatherSiteData, renderAndStore, SITE_POST_WHERE, takeDown, type SiteSnapshot } from "./site-publish";
import { renderSite, SITE_PAGE_PATH, SITE_RESERVED_PATHS, sectionHasContent, siteChecklist, sitePagesShown, type SiteData, type SiteRenderOptions } from "./site-render";
import { sanitiseRichText, SITE_RICH_TEXT_MAX } from "./site-rich-text";
import { siteHostFor } from "./site-hosts";
import type { ActiveContext } from "./session";
import type { TranslationKey } from "./i18n/dictionary";

/**
 * THE OFFICE'S SIDE OF A SCHOOL'S WEBSITE (website-builder A, 15 October 2026; website-two, 16 October 2026): the
 * draft, the choices it is built from, the preview, Publish and Unpublish, the versions. ADMIN and PRINCIPAL alike,
 * at a school or college with the WEBSITE module on; every other role is refused, and so is a school with the module
 * off (ModuleOffError, 403 MODULE_OFF at a door).
 *
 * The draft is checked field by field on every save: faces from the bundled list, a primary and an accent whose
 * words can be read (site-colour.ts), a map link and social links that are https on their own hosts, an email and
 * phones that look like one, news only from the school's own approved school-wide posts addressed to everyone, every
 * picture either such a post's or a file uploaded for the site (SchoolSiteFile) with words for a reader who cannot see
 * it, every PDF uploaded for the site, a custom page's rich text sanitised (site-rich-text.ts) on a path of its own.
 * The consent tick on a picture is stamped with who ticked it and when HERE, never taken from the form (decision 0002).
 *
 * THE FIRST OPEN builds a whole draft for the office (site-publish.ts `draftConfigFor`): the profile's words, the logo's
 * colour, the latest approved posts as news, and every home section that has something to show switched on, so the
 * first thing an admin sees is a finished site to change, not an empty form. It is saved on the first change.
 */

export type SiteEditor = { schoolId: string; userId: string; role: "ADMIN" | "PRINCIPAL" };

export async function siteEditor(ctx: ActiveContext): Promise<SiteEditor> {
  if (!ctx.schoolId || (ctx.role !== "ADMIN" && ctx.role !== "PRINCIPAL")) throw new AccessError("access.wrongRoleForThisAction");
  await assertModuleOn(ctx.schoolId, "WEBSITE");
  return { schoolId: ctx.schoolId, userId: ctx.user.id, role: ctx.role };
}

/* ------------------------------------------------------------------------------------------------ */
/* The logo's colour, for the Look section's default and "from the logo"                            */
/* ------------------------------------------------------------------------------------------------ */

const colourByLogo = new Map<string, [number, number, number] | null>();

/** The logo's main colour (white, black and grey skipped), or null with no logo or no colour in it. Kept per logo in this process. */
export async function logoColourFor(logoFileId: string | null): Promise<[number, number, number] | null> {
  if (!logoFileId) return null;
  if (colourByLogo.has(logoFileId)) return colourByLogo.get(logoFileId) ?? null;
  let colour: [number, number, number] | null = null;
  try {
    const stored = await readStoredFile(logoFileId);
    if (stored && /^image\/(png|jpeg|webp)$/.test(stored.mime)) {
      const { data, info } = await sharp(stored.bytes, { failOn: "none" }).resize(24, 24, { fit: "inside" }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
      colour = dominantColour(new Uint8Array(data.buffer, data.byteOffset, data.byteLength), info.channels === 4 ? 4 : 3);
    }
  } catch {
    colour = null;
  }
  colourByLogo.set(logoFileId, colour);
  return colour;
}

/** The swatch nearest the school's logo, or null with no logo or no colour in it. */
export async function logoSwatchFor(logoFileId: string | null): Promise<string | null> {
  const colour = await logoColourFor(logoFileId);
  return colour ? nearestSwatch(colour) : null;
}

/* ------------------------------------------------------------------------------------------------ */
/* Reading                                                                                         */
/* ------------------------------------------------------------------------------------------------ */

export type SiteView = {
  config: SiteConfig;
  published: boolean;
  publishedAt: Date | null;
  /** https://<the school's own domain> once it is LIVE (site-hosts.ts), else null: a site lives only there (16 Oct 2026). */
  address: string | null;
  /** /sites/<slug> on the app's host: the office's and the head's own view of the published version, signed in. */
  localPath: string;
  warnings: SiteWarning[];
  school: { name: string; slug: string; logoFileId: string | null; kind: string };
  /* website-two */
  checklist: { code: SiteCheck; done: boolean }[];
  /** The draft differs from what the live version was published from. */
  unpublishedChanges: boolean;
  /** When the draft was last saved; null while it is the first draft built for the office and never saved. */
  draftSavedAt: Date | null;
  /** Whether any version was ever published (Publish is then one click from every section). */
  publishedOnce: boolean;
  /** The data the draft is drawn with today, for the editor's lines ("nothing to show yet"). */
  data: SiteData;
  /* website-three (17 Oct 2026) */
  /** The draft's save count: the editor sends it back with each save, and a save after someone else's is refused. */
  draftVersion: number;
  /** Another person's name when they saved the draft in the last five minutes; null otherwise. */
  alsoEditing: string | null;
};

/* ------------------------------------------------------------------------------------------------ */
/* website-three (17 October 2026): two editors at once                                             */
/* ------------------------------------------------------------------------------------------------ */

/** How long another person's save keeps "Also editing: <name>" up. */
export const ALSO_EDITING_MS = 5 * 60_000;

/** The name of the person who last saved the draft, when that is someone else and within the last five minutes. */
export async function alsoEditingName(by: string | null, at: Date | null, me: string, now: Date = new Date()): Promise<string | null> {
  if (!by || by === me || !at || now.getTime() - at.getTime() > ALSO_EDITING_MS) return null;
  const person = await db.user.findUnique({ where: { id: by }, select: { name: true, preferredName: true } });
  return person ? (person.preferredName ?? person.name) : null;
}

/**
 * Write the draft only if it is still at `expected` saves (null: no draft stored yet), counting this save; null when
 * another save came first (or another first draft was stored a moment before). The compare and the write are one
 * statement, so two saves of the same count cannot both land.
 */
async function writeDraft(schoolId: string, userId: string, config: SiteConfig, expected: number | null): Promise<{ draftVersion: number; savedAt: Date } | null> {
  const configJson = JSON.stringify(config);
  if (expected === null) {
    try {
      const made = await db.schoolSite.create({ data: { schoolId, configJson, updatedByUserId: userId, draftVersion: 1 }, select: { draftVersion: true, updatedAt: true } });
      return { draftVersion: made.draftVersion, savedAt: made.updatedAt };
    } catch (error) {
      if (typeof error === "object" && error !== null && (error as { code?: string }).code === "P2002") return null;
      throw error;
    }
  }
  const done = await db.schoolSite.updateMany({ where: { schoolId, draftVersion: expected }, data: { configJson, updatedByUserId: userId, draftVersion: { increment: 1 } } });
  if (done.count === 0) return null;
  const row = await db.schoolSite.findUniqueOrThrow({ where: { schoolId }, select: { draftVersion: true, updatedAt: true } });
  return { draftVersion: row.draftVersion, savedAt: row.updatedAt };
}

/** Where the draft stands now, for the editor's check every minute: its save count and who else saved in the last five minutes. */
export async function siteDraftState(ctx: ActiveContext): Promise<{ draftVersion: number; alsoEditing: string | null; savedAt: Date | null }> {
  const ed = await siteEditor(ctx);
  const site = await db.schoolSite.findUnique({ where: { schoolId: ed.schoolId }, select: { draftVersion: true, updatedByUserId: true, updatedAt: true } });
  return { draftVersion: site?.draftVersion ?? 0, alsoEditing: await alsoEditingName(site?.updatedByUserId ?? null, site?.updatedAt ?? null, ed.userId), savedAt: site?.updatedAt ?? null };
}

export async function loadSite(ctx: ActiveContext): Promise<SiteView> {
  const ed = await siteEditor(ctx);
  const school = await db.school.findUniqueOrThrow({ where: { id: ed.schoolId }, select: { name: true, slug: true, logoPath: true, kind: true } });
  const { config, updatedAt, draftVersion, updatedByUserId } = await draftConfigFor(ed.schoolId, await logoSwatchFor(school.logoPath));
  const [live, versions, data, address] = await Promise.all([
    db.schoolSiteVersion.findFirst({ where: { schoolId: ed.schoolId, liveAt: { not: null } }, select: { liveAt: true, snapshotJson: true } }),
    db.schoolSiteVersion.count({ where: { schoolId: ed.schoolId } }),
    gatherSiteData(ed.schoolId, config),
    addressOf(ed.schoolId),
  ]);
  const liveConfig = live ? repairSiteConfig(readJson<Partial<SiteSnapshot>>(live.snapshotJson, {}).config ?? {}, config) : null;
  return {
    config,
    published: Boolean(live),
    publishedAt: live?.liveAt ?? null,
    address,
    localPath: `/sites/${school.slug}`,
    warnings: siteWarnings(config, data),
    school: { name: school.name, slug: school.slug, logoFileId: school.logoPath, kind: school.kind },
    checklist: siteChecklist(config, data, Boolean(address)),
    unpublishedChanges: liveConfig ? !sameConfig(config, liveConfig) : false,
    draftSavedAt: updatedAt,
    publishedOnce: versions > 0,
    data,
    draftVersion,
    alsoEditing: await alsoEditingName(updatedByUserId, updatedAt, ed.userId),
  };
}

/** Two drafts the same, field by field (the stored JSON's key order is not the reader's business). */
export function sameConfig(a: SiteConfig, b: SiteConfig): boolean {
  const stable = (v: unknown): string => (Array.isArray(v) ? `[${v.map(stable).join(",")}]` : v && typeof v === "object" ? `{${Object.keys(v as object).sort().map((k) => `${JSON.stringify(k)}:${stable((v as Record<string, unknown>)[k])}`).join(",")}}` : JSON.stringify(v ?? null));
  return stable(a) === stable(b);
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
  if ((sectionOn(config, "GALLERY") && config.gallery.some((g) => !g.consent)) || sitePictures(config).some((p) => !p.picture.consent)) out.push("GALLERY_NO_CONSENT");
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

/** The page key a preview path names ("" home; a built-in page's path; a custom page's slug), or HOME. */
function pageKeyFor(config: SiteConfig, path: string | null | undefined): string {
  if (!path) return "HOME";
  const built = config.pages.find((p) => p.code !== "HOME" && SITE_PAGE_PATH[p.code] === path);
  if (built) return built.code;
  const custom = config.customPages.find((p) => p.slug === path);
  return custom ? `custom:${custom.id}` : "HOME";
}

/**
 * The draft rendered as one page in one language, with today's data: the editor's live preview, the preview in a tab
 * and GET /api/v1/admin/site/preview. `unsaved` is a draft the editor holds and has not saved: brought to shape and
 * its rich text sanitised exactly as a save would, and drawn only from this school's own files and posts.
 */
export async function previewHtml(ctx: ActiveContext, lang?: SiteLanguage | null, page?: string | null, unsaved?: unknown, opts: SiteRenderOptions = {}): Promise<string> {
  const ed = await siteEditor(ctx);
  const school = await db.school.findUniqueOrThrow({ where: { id: ed.schoolId }, select: { logoPath: true } });
  const { config: saved } = await draftConfigFor(ed.schoolId, await logoSwatchFor(school.logoPath));
  const config = unsaved === undefined ? saved : sanitisedDraft(repairSiteConfig(unsaved, saved));
  return draftPage(ed.schoolId, config, lang ?? config.language, page, opts);
}

/** One page of a draft as HTML, for the editor's preview and the review link. */
export async function draftPage(schoolId: string, config: SiteConfig, lang: SiteLanguage, page: string | null | undefined, opts: SiteRenderOptions = {}): Promise<string> {
  const data = await gatherSiteData(schoolId, config);
  return renderSite(config, data, lang, pageKeyFor(config, page), opts);
}

/** The pages a draft shows today, for the editor's page picker and the review link's 404. */
export async function draftPagePaths(schoolId: string, config: SiteConfig): Promise<string[]> {
  return sitePagesShown(config, await gatherSiteData(schoolId, config)).map((p) => p.path);
}

/** A draft's custom pages with their rich text sanitised (the save does it too; the preview of an unsaved draft does it here). */
function sanitisedDraft(config: SiteConfig): SiteConfig {
  return { ...config, customPages: config.customPages.map((p) => ({ ...p, html: sanitiseRichText(p.html) })) };
}

/* ------------------------------------------------------------------------------------------------ */
/* Saving the draft                                                                                */
/* ------------------------------------------------------------------------------------------------ */

export type SiteSaveResult =
  | { ok: true; config: SiteConfig; draftVersion: number; savedAt: Date; alsoEditing: string | null }
  | { ok: false; field: string; errorKey: TranslationKey; stale?: boolean };

const refuse = (field: string, errorKey: TranslationKey): SiteSaveResult => ({ ok: false, field, errorKey });
/** website-three: the refusal of a save made on a draft someone else saved since. */
const STALE: SiteSaveResult = { ok: false, field: "draftVersion", errorKey: "siteThree.refuseStale", stale: true };

/**
 * Save the draft: `patch` is the fields the editor changed (the whole config from PUT). Checked here, field by
 * field; the stored draft is replaced only when everything holds.
 *
 * website-three (17 Oct 2026): `baseVersion` is the draft's save count the editor read it at; a save after someone
 * else's is refused ("Someone else saved this draft a moment ago") and the editor reloads. Without it (the post page's
 * tick, PUT without If-Match) the save still never lands over one made while it was being checked.
 */
export async function saveSite(ctx: ActiveContext, patch: Partial<SiteConfig>, opts: { baseVersion?: number | null } = {}): Promise<SiteSaveResult> {
  const ed = await siteEditor(ctx);
  const school = await db.school.findUniqueOrThrow({ where: { id: ed.schoolId }, select: { logoPath: true } });
  const { config: current, exists, draftVersion, updatedByUserId, updatedAt } = await draftConfigFor(ed.schoolId, await logoSwatchFor(school.logoPath));
  if (typeof opts.baseVersion === "number" && opts.baseVersion !== draftVersion) return STALE;
  const merged = { ...current, ...patch };
  const parsed = siteConfigSchema.safeParse(merged);
  if (!parsed.success) return refuse(String(parsed.error.issues[0]?.path[0] ?? "config"), "website.refuseForm");
  const next = repairSiteConfig(parsed.data, current);
  next.phones = parsed.data.phones.map((p) => p.trim()).filter(Boolean);
  next.email = parsed.data.email.trim();
  next.mapUrl = parsed.data.mapUrl.trim();
  next.social = { facebook: next.social.facebook.trim(), instagram: next.social.instagram.trim(), youtube: next.social.youtube.trim(), whatsapp: next.social.whatsapp.replace(/[\s+()-]/g, "") };

  if (!(FONT_KEYS as readonly string[]).includes(parsed.data.font)) return refuse("font", "website.refuseFont");
  if (!(FONT_KEYS as readonly string[]).includes(parsed.data.headingFont)) return refuse("headingFont", "website.refuseFont");
  const colours = colourProblem(next.colour, next.accent, next.theme);
  if (colours) return refuse(colours === "ACCENT_TEXT" ? "accent" : "colour", colours === "PRIMARY_TEXT" ? "siteEditor.refuseContrastPrimary" : colours === "ACCENT_TEXT" ? "siteEditor.refuseContrastAccent" : "siteEditor.refuseContrastLinks");
  if (next.mapUrl && !isHttpsUrl(next.mapUrl)) return refuse("mapUrl", "website.refuseMapUrl");
  if (next.email && !isEmailish(next.email)) return refuse("email", "website.refuseEmail");
  if (next.phones.some((p) => !isPhoneish(p))) return refuse("phones", "website.refusePhone");
  for (const network of ["facebook", "instagram", "youtube"] as const) if (!socialLinkOk(network, next.social[network])) return refuse("social", "siteEditor.refuseSocial");
  if (!whatsappOk(next.social.whatsapp)) return refuse("social", "siteEditor.refuseWhatsapp");
  if (next.announcement.from && next.announcement.to && next.announcement.from > next.announcement.to) return refuse("announcement", "siteEditor.refuseAnnouncementDates");
  // The head's name under the message is the head's own choice: only a PRINCIPAL ticks it (anyone may untick it).
  if (next.principalNamed && !current.principalNamed && ed.role !== "PRINCIPAL") return refuse("principalNamed", "website.refusePrincipalNamed");

  // News and the one-page gallery only from the school's own posts a site may carry.
  const pictures = sitePictures(next);
  const ids = [...new Set([...next.newsPostIds, ...next.gallery.map((g) => g.postId), ...pictures.flatMap((p) => (p.picture.postId ? [p.picture.postId] : []))])];
  const posts = ids.length ? await db.post.findMany({ where: { schoolId: ed.schoolId, id: { in: ids }, ...SITE_POST_WHERE }, select: { id: true, media: true } }) : [];
  const byId = new Map(posts.map((p) => [p.id, readJsonArray<MediaItem>(p.media).filter((m) => m?.kind === "image").map((m) => m.fileId)]));
  if (next.newsPostIds.length > SITE_NEWS_MAX || next.newsPostIds.some((id) => !byId.has(id))) return refuse("newsPostIds", "website.refusePost");
  if (next.gallery.length > SITE_GALLERY_MAX || next.gallery.some((g) => !byId.get(g.postId)?.includes(g.fileId))) return refuse("gallery", "website.refusePicture");

  // Every other picture: a post's (as above) or a picture uploaded for the site; every PDF uploaded for the site.
  const uploads = await db.schoolSiteFile.findMany({ where: { schoolId: ed.schoolId }, select: { fileId: true, kind: true } });
  const uploaded = new Map(uploads.map((u) => [u.fileId, u.kind]));
  for (const { where, picture } of pictures) {
    const field = where.split(":")[0]!;
    const ok = picture.postId ? Boolean(byId.get(picture.postId)?.includes(picture.fileId)) : uploaded.get(picture.fileId) === "IMAGE";
    if (!ok) return refuse(field === "facility" ? "facilities" : field === "album" ? "albums" : field === "achievement" ? "achievements" : "heroPicture", "website.refusePicture");
    if (!picture.alt.trim()) return refuse(field === "facility" ? "facilities" : field === "album" ? "albums" : field === "achievement" ? "achievements" : "heroPicture", "siteEditor.refuseAlt");
  }
  if (next.prospectusFileId && uploaded.get(next.prospectusFileId) !== "PDF") return refuse("prospectusFileId", "siteEditor.refusePdf");
  if (next.downloads.some((d) => uploaded.get(d.fileId) !== "PDF")) return refuse("downloads", "siteEditor.refusePdf");
  if (next.facilities.some((f) => f.code === "CUSTOM" && !f.label.trim())) return refuse("facilities", "siteEditor.refuseFacilityName");
  if (new Set(next.albums.map((a) => a.id)).size !== next.albums.length || new Set(next.achievements.map((a) => a.id)).size !== next.achievements.length || new Set(next.downloads.map((d) => d.id)).size !== next.downloads.length) return refuse("config", "website.refuseForm");

  // Custom pages: at most four, each on a path of its own that no built-in page or the host itself answers, sanitised.
  if (next.customPages.length > SITE_CUSTOM_PAGES_MAX) return refuse("customPages", "siteEditor.refuseCustomCount");
  const slugs = new Set<string>();
  for (const p of parsed.data.customPages) {
    if (SITE_RESERVED_PATHS.has(p.slug) || slugs.has(p.slug)) return refuse("customPages", "siteEditor.refuseCustomSlug");
    if (p.html.length > SITE_RICH_TEXT_MAX) return refuse("customPages", "siteEditor.refuseCustomLong");
    slugs.add(p.slug);
  }
  next.customPages = parsed.data.customPages.map((p) => ({ ...p, title: p.title.trim(), html: sanitiseRichText(p.html) }));

  // The consent tick: stamped here with who and when; kept as it was when it did not change; cleared when unticked.
  const now = new Date().toISOString();
  const stamp = <T extends { consent: boolean; consentByUserId?: string | null; consentAt?: string | null }>(item: T, was: { consent: boolean; consentByUserId?: string | null; consentAt?: string | null } | undefined): T => {
    if (!item.consent) return { ...item, consentByUserId: null, consentAt: null };
    if (was?.consent && was.consentByUserId && was.consentAt) return { ...item, consentByUserId: was.consentByUserId, consentAt: was.consentAt };
    return { ...item, consentByUserId: ed.userId, consentAt: now };
  };
  const before = new Map(current.gallery.map((g) => [g.fileId, g]));
  next.gallery = next.gallery.map((g) => {
    const s = stamp(g, before.get(g.fileId));
    return { postId: s.postId, fileId: s.fileId, consent: s.consent, consentByUserId: s.consentByUserId ?? null, consentAt: s.consentAt ?? null };
  });
  const wasPicture = new Map(sitePictures(current).map((p) => [`${p.where}|${p.picture.fileId}`, p.picture]));
  const stampAt = (where: string, p: SitePicture | null): SitePicture | null => (p ? stamp({ ...p, alt: p.alt.trim() }, wasPicture.get(`${where}|${p.fileId}`)) : null);
  next.heroPicture = stampAt("hero", next.heroPicture);
  // website-three (17 Oct 2026): a facility's picture keeps its stamp by the picture (its file), not by the facility's
  // place in the list, so moving the facilities never re-stamps a consent with whoever saved the move.
  const wasFacility = new Map(current.facilities.flatMap((f) => (f.picture ? [[f.picture.fileId, f.picture] as const] : [])));
  next.facilities = next.facilities.map((f) => ({ ...f, label: f.code === "CUSTOM" ? f.label.trim() : "", picture: f.picture ? stamp({ ...f.picture, alt: f.picture.alt.trim() }, wasFacility.get(f.picture.fileId)) : null }));
  next.albums = next.albums.map((a) => ({ ...a, pictures: a.pictures.map((p) => stampAt(`album:${a.id}`, p)!) }));
  next.achievements = next.achievements.map((a) => ({ ...a, picture: stampAt(`achievement:${a.id}`, a.picture) }));

  // website-three (17 Oct 2026): written only if no other save came since the draft was read above.
  const written = await writeDraft(ed.schoolId, ed.userId, next, exists ? draftVersion : null);
  if (!written) return STALE;
  return { ok: true, config: next, draftVersion: written.draftVersion, savedAt: written.savedAt, alsoEditing: await alsoEditingName(updatedByUserId, updatedAt, ed.userId) };
}

/**
 * The post page's "Show on the website" tick (16 Oct 2026): the post goes into, or out of, the draft's news. Only a
 * post the site may carry; at most twelve. The draft only: the site changes when the office publishes.
 */
export async function setPostOnSite(ctx: ActiveContext, postId: string, on: boolean): Promise<SiteSaveResult> {
  const ed = await siteEditor(ctx);
  const post = await db.post.findFirst({ where: { id: postId, schoolId: ed.schoolId, ...SITE_POST_WHERE }, select: { id: true } });
  if (!post) throw new AccessError("access.entryNotFound", "NOT_FOUND");
  const school = await db.school.findUniqueOrThrow({ where: { id: ed.schoolId }, select: { logoPath: true } });
  const { config, draftVersion, updatedAt } = await draftConfigFor(ed.schoolId, await logoSwatchFor(school.logoPath));
  const has = config.newsPostIds.includes(postId);
  if (has === on) return { ok: true, config, draftVersion, savedAt: updatedAt ?? new Date(), alsoEditing: null };
  if (on && config.newsPostIds.length >= SITE_NEWS_MAX) return refuse("newsPostIds", "siteEditor.refuseNewsFull");
  return saveSite(ctx, { newsPostIds: on ? [postId, ...config.newsPostIds] : config.newsPostIds.filter((id) => id !== postId) });
}

/** Whether a post is on the draft's news, and whether it may be (the post page's tick). Null when the editor is not open to this person. */
export async function postOnSite(ctx: ActiveContext, postId: string): Promise<{ on: boolean; allowed: boolean } | null> {
  let ed: SiteEditor;
  try {
    ed = await siteEditor(ctx);
  } catch (error) {
    if (error instanceof AccessError) return null;
    throw error;
  }
  const post = await db.post.findFirst({ where: { id: postId, schoolId: ed.schoolId, ...SITE_POST_WHERE }, select: { id: true } });
  if (!post) return null;
  const site = await db.schoolSite.findUnique({ where: { schoolId: ed.schoolId }, select: { configJson: true } });
  const ids = readJson<{ newsPostIds?: unknown }>(site?.configJson, {}).newsPostIds;
  return { on: Array.isArray(ids) && ids.includes(postId), allowed: true };
}

/* ------------------------------------------------------------------------------------------------ */
/* Publish, unpublish, versions                                                                    */
/* ------------------------------------------------------------------------------------------------ */

/** Render the draft in every language the site offers and make it the live version. Audited site.publish. The address is null until the school's own domain is LIVE. */
export async function publishSite(ctx: ActiveContext): Promise<{ versionId: string; renderedAt: Date; address: string | null }> {
  const ed = await siteEditor(ctx);
  const school = await db.school.findUniqueOrThrow({ where: { id: ed.schoolId }, select: { logoPath: true } });
  const { config, exists } = await draftConfigFor(ed.schoolId, await logoSwatchFor(school.logoPath));
  // The first draft was built for the office and never saved: publishing it saves it, so the draft is what is live.
  if (!exists) await db.schoolSite.upsert({ where: { schoolId: ed.schoolId }, create: { schoolId: ed.schoolId, configJson: JSON.stringify(config), updatedByUserId: ed.userId, draftVersion: 1 }, update: {} });
  const made = await renderAndStore(ed.schoolId, ed.userId, config);
  await audit({ schoolId: ed.schoolId, actorUserId: ed.userId, action: "site.publish", targetType: "SchoolSiteVersion", targetId: made.versionId, meta: { template: config.template, language: config.language, sections: config.sections.filter((s) => s.on).map((s) => s.code) } });
  return { ...made, address: await addressOf(ed.schoolId) };
}

/** https://<the school's own domain> while it is LIVE, else null. */
async function addressOf(schoolId: string): Promise<string | null> {
  const host = await siteHostFor(schoolId);
  return host ? `https://${host}` : null;
}

/**
 * /sites/<slug>: the published version, for the office and the head of THAT school only (16 Oct 2026: a site is
 * public only on the school's own domain). The school whose published site to show, or null for anybody else — a
 * school's slug that is not the signed-in person's own, another role, or the module off — which the route answers
 * with the 404 every refusal there is.
 */
export async function publishedPreviewSchool(ctx: ActiveContext, slug: string): Promise<string | null> {
  let ed: SiteEditor;
  try {
    ed = await siteEditor(ctx);
  } catch (error) {
    // ModuleOffError is an AccessError too.
    if (error instanceof AccessError) return null;
    throw error;
  }
  const school = await db.school.findUnique({ where: { id: ed.schoolId }, select: { slug: true } });
  return school?.slug === slug ? ed.schoolId : null;
}

/** Take the site down: the public route answers 404 with noindex; the versions are kept. Audited site.unpublish. */
export async function unpublishSite(ctx: ActiveContext): Promise<{ changed: boolean }> {
  const ed = await siteEditor(ctx);
  const changed = await takeDown(ed.schoolId);
  if (changed) await audit({ schoolId: ed.schoolId, actorUserId: ed.userId, action: "site.unpublish", targetType: "School", targetId: ed.schoolId });
  return { changed };
}

export type SiteVersionRow = { id: string; renderedAt: Date; live: boolean; byName: string | null; nightly: boolean };

/** Every version kept (the live one and up to twenty before it), newest first, with who published it. */
export async function siteVersions(ctx: ActiveContext): Promise<SiteVersionRow[]> {
  const ed = await siteEditor(ctx);
  const rows = await db.schoolSiteVersion.findMany({ where: { schoolId: ed.schoolId }, orderBy: { renderedAt: "desc" }, take: 30, select: { id: true, renderedAt: true, liveAt: true, publishedByUserId: true } });
  const people = await db.user.findMany({ where: { id: { in: rows.flatMap((r) => (r.publishedByUserId ? [r.publishedByUserId] : [])) } }, select: { id: true, name: true } });
  const nameOf = new Map(people.map((p) => [p.id, p.name]));
  return rows.map((r) => ({ id: r.id, renderedAt: r.renderedAt, live: Boolean(r.liveAt), byName: r.publishedByUserId ? (nameOf.get(r.publishedByUserId) ?? null) : null, nightly: !r.publishedByUserId }));
}

/**
 * Make a version's config the draft again ("Restore"), or the live version's ("Back to published", `versionId` null),
 * throwing the draft's changes away. Nothing is published. Audited site.restore.
 */
export async function restoreSiteVersion(ctx: ActiveContext, versionId: string | null): Promise<SiteConfig> {
  const ed = await siteEditor(ctx);
  const version = await db.schoolSiteVersion.findFirst({ where: { schoolId: ed.schoolId, ...(versionId ? { id: versionId } : { liveAt: { not: null } }) }, select: { id: true, snapshotJson: true } });
  if (!version) throw new AccessError(versionId ? "siteEditor.versionNotFound" : "siteEditor.notPublishedYet", "NOT_FOUND");
  const school = await db.school.findUniqueOrThrow({ where: { id: ed.schoolId }, select: { logoPath: true } });
  const { config: current } = await draftConfigFor(ed.schoolId, await logoSwatchFor(school.logoPath));
  const config = repairSiteConfig(readJson<Partial<SiteSnapshot>>(version.snapshotJson, {}).config ?? {}, current);
  // website-three (17 Oct 2026): a restore is a save of its own: it counts, so an editor still holding the draft before it reloads.
  await db.schoolSite.upsert({
    where: { schoolId: ed.schoolId },
    create: { schoolId: ed.schoolId, configJson: JSON.stringify(config), updatedByUserId: ed.userId, draftVersion: 1 },
    update: { configJson: JSON.stringify(config), updatedByUserId: ed.userId, draftVersion: { increment: 1 } },
  });
  await audit({ schoolId: ed.schoolId, actorUserId: ed.userId, action: "site.restore", targetType: "SchoolSiteVersion", targetId: version.id, meta: { backToPublished: versionId === null } });
  return config;
}

/* ------------------------------------------------------------------------------------------------ */
/* The website's enquiries, for the office (the one-page flow's list; the inbox is site-inbox.ts)   */
/* ------------------------------------------------------------------------------------------------ */

export type SiteEnquiryListRow = { id: string; name: string; contact: string; grade: string; message: string; createdAt: Date; read: boolean };

/** The newest fifty enquiries from the site. */
export async function siteEnquiries(ctx: ActiveContext): Promise<SiteEnquiryListRow[]> {
  const ed = await siteEditor(ctx);
  const rows = await db.schoolSiteEnquiry.findMany({ where: { schoolId: ed.schoolId }, orderBy: { createdAt: "desc" }, take: 50 });
  return rows.map((r) => ({ id: r.id, name: r.name, contact: r.contact, grade: r.grade, message: r.message, createdAt: r.createdAt, read: Boolean(r.readAt) }));
}
