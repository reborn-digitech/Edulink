/**
 * The backup, restore and snapshot scripts of the operations and disaster-recovery batch, from the testing analysis
 * of 13 November 2026. Every case runs the real script against stand-in pg_dump, pg_restore and createdb programs
 * in a temporary folder, or a scratch git repository with local bare remotes: no database, no real remote.
 *
 *   TA-418: two backups started in one second wrote one file, and two that overlapped both refused; ops/backup.sh now
 *           takes one backup at a time under a lock, and names each dump by the second and its process id.
 *   TA-438: the restore drill passed a dump of an empty or wrong database (only the table count could fail it), and
 *           pruning by age alone could then remove the last good copy.
 *   TA-442: ops/restore.sh created the scratch database on the local server and restored into TARGET_ADMIN_URL's.
 *   TA-441: the daily bank snapshot committed whatever else was staged under its [skip ci] message; since 23 November
 *           2026 it takes the folder's top-level batch files alone (runs/ and held/ left out), refuses a bank that fails
 *           quiz:verify, a checkout off master and a master that is not both remotes', and reports a failed push.
 *   TA-521: nothing noticed when the morning dumps stopped; db-backup-age.mjs now says how old the newest copies are.
 */
import { describe, expect, it } from "vitest";
import { execFileSync, spawn, spawnSync } from "node:child_process";
import { chmodSync, copyFileSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, renameSync, rmSync, symlinkSync, utimesSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { backupFileName, prunableDumps } from "../scripts/db-backup.mjs";
import { drillVerdict } from "../scripts/drill-verdict.mjs";
import { backupFreshness } from "../scripts/db-backup-age.mjs";

const web = resolve(__dirname, "..");
const repo = resolve(web, "..", "..");

/** A folder of stand-in programs, each a small shell script; returns the folder. */
function stubs(dir: string, programs: Record<string, string>): string {
  const bin = join(dir, "bin");
  mkdirSync(bin, { recursive: true });
  for (const [name, body] of Object.entries(programs)) {
    writeFileSync(join(bin, name), `#!/usr/bin/env bash\n${body}\n`);
    chmodSync(join(bin, name), 0o755);
  }
  return bin;
}

function scratch(prefix: string): string {
  return mkdtempSync(join(tmpdir(), prefix));
}

const hasZsh = spawnSync("zsh", ["-c", "true"]).status === 0;

describe("TA-418: one backup at a time, one file each", () => {
  it("TA-418: two names made in the same second by two processes differ", () => {
    const at = new Date("2026-11-14T02:00:00.123Z");
    expect(backupFileName(at, 101)).toBe("edulink-20261114T020000Z-101.dump");
    expect(backupFileName(at, 101)).not.toBe(backupFileName(at, 102));
  });

  it("TA-418: two overlapping runs of ops/backup.sh both succeed, one after the other, with two dumps", async () => {
    const dir = scratch("zz-ta418-");
    try {
      const bin = stubs(dir, {
        // Takes a second, as a dump does, and writes the file it was told to.
        pg_dump: 'for a in "$@"; do case "$a" in --file=*) f="${a#--file=}";; esac; done; sleep 1; echo "dump $$" > "$f"',
        pg_restore: "exit 0",
      });
      const env = { ...process.env, PATH: `${bin}:${process.env.PATH ?? ""}`, DATABASE_ADMIN_URL: "postgresql://zz_nobody@127.0.0.1:1/zz_nowhere", BACKUP_DIR: join(dir, "backups"), BACKUP_LOCK_WAIT: "30" };
      const runOnce = () =>
        new Promise<{ code: number | null; out: string }>((done) => {
          const child = spawn("bash", [join(repo, "ops", "backup.sh")], { env });
          let out = "";
          child.stdout.on("data", (b) => (out += String(b)));
          child.stderr.on("data", (b) => (out += String(b)));
          child.on("exit", (code) => done({ code, out }));
        });
      const [a, b] = await Promise.all([runOnce(), runOnce()]);
      expect(a.code, a.out).toBe(0);
      expect(b.code, b.out).toBe(0);
      const dumps = readdirSync(join(dir, "backups")).filter((f) => f.endsWith(".dump"));
      expect(dumps).toHaveLength(2);
      for (const name of dumps) expect(name).toMatch(/^edulink-\d{8}T\d{6}Z-\d+\.dump$/);
      expect(`${a.out}${b.out}`).toMatch(/another backup is running/);
      // The lock is gone when both are done.
      expect(existsSync(join(dir, "backups", ".backup.lock"))).toBe(false);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  }, 60_000);

  it("TA-418: a lock left by a process that is gone does not stop the next backup", () => {
    const dir = scratch("zz-ta418-stale-");
    try {
      const bin = stubs(dir, { pg_dump: 'for a in "$@"; do case "$a" in --file=*) f="${a#--file=}";; esac; done; echo d > "$f"', pg_restore: "exit 0" });
      mkdirSync(join(dir, "backups", ".backup.lock"), { recursive: true });
      // A pid no process holds.
      writeFileSync(join(dir, "backups", ".backup.lock", "pid"), "999999\n");
      const run = spawnSync("bash", [join(repo, "ops", "backup.sh")], { encoding: "utf8", env: { ...process.env, PATH: `${bin}:${process.env.PATH ?? ""}`, DATABASE_ADMIN_URL: "postgresql://zz_nobody@127.0.0.1:1/zz_nowhere", BACKUP_DIR: join(dir, "backups"), BACKUP_LOCK_WAIT: "5" } });
      expect(run.status, run.stderr).toBe(0);
      expect(readdirSync(join(dir, "backups")).filter((f) => f.endsWith(".dump"))).toHaveLength(1);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("TA-418: db-backup.mjs names its own dump and does not take the new file from a directory difference", () => {
    const source = readFileSync(join(web, "scripts/db-backup.mjs"), "utf8");
    expect(source).not.toMatch(/fresh\.length !== 1/);
    expect(source).toMatch(/BACKUP_OUT: /);
  });
});

describe("TA-438: the drill fails a dump of an empty or wrong database, and pruning keeps the last good copy", () => {
  const full = { School: 23, User: 777, Membership: 900, QuizTopic: 400, QuizQuestion: 15_000, Competition: 12 };

  it("TA-438: a restored database with the right tables and no schools fails the drill", () => {
    const verdict = drillVerdict({ liveTables: 350, restoredTables: 350, restored: { ...full, School: 0, User: 0, Membership: 0 }, dumpBytes: 1_000_000, last: null });
    expect(verdict.ok).toBe(false);
    expect(verdict.problems.join(" ")).toMatch(/School/);
  });

  it("TA-438: sharply fewer key rows or a much smaller dump than the last drill that passed fails it", () => {
    const last = { dump: "edulink-20261101T020000Z.dump", dumpBytes: 100_000_000, restored: full };
    expect(drillVerdict({ liveTables: 350, restoredTables: 350, restored: { ...full, User: 300 }, dumpBytes: 98_000_000, last }).ok).toBe(false);
    expect(drillVerdict({ liveTables: 350, restoredTables: 350, restored: full, dumpBytes: 10_000_000, last }).ok).toBe(false);
    expect(drillVerdict({ liveTables: 350, restoredTables: 349, restored: full, dumpBytes: 98_000_000, last }).ok).toBe(false);
    expect(drillVerdict({ liveTables: 350, restoredTables: 350, restored: { ...full, User: 760 }, dumpBytes: 97_000_000, last })).toEqual({ ok: true, problems: [] });
  });

  it("TA-438: pruning by age keeps the dump the last passing drill restored, however old", () => {
    const now = Date.parse("2026-11-30T03:00:00Z");
    const day = 86_400_000;
    const files = [
      { name: "edulink-20261101T020000Z.dump", mtimeMs: now - 29 * day },
      { name: "edulink-20261110T020000Z.dump", mtimeMs: now - 20 * day },
      { name: "edulink-20261129T020000Z-77.dump", mtimeMs: now - 1 * day },
      { name: "notes.txt", mtimeMs: now - 40 * day },
    ];
    expect(prunableDumps(files, { cutoffMs: now - 14 * day, keep: "edulink-20261101T020000Z.dump" })).toEqual(["edulink-20261110T020000Z.dump"]);
    expect(prunableDumps(files, { cutoffMs: now - 14 * day, keep: null })).toEqual(["edulink-20261101T020000Z.dump", "edulink-20261110T020000Z.dump"]);
  });

  it("TA-438: the drill script asks the verdict, reads an exported DATABASE_ADMIN_URL and strips it through pg-url.mjs", () => {
    const drill = readFileSync(join(web, "scripts/db-restore-drill.sh"), "utf8");
    expect(drill).toMatch(/drill-verdict\.mjs/);
    expect(drill).toMatch(/\$\{DATABASE_ADMIN_URL:-/);
    expect(drill).toMatch(/pg-url\.mjs/);
    expect(readFileSync(join(web, "scripts/db-backup.mjs"), "utf8")).toMatch(/prunableDumps\(/);
  });
});

describe("TA-442: ops/restore.sh creates and restores on one server, into the database it was named", () => {
  const run = (url: string, db: string) => {
    const dir = scratch("zz-ta442-");
    const log = join(dir, "calls.log");
    const bin = stubs(dir, {
      createdb: `echo "createdb $*" >> "${log}"`,
      pg_restore: `echo "pg_restore $*" >> "${log}"`,
    });
    writeFileSync(join(dir, "x.dump"), "not a real dump");
    const result = spawnSync("bash", [join(repo, "ops", "restore.sh"), join(dir, "x.dump"), db], { encoding: "utf8", env: { ...process.env, PATH: `${bin}:${process.env.PATH ?? ""}`, TARGET_ADMIN_URL: url } });
    const calls = existsSync(log) ? readFileSync(log, "utf8").trim().split("\n") : [];
    rmSync(dir, { recursive: true, force: true });
    return { status: result.status, stderr: result.stderr, calls };
  };

  it("TA-442: createdb reaches TARGET_ADMIN_URL's server, the one pg_restore writes to", () => {
    const { status, calls, stderr } = run("postgresql://zz_owner@db.example.test:5432/edulink_restore?connection_limit=5", "edulink_restore");
    expect(status, stderr).toBe(0);
    expect(calls[0]).toMatch(/^createdb --maintenance-db=postgresql:\/\/zz_owner@db\.example\.test:5432\/postgres edulink_restore$/);
    expect(calls[1]).toMatch(/--dbname=postgresql:\/\/zz_owner@db\.example\.test:5432\/edulink_restore /);
  });

  it("TA-442: a TARGET_ADMIN_URL naming another database is refused before anything is created", () => {
    const { status, calls, stderr } = run("postgresql://zz_owner@db.example.test:5432/edulink_dev", "edulink_restore");
    expect(status).not.toBe(0);
    expect(stderr).toMatch(/names the database edulink_dev, not edulink_restore/);
    expect(calls).toEqual([]);
  });
});

/** The snapshot's folder: its top-level batch files are all the script takes. */
const BANK = "apps/web/content/quiz/generated";
/** apps/web/.gitignore's line for the run logs (the owner's decision of 22 November 2026), as every case's repository holds it. */
const RUNS_IGNORE = "/content/quiz/generated/runs/";
/**
 * The throwaway repository's quiz:verify, run by npm from its apps/web as the real one is: ZZ_VERIFY makes it fail (the real
 * verifier's error lines start with two spaces and ✗), print 25 such lines, fail with no such line, write to the folder
 * while it runs, merge a landing into master while it runs, wait for ZZ_RELEASE for at most 30 s (marking ZZ_MARKER as it
 * starts and ZZ_MARKER.done as it ends; land-wait merges the landing first), switch the checkout to another branch, or
 * take the index lock and fail, keeping it (lock) or letting it go half a second later (lock-brief).
 */
const VERIFY_STUB = [
  "#!/bin/sh",
  'case "${ZZ_VERIFY:-ok}" in',
  '  fail) echo "Checking the bank"; echo "  ✗ zz-a.json[2]: repeats [1]"; exit 1 ;;',
  '  fail25) i=1; while [ $i -le 25 ]; do echo "  ✗ problem $i"; i=$((i + 1)); done; exit 1 ;;',
  '  quiet) i=1; while [ $i -le 15 ]; do echo "line $i"; i=$((i + 1)); done; exit 1 ;;',
  "  write-new) printf '{}\\n' > content/quiz/generated/zz-during.json ;;",
  "  edit) printf '{\"edited\":true}\\n' > content/quiz/generated/a.json ;;",
  "  land) git merge -q --ff-only zz-landing ;;",
  '  wait) touch "$ZZ_MARKER"; i=0; while [ ! -e "$ZZ_RELEASE" ] && [ $i -lt 300 ]; do sleep 0.1; i=$((i + 1)); done; touch "$ZZ_MARKER.done" ;;',
  '  land-wait) git merge -q --ff-only zz-landing; touch "$ZZ_MARKER"; i=0; while [ ! -e "$ZZ_RELEASE" ] && [ $i -lt 300 ]; do sleep 0.1; i=$((i + 1)); done ;;',
  "  switch) git checkout -q -b zz-other ;;",
  '  lock-brief) L="$(git rev-parse --absolute-git-dir)/index.lock"; touch "$L"; (sleep 0.5; rm -f "$L") >/dev/null 2>&1 </dev/null & exit 1 ;;',
  '  lock) touch "$(git rev-parse --absolute-git-dir)/index.lock"; exit 1 ;;',
  "esac",
  'echo "Structure and arithmetic: all checks passed."',
  "",
].join("\n");
/** The commit's words that must not change: the Verified and Untested sentences, and the trailer. */
const SNAPSHOT_VERIFIED = "Verified: npm run quiz:verify exit 0 on the chapter batch files, and this commit's files are the tree it checked. Untested: anything quiz:verify does not check.";
const SNAPSHOT_LEFT_OUT = "`runs/` and `held/` left out (the run logs by the owner's decision of 22 November 2026)";
const PUSH_LINE = "until it is pushed the next runs refuse, and any landing built on local master pushes this snapshot along with it.";
/** Holds a stub or shim until the case writes ZZ_RELEASE, for at most 30 s. */
const HOLD = 'i=0; while [ ! -e "$ZZ_RELEASE" ] && [ $i -lt 300 ]; do sleep 0.1; i=$((i + 1)); done';
/** Whether this machine has the UTF-8 locale the script sets for printing subjects. */
const hasEnUtf8 = (spawnSync("locale", ["-a"], { encoding: "utf8" }).stdout ?? "").split("\n").includes("en_US.UTF-8");
/** The one pathspec the script's git commands take, as its lines print it. */
const SPEC = `:(glob)${BANK}/*.json`;

/**
 * git, zsh and npm as on a clean machine, from an allow-list: no global or system git config, no home or zsh dotfiles,
 * and nothing else of this process's environment (tests/setup.ts loads apps/web/.env into it, and vitest started through
 * npm carries npm's own config); npm keeps its cache and config under the case's folder.
 */
function hermetic(dir: string): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = { NODE_ENV: process.env.NODE_ENV };
  for (const [key, value] of Object.entries(process.env)) if (["PATH", "TMPDIR", "LANG", "CI"].includes(key) || key.startsWith("LC_")) env[key] = value;
  return {
    ...env,
    HOME: dir,
    XDG_CONFIG_HOME: join(dir, "xdg"),
    GIT_CONFIG_GLOBAL: "/dev/null",
    GIT_CONFIG_NOSYSTEM: "1",
    npm_config_cache: join(dir, "npm-cache"),
    npm_config_userconfig: join(dir, "npmrc"),
    npm_config_globalconfig: join(dir, "npmrc-global"),
    npm_config_update_notifier: "false",
  };
}

type SnapshotRun = { status: number | null; stdout: string; stderr: string; last: string };

/**
 * A throwaway repository as the real checkout stands for the snapshot: the real script, a stub quiz:verify, the run logs'
 * ignore line with two logs tracked from before it, two tracked files under held/, four top-level
 * batch files, and two bare remotes, reborn and origin, at its master. Each case makes its own and removes it.
 */
function snapshotRepo() {
  const dir = scratch("zz-ta441-");
  const env = hermetic(dir);
  const work = join(dir, "work");
  const git = (cwd: string, ...args: string[]) => execFileSync("git", args, { cwd, encoding: "utf8", env });
  const put = (rel: string, body = "{}\n") => {
    mkdirSync(dirname(join(work, rel)), { recursive: true });
    writeFileSync(join(work, rel), body);
  };
  put("apps/web/scripts/verify-stub.sh", VERIFY_STUB);
  copyFileSync(join(web, "scripts/bank-snapshot.sh"), join(work, "apps/web/scripts/bank-snapshot.sh"));
  put("apps/web/package.json", `${JSON.stringify({ name: "zz-web", private: true, scripts: { "quiz:verify": "sh scripts/verify-stub.sh" } })}\n`);
  put("apps/web/.gitignore", `${RUNS_IGNORE}\n`);
  for (const name of ["a", "c", "d", "e"]) put(`${BANK}/${name}.json`, `{"${name}":1}\n`);
  for (const name of ["runs/old.json", "runs/gone.json", "held/old.json", "held/gone.json"]) put(`${BANK}/${name}`);
  git(work, "init", "-q", "-b", "master");
  git(work, "config", "user.name", "zz");
  git(work, "config", "user.email", "zz@zz.test");
  git(work, "config", "commit.gpgsign", "false");
  git(work, "add", "-A");
  git(work, "add", "-f", `${BANK}/runs`);
  git(work, "commit", "-q", "-m", "start");
  for (const remote of ["reborn", "origin"]) {
    git(dir, "init", "-q", "--bare", "-b", "master", `${remote}.git`);
    git(work, "remote", "add", remote, join(dir, `${remote}.git`));
    git(work, "push", "-q", remote, "master");
  }
  const g = (...args: string[]) => git(work, ...args);
  return {
    dir,
    work,
    env,
    put,
    g,
    rm: (rel: string) => rmSync(join(work, rel)),
    read: (rel: string) => readFileSync(join(work, rel), "utf8"),
    run(extra: Record<string, string> = {}): SnapshotRun {
      const out = spawnSync("zsh", [join(work, "apps/web/scripts/bank-snapshot.sh")], { cwd: dir, encoding: "utf8", env: { ...env, ...extra } });
      return { status: out.status, stdout: out.stdout, stderr: out.stderr, last: out.stderr.trimEnd().split("\n").pop() ?? "" };
    },
    head: () => g("rev-parse", "HEAD").trim(),
    remote: (name: string) => git(dir, "--git-dir", join(dir, `${name}.git`), "rev-parse", "master").trim(),
    remoteFiles: (name: string) => git(dir, "--git-dir", join(dir, `${name}.git`), "show", "--name-only", "--format=", "master").trim(),
    staged: () => g("diff", "--cached", "--name-only").trim(),
    refs: () => g("for-each-ref", "--format=%(refname) %(objectname)"),
    hook(gitDir: string, name: string, body: string) {
      writeFileSync(join(gitDir, "hooks", name), `#!/bin/sh\n${body}\n`);
      chmodSync(join(gitDir, "hooks", name), 0o755);
    },
    done: () => rmSync(dir, { recursive: true, force: true }),
  };
}
type SnapshotRepo = ReturnType<typeof snapshotRepo>;

/** A refusal: exit 1, its own last line, no ref moved here or on either remote, and nothing staged (or the index as it was). */
function refused(r: SnapshotRepo, run: SnapshotRun, line: RegExp, before: { refs: string; remote: string; index?: string }) {
  expect(run.status, run.stderr).toBe(1);
  expect(run.last).toMatch(/^bank snapshot: /);
  expect(run.last).toMatch(line);
  expect(r.refs()).toBe(before.refs);
  expect([r.remote("reborn"), r.remote("origin")]).toEqual([before.remote, before.remote]);
  if (before.index === undefined) expect(r.staged()).toBe("");
  else expect(r.g("ls-files", "-s")).toBe(before.index);
}

/** A git earlier in PATH that runs `body` (sh, the real git as $ZZ_REAL_GIT) and then the real git with the same arguments. */
function gitShim(r: SnapshotRepo, body: string): Record<string, string> {
  const dir = join(r.dir, "shim");
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "git"), `#!/bin/sh\n${body}\nexec "$ZZ_REAL_GIT" "$@"\n`);
  chmodSync(join(dir, "git"), 0o755);
  return { PATH: `${dir}:${r.env.PATH ?? ""}`, ZZ_REAL_GIT: execFileSync("sh", ["-c", "command -v git"], { encoding: "utf8", env: r.env }).trim() };
}

/** A branch, zz-landing, one code commit ahead of master, as a landing waits to be merged; master stays where it is. */
function landingBranch(r: SnapshotRepo): string {
  r.g("switch", "-q", "-c", "zz-landing");
  r.put("code.ts", "export const zz = 1;\n");
  r.g("add", "code.ts");
  r.g("commit", "-q", "-m", "zz a landed code commit");
  const id = r.head();
  r.g("switch", "-q", "master");
  return id;
}

async function until(test: () => boolean, ms = 20_000) {
  const end = Date.now() + ms;
  while (!test()) {
    if (Date.now() > end) throw new Error("timed out waiting");
    await new Promise((done) => setTimeout(done, 50));
  }
}

/**
 * The script started with ZZ_MARKER and ZZ_RELEASE set, and `signal` sent once the marker shows that the step it is to be
 * stopped in is running. The release file is written whatever happens, so that no stub or shim outlives the case's
 * folder, and a run still going is killed. A run that ends or stalls before the marker fails with the stderr it printed.
 */
async function signalled(r: SnapshotRepo, extra: Record<string, string>, signal: NodeJS.Signals): Promise<{ code: number | null; stderr: string; last: string }> {
  const marker = join(r.dir, "running");
  const release = join(r.dir, "release");
  const child = spawn("zsh", [join(r.work, "apps/web/scripts/bank-snapshot.sh")], { cwd: r.dir, env: { ...r.env, ...extra, ZZ_MARKER: marker, ZZ_RELEASE: release }, stdio: ["ignore", "pipe", "pipe"] });
  let stderr = "";
  child.stderr.on("data", (chunk) => (stderr += String(chunk)));
  const exited = new Promise<number | null>((done) => child.on("exit", (code) => done(code)));
  // A shim run by the script holds the script's stderr open until it is released.
  const closed = new Promise<void>((done) => child.on("close", () => done()));
  try {
    const marked = await Promise.race([until(() => existsSync(marker)).then(() => true, () => false), exited.then(() => false)]);
    if (!marked) throw new Error(`the run ended or stalled before the step it was to be stopped in; its stderr:\n${stderr}`);
    // The signal first, then the release: zsh runs the trap once a foreground command it waits on (a held shim) exits,
    // and in a command substitution at once.
    child.kill(signal);
    writeFileSync(release, "");
    const code = await exited;
    await closed;
    return { code, stderr, last: stderr.trimEnd().split("\n").pop() ?? "" };
  } finally {
    writeFileSync(release, "");
    if (child.exitCode === null && child.signalCode === null) child.kill("SIGKILL");
  }
}

// The script is zsh: these cases run wherever zsh is, and on CI, which installs it, they run whether or not it is there,
// so a runner without zsh fails them instead of skipping them.
const zshCase = (hasZsh || process.env.CI ? it : it.skip) as typeof it;

describe("TA-441: the bank snapshot commits the top-level batch files and nothing else", () => {
  it.runIf(Boolean(process.env.CI))("zsh is installed where CI runs these cases (battery.yml's step \"zsh, for the bank snapshot's tests\")", () => {
    expect(hasZsh, "zsh is missing on this runner: battery.yml's step \"zsh, for the bank snapshot's tests\" installs it before the unit suite").toBe(true);
  });

  zshCase("(a) a new run log, a nested one with a space in its name, a changed and a deleted tracked log stay out of the commit and the pushes, as they were; a log staged beforehand stays staged", () => {
    const r = snapshotRepo();
    try {
      r.put(`${BANK}/b.json`);
      r.put(`${BANK}/runs/new.json`);
      r.put(`${BANK}/runs/nested dir/with space.json`);
      r.put(`${BANK}/runs/old.json`, '{"changed":true}\n');
      r.rm(`${BANK}/runs/gone.json`);
      r.put(`${BANK}/runs/staged.json`);
      r.g("add", "-f", `${BANK}/runs/staged.json`);
      const run = r.run();
      expect(run.status, run.stderr).toBe(0);
      expect(r.g("show", "--name-only", "--format=", "HEAD").trim()).toBe(`${BANK}/b.json`);
      for (const remote of ["reborn", "origin"]) {
        expect(r.remote(remote)).toBe(r.head());
        expect(r.remoteFiles(remote)).toBe(`${BANK}/b.json`);
      }
      expect(r.staged()).toBe(`${BANK}/runs/staged.json`);
      expect(r.read(`${BANK}/runs/old.json`)).toBe('{"changed":true}\n');
      expect(existsSync(join(r.work, BANK, "runs/gone.json"))).toBe(false);
      expect(existsSync(join(r.work, BANK, "runs/new.json")) && existsSync(join(r.work, BANK, "runs/nested dir/with space.json"))).toBe(true);
      expect(r.g("status", "--porcelain", "--", `${BANK}/runs/old.json`, `${BANK}/runs/gone.json`).trimEnd().split("\n").sort()).toEqual([` D ${BANK}/runs/gone.json`, ` M ${BANK}/runs/old.json`]);
    } finally {
      r.done();
    }
  }, 60_000);

  zshCase("(b) the same for held/: new files, one in a nested folder with a space in its name, a changed and a deleted tracked one, and one staged beforehand", () => {
    const r = snapshotRepo();
    try {
      r.put(`${BANK}/b.json`);
      r.put(`${BANK}/held/new.json`);
      r.put(`${BANK}/held/nested dir/with space.json`);
      r.put(`${BANK}/held/old.json`, '{"changed":true}\n');
      r.rm(`${BANK}/held/gone.json`);
      r.put(`${BANK}/held/staged.json`);
      r.g("add", `${BANK}/held/staged.json`);
      const run = r.run();
      expect(run.status, run.stderr).toBe(0);
      expect(r.g("show", "--name-only", "--format=", "HEAD").trim()).toBe(`${BANK}/b.json`);
      for (const remote of ["reborn", "origin"]) expect(r.remoteFiles(remote)).toBe(`${BANK}/b.json`);
      expect(r.staged()).toBe(`${BANK}/held/staged.json`);
      expect(r.g("status", "--porcelain", "--untracked-files=all", "--", `${BANK}/held`).trimEnd().split("\n").sort()).toEqual(
        [` D ${BANK}/held/gone.json`, ` M ${BANK}/held/old.json`, `?? "${BANK}/held/nested dir/with space.json"`, `?? ${BANK}/held/new.json`, `A  ${BANK}/held/staged.json`].sort(),
      );
    } finally {
      r.done();
    }
  }, 60_000);

  zshCase("(c) only runs/ and held/ changed, and separately only a top-level file that is not .json: exit 0, \"nothing to snapshot\", no commit", () => {
    for (const change of ["logs and held", "a note"]) {
      const r = snapshotRepo();
      try {
        const start = r.head();
        if (change === "a note") r.put(`${BANK}/notes.txt`, "a note\n");
        else {
          r.put(`${BANK}/runs/new.json`);
          r.put(`${BANK}/runs/old.json`, '{"changed":true}\n');
          r.put(`${BANK}/held/new.json`);
          r.rm(`${BANK}/held/gone.json`);
        }
        const run = r.run();
        expect(run.status, run.stderr).toBe(0);
        expect(run.stdout.trim()).toBe("nothing to snapshot");
        expect([r.head(), r.remote("reborn"), r.remote("origin")]).toEqual([start, start, start]);
        expect(r.staged()).toBe("");
      } finally {
        r.done();
      }
    }
  }, 60_000);

  zshCase("(d) a bank that fails quiz:verify: exit 1 naming quiz:verify, nothing committed, pushed or left staged; the first twenty ✗ lines shown, or the last ten lines where there are none", () => {
    const r = snapshotRepo();
    try {
      const before = { refs: r.refs(), remote: r.head() };
      r.put(`${BANK}/b.json`);
      r.put(`${BANK}/c.json`, '{"c":2}\n');
      let run = r.run({ ZZ_VERIFY: "fail" });
      refused(r, run, /^bank snapshot: npm run quiz:verify failed/, before);
      expect(run.stderr).toContain("  ✗ zz-a.json[2]: repeats [1]");
      run = r.run({ ZZ_VERIFY: "fail25" });
      refused(r, run, /^bank snapshot: npm run quiz:verify failed/, before);
      expect(run.stderr.split("\n").filter((line) => line.startsWith("  ✗ "))).toEqual(Array.from({ length: 20 }, (_, i) => `  ✗ problem ${i + 1}`));
      run = r.run({ ZZ_VERIFY: "quiet" });
      refused(r, run, /^bank snapshot: npm run quiz:verify failed/, before);
      expect(run.stderr.split("\n").filter((line) => /^line \d+$/.test(line))).toEqual(Array.from({ length: 10 }, (_, i) => `line ${i + 6}`));
    } finally {
      r.done();
    }
  }, 60_000);

  zshCase("(e) off master (a side branch, a detached HEAD), the index locked, an unmerged path: each exit 1 with the script's line, no commit on any branch, the remotes unchanged, the index as it was", () => {
    const cases: [string, (r: SnapshotRepo) => void, RegExp][] = [
      ["a side branch", (r) => r.g("switch", "-q", "-c", "zz-side"), /the checkout is on the branch zz-side, not master/],
      ["a detached HEAD", (r) => r.g("switch", "-q", "--detach"), /the checkout is on a detached HEAD, not master/],
      ["index.lock", (r) => writeFileSync(join(r.work, ".git", "index.lock"), ""), /the index is locked/],
      [
        "an unmerged path",
        (r) => {
          r.g("switch", "-q", "-c", "zz-other");
          r.put(`${BANK}/a.json`, '{"other":1}\n');
          r.g("commit", "-q", "-am", "zz other");
          r.g("switch", "-q", "master");
          r.put(`${BANK}/a.json`, '{"master":1}\n');
          r.g("commit", "-q", "-am", "zz master");
          expect(spawnSync("git", ["merge", "-q", "zz-other"], { cwd: r.work, env: r.env }).status).not.toBe(0);
          expect(r.g("ls-files", "-u")).not.toBe("");
        },
        /the index has unmerged paths/,
      ],
    ];
    for (const [name, make, line] of cases) {
      const r = snapshotRepo();
      try {
        const remote = r.head();
        make(r);
        r.put(`${BANK}/b.json`);
        const head = r.head();
        const before = { refs: r.refs(), remote, index: r.g("ls-files", "-s") };
        refused(r, r.run(), line, before);
        expect(r.head(), name).toBe(head);
      } finally {
        r.done();
      }
    }
  }, 60_000);

  zshCase("(f) local master two commits ahead of the remotes: exit 1, both ids, the subjects cut to 80 characters, nothing committed, pushed or staged; the same with the folder unchanged", () => {
    const r = snapshotRepo();
    try {
      const remote = r.head();
      const long = `zz an unpushed commit whose subject runs well past eighty characters, ${"x".repeat(40)}`;
      r.put("one.txt", "1\n");
      r.g("add", "one.txt");
      r.g("commit", "-q", "-m", "zz unpushed one");
      r.put("two.txt", "2\n");
      r.g("add", "two.txt");
      r.g("commit", "-q", "-m", long);
      const local = r.head();
      for (const folder of ["changed", "unchanged"]) {
        if (folder === "changed") r.put(`${BANK}/b.json`);
        else r.rm(`${BANK}/b.json`);
        const before = { refs: r.refs(), remote };
        const run = r.run();
        refused(r, run, /^bank snapshot: local master is 2 commit\(s\) ahead of reborn/, before);
        expect(run.last).toContain(remote.slice(0, 12));
        expect(run.last).toContain(local.slice(0, 12));
        expect(run.last).toContain(long.slice(0, 80));
        expect(run.last).not.toContain(long.slice(0, 81));
        expect(run.last).toContain("zz unpushed one");
        expect(run.stdout).not.toMatch(/nothing to snapshot/);
      }
    } finally {
      r.done();
    }
  }, 60_000);

  zshCase("(g) a remote whose master moved (a peer pushed), one that cannot be read, one with no master: exit 1 naming it, nothing committed, with the folder changed or not", () => {
    const cases: [string, (r: SnapshotRepo) => void, RegExp][] = [
      [
        "moved",
        (r) => {
          const peer = join(r.dir, "peer");
          execFileSync("git", ["clone", "-q", join(r.dir, "reborn.git"), peer], { env: r.env });
          execFileSync("git", ["-c", "user.name=zz", "-c", "user.email=zz@zz.test", "commit", "-q", "--allow-empty", "-m", "zz a peer's commit"], { cwd: peer, env: r.env });
          execFileSync("git", ["push", "-q", "origin", "master"], { cwd: peer, env: r.env });
        },
        /reborn's master has moved/,
      ],
      ["unreadable", (r) => r.g("remote", "set-url", "origin", join(r.dir, "nowhere.git")), /could not read origin's master/],
      [
        "no master",
        (r) => {
          execFileSync("git", ["init", "-q", "--bare", join(r.dir, "empty.git")], { env: r.env });
          r.g("remote", "set-url", "reborn", join(r.dir, "empty.git"));
        },
        /reborn has no master/,
      ],
    ];
    for (const [name, make, line] of cases) {
      const r = snapshotRepo();
      try {
        const start = r.head();
        const remotes = () => [join(r.dir, "reborn.git"), join(r.dir, "origin.git")].map((bare) => execFileSync("git", ["--git-dir", bare, "rev-parse", "master"], { encoding: "utf8", env: r.env }).trim());
        make(r);
        const remoteBefore = remotes();
        for (const folder of ["changed", "unchanged"]) {
          if (folder === "changed") r.put(`${BANK}/b.json`);
          else r.rm(`${BANK}/b.json`);
          const refs = r.refs();
          const run = r.run();
          expect(run.status, `${name}, folder ${folder}: ${run.stderr}`).toBe(1);
          expect(run.last).toMatch(/^bank snapshot: /);
          expect(run.last).toMatch(line);
          expect(r.head()).toBe(start);
          expect(r.refs()).toBe(refs);
          expect(remotes()).toEqual(remoteBefore);
          expect(r.staged()).toBe("");
        }
      } finally {
        r.done();
      }
    }
  }, 60_000);

  zshCase("(h) the first push refused: exit 1 naming reborn and the commit, not retried, origin unchanged, no \"pushed\"; a second run with nothing new refuses as 1 commit(s) ahead of reborn, with the snapshot's subject", () => {
    const r = snapshotRepo();
    try {
      const start = r.head();
      r.hook(join(r.dir, "reborn.git"), "pre-receive", "echo zz refused >&2; exit 1");
      r.put(`${BANK}/b.json`);
      let run = r.run();
      expect(run.status, run.stderr).toBe(1);
      const short = r.g("rev-parse", "--short", "HEAD").trim();
      expect(r.head()).not.toBe(start);
      expect(run.last).toMatch(/^bank snapshot: /);
      expect(run.last).toContain(short);
      expect(run.last).toMatch(/the push to reborn failed \(already pushed to: none\); not retried/);
      expect(run.last.endsWith(`read it before pushing: git push reborn refs/heads/master:refs/heads/master; ${PUSH_LINE}`)).toBe(true);
      expect([r.remote("reborn"), r.remote("origin")]).toEqual([start, start]);
      expect(run.stdout).not.toMatch(/pushed/);
      run = r.run();
      expect(run.status, run.stderr).toBe(1);
      expect(run.last).toMatch(/^bank snapshot: local master is 1 commit\(s\) ahead of reborn/);
      expect(run.last).toContain(r.g("log", "-1", "--format=%s").trim().slice(0, 80));
      expect(run.stdout).not.toMatch(/nothing to snapshot/);
    } finally {
      r.done();
    }
  }, 60_000);

  zshCase("(i) the second push refused: exit 1 saying reborn was pushed and origin was not; a second run names origin", () => {
    const r = snapshotRepo();
    try {
      const start = r.head();
      r.hook(join(r.dir, "origin.git"), "pre-receive", "echo zz refused >&2; exit 1");
      r.put(`${BANK}/b.json`);
      let run = r.run();
      expect(run.status, run.stderr).toBe(1);
      expect(run.last).toMatch(/the push to origin failed \(already pushed to: reborn\); not retried/);
      expect(run.last.endsWith(`read it before pushing: git push origin refs/heads/master:refs/heads/master; ${PUSH_LINE}`)).toBe(true);
      expect([r.remote("reborn"), r.remote("origin")]).toEqual([r.head(), start]);
      expect(run.stdout).not.toMatch(/pushed/);
      run = r.run();
      expect(run.status, run.stderr).toBe(1);
      expect(run.last).toMatch(/^bank snapshot: local master is 1 commit\(s\) ahead of origin/);
    } finally {
      r.done();
    }
  }, 60_000);

  zshCase("(j) one new, one changed, one deleted and one renamed batch file, and a new folder of two under held/: the subject's counts are the commit's files, 2 new, 1 changed and 2 removed", () => {
    const r = snapshotRepo();
    try {
      r.put(`${BANK}/b.json`);
      r.put(`${BANK}/c.json`, '{"c":2}\n');
      r.rm(`${BANK}/d.json`);
      renameSync(join(r.work, BANK, "e.json"), join(r.work, BANK, "f.json"));
      r.put(`${BANK}/held/zz folder/x.json`);
      r.put(`${BANK}/held/zz folder/y.json`);
      const run = r.run();
      expect(run.status, run.stderr).toBe(0);
      const subject = r.g("log", "-1", "--format=%s");
      const letters = r.g("show", "--no-renames", "--name-status", "--format=", "HEAD").trim().split("\n").map((line) => line[0]);
      const shown = { A: letters.filter((l) => l === "A").length, M: letters.filter((l) => l === "M").length, D: letters.filter((l) => l === "D").length };
      // Read first: the old count took a new folder for one file.
      const said = /(\d+) new, (\d+) changed and (\d+) removed/.exec(subject);
      expect(said && { A: Number(said[1]), M: Number(said[2]), D: Number(said[3]) }).toEqual(shown);
      expect(shown).toEqual({ A: 2, M: 1, D: 2 });
      const lastOut = run.stdout.trimEnd().split("\n").pop() ?? "";
      for (const line of [subject, lastOut]) expect(line).toContain("2 new, 1 changed and 2 removed, 4 chapter batch files in all");
    } finally {
      r.done();
    }
  }, 60_000);

  zshCase("(k) a batch file already staged, and one added with git add -N: exit 1 and the staging left as it was", () => {
    for (const how of ["staged", "intent to add"]) {
      const r = snapshotRepo();
      try {
        if (how === "staged") {
          r.put(`${BANK}/c.json`, '{"c":2}\n');
          r.g("add", `${BANK}/c.json`);
        } else {
          r.put(`${BANK}/zz-new.json`);
          r.g("add", "-N", `${BANK}/zz-new.json`);
        }
        r.put(`${BANK}/b.json`);
        const before = { refs: r.refs(), remote: r.head(), index: r.g("ls-files", "-s") };
        const run = r.run();
        refused(r, run, /already staged/, before);
        expect(r.g("diff", "--cached", "--ita-visible-in-index", "--name-only").trim()).toBe(how === "staged" ? `${BANK}/c.json` : `${BANK}/zz-new.json`);
      } finally {
        r.done();
      }
    }
  }, 60_000);

  zshCase("(l) the commit fails (a pre-commit hook): exit 1 with the script's line last, no batch file left staged, a file staged elsewhere still staged", () => {
    const r = snapshotRepo();
    try {
      r.hook(join(r.work, ".git"), "pre-commit", "echo zz no commits today >&2; exit 1");
      r.put("half-done.ts", "export {};\n");
      r.g("add", "half-done.ts");
      r.put(`${BANK}/b.json`);
      const before = { refs: r.refs(), remote: r.head() };
      const run = r.run();
      expect(r.staged()).toBe("half-done.ts");
      expect(run.status, run.stderr).toBe(1);
      expect(run.last).toMatch(/^bank snapshot: the commit failed/);
      expect(r.refs()).toBe(before.refs);
      expect([r.remote("reborn"), r.remote("origin")]).toEqual([before.remote, before.remote]);
    } finally {
      r.done();
    }
  }, 60_000);

  zshCase("(m) the folder changes while quiz:verify runs (a new batch file; a tracked one edited): exit 1, no commit, nothing staged", () => {
    const cases: [string, RegExp][] = [
      ["write-new", /^bank snapshot: a new chapter batch file appeared while quiz:verify ran/],
      ["edit", /^bank snapshot: the chapter batch files changed while quiz:verify ran/],
    ];
    for (const [how, line] of cases) {
      const r = snapshotRepo();
      try {
        r.put(`${BANK}/b.json`);
        const before = { refs: r.refs(), remote: r.head() };
        refused(r, r.run({ ZZ_VERIFY: how }), line, before);
      } finally {
        r.done();
      }
    }
  }, 60_000);

  zshCase("(n) a batch file rewritten between the check and the commit (one the run staged, one it left unchanged): the commit is taken back, nothing staged or pushed; a new file made then stays untracked and the snapshot goes", () => {
    const realGit = execFileSync("sh", ["-c", "command -v git"], { encoding: "utf8" }).trim();
    for (const [file, expectTakenBack] of [["c.json", true], ["a.json", true], ["new", false]] as const) {
      const r = snapshotRepo();
      try {
        // A git earlier in PATH that writes in the folder as `git commit` starts, then runs the real git.
        const shim = join(r.dir, "shim");
        mkdirSync(shim);
        const write = file === "new" ? `printf '{}\\n' > ${BANK}/zz-at-commit.json` : `printf '{"rewritten":true}\\n' > ${BANK}/${file}`;
        writeFileSync(join(shim, "git"), `#!/bin/sh\nif [ "$1" = commit ]; then ${write}; fi\nexec "${realGit}" "$@"\n`);
        chmodSync(join(shim, "git"), 0o755);
        r.put(`${BANK}/c.json`, '{"c":2}\n');
        const before = { refs: r.refs(), remote: r.head() };
        const run = r.run({ PATH: `${shim}:${r.env.PATH ?? ""}` });
        if (expectTakenBack) {
          refused(r, run, /^bank snapshot: the batch files changed between quiz:verify and the commit; the commit was taken back; nothing committed or pushed$/, before);
          expect(r.read(`${BANK}/${file}`)).toBe('{"rewritten":true}\n');
        } else {
          expect(run.status, run.stderr).toBe(0);
          expect(r.g("show", "--name-only", "--format=", "HEAD").trim()).toBe(`${BANK}/c.json`);
          expect(r.g("ls-files", "--others", "--", BANK).trim()).toBe(`${BANK}/zz-at-commit.json`);
          expect([r.remote("reborn"), r.remote("origin")]).toEqual([r.head(), r.head()]);
        }
      } finally {
        r.done();
      }
    }
  }, 60_000);

  zshCase("(o) a good run's message: [skip ci], what it leaves out and by whose word, the Verified and Untested sentences word for word, the trailer last", () => {
    const r = snapshotRepo();
    try {
      r.put(`${BANK}/b.json`);
      const run = r.run();
      expect(run.status, run.stderr).toBe(0);
      const message = r.g("log", "-1", "--format=%B").trimEnd();
      expect(message.startsWith("The question bank's chapter batch files as they stood on ")).toBe(true);
      expect(message).toContain("[skip ci]");
      expect(message).toContain(SNAPSHOT_LEFT_OUT);
      expect(message).toContain(SNAPSHOT_VERIFIED);
      expect(message.split("\n").pop()).toBe("Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>");
      expect(run.stdout.trimEnd().split("\n").pop()).toMatch(new RegExp(`^snapshot ${r.g("rev-parse", "--short", "HEAD").trim()} committed: 1 new, 0 changed and 0 removed, 5 chapter batch files in all; pushed to reborn and origin$`));
    } finally {
      r.done();
    }
  }, 60_000);

  zshCase("(p) TA-441: a file another builder staged stays staged and out of the snapshot's commit", () => {
    const r = snapshotRepo();
    try {
      r.put(`${BANK}/b.json`);
      r.put("half-done.ts", "export {};\n");
      r.g("add", "half-done.ts");
      const run = r.run();
      expect(run.status, run.stderr).toBe(0);
      expect(r.g("show", "--name-only", "--format=", "HEAD").trim().split("\n")).toEqual([`${BANK}/b.json`]);
      expect(r.staged()).toBe("half-done.ts");
      expect(r.remoteFiles("reborn")).toBe(`${BANK}/b.json`);
    } finally {
      r.done();
    }
  }, 60_000);

  zshCase("(A1a) master moved by a landing's merge while quiz:verify runs: exit 1 before the commit, the landed commit kept on master, nothing pushed or staged", () => {
    const r = snapshotRepo();
    try {
      const start = r.head();
      const landed = landingBranch(r);
      r.put(`${BANK}/b.json`);
      const run = r.run({ ZZ_VERIFY: "land" });
      expect(run.status, run.stderr).toBe(1);
      expect(run.last).toBe(`bank snapshot: master moved during the run (now ${landed}, was ${start}); nothing committed or pushed`);
      expect(r.head()).toBe(landed);
      expect([r.remote("reborn"), r.remote("origin")]).toEqual([start, start]);
      expect(r.staged()).toBe("");
    } finally {
      r.done();
    }
  }, 60_000);

  zshCase("(A1b) master moved by a landing's merge as the commit starts, with and without a batch file rewritten then: the commit is taken back to its own parent, the landed commit kept on master, nothing pushed or staged", () => {
    for (const rewrite of [false, true]) {
      const r = snapshotRepo();
      try {
        const start = r.head();
        const landed = landingBranch(r);
        r.put(`${BANK}/c.json`, '{"c":2}\n');
        const also = rewrite ? ` printf '{"rewritten":true}\\n' > ${BANK}/c.json;` : "";
        const run = r.run(gitShim(r, `if [ "$1" = commit ]; then "$ZZ_REAL_GIT" merge -q --ff-only zz-landing || exit 1;${also} fi`));
        expect(run.status, run.stderr).toBe(1);
        expect(run.last).toMatch(new RegExp(`^bank snapshot: master moved during the run \\(the snapshot commit [0-9a-f]{40} was made on ${landed}, not ${start}\\); the commit was taken back; nothing committed or pushed$`));
        expect(r.head(), `rewrite ${rewrite}`).toBe(landed);
        expect([r.remote("reborn"), r.remote("origin")]).toEqual([start, start]);
        expect(r.staged()).toBe("");
      } finally {
        r.done();
      }
    }
  }, 60_000);

  zshCase("(A1c) master moved during the first push: reborn gets the snapshot commit by its id, not master, and origin is refused because master is no longer that commit", () => {
    const r = snapshotRepo();
    try {
      const start = r.head();
      r.put(`${BANK}/b.json`);
      const once = join(r.dir, "pushed-once");
      const run = r.run(gitShim(r, `if [ "$1" = push ] && [ ! -e "${once}" ]; then touch "${once}"; "$ZZ_REAL_GIT" commit -q --allow-empty -m "zz landed on top" || exit 1; fi`));
      expect(run.status, run.stderr).toBe(1);
      const snapshot = r.g("rev-parse", "HEAD^").trim();
      expect(r.g("log", "-1", "--format=%s")).toBe("zz landed on top\n");
      expect([r.remote("reborn"), r.remote("origin")]).toEqual([snapshot, start]);
      expect(run.last).toMatch(new RegExp(`^bank snapshot: local master moved after the snapshot commit [0-9a-f]+ \\(now ${r.head()}\\); not pushed to origin \\(already pushed to: reborn\\); not retried`));
      expect(run.last.endsWith(`read it before pushing the commit by its id: git push origin ${snapshot}:refs/heads/master; ${PUSH_LINE}`)).toBe(true);
    } finally {
      r.done();
    }
  }, 60_000);

  for (const [signal, code] of [["SIGTERM", 143], ["SIGINT", 130], ["SIGHUP", 129]] as const) {
    zshCase(`(A2) ${signal} while quiz:verify runs: exit ${code} with the script's own line last naming it, nothing staged; the next run is not refused`, async () => {
      const r = snapshotRepo();
      try {
        r.put(`${BANK}/b.json`);
        const stop = await signalled(r, { ZZ_VERIFY: "wait" }, signal);
        expect(stop.code, stop.stderr).toBe(code);
        expect(stop.last).toBe(`bank snapshot: stopped by ${signal}; nothing committed or pushed`);
        expect(r.staged()).toBe("");
        await until(() => existsSync(join(r.dir, "running.done")));
        const next = r.run();
        expect(next.status, next.stderr).toBe(0);
      } finally {
        r.done();
      }
    }, 60_000);
  }

  zshCase("(1.3) a landing merged while quiz:verify runs, then SIGTERM: the line says nothing was committed and that master moved", async () => {
    const r = snapshotRepo();
    try {
      const landed = landingBranch(r);
      r.put(`${BANK}/b.json`);
      const stop = await signalled(r, { ZZ_VERIFY: "land-wait" }, "SIGTERM");
      expect(stop.code, stop.stderr).toBe(143);
      expect(stop.last).toBe(`bank snapshot: stopped by SIGTERM; nothing committed or pushed; local master moved to ${landed} meanwhile`);
      expect(r.head()).toBe(landed);
      expect(r.staged()).toBe("");
    } finally {
      r.done();
    }
  }, 60_000);

  zshCase("(1.3) SIGTERM after the commit was made and before its checks: the line says a snapshot commit may be on local master, unchecked and not to be pushed; the next run reports it", async () => {
    const r = snapshotRepo();
    try {
      const start = r.head();
      r.put(`${BANK}/b.json`);
      const stop = await signalled(r, gitShim(r, `if [ "$1" = commit ]; then "$ZZ_REAL_GIT" "$@"; s=$?; touch "$ZZ_MARKER"; ${HOLD}; exit $s; fi`), "SIGTERM");
      expect(stop.code, stop.stderr).toBe(143);
      expect(stop.last).toBe("bank snapshot: stopped by SIGTERM; a snapshot commit may be on local master and was not checked against what quiz:verify read; do not push it; the next run will report it");
      expect([r.remote("reborn"), r.remote("origin")]).toEqual([start, start]);
      const next = r.run();
      expect(next.status, next.stderr).toBe(1);
      expect(next.last).toMatch(/^bank snapshot: local master is 1 commit\(s\) ahead of reborn/);
    } finally {
      r.done();
    }
  }, 60_000);

  zshCase("(1.3) SIGTERM while the push to origin is held after it went through: the line names the snapshot commit, reborn pushed and origin's push under way; the next run finds nothing left", async () => {
    const r = snapshotRepo();
    try {
      r.put(`${BANK}/b.json`);
      const stop = await signalled(r, gitShim(r, `if [ "$1" = push ] && [ "$3" = origin ]; then "$ZZ_REAL_GIT" "$@"; s=$?; touch "$ZZ_MARKER"; ${HOLD}; exit $s; fi`), "SIGTERM");
      expect(stop.code, stop.stderr).toBe(143);
      const made = r.head();
      expect(stop.last).toBe(`bank snapshot: stopped by SIGTERM; the snapshot commit ${made} is on local master, pushed to: reborn, and the push to origin was under way (it may have gone through); the next run will report what is left`);
      expect([r.remote("reborn"), r.remote("origin")]).toEqual([made, made]);
      const next = r.run();
      expect(next.status, next.stderr).toBe(0);
      expect(next.stdout.trim()).toBe("nothing to snapshot");
    } finally {
      r.done();
    }
  }, 60_000);

  zshCase("(1.4) a signal while the EXIT trap unstages is held off: the reset and its retry finish, and their sentence is the last line, exit 1", async () => {
    const r = snapshotRepo();
    try {
      r.put(`${BANK}/b.json`);
      const stop = await signalled(r, { ...gitShim(r, 'if [ "$1" = reset ]; then touch "$ZZ_MARKER"; fi'), ZZ_VERIFY: "lock" }, "SIGTERM");
      expect(stop.code, stop.stderr).toBe(1);
      expect(stop.last).toBe(`bank snapshot: could not unstage the chapter batch files (git reset failed); they are still staged, and the next runs refuse until they are unstaged with: git reset -q -- '${SPEC}'`);
    } finally {
      r.done();
    }
  }, 60_000);

  zshCase("(1.1) the unstage's retry goes through after a brief lock: nothing staged, and the verifier's refusal stays the last line", () => {
    const r = snapshotRepo();
    try {
      r.put(`${BANK}/b.json`);
      const before = { refs: r.refs(), remote: r.head() };
      refused(r, r.run({ ZZ_VERIFY: "lock-brief" }), /^bank snapshot: npm run quiz:verify failed on the chapter batch files as they stand; nothing committed or pushed$/, before);
    } finally {
      r.done();
    }
  }, 60_000);

  zshCase("(1.2) a take-back git refuses (master's ref locked): the line says the snapshot commit is still on local master, unchecked and not to be pushed, and how to take it back", () => {
    const r = snapshotRepo();
    try {
      const start = r.head();
      r.put(`${BANK}/c.json`, '{"c":2}\n');
      const run = r.run(gitShim(r, `if [ "$1" = commit ]; then printf '{"rewritten":true}\\n' > ${BANK}/c.json; fi\nif [ "$1" = update-ref ]; then touch "$("$ZZ_REAL_GIT" rev-parse --absolute-git-dir)/refs/heads/master.lock"; fi`));
      expect(run.status, run.stderr).toBe(1);
      const made = r.head();
      expect(made).not.toBe(start);
      expect(run.last).toBe(`bank snapshot: the snapshot commit ${made} could not be taken back (git update-ref failed) and is still on local master; it was not checked and must not be pushed; take it back with: git update-ref refs/heads/master ${start} ${made}; nothing pushed`);
      expect([r.remote("reborn"), r.remote("origin")]).toEqual([start, start]);
    } finally {
      r.done();
    }
  }, 60_000);

  zshCase("(1.5) the checkout switched to another branch at the same commit while quiz:verify ran: exit 1 before the commit, no commit on any branch, nothing pushed or staged", () => {
    const r = snapshotRepo();
    try {
      const start = r.head();
      r.put(`${BANK}/b.json`);
      const run = r.run({ ZZ_VERIFY: "switch" });
      expect(run.status, run.stderr).toBe(1);
      expect(run.last).toBe("bank snapshot: the checkout left master during the run (it is on the branch zz-other); nothing committed or pushed");
      expect([r.g("rev-parse", "master").trim(), r.g("rev-parse", "zz-other").trim()]).toEqual([start, start]);
      expect([r.remote("reborn"), r.remote("origin")]).toEqual([start, start]);
      expect(r.staged()).toBe("");
    } finally {
      r.done();
    }
  }, 60_000);

  zshCase("(B2) the other reads that can fail after the commit (its id, its parent, the count): exit 1, the script's own line saying the snapshot commit is on local master and unpushed", () => {
    const cases: [string, string, (made: string) => string][] = [
      ["its id", '[ "$1" = rev-parse ] && [ "$2" = HEAD ]', () => "bank snapshot: the commit was made but HEAD could not be read (git rev-parse HEAD failed); local master may hold an unverified snapshot commit; nothing pushed"],
      ["its parent", '[ "$1" = rev-parse ] && case "$2" in *^) true ;; *) false ;; esac', (made) => `bank snapshot: the snapshot commit ${made}'s parent could not be read; it is on local master, unverified; nothing pushed`],
      ["the count", '[ "$1" = ls-files ]', (made) => `bank snapshot: the snapshot commit ${made} is on local master and not pushed (git ls-files failed); read it before pushing: git push reborn refs/heads/master:refs/heads/master; ${PUSH_LINE}`],
    ];
    for (const [name, test, line] of cases) {
      const r = snapshotRepo();
      try {
        const start = r.head();
        r.put(`${BANK}/b.json`);
        const committed = join(r.dir, "committed");
        const run = r.run(gitShim(r, `if [ "$1" = commit ]; then "$ZZ_REAL_GIT" "$@"; s=$?; touch "${committed}"; exit $s; fi\nif [ -e "${committed}" ] && ${test}; then echo "zz refused" >&2; exit 128; fi`));
        expect(run.status, `${name}: ${run.stderr}`).toBe(1);
        expect(run.last, name).toBe(line(r.head()));
        expect([r.remote("reborn"), r.remote("origin")]).toEqual([start, start]);
      } finally {
        r.done();
      }
    }
  }, 60_000);

  (hasEnUtf8 ? zshCase : it.skip)("(1.7) under LC_CTYPE=C, a subject in Devanagari with ₹ is shown in its own characters and cut at 80 characters", () => {
    const r = snapshotRepo();
    try {
      const remote = r.head();
      const subject = `zz ${"पाठ ₹ ".repeat(20)}`;
      r.put("one.txt", "1\n");
      r.g("add", "one.txt");
      r.g("commit", "-q", "-m", subject);
      const before = { refs: r.refs(), remote };
      const run = r.run({ LC_ALL: "", LC_CTYPE: "C", LANG: "C" });
      refused(r, run, /local master is 1 commit\(s\) ahead of reborn/, before);
      expect(run.last).toContain(`"${[...subject].slice(0, 80).join("")}"`);
    } finally {
      r.done();
    }
  }, 60_000);

  zshCase("(A3) the trap's own reset refused (another process holding the index lock): the script's own line last says the batch files are still staged and how to unstage them, and the next run's refusal says how too", () => {
    const r = snapshotRepo();
    try {
      r.put(`${BANK}/b.json`);
      const run = r.run({ ZZ_VERIFY: "lock" });
      expect(run.status, run.stderr).toBe(1);
      expect(run.last).toBe(`bank snapshot: could not unstage the chapter batch files (git reset failed); they are still staged, and the next runs refuse until they are unstaged with: git reset -q -- '${SPEC}'`);
      rmSync(join(r.work, ".git", "index.lock"));
      expect(r.staged()).toBe(`${BANK}/b.json`);
      const next = r.run();
      expect(next.status, next.stderr).toBe(1);
      expect(next.last).toContain(`if a snapshot run was stopped part-way and nobody else staged them, unstage with: git reset -q -- '${SPEC}'`);
    } finally {
      r.done();
    }
  }, 60_000);

  zshCase('(B1) a failing git status is a refusal, never "nothing to snapshot"', () => {
    const r = snapshotRepo();
    try {
      const before = { refs: r.refs(), remote: r.head() };
      const run = r.run(gitShim(r, 'if [ "$1" = status ]; then echo "zz status refused" >&2; exit 128; fi'));
      refused(r, run, /^bank snapshot: git status failed; nothing committed or pushed$/, before);
      expect(run.stdout).not.toMatch(/nothing to snapshot/);
    } finally {
      r.done();
    }
  }, 60_000);

  zshCase("(B2) a read that fails after the commit: exit 1, the line says the snapshot commit is on local master and not pushed, with the push line", () => {
    const r = snapshotRepo();
    try {
      const start = r.head();
      r.put(`${BANK}/b.json`);
      const run = r.run(gitShim(r, 'for a in "$@"; do if [ "$a" = --short ]; then exit 128; fi; done'));
      expect(run.status, run.stderr).toBe(1);
      const made = r.head();
      expect(made).not.toBe(start);
      expect(run.last).toBe(`bank snapshot: the snapshot commit ${made} is on local master and not pushed (git rev-parse --short failed); read it before pushing: git push reborn refs/heads/master:refs/heads/master; ${PUSH_LINE}`);
      expect([r.remote("reborn"), r.remote("origin")]).toEqual([start, start]);
    } finally {
      r.done();
    }
  }, 60_000);

  zshCase("(B3) a ref whose name only ends in refs/heads/master is not taken for reborn's master: reborn's master moved on is still seen", () => {
    const r = snapshotRepo();
    try {
      const reborn = join(r.dir, "reborn.git");
      execFileSync("git", ["--git-dir", reborn, "update-ref", "refs/heads/a/refs/heads/master", r.head()], { env: r.env });
      const peer = join(r.dir, "peer");
      execFileSync("git", ["clone", "-q", reborn, peer], { env: r.env });
      execFileSync("git", ["-c", "user.name=zz", "-c", "user.email=zz@zz.test", "commit", "-q", "--allow-empty", "-m", "zz a peer's commit"], { cwd: peer, env: r.env });
      execFileSync("git", ["push", "-q", "origin", "master"], { cwd: peer, env: r.env });
      r.put(`${BANK}/b.json`);
      const refs = r.refs();
      const run = r.run();
      expect(run.status, run.stderr).toBe(1);
      expect(run.last).toMatch(/^bank snapshot: reborn's master has moved/);
      expect(r.refs()).toBe(refs);
      expect(r.staged()).toBe("");
    } finally {
      r.done();
    }
  }, 60_000);

  zshCase("(B4) a batch file that is a symbolic link: exit 1, nothing committed, pushed or staged", () => {
    const r = snapshotRepo();
    try {
      r.put(`${BANK}/runs/zz-target.json`);
      symlinkSync("runs/zz-target.json", join(r.work, BANK, "link.json"));
      const before = { refs: r.refs(), remote: r.head() };
      refused(r, r.run(), /^bank snapshot: a chapter batch file is a symbolic link/, before);
    } finally {
      r.done();
    }
  }, 60_000);

  zshCase("(B5) a commit subject with control characters is printed with them made visible", () => {
    const r = snapshotRepo();
    try {
      const remote = r.head();
      r.put("one.txt", "1\n");
      r.g("add", "one.txt");
      r.g("commit", "-q", "-m", "zz \u001b[31mred\u001b[0m subject");
      const before = { refs: r.refs(), remote };
      const run = r.run();
      refused(r, run, /local master is 1 commit\(s\) ahead of reborn/, before);
      expect(run.last).toContain('"zz ^[[31mred^[[0m subject"');
      expect(run.last).not.toContain("\u001b");
    } finally {
      r.done();
    }
  }, 60_000);

  it("(q) the daily task's command reaches the script through npm as before", () => {
    const pkg = JSON.parse(readFileSync(join(web, "package.json"), "utf8")) as { scripts: Record<string, string> };
    expect(pkg.scripts["bank:snapshot"]).toBe("zsh scripts/bank-snapshot.sh");
  });

  it("(r) apps/web/.gitignore ignores the run logs, nested ones too, and neither held/ nor a top-level batch file", () => {
    const dir = scratch("zz-ta441-ignore-");
    const env = hermetic(dir);
    try {
      const git = (...args: string[]) => spawnSync("git", args, { cwd: dir, encoding: "utf8", env });
      expect(git("init", "-q").status).toBe(0);
      mkdirSync(join(dir, "apps/web"), { recursive: true });
      copyFileSync(join(web, ".gitignore"), join(dir, "apps/web/.gitignore"));
      const paths = { "runs/zz-new.json": 0, "runs/zz nested/zz.json": 0, "held/zz.json": 1, "zz.json": 1 };
      for (const [path, ignored] of Object.entries(paths)) {
        mkdirSync(dirname(join(dir, BANK, path)), { recursive: true });
        writeFileSync(join(dir, BANK, path), "{}\n");
        expect(git("check-ignore", "-q", `${BANK}/${path}`).status, path).toBe(ignored);
      }
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe("TA-521: the age of the newest copies is asked, not assumed", () => {
  const hour = 3_600_000;
  const now = Date.parse("2026-11-14T08:00:00Z");

  it("TA-521: a newest dump 27 hours old is red, 2 hours old green; a base older than eight days is red", () => {
    expect(backupFreshness({ dumps: [{ name: "edulink-a.dump", mtimeMs: now - 27 * hour }], bases: [{ name: "base-a.tar", mtimeMs: now - 2 * 24 * hour }], now }).ok).toBe(false);
    expect(backupFreshness({ dumps: [{ name: "edulink-b.dump", mtimeMs: now - 2 * hour }], bases: [{ name: "base-b.tar", mtimeMs: now - 2 * 24 * hour }], now })).toMatchObject({ ok: true, problems: [] });
    expect(backupFreshness({ dumps: [{ name: "edulink-b.dump", mtimeMs: now - 2 * hour }], bases: [{ name: "base-c.tar", mtimeMs: now - 9 * 24 * hour }], now }).problems.join(" ")).toMatch(/base/);
    expect(backupFreshness({ dumps: [], bases: [], now }).ok).toBe(false);
  });

  it("TA-521: the command reads the off-machine folder and exits 1 when the newest dump is stale", () => {
    const dir = scratch("zz-ta521-");
    try {
      mkdirSync(join(dir, "pitr-bases"), { recursive: true });
      writeFileSync(join(dir, "edulink-20261112T020000Z.dump"), "d");
      writeFileSync(join(dir, "pitr-bases", "base-20261111T020000Z.tar"), "b");
      const old = (Date.now() - 30 * hour) / 1000;
      utimesSync(join(dir, "edulink-20261112T020000Z.dump"), old, old);
      const stale = spawnSync(process.execPath, [join(web, "scripts/db-backup-age.mjs")], { encoding: "utf8", env: { ...process.env, EDULINK_OFFSITE_DIR: dir } });
      expect(stale.status).toBe(1);
      expect(stale.stdout + stale.stderr).toMatch(/30 hours/);
      writeFileSync(join(dir, "edulink-20261114T020000Z.dump"), "d");
      const fresh = spawnSync(process.execPath, [join(web, "scripts/db-backup-age.mjs")], { encoding: "utf8", env: { ...process.env, EDULINK_OFFSITE_DIR: dir } });
      expect(fresh.status, fresh.stderr).toBe(0);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("TA-521: the runbook takes the dump before the snapshot's push and names the freshness check", () => {
    const runbook = readFileSync(join(repo, "docs/runbooks/backup-restore.md"), "utf8");
    expect(runbook).toMatch(/node scripts\/db-backup-age\.mjs/);
    expect(runbook).toMatch(/first and alone, before\s+`npm run bank:snapshot`/);
  });
});
