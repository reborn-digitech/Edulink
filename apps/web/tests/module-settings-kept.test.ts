/**
 * A school module's settings kept across a switch off and on again (the owner's word of 15 November 2026, "Yes,
 * fix it"). The settings live on the module's own row (SchoolModule.settingsJson), and a switch-off deleted the row,
 * so off and on again returned transport's showDriverToParents, the alumni feed mode and the placement cell's
 * settings to their defaults, while modules.ts said that switching back on finds the module as it was.
 *
 * What is proved, at two scratch ZZ colleges of this suite's own (Asha and Bela, made through the owner connection
 * and removed afterwards by id): off then on brings each of the three back, by the admin, by the operator and by one
 * of each, and a second round brings back the second settings, not the first; a module with no settings comes back
 * with none and its switch-off row reads as it did; on twice and off twice stay no-ops with no extra audit row; the
 * settings come back to their own school only, even under a binding that could read both; a switch-off whose audit
 * row is not written leaves the module on with its settings; and the safety centre's trail never prints the
 * settings a switch-off keeps.
 *
 * AS THE APP ROLE where the configuration has one: src/lib/db.ts connects with DATABASE_URL put back to it before
 * anything imports db.ts (as tests/ta-plans-payments-app-role.test.ts does), and every switch runs inside a real
 * session, the admin's binding their own school and the operator's binding the one school through asOperator, so
 * the reads and writes go through row security as they do on the server. With a single role the same cases run as
 * the owner, where only the switch's own WHERE keeps a school to its own rows.
 */
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

const ENV = vi.hoisted(() => {
  const app = process.env.DATABASE_APP_URL;
  const admin = process.env.DATABASE_ADMIN_URL;
  let appUser: string | null = null;
  try {
    if (app && admin && new URL(app).username !== new URL(admin).username) appUser = new URL(app).username;
  } catch {
    appUser = null;
  }
  if (appUser) process.env.DATABASE_URL = app;
  return { appUser, admin };
});

/** Switch-offs whose audit row is to fail, as a refused insert does (the case of the lost row). */
const inject = vi.hoisted(() => ({ offAuditFails: 0 }));

vi.mock("@/lib/audit", async (importOriginal) => {
  const real = await importOriginal<typeof import("@/lib/audit")>();
  return {
    ...real,
    audit: async (...args: Parameters<typeof real.audit>) => {
      if (inject.offAuditFails > 0 && args[0].action === "school.module.off") {
        inject.offAuditFails -= 1;
        // The insert refused on the switch's own transaction, which Postgres then aborts, and passed on to the caller,
        // as audit() does with a transaction since 15 November 2026 (tests/audit-in-transaction.test.ts); a write made
        // without one is still swallowed and answered null.
        const tx = args[1];
        if (!tx) return null;
        const refused = await tx.$executeRaw`SELECT 1/0`.then(() => null, (error: unknown) => error);
        throw refused instanceof Error ? refused : new Error("the audit row was refused");
      }
      return real.audit(...args);
    },
  };
});

import { PrismaClient } from "@prisma/client";
import type { SchoolModuleCode } from "@edulink/contracts";
import { db } from "@/lib/db";
import { createSession, getSession, type ActiveContext } from "@/lib/session";
import { __resetCookies, __setHeaders } from "../tests/stubs/next-headers";
import { enabledModules, setModule, switchModuleFor } from "@/lib/modules";
import { setModuleAsOperator } from "@/lib/operator-college";
import { setTransportSettings, transportSettings } from "@/lib/transport";
import { alumniFeedMode, setAlumniFeedMode } from "@/lib/alumni";
import { placementSettings, savePlacementSettings } from "@/lib/placement";
import { listAudit } from "@/lib/safety";
import { forTenant } from "@/lib/tenant-context";

const owner = new PrismaClient(ENV.admin ? { datasourceUrl: ENV.admin } : undefined);
const STAMP = Date.now();
const SUFFIX = String(STAMP).slice(-6);
const MAIL = (who: string) => `zz-modkeep-${who.toLowerCase()}-${STAMP}@test.invalid`;
const ids: Record<string, string> = {};

/** The day placementSettings is read on, so that its default season (2027) does not move with the clock. */
const TODAY = "2026-11-15";
const THREE: readonly SchoolModuleCode[] = ["TRANSPORT", "ALUMNI", "PLACEMENT"];

type Settings = {
  transport: { showDriverToParents: boolean };
  alumni: "READ" | "COMMENT" | "POST";
  placement: { seasonBatchYear: number; dreamRatio: number; allowGenderRule: boolean };
};
const DEFAULTS: Settings = { transport: { showDriverToParents: false }, alumni: "COMMENT", placement: { seasonBatchYear: 2027, dreamRatio: 1.5, allowGenderRule: false } };
/** Settings a case chooses: none of the three a default, and each case's differing from the others'. */
const chosen = (seasonBatchYear: number, dreamRatio: number, alumni: "READ" | "POST", allowGenderRule: boolean): Settings => ({
  transport: { showDriverToParents: true },
  alumni,
  placement: { seasonBatchYear, dreamRatio, allowGenderRule },
});

type Who = "ADMIN_A" | "ADMIN_B" | "TPO_A" | "OPERATOR";
/** Signed in as `who` the way a request is: a real session row and its cookie, which db.ts binds the tenant from. */
async function as(who: Who): Promise<ActiveContext> {
  __resetCookies();
  __setHeaders({});
  const at: Record<Who, [string, string | null, string | null]> = {
    ADMIN_A: [ids.adminA!, ids.asha!, "ADMIN"],
    ADMIN_B: [ids.adminB!, ids.bela!, "ADMIN"],
    TPO_A: [ids.tpoA!, ids.asha!, "TPO"],
    OPERATOR: [ids.operator!, null, null],
  };
  const [userId, schoolId, role] = at[who];
  await createSession(userId, { schoolId, role: role as never });
  return (await getSession())!;
}

/** Asha's three settings through their own setters: transport and alumni by the admin, placement by the cell. */
async function choose(s: Settings): Promise<void> {
  const admin = await as("ADMIN_A");
  await setTransportSettings(admin, s.transport);
  await setAlumniFeedMode(admin, s.alumni);
  await savePlacementSettings(await as("TPO_A"), s.placement);
}

/** The three settings as their own readers give them, read by the school's admin. */
async function settingsAt(school: "asha" | "bela"): Promise<Settings> {
  await as(school === "asha" ? "ADMIN_A" : "ADMIN_B");
  const schoolId = ids[school]!;
  return { transport: await transportSettings(schoolId), alumni: await alumniFeedMode(schoolId), placement: await placementSettings(schoolId, TODAY) };
}

async function adminSwitch(who: "ADMIN_A" | "ADMIN_B", on: boolean, modules: readonly SchoolModuleCode[] = THREE): Promise<void> {
  const admin = await as(who);
  for (const code of modules) expect(await setModule(admin, code, on)).toEqual({ changed: true });
}

async function operatorSwitch(schoolId: string, on: boolean, modules: readonly SchoolModuleCode[] = THREE): Promise<void> {
  const operator = await as("OPERATOR");
  for (const code of modules) expect(await setModuleAsOperator(operator, schoolId, code, on)).toEqual({ ok: true, changed: true });
}

/** The rows a case starts from, made by the owner where an earlier case left a module off; a row already there is untouched. */
async function ensureOn(schoolId: string): Promise<void> {
  await owner.schoolModule.createMany({ data: [...THREE, "LIBRARY"].map((module) => ({ schoolId, module })), skipDuplicates: true });
}

const moduleRow = (schoolId: string, module: string) => owner.schoolModule.findUnique({ where: { schoolId_module: { schoolId, module } }, select: { settingsJson: true, enabledByUserId: true } });
/** The school's own switch rows, oldest first. */
const switches = (schoolId: string) => owner.auditLog.findMany({ where: { schoolId, action: { startsWith: "school.module." } }, orderBy: [{ createdAt: "asc" }, { id: "asc" }], select: { action: true, meta: true } });

beforeAll(async () => {
  const mkSchool = (tag: string) =>
    owner.school.create({ data: { name: `ZZ Module Settings ${tag} ${STAMP}`, slug: `zz-modkeep-${tag.toLowerCase()}-${STAMP}`, code: `ZMK${tag[0]}${SUFFIX}`, kind: "COLLEGE", contactEmail: MAIL(`school-${tag}`), timezone: "Asia/Kolkata", isTestFixture: true }, select: { id: true } });
  ids.asha = (await mkSchool("Asha")).id;
  ids.bela = (await mkSchool("Bela")).id;
  // A college's own two (ALUMNI, ACADEMICS), the other two that keep settings, and LIBRARY, which keeps none.
  await owner.schoolModule.createMany({ data: [ids.asha, ids.bela].flatMap((schoolId) => ["ALUMNI", "ACADEMICS", "TRANSPORT", "PLACEMENT", "LIBRARY"].map((module) => ({ schoolId, module }))) });
  const mkUser = async (key: string, extra: { isSuperuser?: boolean } = {}) => (ids[key] = (await owner.user.create({ data: { name: `ZZ ModKeep ${key}`, email: MAIL(key), ...extra }, select: { id: true } })).id);
  await mkUser("adminA");
  await mkUser("adminB");
  await mkUser("tpoA");
  await mkUser("operator", { isSuperuser: true });
  await owner.membership.createMany({
    data: [
      { userId: ids.adminA!, schoolId: ids.asha, role: "ADMIN", status: "ACTIVE" },
      { userId: ids.adminB!, schoolId: ids.bela, role: "ADMIN", status: "ACTIVE" },
      { userId: ids.tpoA!, schoolId: ids.asha, role: "TPO", status: "ACTIVE" },
    ],
  });
});

afterAll(async () => {
  __resetCookies();
  __setHeaders({});
  inject.offAuditFails = 0;
  const users = [ids.adminA, ids.adminB, ids.tpoA, ids.operator].filter((id): id is string => Boolean(id));
  const schools = [ids.asha, ids.bela].filter((id): id is string => Boolean(id));
  await owner.session.deleteMany({ where: { userId: { in: users } } });
  await owner.notification.deleteMany({ where: { userId: { in: users } } });
  // The schools' own logs, and the operator's unattributed rows (superuser.school.module).
  await owner.auditLog.deleteMany({ where: { OR: [{ schoolId: { in: schools } }, { actorUserId: { in: users } }] } });
  await owner.school.deleteMany({ where: { id: { in: schools } } });
  await owner.user.deleteMany({ where: { id: { in: users } } });
  await owner.$disconnect();
});

describe("a module's settings across a switch off and on again", () => {
  it.skipIf(!ENV.appUser)("arrange: db.ts connects as the app role, which neither owns the tables nor bypasses row security", async () => {
    const [who] = await db.$queryRaw<{ name: string; bypass: boolean }[]>`SELECT current_user::text AS name, r.rolbypassrls AS bypass FROM pg_roles r WHERE r.rolname = current_user`;
    expect(who).toEqual({ name: ENV.appUser, bypass: false });
  });

  it("off then on by the admin brings back each of the three, and a second round brings back the second settings", async () => {
    await ensureOn(ids.asha!);
    const first = chosen(2031, 2.5, "POST", true);
    await choose(first);
    expect(await settingsAt("asha")).toEqual(first);
    await adminSwitch("ADMIN_A", false);
    expect((await enabledModules(ids.asha)).filter((m) => THREE.includes(m))).toEqual([]);
    await adminSwitch("ADMIN_A", true);
    expect(await settingsAt("asha")).toEqual(first);

    const second = chosen(2032, 3, "READ", false);
    await choose(second);
    await adminSwitch("ADMIN_A", false);
    await adminSwitch("ADMIN_A", true);
    expect(await settingsAt("asha")).toEqual(second);
  });

  it("off then on by the operator brings them back, each row switched on by the platform as before", async () => {
    await ensureOn(ids.asha!);
    const s = chosen(2033, 1.75, "POST", true);
    await choose(s);
    await operatorSwitch(ids.asha!, false);
    await operatorSwitch(ids.asha!, true);
    expect(await settingsAt("asha")).toEqual(s);
    for (const code of THREE) expect((await moduleRow(ids.asha!, code))?.enabledByUserId).toBe(ids.operator);
  });

  it("off by one and on by the other, either way round, brings them back", async () => {
    await ensureOn(ids.asha!);
    const a = chosen(2034, 2, "READ", false);
    await choose(a);
    await adminSwitch("ADMIN_A", false);
    await operatorSwitch(ids.asha!, true);
    expect(await settingsAt("asha")).toEqual(a);

    const b = chosen(2035, 4.5, "POST", true);
    await choose(b);
    await operatorSwitch(ids.asha!, false);
    await adminSwitch("ADMIN_A", true);
    expect(await settingsAt("asha")).toEqual(b);
  });

  it("a module with no settings comes back with none, and its switch-off row reads as it did", async () => {
    await ensureOn(ids.bela!);
    const before = (await switches(ids.bela!)).length;
    // Bela never chose transport's or the cell's settings, and LIBRARY keeps none.
    const none: SchoolModuleCode[] = ["TRANSPORT", "PLACEMENT", "LIBRARY"];
    await adminSwitch("ADMIN_B", false, none);
    await adminSwitch("ADMIN_B", true, none);
    await operatorSwitch(ids.bela!, false, ["LIBRARY"]);
    await operatorSwitch(ids.bela!, true, ["LIBRARY"]);
    for (const code of none) expect((await moduleRow(ids.bela!, code))?.settingsJson).toBeNull();
    const bela = await settingsAt("bela");
    expect({ transport: bela.transport, placement: bela.placement }).toEqual({ transport: DEFAULTS.transport, placement: DEFAULTS.placement });
    const offRows = (await switches(ids.bela!)).slice(before).filter((r) => r.action === "school.module.off");
    expect(offRows.map((r) => r.meta).sort()).toEqual(['{"module":"LIBRARY","byOperator":true}', '{"module":"LIBRARY"}', '{"module":"PLACEMENT"}', '{"module":"TRANSPORT"}']);
  });

  it("on twice and off twice stay no-ops with no extra audit row, and the second switch-off hides nothing of the first", async () => {
    await ensureOn(ids.asha!);
    const s = chosen(2036, 1.25, "READ", true);
    await choose(s);
    const before = (await switches(ids.asha!)).length;
    const operatorRows = () => owner.auditLog.count({ where: { schoolId: null, actorUserId: ids.operator, action: "superuser.school.module", targetId: ids.asha } });
    const operatorBefore = await operatorRows();

    let admin = await as("ADMIN_A");
    expect(await setModule(admin, "TRANSPORT", true)).toEqual({ changed: false });
    expect(await setModule(admin, "TRANSPORT", false)).toEqual({ changed: true });
    expect(await setModule(admin, "TRANSPORT", false)).toEqual({ changed: false });
    expect(await setModuleAsOperator(await as("OPERATOR"), ids.asha!, "TRANSPORT", false)).toEqual({ ok: true, changed: false });
    admin = await as("ADMIN_A");
    expect(await setModule(admin, "TRANSPORT", true)).toEqual({ changed: true });
    expect(await setModule(admin, "TRANSPORT", true)).toEqual({ changed: false });
    expect(await setModuleAsOperator(await as("OPERATOR"), ids.asha!, "TRANSPORT", true)).toEqual({ ok: true, changed: false });

    expect((await switches(ids.asha!)).slice(before).map((r) => r.action)).toEqual(["school.module.off", "school.module.on"]);
    expect(await operatorRows()).toBe(operatorBefore);
    expect(await settingsAt("asha")).toEqual(s);
  });

  it("brings the settings back to their own school only, even under a binding that could read both", async () => {
    await ensureOn(ids.asha!);
    await ensureOn(ids.bela!);
    // Bela keeps its own alumni mode and never chose transport's; Asha chose both.
    await setAlumniFeedMode(await as("ADMIN_B"), "READ");
    await choose(chosen(2037, 2.25, "POST", true));
    // Bela's switch-offs first and Asha's after, so that Asha's rows are the newest of each module's anywhere.
    const two: SchoolModuleCode[] = ["TRANSPORT", "ALUMNI"];
    await adminSwitch("ADMIN_B", false, two);
    await adminSwitch("ADMIN_A", false, two);
    // Bela switched back on under a binding that reaches both schools' logs, as the owner's connection does: only
    // the switch's own WHERE keeps Bela to Bela's rows.
    __resetCookies();
    const both = { schoolIds: [ids.asha!, ids.bela!], userId: ids.adminB!, joinCode: null, isSuperuser: false };
    for (const code of two) expect(await forTenant(both, () => switchModuleFor(ids.bela!, ids.adminB!, code, true))).toEqual({ changed: true });
    expect((await moduleRow(ids.bela!, "TRANSPORT"))?.settingsJson).toBeNull();
    const bela = await settingsAt("bela");
    expect({ transport: bela.transport, alumni: bela.alumni }).toEqual({ transport: DEFAULTS.transport, alumni: "READ" });

    await adminSwitch("ADMIN_A", true, two);
    const asha = await settingsAt("asha");
    expect({ transport: asha.transport, alumni: asha.alumni }).toEqual({ transport: { showDriverToParents: true }, alumni: "POST" });
  });

  it("a switch-off whose audit row is not written leaves the module on with its settings", async () => {
    await ensureOn(ids.asha!);
    const s = chosen(2038, 3.5, "READ", false);
    await choose(s);
    const kept = await moduleRow(ids.asha!, "ALUMNI");
    const before = (await switches(ids.asha!)).length;
    const admin = await as("ADMIN_A");
    inject.offAuditFails = 1;
    const outcome = await setModule(admin, "ALUMNI", false).catch((error: unknown) => error);
    expect(inject.offAuditFails).toBe(0);
    expect(await moduleRow(ids.asha!, "ALUMNI")).toEqual(kept);
    expect(await enabledModules(ids.asha)).toContain("ALUMNI");
    expect(await alumniFeedMode(ids.asha!)).toBe("READ");
    expect((await switches(ids.asha!)).length).toBe(before);
    // Refused rather than reported done: the admin's page says "Something went wrong. Please try again." and the door answers 500.
    expect(outcome).toBeInstanceOf(Error);

    // The next switch-off, written, keeps them as any other does.
    await adminSwitch("ADMIN_A", false, ["ALUMNI"]);
    await adminSwitch("ADMIN_A", true, ["ALUMNI"]);
    expect(await settingsAt("asha")).toEqual(s);
  });

  it("the safety centre's trail never prints the settings a switch-off keeps", async () => {
    await ensureOn(ids.asha!);
    await choose(chosen(2039, 2.75, "POST", true));
    await adminSwitch("ADMIN_A", false, ["TRANSPORT", "PLACEMENT"]);
    await adminSwitch("ADMIN_A", true, ["TRANSPORT", "PLACEMENT"]);
    await operatorSwitch(ids.asha!, false, ["ALUMNI"]);
    await operatorSwitch(ids.asha!, true, ["ALUMNI"]);
    // The rows keep them, which is how the switch back finds them…
    const stored = await owner.auditLog.findMany({ where: { schoolId: ids.asha, action: "school.module.off" }, select: { meta: true } });
    expect(stored.some((r) => r.meta.includes("showDriverToParents"))).toBe(true);
    expect(stored.some((r) => r.meta.includes("dreamRatio"))).toBe(true);
    // …and the trail the web's audit table and GET /api/v1/admin/safety print (listAudit) shows who switched what.
    const trail = await listAudit(await as("ADMIN_A"), { action: "school.module.off" });
    expect(trail.map((e) => e.meta.module)).toEqual(expect.arrayContaining(["TRANSPORT", "PLACEMENT", "ALUMNI"]));
    for (const entry of trail) expect(Object.keys(entry.meta).filter((key) => key !== "module" && key !== "byOperator")).toEqual([]);
  });
});
