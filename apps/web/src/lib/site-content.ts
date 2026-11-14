import type { SiteCheck, SiteConfig, SitePage, SitePicture, SiteSection } from "@edulink/contracts";
import type { Translate, TranslationKey } from "./i18n/dictionary";
import type { SiteNumber } from "./site-metrics";

/**
 * WHAT A SCHOOL WEBSITE'S PAGES SHOW, AND WHETHER THEY HAVE ANYTHING TO (website-two, 16 October 2026).
 *
 * Pure and free of the dictionary, so the editor in the browser and the renderer on the server (site-render.ts) read
 * the same rules: which pages the menu lists, which home sections a page carries, which pictures may be shown (ticked
 * for consent, described, still the site's to show), which announcement is current. A page or a section with nothing
 * to show is left off the site and the editor says so.
 */

export type SiteImage = { fileId: string; alt: string };
/**
 * A news item. TA-225 (14 Nov 2026): `picture` is the post's first picture, the one its consent tick is about; `image`, what
 * the page draws, carries it only once ticked (newsPictureTicked), else null and the item shows its words alone.
 */
export type SiteNewsItem = { id: string; title: string; body: string; dateKey: string; image: SiteImage | null; picture?: SiteImage | null };
/** website-three (17 Oct 2026): `photo`, the member's own public photo (their consent ticked on their profile page), or none. */
export type SiteFacultyItem = { name: string; designation: string; department: string; photo?: SiteImage | null };
/** An entry of the school calendar: a holiday, an exam or a function. */
export type SiteEventItem = { title: string; startKey: string; endKey: string; kind: "HOLIDAY" | "EXAM" | "EVENT" };
/** What the Academics page lists: a school's classes with the subjects its timetable teaches, a college's departments. */
export type SiteAcademics = {
  classes: { name: string; subjects: string[] }[];
  departments: { name: string; programmes: { name: string; level: string; years: number }[] }[];
};
/** The admissions cycle open now, when the ADMISSIONS module is on. */
export type SiteAdmissionsCycle = { name: string; opensKey: string | null; closesKey: string | null; grades: string[] };

/** Everything the pages show that is not the draft: read by site-publish.ts `gatherSiteData`. */
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
  /* website-two (16 Oct 2026) */
  /** Today in the school's zone: the announcement's dates and the calendar's "upcoming" are measured from it. */
  todayKey?: string;
  college?: boolean;
  events?: SiteEventItem[];
  academics?: SiteAcademics;
  admissionsCycle?: SiteAdmissionsCycle | null;
  /**
   * The files a page may show: post pictures still on an approved school-wide post and files uploaded for the site
   * (SchoolSiteFile), with a PDF's size. A picture or a download whose file is not here is left off the page.
   */
  files?: Record<string, { size: number; kind: "IMAGE" | "PDF" }>;
};

/** A page's path on the site ("" is the home page). */
export const SITE_PAGE_PATH: Record<SitePage, string> = {
  HOME: "",
  ABOUT: "about",
  ACADEMICS: "academics",
  ADMISSIONS: "admissions",
  FACILITIES: "facilities",
  FACULTY: "faculty",
  GALLERY: "gallery",
  NEWS: "news",
  EVENTS: "events",
  ACHIEVEMENTS: "achievements",
  DOWNLOADS: "downloads",
  CONTACT: "contact",
};

/** Paths a custom page may not take: the built-in pages' and what a site's host answers itself. */
export const SITE_RESERVED_PATHS = new Set<string>([...Object.values(SITE_PAGE_PATH).filter(Boolean), "enquiry", "robots-txt", "sitemap-xml", "api", "fonts", "sites", "brand", "icons", "home", "index", "review", "p"]);

export const SITE_PAGE_TITLE: Record<SitePage, TranslationKey> = {
  HOME: "siteWeb.homeTitle",
  ABOUT: "site.aboutTitle",
  ACADEMICS: "siteWeb.academicsTitle",
  ADMISSIONS: "site.admissionsTitle",
  FACILITIES: "siteWeb.facilitiesTitle",
  FACULTY: "site.facultyTitle",
  GALLERY: "site.galleryTitle",
  NEWS: "site.newsTitle",
  EVENTS: "siteWeb.eventsTitle",
  ACHIEVEMENTS: "siteWeb.achievementsTitle",
  DOWNLOADS: "siteWeb.downloadsTitle",
  CONTACT: "site.contactTitle",
};

export const SITE_FACILITY_NAME: Record<Exclude<SiteConfig["facilities"][number]["code"], "CUSTOM">, TranslationKey> = {
  LIBRARY: "siteWeb.facilityLibrary",
  LABORATORIES: "siteWeb.facilityLaboratories",
  PLAYGROUND: "siteWeb.facilityPlayground",
  TRANSPORT: "siteWeb.facilityTransport",
  HOSTEL: "siteWeb.facilityHostel",
  CANTEEN: "siteWeb.facilityCanteen",
  COMPUTER_LAB: "siteWeb.facilityComputerLab",
  SMART_CLASSES: "siteWeb.facilitySmartClasses",
};

export const SITE_DOWNLOAD_NAME: Record<SiteConfig["downloads"][number]["kind"], TranslationKey> = {
  PROSPECTUS: "siteWeb.downloadProspectus",
  FEE_STRUCTURE: "siteWeb.downloadFeeStructure",
  DISCLOSURE: "siteWeb.downloadDisclosure",
  ACADEMIC_CALENDAR: "siteWeb.downloadCalendar",
  OTHER: "siteWeb.downloadOther",
};

/** A picture the page may show: ticked for consent, with words for a reader who cannot see it, and its file still the site's to show. */
export function pictureShown(picture: SitePicture | null | undefined, data: SiteData): picture is SitePicture {
  return Boolean(picture && picture.consent && picture.alt.trim() && (data.files ? Boolean(data.files[picture.fileId]) : true));
}

/** The announcement, while its dates hold (no dates: always; one date: from or until it). */
export function announcementShown(config: SiteConfig, today: string | undefined): boolean {
  const a = config.announcement;
  if (!a.text.trim()) return false;
  if (!today) return true;
  if (a.from && today < a.from) return false;
  if (a.to && today > a.to) return false;
  return true;
}

export function upcomingEvents(data: SiteData): SiteEventItem[] {
  const today = data.todayKey ?? "";
  return (data.events ?? []).filter((e) => !today || e.endKey >= today).sort((a, b) => a.startKey.localeCompare(b.startKey));
}

export function galleryAlbums(config: SiteConfig, data: SiteData): { title: string | null; pictures: SiteImage[] }[] {
  const albums: { title: string | null; pictures: SiteImage[] }[] = [];
  if (data.gallery.length) albums.push({ title: null, pictures: data.gallery });
  for (const album of config.albums) {
    const pictures = album.pictures.filter((p) => pictureShown(p, data)).map((p) => ({ fileId: p.fileId, alt: p.alt }));
    if (pictures.length) albums.push({ title: album.title, pictures });
  }
  return albums;
}

export function downloadsShown(config: SiteConfig, data: SiteData): { title: string; kind: SiteConfig["downloads"][number]["kind"]; fileId: string; size: number | null }[] {
  const known = (id: string) => (data.files ? data.files[id]?.kind === "PDF" : true);
  const out: { title: string; kind: SiteConfig["downloads"][number]["kind"]; fileId: string; size: number | null }[] = [];
  if (config.prospectusFileId && known(config.prospectusFileId)) out.push({ title: "", kind: "PROSPECTUS", fileId: config.prospectusFileId, size: data.files?.[config.prospectusFileId]?.size ?? null });
  for (const d of config.downloads) if (known(d.fileId) && d.fileId !== config.prospectusFileId) out.push({ title: d.title, kind: d.kind, fileId: d.fileId, size: data.files?.[d.fileId]?.size ?? null });
  return out;
}

export function contactHas(config: SiteConfig): boolean {
  return Boolean(config.address.trim() || config.phones.some((p) => p.trim()) || config.email.trim() || config.hours.trim() || config.mapUrl.trim());
}

/** Whether a home section that is switched on has anything to show: an empty one is left off the page (and said so in the editor). */
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
      return galleryAlbums(config, data).length > 0;
    case "CONTACT":
      return contactHas(config);
    case "EVENTS":
      return upcomingEvents(data).length > 0;
    case "ACHIEVEMENTS":
      return config.achievements.length > 0;
    case "FACILITIES":
      return config.facilities.length > 0;
  }
}

/** Whether a page has anything to show: one with nothing is left out of the menu and answers 404 (and is said so in the editor). */
export function pageHasContent(code: SitePage, config: SiteConfig, data: SiteData): boolean {
  switch (code) {
    case "HOME":
      return true;
    case "ABOUT":
      return Boolean(config.about.trim() || config.principalMessage.trim());
    case "ACADEMICS":
      return Boolean(config.academicsText.trim() || config.board.trim() || config.medium.trim() || data.academics?.classes.length || data.academics?.departments.length);
    case "ADMISSIONS":
      return Boolean(config.admissionsText.trim() || config.enquiryForm || data.admissionsCycle || config.prospectusFileId);
    case "FACILITIES":
      return config.facilities.length > 0;
    case "FACULTY":
      return data.faculty.length > 0;
    case "GALLERY":
      return galleryAlbums(config, data).length > 0;
    case "NEWS":
      return data.news.length > 0;
    case "EVENTS":
      return upcomingEvents(data).length > 0;
    case "ACHIEVEMENTS":
      return config.achievements.length > 0;
    case "DOWNLOADS":
      return downloadsShown(config, data).length > 0 || data.disclosurePublished;
    case "CONTACT":
      return contactHas(config) || config.enquiryForm;
  }
}

/** One page of the site as the menu lists it: its key (a built-in page's code or "custom:<id>"), its path and its name. */
export type SitePageLink = { key: string; path: string; title: string };

/**
 * THE MENU'S ONE ORDER (website-three, 17 Oct 2026): every page's key once — a built-in page's code, a custom page's
 * "custom:<id>" — in the admin's order (`menuOrder`), Home first; a key the order does not name (a draft saved before the
 * order was kept, a page added since) follows in the pages' own order, the custom pages after the built-in ones, and a key
 * naming no page any more is dropped.
 */
export function menuKeys(config: SiteConfig): string[] {
  const all = [...config.pages.map((p) => p.code as string), ...config.customPages.map((p) => `custom:${p.id}`)];
  const known = new Set(all);
  const seen = new Set<string>(["HOME"]);
  const out = ["HOME"];
  for (const key of [...(config.menuOrder ?? []), ...all]) {
    if (!known.has(key) || seen.has(key)) continue;
    seen.add(key);
    out.push(key);
  }
  return out;
}

/** A custom page has words to show (its rich text holds more than tags). */
export function customPageHasText(page: { html: string }): boolean {
  return Boolean(page.html.replace(/<[^>]*>/g, "").trim());
}

/** The pages the site shows, in the menu's one order (`menuKeys`): on and with something to show. */
export function sitePagesShown(config: SiteConfig, data: SiteData, t?: Translate): SitePageLink[] {
  const name = (code: SitePage, own: string) => own.trim() || (t ? t(SITE_PAGE_TITLE[code]) : code);
  const out: SitePageLink[] = [];
  for (const key of menuKeys(config)) {
    if (key.startsWith("custom:")) {
      const p = config.customPages.find((c) => `custom:${c.id}` === key);
      if (p && p.on && customPageHasText(p)) out.push({ key, path: p.slug, title: p.title });
      continue;
    }
    const p = config.pages.find((b) => b.code === key);
    if (p && (p.on || p.code === "HOME") && pageHasContent(p.code, config, data)) out.push({ key: p.code, path: SITE_PAGE_PATH[p.code], title: name(p.code, p.title) });
  }
  return out;
}

/** The home sections the page carries, in the admin's order: switched on and with something to show. */
export function sectionsShown(config: SiteConfig, data: SiteData): SiteSection[] {
  return config.sections.filter((s) => s.on && sectionHasContent(s.code, config, data)).map((s) => s.code);
}


/** Every picture the draft names besides the news' and the one-page gallery's: the hero, the facilities, the albums, the achievements. */
export function draftPictures(config: SiteConfig): { where: string; picture: SitePicture }[] {
  const out: { where: string; picture: SitePicture }[] = [];
  if (config.heroPicture) out.push({ where: "hero", picture: config.heroPicture });
  config.facilities.forEach((f, i) => f.picture && out.push({ where: `facility:${i}`, picture: f.picture }));
  for (const album of config.albums) album.pictures.forEach((p) => out.push({ where: `album:${album.id}`, picture: p }));
  for (const a of config.achievements) if (a.picture) out.push({ where: `achievement:${a.id}`, picture: a.picture });
  return out;
}

/** A file's use as the editor's Files panel and a refusal say it (website-three, 17 Oct 2026). */
export const SITE_FILE_USE_KEY: Record<"HERO" | "FACILITY" | "ALBUM" | "ACHIEVEMENT" | "PROSPECTUS" | "DOWNLOAD" | "LIVE", TranslationKey> = {
  HERO: "siteThree.useHERO",
  FACILITY: "siteThree.useFACILITY",
  ALBUM: "siteThree.useALBUM",
  ACHIEVEMENT: "siteThree.useACHIEVEMENT",
  PROSPECTUS: "siteThree.usePROSPECTUS",
  DOWNLOAD: "siteThree.useDOWNLOAD",
  LIVE: "siteThree.useLIVE",
};

/** One use of a file as a sentence says it: "a facility (Library)", a coded facility's name in the reader's language. */
export function fileUseText(t: Translate, u: { use: keyof typeof SITE_FILE_USE_KEY; label: string }): string {
  const coded = u.use === "FACILITY" && Object.prototype.hasOwnProperty.call(SITE_FACILITY_NAME, u.label);
  const label = coded ? t(SITE_FACILITY_NAME[u.label as keyof typeof SITE_FACILITY_NAME]) : u.label;
  return t(SITE_FILE_USE_KEY[u.use]) + (label ? ` (${label})` : "");
}

/**
 * WHERE A FILE UPLOADED FOR THE SITE IS USED IN A DRAFT (website-three, 17 Oct 2026), by file id: the hero, a facility (by
 * its name), an album (by its title), a proud moment (by its title), the prospectus, a download (by its title). The editor's
 * Files panel reads it from the draft it holds; the server's delete reads it from the saved draft and adds the live site.
 */
export function draftFileUses(config: SiteConfig, facilityName?: (code: Exclude<SiteConfig["facilities"][number]["code"], "CUSTOM">) => string): Map<string, { use: "HERO" | "FACILITY" | "ALBUM" | "ACHIEVEMENT" | "PROSPECTUS" | "DOWNLOAD"; label: string }[]> {
  const out = new Map<string, { use: "HERO" | "FACILITY" | "ALBUM" | "ACHIEVEMENT" | "PROSPECTUS" | "DOWNLOAD"; label: string }[]>();
  const add = (fileId: string, use: "HERO" | "FACILITY" | "ALBUM" | "ACHIEVEMENT" | "PROSPECTUS" | "DOWNLOAD", label: string) => out.set(fileId, [...(out.get(fileId) ?? []), { use, label }]);
  if (config.heroPicture && !config.heroPicture.postId) add(config.heroPicture.fileId, "HERO", "");
  for (const f of config.facilities) if (f.picture && !f.picture.postId) add(f.picture.fileId, "FACILITY", f.code === "CUSTOM" ? f.label : facilityName ? facilityName(f.code) : f.code);
  for (const a of config.albums) for (const p of a.pictures) if (!p.postId) add(p.fileId, "ALBUM", a.title);
  for (const a of config.achievements) if (a.picture && !a.picture.postId) add(a.picture.fileId, "ACHIEVEMENT", a.title);
  if (config.prospectusFileId) add(config.prospectusFileId, "PROSPECTUS", "");
  for (const d of config.downloads) add(d.fileId, "DOWNLOAD", d.title);
  return out;
}

/** TA-225 (14 Nov 2026): whether the draft ticks consent for this picture as the news post's own (decision 0002). */
export function newsPictureTicked(config: Pick<SiteConfig, "newsPictures">, postId: string, fileId: string): boolean {
  return (config.newsPictures ?? []).some((p) => p.postId === postId && p.fileId === fileId && p.consent);
}

/** "Ready to publish: 5 of 7": the logo, the about words, a hero picture, a way to be reached, how to apply, consent on every picture, a live domain. */
export function siteChecklist(config: SiteConfig, data: SiteData, domainLive: boolean): { code: SiteCheck; done: boolean }[] {
  const contact = Boolean(config.address.trim() || config.phones.some((p) => p.trim()) || config.email.trim());
  // TA-225: the news the draft names with a picture count too, each ticked or not for its own first picture.
  const news = data.news.flatMap((n) => (n.picture && config.newsPostIds.includes(n.id) ? [newsPictureTicked(config, n.id, n.picture.fileId)] : []));
  const pictures = [...config.gallery.map((g) => g.consent), ...draftPictures(config).map((p) => p.picture.consent), ...news];
  return [
    { code: "LOGO", done: Boolean(data.logoFileId) },
    { code: "ABOUT", done: Boolean(config.about.trim()) },
    { code: "HERO_PICTURE", done: config.heroStyle === "PICTURE" && pictureShown(config.heroPicture, data) },
    { code: "CONTACT", done: contact },
    { code: "ADMISSIONS", done: Boolean(config.admissionsText.trim()) },
    { code: "PICTURE_CONSENT", done: pictures.every(Boolean) },
    { code: "DOMAIN", done: domainLive },
  ];
}
