/**
 * The no-dues clearance's accounts line: findings TA-084 and TA-310 of the testing analysis of 13 November 2026,
 * held by cases that FAIL while the defect stands and pass once it is fixed.
 *
 *   TA-084  A hand clearance was an amount, not a debt: once the waived debt was paid, a new debt no larger read as
 *           cleared in the first clerk's name for the rest of the cycle.
 *   TA-310  For an exam form the year's whole scholarship receivable, set partly against instalments not yet due,
 *           was taken off what is due, so an earlier year's arrears read as cleared.
 *
 * One scratch ZZ college of this suite's own (its stamp in every name and address), made through the owner
 * connection and removed in afterAll. Days are counted from today on the college's clock.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import type { ActiveContext } from "@/lib/session";
import { clearLine, noDuesFor } from "@/lib/no-dues";
import { addDaysToKey, todayKey } from "@/lib/dates";
import { yearKeyOf } from "@/lib/college-office";

const db = new PrismaClient();
const STAMP = Date.now();
const SUFFIX = String(STAMP).slice(-6);
const MAIL = (who: string) => `zz-ta-com-nd-${who}-${STAMP}@test.invalid`;
const TODAY = todayKey("Asia/Kolkata");
const day = (offset: number) => new Date(`${addDaysToKey(TODAY, offset)}T00:00:00Z`);
const ids: Record<string, string> = {};

function accounts(): ActiveContext {
  return {
    sessionId: "zz-ta-com-nd",
    membershipId: ids.accountsM!,
    schoolId: ids.college!,
    role: "ACCOUNTS",
    user: {
      id: ids.accounts!, name: "ZZ COM ND accounts", preferredName: null, email: null, avatarKey: null, isMinor: false, isSuperuser: false, isAppAdmin: false,
      prefs: { theme: "system", contrast: "normal", font: "default", motion: "full", locale: "en", channels: { push: false, email: false }, quietHours: null },
    },
  };
}

async function student(who: string): Promise<void> {
  ids[who] = (await db.user.create({ data: { name: `ZZ COM ND ${who}`, email: MAIL(who), prefs: "{}", isMinor: false }, select: { id: true } })).id;
  ids[`${who}M`] = (await db.membership.create({ data: { userId: ids[who]!, schoolId: ids.college!, role: "STUDENT", status: "ACTIVE" }, select: { id: true } })).id;
}

const demand = (who: string, yearId: string, label: string, dueDate: Date, paise: number) =>
  db.feeDemand.create({ data: { schoolId: ids.college!, studentMembershipId: ids[`${who}M`]!, academicYearId: yearId, label, dueDate, grossPaise: paise, netPaise: paise, status: "OPEN", linesJson: JSON.stringify([{ headId: ids.tui, code: "TUI", name: "ZZ Tuition", grossPaise: paise, concessionPaise: 0 }]) }, select: { id: true } });

beforeAll(async () => {
  ids.college = (await db.school.create({ data: { name: `ZZ TA-COM No-dues ${STAMP}`, slug: `zz-ta-com-nd-${STAMP}`, code: `ZZCN${SUFFIX}`, contactEmail: MAIL("office"), timezone: "Asia/Kolkata", kind: "COLLEGE", isTestFixture: true }, select: { id: true } })).id;
  ids.accounts = (await db.user.create({ data: { name: "ZZ COM ND accounts", email: MAIL("accounts"), prefs: "{}" }, select: { id: true } })).id;
  ids.accountsM = (await db.membership.create({ data: { userId: ids.accounts, schoolId: ids.college, role: "ACCOUNTS", status: "ACTIVE" }, select: { id: true } })).id;
  const start = day(-100);
  ids.yearKey = yearKeyOf(start);
  ids.year = (await db.academicYear.create({ data: { schoolId: ids.college, name: `ZZ now ${STAMP}`, startDate: start, endDate: day(200), isCurrent: true }, select: { id: true } })).id;
  ids.lastYear = (await db.academicYear.create({ data: { schoolId: ids.college, name: `ZZ before ${STAMP}`, startDate: day(-465), endDate: day(-101), isCurrent: false }, select: { id: true } })).id;
  ids.tui = (await db.feeHead.create({ data: { schoolId: ids.college, name: "ZZ Tuition", code: "TUI", kind: "TUITION" }, select: { id: true } })).id;
  await student("waived");
  await student("arrears");
});

afterAll(async () => {
  if (ids.college) {
    await db.auditLog.deleteMany({ where: { schoolId: ids.college } });
    await db.school.deleteMany({ where: { id: ids.college } });
  }
  await db.user.deleteMany({ where: { email: { contains: `-${STAMP}@test.invalid` } } });
  await db.$disconnect();
});

describe("TA-084: a hand clearance covers the debts it waived", () => {
  it("TA-084: once the waived term is paid, a new term of the same size reopens the line", async () => {
    const a = await demand("waived", ids.year!, "ZZ Term 1", day(-30), 5_000_000);
    expect((await noDuesFor(ids.waivedM!, "EXAM_FORM")).completed).toBe(false);
    await clearLine(accounts(), ids.waivedM!, { event: "EXAM_FORM", desk: "ACCOUNTS", note: "ZZ the trust will carry term 1" });
    expect((await noDuesFor(ids.waivedM!, "EXAM_FORM")).completed).toBe(true);
    // Part of the waived term paid: still the same debt, still cleared.
    await db.feeDemand.update({ where: { id: a.id }, data: { paidPaise: 1_000_000, status: "PART" } });
    expect((await noDuesFor(ids.waivedM!, "EXAM_FORM")).completed).toBe(true);
    // The family pays term 1; term 2, as large, falls due unpaid.
    await db.feeDemand.update({ where: { id: a.id }, data: { paidPaise: 5_000_000, status: "PAID" } });
    await demand("waived", ids.year!, "ZZ Term 2", day(-1), 5_000_000);
    const after = await noDuesFor(ids.waivedM!, "EXAM_FORM");
    expect(after.lines.find((l) => l.desk === "ACCOUNTS")).toMatchObject({ owedPaise: 5_000_000, cleared: false, clearedByUserId: null });
    expect(after.completed).toBe(false);
  });
});

describe("TA-310: the accounts line takes off only the receivable set against what it counts", () => {
  it("TA-310: last year's arrears stay owed though this year's claim covers both of this year's terms", async () => {
    await demand("arrears", ids.lastYear!, "ZZ last year", day(-200), 1_000_000);
    await demand("arrears", ids.year!, "ZZ Term 1", day(-10), 2_500_000);
    await demand("arrears", ids.year!, "ZZ Term 2", day(60), 2_500_000);
    await db.scholarshipClaim.create({ data: { schoolId: ids.college!, studentMembershipId: ids.arrearsM!, scheme: "GOI_POST_MATRIC_SC", academicYear: ids.yearKey!, expectedPaise: 5_000_000, status: "APPLIED" } });
    const form = await noDuesFor(ids.arrearsM!, "EXAM_FORM");
    expect(form.lines.find((l) => l.desk === "ACCOUNTS")).toMatchObject({ owedPaise: 1_000_000, cleared: false });
    // Leaving counts every demand, and the whole receivable is set against this year's: last year's is still owed.
    expect((await noDuesFor(ids.arrearsM!, "LEAVING")).lines.find((l) => l.desk === "ACCOUNTS")?.owedPaise).toBe(1_000_000);
  });
});
