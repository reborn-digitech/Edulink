import type { PrismaClient } from "@prisma/client";
import { randomBytes } from "node:crypto";
import { COLLEGE_EXTRAS_FIXTURE as F } from "../src/lib/api-catalog/college-extras-fixture";
import { PLACEMENT_FIXTURE as P } from "../src/lib/api-catalog/placement-fixture";
import { IQAC_FIXTURE as Q } from "../src/lib/api-catalog/iqac-fixture";

/**
 * THE RISKS BATCH'S COLLEGE BUILDS AT ZZ VIDYA COLLEGE (package 5B, R-2,
 * 5 October 2026), built by `npm run zz:fixtures` after the placement and
 * IQAC fixtures (it names their drive, cycle and AQAR).
 *
 *   A pre-placement talk for this season's OPEN drive a week ahead (seats 60):
 *   zz.cstudent02 GOING, zz.cstudent03 NOT_GOING; a talk held twenty days
 *   ago with its attendance (cstudent02 present, cstudent03 absent).
 *   "ZZ Interview skills" (INTERVIEW, OPEN, 30 seats, 60 % completes it):
 *   two sessions held and one ahead; cstudent02 present at both (completed),
 *   cstudent03 at one.
 *   "ZZ Main gate reader" (RFID, staff and students) with a sealed key nobody
 *   knows (rotate it on /admin/attendance-devices to use it), badges for
 *   zz.faculty01 and zz.cstudent02, and two punches that changed nothing (an
 *   unknown code, a leaving punch).
 *   The NAAC peer-team visit of Vidya's cycle a month ahead: three schedule
 *   slots and four evidence lines (the filed AQAR, a metric, a link, a note).
 *
 * Every id the catalog's samples name is fixed (college-extras-fixture.ts).
 * Re-run safe: rows are written by their id or unique key, and the visit's
 * lines and the punches are its own rows, rewritten.
 */
const DOMAIN = "zz.test";
const DAY = 86_400_000;
const pad = (prefix: string, n: number) => `c${prefix}${String(n).padStart(20 - prefix.length, "0")}`;
const istDay = (offset: number) => new Date(Date.now() + 5.5 * 3_600_000 + offset * DAY).toISOString().slice(0, 10);
/** 11:00 in Kolkata, `offset` days from today. */
const istEleven = (offset: number) => new Date(`${istDay(offset)}T05:30:00.000Z`);

export async function buildCollegeExtras(db: PrismaClient): Promise<{ talks: number; sessions: number; completed: number; deviceSealed: boolean; visitLines: number } | null> {
  const vidya = await db.school.findUnique({ where: { slug: "zz-vidya-college" }, select: { id: true } });
  if (!vidya) return null;
  const schoolId = vidya.id;
  const byEmail = (email: string, role: string) => db.membership.findFirst({ where: { schoolId, role, user: { email } }, select: { id: true, userId: true } });
  const [tpo, admin, iqac, faculty01, s02, s03] = await Promise.all([
    byEmail(`zz.tpo@${DOMAIN}`, "TPO"),
    byEmail(`zz.cadmin@${DOMAIN}`, "ADMIN"),
    byEmail(`zz.iqac@${DOMAIN}`, "IQAC"),
    byEmail(`zz.faculty01@${DOMAIN}`, "FACULTY"),
    byEmail(`zz.cstudent02@${DOMAIN}`, "STUDENT"),
    byEmail(`zz.cstudent03@${DOMAIN}`, "STUDENT"),
  ]);
  if (!tpo || !admin || !iqac || !faculty01 || !s02 || !s03) return null;
  const drive = await db.drive.findUnique({ where: { id: P.openDrive }, select: { id: true } });

  // ---- the talks
  const talk = { schoolId, driveId: drive ? P.openDrive : null, companyName: "ZZ Zeta Analytics", title: "ZZ Life as an analyst at Zeta", startsAt: istEleven(7), durationMinutes: 60, venue: "ZZ Seminar hall", note: "ZZ Bring a notebook; the drive's first round follows three days later.", capacity: 60, status: "SCHEDULED", heldAt: null, createdByUserId: tpo.userId };
  await db.placementTalk.upsert({ where: { id: F.talk }, create: { id: F.talk, ...talk }, update: { startsAt: talk.startsAt, status: "SCHEDULED", heldAt: null, capacity: 60 } });
  const held = { schoolId, driveId: null, companyName: "ZZ Sahyadri Motors", title: "ZZ Careers in manufacturing", startsAt: istEleven(-20), durationMinutes: 45, venue: "ZZ Seminar hall", note: "", capacity: null, status: "SCHEDULED", heldAt: istEleven(-20), createdByUserId: tpo.userId };
  await db.placementTalk.upsert({ where: { id: F.heldTalk }, create: { id: F.heldTalk, ...held }, update: { startsAt: held.startsAt, heldAt: held.heldAt, status: "SCHEDULED" } });
  const rsvp = (talkId: string, studentMembershipId: string, data: { answer: string | null; attendance: string | null }) =>
    db.placementTalkRsvp.upsert({
      where: { talkId_studentMembershipId: { talkId, studentMembershipId } },
      create: { schoolId, talkId, studentMembershipId, answer: data.answer, answeredAt: data.answer ? new Date() : null, attendance: data.attendance, markedByUserId: data.attendance ? tpo.userId : null, markedAt: data.attendance ? new Date() : null },
      update: { answer: data.answer, attendance: data.attendance },
    });
  await rsvp(F.talk, s02.id, { answer: "GOING", attendance: null });
  await rsvp(F.talk, s03.id, { answer: "NOT_GOING", attendance: null });
  await rsvp(F.heldTalk, s02.id, { answer: "GOING", attendance: "PRESENT" });
  await rsvp(F.heldTalk, s03.id, { answer: null, attendance: "ABSENT" });

  // ---- the training
  await db.softSkillsTraining.upsert({
    where: { id: F.training },
    create: { id: F.training, schoolId, title: "ZZ Interview skills", skill: "INTERVIEW", trainer: "ZZ Ms Kavita Joshi", description: "ZZ Three sessions: answering about yourself, a technical round, a mock panel.", capacity: 30, minAttendancePercent: 60, status: "OPEN", createdByUserId: tpo.userId },
    update: { status: "OPEN", minAttendancePercent: 60, capacity: 30 },
  });
  const sessions = [
    { id: F.heldSession, startsAt: istEleven(-7), topic: "ZZ Tell us about yourself", held: true },
    { id: pad("zztrsess", 2), startsAt: istEleven(-3), topic: "ZZ The technical round", held: true },
    { id: F.futureSession, startsAt: istEleven(5), topic: "ZZ A mock panel", held: false },
  ];
  for (const s of sessions) {
    await db.softSkillsSession.upsert({
      where: { id: s.id },
      create: { id: s.id, schoolId, trainingId: F.training, startsAt: s.startsAt, durationMinutes: 90, topic: s.topic, venue: "ZZ Placement cell", heldAt: s.held ? s.startsAt : null },
      update: { startsAt: s.startsAt, cancelledAt: null, heldAt: s.held ? s.startsAt : null },
    });
  }
  for (const m of [s02, s03]) {
    await db.softSkillsEnrolment.upsert({ where: { trainingId_studentMembershipId: { trainingId: F.training, studentMembershipId: m.id } }, create: { schoolId, trainingId: F.training, studentMembershipId: m.id, byUserId: tpo.userId }, update: { withdrawnAt: null } });
  }
  const mark = (sessionId: string, studentMembershipId: string, present: boolean) =>
    db.softSkillsAttendance.upsert({ where: { sessionId_studentMembershipId: { sessionId, studentMembershipId } }, create: { schoolId, sessionId, studentMembershipId, present, markedByUserId: tpo.userId }, update: { present } });
  await mark(sessions[0]!.id, s02.id, true);
  await mark(sessions[1]!.id, s02.id, true);
  await mark(sessions[0]!.id, s03.id, true);
  await mark(sessions[1]!.id, s03.id, false);

  // ---- the device, its badges and two punches that changed nothing
  // The key is made here and printed nowhere: nobody holds it, so the reader punches nothing until the office rotates it.
  let keySealed = "";
  let keyLast4 = "";
  const existing = await db.attendanceDevice.findUnique({ where: { id: F.device }, select: { keySealed: true, keyLast4: true } });
  if (existing?.keySealed) {
    keySealed = existing.keySealed;
    keyLast4 = existing.keyLast4;
  } else {
    try {
      const { seal } = await import("../src/lib/secret-box");
      const key = randomBytes(32).toString("base64url");
      keySealed = seal(key, `punch:${schoolId}:${F.device}`);
      keyLast4 = key.slice(-4);
    } catch {
      keySealed = "";
    }
  }
  await db.attendanceDevice.upsert({
    where: { id: F.device },
    create: { id: F.device, schoolId, name: "ZZ Main gate reader", kind: "RFID", location: "ZZ Main gate", scope: "BOTH", keySealed, keyLast4, keyVersion: 1, createdByUserId: admin.userId },
    update: { disabledAt: null, scope: "BOTH", keySealed, keyLast4 },
  });
  await db.attendanceBadge.upsert({ where: { schoolId_code: { schoolId, code: "CARD-ZZ-F01" } }, create: { id: F.badge, schoolId, code: "CARD-ZZ-F01", membershipId: faculty01.id, createdByUserId: admin.userId }, update: { membershipId: faculty01.id } });
  await db.attendanceBadge.upsert({ where: { schoolId_code: { schoolId, code: "CARD-ZZ-S02" } }, create: { schoolId, code: "CARD-ZZ-S02", membershipId: s02.id, createdByUserId: admin.userId }, update: { membershipId: s02.id } });
  await db.attendancePunch.deleteMany({ where: { deviceId: F.device } });
  await db.attendancePunch.create({ data: { schoolId, deviceId: F.device, externalId: "zz-fixture-1", code: "CARD-ZZ-UNKNOWN", punchedAt: istEleven(-1), dateKey: istDay(-1), direction: "IN", outcome: "UNKNOWN_BADGE" } });
  await db.attendancePunch.create({ data: { schoolId, deviceId: F.device, externalId: "zz-fixture-2", code: "CARD-ZZ-F01", membershipId: faculty01.id, punchedAt: new Date(istEleven(-1).getTime() + 6 * 3_600_000), dateKey: istDay(-1), direction: "OUT", outcome: "LOGGED" } });

  // ---- the NAAC peer-team visit
  const cycle = await db.accreditationCycle.findUnique({ where: { id: Q.cycle }, select: { id: true } });
  const from = istDay(30);
  await db.peerTeamVisit.upsert({
    where: { id: F.visit },
    create: { id: F.visit, schoolId, framework: "NAAC", cycleId: cycle?.id ?? null, year: Number(istDay(0).slice(0, 4)) - (Number(istDay(0).slice(5, 7)) < 6 ? 1 : 0), title: "ZZ NAAC peer team visit", fromDate: from, toDate: istDay(32), teamJson: JSON.stringify([{ name: "ZZ Prof S. Rao", role: "Chair" }, { name: "ZZ Dr A. Menon", role: "Member coordinator" }]), createdByUserId: iqac.userId },
    update: { fromDate: from, toDate: istDay(32), status: "PLANNED" },
  });
  await db.peerVisitItem.deleteMany({ where: { visitId: F.visit } });
  const line = (data: Record<string, unknown>) => db.peerVisitItem.create({ data: { schoolId, visitId: F.visit, createdByUserId: iqac.userId, ...data } as never });
  await line({ kind: "SCHEDULE", dayKey: from, startMinute: 600, endMinute: 660, activity: "ZZ The principal's presentation", venue: "ZZ Board room", ownerName: "ZZ Principal", position: 0 });
  await line({ kind: "SCHEDULE", dayKey: from, startMinute: 690, endMinute: 780, activity: "ZZ Visiting the departments", venue: "ZZ Campus", ownerName: "ZZ Heads of department", position: 1 });
  await line({ kind: "SCHEDULE", dayKey: istDay(31), startMinute: 600, endMinute: 690, activity: "ZZ Meeting students and alumni", venue: "ZZ Seminar hall", ownerName: "ZZ IQAC coordinator", position: 2 });
  const aqar = await db.collegeFiling.findUnique({ where: { id: Q.aqar }, select: { id: true } });
  const metric = cycle ? await db.metricScore.findFirst({ where: { cycleId: cycle.id, kind: "QN" }, orderBy: { computedAt: "desc" }, select: { metricCode: true } }) : null;
  let lines = 0;
  if (aqar) {
    await line({ kind: "EVIDENCE", criterion: "6.5.1", title: "ZZ Last year's AQAR as filed", linkKind: "FILING", linkId: aqar.id, position: lines++ });
  }
  if (metric) {
    await line({ kind: "EVIDENCE", criterion: metric.metricCode, title: "ZZ The metric's figures as computed", linkKind: "METRIC", linkId: metric.metricCode, position: lines++ });
  }
  await line({ kind: "EVIDENCE", criterion: "7.1.1", title: "ZZ Gender audit on the website", linkKind: "LINK", url: "https://example.org/zz-gender-audit", position: lines++ });
  await line({ kind: "EVIDENCE", criterion: "1.1.1", title: "ZZ Curriculum delivery plan", linkKind: "NOTE", note: "ZZ The printed copy is in the IQAC room, shelf 2.", position: lines++ });

  return { talks: 2, sessions: sessions.length, completed: 1, deviceSealed: Boolean(keySealed), visitLines: lines };
}
