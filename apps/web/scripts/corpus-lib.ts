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

export type SourceKey = "ncert" | "balbharati" | "nios" | "syllabi" | "glossaries";
export const SOURCES: SourceKey[] = ["ncert", "balbharati", "nios", "syllabi", "glossaries"];

export type ContentKind = "textbook" | "exemplar" | "course" | "glossary" | "syllabus";

export type Licence = {
  /** The site's own words, when it publishes terms in a place a script can read; trimmed, never paraphrased. */
  text?: string;
  /** Where the site publishes its terms. */
  url: string;
};

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
