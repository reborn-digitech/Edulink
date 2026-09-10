/**
 * The /api/v1/office handlers — the list previews, resending an invitation,
 * the directory profile and the logo, deciding a safety report, telling a
 * family, the compliance exports as text, editing and retiring periods,
 * clearing a lesson, archiving an exam series and the notification
 * housekeeping — invoked directly with a primed session the way
 * api-v1-admin.test.ts does: 401 signed out, 403 for every role but the
 * office's, 200 with the body parsed by the contract, 404 for another
 * school's id, and one refusal per write.
 *
 * Everything here is created by this file, ZZ-prefixed, and deleted in
 * afterAll: the only report taken down or dismissed is one this file filed.
 */
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { randomUUID } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import {
  okSchema,
  officeAbsenceAlertSchema,
  officeCsvExportSchema,
  officeIntakePreviewSchema,
  officeInvitePreviewSchema,
  officeLogoSchema,
  savedIdSchema,
} from "@edulink/contracts";
import { createSession } from "@/lib/session";
import { __resetCookies } from "../tests/stubs/next-headers";
import { hashToken, generateToken } from "@/lib/crypto";
import { todayKey } from "@/lib/dates";
import { POST as invitePreviewPost } from "@/app/api/v1/office/invites/preview/route";
import { POST as inviteResendPost } from "@/app/api/v1/office/invites/[inviteId]/resend/route";
import { POST as intakePreviewPost } from "@/app/api/v1/office/intake/preview/route";
import { POST as directoryPost } from "@/app/api/v1/office/directory/route";
import { POST as publishPost } from "@/app/api/v1/office/directory/publish/route";
import { POST as logoPost } from "@/app/api/v1/office/logo/route";
import { POST as takeDownPost } from "@/app/api/v1/office/safety/take-down/route";
import { POST as dismissPost } from "@/app/api/v1/office/safety/dismiss/route";
import { POST as alertPost } from "@/app/api/v1/office/attendance/alert/route";
import { GET as registerGet } from "@/app/api/v1/office/attendance/export/register/route";
import { GET as enrolmentGet } from "@/app/api/v1/office/attendance/export/enrolment/route";
import { POST as periodPost } from "@/app/api/v1/office/timetable/periods/[periodId]/route";
import { POST as retirePost } from "@/app/api/v1/office/timetable/periods/[periodId]/retire/route";
import { POST as slotClearPost } from "@/app/api/v1/office/timetable/slots/clear/route";
import { POST as seriesArchivePost } from "@/app/api/v1/office/exams/[seriesId]/archive/route";
import { POST as housekeepingPost } from "@/app/api/v1/office/notifications/housekeeping/route";

vi.mock("next/cache", () => ({ revalidatePath: () => undefined, revalidateTag: () => undefined }));

const db = new PrismaClient();
const STAMP = Date.now();
const tail = String(STAMP).slice(-6);
const TZ = "Asia/Kolkata";
const CLASS_NAME = `ZZ Office Class 4 ${STAMP}`;

let schoolId = "";
let otherSchoolId = "";
let classId = "";
let otherClassId = "";
let adminUserId = "";
let adminMembershipId = "";
let principalUserId = "";
let teacherUserId = "";
let teacherMembershipId = "";
let pupilUserId = "";
let pupilMembershipId = "";
let loneMembershipId = "";
let strangerMembershipId = "";
let parentUserId = "";
let inviteId = "";
let revokedInviteId = "";
let otherInviteId = "";
let periodId = "";
let otherPeriodId = "";
let seriesId = "";
let otherSeriesId = "";
let postId = "";
let otherPostId = "";
let commentId = "";
let postReportId = "";
let commentReportId = "";
const imageFileId = `${randomUUID()}.png`;
const pdfFileId = `${randomUUID()}.pdf`;

const get = (path: string) => new Request(`http://localhost${path}`);
const json = (body: unknown) =>
  new Request("http://localhost/x", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
const params = <T extends Record<string, string>>(p: T) => ({ params: Promise.resolve(p) });
const E = "/api/v1/office/attendance/export";

async function as(userId: string, role: "ADMIN" | "PRINCIPAL" | "TEACHER" | "STUDENT") {
  __resetCookies();
  await createSession(userId, { schoolId, role });
}
const asAdmin = () => as(adminUserId, "ADMIN");

beforeAll(async () => {
  const school = await db.school.create({
    data: { name: `ZZ Office School ${STAMP}`, slug: `zz-office-${STAMP}`, code: `ZO${tail}`, contactEmail: `zz-office-${STAMP}@test.invalid`, timezone: TZ },
    select: { id: true },
  });
  schoolId = school.id;
  const other = await db.school.create({
    data: { name: `ZZ Office Other ${STAMP}`, slug: `zz-officeo-${STAMP}`, code: `ZQ${tail}`, contactEmail: `zz-officeo-${STAMP}@test.invalid`, timezone: TZ },
    select: { id: true },
  });
  otherSchoolId = other.id;

  const [admin, principal, teacher, pupil, lone, parent, stranger] = await Promise.all(
    ["Admin", "Principal", "Teacher", "Pupil", "Lone", "Parent", "Stranger"].map((who) =>
      db.user.create({ data: { name: `ZZ Office ${who}`, email: `zz-office-${who.toLowerCase()}-${STAMP}@test.invalid` }, select: { id: true } }),
    ),
  );
  adminUserId = admin!.id;
  principalUserId = principal!.id;
  teacherUserId = teacher!.id;
  pupilUserId = pupil!.id;
  parentUserId = parent!.id;

  const am = await db.membership.create({ data: { userId: adminUserId, schoolId, role: "ADMIN", status: "ACTIVE" }, select: { id: true } });
  adminMembershipId = am.id;
  await db.membership.create({ data: { userId: principalUserId, schoolId, role: "PRINCIPAL", status: "ACTIVE" } });
  const tm = await db.membership.create({ data: { userId: teacherUserId, schoolId, role: "TEACHER", status: "ACTIVE" }, select: { id: true } });
  teacherMembershipId = tm.id;
  const pm = await db.membership.create({ data: { userId: pupilUserId, schoolId, role: "STUDENT", status: "ACTIVE", studentCode: `ZOP${STAMP}` }, select: { id: true } });
  pupilMembershipId = pm.id;
  const lm = await db.membership.create({ data: { userId: lone!.id, schoolId, role: "STUDENT", status: "ACTIVE", studentCode: `ZOL${STAMP}` }, select: { id: true } });
  loneMembershipId = lm.id;
  const sm = await db.membership.create({ data: { userId: stranger!.id, schoolId: otherSchoolId, role: "STUDENT", status: "ACTIVE", studentCode: `ZOS${STAMP}` }, select: { id: true } });
  strangerMembershipId = sm.id;
  await db.guardianship.create({ data: { parentUserId, studentMembershipId: pupilMembershipId, studentSchoolId: schoolId, status: "ACTIVE" } });

  const klass = await db.class.create({ data: { schoolId, name: CLASS_NAME, gradeLevel: "4", joinCode: `ZO${tail}` }, select: { id: true } });
  classId = klass.id;
  await db.classTeacher.create({ data: { classId, schoolId, teacherMembershipId, role: "LEAD" } });
  await db.enrollment.create({ data: { classId, schoolId, studentMembershipId: pupilMembershipId, status: "ACTIVE" } });
  await db.enrollment.create({ data: { classId, schoolId, studentMembershipId: loneMembershipId, status: "ACTIVE" } });
  const otherClass = await db.class.create({ data: { schoolId: otherSchoolId, name: "ZZ Office Elsewhere", gradeLevel: "4", joinCode: `ZQ${tail}` }, select: { id: true } });
  otherClassId = otherClass.id;

  // A register taken on the first of this month, so the export has a column.
  const month = todayKey(TZ).slice(0, 7);
  await db.attendanceSession.create({
    data: {
      schoolId,
      classId,
      dateKey: `${month}-01`,
      takenByMembershipId: teacherMembershipId,
      records: {
        create: [
          { schoolId, studentMembershipId: pupilMembershipId, status: "ABSENT" },
          { schoolId, studentMembershipId: loneMembershipId, status: "PRESENT" },
        ],
      },
    },
  });

  const expiresAt = new Date(Date.now() + 7 * 86_400_000);
  const invite = (email: string, school = schoolId, status = "PENDING") =>
    db.invite.create({
      data: { schoolId: school, role: "TEACHER", email, name: "ZZ Office Invitee", status, tokenHash: hashToken(generateToken()), createdByMembershipId: school === schoolId ? adminMembershipId : null, expiresAt },
      select: { id: true },
    });
  inviteId = (await invite(`zz-office-invitee-${STAMP}@test.invalid`)).id;
  revokedInviteId = (await invite(`zz-office-revoked-${STAMP}@test.invalid`, schoolId, "REVOKED")).id;
  otherInviteId = (await invite(`zz-office-other-invitee-${STAMP}@test.invalid`, otherSchoolId)).id;

  periodId = (await db.timetablePeriod.create({ data: { schoolId, name: "ZZ Period 1", startMinute: 540, endMinute: 585, kind: "LESSON", position: 1 }, select: { id: true } })).id;
  otherPeriodId = (await db.timetablePeriod.create({ data: { schoolId: otherSchoolId, name: "ZZ Elsewhere 1", startMinute: 540, endMinute: 585, kind: "LESSON", position: 1 }, select: { id: true } })).id;
  await db.timetableSlot.create({ data: { schoolId, classId, periodId, weekday: 2, subject: "Mathematics", teacherMembershipId } });

  seriesId = (await db.examSeries.create({ data: { schoolId, name: "ZZ Office Unit Test", gradeLevel: "4" }, select: { id: true } })).id;
  otherSeriesId = (await db.examSeries.create({ data: { schoolId: otherSchoolId, name: "ZZ Office Elsewhere Test", gradeLevel: "4" }, select: { id: true } })).id;

  // The only content this file decides: a post and a comment it wrote, each reported by its own pupil.
  postId = (await db.post.create({ data: { schoolId, authorUserId: teacherUserId, authorMembershipId: teacherMembershipId, scope: "SCHOOL", title: "ZZ Office reported post", status: "APPROVED" }, select: { id: true } })).id;
  otherPostId = (await db.post.create({ data: { schoolId: otherSchoolId, authorUserId: stranger!.id, scope: "SCHOOL", title: "ZZ Office elsewhere post", status: "APPROVED" }, select: { id: true } })).id;
  commentId = (await db.comment.create({ data: { postId, schoolId, authorUserId: pupilUserId, body: "ZZ Office reported comment" }, select: { id: true } })).id;
  postReportId = (await db.report.create({ data: { schoolId, targetType: "POST", targetId: postId, reporterUserId: pupilUserId, reason: "SPAM" }, select: { id: true } })).id;
  commentReportId = (await db.report.create({ data: { schoolId, targetType: "COMMENT", targetId: commentId, reporterUserId: teacherUserId, reason: "SPAM" }, select: { id: true } })).id;

  // Two files the admin uploaded from the phone and has not used yet; no bytes are needed to name them.
  await db.uploadTicket.create({ data: { userId: adminUserId, fileId: imageFileId, mime: "image/png", size: 4096 } });
  await db.uploadTicket.create({ data: { userId: adminUserId, fileId: pdfFileId, mime: "application/pdf", size: 4096 } });
});

afterAll(async () => {
  __resetCookies();
  const users = [adminUserId, principalUserId, teacherUserId, pupilUserId, parentUserId];
  await db.session.deleteMany({ where: { userId: { in: users } } });
  await db.uploadTicket.deleteMany({ where: { fileId: { in: [imageFileId, pdfFileId] } } });
  await db.outboundEmail.deleteMany({ where: { to: { contains: `-${STAMP}@test.invalid` } } });
  await db.school.deleteMany({ where: { id: { in: [schoolId, otherSchoolId] } } });
  await db.user.deleteMany({ where: { email: { contains: `-${STAMP}@test.invalid` } } });
  await db.$disconnect();
});

/* -------------------------------------------------------------------------- */
/* The gates, across every handler                                             */
/* -------------------------------------------------------------------------- */

/** Every handler with a request that would pass parsing, so a refusal is the gate's and not the parser's. */
function everyHandler(): { name: string; call: () => Promise<Response> }[] {
  return [
    { name: "invites preview", call: () => invitePreviewPost(json({ csv: "x@test.invalid" })) },
    { name: "invite resend", call: () => inviteResendPost(json({}), params({ inviteId })) },
    { name: "intake preview", call: () => intakePreviewPost(json({ csv: "name\nZZ Nobody" })) },
    { name: "directory", call: () => directoryPost(json({ about: "ZZ", admissionsContactMembershipId: null })) },
    { name: "directory publish", call: () => publishPost(json({ published: false })) },
    { name: "logo", call: () => logoPost(json({ fileId: null })) },
    { name: "take down", call: () => takeDownPost(json({ targetType: "POST", targetId: postId, note: "ZZ gate" })) },
    { name: "dismiss", call: () => dismissPost(json({ targetType: "COMMENT", targetId: commentId, note: "ZZ gate" })) },
    { name: "alert", call: () => alertPost(json({ studentMembershipId: pupilMembershipId })) },
    { name: "register export", call: () => registerGet(get(`${E}/register?classId=${classId}&month=2026-09`)) },
    { name: "enrolment export", call: () => enrolmentGet() },
    { name: "period", call: () => periodPost(json({ name: "ZZ", startMinute: 540, endMinute: 585, kind: "LESSON" }), params({ periodId })) },
    { name: "period retire", call: () => retirePost(json({ retired: true }), params({ periodId })) },
    { name: "slot clear", call: () => slotClearPost(json({ classId, periodId, weekday: 2 })) },
    { name: "series archive", call: () => seriesArchivePost(json({}), params({ seriesId })) },
    { name: "housekeeping", call: () => housekeepingPost(json({ autoReadDays: null, expireDays: null })) },
  ];
}

describe("the gates", () => {
  it("every handler answers 401 signed out, in the contract's envelope", async () => {
    __resetCookies();
    for (const h of everyHandler()) {
      const res = await h.call();
      expect(res.status, h.name).toBe(401);
      expect(await res.json()).toMatchObject({ code: "UNAUTHORIZED" });
    }
  });

  it("the office's alone: a pupil, a teacher and the head are refused everywhere, and nothing changed", async () => {
    for (const [userId, role] of [
      [pupilUserId, "STUDENT"],
      [teacherUserId, "TEACHER"],
      [principalUserId, "PRINCIPAL"],
    ] as const) {
      await as(userId, role);
      for (const h of everyHandler()) {
        const res = await h.call();
        expect(res.status, `${role} ${h.name}`).toBe(403);
      }
    }
    expect(await db.report.count({ where: { id: { in: [postReportId, commentReportId] }, status: "OPEN" } })).toBe(2);
    expect(await db.timetableSlot.count({ where: { classId } })).toBe(1);
  });
});

/* -------------------------------------------------------------------------- */
/* The office                                                                  */
/* -------------------------------------------------------------------------- */

describe("invitations and intake", () => {
  beforeAll(asAdmin);

  it("invite preview: the valid rows and the problems, writing nothing; an empty list is 422", async () => {
    const before = await db.invite.count({ where: { schoolId } });
    const res = await invitePreviewPost(json({ csv: `name,email,subjects\nZZ New Teacher,zz-office-new-${STAMP}@test.invalid,Mathematics\nZZ Broken,not-an-address,` }));
    expect(res.status).toBe(200);
    const body = officeInvitePreviewSchema.parse(await res.json());
    expect(body.valid).toEqual([{ line: 2, name: "ZZ New Teacher", email: `zz-office-new-${STAMP}@test.invalid`, subjects: ["Mathematics"] }]);
    expect(body.problems).toHaveLength(1);
    expect(body.problems[0]!.reasonKey).toBeTruthy();
    expect(await db.invite.count({ where: { schoolId } })).toBe(before);
    expect((await invitePreviewPost(json({ csv: "" }))).status).toBe(422);
  });

  it("resend: a fresh link for a pending invite; a revoked one is refused with the reason; another school's is a 404", async () => {
    const before = await db.invite.findUniqueOrThrow({ where: { id: inviteId }, select: { tokenHash: true } });
    const res = await inviteResendPost(json({}), params({ inviteId }));
    expect(res.status).toBe(200);
    expect(okSchema.parse(await res.json())).toEqual({ ok: true });
    const after = await db.invite.findUniqueOrThrow({ where: { id: inviteId }, select: { tokenHash: true } });
    expect(after.tokenHash).not.toBe(before.tokenHash);
    expect(await db.outboundEmail.count({ where: { to: `zz-office-invitee-${STAMP}@test.invalid` } })).toBe(1);

    const revoked = await inviteResendPost(json({}), params({ inviteId: revokedInviteId }));
    expect(revoked.status).toBe(422);
    expect((await revoked.json()).error).toBeTruthy();
    const elsewhere = await inviteResendPost(json({}), params({ inviteId: otherInviteId }));
    expect(elsewhere.status).toBe(404);
    expect(await elsewhere.json()).toMatchObject({ code: "NOT_FOUND" });
  });

  it("intake preview: rows parsed against the school's classes, a transfer flagged, nobody admitted; an empty list is 422", async () => {
    const before = await db.membership.count({ where: { schoolId, role: "STUDENT" } });
    const res = await intakePreviewPost(json({ csv: `name,class,student code\nZZ Office Intake One,${CLASS_NAME},\nZZ Office Intake Two,ZZ No Such Class,\nZZ Office Intake Three,${CLASS_NAME},ZOX${STAMP}` }));
    expect(res.status).toBe(200);
    const body = officeIntakePreviewSchema.parse(await res.json());
    expect(body.valid.map((r) => [r.name, r.unknownClass, r.transfer])).toEqual([
      ["ZZ Office Intake One", false, false],
      ["ZZ Office Intake Two", true, false],
      ["ZZ Office Intake Three", false, true],
    ]);
    expect(body.recognised).toMatchObject({ name: true, className: true });
    expect(await db.membership.count({ where: { schoolId, role: "STUDENT" } })).toBe(before);
    expect((await intakePreviewPost(json({}))).status).toBe(422);
  });
});

describe("the directory profile and the logo", () => {
  beforeAll(asAdmin);

  it("publishing needs a contact; the profile saves one; a published profile cannot lose it; a pupil is no contact", async () => {
    const early = await publishPost(json({ published: true }));
    expect(early.status).toBe(422);
    expect((await early.json()).error).toBeTruthy();

    const pupil = await directoryPost(json({ about: "ZZ A school.", admissionsContactMembershipId: pupilMembershipId }));
    expect(pupil.status).toBe(422);

    const saved = await directoryPost(json({ about: "ZZ A small school by the river.", admissionsContactMembershipId: adminMembershipId }));
    expect(saved.status).toBe(200);
    expect(okSchema.parse(await saved.json())).toEqual({ ok: true });
    expect(await db.school.findUniqueOrThrow({ where: { id: schoolId }, select: { profileAbout: true, admissionsContactMembershipId: true } })).toEqual({
      profileAbout: "ZZ A small school by the river.",
      admissionsContactMembershipId: adminMembershipId,
    });

    expect((await publishPost(json({ published: true }))).status).toBe(200);
    expect((await db.school.findUniqueOrThrow({ where: { id: schoolId }, select: { profilePublishedAt: true } })).profilePublishedAt).not.toBeNull();
    expect((await directoryPost(json({ about: "ZZ", admissionsContactMembershipId: null }))).status).toBe(422);

    expect((await publishPost(json({ published: false }))).status).toBe(200);
    expect((await db.school.findUniqueOrThrow({ where: { id: schoolId }, select: { profilePublishedAt: true } })).profilePublishedAt).toBeNull();
    expect((await publishPost(json({ published: "yes" }))).status).toBe(422);
  });

  it("logo: an uploaded image becomes the logo once; a PDF is refused; another's or a spent id is a 404; null takes it off", async () => {
    const pdf = await logoPost(json({ fileId: pdfFileId }));
    expect(pdf.status).toBe(422);
    expect((await pdf.json()).error).toBeTruthy();

    const res = await logoPost(json({ fileId: imageFileId }));
    expect(res.status).toBe(200);
    expect(officeLogoSchema.parse(await res.json())).toEqual({ logoPath: imageFileId });
    expect((await db.school.findUniqueOrThrow({ where: { id: schoolId }, select: { logoPath: true } })).logoPath).toBe(imageFileId);

    expect((await logoPost(json({ fileId: imageFileId }))).status).toBe(404);
    expect((await logoPost(json({ fileId: `${randomUUID()}.png` }))).status).toBe(404);

    const off = await logoPost(json({ fileId: null }));
    expect(officeLogoSchema.parse(await off.json())).toEqual({ logoPath: null });
    expect((await db.school.findUniqueOrThrow({ where: { id: schoolId }, select: { logoPath: true } })).logoPath).toBeNull();
    expect((await logoPost(json({}))).status).toBe(422);
  });
});

describe("safety", () => {
  beforeAll(asAdmin);

  it("take down: this file's reported post is rejected with the note and its report actioned; a blank note is 422; another school's is a 404", async () => {
    expect((await takeDownPost(json({ targetType: "POST", targetId: postId, note: "   " }))).status).toBe(422);
    const elsewhere = await takeDownPost(json({ targetType: "POST", targetId: otherPostId, note: "ZZ not yours" }));
    expect(elsewhere.status).toBe(404);
    expect((await db.post.findUniqueOrThrow({ where: { id: otherPostId }, select: { status: true } })).status).toBe("APPROVED");

    const res = await takeDownPost(json({ targetType: "POST", targetId: postId, note: "ZZ Not for the school feed." }));
    expect(res.status).toBe(200);
    expect(okSchema.parse(await res.json())).toEqual({ ok: true });
    expect(await db.post.findUniqueOrThrow({ where: { id: postId }, select: { status: true, rejectionReason: true } })).toEqual({ status: "REJECTED", rejectionReason: "ZZ Not for the school feed." });
    expect((await db.report.findUniqueOrThrow({ where: { id: postReportId }, select: { status: true } })).status).toBe("ACTIONED");
  });

  it("nothing wrong: this file's reported comment keeps its words and its report closes; a user-less target type is 422", async () => {
    expect((await dismissPost(json({ targetType: "CLASS", targetId: commentId, note: "ZZ" }))).status).toBe(422);
    const res = await dismissPost(json({ targetType: "COMMENT", targetId: commentId, note: "ZZ Fair comment." }));
    expect(res.status).toBe(200);
    expect(okSchema.parse(await res.json())).toEqual({ ok: true });
    expect(await db.report.findUniqueOrThrow({ where: { id: commentReportId }, select: { status: true, resolutionNote: true } })).toEqual({ status: "DISMISSED", resolutionNote: "ZZ Fair comment." });
    expect((await db.comment.findUniqueOrThrow({ where: { id: commentId }, select: { status: true } })).status).toBe("APPROVED");
  });
});

describe("attendance", () => {
  beforeAll(asAdmin);

  it("tell the family: once, then not again within the week; a child with no family tells nobody; another school's is a 404", async () => {
    const res = await alertPost(json({ studentMembershipId: pupilMembershipId }));
    expect(res.status).toBe(200);
    expect(officeAbsenceAlertSchema.parse(await res.json())).toEqual({ notified: 1, skipped: false });
    expect(await db.notification.count({ where: { userId: parentUserId, kind: "ATTENDANCE" } })).toBe(1);
    expect(officeAbsenceAlertSchema.parse(await (await alertPost(json({ studentMembershipId: pupilMembershipId }))).json())).toEqual({ notified: 0, skipped: true });
    expect(officeAbsenceAlertSchema.parse(await (await alertPost(json({ studentMembershipId: loneMembershipId }))).json())).toEqual({ notified: 0, skipped: false });
    expect((await alertPost(json({ studentMembershipId: strangerMembershipId }))).status).toBe(404);
    expect((await alertPost(json({}))).status).toBe(422);
  });

  it("register export: the month as CSV text with the pupils and their marks, audited; another school's class is a 404; a bad month is 422", async () => {
    const month = todayKey(TZ).slice(0, 7);
    const res = await registerGet(get(`${E}/register?classId=${classId}&month=${month}`));
    expect(res.status).toBe(200);
    const file = officeCsvExportSchema.parse(await res.json());
    expect(file.rows).toBe(2);
    expect(file.filename).toMatch(new RegExp(`^edulink-register-.*-${month}\\.csv$`));
    const lines = file.csv.trim().split(/\r?\n/);
    expect(lines[0]).toContain(`${month}-01`);
    expect(file.csv).toContain("ZZ Office Pupil");
    expect(await db.auditLog.count({ where: { schoolId, action: "compliance.export", targetId: classId } })).toBe(1);

    expect((await registerGet(get(`${E}/register?classId=${otherClassId}&month=${month}`))).status).toBe(404);
    expect((await registerGet(get(`${E}/register?classId=${classId}&month=2026-13`))).status).toBe(422);
  });

  it("enrolment export: a row per grade, nobody named", async () => {
    const res = await enrolmentGet();
    expect(res.status).toBe(200);
    const file = officeCsvExportSchema.parse(await res.json());
    expect(file.rows).toBe(1);
    expect(file.csv).toContain("pupils_enrolled");
    expect(file.csv).not.toContain("ZZ Office Pupil");
  });
});

describe("the timetable, exams and housekeeping", () => {
  beforeAll(asAdmin);

  it("a period is renamed and retimed; backwards times are refused; another school's is a 404", async () => {
    const res = await periodPost(json({ name: "ZZ Period One", startMinute: 545, endMinute: 590, kind: "LESSON" }), params({ periodId }));
    expect(res.status).toBe(200);
    expect(savedIdSchema.parse(await res.json())).toEqual({ ok: true, id: periodId });
    expect(await db.timetablePeriod.findUniqueOrThrow({ where: { id: periodId }, select: { name: true, startMinute: true, endMinute: true } })).toEqual({ name: "ZZ Period One", startMinute: 545, endMinute: 590 });
    const backwards = await periodPost(json({ name: "ZZ Backwards", startMinute: 600, endMinute: 540, kind: "LESSON" }), params({ periodId }));
    expect(backwards.status).toBe(422);
    expect((await backwards.json()).error).toBeTruthy();
    expect((await periodPost(json({ name: "ZZ", startMinute: 540, endMinute: 585, kind: "LESSON" }), params({ periodId: otherPeriodId }))).status).toBe(404);
  });

  it("a period is retired (its lesson kept), refused a second time, and brought back", async () => {
    expect(savedIdSchema.parse(await (await retirePost(json({ retired: true }), params({ periodId }))).json())).toEqual({ ok: true, id: periodId });
    expect(await db.timetableSlot.count({ where: { periodId } })).toBe(1);
    expect((await retirePost(json({ retired: true }), params({ periodId }))).status).toBe(422);
    expect((await retirePost(json({ retired: false }), params({ periodId }))).status).toBe(200);
    expect((await db.timetablePeriod.findUniqueOrThrow({ where: { id: periodId }, select: { archivedAt: true } })).archivedAt).toBeNull();
    expect((await retirePost(json({}), params({ periodId }))).status).toBe(422);
    expect((await retirePost(json({ retired: true }), params({ periodId: otherPeriodId }))).status).toBe(404);
  });

  it("a lesson is cleared from its cell; an empty cell is refused with the reason", async () => {
    const res = await slotClearPost(json({ classId, periodId, weekday: 2 }));
    expect(res.status).toBe(200);
    expect(okSchema.parse(await res.json())).toEqual({ ok: true });
    expect(await db.timetableSlot.count({ where: { classId } })).toBe(0);
    const again = await slotClearPost(json({ classId, periodId, weekday: 2 }));
    expect(again.status).toBe(422);
    expect((await again.json()).error).toBeTruthy();
    expect((await slotClearPost(json({ classId, periodId, weekday: 7 }))).status).toBe(422);
  });

  it("an exam series goes to the archive once; another school's is a 404", async () => {
    const res = await seriesArchivePost(json({}), params({ seriesId }));
    expect(res.status).toBe(200);
    expect(okSchema.parse(await res.json())).toEqual({ ok: true });
    expect((await db.examSeries.findUniqueOrThrow({ where: { id: seriesId }, select: { archivedAt: true } })).archivedAt).not.toBeNull();
    expect((await seriesArchivePost(json({}), params({ seriesId }))).status).toBe(404);
    expect((await seriesArchivePost(json({}), params({ seriesId: otherSeriesId }))).status).toBe(404);
  });

  it("housekeeping: days saved; out of range is 422 naming the range", async () => {
    const res = await housekeepingPost(json({ autoReadDays: 30, expireDays: 400 }));
    expect(res.status).toBe(200);
    expect(okSchema.parse(await res.json())).toEqual({ ok: true });
    const bad = await housekeepingPost(json({ autoReadDays: 1, expireDays: null }));
    expect(bad.status).toBe(422);
    expect((await bad.json()).error).toMatch(/7/);
    expect((await housekeepingPost(json({ autoReadDays: "soon" }))).status).toBe(422);
  });
});
