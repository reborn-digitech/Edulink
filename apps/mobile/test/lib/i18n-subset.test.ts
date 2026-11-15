import fs from "node:fs";
import path from "node:path";
import { DUTIES, STREAMS, STUDENT_CONSENT_GRANTS } from "@edulink/contracts";
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
  inflate: (tree: string, sentences: string[]) => unknown;
  readDictionary: (locale: string) => unknown;
  sentencesOf: (locale: string, keys: string[]) => string[];
  sentencesSource: (sentences: string[]) => string;
  treeOf: (keys: string[]) => { tree: string; order: string[] };
  subsetFiles: (used: Set<string>, boot?: Set<string>) => Record<string, string>;
  bootKeys: (used: Set<string>) => Set<string>;
  builtIn: (text: string) => [string, string][];
  fits: (key: string, built: [string, string]) => boolean;
  BOOT_SOURCES: string[];
  SEPARATORS: string[];
  usedKeys: () => { used: Set<string>; all: Map<string, string>; prefixes: Set<string>; around: Set<string>; server: Set<string> };
};

/**
 * The generated files run as Metro would bundle them: each `import { … } from "./x"`
 * read from the file of that name, each `export` handed out, so that what is
 * checked is the text a release carries and not only the functions that wrote it.
 */
function loader(files: Record<string, string>) {
  const done = new Map<string, Record<string, unknown>>();
  const load = (name: string): Record<string, unknown> => {
    const ready = done.get(name);
    if (ready) return ready;
    const exported: Record<string, unknown> = {};
    done.set(name, exported);
    const body = files[`${name}.js`]!
      .replace(/^import \{([^}]*)\} from "\.\/(\w+)";$/gm, (_m, names: string, from: string) => `const {${names}} = load("${from}");`)
      .replace(/^export const (\w+) = /gm, "const $1 = exported.$1 = ")
      .replace(/^export function (\w+)/gm, "exported.$1 = $1;\nfunction $1");
    new Function("load", "exported", body)(load, exported);
    return exported;
  };
  return load;
}

/**
 * The phone's share of the dictionaries (scripts/i18n-subset.cjs): what a
 * release bundles in place of packages/i18n's whole languages. A key it
 * leaves out shows as the key itself on a phone, so this file holds the
 * script to what it says it does; test/setup.ts holds every screen's test to
 * it, and the section walk on the exported web target holds the screens.
 */
const whole = { en, hi, mr } as Record<string, unknown>;

describe("the phone's share of the dictionaries", () => {
  const { used, all, prefixes } = subset.usedKeys();
  const keys = [...used].sort();

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

  it("takes only the keys a template closes after its hole, and everything under one it leaves open", () => {
    const pairs = (text: string) => subset.builtIn(text).map((pair) => pair.join("|")).sort();
    expect(pairs('t(`duties.${duty}.name`); t(`role.${r}`); t("staff.aq" + code); t(`e.${f(g)}.h`); t(`k.${f({ a })}.h`); t(`m.${a}.${b}`)')).toEqual(["duties.|.name", "e.|.h", "k.|", "m.|", "role.|", "staff.aq|"]);
    expect(subset.fits("duties.lab.name", ["duties.", ".name"])).toBe(true);
    expect(subset.fits("duties.clinical.contact.name", ["duties.", ".name"])).toBe(true);
    expect(subset.fits("duties.name", ["duties.", ".name"])).toBe(false);
    expect(subset.fits("duties.lab.colItem", ["duties.", ".name"])).toBe(false);
    expect(subset.fits("duties.lab.colItem", ["duties.", ""])).toBe(true);
    // Every code a screen can be sent or hold gives its key, from the coded lists themselves: each duty's name and what it
    // is (the duty desks), each stream's name (the screen header, practice), each grant's name and what it covers (consent).
    const { around } = subset.usedKeys();
    expect([...around].sort()).toEqual(["consent.grant.${…}.name", "consent.grant.${…}.what", "duties.${…}.name", "duties.${…}.what", "streams.${…}.name"]);
    const closed = [
      ...DUTIES.flatMap((code) => [`duties.${code}.name`, `duties.${code}.what`]),
      ...STREAMS.map((code) => `streams.${code}.name`),
      ...STUDENT_CONSENT_GRANTS.flatMap((grant) => [`consent.grant.${grant}.name`, `consent.grant.${grant}.what`]),
    ];
    expect(closed.length).toBe(DUTIES.length * 2 + STREAMS.length + STUDENT_CONSENT_GRANTS.length * 2);
    expect(closed.filter((key) => !all.has(key))).toEqual([]);
    expect(closed.filter((key) => !used.has(key))).toEqual([]);
    // What the web's pages say under the same three names stays out: refusals, column headings, a stream's long description.
    for (const key of ["duties.refuseUnknown", "duties.lab.colItem", "streams.ARTS.what", "streams.pickerLabel"]) {
      expect(all.has(key)).toBe(true);
      expect(used.has(key)).toBe(false);
    }
  });

  it("writes the names once and each language as its sentences, and the tree filled from them is the language's own", () => {
    const { tree, order } = subset.treeOf(keys);
    expect(order).toEqual(keys);
    for (const locale of subset.LOCALES) {
      const built = subset.flatten(subset.inflate(tree, subset.sentencesOf(locale, order)));
      const original = subset.flatten(whole[locale]);
      expect([...built.keys()].sort()).toEqual(keys);
      // A sentence the language lacks is the empty string, which the fold over English reads as a gap.
      for (const key of keys) expect(built.get(key)).toBe(original.get(key) ?? "");
    }
  });

  it("writes files that stand in for the three languages: English whole, Hindi and Marathi the first screens' share", () => {
    const files = subset.subsetFiles(used);
    expect(Object.keys(files).sort()).toEqual(["boot.js", "en.js", "hi.js", "mr.js", "shape.js"]);
    expect(files["shape.js"]).toContain('export const shape = "academics(');
    expect(files["shape.js"]).toContain("export function inflate(tree, sentences)");
    expect(files["boot.js"]).toContain('export const boot = "');
    expect(files["en.js"]).toMatch(/^export const en = inflate\(shape, ".*"\.split\("."\)\);$/m);
    for (const locale of ["hi", "mr"]) expect(files[`${locale}.js`]).toMatch(new RegExp(`^export const ${locale} = inflate\\(boot, ".*"\\.split\\("."\\)\\);$`, "m"));
    const bytes = (text: string) => Buffer.byteLength(text);
    const share = Object.values(files).reduce((sum, text) => sum + bytes(text), 0);
    const everything = subset.LOCALES.reduce((sum, locale) => sum + bytes(JSON.stringify(whole[locale])), 0);
    expect(share).toBeLessThan(everything * 0.2);
    // Hindi and Marathi bundled are a small share of English bundled: the rest is fetched (src/lib/i18n-words.ts).
    for (const locale of ["hi", "mr"]) expect(bytes(files[`${locale}.js`])).toBeLessThan(bytes(files["en.js"]) * 0.25);
  });

  it("runs as written: English is every key of the share, Hindi and Marathi the first screens', each in its own words", () => {
    const boot = subset.bootKeys(used);
    const load = loader(subset.subsetFiles(used, boot));
    for (const [locale, share] of [["en", used], ["hi", boot], ["mr", boot]] as const) {
      const bundled = subset.flatten(load(locale)[locale]);
      const original = subset.flatten(whole[locale]);
      expect([...bundled.keys()].sort()).toEqual([...share].sort());
      for (const key of share) expect(bundled.get(key)).toBe(original.get(key) ?? "");
    }
  });

  it("splits a language's sentences on a character none of them holds, and lists them when every one is taken", () => {
    const sentences = ["a|b", "c~d", "plain", ""];
    const source = subset.sentencesSource(sentences);
    expect(source).toBe('"a|b^c~d^plain^".split("^")');
    expect(new Function(`return ${source}`)()).toEqual(sentences);
    const crowded = [subset.SEPARATORS.join("")];
    expect(subset.sentencesSource(crowded)).toBe(JSON.stringify(crowded));
    expect(new Function(`return ${subset.sentencesSource(["only"])}`)()).toEqual(["only"]);
  });

  it("refuses a key whose name the names' string cannot hold", () => {
    expect(() => subset.treeOf(["a.b-c"])).toThrow(/not a word/);
    expect(() => subset.treeOf(["a.b", "a.b.c"])).toThrow(/also a key/);
    expect(() => subset.treeOf(["a.b.c", "a.b"])).toThrow(/also a name that holds keys/);
    expect(subset.treeOf(["a.b", "a.c.d", "a.c.e", "f"]).tree).toBe("a(b,c(d,e)),f");
  });
});

/**
 * Hindi and Marathi are fetched on first use (item 15, 1 Nov 2026) and a
 * release bundles only the first screens' keys of the two, so that a phone
 * set to Hindi signs in, and draws its bar and menu, in Hindi before it has
 * fetched anything.
 */
describe("the first screens' share of Hindi and Marathi", () => {
  const { used } = subset.usedKeys();
  const boot = subset.bootKeys(used);
  const keys = [...boot].sort();

  it("is a small share of the phone's keys, all of them keys the phone can ask for", () => {
    expect(boot.size).toBeGreaterThan(100);
    expect(boot.size).toBeLessThan(used.size / 4);
    expect(keys.filter((key) => !used.has(key))).toEqual([]);
  });

  it("holds every key the sign-in screens, the language row and the update screen write out, and the bar's and the menu's labels", () => {
    const root = path.join(__dirname, "..", "..");
    const files = ["src/app/(auth)/index.tsx", "src/app/(auth)/magic-link.tsx", "src/app/(auth)/first-signin.tsx", "src/components/language-row.tsx", "src/screens/shared/update-required.tsx", "src/screens/auth/two-factor-step.tsx"];
    const written = files.flatMap((file) => [...fs.readFileSync(path.join(root, file), "utf8").matchAll(/\bt\(\s*["']([\w.]+)["']/g)].map((m) => m[1]));
    expect(written.length).toBeGreaterThan(10);
    expect(written.filter((key) => used.has(key) && !boot.has(key))).toEqual([]);
    const labels: string[] = [...Object.values(TABS).flat(), ...Object.values(MENU).flat()].map((entry) => entry.labelKey).concat(Object.values(MENU_GROUP_KEY));
    expect(labels.filter((key) => !boot.has(key))).toEqual([]);
  });

  it("is each language's own sentences, filled from the first screens' names", () => {
    const { tree, order } = subset.treeOf(keys);
    for (const locale of ["hi", "mr"]) {
      const built = subset.flatten(subset.inflate(tree, subset.sentencesOf(locale, order)));
      const original = subset.flatten(whole[locale]);
      for (const key of keys) expect(built.get(key)).toBe(original.get(key) ?? "");
    }
  });

  it("takes everything under what a first screen writes before a hole, closed after it or not", () => {
    // A shared component's `streams.${code}.name` brings the college tiles' words, which other screens show, into this share, as it did before the closed reading.
    const screen = fs.readFileSync(path.join(__dirname, "..", "..", "src", "components", "screen.tsx"), "utf8");
    expect(subset.builtIn(screen).map((pair) => pair.join("|"))).toContain("streams.|.name");
    const streams = [...used].filter((key) => key.startsWith("streams."));
    expect(streams.length).toBeGreaterThan(20);
    expect(streams.filter((key) => !boot.has(key))).toEqual([]);
  });

  it("names places that are there", () => {
    const root = path.join(__dirname, "..", "..");
    for (const source of subset.BOOT_SOURCES) expect(fs.existsSync(path.join(root, source))).toBe(true);
  });
});
