/**
 * The database guards of the operations and disaster-recovery batch, from the testing analysis of 13 November 2026.
 * Nothing here dumps, migrates, seeds or connects to a real database server: the rules are pure, the one run of
 * db-backup.mjs points at a port nothing listens on, and the rest are reads of the scripts and runbooks.
 *
 *   TA-254: db:migrate dumps first, and the go-live runbook ran it with the production URLs from a laptop, so the
 *           production database went into storage/backups and the owner's iCloud-synced Desktop. db-backup.mjs now
 *           asks the server where it answered (and which database it is) and refuses before ops/backup.sh is spawned;
 *           the runbook's steps use db:release, which takes no dump.
 *   TA-437: the fence read whole arguments, so `sh -c "… --shadow-database-url …"`, `prisma@6.19.3 migrate reset`
 *           and `migrate dev` (a shadow of its own, a reset prompt on drift) passed, and db:seed wiped a populated
 *           database with no dump and no consent.
 *   TA-523: a tunnel ending on the database host's own loopback (ssh -L, kubectl port-forward) answers 127.0.0.1,
 *           which the locality guard took for this machine; it now also asks the database's name.
 *   TA-440: the release refuses one role for app and owner in production and a privileged app role (db-role-check.mjs).
 *   TA-444: a deployed web machine held the owner's connection URL it never uses; register() now drops it there.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fenceVerdict, seedVerdict } from "../scripts/db-fence.mjs";
import { localDatabaseVerdict, refuseUnlessLocalDatabase } from "../scripts/local-db-guard.mjs";
import { backupLocalityVerdict } from "../scripts/db-backup.mjs";
import { releaseRoleProblems } from "../scripts/db-role-check.mjs";

const web = resolve(__dirname, "..");
const repo = resolve(web, "..", "..");
const read = (path: string) => readFileSync(resolve(repo, path), "utf8");

describe("TA-254: the dev machine's dump refuses a database that is not on this machine", () => {
  it("TA-254: a Fly tunnel, another host or a production database name is refused; this machine's dev database is not", () => {
    expect(backupLocalityVerdict("fdaa:0:1a2b::3|edulink").local).toBe(false);
    expect(backupLocalityVerdict("10.0.0.5|edulink_dev").local).toBe(false);
    expect(backupLocalityVerdict("127.0.0.1|edulink").local).toBe(false);
    expect(backupLocalityVerdict("").local).toBe(false);
    expect(backupLocalityVerdict("|edulink_dev").local).toBe(true);
    expect(backupLocalityVerdict("127.0.0.1|edulink_dev").local).toBe(true);
    expect(backupLocalityVerdict("::1|edulink_ci").local).toBe(true);
  });

  it("TA-254: db-backup.mjs refuses before ops/backup.sh runs when it cannot ask the server, and writes nothing", () => {
    const dir = mkdtempSync(join(tmpdir(), "zz-ta254-"));
    try {
      const run = spawnSync(process.execPath, ["scripts/db-backup.mjs", "--quiet"], {
        cwd: web,
        encoding: "utf8",
        // Port 1 on the loopback: nothing listens, so psql cannot connect and nothing is dumped from anywhere.
        env: { ...process.env, DATABASE_ADMIN_URL: "postgresql://zz_nobody@127.0.0.1:1/zz_nowhere", BACKUP_DIR: join(dir, "backups"), EDULINK_OFFSITE_DIR: join(dir, "offsite") },
        timeout: 60_000,
      });
      expect(run.status).not.toBe(0);
      expect(run.stderr).toMatch(/db:backup: refused/);
      expect(run.stderr).not.toMatch(/the dump FAILED/);
      expect(run.stderr).not.toMatch(/zz_nobody@/);
      expect(readdirSync(dir)).toEqual([]);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("TA-254: the go-live runbook never runs db:migrate (which dumps) with the production URLs, and names db:release as the release command", () => {
    const golive = read("docs/runbooks/go-live.md");
    const lines = golive.split("\n");
    expect(lines.filter((l) => /db:migrate\b/.test(l) && /PROD_/.test(l))).toEqual([]);
    expect(golive).not.toMatch(/release command `npm run db:migrate`/);
    expect(golive).toMatch(/release command `npm run db:release`/);
    expect(read("fly.toml")).toMatch(/release_command = "npm run db:release"/);
  });
});

describe("TA-437: the fence reads the words Prisma will get", () => {
  it("TA-437: a shell-wrapped shadow URL and a version-pinned reset are refused", () => {
    expect(fenceVerdict(["sh", "-c", "npx prisma migrate diff --from-schema-datamodel prisma/schema.prisma --to-schema-datamodel prisma/schema.prisma --shadow-database-url postgresql://x@localhost/edulink_dev --script"]).ok).toBe(false);
    expect(fenceVerdict(["bash", "-c", "npx prisma migrate diff --from-migrations prisma/migrations --to-schema-datamodel prisma/schema.prisma"]).ok).toBe(false);
    expect(fenceVerdict(["npx", "prisma@6.19.3", "migrate", "reset", "--force"]).ok).toBe(false);
    expect(fenceVerdict(["node_modules/.bin/prisma", "migrate", "reset"]).ok).toBe(false);
    expect(fenceVerdict(["sh", "-c", "npx prisma db push --force-reset"]).ok).toBe(false);
  });

  it("TA-437: prisma migrate dev is refused in every form, pointing at the live-datasource diff", () => {
    for (const argv of [["prisma", "migrate", "dev"], ["prisma", "migrate", "dev", "--create-only"], ["npx", "prisma@6", "migrate", "dev", "--name", "x"]]) {
      const verdict = fenceVerdict(argv);
      expect(verdict.ok, argv.join(" ")).toBe(false);
      expect(verdict.why).toMatch(/from-schema-datasource/);
    }
    // What stays allowed.
    expect(fenceVerdict(["npx", "prisma", "migrate", "diff", "--from-schema-datasource", "prisma/schema.prisma", "--to-schema-datamodel", "prisma/schema.prisma", "--script"])).toEqual({ ok: true });
    expect(fenceVerdict(["sh", "-c", "npx prisma migrate deploy"])).toEqual({ ok: true });
    expect(fenceVerdict(["npx", "tsx", "scripts/devtools.ts"])).toEqual({ ok: true });
  });

  it("TA-437: the seed refuses a database that holds a school unless db:reset's consent is set, and asks before it wipes", () => {
    expect(seedVerdict(0)).toEqual({ ok: true });
    expect(seedVerdict(1).ok).toBe(false);
    expect(seedVerdict(23).why).toMatch(/23 schools/);
    expect(seedVerdict(23, { resetConsent: true })).toEqual({ ok: true });
    expect(seedVerdict(Number.NaN).ok).toBe(false);
    const seed = readFileSync(resolve(web, "prisma/seed.ts"), "utf8");
    const asked = seed.indexOf("seedVerdict(await db.school.count()");
    expect(asked).toBeGreaterThan(0);
    expect(asked).toBeLessThan(seed.indexOf("await wipe();"));
  });
});

describe("TA-523: the loopback is this machine only for a database that is this machine's", () => {
  it("TA-523: a loopback or socket answer from a database not named as local is refused", () => {
    const tunnel = localDatabaseVerdict("127.0.0.1", { database: "edulink" });
    expect(tunnel.local).toBe(false);
    expect(tunnel.why).toMatch(/edulink/);
    expect(localDatabaseVerdict(null, { database: "edulink" }).local).toBe(false);
    expect(localDatabaseVerdict("127.0.0.1", { database: "edulink_dev" }).local).toBe(true);
    expect(localDatabaseVerdict("::1", { database: "edulink_ci" }).local).toBe(true);
    expect(localDatabaseVerdict("172.18.0.2", { ci: true, database: "edulink_ci" }).local).toBe(true);
    expect(localDatabaseVerdict("127.0.0.1", { database: "my_scratch", knownLocal: ["my_scratch"] }).local).toBe(true);
  });

  it("TA-523: refuseUnlessLocalDatabase asks the database's name, and refuses a tunnel to a production name", async () => {
    const client = (addr: string | null, name: string) => ({ $queryRawUnsafe: async <T,>() => [{ addr, name }] as T });
    await expect(refuseUnlessLocalDatabase(client("127.0.0.1", "edulink"), "db:seed")).rejects.toThrow(/refusing to run db:seed: .*edulink/);
    await expect(refuseUnlessLocalDatabase(client("127.0.0.1", "edulink_dev"), "db:seed")).resolves.toMatchObject({ local: true });
  });

  it("TA-523: the runbook no longer says the guards refuse any tunnel", () => {
    expect(read("docs/runbooks/go-live.md")).not.toMatch(/both refuse a tunnel now/);
  });
});

describe("TA-440: the release refuses a privileged or single app role in production", () => {
  it("TA-440: one role for app and owner, or a superuser or BYPASSRLS app role, stops the release (db-role-check.mjs, run by db-grants.mjs)", () => {
    const owner = { role: "edulink_owner", superuser: false, bypassRls: true };
    expect(releaseRoleProblems({ app: owner, owner, singleRole: true, production: true })).toHaveLength(1);
    expect(releaseRoleProblems({ app: { role: "edulink_app", superuser: false, bypassRls: true }, owner, singleRole: false, production: true })[0]).toMatch(/BYPASSRLS/);
    expect(releaseRoleProblems({ app: { role: "edulink_app", superuser: true, bypassRls: false }, owner, singleRole: false, production: true })[0]).toMatch(/superuser/);
    expect(releaseRoleProblems({ app: { role: "edulink_app", superuser: false, bypassRls: false }, owner, singleRole: false, production: true })).toEqual([]);
    const grants = readFileSync(resolve(web, "scripts/db-grants.mjs"), "utf8");
    expect(grants.indexOf("releaseRoleProblems({")).toBeLessThan(grants.indexOf("/* ---- 1. the grants"));
  });
});

describe("TA-444: a deployed web machine does not keep the owner's URL", () => {
  const saved: Record<string, string | undefined> = { ...process.env };
  afterEach(() => {
    const live = process.env as Record<string, string | undefined>;
    for (const key of ["NEXT_RUNTIME", "NODE_ENV", "JOBS_RUNNER", "DATABASE_ADMIN_URL"]) {
      if (saved[key] === undefined) delete live[key];
      else live[key] = saved[key];
    }
    vi.doUnmock("@/lib/env");
    vi.resetModules();
  });

  it("TA-444: register() drops DATABASE_ADMIN_URL on a production web process, and keeps it for the jobs runner and on a laptop", async () => {
    vi.doMock("@/lib/env", async (importOriginal) => ({ ...(await importOriginal<typeof import("@/lib/env")>()), assertEnv: () => undefined }));
    const { register } = await import("@/instrumentation");
    const env = process.env as Record<string, string | undefined>;
    env.NEXT_RUNTIME = "nodejs";
    env.NODE_ENV = "production";
    env.DATABASE_ADMIN_URL = "postgresql://zz_owner@127.0.0.1:1/zz_nowhere";

    delete env.JOBS_RUNNER;
    await register();
    expect(env.DATABASE_ADMIN_URL).toBeUndefined();

    env.DATABASE_ADMIN_URL = "postgresql://zz_owner@127.0.0.1:1/zz_nowhere";
    env.JOBS_RUNNER = "1";
    await register();
    expect(env.DATABASE_ADMIN_URL).toBe("postgresql://zz_owner@127.0.0.1:1/zz_nowhere");

    delete env.JOBS_RUNNER;
    env.NODE_ENV = "development";
    await register();
    expect(env.DATABASE_ADMIN_URL).toBe("postgresql://zz_owner@127.0.0.1:1/zz_nowhere");
  });

  it("TA-444: the deploy runbook says the web machines drop the owner's URL", () => {
    expect(read("docs/runbooks/deploy.md")).toMatch(/drops `DATABASE_ADMIN_URL` from its environment at boot/);
  });
});
