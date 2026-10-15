import { LOCALES } from "./i18n/locales";
import type { SiteConfig, SiteLanguage, SiteSection, SiteTemplate } from "@edulink/contracts";
import { translator, type Translate, type TranslationKey } from "./i18n/dictionary";
import { fontByKey, fontFile, FONTS } from "./fonts";
import type { SiteNumber } from "./site-metrics";

/**
 * A SCHOOL'S WEBSITE AS ONE STATIC HTML PAGE (website-builder A, 15 October 2026).
 *
 * PURE: the draft and the data in, a string out — no database, no clock, no session — so the same function
 * renders the admin's preview, the published version and the tests' snapshots. Publish calls it once per
 * language (site-publish.ts); the public route serves the stored string as it is.
 *
 * WHAT THE PAGE IS. Semantic HTML with a skip link, one h1 (the school's name), an h2 per section in the
 * admin's order, h3 inside; alt text on every picture (the post's own, which the post's author had to give);
 * inline CSS only and NO JavaScript; no outside host at all (pictures from the platform's own file route,
 * faces from the bundled /fonts, else the system's); a language switch of plain links (?lang=) when the
 * admin turns it on; the footer "Built with Shalaghar". The enquiry form is a plain POST to
 * /sites/<slug>/enquiry, same host, so it works on a custom domain too (CSP form-action 'self').
 *
 * FOUR TEMPLATES, ONE CSS BASE. Classic, Modern, Warm and Minimal differ in the header's layout, the
 * sections' rhythm and how much of the colour they use; everything else — the type scale, spacing, the
 * numbers, the form — is the base, so no template can lose the skip link or the alt text.
 *
 * The school's own words (motto, about, the admissions text, a post) are printed as typed, in whatever
 * language the school wrote them; the page's own words (headings, labels, the footer) are the dictionary's,
 * in the page's language.
 */

export type SiteImage = { fileId: string; alt: string };
export type SiteNewsItem = { id: string; title: string; body: string; dateKey: string; image: SiteImage | null };
export type SiteFacultyItem = { name: string; designation: string; department: string };

/** Everything the page shows that is not the draft: read by site-publish.ts `gatherSiteData`. */
export type SiteData = {
  schoolName: string;
  slug: string;
  logoFileId: string | null;
  numbers: SiteNumber[];
  /** The day the numbers were counted, YYYY-MM-DD in the school's zone. */
  numbersDateKey: string;
  faculty: SiteFacultyItem[];
  /** The app's own address (NEXT_PUBLIC_APP_URL), for the disclosure, faculty and footer links that live there. */
  appUrl: string;
  disclosurePublished: boolean;
  facultyPublished: boolean;
  news: SiteNewsItem[];
  gallery: SiteImage[];
  principalName: string | null;
};

export const SITE_SECTION_ANCHOR: Record<SiteSection | "ABOUT", string> = {
  ABOUT: "about",
  NUMBERS: "numbers",
  FACULTY: "faculty",
  DISCLOSURE: "disclosure",
  ADMISSIONS: "admissions",
  NEWS: "news",
  GALLERY: "gallery",
  CONTACT: "contact",
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

/* ------------------------------------------------------------------------------------------------ */
/* Escaping: every string from the draft or the data passes through one of these two.                */
/* ------------------------------------------------------------------------------------------------ */

export function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
const esc = escapeHtml;

/** A file id as it may appear in a path: the store's own alphabet, nothing that could leave the attribute. */
function fileSrc(fileId: string, width: 320 | 640 | 1280): string {
  return `/api/files/${encodeURIComponent(fileId)}?w=${width}`;
}

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

function hexToRgb(hex: string): [number, number, number] {
  const n = Number.parseInt(hex.replace("#", ""), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** The colour mixed toward white by `amount` (0 the colour, 1 white). */
export function tint(hex: string, amount: number): string {
  const [r, g, b] = hexToRgb(hex);
  const mix = (c: number) => Math.round(c + (255 - c) * amount);
  return `#${[mix(r), mix(g), mix(b)].map((c) => c.toString(16).padStart(2, "0")).join("")}`;
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

/* ------------------------------------------------------------------------------------------------ */
/* The face                                                                                        */
/* ------------------------------------------------------------------------------------------------ */

const SYSTEM_STACK = 'system-ui, -apple-system, "Segoe UI", Roboto, "Noto Sans", "Noto Sans Devanagari", sans-serif';

/** The @font-face rules and the font-family for this page: the chosen bundled face, Mukta for Devanagari it lacks. */
function faceCss(fontKey: string, locale: SiteLanguage): { faces: string; stack: string } {
  const chosen = fontByKey(fontKey);
  const needsDevanagari = locale !== "en";
  const faces = [chosen, chosen && needsDevanagari && !chosen.scripts.includes("devanagari") ? FONTS.find((f) => f.key === "mukta")! : null].filter((f): f is NonNullable<typeof f> => Boolean(f));
  const rules = faces
    .flatMap((face) => face.weights.map((w) => `@font-face{font-family:"${face.family}";src:url("/${fontFile(face, w)}") format("truetype");font-weight:${w};font-display:swap}`))
    .join("");
  const stack = faces.length ? `${faces.map((f) => `"${f.family}"`).join(", ")}, ${SYSTEM_STACK}` : SYSTEM_STACK;
  return { faces: rules, stack };
}

/* ------------------------------------------------------------------------------------------------ */
/* The CSS base and the four templates                                                              */
/* ------------------------------------------------------------------------------------------------ */

function baseCss(colour: string, stack: string): string {
  return [
    `:root{--c:${colour};--c-soft:${tint(colour, 0.9)};--c-mid:${tint(colour, 0.75)};--ink:#1f2328;--muted:#57606a;--line:#d8dee4;--bg:#ffffff}`,
    "*{box-sizing:border-box}",
    `html{font-family:${stack};color:var(--ink);background:var(--bg);line-height:1.6;-webkit-text-size-adjust:100%}`,
    "body{margin:0}",
    "img{max-width:100%;height:auto;display:block}",
    "a{color:var(--c)}a:focus-visible,button:focus-visible,input:focus-visible,textarea:focus-visible{outline:3px solid var(--c);outline-offset:2px}",
    ".skip{position:absolute;left:-999px;top:0;background:#fff;color:var(--ink);padding:.5rem 1rem;z-index:10}.skip:focus{left:1rem}",
    ".wrap{max-width:68rem;margin:0 auto;padding:0 1rem}",
    "h1{font-size:clamp(1.6rem,4vw,2.4rem);line-height:1.2;margin:0}h2{font-size:1.5rem;line-height:1.25;margin:0 0 1rem}h3{font-size:1.1rem;margin:0 0 .25rem}",
    ".motto{margin:.25rem 0 0;font-size:1.05rem}",
    ".logo{width:72px;height:72px;object-fit:contain;background:#fff;border-radius:8px}",
    ".nav{display:flex;flex-wrap:wrap;gap:.25rem 1rem;margin:0;padding:0;list-style:none}.nav a{display:inline-block;padding:.5rem 0;min-height:44px;text-decoration:none}",
    ".langs{display:flex;gap:.75rem;margin:.5rem 0 0;padding:0;list-style:none;font-size:.95rem}.langs a{display:inline-block;padding:.5rem 0;min-height:44px}.langs [aria-current]{font-weight:700;text-decoration:none}",
    "section{padding:2.5rem 0}",
    ".numbers{display:grid;grid-template-columns:repeat(auto-fit,minmax(10rem,1fr));gap:1rem;margin:0;padding:0;list-style:none}",
    ".numbers li{border:1px solid var(--line);border-radius:10px;padding:1rem;background:#fff}.numbers .v{display:block;font-size:1.8rem;font-weight:700;color:var(--c);line-height:1.2}.numbers .l{display:block;color:var(--muted);font-size:.95rem}",
    ".asof{color:var(--muted);font-size:.9rem;margin:1rem 0 0}",
    ".people{display:grid;grid-template-columns:repeat(auto-fit,minmax(14rem,1fr));gap:1rem;margin:0;padding:0;list-style:none}.people li{border-left:4px solid var(--c);padding:.25rem .75rem}.people span{display:block;color:var(--muted);font-size:.95rem}",
    ".news{display:grid;gap:1.5rem;margin:0;padding:0;list-style:none}.news article{display:grid;gap:.75rem}@media(min-width:48rem){.news article.pic{grid-template-columns:16rem 1fr}}",
    ".news time{color:var(--muted);font-size:.9rem}.news img{border-radius:8px}",
    ".gallery{display:grid;grid-template-columns:repeat(auto-fill,minmax(12rem,1fr));gap:.75rem;margin:0;padding:0;list-style:none}.gallery img{border-radius:8px;aspect-ratio:4/3;object-fit:cover;width:100%}",
    "dl.contact{display:grid;grid-template-columns:max-content 1fr;gap:.5rem 1.5rem;margin:0}dl.contact dt{color:var(--muted)}dl.contact dd{margin:0}",
    "form.enquiry{display:grid;gap:.75rem;max-width:36rem;margin-top:1.5rem}form.enquiry label{display:grid;gap:.25rem;font-weight:600}",
    "form.enquiry input,form.enquiry textarea{font:inherit;padding:.6rem .75rem;border:1px solid #8c959f;border-radius:6px;min-height:44px;width:100%}",
    "form.enquiry button{font:inherit;font-weight:700;background:var(--c);color:#fff;border:0;border-radius:6px;padding:.7rem 1.25rem;min-height:44px;justify-self:start;cursor:pointer}",
    ".hp{position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden}",
    ".note{color:var(--muted);font-size:.9rem;margin:0}",
    ".principal blockquote{margin:0;padding:0 0 0 1rem;border-left:4px solid var(--c)}.principal cite{display:block;margin-top:.5rem;font-style:normal;font-weight:600}",
    "footer{padding:2rem 0;border-top:1px solid var(--line);color:var(--muted);font-size:.9rem}footer p{margin:.25rem 0}",
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

/** Modern: the logo and name on the left, the sections in a row on the right, white with a rule of the colour; sections as cards. */
function modern(): Template {
  return {
    css: [
      "header.hd{border-bottom:4px solid var(--c);padding:1rem 0}header.hd .bar{display:flex;flex-wrap:wrap;align-items:center;gap:1rem;justify-content:space-between}",
      "header.hd .id{display:flex;align-items:center;gap:1rem}header.hd h1{font-size:clamp(1.3rem,3vw,1.8rem)}",
      "main section .wrap{background:#fff}main section{padding:1.5rem 0}main section>.wrap{border:1px solid var(--line);border-radius:14px;padding:1.5rem}",
      "main{background:var(--c-soft);padding:1rem 0 2rem}",
      "h2{color:var(--c)}",
    ].join(""),
    header: (h) => `<header class="hd"><div class="wrap bar"><div class="id">${h.logo}<div><h1>${h.name}</h1>${h.motto}</div></div><div>${h.nav}${h.langs}</div></div></header>`,
  };
}

/** Warm: a soft tint of the colour behind a rounded header card, headings in the colour, a warm paper ground. */
function warm(): Template {
  return {
    css: [
      ":root{--bg:#fdf8f3}",
      "header.hd{padding:1.5rem 0 0}header.hd .card{background:var(--c-mid);border-radius:20px;padding:1.5rem;display:grid;gap:.75rem;justify-items:start}",
      "h2{color:var(--c);border-bottom:2px dotted var(--c-mid);padding-bottom:.25rem}",
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

const TEMPLATES: Record<SiteTemplate, () => Template> = { CLASSIC: classic, MODERN: modern, WARM: warm, MINIMAL: minimal };

/* ------------------------------------------------------------------------------------------------ */
/* The sections                                                                                    */
/* ------------------------------------------------------------------------------------------------ */

type Ctx = { config: SiteConfig; data: SiteData; locale: SiteLanguage; t: Translate };

function sectionShell(code: SiteSection | "ABOUT", t: Translate, inner: string): string {
  const id = SITE_SECTION_ANCHOR[code];
  return `<section id="${id}" aria-labelledby="h-${id}"><div class="wrap"><h2 id="h-${id}">${esc(t(SECTION_TITLE[code]))}</h2>${inner}</div></section>`;
}

/** Whether a section that is switched on has anything to show: an empty one is left off the page (and warned of in the preview). */
export function sectionHasContent(code: SiteSection, config: SiteConfig, data: SiteData): boolean {
  switch (code) {
    case "NUMBERS":
      return data.numbers.some((n) => config.metrics.includes(n.metric));
    case "FACULTY":
      return data.faculty.length > 0;
    case "DISCLOSURE":
      return data.disclosurePublished;
    case "ADMISSIONS":
      return true;
    case "NEWS":
      return data.news.length > 0;
    case "GALLERY":
      return data.gallery.length > 0;
    case "CONTACT":
      return Boolean(config.address.trim() || config.phones.length || config.email.trim() || config.hours.trim() || config.mapUrl.trim());
  }
}

function about({ config, data, t }: Ctx): string {
  const words = paragraphs(config.about);
  const principal =
    config.principalMessage.trim().length > 0
      ? `<div class="principal"><h3>${esc(t("site.principalTitle"))}</h3><blockquote>${paragraphs(config.principalMessage, 2000)}${config.principalNamed && data.principalName ? `<cite>${esc(data.principalName)}</cite>` : ""}</blockquote></div>`
      : "";
  return sectionShell("ABOUT", t, `${words}${principal}`);
}

function numbers({ config, data, locale, t }: Ctx): string {
  const shown = data.numbers.filter((n) => config.metrics.includes(n.metric));
  const items = shown.map((n) => `<li><span class="v">${formatNumber(n, locale, t)}</span><span class="l">${esc(t(METRIC_LABEL[n.metric]))}</span></li>`).join("");
  return sectionShell("NUMBERS", t, `<ul class="numbers">${items}</ul><p class="asof">${esc(t("site.numbersAsOf", { date: dayText(data.numbersDateKey, locale) }))}</p>`);
}

function faculty({ data, t }: Ctx): string {
  const items = data.faculty.map((f) => `<li>${esc(f.name)}<span>${esc([f.designation, f.department].filter(Boolean).join(", "))}</span></li>`).join("");
  const all = data.facultyPublished ? `<p><a href="${esc(`${data.appUrl}/public/faculty/${data.slug}`)}">${esc(t("site.facultyAll"))}</a></p>` : "";
  return sectionShell("FACULTY", t, `<ul class="people">${items}</ul>${all}`);
}

function disclosure({ data, t }: Ctx): string {
  return sectionShell("DISCLOSURE", t, `<p>${esc(t("site.disclosureBody"))}</p><p><a href="${esc(`${data.appUrl}/public/disclosure/${data.slug}`)}">${esc(t("site.disclosureLink"))}</a></p>`);
}

function admissions({ config, data, locale, t }: Ctx): string {
  const words = config.admissionsText.trim() ? paragraphs(config.admissionsText, 2000) : `<p>${esc(t("site.admissionsDefault"))}</p>`;
  const form = config.enquiryForm
    ? [
        `<form class="enquiry" method="post" action="/sites/${esc(data.slug)}/enquiry">`,
        `<h3>${esc(t("site.enquiryTitle"))}</h3>`,
        `<input type="hidden" name="lang" value="${locale}">`,
        `<label>${esc(t("site.enquiryName"))}<input name="name" required maxlength="120" autocomplete="name"></label>`,
        `<label>${esc(t("site.enquiryContact"))}<input name="contact" required maxlength="200" autocomplete="tel"></label>`,
        `<label>${esc(t("site.enquiryGrade"))}<input name="grade" maxlength="60"></label>`,
        `<label>${esc(t("site.enquiryMessage"))}<textarea name="message" required maxlength="2000" rows="4"></textarea></label>`,
        `<div class="hp" aria-hidden="true"><label>${esc(t("site.enquiryHoneypot"))}<input name="website" tabindex="-1" autocomplete="off"></label></div>`,
        `<p class="note">${esc(t("site.enquiryNote"))}</p>`,
        `<button type="submit">${esc(t("site.enquirySend"))}</button>`,
        `</form>`,
      ].join("")
    : "";
  return sectionShell("ADMISSIONS", t, `${words}${form}`);
}

function news({ data, locale, t }: Ctx): string {
  const items = data.news
    .map((n) => {
      const pic = n.image ? `<img src="${fileSrc(n.image.fileId, 640)}" alt="${esc(n.image.alt)}" loading="lazy">` : "";
      return `<li><article${pic ? ' class="pic"' : ""}>${pic}<div><h3>${esc(n.title)}</h3><time datetime="${esc(n.dateKey)}">${esc(dayText(n.dateKey, locale))}</time>${paragraphs(n.body, 1500)}</div></article></li>`;
    })
    .join("");
  return sectionShell("NEWS", t, `<ul class="news">${items}</ul>`);
}

function gallery({ data, t }: Ctx): string {
  const items = data.gallery.map((g) => `<li><img src="${fileSrc(g.fileId, 640)}" alt="${esc(g.alt)}" loading="lazy"></li>`).join("");
  return sectionShell("GALLERY", t, `<ul class="gallery">${items}</ul>`);
}

function contact({ config, t }: Ctx): string {
  const rows: string[] = [];
  if (config.address.trim()) rows.push(`<dt>${esc(t("site.contactAddress"))}</dt><dd>${esc(config.address)}</dd>`);
  if (config.phones.length) rows.push(`<dt>${esc(t("site.contactPhone"))}</dt><dd>${config.phones.map((p) => `<a href="tel:${esc(p.replace(/[^\d+]/g, ""))}">${esc(p)}</a>`).join(", ")}</dd>`);
  if (config.email.trim()) rows.push(`<dt>${esc(t("site.contactEmail"))}</dt><dd><a href="mailto:${esc(config.email.trim())}">${esc(config.email.trim())}</a></dd>`);
  if (config.hours.trim()) rows.push(`<dt>${esc(t("site.contactHours"))}</dt><dd>${esc(config.hours)}</dd>`);
  const map = config.mapUrl.trim() ? `<p><a href="${esc(config.mapUrl.trim())}" rel="noopener">${esc(t("site.contactMap"))}</a></p>` : "";
  return sectionShell("CONTACT", t, `<dl class="contact">${rows.join("")}</dl>${map}`);
}

const SECTION_RENDER: Record<SiteSection, (c: Ctx) => string> = { NUMBERS: numbers, FACULTY: faculty, DISCLOSURE: disclosure, ADMISSIONS: admissions, NEWS: news, GALLERY: gallery, CONTACT: contact };

/** The sections the page carries, in the admin's order: switched on and with something to show. */
export function sectionsShown(config: SiteConfig, data: SiteData): SiteSection[] {
  return config.sections.filter((s) => s.on && sectionHasContent(s.code, config, data)).map((s) => s.code);
}

/* ------------------------------------------------------------------------------------------------ */
/* The page                                                                                        */
/* ------------------------------------------------------------------------------------------------ */

export function renderSite(config: SiteConfig, data: SiteData, locale: SiteLanguage): string {
  const t = translator(locale);
  const ctx: Ctx = { config, data, locale, t };
  const shown = sectionsShown(config, data);
  const template = TEMPLATES[config.template]();
  const { faces, stack } = faceCss(config.font, locale);

  const logo = data.logoFileId ? `<img class="logo" src="${fileSrc(data.logoFileId, 320)}" alt="${esc(t("site.logoAlt", { school: data.schoolName }))}" width="72" height="72">` : "";
  const motto = config.motto.trim() ? `<p class="motto">${esc(config.motto.trim())}</p>` : "";
  const navItems = (["ABOUT", ...shown] as (SiteSection | "ABOUT")[]).map((code) => `<li><a href="#${SITE_SECTION_ANCHOR[code]}">${esc(t(SECTION_TITLE[code]))}</a></li>`).join("");
  const nav = `<nav aria-label="${esc(t("site.navLabel"))}"><ul class="nav">${navItems}</ul></nav>`;
  const langs = config.offerOtherLanguages
    ? `<nav aria-label="${esc(t("site.languageLabel"))}"><ul class="langs">${LOCALES.map((l) =>
        l.code === locale ? `<li><a href="?lang=${l.code}" lang="${l.code}" aria-current="page">${esc(l.native)}</a></li>` : `<li><a href="?lang=${l.code}" lang="${l.code}" hreflang="${l.code}">${esc(l.native)}</a></li>`,
      ).join("")}</ul></nav>`
    : "";

  const body = [about(ctx), ...shown.map((code) => SECTION_RENDER[code](ctx))].join("");
  const description = (config.motto.trim() || config.about.trim()).replace(/\s+/g, " ").slice(0, 160);
  const title = config.motto.trim() ? `${data.schoolName} · ${config.motto.trim()}` : data.schoolName;
  const footer = [
    `<footer><div class="wrap">`,
    `<p>${esc(data.schoolName)}${config.address.trim() ? ` · ${esc(config.address.trim())}` : ""}</p>`,
    `<p><a href="${esc(data.appUrl)}">${esc(t("site.builtWith"))}</a></p>`,
    `</div></footer>`,
  ].join("");

  return [
    `<!doctype html><html lang="${locale}"><head><meta charset="utf-8">`,
    `<meta name="viewport" content="width=device-width, initial-scale=1">`,
    `<title>${esc(title)}</title>`,
    description ? `<meta name="description" content="${esc(description)}">` : "",
    `<meta name="generator" content="Shalaghar">`,
    `<style>${faces}${baseCss(config.colour, stack)}${template.css}</style>`,
    `</head><body class="t-${config.template.toLowerCase()}">`,
    `<a class="skip" href="#main">${esc(t("site.skip"))}</a>`,
    template.header({ logo, name: esc(data.schoolName), motto, nav, langs }),
    `<main id="main">${body}</main>`,
    footer,
    `</body></html>`,
  ].join("");
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
    `<title>${esc(input.title)}</title><style>${baseCss(colour, SYSTEM_STACK)}main{padding:3rem 0}</style></head>`,
    `<body><main id="main"><div class="wrap"><h1>${esc(input.title)}</h1><p>${esc(input.body)}</p>${back}</div></main></body></html>`,
  ].join("");
}
