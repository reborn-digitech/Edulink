import type { SiteCheck, SiteConfig, SiteEnquiryRow, SiteEnquiryStatus, SiteFileUse } from "@edulink/contracts";
import type { SiteData } from "@/lib/site-content";

/**
 * What the website editor is handed by its page (website-two, 16 October 2026): the draft, the data it is drawn with
 * today, and everything the sections around it read. Dates travel as ISO strings and are said in the reader's
 * language and the school's zone by the editor (`when`).
 */

export type EditorPost = { id: string; title: string; createdAt: string; images: { fileId: string; alt: string }[] };
/** website-three (17 Oct 2026): `usedBy`, where the saved draft and the live site use it (the server's word at the page's load). */
export type EditorFile = { fileId: string; kind: "IMAGE" | "PDF"; name: string; size: number; createdAt: string; usedBy?: { use: SiteFileUse; label: string }[] };
export type EditorVersion = { id: string; renderedAt: string; live: boolean; byName: string | null; nightly: boolean };
export type EditorShare = { id: string; createdAt: string; expiresAt: string; byName: string | null };
export type EditorVisits = { days: { dateKey: string; count: number }[]; total: number; pages: { page: string; count: number }[] };

export type EditorProps = {
  config: SiteConfig;
  data: SiteData;
  school: { name: string; slug: string; logoFileId: string | null; college: boolean; timezone: string };
  published: boolean;
  publishedAt: string | null;
  publishedOnce: boolean;
  draftSavedAt: string | null;
  unpublishedChanges: boolean;
  address: string | null;
  localPath: string;
  domain: { name: string; status: string } | null;
  checklist: { code: SiteCheck; done: boolean }[];
  posts: EditorPost[];
  files: EditorFile[];
  versions: EditorVersion[];
  shares: EditorShare[];
  inbox: { enquiries: SiteEnquiryRow[]; counts: Record<SiteEnquiryStatus, number> };
  visits: EditorVisits;
  fonts: { key: string; family: string; devanagari: boolean }[];
  /** The logo's own colour made fit for white words, or null. */
  logoColour: string | null;
  principalName: string | null;
  canNamePrincipal: boolean;
  admissionsOn: boolean;
  metricValues: Partial<Record<string, string>>;
  section: string;
  /* website-three (17 Oct 2026) */
  /** The draft's save count at the page's load: every save sends it back, and a save after someone else's is refused. */
  draftVersion: number;
  /** Another person who saved the draft in the last five minutes, or null. */
  alsoEditing: string | null;
  /** The most files a site keeps. */
  filesMax: number;
};

/** A change to the draft: the editor's one setter, handed to every section. */
export type SetDraft = <K extends keyof SiteConfig>(key: K, value: SiteConfig[K]) => void;

/** What every section of the editor is handed. */
export type SectionProps = {
  draft: SiteConfig;
  setDraft: SetDraft;
  data: SiteData;
  files: EditorFile[];
  onFileAdded: (file: EditorFile) => void;
  posts: EditorPost[];
  problem: { field?: string; message: string } | null;
};
