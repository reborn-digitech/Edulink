import "server-only";
import type { PlacementRecord } from "@edulink/contracts";
import { db } from "./db";
import { cgpaHundredths } from "./exam-cell-rules";
import { attendedOf, percentOf } from "./academics-rules";

/**
 * WHAT THE PLACEMENT CELL READS OF A STUDENT'S RECORD (4 October 2026), and
 * from where — never typed by the cell, never stored by it:
 *
 *   cgpa          the exam cell's CourseResult rows of PUBLISHED result runs,
 *                 each course at its latest result (`cgpaHundredths`, the
 *                 exams module's own rule), on ten
 *   liveBacklogs  the exam cell's Backlog rows still OPEN; null (unknown) for
 *                 a student with no published result and no backlog row
 *   attendancePct the academics module's lecture register over the term in
 *                 progress (or the last one), every course together
 *   programme     the academics module's seat (StudentProgramme), and the
 *   batchYear     year of passing it implies: the year of entry plus the
 *                 programme's duration. A student who has already left and
 *                 holds an ALUMNUS row at the college without a seat is of
 *                 the batch of the year they left, as the alumni module
 *                 reckons a batch
 *   gender        the office's PupilRecord (M | F | T)
 *   category      the office's admission (ProgrammeEnrolment.category),
 *                 else the PupilRecord's
 *
 * Plain reads with the caller's binding: the cell's own college, or a
 * recruiter's count computed under the drive's college (`forSchool`) of
 * which only the number leaves.
 */
export async function placementRecords(schoolId: string, studentMembershipIds: readonly string[], today?: string): Promise<Map<string, PlacementRecord>> {
  const ids = [...new Set(studentMembershipIds)];
  const out = new Map<string, PlacementRecord>();
  if (ids.length === 0) return out;
  const term = today
    ? ((await db.academicTerm.findFirst({ where: { schoolId, startsOn: { lte: today }, endsOn: { gte: today } }, select: { id: true } })) ??
      (await db.academicTerm.findFirst({ where: { schoolId, startsOn: { lte: today } }, orderBy: { startsOn: "desc" }, select: { id: true } })))
    : null;
  const [results, backlogs, seats, records, enrolments, marks, members] = await Promise.all([
    db.courseResult.findMany({
      where: { schoolId, studentMembershipId: { in: ids }, run: { status: "PUBLISHED" } },
      select: { studentMembershipId: true, courseId: true, creditsTenths: true, pointsTenths: true, run: { select: { publishedAt: true, computedAt: true } } },
    }),
    db.backlog.groupBy({ by: ["studentMembershipId"], where: { schoolId, studentMembershipId: { in: ids }, status: "OPEN" }, _count: { _all: true } }),
    db.studentProgramme.findMany({ where: { schoolId, studentMembershipId: { in: ids } }, select: { studentMembershipId: true, programmeId: true, entryYear: true, programme: { select: { name: true, durationYears: true } } } }),
    db.pupilRecord.findMany({ where: { schoolId, studentMembershipId: { in: ids } }, select: { studentMembershipId: true, gender: true, category: true } }),
    db.programmeEnrolment.findMany({ where: { schoolId, studentMembershipId: { in: ids } }, orderBy: { createdAt: "desc" }, select: { studentMembershipId: true, category: true, programmeId: true, yearOfEntry: true } }),
    term
      ? db.lectureAttendance.findMany({ where: { schoolId, studentMembershipId: { in: ids }, lecture: { cancelledAt: null, offering: { termId: term.id } } }, select: { studentMembershipId: true, status: true } })
      : Promise.resolve([] as { studentMembershipId: string; status: string }[]),
    db.membership.findMany({ where: { id: { in: ids } }, select: { id: true, userId: true, leftAt: true } }),
  ]);
  // A student who has left without a seat: the year of the ALUMNUS row at this college.
  const leftUsers = members.filter((m) => m.leftAt).map((m) => m.userId);
  const alumni = leftUsers.length
    ? await db.membership.findMany({ where: { schoolId, role: "ALUMNUS", userId: { in: leftUsers } }, select: { userId: true, joinedAt: true } })
    : [];
  const leftYear = new Map(alumni.map((a) => [a.userId, a.joinedAt.getUTCFullYear()]));

  const byStudent = new Map<string, { courseId: string; creditsTenths: number; pointsTenths: number; at: number }[]>();
  for (const r of results) {
    const list = byStudent.get(r.studentMembershipId) ?? [];
    list.push({ courseId: r.courseId, creditsTenths: r.creditsTenths, pointsTenths: r.pointsTenths, at: (r.run.publishedAt ?? r.run.computedAt).getTime() });
    byStudent.set(r.studentMembershipId, list);
  }
  const backlogCount = new Map(backlogs.map((b) => [b.studentMembershipId, b._count._all]));
  const seatOf = new Map(seats.map((s) => [s.studentMembershipId, s]));
  const recordOf = new Map(records.map((r) => [r.studentMembershipId, r]));
  const enrolmentOf = new Map<string, (typeof enrolments)[number]>();
  for (const e of enrolments) if (!enrolmentOf.has(e.studentMembershipId)) enrolmentOf.set(e.studentMembershipId, e);
  const marksOf = new Map<string, string[]>();
  for (const m of marks) marksOf.set(m.studentMembershipId, [...(marksOf.get(m.studentMembershipId) ?? []), m.status]);
  const memberOf = new Map(members.map((m) => [m.id, m]));

  for (const id of ids) {
    const rows = byStudent.get(id) ?? [];
    const cgpa = rows.length ? cgpaHundredths(rows) : null;
    const seat = seatOf.get(id);
    const rec = recordOf.get(id);
    const enrol = enrolmentOf.get(id);
    const held = marksOf.get(id);
    const att = held && held.length ? attendedOf(held) : null;
    const member = memberOf.get(id);
    const gender = rec?.gender && ["M", "F", "T"].includes(rec.gender) ? (rec.gender as "M" | "F" | "T") : null;
    out.set(id, {
      cgpa: cgpa === null ? null : cgpa / 100,
      // No published result and no backlog row is no exam record, not "none open" (TA-087): unknown, which no rule passes.
      liveBacklogs: rows.length === 0 && !backlogCount.has(id) ? null : (backlogCount.get(id) ?? 0),
      attendancePct: att ? percentOf(att.attended, att.held) : null,
      programmeId: seat?.programmeId ?? enrol?.programmeId ?? null,
      programmeName: seat?.programme.name ?? null,
      batchYear: seat ? seat.entryYear + seat.programme.durationYears : member ? (leftYear.get(member.userId) ?? null) : null,
      gender,
      category: enrol?.category ?? rec?.category ?? null,
    });
  }
  return out;
}

/** An empty record, for a student whose college has none of these rows yet. */
export const EMPTY_RECORD: PlacementRecord = { cgpa: null, liveBacklogs: null, attendancePct: null, programmeId: null, programmeName: null, batchYear: null, gender: null, category: null };

/**
 * The students of one batch (the year of passing) at a college, as STUDENT
 * membership ids whether or not they are still on the roll: those whose
 * seat's year of entry plus the programme's duration is the batch and who
 * reached its final year without leaving (TA-089), and —
 * for a college that kept no seat for them — those who left in that year
 * and hold an ALUMNUS row. N in NBA's placement index.
 */
export async function batchStudents(schoolId: string, batchYear: number): Promise<{ id: string; programmeId: string | null; programmeName: string | null; category: string | null }[]> {
  const seats = await db.studentProgramme.findMany({ where: { schoolId }, select: { studentMembershipId: true, programmeId: true, entryYear: true, programme: { select: { name: true, durationYears: true } }, student: { select: { leftAt: true } } } });
  // N is the batch's FINAL-YEAR students (TA-089): a seat whose student left before the final academic year began
  // (1 June of the year before passing, NBA's window as council-filings.ts reads it), or whose admission was closed
  // as LEFT or CANCELLED (a transfer or a drop-out; a graduate's is COMPLETED), is no final-year student. The seat
  // itself stays ACTIVE when a student leaves, so the leaving is read where the office records it.
  const finalYearFrom = new Date(Date.UTC(batchYear - 1, 5, 1));
  const ofBatch = seats.filter((s) => s.entryYear + s.programme.durationYears === batchYear);
  const closed = ofBatch.length
    ? await db.programmeEnrolment.findMany({ where: { schoolId, studentMembershipId: { in: ofBatch.map((s) => s.studentMembershipId) }, status: { in: ["LEFT", "CANCELLED"] } }, select: { studentMembershipId: true, programmeId: true } })
    : [];
  const closedSeat = new Set(closed.map((e) => `${e.studentMembershipId}|${e.programmeId}`));
  const inBatch = ofBatch.filter((s) => !(s.student.leftAt && s.student.leftAt < finalYearFrom) && !closedSeat.has(`${s.studentMembershipId}|${s.programmeId}`));
  const seated = new Set(seats.map((s) => s.studentMembershipId));
  const from = new Date(Date.UTC(batchYear, 0, 1));
  const to = new Date(Date.UTC(batchYear + 1, 0, 1));
  const alumni = await db.membership.findMany({ where: { schoolId, role: "ALUMNUS", joinedAt: { gte: from, lt: to } }, select: { userId: true } });
  const leavers = alumni.length
    ? await db.membership.findMany({ where: { schoolId, role: "STUDENT", userId: { in: alumni.map((a) => a.userId) }, leftAt: { not: null } }, select: { id: true } })
    : [];
  const ids = [...inBatch.map((s) => s.studentMembershipId), ...leavers.map((l) => l.id).filter((id) => !seated.has(id))];
  const enrolments = ids.length ? await db.programmeEnrolment.findMany({ where: { schoolId, studentMembershipId: { in: ids } }, select: { studentMembershipId: true, category: true } }) : [];
  const records = ids.length ? await db.pupilRecord.findMany({ where: { schoolId, studentMembershipId: { in: ids } }, select: { studentMembershipId: true, category: true } }) : [];
  const cat = new Map<string, string | null>();
  for (const r of records) cat.set(r.studentMembershipId, r.category);
  for (const e of enrolments) cat.set(e.studentMembershipId, e.category);
  const seatOf = new Map(inBatch.map((s) => [s.studentMembershipId, s]));
  return ids.map((id) => ({ id, programmeId: seatOf.get(id)?.programmeId ?? null, programmeName: seatOf.get(id)?.programme.name ?? null, category: cat.get(id) ?? null }));
}
