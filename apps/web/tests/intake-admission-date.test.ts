/**
 * CSV INTAKE AND THE ADMISSION DATE (R-61 Q1, the owner's decision of 10
 * October 2026): a row that carries no admission date writes NONE — not
 * today's — so the mid-year instalment rule (fees.ts regenerateDemands: an
 * instalment due before the admission date falls due on it) stays off for a
 * pupil the list did not date, and the office fills the day on the record.
 * A row that carries one puts it on the record, and the rule then applies.
 * The intake's summary says how many rows carried none.
 *
 * At a ZZ school of this suite's own, through admitPupils and assignPlansAs.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { admitPupils } from "@/lib/intake";
import { parseIntakeCsv } from "@/lib/csv";
import { assignPlansAs } from "@/lib/fees";
import { addDaysToKey, todayKey } from "@/lib/dates";
import type { ActiveContext } from "@/lib/session";

const db = new PrismaClient();
const STAMP = Date.now();
const SUFFIX = String(STAMP).slice(-6);
const TZ = "Asia/Kolkata";
const TODAY = todayKey(TZ);
const day = (key: string) => new Date(`${key}T00:00:00.000Z`);
const ids = { school: "", admin: "", adminMembership: "", year: "", structure: "" };

function ctx(): ActiveContext {
  return {
    sessionId: "test",
    membershipId: ids.adminMembership,
    schoolId: ids.school,
    role: "ADMIN",
    user: { id: ids.admin, name: "ZZ Intake Admin", preferredName: null, email: null, avatarKey: null, isMinor: false, isSuperuser: false, isAppAdmin: false, prefs: { theme: "system", contrast: "normal", font: "default", motion: "full", locale: "en", channels: { push: false, email: false }, quietHours: null } },
  };
}

beforeAll(async () => {
  ids.school = (await db.school.create({ data: { name: `ZZ IntakeDate ${STAMP}`, slug: `zz-intake-date-${STAMP}`, code: `ZID${SUFFIX}`, contactEmail: `zz-intake-date-${STAMP}@test.invalid`, timezone: TZ, locale: "en", verifiedAt: new Date() }, select: { id: true } })).id;
  ids.admin = (await db.user.create({ data: { name: "ZZ IntakeDate Admin", email: `zz-intake-date-admin-${STAMP}@test.invalid` }, select: { id: true } })).id;
  ids.adminMembership = (await db.membership.create({ data: { userId: ids.admin, schoolId: ids.school, role: "ADMIN", status: "ACTIVE" }, select: { id: true } })).id;
  await db.class.create({ data: { schoolId: ids.school, name: "ZZ Intake 3A", gradeLevel: "3", joinCode: `ZID3${SUFFIX}` } });
  ids.year = (await db.academicYear.create({ data: { schoolId: ids.school, name: "ZZ 2026–27", startDate: day(addDaysToKey(TODAY, -120)), endDate: day(addDaysToKey(TODAY, 240)), isCurrent: true }, select: { id: true } })).id;
  const head = await db.feeHead.create({ data: { schoolId: ids.school, name: "ZZ Tuition", code: "TUI", kind: "TUITION" }, select: { id: true } });
  ids.structure = (await db.feeStructure.create({ data: { schoolId: ids.school, academicYearId: ids.year, name: "ZZ Grade 3 fees", gradeLevel: "3", publishedAt: new Date() }, select: { id: true } })).id;
  await db.feeInstalment.create({ data: { schoolId: ids.school, structureId: ids.structure, label: "ZZ Term 1", sortOrder: 0, dueDate: day(addDaysToKey(TODAY, -80)), lines: { create: [{ schoolId: ids.school, headId: head.id, amountPaise: 15_000_00 }] } } });
  await db.feeInstalment.create({ data: { schoolId: ids.school, structureId: ids.structure, label: "ZZ Term 2", sortOrder: 1, dueDate: day(addDaysToKey(TODAY, 70)), lines: { create: [{ schoolId: ids.school, headId: head.id, amountPaise: 12_500_00 }] } } });
});

afterAll(async () => {
  await db.school.delete({ where: { id: ids.school } }).catch(() => undefined);
  await db.user.deleteMany({ where: { OR: [{ email: { contains: `-${STAMP}@test.invalid` } }, { name: { startsWith: `ZZ IntakeDate ${SUFFIX}` } }] } });
  await db.$disconnect();
});

describe("a row without an admission date writes none (R-61 Q1)", () => {
  it("leaves the record's admission date null (no record at all without a PEN), counts the row in the summary, and the fee plan keeps the structure's days", async () => {
    const csv = `name,date of birth,class,admission date\nZZ IntakeDate ${SUFFIX} Undated,14/06/2019,ZZ Intake 3A,\nZZ IntakeDate ${SUFFIX} Dated,02/11/2019,ZZ Intake 3A,${addDaysToKey(TODAY, -10).split("-").reverse().join("/")}\n`;
    const parsed = parseIntakeCsv(csv, TODAY);
    expect(parsed.problems).toEqual([]);
    expect(parsed.valid.map((r) => r.admissionDateKey)).toEqual([null, addDaysToKey(TODAY, -10)]);

    const result = await admitPupils(ctx(), parsed.valid, { locale: "en" });
    expect(result.admitted).toBe(2);
    expect(result.withoutAdmissionDate).toBe(1);

    const undated = await db.membership.findFirstOrThrow({ where: { schoolId: ids.school, role: "STUDENT", user: { name: `ZZ IntakeDate ${SUFFIX} Undated` } }, select: { id: true, pupilRecord: { select: { admissionDate: true } } } });
    const dated = await db.membership.findFirstOrThrow({ where: { schoolId: ids.school, role: "STUDENT", user: { name: `ZZ IntakeDate ${SUFFIX} Dated` } }, select: { id: true, pupilRecord: { select: { admissionDate: true } } } });
    expect(undated.pupilRecord?.admissionDate ?? null).toBeNull();
    expect(dated.pupilRecord?.admissionDate?.toISOString().slice(0, 10)).toBe(addDaysToKey(TODAY, -10));

    // The mid-year rule stays off for the undated pupil: Term 1 keeps its day, eighty days back; the dated pupil's Term 1 moves to their admission day.
    await assignPlansAs({ schoolId: ids.school, userId: ids.admin, role: "ADMIN", membershipId: ids.adminMembership }, { structureId: ids.structure, studentMembershipIds: [undated.id, dated.id] });
    const days = async (id: string) => (await db.feeDemand.findMany({ where: { studentMembershipId: id }, orderBy: { dueDate: "asc" }, select: { dueDate: true } })).map((d) => d.dueDate.toISOString().slice(0, 10));
    expect(await days(undated.id)).toEqual([addDaysToKey(TODAY, -80), addDaysToKey(TODAY, 70)]);
    expect(await days(dated.id)).toEqual([addDaysToKey(TODAY, -10), addDaysToKey(TODAY, 70)]);
  }, 30_000);

  it("an unreadable or future admission date is a problem on the row, as a date of birth is", () => {
    const bad = parseIntakeCsv(`name,admission date\nZZ Someone,31/02/2026\n`, TODAY);
    expect(bad.valid).toEqual([]);
    expect(bad.problems[0]).toMatchObject({ reasonKey: "intake.badDate" });
    const ahead = parseIntakeCsv(`name,admission date\nZZ Someone,${addDaysToKey(TODAY, 5).split("-").reverse().join("/")}\n`, TODAY);
    expect(ahead.valid).toEqual([]);
    expect(ahead.problems[0]).toMatchObject({ reasonKey: "intake.dateInFuture" });
  });
});
