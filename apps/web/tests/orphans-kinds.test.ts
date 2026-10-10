/**
 * The orphan sweep claims every kind of file the file route serves (integration, 11 Oct 2026).
 *
 * `authorizeFileRead` (src/lib/files.ts) decides who may read a stored file by finding the record that
 * names it; `reclaimOrphans` (src/lib/orphans.ts) deletes a stored file no record names. A kind served by
 * the first and not claimed by the second is a live file the sweep deletes — and by 11 October seven kinds
 * had drifted (admission documents, expert KYC, scholarship claims, studio work, offer letters, internship
 * files, IQAC files). This test reads the lookups out of authorizeFileRead's source (and the helpers it
 * calls with the file's id), names each `model.column`, and fails when that list and FILE_REFERENCES differ.
 */
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { FILE_REFERENCES } from "@/lib/orphans";

const LIB = join(process.cwd(), "src", "lib");

/** The text of `{ … }` starting at `open` (the index of a `{`), braces matched. */
function braced(src: string, open: number): string {
  let depth = 0;
  for (let i = open; i < src.length; i++) {
    if (src[i] === "{") depth++;
    else if (src[i] === "}" && --depth === 0) return src.slice(open, i + 1);
  }
  throw new Error("unbalanced braces");
}

/** A function's body by name, from any file under src/lib. */
function functionBody(name: string): string {
  for (const file of readdirSync(LIB).filter((f) => f.endsWith(".ts"))) {
    const src = readFileSync(join(LIB, file), "utf8");
    const at = src.search(new RegExp(`export async function ${name}\\(`));
    // The body opens at the brace that ends the signature's line (a return type may hold braces of its own).
    if (at >= 0) return braced(src, src.indexOf("{\n", at));
  }
  throw new Error(`no function ${name} under src/lib`);
}

/** `model.column` for every lookup by the file's id (`fileId`) or its JSON reference (`ref`) in a body of code. */
export function lookupsIn(body: string): string[] {
  const found = new Set<string>();
  for (const m of body.matchAll(/db\.(\w+)\.find(?:First|Unique)\(\{\s*where:\s*/g)) {
    const model = m[1]!;
    let where = braced(body, m.index! + m[0].length);
    // A relation's rows: `translations: { some: { imageKey: fileId } }` → model.translations.imageKey.
    for (const r of where.matchAll(/(\w+):\s*\{\s*some:\s*\{\s*(\w+):\s*fileId\b[^}]*\}\s*\}/g)) found.add(`${model}.${r[1]}.${r[2]}`);
    where = where.replace(/(\w+):\s*\{\s*some:\s*\{[^}]*\}\s*\}/g, "");
    for (const c of where.matchAll(/(\w+):\s*(?:fileId\b|\{\s*contains:\s*ref\s*\}|\{\s*has:\s*fileId\s*\})/g)) found.add(`${model}.${c[1]}`);
    if (/^\{\s*fileId\s*[,}]/.test(where)) found.add(`${model}.fileId`);
  }
  return [...found];
}

describe("the orphan sweep and the file route", () => {
  const files = readFileSync(join(LIB, "files.ts"), "utf8");
  const start = files.indexOf("export async function authorizeFileRead(");
  const route = braced(files, files.indexOf("{\n", start));
  // The helpers the route asks with the file's id or its JSON reference (applicationOwningFile, kycOwningFile).
  const helpers = [...route.matchAll(/await (\w+)\((?:fileId|ref)\)/g)].map((m) => m[1]!);
  const served = [...lookupsIn(route), ...helpers.flatMap((h) => lookupsIn(functionBody(h)))].sort();

  it("reads the route's lookups (the parser still sees them)", () => {
    expect(helpers.sort()).toEqual(["applicationOwningFile", "kycOwningFile"]);
    expect(served.length).toBeGreaterThanOrEqual(18);
    expect(served).toEqual(expect.arrayContaining(["school.logoPath", "post.media", "studioSubmission.fileId", "expertProfile.kycDocumentIds"]));
  });

  it("claims exactly the kinds the route serves", () => {
    expect([...FILE_REFERENCES].sort()).toEqual(served);
  });
});
