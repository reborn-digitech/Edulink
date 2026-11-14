/**
 * The two database roles row security depends on, from the testing analysis of 13 November 2026.
 *
 *   TA-194: nothing at boot or release proved that the application's role is held by row-level security (neither a
 *           superuser nor BYPASSRLS); a deployment on the owner's URL served with the policies skipped.
 *   TA-243: every data step, job and dump assumed the owner's role passes row security, and nothing checked it; an
 *           owner that does not runs them over no school's rows and says nothing.
 *
 * The release step (scripts/db-grants.mjs) now stops on either by scripts/db-role-check.mjs, and with-admin-db.mjs asks
 * the owner before prisma migrate deploy runs (it runs before db:grants); the jobs runner refuses
 * to start its schedule on an owner that does not bypass (POST /api/internal/jobs). This database's own two roles are
 * held to the same rules here, so CI's are too. No rows are written.
 */
import { afterAll, afterEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { PrismaClient } from "@prisma/client";
import type { RoleFlags } from "@/lib/db-role-check";

/** Whether the jobs route's read of the owner's flags answers a role that does not bypass. */
const fake: { flags: RoleFlags | null } = { flags: null };
vi.mock("@/lib/db-role-check", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/db-role-check")>();
  return { ...actual, readRoleFlags: async (client: Parameters<typeof actual.readRoleFlags>[0]) => fake.flags ?? actual.readRoleFlags(client) };
});

const { appRoleProblem, ownerRoleProblem, readRoleFlags } = await import("@/lib/db-role-check");
const { appliesMigrations, migrateRoleProblems, parseRoleFlags, releaseRoleProblems, ROLE_FLAGS_SQL } = await import("../scripts/db-role-check.mjs");
const { POST: jobsPost } = await import("@/app/api/internal/jobs/route");
const { jobSchedulerRunning } = await import("@/lib/job-scheduler");

const owner = new PrismaClient();
const appUrl = process.env.DATABASE_APP_URL;
const singleRole = (() => {
  try {
    return !appUrl || new URL(appUrl).username === new URL(process.env.DATABASE_ADMIN_URL ?? appUrl).username;
  } catch {
    return true;
  }
})();
const app = !singleRole && appUrl ? new PrismaClient({ datasourceUrl: appUrl }) : null;

afterAll(async () => {
  await owner.$disconnect();
  await app?.$disconnect();
});

describe("TA-194 / TA-243: the rules", () => {
  it("TA-194: the application's role is refused as a superuser or BYPASSRLS, and passes as neither", () => {
    expect(appRoleProblem({ role: "zz_app", superuser: false, bypassRls: false })).toBeNull();
    expect(appRoleProblem({ role: "zz_app", superuser: true, bypassRls: false })).toMatch(/zz_app.*superuser/);
    expect(appRoleProblem({ role: "zz_app", superuser: false, bypassRls: true })).toMatch(/BYPASSRLS/);
  });

  it("TA-243: the owner's role is refused as neither, and passes as either", () => {
    expect(ownerRoleProblem({ role: "zz_owner", superuser: false, bypassRls: false })).toMatch(/zz_owner.*BYPASSRLS/);
    expect(ownerRoleProblem({ role: "zz_owner", superuser: true, bypassRls: false })).toBeNull();
    expect(ownerRoleProblem({ role: "zz_owner", superuser: false, bypassRls: true })).toBeNull();
  });

  it("TA-194 / TA-243: the release step's rules: a bypassing app role, a held owner, and one role in production stop it", () => {
    const held = { role: "zz_app", superuser: false, bypassRls: false };
    const bypass = { role: "zz_owner", superuser: true, bypassRls: false };
    expect(releaseRoleProblems({ app: held, owner: bypass, singleRole: false, production: true })).toEqual([]);
    expect(releaseRoleProblems({ app: { ...held, bypassRls: true }, owner: bypass, singleRole: false, production: true })).toHaveLength(1);
    expect(releaseRoleProblems({ app: held, owner: { ...held, role: "zz_owner" }, singleRole: false, production: false })).toHaveLength(1);
    expect(releaseRoleProblems({ app: bypass, owner: bypass, singleRole: true, production: true })[0]).toMatch(/one role/);
    // A developer's single-role machine is theirs.
    expect(releaseRoleProblems({ app: bypass, owner: bypass, singleRole: true, production: false })).toEqual([]);
    expect(parseRoleFlags("edulink_app|f|t")).toEqual({ role: "edulink_app", superuser: false, bypassRls: true });
    expect(parseRoleFlags("")).toBeNull();
    expect(ROLE_FLAGS_SQL).toMatch(/rolsuper.*rolbypassrls.*current_user/);
  });

  it("TA-243: the owner is asked before prisma migrate deploy runs, not after it in db:grants, and a held owner stops it", () => {
    const adminUrl = "postgresql://zz_owner@localhost/zz_db";
    const appUrlOf = "postgresql://zz_app@localhost/zz_db";
    const held = { role: "zz_owner", superuser: false, bypassRls: false };
    const asked: string[] = [];
    const readFlags = (flags: typeof held | null) => (url: string) => {
      asked.push(url);
      return flags;
    };
    const deploy = ["prisma", "migrate", "deploy"];
    // A held owner stops the migration, naming the role and BYPASSRLS; the owner's own connection is the one asked.
    const stop = migrateRoleProblems({ argv: deploy, adminUrl, appUrl: appUrlOf, production: true, readFlags: readFlags(held) });
    expect(stop).toHaveLength(1);
    expect(stop[0]).toMatch(/zz_owner.*BYPASSRLS/);
    expect(asked).toEqual([adminUrl]);
    expect(migrateRoleProblems({ argv: ["npx", ...deploy], adminUrl, appUrl: appUrlOf, production: false, readFlags: readFlags(held) })).toHaveLength(1);
    // An owner that bypasses migrates; one whose flags cannot be read does not.
    expect(migrateRoleProblems({ argv: deploy, adminUrl, appUrl: appUrlOf, production: true, readFlags: readFlags({ ...held, bypassRls: true }) })).toEqual([]);
    expect(migrateRoleProblems({ argv: deploy, adminUrl, appUrl: appUrlOf, production: true, readFlags: readFlags(null) })[0]).toMatch(/nothing was applied/);
    const throwing = () => {
      throw new Error("could not connect to server");
    };
    expect(migrateRoleProblems({ argv: deploy, adminUrl, appUrl: appUrlOf, production: true, readFlags: throwing })[0]).toMatch(/could not connect.*nothing was applied/);
    // One role in production is refused before the migration too; a developer's single-role machine is theirs.
    expect(migrateRoleProblems({ argv: deploy, adminUrl, appUrl: adminUrl, production: true, readFlags: readFlags({ ...held, superuser: true }) })[0]).toMatch(/one role/);
    expect(migrateRoleProblems({ argv: deploy, adminUrl, appUrl: adminUrl, production: false, readFlags: readFlags(held) })).toEqual([]);
    // Any other command is not asked about at all.
    asked.length = 0;
    for (const argv of [["prisma", "db", "push"], ["prisma", "migrate", "dev", "--create-only"], ["npx", "tsx", "prisma/seed.ts"]]) {
      expect(appliesMigrations(argv)).toBe(false);
      expect(migrateRoleProblems({ argv, adminUrl, appUrl: appUrlOf, production: true, readFlags: readFlags(held) })).toEqual([]);
    }
    expect(asked).toEqual([]);
    // with-admin-db.mjs asks it before it spawns the command, after the fence.
    const script = readFileSync(resolve(__dirname, "../scripts/with-admin-db.mjs"), "utf8");
    const fence = script.indexOf("fenceVerdict([command");
    const check = script.indexOf("migrateRoleProblems({");
    const spawned = script.indexOf("spawn(command");
    expect(fence).toBeGreaterThan(0);
    expect(check).toBeGreaterThan(fence);
    expect(spawned).toBeGreaterThan(check);
  });
});

describe("TA-194 / TA-243: this database's two roles", () => {
  it("TA-243: the owner's connection passes row security", async () => {
    expect(ownerRoleProblem(await readRoleFlags(owner))).toBeNull();
  });

  it.skipIf(!app)("TA-194: the application's connection is held by it", async () => {
    expect(appRoleProblem(await readRoleFlags(app!))).toBeNull();
  });
});

describe("TA-243: the jobs runner on an owner that does not bypass", () => {
  const saved = process.env.JOBS_RUNNER;
  afterEach(() => {
    fake.flags = null;
    if (saved === undefined) delete process.env.JOBS_RUNNER;
    else process.env.JOBS_RUNNER = saved;
  });

  it("TA-243: the schedule is not started, and the runner is answered 500 naming the role and BYPASSRLS", async () => {
    process.env.JOBS_RUNNER = "1";
    fake.flags = { role: "zz_owner", superuser: false, bypassRls: false };
    const res = await jobsPost();
    expect(res.status).toBe(500);
    expect(((await res.json()) as { error: string }).error).toMatch(/zz_owner.*BYPASSRLS/);
    expect(jobSchedulerRunning()).toBe(false);
  });
});
