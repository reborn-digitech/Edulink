/**
 * THE ZZ EXAM CELL (the college exam cell, 4 October 2026), built by
 * `npm run zz:fixtures` after the colleges and their academics.
 *
 *   ZZ Vidya College (affiliated):
 *     - last term's sitting, PUBLISHED: "ZZ Summer 2026 (even term 2025–26)"
 *       on a past term of its own (ZZ Even term 2025–26), PHY201 and CHE201,
 *       the university's result file imported for zz.cstudent01–03, run 1
 *       published: cstudent01 SGPA 8.00, cstudent02 9.00, cstudent03 ATKT
 *       with CHE201 failed — one backlog — and a revaluation of it decided
 *       unchanged; cstudent02's grade card issued (check code ZZEXGC0001);
 *       credits waiting for the Academic Bank; hall tickets, seats and a duty
 *       done.
 *     - this term's sitting, TAKING FORMS: "ZZ Winter 2026 (odd term
 *       2026–27)" on the academics fixture's term, the window open for
 *       twenty days, ₹250 a course and ₹300 a backlog under the ZZ exam-fee
 *       head; forms for the three from their registrations (cstudent03's
 *       carries the CHE201 backlog and is short of attendance in PHY101, so
 *       submitting is refused), cstudent02's approved with hall ticket
 *       HT0001, PHY101 on the date sheet in ZZ Hall B with zz.faculty02 on
 *       duty.
 *
 *   ZZ Shastri Autonomous College: a minimal department, programme, scheme,
 *   course and term of its own (it has none from the academics fixture);
 *   "ZZ Autonomous Winter 2026" in CONDUCT, one paper with zz.faculty.s1's
 *   question paper SEALED (when FEES_SECRET_KEY is set) and an assessment
 *   bundle allotted.
 *
 * Every id is fixed (src/lib/api-catalog/exams-fixture.ts). Re-run safe:
 * every row is written by its id or its unique key.
 */
import type { PrismaClient } from "@prisma/client";
import { EXAMS_FIXTURE as F } from "../src/lib/api-catalog/exams-fixture";
import { ACADEMICS_FIXTURE as A } from "../src/lib/api-catalog/academics-fixture";
import { classFor, courseOutcome, gradingTableOf, rulesOf, sgpaHundredths, termStatusOf } from "../src/lib/exam-cell-rules";

const DAY = 86_400_000;
const PUBLISHED_AT = new Date("2026-05-20T06:30:00Z");

/** A small, valid one-page PDF that says what it is: the sealed paper's contents. */
function fixturePdf(): Buffer {
  const text = "ZZ fixture question paper: Q1 (CO1, 10 marks) Explain double-entry bookkeeping.";
  const stream = `BT /F1 12 Tf 50 750 Td (${text}) Tj ET`;
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  ];
  let out = "%PDF-1.4\n";
  const offsets: number[] = [];
  objects.forEach((o, i) => {
    offsets.push(out.length);
    out += `${i + 1} 0 obj\n${o}\nendobj\n`;
  });
  const xref = out.length;
  out += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets.map((o) => `${String(o).padStart(10, "0")} 00000 n \n`).join("")}`;
  out += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(out, "latin1");
}

export async function buildCollegeExams(db: PrismaClient): Promise<{ published: number; forms: number; sealed: boolean } | null> {
  const vidya = await db.school.findUnique({ where: { slug: "zz-vidya-college" }, select: { id: true, name: true, affiliatingUniversity: true } });
  const shastri = await db.school.findUnique({ where: { slug: "zz-shastri-college" }, select: { id: true } });
  const scheme = await db.scheme.findUnique({ where: { id: A.scheme(1) }, select: { gradingTable: true, passingRules: true } });
  if (!vidya || !shastri || !scheme) return null;
  const s = vidya.id;
  const member = async (schoolId: string, email: string, role: string) => {
    const m = await db.membership.findFirst({ where: { schoolId, role, status: "ACTIVE", user: { email } }, select: { id: true, userId: true, studentCode: true, user: { select: { name: true } } } });
    if (!m) throw new Error(`zz-exams: ${email} (${role}) is missing; run the colleges first`);
    return m;
  };
  const [ctrl, f1, f2, st1, st2, st3] = await Promise.all([
    member(s, "zz.examctrl@zz.test", "EXAM_CONTROLLER"),
    member(s, "zz.faculty01@zz.test", "FACULTY"),
    member(s, "zz.faculty02@zz.test", "FACULTY"),
    member(s, "zz.cstudent01@zz.test", "STUDENT"),
    member(s, "zz.cstudent02@zz.test", "STUDENT"),
    member(s, "zz.cstudent03@zz.test", "STUDENT"),
  ]);
  const students = [st1, st2, st3];
  const rules = rulesOf(scheme.passingRules);
  const table = gradingTableOf(scheme.gradingTable);

  // The exam-fee head the sessions raise their demands under: the college's own EXAM head if the office's fixture made one, else this builder's.
  // Keyed by (school, code), not by the fixed id: a ZEXM head left by an earlier run under another id (or a rebuilt college) made the id-keyed upsert hit the (schoolId, code) unique key and stop the whole zz:fixtures run.
  const ownHead = await db.feeHead.findFirst({ where: { schoolId: s, kind: "EXAM", retiredAt: null, code: { not: "ZEXM" } }, orderBy: { sortOrder: "asc" }, select: { id: true } });
  const feeHeadId = ownHead?.id ?? (await db.feeHead.upsert({ where: { schoolId_code: { schoolId: s, code: "ZEXM" } }, create: { id: F.feeHead, schoolId: s, name: "ZZ Exam fees", code: "ZEXM", kind: "EXAM" }, update: { retiredAt: null, kind: "EXAM" }, select: { id: true } })).id;

  /* ---------------------------------------------------- last term, published */
  const pastTerm = { schoolId: s, name: "ZZ Even term 2025–26", academicYear: "2025–26", startsOn: "2025-12-01", endsOn: "2026-04-30", registrationOpensOn: "2025-11-20", registrationClosesOn: "2025-12-10" };
  await db.academicTerm.upsert({ where: { id: F.pastTerm }, create: { id: F.pastTerm, ...pastTerm }, update: {} });
  const past = { schoolId: s, name: "ZZ Summer 2026 (even term 2025–26)", kind: "REGULAR", termId: F.pastTerm, formOpensAt: new Date("2026-03-01T04:00:00Z"), formClosesAt: new Date("2026-03-20T18:00:00Z"), feePerCoursePaise: 25000, feePerBacklogPaise: 30000, photocopyFeePaise: 10000, revalFeePaise: 40000, feeHeadId, status: "PUBLISHED", createdByUserId: ctrl.userId };
  await db.examSession.upsert({ where: { id: F.pastSession }, create: { id: F.pastSession, ...past }, update: { status: "PUBLISHED" } });
  const pastCourses = [A.course(5), A.course(6)];
  const courseRows = await db.course.findMany({ where: { id: { in: [...pastCourses, A.course(1), A.course(2), A.course(3), A.course(4)] } }, select: { id: true, code: true, name: true, creditsL: true, creditsT: true, creditsP: true } });
  const course = new Map(courseRows.map((c) => [c.id, c]));
  const credits = (id: string) => {
    const c = course.get(id)!;
    return (c.creditsL + c.creditsT + c.creditsP) * 10;
  };
  for (const [k, st] of students.entries()) {
    const data = { schoolId: s, sessionId: F.pastSession, studentMembershipId: st.id, coursesJson: JSON.stringify(pastCourses.map((courseId) => ({ courseId, kind: "REGULAR" }))), eligibilityJson: JSON.stringify({ eligible: true, courses: [], noDues: [] }), eligible: true, noDues: true, feePaise: 50000, status: "APPROVED", submittedAt: new Date("2026-03-05T06:00:00Z"), decidedAt: new Date("2026-03-06T06:00:00Z"), decidedByUserId: ctrl.userId, lockedAt: new Date("2026-04-01T06:00:00Z") };
    await db.examForm.upsert({ where: { id: F.form(k + 1) }, create: { id: F.form(k + 1), ...data }, update: { status: "APPROVED", lockedAt: data.lockedAt } });
  }
  for (const [n, courseId, at] of [[1, pastCourses[0]!, "2026-04-20T04:30:00Z"], [2, pastCourses[1]!, "2026-04-22T04:30:00Z"]] as const) {
    const c = course.get(courseId)!;
    await db.examSchedule.upsert({ where: { id: F.schedule(n) }, create: { id: F.schedule(n), schoolId: s, sessionId: F.pastSession, courseId, courseCode: c.code, courseName: c.name, at: new Date(at), durationMin: 180 }, update: { courseCode: c.code, courseName: c.name } });
    await db.examRoom.upsert({ where: { id: F.room(n) }, create: { id: F.room(n), schoolId: s, sessionId: F.pastSession, scheduleId: F.schedule(n), name: "ZZ Hall A", capacity: 40 }, update: {} });
    for (const [k, st] of students.entries()) {
      await db.seating.upsert({ where: { scheduleId_formId: { scheduleId: F.schedule(n), formId: F.form(k + 1) } }, create: { schoolId: s, scheduleId: F.schedule(n), examRoomId: F.room(n), seatNo: 1 + 2 * k, formId: F.form(k + 1), studentMembershipId: st.id }, update: {} });
    }
  }
  for (const [k, st] of students.entries()) {
    await db.hallTicket.upsert({ where: { id: F.ticket(k + 1) }, create: { id: F.ticket(k + 1), schoolId: s, sessionId: F.pastSession, formId: F.form(k + 1), studentMembershipId: st.id, number: `HT${String(k + 1).padStart(4, "0")}`, code: `ZZEXHT000${k + 1}`, issuedByUserId: ctrl.userId, issuedAt: new Date("2026-04-10T06:00:00Z") }, update: {} });
  }
  await db.invigilation.upsert({ where: { id: F.invigilation(1) }, create: { id: F.invigilation(1), schoolId: s, sessionId: F.pastSession, examRoomId: F.room(1), staffMembershipId: f1.id, status: "DONE" }, update: { status: "DONE" } });
  await db.remuneration.upsert({ where: { sessionId_staffMembershipId_kind: { sessionId: F.pastSession, staffMembershipId: f1.id, kind: "INVIGILATOR" } }, create: { schoolId: s, sessionId: F.pastSession, staffMembershipId: f1.id, kind: "INVIGILATOR", count: 1, ratePaise: 40000 }, update: {} });

  // The university's result file, imported: [internal, external] out of the scheme's 40 and 60.
  const marks: [number, number][][] = [
    [[32, 44], [30, 40]],
    [[36, 52], [34, 50]],
    [[28, 30], [20, 15]],
  ];
  for (const [k, st] of students.entries()) {
    for (const [j, courseId] of pastCourses.entries()) {
      const [internal, external] = marks[k]![j]!;
      const row = { schoolId: s, sessionId: F.pastSession, courseId, studentMembershipId: st.id, internalMilli: internal * 1000, externalMilli: external * 1000, matched: true, source: "IMPORT", version: 1, enteredByUserId: ctrl.userId };
      await db.examMark.upsert({ where: { sessionId_courseId_studentMembershipId_version: { sessionId: F.pastSession, courseId, studentMembershipId: st.id, version: 1 } }, create: row, update: { internalMilli: row.internalMilli, externalMilli: row.externalMilli, matched: true } });
    }
  }
  // Run 1, computed under the scheme exactly as the run computes it, and published.
  const computed = students.map((st, k) => {
    const rows = pastCourses.map((courseId, j) => {
      const [internal, external] = marks[k]![j]!;
      const out = courseOutcome({ internalMilli: internal * 1000, externalMilli: external * 1000, absent: false, graceMilli: 0 }, rules, table);
      return { courseId, kind: "REGULAR", creditsTenths: credits(courseId), internalMilli: internal * 1000, externalMilli: external * 1000, graceMilli: 0, totalMilli: out.totalMilli, maxMilli: out.maxMilli, grade: out.passed ? out.grade : "F", pointsTenths: out.passed ? out.pointsTenths : 0, status: out.passed ? "PASS" : "FAIL" };
    });
    const failed = rows.filter((r) => r.status !== "PASS").length;
    const status = termStatusOf(failed, rules.atktLimit);
    for (const r of rows) if (r.status === "FAIL" && status === "ATKT") r.status = "ATKT";
    const sgpa = sgpaHundredths(rows);
    return { st, rows, status, sgpa, attempted: rows.reduce((a, r) => a + r.creditsTenths, 0), earned: rows.filter((r) => r.status === "PASS").reduce((a, r) => a + r.creditsTenths, 0), cls: status === "PASS" ? classFor(sgpa, rules.classBands) : null };
  });
  const summary = { students: 3, passed: computed.filter((c) => c.status === "PASS").length, atkt: computed.filter((c) => c.status === "ATKT").length, failed: computed.filter((c) => c.status === "FAIL").length };
  await db.resultRun.upsert({ where: { id: F.run }, create: { id: F.run, schoolId: s, sessionId: F.pastSession, number: 1, status: "PUBLISHED", computedAt: PUBLISHED_AT, computedByUserId: ctrl.userId, publishedAt: PUBLISHED_AT, publishedByUserId: ctrl.userId, summaryJson: JSON.stringify(summary) }, update: { status: "PUBLISHED", summaryJson: JSON.stringify(summary) } });
  for (const c of computed) {
    for (const r of c.rows) await db.courseResult.upsert({ where: { runId_studentMembershipId_courseId: { runId: F.run, studentMembershipId: c.st.id, courseId: r.courseId } }, create: { schoolId: s, runId: F.run, studentMembershipId: c.st.id, ...r }, update: { ...r } });
    const term = { termId: F.pastTerm, sgpaHundredths: c.sgpa, creditsAttemptedTenths: c.attempted, creditsEarnedTenths: c.earned, status: c.status, cls: c.cls };
    await db.termResult.upsert({ where: { runId_studentMembershipId: { runId: F.run, studentMembershipId: c.st.id } }, create: { schoolId: s, runId: F.run, studentMembershipId: c.st.id, ...term }, update: term });
    await db.creditPush.upsert({ where: { studentMembershipId_termId: { studentMembershipId: c.st.id, termId: F.pastTerm } }, create: { schoolId: s, studentMembershipId: c.st.id, termId: F.pastTerm, runId: F.run, creditsTenths: c.earned }, update: { runId: F.run, creditsTenths: c.earned } });
    for (const r of c.rows.filter((x) => x.status !== "PASS")) {
      await db.backlog.upsert({ where: { studentMembershipId_courseId: { studentMembershipId: c.st.id, courseId: r.courseId } }, create: { schoolId: s, studentMembershipId: c.st.id, courseId: r.courseId, firstFailedSessionId: F.pastSession, firstFailedAt: PUBLISHED_AT, lastSessionId: F.pastSession }, update: {} });
    }
  }
  // cstudent03 asked for CHE201 to be revalued: unchanged.
  await db.revaluation.upsert({ where: { id: F.revaluation }, create: { id: F.revaluation, schoolId: s, sessionId: F.pastSession, courseId: pastCourses[1]!, studentMembershipId: st3.id, kind: "REVAL", feePaise: 40000, status: "DECIDED", outcome: "UNCHANGED", oldExternalMilli: 15000, newExternalMilli: null, decidedByUserId: ctrl.userId, decidedAt: new Date("2026-05-28T06:00:00Z") }, update: { status: "DECIDED", outcome: "UNCHANGED" } });
  // cstudent02's grade card, numbered and checkable.
  const year = await db.academicYear.findFirst({ where: { schoolId: s, isCurrent: true }, select: { name: true } });
  const c2 = computed[1]!;
  const data = {
    kind: "GRADE_CARD",
    college: { name: vidya.name, university: vidya.affiliatingUniversity, autonomous: false },
    student: { name: st2.user.name, code: st2.studentCode, prn: "ZZV2026002", programme: "ZZ BSc Physics" },
    terms: [{ sessionName: past.name, publishedOn: "2026-05-20", sgpa: (c2.sgpa ?? 0) / 100, credits: c2.earned / 10, status: c2.status, cls: c2.cls, courses: c2.rows.map((r) => ({ code: course.get(r.courseId)!.code, name: course.get(r.courseId)!.name, credits: r.creditsTenths / 10, grade: r.grade, points: r.pointsTenths / 10, status: r.status })) }],
    cgpa: (c2.sgpa ?? 0) / 100,
    creditsEarned: c2.earned / 10,
    cls: c2.cls,
    yearOfPassing: null,
  };
  const yearLabel = year?.name ?? "2026";
  await db.examDocument.upsert({ where: { id: F.document }, create: { id: F.document, schoolId: s, studentMembershipId: st2.id, kind: "GRADE_CARD", sessionId: F.pastSession, runId: F.run, yearLabel, number: 1, serial: `GC/${yearLabel}/0001`, code: "ZZEXGC0001", studentName: st2.user.name, dataJson: JSON.stringify(data), issuedByUserId: ctrl.userId, issuedAt: new Date("2026-06-02T06:00:00Z") }, update: { dataJson: JSON.stringify(data) } });

  /* ------------------------------------------------- this term, taking forms */
  const now = Date.now();
  const closes = new Date(now + 20 * DAY);
  const lateFrom = new Date(now + 15 * DAY + 5.5 * 3_600_000).toISOString().slice(0, 10);
  const current = { schoolId: s, name: "ZZ Winter 2026 (odd term 2026–27)", kind: "REGULAR", termId: A.term, formOpensAt: new Date(now - 2 * DAY), formClosesAt: closes, feePerCoursePaise: 25000, feePerBacklogPaise: 30000, photocopyFeePaise: 10000, revalFeePaise: 40000, lateFeeSlabsJson: JSON.stringify([{ fromDateKey: lateFrom, paise: 10000 }]), feeHeadId, status: "FORMS", createdByUserId: ctrl.userId };
  await db.examSession.upsert({ where: { id: F.formsSession }, create: { id: F.formsSession, ...current }, update: { formOpensAt: current.formOpensAt, formClosesAt: closes, lateFeeSlabsJson: current.lateFeeSlabsJson, feeHeadId, status: "FORMS" } });
  const thisTerm = [A.course(1), A.course(2), A.course(3), A.course(4)];
  for (const [k, st] of students.entries()) {
    const courses = [...thisTerm.map((courseId) => ({ courseId, kind: "REGULAR" })), ...(k === 2 ? [{ courseId: pastCourses[1]!, kind: "BACKLOG" }] : [])];
    const approved = k === 1;
    const fee = thisTerm.length * 25000;
    const data = { schoolId: s, sessionId: F.formsSession, studentMembershipId: st.id, coursesJson: JSON.stringify(courses), ...(approved ? { eligibilityJson: JSON.stringify({ eligible: true, courses: [], noDues: [] }), eligible: true, noDues: true, feePaise: fee, status: "APPROVED", submittedAt: new Date(now - DAY), decidedAt: new Date(now - DAY / 2), decidedByUserId: ctrl.userId } : { status: "DRAFT" }) };
    await db.examForm.upsert({ where: { id: F.form(k + 4) }, create: { id: F.form(k + 4), ...data }, update: { coursesJson: data.coursesJson } });
  }
  await db.hallTicket.upsert({ where: { id: F.ticket(5) }, create: { id: F.ticket(5), schoolId: s, sessionId: F.formsSession, formId: F.form(5), studentMembershipId: st2.id, number: "HT0001", code: "ZZEXHT0005", issuedByUserId: ctrl.userId }, update: {} });
  const phy = course.get(A.course(1))!;
  await db.examSchedule.upsert({ where: { id: F.schedule(3) }, create: { id: F.schedule(3), schoolId: s, sessionId: F.formsSession, courseId: phy.id, courseCode: phy.code, courseName: phy.name, at: new Date(now + 30 * DAY), durationMin: 180 }, update: { courseCode: phy.code, courseName: phy.name } });
  await db.examRoom.upsert({ where: { id: F.room(3) }, create: { id: F.room(3), schoolId: s, sessionId: F.formsSession, scheduleId: F.schedule(3), name: "ZZ Hall B", capacity: 30 }, update: {} });
  await db.seating.upsert({ where: { scheduleId_formId: { scheduleId: F.schedule(3), formId: F.form(5) } }, create: { schoolId: s, scheduleId: F.schedule(3), examRoomId: F.room(3), seatNo: 1, formId: F.form(5), studentMembershipId: st2.id }, update: {} });
  await db.invigilation.upsert({ where: { id: F.invigilation(2) }, create: { id: F.invigilation(2), schoolId: s, sessionId: F.formsSession, examRoomId: F.room(3), staffMembershipId: f2.id }, update: {} });

  /* --------------------------------------- the autonomous college, in conduct */
  const t = shastri.id;
  const sCtrlFaculty = await member(t, "zz.faculty.s1@zz.test", "FACULTY");
  const sAdmin = await member(t, "zz.cadmin.s@zz.test", "ADMIN");
  const X = F.shastri;
  await db.department.upsert({ where: { id: X.department }, create: { id: X.department, schoolId: t, code: "COM", name: "ZZ Commerce" }, update: {} });
  await db.programme.upsert({ where: { id: X.programme }, create: { id: X.programme, schoolId: t, departmentId: X.department, code: "BCOM", name: "ZZ BCom", level: "UG", durationYears: 3, intake: 120, regulator: "UGC" }, update: {} });
  await db.scheme.upsert({ where: { id: X.scheme }, create: { id: X.scheme, schoolId: t, programmeId: X.programme, name: "ZZ Shastri BCom 2025", effectiveYear: 2025, gradingTable: scheme.gradingTable, passingRules: scheme.passingRules }, update: {} });
  await db.course.upsert({ where: { id: X.course }, create: { id: X.course, schoolId: t, schemeId: X.scheme, code: "BCOM101", name: "ZZ Financial Accounting", semester: 1, creditsL: 4 }, update: {} });
  await db.academicTerm.upsert({ where: { id: F.shastriTerm }, create: { id: F.shastriTerm, schoolId: t, name: "ZZ Odd term 2026–27", academicYear: "2026–27", startsOn: "2026-07-01", endsOn: "2026-11-30", registrationOpensOn: "2026-06-20", registrationClosesOn: "2026-07-15" }, update: {} });
  await db.examSession.upsert({ where: { id: F.conductSession }, create: { id: F.conductSession, schoolId: t, name: "ZZ Autonomous Winter 2026", kind: "REGULAR", termId: F.shastriTerm, status: "CONDUCT", createdByUserId: sAdmin.userId }, update: { status: "CONDUCT" } });
  await db.examSchedule.upsert({ where: { id: F.schedule(4) }, create: { id: F.schedule(4), schoolId: t, sessionId: F.conductSession, courseId: X.course, courseCode: "BCOM101", courseName: "ZZ Financial Accounting", at: new Date(now + 25 * DAY), durationMin: 180 }, update: {} });
  await db.examRoom.upsert({ where: { id: F.room(4) }, create: { id: F.room(4), schoolId: t, sessionId: F.conductSession, scheduleId: F.schedule(4), name: "ZZ Main Hall", capacity: 60 }, update: {} });
  let sealed = false;
  const existing = await db.questionPaper.findUnique({ where: { id: F.paper }, select: { sealedBody: true } });
  let sealedBody: string | null = existing?.sealedBody ?? null;
  const pdf = fixturePdf();
  if (!sealedBody) {
    try {
      const { seal } = await import("../src/lib/secret-box");
      sealedBody = seal(pdf.toString("base64"), `${t}|QuestionPaper|${F.paper}`);
    } catch {
      sealedBody = null;
    }
  }
  sealed = Boolean(sealedBody);
  const { createHash } = await import("node:crypto");
  const paper = { schoolId: t, sessionId: F.conductSession, scheduleId: F.schedule(4), setterMembershipId: sCtrlFaculty.id, status: sealed ? "SUBMITTED" : "ASSIGNED", coMapJson: JSON.stringify([{ question: "Q1", co: "CO1", marks: 10 }]), sealedBody, fileName: sealed ? "zz-bcom101-paper.pdf" : null, mime: sealed ? "application/pdf" : null, sizeBytes: sealed ? pdf.length : null, sha256: sealed ? createHash("sha256").update(pdf).digest("hex") : null, submittedAt: sealed ? new Date(now - DAY) : null, assignedByUserId: sAdmin.userId };
  await db.questionPaper.upsert({ where: { id: F.paper }, create: { id: F.paper, ...paper }, update: { status: paper.status, sealedBody, fileName: paper.fileName, mime: paper.mime, sizeBytes: paper.sizeBytes, sha256: paper.sha256 } });
  await db.assessmentAllocation.upsert({ where: { id: F.allocation }, create: { id: F.allocation, schoolId: t, sessionId: F.conductSession, scheduleId: F.schedule(4), assessorMembershipId: sCtrlFaculty.id, bundle: "ZZ-B1", count: 20 }, update: {} });

  return { published: computed.length, forms: students.length * 2, sealed };
}
