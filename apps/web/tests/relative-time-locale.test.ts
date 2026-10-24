/**
 * QA-20 (QA campaign of 24 October 2026, UI-02): relative times stayed English
 * under Hindi and Marathi pages ("2 hours ago" on /notifications, /remarks, the
 * feed, the homes' due lines): `relativeTime()` defaulted to English and about
 * thirty callers passed no locale. The locale is now required; a server page
 * takes the request's bound copy (`getRelativeTime()`), a client component its
 * `useLocale()`.
 *
 * Two holds: the phrase in each language, and a scan of the source that every
 * call of the library's own `relativeTime` names a locale (a file that binds its
 * own `relativeTime` from getRelativeTime or useLocale is the reader's already).
 * `RELATIVE_TIME_SRC` points the scan at another tree (the reproduction ran it
 * against the tree before the fix).
 */
import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { relativeTime } from "@/lib/dates";

const NOW = new Date("2026-10-24T12:00:00Z");
const hoursAgo = (h: number) => new Date(NOW.getTime() - h * 3_600_000);

describe("relativeTime speaks the reader's language", () => {
  it("in English, Hindi and Marathi", () => {
    expect(relativeTime(hoursAgo(2), NOW, "en")).toBe("2 hours ago");
    expect(relativeTime(hoursAgo(2), NOW, "hi")).toBe("2 घंटे पहले");
    expect(relativeTime(hoursAgo(2), NOW, "mr")).toMatch(/^२|^2/);
    expect(relativeTime(hoursAgo(2), NOW, "mr")).not.toMatch(/[A-Za-z]/);
    expect(relativeTime(hoursAgo(24 * 7), NOW, "hi")).not.toMatch(/[A-Za-z]/);
  });
});

const ROOT = process.env.RELATIVE_TIME_SRC ?? join(__dirname, "..", "src");

function files(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) files(full, out);
    else if (/\.(ts|tsx)$/.test(name) && !/\.test\.tsx?$/.test(name)) out.push(full);
  }
  return out;
}

/** The arguments of each call `relativeTime(…)` in the text, counted at the call's own depth. */
function callArgCounts(text: string): number[] {
  const counts: number[] = [];
  const re = /(?<![\w.])relativeTime\(/g;
  for (let m = re.exec(text); m; m = re.exec(text)) {
    let depth = 1;
    let commas = 0;
    let i = m.index + m[0].length;
    for (; i < text.length && depth > 0; i++) {
      const c = text[i];
      if (c === "(" || c === "{" || c === "[") depth++;
      else if (c === ")" || c === "}" || c === "]") depth--;
      else if (c === "," && depth === 1) commas++;
    }
    counts.push(commas + 1);
  }
  return counts;
}

describe("every caller names the reader's locale (QA-20)", () => {
  it("no file calls the library's relativeTime without a locale", () => {
    const offenders: string[] = [];
    for (const file of files(ROOT)) {
      if (file.endsWith(join("lib", "dates.ts"))) continue;
      const text = readFileSync(file, "utf8");
      // Only the library's own function: imported by that name from the dates module.
      if (!/import\s*\{[^}]*(?<![\w.])relativeTime(?!\s+as)[\s,}][^}]*\}\s*from\s*["'](@\/lib\/dates|\.\/dates|\.\.\/dates)["']/.test(text)) continue;
      // A file that binds its own `relativeTime` (the request's or the reader's) calls that one.
      if (/const\s+relativeTime\s*=/.test(text)) continue;
      const short = callArgCounts(text).filter((n) => n < 3).length;
      if (short > 0) offenders.push(`${relative(ROOT, file)} (${short})`);
    }
    expect(offenders).toEqual([]);
  });
});
