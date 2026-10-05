/**
 * THE COLLEGE HOMEWORK ZZ FIXTURE (R-48, the risks batch of 5 October 2026), run by `npm run zz:fixtures`
 * after the colleges and their academics (zz-academics.ts registers zz.cstudent01–03 on PHY101, CHE101,
 * PHY103 and MAT101).
 *
 *   ZZ Vidya College:
 *     - work(1) on PHY101 (zz.faculty01): "ZZ Lab report 1", 20 points, due in a week, published; zz.cstudent01
 *       handed it in and is marked 15, zz.cstudent02 handed it in and waits for a mark — /faculty/work, /student/assignments;
 *     - work(2) on PHY103, the elective shared across divisions (zz.hod01): "ZZ Elective reading", 10 points,
 *       published, nothing handed in — the work with no class;
 *     - work(3) on PHY101: "ZZ Draft problem set", a draft the students cannot see.
 *
 * Every id is fixed (src/lib/api-catalog/college-homework-fixture.ts). Re-run safe: rows are written by their id
 * and nothing else is changed. A published row keeps the day it was first published (the students' list shows work
 * published on or after their registration, so the first run publishes "now").
 */
import type { PrismaClient } from "@prisma/client";
import { ACADEMICS_FIXTURE as A } from "../src/lib/api-catalog/academics-fixture";
import { COLLEGE_HOMEWORK_FIXTURE as F } from "../src/lib/api-catalog/college-homework-fixture";

const DOMAIN = "zz.test";
const DAY = 86_400_000;

export async function buildCollegeHomework(db: PrismaClient): Promise<{ work: number; handedIn: number; marked: number } | null> {
  const vidya = await db.school.findUnique({ where: { slug: "zz-vidya-college" }, select: { id: true } });
  if (!vidya) return null;
  const v = vidya.id;
  const at = (email: string, role: string) => db.membership.findFirst({ where: { schoolId: v, role, status: "ACTIVE", user: { email } }, select: { id: true } });
  const [f1, hod, s1, s2, o1, o3] = await Promise.all([
    at(`zz.faculty01@${DOMAIN}`, "FACULTY"),
    at(`zz.hod01@${DOMAIN}`, "HOD"),
    at(`zz.cstudent01@${DOMAIN}`, "STUDENT"),
    at(`zz.cstudent02@${DOMAIN}`, "STUDENT"),
    db.courseOffering.findUnique({ where: { id: A.offering(1) }, select: { id: true } }),
    db.courseOffering.findUnique({ where: { id: A.offering(3) }, select: { id: true } }),
  ]);
  if (!f1 || !hod || !s1 || !s2 || !o1 || !o3) return null;

  // Published no earlier than the latest registration on the offering, so every registered student sees it.
  const lastRegistered = async (offeringId: string) => (await db.courseRegistration.findFirst({ where: { offeringId, status: "REGISTERED" }, orderBy: { registeredAt: "desc" }, select: { registeredAt: true } }))?.registeredAt ?? new Date();
  const work = async (n: number, offeringId: string, authorId: string, data: { title: string; body: string; category: string; pointsMilli: number; dueInDays: number | null; published: boolean }) => {
    const publishedAt = data.published ? new Date(Math.max(Date.now(), (await lastRegistered(offeringId)).getTime())) : null;
    const fields = { title: data.title, body: data.body, category: data.category, pointsMilli: data.pointsMilli, dueAt: data.dueInDays === null ? null : new Date(Date.now() + data.dueInDays * DAY) };
    const existing = await db.assignment.findUnique({ where: { id: F.work(n) }, select: { publishedAt: true } });
    await db.assignment.upsert({
      where: { id: F.work(n) },
      create: { id: F.work(n), schoolId: v, offeringId, classId: null, authorMembershipId: authorId, ...fields, publishedAt },
      // A published row keeps its day; a draft stays a draft.
      update: { ...fields, offeringId, classId: null, publishedAt: data.published ? (existing?.publishedAt ?? publishedAt) : null },
    });
  };
  await work(1, o1.id, f1.id, { title: "ZZ Lab report 1", body: "ZZ Write up experiment 1: aim, apparatus, observations, result.", category: "Lab report", pointsMilli: 20_000, dueInDays: 7, published: true });
  await work(2, o3.id, hod.id, { title: "ZZ Elective reading", body: "ZZ Read chapter 1 and answer the three questions at its end.", category: "Reading", pointsMilli: 10_000, dueInDays: 10, published: true });
  await work(3, o1.id, f1.id, { title: "ZZ Draft problem set", body: "ZZ Not yet published.", category: "Problem set", pointsMilli: 10_000, dueInDays: null, published: false });

  const now = new Date();
  for (const [n, st, text] of [[1, s1.id, "ZZ My lab report: the readings agree with the theory within 2 %."], [2, s2.id, "ZZ Lab report attached as text: aim, apparatus, readings."]] as const) {
    await db.submission.upsert({
      where: { id: F.submission(n) },
      create: { id: F.submission(n), schoolId: v, assignmentId: F.work(1), studentMembershipId: st, body: text, status: n === 1 ? "RETURNED" : "SUBMITTED", submittedAt: now },
      update: { body: text, status: n === 1 ? "RETURNED" : "SUBMITTED" },
    });
  }
  await db.grade.upsert({
    where: { id: F.grade(1) },
    create: { id: F.grade(1), schoolId: v, assignmentId: F.work(1), studentMembershipId: s1.id, submissionId: F.submission(1), scoreMilli: 15_000, comment: "", gradedByMembershipId: f1.id },
    update: { scoreMilli: 15_000, comment: "" },
  });
  return { work: 3, handedIn: 2, marked: 1 };
}
