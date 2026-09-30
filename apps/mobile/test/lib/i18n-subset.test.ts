import fs from "node:fs";
import path from "node:path";
import { en } from "@edulink/i18n/en";
import { hi } from "@edulink/i18n/hi";
import { mr } from "@edulink/i18n/mr";
import { MENU, MENU_GROUP_KEY, TABS } from "@/lib/nav";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const subset = require("../../scripts/i18n-subset.cjs") as {
  LOCALES: string[];
  SENT_BY_SERVER: { screen: string; properties: string[]; written: string[] }[];
  sentSites: () => Set<string>;
  flatten: (tree: unknown) => Map<string, string>;
  inflate: (shape: unknown, sentences: string[]) => unknown;
  readDictionary: (locale: string) => unknown;
  sentencesOf: (locale: string, keys: string[]) => string[];
  shapeOf: (keys: string[]) => unknown;
  subsetFiles: (used: Set<string>) => Record<string, string>;
  usedKeys: () => { used: Set<string>; all: Map<string, string>; prefixes: Set<string>; server: Set<string> };
};

/**
 * The phone's share of the dictionaries (scripts/i18n-subset.cjs): what a
 * release bundles in place of packages/i18n's whole languages. A key it
 * leaves out shows as the key itself on a phone, so this file holds the
 * script to what it says it does; test/setup.ts holds every screen's test to
 * it, and the section walk on the exported web target holds the screens.
 */
describe("the phone's share of the dictionaries", () => {
  const { used, all, prefixes } = subset.usedKeys();
  const keys = [...used].sort();
  const whole = { en, hi, mr } as Record<string, unknown>;

  it("reads a dictionary file as the app imports it", () => {
    for (const locale of subset.LOCALES) expect(subset.readDictionary(locale)).toEqual(whole[locale]);
  });

  it("is a share and not the whole, and holds only keys the dictionary has", () => {
    expect(used.size).toBeGreaterThan(1000);
    expect(used.size).toBeLessThan(all.size);
    for (const key of keys) expect(all.has(key)).toBe(true);
  });

  it("holds every key the phone's source writes out in a call to t", () => {
    const left: string[] = [];
    const walk = (dir: string) => {
      for (const name of fs.readdirSync(dir)) {
        const full = path.join(dir, name);
        if (fs.statSync(full).isDirectory()) walk(full);
        else if (/\.tsx?$/.test(name)) {
          for (const m of fs.readFileSync(full, "utf8").matchAll(/\bt\(\s*["']([\w.]+)["']/g)) if (all.has(m[1]) && !used.has(m[1])) left.push(m[1]);
        }
      }
    };
    walk(path.join(__dirname, "..", "..", "src"));
    expect(left).toEqual([]);
  });

  it("holds the bar's and the menu's labels for every role", () => {
    const labels: string[] = [...Object.values(TABS).flat(), ...Object.values(MENU).flat()].map((entry) => entry.labelKey).concat(Object.values(MENU_GROUP_KEY));
    expect(labels.length).toBeGreaterThan(20);
    expect(labels.filter((key) => !used.has(key))).toEqual([]);
  });

  it("takes everything under a prefix the source builds at run time", () => {
    expect(prefixes.has("role.")).toBe(true);
    const roles = [...all.keys()].filter((key) => key.startsWith("role."));
    expect(roles.length).toBeGreaterThan(5);
    expect(roles.filter((key) => !used.has(key))).toEqual([]);
  });

  it("names the server's files for every place a screen translates a key it was sent, and no place that is gone", () => {
    const listed = subset.SENT_BY_SERVER.flatMap((entry) => entry.properties.map((property) => `${entry.screen} ${property}`)).sort();
    // A screen that translates a sent key this list does not have fails here: name the server's files that write the key in scripts/i18n-subset.cjs.
    expect([...subset.sentSites()].sort()).toEqual(listed);
    for (const entry of subset.SENT_BY_SERVER) expect(entry.written.length).toBeGreaterThan(0);
  });

  it("takes what the server sends: a word of the log looked up in a table, a reason passed on from another function, a step of the checklist", () => {
    for (const key of ["audit.superuserSchoolCreate", "audit.yearClose", "refusal.alreadyLinkedToThisChild", "invites.alreadyInvited", "invites.duplicateOfLine", "intake.identityRefused", "checklist.invitesWaitingMany", "practice.badgeWeekHint", "root.jobDescGigsRemind"]) {
      expect(all.has(key)).toBe(true);
      expect(used.has(key)).toBe(true);
    }
  });

  it("leaves out what only the web's pages say", () => {
    for (const key of ["gigs.operatorNav", "gigs.queueNav"]) {
      expect(all.has(key)).toBe(true);
      expect(used.has(key)).toBe(false);
    }
  });

  it("writes the names once and each language as its sentences, and the tree filled from them is the language's own", () => {
    const shape = subset.shapeOf(keys);
    for (const locale of subset.LOCALES) {
      const built = subset.flatten(subset.inflate(shape, subset.sentencesOf(locale, keys)));
      const original = subset.flatten(whole[locale]);
      expect([...built.keys()].sort()).toEqual(keys);
      // A sentence the language lacks is the empty string, which the fold over English reads as a gap.
      for (const key of keys) expect(built.get(key)).toBe(original.get(key) ?? "");
    }
  });

  it("writes files that stand in for the three languages", () => {
    const files = subset.subsetFiles(used);
    expect(Object.keys(files).sort()).toEqual(["en.js", "hi.js", "mr.js", "shape.js"]);
    expect(files["shape.js"]).toContain("export const shape = {");
    expect(files["shape.js"]).toContain("export function inflate(shape, sentences)");
    for (const locale of subset.LOCALES) expect(files[`${locale}.js`]).toContain(`export const ${locale} = inflate(shape, [`);
    const bytes = (text: string) => Buffer.byteLength(text);
    const share = Object.values(files).reduce((sum, text) => sum + bytes(text), 0);
    const everything = subset.LOCALES.reduce((sum, locale) => sum + bytes(JSON.stringify(whole[locale])), 0);
    expect(share).toBeLessThan(everything * 0.6);
  });
});
