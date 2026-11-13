/**
 * Cascading deletes: three High findings of the testing analysis of 13 November
 * 2026, each held by a case that FAILS while the defect stands and passes once
 * it is fixed. All three are reached on the owner connection every suite uses;
 * the two that only show under row security (erasing a school, the file sweep)
 * are in ta-cascading-deletes-app-role.test.ts.
 *
 *   TA-015  "Remove" deletes a student with a full record: the guard counts
 *           four school tables (register, grade, hand-in, report card) while
 *           every other relation to Membership cascades (src/lib/membership.ts).
 *   TA-016  Splitting a division again into fewer lab batches deletes the
 *           dropped batch, and the delete takes its clinical postings and every
 *           logbook entry under them, the signed ones too (src/lib/stream-records.ts).
 *   TA-007  The web's detach action deletes any stored file whose id the caller
 *           names, whether or not it was on the row the caller owns
 *           (src/app/(app)/attachments/actions.ts).
 *
 * Every row here belongs to a scratch ZZ school of this suite's own (the stamp
 * is in each name, slug and address) and goes with it in afterAll; the stored
 * files live in a scratch directory under the system's temp folder, never the
 * app's store. Each block arranges and acts once, then gives every consequence
 * the finding names its own case, so a run shows which of them hold.
 */
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

// The scratch store, set before anything reads the environment (blob-store.ts resolves it per call; a bucket would win over it).
const STORE = await vi.hoisted(async () => {
  const { tmpdir } = await import("node:os");
  const { join } = await import("node:path");
  for (const key of ["STORAGE_BUCKET", "STORAGE_S3_ENDPOINT", "STORAGE_S3_REGION", "STORAGE_S3_ACCESS_KEY_ID", "STORAGE_S3_SECRET_ACCESS_KEY"]) delete process.env[key];
  const root = join(tmpdir(), `zz-ta007-store-${Date.now()}`);
  process.env.STORAGE_DIR = root;
  return { root };
});

vi.mock("next/cache", () => ({ revalidatePath: () => undefined, revalidateTag: () => undefined }));

import { PrismaClient } from "@prisma/client";
import { mkdir, rm } from "node:fs/promises";
import { createSession, getSession, type ActiveContext } from "@/lib/session";
import { __resetCookies, __setHeaders } from "../tests/stubs/next-headers";
import { removeMembership } from "@/lib/membership";
import { createSchool } from "@/lib/superuser";
import { setDuties } from "@/lib/duties";
import { splitLabBatches } from "@/lib/stream-records";
import { saveClinicalDepartment, saveClinicalPosting, saveClinicalSite, saveLogbookEntry, signLogbookEntry, submitLogbookEntry } from "@/lib/clinical";
import { addDaysToKey, todayKey } from "@/lib/dates";
import { classCode } from "@/lib/codes";
import { blobStore } from "@/lib/blob-store";
import { readStoredFile, storeFile } from "@/lib/storage";
import { readAttachments } from "@/lib/files";
import { detach } from "@/app/(app)/attachments/actions";

const db = new PrismaClient();
const STAMP = Date.now();
const MAIL = (who: string) => `zz-tacd-${who}-${STAMP}@test.invalid`;
const TZ = "Asia/Kolkata";
const TODAY = todayKey(TZ);
const ids: Record<string, string> = {};
const schools: string[] = [];

/** A real session for one of this suite's people, read back the way a request reads it. */
async function as(who: string, role: string, schoolId: string): Promise<ActiveContext> {
  __resetCookies();
  __setHeaders({});
  await createSession(ids[who]!, { schoolId, role: role as never });
  const session = await getSession();
  if (!session?.membershipId) throw new Error(`no session for ${who} as ${role}`);
  return session;
}

async function person(schoolId: string, who: string, role: string, name = `ZZ TA ${who}`): Promise<void> {
  ids[who] = (await db.user.create({ data: { name, email: MAIL(who), prefs: "{}" }, select: { id: true } })).id;
  ids[`${who}M`] = (await db.membership.create({ data: { userId: ids[who]!, schoolId, role, status: "ACTIVE" }, select: { id: true } })).id;
}

async function plainSchool(key: string, name: string, kind: "SCHOOL" | "COLLEGE"): Promise<string> {
  const made = await db.school.create({
    data: { name: `ZZ TA ${name} ${STAMP}`, slug: `zz-tacd-${key.toLowerCase()}-${STAMP}`, code: `ZZTA${key}${STAMP}`, contactEmail: MAIL(`office-${key}`), timezone: TZ, kind, isTestFixture: true },
    select: { id: true },
  });
  ids[key] = made.id;
  schools.push(made.id);
  return made.id;
}

/** The answer or the throw, so a refusal counts whichever way the fix words it. */
async function settle<T>(run: () => Promise<T>): Promise<{ value: T } | { error: unknown }> {
  try {
    return { value: await run() };
  } catch (error) {
    return { error };
  }
}

afterAll(async () => {
  __resetCookies();
  __setHeaders({});
  const users = await db.user.findMany({ where: { email: { contains: `-${STAMP}@test.invalid` } }, select: { id: true } });
  const userIds = users.map((u) => u.id);
  await db.session.deleteMany({ where: { userId: { in: userIds } } });
  await db.notification.deleteMany({ where: { userId: { in: userIds } } });
  await db.auditLog.deleteMany({ where: { OR: [{ schoolId: { in: schools } }, { targetId: { in: schools } }, { actorUserId: { in: userIds } }] } });
  await db.invite.deleteMany({ where: { schoolId: { in: schools } } });
  await db.school.deleteMany({ where: { id: { in: schools } } });
  await db.user.deleteMany({ where: { email: { contains: `-${STAMP}@test.invalid` } } });
  await db.$disconnect();
  await rm(STORE.root, { recursive: true, force: true });
  await rm(`${STORE.root}-variants`, { recursive: true, force: true });
});

/* ------------------------------------------------------------------ TA-015 */

describe("TA-015: Remove refuses a student who has a record the four counts do not see", () => {
  type Outcome = { value: Awaited<ReturnType<typeof removeMembership>> } | { error: unknown };
  let college: Outcome;
  let school: Outcome;
  const before: Record<string, number> = {};

  /** The four tables the guard counts today: none of them holds a row for either student. */
  const counted = async (schoolId: string, studentMembershipId: string) =>
    (await db.attendanceRecord.count({ where: { schoolId, studentMembershipId } })) +
    (await db.grade.count({ where: { schoolId, studentMembershipId } })) +
    (await db.submission.count({ where: { schoolId, studentMembershipId } })) +
    (await db.reportCard.count({ where: { schoolId, studentMembershipId } }));

  beforeAll(async () => {
    // A college student taught in lectures: attendance, a published result and a paid fee, and no class register.
    const C = await plainSchool("C15", "Remove College", "COLLEGE");
    await person(C, "cAdmin", "ADMIN");
    await person(C, "cFaculty", "FACULTY");
    await person(C, "cStudent", "STUDENT");
    const dept = await db.department.create({ data: { schoolId: C, code: "PHY", name: "ZZ TA Physics" }, select: { id: true } });
    const programme = await db.programme.create({ data: { schoolId: C, departmentId: dept.id, code: "BSC", name: "ZZ TA BSc", level: "UG", durationYears: 3, intake: 60, regulator: "UGC" }, select: { id: true } });
    const scheme = await db.scheme.create({ data: { schoolId: C, programmeId: programme.id, name: "ZZ TA scheme", effectiveYear: 2025 }, select: { id: true } });
    const course = await db.course.create({ data: { schoolId: C, schemeId: scheme.id, code: "PHY101", name: "ZZ TA Mechanics", semester: 1, creditsL: 4 }, select: { id: true } });
    const term = await db.academicTerm.create({ data: { schoolId: C, name: "ZZ TA term", academicYear: "2026–27", startsOn: addDaysToKey(TODAY, -60), endsOn: addDaysToKey(TODAY, 60), registrationOpensOn: addDaysToKey(TODAY, -70), registrationClosesOn: addDaysToKey(TODAY, -50) }, select: { id: true } });
    const offering = await db.courseOffering.create({ data: { schoolId: C, termId: term.id, courseId: course.id, facultyMembershipId: ids.cFacultyM!, lectureHours: 4 }, select: { id: true } });
    await db.studentProgramme.create({ data: { schoolId: C, studentMembershipId: ids.cStudentM!, programmeId: programme.id, schemeId: scheme.id, entryYear: 2026 } });
    await db.courseRegistration.create({ data: { schoolId: C, studentMembershipId: ids.cStudentM!, offeringId: offering.id, termId: term.id, kind: "CORE" } });
    const lecture = await db.lecture.create({ data: { schoolId: C, offeringId: offering.id, dateKey: addDaysToKey(TODAY, -7), startMinute: 540, endMinute: 600 }, select: { id: true } });
    ids.cAttendance = (await db.lectureAttendance.create({ data: { schoolId: C, lectureId: lecture.id, studentMembershipId: ids.cStudentM!, status: "PRESENT", markedByMembershipId: ids.cFacultyM! }, select: { id: true } })).id;
    const session = await db.examSession.create({ data: { schoolId: C, name: "ZZ TA winter session", termId: term.id, status: "PUBLISHED" }, select: { id: true } });
    const run = await db.resultRun.create({ data: { schoolId: C, sessionId: session.id, number: 1, status: "PUBLISHED", computedByUserId: ids.cAdmin!, publishedAt: new Date(), publishedByUserId: ids.cAdmin! }, select: { id: true } });
    ids.cResult = (await db.courseResult.create({ data: { schoolId: C, runId: run.id, studentMembershipId: ids.cStudentM!, courseId: course.id, creditsTenths: 40, internalMilli: 32000, externalMilli: 51000, totalMilli: 83000, maxMilli: 100000, grade: "A", pointsTenths: 90, status: "PASS" }, select: { id: true } })).id;
    const cYear = await db.academicYear.create({ data: { schoolId: C, name: "2026–27", startDate: new Date("2026-06-01T00:00:00Z"), endDate: new Date("2027-05-31T00:00:00Z"), isCurrent: true }, select: { id: true } });
    ids.cPayment = (await db.feePayment.create({ data: { schoolId: C, studentMembershipId: ids.cStudentM!, amountPaise: 4500000, method: "CASH", status: "PAID", paidAt: new Date(), collectedByUserId: ids.cAdmin! }, select: { id: true } })).id;
    await db.feeReceipt.create({ data: { schoolId: C, paymentId: ids.cPayment!, academicYearId: cYear.id, number: 1, serial: "RCPT/2026-27/000001", snapshotJson: "{}" } });

    // A school pupil with a fee receipt and an issued Bonafide, and no register mark yet.
    const S = await plainSchool("S15", "Remove School", "SCHOOL");
    await person(S, "sAdmin", "ADMIN");
    await person(S, "sPupil", "STUDENT");
    const sYear = await db.academicYear.create({ data: { schoolId: S, name: "2026–27", startDate: new Date("2026-06-01T00:00:00Z"), endDate: new Date("2027-05-31T00:00:00Z"), isCurrent: true }, select: { id: true } });
    ids.sPayment = (await db.feePayment.create({ data: { schoolId: S, studentMembershipId: ids.sPupilM!, amountPaise: 1200000, method: "UPI", status: "PAID", paidAt: new Date(), collectedByUserId: ids.sAdmin! }, select: { id: true } })).id;
    await db.feeReceipt.create({ data: { schoolId: S, paymentId: ids.sPayment!, academicYearId: sYear.id, number: 1, serial: "RCPT/2026-27/000001", snapshotJson: "{}" } });
    ids.sCertificate = (await db.issuedCertificate.create({ data: { schoolId: S, studentMembershipId: ids.sPupilM!, academicYearId: sYear.id, kind: "BONAFIDE", locale: "en", serial: "BON/2026-27/0001", number: 1, title: "ZZ Bonafide certificate", code: `ZZTA015${STAMP}`, issuedByUserId: ids.sAdmin! }, select: { id: true } })).id;

    before.collegeCounted = await counted(C, ids.cStudentM!);
    before.schoolCounted = await counted(S, ids.sPupilM!);
    before.collegeRecord = (await db.lectureAttendance.count({ where: { id: ids.cAttendance } })) + (await db.courseResult.count({ where: { id: ids.cResult } })) + (await db.feePayment.count({ where: { id: ids.cPayment } })) + (await db.feeReceipt.count({ where: { paymentId: ids.cPayment } }));
    before.schoolRecord = (await db.feePayment.count({ where: { id: ids.sPayment } })) + (await db.feeReceipt.count({ where: { paymentId: ids.sPayment } })) + (await db.issuedCertificate.count({ where: { id: ids.sCertificate } }));

    college = await settle(async () => removeMembership(await as("cAdmin", "ADMIN", C), ids.cStudentM!));
    school = await settle(async () => removeMembership(await as("sAdmin", "ADMIN", S), ids.sPupilM!));
  });

  const refused = (o: Outcome) => "error" in o || o.value.ok === false;

  it("arrange: neither student has a row in the four tables the guard counts, and each has the record that should stop the delete", () => {
    expect(before).toEqual({ collegeCounted: 0, schoolCounted: 0, collegeRecord: 4, schoolRecord: 3 });
  });

  it("⚠ refuses the college student who has lecture attendance, a published result and a paid fee", () => {
    expect(refused(college), `removeMembership answered ${JSON.stringify("value" in college ? college.value : String(college.error))}`).toBe(true);
  });

  it("⚠ leaves that student's membership, lecture attendance, result, fee payment and receipt in place", async () => {
    expect({
      membership: await db.membership.count({ where: { id: ids.cStudentM } }),
      lectureAttendance: await db.lectureAttendance.count({ where: { id: ids.cAttendance } }),
      courseResult: await db.courseResult.count({ where: { id: ids.cResult } }),
      feePayment: await db.feePayment.count({ where: { id: ids.cPayment } }),
      feeReceipt: await db.feeReceipt.count({ where: { paymentId: ids.cPayment } }),
    }).toEqual({ membership: 1, lectureAttendance: 1, courseResult: 1, feePayment: 1, feeReceipt: 1 });
  });

  it("⚠ refuses the school pupil who has a fee receipt and an issued certificate but no register mark", () => {
    expect(refused(school), `removeMembership answered ${JSON.stringify("value" in school ? school.value : String(school.error))}`).toBe(true);
  });

  it("⚠ leaves that pupil's membership, fee payment, receipt and certificate in place", async () => {
    expect({
      membership: await db.membership.count({ where: { id: ids.sPupilM } }),
      feePayment: await db.feePayment.count({ where: { id: ids.sPayment } }),
      feeReceipt: await db.feeReceipt.count({ where: { paymentId: ids.sPayment } }),
      certificate: await db.issuedCertificate.count({ where: { id: ids.sCertificate } }),
    }).toEqual({ membership: 1, feePayment: 1, feeReceipt: 1, certificate: 1 });
  });
});

/* ------------------------------------------------------------------ TA-016 */

describe("TA-016: a re-split into fewer lab batches keeps the dropped batch's clinical postings and logbooks", () => {
  let firstSplit: [string, (number | null)[]][] = [];
  let entryBefore: string | null = null;
  let postingsBefore = 0;
  let resplit: { value: unknown } | { error: unknown };

  beforeAll(async () => {
    ids.operator = (await db.user.create({ data: { name: "ZZ TA Operator", email: MAIL("op"), isSuperuser: true }, select: { id: true } })).id;
    const operator = { user: { id: ids.operator, isSuperuser: true, email: MAIL("op") } } as unknown as ActiveContext;
    const made = await createSchool(operator, { contactEmail: MAIL("office-H16"), timezone: TZ, name: `ZZ TA Nursing College ${STAMP}`, kind: "COLLEGE", streams: ["HEALTH_SCIENCES"] });
    if (!made.ok) throw new Error(made.errorKey);
    const H = (ids.H16 = made.schoolId);
    schools.push(H);
    await db.school.update({ where: { id: H }, data: { isTestFixture: true } });
    for (const [who, role] of [["hAdmin", "ADMIN"], ["hCoord", "FACULTY"], ["hSuper", "FACULTY"]] as const) await person(H, who, role);
    for (let n = 1; n <= 5; n += 1) await person(H, `n${n}`, "STUDENT");
    const dept = await db.department.create({ data: { schoolId: H, code: "NUR", name: "ZZ TA Nursing" }, select: { id: true } });
    const programme = await db.programme.create({ data: { schoolId: H, departmentId: dept.id, code: "BSCN", name: "ZZ TA BSc Nursing", level: "UG", durationYears: 4, intake: 60, regulator: "INC", stream: "HEALTH_SCIENCES" }, select: { id: true } });
    const scheme = await db.scheme.create({ data: { schoolId: H, programmeId: programme.id, name: "ZZ TA scheme", effectiveYear: 2025 }, select: { id: true } });
    const klass = await db.class.create({ data: { schoolId: H, name: "ZZ TA SY Nursing A", gradeLevel: "2", subject: "BSCN", joinCode: classCode() }, select: { id: true } });
    ids.division = (await db.division.create({ data: { schoolId: H, classId: klass.id, programmeId: programme.id, yearOfStudy: 2, academicYear: "2026–27" }, select: { id: true } })).id;
    for (let n = 1; n <= 5; n += 1) {
      await db.studentProgramme.create({ data: { schoolId: H, studentMembershipId: ids[`n${n}M`]!, programmeId: programme.id, schemeId: scheme.id, entryYear: 2025, divisionId: ids.division } });
      await db.enrollment.create({ data: { schoolId: H, classId: klass.id, studentMembershipId: ids[`n${n}M`]!, rollNumber: n } });
    }

    // The office splits five students at two a batch: A (1, 2), B (3, 4), C (5).
    const first = await splitLabBatches(await as("hAdmin", "ADMIN", H), { divisionId: ids.division!, size: 2 });
    firstSplit = first.divisions[0]!.batches.map((b) => [b.name, b.members.map((m) => m.rollNumber)]);
    ids.batchC = first.divisions[0]!.batches.find((b) => b.name === "C")!.id;

    // The clinical coordinator posts batch C to a ward; its student keeps a logbook; the supervisor signs an entry.
    await setDuties(await as("hAdmin", "ADMIN", H), ids.hCoordM!, ["CLINICAL_COORDINATOR"]);
    const coord = await as("hCoord", "FACULTY", H);
    const site = await saveClinicalSite(coord, { name: "ZZ TA Civil Hospital", kind: "HOSPITAL", address: "ZZ Station Road", agreementFrom: addDaysToKey(TODAY, -100), agreementTo: addDaysToKey(TODAY, 265), contactRole: "MEDICAL_SUPERINTENDENT" });
    const ward = await saveClinicalDepartment(coord, { siteId: site.id, name: "ZZ TA Medical ward", beds: 40 });
    ids.posting = (await saveClinicalPosting(coord, { departmentId: ward.id, divisionId: ids.division!, labBatchId: ids.batchC!, supervisorMembershipId: ids.hSuperM!, rotationOrder: 1, from: addDaysToKey(TODAY, -5), to: addDaysToKey(TODAY, 5) })).id;
    const student = await as("n5", "STUDENT", H);
    ids.entry = (await saveLogbookEntry(student, { clientId: `zz-ta016-${STAMP}`, postingId: ids.posting!, on: addDaysToKey(TODAY, -1), kind: "CASE", count: 2, note: "ZZ Two admissions with fever; vitals charted." })).id;
    await submitLogbookEntry(student, ids.entry!);
    await signLogbookEntry(await as("hSuper", "FACULTY", H), ids.entry!, { remark: "ZZ Good charting." });
    entryBefore = (await db.logbookEntry.findUnique({ where: { id: ids.entry }, select: { state: true } }))?.state ?? null;
    postingsBefore = await db.clinicalPosting.count({ where: { id: ids.posting, labBatchId: ids.batchC } });

    // The office splits again at three a batch: A (1, 2, 3) and B (4, 5); the name C is no longer used.
    resplit = await settle(async () => splitLabBatches(await as("hAdmin", "ADMIN", H), { divisionId: ids.division!, size: 3 }));
  });

  it("arrange: three batches by roll number, batch C posted to a ward, and its student's entry signed", () => {
    expect(firstSplit).toEqual([["A", [1, 2]], ["B", [3, 4]], ["C", [5]]]);
    expect(postingsBefore).toBe(1);
    expect(entryBefore).toBe("SIGNED");
  });

  it("⚠ the posting of the dropped batch is still there after the re-split (or the re-split was refused)", async () => {
    const said = "error" in resplit ? `refused: ${String(resplit.error)}` : "the re-split went through";
    expect(await db.clinicalPosting.count({ where: { id: ids.posting } }), said).toBe(1);
  });

  it("⚠ the signed logbook entry under it is still there, still signed", async () => {
    const entry = await db.logbookEntry.findUnique({ where: { id: ids.entry }, select: { state: true, signedByMembershipId: true } });
    expect(entry).toEqual({ state: "SIGNED", signedByMembershipId: ids.hSuperM });
  });
});

/* ------------------------------------------------------------------ TA-007 */

describe("TA-007: detach removes only a file that was on the caller's own row", () => {
  const PDF = (words: string) => new File([Buffer.from(`%PDF-1.4\n% ZZ ${words}\n`)], `${words}.pdf`, { type: "application/pdf" });
  const PNG = () => new File([Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==", "base64")], "logo.png", { type: "image/png" });
  let handIn: Awaited<ReturnType<typeof storeFile>>; // A: on the pupil's own hand-in
  let handout: Awaited<ReturnType<typeof storeFile>>; // B: on the teacher's assignment
  let logo: Awaited<ReturnType<typeof storeFile>>; // C: another school's logo
  let storedBefore = 0;
  let pupilSaid: { value: Awaited<ReturnType<typeof detach>> } | { error: unknown };
  let teacherSaid: { value: Awaited<ReturnType<typeof detach>> } | { error: unknown };

  beforeAll(async () => {
    // Nothing below may run against the app's own store.
    await mkdir(STORE.root, { recursive: true });
    if (blobStore("files").describe() !== STORE.root) throw new Error(`the store is ${blobStore("files").describe()}, not this suite's scratch directory`);

    const N = await plainSchool("N07", "Detach School", "SCHOOL");
    const other = await plainSchool("O07", "Detach Other School", "SCHOOL");
    await person(N, "teacher", "TEACHER");
    await person(N, "pupil", "STUDENT");
    const klass = await db.class.create({ data: { schoolId: N, name: "ZZ TA 6A", gradeLevel: "6", joinCode: classCode() }, select: { id: true } });
    await db.classTeacher.create({ data: { schoolId: N, classId: klass.id, teacherMembershipId: ids.teacherM!, role: "LEAD" } });
    await db.enrollment.create({ data: { schoolId: N, classId: klass.id, studentMembershipId: ids.pupilM!, rollNumber: 1 } });

    handIn = await storeFile(PDF("hand-in"));
    handout = await storeFile(PDF("handout"));
    logo = await storeFile(PNG());
    const attachment = (f: typeof handIn) => ({ fileId: f.fileId, name: f.name, size: f.size, mime: f.mime });
    ids.assignment = (await db.assignment.create({ data: { schoolId: N, classId: klass.id, authorMembershipId: ids.teacherM!, title: "ZZ TA homework", publishedAt: new Date(), attachments: JSON.stringify([attachment(handout)]) }, select: { id: true } })).id;
    ids.submission = (await db.submission.create({ data: { schoolId: N, assignmentId: ids.assignment!, studentMembershipId: ids.pupilM!, status: "SUBMITTED", submittedAt: new Date(), attachments: JSON.stringify([attachment(handIn)]) }, select: { id: true } })).id;
    await db.school.update({ where: { id: other }, data: { logoPath: logo.fileId } });
    for (const f of [handIn, handout, logo]) if (await readStoredFile(f.fileId)) storedBefore += 1;

    // The pupil names their own hand-in and the teacher's handout; the teacher names their own assignment and the other school's logo.
    pupilSaid = await settle(async () => {
      await as("pupil", "STUDENT", N);
      return detach({ target: "submission", id: ids.submission!, fileId: handout.fileId });
    });
    teacherSaid = await settle(async () => {
      await as("teacher", "TEACHER", N);
      return detach({ target: "assignment", id: ids.assignment!, fileId: logo.fileId });
    });
  });

  it("arrange: the three files are in the scratch store, one on the pupil's hand-in, one on the teacher's assignment, one another school's logo", async () => {
    expect(storedBefore).toBe(3);
    expect(readAttachments((await db.submission.findUniqueOrThrow({ where: { id: ids.submission } })).attachments).map((a) => a.fileId)).toEqual([handIn.fileId]);
    expect(readAttachments((await db.assignment.findUniqueOrThrow({ where: { id: ids.assignment } })).attachments).map((a) => a.fileId)).toEqual([handout.fileId]);
  });

  it("⚠ a pupil who names the teacher's handout beside their own hand-in does not delete the handout", async () => {
    const said = "error" in pupilSaid ? `threw ${String(pupilSaid.error)}` : `answered ${JSON.stringify(pupilSaid.value)}`;
    expect((await readStoredFile(handout.fileId)) !== null, `detach ${said}; the handout's bytes`).toBe(true);
  });

  it("⚠ a teacher who names another school's logo beside their own assignment does not delete the logo", async () => {
    const said = "error" in teacherSaid ? `threw ${String(teacherSaid.error)}` : `answered ${JSON.stringify(teacherSaid.value)}`;
    expect((await readStoredFile(logo.fileId)) !== null, `detach ${said}; the logo's bytes`).toBe(true);
  });

  it("the pupil's own file is untouched by both calls, and is still theirs to remove", async () => {
    expect(await readStoredFile(handIn.fileId)).not.toBeNull();
    await as("pupil", "STUDENT", ids.N07!);
    const own = await detach({ target: "submission", id: ids.submission!, fileId: handIn.fileId });
    expect(own).toMatchObject({ ok: true, attachments: [] });
    expect(await readStoredFile(handIn.fileId)).toBeNull();
  });
});
