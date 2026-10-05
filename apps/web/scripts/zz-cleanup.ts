/**
 * WHAT zz:fixtures TAKES AWAY BEFORE IT BUILDS (5 Oct 2026, risks batch), each
 * scoped by school id to the ZZ fixture schools alone, through the owner
 * connection zz-fixtures.ts already uses. Never a seed school, never a demo one:
 * a school is a ZZ fixture when its name starts "ZZ " AND its slug "zz-".
 *
 * - R-25: a register with no marks. A session is written only once a mark in
 *   the batch is valid (attendance.ts), so an empty one is a contradiction and
 *   `data:audit` fails on it ("attendance-session"); eight sat at ZZ Northgate,
 *   dated 2026-10-04, left by a walk. The empty sessions at oakfield-academy
 *   and riverside-primary-school are seed data and are not touched.
 * - R-51: the API sweep's fixed-day register at ZZ Northgate (pupil 01 PRESENT
 *   on SWEEP_REGISTER_DAY, 2020-01-08, catalog unversioned.ts). The sweep keeps
 *   writing it, the same mark every run, since a register row has no createdAt
 *   for the sweep's own clean-up to find; the fixtures take it away so it does
 *   not outlive the run that wrote it.
 */
import type { PrismaClient } from "@prisma/client";
import { SWEEP_REGISTER_DAY } from "../src/lib/api-catalog/unversioned";

/** The ZZ fixture schools: the name's prefix and the slug's, both. */
export const ZZ_SCHOOL_WHERE = { name: { startsWith: "ZZ " }, slug: { startsWith: "zz-" } } as const;
export const NORTHGATE_SLUG = "zz-northgate-school";

type Db = Pick<PrismaClient, "school" | "attendanceSession">;

/**
 * Removes every register with no marks at each ZZ fixture school, one school id at a time. `schoolIds` narrows
 * it further (a test names its own school); a named school that is not a ZZ fixture is still left alone.
 */
export async function removeEmptyRegisters(db: Db, opts: { schoolIds?: readonly string[] } = {}): Promise<{ schools: number; removed: number; bySchool: Record<string, number> }> {
  const schools = await db.school.findMany({ where: { ...ZZ_SCHOOL_WHERE, ...(opts.schoolIds ? { id: { in: [...opts.schoolIds] } } : {}) }, select: { id: true, slug: true } });
  const bySchool: Record<string, number> = {};
  let removed = 0;
  for (const s of schools) {
    const gone = await db.attendanceSession.deleteMany({ where: { schoolId: s.id, records: { none: {} } } });
    if (gone.count) bySchool[s.slug] = gone.count;
    removed += gone.count;
  }
  return { schools: schools.length, removed, bySchool };
}

/** Removes the API sweep's fixed-day register (and its one mark) at ZZ Northgate. */
export async function removeSweepRegister(db: Db): Promise<number> {
  const northgate = await db.school.findFirst({ where: { ...ZZ_SCHOOL_WHERE, slug: NORTHGATE_SLUG }, select: { id: true } });
  if (!northgate) return 0;
  return (await db.attendanceSession.deleteMany({ where: { schoolId: northgate.id, dateKey: SWEEP_REGISTER_DAY } })).count;
}
