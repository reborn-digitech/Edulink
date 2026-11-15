/**
 * audit() INSIDE A CALLER'S TRANSACTION (15 November 2026; ordered by the coordinating session, not a register finding).
 *
 * Handed a transaction client, audit() writes its row on that transaction (auditInTransaction) so that the row commits
 * and rolls back with the work it describes. Its failures were swallowed on that path too: the transaction branch sat
 * inside the try whose catch logs "[audit] failed to record" and answers null, while the comment above
 * auditInTransaction said the throw reached the caller's $tenantTransaction. A refused statement aborts the Postgres
 * transaction, so with the error swallowed the work's callback returned normally, Prisma sent COMMIT, Postgres
 * answered it by rolling back, with no error, and the caller was told the unit had succeeded while every write of it
 * was gone. Read on HEAD (f6922ac2) as the app role, the insert refused by a NUL character in the target id (a text
 * column refuses it, SQLSTATE 22021) and again by a null action cast past the type (23502):
 *   case 1  audit() the transaction's last statement: the transaction's promise RESOLVED (to null), the Holiday written
 *           before it was GONE, and audit() answered null, for both refusals.
 *   case 2  one more statement after it: REJECTED, with 25P02 "current transaction is aborted, commands ignored until
 *           end of transaction block" rather than the real cause; the Holiday gone; audit() answered null.
 *   case 3  no transaction: audit() answered null, nothing threw, the Holiday stood.
 * Now a failure on the transaction path reaches the caller: cases 1 and 2 reject with the insert's own error and the
 * whole unit rolls back, so the caller knows; case 3 keeps the swallow. The control case holds the ordinary day: a row
 * that can be written commits with the work.
 *
 * Every other suite connects as the OWNER (tests/setup.ts). Here src/lib/db.ts connects as the app role (DATABASE_URL
 * put back to it before anything imports db.ts), as tests/ta-plans-payments-app-role.test.ts does; fixtures are written
 * and read back through a second, owner client. When the configuration has one role the suite runs as that one and
 * its title says so: the refusals used here are a column's, not row security's, so the transaction's fate does not
 * depend on the role. Every row belongs to a scratch ZZ school of this suite's own, removed afterwards by id.
 */
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

const ENV = await vi.hoisted(async () => {
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

import { PrismaClient } from "@prisma/client";
import { db } from "@/lib/db";
import { forTenant } from "@/lib/tenant-context";
import { audit } from "@/lib/audit";

type Tx = typeof db;
type Entry = Parameters<typeof audit>[0];
type Seen = { holidayId: string | null; audited: string | null | "threw" | "not reached"; afterRan: boolean };
type Outcome = { settled: "resolved" | "rejected"; sqlState: string | null; stands: boolean; audited: Seen["audited"]; afterRan: boolean; swallowed: string[] };

const owner = new PrismaClient(ENV.admin ? { datasourceUrl: ENV.admin } : undefined);
const STAMP = Date.now();
const ACTION = `zz.audit-in-transaction.${STAMP}`;
const ids: Record<string, string> = {};

/** A NUL character: a Postgres text column refuses it (22021), and it needs no cast past the type. */
const nulTarget = (): Entry => ({ schoolId: ids.school!, action: ACTION, targetType: "Holiday", targetId: `zz-audit-tx\u0000${STAMP}` });
/** A null action, cast past the type: the column is NOT NULL (23502). */
const nullAction = (): Entry => ({ schoolId: ids.school!, action: null as unknown as string, targetType: "Holiday", targetId: `zz-audit-tx-${STAMP}` });
const good = (): Entry => ({ schoolId: ids.school!, action: ACTION, targetType: "Holiday", targetId: `zz-audit-tx-${STAMP}`, meta: { control: true } });

const bound = () => ({ schoolIds: [ids.school!], userId: null, joinCode: null, isSuperuser: false });
const holiday = (label: string) => ({ schoolId: ids.school!, name: `ZZ audit-tx ${label} ${STAMP}`, startDateKey: "2099-01-01", endDateKey: "2099-01-01" });

/** The Postgres SQLSTATE a Prisma error carries: P2010's meta for a raw query, the connector's text for a model query. */
function sqlState(error: unknown): string | null {
  const e = (error ?? {}) as { meta?: { code?: unknown }; message?: unknown };
  const code = e.meta?.code;
  if (typeof code === "string") return code;
  const text = typeof e.message === "string" ? e.message : String(error);
  return /code: "([0-9A-Z]{5})"/.exec(text)?.[1] ?? /Code: `([0-9A-Z]{5})`/.exec(text)?.[1] ?? null;
}

/** Runs `work`, then reads back, through the owner, whether the Holiday it wrote is there. */
async function run(work: (seen: Seen) => Promise<unknown>): Promise<Outcome> {
  const seen: Seen = { holidayId: null, audited: "not reached", afterRan: false };
  const spy = vi.spyOn(console, "error").mockImplementation(() => {});
  let settled: Pick<Outcome, "settled" | "sqlState">;
  try {
    await work(seen);
    settled = { settled: "resolved", sqlState: null };
  } catch (error) {
    settled = { settled: "rejected", sqlState: sqlState(error) };
  }
  const swallowed = spy.mock.calls.filter((args) => args[0] === "[audit] failed to record").map((args) => sqlState(args[2]) ?? "?");
  spy.mockRestore();
  const stands = seen.holidayId !== null && (await owner.holiday.count({ where: { id: seen.holidayId } })) === 1;
  return { ...settled, stands, audited: seen.audited, afterRan: seen.afterRan, swallowed };
}

/** A $tenantTransaction bound to the scratch school: one business write, then audit() on the transaction, then `after`. */
function inTransaction(label: string, entry: Entry, after?: (tx: Tx) => Promise<unknown>): Promise<Outcome> {
  return run((seen) =>
    forTenant(bound(), () =>
      db.$tenantTransaction(async (raw) => {
        const tx = raw as Tx;
        seen.holidayId = (await tx.holiday.create({ data: holiday(label), select: { id: true } })).id;
        try {
          seen.audited = await audit(entry, tx);
        } catch (error) {
          seen.audited = "threw";
          throw error;
        }
        if (after) {
          await after(tx);
          seen.afterRan = true;
        }
        return seen.audited;
      }),
    ),
  );
}

beforeAll(async () => {
  ids.school = (await owner.school.create({ data: { name: `ZZ Audit In Transaction ${STAMP}`, slug: `zz-audit-tx-${STAMP}`, code: `ZZAUDTX${STAMP}`, contactEmail: `zz-audit-tx-${STAMP}@test.invalid`, isTestFixture: true }, select: { id: true } })).id;
});

afterAll(async () => {
  if (ids.school) {
    await owner.holiday.deleteMany({ where: { schoolId: ids.school } });
    // AuditLog has no DELETE policy; the school's removal takes its rows by the cascade where this is refused.
    await owner.auditLog.deleteMany({ where: { schoolId: ids.school } }).catch(() => {});
    await owner.school.deleteMany({ where: { id: ids.school } });
  }
  await owner.$disconnect();
});

describe(`audit() inside a caller's transaction, ${ENV.appUser ? "as the application role" : "as the owner (the configuration has one role)"}`, () => {
  it("arrange: the app's own client is the app role, which neither owns the tables nor bypasses row security", async () => {
    const [who] = await db.$queryRaw<{ name: string; bypass: boolean; superuser: boolean }[]>`SELECT current_user::text AS name, r.rolbypassrls AS bypass, r.rolsuper AS superuser FROM pg_roles r WHERE r.rolname = current_user`;
    if (ENV.appUser) expect(who).toEqual({ name: ENV.appUser, bypass: false, superuser: false });
    else expect(who?.name).toBeTruthy();
  });

  it("control: a row that can be written commits with the work, under the school, and audit() answers its id", async () => {
    const o = await inTransaction("control", good());
    expect(o).toMatchObject({ settled: "resolved", stands: true, swallowed: [] });
    expect(typeof o.audited).toBe("string");
    expect(await owner.auditLog.findUnique({ where: { id: o.audited as string }, select: { schoolId: true, action: true, targetType: true } })).toEqual({ schoolId: ids.school, action: ACTION, targetType: "Holiday" });
  });

  it.each([
    ["a NUL character in the target id", nulTarget, "22021"],
    ["a null action cast past the type", nullAction, "23502"],
  ] as const)("case 1, %s: audit() as the transaction's last statement — the transaction rejects with the insert's own error and nothing of the unit is written", async (_label, entry, cause) => {
    const o = await inTransaction(`case1-${cause}`, entry());
    // On HEAD: { settled: "resolved", sqlState: null, stands: false, audited: null, swallowed: [cause] } — told it succeeded, the write gone.
    expect(o).toEqual({ settled: "rejected", sqlState: cause, stands: false, audited: "threw", afterRan: false, swallowed: [] });
  });

  it("case 2: with one more statement after the audit call, the rejection names the real cause, not 25P02", async () => {
    const o = await inTransaction("case2", nulTarget(), (tx) => tx.holiday.count({ where: { schoolId: ids.school! } }));
    // On HEAD: { settled: "rejected", sqlState: "25P02", stands: false, audited: null, afterRan: false, swallowed: ["22021"] }.
    expect(o).toEqual({ settled: "rejected", sqlState: "22021", stands: false, audited: "threw", afterRan: false, swallowed: [] });
  });

  it("case 3: without a transaction a failed audit row still does not fail the request — null, nothing thrown, the write stands", async () => {
    const o = await run((seen) =>
      forTenant(bound(), async () => {
        seen.holidayId = (await db.holiday.create({ data: holiday("case3"), select: { id: true } })).id;
        seen.audited = await audit(nulTarget());
      }),
    );
    expect(o).toEqual({ settled: "resolved", sqlState: null, stands: true, audited: null, afterRan: false, swallowed: ["22021"] });
  });
});
