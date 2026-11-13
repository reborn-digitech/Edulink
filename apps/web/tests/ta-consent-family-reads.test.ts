/**
 * What a guardian READS of an adult college student (testing analysis of 13 November 2026, the 'consent'
 * batch). The family pages ask assertGuardianAccess with the page's grant; these readers took the child
 * straight from the guardianship, or asked one grant and printed what another guards.
 *
 *   TA-556  the progress report admitted a RESULTS guardian and printed the adult's attendance.
 *   TA-211  the remark threads' list, previews, search hits and new-message notices ignored MESSAGES.
 *   TA-239  the sessions library listed (and let a guardian book for) an adult who granted nothing.
 *   TA-240  the event stream joined a guardian to the adult's own channel, and a hand-in opened to any guardian.
 *   TA-459  the guardian's exam-marks read gathered every child's marks with no RESULTS grant.
 *   TA-067  the exam cell's read under RESULTS printed attendance percentages and the rupees each desk is owed.
 *   TA-110  the person export left out what a student reads themself (health, incidents, fees) and certificates.
 *
 * A scratch ZZ college of this suite's own (tests/ta-consent-fixture.ts): the adult has granted nothing
 * unless a case says so, and each case revokes what it granted.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { makeCollege, type College } from "./ta-consent-fixture";
import { createSession } from "@/lib/session";
import { __resetCookies, __setHeaders } from "../tests/stubs/next-headers";
import { channel } from "@/lib/realtime";
import { saveAttendanceBatch } from "@/lib/attendance";
import { buildProgressReport } from "@/lib/reports";
import { listThreads, replyToThread } from "@/lib/remarks";
import { searchEverything } from "@/lib/search";
import { bookSeat, familySessions } from "@/lib/gig-sessions";
import { authorizeFileRead } from "@/lib/files";
import { examMarksFor } from "@/lib/exams";
import { myExams } from "@/lib/exam-cell-after";
import { personExport } from "@/lib/person-export";
import { GET as eventsGet } from "@/app/api/v1/events/route";
import { addDaysToKey, todayKey } from "@/lib/dates";

let c: College;
let classId = "";
let threadId = "";
const FILE = `${randomUUID()}.pdf`;
const WORD = `zzquokka${Date.now()}`;

beforeAll(async () => {
  c = await makeCollege("reads");
  classId = (await c.db.class.create({ data: { schoolId: c.schoolId, name: "ZZ TA Consent SY-B", gradeLevel: "SY", joinCode: `ZTCR${c.stamp}` }, select: { id: true } })).id;
  await c.db.enrollment.createMany({ data: [c.adult.membershipId, c.minor.membershipId].map((studentMembershipId) => ({ classId, schoolId: c.schoolId, studentMembershipId, status: "ACTIVE" })) });
  // A register day for both, without telling anybody.
  await saveAttendanceBatch({
    schoolId: c.schoolId,
    classId,
    dateKey: todayKey("Asia/Kolkata"),
    marks: [c.adult.membershipId, c.minor.membershipId].map((studentMembershipId, i) => ({ studentMembershipId, status: "PRESENT" as const, clientId: `zz-tacons-reads-${c.stamp}-${i}` })),
    takenByMembershipId: c.teacher.membershipId,
    actorUserId: c.teacher.userId,
    notify: false,
  });
  // A thread between the adult's teacher and the family, with one message carrying a word to search for.
  threadId = (await c.db.remarkThread.create({ data: { schoolId: c.schoolId, studentMembershipId: c.adult.membershipId, teacherMembershipId: c.teacher.membershipId, subject: `ZZ TA-211 about the project ${c.stamp}` }, select: { id: true } })).id;
  await c.db.remarkMessage.create({ data: { threadId, schoolId: c.schoolId, authorUserId: c.teacher.userId, body: `ZZ the ${WORD} draft is due on Friday.` } });
  // A hand-in by the adult with one file.
  const assignment = await c.db.assignment.create({ data: { schoolId: c.schoolId, classId, authorMembershipId: c.teacher.membershipId, title: "ZZ TA-240 essay", publishedAt: new Date() }, select: { id: true } });
  await c.db.submission.create({ data: { schoolId: c.schoolId, assignmentId: assignment.id, studentMembershipId: c.adult.membershipId, status: "SUBMITTED", submittedAt: new Date(), attachments: JSON.stringify([{ fileId: FILE, name: "essay.pdf", size: 10, mime: "application/pdf" }]) } });
}, 60_000);

afterAll(async () => {
  __resetCookies();
  __setHeaders({});
  await c.cleanup();
});

describe("TA-556: the progress report", () => {
  it("TA-556: a guardian granted RESULTS only reads the adult's marks and not their attendance", async () => {
    await c.grant(c.adult.membershipId, "RESULTS");
    const report = await buildProgressReport(c.ctx(c.guardianOfAdult, "PARENT"), c.adult.membershipId);
    expect(report.attendance.total).toBe(0);
    expect(report.attendance.percent).toBeNull();
    expect(report.attendance.withheld).toBe(true);
    await c.grant(c.adult.membershipId, "ATTENDANCE");
    const both = await buildProgressReport(c.ctx(c.guardianOfAdult, "PARENT"), c.adult.membershipId);
    expect(both.attendance.total).toBe(1);
    expect(both.attendance.withheld).toBe(false);
    await c.revokeAll(c.adult.membershipId);
  });

  it("TA-556: nor the attendance badges, which say the same days in other words; ATTENDANCE brings them back", async () => {
    // Four more days present before today's: a five-day run, so "here-all-week" is earned.
    for (const back of [1, 2, 3, 4]) {
      await saveAttendanceBatch({ schoolId: c.schoolId, classId, dateKey: addDaysToKey(todayKey("Asia/Kolkata"), -back), marks: [{ studentMembershipId: c.adult.membershipId, status: "PRESENT", clientId: `zz-tacons-reads-badge-${c.stamp}-${back}` }], takenByMembershipId: c.teacher.membershipId, actorUserId: c.teacher.userId, notify: false });
    }
    const own = await buildProgressReport(c.ctx(c.adult, "STUDENT"), c.adult.membershipId);
    expect(own.badges.map((b) => b.id)).toContain("here-all-week");
    await c.grant(c.adult.membershipId, "RESULTS");
    const parent = c.ctx(c.guardianOfAdult, "PARENT");
    const results = await buildProgressReport(parent, c.adult.membershipId);
    expect(results.badges.map((b) => b.id).filter((id) => id === "here-all-week" || id === "regular")).toEqual([]);
    await c.grant(c.adult.membershipId, "ATTENDANCE");
    expect((await buildProgressReport(parent, c.adult.membershipId)).badges.map((b) => b.id)).toContain("here-all-week");
    await c.revokeAll(c.adult.membershipId);
  });
});

describe("TA-211: remark threads and an adult who has not granted MESSAGES", () => {
  it("TA-211: the guardian's list and search hold no thread about the adult, and a new message tells them nothing", async () => {
    const parent = c.ctx(c.guardianOfAdult, "PARENT");
    expect((await listThreads(parent)).map((t) => t.id)).not.toContain(threadId);
    expect((await searchEverything(parent, { q: WORD, limit: 10 })).messages.map((h) => h.id)).not.toContain(threadId);
    await replyToThread(c.ctx(c.teacher, "TEACHER"), { threadId, body: "ZZ a second note." });
    expect(await c.db.notification.count({ where: { userId: c.guardianOfAdult.userId, kind: "REMARK" } })).toBe(0);
    // The student is still told.
    expect(await c.db.notification.count({ where: { userId: c.adult.userId, kind: "REMARK" } })).toBe(1);
  });

  it("TA-211: under the MESSAGES grant the list, the search and the notice come back", async () => {
    await c.grant(c.adult.membershipId, "MESSAGES");
    const parent = c.ctx(c.guardianOfAdult, "PARENT");
    expect((await listThreads(parent)).map((t) => t.id)).toContain(threadId);
    expect((await searchEverything(parent, { q: WORD, limit: 10 })).messages.map((h) => h.id)).toContain(threadId);
    await replyToThread(c.ctx(c.teacher, "TEACHER"), { threadId, body: "ZZ a third note." });
    expect(await c.db.notification.count({ where: { userId: c.guardianOfAdult.userId, kind: "REMARK" } })).toBe(1);
    await c.revokeAll(c.adult.membershipId);
  });
});

describe("TA-239: sessions and an adult college student", () => {
  it("TA-239: the guardian's sessions list holds the minor alone, and a seat in the adult's name is refused", async () => {
    const parent = c.ctx(c.guardian, "PARENT");
    expect((await familySessions(parent)).children.map((x) => x.id)).toEqual([c.minor.membershipId]);
    await expect(bookSeat(parent, { slotId: "zz-none", studentMembershipId: c.adult.membershipId, purpose: "ZZ help with the essay, please." })).rejects.toThrow("gigs.noSuchChild");
  });
});

describe("TA-240: the event stream's channels and the hand-in file", () => {
  it("TA-240: a guardian's stream carries the minor's channel and not the adult's until RESULTS, MESSAGES and HOSTEL_TRANSPORT are all granted", async () => {
    const channels = async () => {
      __resetCookies();
      __setHeaders({});
      await createSession(c.guardian.userId, { schoolId: null, role: "PARENT" });
      const controller = new AbortController();
      const res = await eventsGet(new Request("http://localhost/api/v1/events", { signal: controller.signal }));
      const reader = res.body!.getReader();
      const first = new TextDecoder().decode((await reader.read()).value);
      controller.abort();
      await reader.cancel().catch(() => undefined);
      return (JSON.parse(/^data: (.*)$/m.exec(first)![1]!) as { channels: string[] }).channels;
    };
    const before = await channels();
    expect(before).toContain(channel.student(c.minor.membershipId));
    expect(before).not.toContain(channel.student(c.adult.membershipId));
    for (const grant of ["RESULTS", "MESSAGES", "HOSTEL_TRANSPORT"] as const) await c.grant(c.adult.membershipId, grant);
    expect(await channels()).toContain(channel.student(c.adult.membershipId));
    await c.revokeAll(c.adult.membershipId);
  });

  it("TA-240: the adult's hand-in does not open to their guardian without RESULTS, and does with it", async () => {
    const parent = c.ctx(c.guardianOfAdult, "PARENT");
    expect((await authorizeFileRead(FILE, parent)).allowed).toBe(false);
    await c.grant(c.adult.membershipId, "RESULTS");
    expect((await authorizeFileRead(FILE, parent)).allowed).toBe(true);
    await c.revokeAll(c.adult.membershipId);
  });
});

describe("TA-459: a guardian's exam marks", () => {
  it("TA-459: hold no row for the adult without RESULTS, and one with it", async () => {
    const parent = c.ctx(c.guardian, "PARENT");
    expect((await examMarksFor(parent)).map((m) => m.studentMembershipId)).toEqual([c.minor.membershipId]);
    await c.grant(c.adult.membershipId, "RESULTS");
    expect((await examMarksFor(parent)).map((m) => m.studentMembershipId).sort()).toEqual([c.adult.membershipId, c.minor.membershipId].sort());
    await c.revokeAll(c.adult.membershipId);
  });
});

describe("TA-067: the exam cell's read for a guardian with RESULTS only", () => {
  it("TA-067: gives no attendance note and no desk's dues; ATTENDANCE and MONEY bring them back", async () => {
    await c.db.schoolModule.create({ data: { schoolId: c.schoolId, module: "EXAMS" } });
    const session = await c.db.examSession.create({ data: { schoolId: c.schoolId, name: `ZZ TA-067 Winter ${c.stamp}`, termId: "zz-term", status: "FORMS" }, select: { id: true } });
    const snapshot = { courses: [{ courseId: "zz-course", percent: 52, threshold: 75, condoned: false }], noDues: [{ desk: "ACCOUNTS", cleared: false, owedPaise: 450_000, itemsOut: 0 }] };
    await c.db.examForm.create({ data: { schoolId: c.schoolId, sessionId: session.id, studentMembershipId: c.adult.membershipId, eligibilityJson: JSON.stringify(snapshot), status: "DRAFT" } });
    await c.grant(c.adult.membershipId, "RESULTS");
    const parent = c.ctx(c.guardianOfAdult, "PARENT");
    const read = await myExams(parent, c.adult.membershipId);
    expect(read.forms).toHaveLength(1);
    expect(read.forms[0]!.eligibilityNote).toBeNull();
    expect(read.forms[0]!.noDuesLines).toEqual([]);
    await c.grant(c.adult.membershipId, "ATTENDANCE");
    await c.grant(c.adult.membershipId, "MONEY");
    const full = await myExams(parent, c.adult.membershipId);
    expect(full.forms[0]!.eligibilityNote).toContain("52%");
    expect(full.forms[0]!.noDuesLines).toHaveLength(1);
    // The student reads their own whatever they granted.
    await c.revokeAll(c.adult.membershipId);
    const own = await myExams(c.ctx(c.adult, "STUDENT"));
    expect(own.forms[0]!.noDuesLines).toHaveLength(1);
  });

  it("TA-067: gives no exam fee, late fee or paid status without MONEY; MONEY brings them back", async () => {
    const year = await c.db.academicYear.create({ data: { schoolId: c.schoolId, name: `ZZ TA-067 ${c.stamp}`, startDate: new Date("2026-06-01T00:00:00.000Z"), endDate: new Date("2027-05-31T00:00:00.000Z") }, select: { id: true } });
    const demand = await c.db.feeDemand.create({ data: { schoolId: c.schoolId, studentMembershipId: c.adult.membershipId, academicYearId: year.id, label: "ZZ TA-067 exam fee", dueDate: new Date("2026-11-30T00:00:00.000Z"), grossPaise: 160_000, netPaise: 160_000, paidPaise: 160_000, status: "PAID" }, select: { id: true } });
    const session = await c.db.examSession.create({ data: { schoolId: c.schoolId, name: `ZZ TA-067 Summer ${c.stamp}`, termId: "zz-term", status: "FORMS" }, select: { id: true } });
    await c.db.examForm.create({ data: { schoolId: c.schoolId, sessionId: session.id, studentMembershipId: c.adult.membershipId, status: "SUBMITTED", eligible: true, noDues: true, feePaise: 150_000, lateFeePaise: 10_000, feeDemandId: demand.id } });
    await c.grant(c.adult.membershipId, "RESULTS");
    const parent = c.ctx(c.guardianOfAdult, "PARENT");
    const formOf = async () => (await myExams(parent, c.adult.membershipId)).forms.find((f) => f.sessionId === session.id)!;
    const withheld = await formOf();
    expect(withheld.status).toBe("SUBMITTED");
    expect([withheld.feePaise, withheld.lateFeePaise, withheld.demandStatus, withheld.moneyWithheld]).toEqual([0, 0, null, true]);
    await c.grant(c.adult.membershipId, "MONEY");
    const shown = await formOf();
    expect([shown.feePaise, shown.lateFeePaise, shown.demandStatus, shown.moneyWithheld]).toEqual([150_000, 10_000, "PAID", undefined]);
    await c.revokeAll(c.adult.membershipId);
    const own = (await myExams(c.ctx(c.adult, "STUDENT"))).forms.find((f) => f.sessionId === session.id)!;
    expect([own.feePaise, own.demandStatus]).toEqual([150_000, "PAID"]);
  });
});

describe("TA-110: the person export", () => {
  it("TA-110: an adult's own export carries their health card, incidents, fees and certificates", async () => {
    await c.db.school.update({ where: { id: c.schoolId }, data: { pupilFeeViewAge: 18 } });
    await c.db.issuedCertificate.create({ data: { schoolId: c.schoolId, studentMembershipId: c.adult.membershipId, kind: "BONAFIDE", locale: "en", serial: "ZZ-TA110-1", number: 1, title: "Bonafide certificate", code: `ZZ110${c.stamp}` } });
    const file = await personExport(c.ctx(c.adult, "STUDENT") as Parameters<typeof personExport>[0]);
    const doc = file.document;
    expect(doc.sections).toEqual(expect.arrayContaining(["health", "incidents", "fees", "certificates", "certificateRequests"]));
    expect((doc.certificates as { serial: string }[]).map((x) => x.serial)).toEqual(["ZZ-TA110-1"]);
  });

  it("TA-110: a minor at the college with no self-read age set still gets neither health nor incidents", async () => {
    const file = await personExport(c.ctx(c.minor, "STUDENT") as Parameters<typeof personExport>[0]);
    expect(file.document.sections).not.toContain("health");
    expect(file.document.sections).not.toContain("incidents");
    expect(file.document.sections).toContain("certificates");
  });
});
