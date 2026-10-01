/**
 * The rows the API sweep needs to open doors it used to skip "for want of a
 * sample" — all at ZZ Northgate, all ZZ-named, each under a fixed id so the
 * sweep's resolver finds the same row every run and `--teardown` takes it
 * with the school.
 *
 * TWO KINDS, AND THE DIFFERENCE IS THE POINT.
 *
 *   buildSweepDoors — rows in a state where the door answers without
 *   changing anything: a revoked invitation (revoke and resend refuse it), a
 *   closed vacancy and a closed enquiry (closing again refuses), a closed
 *   mentorship (agreeing again is a no-op), a consented competition entry
 *   (consenting again is a no-op), an archived exam series and fee
 *   structure, a revoked concession, a template to copy and an appraisal the
 *   sweep rewrites with what it already says. zz:fixtures builds them; the
 *   sweep only reads their ids.
 *
 *   restoreSweepThrowaways — rows whose door IS a removal (an appraisal, a
 *   lesson-plan template, an absence note, an expert's open window). Each
 *   exists only to be removed: the sweep puts it back before it walks the
 *   catalog, so every run proves the removal itself and not a 404 left by the
 *   run before, and zz:fixtures puts it back after, as it restores every row
 *   a run replaced. Nothing else reads them.
 *
 * Shared by scripts/zz-fixtures.ts and scripts/api-sweep.ts, each passing its
 * own client on the owner connection.
 */
import type { PrismaClient } from "@prisma/client";
import { randomBytes } from "node:crypto";
import { addDaysToKey, todayKey, zonedStartOfDay } from "../src/lib/dates";

const DAY = 86_400_000;

export const SWEEP_DOOR_IDS = {
  revokedInvite: "zz-fixture-invite-revoked",
  archivedExamSeries: "zz-fixture-exam-archived",
  closedPosting: "zz-fixture-posting-closed",
  openEnquiry: "zz-fixture-enquiry-open",
  closedEnquiry: "zz-fixture-enquiry-closed",
  mentorship: "zz-fixture-mentorship",
  competition: "zz-fixture-competition",
  competitionEntry: "zz-fixture-competition-entry",
  archivedFeeStructure: "zz-fixture-fee-structure-archived",
  revokedConcession: "zz-fixture-concession-revoked",
  planTemplate: "zz-fixture-plan-template",
  appraisal: "zz-fixture-appraisal",
  // The throwaways: removed by the sweep, put back by the next.
  goneAppraisal: "zz-fixture-appraisal-gone",
  gonePlanTemplate: "zz-fixture-plan-template-gone",
  goneAbsenceNote: "zz-fixture-absence-note-gone",
  goneExpertSlot: "zz-fixture-expert-slot-gone",
} as const;

/** What the appraisal the sweep rewrites says, so its PUT sends back exactly this. */
export const SWEEP_APPRAISAL = { kind: "OBSERVATION", dateKey: "2026-09-15", summary: "ZZ A lesson observed: number bonds, pupils explaining their working aloud.", strengths: null, targets: null, rating: null, visibleToStaff: false } as const;

/** The people and rows the doors hang on, by name; null when the fixtures have not made them. */
async function cast(db: PrismaClient, schoolId: string) {
  const member = (email: string, role: string) => db.membership.findFirst({ where: { schoolId, role, status: "ACTIVE", user: { email } }, select: { id: true, userId: true } });
  const user = (email: string) => db.user.findUnique({ where: { email }, select: { id: true } });
  const expert = (email: string) => db.expertProfile.findFirst({ where: { user: { email } }, select: { id: true, userId: true } });
  const [school, admin, principal, pupil01, parent01, lead, year, otherParent, expert1, expert3] = await Promise.all([
    db.school.findUnique({ where: { id: schoolId }, select: { name: true, timezone: true } }),
    member("zz.admin@zz.test", "ADMIN"),
    member("zz.principal@zz.test", "PRINCIPAL"),
    member("zz.pupil01@zz.test", "STUDENT"),
    user("zz.parent01@zz.test"),
    db.classTeacher.findFirst({ where: { role: "LEAD", class: { schoolId, gradeLevel: "3", archivedAt: null } }, select: { teacherMembershipId: true, teacher: { select: { userId: true } } } }),
    db.academicYear.findFirst({ where: { schoolId, isCurrent: true }, select: { id: true, name: true } }),
    user("zz.sb.parent01@zz.test"),
    expert("zz.expert1@zz.test"),
    expert("zz.expert3@zz.test"),
  ]);
  return { school, admin, principal, pupil01, parent01, lead, year, otherParent, expert1, expert3 };
}

/**
 * The rows whose doors answer as they stand. Idempotent: each is an upsert
 * by its fixed id that puts the row back in the state its door needs.
 */
export async function buildSweepDoors(db: PrismaClient, schoolId: string): Promise<string[]> {
  const c = await cast(db, schoolId);
  const made: string[] = [];
  const ids = SWEEP_DOOR_IDS;
  if (!c.school || !c.admin) return made;
  const past = new Date(Date.now() - 20 * DAY);

  // A revoked invitation: the office's revoke and resend both refuse it (422), and nobody is emailed.
  await db.invite.upsert({
    where: { id: ids.revokedInvite },
    create: { id: ids.revokedInvite, schoolId, role: "TEACHER", email: "zz.invite.revoked@zz.test", name: "ZZ Kavita Joshi", subjects: JSON.stringify(["Science"]), tokenHash: `zz-fixture-revoked-${schoolId}`, status: "REVOKED", createdByMembershipId: c.admin.id, expiresAt: new Date(Date.now() + 14 * DAY), createdAt: past },
    update: { status: "REVOKED" },
  });
  made.push("a revoked invitation");

  // An archived exam series: archiving finds nothing live to archive (404); off every page already.
  await db.examSeries.upsert({
    where: { id: ids.archivedExamSeries },
    create: { id: ids.archivedExamSeries, schoolId, name: "ZZ Archived unit test", gradeLevel: "3", kind: "UNIT_TEST", archivedAt: past, createdByMembershipId: c.admin.id, createdAt: past },
    update: { archivedAt: past },
  });
  made.push("an archived exam series");

  // A filled vacancy, closed: closing again refuses (422), and its own staff still read it. The grade-3 lead is its hiring contact, so the sweep's teacher stands on the school's side of its enquiry.
  if (c.lead) {
    await db.jobPosting.upsert({
      where: { id: ids.closedPosting },
      create: { id: ids.closedPosting, schoolId, title: "ZZ Primary mathematics teacher (filled)", body: "ZZ fixture: a post the school has filled. Nothing here is a real vacancy.", subjects: JSON.stringify(["Mathematics"]), employmentType: "FULL_TIME", hiringContactMembershipId: c.lead.teacherMembershipId, postedByMembershipId: c.admin.id, status: "CLOSED", closedAt: past, createdAt: past },
      update: { status: "CLOSED", closedAt: past, hiringContactMembershipId: c.lead.teacherMembershipId },
    });
    made.push("a closed vacancy");
    // Asked by zz.expert1, the sweep's expert, who reads their own enquiry: so the close door answers the
    // expert as the asker (403, only the school closes), not as a stranger (404), and the school's side 422.
    if (c.expert1) {
      const asker = c.expert1.userId;
      await db.enquiry.upsert({
        where: { id: ids.closedEnquiry },
        create: { id: ids.closedEnquiry, schoolId, kind: "JOB", jobPostingId: ids.closedPosting, fromUserId: asker, schoolName: c.school.name, subject: "ZZ Primary mathematics teacher (filled)", status: "CLOSED", closedAt: past, createdAt: past },
        update: { status: "CLOSED", closedAt: past, fromUserId: asker },
      });
      await db.enquiryMessage.deleteMany({ where: { enquiryId: ids.closedEnquiry, authorUserId: { not: asker } } });
      if ((await db.enquiryMessage.count({ where: { enquiryId: ids.closedEnquiry } })) === 0) {
        await db.enquiryMessage.create({ data: { schoolId, enquiryId: ids.closedEnquiry, authorUserId: asker, body: "ZZ Is the post still open? I teach olympiad mathematics and would take a primary class.", readBy: JSON.stringify([asker]), createdAt: past } });
      }
      made.push("a closed enquiry about it");
    }
  }

  // An open admission enquiry from a parent elsewhere: read and replied to by the office; the sweep's empty reply is a 422.
  if (c.otherParent) {
    await db.enquiry.upsert({
      where: { id: ids.openEnquiry },
      create: { id: ids.openEnquiry, schoolId, kind: "ADMISSION", fromUserId: c.otherParent.id, schoolName: c.school.name, subject: "", status: "OPEN", createdAt: past },
      update: { status: "OPEN", closedAt: null },
    });
    if ((await db.enquiryMessage.count({ where: { enquiryId: ids.openEnquiry } })) === 0) {
      await db.enquiryMessage.create({ data: { schoolId, enquiryId: ids.openEnquiry, authorUserId: c.otherParent.id, body: "ZZ Are there places in grade 4 next year?", readBy: JSON.stringify([c.otherParent.id]), createdAt: past } });
    }
    made.push("an open admission enquiry");
  }

  // Pupil 01's active mentorship with zz.expert3: consenting again is a no-op, and it is read by the office, the teacher, the pupil and the parent.
  if (c.pupil01 && c.parent01 && c.expert3) {
    const expertUser = c.expert3.userId;
    // By the pair, not the id: a test that paired the two first owns the row, and the door reads it as it stands.
    const existing = await db.mentorThread.findUnique({ where: { expertProfileId_studentMembershipId: { expertProfileId: c.expert3.id, studentMembershipId: c.pupil01.id } }, select: { id: true } });
    if (!existing) {
      // The place is claimed when the school agrees, as decideMentorRequest does; the counter moves with the row, once.
      await db.mentorThread.create({ data: { id: ids.mentorship, schoolId, expertProfileId: c.expert3.id, expertUserId: expertUser, studentMembershipId: c.pupil01.id, createdByMembershipId: c.admin.id, purpose: "ZZ Reading round a problem before solving it", status: "ACTIVE", decidedByMembershipId: c.admin.id, decidedAt: past, parentConsentAt: past, parentConsentUserId: c.parent01.id, createdAt: past } });
      await db.expertProfile.update({ where: { id: c.expert3.id }, data: { activeMentorships: { increment: 1 } } });
    }
    made.push("an active mentorship");
  }

  // The school's own competition, open for entries (the dates move with the run so it never closes): pupil 01's entry consented.
  const now = Date.now();
  await db.competition.upsert({
    where: { id: ids.competition },
    create: { id: ids.competition, organizerSchoolId: schoolId, organizerName: c.school.name, title: "ZZ Sweep Quiz", summary: "ZZ fixture: a quiz the school runs for its own pupils.", status: "PUBLISHED", requiresParentConsent: true, registrationOpensAt: past, registrationClosesAt: new Date(now + 180 * DAY), startsAt: new Date(now + 190 * DAY), endsAt: new Date(now + 200 * DAY), createdAt: past },
    update: { status: "PUBLISHED", registrationOpensAt: past, registrationClosesAt: new Date(now + 180 * DAY), startsAt: new Date(now + 190 * DAY), endsAt: new Date(now + 200 * DAY) },
  });
  if (c.pupil01 && c.parent01) {
    await db.competitionEntry.upsert({
      where: { competitionId_studentMembershipId: { competitionId: ids.competition, studentMembershipId: c.pupil01.id } },
      create: { id: ids.competitionEntry, competitionId: ids.competition, studentMembershipId: c.pupil01.id, schoolId, status: "REGISTERED", parentConsentAt: past, parentConsentBy: c.parent01.id, createdAt: past },
      update: { parentConsentAt: past, parentConsentBy: c.parent01.id },
    });
  }
  made.push("an open competition with pupil 01's consented entry");

  // Money, as it stands: an archived structure (archiving again changes nothing) and a revoked concession (revoking again is a no-op). Neither is on any pupil's demands.
  if (c.year) {
    await db.feeStructure.upsert({
      where: { id: ids.archivedFeeStructure },
      create: { id: ids.archivedFeeStructure, schoolId, academicYearId: c.year.id, name: "ZZ Old transport fees (archived)", gradeLevel: "3", publishedAt: past, archivedAt: past, createdAt: past },
      update: { archivedAt: past },
    });
    if (c.pupil01) {
      await db.feeConcession.upsert({
        where: { id: ids.revokedConcession },
        create: { id: ids.revokedConcession, schoolId, studentMembershipId: c.pupil01.id, academicYearId: c.year.id, kind: "PERCENT", value: 1000, reason: "ZZ A sibling discount granted in error and taken back", grantedByUserId: c.admin.userId, revokedAt: past, createdAt: past },
        update: { revokedAt: past },
      });
    }
    made.push("an archived fee structure and a revoked concession");
  }

  // A lesson-plan template of the grade-3 lead's, for the apply door.
  if (c.lead) {
    await db.lessonPlanTemplate.upsert({
      where: { id: ids.planTemplate },
      create: { id: ids.planTemplate, schoolId, authorUserId: c.lead.teacher.userId, subject: "Mathematics", grade: "3", title: "ZZ Number bonds to twenty", body: JSON.stringify({ topic: "ZZ Number bonds to twenty", notes: "Ten-frames, then pairs aloud.", homework: "Five pairs that make twenty." }), createdAt: past },
      update: {},
    });
    made.push("a lesson-plan template");
  }

  // An observation of the grade-3 lead by the head, which the sweep's PUT rewrites with exactly what it says.
  if (c.lead && c.principal) {
    const fields = { kind: SWEEP_APPRAISAL.kind, date: zonedStartOfDay(SWEEP_APPRAISAL.dateKey, c.school.timezone), summary: SWEEP_APPRAISAL.summary, strengths: null, targets: null, rating: null, visibleToStaff: false };
    await db.staffAppraisal.upsert({
      where: { id: ids.appraisal },
      create: { id: ids.appraisal, schoolId, staffMembershipId: c.lead.teacherMembershipId, appraiserUserId: c.principal.userId, year: c.year?.name ?? "2026–27", ...fields, createdAt: past },
      update: fields,
    });
    made.push("an appraisal to rewrite");
  }

  // The sweep's expert's calendar feed: minted once, so the feed has a token to be read by; the sweep's own rotate moves it on.
  if (c.expert1) {
    await db.expertProfile.updateMany({ where: { id: c.expert1.id, calendarToken: null }, data: { calendarToken: randomBytes(24).toString("base64url") } });
  }

  made.push(...(await restoreSweepThrowaways(db, schoolId)));
  return made;
}

/**
 * The rows a sweep removes, put back. Called by the sweep before it walks the
 * catalog and by zz:fixtures; createdAt is set in the past so the sweep's
 * clean-up (which takes every row made during the run) leaves a restored one
 * that its door did not remove.
 */
export async function restoreSweepThrowaways(db: PrismaClient, schoolId: string): Promise<string[]> {
  const c = await cast(db, schoolId);
  const made: string[] = [];
  const ids = SWEEP_DOOR_IDS;
  if (!c.school) return made;
  const past = new Date(Date.now() - 20 * DAY);

  if (c.lead && c.principal) {
    const fields = { kind: "TARGET", date: zonedStartOfDay("2026-09-16", c.school.timezone), summary: "ZZ A target the head will take off the record.", visibleToStaff: false };
    await db.staffAppraisal.upsert({
      where: { id: ids.goneAppraisal },
      create: { id: ids.goneAppraisal, schoolId, staffMembershipId: c.lead.teacherMembershipId, appraiserUserId: c.principal.userId, year: c.year?.name ?? "2026–27", ...fields, createdAt: past },
      update: fields,
    });
    made.push("an appraisal to remove");
  }
  if (c.lead) {
    await db.lessonPlanTemplate.upsert({
      where: { id: ids.gonePlanTemplate },
      create: { id: ids.gonePlanTemplate, schoolId, authorUserId: c.lead.teacher.userId, subject: "Mathematics", grade: "3", title: "ZZ A template to throw away", body: JSON.stringify({ topic: "ZZ A template to throw away", notes: "", homework: "" }), createdAt: past },
      update: {},
    });
    made.push("a template to remove");
  }
  // Pupil 01's own note for a day a fortnight ahead in the school's zone, so the pupil (who wrote it) may take it back; the sweep's own note is for today.
  if (c.pupil01) {
    const dateKey = addDaysToKey(todayKey(c.school.timezone), 14);
    await db.absenceNote.deleteMany({ where: { studentMembershipId: c.pupil01.id, dateKey, id: { not: ids.goneAbsenceNote } } });
    await db.absenceNote.upsert({
      where: { id: ids.goneAbsenceNote },
      create: { id: ids.goneAbsenceNote, schoolId, studentMembershipId: c.pupil01.id, dateKey, reason: "FAMILY", text: "ZZ A family wedding.", authorUserId: c.pupil01.userId, authorRole: "STUDENT", createdAt: past },
      update: { dateKey, authorUserId: c.pupil01.userId, authorRole: "STUDENT" },
    });
    made.push("an absence note to take back");
  }
  // An open window of the sweep's expert, a month ahead and never booked.
  if (c.expert1) {
    const startsAt = new Date(Math.ceil((Date.now() + 30 * DAY) / DAY) * DAY + 10 * 3_600_000);
    const slot = await db.expertSlot.findUnique({ where: { id: ids.goneExpertSlot }, select: { bookedAt: true } });
    if (!slot) await db.expertSlot.create({ data: { id: ids.goneExpertSlot, expertProfileId: c.expert1.id, startsAt, endsAt: new Date(startsAt.getTime() + 3_600_000), note: "ZZ A window to withdraw", createdAt: past } });
    // A window somebody booked meanwhile is theirs: it is left as it is, and the door answers that it is booked.
    else if (!slot.bookedAt) await db.expertSlot.update({ where: { id: ids.goneExpertSlot }, data: { startsAt, endsAt: new Date(startsAt.getTime() + 3_600_000), cancelledAt: null } });
    made.push("an expert's window to withdraw");
  }
  return made;
}
