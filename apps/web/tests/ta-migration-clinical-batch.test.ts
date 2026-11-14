/**
 * TA-016's database rule (the follow-up the High fix 5507d72b left; the migration of 14 November 2026).
 *
 * The High fix made the office's re-split keep a lab batch a clinical posting names. The database itself still
 * said ON DELETE CASCADE from the batch to its postings, and from a posting to every logbook entry under it, so
 * any other delete of a batch (a script, a later feature, a hand at psql) would have taken the signed entries with
 * it. ClinicalPosting.labBatch is now ON DELETE NO ACTION: the database refuses the batch's delete while a posting
 * names it. NO ACTION and not RESTRICT, because the check then runs at the end of the statement: a school's erase,
 * which removes the batch and the posting in one statement through their own cascades from School, still goes
 * through (deleteSchoolEntirely in src/lib/superuser.ts, the operator's erase), as does a division's delete.
 *
 * A scratch ZZ college of this suite's own, made through the owner connection and removed by id.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { deleteSchoolEntirely } from "@/lib/superuser";
import type { ActiveContext } from "@/lib/session";

const db = new PrismaClient();
const STAMP = Date.now();
const TAIL = String(STAMP).slice(-6);
const MAIL = (who: string) => `zz-tamig-clin-${who}-${STAMP}@test.invalid`;
const schools: string[] = [];

type Built = { schoolId: string; divisionId: string; named: string; free: string; posting: string; entry: string };

/** A college with one division, two lab batches, and a posting of the first batch with one signed logbook entry. */
async function build(tag: string): Promise<Built> {
  const schoolId = (
    await db.school.create({
      data: { name: `ZZ TA Migration Clinical ${tag} ${STAMP}`, slug: `zz-tamig-clin-${tag}-${STAMP}`, code: `ZMC${tag.toUpperCase()}${TAIL}`, contactEmail: MAIL(`office-${tag}`), timezone: "Asia/Kolkata", kind: "COLLEGE", isTestFixture: true },
      select: { id: true },
    })
  ).id;
  schools.push(schoolId);
  const person = async (who: string, role: string) => {
    const user = await db.user.create({ data: { name: `ZZ TA Migration ${who}`, email: MAIL(`${who}-${tag}`), prefs: "{}" }, select: { id: true } });
    return (await db.membership.create({ data: { userId: user.id, schoolId, role, status: "ACTIVE" }, select: { id: true } })).id;
  };
  const supervisor = await person("supervisor", "FACULTY");
  const student = await person("student", "STUDENT");
  const dept = await db.department.create({ data: { schoolId, code: "NUR", name: "ZZ TA Nursing" }, select: { id: true } });
  const programme = await db.programme.create({ data: { schoolId, departmentId: dept.id, code: "BSCN", name: "ZZ TA BSc Nursing", level: "UG", durationYears: 4, intake: 60, regulator: "INC", stream: "HEALTH_SCIENCES" }, select: { id: true } });
  const klass = await db.class.create({ data: { schoolId, name: "ZZ TA SY Nursing A", gradeLevel: "2", subject: "BSCN", joinCode: `ZMC${tag}${TAIL}` }, select: { id: true } });
  const divisionId = (await db.division.create({ data: { schoolId, classId: klass.id, programmeId: programme.id, yearOfStudy: 2, academicYear: "2026–27" }, select: { id: true } })).id;
  const named = (await db.labBatch.create({ data: { schoolId, divisionId, name: "A" }, select: { id: true } })).id;
  const free = (await db.labBatch.create({ data: { schoolId, divisionId, name: "B" }, select: { id: true } })).id;
  const site = await db.clinicalSite.create({ data: { schoolId, name: "ZZ TA Civil Hospital", kind: "HOSPITAL", contactRole: "MEDICAL_SUPERINTENDENT" }, select: { id: true } });
  const ward = await db.clinicalDepartment.create({ data: { schoolId, siteId: site.id, name: "ZZ TA Medical ward" }, select: { id: true } });
  const posting = (await db.clinicalPosting.create({ data: { schoolId, siteId: site.id, departmentId: ward.id, divisionId, labBatchId: named, supervisorMembershipId: supervisor, fromKey: "2026-11-01", toKey: "2026-11-30" }, select: { id: true } })).id;
  const entry = (
    await db.logbookEntry.create({
      data: { schoolId, postingId: posting, studentMembershipId: student, clientId: `zz-tamig-${tag}-${STAMP}`, onKey: "2026-11-10", kind: "CASE", count: 2, note: "ZZ two admissions with fever; vitals charted.", state: "SIGNED", signedAt: new Date(), signedByMembershipId: supervisor },
      select: { id: true },
    })
  ).id;
  return { schoolId, divisionId, named, free, posting, entry };
}

const left = async (b: Built) => ({
  batch: await db.labBatch.count({ where: { id: b.named } }),
  posting: await db.clinicalPosting.count({ where: { id: b.posting } }),
  entry: await db.logbookEntry.count({ where: { id: b.entry } }),
});

let one: Built;
let two: Built;
let three: Built;

beforeAll(async () => {
  one = await build("a");
  two = await build("b");
  three = await build("c");
}, 60_000);

afterAll(async () => {
  await db.school.deleteMany({ where: { id: { in: schools } } });
  await db.user.deleteMany({ where: { email: { startsWith: "zz-tamig-clin-", endsWith: `-${STAMP}@test.invalid` } } });
  await db.$disconnect();
});

describe("TA-016: the database keeps a lab batch a clinical posting names", () => {
  it("TA-016: deleting a lab batch a clinical posting names is refused by the database, and the posting and its signed logbook entry stay", async () => {
    const outcome = await db.labBatch.delete({ where: { id: one.named } }).then(
      () => "deleted",
      (error: { code?: string }) => error.code ?? "refused",
    );
    expect(outcome).toBe("P2003");
    expect(await left(one)).toEqual({ batch: 1, posting: 1, entry: 1 });
    const posting = await db.clinicalPosting.findUniqueOrThrow({ where: { id: one.posting }, select: { labBatchId: true } });
    expect(posting.labBatchId).toBe(one.named);
  });

  it("TA-016: a lab batch no posting names is deleted as before", async () => {
    await db.labBatch.delete({ where: { id: one.free } });
    expect(await db.labBatch.count({ where: { id: one.free } })).toBe(0);
    expect(await left(one)).toEqual({ batch: 1, posting: 1, entry: 1 });
  });

  it("TA-016: once the posting is gone the batch it named can be deleted", async () => {
    await db.clinicalPosting.delete({ where: { id: two.posting } });
    await db.labBatch.delete({ where: { id: two.named } });
    expect(await left(two)).toEqual({ batch: 0, posting: 0, entry: 0 });
  });

  it("TA-016: deleting the division removes its batches and its postings together", async () => {
    await db.division.delete({ where: { id: two.divisionId } });
    expect(await db.labBatch.count({ where: { divisionId: two.divisionId } })).toBe(0);
  });

  it("TA-016: the operator's erase of the school still removes the batch, the posting and the logbook entry in one go", async () => {
    const operatorId = (await db.user.create({ data: { name: "ZZ TA Migration Operator", email: MAIL("operator"), isSuperuser: true, prefs: "{}" }, select: { id: true } })).id;
    const operator = { user: { id: operatorId, isSuperuser: true, email: MAIL("operator") } } as unknown as ActiveContext;
    const name = (await db.school.findUniqueOrThrow({ where: { id: three.schoolId }, select: { name: true } })).name;
    const erased = await deleteSchoolEntirely(operator, three.schoolId, name);
    expect(erased.ok).toBe(true);
    expect(await left(three)).toEqual({ batch: 0, posting: 0, entry: 0 });
    expect(await db.school.count({ where: { id: three.schoolId } })).toBe(0);
  });
});
