/**
 * What the corpus fetcher writes and the ingest reads (docs/plans/assistant.md §3 and §5, Phase A).
 *
 *   storage/corpus/<board or university>/<grade or programme>/<subject>/<file>
 *   storage/corpus/<board or university>/<grade or programme>/<subject>/manifest.json
 *
 * ONE manifest.json PER FOLDER, one entry per file in it, keyed by the file's name. A file the site
 * would not give us still has an entry, with `fetched: false` and the reason, so a refused site is a
 * row somebody can read rather than an absence nobody notices. The folder layout and these fields are
 * the interface the parked quiz bank generator reuses (plan §6), so they change only on purpose.
 *
 * storage/ is out of git (apps/web/.gitignore). The corpus belongs in the storage bucket when it
 * leaves this machine (docs/runbooks/deploy.md), never in the repository.
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, renameSync, statSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

export const CORPUS_ROOT = resolve(process.env.CORPUS_DIR?.trim() || join("storage", "corpus"));

/**
 * "papers" (10 Oct 2026): past entrance, olympiad and board sample papers, a STYLE corpus for quiz levels 5 and 6 (scripts/corpus-papers.ts).
 * Vidura pass 4 (18 Oct 2026, scripts/corpus-college.ts): "wikipedia", the subset for the professional streams a college's
 * tutor reads (CC BY-SA 4.0, every passage carrying its attribution); "indiacode", "nptel" and "swayam", the sources the
 * plan named whose published terms do not allow this use, each written down as refused with its terms.
 */
export type SourceKey = "ncert" | "balbharati" | "nios" | "syllabi" | "glossaries" | "papers" | "wikipedia" | "indiacode" | "nptel" | "swayam";
export const SOURCES: SourceKey[] = ["ncert", "balbharati", "nios", "syllabi", "glossaries", "papers", "wikipedia", "indiacode", "nptel", "swayam"];

/** "encyclopedia" (Vidura pass 4): one Wikipedia article, as plain text. */
export type ContentKind = "textbook" | "exemplar" | "course" | "glossary" | "syllabus" | "encyclopedia" | "law-text" | PaperKind;

/** What a past paper is: a national or state entrance test's, an olympiad's (or its first stage's), a board's sample paper. */
export type PaperKind = "entrance-paper" | "olympiad-paper" | "board-sample-paper";
export const PAPER_KINDS: PaperKind[] = ["entrance-paper", "olympiad-paper", "board-sample-paper"];

/**
 * A past paper's own facts, on the manifest entry of every file the "papers" source fetches. The
 * entry's `board` is the publishing body as it names itself, `gradeOrProgramme` the test's class
 * band ("11-12", "9-10", "10"), `subject` the paper's subject ("Physics", or "Physics, Chemistry,
 * Mathematics" for a paper of several, whose questions the chunker tags by section).
 */
export type PaperMeta = {
  /** "NTA", "JEE (Advanced), the organising IIT", "HBCSE", "IAPT", "CBSE". */
  body: string;
  /** The test as the body names it: "JEE (Advanced)", "NEET (UG)", "INPhO", "NSEP", "CBSE Class X". */
  test: string;
  /** Which sitting or paper: "Paper 1", "Shift 1, 2 April", "Set E1", "Mathematics (Standard)"; null when there is one. */
  sitting: string | null;
  /** "paper" (the questions), "answer-key" (the key, model solutions or marking scheme), "paper+answers" (both in one file). */
  part: "paper" | "answer-key" | "paper+answers";
  /** The quiz level the paper is a style for: 5 (state and national entrance, board sample papers) or 6 (olympiads). */
  level: 5 | 6;
  /** The page the link was read from. */
  listedOn: string;
  /** The words of the link and the cell around it, as the page printed them. */
  linkText: string;
  /** The questions are pictures (JEE (Main) as NTA publishes it): the ingest reads the pictures by OCR. */
  textInPictures?: boolean;
  /** A scan set in two columns (NEET (UG) 2020): the ingest reads each half of a page on its own. */
  twoColumns?: boolean;
};

export type Licence = {
  /** The site's own words, when it publishes terms in a place a script can read; trimmed, never paraphrased. */
  text?: string;
  /** Where the site publishes its terms. */
  url: string;
  /** The licence by its short name when the site names one ("CC BY-SA 4.0"; Vidura pass 4). */
  name?: string;
};

/**
 * What every passage of a document carries in its citation (Vidura pass 4): a share-alike licence asks for the title,
 * the authors, the address and the licence. For a Wikipedia article: its title, the revision read, when that revision
 * was saved, its permanent address and the licence's name and address.
 */
export type Attribution = { kind: "WIKIPEDIA"; title: string; revision: number; revisedAt: string; url: string; licence: string; licenceUrl: string };

export type ManifestEntry = {
  file: string;
  title: string;
  /** "NCERT", "Balbharati (MSBTPCR)", "NIOS", "SPPU", "AICTE"… as the site names itself. */
  board: string;
  /** "8" for a class, a programme or faculty name for a syllabus. */
  gradeOrProgramme: string;
  subject: string;
  /** BCP-47-ish, short: "en"; "en+hi" for a bilingual glossary. */
  language: string;
  /** As the site states it; null when the site does not (the ingest may read it from the prelims). */
  edition: string | null;
  year: string | null;
  sourceUrl: string;
  licence: Licence;
  /** ISO time of the fetch that produced the bytes on disk (or of the refusal). */
  retrievedAt: string;
  sha256: string | null;
  bytes: number | null;
  fetched: boolean;
  /** Why not, when `fetched` is false: an HTTP status, a timeout, "rendered by script". */
  error?: string;
  source: SourceKey;
  kind: ContentKind;
  /** Source "papers" only: the body, the test, the sitting, the part and the level. */
  paper?: PaperMeta;
  /** Vidura pass 4: "COLLEGE" for a document only a college's tutor reads; absent for everyone (the books). */
  audience?: "COLLEGE";
  /** Vidura pass 4: the college streams (STREAMS) the document was chosen for. */
  streams?: string[];
  /** Vidura pass 4: what each of its passages carries in a citation. */
  attribution?: Attribution;
  /** Chapter number within a book, the site's book code, the HTTP Last-Modified, anything else the site said. */
  extra?: Record<string, string | number | null>;
};

export type FolderManifest = { files: Record<string, ManifestEntry> };

export function slug(s: string, max = 60): string {
  const out = s
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9ऀ-ॿ]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, max)
    .replace(/-+$/g, "");
  return out || "untitled";
}

export function readFolderManifest(dir: string): FolderManifest {
  const path = join(dir, "manifest.json");
  if (!existsSync(path)) return { files: {} };
  try {
    const parsed = JSON.parse(readFileSync(path, "utf8")) as FolderManifest;
    return parsed && typeof parsed === "object" && parsed.files ? parsed : { files: {} };
  } catch {
    return { files: {} };
  }
}

/** Written through a temporary file and a rename, so an interrupted run never leaves half a manifest. */
export function writeManifestEntry(dir: string, entry: ManifestEntry): void {
  mkdirSync(dir, { recursive: true });
  const manifest = readFolderManifest(dir);
  manifest.files[entry.file] = entry;
  const sorted: FolderManifest = { files: Object.fromEntries(Object.entries(manifest.files).sort(([a], [b]) => a.localeCompare(b))) };
  const tmp = join(dir, "manifest.json.tmp");
  writeFileSync(tmp, JSON.stringify(sorted, null, 2) + "\n");
  renameSync(tmp, join(dir, "manifest.json"));
}

/** Every manifest entry under the corpus root, with the folder it sits in; `sources` keeps only those sources' entries. */
export function walkManifests(root = CORPUS_ROOT, sources?: SourceKey[]): { dir: string; entry: ManifestEntry }[] {
  const out: { dir: string; entry: ManifestEntry }[] = [];
  if (!existsSync(root)) return out;
  const visit = (dir: string) => {
    for (const name of readdirSync(dir)) {
      const full = join(dir, name);
      if (name === "figures") continue;
      if (statSync(full).isDirectory()) visit(full);
      else if (name === "manifest.json") {
        for (const entry of Object.values(readFolderManifest(dir).files)) {
          if (!sources || sources.includes(entry.source)) out.push({ dir, entry });
        }
      }
    }
  };
  for (const name of readdirSync(root)) {
    const full = join(root, name);
    if (!statSync(full).isDirectory()) continue;
    visit(full);
  }
  return out;
}

/** Drops entries (by file name) from a folder's manifest: a refusal a later fetch made good another way. */
export function removeManifestEntries(dir: string, names: string[]): void {
  const manifest = readFolderManifest(dir);
  let changed = false;
  for (const n of names) if (manifest.files[n]) {
    delete manifest.files[n];
    changed = true;
  }
  if (!changed) return;
  const tmp = join(dir, "manifest.json.tmp");
  writeFileSync(tmp, JSON.stringify(manifest, null, 2) + "\n");
  renameSync(tmp, join(dir, "manifest.json"));
}
