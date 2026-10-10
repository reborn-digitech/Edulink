import "server-only";
import { db } from "../db";
import { todayKey } from "../dates";
import { HAND_IN_GRACE_DAYS, MAX_ASSESSMENT_ITEMS, PRACTICE_SITTING_MINUTES } from "./config";
import type { AssessmentItem } from "./assessment-rule";

export { ASSESSMENT_RULES, decideAssessment, type AssessmentItem, type AssessmentDecision } from "./assessment-rule";

/**
 * The pupil's own sittings and hand-in assignments, read for the assessment rule (assessment-rule.ts)
 * with the pupil's own filters — the same ones their assignments door and assertAssignmentAccess use
 * (published, their class's ACTIVE enrolment or their REGISTERED offering) — at their own school, under
 * the request's tenant: never another pupil's, never another school's (§9.5).
 */
export async function pupilAssessmentItems(input: { schoolId: string; membershipId: string; timezone: string; now: Date }): Promise<AssessmentItem[]> {
  const { schoolId, membershipId, now } = input;
  const items: AssessmentItem[] = [];
  const [enrolments, registrations] = await Promise.all([
    db.enrollment.findMany({ where: { schoolId, studentMembershipId: membershipId, status: "ACTIVE" }, select: { classId: true, class: { select: { gradeLevel: true } } } }),
    db.courseRegistration.findMany({ where: { schoolId, studentMembershipId: membershipId, status: "REGISTERED" }, select: { offeringId: true } }),
  ]);
  const classIds = enrolments.map((e) => e.classId);
  const offeringIds = registrations.map((r) => r.offeringId);

  // Hand-in work: published, not an exam paper's sitting, not long past due.
  const since = new Date(now.getTime() - HAND_IN_GRACE_DAYS * 86_400_000);
  if (classIds.length || offeringIds.length) {
    const work = await db.assignment.findMany({
      where: {
        schoolId,
        publishedAt: { not: null },
        examSlotId: null,
        OR: [...(classIds.length ? [{ classId: { in: classIds } }] : []), ...(offeringIds.length ? [{ offeringId: { in: offeringIds } }] : [])],
        AND: [{ OR: [{ dueAt: null }, { dueAt: { gte: since } }] }],
      },
      orderBy: { dueAt: "asc" },
      take: MAX_ASSESSMENT_ITEMS,
      select: { id: true, title: true, body: true, category: true, assistantAnswers: true },
    });
    for (const a of work) items.push({ kind: "HAND_IN", id: a.id, text: `${a.title}\n${a.category ?? ""}\n${a.body}`.slice(0, 1500), assignmentId: a.id, workedAllowed: a.assistantAnswers });
  }

  // An open contest the pupil entered.
  const entries = await db.competitionEntry.findMany({
    where: { schoolId, studentMembershipId: membershipId, competition: { status: "PUBLISHED", startsAt: { lte: now }, endsAt: { gte: now } } },
    select: { competition: { select: { id: true, title: true, subject: true, summary: true } } },
    take: 10,
  });
  for (const e of entries) items.push({ kind: "CONTEST", id: e.competition.id, text: `${e.competition.title}\n${e.competition.subject ?? ""}\n${e.competition.summary}`.slice(0, 1000) });

  // A practice sitting in progress.
  const attempts = await db.quizAttempt.findMany({
    where: { schoolId, studentMembershipId: membershipId, finishedAt: null, startedAt: { gte: new Date(now.getTime() - PRACTICE_SITTING_MINUTES * 60_000) } },
    select: { id: true, topic: { select: { subject: true, chapter: true, name: true } } },
    take: 5,
  });
  for (const a of attempts) items.push({ kind: "TIMED_PRACTICE", id: a.id, text: `${a.topic.subject}: ${a.topic.chapter} — ${a.topic.name}` });

  // A school exam paper today for the pupil's class.
  const grades = [...new Set(enrolments.map((e) => e.class.gradeLevel).filter((g): g is string => Boolean(g)))];
  if (grades.length) {
    const today = todayKey(input.timezone, now);
    const minute = minuteOfDay(input.timezone, now);
    const slots = await db.examSlot.findMany({
      where: { schoolId, dateKey: today, series: { gradeLevel: { in: grades }, publishedAt: { not: null }, archivedAt: null } },
      select: { id: true, subject: true, startMinute: true, endMinute: true, series: { select: { name: true } } },
    });
    for (const s of slots) {
      // A paper with its hours closes the tutor from its start to its end; a paper without them, the whole day.
      if (s.startMinute !== null && s.endMinute !== null && (minute < s.startMinute || minute > s.endMinute)) continue;
      items.push({ kind: "SCHOOL_EXAM", id: s.id, text: `${s.subject} — ${s.series.name}` });
    }
  }

  // At a college, the exam cell's session for the student's courses, from its first paper's start to its last paper's end (§9.2).
  if (offeringIds.length) {
    const offerings = await db.courseOffering.findMany({ where: { schoolId, id: { in: offeringIds } }, select: { courseId: true } });
    const courseIds = [...new Set(offerings.map((o) => o.courseId))];
    if (courseIds.length) {
      const schedules = await db.examSchedule.findMany({
        where: { schoolId, courseId: { in: courseIds }, session: { status: { in: ["FORMS", "CONDUCT", "ASSESSMENT"] } } },
        select: { sessionId: true, courseName: true, at: true, durationMin: true },
      });
      const bySession = new Map<string, typeof schedules>();
      for (const s of schedules) bySession.set(s.sessionId, [...(bySession.get(s.sessionId) ?? []), s]);
      for (const [sessionId, papers] of bySession) {
        const start = Math.min(...papers.map((p) => p.at.getTime()));
        const end = Math.max(...papers.map((p) => p.at.getTime() + p.durationMin * 60_000));
        if (now.getTime() < start || now.getTime() > end) continue;
        for (const p of papers) items.push({ kind: "COLLEGE_EXAM_SESSION", id: `${sessionId}:${p.courseName}`, text: p.courseName });
      }
    }
  }
  return items.slice(0, MAX_ASSESSMENT_ITEMS);
}

function minuteOfDay(timezone: string, now: Date): number {
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: timezone, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(now);
  const h = Number(parts.find((p) => p.type === "hour")?.value ?? 0);
  const m = Number(parts.find((p) => p.type === "minute")?.value ?? 0);
  return h * 60 + m;
}

