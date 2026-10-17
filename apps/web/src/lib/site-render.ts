import { LOCALES } from "./i18n/locales";
import { SITE_PAGES, type SiteConfig, type SiteLanguage, type SitePage, type SiteSection, type SiteTemplate } from "@edulink/contracts";
import { translator, type Translate, type TranslationKey } from "./i18n/dictionary";
import { fontByKey, fontFile, FONTS, type FontFace } from "./fonts";
import { linkColourFor, mixWithWhite, SITE_PAGE_DARK } from "./site-colour";
import type { SiteNumber } from "./site-metrics";
import {
  announcementShown,
  downloadsShown,
  galleryAlbums,
  pictureShown,
  sectionsShown,
  sitePagesShown,
  upcomingEvents,
  SITE_DOWNLOAD_NAME,
  SITE_FACILITY_NAME,
  SITE_PAGE_PATH,
  SITE_PAGE_TITLE,
  type SiteData,
  type SiteEventItem,
  type SiteImage,
} from "./site-content";

export * from "./site-content";

/**
 * A SCHOOL'S WEBSITE AS STATIC HTML PAGES (website-builder A, 15 October 2026; website-two, 16 October 2026).
 *
 * PURE: the draft and the data in, a string out — no database, no clock, no session — so the same function
 * renders the editor's live preview, the review link, the published version and the tests' snapshots. Publish
 * calls it once per page the site shows and per language (site-publish.ts); the public route serves the stored
 * string as it is, after `finishSiteHtml` fills in where the page is being read (below).
 *
 * WHAT A PAGE IS. Semantic HTML with a skip link, one h1 (the school's name in the header), an h2 per section,
 * h3 inside; alt text on every picture (the post's own or the one the office typed); inline CSS only and NO
 * JavaScript; no outside host at all (pictures and PDFs from the platform's own file route, faces from the bundled
 * /fonts, else the system's); a menu of the pages that are on and have something to show; a language switch of plain
 * links (?lang=) when the admin turns it on; an announcement bar while its dates hold; a footer with the school's
 * social links, the mandatory disclosure when published, and "Built with Shalaghar". The enquiry form is a plain
 * POST to /enquiry on the site's own host, so CSP's form-action 'self' holds.
 *
 * WHERE THE PAGE IS READ is not known here: the school's own domain, the office's signed-in view at /sites/<slug>,
 * the editor's preview, a review link. So links between the pages are written `__SITE_BASE__/about` and the
 * addresses search engines need absolute (canonical, hreflang, Open Graph) `__SITE_ORIGIN____SITE_BASE__/about`, and
 * `finishSiteHtml` replaces the two markers when the page is served. A school's own words are escaped before they
 * reach the page, so a marker typed into them does no more than print the site's own address.
 *
 * SIX TEMPLATES, ONE CSS BASE. Classic, Modern, Warm, Minimal, Heritage and Bold differ in the header's layout,
 * the sections' rhythm and how much of the colour they use; everything else — the type scale, spacing, the numbers,
 * the form, the light or dark page — is the base, so no template can lose the skip link or the alt text.
 *
 * The school's own words (motto, about, the admissions text, a post, a custom page) are printed as typed, in
 * whatever language the school wrote them; the page's own words (headings, labels, the footer) are the dictionary's,
 * in the page's language. A custom page's rich text was sanitised by the server when it was saved
 * (site-rich-text.ts) and is printed as stored.
 */

/**
 * Options for one render: where the pictures are read from (a review link adds its token to each picture), and a line
 * across the top saying the page is a draft (the review link, the editor's preview).
 */
export type SiteRenderOptions = { fileQuery?: string; draftNote?: string };

/** The markers `finishSiteHtml` fills in. */
export const SITE_BASE_MARK = "__SITE_BASE__";
export const SITE_ORIGIN_MARK = "__SITE_ORIGIN__";

export const SITE_SECTION_ANCHOR: Record<SiteSection | "ABOUT", string> = {
  ABOUT: "about",
  NUMBERS: "numbers",
  FACULTY: "faculty",
  DISCLOSURE: "disclosure",
  ADMISSIONS: "admissions",
  NEWS: "news",
  GALLERY: "gallery",
  CONTACT: "contact",
  EVENTS: "events",
  ACHIEVEMENTS: "achievements",
  FACILITIES: "facilities",
};

const SECTION_TITLE: Record<SiteSection | "ABOUT", TranslationKey> = {
  ABOUT: "site.aboutTitle",
  NUMBERS: "site.numbersTitle",
  FACULTY: "site.facultyTitle",
  DISCLOSURE: "site.disclosureTitle",
  ADMISSIONS: "site.admissionsTitle",
  NEWS: "site.newsTitle",
  GALLERY: "site.galleryTitle",
  CONTACT: "site.contactTitle",
  EVENTS: "siteWeb.eventsTitle",
  ACHIEVEMENTS: "siteWeb.achievementsTitle",
  FACILITIES: "siteWeb.facilitiesTitle",
};

const METRIC_LABEL: Record<SiteNumber["metric"], TranslationKey> = {
  PUPILS: "site.metricPupils",
  TEACHING_STAFF: "site.metricTeachingStaff",
  ATTENDANCE_MONTH: "site.metricAttendanceMonth",
  CLASSES: "site.metricClasses",
  BOARD: "site.metricBoard",
  YEARS_SINCE_FOUNDING: "site.metricYearsSinceFounding",
  PASS_RATE: "site.metricPassRate",
  PROGRAMMES: "site.metricProgrammes",
  PLACEMENT_OFFERS: "site.metricPlacementOffers",
  PLACEMENT_HIGHEST: "site.metricPlacementHighest",
  PLACEMENT_MEDIAN: "site.metricPlacementMedian",
};

const EVENT_KIND: Record<SiteEventItem["kind"], TranslationKey> = { HOLIDAY: "siteWeb.eventHoliday", EXAM: "siteWeb.eventExam", EVENT: "siteWeb.eventFunction" };

/* ------------------------------------------------------------------------------------------------ */
/* Escaping: every string from the draft or the data passes through one of these.                   */
/* ------------------------------------------------------------------------------------------------ */

export function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
const esc = escapeHtml;

/** Plain text as paragraphs: a blank line starts a new one, a single newline is a line break. */
function paragraphs(text: string, max = 3000): string {
  const clipped = text.length > max ? `${text.slice(0, max).trimEnd()}…` : text;
  return clipped
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p>${esc(p).replace(/\n/g, "<br>")}</p>`)
    .join("");
}

/* ------------------------------------------------------------------------------------------------ */
/* Colour                                                                                          */
/* ------------------------------------------------------------------------------------------------ */

/** The colour mixed toward white by `amount` (0 the colour, 1 white). */
export function tint(hex: string, amount: number): string {
  return mixWithWhite(hex, amount);
}

/* ------------------------------------------------------------------------------------------------ */
/* Numbers and dates, said in the page's language                                                   */
/* ------------------------------------------------------------------------------------------------ */

const INTL_LOCALE: Record<SiteLanguage, string> = { en: "en-IN", hi: "hi-IN", mr: "mr-IN" };

function formatNumber(n: SiteNumber, locale: SiteLanguage, t: Translate): string {
  if (n.kind === "text") return esc(n.value);
  const digits = new Intl.NumberFormat(INTL_LOCALE[locale], { maximumFractionDigits: 0, numberingSystem: "latn" });
  if (n.kind === "percent") return `${digits.format(n.value)}%`;
  if (n.kind === "rupees") return esc(t("site.rupees", { amount: digits.format(n.value) }));
  return digits.format(n.value);
}

/** A day key said as a date in the page's language, unescaped. */
function dayText(dateKey: string, locale: SiteLanguage): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  if (!y || !m || !d) return dateKey;
  return new Intl.DateTimeFormat(INTL_LOCALE[locale], { day: "numeric", month: "long", year: "numeric", timeZone: "UTC", numberingSystem: "latn" }).format(new Date(Date.UTC(y, m - 1, d)));
}

function rangeText(from: string, to: string, locale: SiteLanguage): string {
  return from === to ? dayText(from, locale) : `${dayText(from, locale)} – ${dayText(to, locale)}`;
}

function sizeText(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

/* ------------------------------------------------------------------------------------------------ */
/* The faces                                                                                       */
/* ------------------------------------------------------------------------------------------------ */

const SYSTEM_STACK = 'system-ui, -apple-system, "Segoe UI", Roboto, "Noto Sans", "Noto Sans Devanagari", sans-serif';

/** The @font-face rules and the two font-families (body, headings): the chosen bundled faces, Mukta for Devanagari they lack. */
function faceCss(bodyKey: string, headingKey: string, locale: SiteLanguage): { faces: string; body: string; heading: string } {
  const needsDevanagari = locale !== "en";
  const mukta = FONTS.find((f) => f.key === "mukta")!;
  const stackOf = (face: FontFace | null) => {
    const list = [face, face && needsDevanagari && !face.scripts.includes("devanagari") ? mukta : null].filter((f): f is FontFace => Boolean(f));
    return { list, stack: list.length ? `${list.map((f) => `"${f.family}"`).join(", ")}, ${SYSTEM_STACK}` : SYSTEM_STACK };
  };
  const body = stackOf(fontByKey(bodyKey));
  const heading = stackOf(fontByKey(headingKey));
  const faces = [...new Map([...body.list, ...heading.list].map((f) => [f.key, f])).values()];
  const rules = faces.flatMap((face) => face.weights.map((w) => `@font-face{font-family:"${face.family}";src:url("/${fontFile(face, w)}") format("truetype");font-weight:${w};font-display:swap}`)).join("");
  return { faces: rules, body: body.stack, heading: heading.stack };
}

/* ------------------------------------------------------------------------------------------------ */
/* The CSS base and the six templates                                                               */
/* ------------------------------------------------------------------------------------------------ */

function baseCss(config: Pick<SiteConfig, "colour" | "accent" | "theme">, body: string, heading: string): string {
  const dark = config.theme === "DARK";
  const c = config.colour;
  const link = linkColourFor(c, config.theme);
  const vars = dark
    ? `--c:${c};--a:${config.accent};--link:${link};--c-soft:#1f2630;--c-mid:#2a3340;--ink:#e8eaed;--muted:#a9b1bb;--line:#39414c;--bg:${SITE_PAGE_DARK};--card:#1b2027`
    : `--c:${c};--a:${config.accent};--link:${link};--c-soft:${tint(c, 0.9)};--c-mid:${tint(c, 0.75)};--ink:#1f2328;--muted:#57606a;--line:#d8dee4;--bg:#ffffff;--card:#ffffff`;
  return [
    `:root{${vars}}`,
    "*{box-sizing:border-box}",
    `html{font-family:${body};color:var(--ink);background:var(--bg);line-height:1.6;-webkit-text-size-adjust:100%}`,
    `h1,h2,h3{font-family:${heading}}`,
    "body{margin:0}",
    "img{max-width:100%;height:auto;display:block}",
    "a{color:var(--link)}a:focus-visible,button:focus-visible,input:focus-visible,textarea:focus-visible{outline:3px solid var(--link);outline-offset:2px}",
    ".skip{position:absolute;left:-999px;top:0;background:#fff;color:#1f2328;padding:.5rem 1rem;z-index:10}.skip:focus{left:1rem}",
    ".wrap{max-width:68rem;margin:0 auto;padding:0 1rem}",
    "h1{font-size:clamp(1.6rem,4vw,2.4rem);line-height:1.2;margin:0}h2{font-size:1.5rem;line-height:1.25;margin:0 0 1rem}h3{font-size:1.1rem;margin:0 0 .25rem}",
    ".motto{margin:.25rem 0 0;font-size:1.05rem}",
    ".logo{width:72px;height:72px;object-fit:contain;background:#fff;border-radius:8px}",
    ".nav{display:flex;flex-wrap:wrap;gap:.25rem 1rem;margin:0;padding:0;list-style:none}.nav a{display:inline-block;padding:.5rem 0;min-height:44px;text-decoration:none}.nav [aria-current]{font-weight:700;text-decoration:underline}",
    ".langs{display:flex;gap:.75rem;margin:.5rem 0 0;padding:0;list-style:none;font-size:.95rem}.langs a{display:inline-block;padding:.5rem 0;min-height:44px}.langs [aria-current]{font-weight:700;text-decoration:none}",
    ".ann{background:var(--a);color:#fff;padding:.6rem 0;font-weight:600}.ann p{margin:0}.draft{background:#fff8c5;color:#3b2e00;padding:.5rem 0;font-size:.95rem}.draft p{margin:0}",
    ".hero{padding:3rem 0}.hero.band{background:var(--c);color:#fff}.hero.band a{color:#fff}.hero .big{font-size:clamp(1.4rem,3.5vw,2.2rem);line-height:1.25;margin:0;font-family:" + heading + "}.hero .lead{margin:.75rem 0 0;font-size:1.1rem;max-width:42rem}",
    ".hero.pic{padding:0}.hero.pic img{width:100%;max-height:28rem;object-fit:cover}.hero.pic .cap{background:var(--c);color:#fff;padding:1.25rem 0}",
    ".hero.motto-only{text-align:center;padding:3.5rem 0}.hero.motto-only .big{color:var(--link)}",
    "section{padding:2.5rem 0}",
    ".lede{color:var(--muted);margin:-.5rem 0 1.25rem;max-width:46rem}",
    ".more{margin:1.25rem 0 0}.more a{font-weight:600}",
    ".numbers{display:grid;grid-template-columns:repeat(auto-fit,minmax(10rem,1fr));gap:1rem;margin:0;padding:0;list-style:none}",
    ".numbers li{border:1px solid var(--line);border-radius:10px;padding:1rem;background:var(--card)}.numbers .v{display:block;font-size:1.8rem;font-weight:700;color:var(--link);line-height:1.2}.numbers .l{display:block;color:var(--muted);font-size:.95rem}",
    ".asof{color:var(--muted);font-size:.9rem;margin:1rem 0 0}",
    ".people{display:grid;grid-template-columns:repeat(auto-fit,minmax(14rem,1fr));gap:1rem;margin:0;padding:0;list-style:none}.people li{border-left:4px solid var(--c);padding:.25rem .75rem}.people span{display:block;color:var(--muted);font-size:.95rem}.people img{width:4.5rem;height:4.5rem;border-radius:50%;object-fit:cover;margin-bottom:.5rem}",
    ".news{display:grid;gap:1.5rem;margin:0;padding:0;list-style:none}.news article{display:grid;gap:.75rem}@media(min-width:48rem){.news article.pic{grid-template-columns:16rem 1fr}}",
    ".news time,.when{color:var(--muted);font-size:.9rem}.news img{border-radius:8px}",
    ".gallery{display:grid;grid-template-columns:repeat(auto-fill,minmax(12rem,1fr));gap:.75rem;margin:0;padding:0;list-style:none}.gallery img{border-radius:8px;aspect-ratio:4/3;object-fit:cover;width:100%}",
    ".album{margin:0 0 2rem}",
    ".cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(15rem,1fr));gap:1rem;margin:0;padding:0;list-style:none}.cards li{border:1px solid var(--line);border-radius:10px;background:var(--card);overflow:hidden}.cards .body{padding:1rem}.cards img{aspect-ratio:4/3;object-fit:cover;width:100%}.cards p{margin:.25rem 0 0}",
    ".events{margin:0;padding:0;list-style:none;display:grid;gap:.75rem}.events li{display:grid;gap:.1rem;border-left:4px solid var(--a);padding:.25rem .75rem}.events .kind{color:var(--muted);font-size:.9rem}",
    ".files{margin:0;padding:0;list-style:none;display:grid;gap:.5rem}.files a{display:inline-flex;min-height:44px;align-items:center;font-weight:600}.files span{color:var(--muted);font-size:.9rem;margin-left:.5rem}",
    ".facts{display:grid;grid-template-columns:max-content 1fr;gap:.5rem 1.5rem;margin:0 0 1.5rem}.facts dt{color:var(--muted)}.facts dd{margin:0}",
    ".classes{display:grid;grid-template-columns:repeat(auto-fill,minmax(14rem,1fr));gap:1rem;margin:0;padding:0;list-style:none}.classes li{border:1px solid var(--line);border-radius:10px;padding:.75rem 1rem;background:var(--card)}.classes span{display:block;color:var(--muted);font-size:.95rem}",
    "dl.contact{display:grid;grid-template-columns:max-content 1fr;gap:.5rem 1.5rem;margin:0}dl.contact dt{color:var(--muted)}dl.contact dd{margin:0}",
    "form.enquiry{display:grid;gap:.75rem;max-width:36rem;margin-top:1.5rem}form.enquiry label{display:grid;gap:.25rem;font-weight:600}form.enquiry label.tick{display:flex;gap:.5rem;align-items:center;font-weight:400}",
    "form.enquiry input,form.enquiry textarea{font:inherit;padding:.6rem .75rem;border:1px solid #8c959f;border-radius:6px;min-height:44px;width:100%;background:var(--card);color:var(--ink)}form.enquiry input[type=checkbox]{width:1.25rem;min-height:1.25rem}",
    "form.enquiry button{font:inherit;font-weight:700;background:var(--c);color:#fff;border:0;border-radius:6px;padding:.7rem 1.25rem;min-height:44px;justify-self:start;cursor:pointer}",
    ".hp{position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden}",
    ".note{color:var(--muted);font-size:.9rem;margin:0}",
    ".rich h2{font-size:1.3rem;margin:1.5rem 0 .5rem}.rich h3{margin:1.25rem 0 .25rem}",
    ".principal blockquote{margin:0;padding:0 0 0 1rem;border-left:4px solid var(--c)}.principal cite{display:block;margin-top:.5rem;font-style:normal;font-weight:600}",
    "footer{padding:2rem 0;border-top:1px solid var(--line);color:var(--muted);font-size:.9rem}footer p{margin:.25rem 0}footer ul{display:flex;flex-wrap:wrap;gap:.25rem 1rem;margin:.5rem 0;padding:0;list-style:none}footer a{display:inline-block;min-height:44px;padding:.5rem 0}",
  ].join("");
}

type HeaderParts = { logo: string; name: string; motto: string; nav: string; langs: string };
type Template = { css: string; header: (h: HeaderParts) => string };

/** Classic: a band of the colour across the top, everything centred, sections on alternating tints. */
function classic(): Template {
  return {
    css: [
      "header.hd{background:var(--c);color:#fff;text-align:center;padding:2rem 0 1rem}header.hd a{color:#fff}",
      "header.hd .logo{margin:0 auto 1rem}header.hd .nav,header.hd .langs{justify-content:center}",
      "main section:nth-of-type(even){background:var(--c-soft)}",
    ].join(""),
    header: (h) => `<header class="hd"><div class="wrap">${h.logo}<h1>${h.name}</h1>${h.motto}${h.nav}${h.langs}</div></header>`,
  };
}

/** Modern: the logo and name on the left, the pages in a row on the right, white with a rule of the colour; sections as cards. */
function modern(): Template {
  return {
    css: [
      "header.hd{border-bottom:4px solid var(--c);padding:1rem 0}header.hd .bar{display:flex;flex-wrap:wrap;align-items:center;gap:1rem;justify-content:space-between}",
      "header.hd .id{display:flex;align-items:center;gap:1rem}header.hd h1{font-size:clamp(1.3rem,3vw,1.8rem)}",
      "main section .wrap{background:var(--card)}main section{padding:1.5rem 0}main section>.wrap{border:1px solid var(--line);border-radius:14px;padding:1.5rem}",
      "main{background:var(--c-soft);padding:1rem 0 2rem}",
      "h2{color:var(--link)}",
    ].join(""),
    header: (h) => `<header class="hd"><div class="wrap bar"><div class="id">${h.logo}<div><h1>${h.name}</h1>${h.motto}</div></div><div>${h.nav}${h.langs}</div></div></header>`,
  };
}

/** Warm: a soft tint of the colour behind a rounded header card, headings in the colour, a warm paper ground. */
function warm(dark: boolean): Template {
  return {
    css: [
      dark ? "" : ":root{--bg:#fdf8f3}",
      "header.hd{padding:1.5rem 0 0}header.hd .card{background:var(--c-mid);border-radius:20px;padding:1.5rem;display:grid;gap:.75rem;justify-items:start}",
      "h2{color:var(--link);border-bottom:2px dotted var(--c-mid);padding-bottom:.25rem}",
      "main section{padding:2rem 0}.numbers li{border-radius:16px;border-color:var(--c-mid)}",
    ].join(""),
    header: (h) => `<header class="hd"><div class="wrap"><div class="card">${h.logo}<h1>${h.name}</h1>${h.motto}${h.nav}${h.langs}</div></div></header>`,
  };
}

/** Minimal: no band at all, a thin rule of the colour, one narrow column and wide spaces between sections. */
function minimal(): Template {
  return {
    css: [
      "body{border-top:6px solid var(--c)}.wrap{max-width:46rem}",
      "header.hd{padding:2.5rem 0 1rem}header.hd .logo{width:56px;height:56px;margin-bottom:1rem}",
      "main section{padding:3rem 0;border-top:1px solid var(--line)}h2{font-size:1.3rem;letter-spacing:.02em}",
      ".numbers li{border:0;border-left:3px solid var(--c);border-radius:0}",
    ].join(""),
    header: (h) => `<header class="hd"><div class="wrap">${h.logo}<h1>${h.name}</h1>${h.motto}${h.nav}${h.langs}</div></header>`,
  };
}

/** Heritage: an old school's look — a centred header between double rules, headings spaced in small capitals, a cream ground. */
function heritage(dark: boolean): Template {
  return {
    css: [
      dark ? "" : ":root{--bg:#fbf7ee;--card:#fffdf8}",
      "header.hd{text-align:center;padding:2rem 0 1rem;border-bottom:6px double var(--c)}header.hd .logo{margin:0 auto .75rem}header.hd h1{letter-spacing:.04em}",
      "header.hd .nav,header.hd .langs{justify-content:center}header.hd .motto{font-style:italic}",
      "h2{font-variant:small-caps;letter-spacing:.06em;text-align:center;color:var(--link)}h2::after{content:\"\";display:block;width:4rem;margin:.5rem auto 0;border-bottom:2px solid var(--a)}",
      "main section{padding:2.5rem 0;border-bottom:1px solid var(--line)}",
      ".numbers li{text-align:center;border-color:var(--c-mid)}",
    ].join(""),
    header: (h) => `<header class="hd"><div class="wrap">${h.logo}<h1>${h.name}</h1>${h.motto}${h.nav}${h.langs}</div></header>`,
  };
}

/** Bold: a full band of the colour with large words, headings in capitals with a thick bar of the accent. */
function bold(): Template {
  return {
    css: [
      "header.hd{background:var(--c);color:#fff;padding:2.5rem 0 1.25rem}header.hd a{color:#fff}header.hd h1{font-size:clamp(2rem,6vw,3.2rem);font-weight:800;letter-spacing:-.01em}",
      "header.hd .top{display:flex;align-items:center;gap:1.25rem;flex-wrap:wrap}",
      "h2{text-transform:uppercase;letter-spacing:.04em;font-size:1.35rem;border-left:8px solid var(--a);padding-left:.75rem}",
      "main section{padding:3rem 0}.numbers .v{font-size:2.4rem}",
    ].join(""),
    header: (h) => `<header class="hd"><div class="wrap"><div class="top">${h.logo}<div><h1>${h.name}</h1>${h.motto}</div></div>${h.nav}${h.langs}</div></header>`,
  };
}

function templateFor(template: SiteTemplate, dark: boolean): Template {
  switch (template) {
    case "CLASSIC":
      return classic();
    case "MODERN":
      return modern();
    case "WARM":
      return warm(dark);
    case "MINIMAL":
      return minimal();
    case "HERITAGE":
      return heritage(dark);
    case "BOLD":
      return bold();
  }
}

/** The header the office chose over the template's own: the logo on the left, centred, or the name as the wordmark. */
function headerByStyle(style: SiteConfig["headerStyle"], template: Template): { css: string; header: (h: HeaderParts) => string } {
  switch (style) {
    case "TEMPLATE":
      return { css: "", header: template.header };
    case "LOGO_LEFT":
      return {
        css: "header.hd .row{display:flex;flex-wrap:wrap;align-items:center;gap:1rem;justify-content:space-between;text-align:left}header.hd .row .id{display:flex;align-items:center;gap:1rem}header.hd .row .logo{margin:0}header.hd .nav,header.hd .langs{justify-content:flex-start}",
        header: (h) => `<header class="hd"><div class="wrap row"><div class="id">${h.logo}<div><h1>${h.name}</h1>${h.motto}</div></div><div>${h.nav}${h.langs}</div></div></header>`,
      };
    case "LOGO_CENTRED":
      return {
        css: "header.hd .centred{text-align:center}header.hd .centred .logo{margin:0 auto .75rem}header.hd .centred .nav,header.hd .centred .langs{justify-content:center}",
        header: (h) => `<header class="hd"><div class="wrap centred">${h.logo}<h1>${h.name}</h1>${h.motto}${h.nav}${h.langs}</div></header>`,
      };
    case "WORDMARK":
      return {
        css: "header.hd .mark{display:flex;align-items:center;gap:.75rem}header.hd .mark .logo{width:44px;height:44px;margin:0}header.hd .mark h1{font-size:clamp(1.8rem,5vw,2.8rem);letter-spacing:-.01em}",
        header: (h) => `<header class="hd"><div class="wrap"><div class="mark">${h.logo}<h1>${h.name}</h1></div>${h.motto}${h.nav}${h.langs}</div></header>`,
      };
  }
}

/* ------------------------------------------------------------------------------------------------ */
/* What a page may show                                                                            */
/* ------------------------------------------------------------------------------------------------ */

type Ctx = { config: SiteConfig; data: SiteData; locale: SiteLanguage; t: Translate; opts: SiteRenderOptions; shownPages: Set<string> };

function fileSrc(fileId: string, width: 320 | 640 | 1280, opts: SiteRenderOptions): string {
  return `/api/files/${encodeURIComponent(fileId)}?w=${width}${opts.fileQuery ? `&amp;${opts.fileQuery}` : ""}`;
}
function fileHref(fileId: string, opts: SiteRenderOptions): string {
  return `/api/files/${encodeURIComponent(fileId)}${opts.fileQuery ? `?${opts.fileQuery}` : ""}`;
}
function img(p: { fileId: string; alt: string }, width: 320 | 640 | 1280, opts: SiteRenderOptions, eager = false): string {
  return `<img src="${fileSrc(p.fileId, width, opts)}" alt="${esc(p.alt)}"${eager ? "" : ' loading="lazy"'}>`;
}

/* ------------------------------------------------------------------------------------------------ */
/* The sections                                                                                    */
/* ------------------------------------------------------------------------------------------------ */

const link = (path: string) => `${SITE_BASE_MARK}/${path}`;

function sectionTexts(config: SiteConfig, code: SiteSection | "ABOUT"): { title: string; lead: string } {
  if (code === "ABOUT") return { title: "", lead: "" };
  const own = config.sectionTexts.find((s) => s.code === code);
  return { title: own?.title.trim() ?? "", lead: own?.lead.trim() ?? "" };
}

function sectionShell(code: SiteSection | "ABOUT", ctx: Ctx, inner: string, more?: { page: SitePage; key: TranslationKey } | null): string {
  const id = SITE_SECTION_ANCHOR[code];
  const own = sectionTexts(ctx.config, code);
  const title = own.title || ctx.t(SECTION_TITLE[code]);
  const lead = own.lead ? `<p class="lede">${esc(own.lead)}</p>` : "";
  const moreLink = more && ctx.shownPages.has(more.page) ? `<p class="more"><a href="${link(SITE_PAGE_PATH[more.page])}">${esc(ctx.t(more.key))}</a></p>` : "";
  return `<section id="${id}" aria-labelledby="h-${id}"><div class="wrap"><h2 id="h-${id}">${esc(title)}</h2>${lead}${inner}${moreLink}</div></section>`;
}

/** A page's own section: the page's title and lead as its heading. */
function pageShell(id: string, title: string, lead: string, inner: string): string {
  return `<section id="${id}" aria-labelledby="h-${id}"><div class="wrap"><h2 id="h-${id}">${esc(title)}</h2>${lead ? `<p class="lede">${esc(lead)}</p>` : ""}${inner}</div></section>`;
}

function aboutInner({ config, data, t }: Ctx): string {
  const words = paragraphs(config.about);
  const principal =
    config.principalMessage.trim().length > 0
      ? `<div class="principal"><h3>${esc(t("site.principalTitle"))}</h3><blockquote>${paragraphs(config.principalMessage, 2000)}${config.principalNamed && data.principalName ? `<cite>${esc(data.principalName)}</cite>` : ""}</blockquote></div>`
      : "";
  return `${words}${principal}`;
}

function about(ctx: Ctx): string {
  return sectionShell("ABOUT", ctx, aboutInner(ctx), ctx.shownPages.has("ABOUT") ? { page: "ABOUT", key: "siteWeb.moreAbout" } : null);
}

function numbersInner({ config, data, locale, t }: Ctx): string {
  const shown = data.numbers.filter((n) => config.metrics.includes(n.metric));
  const items = shown.map((n) => `<li><span class="v">${formatNumber(n, locale, t)}</span><span class="l">${esc(t(METRIC_LABEL[n.metric]))}</span></li>`).join("");
  return `<ul class="numbers">${items}</ul><p class="asof">${esc(t("site.numbersAsOf", { date: dayText(data.numbersDateKey, locale) }))}</p>`;
}

function facultyInner({ data, t, opts }: Ctx): string {
  // website-three (17 Oct 2026): the member's own photo above the name when they set one (its words are their name).
  const items = data.faculty.map((f) => `<li>${f.photo ? img(f.photo, 320, opts) : ""}${esc(f.name)}<span>${esc([f.designation, f.department].filter(Boolean).join(", "))}</span></li>`).join("");
  const all = data.facultyPublished ? `<p><a href="${esc(`${data.appUrl}/public/faculty/${data.slug}`)}">${esc(t("site.facultyAll"))}</a></p>` : "";
  return `<ul class="people">${items}</ul>${all}`;
}

function disclosureInner({ data, t }: Ctx): string {
  return `<p>${esc(t("site.disclosureBody"))}</p><p><a href="${esc(`${data.appUrl}/public/disclosure/${data.slug}`)}">${esc(t("site.disclosureLink"))}</a></p>`;
}

function enquiryForm({ config, locale, t }: Ctx): string {
  if (!config.enquiryForm) return "";
  const asks = new Set(config.enquiryFields);
  return [
    `<form class="enquiry" method="post" action="/enquiry">`,
    `<h3>${esc(t("site.enquiryTitle"))}</h3>`,
    `<input type="hidden" name="lang" value="${locale}">`,
    `<label>${esc(t("site.enquiryName"))}<input name="name" required maxlength="120" autocomplete="name"></label>`,
    `<label>${esc(t("site.enquiryContact"))}<input name="contact" required maxlength="200" autocomplete="tel"></label>`,
    asks.has("EMAIL") ? `<label>${esc(t("siteWeb.enquiryEmail"))}<input name="email" type="email" maxlength="200" autocomplete="email"></label>` : "",
    asks.has("GRADE") ? `<label>${esc(t("site.enquiryGrade"))}<input name="grade" maxlength="60"></label>` : "",
    `<label>${esc(t("site.enquiryMessage"))}<textarea name="message" required maxlength="2000" rows="4"></textarea></label>`,
    asks.has("VISIT") ? `<label class="tick"><input type="checkbox" name="visit" value="yes">${esc(t("siteWeb.enquiryVisit"))}</label>` : "",
    `<div class="hp" aria-hidden="true"><label>${esc(t("site.enquiryHoneypot"))}<input name="website" tabindex="-1" autocomplete="off"></label></div>`,
    `<p class="note">${esc(t("site.enquiryNote"))}</p>`,
    `<p class="note">${esc(t("siteWeb.enquiryRetention"))}</p>`,
    `<button type="submit">${esc(t("site.enquirySend"))}</button>`,
    `</form>`,
  ].join("");
}

function admissionsWords({ config, t }: Ctx): string {
  return config.admissionsText.trim() ? paragraphs(config.admissionsText, 2000) : `<p>${esc(t("site.admissionsDefault"))}</p>`;
}

function newsList({ data, locale, opts }: Ctx, max: number): string {
  const items = data.news
    .slice(0, max)
    .map((n) => {
      const pic = n.image ? img(n.image, 640, opts) : "";
      return `<li><article${pic ? ' class="pic"' : ""}>${pic}<div><h3>${esc(n.title)}</h3><time datetime="${esc(n.dateKey)}">${esc(dayText(n.dateKey, locale))}</time>${paragraphs(n.body, 1500)}</div></article></li>`;
    })
    .join("");
  return `<ul class="news">${items}</ul>`;
}

function pictureGrid(pictures: SiteImage[], opts: SiteRenderOptions): string {
  return `<ul class="gallery">${pictures.map((g) => `<li>${img(g, 640, opts)}</li>`).join("")}</ul>`;
}

function eventsList({ data, locale, t }: Ctx, max: number): string {
  const items = upcomingEvents(data)
    .slice(0, max)
    .map((e) => `<li><strong>${esc(e.title)}</strong><span class="when"><time datetime="${esc(e.startKey)}">${esc(rangeText(e.startKey, e.endKey, locale))}</time></span><span class="kind">${esc(t(EVENT_KIND[e.kind]))}</span></li>`)
    .join("");
  return `<ul class="events">${items}</ul>`;
}

function achievementsList({ config, data, locale, opts }: Ctx, max: number): string {
  const items = [...config.achievements]
    .sort((a, b) => b.dateKey.localeCompare(a.dateKey))
    .slice(0, max)
    .map((a) => `<li>${pictureShown(a.picture, data) ? img(a.picture, 640, opts) : ""}<div class="body"><h3>${esc(a.title)}</h3><span class="when"><time datetime="${esc(a.dateKey)}">${esc(dayText(a.dateKey, locale))}</time></span>${a.line.trim() ? `<p>${esc(a.line)}</p>` : ""}</div></li>`)
    .join("");
  return `<ul class="cards">${items}</ul>`;
}

function facilitiesList({ config, data, t, opts }: Ctx, max: number): string {
  const items = config.facilities
    .slice(0, max)
    .map((f) => {
      const name = f.code === "CUSTOM" ? f.label : t(SITE_FACILITY_NAME[f.code]);
      return `<li>${pictureShown(f.picture, data) ? img(f.picture, 640, opts) : ""}<div class="body"><h3>${esc(name)}</h3>${f.line.trim() ? `<p>${esc(f.line)}</p>` : ""}</div></li>`;
    })
    .join("");
  return `<ul class="cards">${items}</ul>`;
}

function contactInner(ctx: Ctx, withForm: boolean): string {
  const { config, t } = ctx;
  const rows: string[] = [];
  if (config.address.trim()) rows.push(`<dt>${esc(t("site.contactAddress"))}</dt><dd>${esc(config.address)}</dd>`);
  const phones = config.phones.map((p) => p.trim()).filter(Boolean);
  if (phones.length) rows.push(`<dt>${esc(t("site.contactPhone"))}</dt><dd>${phones.map((p) => `<a href="tel:${esc(p.replace(/[^\d+]/g, ""))}">${esc(p)}</a>`).join(", ")}</dd>`);
  if (config.email.trim()) rows.push(`<dt>${esc(t("site.contactEmail"))}</dt><dd><a href="mailto:${esc(config.email.trim())}">${esc(config.email.trim())}</a></dd>`);
  if (config.hours.trim()) rows.push(`<dt>${esc(t("site.contactHours"))}</dt><dd>${esc(config.hours)}</dd>`);
  const map = config.mapUrl.trim() ? `<p><a href="${esc(config.mapUrl.trim())}" rel="noopener">${esc(t("site.contactMap"))}</a></p>` : "";
  return `${rows.length ? `<dl class="contact">${rows.join("")}</dl>` : ""}${map}${withForm ? enquiryForm(ctx) : ""}`;
}

/** Home's sections: as they were on the one-page site, shorter where a page of their own carries the rest. */
const HOME_SECTION: Record<SiteSection, (c: Ctx) => string> = {
  NUMBERS: (c) => sectionShell("NUMBERS", c, numbersInner(c)),
  FACULTY: (c) => sectionShell("FACULTY", c, facultyInner(c), { page: "FACULTY", key: "siteWeb.seeAll" }),
  DISCLOSURE: (c) => sectionShell("DISCLOSURE", c, disclosureInner(c)),
  ADMISSIONS: (c) => sectionShell("ADMISSIONS", c, `${admissionsWords(c)}${c.shownPages.has("ADMISSIONS") ? "" : enquiryForm(c)}`, { page: "ADMISSIONS", key: "siteWeb.moreAdmissions" }),
  NEWS: (c) => sectionShell("NEWS", c, newsList(c, c.shownPages.has("NEWS") ? 3 : 12), { page: "NEWS", key: "siteWeb.allNews" }),
  GALLERY: (c) => sectionShell("GALLERY", c, pictureGrid(galleryAlbums(c.config, c.data).flatMap((a) => a.pictures).slice(0, c.shownPages.has("GALLERY") ? 8 : 24), c.opts), { page: "GALLERY", key: "siteWeb.allPictures" }),
  CONTACT: (c) => sectionShell("CONTACT", c, contactInner(c, false), { page: "CONTACT", key: "siteWeb.moreContact" }),
  EVENTS: (c) => sectionShell("EVENTS", c, eventsList(c, c.shownPages.has("EVENTS") ? 4 : 20), { page: "EVENTS", key: "siteWeb.allEvents" }),
  ACHIEVEMENTS: (c) => sectionShell("ACHIEVEMENTS", c, achievementsList(c, c.shownPages.has("ACHIEVEMENTS") ? 3 : 20), { page: "ACHIEVEMENTS", key: "siteWeb.seeAll" }),
  FACILITIES: (c) => sectionShell("FACILITIES", c, facilitiesList(c, c.shownPages.has("FACILITIES") ? 6 : 16), { page: "FACILITIES", key: "siteWeb.seeAll" }),
};

/**
 * The top of the home page: the motto in a band of the colour, over a picture banner, or alone and large. The header
 * leaves its own motto line out on the home page whenever this carries it, so it is said once.
 */
function hero(ctx: Ctx): string {
  const { config, data, opts } = ctx;
  const motto = config.motto.trim();
  if (config.heroStyle === "PICTURE" && pictureShown(config.heroPicture, data)) {
    return `<div class="hero pic">${img(config.heroPicture, 1280, opts, true)}${motto ? `<div class="cap"><div class="wrap"><p class="big">${esc(motto)}</p></div></div>` : ""}</div>`;
  }
  if (!motto) return "";
  if (config.heroStyle === "MOTTO") return `<div class="hero motto-only"><div class="wrap"><p class="big">${esc(motto)}</p></div></div>`;
  return `<div class="hero band"><div class="wrap"><p class="big">${esc(motto)}</p></div></div>`;
}

/* ------------------------------------------------------------------------------------------------ */
/* The pages                                                                                       */
/* ------------------------------------------------------------------------------------------------ */

function pageState(config: SiteConfig, code: SitePage) {
  return config.pages.find((p) => p.code === code) ?? { code, on: true, title: "", lead: "", seoTitle: "", seoDescription: "" };
}

function pageBody(code: SitePage, ctx: Ctx): string {
  const { config, data, t, locale } = ctx;
  const state = pageState(config, code);
  const title = state.title.trim() || t(SITE_PAGE_TITLE[code]);
  const id = SITE_PAGE_PATH[code] || "home";
  const shell = (inner: string) => pageShell(id, title, state.lead.trim(), inner);
  switch (code) {
    case "HOME":
      return [hero(ctx), about(ctx), ...sectionsShown(config, data).map((s) => HOME_SECTION[s](ctx))].join("");
    case "ABOUT": {
      const facts: string[] = [];
      if (config.foundedYear) facts.push(`<dt>${esc(t("siteWeb.factFounded"))}</dt><dd>${config.foundedYear}</dd>`);
      if (config.board.trim()) facts.push(`<dt>${esc(t("site.metricBoard"))}</dt><dd>${esc(config.board)}</dd>`);
      if (config.medium.trim()) facts.push(`<dt>${esc(t("siteWeb.factMedium"))}</dt><dd>${esc(config.medium)}</dd>`);
      return shell(`${facts.length ? `<dl class="facts">${facts.join("")}</dl>` : ""}${aboutInner(ctx)}`);
    }
    case "ACADEMICS": {
      const facts: string[] = [];
      if (config.board.trim()) facts.push(`<dt>${esc(t("site.metricBoard"))}</dt><dd>${esc(config.board)}</dd>`);
      if (config.medium.trim()) facts.push(`<dt>${esc(t("siteWeb.factMedium"))}</dt><dd>${esc(config.medium)}</dd>`);
      const a = data.academics ?? { classes: [], departments: [] };
      const classes = a.classes.length
        ? `<h3>${esc(t(data.college ? "siteWeb.academicsProgrammes" : "siteWeb.academicsClasses"))}</h3><ul class="classes">${a.classes.map((c) => `<li>${esc(c.name)}${config.academicsSubjects && c.subjects.length ? `<span>${esc(c.subjects.join(", "))}</span>` : ""}</li>`).join("")}</ul>`
        : "";
      const departments = a.departments.length
        ? `<h3>${esc(t("siteWeb.academicsDepartments"))}</h3><ul class="classes">${a.departments.map((d) => `<li>${esc(d.name)}${d.programmes.length ? `<span>${esc(d.programmes.map((p) => t("siteWeb.programmeLine", { name: p.name, level: p.level, years: p.years })).join("; "))}</span>` : ""}</li>`).join("")}</ul>`
        : "";
      return shell(`${facts.length ? `<dl class="facts">${facts.join("")}</dl>` : ""}${paragraphs(config.academicsText, 2000)}${departments}${classes}`);
    }
    case "ADMISSIONS": {
      const cycle = data.admissionsCycle;
      const dates = cycle
        ? `<div class="cycle"><h3>${esc(cycle.name)}</h3><dl class="facts">${cycle.opensKey ? `<dt>${esc(t("siteWeb.admissionsOpens"))}</dt><dd>${esc(dayText(cycle.opensKey, locale))}</dd>` : ""}${cycle.closesKey ? `<dt>${esc(t("siteWeb.admissionsCloses"))}</dt><dd>${esc(dayText(cycle.closesKey, locale))}</dd>` : ""}${cycle.grades.length ? `<dt>${esc(t("siteWeb.admissionsGrades"))}</dt><dd>${esc(cycle.grades.join(", "))}</dd>` : ""}</dl></div>`
        : "";
      const prospectus = downloadsShown(config, data).find((d) => d.kind === "PROSPECTUS");
      const pdf = prospectus ? `<p><a href="${fileHref(prospectus.fileId, ctx.opts)}">${esc(t("siteWeb.prospectusLink"))}</a>${prospectus.size ? ` <span class="note">PDF, ${sizeText(prospectus.size)}</span>` : ""}</p>` : "";
      return shell(`${admissionsWords(ctx)}${dates}${pdf}${enquiryForm(ctx)}`);
    }
    case "FACILITIES":
      return shell(facilitiesList(ctx, 16));
    case "FACULTY":
      return shell(facultyInner(ctx));
    case "GALLERY":
      return shell(galleryAlbums(config, data).map((a) => `<div class="album">${a.title ? `<h3>${esc(a.title)}</h3>` : ""}${pictureGrid(a.pictures, ctx.opts)}</div>`).join(""));
    case "NEWS":
      return shell(newsList(ctx, 12));
    case "EVENTS":
      return shell(eventsList(ctx, 40));
    case "ACHIEVEMENTS":
      return shell(`${achievementsList(ctx, 20)}<p class="note">${esc(t("siteWeb.achievementsNote"))}</p>`);
    case "DOWNLOADS": {
      const items = downloadsShown(config, data).map((d) => `<li><a href="${fileHref(d.fileId, ctx.opts)}">${esc(d.title.trim() || t(SITE_DOWNLOAD_NAME[d.kind]))}</a><span>${esc(t(SITE_DOWNLOAD_NAME[d.kind]))}${d.size ? ` · PDF, ${sizeText(d.size)}` : " · PDF"}</span></li>`);
      if (data.disclosurePublished) items.push(`<li><a href="${esc(`${data.appUrl}/public/disclosure/${data.slug}`)}">${esc(t("site.disclosureLink"))}</a></li>`);
      return shell(`<ul class="files">${items.join("")}</ul>`);
    }
    case "CONTACT":
      return shell(contactInner(ctx, true));
  }
}

/** The key a page is stored and counted under: "home", a built-in page's path, or a custom page's slug. */
export function pageKeyOfPath(path: string): string {
  return path || "home";
}

/* ------------------------------------------------------------------------------------------------ */
/* One page                                                                                        */
/* ------------------------------------------------------------------------------------------------ */

/**
 * One page of the site in one language. `page` is a built-in page's code or "custom:<id>"; a page the site does not
 * show renders the home page (the publisher renders only the pages `sitePagesShown` lists).
 */
export function renderSite(config: SiteConfig, data: SiteData, locale: SiteLanguage, page = "HOME", opts: SiteRenderOptions = {}): string {
  const t = translator(locale);
  const shown = sitePagesShown(config, data, t);
  const current = shown.find((p) => p.key === page) ?? shown[0]!;
  const ctx: Ctx = { config, data, locale, t, opts, shownPages: new Set(shown.map((p) => p.key)) };
  const template = templateFor(config.template, config.theme === "DARK");
  const head = headerByStyle(config.headerStyle, template);
  const { faces, body: bodyStack, heading: headingStack } = faceCss(config.font, config.headingFont, locale);

  const logo = data.logoFileId ? `<img class="logo" src="${fileSrc(data.logoFileId, 320, opts)}" alt="${esc(t("site.logoAlt", { school: data.schoolName }))}" width="72" height="72">` : "";
  const heroCarriesMotto = current.key === "HOME" && Boolean(config.motto.trim()) && (config.heroStyle !== "PICTURE" || pictureShown(config.heroPicture, data));
  const motto = config.motto.trim() && !heroCarriesMotto ? `<p class="motto">${esc(config.motto.trim())}</p>` : "";
  const navItems = shown.length > 1 ? shown.map((p) => `<li><a href="${link(p.path)}"${p.key === current.key ? ' aria-current="page"' : ""}>${esc(p.title)}</a></li>`).join("") : "";
  const nav = navItems ? `<nav aria-label="${esc(t("siteWeb.navLabel"))}"><ul class="nav">${navItems}</ul></nav>` : "";
  const langHref = (code: string) => `${link(current.path)}?lang=${code}`;
  const langs = config.offerOtherLanguages
    ? `<nav aria-label="${esc(t("site.languageLabel"))}"><ul class="langs">${LOCALES.map((l) =>
        l.code === locale ? `<li><a href="${langHref(l.code)}" lang="${l.code}" aria-current="page">${esc(l.native)}</a></li>` : `<li><a href="${langHref(l.code)}" lang="${l.code}" hreflang="${l.code}">${esc(l.native)}</a></li>`,
      ).join("")}</ul></nav>`
    : "";

  let body: string;
  let pageTitle: string;
  let description: string;
  if (current.key.startsWith("custom:")) {
    const custom = config.customPages.find((p) => `custom:${p.id}` === current.key)!;
    body = pageShell(`p-${custom.slug}`, custom.title, "", `<div class="rich">${custom.html}</div>`);
    pageTitle = `${custom.title} · ${data.schoolName}`;
    description = custom.seoDescription.trim() || (config.motto.trim() || config.about.trim());
  } else {
    const code = current.key as SitePage;
    const state = pageState(config, code);
    body = pageBody(code, ctx);
    const own = state.seoTitle.trim();
    pageTitle = own || (code === "HOME" ? (config.motto.trim() ? `${data.schoolName} · ${config.motto.trim()}` : data.schoolName) : `${current.title} · ${data.schoolName}`);
    description = state.seoDescription.trim() || state.lead.trim() || config.motto.trim() || config.about.trim();
  }
  description = description.replace(/\s+/g, " ").slice(0, 160);

  const ann = announcementShown(config, data.todayKey) ? `<div class="ann" role="note"><div class="wrap"><p>${esc(config.announcement.text.trim())}</p></div></div>` : "";
  const social = socialLinks(config, t);
  const disclosure = data.disclosurePublished ? `<li><a href="${esc(`${data.appUrl}/public/disclosure/${data.slug}`)}">${esc(t("siteWeb.mandatoryDisclosure"))}</a></li>` : "";
  const footer = [
    `<footer><div class="wrap">`,
    `<p>${esc(data.schoolName)}${config.address.trim() ? ` · ${esc(config.address.trim())}` : ""}</p>`,
    social || disclosure ? `<ul>${social}${disclosure}</ul>` : "",
    `<p><a href="${esc(data.appUrl)}">${esc(t("site.builtWith"))}</a></p>`,
    `</div></footer>`,
  ].join("");

  const ogPicture = config.heroStyle === "PICTURE" && pictureShown(config.heroPicture, data) ? config.heroPicture.fileId : data.logoFileId;
  const url = `${SITE_ORIGIN_MARK}${link(current.path)}`;
  const alternates = config.offerOtherLanguages ? LOCALES.map((l) => `<link rel="alternate" hreflang="${l.code}" href="${url}?lang=${l.code}">`).join("") : "";

  return [
    `<!doctype html><html lang="${locale}"><head><meta charset="utf-8">`,
    `<meta name="viewport" content="width=device-width, initial-scale=1">`,
    `<title>${esc(pageTitle)}</title>`,
    description ? `<meta name="description" content="${esc(description)}">` : "",
    `<meta name="generator" content="Shalaghar">`,
    `<link rel="canonical" href="${url}${locale === config.language ? "" : `?lang=${locale}`}">`,
    alternates,
    `<meta property="og:type" content="website"><meta property="og:title" content="${esc(pageTitle)}"><meta property="og:url" content="${url}">`,
    description ? `<meta property="og:description" content="${esc(description)}">` : "",
    ogPicture ? `<meta property="og:image" content="${SITE_ORIGIN_MARK}/api/files/${encodeURIComponent(ogPicture)}?w=1280">` : "",
    `<style>${faces}${baseCss(config, bodyStack, headingStack)}${template.css}${head.css}</style>`,
    `</head><body class="t-${config.template.toLowerCase()}${config.theme === "DARK" ? " dark" : ""}">`,
    `<a class="skip" href="#main">${esc(t("site.skip"))}</a>`,
    opts.draftNote ? `<div class="draft" role="note"><div class="wrap"><p>${esc(opts.draftNote)}</p></div></div>` : "",
    ann,
    head.header({ logo, name: esc(data.schoolName), motto, nav, langs }),
    `<main id="main">${body}</main>`,
    footer,
    `</body></html>`,
  ].join("");
}

function socialLinks(config: SiteConfig, t: Translate): string {
  const s = config.social;
  const items: string[] = [];
  if (s.facebook) items.push(`<li><a href="${esc(s.facebook)}" rel="noopener">${esc(t("siteWeb.socialFacebook"))}</a></li>`);
  if (s.instagram) items.push(`<li><a href="${esc(s.instagram)}" rel="noopener">${esc(t("siteWeb.socialInstagram"))}</a></li>`);
  if (s.youtube) items.push(`<li><a href="${esc(s.youtube)}" rel="noopener">${esc(t("siteWeb.socialYoutube"))}</a></li>`);
  if (s.whatsapp) items.push(`<li><a href="https://wa.me/${esc(s.whatsapp.replace(/\D/g, ""))}" rel="noopener">${esc(t("siteWeb.socialWhatsapp"))}</a></li>`);
  return items.join("");
}

/**
 * The stored page made ready for where it is read: `base` is the path the site's pages hang from ("" on the school's
 * own domain, "/sites/<slug>" for the office's view, the preview's and the review link's own), `origin` the scheme
 * and host search engines are told. Neither comes from the school's words.
 */
export function finishSiteHtml(html: string, where: { base: string; origin: string }): string {
  return html.split(SITE_ORIGIN_MARK).join(where.origin).split(SITE_BASE_MARK).join(where.base);
}

/** Every page path the site shows, for the publisher and the sitemap ("" is home). */
export function sitePagePaths(config: SiteConfig, data: SiteData): { key: string; path: string }[] {
  return sitePagesShown(config, data).map(({ key, path }) => ({ key, path }));
}

/** Whether a string names one of the built-in pages. */
export function isSitePage(code: string): code is SitePage {
  return (SITE_PAGES as readonly string[]).includes(code);
}

/**
 * A small page in the site's own colour and language: the enquiry's thank-you and refusals, and the "not
 * published" answer of the public route. Static like the site, no script.
 */
export function renderSiteNotice(input: { locale: SiteLanguage; colour?: string; title: string; body: string; back?: { href: string; label: string } | null }): string {
  const colour = input.colour ?? "#1d4ed8";
  const back = input.back ? `<p><a href="${esc(input.back.href)}">${esc(input.back.label)}</a></p>` : "";
  return [
    `<!doctype html><html lang="${input.locale}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">`,
    `<title>${esc(input.title)}</title><style>${baseCss({ colour, accent: colour, theme: "LIGHT" }, SYSTEM_STACK, SYSTEM_STACK)}main{padding:3rem 0}</style></head>`,
    `<body><main id="main"><div class="wrap"><h1>${esc(input.title)}</h1><p>${esc(input.body)}</p>${back}</div></main></body></html>`,
  ].join("");
}
