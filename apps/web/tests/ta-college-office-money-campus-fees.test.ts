/**
 * A term's route fees and a month's mess bill: findings TA-049 and TA-296 of the testing analysis of 13 November
 * 2026, held by cases that FAIL while the defect stands and pass once it is fixed.
 *
 *   TA-049  raiseRouteFees counted a seat that starts after the term's due date, so a seat booked ahead was charged
 *           a term not ridden, and a route change booked ahead charged the term on both routes.
 *   TA-296  billMess took any two digits for the month: "2026-13" rolled over to January 2027 and billed every
 *           boarder for a month that does not exist.
 *
 * One scratch ZZ college of this suite's own (its stamp in every name and address), made through the owner
 * connection and removed in afterAll.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import type { ActiveContext } from "@/lib/session";
import { billMess, raiseRouteFees } from "@/lib/college-fees";

const db = new PrismaClient();
const STAMP = Date.now();
const SUFFIX = String(STAMP).slice(-6);
const MAIL = (who: string) => `zz-ta-com-cf-${who}-${STAMP}@test.invalid`;
const ids: Record<string, string> = {};

function accounts(): ActiveContext {
  return {
    sessionId: "zz-ta-com-cf",
    membershipId: ids.accountsM!,
    schoolId: ids.college!,
    role: "ACCOUNTS",
    user: {
      id: ids.accounts!, name: "ZZ COM CF accounts", preferredName: null, email: null, avatarKey: null, isMinor: false, isSuperuser: false, isAppAdmin: false,
      prefs: { theme: "system", contrast: "normal", font: "default", motion: "full", locale: "en", channels: { push: false, email: false }, quietHours: null },
    },
  };
}

async function refusal(p: Promise<unknown>): Promise<string> {
  try {
    await p;
    return "went through";
  } catch (e) {
    return (e as { key?: string }).key ?? String(e);
  }
}

beforeAll(async () => {
  ids.college = (await db.school.create({ data: { name: `ZZ TA-COM Campus ${STAMP}`, slug: `zz-ta-com-cf-${STAMP}`, code: `ZZCF${SUFFIX}`, contactEmail: MAIL("office"), timezone: "Asia/Kolkata", kind: "COLLEGE", isTestFixture: true }, select: { id: true } })).id;
  await db.schoolModule.createMany({ data: ["TRANSPORT", "HOSTEL"].map((module) => ({ schoolId: ids.college!, module })) });
  ids.accounts = (await db.user.create({ data: { name: "ZZ COM CF accounts", email: MAIL("accounts"), prefs: "{}" }, select: { id: true } })).id;
  ids.accountsM = (await db.membership.create({ data: { userId: ids.accounts, schoolId: ids.college, role: "ACCOUNTS", status: "ACTIVE" }, select: { id: true } })).id;
  for (const who of ["changer", "later", "boarder"]) {
    ids[who] = (await db.user.create({ data: { name: `ZZ COM CF ${who}`, email: MAIL(who), prefs: "{}" }, select: { id: true } })).id;
    ids[`${who}M`] = (await db.membership.create({ data: { userId: ids[who]!, schoolId: ids.college, role: "STUDENT", status: "ACTIVE" }, select: { id: true } })).id;
  }
  ids.year = (await db.academicYear.create({ data: { schoolId: ids.college, name: `ZZ 2026-27 ${STAMP}`, startDate: new Date("2026-06-01T00:00:00Z"), endDate: new Date("2027-05-31T00:00:00Z"), isCurrent: true }, select: { id: true } })).id;
  await db.feeHead.create({ data: { schoolId: ids.college, name: "ZZ Bus", code: "TRN", kind: "TRANSPORT" } });
  await db.feeHead.create({ data: { schoolId: ids.college, name: "ZZ Mess", code: "MES", kind: "MESS" } });
  const route = async (key: string, fee: number) => {
    ids[key] = (await db.transportRoute.create({ data: { schoolId: ids.college!, name: `ZZ COM CF ${key}`, kind: "FIXED", feePerTermPaise: fee }, select: { id: true } })).id;
    ids[`${key}Stop`] = (await db.transportStop.create({ data: { schoolId: ids.college!, routeId: ids[key]!, order: 1, name: "ZZ Gate", lat: 18.5, lng: 73.8, morningMinute: 470, eveningMinute: 940 }, select: { id: true } })).id;
  };
  await route("routeA", 180_000);
  await route("routeB", 200_000);
  const ride = (who: string, routeKey: string, fromDateKey: string, toDateKey: string | null) => db.transportAllotment.create({ data: { schoolId: ids.college!, studentMembershipId: ids[`${who}M`]!, routeId: ids[routeKey]!, stopId: ids[`${routeKey}Stop`]!, fromDateKey, toDateKey } });
  // The changer rides A from September, and on 13 November was booked onto B from 1 January (A now ends 31 December).
  await ride("changer", "routeA", "2026-09-01", "2026-12-31");
  await ride("changer", "routeB", "2027-01-01", null);
  // The later rider's seat starts on 4 January.
  await ride("later", "routeA", "2027-01-04", null);
  ids.house = (await db.hostel.create({ data: { schoolId: ids.college, name: `ZZ COM CF House ${STAMP}`, kind: "MIXED", capacity: 2, messMonthlyPaise: 300_000 }, select: { id: true } })).id;
  const room = await db.hostelRoom.create({ data: { schoolId: ids.college, hostelId: ids.house, number: "1", beds: 2 }, select: { id: true } });
  await db.hostelAllotment.create({ data: { schoolId: ids.college, membershipId: ids.boarderM!, roomId: room.id, bed: 1, fromDate: "2026-07-01", status: "ACTIVE", activePupilKey: ids.boarderM!, activeBedKey: `${room.id}:1`, allottedByUserId: ids.accounts } });
});

afterAll(async () => {
  if (ids.college) {
    await db.auditLog.deleteMany({ where: { schoolId: ids.college } });
    await db.school.deleteMany({ where: { id: ids.college } });
  }
  await db.user.deleteMany({ where: { email: { contains: `-${STAMP}@test.invalid` } } });
  await db.$disconnect();
});

describe("TA-049: a term's route fee is the seat's on the due date", () => {
  it("TA-049: a route change booked ahead raises one demand, on the route ridden on the due date; a seat from after it raises none", async () => {
    const r = await raiseRouteFees(accounts(), { termLabel: "Term 1", dueDateKey: "2026-11-30" });
    const changer = await db.feeDemand.findMany({ where: { studentMembershipId: ids.changerM, raisedKey: { startsWith: "ROUTE:" } }, select: { raisedKey: true, netPaise: true } });
    expect(changer).toEqual([{ raisedKey: `ROUTE:${ids.year}:${ids.routeA}:term 1`, netPaise: 180_000 }]);
    expect(await db.feeDemand.count({ where: { studentMembershipId: ids.laterM, raisedKey: { startsWith: "ROUTE:" } } })).toBe(0);
    expect(r).toEqual({ raised: 1, already: 0 });
  });

  it("TA-049: the next term, due after the change, is charged on the new route only, and to the later rider", async () => {
    await raiseRouteFees(accounts(), { termLabel: "Term 2", dueDateKey: "2027-01-15" });
    const changer = await db.feeDemand.findMany({ where: { studentMembershipId: ids.changerM, raisedKey: { endsWith: ":term 2" } }, select: { raisedKey: true } });
    expect(changer).toEqual([{ raisedKey: `ROUTE:${ids.year}:${ids.routeB}:term 2` }]);
    expect(await db.feeDemand.count({ where: { studentMembershipId: ids.laterM, raisedKey: `ROUTE:${ids.year}:${ids.routeA}:term 2` } })).toBe(1);
  });
});

describe("TA-296: the mess is billed for a real month", () => {
  it("TA-296: month 13 and month 00 are refused and nobody is billed for them", async () => {
    for (const month of ["2026-13", "2026-00", "2026-19"]) expect(await refusal(billMess(accounts(), { month }))).toBe("collegeOffice.refuseDates");
    expect(await db.feeDemand.count({ where: { schoolId: ids.college, raisedKey: { startsWith: "MESS:" } } })).toBe(0);
  });

  it("TA-296: a real month still bills the boarder once", async () => {
    expect(await billMess(accounts(), { month: "2026-12" })).toEqual({ billed: 1, already: 0, skipped: 0 });
  });
});
