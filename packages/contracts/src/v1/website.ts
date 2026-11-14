import { z } from "zod";

/**
 * A SCHOOL'S PUBLIC WEBSITE (the WEBSITE module, 15 October 2026; website-builder A).
 *
 * The admin or the head builds the site in one editor at /admin/website (website-two, 16 October 2026: the six
 * screens of 15 October — Look, About, Sections, Preview, Publish, Your domain — are its sections) with no free
 * layout anywhere: every choice is one of these coded lists. The draft is `siteConfigSchema`, kept in
 * SchoolSite.configJson, whose keys are only ever added (a field new since a draft was saved takes its default);
 * Publish renders it into static HTML per page and language (apps/web/src/lib/site-render.ts, site-publish.ts). What a site may show is the school's own public words and
 * aggregate numbers (SITE_METRICS, apps/web/src/lib/site-metrics.ts): never a named pupil, never a grade, never a
 * picture without the admin's consent tick (decision 0002).
 */

/** The six looks: they differ in the header's layout, the sections' rhythm and the colour's default use (Heritage and Bold since 16 Oct 2026). */
export const SITE_TEMPLATES = ["CLASSIC", "MODERN", "WARM", "MINIMAL", "HERITAGE", "BOLD"] as const;
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

/**
 * The home page's sections, each a switch, in the order the admin sets (About always comes first); the last three
 * since 16 Oct 2026. A section switched on with nothing to show is left off the page.
 */
export const SITE_SECTIONS = ["NUMBERS", "FACULTY", "DISCLOSURE", "ADMISSIONS", "NEWS", "GALLERY", "CONTACT", "EVENTS", "ACHIEVEMENTS", "FACILITIES"] as const;
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

/**
 * TA-225 (the owner's decision of 14 November 2026): the consent tick on a news item's picture, the first picture of one
 * of the news posts. A news item goes public with its words alone until its picture is ticked ("the people shown have
 * consented to publication"); who ticked it and when are written by the server, never taken from the form, as the
 * Gallery's are, and travel into the published snapshot. A tick names the picture: a post whose first picture changed
 * shows the new one only once it is ticked.
 */
export const siteNewsPictureSchema = z.object({
  postId: z.string().min(1).max(64),
  fileId: z.string().min(1).max(200),
  consent: z.boolean(),
  consentByUserId: z.string().max(64).nullable().optional(),
  consentAt: z.string().datetime().nullable().optional(),
});
export type SiteNewsPicture = z.infer<typeof siteNewsPictureSchema>;

export const siteSectionStateSchema = z.object({ code: z.enum(SITE_SECTIONS), on: z.boolean() });
/* ------------------------------------------------------------------------------------------------ */
/* website-two (16 October 2026): one editor, more customisation, more pages                       */
/* ------------------------------------------------------------------------------------------------ */

/** A colour as #rrggbb: the palette's, or the logo's own made readable (apps/web/src/lib/site-colour.ts checks a pair). */
export const siteHexSchema = z.string().regex(/^#[0-9a-fA-F]{6}$/);

/** The palette the editor offers for the primary and the accent, each able to carry white words at 4.5:1. */
export const SITE_PALETTE = ["#1d4ed8", "#0f766e", "#b45309", "#9f1239", "#4d7c0f", "#6d28d9", "#0e7490", "#be123c", "#1e3a8a", "#7c2d12", "#166534", "#374151"] as const;

export const SITE_THEMES = ["LIGHT", "DARK"] as const;
export type SiteTheme = (typeof SITE_THEMES)[number];

/** The header: as the template draws it, the logo on the left, the logo centred, or the school's name as the wordmark. */
export const SITE_HEADER_STYLES = ["TEMPLATE", "LOGO_LEFT", "LOGO_CENTRED", "WORDMARK"] as const;
export type SiteHeaderStyle = (typeof SITE_HEADER_STYLES)[number];

/** The top of the home page: a band of the colour, a picture banner, or the motto alone. */
export const SITE_HERO_STYLES = ["BAND", "PICTURE", "MOTTO"] as const;
export type SiteHeroStyle = (typeof SITE_HERO_STYLES)[number];

/**
 * The site's pages, each a switch, in the admin's order (Home always first and always on); a page with nothing to show
 * is left out of the menu and answers 404. Up to four custom pages follow them.
 */
export const SITE_PAGES = ["HOME", "ABOUT", "ACADEMICS", "ADMISSIONS", "FACILITIES", "FACULTY", "GALLERY", "NEWS", "EVENTS", "ACHIEVEMENTS", "DOWNLOADS", "CONTACT"] as const;
export type SitePage = (typeof SITE_PAGES)[number];

/** Facilities from a coded list, plus the school's own (CUSTOM, with a name). */
export const SITE_FACILITIES = ["LIBRARY", "LABORATORIES", "PLAYGROUND", "TRANSPORT", "HOSTEL", "CANTEEN", "COMPUTER_LAB", "SMART_CLASSES", "CUSTOM"] as const;
export type SiteFacility = (typeof SITE_FACILITIES)[number];

/** What a downloadable PDF is. */
export const SITE_DOWNLOAD_KINDS = ["PROSPECTUS", "FEE_STRUCTURE", "DISCLOSURE", "ACADEMIC_CALENDAR", "OTHER"] as const;
export type SiteDownloadKind = (typeof SITE_DOWNLOAD_KINDS)[number];

/** The optional fields the enquiry form asks for besides the name, the contact and the question. */
export const SITE_ENQUIRY_FIELDS = ["GRADE", "EMAIL", "VISIT"] as const;
export type SiteEnquiryField = (typeof SITE_ENQUIRY_FIELDS)[number];

export const SITE_CUSTOM_PAGES_MAX = 4;
export const SITE_FACILITIES_MAX = 16;
export const SITE_ALBUMS_MAX = 8;
export const SITE_ALBUM_PICTURES_MAX = 24;
export const SITE_ACHIEVEMENTS_MAX = 20;
export const SITE_DOWNLOADS_MAX = 12;
/** A custom page's path segment: lowercase letters, digits and hyphens; never one of the built-in pages' paths. */
export const SITE_CUSTOM_SLUG = /^[a-z0-9](?:[a-z0-9-]{0,38}[a-z0-9])?$/;

const dateKeySchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

/**
 * A picture the site shows: one of the school's approved posts' pictures (`postId`) or one uploaded for the site
 * (`postId` null, a SchoolSiteFile), with its words for a reader who cannot see it, and the consent tick that the
 * people shown have agreed to publication (decision 0002). Who ticked it and when are written by the server.
 */
export const sitePictureSchema = z.object({
  fileId: z.string().min(1).max(200),
  postId: z.string().min(1).max(64).nullable(),
  alt: z.string().max(200),
  consent: z.boolean(),
  consentByUserId: z.string().max(64).nullable().optional(),
  consentAt: z.string().datetime().nullable().optional(),
});
export type SitePicture = z.infer<typeof sitePictureSchema>;

export const sitePageStateSchema = z.object({
  code: z.enum(SITE_PAGES),
  on: z.boolean(),
  /** The page's name in the menu and its heading; "" is the page's own name in the page's language. */
  title: z.string().max(60),
  /** A short line under the heading. */
  lead: z.string().max(300),
  /** For search engines: the page's title and description; "" falls back to the school's name and the lead. */
  seoTitle: z.string().max(70),
  seoDescription: z.string().max(160),
});
export type SitePageState = z.infer<typeof sitePageStateSchema>;

/** A home section's own title ("" the default) and short lead. */
export const siteSectionTextSchema = z.object({ code: z.enum(SITE_SECTIONS), title: z.string().max(60), lead: z.string().max(300) });

export const siteFacilityItemSchema = z.object({
  code: z.enum(SITE_FACILITIES),
  /** The name, for a CUSTOM one; "" for a coded one (its name is the dictionary's). */
  label: z.string().max(60),
  line: z.string().max(200),
  picture: sitePictureSchema.nullable(),
});
export const siteAlbumSchema = z.object({ id: z.string().min(1).max(40), title: z.string().min(1).max(80), pictures: z.array(sitePictureSchema).max(SITE_ALBUM_PICTURES_MAX) });
export const siteAchievementSchema = z.object({ id: z.string().min(1).max(40), title: z.string().min(1).max(100), dateKey: dateKeySchema, line: z.string().max(300), picture: sitePictureSchema.nullable() });
export const siteDownloadSchema = z.object({ id: z.string().min(1).max(40), kind: z.enum(SITE_DOWNLOAD_KINDS), title: z.string().min(1).max(100), fileId: z.string().min(1).max(200) });
export const siteCustomPageSchema = z.object({
  id: z.string().min(1).max(40),
  slug: z.string().regex(SITE_CUSTOM_SLUG),
  title: z.string().min(1).max(60),
  on: z.boolean(),
  /** Limited rich text (headings, paragraphs, lists, bold, links), sanitised by the server on every save. */
  html: z.string().max(20000),
  seoDescription: z.string().max(160),
});
export type SiteCustomPage = z.infer<typeof siteCustomPageSchema>;

/** The draft, whole: what PUT /api/v1/admin/site takes and GET returns. A field added since 15 October has a default, so an older body still parses. */
export const siteConfigSchema = z.object({
  template: z.enum(SITE_TEMPLATES),
  /** The primary colour: a swatch, the palette's, or the logo's own made readable (16 Oct 2026: was the six swatches only). */
  colour: siteHexSchema,
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
  // website-two (16 Oct 2026)
  /** The accent: the announcement bar, highlights. Refused with the primary when the pair cannot be read. */
  accent: siteHexSchema.default("#b45309"),
  theme: z.enum(SITE_THEMES).default("LIGHT"),
  /** The headings' face (`font` is the body's); a bundled face's key or "default". */
  headingFont: z.string().min(1).max(40).default("default"),
  headerStyle: z.enum(SITE_HEADER_STYLES).default("TEMPLATE"),
  heroStyle: z.enum(SITE_HERO_STYLES).default("BAND"),
  heroPicture: sitePictureSchema.nullable().default(null),
  /** One line across the top of every page, shown only from `from` to `to` (YYYY-MM-DD, either may be ""). */
  announcement: z.object({ text: z.string().max(160), from: z.union([dateKeySchema, z.literal("")]), to: z.union([dateKeySchema, z.literal("")]) }).default({ text: "", from: "", to: "" }),
  /** The footer's links: https addresses on Facebook, Instagram and YouTube, and a WhatsApp number (a wa.me link). */
  social: z.object({ facebook: z.string().max(200), instagram: z.string().max(200), youtube: z.string().max(200), whatsapp: z.string().max(20) }).default({ facebook: "", instagram: "", youtube: "", whatsapp: "" }),
  pages: z.array(sitePageStateSchema).max(SITE_PAGES.length).default([]),
  sectionTexts: z.array(siteSectionTextSchema).max(SITE_SECTIONS.length).default([]),
  academicsText: z.string().max(2000).default(""),
  /** The medium of instruction, as the school says it. */
  medium: z.string().max(60).default(""),
  /** List the subjects the timetable teaches each class on the Academics page. */
  academicsSubjects: z.boolean().default(true),
  /** A PDF uploaded for the site (SchoolSiteFile), linked from Admissions and Downloads. */
  prospectusFileId: z.string().min(1).max(200).nullable().default(null),
  enquiryFields: z.array(z.enum(SITE_ENQUIRY_FIELDS)).max(SITE_ENQUIRY_FIELDS.length).default(["GRADE"]),
  facilities: z.array(siteFacilityItemSchema).max(SITE_FACILITIES_MAX).default([]),
  albums: z.array(siteAlbumSchema).max(SITE_ALBUMS_MAX).default([]),
  achievements: z.array(siteAchievementSchema).max(SITE_ACHIEVEMENTS_MAX).default([]),
  downloads: z.array(siteDownloadSchema).max(SITE_DOWNLOADS_MAX).default([]),
  customPages: z.array(siteCustomPageSchema).max(SITE_CUSTOM_PAGES_MAX).default([]),
  // website-three (17 Oct 2026)
  /**
   * The menu's one order: the built-in pages' codes and the custom pages' "custom:<id>" keys, Home first. Empty in a draft
   * saved before it, read then as the pages' own order with the custom pages after (apps/web/src/lib/site-content.ts menuKeys).
   */
  menuOrder: z.array(z.string().min(1).max(48)).max(SITE_PAGES.length + SITE_CUSTOM_PAGES_MAX).default([]),
  // TA-225 (14 Nov 2026)
  /** The news pictures' consent ticks (siteNewsPictureSchema): a news post's picture is shown only while ticked here. */
  newsPictures: z.array(siteNewsPictureSchema).max(SITE_NEWS_MAX).default([]),
});
export type SiteConfig = z.infer<typeof siteConfigSchema>;

/** A warning the preview lists: a missing logo or about text, or a section that is on with nothing in it. */
export const SITE_WARNINGS = ["NO_LOGO", "NO_ABOUT", "EMPTY_NUMBERS", "EMPTY_FACULTY", "EMPTY_DISCLOSURE", "EMPTY_NEWS", "EMPTY_GALLERY", "EMPTY_CONTACT", "GALLERY_NO_CONSENT"] as const;
export type SiteWarning = (typeof SITE_WARNINGS)[number];

/** The editor's "Ready to publish" card: seven things a finished site has (16 Oct 2026). */
export const SITE_CHECKS = ["LOGO", "ABOUT", "HERO_PICTURE", "CONTACT", "ADMISSIONS", "PICTURE_CONSENT", "DOMAIN"] as const;
export type SiteCheck = (typeof SITE_CHECKS)[number];
export const siteCheckSchema = z.object({ code: z.enum(SITE_CHECKS), done: z.boolean() });

/** GET and PUT /api/v1/admin/site: the draft, whether a version is live, the site's address and the warnings. */
export const adminSiteSchema = z.object({
  config: siteConfigSchema,
  published: z.boolean(),
  publishedAt: z.string().datetime().nullable(),
  /** https://<the school's own domain> once it is LIVE, else null: a site lives only on its own domain (16 Oct 2026). */
  address: z.string().nullable(),
  warnings: z.array(z.enum(SITE_WARNINGS)),
  /** website-two: the "Ready to publish" card, whether the draft differs from the live version, and when it was last saved (null: never, the first draft built for the office). */
  checklist: z.array(siteCheckSchema),
  unpublishedChanges: z.boolean(),
  draftSavedAt: z.string().datetime().nullable(),
  /**
   * website-three (17 Oct 2026): the draft's save count. PUT may send it back as `If-Match: <n>`; a draft saved by someone
   * else since is then refused 409 CONFLICT. `alsoEditing`: another person's name when they saved it in the last five minutes.
   */
  draftVersion: z.number().int().optional(),
  alsoEditing: z.string().nullable().optional(),
});
export type AdminSite = z.infer<typeof adminSiteSchema>;

/** GET /api/v1/admin/site/preview?lang=&page= (page: a built-in page's path or a custom page's, "" home; 16 Oct 2026). */
export const adminSitePreviewQuerySchema = z.object({ lang: z.enum(SITE_LANGUAGES).optional(), page: z.string().max(40).regex(/^[a-z0-9-]*$/).optional() });

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
  /** website-two: the form's optional fields, asked only where the office turned them on. */
  email: z.string().trim().max(200).optional().default(""),
  visit: z.string().max(10).optional().default(""),
});
export type SiteEnquiryBody = z.infer<typeof siteEnquiryBodySchema>;

/* ------------------------------------------------------------------------------------------------ */
/* website-two doors (16 October 2026): versions, review links, the enquiries inbox, visits          */
/* ------------------------------------------------------------------------------------------------ */

/** GET /api/v1/admin/site/versions — every version kept, newest first, with who published it (null: the nightly refresh). */
export const siteVersionsSchema = z.object({
  versions: z.array(z.object({ id: z.string(), renderedAt: z.string().datetime(), live: z.boolean(), byName: z.string().nullable(), nightly: z.boolean() })),
});
/** POST …/versions/{versionId}/restore and POST /api/v1/admin/site/revert: the draft replaced, so the body asks for it in words. */
export const siteRestoreBodySchema = z.object({ confirm: z.literal(true) });
export const siteRestoredSchema = z.object({ ok: z.literal(true), config: siteConfigSchema });

/** POST /api/v1/admin/site/shares — a review link to the draft, valid up to seven days; the token is shown this once. */
export const siteShareCreateSchema = z.object({ days: z.number().int().min(1).max(7) });
export const siteShareMadeSchema = z.object({ id: z.string(), url: z.string(), expiresAt: z.string().datetime() });
/** GET /api/v1/admin/site/shares — the links still open (never their tokens). */
export const siteSharesSchema = z.object({ shares: z.array(z.object({ id: z.string(), createdAt: z.string().datetime(), expiresAt: z.string().datetime(), byName: z.string().nullable() })) });

export const SITE_ENQUIRY_STATUSES = ["NEW", "REPLIED", "CLOSED"] as const;
export type SiteEnquiryStatus = (typeof SITE_ENQUIRY_STATUSES)[number];
/** The days an enquiry is kept once closed or left untouched (the weekly site:enquiries job; the form says so). */
export const SITE_ENQUIRY_KEEP_DAYS = 180;
export const siteEnquiryRowSchema = z.object({
  id: z.string(),
  name: z.string(),
  contact: z.string(),
  email: z.string(),
  grade: z.string(),
  wantsVisit: z.boolean(),
  message: z.string(),
  language: z.enum(SITE_LANGUAGES),
  createdAt: z.string().datetime(),
  status: z.enum(SITE_ENQUIRY_STATUSES),
  replyText: z.string(),
  repliedAt: z.string().datetime().nullable(),
  /** The address a reply goes to: the email field, else the contact when it is an email; null when only a phone was given. */
  replyTo: z.string().nullable(),
  /** website-three (17 Oct 2026): every reply sent on the thread, oldest first (`replyText` is the latest). */
  replies: z.array(z.object({ text: z.string(), at: z.string().datetime(), byName: z.string().nullable() })).default([]),
});
export type SiteEnquiryRow = z.infer<typeof siteEnquiryRowSchema>;
/** GET /api/v1/admin/site/enquiries?status= */
export const siteEnquiriesQuerySchema = z.object({ status: z.enum(SITE_ENQUIRY_STATUSES).optional() });
export const siteEnquiriesSchema = z.object({ enquiries: z.array(siteEnquiryRowSchema), counts: z.object({ NEW: z.number().int(), REPLIED: z.number().int(), CLOSED: z.number().int() }) });
/** POST …/enquiries/{enquiryId}/reply — sent by email in the enquirer's language. */
export const siteEnquiryReplySchema = z.object({ text: z.string().trim().min(1).max(4000) });
/** POST …/enquiries/{enquiryId}/status — close one, or open it again. */
export const siteEnquiryStatusSchema = z.object({ status: z.enum(SITE_ENQUIRY_STATUSES) });

/** GET /api/v1/admin/site/visits — page views counted on the server, no cookie, no address: thirty days and the pages. */
export const siteVisitsSchema = z.object({
  days: z.array(z.object({ dateKey: z.string(), count: z.number().int() })),
  total: z.number().int(),
  pages: z.array(z.object({ page: z.string(), count: z.number().int() })),
});

/** website-three (17 Oct 2026): where a file uploaded for the site is used — a part of the saved draft, or a page of the live site. */
export const SITE_FILE_USES = ["HERO", "FACILITY", "ALBUM", "ACHIEVEMENT", "PROSPECTUS", "DOWNLOAD", "LIVE"] as const;
export type SiteFileUse = (typeof SITE_FILE_USES)[number];

/** GET /api/v1/admin/site/files — the files uploaded for the site (pictures and PDFs). */
export const siteFilesSchema = z.object({
  files: z.array(
    z.object({
      fileId: z.string(),
      kind: z.enum(["IMAGE", "PDF"]),
      name: z.string(),
      size: z.number().int(),
      createdAt: z.string().datetime(),
      /** website-three (17 Oct 2026): where the saved draft and the live site use it (SITE_FILE_USES); empty: unused, so it may be deleted. */
      usedBy: z.array(z.object({ use: z.enum(SITE_FILE_USES), label: z.string() })).default([]),
    }),
  ),
  /** website-three: how many there are and the most a site keeps. */
  count: z.number().int().optional(),
  max: z.number().int().optional(),
});

/* ------------------------------------------------------------------------------------------------ */
/* website-three (17 October 2026): files deleted, concurrent edits, the phone's read                */
/* ------------------------------------------------------------------------------------------------ */

/**
 * GET /api/v1/admin/site/summary — the website at a glance, for the phone (read-only; editing is on the web): draft or
 * published, the live address, the "Ready: n of 7" list, the enquiries waiting with the newest three, and the page views
 * of the last thirty days.
 */
export const siteSummarySchema = z.object({
  state: z.enum(["DRAFT", "PUBLISHED"]),
  publishedAt: z.string().datetime().nullable(),
  unpublishedChanges: z.boolean(),
  address: z.string().nullable(),
  checklist: z.array(siteCheckSchema),
  ready: z.object({ done: z.number().int(), total: z.number().int() }),
  enquiries: z.object({
    newCount: z.number().int(),
    total: z.number().int(),
    newest: z.array(z.object({ id: z.string(), name: z.string(), createdAt: z.string().datetime(), status: z.enum(SITE_ENQUIRY_STATUSES), wantsVisit: z.boolean() })).max(3),
  }),
  visits: z.object({ total: z.number().int(), days: z.array(z.object({ dateKey: z.string(), count: z.number().int() })) }),
  /** The editor's path on the web app, for "Edit on the web". */
  editPath: z.string(),
});
export type SiteSummary = z.infer<typeof siteSummarySchema>;
