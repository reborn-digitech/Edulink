/**
 * A corpus document filed under the wrong class, filed under its own (owner-batch-item8, 31 October 2026).
 *
 *   npm run corpus:refile                 the review: each document in REFILE, where it is filed and where it goes
 *   npm run corpus:refile -- --apply      writes it (through the owner connection: with-admin-db.mjs wraps it)
 *
 * THE FAULT. Balbharati lists its Standard XII Physics as "११ वी भौतिकशास्त्र इंग्रजी" (11th), so the fetcher filed book
 * 1203020415 under class 11 (balbharati/11/physics/), beside the real class 11 book 1103020415. The book's id and its
 * title page say Standard XII; corpus-contents.ts chooseBooks has set it aside from class 11's plan since 30 October, and
 * class 12 had no physics at all.
 *
 * WHAT IT WRITES. ContentDocument.gradeOrProgramme (the class the plan, the tutor's retrieval and the bank read) and the
 * folder manifest's entry (storage/corpus/<folder>/manifest.json, which a re-ingest reads), each with extra.refiled
 * saying why. The path is the document's identity and stays (the PDF, its figures and every chunk's figure keys are
 * under it); nothing else the ingest stores derives from the class. corpus-fetch.ts files such a book under its id's
 * standard from now on. Idempotent; each applied run is recorded in storage/corpus/refile-<date>.json (-2, -3… after it).
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { PrismaClient } from "@prisma/client";
import { config } from "dotenv";
import { CORPUS_ROOT } from "./corpus-lib";
import { refuseUnlessLocalDatabase } from "./local-db-guard.mjs";

config();

/** The documents to file under another class: the path, the class, and why. */
export const REFILE: Readonly<Record<string, { grade: string; why: string }>> = {
  "balbharati/11/physics/1203020415.pdf": {
    grade: "12",
    why: "Standard XII Physics: its Balbharati book id (1203…) and its title page say Standard XII; the site lists it as \"११ वी भौतिकशास्त्र\"",
  },
};

const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

async function main() {
  const apply = process.argv.includes("--apply");
  const db = new PrismaClient({ datasourceUrl: process.env.DATABASE_URL });
  await refuseUnlessLocalDatabase(db, "corpus:refile");
  const decisions: { path: string; from: string | null; to: string; why: string; database: string; manifest: string }[] = [];
  try {
    for (const [path, { grade, why }] of Object.entries(REFILE)) {
      const doc = await db.contentDocument.findUnique({ where: { path }, select: { id: true, gradeOrProgramme: true, extra: true } });
      const manifestPath = join(CORPUS_ROOT, dirname(path), "manifest.json");
      const file = path.slice(dirname(path).length + 1);
      const manifest = existsSync(manifestPath) ? (JSON.parse(readFileSync(manifestPath, "utf8")) as { files: Record<string, { gradeOrProgramme: string; extra?: Record<string, unknown> }> }) : null;
      const entry = manifest?.files[file] ?? null;
      const refiled = { from: doc?.gradeOrProgramme ?? entry?.gradeOrProgramme ?? null, why, on: today(), via: "scripts/corpus-refile.ts" };
      const d = { path, from: doc?.gradeOrProgramme ?? null, to: grade, why, database: "", manifest: "" };
      if (!doc) d.database = "no such document in the database";
      else if (doc.gradeOrProgramme === grade) d.database = "already filed there";
      else if (apply) {
        const extra = { ...((doc.extra ?? {}) as Record<string, unknown>), refiled };
        await db.contentDocument.update({ where: { id: doc.id }, data: { gradeOrProgramme: grade, extra } });
        d.database = `class ${doc.gradeOrProgramme} → ${grade}`;
      } else d.database = `would be class ${doc.gradeOrProgramme} → ${grade}`;
      if (!manifest || !entry) d.manifest = `no entry for ${file} in ${manifestPath.slice(CORPUS_ROOT.length + 1)}`;
      else if (entry.gradeOrProgramme === grade) d.manifest = "already filed there";
      else if (apply) {
        const from = entry.gradeOrProgramme;
        manifest.files[file] = { ...entry, gradeOrProgramme: grade, extra: { ...(entry.extra ?? {}), refiled } };
        writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
        d.manifest = `class ${from} → ${grade}`;
      } else d.manifest = `would be class ${entry.gradeOrProgramme} → ${grade}`;
      decisions.push(d);
      console.log(`${path}: database ${d.database}; manifest ${d.manifest} (${why})`);
    }
  } finally {
    await db.$disconnect();
  }
  if (!apply) {
    console.log("Nothing written: --apply files them.");
    return;
  }
  mkdirSync(CORPUS_ROOT, { recursive: true });
  let out = join(CORPUS_ROOT, `refile-${today()}.json`);
  for (let i = 2; existsSync(out); i++) out = join(CORPUS_ROOT, `refile-${today()}-${i}.json`);
  writeFileSync(out, JSON.stringify({ at: new Date().toISOString(), decisions }, null, 2) + "\n");
  console.log(`Decisions: ${out}`);
}

if (process.argv[1] && /corpus-refile\.ts$/.test(process.argv[1])) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
