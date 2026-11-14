/**
 * The load check's verdict and its clean-up (TA-464), apart from scripts/load-check.ts (which runs at import) so
 * the suites can call them.
 *
 * The run marks every pupil of every register it loads PRESENT, and the writer upserts (src/lib/attendance.ts):
 * a record the fixture had marked ABSENT today was overwritten, a session the run started was kept, and the
 * old clean-up deleted only records whose id was new. Now the registers of the run's days are snapshot before
 * the first request and put back after the last: the sessions the run created are deleted (their records with
 * them), a record it added to an earlier session is deleted, and every record and session that was there gets
 * its status, note, client id, marking time, taker and taking time back. Audit rows stay, as audit rows do.
 */
import type { PrismaClient } from "@prisma/client";

/** A school and its own today: the registers one run may touch. */
export type RegisterDay = { schoolId: string; dateKey: string };

type SessionRow = { id: string; takenAt: Date; takenByMembershipId: string | null; finalizedAt: Date | null; note: string | null };
type RecordRow = { id: string; sessionId: string; status: string; note: string | null; clientId: string | null; markedAt: Date };
export type RegisterSnapshot = { sessions: SessionRow[]; records: RecordRow[] };

type RegisterDb = Pick<PrismaClient, "attendanceSession" | "attendanceRecord">;

export const TARGETS = { attendanceP95Ms: 300, overviewP95Ms: 800 } as const;

/** The plan's targets: attendance p95 under 300 ms, the parent overview under 800 ms, and not one error. */
export function targetsMet(attendance: { p95: number; errors: number }, overview: { p95: number; errors: number }): boolean {
  return attendance.p95 < TARGETS.attendanceP95Ms && overview.p95 < TARGETS.overviewP95Ms && attendance.errors + overview.errors === 0;
}

const sessionsOf = (days: RegisterDay[]) => ({ OR: days.map((d) => ({ schoolId: d.schoolId, dateKey: d.dateKey })) });

export async function snapshotRegisters(db: RegisterDb, days: RegisterDay[]): Promise<RegisterSnapshot> {
  if (days.length === 0) return { sessions: [], records: [] };
  const sessions = await db.attendanceSession.findMany({ where: sessionsOf(days), select: { id: true, takenAt: true, takenByMembershipId: true, finalizedAt: true, note: true } });
  const records = sessions.length
    ? await db.attendanceRecord.findMany({ where: { sessionId: { in: sessions.map((s) => s.id) } }, select: { id: true, sessionId: true, status: true, note: true, clientId: true, markedAt: true } })
    : [];
  return { sessions, records };
}

/** Puts the registers of these days back as the snapshot found them. Counts what it did. */
export async function restoreRegisters(db: RegisterDb, days: RegisterDay[], before: RegisterSnapshot): Promise<{ sessionsDeleted: number; recordsDeleted: number; recordsRestored: number; sessionsRestored: number }> {
  if (days.length === 0) return { sessionsDeleted: 0, recordsDeleted: 0, recordsRestored: 0, sessionsRestored: 0 };
  const sessionIds = before.sessions.map((s) => s.id);
  const recordIds = before.records.map((r) => r.id);
  const sessionsDeleted = (await db.attendanceSession.deleteMany({ where: { AND: [sessionsOf(days), { id: { notIn: sessionIds } }] } })).count;
  const recordsDeleted = sessionIds.length ? (await db.attendanceRecord.deleteMany({ where: { sessionId: { in: sessionIds }, id: { notIn: recordIds } } })).count : 0;
  let recordsRestored = 0;
  for (const r of before.records) {
    recordsRestored += (await db.attendanceRecord.updateMany({ where: { id: r.id, sessionId: r.sessionId }, data: { status: r.status, note: r.note, clientId: r.clientId, markedAt: r.markedAt } })).count;
  }
  let sessionsRestored = 0;
  for (const s of before.sessions) {
    sessionsRestored += (await db.attendanceSession.updateMany({ where: { id: s.id }, data: { takenAt: s.takenAt, takenByMembershipId: s.takenByMembershipId, finalizedAt: s.finalizedAt, note: s.note } })).count;
  }
  return { sessionsDeleted, recordsDeleted, recordsRestored, sessionsRestored };
}
