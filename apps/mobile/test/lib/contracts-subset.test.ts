import fs from "node:fs";
import os from "node:os";
import path from "node:path";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const subset = require("../../scripts/contracts-subset.cjs") as {
  CONTRACTS: string;
  INDEX: string;
  contractsSubset: () => { wanted: Set<string>; kept: string[]; dropped: string[]; index: string };
  exportsOf: (file: string) => Set<string>;
  indexShape: () => { starred: string[]; own: Set<string> };
  phoneImports: () => Set<string>;
};

/**
 * The contracts files a release leaves out (scripts/contracts-subset.cjs,
 * metro.config.js; item 15 of the owner's batch, 1 Nov 2026): where the
 * index re-exports a file the phone imports no value from, Metro is given an
 * empty module. A name a screen imports that the subset lost would be
 * undefined on a phone and nowhere in these tests, which import the whole
 * package; so this builds the release's index from the real modules and
 * asks it for every name the phone imports.
 */
describe("the contracts files the phone leaves out", () => {
  const { wanted, kept, dropped, index } = subset.contractsSubset();
  const rel = (file: string) => path.relative(subset.CONTRACTS, file).split(path.sep).join("/");

  it("reads the phone's imports, and they are many", () => {
    expect(wanted.size).toBeGreaterThan(300);
    // The api-client's own import, and the index's own declaration.
    expect(wanted.has("apiErrorSchema")).toBe(true);
    expect(subset.indexShape().own.has("apiErrorSchema")).toBe(true);
  });

  it("leaves out the web's own desks and keeps what the screens parse with", () => {
    for (const file of ["v1/quiz-jobs.ts", "v1/competition-crawl.ts", "v1/vidura-ops.ts", "v1/site-domains.ts"]) expect(dropped.map(rel)).toContain(file);
    for (const file of ["v1/fees.ts", "v1/staff.ts", "v1/family.ts", "v1/auth.ts"]) expect(kept.map(rel)).toContain(file);
    expect(dropped.length + kept.length).toBe(subset.indexShape().starred.length);
  });

  it("gives every name the phone imports a value, from the index or a file it keeps, as the real modules export them", () => {
    // The release's index: the index's own values, and each kept file's exports; a left-out file contributes nothing.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const whole = require("@edulink/contracts") as Record<string, unknown>;
    const own = subset.indexShape().own;
    const release = new Map<string, unknown>([...own].map((name) => [name, whole[name]]));
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    for (const file of kept) for (const [name, value] of Object.entries(require(file) as Record<string, unknown>)) if (!release.has(name)) release.set(name, value);
    const lost = [...wanted].filter((name) => release.get(name) === undefined);
    expect(lost).toEqual([]);
    for (const name of wanted) expect(release.get(name)).toBe(whole[name]);
    // And nothing the phone imports comes only from a file it leaves out.
    for (const file of dropped) expect([...subset.exportsOf(file)].filter((name) => wanted.has(name) && !release.has(name))).toEqual([]);
    expect(index).toBe(subset.INDEX);
  });

  it("counts a file's values and not its types", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "contracts-subset-"));
    const file = path.join(dir, "a.ts");
    fs.writeFileSync(path.join(dir, "b.ts"), "export const fromB = 1;\nexport type OnlyType = string;\n");
    fs.writeFileSync(file, 'export const one = 1;\nexport function two() {}\nexport enum Three { A }\nexport type Four = number;\nexport interface Five { a: 1 }\nconst six = 6;\nexport { six };\nexport type { Five as Seven };\nexport * from "./b";\n');
    try {
      expect([...subset.exportsOf(file)].sort()).toEqual(["Three", "fromB", "one", "six", "two"]);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});
