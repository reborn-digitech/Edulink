import type { SiteCheck, SiteConfig, SiteEnquiryRow, SiteEnquiryStatus } from "@edulink/contracts";
import type { SiteData } from "@/lib/site-content";

/**
 * What the website editor is handed by its page (website-two, 16 October 2026): the draft, the data it is drawn with
 * today, and everything the sections around it read. Dates travel as ISO strings and are said in the reader's
 * language and the school's zone by the editor (`when`).
 */

export type EditorPost = { id: string; title: string; createdAt: string; images: { fileId: string; alt: string }[] };
export type EditorFile = { fileId: string; kind: "IMAGE" | "PDF"; name: string; size: number; createdAt: string };
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
