import type { PrismaClient } from "@prisma/client";
import { applicableFilings, parseStreams } from "@edulink/contracts";
import { IQAC_FIXTURE as F } from "../src/lib/api-catalog/iqac-fixture";
import { ACADEMICS_FIXTURE } from "../src/lib/api-catalog/academics-fixture";
import { recomputeAsSystem, respondentHash, scoreQualitativeAs, iqacHash } from "../src/lib/iqac";
import { buildFiling, disclosureDocument } from "../src/lib/iqac-filings";
import { addWorkingDays } from "../src/lib/iqac-rules";

/**
 * THE ZZ IQAC at ZZ Vidya College (the IQAC module, 4 October 2026), built by
 * `npm run zz:fixtures` after the colleges and their academics.
 *
 *   A NAAC cycle on the affiliated framework over the last five academic
 *   years, its quantitative metrics computed from the college's rows (a new
 *   run each time this script runs — the trend), three qualitative metrics
 *   scored by zz.iqac with evidence (7.2.1 best practices, 6.5.1 the IQAC's
 *   contribution, 3.3.1 extension), and two figures entered (sanctioned
 *   posts, bandwidth). Faculty records for zz.faculty01, zz.faculty02 and
 *   zz.hod01 (no PAN: a fixture seals nothing). Six research items, five
 *   activities, three committees (grievance, anti-ragging, IQAC) with a
 *   meeting each. NAAC's SSS open now, answered by zz.cstudent02 and 03 and
 *   waiting for zz.cstudent01; PHY101's course feedback closed with three
 *   answers (below five, so its totals stay hidden). One grievance open
 *   (zz.cstudent02) and one resolved in time (zz.cstudent03). Last year's
 *   AQAR generated, signed off by zz.cprincipal and filed. The AICTE
 *   disclosure published only where the college's streams bring it (5 Oct
 *   2026): Vidya is arts, science and commerce, so its page is taken down.
 *
 * Every row has a fixed id (src/lib/api-catalog/iqac-fixture.ts). Re-run
 * safe: rows are upserted by id; scores already given are not given again.
 */
const pad = (prefix: string, n: number) => `c${prefix}${String(n).padStart(20 - prefix.length, "0")}`;
const DAY = 86_400_000;
const ist = (offsetDays: number) => new Date(Date.now() + 5.5 * 3_600_000 + offsetDays * DAY).toISOString().slice(0, 10);

export type IqacFixtures = { cgpa: number; metrics: number; research: number; activities: number; filings: number } | null;

export async function buildIqac(db: PrismaClient): Promise<IqacFixtures> {
  const school = await db.school.findUnique({ where: { slug: "zz-vidya-college" }, select: { id: true, slug: true } });
  if (!school) return null;
  const who = async (email: string, role: string) => db.membership.findFirst({ where: { schoolId: school.id, role, user: { email } }, select: { id: true, userId: true } });
  const [iqac, admin, principal, f1, f2, hod, s1, s2, s3] = await Promise.all([
    who("zz.iqac@zz.test", "IQAC"),
    who("zz.cadmin@zz.test", "ADMIN"),
    who("zz.cprincipal@zz.test", "PRINCIPAL"),
    who("zz.faculty01@zz.test", "FACULTY"),
    who("zz.faculty02@zz.test", "FACULTY"),
    who("zz.hod01@zz.test", "HOD"),
    who("zz.cstudent01@zz.test", "STUDENT"),
    who("zz.cstudent02@zz.test", "STUDENT"),
    who("zz.cstudent03@zz.test", "STUDENT"),
  ]);
  if (!iqac || !admin || !principal || !f1 || !f2 || !hod || !s1 || !s2 || !s3) return null;
  const year = new Date().getUTCMonth() >= 5 ? new Date().getUTCFullYear() : new Date().getUTCFullYear() - 1;
  const sid = school.id;

  // Faculty records: what NAAC and AICTE count about each teacher.
  const records: [string, string, string, boolean, number, string][] = [
    [f1.id, "ASSISTANT_PROFESSOR", "PHD", true, 3, `${year - 6}-07-01`],
    [f2.id, "ASSISTANT_PROFESSOR", "PG", true, 1, `${year - 3}-07-15`],
    [hod.id, "ASSOCIATE_PROFESSOR", "PHD", false, 8, `${year - 12}-06-20`],
  ];
  for (const [membershipId, designation, highestQualification, netSetQualified, experienceBeforeYears, joinedOn] of records) {
    const data = { designation, appointment: "REGULAR", highestQualification, netSetQualified, experienceBeforeYears, joinedOn, apiScoreJson: JSON.stringify({ teaching: 80, research: 40, service: 15 }), updatedByUserId: admin.userId };
    await db.facultyRecord.upsert({ where: { membershipId }, create: { schoolId: sid, membershipId, ...data }, update: data });
  }

  // The research register.
  const research: [number, string, string, string, number, number | null, string | null][] = [
    [1, "PUBLICATION", "ZZ Thin-film optics in undergraduate labs", "UGC_CARE", year, null, f1.id],
    [2, "PUBLICATION", "ZZ A survey of low-cost spectrometers", "SCOPUS", year - 1, null, hod.id],
    [3, "BOOK", "ZZ Practical Chemistry for First Years (chapter)", "NONE", year - 2, null, f2.id],
    [4, "PROJECT", "ZZ Solar-cell efficiency project (state grant)", "NONE", year - 1, 12.5, hod.id],
    [5, "MOU", "ZZ MoU with Zeta Analytics for internships", "NONE", year, null, null],
    [6, "AWARD", "ZZ Best teacher award, university", "NONE", year - 1, null, f1.id],
  ];
  for (const [n, kind, title, indexing, y, amountLakhs, facultyMembershipId] of research) {
    const data = { schoolId: sid, kind, title, indexing, year: y, amountLakhs, facultyMembershipId, departmentId: ACADEMICS_FIXTURE.department(1), createdByUserId: iqac.userId };
    await db.researchItem.upsert({ where: { id: F.research(n) }, create: { id: F.research(n), ...data }, update: data });
  }

  // The activity register.
  const activities: [number, string, string, string, number, string[], string | null][] = [
    [1, "NSS", "ZZ NSS village cleanliness camp", ist(-200), 60, [], null],
    [2, "EXTENSION", "ZZ Science day at the Zilla Parishad school", ist(-120), 40, [], null],
    [3, "FDP", "ZZ FDP on outcome-based education", ist(-90), 3, [f1.id, f2.id, hod.id], null],
    [4, "VALUE_ADDED_COURSE", "ZZ Python for scientists (value-added)", ist(-60), 25, [], null],
    [5, "AUDIT_GREEN", "ZZ Green audit of the campus", ist(-30), 0, [], null],
  ];
  for (const [n, kind, title, at, participants, ids, theme] of activities) {
    const data = { schoolId: sid, kind, title, at, participants, participantIdsJson: JSON.stringify(ids), theme, departmentId: null, createdByUserId: iqac.userId };
    await db.activity.upsert({ where: { id: F.activity(n) }, create: { id: F.activity(n), ...data }, update: data });
  }

  // Three committees, a meeting each.
  const committees: [number, string, string, { name: string; role: string; membershipId: string | null }[]][] = [
    [1, "GRIEVANCE", "ZZ Students' Grievance Redressal Committee", [{ name: "ZZ Principal", role: "Chair", membershipId: principal.id }, { name: "ZZ HOD Physics", role: "Member", membershipId: hod.id }, { name: "ZZ Student representative", role: "Special invitee", membershipId: null }]],
    [2, "ANTI_RAGGING", "ZZ Anti-ragging Committee", [{ name: "ZZ Principal", role: "Chair", membershipId: principal.id }, { name: "ZZ Office", role: "Member", membershipId: admin.id }]],
    [3, "IQAC", "ZZ Internal Quality Assurance Cell", [{ name: "ZZ Principal", role: "Chair", membershipId: principal.id }, { name: "ZZ IQAC coordinator", role: "Coordinator", membershipId: iqac.id }, { name: "ZZ Faculty 01", role: "Member", membershipId: f1.id }]],
  ];
  for (const [n, kind, name, members] of committees) {
    const data = { schoolId: sid, kind, name, membersJson: JSON.stringify(members) };
    await db.committee.upsert({ where: { id: F.committee(n) }, create: { id: F.committee(n), ...data }, update: data });
    const m = { schoolId: sid, committeeId: F.committee(n), at: ist(-45 + n), actionTaken: n === 3 ? "ZZ Reviewed the AQAR draft and the feedback analysis." : "ZZ Met and reviewed the term's cases.", createdByUserId: admin.userId };
    await db.committeeMeeting.upsert({ where: { id: pad("zziqacmeet", n) }, create: { id: pad("zziqacmeet", n), ...m }, update: m });
  }

  // The cycle: the last five academic years, two figures entered.
  const cycleData = { schoolId: sid, framework: "AFFILIATED_UG", institutionType: "COLLEGE", windowFrom: `${year - 4}-06-01`, windowTo: `${year + 1}-05-31`, status: "OPEN", enteredJson: JSON.stringify({ SANCTIONED_POSTS: { value: 6, byUserId: iqac.userId, at: new Date().toISOString(), fileIds: [] }, BANDWIDTH_MBPS: { value: 100, byUserId: iqac.userId, at: new Date().toISOString(), fileIds: [] } }), createdByUserId: iqac.userId };
  await db.accreditationCycle.upsert({ where: { id: F.cycle }, create: { id: F.cycle, ...cycleData }, update: { enteredJson: cycleData.enteredJson, status: "OPEN" } });

  // Surveys: the SSS open now; PHY101's course feedback closed.
  const sss = { schoolId: sid, kind: "SSS", title: "ZZ Student Satisfaction Survey", opensOn: ist(-5), closesOn: ist(20), questionsJson: JSON.stringify(["Q01", "Q02", "Q03", "Q04", "Q05", "Q06", "Q07", "Q08", "Q09", "Q10", "Q11", "Q12", "Q13", "Q14", "Q15", "Q16", "Q17", "Q18", "Q19", "Q20"]), salt: "zz-fixture-salt-sss", createdByUserId: iqac.userId };
  await db.survey.upsert({ where: { id: F.openSurvey }, create: { id: F.openSurvey, ...sss }, update: { opensOn: sss.opensOn, closesOn: sss.closesOn, closedAt: null } });
  const course = { schoolId: sid, kind: "COURSE_FEEDBACK", title: "ZZ PHY101 course feedback", offeringId: ACADEMICS_FIXTURE.offering(1), opensOn: ist(-40), closesOn: ist(-10), questionsJson: JSON.stringify(["CLARITY", "SUPPORT", "FAIRNESS", "ENGAGEMENT", "RESPECT", "SYLLABUS", "OUTCOMES"]), salt: "", closedAt: new Date(Date.now() - 10 * DAY), createdByUserId: iqac.userId };
  const offeringExists = await db.courseOffering.findUnique({ where: { id: course.offeringId }, select: { id: true } });
  await db.survey.upsert({ where: { id: F.closedSurvey }, create: { id: F.closedSurvey, ...course, offeringId: offeringExists ? course.offeringId : null }, update: {} });
  const sssAnswers = (base: number) => Object.fromEntries(JSON.parse(sss.questionsJson).map((q: string, i: number) => [q, Math.max(0, Math.min(4, base - (i % 3 === 0 ? 1 : 0)))]));
  for (const [s, base] of [[s2, 4], [s3, 3]] as const) {
    const hash = respondentHash(F.openSurvey, s.id, sss.salt);
    await db.surveyResponse.upsert({ where: { surveyId_respondentHash: { surveyId: F.openSurvey, respondentHash: hash } }, create: { schoolId: sid, surveyId: F.openSurvey, respondentHash: hash, answersJson: JSON.stringify(sssAnswers(base)) }, update: {} });
  }
  for (const [s, base] of [[s1, 4], [s2, 3], [s3, 3]] as const) {
    const hash = `fixture_${s.id}`;
    const answers = { CLARITY: base, SUPPORT: base, FAIRNESS: 4, ENGAGEMENT: base - 1, RESPECT: 4, SYLLABUS: 3, OUTCOMES: base };
    await db.surveyResponse.upsert({ where: { surveyId_respondentHash: { surveyId: F.closedSurvey, respondentHash: hash } }, create: { schoolId: sid, surveyId: F.closedSurvey, respondentHash: hash, respondentMembershipId: s.id, answersJson: JSON.stringify(answers) }, update: {} });
  }
  const atr = { schoolId: sid, surveyId: F.closedSurvey, text: "ZZ Extra tutorials added for the optics unit after the feedback.", publishedAt: new Date(Date.now() - 5 * DAY), createdByUserId: iqac.userId };
  await db.actionTakenReport.upsert({ where: { surveyId: F.closedSurvey }, create: atr, update: {} });

  // Grievances: one open, one resolved within the limit.
  const filedOpen = ist(-3);
  const open = { schoolId: sid, byMembershipId: s2.id, kind: "ACADEMIC", committeeKind: "GRIEVANCE", text: "ZZ The practical batch timings clash with the elective lecture on Wednesdays.", status: "OPEN", filedAt: new Date(`${filedOpen}T05:00:00Z`), dueOn: addWorkingDays(filedOpen, 15) };
  await db.grievance.upsert({ where: { id: F.openGrievance }, create: { id: F.openGrievance, ...open }, update: {} });
  const filedOld = ist(-25);
  const resolved = { schoolId: sid, byMembershipId: s3.id, kind: "FEES", committeeKind: "GRIEVANCE", text: "ZZ My scholarship was not shown against the term's fees.", status: "RESOLVED", filedAt: new Date(`${filedOld}T05:00:00Z`), dueOn: addWorkingDays(filedOld, 15), response: "ZZ The accounts office corrected the ledger.", acknowledgedAt: new Date(`${ist(-24)}T06:00:00Z`), resolvedAt: new Date(`${ist(-20)}T06:00:00Z`), decidedByUserId: admin.userId };
  await db.grievance.upsert({ where: { id: F.resolvedGrievance }, create: { id: F.resolvedGrievance, ...resolved }, update: {} });

  // Recompute, then the three qualitative scores (once).
  await recomputeAsSystem(sid, F.cycle, iqac.userId);
  const desk = { schoolId: sid, userId: iqac.userId, role: "IQAC" as const, membershipId: iqac.id };
  const ql: [string, number, string, { type: "CommitteeMeeting" | "Activity"; id: string }][] = [
    ["7.2.1", 3, "ZZ Two practices: the peer-tutoring circle and the zero-waste lab.", { type: "CommitteeMeeting", id: pad("zziqacmeet", 3) }],
    ["6.5.1", 2.5, "ZZ The IQAC met each term and reviewed feedback and the AQAR.", { type: "CommitteeMeeting", id: pad("zziqacmeet", 3) }],
    ["3.3.1", 3, "ZZ NSS camps and the science day reached two villages.", { type: "Activity", id: F.activity(1) }],
  ];
  for (const [code, score, note, evidence] of ql) {
    const done = await db.metricScore.findFirst({ where: { cycleId: F.cycle, metricCode: code, kind: "QL" }, select: { id: true } });
    if (!done) await scoreQualitativeAs(desk, F.cycle, code, { score, note, fileIds: [], evidence: [evidence] });
  }

  // Last year's AQAR, signed off and filed.
  const filed = await db.collegeFiling.findUnique({ where: { id: F.aqar }, select: { id: true, figuresJson: true } });
  if (filed) {
    // A fixture AQAR built before a filing read its own year's clock (LIFECYCLE-8, 4 Oct 2026) carries figures
    // of the day it was built; rebuilt once so data:audit's iqac-filing check compares like with like. A real
    // filed AQAR is never rewritten — this is the fixture's own row.
    const built = await buildFiling(sid, "AQAR", year - 1, F.cycle);
    if (JSON.stringify(built.figures) !== filed.figuresJson) await db.collegeFiling.update({ where: { id: F.aqar }, data: { body: built.body, hash: iqacHash(built.body), figuresJson: JSON.stringify(built.figures) } });
  } else {
    const built = await buildFiling(sid, "AQAR", year - 1, F.cycle);
    await db.collegeFiling.create({ data: { id: F.aqar, schoolId: sid, kind: "AQAR", cycleId: F.cycle, year: year - 1, format: built.format, body: built.body, hash: iqacHash(built.body), figuresJson: JSON.stringify(built.figures), status: "FILED", checked: true, principalNote: "ZZ Approved for submission.", submittedAt: new Date(Date.now() - 3 * DAY), signedOffAt: new Date(Date.now() - 2 * DAY), signedOffByUserId: principal.userId, generatedByUserId: iqac.userId } });
  }

  // The AICTE disclosure, published — only where the college's streams bring it (5 Oct 2026): Vidya teaches arts,
  // science and commerce, so its page is taken down and the desk is answered 404 for it.
  const streams = parseStreams((await db.school.findUniqueOrThrow({ where: { id: sid }, select: { streamsJson: true } })).streamsJson);
  if (applicableFilings(streams).includes("AICTE_DISCLOSURE")) {
    const { document } = await disclosureDocument(sid, year);
    const snapshotJson = JSON.stringify(document);
    await db.disclosurePage.upsert({ where: { schoolId: sid }, create: { schoolId: sid, schoolSlug: school.slug, publishedAt: new Date(), snapshotJson, hash: iqacHash(snapshotJson) }, update: { schoolSlug: school.slug, publishedAt: new Date(), snapshotJson, hash: iqacHash(snapshotJson) } });
  } else {
    await db.disclosurePage.updateMany({ where: { schoolId: sid }, data: { publishedAt: null } });
  }

  const cycle = await db.accreditationCycle.findUniqueOrThrow({ where: { id: F.cycle }, select: { cgpa: true } });
  const metrics = (await db.metricScore.groupBy({ by: ["metricCode"], where: { cycleId: F.cycle } })).length;
  return { cgpa: cycle.cgpa ?? 0, metrics, research: research.length, activities: activities.length, filings: await db.collegeFiling.count({ where: { schoolId: sid } }) };
}
