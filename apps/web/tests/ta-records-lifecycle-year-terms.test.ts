/**
 * The year's close and the current term: findings TA-377 and TA-422 of the
 * testing analysis of 13 November 2026, held by cases that FAIL while the
 * defect stands and pass once it is fixed.
 *
 *   TA-377  closeAcademicYear flipped the current year in three separate
 *           statements, so a stop between them left a school with no current
 *           year and a closing year that was not closed — refused by a second
 *           press and by the reopen.
 *   TA-422  currentTerms and termsOfYear read "today" on the UTC calendar when
 *           no zone was passed, and the report-card builder (web and phone)
 *           passed none: for the first 5½ hours of a term in Kolkata the
 *           ended term was marked current.
 *
 * One scratch ZZ school per case (its stamp in every name and address), made
 * through the owner connection and removed in afterAll.
 */
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { PrismaClient } from "@prisma/client";
import type { ActiveContext } from "@/lib/session";
import { db as appDb } from "@/lib/db";
import { closeAcademicYear } from "@/lib/academic-year";
import { currentTerms } from "@/lib/terms";
import { teachingReportCards } from "@/lib/api-reads/teaching";
import { classCode } from "@/lib/codes";

const db = new PrismaClient();
const STAMP = Date.now();
const MAIL = (who: string) => `zz-ta-rl-year-${who}-${STAMP}@test.invalid`;
const ids: Record<string, string> = {};

function admin(school: string): ActiveContext {
  return {
    sessionId: "zz-ta-rl-year",
    membershipId: ids[`${school}AdminM`]!,
    schoolId: ids[school]!,
    role: "ADMIN",
    user: {
      id: ids.admin!, name: "ZZ RL Year Admin", preferredName: null, email: null, avatarKey: null, isMinor: false, isSuperuser: false, isAppAdmin: false,
      prefs: { theme: "system", contrast: "normal", font: "default", motion: "full", locale: "en", channels: { push: false, email: false }, quietHours: null },
    },
  };
}

async function school(key: string): Promise<void> {
  ids[key] = (await db.school.create({ data: { name: `ZZ TA-RL Year ${key} ${STAMP}`, slug: `zz-ta-rl-year-${key.toLowerCase()}-${STAMP}`, code: `ZZRLY${key.toUpperCase()}${STAMP}`, contactEmail: MAIL(`office-${key}`), timezone: "Asia/Kolkata", isTestFixture: true }, select: { id: true } })).id;
  ids[`${key}AdminM`] = (await db.membership.create({ data: { userId: ids.admin!, schoolId: ids[key]!, role: "ADMIN", status: "ACTIVE" }, select: { id: true } })).id;
}

beforeAll(async () => {
  ids.admin = (await db.user.create({ data: { name: "ZZ RL Year Admin", email: MAIL("admin"), prefs: "{}" }, select: { id: true } })).id;
  await school("close");
  ids.y1 = (await db.academicYear.create({ data: { schoolId: ids.close!, name: "ZZ 2026–27", startDate: new Date("2026-06-01T00:00:00Z"), endDate: new Date("2027-04-30T00:00:00Z"), isCurrent: true }, select: { id: true } })).id;
  ids.y2 = (await db.academicYear.create({ data: { schoolId: ids.close!, name: "ZZ 2027–28", startDate: new Date("2027-06-01T00:00:00Z"), endDate: new Date("2028-04-30T00:00:00Z"), isCurrent: false }, select: { id: true } })).id;

  await school("terms");
  const year = await db.academicYear.create({ data: { schoolId: ids.terms!, name: "ZZ 2026–27", startDate: new Date("2026-06-01T00:00:00Z"), endDate: new Date("2027-04-30T00:00:00Z"), isCurrent: true }, select: { id: true } });
  await db.term.create({ data: { schoolId: ids.terms!, academicYearId: year.id, name: "ZZ Term 1", startDate: new Date("2026-06-01T00:00:00Z"), endDate: new Date("2026-09-30T00:00:00Z"), position: 0 } });
  await db.term.create({ data: { schoolId: ids.terms!, academicYearId: year.id, name: "ZZ Term 2", startDate: new Date("2026-10-01T00:00:00Z"), endDate: new Date("2027-04-30T00:00:00Z"), position: 1 } });
  ids.klass = (await db.class.create({ data: { schoolId: ids.terms!, name: "ZZ RL 7", gradeLevel: "7", section: "A", joinCode: classCode() }, select: { id: true } })).id;
});

afterEach(() => {
  vi.useRealTimers();
});

afterAll(async () => {
  const schools = [ids.close, ids.terms].filter((x): x is string => Boolean(x));
  await db.auditLog.deleteMany({ where: { OR: [{ schoolId: { in: schools } }, { actorUserId: ids.admin }] } });
  await db.school.deleteMany({ where: { id: { in: schools } } });
  await db.user.deleteMany({ where: { id: ids.admin } });
  await db.$disconnect();
});

describe("TA-377: closing a year is all or nothing", () => {
  it("TA-377: a failure while the year flips leaves the closing year current and not closed, and a second press closes it", async () => {
    // The flip, made to fail once at the statement that stamps the close: inside the year's own transaction, where it belongs.
    const original = appDb.$tenantTransaction;
    let flips = 0;
    const failing = (tx: unknown) =>
      new Proxy(tx as object, {
        get(target, prop) {
          const value = (target as Record<string | symbol, unknown>)[prop];
          if (prop !== "academicYear") return typeof value === "function" ? (value as (...a: unknown[]) => unknown).bind(target) : value;
          const years = value as { update: (args: { data: { closedAt?: Date } }) => Promise<unknown> };
          return new Proxy(years, {
            get(delegate, method) {
              const fn = (delegate as unknown as Record<string | symbol, unknown>)[method];
              if (method === "update") {
                return (args: { data: { closedAt?: Date } }) => {
                  if (args.data.closedAt && flips++ === 0) return Promise.reject(new Error("ZZ the connection dropped"));
                  return years.update(args);
                };
              }
              return typeof fn === "function" ? (fn as (...a: unknown[]) => unknown).bind(delegate) : fn;
            },
          });
        },
      });
    vi.spyOn(appDb, "$tenantTransaction").mockImplementation(((work: (tx: unknown) => Promise<unknown>, opts?: { timeout?: number; maxWait?: number }) => original.call(appDb, (tx: unknown) => work(failing(tx)), opts)) as typeof original);

    let first: unknown = null;
    try {
      await closeAcademicYear(admin("close"), ids.y1!, ids.y2!);
    } catch (error) {
      first = error;
    }
    expect(flips, "the year flipped outside any transaction").toBeGreaterThan(0);
    expect(first).not.toBeNull();
    const years = await db.academicYear.findMany({ where: { schoolId: ids.close }, orderBy: { startDate: "asc" }, select: { isCurrent: true, closedAt: true } });
    expect(years.map((y) => [y.isCurrent, y.closedAt !== null])).toEqual([[true, false], [false, false]]);

    await closeAcademicYear(admin("close"), ids.y1!, ids.y2!);
    const after = await db.academicYear.findMany({ where: { schoolId: ids.close }, orderBy: { startDate: "asc" }, select: { isCurrent: true, closedAt: true } });
    expect(after.map((y) => [y.isCurrent, y.closedAt !== null])).toEqual([[false, true], [true, false]]);
  });
});

describe("TA-422: the current term is read on the school's calendar", () => {
  it("TA-422: at 00:30 on 1 October in Kolkata (19:00 UTC on 30 September) Term 2 is current, for currentTerms and the report-card builder", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-09-30T19:00:00Z"));
    const current = (await currentTerms(ids.terms!)).filter((t) => t.current).map((t) => t.name);
    const builder = await teachingReportCards(admin("terms") as Parameters<typeof teachingReportCards>[0], ids.klass!);
    expect(current).toEqual(["ZZ Term 2"]);
    expect(builder.terms.filter((t) => t.current).map((t) => t.name)).toEqual(["ZZ Term 2"]);
  });
});
