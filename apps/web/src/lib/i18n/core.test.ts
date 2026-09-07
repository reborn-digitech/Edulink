import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { translatorFor, type Dictionary } from "./core";
import { DICTIONARIES, dictionaryFor } from "./dictionary";
import { en } from "./en";

describe("one dictionary crosses to the browser", () => {
  it("English is the English file itself, untouched", () => {
    expect(dictionaryFor("en")).toBe(en);
  });

  it("Hindi carries Hindi where it has it and English underneath every gap", () => {
    const hi = dictionaryFor("hi");
    expect(hi.nav.practice).toBe(DICTIONARIES.hi.nav.practice);
    // Walk the whole tree: every leaf is a non-empty string, so the client
    // never needs a second dictionary to fall back to.
    const empties: string[] = [];
    const walk = (node: unknown, path: string) => {
      if (typeof node === "string") {
        if (node.length === 0) empties.push(path);
        return;
      }
      for (const [k, v] of Object.entries(node as Record<string, unknown>)) walk(v, path ? `${path}.${k}` : k);
    };
    walk(hi, "");
    expect(empties).toEqual([]);
    // Built once and reused: the layout calls this on every request.
    expect(dictionaryFor("hi")).toBe(hi);
  });

  it("a gap in Marathi reads as English, not as the key", () => {
    const mr = dictionaryFor("mr");
    const t = translatorFor(mr);
    // Whatever Marathi lacks, the folded dictionary answers in English.
    const gutted = { ...mr, nav: { ...mr.nav, practice: "" } } as Dictionary;
    expect(translatorFor(gutted)("nav.practice")).toBe("nav.practice");
    expect(t("nav.practice")).not.toBe("nav.practice");
  });

  it("no client module imports the dictionaries — the size fix depends on it", () => {
    const offenders: string[] = [];
    const walk = (dir: string) => {
      for (const name of readdirSync(dir)) {
        const p = join(dir, name);
        if (statSync(p).isDirectory()) walk(p);
        else if (/\.tsx?$/.test(name) && !name.endsWith(".test.ts")) {
          const src = readFileSync(p, "utf8");
          if (!/^\s*["']use client["']/.test(src)) continue;
          if (/from ["'](\.\/|@\/lib\/i18n\/)dictionary["']/.test(src) && !/import type/.test(src)) offenders.push(p);
        }
      }
    };
    walk("src");
    expect(offenders).toEqual([]);
  });
});
