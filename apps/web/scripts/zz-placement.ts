import type { PrismaClient } from "@prisma/client";
import { gstinCheckChar } from "@edulink/contracts";
import { PLACEMENT_FIXTURE as F } from "../src/lib/api-catalog/placement-fixture";
import { seasonBatchFor } from "../src/lib/placement-rules";

/**
 * THE ZZ PLACEMENT ROWS at ZZ Vidya College (the placement module, 4 October
 * 2026), built by `npm run zz:fixtures` after the colleges and their academics.
 *
 *   ZZ Zeta Analytics, zz.recruiter01's company (a GSTIN of the right form
 *   whose check character is computed), checked by zz.tpo, with a requirement
 *   to Vidya that became this season's OPEN drive (no live backlogs, BSc
 *   Physics), for which zz.cstudent02 qualifies and zz.cstudent03 does not
 *   (a live backlog, from the exam cell's fixture) — cstudent02 has applied;
 *   ZZ Sahyadri Motors, a company the cell added by CIN and has not checked.
 *   Last season's CLOSED drive: zz.calumni01 (who left in 2025) shortlisted,
 *   through one round, offered ₹6.5 lakh, accepted and joined; the 2025
 *   season published from it.
 *   zz.cstudent02's internship at Zeta Analytics, approved with zz.faculty01
 *   supervising, two days in the diary; a project guided by zz.faculty01
 *   with one review.
 *   zz.calumni01, a mentor by the office's mark, with a referral into the
 *   open drive, a free one-to-one offered next week, a recorded gift, and the
 *   2025 batch's reunion on the calendar.
 *   The placement bank: three ZZ topics (aptitude, reasoning, coding) of
 *   three questions each, in the shared practice catalogue.
 *
 * Every id the catalog samples name is fixed (src/lib/api-catalog/placement-fixture.ts).
 * Re-run safe: every row is written by its id or its unique key.
 */
const DOMAIN = "zz.test";
const DAY = 86_400_000;
const istDay = (offset: number) => new Date(Date.now() + 5.5 * 3_600_000 + offset * DAY).toISOString().slice(0, 10);

/** A GSTIN of the right form for a made-up Maharashtra company, its check character computed. */
function gstin(first14: string): string {
  return `${first14}${gstinCheckChar(first14)}`;
}

const BANK = [
  {
    slug: "zz-placement-aptitude-percentages",
    subject: "APTITUDE",
    name: "ZZ Percentages and profit",
    questions: [
      { difficulty: 1, stem: "What is 20% of 250?", choices: ["25", "50", "75", "100"], answerIndex: 1, solution: "20% of 250 = 0.2 × 250 = 50." },
      { difficulty: 2, stem: "A price rises from ₹400 to ₹500. By what percent did it rise?", choices: ["20%", "25%", "40%", "50%"], answerIndex: 1, solution: "The rise is 100 on 400, which is 25%." },
      { difficulty: 3, stem: "An article bought for ₹800 is sold for ₹920. What is the profit percent?", choices: ["12%", "15%", "18%", "20%"], answerIndex: 1, solution: "Profit 120 on 800 is 15%." },
    ],
  },
  {
    slug: "zz-placement-reasoning-series",
    subject: "REASONING",
    name: "ZZ Number series",
    questions: [
      { difficulty: 1, stem: "Next in the series: 2, 4, 6, 8, …", choices: ["9", "10", "12", "14"], answerIndex: 1, solution: "Each term adds 2." },
      { difficulty: 2, stem: "Next in the series: 3, 9, 27, …", choices: ["54", "72", "81", "90"], answerIndex: 2, solution: "Each term is three times the one before." },
      { difficulty: 3, stem: "Next in the series: 1, 4, 9, 16, …", choices: ["20", "24", "25", "36"], answerIndex: 2, solution: "The squares of 1, 2, 3, 4, 5." },
    ],
  },
  {
    slug: "zz-placement-coding-basics",
    subject: "CODING",
    name: "ZZ Programming basics",
    questions: [
      { difficulty: 1, stem: "How many times does a loop from i = 0 while i < 5, adding 1 each time, run?", choices: ["4", "5", "6", "Forever"], answerIndex: 1, solution: "i takes 0, 1, 2, 3, 4: five times." },
      { difficulty: 2, stem: "Which structure answers 'first in, first out'?", choices: ["Stack", "Queue", "Tree", "Set"], answerIndex: 1, solution: "A queue serves in arrival order." },
      { difficulty: 3, stem: "Binary search on 1,024 sorted items needs at most how many comparisons?", choices: ["8", "10", "11", "1,024"], answerIndex: 2, solution: "log₂ 1,024 = 10 halvings, plus the last look: 11." },
    ],
  },
];

async function buildBank(db: PrismaClient): Promise<number> {
  let n = 0;
  for (const [position, t] of BANK.entries()) {
    const topic = await db.quizTopic.upsert({
      where: { slug: t.slug },
      // college-content (12 Oct 2026): a college's bank for every stream (audience COLLEGE, no stream named).
      create: { slug: t.slug, subject: t.subject, classLevel: 13, chapter: t.name, name: t.name, summary: "", position, audience: "COLLEGE", streams: [] },
      update: { subject: t.subject, classLevel: 13, chapter: t.name, name: t.name, position, retiredAt: null, audience: "COLLEGE", streams: [] },
      select: { id: true },
    });
    const existing = new Set((await db.quizQuestion.findMany({ where: { topicId: topic.id }, select: { stem: true } })).map((q) => q.stem));
    for (const q of t.questions) {
      if (existing.has(q.stem)) continue;
      await db.quizQuestion.create({ data: { topicId: topic.id, difficulty: q.difficulty, stem: q.stem, choices: JSON.stringify(q.choices), answerIndex: q.answerIndex, solution: q.solution, source: "ZZ placement fixture", licence: "ZZ test data" } });
      n += 1;
    }
  }
  return n;
}

export async function buildPlacement(db: PrismaClient): Promise<{ drives: number; offers: number; season: number; bank: number; backlogForStudent03: boolean } | null> {
  const vidya = await db.school.findUnique({ where: { slug: "zz-vidya-college" }, select: { id: true, name: true } });
  if (!vidya) return null;
  const schoolId = vidya.id;
  const byEmail = async (email: string, role: string) => db.membership.findFirst({ where: { schoolId, role, user: { email } }, select: { id: true, userId: true } });
  const [tpo, admin, faculty01, s02, s03, graduate, alumnus, recruiter] = await Promise.all([
    byEmail(`zz.tpo@${DOMAIN}`, "TPO"),
    byEmail(`zz.cadmin@${DOMAIN}`, "ADMIN"),
    byEmail(`zz.faculty01@${DOMAIN}`, "FACULTY"),
    byEmail(`zz.cstudent02@${DOMAIN}`, "STUDENT"),
    byEmail(`zz.cstudent03@${DOMAIN}`, "STUDENT"),
    byEmail(`zz.calumni01@${DOMAIN}`, "STUDENT"),
    byEmail(`zz.calumni01@${DOMAIN}`, "ALUMNUS"),
    db.user.findUnique({ where: { email: `zz.recruiter01@${DOMAIN}` }, select: { id: true } }),
  ]);
  if (!tpo || !admin || !faculty01 || !s02 || !s03 || !graduate || !alumnus || !recruiter) return null;

  // The module's settings: this season's batch, the dream ratio.
  const season = seasonBatchFor(istDay(0));
  await db.schoolModule.updateMany({ where: { schoolId, module: "PLACEMENT" }, data: { settingsJson: JSON.stringify({ seasonBatchYear: season, dreamRatio: 1.5, allowGenderRule: false }) } });

  // The companies.
  const zeta = await db.company.upsert({
    where: { id: F.company },
    create: { id: F.company, name: "ZZ Zeta Analytics", identifier: gstin("27AAZCZ0001Z1Z"), sectors: JSON.stringify(["IT_SOFTWARE", "CONSULTING"]), pointOfContact: "ZZ Nikhil Rao, talent@zeta.zz.test", createdByUserId: recruiter.id, verifiedAt: new Date(), verifiedByUserId: tpo.userId },
    update: { verifiedAt: new Date(), verifiedByUserId: tpo.userId },
  });
  await db.companyRecruiter.upsert({ where: { companyId_userId: { companyId: zeta.id, userId: recruiter.id } }, create: { companyId: zeta.id, userId: recruiter.id, acceptedAt: new Date() }, update: { removedAt: null, acceptedAt: new Date() } });
  await db.companyTenantLink.upsert({ where: { schoolId_companyId: { schoolId, companyId: zeta.id } }, create: { schoolId, companyId: zeta.id, firstVisitYear: 2025 }, update: { firstVisitYear: 2025 } });
  const sahyadri = await db.company.upsert({
    where: { identifier: "U29100MH2015PTC000001" },
    create: { name: "ZZ Sahyadri Motors", identifier: "U29100MH2015PTC000001", sectors: JSON.stringify(["CORE_ENGINEERING", "MANUFACTURING"]), pointOfContact: "ZZ HR desk, hr@sahyadri.zz.test", createdByUserId: tpo.userId, createdBySchoolId: schoolId },
    update: {},
  });
  await db.companyTenantLink.upsert({ where: { schoolId_companyId: { schoolId, companyId: sahyadri.id } }, create: { schoolId, companyId: sahyadri.id }, update: {} });

  // The requirement, and the drive it became.
  const programme = await db.studentProgramme.findUnique({ where: { studentMembershipId: s02.id }, select: { programmeId: true } });
  const rule = { cgpaMin: null, noLiveBacklogs: true, programmeIds: programme ? [programme.programmeId] : [], batchYear: null, genders: [] };
  const rounds = [{ n: 1, kind: "APTITUDE", note: "", at: new Date(Date.now() + 10 * DAY).toISOString() }, { n: 2, kind: "TECHNICAL_INTERVIEW", note: "", at: null }];
  await db.requirement.upsert({
    where: { id: F.requirement },
    create: { id: F.requirement, companyId: zeta.id, byUserId: recruiter.id, role: "ZZ Graduate analyst", packageRupees: 650_000, bond: "", locations: "Pune", eligibilityAsked: JSON.stringify(rule), rounds: JSON.stringify(rounds.map((r) => ({ kind: r.kind, note: "" }))), datesProposed: "Late October", targetSchoolIds: JSON.stringify([schoolId]) },
    update: { targetSchoolIds: JSON.stringify([schoolId]) },
  });
  await db.drive.upsert({
    where: { id: F.openDrive },
    create: { id: F.openDrive, schoolId, companyId: zeta.id, requirementId: F.requirement, kind: "ON_CAMPUS", title: "ZZ Graduate analyst 2027", jd: "Analyse data for clients; Python and SQL.", packageMinRupees: 600_000, packageMaxRupees: 700_000, bond: "", rounds: JSON.stringify(rounds), schedule: JSON.stringify([{ label: "Pre-placement talk", at: new Date(Date.now() + 7 * DAY).toISOString() }]), venues: "ZZ Seminar hall", eligibilityRule: JSON.stringify(rule), status: "OPEN", invitedAt: new Date(), createdByUserId: tpo.userId },
    update: { status: "OPEN", closedAt: null, eligibilityRule: JSON.stringify(rule) },
  });
  const s02user = await db.membership.findUniqueOrThrow({ where: { id: s02.id }, select: { userId: true } });
  const record02 = { cgpa: null, liveBacklogs: 0, attendancePct: 85, programmeId: rule.programmeIds[0] ?? null, programmeName: null, batchYear: null, gender: null, category: null };
  await db.driveApplication.upsert({
    where: { driveId_studentMembershipId: { driveId: F.openDrive, studentMembershipId: s02.id } },
    create: { schoolId, driveId: F.openDrive, studentMembershipId: s02.id, studentUserId: s02user.userId, schoolName: vidya.name, consentAt: new Date(), recordJson: JSON.stringify(record02) },
    update: { withdrawnAt: null, consentAt: new Date() },
  });
  await db.placementProfile.upsert({
    where: { studentMembershipId: s02.id },
    create: { schoolId, studentMembershipId: s02.id, skills: JSON.stringify(["Python", "SQL", "Excel"]), certifications: JSON.stringify(["ZZ Data analysis basics"]), projects: JSON.stringify([{ title: "ZZ Weather data dashboard", note: "" }]), consentAt: new Date() },
    update: {},
  });

  // Last season: the closed drive, zz.calumni01 through it with an accepted offer, and the 2025 season.
  const closedRounds = [{ n: 1, kind: "TECHNICAL_INTERVIEW", note: "", at: "2025-01-20T05:30:00.000Z" }];
  await db.drive.upsert({
    where: { id: F.closedDrive },
    create: { id: F.closedDrive, schoolId, companyId: zeta.id, kind: "ON_CAMPUS", title: "ZZ Graduate analyst 2025", jd: "", packageMinRupees: 650_000, packageMaxRupees: 650_000, rounds: JSON.stringify(closedRounds), eligibilityRule: JSON.stringify({ cgpaMin: 6, noLiveBacklogs: true, programmeIds: [], batchYear: 2025, genders: [] }), status: "CLOSED", invitedAt: new Date("2025-01-05T05:30:00Z"), closedAt: new Date("2025-02-28T05:30:00Z"), recruiterRating: 4, recruiterFeedback: "ZZ Well prepared on fundamentals.", createdByUserId: tpo.userId, createdAt: new Date("2025-01-02T05:30:00Z") },
    update: { status: "CLOSED" },
  });
  await db.driveApplication.upsert({
    where: { driveId_studentMembershipId: { driveId: F.closedDrive, studentMembershipId: graduate.id } },
    create: { schoolId, driveId: F.closedDrive, studentMembershipId: graduate.id, studentUserId: graduate.userId, schoolName: vidya.name, appliedAt: new Date("2025-01-08T05:30:00Z"), consentAt: new Date("2025-01-08T05:30:00Z"), recordJson: JSON.stringify({ cgpa: 7.9, liveBacklogs: 0, attendancePct: 88, programmeId: null, programmeName: null, batchYear: 2025, gender: null, category: null }) },
    update: {},
  });
  for (const round of [0, 1]) {
    await db.roundResult.upsert({ where: { driveId_round_studentMembershipId: { driveId: F.closedDrive, round, studentMembershipId: graduate.id } }, create: { schoolId, driveId: F.closedDrive, round, studentMembershipId: graduate.id, outcome: "PASSED", byUserId: recruiter.id }, update: {} });
  }
  await db.offer.upsert({
    where: { id: F.offer },
    create: { id: F.offer, schoolId, driveId: F.closedDrive, studentMembershipId: graduate.id, packageRupees: 650_000, acceptedAt: new Date("2025-02-10T05:30:00Z"), joinedAt: new Date("2025-07-01T00:00:00Z"), byUserId: recruiter.id, createdAt: new Date("2025-02-05T05:30:00Z") },
    update: {},
  });
  await db.placementSeason.upsert({
    where: { schoolId_batchYear: { schoolId, batchYear: 2025 } },
    create: { schoolId, batchYear: 2025, finalYear: 1, placed: 1, higherStudies: 0, entrepreneurs: 0, offers: 1, medianSalaryRupees: 650_000, computedByUserId: tpo.userId, computedAt: new Date("2025-03-31T05:30:00Z") },
    update: {},
  });

  // An internship in progress, and a project.
  const start = istDay(-14);
  const end = istDay(45);
  await db.internship.upsert({
    where: { id: F.internship },
    create: { id: F.internship, schoolId, studentMembershipId: s02.id, companyId: zeta.id, companyName: "ZZ Zeta Analytics", kind: "INDUSTRY", fromKey: start, toKey: end, hours: 240, windowSemester: 2, supervisorName: "ZZ Meghna Kulkarni", facultyMembershipId: faculty01.id, status: "APPROVED", decidedByUserId: tpo.userId, decidedAt: new Date(), diary: JSON.stringify([{ on: istDay(-13), hours: 6, text: "Met the team; set up the tools." }, { on: istDay(-12), hours: 7, text: "Cleaned the first data set." }]) },
    update: {},
  });
  await db.project.upsert({
    where: { id: F.project },
    create: { id: F.project, schoolId, studentMembershipIds: JSON.stringify([s02.id, s03.id]), guideMembershipId: faculty01.id, title: "ZZ A low-cost weather station", reviews: JSON.stringify([{ on: istDay(-5), byUserId: faculty01.userId, byName: "ZZ faculty", note: "Sensors chosen; casing next.", marks: null }]), createdByUserId: faculty01.userId },
    update: {},
  });

  // The alumna: a mentor, a referral, a free one-to-one next week, a gift, her batch's reunion.
  await db.alumniProfile.upsert({
    where: { membershipId: alumnus.id },
    create: { schoolId, membershipId: alumnus.id, userId: alumnus.userId, mentor: true, mentorAt: new Date(), mentorByUserId: admin.userId },
    update: { mentor: true },
  });
  if (!(await db.alumniReferral.findFirst({ where: { schoolId, alumnusMembershipId: alumnus.id, driveId: F.openDrive }, select: { id: true } }))) {
    await db.alumniReferral.create({ data: { schoolId, alumnusMembershipId: alumnus.id, driveId: F.openDrive, note: "ZZ My team is hiring two analysts this year." } });
  }
  await db.alumniCompanyLink.upsert({ where: { alumnusMembershipId: alumnus.id }, create: { schoolId, alumnusMembershipId: alumnus.id, companyId: zeta.id, role: "ZZ Analyst" }, update: { companyId: zeta.id } });
  if (!(await db.gigSlot.findFirst({ where: { providerUserId: alumnus.userId, providerKind: "ALUMNUS", cancelledAt: null, startsAt: { gt: new Date() } }, select: { id: true } }))) {
    const startsAt = new Date(`${istDay(7)}T05:30:00.000Z`);
    await db.gigSlot.create({ data: { providerUserId: alumnus.userId, providerKind: "ALUMNUS", teacherSchoolId: schoolId, kind: "ONE_TO_ONE", title: "ZZ Mock interview — data analyst", startsAt, endsAt: new Date(startsAt.getTime() + 30 * 60_000), meetingUrl: "https://meet.zz.test/pooja", seats: 1, pricePaise: 0 } });
  }
  if (!(await db.alumniGift.findFirst({ where: { schoolId, alumnusMembershipId: alumnus.id, receiptRef: "ZZ-RCPT-0001" }, select: { id: true } }))) {
    await db.alumniGift.create({ data: { schoolId, alumnusMembershipId: alumnus.id, kind: "DONATION", amountRupees: 5000, receiptRef: "ZZ-RCPT-0001", note: "ZZ Towards the library", onKey: "2026-08-15", recordedByUserId: admin.userId } });
  }
  const meetOn = istDay(30);
  const existingMeet = await db.alumniMeet.findUnique({ where: { id: F.meet }, select: { id: true } });
  if (!existingMeet) {
    const holiday = await db.holiday.create({ data: { schoolId, name: "ZZ Batch of 2025 reunion", startDateKey: meetOn, endDateKey: meetOn, kind: "EVENT", note: "ZZ Main hall" }, select: { id: true } });
    await db.alumniMeet.create({ data: { id: F.meet, schoolId, title: "ZZ Batch of 2025 reunion", onKey: meetOn, venue: "ZZ Main hall", batchYear: 2025, holidayId: holiday.id, createdByUserId: admin.userId } });
  }

  const bank = await buildBank(db);
  const backlog = await db.backlog.count({ where: { studentMembershipId: s03.id, status: "OPEN" } });
  return { drives: 2, offers: 1, season, bank, backlogForStudent03: backlog > 0 };
}
