/**
 * CI, the migrations' add-only rule and the public repository, from the operations and disaster-recovery batch of
 * the testing analysis of 13 November 2026. The workflows are read as text (the step that matters is quoted); the
 * one shell function the workflow defines is run against a stand-in npm. Nothing is pushed or dispatched.
 *
 *   TA-446: the check that the jobs runner serves no page could never fail (it now exits 1, under TA-522).
 *   TA-460: a role whose token could not be minted dropped out of three suites with every job green.
 *   TA-461: the OTA workflow ran the phone battery without the heap the battery is known to need.
 *   TA-468: the local battery did not gate i18n, and CI's floor sat above the count.
 *   TA-514: CI's ESLint passed with warnings.
 *   TA-439: migrations that were not add-only went in after the rule, and nothing checked it.
 *   TA-445: a repository public since 12 November carried the shared test password of local accounts.
 */
import { describe, expect, it, vi } from "vitest";
import { createHash } from "node:crypto";
import { execFileSync, spawnSync } from "node:child_process";
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { ciI18nFloor } from "../scripts/i18n-floor";

const web = resolve(__dirname, "..");
const repo = resolve(web, "..", "..");
const read = (path: string) => readFileSync(resolve(repo, path), "utf8");
const battery = read(".github/workflows/battery.yml");

/** The run block of the step with this name, as the workflow file holds it. */
function stepRun(workflow: string, name: string): string {
  const at = workflow.indexOf(`- name: ${name}`);
  if (at < 0) throw new Error(`no step named ${name}`);
  const next = workflow.indexOf("\n      - ", at + 1);
  return workflow.slice(at, next < 0 ? undefined : next);
}

describe("TA-446: the jobs runner's no-page check can fail", () => {
  it("TA-446: a page answered on the host's routable address fails the step (exit 1), and loopback is not what is asked", () => {
    const step = stepRun(battery, "The jobs runner starts its schedule");
    expect(step).toMatch(/if curl -sf -o \/dev\/null --max-time 5 "http:\/\/\$addr:3999\/login"; then echo "[^"]*"; exit 1; fi/);
    expect(step).not.toMatch(/curl -sf -o \/dev\/null http:\/\/localhost:3999/);
  });
});

describe("TA-460: a role whose token cannot be minted fails CI", () => {
  const steps = ["Mobile contract tests · the app's client against the API", "Mobile accessibility gate, screenshots, offline and slow-network flows"];

  it("TA-460: no step exports a token through a substitution that hides its exit status", () => {
    expect(battery).not.toMatch(/export EDULINK_TOKEN_[A-Z_]+="\$\(/);
    for (const name of steps) expect(stepRun(battery, name)).toMatch(/^\s+mint\(\) \{ .+ \}$/m);
  });

  it("TA-460: the workflow's mint function stops the step when zz:token prints nothing or fails, and exports the token otherwise", () => {
    const mint = /^\s+(mint\(\) \{ .+ \})$/m.exec(stepRun(battery, steps[0]!))![1]!;
    const dir = mkdtempSync(join(tmpdir(), "zz-ta460-"));
    try {
      mkdirSync(join(dir, "bin"));
      const npm = (body: string) => {
        writeFileSync(join(dir, "bin", "npm"), `#!/usr/bin/env bash\n${body}\n`);
        chmodSync(join(dir, "bin", "npm"), 0o755);
      };
      const run = () => spawnSync("bash", ["-e", "-c", `${mint}\nmint WARDEN\necho "token=$EDULINK_TOKEN_WARDEN"`], { encoding: "utf8", env: { ...process.env, PATH: `${join(dir, "bin")}:${process.env.PATH ?? ""}` } });
      npm("exit 0");
      expect(run().status).not.toBe(0);
      npm("exit 1");
      expect(run().status).not.toBe(0);
      npm('echo "zz-token-123"');
      const ok = run();
      expect(ok.status).toBe(0);
      expect(ok.stdout).toMatch(/token=zz-token-123/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("TA-460: every role the steps minted before is still minted", () => {
    const contract = stepRun(battery, steps[0]!);
    const e2e = stepRun(battery, steps[1]!);
    const roles = ["TEACHER", "PARENT", "STUDENT", "ADMIN", "PRINCIPAL", "EXPERT", "DRIVER", "LIBRARIAN", "WARDEN", "ALUMNUS", "FACULTY", "HOD", "EXAM_CONTROLLER", "IQAC", "TPO", "ACCOUNTS", "RECRUITER"];
    for (const role of roles) {
      expect(contract).toMatch(new RegExp(`for role in [A-Z_ ]*\\b${role}\\b`));
      expect(e2e).toMatch(new RegExp(`for role in [A-Z_ ]*\\b${role}\\b`));
    }
    expect(e2e).toMatch(/for role in [A-Z_ ]*\bOPERATOR APPADMIN\b/);
  });

  it("TA-460: the axe walk's set-up stops under CI when an expected actor is missing, naming the role, and warns on a laptop", async () => {
    const { missingActor } = await import("../e2e/expected-actor");
    expect(() => missingActor("WARDEN", { CI: "true" })).toThrow(/WARDEN/);
    expect(() => missingActor("FACULTY", { CI: "1" })).toThrow(/FACULTY/);
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    try {
      expect(() => missingActor("WARDEN", {})).not.toThrow();
      expect(() => missingActor("WARDEN", { CI: "false" })).not.toThrow();
      expect(warn).toHaveBeenCalledTimes(2);
      expect(String(warn.mock.calls[0]![0])).toMatch(/WARDEN/);
    } finally {
      warn.mockRestore();
    }
  });

  it("TA-460: e2e/global-setup.ts adds no module or college actor only `if (member)`: a missing one goes to missingActor", () => {
    const setup = read("apps/web/e2e/global-setup.ts");
    const adds = setup.match(/^ *if \(member\) sessions\[(role|key)\] = .+\n *else missingActor\((role|key)\);$/gm) ?? [];
    // The four module roles' loop, the college's six staff roles' loop and the college office's three.
    expect(adds).toHaveLength(3);
    expect(setup.match(/^ *if \(member\) sessions\[/gm)).toHaveLength(3);
    // No ZZ Vidya at all is every college actor missing.
    expect(setup).toMatch(/^ {2}\} else missingActor\("ZZ Vidya College \(/m);
  });
});

describe("TA-461: the OTA workflow's battery has the heap the battery needs", () => {
  it("TA-461: NODE_OPTIONS gives the phone battery 4 GB, on a pinned runner image", () => {
    const ota = read(".github/workflows/ota.yml");
    expect(stepRun(ota, "The mobile battery")).toMatch(/NODE_OPTIONS: --max-old-space-size=4096/);
    expect(ota).toMatch(/runs-on: ubuntu-24\.04/);
    expect(ota).not.toMatch(/runs-on: ubuntu-latest/);
  });
});

describe("TA-468: one i18n floor, read by CI and the local battery", () => {
  it("TA-468: the audit's --ci-floor reads CI's floor from the workflow, and the floor's comment is current", () => {
    const floor = ciI18nFloor(battery);
    expect(floor).toBe(Number(/^\s*I18N_FLOOR: "(\d+)"$/m.exec(battery)![1]));
    expect(floor).toBeLessThanOrEqual(93);
    expect(ciI18nFloor("env:\n  OTHER: 1\n")).toBeNull();
    // The local battery's gate (npm run i18n -- --ci-floor) holds on this tree, with CI's number.
    const run = spawnSync(process.execPath, [join(web, "node_modules/tsx/dist/cli.mjs"), "scripts/i18n-audit.ts", "--ci-floor"], { cwd: web, encoding: "utf8" });
    expect(run.status, run.stderr).toBe(0);
    expect(run.stdout).toMatch(new RegExp(`i18n floor held: \\d+ ≤ ${floor} \\(CI's floor\\)`));
    const audit = readFileSync(join(web, "scripts/i18n-audit.ts"), "utf8");
    expect(audit).toMatch(/"--ci-floor"/);
    expect(audit).toMatch(/ciI18nFloor\(/);
    // The comments above the floor no longer speak of 160 to 167.
    expect(battery).not.toMatch(/# 167: "bank:stats"/);
  });
});

describe("TA-514: CI's ESLint fails on a warning", () => {
  it("TA-514: the web's ESLint step runs with --max-warnings 0", () => {
    expect(stepRun(battery, "ESLint")).toMatch(/run: npx eslint \. --max-warnings 0/);
  });
});

/**
 * TA-439: the add-only rule (docs/runbooks/deploy.md, "Migrations are add-only for one release"). A migration that
 * drops or renames a column or table, sets an existing column NOT NULL, or adds a NOT NULL column without a default
 * breaks the old machines of a rolling release and any rollback across it. Such a migration is listed here with its
 * reason, and the runbook's last safe rollback point names the newest of them.
 */
const NOT_ADD_ONLY: Record<string, string> = {
  "20260928010000_leaving_certificate_admission_number": "drops SchoolRecord.studentCode",
  "20260930120939_gig_author_school": "adds QuestionContribution.authorSchoolId NOT NULL with no default",
  "20261002100602_gig_company_collects": "drops and renames the gig payout columns",
  "20261011002832_quiz_publish_jobs": "renames QuizQuestion.discardedAt and discardReason",
  "20261031120000_library_eresource_name_key": "sets LibraryEResource.nameKey NOT NULL",
  "20261114161500_consent_per_guardian_and_wider_totals":
    "changes the payroll totals to BIGINT and keys StudentConsent to the guardianship (a replaced unique key): an older image reads a grant given to one guardian as every guardian's",
};

/** What in one migration's SQL is not add-only, as short labels; [] for an add-only migration. */
function notAddOnly(sql: string): string[] {
  const text = sql.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/--[^\n]*/g, " ");
  const found = new Set<string>();
  for (const raw of text.split(";")) {
    const statement = raw.replace(/\s+/g, " ").trim();
    if (!statement) continue;
    if (/^DROP TABLE\b/i.test(statement)) found.add("DROP TABLE");
    if (/^DROP TYPE\b/i.test(statement)) found.add("DROP TYPE");
    if (!/^ALTER TABLE\b/i.test(statement)) continue;
    // Prisma joins an ALTER TABLE's clauses with commas; a type's own commas sit inside parentheses.
    for (const clause of statement.split(/,(?![^(]*\))/)) {
      const c = clause.trim();
      if (/\bDROP COLUMN\b/i.test(c)) found.add("DROP COLUMN");
      if (/\bRENAME\b/i.test(c)) found.add("RENAME");
      if (/\bSET NOT NULL\b/i.test(c)) found.add("SET NOT NULL");
      // A changed column type (TA-555's migration): the older code reads and writes the column as it was.
      if (/\bSET DATA TYPE\b/i.test(c) || /\bALTER COLUMN\s+"?\w+"?\s+TYPE\b/i.test(c)) found.add("SET DATA TYPE");
      if (/\bADD COLUMN\b/i.test(c) && /\bNOT NULL\b/i.test(c) && !/\bDEFAULT\b/i.test(c)) found.add("ADD NOT NULL without DEFAULT");
    }
  }
  return [...found].sort();
}

describe("TA-439: the add-only rule is checked", () => {
  const dir = join(web, "prisma/migrations");
  const migrations = readdirSync(dir).filter((d) => statSync(join(dir, d)).isDirectory()).sort();

  it("TA-439: the check finds what it should in SQL", () => {
    expect(notAddOnly(`ALTER TABLE "A" ADD COLUMN "x" TEXT NOT NULL;`)).toEqual(["ADD NOT NULL without DEFAULT"]);
    expect(notAddOnly(`ALTER TABLE "A" ADD COLUMN "x" TEXT NOT NULL DEFAULT 'a', ADD COLUMN "y" DECIMAL(65,30);`)).toEqual([]);
    expect(notAddOnly(`ALTER TABLE "A" ADD COLUMN "y" TEXT,\nALTER COLUMN "z" DROP NOT NULL;`)).toEqual([]);
    expect(notAddOnly(`/* default value warning */ ALTER TABLE "A" ADD COLUMN "x" TEXT NOT NULL;`)).toEqual(["ADD NOT NULL without DEFAULT"]);
    expect(notAddOnly(`ALTER INDEX "a" RENAME TO "b"; DROP INDEX "c"; CREATE TABLE "T" ("id" TEXT NOT NULL);`)).toEqual([]);
    expect(notAddOnly(`ALTER TABLE "A" RENAME COLUMN "a" TO "b"; ALTER TABLE "B" ALTER COLUMN "c" SET NOT NULL; DROP TABLE "C";`)).toEqual(["DROP TABLE", "RENAME", "SET NOT NULL"]);
    expect(notAddOnly(`ALTER TABLE "A" ALTER COLUMN "x" SET DATA TYPE BIGINT,\nALTER COLUMN "y" SET DATA TYPE BIGINT;`)).toEqual(["SET DATA TYPE"]);
    expect(notAddOnly(`ALTER TABLE "A" ALTER COLUMN "x" TYPE BIGINT;`)).toEqual(["SET DATA TYPE"]);
  });

  it("TA-439: every migration that is not add-only is one listed with its reason, so a new one stops here", () => {
    const flagged = migrations.filter((m) => notAddOnly(readFileSync(join(dir, m, "migration.sql"), "utf8")).length > 0);
    expect(flagged).toEqual(Object.keys(NOT_ADD_ONLY).sort());
  });

  it("TA-439: the deploy runbook's last safe rollback point is the newest of them, and its check names SET NOT NULL", () => {
    const deploy = read("docs/runbooks/deploy.md");
    const newest = Object.keys(NOT_ADD_ONLY).sort().at(-1)!;
    expect(deploy).toMatch(new RegExp(`last\\s+safe\\s+rollback\\s+point\\s+is\\s+the\\s+commit\\s+that\\s+added\\s+\`${newest}\``));
    expect(deploy).toMatch(/`SET NOT NULL`/);
    expect(deploy).toMatch(/`SET DATA TYPE`/);
  });
});

describe("TA-445: no tracked file carries the shared password of the local accounts", () => {
  // Nothing derived from the password is written in this public repository: neither its hash nor its shape. The hash
  // (SHA-256, hex, one per line) is read from an untracked file under apps/web/storage, which .gitignore keeps out of
  // git; where the file is absent (CI, a fresh clone) the scan is skipped. The demo schools' password
  // (docs/demo-schools.md) is shared by design and is not listed there.
  const hashFile = join(web, "storage", "shared-password.sha256");
  const hashes = existsSync(hashFile)
    ? new Set(readFileSync(hashFile, "utf8").split(/\s+/).filter((h) => /^[0-9a-f]{64}$/.test(h)))
    : new Set<string>();

  it("TA-445: the batch's tests carry no SHA-256 of anything, so no hash of the password is in git", () => {
    for (const file of readdirSync(__dirname).filter((f) => /^ta-ops-ci-dr-.*\.test\.ts$/.test(f))) {
      expect(readFileSync(join(__dirname, file), "utf8"), file).not.toMatch(/[0-9a-f]{64}/);
    }
  });

  it.skipIf(hashes.size === 0)("TA-445: no word of a tracked text file hashes to the shared password (storage/shared-password.sha256)", () => {
    const files = execFileSync("git", ["ls-files", "-z"], { cwd: repo, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 })
      .split("\0")
      .filter((f) => f && /\.(md|ts|tsx|mts|mjs|cjs|js|json|ya?ml|sh|txt|toml|env\.example)$/.test(f) && !f.startsWith("apps/web/content/"));
    // Every distinct word of every file, split at spaces, quotes, brackets and the marks around a word in prose or
    // code, and each also without a closing full stop or mark; no shape is assumed.
    const words = new Map<string, string>();
    for (const file of files) {
      let text: string;
      try {
        if (statSync(join(repo, file)).size > 2_000_000) continue;
        text = readFileSync(join(repo, file), "utf8");
      } catch {
        continue;
      }
      for (const word of text.split(/[\s"'`()[\]{}<>,;:=|*]+/)) {
        if (!word) continue;
        if (!words.has(word)) words.set(word, file);
        const bare = word.replace(/[.!?]+$/, "");
        if (bare && !words.has(bare)) words.set(bare, file);
      }
    }
    const hits = new Set<string>();
    for (const [word, file] of words) if (hashes.has(createHash("sha256").update(word).digest("hex"))) hits.add(file);
    expect([...hits]).toEqual([]);
  }, 120_000);
});
