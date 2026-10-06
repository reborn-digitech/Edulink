/**
 * The demo transfer (6 October 2026): a pupil who was at Sunrise Public School
 * last year and is at Saraswati Vidya Mandir this year, played through the
 * real library functions rather than written straight into the tables, so
 * the demo shows what a transfer leaves behind on both sides.
 *
 *   npm run demo:transfer          (after npm run demo:schools; idempotent)
 *
 * The story. Ishaan Pawar sat grade 5 at Sunrise in 2025–26 (a year of
 * registers and a published annual report), his father Prakash is his
 * guardian there. On 30 April 2026 Sunrise's office recorded his departure as
 * TRANSFERRED to Saraswati (`recordDeparture`: the membership closes, the
 * leaving certificate takes a serial in the school's TC register, the boy
 * stays connected as an alumnus). In June Saraswati's office took the
 * father's walk-in application for grade 6 carrying the boy's PEN and date
 * of birth, offered the seat, recorded the acceptance and admitted him
 * (`admit`): the PEN and birthdate matched the account Sunrise knew, so the
 * new membership attached to the SAME account, the pupil record carried the
 * previous school, and the guardians the platform already knew were told.
 * The father then claimed the child at Saraswati and the office approved it.
 *
 * Every step is keyed, so a second run finds its rows and changes nothing.
 * Only @demo.relay.test people are made. Sessions are the walk's own
 * (userAgent "zz-walk") and are deleted at the end.
 */
import { randomBytes } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { ActiveContext } from "../src/lib/session";
import { hashPassword } from "../src/lib/crypto";
import { studentCode } from "../src/lib/codes";
import { assignPen } from "../src/lib/pen";
import { bandFor, DEFAULT_REPORT_CARD_CONFIG, meanPercent, meanPoints, shownPercent } from "../src/lib/report-card-rules";
import { recordDeparture, departuresFrom, myRecords, recordsForStudentMembership } from "../src/lib/school-record";
import { issueCertificate } from "../src/lib/certificates";
import { admit, applicationView, createCycle, officeApply, offer, respond, setCycleStatus } from "../src/lib/admissions";
import { decideClaim, fileClaim, waitingClaimsForOffice } from "../src/lib/guardian-claims";
import { db, fakePen, refuseUnlessLocal, upsertUser, type Ctx } from "./zz-fixtures";

const DOMAIN = "demo.relay.test";
const PASSWORD = "Relay-Demo-2026";
const PUPIL = { email: `ishaan.pawar@${DOMAIN}`, name: "Ishaan Pawar", birthdate: new Date("2015-02-14T00:00:00Z"), birthKey: "2015-02-14" };
const PARENT = { email: `prakash.pawar@${DOMAIN}`, name: "Prakash Pawar" };
const OLD = { slug: "sunrise-public-school", joinedOn: new Date("2025-06-15T00:00:00Z"), leftOn: new Date("2026-04-30T00:00:00Z"), admissionNumber: "SPS/2025/0412" };
const NEW = { slug: "saraswati-vidya-mandir", cycleName: "Mid-year admissions 2026–27 (transfers)", admissionNumber: "SVM/2026/0107" };

const PREFS = { theme: "system", contrast: "normal", font: "default", motion: "full", locale: "en", channels: { push: false, email: false }, quietHours: null } as const;
const sessionIds: string[] = [];

async function actor(userId: string, schoolId: string | null, role: string | null, membershipId: string | null): Promise<ActiveContext> {
  const u = await db.user.findUniqueOrThrow({ where: { id: userId }, select: { id: true, name: true, email: true, isMinor: true, isSuperuser: true, isAppAdmin: true } });
  const session = await db.session.create({
    data: { userId, tokenHash: `zz-walk-${randomBytes(24).toString("hex")}`, activeSchoolId: schoolId, activeRole: role, userAgent: "zz-walk", expiresAt: new Date(Date.now() + 3_600_000) },
    select: { id: true },
  });
  sessionIds.push(session.id);
  return {
    sessionId: session.id,
    membershipId,
    schoolId,
    role: role as ActiveContext["role"],
    user: { id: u.id, name: u.name, preferredName: null, email: u.email, avatarKey: null, isMinor: u.isMinor, isSuperuser: u.isSuperuser, isAppAdmin: u.isAppAdmin, prefs: PREFS as unknown as ActiveContext["user"]["prefs"] },
  };
}

type Check = { what: string; ok: boolean; detail: string };
const checks: Check[] = [];
const check = (what: string, ok: boolean, detail = "") => checks.push({ what, ok, detail });

async function school(slug: string) {
  const s = await db.school.findUniqueOrThrow({ where: { slug }, select: { id: true, name: true, timezone: true } });
  const admin = await db.membership.findFirstOrThrow({ where: { schoolId: s.id, role: "ADMIN", status: "ACTIVE" }, orderBy: { joinedAt: "asc" }, select: { id: true, userId: true } });
  const current = await db.academicYear.findFirstOrThrow({ where: { schoolId: s.id, isCurrent: true }, select: { id: true, name: true } });
  const previous = await db.academicYear.findFirst({ where: { schoolId: s.id, isCurrent: false, endDate: { lt: new Date() } }, orderBy: { endDate: "desc" }, select: { id: true, name: true } });
  return { ...s, admin, current, previous };
}

/* -------------------------------------------------------------------------- */
/* Last year at Sunrise                                                        */
/* -------------------------------------------------------------------------- */

async function lastYearAtSunrise(ctx: Ctx) {
  const sunrise = await school(OLD.slug);
  const pupil = await upsertUser(ctx, PUPIL.email, PUPIL.name, { birthdate: PUPIL.birthdate, isMinor: true });
  const parent = await upsertUser(ctx, PARENT.email, PARENT.name);

  // The grade-5 form group of 2025–26, as demo:schools archived it.
  const oldClass = await db.class.findFirstOrThrow({ where: { schoolId: sunrise.id, gradeLevel: "5", archivedAt: { not: null } }, orderBy: { archivedAt: "desc" }, select: { id: true, name: true } });

  let membership = await db.membership.findUnique({ where: { userId_schoolId_role: { userId: pupil.id, schoolId: sunrise.id, role: "STUDENT" } }, select: { id: true, leftAt: true } });
  if (!membership) {
    membership = await db.membership.create({
      data: { userId: pupil.id, schoolId: sunrise.id, role: "STUDENT", status: "ACTIVE", gradeLevel: "5", studentCode: studentCode(), joinedAt: OLD.joinedOn },
      select: { id: true, leftAt: true },
    });
  }
  const enrolment = await db.enrollment.findUnique({ where: { classId_studentMembershipId: { classId: oldClass.id, studentMembershipId: membership.id } }, select: { id: true } });
  if (!enrolment) await db.enrollment.create({ data: { classId: oldClass.id, schoolId: sunrise.id, studentMembershipId: membership.id, status: membership.leftAt ? "REMOVED" : "ACTIVE", enrolledAt: OLD.joinedOn, removedAt: membership.leftAt ? OLD.leftOn : null } });

  // The guardian at the old school, with the consents a claim approval would set.
  const guardianship = await db.guardianship.findFirst({ where: { parentUserId: parent.id, studentMembershipId: membership.id }, select: { id: true } });
  if (!guardianship) await db.guardianship.create({ data: { parentUserId: parent.id, studentMembershipId: membership.id, studentSchoolId: sunrise.id, relation: "PARENT", status: "ACTIVE", consentSharingAt: OLD.joinedOn, consentNotificationsAt: OLD.joinedOn } });

  // A year of marks on the class's own sessions (demo:schools made the sessions): present most days, absent one day in seventeen.
  const sessions = await db.attendanceSession.findMany({ where: { classId: oldClass.id }, select: { id: true, dateKey: true }, orderBy: { dateKey: "asc" } });
  const marked = await db.attendanceRecord.count({ where: { studentMembershipId: membership.id, session: { classId: oldClass.id } } });
  if (marked < sessions.length) {
    await db.attendanceRecord.createMany({
      data: sessions.map((s, i) => ({ schoolId: sunrise.id, sessionId: s.id, studentMembershipId: membership!.id, status: i % 17 === 4 ? "ABSENT" : i % 23 === 7 ? "LATE" : "PRESENT", markedAt: new Date(`${s.dateKey}T03:50:00Z`) })),
      skipDuplicates: true,
    });
  }

  // The annual report of 2025–26, published, the shape demo:schools writes (the marks are the demo's, the attendance the register's).
  const title = `Annual report ${sunrise.previous?.name ?? "2025–26"}`;
  const marks = await db.attendanceRecord.findMany({ where: { studentMembershipId: membership.id, session: { classId: oldClass.id } }, select: { status: true } });
  const present = marks.filter((m) => m.status === "PRESENT" || m.status === "LATE").length;
  // The marks are the demo's; the letters, the mean and the points come from the school's rules, as the generator writes them (data:audit holds the card to them).
  const config = DEFAULT_REPORT_CARD_CONFIG;
  const subjects = [["English", 78], ["Mathematics", 86], ["Science", 81], ["Social Science", 74]].map(([subject, raw]) => {
    const percent = shownPercent(raw as number);
    const band = bandFor(percent, config.bands);
    return { subject: subject as string, percent, letter: band?.label ?? null, points: band?.points ?? null, parts: [] };
  });
  const overall = shownPercent(meanPercent(subjects));
  const points = meanPoints(subjects);
  const cardData = {
    schoolId: sunrise.id, classId: oldClass.id, studentMembershipId: membership.id, academicYearId: sunrise.previous?.id ?? sunrise.current.id, termId: null, title, status: "PUBLISHED",
    fromDateKey: "2025-06-01", toDateKey: "2026-04-30", attendancePresent: present, attendanceTotal: marks.length,
    overallPercentMilli: overall === null ? null : Math.round(overall * 1000), gradingMethod: "weighted", overallLetter: bandFor(overall, config.bands)?.label ?? null,
    gradePointsMilli: points === null ? null : Math.round(points * 1000),
    subjects: JSON.stringify(subjects),
    scale: JSON.stringify({ bands: config.bands, coScale: config.coScholastic.scale }), layout: JSON.stringify(config.layout),
    remark: "Promoted to grade 6. Leaves us for Saraswati Vidya Mandir with our good wishes.",
    createdByMembershipId: sunrise.admin.id, publishedAt: new Date("2026-04-25T09:00:00Z"),
  };
  await db.reportCard.upsert({ where: { classId_studentMembershipId_title: { classId: oldClass.id, studentMembershipId: membership.id, title } }, create: cardData, update: { attendancePresent: present, attendanceTotal: marks.length, overallPercentMilli: cardData.overallPercentMilli, overallLetter: cardData.overallLetter, gradePointsMilli: cardData.gradePointsMilli, subjects: cardData.subjects, scale: cardData.scale, layout: cardData.layout } });

  // The pupil record and the government PEN (fakePen: the demo's own eleven digits, never a real one).
  const pen = (await db.user.findUniqueOrThrow({ where: { id: pupil.id }, select: { penNumber: true } })).penNumber ?? fakePen(membership.id);
  await assignPen(pupil.id, pen);
  const recordData = { admissionNumber: OLD.admissionNumber, admissionDate: OLD.joinedOn, admittedToGrade: "5", penNumber: pen, addressLine: "7 Sahakar Nagar", city: "Pune", fatherName: PARENT.name, updatedByUserId: sunrise.admin.userId };
  await db.pupilRecord.upsert({ where: { studentMembershipId: membership.id }, create: { schoolId: sunrise.id, studentMembershipId: membership.id, ...recordData }, update: recordData });

  // The departure, through the office's own function: one transaction, the certificate numbered in the TC register.
  const admin = await actor(sunrise.admin.userId, sunrise.id, "ADMIN", sunrise.admin.id);
  let recordId: string | null = (await db.schoolRecord.findFirst({ where: { schoolId: sunrise.id, studentUserId: pupil.id, supersededAt: null }, select: { id: true } }))?.id ?? null;
  if (!membership.leftAt) {
    const left = await recordDeparture(admin, membership.id, { reason: "TRANSFERRED", conduct: "GOOD", destination: "Saraswati Vidya Mandir, Pune", note: "Family moved to Kothrud.", leftOn: OLD.leftOn });
    if (!left.ok) throw new Error(`recordDeparture refused: ${left.errorKey}`);
    recordId = left.recordId;
  }
  // The printable TC from the school's template, once: it takes the record's number (tc-register.test.ts).
  let tcPaper: string | null = null;
  const template = await db.certificateTemplate.findFirst({ where: { schoolId: sunrise.id, kind: "TC", locale: "en", active: true }, orderBy: { createdAt: "asc" }, select: { id: true } });
  const paper = await db.issuedCertificate.findFirst({ where: { schoolId: sunrise.id, studentMembershipId: membership.id, kind: "TC" }, select: { serial: true } });
  if (paper) tcPaper = paper.serial;
  else if (template) {
    try {
      tcPaper = (await issueCertificate(admin, { templateId: template.id, studentMembershipId: membership.id, purpose: "Admission to Saraswati Vidya Mandir", leftOn: "2026-04-30" })).serial;
    } catch (error) {
      tcPaper = `refused: ${error instanceof Error ? error.message : String(error)}`;
    }
  }
  return { sunrise, pupil, parent, membership, oldClass, pen, recordId, admin, tcPaper };
}

/* -------------------------------------------------------------------------- */
/* This year at Saraswati                                                      */
/* -------------------------------------------------------------------------- */

async function thisYearAtSaraswati(old: Awaited<ReturnType<typeof lastYearAtSunrise>>) {
  const saraswati = await school(NEW.slug);
  const admin = await actor(saraswati.admin.userId, saraswati.id, "ADMIN", saraswati.admin.id);
  const g6 = await db.class.findFirstOrThrow({ where: { schoolId: saraswati.id, gradeLevel: "6", archivedAt: null }, orderBy: { name: "asc" }, select: { id: true, name: true } });
  const structure = await db.feeStructure.findFirst({ where: { schoolId: saraswati.id, gradeLevel: "6", academicYearId: saraswati.current.id, publishedAt: { not: null }, archivedAt: null }, select: { id: true, name: true } });

  // The cycle the office opened for mid-year transfers, once.
  const cycle = await createCycle(admin, { academicYearId: saraswati.current.id, name: NEW.cycleName, grades: [{ grade: "6", seats: 2 }, { grade: "7", seats: 2 }], documents: [], testRequired: false, notice: "For pupils joining from another school during the year. Bring the leaving certificate and the PEN.", feeStructureId: structure?.id ?? null, opensAt: null, closesAt: null });
  if (cycle.status !== "OPEN") await setCycleStatus(admin, cycle.id, "OPEN");

  // The father's walk-in, taken at the office, naming the boy's PEN and birthdate.
  let app = await db.application.findFirst({ where: { schoolId: saraswati.id, cycleId: cycle.id, penNumber: old.pen }, orderBy: { number: "asc" }, select: { id: true, status: true } });
  if (!app) {
    const made = await officeApply(admin, { cycleId: cycle.id, childName: PUPIL.name, childBirthdate: PUPIL.birthKey, gradeApplied: "6", previousSchool: "Sunrise Public School, Baner, Pune", penNumber: old.pen, addressLine: "12 Mayur Colony, Kothrud", city: "Pune", note: "Transfer from Sunrise Public School; TC in hand.", applicantName: PARENT.name, applicantPhone: "+91 98230 44556", applicantEmail: PARENT.email, relation: "PARENT" });
    app = { id: made.id, status: made.status };
  }
  if (app.status === "SUBMITTED" || app.status === "WAITLISTED" || app.status === "EXPIRED") {
    await offer(admin, app.id, { expiresOn: null, note: "A seat in grade 6 from 15 June.", feeStructureId: structure?.id ?? null });
    app.status = "OFFERED";
  }
  if (app.status === "OFFERED") {
    await respond(admin, app.id, { answer: "ACCEPT", note: "Accepted at the office." });
    app.status = "ACCEPTED";
  }
  if (app.status === "ACCEPTED") {
    await admit(admin, app.id, { classId: g6.id, feeStructureId: structure?.id ?? null, admissionNumber: NEW.admissionNumber });
    app.status = "ADMITTED";
  }
  const view = await applicationView(admin, app.id);

  // The father claims the boy at the new school and the office approves, as a parent does from /parent/claims.
  const membership = await db.membership.findUniqueOrThrow({ where: { userId_schoolId_role: { userId: old.pupil.id, schoolId: saraswati.id, role: "STUDENT" } }, select: { id: true, studentCode: true, leftAt: true, status: true } });
  let linked = await db.guardianship.findFirst({ where: { parentUserId: old.parent.id, studentMembershipId: membership.id, status: "ACTIVE" }, select: { id: true } });
  let claimedHere = false;
  if (!linked) {
    const claim = await fileClaim({ claimant: { id: old.parent.id, name: PARENT.name }, studentMembershipId: membership.id, schoolId: saraswati.id, childName: PUPIL.name, schoolName: saraswati.name, relation: "PARENT" });
    const waiting = (await waitingClaimsForOffice(admin)).find((c) => c.id === claim.claimId);
    if (waiting) await decideClaim(admin, claim.claimId, "APPROVE");
    linked = await db.guardianship.findFirst({ where: { parentUserId: old.parent.id, studentMembershipId: membership.id, status: "ACTIVE" }, select: { id: true } });
    claimedHere = true;
  }
  return { saraswati, admin, g6, structure, cycle, app, view, membership, linked, claimedHere };
}

/* -------------------------------------------------------------------------- */
/* What is there afterwards                                                    */
/* -------------------------------------------------------------------------- */

async function verify(old: Awaited<ReturnType<typeof lastYearAtSunrise>>, now: Awaited<ReturnType<typeof thisYearAtSaraswati>>) {
  const u = await db.user.findUniqueOrThrow({ where: { id: old.pupil.id }, select: { penNumber: true, birthdate: true } });
  const memberships = await db.membership.findMany({ where: { userId: old.pupil.id }, select: { id: true, schoolId: true, role: true, status: true, leftAt: true, gradeLevel: true } });
  const oldM = memberships.find((m) => m.schoolId === old.sunrise.id && m.role === "STUDENT");
  const alumnus = memberships.find((m) => m.schoolId === old.sunrise.id && m.role === "ALUMNUS");
  const newM = memberships.find((m) => m.schoolId === now.saraswati.id && m.role === "STUDENT");
  check("one account carries both schools (admission matched the PEN and the birthdate)", memberships.filter((m) => m.role === "STUDENT").length === 2 && Boolean(u.penNumber), `${memberships.length} memberships, PEN ${u.penNumber ?? "none"}`);
  check("Sunrise: the pupil membership is closed on the leaving day", Boolean(oldM?.leftAt) && oldM!.leftAt!.toISOString().slice(0, 10) === "2026-04-30", `leftAt ${oldM?.leftAt?.toISOString() ?? "null"}, status ${oldM?.status}`);
  check("Sunrise: kept as an alumnus", Boolean(alumnus) && !alumnus!.leftAt, alumnus ? `ALUMNUS ${alumnus.status}` : "no alumnus row");
  const rec = await db.schoolRecord.findFirst({ where: { schoolId: old.sunrise.id, studentUserId: old.pupil.id, supersededAt: null }, select: { serial: true, reason: true, destination: true, attendanceMarked: true, attendancePresent: true, reportCardCount: true, className: true, admissionNumber: true, conduct: true } });
  check("Sunrise: the leaving record carries a TC serial, the reason, the destination and the snapshot", Boolean(rec?.serial) && rec?.reason === "TRANSFERRED" && (rec?.reportCardCount ?? 0) >= 1 && (rec?.attendanceMarked ?? 0) > 0, rec ? `${rec.serial} · ${rec.reason} → ${rec.destination} · attendance ${rec.attendancePresent}/${rec.attendanceMarked} · cards ${rec.reportCardCount} · class ${rec.className} · GR ${rec.admissionNumber} · conduct ${rec.conduct}` : "no record");
  const cert = await db.issuedCertificate.findFirst({ where: { schoolId: old.sunrise.id, studentMembershipId: old.membership.id, kind: "TC" }, select: { serial: true, code: true, revokedAt: true } }).catch(() => null);
  check("Sunrise: the printable TC paper is on the certificates register with the record's number", Boolean(cert) && cert!.serial === rec?.serial, cert ? `${cert.serial} · ${cert.revokedAt ? "revoked" : "live"} · public check code ${cert.code}` : old.tcPaper ? `paper ${old.tcPaper}` : "no TC template at Sunrise, no paper issued");
  const oldEnrol = await db.enrollment.findMany({ where: { studentMembershipId: old.membership.id }, select: { status: true, removedAt: true, class: { select: { name: true } } } });
  check("Sunrise: the old enrolment is closed, not deleted", oldEnrol.length > 0 && oldEnrol.every((e) => e.status === "REMOVED"), oldEnrol.map((e) => `${e.class.name}: ${e.status}`).join("; "));
  const cards = await db.reportCard.count({ where: { schoolId: old.sunrise.id, studentMembershipId: old.membership.id, status: "PUBLISHED" } });
  check("Sunrise: last year's published report card is kept", cards >= 1, `${cards} card(s)`);
  const departures = await departuresFrom(old.admin);
  check("Sunrise: the office's departures list names him", departures.some((d) => d.studentMembershipId === old.membership.id), `${departures.length} departures on the list`);

  check("Saraswati: the application is ADMITTED and linked to the membership", now.view.status === "ADMITTED" && now.view.admittedMembershipId === now.membership.id, `status ${now.view.status}, membership ${now.view.admittedMembershipId ?? "none"}`);
  check("Saraswati: the new membership is ACTIVE in grade 6", newM?.status === "ACTIVE" && !newM.leftAt, `status ${newM?.status}, grade ${newM?.gradeLevel ?? "unset on the membership"}`);
  const newEnrol = await db.enrollment.findFirst({ where: { studentMembershipId: now.membership.id, status: "ACTIVE" }, select: { class: { select: { name: true, gradeLevel: true } } } });
  check("Saraswati: enrolled in the grade-6 class", newEnrol?.class.gradeLevel === "6", newEnrol ? newEnrol.class.name : "no active enrolment");
  const newRecord = await db.pupilRecord.findUnique({ where: { studentMembershipId: now.membership.id }, select: { previousSchool: true, penNumber: true, admissionNumber: true, admissionDate: true, admittedToGrade: true, fatherName: true, category: true, religion: true } });
  check("Saraswati: the pupil record names the previous school, the PEN and the admission number", newRecord?.previousSchool?.startsWith("Sunrise") === true && newRecord.penNumber === old.pen && newRecord.admissionNumber === NEW.admissionNumber, newRecord ? `${newRecord.previousSchool} · PEN ${newRecord.penNumber} · GR ${newRecord.admissionNumber} · admitted ${newRecord.admissionDate?.toISOString().slice(0, 10)} to grade ${newRecord.admittedToGrade}` : "no record");
  check("Saraswati: the record's other lines (father's name, category, religion) came over from Sunrise", Boolean(newRecord?.fatherName) && Boolean(newRecord?.category), newRecord ? `father ${newRecord.fatherName ?? "blank"}, category ${newRecord.category ?? "blank"}, religion ${newRecord.religion ?? "blank"}` : "no record");
  const joined = (await db.membership.findUniqueOrThrow({ where: { id: now.membership.id }, select: { joinedAt: true } })).joinedAt;
  check("GAP: the admission step takes no admission date, so a transfer recorded late carries today's date on the membership, the record and the fee plan's re-dated instalments", false, `joinedAt ${joined.toISOString().slice(0, 10)}, admissionDate ${newRecord?.admissionDate?.toISOString().slice(0, 10) ?? "none"}; the boy joined on 15 June`);
  const plan = await db.studentFeePlan.findFirst({ where: { studentMembershipId: now.membership.id }, select: { id: true, structureId: true, structure: { select: { name: true } } } });
  const instalments = plan ? await db.feeInstalment.count({ where: { structureId: plan.structureId } }) : 0;
  check("Saraswati: a fee plan for the year with its instalments", Boolean(plan), plan ? `${plan.structure.name}, ${instalments < 0 ? "instalments not counted" : `${instalments} instalments`}` : now.structure ? "no plan although a structure exists" : "no published grade-6 structure to put him on");
  const guardians = await db.guardianship.findMany({ where: { student: { userId: old.pupil.id } }, select: { studentSchoolId: true, status: true, relation: true, parent: { select: { email: true } } } });
  check("Saraswati: the father is the guardian at the new school (the stand-in the school assigned at admission was revoked by the claim, as designed)", guardians.some((g) => g.studentSchoolId === now.saraswati.id && g.status === "ACTIVE" && g.parent.email === PARENT.email), guardians.map((g) => `${g.parent.email} (${g.relation}) @ ${g.studentSchoolId === now.saraswati.id ? "Saraswati" : "Sunrise"} ${g.status}`).join("; "));
  check("GAP: admitting the father's own application did not link him; a claim the office then approved did", false, `admit() links the applicant only to a NEW account; for a pupil matched by PEN it tells the old guardians and links nobody, so the father had to claim the child again at Saraswati${now.claimedHere ? " (this run filed and approved that claim)" : " (the claim was approved on an earlier run)"}`);
  const told = await db.notification.findMany({ where: { userId: old.parent.id, kind: "ADMISSION" }, select: { titleKey: true, schoolId: true }, orderBy: { createdAt: "desc" }, take: 5 });
  check("the father was told the seat went to the pupil the platform already knew", told.some((n) => n.titleKey === "admissions.notifLinkedByPen"), told.map((n) => n.titleKey).join(", ") || "no admission notification");

  const newAdmin = now.admin;
  const seenByNewOffice = await recordsForStudentMembership(newAdmin, now.membership.id);
  check("Saraswati's office can read Sunrise's leaving certificate for a pupil on its roll", seenByNewOffice.some((r) => r.schoolName.startsWith("Sunrise") && !r.issuedHere), seenByNewOffice.map((r) => `${r.schoolName} (${r.reason}) issuedHere=${r.issuedHere}`).join("; ") || "nothing readable");
  const pupilCtx = await actor(old.pupil.id, now.saraswati.id, "STUDENT", now.membership.id);
  const mine = await myRecords(pupilCtx);
  check("the pupil sees his own leaving certificate from Sunrise", mine.some((r) => r.schoolName.startsWith("Sunrise")), mine.map((r) => `${r.schoolName} (${r.reason}, left ${r.leftAt.toISOString().slice(0, 10)})`).join("; ") || "nothing");
  const oldCardsFromNew = await db.reportCard.count({ where: { studentMembershipId: { in: memberships.filter((m) => m.role === "STUDENT").map((m) => m.id) }, status: "PUBLISHED" } });
  check("GAP: last year's report card stays at Sunrise; the new school and the family's new-school pages read nothing of it (only the TC's counts)", false, `${oldCardsFromNew} published card(s) exist on the account, all under the Sunrise membership`);
  const sunriseTeacherSees = await db.enrollment.count({ where: { studentMembershipId: old.membership.id, status: "ACTIVE" } });
  check("Sunrise: no live roll still lists him", sunriseTeacherSees === 0, `${sunriseTeacherSees} active enrolment(s)`);
}

/* -------------------------------------------------------------------------- */
/* The roster section                                                          */
/* -------------------------------------------------------------------------- */

async function writeRoster(old: Awaited<ReturnType<typeof lastYearAtSunrise>>, now: Awaited<ReturnType<typeof thisYearAtSaraswati>>) {
  const rec = await db.schoolRecord.findFirst({ where: { schoolId: old.sunrise.id, studentUserId: old.pupil.id, supersededAt: null }, select: { serial: true } });
  const path = join(__dirname, "..", "..", "..", "docs", "demo-schools.md");
  const begin = "<!-- demo-transfer:begin -->";
  const end = "<!-- demo-transfer:end -->";
  const section = `${begin}
## The transferred pupil (demo:transfer)

Ishaan Pawar sat grade 5 at Sunrise Public School in 2025–26 and is in grade 6 at Saraswati Vidya Mandir in 2026–27. Built by \`npm run demo:transfer\` after \`npm run demo:schools\` (idempotent), through the real office functions: Sunrise's \`recordDeparture\` on 30 April 2026 (${rec?.serial ?? "—"}, reason TRANSFERRED, the alumnus kept), Saraswati's admission cycle "${NEW.cycleName}", the father's walk-in application with the boy's PEN and date of birth, offer, acceptance, \`admit\` into ${now.g6.name} with admission number ${NEW.admissionNumber}, then the father's guardian claim approved by the office. The password is the demo's, \`${PASSWORD}\`.

| Who | Email | Where to look |
| --- | --- | --- |
| Ishaan Pawar, the pupil (grade 6 at Saraswati; left grade 5 at Sunrise) | \`${PUPIL.email}\` | /student (Saraswati), /student/record, /record (the Sunrise leaving certificate), /switch (the Sunrise alumnus side) |
| Prakash Pawar, his father | \`${PARENT.email}\` | /parent (both schools), /parent/record?child=…, /parent/fees |
| Saraswati's office (Sunil Wagh) | \`saraswati.admin@${DOMAIN}\` | /admin/college-admissions is the college's; here /admin/admissions → "${NEW.cycleName}", /admin/records → Ishaan (previous school, PEN), /admin/people → Ishaan → the Sunrise certificate |
| Sunrise's office (Meenal Joshi) | \`sunrise.admin@${DOMAIN}\` | /admin/people → departures → Ishaan (${rec?.serial ?? "—"}), /admin/certificates/issued, /alumni |

What the walk found is in the script's report (\`npm run demo:transfer\` prints it) and in docs/audit-2026-10-05/08-remaining-risks.md under the transfer gaps.
${end}`;
  const text = await readFile(path, "utf8");
  const next = text.includes(begin) ? text.replace(new RegExp(`${begin}[\\s\\S]*?${end}`), section) : `${text.trimEnd()}\n\n${section}\n`;
  if (next !== text) await writeFile(path, next);
}

/* -------------------------------------------------------------------------- */

async function main() {
  await refuseUnlessLocal("demo:transfer");
  const ctx: Ctx = { passwordHash: await hashPassword(PASSWORD), setPassword: true };
  const old = await lastYearAtSunrise(ctx);
  const now = await thisYearAtSaraswati(old);
  await verify(old, now);
  await writeRoster(old, now);
  console.log(`\nThe transfer of ${PUPIL.name}: Sunrise (grade 5, 2025–26) → Saraswati Vidya Mandir (grade 6, 2026–27)\n`);
  for (const c of checks) console.log(`  ${c.ok ? "ok " : "GAP"}  ${c.what}${c.detail ? `\n       ${c.detail}` : ""}`);
  const gaps = checks.filter((c) => !c.ok).length;
  console.log(`\n${checks.length - gaps} of ${checks.length} checks hold; ${gaps} gap(s).\n`);
  console.log(`  pupil    ${PUPIL.email}\n  father   ${PARENT.email}\n  password ${PASSWORD}\n`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (sessionIds.length > 0) await db.session.deleteMany({ where: { id: { in: sessionIds } } });
    await db.$disconnect();
  });
