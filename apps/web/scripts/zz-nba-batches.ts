/**
 * THE NBA SAR'S GRADUATING BATCHES AT ZZ SHASTRI (R-20, the owner's decision of
 * 10 October 2026): the success indices 4.2.1 and 4.2.2 read a seat as
 * graduated when its programme enrolment is COMPLETED and its leaving date
 * (the membership's leftAt, both written by `leaveCollege`) fell in the
 * batch's final year, and count only batches whose stipulated period ended
 * before the SAR's year. Until now no ZZ college had such a batch, so the
 * fixture's SAR printed 0 for both items and nothing exercised the rule.
 *
 * Three batches on ZZ Shastri's BTech Mechanical (four years, entry 2026 is
 * the live division zz-stream-records.ts makes):
 *   - entry 2022, the batch that completed LAST YEAR (final year 2025-26):
 *     zz.nba.grad01 graduated on 20 May 2026 (COMPLETED, in the window),
 *     zz.nba.late01 completed a year late (COMPLETED, left 10 Aug 2026: admitted,
 *     not graduated in the stipulated period), zz.nba.exit01 left in the second
 *     year (LEFT, 10 Jan 2024: exited). Admitted 3, graduated 1.
 *   - entry 2023, still running (its final year is 2026-27, the SAR's own):
 *     zz.nba.run01, ACTIVE. Not a graduating batch yet.
 * So the 2026 SAR for MECH reads 4.2.2 = 15 × 1/3 = 5 and 4.2.1 = 25 × 1/3 =
 * 8.33 (no published result stands against the graduate). Idempotent; every
 * person is a ZZ fixture (isTestFixture). KEEP IT AFTER the stream records'
 * builder, which makes the department, the programme and the scheme.
 */
import type { PrismaClient } from "@prisma/client";
import { STREAM_RECORDS_FIXTURE as F } from "../src/lib/api-catalog/stream-records-fixture";

const DOMAIN = "zz.test";

type Row = { email: string; name: string; entryYear: number; prn: string; enrolment: "COMPLETED" | "LEFT" | "ACTIVE"; leftAt: Date | null; yearOfStudy: number };

const ROWS: Row[] = [
  { email: `zz.nba.grad01@${DOMAIN}`, name: "ZZ Rohan Deshpande", entryYear: 2022, prn: "ZZS2022001", enrolment: "COMPLETED", leftAt: new Date("2026-05-20T12:00:00Z"), yearOfStudy: 4 },
  { email: `zz.nba.late01@${DOMAIN}`, name: "ZZ Aditi Kulkarni", entryYear: 2022, prn: "ZZS2022002", enrolment: "COMPLETED", leftAt: new Date("2026-08-10T12:00:00Z"), yearOfStudy: 4 },
  { email: `zz.nba.exit01@${DOMAIN}`, name: "ZZ Kiran Bhosale", entryYear: 2022, prn: "ZZS2022003", enrolment: "LEFT", leftAt: new Date("2024-01-10T12:00:00Z"), yearOfStudy: 2 },
  { email: `zz.nba.run01@${DOMAIN}`, name: "ZZ Sayali Patil", entryYear: 2023, prn: "ZZS2023001", enrolment: "ACTIVE", leftAt: null, yearOfStudy: 4 },
];

export async function buildNbaBatches(db: PrismaClient): Promise<{ batches: number; students: number } | null> {
  const shastri = await db.school.findUnique({ where: { slug: "zz-shastri-college" }, select: { id: true } });
  if (!shastri) return null;
  const t = shastri.id;
  const X = F.shastri;
  const [programme, scheme] = await Promise.all([db.programme.findUnique({ where: { id: X.programme }, select: { id: true } }), db.scheme.findUnique({ where: { id: X.scheme }, select: { id: true } })]);
  if (!programme || !scheme) return null;

  for (const row of ROWS) {
    const user = await db.user.upsert({
      where: { email: row.email },
      create: { email: row.email, name: row.name, isTestFixture: true, emailVerifiedAt: new Date(), isMinor: false, birthdate: new Date(`${row.entryYear - 18}-04-12T00:00:00Z`) },
      update: { isTestFixture: true },
      select: { id: true },
    });
    // The membership as a departure leaves it: ACTIVE with a leaving date (school-record.ts sets leftAt alone).
    const membership = await db.membership.upsert({
      where: { userId_schoolId_role: { userId: user.id, schoolId: t, role: "STUDENT" } },
      create: { userId: user.id, schoolId: t, role: "STUDENT", status: "ACTIVE", joinedAt: new Date(`${row.entryYear}-07-01T04:00:00Z`), leftAt: row.leftAt },
      update: { status: "ACTIVE", joinedAt: new Date(`${row.entryYear}-07-01T04:00:00Z`), leftAt: row.leftAt },
      select: { id: true },
    });
    const seat = { programmeId: X.programme, schemeId: X.scheme, entryYear: row.entryYear, yearOfStudy: row.yearOfStudy, semester: row.yearOfStudy * 2 - 1, divisionId: null, prn: row.prn, status: row.enrolment === "ACTIVE" ? "ACTIVE" : row.enrolment === "COMPLETED" ? "COMPLETED" : "EXITED" };
    await db.studentProgramme.upsert({ where: { studentMembershipId: membership.id }, create: { schoolId: t, studentMembershipId: membership.id, ...seat }, update: seat });
    // The enrolment, the admission record: the status leaveCollege writes (COMPLETED for a graduate, LEFT otherwise).
    await db.programmeEnrolment.upsert({
      where: { studentMembershipId_programmeId: { studentMembershipId: membership.id, programmeId: X.programme } },
      create: { schoolId: t, studentMembershipId: membership.id, programmeId: X.programme, yearOfEntry: row.entryYear, category: "OPEN", quota: "CAP", status: row.enrolment },
      update: { yearOfEntry: row.entryYear, status: row.enrolment },
    });
    await db.pupilRecord.upsert({ where: { studentMembershipId: membership.id }, create: { schoolId: t, studentMembershipId: membership.id, prn: row.prn, yearOfEntry: row.entryYear }, update: { prn: row.prn, yearOfEntry: row.entryYear } });
  }
  return { batches: new Set(ROWS.map((r) => r.entryYear)).size, students: ROWS.length };
}
