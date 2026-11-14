import {
  SITE_LANGUAGES,
  SITE_METRICS,
  SITE_PAGES,
  SITE_PALETTE,
  SITE_SECTIONS,
  SITE_SWATCHES,
  SITE_TEMPLATES,
  siteConfigSchema,
  type SiteConfig,
  type SiteLanguage,
  type SitePage,
  type SitePicture,
  type SiteSection,
} from "@edulink/contracts";
import { FONT_KEYS } from "./fonts";
import { isHexColour } from "./site-colour";
import { draftPictures, menuKeys } from "./site-content";

/**
 * A SCHOOL'S WEBSITE DRAFT, ITS DEFAULTS AND ITS REPAIR (website-builder A, 15 October 2026; website-two, 16 October).
 *
 * Pure: no database, no session, so the editor's client forms, the renderer's tests and the publish path read the
 * same rules. The draft is stored as JSON (SchoolSite.configJson); anything an older build or a hand edit left
 * in it is brought back to the shape here rather than refused, so the office never meets a broken editor. Keys are
 * only ever added, never renamed: a draft saved by the six-screen flow of 15 October opens in the editor as it was,
 * with the new fields at their defaults.
 *
 * DEFAULTS ARE CHOSEN FOR THE PERSON (someone who has never built a website): the Classic look, the colour nearest
 * the logo with an accent beside it, the app's own face, a light page, the school's own language, every page on (a
 * page with nothing to show hides itself), the home sections on except the ones a school rarely fills, the safe
 * numbers on (pupils, staff, classes, the board), the words and contact details from what the school already entered.
 */

/** What the defaults are cut from: the School row's own public fields and the logo's nearest swatch. */
export type SiteDefaultsSource = {
  locale: string | null;
  profileAbout: string | null;
  addressLine: string | null;
  city: string | null;
  region: string | null;
  postalCode: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  board: string | null;
  affiliationNumber: string | null;
  kind: string | null;
  medium?: string | null;
  /** The swatch nearest the logo's main colour (site-logo-colour.ts), or null for the first. */
  logoSwatch?: string | null;
};

const SECTION_ORDER: readonly SiteSection[] = SITE_SECTIONS;
/** Home sections a new site starts with switched off: the ones a school rarely fills at first. */
const SECTIONS_OFF_AT_FIRST: readonly SiteSection[] = ["ACHIEVEMENTS", "FACILITIES"];

/** The numbers switched on by default: the plain counts and the board, never a percentage a school has not looked at. */
const DEFAULT_METRICS = ["PUPILS", "TEACHING_STAFF", "CLASSES", "BOARD"] as const;
const DEFAULT_COLLEGE_METRICS = ["PUPILS", "TEACHING_STAFF", "BOARD", "PROGRAMMES"] as const;

export function siteLanguageOf(raw: string | null | undefined): SiteLanguage {
  return (SITE_LANGUAGES as readonly string[]).includes(raw ?? "") ? (raw as SiteLanguage) : "en";
}

/** The board line as the school entered it for its filings: "CBSE · 1130456", or the board alone. */
export function boardLine(board: string | null | undefined, affiliation: string | null | undefined): string {
  return [board?.trim(), affiliation?.trim()].filter(Boolean).join(" · ").slice(0, 140);
}

/** An accent beside a primary: the palette's amber, or its blue when the primary is the amber itself. */
export function defaultAccent(primary: string): string {
  return primary.toLowerCase() === "#b45309" ? SITE_PALETTE[0] : "#b45309";
}

/** Every page once, Home first: the defaults' order, every page on with its own name. */
export function defaultPages(): SiteConfig["pages"] {
  return SITE_PAGES.map((code) => ({ code, on: true, title: "", lead: "", seoTitle: "", seoDescription: "" }));
}

export function defaultSiteConfig(src: SiteDefaultsSource): SiteConfig {
  const college = src.kind === "COLLEGE" || src.kind === "AUTONOMOUS_COLLEGE";
  const swatch = (SITE_SWATCHES as readonly string[]).includes(src.logoSwatch ?? "") || isHexColour(src.logoSwatch ?? "") ? (src.logoSwatch as string) : SITE_SWATCHES[0];
  const address = [src.addressLine, src.city, src.region, src.postalCode].map((p) => p?.trim()).filter(Boolean).join(", ");
  return {
    template: "CLASSIC",
    colour: swatch,
    font: "default",
    language: siteLanguageOf(src.locale),
    offerOtherLanguages: false,
    motto: "",
    about: (src.profileAbout ?? "").slice(0, 3000),
    address: address.slice(0, 300),
    phones: src.contactPhone?.trim() ? [src.contactPhone.trim().slice(0, 20)] : [],
    email: (src.contactEmail ?? "").trim().slice(0, 200),
    mapUrl: "",
    hours: "",
    board: boardLine(src.board, src.affiliationNumber),
    foundedYear: null,
    principalMessage: "",
    principalNamed: false,
    sections: SECTION_ORDER.map((code) => ({ code, on: code === "FACULTY" || code === "DISCLOSURE" ? college : !SECTIONS_OFF_AT_FIRST.includes(code) })),
    metrics: [...(college ? DEFAULT_COLLEGE_METRICS : DEFAULT_METRICS)],
    admissionsText: "",
    enquiryForm: true,
    newsPostIds: [],
    gallery: [],
    // website-two (16 Oct 2026)
    accent: defaultAccent(swatch),
    theme: "LIGHT",
    headingFont: "default",
    headerStyle: "TEMPLATE",
    heroStyle: "BAND",
    heroPicture: null,
    announcement: { text: "", from: "", to: "" },
    social: { facebook: "", instagram: "", youtube: "", whatsapp: "" },
    pages: defaultPages(),
    sectionTexts: [],
    academicsText: "",
    medium: (src.medium ?? "").trim().slice(0, 60),
    academicsSubjects: true,
    prospectusFileId: null,
    enquiryFields: ["GRADE"],
    facilities: [],
    albums: [],
    achievements: [],
    downloads: [],
    customPages: [],
    // website-three (17 Oct 2026)
    menuOrder: [],
    // TA-225 (14 Nov 2026): no news picture is ticked for the office.
    newsPictures: [],
  };
}

/**
 * The stored draft brought to the current shape: each field that parses is kept, each that does not falls back
 * to the default, the sections and pages listed once each in the stored order with any missing appended, the
 * numbers and fonts held to their lists. Never throws.
 */
export function repairSiteConfig(raw: unknown, defaults: SiteConfig): SiteConfig {
  const obj = raw && typeof raw === "object" && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};
  const shape = siteConfigSchema.shape;
  const out: Record<string, unknown> = { ...defaults };
  for (const key of Object.keys(shape) as (keyof typeof shape)[]) {
    if (!(key in obj)) continue;
    const parsed = shape[key].safeParse(obj[key]);
    if (parsed.success) out[key] = parsed.data;
  }
  const config = out as SiteConfig;
  config.sections = orderedSections(config.sections, "colour" in obj && !("pages" in obj));
  config.pages = orderedPages(config.pages);
  config.metrics = SITE_METRICS.filter((m) => config.metrics.includes(m));
  if (!(FONT_KEYS as readonly string[]).includes(config.font)) config.font = "default";
  if (!(FONT_KEYS as readonly string[]).includes(config.headingFont)) config.headingFont = "default";
  if (!(SITE_TEMPLATES as readonly string[]).includes(config.template)) config.template = "CLASSIC";
  if (!("accent" in obj)) config.accent = defaultAccent(config.colour);
  config.newsPostIds = [...new Set(config.newsPostIds)];
  const seen = new Set<string>();
  config.gallery = config.gallery.filter((g) => (seen.has(g.fileId) ? false : (seen.add(g.fileId), true)));
  if (config.mapUrl && !isHttpsUrl(config.mapUrl)) config.mapUrl = "";
  const slugs = new Set<string>();
  config.customPages = config.customPages.filter((p) => (slugs.has(p.slug) ? false : (slugs.add(p.slug), true)));
  config.enquiryFields = [...new Set(config.enquiryFields)];
  // website-three (17 Oct 2026): the menu's one order, every page once, Home first (an older draft's from its pages' order).
  config.menuOrder = menuKeys(config);
  // TA-225 (14 Nov 2026): a news picture's tick is kept only while ticked and while its post is in the news, once each.
  const ticked = new Set<string>();
  config.newsPictures = config.newsPictures.filter((p) => p.consent && config.newsPostIds.includes(p.postId) && (ticked.has(`${p.postId}|${p.fileId}`) ? false : (ticked.add(`${p.postId}|${p.fileId}`), true)));
  return config;
}

/**
 * Every home section once, in the order given, the missing ones appended. `olderDraft`: a draft saved before
 * website-two never saw the new sections, so they come in off, as a section the office never chose.
 */
export function orderedSections(given: SiteConfig["sections"], olderDraft = true): SiteConfig["sections"] {
  const out: SiteConfig["sections"] = [];
  const seen = new Set<SiteSection>();
  for (const s of given) {
    if (seen.has(s.code)) continue;
    seen.add(s.code);
    out.push({ code: s.code, on: s.on });
  }
  for (const code of SECTION_ORDER) if (!seen.has(code)) out.push({ code, on: olderDraft ? false : !SECTIONS_OFF_AT_FIRST.includes(code) });
  return out;
}

/** Every page once in the order given, Home first and always on, the missing ones appended on. */
export function orderedPages(given: SiteConfig["pages"]): SiteConfig["pages"] {
  const seen = new Set<SitePage>();
  const out: SiteConfig["pages"] = [];
  for (const p of given) {
    if (seen.has(p.code)) continue;
    seen.add(p.code);
    out.push({ ...p });
  }
  for (const code of SITE_PAGES) if (!seen.has(code)) out.push({ code, on: true, title: "", lead: "", seoTitle: "", seoDescription: "" });
  const home = out.find((p) => p.code === "HOME")!;
  home.on = true;
  return [home, ...out.filter((p) => p.code !== "HOME")];
}

export function sectionOn(config: SiteConfig, code: SiteSection): boolean {
  return config.sections.some((s) => s.code === code && s.on);
}

export function pageOn(config: SiteConfig, code: SitePage): boolean {
  return code === "HOME" || config.pages.some((p) => p.code === code && p.on);
}

/** Where a picture sits in the draft, for the consent stamp and the editor's checklist (site-content.ts). */
export type SitePictureAt = { where: string; picture: SitePicture };

/** Every picture the draft names besides the news' and the one-page gallery's: the hero, the facilities, the albums, the achievements. */
export function sitePictures(config: SiteConfig): SitePictureAt[] {
  return draftPictures(config);
}

export function isHttpsUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && Boolean(url.hostname);
  } catch {
    return false;
  }
}

/** A plain email shape, for the contact line: the site prints it as a mailto link. */
export function isEmailish(value: string): boolean {
  return /^[^\s@<>"']{1,64}@[^\s@<>"']{1,180}\.[A-Za-z]{2,}$/.test(value);
}

/** A phone as a person writes one: digits, spaces, +, - and brackets, 6 to 20 characters. */
export function isPhoneish(value: string): boolean {
  return /^[+()\d][\d\s()+-]{5,19}$/.test(value) && (value.match(/\d/g)?.length ?? 0) >= 6;
}

/** A social link the footer may carry: https on the network's own host (or its short form). */
export function socialLinkOk(network: "facebook" | "instagram" | "youtube", value: string): boolean {
  if (!value) return true;
  if (!isHttpsUrl(value)) return false;
  const host = new URL(value).hostname.replace(/^www\.|^m\./, "");
  const hosts = { facebook: ["facebook.com", "fb.com"], instagram: ["instagram.com"], youtube: ["youtube.com", "youtu.be"] }[network];
  return hosts.includes(host);
}

/** A WhatsApp number for wa.me: the country code and the number, digits only, 10 to 15 of them. */
export function whatsappOk(value: string): boolean {
  return !value || /^\d{10,15}$/.test(value.replace(/[\s+()-]/g, ""));
}
