import { SITE_LANGUAGES, SITE_METRICS, SITE_SECTIONS, SITE_SWATCHES, SITE_TEMPLATES, siteConfigSchema, type SiteConfig, type SiteLanguage, type SiteSection } from "@edulink/contracts";
import { FONT_KEYS } from "./fonts";

/**
 * A SCHOOL'S WEBSITE DRAFT, ITS DEFAULTS AND ITS REPAIR (website-builder A, 15 October 2026).
 *
 * Pure: no database, no session, so the flow's client forms, the renderer's tests and the publish path read the
 * same rules. The draft is stored as JSON (SchoolSite.configJson); anything an older build or a hand edit left
 * in it is brought back to the shape here rather than refused, so the office never meets a broken flow.
 *
 * DEFAULTS ARE CHOSEN FOR THE PERSON (website-shared.md: someone who has never built a website): the Classic
 * look, the colour nearest the logo, the app's own face, the school's own language, every section on except
 * the ones the school has nothing for, the safe numbers on (pupils, staff, classes, the board), the about text
 * and contact details from what the school already entered.
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
  /** The swatch nearest the logo's main colour (site-logo-colour.ts), or null for the first. */
  logoSwatch?: string | null;
};

const SECTION_ORDER: readonly SiteSection[] = SITE_SECTIONS;

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

export function defaultSiteConfig(src: SiteDefaultsSource): SiteConfig {
  const college = src.kind === "COLLEGE" || src.kind === "AUTONOMOUS_COLLEGE";
  const swatch = (SITE_SWATCHES as readonly string[]).includes(src.logoSwatch ?? "") ? (src.logoSwatch as SiteConfig["colour"]) : SITE_SWATCHES[0];
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
    sections: SECTION_ORDER.map((code) => ({ code, on: code !== "FACULTY" && code !== "DISCLOSURE" ? true : college })),
    metrics: [...(college ? DEFAULT_COLLEGE_METRICS : DEFAULT_METRICS)],
    admissionsText: "",
    enquiryForm: true,
    newsPostIds: [],
    gallery: [],
  };
}

/**
 * The stored draft brought to the current shape: each field that parses is kept, each that does not falls back
 * to the default, the sections listed once each in the stored order with any missing appended, the numbers and
 * fonts held to their lists. Never throws.
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
  config.sections = orderedSections(config.sections);
  config.metrics = SITE_METRICS.filter((m) => config.metrics.includes(m));
  if (!(FONT_KEYS as readonly string[]).includes(config.font)) config.font = "default";
  if (!(SITE_TEMPLATES as readonly string[]).includes(config.template)) config.template = "CLASSIC";
  config.newsPostIds = [...new Set(config.newsPostIds)];
  const seen = new Set<string>();
  config.gallery = config.gallery.filter((g) => (seen.has(g.fileId) ? false : (seen.add(g.fileId), true)));
  if (config.mapUrl && !isHttpsUrl(config.mapUrl)) config.mapUrl = "";
  return config;
}

/** Every section once, in the order given, the missing ones appended off. */
export function orderedSections(given: SiteConfig["sections"]): SiteConfig["sections"] {
  const out: SiteConfig["sections"] = [];
  const seen = new Set<SiteSection>();
  for (const s of given) {
    if (seen.has(s.code)) continue;
    seen.add(s.code);
    out.push({ code: s.code, on: s.on });
  }
  for (const code of SECTION_ORDER) if (!seen.has(code)) out.push({ code, on: false });
  return out;
}

export function sectionOn(config: SiteConfig, code: SiteSection): boolean {
  return config.sections.some((s) => s.code === code && s.on);
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
