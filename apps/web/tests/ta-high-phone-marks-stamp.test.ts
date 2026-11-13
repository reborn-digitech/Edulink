/**
 * The server's half of two High findings of the testing analysis of 13 November 2026 (batch
 * high-phone), both about POST /api/v1/marks storing a sheet as the paper's state in the order the
 * sheets arrive:
 *
 *   TA-010  An older sheet waiting in a phone's outbox is sent after a newer save and overwrites it;
 *           marks entered since are deleted (a blank is sent as null, and a null deletes the grade).
 *   TA-012  The same, through a replay (X-Edulink-Replay) of a sheet queued before the newer save.
 *
 * The grid now answers a `version` (the server's clock when it was read) and a sheet may name it as
 * `basedOn`: a pupil whose grade was written after it keeps that grade, and the answer says how many
 * entries were skipped and gives the next version. A sheet without `basedOn` is applied whole and
 * answered as before.
 *
 * One scratch ZZ school of this suite's own (made through the owner connection, removed after): a
 * class teacher, a class of two pupils, one paper.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { marksGridSchema, marksSavedSchema } from "@edulink/contracts";
import { createSession } from "@/lib/session";
import { __resetCookies, __setHeaders } from "../tests/stubs/next-headers";
import { POST as marksPost } from "@/app/api/v1/marks/route";
import { GET as gridGet } from "@/app/api/v1/staff/exams/grid/route";

const db = new PrismaClient();
const STAMP = Date.now();
const TAIL = String(STAMP).slice(-6);
const MAIL = (who: string) => `zz-tahp-${who}-${STAMP}@test.invalid`;
const ids: Record<string, string> = {};

const post = (body: unknown) => new Request("http://localhost/api/v1/marks", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
const tick = () => new Promise((resolve) => setTimeout(resolve, 5));

async function readGrid() {
  const res = await gridGet(new Request(`http://localhost/api/v1/staff/exams/grid?classId=${ids.class}&slotId=${ids.slot}`));
  expect(res.status).toBe(200);
  return marksGridSchema.parse(await res.json());
}
async function save(body: Record<string, unknown>) {
  const res = await marksPost(post({ slotId: ids.slot, classId: ids.class, ...body }));
  expect(res.status).toBe(200);
  return (await res.json()) as Record<string, unknown>;
}
async function held(): Promise<Record<string, number | null>> {
  const grades = await db.grade.findMany({ where: { assignment: { examSlotId: ids.slot, classId: ids.class } }, select: { studentMembershipId: true, scoreMilli: true } });
  const by = new Map(grades.map((g) => [g.studentMembershipId, g.scoreMilli === null ? null : g.scoreMilli / 1000]));
  return { pupil1: by.get(ids.p1M!) ?? null, pupil2: by.get(ids.p2M!) ?? null };
}
const sheet = (p1: number | null, p2: number | null) => [
  { membershipId: ids.p1M!, marks: p1 },
  { membershipId: ids.p2M!, marks: p2 },
];

beforeAll(async () => {
  ids.school = (
    await db.school.create({
      data: { name: `ZZ TA High Phone ${STAMP}`, slug: `zz-tahp-${STAMP}`, code: `ZTHP${TAIL}`, contactEmail: MAIL("office"), timezone: "Asia/Kolkata", isTestFixture: true },
      select: { id: true },
    })
  ).id;
  const person = async (who: string, role: string) => {
    ids[who] = (await db.user.create({ data: { name: `ZZ TA High Phone ${who}`, email: MAIL(who) }, select: { id: true } })).id;
    ids[`${who}M`] = (await db.membership.create({ data: { userId: ids[who]!, schoolId: ids.school!, role, status: "ACTIVE", ...(role === "STUDENT" ? { studentCode: `ZTHP${who}${TAIL}` } : {}) }, select: { id: true } })).id;
  };
  await person("teacher", "TEACHER");
  await person("p1", "STUDENT");
  await person("p2", "STUDENT");
  ids.class = (await db.class.create({ data: { schoolId: ids.school!, name: "ZZ TA High Phone 6", gradeLevel: "6", joinCode: `ZTHP${TAIL}` }, select: { id: true } })).id;
  await db.classTeacher.create({ data: { classId: ids.class!, schoolId: ids.school!, teacherMembershipId: ids.teacherM!, role: "LEAD" } });
  for (const p of ["p1M", "p2M"]) await db.enrollment.create({ data: { classId: ids.class!, schoolId: ids.school!, studentMembershipId: ids[p]!, status: "ACTIVE" } });
  const series = await db.examSeries.create({ data: { schoolId: ids.school!, name: "ZZ TA High Phone Unit Test", gradeLevel: "6" }, select: { id: true } });
  ids.slot = (await db.examSlot.create({ data: { schoolId: ids.school!, seriesId: series.id, subject: "Mathematics", dateKey: "2026-09-01", pointsMilli: 50_000 }, select: { id: true } })).id;
  __resetCookies();
  await createSession(ids.teacher!, { schoolId: ids.school!, role: "TEACHER" });
}, 60_000);

afterAll(async () => {
  __resetCookies();
  __setHeaders({});
  await db.session.deleteMany({ where: { userId: { in: [ids.teacher!, ids.p1!, ids.p2!].filter(Boolean) } } });
  if (ids.school) await db.school.deleteMany({ where: { id: ids.school } });
  await db.user.deleteMany({ where: { email: { contains: `-${STAMP}@test.invalid` } } });
  await db.$disconnect();
});

describe("TA-010 / TA-012: an older marks sheet arriving after a newer save", () => {
  it("TA-010: the grid answers a version, and an older sheet based on an earlier one leaves the newer marks standing", async () => {
    // The phone reads the sheet (version A); the teacher types the first pupil with no signal: sheet A waits.
    const first = await readGrid();
    expect(first.version).toEqual(expect.any(String));
    const sheetA = { basedOn: first.version, entries: sheet(41, null) };
    await tick();

    // Back in signal, the whole sheet is typed and saved: sheet B goes live.
    const answerB = marksSavedSchema.parse(await save({ basedOn: first.version, entries: sheet(41, 37) }));
    expect(answerB).toMatchObject({ saved: 2, cleared: 0, skipped: 0 });
    expect(Date.parse(answerB.version!)).toBeGreaterThan(Date.parse(first.version!));
    expect(await held()).toEqual({ pupil1: 41, pupil2: 37 });
    await tick();

    // Then the outbox sends sheet A, a blank where B has 37.
    const answerA = marksSavedSchema.parse(await save(sheetA));
    expect(answerA).toMatchObject({ saved: 0, cleared: 0, skipped: 2 });
    expect(await held()).toEqual({ pupil1: 41, pupil2: 37 });
  });

  it("TA-012: a replayed sheet (X-Edulink-Replay) queued before a correction made on the web does not clear it", async () => {
    // The phone read the sheet and queued a sheet with the second pupil blank.
    const read = await readGrid();
    const queued = { basedOn: read.version, entries: sheet(41, null) };
    await tick();
    // Meanwhile the second pupil's mark is corrected to 18 (the web's form sends no basedOn: applied whole).
    expect(await save({ entries: sheet(41, 18) })).toEqual({ saved: 2, cleared: 0 });
    await tick();
    __setHeaders({ "x-edulink-replay": "1" });
    try {
      const answer = marksSavedSchema.parse(await save(queued));
      expect(answer.skipped).toBe(2);
    } finally {
      __setHeaders({});
    }
    expect(await held()).toEqual({ pupil1: 41, pupil2: 18 });
  });

  it("TA-010: the teacher's own next save, based on the last save's answer, is applied in full — blanks clear too", async () => {
    const read = await readGrid();
    const one = marksSavedSchema.parse(await save({ basedOn: read.version, entries: sheet(20, 21) }));
    expect(one).toMatchObject({ saved: 2, skipped: 0 });
    // A quick correction before the grid is read again: based on the answer, nothing is skipped.
    const two = marksSavedSchema.parse(await save({ basedOn: one.version, entries: sheet(22, null) }));
    expect(two).toMatchObject({ saved: 1, cleared: 1, skipped: 0 });
    expect(await held()).toEqual({ pupil1: 22, pupil2: null });
  });

  it("TA-010: a sheet with no basedOn (an older phone, the web's form) is applied whole and answered as before", async () => {
    expect(await save({ entries: sheet(30, 31) })).toEqual({ saved: 2, cleared: 0 });
    expect(await held()).toEqual({ pupil1: 30, pupil2: 31 });
  });

  it("TA-010: a basedOn that is not a date is refused by the contract", async () => {
    const res = await marksPost(post({ slotId: ids.slot, classId: ids.class, basedOn: "yesterday", entries: sheet(1, 1) }));
    expect(res.status).toBe(422);
    expect(await held()).toEqual({ pupil1: 30, pupil2: 31 });
  });
});
