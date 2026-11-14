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
 *   TA-441: the daily bank snapshot committed whatever else was staged under its [skip ci] message.
 *   TA-521: nothing noticed when the morning dumps stopped; db-backup-age.mjs now says how old the newest copies are.
 */
import { describe, expect, it } from "vitest";
import { execFileSync, spawn, spawnSync } from "node:child_process";
import { chmodSync, copyFileSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, utimesSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
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

describe("TA-441: the bank snapshot commits the bank's folder and nothing else", () => {
  it.skipIf(!hasZsh)("TA-441: a file another builder staged stays staged and out of the snapshot's commit", () => {
    const dir = scratch("zz-ta441-");
    const git = (cwd: string, ...args: string[]) => execFileSync("git", args, { cwd, encoding: "utf8", env: { ...process.env, GIT_CONFIG_GLOBAL: "/dev/null", GIT_CONFIG_NOSYSTEM: "1" } });
    try {
      const work = join(dir, "work");
      mkdirSync(join(work, "apps/web/scripts"), { recursive: true });
      mkdirSync(join(work, "apps/web/content/quiz/generated"), { recursive: true });
      copyFileSync(join(web, "scripts/bank-snapshot.sh"), join(work, "apps/web/scripts/bank-snapshot.sh"));
      writeFileSync(join(work, "apps/web/content/quiz/generated/a.json"), "{}\n");
      git(work, "init", "-q", "-b", "master");
      git(work, "config", "user.name", "zz");
      git(work, "config", "user.email", "zz@zz.test");
      git(work, "config", "commit.gpgsign", "false");
      git(work, "add", "-A");
      git(work, "commit", "-q", "-m", "start");
      for (const remote of ["reborn", "origin"]) {
        git(dir, "init", "-q", "--bare", `${remote}.git`);
        git(work, "remote", "add", remote, join(dir, `${remote}.git`));
        git(work, "push", "-q", remote, "master");
      }
      writeFileSync(join(work, "apps/web/content/quiz/generated/b.json"), "{}\n");
      writeFileSync(join(work, "half-done.ts"), "export {};\n");
      git(work, "add", "half-done.ts");

      const run = spawnSync("zsh", [join(work, "apps/web/scripts/bank-snapshot.sh")], { encoding: "utf8", env: { ...process.env, GIT_CONFIG_GLOBAL: "/dev/null", GIT_CONFIG_NOSYSTEM: "1" } });
      expect(run.status, run.stderr).toBe(0);
      expect(git(work, "show", "--name-only", "--format=", "HEAD").trim().split("\n")).toEqual(["apps/web/content/quiz/generated/b.json"]);
      expect(git(work, "diff", "--cached", "--name-only").trim()).toBe("half-done.ts");
      expect(git(dir, "--git-dir", join(dir, "reborn.git"), "show", "--name-only", "--format=", "master").trim()).toBe("apps/web/content/quiz/generated/b.json");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  }, 60_000);
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
