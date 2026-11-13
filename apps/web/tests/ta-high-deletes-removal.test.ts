/**
 * TA-015 beyond the example's two refusals: the removal's record count reaches
 * every relation the delete would cascade through, and still lets a pupil who
 * was never really here go.
 *
 *   - The schema walk: every relation to Membership marked onDelete: Cascade in
 *     prisma/schema.prisma is either one of the four counted apart, named in
 *     GOES_WITH_THE_ROW, or counted as a record; every name in the lists is a
 *     relation the schema still has; and what cascades from a row that goes with
 *     the pupil is counted too, unless it is named as going with its parent.
 *   - A mis-added pupil with only what the office set up (a class, a parent link,
 *     an unpaid bill) is still removed, the parent's account kept; so is one whose
 *     import row wrote an admission record, and one whose person page the office
 *     opened (the page logs a health-card read even when there is no card).
 *   - A library card is set up on the first loan or reservation, so it goes with
 *     the pupil, but a reservation under it is a record and refuses.
 *   - An incident refuses, and the blockers carry all five counts.
 *
 * Every row belongs to a scratch ZZ school of this suite's own (the stamp is in
 * each name, slug and address) and goes with it in afterAll.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { createSession, getSession, type ActiveContext } from "@/lib/session";
import { __resetCookies, __setHeaders } from "../tests/stubs/next-headers";
import { GOES_WITH_ITS_PARENT, GOES_WITH_THE_ROW, removalRecordProbes, removeMembership } from "@/lib/membership";
import { classCode } from "@/lib/codes";
import { healthCardFor } from "@/lib/health";

const db = new PrismaClient();
const STAMP = Date.now();
const MAIL = (who: string) => `zz-thdr-${who}-${STAMP}@test.invalid`;
const ids: Record<string, string> = {};
let schoolId = "";

const COUNTED_APART = ["AttendanceRecord.studentMembershipId", "Grade.studentMembershipId", "Submission.studentMembershipId", "ReportCard.studentMembershipId"];

/** `Model.column` of every relation to `target` that cascades, read from the schema's text. */
function cascadesTo(schema: string, target: string): { model: string; column: string }[] {
  const out: { model: string; column: string }[] = [];
  for (const block of schema.matchAll(/^model (\w+) \{([\s\S]*?)^\}/gm)) {
    for (const line of block[2]!.split("\n")) {
      const relation = new RegExp(`^\\s+\\w+\\s+${target}\\??\\s+@relation\\(([^)]*)\\)`).exec(line);
      if (!relation || !/onDelete:\s*Cascade/.test(relation[1]!)) continue;
      const column = /fields:\s*\[(\w+)\]/.exec(relation[1]!)?.[1];
      if (column) out.push({ model: block[1]!, column });
    }
  }
  return out;
}

async function as(who: string, role: string): Promise<ActiveContext> {
  __resetCookies();
  __setHeaders({});
  await createSession(ids[who]!, { schoolId, role: role as never });
  const session = await getSession();
  if (!session?.membershipId) throw new Error(`no session for ${who}`);
  return session;
}

async function person(who: string, role: string): Promise<void> {
  ids[who] = (await db.user.create({ data: { name: `ZZ TA ${who}`, email: MAIL(who), prefs: "{}" }, select: { id: true } })).id;
  ids[`${who}M`] = (await db.membership.create({ data: { userId: ids[who]!, schoolId, role, status: "ACTIVE" }, select: { id: true } })).id;
}

beforeAll(async () => {
  schoolId = (
    await db.school.create({
      data: { name: `ZZ TA Removal School ${STAMP}`, slug: `zz-thdr-${STAMP}`, code: `ZZTHDR${STAMP}`, contactEmail: MAIL("office"), timezone: "Asia/Kolkata", kind: "SCHOOL", isTestFixture: true },
      select: { id: true },
    })
  ).id;
  await person("admin", "ADMIN");
  for (const who of ["plain", "reader", "incident"]) await person(who, "STUDENT");
  ids.parent = (await db.user.create({ data: { name: "ZZ TA parent", email: MAIL("parent"), prefs: "{}" }, select: { id: true } })).id;
  const klass = await db.class.create({ data: { schoolId, name: "ZZ TA 4A", gradeLevel: "4", joinCode: classCode() }, select: { id: true } });
  const year = await db.academicYear.create({ data: { schoolId, name: "2026–27", startDate: new Date("2026-06-01T00:00:00Z"), endDate: new Date("2027-05-31T00:00:00Z"), isCurrent: true }, select: { id: true } });

  // Mis-added: a class, a parent link and the term's unpaid bill, which the fee plan raised for the whole class.
  await db.enrollment.create({ data: { schoolId, classId: klass.id, studentMembershipId: ids.plainM!, rollNumber: 1 } });
  await db.guardianship.create({ data: { parentUserId: ids.parent!, studentMembershipId: ids.plainM!, studentSchoolId: schoolId } });
  ids.demand = (await db.feeDemand.create({ data: { schoolId, studentMembershipId: ids.plainM!, academicYearId: year.id, label: "ZZ Term 1", dueDate: new Date("2026-07-01T00:00:00Z"), grossPaise: 500000, netPaise: 500000 }, select: { id: true } })).id;

  // A library card with a reservation under it.
  const title = await db.libraryTitle.create({ data: { schoolId, title: "ZZ TA Panchatantra" }, select: { id: true } });
  ids.card = (await db.libraryMember.create({ data: { schoolId, membershipId: ids.readerM!, kind: "STUDENT", cardNumber: `ZZ${STAMP}` }, select: { id: true } })).id;
  ids.reservation = (await db.libraryReservation.create({ data: { schoolId, titleId: title.id, memberId: ids.card!, placedByUserId: ids.admin! }, select: { id: true } })).id;

  // A bulk-import mis-add: the intake row carried an admission day and a GR number, so the import wrote the record.
  await person("imported", "STUDENT");
  await db.enrollment.create({ data: { schoolId, classId: klass.id, studentMembershipId: ids.importedM!, rollNumber: 2 } });
  ids.pupilRecord = (await db.pupilRecord.create({ data: { schoolId, studentMembershipId: ids.importedM!, admissionDate: new Date("2026-06-15T00:00:00Z"), admissionNumber: `ZZ${STAMP}`, updatedByUserId: ids.admin! }, select: { id: true } })).id;
  // A pupil whose person page the office opened: the page reads the health card, and a staff read is logged even with no card.
  await person("opened", "STUDENT");
  await db.enrollment.create({ data: { schoolId, classId: klass.id, studentMembershipId: ids.openedM!, rollNumber: 3 } });

  // An incident on record.
  ids.incident =(await db.incident.create({ data: { schoolId, studentMembershipId: ids.incidentM!, reportedByMembershipId: ids.adminM!, kind: "OTHER", occurredAt: new Date(), title: "ZZ TA incident", body: "ZZ TA incident body" }, select: { id: true } })).id;
});

afterAll(async () => {
  __resetCookies();
  __setHeaders({});
  const users = await db.user.findMany({ where: { email: { contains: `-${STAMP}@test.invalid` } }, select: { id: true } });
  const userIds = users.map((u) => u.id);
  await db.session.deleteMany({ where: { userId: { in: userIds } } });
  await db.notification.deleteMany({ where: { userId: { in: userIds } } });
  await db.auditLog.deleteMany({ where: { OR: [{ schoolId }, { actorUserId: { in: userIds } }] } });
  await db.school.deleteMany({ where: { id: schoolId } });
  await db.user.deleteMany({ where: { email: { contains: `-${STAMP}@test.invalid` } } });
  await db.$disconnect();
});

describe("TA-015: what a removal counts, against the schema", () => {
  it("TA-015: every relation to Membership that cascades is counted apart, goes with the row, or is counted as a record", async () => {
    const schema = await readFile(join(process.cwd(), "prisma/schema.prisma"), "utf8");
    const cascading = cascadesTo(schema, "Membership").map((r) => `${r.model}.${r.column}`);
    const probes = new Set(removalRecordProbes().map((p) => p.name));
    expect(cascading.length).toBeGreaterThan(100);
    expect(cascading.filter((name) => !COUNTED_APART.includes(name) && !GOES_WITH_THE_ROW.includes(name) && !probes.has(name))).toEqual([]);
    expect(GOES_WITH_THE_ROW.filter((name) => !cascading.includes(name))).toEqual([]);
    expect(COUNTED_APART.filter((name) => !cascading.includes(name))).toEqual([]);
  });

  it("TA-015: what cascades from a row that goes with the pupil is counted too, unless it is named as going with its parent", async () => {
    const schema = await readFile(join(process.cwd(), "prisma/schema.prisma"), "utf8");
    const probes = new Set(removalRecordProbes().map((p) => p.name));
    const children = GOES_WITH_THE_ROW.flatMap((name) => cascadesTo(schema, name.split(".")[0]!)).map((r) => `${r.model}.${r.column}`);
    expect(children).toEqual(expect.arrayContaining(["LibraryIssue.memberId", "LibraryReservation.memberId", "LibraryFine.memberId", "FeeAllocation.demandId", "QuizResponse.attemptId"]));
    expect(children.filter((name) => !GOES_WITH_ITS_PARENT.includes(name) && !probes.has(name))).toEqual([]);
    expect(GOES_WITH_ITS_PARENT.filter((name) => !children.includes(name))).toEqual([]);
  });
});

describe("TA-015: removals at a scratch school", () => {
  it("TA-015: a mis-added pupil with only a class, a parent link and an unpaid bill is still removed, the parent's account kept", async () => {
    const result = await removeMembership(await as("admin", "ADMIN"), ids.plainM!);
    expect(result).toEqual({ ok: true });
    expect({
      membership: await db.membership.count({ where: { id: ids.plainM } }),
      enrolment: await db.enrollment.count({ where: { studentMembershipId: ids.plainM } }),
      demand: await db.feeDemand.count({ where: { id: ids.demand } }),
      parent: await db.user.count({ where: { id: ids.parent } }),
    }).toEqual({ membership: 0, enrolment: 0, demand: 0, parent: 1 });
  });

  it("TA-015: a reservation under the pupil's library card refuses the removal, and the card and the reservation stay", async () => {
    const result = await removeMembership(await as("admin", "ADMIN"), ids.readerM!);
    expect(result).toMatchObject({ ok: false, errorKey: "refusal.hasRecord", blockers: { records: 1 } });
    expect({
      membership: await db.membership.count({ where: { id: ids.readerM } }),
      card: await db.libraryMember.count({ where: { id: ids.card } }),
      reservation: await db.libraryReservation.count({ where: { id: ids.reservation } }),
    }).toEqual({ membership: 1, card: 1, reservation: 1 });
  });

  it("TA-015: a bulk-import mis-add whose row wrote an admission record (the admission day, the GR number) is still removed", async () => {
    const result = await removeMembership(await as("admin", "ADMIN"), ids.importedM!);
    expect(result).toEqual({ ok: true });
    expect({
      membership: await db.membership.count({ where: { id: ids.importedM } }),
      record: await db.pupilRecord.count({ where: { id: ids.pupilRecord } }),
    }).toEqual({ membership: 0, record: 0 });
  });

  it("TA-015: a pupil whose person page the office opened (a logged health-card read, no card) is still removed", async () => {
    const admin = await as("admin", "ADMIN");
    await healthCardFor(admin, ids.openedM!);
    expect(await db.healthCardRead.count({ where: { studentMembershipId: ids.openedM } })).toBe(1);
    const result = await removeMembership(await as("admin", "ADMIN"), ids.openedM!);
    expect(result).toEqual({ ok: true });
    expect(await db.membership.count({ where: { id: ids.openedM } })).toBe(0);
  });

  it("TA-015: an incident refuses the removal, and the answer names all five counts", async () => {
    const result = await removeMembership(await as("admin", "ADMIN"), ids.incidentM!);
    expect(result.ok === false && result.blockers).toEqual({ attendance: 0, marks: 0, submissions: 0, reportCards: 0, records: 1 });
    expect(await db.incident.count({ where: { id: ids.incident } })).toBe(1);
  });
});
