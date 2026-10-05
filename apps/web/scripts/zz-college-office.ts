/**
 * THE ZZ COLLEGE OFFICE at ZZ Vidya College (the college office, 4 October
 * 2026), built by `npm run zz:fixtures` after the colleges and the academics.
 *
 *   The 2026–27 year (current, if the college has none); fee heads for
 *   tuition, development, exam, library, caution deposit, mess and transport;
 *   the BSc Physics first-year structures for OPEN and OBC with an approval
 *   reference, two terms and two late-fee slabs; zz.cstudent01 (OBC),
 *   zz.cstudent02 (OPEN) and zz.cstudent03 (OBC) enrolled in BSc Physics from
 *   the 2026 intake, on their structures with a demand per term — and
 *   cstudent02's first term paid by bank transfer with its receipt.
 *
 *   Scholarships: cstudent01's OBC post-matric claim SANCTIONED (the
 *   receivable on her ledger) and cstudent03's LAPSED. A concession on
 *   cstudent02 above the office's limit, refused by the principal.
 *
 *   Admissions: CAP round 1 of the 2026 intake with five rows of the CET
 *   Cell's list imported, and a merit round; applications from rows 1–4 —
 *   one in scrutiny, one with its fee due, one admitted (zz.cadmit01, with
 *   her enrolment and record) and one cancelled with its refund recorded;
 *   row 5 waits.
 *
 *   No-dues: cstudent02 owes the library a counter fine for a late book, so
 *   her exam-form clearance has the accounts line cleared by hand and the
 *   library line open. Certificates: the college bonafide and migration
 *   templates, a bonafide issued to cstudent01, and cstudent03's ask for a
 *   migration certificate waiting. The library's college terms and an
 *   e-resource; ZZ Tagore Hostel with its rules and a squad round; the ZZ
 *   Campus Loop, a shuttle with no roster.
 *
 * Every id that a catalog sample names is fixed (src/lib/api-catalog/
 * college-office-fixture.ts). Re-run safe: rows are written by id or unique
 * key and left as they stand when there.
 */
import type { PrismaClient } from "@prisma/client";
import { OFFICE_FIXTURE as F } from "../src/lib/api-catalog/college-office-fixture";
import { ACADEMICS_FIXTURE as A } from "../src/lib/api-catalog/academics-fixture";
import { collegePresetsFor } from "../src/lib/certificate-rules";

const DOMAIN = "zz.test";
const pad = (prefix: string, n: number) => `c${prefix}${String(n).padStart(20 - prefix.length, "0")}`;
const day = (key: string) => new Date(`${key}T00:00:00Z`);

export type OfficeFixtures = { students: number; demands: number; claims: number; applications: number } | null;

export async function buildCollegeOffice(db: PrismaClient): Promise<OfficeFixtures> {
  const vidya = await db.school.findUnique({ where: { slug: "zz-vidya-college" }, select: { id: true } });
  const programme = vidya ? await db.programme.findUnique({ where: { id: A.programme(1) }, select: { id: true } }) : null;
  if (!vidya || !programme) return null;
  const s = vidya.id;
  const member = async (email: string, role: string) => db.membership.findFirst({ where: { schoolId: s, role, user: { email } }, select: { id: true, userId: true } });
  const [admin, principal, accounts, c1, c2, c3] = await Promise.all([
    member(`zz.cadmin@${DOMAIN}`, "ADMIN"),
    member(`zz.cprincipal@${DOMAIN}`, "PRINCIPAL"),
    member(`zz.accounts@${DOMAIN}`, "ACCOUNTS"),
    member(`zz.cstudent01@${DOMAIN}`, "STUDENT"),
    member(`zz.cstudent02@${DOMAIN}`, "STUDENT"),
    member(`zz.cstudent03@${DOMAIN}`, "STUDENT"),
  ]);
  if (!admin || !principal || !accounts || !c1 || !c2 || !c3) return null;

  // The year: the college's current one, or 2026–27 made current.
  let year = await db.academicYear.findFirst({ where: { schoolId: s, isCurrent: true }, select: { id: true, name: true, feeReceiptNext: true } });
  if (!year) {
    year = await db.academicYear.upsert({ where: { schoolId_name: { schoolId: s, name: "2026–27" } }, create: { schoolId: s, name: "2026–27", startDate: day("2026-06-01"), endDate: day("2027-05-31"), isCurrent: true }, update: { isCurrent: true }, select: { id: true, name: true, feeReceiptNext: true } });
  }

  // Heads.
  const HEADS: [string, string, string, number][] = [["TUI", "ZZ Tuition", "TUITION", 1], ["DEV", "ZZ Development", "DEVELOPMENT", 2], ["EXM", "ZZ Examination", "EXAM", 3], ["LIB", "ZZ Library", "LIBRARY", 4], ["CAU", "ZZ Caution deposit", "CAUTION_DEPOSIT", 5], ["MES", "ZZ Mess", "MESS", 6], ["TRN", "ZZ Bus", "TRANSPORT", 7]];
  const head: Record<string, { id: string; code: string; name: string }> = {};
  for (const [code, name, kind, sortOrder] of HEADS) {
    head[code] = await db.feeHead.upsert({ where: { schoolId_code: { schoolId: s, code } }, create: { schoolId: s, code, name, kind, sortOrder }, update: { kind }, select: { id: true, code: true, name: true } });
  }

  // Structures: BSc Physics, first year, OPEN and OBC (the authority's numbers, made up for ZZ).
  const STRUCTURES: [number, string, [string, number][]][] = [
    [1, "OPEN", [["TUI", 2_500_000], ["DEV", 500_000], ["EXM", 150_000], ["LIB", 100_000], ["CAU", 200_000]]],
    [2, "OBC", [["TUI", 1_250_000], ["DEV", 500_000], ["EXM", 150_000], ["LIB", 100_000], ["CAU", 200_000]]],
  ];
  const structureOf: Record<string, string> = {};
  for (const [n, category, lines] of STRUCTURES) {
    const id = pad("zzcfs", n);
    const exists = await db.feeStructure.findUnique({ where: { id }, select: { id: true } });
    if (!exists) {
      await db.feeStructure.create({
        data: {
          id,
          schoolId: s,
          academicYearId: year.id,
          name: `ZZ BSc Physics FY · ${category}`,
          publishedAt: new Date(),
          programmeId: programme.id,
          yearOfStudy: 1,
          category,
          approvalRef: "ZZ/FRA/2026-27/BSC/0042",
          lateFeeSlabsJson: JSON.stringify([{ afterDays: 15, paise: 50_000 }, { afterDays: 30, paise: 100_000 }]),
          instalments: {
            create: [
              { schoolId: s, label: "ZZ Odd semester", sortOrder: 0, dueDate: day("2026-07-15"), lines: { create: lines.map(([c, p]) => ({ schoolId: s, headId: head[c]!.id, amountPaise: c === "CAU" ? p : Math.round(p / 2) })) } },
              { schoolId: s, label: "ZZ Even semester", sortOrder: 1, dueDate: day("2026-12-15"), lines: { create: lines.filter(([c]) => c !== "CAU").map(([c, p]) => ({ schoolId: s, headId: head[c]!.id, amountPaise: Math.round(p / 2) })) } },
            ],
          },
        },
      });
    }
    structureOf[category] = id;
  }

  // The three students' seats (their academic seat is the academics builder's StudentProgramme), records and plans.
  const STUDENTS: [{ id: string; userId: string }, string, number][] = [[c1, "OBC", 1], [c2, "OPEN", 2], [c3, "OBC", 3]];
  let demands = 0;
  for (const [m, category, n] of STUDENTS) {
    await db.programmeEnrolment.upsert({ where: { studentMembershipId_programmeId: { studentMembershipId: m.id, programmeId: programme.id } }, create: { schoolId: s, studentMembershipId: m.id, programmeId: programme.id, yearOfEntry: 2026, category, quota: "CAP", roundId: null }, update: { category, quota: "CAP", status: "ACTIVE" } });
    const record = { prn: `ZZV2026${String(n).padStart(3, "0")}`, admissionCategory: category, admissionQuota: "CAP", yearOfEntry: 2026, admissionNumber: `2026/${String(n).padStart(4, "0")}`, annualIncome: category === "OBC" ? 90_000 : 600_000 };
    await db.pupilRecord.upsert({ where: { studentMembershipId: m.id }, create: { schoolId: s, studentMembershipId: m.id, ...record }, update: record });
    const structureId = structureOf[category]!;
    await db.studentFeePlan.upsert({ where: { studentMembershipId_academicYearId: { studentMembershipId: m.id, academicYearId: year.id } }, create: { schoolId: s, studentMembershipId: m.id, structureId, academicYearId: year.id }, update: {} });
    const instalments = await db.feeInstalment.findMany({ where: { structureId }, orderBy: { sortOrder: "asc" }, include: { lines: { include: { head: { select: { code: true, name: true } } } } } });
    for (const inst of instalments) {
      const lines = inst.lines.map((l) => ({ headId: l.headId, code: l.head.code, name: l.head.name, grossPaise: l.amountPaise, concessionPaise: 0 }));
      const gross = lines.reduce((a, l) => a + l.grossPaise, 0);
      await db.feeDemand.upsert({ where: { studentMembershipId_instalmentId: { studentMembershipId: m.id, instalmentId: inst.id } }, create: { schoolId: s, studentMembershipId: m.id, academicYearId: year.id, instalmentId: inst.id, label: inst.label, dueDate: inst.dueDate, grossPaise: gross, netPaise: gross, linesJson: JSON.stringify(lines) }, update: {} });
      demands += 1;
    }
  }

  // cstudent02's odd semester, paid by bank transfer, with its receipt.
  const first2 = await db.feeDemand.findFirst({ where: { studentMembershipId: c2.id, academicYearId: year.id }, orderBy: { dueDate: "asc" } });
  if (first2 && first2.paidPaise === 0) {
    const y = await db.academicYear.update({ where: { id: year.id }, data: { feeReceiptNext: { increment: 1 } }, select: { feeReceiptNext: true } });
    const number = y.feeReceiptNext - 1;
    const payment = await db.feePayment.create({ data: { schoolId: s, studentMembershipId: c2.id, amountPaise: first2.netPaise, method: "BANK", status: "PAID", reference: "ZZUTR20260710001", collectedByUserId: accounts.userId, paidAt: day("2026-07-10"), intentJson: JSON.stringify([first2.id]) }, select: { id: true } });
    await db.feeAllocation.create({ data: { schoolId: s, paymentId: payment.id, demandId: first2.id, amountPaise: first2.netPaise } });
    await db.feeReceipt.create({ data: { schoolId: s, paymentId: payment.id, academicYearId: year.id, number, serial: `RCPT/${year.name}/${String(number).padStart(6, "0")}`, snapshotJson: JSON.stringify({ school: "ZZ Vidya College", pupil: "ZZ Ananya Pathak", lines: [{ label: first2.label, amountPaise: first2.netPaise }], method: "BANK", reference: "ZZUTR20260710001" }) } });
    await db.feeDemand.update({ where: { id: first2.id }, data: { paidPaise: first2.netPaise, status: "PAID" } });
  }

  // Scholarships: cstudent01's sanctioned, cstudent03's lapsed.
  await db.scholarshipClaim.upsert({ where: { id: F.claimSanctioned }, create: { id: F.claimSanctioned, schoolId: s, studentMembershipId: c1.id, scheme: "OBC_POST_MATRIC", academicYear: "2026-27", portalApplicationId: "ZZMDBT2026000101", appliedAt: day("2026-08-01"), expectedPaise: 1_400_000, sanctionedPaise: 1_250_000, sanctionedAt: day("2026-09-15"), status: "SANCTIONED", createdByUserId: accounts.userId }, update: {} });
  // A sanction is bounded by the fees the claim covers (A3-journeys-9): a walk left ₹50,000 sanctioned on this ₹14,000 claim, which the rule now refuses; the fixture's own figure is put back, and only while it stands above the claim.
  await db.scholarshipClaim.updateMany({ where: { id: F.claimSanctioned, schoolId: s, status: "SANCTIONED", sanctionedPaise: { gt: 1_400_000 } }, data: { sanctionedPaise: 1_250_000 } });
  await db.scholarshipClaim.upsert({ where: { id: F.claimLapsed }, create: { id: F.claimLapsed, schoolId: s, studentMembershipId: c3.id, scheme: "OBC_POST_MATRIC", academicYear: "2026-27", portalApplicationId: "ZZMDBT2026000103", appliedAt: day("2026-08-02"), expectedPaise: 1_400_000, status: "LAPSED", lapsedAt: day("2026-09-30"), note: "ZZ documents not uploaded on the portal before the deadline", createdByUserId: accounts.userId }, update: {} });

  // A concession above the limit, refused by the principal.
  await db.feeConcession.upsert({ where: { id: F.concessionDecided }, create: { id: F.concessionDecided, schoolId: s, studentMembershipId: c2.id, academicYearId: year.id, headId: head.TUI!.id, kind: "PERCENT", value: 5000, reason: "ZZ sibling in the college", grantedByUserId: accounts.userId, authority: "ZZ Governing body resolution 7/2026", approvalStatus: "REFUSED", approvedByUserId: principal.userId, approvedAt: day("2026-09-20") }, update: {} });

  // Admissions: CAP round 1 with five rows of the CET Cell's list, and a merit round.
  await db.admissionRound.upsert({ where: { id: F.round }, create: { id: F.round, schoolId: s, programmeId: programme.id, intakeYear: 2026, kind: "CAP_1", name: "ZZ CAP round 1", opensAt: day("2026-06-20"), closesAt: day("2026-07-05"), seatsJson: JSON.stringify({ OPEN: 30, OBC: 12, SC: 8, ST: 4, VJNT: 4, EWS: 6 }), status: "OPEN", createdByUserId: admin.userId }, update: {} });
  await db.admissionRound.upsert({ where: { id: F.meritRound }, create: { id: F.meritRound, schoolId: s, programmeId: programme.id, intakeYear: 2026, kind: "MERIT", name: "ZZ Merit list", opensAt: day("2026-07-06"), closesAt: day("2026-08-15"), seatsJson: JSON.stringify({ OPEN: 6 }), status: "OPEN", createdByUserId: admin.userId }, update: {} });
  const ROWS: [number, string, string, string, number][] = [[1, "ZZEN26001101", "ZZ Rohan Deshmukh", "OPEN", 1101], [2, "ZZEN26001102", "ZZ Sneha Kulkarni", "OPEN", 1102], [3, "ZZEN26001103", "ZZ Prachi Shinde", "OBC", 1210], [4, "ZZEN26001104", "ZZ Aditya More", "OPEN", 1288], [5, "ZZEN26001105", "ZZ Kavya Joshi", "EWS", 1302]];
  for (const [n, cet, name, category, merit] of ROWS) {
    await db.capAllotment.upsert({ where: { id: F.allotment(n) }, create: { id: F.allotment(n), schoolId: s, roundId: F.round, cetApplicationId: cet, applicantName: name, programmeCode: "BSCPHY", programmeId: programme.id, category, quota: "CAP", meritNumber: merit, importedByUserId: admin.userId }, update: {} });
  }
  const verified = (docs: string[]) => JSON.stringify(Object.fromEntries(docs.map((d) => [d, { required: true, fileId: `zzfixturedoc${d}`, status: "VERIFIED", note: null }])));
  const openFee = 2_500_000 / 2 + 500_000 / 2 + 150_000 / 2 + 100_000 / 2 + 200_000;
  const APPS: [string, number, string, string, Record<string, unknown>][] = [
    [F.applicationScrutiny, 1, "ZZ Rohan Deshmukh", "OPEN", { status: "SCRUTINY", documentsJson: JSON.stringify({ domicile: { required: true, fileId: "zzfixturedocdomicile", status: "VERIFIED", note: null }, marksheets: { required: true, fileId: null, status: "PENDING", note: null } }) }],
    [F.applicationFeeDue, 2, "ZZ Sneha Kulkarni", "OPEN", { status: "FEE_DUE", documentsJson: verified(["domicile", "marksheets"]), antiRaggingStudentAt: day("2026-06-28"), antiRaggingParentAt: day("2026-06-28"), feeStructureId: structureOf.OPEN, admissionFeePaise: openFee }],
    [F.applicationAdmitted, 3, "ZZ Prachi Shinde", "OBC", { status: "ADMITTED", documentsJson: verified(["caste", "income", "domicile", "marksheets"]), antiRaggingStudentAt: day("2026-06-27"), antiRaggingParentAt: day("2026-06-27"), feeStructureId: structureOf.OBC, admissionFeePaise: 1_250_000 / 2 + 500_000 / 2 + 150_000 / 2 + 100_000 / 2 + 200_000, admissionFeeMethod: "BANK", admissionFeeRef: "ZZUTR20260701003", admissionFeePaidAt: day("2026-07-01"), admittedAt: day("2026-07-02") }],
    [F.applicationCancelled, 4, "ZZ Aditya More", "OPEN", { status: "CANCELLED", documentsJson: verified(["domicile", "marksheets"]), antiRaggingStudentAt: day("2026-06-29"), antiRaggingParentAt: day("2026-06-29"), feeStructureId: structureOf.OPEN, admissionFeePaise: openFee, admissionFeeMethod: "BANK", admissionFeeRef: "ZZUTR20260703004", admissionFeePaidAt: day("2026-07-03"), cancelledAt: day("2026-07-08"), cancelReason: "ZZ took a seat at another college", refundPaise: Math.round(openFee * 0.9), refundSlab: "BEFORE_LAST", refundRecordedAt: day("2026-07-08") }],
  ];
  // The admitted applicant: her account, seat, record and enrolment.
  const admittedUser = await db.user.upsert({ where: { email: `zz.cadmit01@${DOMAIN}` }, create: { email: `zz.cadmit01@${DOMAIN}`, name: "ZZ Prachi Shinde", isMinor: false, birthdate: day("2008-03-12"), isTestFixture: true }, update: {}, select: { id: true } });
  const admitted = await db.membership.upsert({ where: { userId_schoolId_role: { userId: admittedUser.id, schoolId: s, role: "STUDENT" } }, create: { userId: admittedUser.id, schoolId: s, role: "STUDENT", status: "ACTIVE", studentCode: "STU-ZZVA-0003" }, update: {}, select: { id: true } });
  await db.programmeEnrolment.upsert({ where: { studentMembershipId_programmeId: { studentMembershipId: admitted.id, programmeId: programme.id } }, create: { schoolId: s, studentMembershipId: admitted.id, programmeId: programme.id, yearOfEntry: 2026, category: "OBC", quota: "CAP", roundId: F.round }, update: {} });
  await db.pupilRecord.upsert({ where: { studentMembershipId: admitted.id }, create: { schoolId: s, studentMembershipId: admitted.id, admissionNumber: "2026/0003", admissionDate: day("2026-07-02"), admissionCategory: "OBC", admissionQuota: "CAP", admissionRoundId: F.round, yearOfEntry: 2026 }, update: {} });
  for (const [id, n, name, category, extra] of APPS) {
    const exists = await db.collegeApplication.findUnique({ where: { id }, select: { id: true } });
    if (exists) continue;
    await db.collegeApplication.create({ data: { id, schoolId: s, roundId: F.round, programmeId: programme.id, number: n, applicantName: name, category, quota: "CAP", capAllotmentId: F.allotment(n), meritRank: ROWS[n - 1]![4], createdByUserId: admin.userId, ...(id === F.applicationAdmitted ? { admittedMembershipId: admitted.id } : {}), ...extra } });
  }

  // The library at a college: its terms, an e-resource, and cstudent02's counter fine for a late book.
  await db.librarySettings.upsert({ where: { schoolId: s }, create: { schoolId: s, facultyLimit: 10, facultyLoanDays: 90, collegeStudentLimit: 4, collegeStudentLoanDays: 15, bookBankExtra: 2 }, update: {} });
  await db.libraryEResource.upsert({ where: { id: F.eResource }, create: { id: F.eResource, schoolId: s, name: "ZZ N-LIST", url: "https://nlist.inflibnet.ac.in/", kind: "NLIST", clicks: 12 }, update: {} });
  const title = await db.libraryTitle.upsert({ where: { id: pad("zzcltitle", 1) }, create: { id: pad("zzcltitle", 1), schoolId: s, title: "ZZ Concepts of Physics", author: "ZZ H C Verma", category: "TEXTBOOK", language: "EN" }, update: {}, select: { id: true } });
  const copy = await db.libraryCopy.upsert({ where: { id: pad("zzclcopy", 1) }, create: { id: pad("zzclcopy", 1), schoolId: s, titleId: title.id, accession: "ZZV-0001" }, update: {}, select: { id: true } });
  const libMember = await db.libraryMember.upsert({ where: { membershipId: c2.id }, create: { schoolId: s, membershipId: c2.id, kind: "STUDENT_COLLEGE", cardNumber: "LZZV0002" }, update: {}, select: { id: true } });
  const issue = await db.libraryIssue.upsert({ where: { id: pad("zzclissue", 1) }, create: { id: pad("zzclissue", 1), schoolId: s, copyId: copy.id, memberId: libMember.id, issuedAt: day("2026-08-01"), dueOn: "2026-08-16", returnedAt: day("2026-08-24"), issuedByUserId: admin.userId, returnedByUserId: admin.userId }, update: {}, select: { id: true } });
  await db.libraryFine.upsert({ where: { issueId_reason: { issueId: issue.id, reason: "OVERDUE" } }, create: { schoolId: s, issueId: issue.id, memberId: libMember.id, paise: 800, reason: "OVERDUE", raisedByUserId: admin.userId }, update: {} });
  // Her exam-form clearance: the accounts line cleared by hand (her even semester waits for the trust's cheque), the library line open.
  const evenDue = await db.feeDemand.findFirst({ where: { studentMembershipId: c2.id, academicYearId: year.id, status: "OPEN" }, select: { netPaise: true } });
  await db.noDuesClearance.upsert({ where: { studentMembershipId_event_cycleKey: { studentMembershipId: c2.id, event: "EXAM_FORM", cycleKey: year.id } }, create: { schoolId: s, studentMembershipId: c2.id, event: "EXAM_FORM", cycleKey: year.id, clearsJson: JSON.stringify({ ACCOUNTS: { clearedByUserId: accounts.userId, clearedAt: new Date("2026-10-01T10:00:00Z").toISOString(), owedAtClearPaise: evenDue?.netPaise ?? 0, itemsAtClear: 0, note: "ZZ the trust pays the even semester" } }) }, update: {} });

  // The hostel at a college: its rules, two rooms and a squad round; the campus loop.
  await db.hostel.upsert({ where: { id: F.hostel }, create: { id: F.hostel, schoolId: s, name: "ZZ Tagore Hostel", kind: "MIXED", capacity: 8, curfewMinute: 1290, nightOutAllowed: true, messMonthlyPaise: 350_000 }, update: {} });
  for (const n of [1, 2]) await db.hostelRoom.upsert({ where: { id: F.room(n) }, create: { id: F.room(n), schoolId: s, hostelId: F.hostel, number: `ZZ-${100 + n}`, beds: 4 }, update: {} });
  await db.hostelSquadRound.upsert({ where: { id: pad("zzcsquad", 1) }, create: { id: pad("zzcsquad", 1), schoolId: s, hostelId: F.hostel, at: new Date("2026-09-28T21:30:00Z"), members: "ZZ Dr Medha Ranade, ZZ Prof Samir Kadam", note: "ZZ all quiet on both floors", flagged: false, loggedByUserId: admin.userId }, update: {} });
  await db.transportRoute.upsert({ where: { id: F.route }, create: { id: F.route, schoolId: s, name: "ZZ Campus Loop", direction: "BOTH", kind: "LOOP", feePerTermPaise: 0, note: "ZZ main gate, library, hostels, labs" }, update: {} });

  // Certificates: the college bonafide and migration templates, a bonafide issued, a migration asked for.
  const presets = collegePresetsFor("en");
  const templateIds: Record<string, string> = {};
  for (const key of ["COLLEGE-BONAFIDE-en", "MIGRATION-en"]) {
    const p = presets.find((x) => x.key === key)!;
    const t = await db.certificateTemplate.upsert({ where: { schoolId_name: { schoolId: s, name: `ZZ ${p.name}` } }, create: { schoolId: s, kind: p.kind, name: `ZZ ${p.name}`, locale: "en", title: p.title, intro: p.intro, rowsJson: JSON.stringify(p.rows), outro: p.outro, layoutJson: JSON.stringify(p.layout), serialPrefix: p.serialPrefix, createdByUserId: admin.userId }, update: {}, select: { id: true } });
    templateIds[key] = t.id;
  }
  const issued = await db.issuedCertificate.findFirst({ where: { schoolId: s, studentMembershipId: c1.id, kind: "BONAFIDE" }, select: { id: true } });
  if (!issued) {
    await db.issuedCertificate.create({ data: { schoolId: s, templateId: templateIds["COLLEGE-BONAFIDE-en"]!, studentMembershipId: c1.id, academicYearId: year.id, kind: "BONAFIDE", locale: "en", serial: `BC/${year.name}/0001`, number: 1, title: "Bonafide certificate", intro: "This is to certify that ZZ Ishaan Pathak is a bonafide student of this college in ZZ BSc Physics for the academic year 2026–27.", rowsJson: JSON.stringify([{ label: "Programme", value: "ZZ BSc Physics" }, { label: "University PRN", value: "ZZV2026001" }]), dataJson: JSON.stringify({ "college.programme": "ZZ BSc Physics", "college.prn": "ZZV2026001", missing: [] }), purpose: "ZZ a railway concession pass", studentName: "ZZ Ishaan Pathak", code: "ZZVIDYABC1", issuedByUserId: admin.userId } });
  }
  const ask = await db.certificateRequest.findFirst({ where: { studentMembershipId: c3.id, kind: "MIGRATION", status: "PENDING" }, select: { id: true } });
  if (!ask) await db.certificateRequest.create({ data: { schoolId: s, studentMembershipId: c3.id, requestedByUserId: c3.userId, kind: "MIGRATION", purpose: "ZZ admission to another university" } });

  return { students: STUDENTS.length + 1, demands, claims: 2, applications: APPS.length };
}
