/**
 * What the desk's no-dues list costs: finding TA-085 of the testing analysis of 13 November 2026, held by a case
 * that FAILS while the defect stands and passes once it is fixed.
 *
 *   TA-085  noDuesList worked out each student's clearance one at a time, about fifteen queries a student, on every
 *           load of /accounts/no-dues: some thirty thousand for a college of two thousand.
 *
 * The Prisma operations noDuesList issues are counted (the app's `db` wrapped in a counter, as
 * tests/academics-mark-cost.test.ts does): the count for thirty students is the count for three. One scratch ZZ
 * college of this suite's own, made through the owner connection and removed in afterAll.
 */
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { PrismaClient } from "@prisma/client";

const counter = vi.hoisted(() => ({ ops: 0 }));

vi.mock("@/lib/db", async (importOriginal) => {
  const real = await importOriginal<typeof import("@/lib/db")>();
  type Fn = (...a: unknown[]) => unknown;
  const delegate = (d: object) =>
    new Proxy(d, {
      get(t, op) {
        const v = (t as Record<string | symbol, unknown>)[op];
        if (typeof v !== "function") return v;
        return (...a: unknown[]) => {
          counter.ops += 1;
          return (v as Fn).apply(t, a);
        };
      },
    });
  const wrap = (client: object): object =>
    new Proxy(client, {
      get(t, k) {
        const v = (t as Record<string | symbol, unknown>)[k];
        if (typeof k === "string" && !k.startsWith("$") && v && typeof v === "object") return delegate(v);
        return typeof v === "function" ? (v as Fn).bind(t) : v;
      },
    });
  return { ...real, db: wrap(real.db) };
});

const { noDuesList } = await import("@/lib/no-dues");
type Ctx = import("@/lib/session").ActiveContext;

const db = new PrismaClient();
const STAMP = Date.now();
const SUFFIX = String(STAMP).slice(-6);
const MAIL = (who: string) => `zz-ta-com-ndc-${who}-${STAMP}@test.invalid`;
const ids: Record<string, string> = {};
let made = 0;

function accounts(): Ctx {
  return {
    sessionId: "zz-ta-com-ndc",
    membershipId: ids.accountsM!,
    schoolId: ids.college!,
    role: "ACCOUNTS",
    user: {
      id: ids.accounts!, name: "ZZ COM NDC accounts", preferredName: null, email: null, avatarKey: null, isMinor: false, isSuperuser: false, isAppAdmin: false,
      prefs: { theme: "system", contrast: "normal", font: "default", motion: "full", locale: "en", channels: { push: false, email: false }, quietHours: null },
    },
  };
}

/** Students up to `total`, each owing a past-due term, so each is on the list. */
async function studentsUpTo(total: number): Promise<void> {
  for (; made < total; made += 1) {
    const u = await db.user.create({ data: { name: `ZZ COM NDC ${made}`, email: MAIL(`s${made}`), prefs: "{}" }, select: { id: true } });
    const m = await db.membership.create({ data: { userId: u.id, schoolId: ids.college!, role: "STUDENT", status: "ACTIVE" }, select: { id: true } });
    await db.feeDemand.create({ data: { schoolId: ids.college!, studentMembershipId: m.id, academicYearId: ids.year!, label: "ZZ Term 1", dueDate: new Date("2026-07-15T00:00:00Z"), grossPaise: 100_000, netPaise: 100_000, status: "OPEN", linesJson: "[]" } });
  }
}

async function cost(): Promise<{ ops: number; listed: number }> {
  counter.ops = 0;
  const r = await noDuesList(accounts(), "EXAM_FORM");
  return { ops: counter.ops, listed: r.items.length };
}

beforeAll(async () => {
  ids.college = (await db.school.create({ data: { name: `ZZ TA-COM No-dues cost ${STAMP}`, slug: `zz-ta-com-ndc-${STAMP}`, code: `ZZCC${SUFFIX}`, contactEmail: MAIL("office"), timezone: "Asia/Kolkata", kind: "COLLEGE", isTestFixture: true }, select: { id: true } })).id;
  ids.accounts = (await db.user.create({ data: { name: "ZZ COM NDC accounts", email: MAIL("accounts"), prefs: "{}" }, select: { id: true } })).id;
  ids.accountsM = (await db.membership.create({ data: { userId: ids.accounts, schoolId: ids.college, role: "ACCOUNTS", status: "ACTIVE" }, select: { id: true } })).id;
  ids.year = (await db.academicYear.create({ data: { schoolId: ids.college, name: `ZZ 2026-27 ${STAMP}`, startDate: new Date("2026-06-01T00:00:00Z"), endDate: new Date("2027-05-31T00:00:00Z"), isCurrent: true }, select: { id: true } })).id;
});

afterAll(async () => {
  if (ids.college) await db.school.deleteMany({ where: { id: ids.college } });
  await db.user.deleteMany({ where: { email: { contains: `-${STAMP}@test.invalid` } } });
  await db.$disconnect();
});

describe("TA-085: the desk's list costs the same whatever the college's size", () => {
  it("TA-085: thirty students cost the reads three do, and every one owing is listed", async () => {
    await studentsUpTo(3);
    const few = await cost();
    expect(few.listed).toBe(3);
    await studentsUpTo(30);
    const many = await cost();
    expect(many.listed).toBe(30);
    expect(many.ops).toBe(few.ops);
    expect(many.ops).toBeLessThanOrEqual(20);
  }, 120_000);
});
