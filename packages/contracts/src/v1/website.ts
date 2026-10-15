import { z } from "zod";

/**
 * A SCHOOL'S PUBLIC WEBSITE (the WEBSITE module, 15 October 2026; website-builder A).
 *
 * The admin or the head builds the site in six screens at /admin/website (Look, About, Sections, Preview,
 * Publish, Your domain) with no free layout anywhere: every choice is one of these coded lists. The draft is
 * `siteConfigSchema`, kept in SchoolSite.configJson; Publish renders it into static HTML per language
 * (apps/web/src/lib/site-render.ts, site-publish.ts). What a site may show is the school's own public words and
 * aggregate numbers (SITE_METRICS, apps/web/src/lib/site-metrics.ts): never a named pupil, never a grade, never a
 * picture without the admin's consent tick (decision 0002).
 */

/** The four looks: they differ in the header's layout, the sections' rhythm and the colour's default use. */
export const SITE_TEMPLATES = ["CLASSIC", "MODERN", "WARM", "MINIMAL"] as const;
export type SiteTemplate = (typeof SITE_TEMPLATES)[number];

/**
 * The six colours a site may be painted in, chosen to carry white text at 4.5:1 or better. The default is the
 * one nearest the school's logo (site-logo-colour.ts), else the first.
 */
export const SITE_SWATCHES = ["#1d4ed8", "#0f766e", "#b45309", "#9f1239", "#4d7c0f", "#6d28d9"] as const;
export type SiteSwatch = (typeof SITE_SWATCHES)[number];

/** The site's languages: one is the site's own, the other two offered by a switch when the admin turns it on. */
export const SITE_LANGUAGES = ["en", "hi", "mr"] as const;
export type SiteLanguage = (typeof SITE_LANGUAGES)[number];

/** The sections a site may carry, each a switch, in the order the admin sets (About always comes first). */
export const SITE_SECTIONS = ["NUMBERS", "FACULTY", "DISCLOSURE", "ADMISSIONS", "NEWS", "GALLERY", "CONTACT"] as const;
export type SiteSection = (typeof SITE_SECTIONS)[number];

/**
 * The aggregate numbers a site may show, each its own switch (website-shared.md): pupils enrolled, teaching
 * staff, attendance this month (school-wide), classes offered, the board or affiliation, years since founding,
 * the result pass rate; and for a college its programmes, this year's placement offers and the highest and
 * median package. A number the school has no data for is left off the page, never shown as zero.
 */
export const SITE_METRICS = [
  "PUPILS",
  "TEACHING_STAFF",
  "ATTENDANCE_MONTH",
  "CLASSES",
  "BOARD",
  "YEARS_SINCE_FOUNDING",
  "PASS_RATE",
  "PROGRAMMES",
  "PLACEMENT_OFFERS",
  "PLACEMENT_HIGHEST",
  "PLACEMENT_MEDIAN",
] as const;
export type SiteMetric = (typeof SITE_METRICS)[number];

/** News: at most twelve of the school's approved school-wide posts. Gallery: at most twenty-four pictures. */
export const SITE_NEWS_MAX = 12;
export const SITE_GALLERY_MAX = 24;
export const SITE_PHONES_MAX = 3;

/**
 * One gallery picture: a picture of one of the school's approved posts, shown only while `consent` is ticked
 * ("the people shown have consented to publication"). Who ticked it and when are written by the server, never
 * taken from the form, and travel into the published snapshot.
 */
export const siteGalleryItemSchema = z.object({
  postId: z.string().min(1).max(64),
  fileId: z.string().min(1).max(200),
  consent: z.boolean(),
  consentByUserId: z.string().max(64).nullable().optional(),
  consentAt: z.string().datetime().nullable().optional(),
});
export type SiteGalleryItem = z.infer<typeof siteGalleryItemSchema>;

export const siteSectionStateSchema = z.object({ code: z.enum(SITE_SECTIONS), on: z.boolean() });

/** The draft, whole: what PUT /api/v1/admin/site takes and GET returns. */
export const siteConfigSchema = z.object({
  template: z.enum(SITE_TEMPLATES),
  colour: z.enum(SITE_SWATCHES),
  /** A bundled face's key (apps/web/src/lib/fonts.ts FONT_KEYS); "default" is the system face. */
  font: z.string().min(1).max(40),
  language: z.enum(SITE_LANGUAGES),
  offerOtherLanguages: z.boolean(),
  motto: z.string().max(140),
  about: z.string().max(3000),
  address: z.string().max(300),
  phones: z.array(z.string().max(20)).max(SITE_PHONES_MAX),
  email: z.string().max(200),
  /** An https link to a map, or empty. */
  mapUrl: z.string().max(500),
  hours: z.string().max(200),
  board: z.string().max(140),
  foundedYear: z.number().int().min(1800).max(2100).nullable(),
  principalMessage: z.string().max(2000),
  /** The head's name under the message, only when ticked and only while a head is a member. */
  principalNamed: z.boolean(),
  sections: z.array(siteSectionStateSchema).max(SITE_SECTIONS.length),
  /** The numbers switched on. */
  metrics: z.array(z.enum(SITE_METRICS)).max(SITE_METRICS.length),
  admissionsText: z.string().max(2000),
  enquiryForm: z.boolean(),
  newsPostIds: z.array(z.string().min(1).max(64)).max(SITE_NEWS_MAX),
  gallery: z.array(siteGalleryItemSchema).max(SITE_GALLERY_MAX),
});
export type SiteConfig = z.infer<typeof siteConfigSchema>;

/** A warning the preview lists: a missing logo or about text, or a section that is on with nothing in it. */
export const SITE_WARNINGS = ["NO_LOGO", "NO_ABOUT", "EMPTY_NUMBERS", "EMPTY_FACULTY", "EMPTY_DISCLOSURE", "EMPTY_NEWS", "EMPTY_GALLERY", "EMPTY_CONTACT", "GALLERY_NO_CONSENT"] as const;
export type SiteWarning = (typeof SITE_WARNINGS)[number];

/** GET and PUT /api/v1/admin/site: the draft, whether a version is live, the site's address and the warnings. */
export const adminSiteSchema = z.object({
  config: siteConfigSchema,
  published: z.boolean(),
  publishedAt: z.string().datetime().nullable(),
  /** https://<the school's own domain> once it is LIVE, else null: a site lives only on its own domain (16 Oct 2026). */
  address: z.string().nullable(),
  warnings: z.array(z.enum(SITE_WARNINGS)),
});
export type AdminSite = z.infer<typeof adminSiteSchema>;

/** GET /api/v1/admin/site/preview?lang= */
export const adminSitePreviewQuerySchema = z.object({ lang: z.enum(SITE_LANGUAGES).optional() });

/** POST /api/v1/admin/site/publish */
export const adminSitePublishedSchema = z.object({
  ok: z.literal(true),
  versionId: z.string(),
  renderedAt: z.string().datetime(),
  /** As adminSiteSchema's: null while the school's own domain is not LIVE (the version is stored all the same). */
  address: z.string().nullable(),
});

/**
 * The published site's admission form, posted signed out to /enquiry on the school's own domain (the by-host route;
 * 16 Oct 2026 — no slug path and no public door). `website` is a field a person never sees and a form-filling robot
 * fills: a body carrying it is thanked and dropped.
 */
export const siteEnquiryBodySchema = z.object({
  name: z.string().trim().min(1).max(120),
  contact: z.string().trim().min(5).max(200),
  grade: z.string().trim().max(60).optional().default(""),
  message: z.string().trim().min(1).max(2000),
  website: z.string().max(200).optional().default(""),
});
export type SiteEnquiryBody = z.infer<typeof siteEnquiryBodySchema>;
