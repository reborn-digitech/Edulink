import "server-only";
import {
  academicYearWindow,
  bciMinimumWeeks,
  CORPS,
  LAW_INTERNSHIP_KINDS,
  NCTE_MIN_PRACTICE_WEEKS,
  NSS_HOURS_PER_YEAR,
  parseStreams,
  weeksBetween,
  type CorpsCode,
  type CorpsSummary,
  type LawInternshipSummary,
  type NssSummary,
  type PracticalRecordSummary,
  type TeachingPracticeSummary,
} from "@edulink/contracts";
import { db } from "./db";
import { readJsonArray } from "./json";
import { SEATED_NOW } from "./academics";

/**
 * THE STREAM RECORDS' SUMMARIES (5 October 2026), what the council filings
 * (S1's PCI inspection, BCI return, NCTE return, the NAAC's criterion 3) and
 * the registrar's home read: each a pure read of the rows for one college and
 * one academic year — the window `${year}-06-01` … `${year + 1}-05-31`, the
 * filings' own (academicYearWindow) — computed on every call and never stored.
 * No session here: the caller has already decided who may read. A college
 * with none of the rows gets zeros; nothing here throws for a stream the
 * college does not have.
 */

const round1 = (n: number) => Math.round(n * 10) / 10;
const nameOf = (u: { name: string; preferredName: string | null }) => u.preferredName ?? u.name;

async function namesOf(ids: readonly string[]): Promise<Map<string, string>> {
  const unique = [...new Set(ids)];
  if (!unique.length) return new Map();
  const rows = await db.membership.findMany({ where: { id: { in: unique } }, select: { id: true, user: { select: { name: true, preferredName: true } } } });
  return new Map(rows.map((r) => [r.id, nameOf(r.user)]));
}

/** "2026–27" and "2026-27": how a division names the year it is for. */
function yearLabels(year: number): string[] {
  const yy = String((year + 1) % 100).padStart(2, "0");
  return [`${year}–${yy}`, `${year}-${yy}`];
}

/* ------------------------------------------------------ practical record */

/** With `programmeIds` (a council's return, TA-273): only the records of offerings of those programmes' courses. */
export async function practicalRecordSummary(schoolId: string, year: number, programmeIds?: readonly string[]): Promise<PracticalRecordSummary> {
  const w = academicYearWindow(year);
  const [records, batches, batchMembers] = await Promise.all([
    db.practicalRecord.findMany({ where: { schoolId, performedOn: { gte: w.from, lte: w.to }, ...(programmeIds ? { offering: { course: { scheme: { programmeId: { in: [...programmeIds] } } } } } : {}) }, select: { offeringId: true, studentMembershipId: true, signedAt: true, offering: { select: { course: { select: { code: true, name: true } } } } } }),
    db.labBatch.count({ where: { schoolId, division: { academicYear: { in: yearLabels(year) } }, members: { some: { untilKey: null } } } }),
    db.labBatchMember.count({ where: { schoolId, untilKey: null, batch: { division: { academicYear: { in: yearLabels(year) } } } } }),
  ]);
  const byCourse = new Map<string, { courseCode: string; courseName: string; records: number; signed: number; students: Set<string> }>();
  for (const r of records) {
    const k = r.offering.course.code;
    const v = byCourse.get(k) ?? { courseCode: k, courseName: r.offering.course.name, records: 0, signed: 0, students: new Set<string>() };
    v.records += 1;
    if (r.signedAt) v.signed += 1;
    v.students.add(r.studentMembershipId);
    byCourse.set(k, v);
  }
  const signed = records.filter((r) => r.signedAt).length;
  return {
    year,
    records: records.length,
    signed,
    unsigned: records.length - signed,
    students: new Set(records.map((r) => r.studentMembershipId)).size,
    offerings: new Set(records.map((r) => r.offeringId)).size,
    batches,
    batchMembers,
    byCourse: [...byCourse.values()].sort((a, b) => a.courseCode.localeCompare(b.courseCode)).map((v) => ({ courseCode: v.courseCode, courseName: v.courseName, records: v.records, signed: v.signed, students: v.students.size })),
  };
}

/* ------------------------------------------------------ law internships */

/** The college's law programmes: those whose stream is LAW, or — at a college whose only stream is law — every programme. */
async function lawProgrammes(schoolId: string) {
  const [school, programmes] = await Promise.all([
    db.school.findUnique({ where: { id: schoolId }, select: { streamsJson: true } }),
    db.programme.findMany({ where: { schoolId }, select: { id: true, code: true, durationYears: true, stream: true } }),
  ]);
  const streams = parseStreams(school?.streamsJson);
  const law = programmes.filter((p) => p.stream === "LAW");
  if (law.length || !(streams.length === 1 && streams[0] === "LAW")) return law;
  return programmes;
}

export async function lawInternshipSummary(schoolId: string, year: number): Promise<LawInternshipSummary> {
  const w = academicYearWindow(year);
  const programmes = await lawProgrammes(schoolId);
  const programmeBy = new Map(programmes.map((p) => [p.id, p]));
  const seats = programmes.length ? await db.studentProgramme.findMany({ where: { schoolId, ...SEATED_NOW, programmeId: { in: programmes.map((p) => p.id) } }, select: { studentMembershipId: true, programmeId: true, student: { select: { user: { select: { name: true, preferredName: true } } } } } }) : [];
  const [inYear, completed, moots] = await Promise.all([
    // The return counts internships served (TA-270): evaluated or credited, by students holding law seats, as the
    // per-student minimum below does; a proposal, an approval or a report not yet evaluated is not one, nor is an
    // engineering student's at a college of both streams.
    seats.length ? db.internship.findMany({ where: { schoolId, kind: { in: [...LAW_INTERNSHIP_KINDS] }, status: { in: ["EVALUATED", "CREDITED"] }, studentMembershipId: { in: seats.map((s) => s.studentMembershipId) }, fromKey: { gte: w.from, lte: w.to } }, select: { kind: true, fromKey: true, toKey: true } }) : Promise.resolve([] as { kind: string; fromKey: string; toKey: string }[]),
    seats.length ? db.internship.findMany({ where: { schoolId, kind: { in: [...LAW_INTERNSHIP_KINDS] }, status: { in: ["EVALUATED", "CREDITED"] }, studentMembershipId: { in: seats.map((s) => s.studentMembershipId) } }, select: { studentMembershipId: true, fromKey: true, toKey: true } }) : Promise.resolve([]),
    db.mootCourt.findMany({ where: { schoolId, at: { gte: w.from, lte: w.to } }, select: { kind: true, teamsJson: true } }),
  ]);
  const weeksBy = new Map<string, number>();
  for (const i of completed) weeksBy.set(i.studentMembershipId, (weeksBy.get(i.studentMembershipId) ?? 0) + weeksBetween(i.fromKey, i.toKey));
  const perStudent = seats
    .map((s) => {
      const p = programmeBy.get(s.programmeId)!;
      const minimumWeeks = bciMinimumWeeks(p.durationYears);
      const weeks = round1(weeksBy.get(s.studentMembershipId) ?? 0);
      return { studentMembershipId: s.studentMembershipId, name: nameOf(s.student.user), programmeCode: p.code, weeks, minimumWeeks, meets: weeks >= minimumWeeks };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
  const participants = new Set<string>();
  for (const m of moots) for (const team of readJsonArray<{ membershipIds?: string[] }>(m.teamsJson)) for (const id of team.membershipIds ?? []) participants.add(id);
  const count = (k: string) => inYear.filter((i) => i.kind === k).length;
  return {
    year,
    internships: inYear.length,
    byKind: { COURT: count("COURT"), FIRM: count("FIRM"), LEGAL_AID: count("LEGAL_AID") },
    weeks: round1(inYear.reduce((a, i) => a + weeksBetween(i.fromKey, i.toKey), 0)),
    students: perStudent.length,
    meetingMinimum: perStudent.filter((s) => s.meets).length,
    perStudent,
    mootCourts: { total: moots.length, INTRA: moots.filter((m) => m.kind === "INTRA").length, INTER: moots.filter((m) => m.kind === "INTER").length, NATIONAL: moots.filter((m) => m.kind === "NATIONAL").length, participants: participants.size },
  };
}

/* ---------------------------------------------------- teaching practice */

export async function teachingPracticeSummary(schoolId: string, year: number): Promise<TeachingPracticeSummary> {
  const w = academicYearWindow(year);
  const [schools, postings] = await Promise.all([
    db.practiceSchool.findMany({ where: { schoolId, archivedAt: null }, select: { id: true, name: true, udise: true } }),
    db.teachingPracticePosting.findMany({ where: { schoolId }, select: { id: true, studentMembershipId: true, practiceSchoolId: true, fromKey: true, toKey: true, lessonsPlanned: true, _count: { select: { observations: true } } } }),
  ]);
  const inYear = postings.filter((p) => p.fromKey <= w.to && p.toKey >= w.from);
  const names = await namesOf(postings.map((p) => p.studentMembershipId));
  const cumulative = new Map<string, number>();
  for (const p of postings) cumulative.set(p.studentMembershipId, (cumulative.get(p.studentMembershipId) ?? 0) + weeksBetween(p.fromKey, p.toKey));
  const per = new Map<string, { weeks: number; lessonsPlanned: number; lessonsObserved: number }>();
  for (const p of inYear) {
    const v = per.get(p.studentMembershipId) ?? { weeks: 0, lessonsPlanned: 0, lessonsObserved: 0 };
    v.weeks += weeksBetween(p.fromKey, p.toKey);
    v.lessonsPlanned += p.lessonsPlanned;
    v.lessonsObserved += p._count.observations;
    per.set(p.studentMembershipId, v);
  }
  const perStudent = [...per.entries()]
    .map(([id, v]) => ({ studentMembershipId: id, name: names.get(id) ?? "", weeks: round1(v.weeks), lessonsPlanned: v.lessonsPlanned, lessonsObserved: v.lessonsObserved, meets: round1(cumulative.get(id) ?? 0) >= NCTE_MIN_PRACTICE_WEEKS }))
    .sort((a, b) => a.name.localeCompare(b.name));
  return {
    year,
    practiceSchools: schools.length,
    postings: inYear.length,
    students: per.size,
    lessonsPlanned: inYear.reduce((a, p) => a + p.lessonsPlanned, 0),
    lessonsObserved: inYear.reduce((a, p) => a + p._count.observations, 0),
    weeks: round1(inYear.reduce((a, p) => a + weeksBetween(p.fromKey, p.toKey), 0)),
    minimumWeeks: NCTE_MIN_PRACTICE_WEEKS,
    meetingMinimum: perStudent.filter((s) => s.meets).length,
    bySchool: schools
      .map((s) => {
        const mine = inYear.filter((p) => p.practiceSchoolId === s.id);
        return { practiceSchoolId: s.id, name: s.name, udise: s.udise, postings: mine.length, students: new Set(mine.map((p) => p.studentMembershipId)).size };
      })
      .sort((a, b) => a.name.localeCompare(b.name)),
    perStudent,
  };
}

/* ------------------------------------------------------------- NSS, NCC */

/** One unit's year: its enrolled students, its activities (IQAC Activity rows of that kind) and the hours each student earned — students only; staff on an activity are the IQAC register's. */
export async function corpsSummary(schoolId: string, corps: CorpsCode, year: number): Promise<CorpsSummary> {
  const w = academicYearWindow(year);
  const [enrolled, activities] = await Promise.all([
    db.corpsEnrolment.count({ where: { schoolId, corps, enrolledOn: { lte: w.to }, OR: [{ leftOn: null }, { leftOn: { gte: w.from } }] } }),
    db.activity.findMany({ where: { schoolId, kind: corps, at: { gte: w.from, lte: w.to } }, select: { participantIdsJson: true, hours: true, camp: true } }),
  ]);
  const ids = [...new Set(activities.flatMap((a) => readJsonArray<string>(a.participantIdsJson)))];
  const students = ids.length ? await db.membership.findMany({ where: { id: { in: ids }, role: "STUDENT" }, select: { id: true, user: { select: { name: true, preferredName: true } } } }) : [];
  const studentName = new Map(students.map((s) => [s.id, nameOf(s.user)]));
  const per = new Map<string, { hours: number; activities: number; camp: boolean }>();
  let participations = 0;
  let hours = 0;
  for (const a of activities) {
    for (const id of readJsonArray<string>(a.participantIdsJson)) {
      if (!studentName.has(id)) continue;
      participations += 1;
      hours += a.hours ?? 0;
      const v = per.get(id) ?? { hours: 0, activities: 0, camp: false };
      v.hours += a.hours ?? 0;
      v.activities += 1;
      v.camp = v.camp || a.camp;
      per.set(id, v);
    }
  }
  return {
    enrolled,
    activities: activities.length,
    camps: activities.filter((a) => a.camp).length,
    participations,
    students: per.size,
    hours: round1(hours),
    perStudent: [...per.entries()].map(([id, v]) => ({ studentMembershipId: id, name: studentName.get(id) ?? "", hours: round1(v.hours), activities: v.activities, camp: v.camp })).sort((a, b) => a.name.localeCompare(b.name)),
  };
}

/** NSS and NCC for NAAC's criterion 3 (3.6, extension activities). */
export async function nssSummary(schoolId: string, year: number): Promise<NssSummary> {
  const [nss, ncc] = await Promise.all(CORPS.map((c) => corpsSummary(schoolId, c, year)));
  return { year, nss: nss!, ncc: ncc!, hoursPerYear: NSS_HOURS_PER_YEAR };
}
