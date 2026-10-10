/**
 * THE NBA SAR'S SUCCESS INDICES READ THE LEAVING THE OFFICE RECORDS (R-20, the
 * owner's decision of 10 October 2026; the arithmetic and NBA's clause are in
 * nbaFacts' docblock, src/lib/council-filings.ts).
 *
 * A seat counts as graduated when its programme enrolment is COMPLETED and the
 * membership's leaving date fell in the batch's final year — the two facts
 * `leaveCollege` writes with reason GRADUATED — and the SAR of year Y counts
 * only batches whose stipulated period ended before Y (LYG, LYGm1, LYGm2).
 * The seat's own status, which older fixtures set by hand, is not read.
 *
 * At a ZZ engineering college of this suite's own: a batch that completed
 * last year (one in time, one a year late, one who exited), one still running
 * in its final year, and this year's entrants. The same three batches stand on
 * ZZ Shastri (scripts/zz-nba-batches.ts); the last test reads them when the
 * fixture is there.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { nbaFacts } from "@/lib/council-filings";
import { STREAM_RECORDS_FIXTURE } from "@/lib/api-catalog/stream-records-fixture";

const db = new PrismaClient();
const STAMP = Date.now();
const SUFFIX = String(STAMP).slice(-6);
const YEAR = 2026; // the SAR of 2026-27: 1 June 2026 to 31 May 2027
const ids = { school: "", mech: "", be: "", scheme: "", running: "" };
const made: string[] = [];

async function student(who: string, entryYear: number, enrolment: "COMPLETED" | "LEFT" | "ACTIVE", leftAt: Date | null) {
  const u = await db.user.create({ data: { name: `ZZ NBA ${who}`, email: `zz-nba-${who.toLowerCase()}-${STAMP}@test.invalid` }, select: { id: true } });
  const m = await db.membership.create({ data: { userId: u.id, schoolId: ids.school, role: "STUDENT", status: "ACTIVE", leftAt }, select: { id: true } });
  made.push(m.id);
  // The seat says ACTIVE whatever happened: 4.2 must not read it.
  await db.studentProgramme.create({ data: { schoolId: ids.school, studentMembershipId: m.id, programmeId: ids.be, schemeId: ids.scheme, entryYear, status: "ACTIVE" } });
  await db.programmeEnrolment.create({ data: { schoolId: ids.school, studentMembershipId: m.id, programmeId: ids.be, yearOfEntry: entryYear, category: "OPEN", quota: "CAP", status: enrolment } });
  return m.id;
}

beforeAll(async () => {
  ids.school = (await db.school.create({ data: { name: `ZZ NBA Batches ${STAMP}`, slug: `zz-nba-batches-${STAMP}`, code: `ZNB${SUFFIX}`, contactEmail: `zz-nba-${STAMP}@test.invalid`, timezone: "Asia/Kolkata", kind: "COLLEGE", streamsJson: JSON.stringify(["ENGINEERING"]) }, select: { id: true } })).id;
  await db.schoolModule.createMany({ data: [{ schoolId: ids.school, module: "ACADEMICS" }, { schoolId: ids.school, module: "IQAC" }] });
  ids.mech = (await db.department.create({ data: { schoolId: ids.school, code: "MECH", name: "ZZ Mechanical" }, select: { id: true } })).id;
  ids.be = (await db.programme.create({ data: { schoolId: ids.school, departmentId: ids.mech, code: "BEME", name: "ZZ BE Mechanical", level: "UG", durationYears: 4, intake: 10, regulator: "AICTE", stream: "ENGINEERING" }, select: { id: true } })).id;
  ids.scheme = (await db.scheme.create({ data: { schoolId: ids.school, programmeId: ids.be, name: "ZZ BE 2022", effectiveYear: 2022 }, select: { id: true } })).id;
  // Entry 2022, final year 2025-26: graduated in time, graduated late, exited.
  await student("Grad", 2022, "COMPLETED", new Date("2026-05-20T12:00:00Z"));
  await student("Late", 2022, "COMPLETED", new Date("2026-08-10T12:00:00Z"));
  await student("Exit", 2022, "LEFT", new Date("2024-01-10T12:00:00Z"));
  // Entry 2023, in its final year during 2026-27: not a graduating batch yet.
  ids.running = await student("Run", 2023, "ACTIVE", null);
  // This year's entrants.
  await student("New1", 2026, "ACTIVE", null);
  await student("New2", 2026, "ACTIVE", null);
});

afterAll(async () => {
  await db.school.delete({ where: { id: ids.school } }).catch(() => undefined);
  await db.user.deleteMany({ where: { email: { contains: `-${STAMP}@test.invalid` } } });
  await db.$disconnect();
});

describe("4.2 reads the enrolment's COMPLETED with the leaving date", () => {
  it("counts last year's batch: one graduated in the stipulated period of three admitted; the late graduate and the exit are admitted only", async () => {
    const f = await nbaFacts(ids.school, ids.mech, YEAR);
    expect(f.batches).toEqual([{ entryYear: 2022, admitted: 3, graduated: 1, withoutBacklog: 1 }]);
    expect(f.s422.mean).toBe(0.33);
    expect(f.s422.marks).toBe(5);
    expect(f.s421.marks).toBe(8.33);
    expect(f.marks["4.2.2"]).toBe(5);
    expect(f.marks["4.2.1"]).toBe(8.33);
  }, 60_000);

  it("does not count the batch still in its final year, nor last year's batch in the SAR of the year it was still studying", async () => {
    const now = await nbaFacts(ids.school, ids.mech, YEAR);
    expect(now.batches.map((b) => b.entryYear)).not.toContain(2023);
    // In 2025-26 the 2022 batch was in its final year: it is next year's "last year graduate", not this year's.
    const earlier = await nbaFacts(ids.school, ids.mech, YEAR - 1);
    expect(earlier.batches).toEqual([]);
    expect(earlier.marks["4.2.2"]).toBe(0);
    // The running student and this year's entrants are on the roll; the graduate who left in May is not.
    expect(now.S).toBe(4);
  }, 60_000);

  it("a seat marked COMPLETED by hand with no enrolment and no leaving date is not a graduate", async () => {
    const u = await db.user.create({ data: { name: "ZZ NBA Hand", email: `zz-nba-hand-${STAMP}@test.invalid` }, select: { id: true } });
    const m = await db.membership.create({ data: { userId: u.id, schoolId: ids.school, role: "STUDENT", status: "ACTIVE" }, select: { id: true } });
    await db.studentProgramme.create({ data: { schoolId: ids.school, studentMembershipId: m.id, programmeId: ids.be, schemeId: ids.scheme, entryYear: 2022, status: "COMPLETED" } });
    const f = await nbaFacts(ids.school, ids.mech, YEAR);
    expect(f.batches).toEqual([{ entryYear: 2022, admitted: 4, graduated: 1, withoutBacklog: 1 }]);
    await db.membership.delete({ where: { id: m.id } });
  }, 60_000);

  it("ZZ Shastri's fixture batches read the same way when the fixture is there (scripts/zz-nba-batches.ts)", async () => {
    const shastri = await db.school.findUnique({ where: { slug: "zz-shastri-college" }, select: { id: true } });
    const grad = shastri ? await db.membership.findFirst({ where: { schoolId: shastri.id, user: { email: "zz.nba.grad01@zz.test" } }, select: { id: true } }) : null;
    if (!shastri || !grad) return; // the fixture is not built on this database
    const f = await nbaFacts(shastri.id, STREAM_RECORDS_FIXTURE.shastri.department, YEAR);
    expect(f.batches.find((b) => b.entryYear === 2022)).toMatchObject({ admitted: 3, graduated: 1 });
    expect(f.batches.map((b) => b.entryYear)).not.toContain(2023);
  }, 60_000);
});
