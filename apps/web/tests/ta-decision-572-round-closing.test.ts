/**
 * The owner's decision on TA-572 of the testing analysis of 13 November 2026 (14 November 2026): a college's
 * admission round honours its closing day. Held by cases that FAIL while the defect stands and pass once the
 * decision is built.
 *
 *   TA-572  An admission round never closed: createApplication refused only on the stored status, which nothing
 *           ever set to CLOSED, and importAllotments read neither the status nor the dates, so a merit round that
 *           closed on 15 August still took typed applications and a CAP round that closed on 5 July still took
 *           the CET Cell's list. Now, after the closing day by the college's own calendar (the day the office
 *           typed, not the stored 23:59 UTC instant), no new list and no new typed application; a row already
 *           imported still becomes an application; Open or Closed is worked out from the closing day whenever a
 *           round is read, the stored status not relied on; and the office extends a round through a dates-only
 *           door that never retypes the seat table.
 *
 * One scratch ZZ college of this suite's own (its stamp in every name and address), made through the owner
 * connection and removed in afterAll.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import type { ActiveContext } from "@/lib/session";
import { createSession } from "@/lib/session";
import { __resetCookies, __setHeaders } from "../tests/stubs/next-headers";
import { createApplication, importAllotments, listRounds, roundStatusOn, saveRoundDates } from "@/lib/college-admissions";
import { addDaysToKey, todayKey } from "@/lib/dates";

const db = new PrismaClient();
const STAMP = Date.now();
const SUFFIX = String(STAMP).slice(-6);
const MAIL = (who: string) => `zz-ta-572-${who}-${STAMP}@test.invalid`;
const ZONE = "Asia/Kolkata";
const TODAY = todayKey(ZONE);
const YESTERDAY = addDaysToKey(TODAY, -1);
const ids: Record<string, string> = {};
const SHEET = (prefix: string) => ["Sr. No.,Application ID,Name,Gender,Category,Seat Type,Choice Code,Merit No", `1,${prefix}0001,ZZ Asha Rao,F,OPEN,GOPENS,BSCPHY,101`, `2,${prefix}0002,ZZ Vikram Pai,M,OBC,GOBCS,BSCPHY,140`].join("\n");

function ctxOf(who: "admin" | "principal"): ActiveContext {
  return {
    sessionId: `zz-ta-572-${who}`,
    membershipId: ids[`${who}M`]!,
    schoolId: ids.college!,
    role: who === "admin" ? "ADMIN" : "PRINCIPAL",
    user: {
      id: ids[who]!, name: `ZZ 572 ${who}`, preferredName: null, email: null, avatarKey: null, isMinor: false, isSuperuser: false, isAppAdmin: false,
      prefs: { theme: "system", contrast: "normal", font: "default", motion: "full", locale: "en", channels: { push: false, email: false }, quietHours: null },
    },
  };
}
const admin = () => ctxOf("admin");

/** A round as saveRound stores it: the opening day at 00:00 UTC, the closing day at 23:59:59 UTC. */
async function round(kind: string, opensOn: string, closesOn: string, extra: { status?: string; seatsJson?: string } = {}): Promise<string> {
  return (
    await db.admissionRound.create({
      data: { schoolId: ids.college!, programmeId: ids.programme!, intakeYear: 2026, kind, name: `ZZ 572 ${kind} ${closesOn} ${Math.random().toString(36).slice(2, 8)}`, opensAt: new Date(`${opensOn}T00:00:00Z`), closesAt: new Date(`${closesOn}T23:59:59Z`), seatsJson: extra.seatsJson ?? "{}", ...(extra.status ? { status: extra.status } : {}) },
      select: { id: true },
    })
  ).id;
}

const typed = (roundId: string, name: string) => ({ roundId, programmeId: ids.programme!, applicantName: name, category: "OPEN" as const, quota: "INSTITUTE" as const });

async function refusal(p: Promise<unknown>): Promise<string> {
  try {
    await p;
    return "went through";
  } catch (e) {
    return (e as { key?: string }).key ?? String(e);
  }
}

const json = (path: string, body: unknown) => new Request(`http://localhost${path}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
const params = (roundId: string) => ({ params: Promise.resolve({ roundId }) });
async function as(who: "admin" | "principal") {
  __resetCookies();
  __setHeaders({});
  await createSession(ids[who]!, { schoolId: ids.college!, role: (who === "admin" ? "ADMIN" : "PRINCIPAL") as never });
}

beforeAll(async () => {
  ids.college = (await db.school.create({ data: { name: `ZZ TA-572 College ${STAMP}`, slug: `zz-ta-572-${STAMP}`, code: `ZZ72${SUFFIX}`, contactEmail: MAIL("office"), timezone: ZONE, kind: "COLLEGE", isTestFixture: true }, select: { id: true } })).id;
  ids.other = (await db.school.create({ data: { name: `ZZ TA-572 Other ${STAMP}`, slug: `zz-ta-572-other-${STAMP}`, code: `ZZ7O${SUFFIX}`, contactEmail: MAIL("other"), timezone: ZONE, kind: "COLLEGE", isTestFixture: true }, select: { id: true } })).id;
  await db.schoolModule.createMany({ data: [{ schoolId: ids.college, module: "ADMISSIONS" }, { schoolId: ids.college, module: "ACADEMICS" }, { schoolId: ids.other, module: "ADMISSIONS" }] });
  for (const [who, role] of [["admin", "ADMIN"], ["principal", "PRINCIPAL"]] as const) {
    ids[who] = (await db.user.create({ data: { name: `ZZ 572 ${who}`, email: MAIL(who), prefs: "{}" }, select: { id: true } })).id;
    ids[`${who}M`] = (await db.membership.create({ data: { userId: ids[who]!, schoolId: ids.college, role, status: "ACTIVE" }, select: { id: true } })).id;
  }
  const dept = await db.department.create({ data: { schoolId: ids.college, code: `Z72${SUFFIX}`, name: "ZZ 572 Physics" }, select: { id: true } });
  ids.programme = (await db.programme.create({ data: { schoolId: ids.college, departmentId: dept.id, code: "BSCPHY", name: "ZZ 572 BSc Physics", level: "UG", durationYears: 3, regulator: "UGC" }, select: { id: true } })).id;
  ids.otherRound = (await db.admissionRound.create({ data: { schoolId: ids.other, intakeYear: 2026, kind: "MERIT", name: `ZZ 572 other ${STAMP}`, opensAt: new Date(`${YESTERDAY}T00:00:00Z`), closesAt: new Date(`${YESTERDAY}T23:59:59Z`) }, select: { id: true } })).id;
});

afterAll(async () => {
  __resetCookies();
  __setHeaders({});
  await db.session.deleteMany({ where: { user: { email: { contains: `-${STAMP}@test.invalid` } } } });
  for (const schoolId of [ids.college, ids.other].filter(Boolean)) {
    await db.auditLog.deleteMany({ where: { schoolId } });
    await db.school.deleteMany({ where: { id: schoolId } });
  }
  await db.user.deleteMany({ where: { email: { contains: `-${STAMP}@test.invalid` } } });
  await db.$disconnect();
});

describe("TA-572: a round closes after its closing day, by the college's calendar", () => {
  it("TA-572: a typed application in a merit round past its closing day is refused, and no row is made", async () => {
    const r = await round("MERIT", "2026-06-01", YESTERDAY);
    expect(await refusal(createApplication(admin(), typed(r, "ZZ 572 Late Typed")))).toBe("collegeOffice.refuseRoundClosedOn");
    expect(await db.collegeApplication.count({ where: { roundId: r } })).toBe(0);
  });

  it("TA-572: the CET Cell's list pasted into a CAP round past its closing day is refused, and no row is imported", async () => {
    const r = await round("CAP_1", "2026-06-01", YESTERDAY);
    expect(await refusal(importAllotments(admin(), r, SHEET(`ZZ72A${SUFFIX}`)))).toBe("collegeOffice.refuseRoundClosedOn");
    expect(await db.capAllotment.count({ where: { roundId: r } })).toBe(0);
  });

  it("TA-572: the closing day itself is still open, for a list and for a typed application", async () => {
    const cap = await round("CAP_1", "2026-06-01", TODAY);
    expect((await importAllotments(admin(), cap, SHEET(`ZZ72B${SUFFIX}`))).added).toBe(2);
    const merit = await round("MERIT", "2026-06-01", TODAY);
    expect((await createApplication(admin(), typed(merit, "ZZ 572 On The Day"))).applicantName).toBe("ZZ 572 On The Day");
  });

  it("TA-572: a row already imported still becomes an application after the round has closed, with no end date", async () => {
    const r = await round("CAP_1", "2026-06-01", TODAY);
    await importAllotments(admin(), r, SHEET(`ZZ72C${SUFFIX}`));
    // The closing day moves into the past (a month back), and the stored status says CLOSED: neither strands the row.
    await db.admissionRound.update({ where: { id: r }, data: { closesAt: new Date(`${addDaysToKey(TODAY, -30)}T23:59:59Z`), status: "CLOSED" } });
    const row = await db.capAllotment.findFirstOrThrow({ where: { roundId: r, cetApplicationId: `ZZ72C${SUFFIX}0001` }, select: { id: true } });
    const app = await createApplication(admin(), { roundId: r, capAllotmentId: row.id });
    expect(app.roundId).toBe(r);
    expect(await db.collegeApplication.count({ where: { roundId: r, capAllotmentId: row.id } })).toBe(1);
  });

  it("TA-572: Open or Closed is worked out from the closing day when read; the stored status is not relied on", async () => {
    const past = await round("MERIT", "2026-06-01", YESTERDAY);
    const ahead = await round("MERIT", "2026-06-01", addDaysToKey(TODAY, 10), { status: "CLOSED" });
    const { rounds } = await listRounds(admin());
    expect(rounds.find((x) => x.id === past)?.status).toBe("CLOSED");
    expect(rounds.find((x) => x.id === ahead)?.status).toBe("OPEN");
    // A round read OPEN takes a typed application whatever its stored status says.
    expect((await createApplication(admin(), typed(ahead, "ZZ 572 Stored Closed"))).applicantName).toBe("ZZ 572 Stored Closed");
  });

  it("TA-572: the closing day is the college's day, not the stored 23:59 UTC instant", () => {
    // 02:00 on 16 August in India is 20:30 on 15 August UTC: the stored instant (15 August 23:59:59 UTC) has not
    // passed, but the college's closing day has.
    const closesAt = new Date("2026-08-15T23:59:59Z");
    const at = new Date("2026-08-15T20:30:00Z");
    expect(todayKey(ZONE, at)).toBe("2026-08-16");
    expect(roundStatusOn(closesAt, todayKey(ZONE, at))).toBe("CLOSED");
    expect(roundStatusOn(closesAt, "2026-08-15")).toBe("OPEN");
    expect(roundStatusOn(closesAt, "2026-06-01")).toBe("OPEN");
  });

  it("TA-572: entries before the opening day are not refused", async () => {
    const r = await round("MERIT", addDaysToKey(TODAY, 5), addDaysToKey(TODAY, 20));
    expect((await createApplication(admin(), typed(r, "ZZ 572 Early"))).applicantName).toBe("ZZ 572 Early");
  });
});

describe("TA-572: the office extends a round by changing only its dates", () => {
  it("TA-572: a dates-only change reopens a closed round and keeps the seat table, the programme and the name, with its audit row", async () => {
    const seatsJson = JSON.stringify({ OPEN: 7, OBC: 3 });
    const r = await round("MERIT", "2026-06-01", YESTERDAY, { seatsJson });
    const before = await db.admissionRound.findUniqueOrThrow({ where: { id: r }, select: { name: true, programmeId: true, kind: true, intakeYear: true } });
    const newClose = addDaysToKey(TODAY, 14);
    const view = await saveRoundDates(admin(), r, { opensOn: "2026-06-01", closesOn: newClose });
    expect(view).toMatchObject({ id: r, status: "OPEN", seats: { OPEN: 7, OBC: 3 } });
    const after = await db.admissionRound.findUniqueOrThrow({ where: { id: r }, select: { name: true, programmeId: true, kind: true, intakeYear: true, seatsJson: true, closesAt: true, opensAt: true } });
    expect(after).toMatchObject({ ...before, seatsJson });
    expect(after.closesAt.toISOString()).toBe(`${newClose}T23:59:59.000Z`);
    expect(after.opensAt.toISOString()).toBe("2026-06-01T00:00:00.000Z");
    const rows = await db.auditLog.findMany({ where: { schoolId: ids.college, action: "college.admissions.roundDates", targetId: r }, select: { meta: true, actorUserId: true } });
    expect(rows).toHaveLength(1);
    expect(rows[0]!.actorUserId).toBe(ids.admin);
    expect(JSON.parse(rows[0]!.meta ?? "{}")).toMatchObject({ closesOnBefore: YESTERDAY, closesOn: newClose });
    // Open again: a typed application goes through.
    expect((await createApplication(admin(), typed(r, "ZZ 572 Extended"))).applicantName).toBe("ZZ 572 Extended");
    // The same dates again change nothing and write no second row.
    await saveRoundDates(admin(), r, { opensOn: "2026-06-01", closesOn: newClose });
    expect(await db.auditLog.count({ where: { schoolId: ids.college, action: "college.admissions.roundDates", targetId: r } })).toBe(1);
  });

  it("TA-572: moving the closing day to yesterday closes a round; a closing day before the opening day is refused", async () => {
    const r = await round("MERIT", "2026-06-01", addDaysToKey(TODAY, 30));
    expect((await saveRoundDates(admin(), r, { opensOn: "2026-06-01", closesOn: YESTERDAY })).status).toBe("CLOSED");
    expect(await refusal(createApplication(admin(), typed(r, "ZZ 572 After Close")))).toBe("collegeOffice.refuseRoundClosedOn");
    expect(await refusal(saveRoundDates(admin(), r, { opensOn: "2026-06-10", closesOn: "2026-06-01" }))).toBe("collegeOffice.refuseDates");
  });

  it("TA-572: the dates door: the office only, the college's own round, a real day", async () => {
    const { POST } = await import("@/app/api/v1/college/admissions/rounds/[roundId]/dates/route");
    const r = await round("MERIT", "2026-06-01", YESTERDAY);
    const closesOn = addDaysToKey(TODAY, 7);
    await as("principal");
    expect((await POST(json(`/api/v1/college/admissions/rounds/${r}/dates`, { opensOn: "2026-06-01", closesOn }), params(r))).status).toBe(403);
    await as("admin");
    expect((await POST(json(`/api/v1/college/admissions/rounds/${r}/dates`, { opensOn: "2026-06-01", closesOn: "2026-02-30" }), params(r))).status).toBe(422);
    expect((await POST(json(`/api/v1/college/admissions/rounds/${r}/dates`, {}), params(r))).status).toBe(422);
    expect((await POST(json(`/api/v1/college/admissions/rounds/${ids.otherRound}/dates`, { opensOn: "2026-06-01", closesOn }), params(ids.otherRound!))).status).toBe(404);
    const res = await POST(json(`/api/v1/college/admissions/rounds/${r}/dates`, { opensOn: "2026-06-01", closesOn }), params(r));
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ id: r, status: "OPEN" });
    // The import door refuses past the closing day with the sentence that says how to extend.
    const cap = await round("CAP_1", "2026-06-01", YESTERDAY);
    const { POST: importPost } = await import("@/app/api/v1/college/admissions/rounds/[roundId]/import/route");
    const refused = await importPost(json(`/api/v1/college/admissions/rounds/${cap}/import`, { text: SHEET(`ZZ72D${SUFFIX}`) }), params(cap));
    expect(refused.status).toBe(403);
    const [y, m, d] = YESTERDAY.split("-");
    expect(((await refused.json()) as { error: string }).error).toContain(`That round closed on ${d}/${m}/${y}. To take more, change its closing date`);
  });
});
