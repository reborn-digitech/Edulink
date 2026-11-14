/**
 * The college's admissions desk: findings TA-077, TA-078, TA-079, TA-081, TA-083, TA-413, TA-529 (the cancel and
 * the admission fee) and TA-561 of the testing analysis of 13 November 2026, held by cases that FAIL while the
 * defect stands and pass once it is fixed.
 *
 *   TA-077  Two admits of one application at once made two students.
 *   TA-078  The offer read the newest first-year structure of any academic year.
 *   TA-079  A cancelled seat's unpaid terms stayed open, and its refund never reached the books.
 *   TA-081  The admission wrote a PRN already on another student.
 *   TA-083  An application of another programme passed a round's seat matrix without moving it.
 *   TA-413  Two applications made in one round at once: the second answered 500.
 *   TA-529  A cancel racing an admission left an active student on a CANCELLED application; two desks recording
 *           the admission fee at once both wrote.
 *   TA-561  An admission fee recorded above the offer was admitted with nothing on the ledger.
 *
 * One scratch ZZ college of this suite's own (its stamp in every name and address), made through the owner
 * connection and removed in afterAll with the accounts its admissions made.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient, type Prisma } from "@prisma/client";
import type { ActiveContext } from "@/lib/session";
import { admitStudent, cancelAdmission, createApplication, importAllotments, offerSeat, recordAdmissionFee, recordRefund } from "@/lib/college-admissions";
import { financeTable } from "@/lib/accounts";
import { addDaysToKey, todayKey } from "@/lib/dates";

const db = new PrismaClient();
const STAMP = Date.now();
/** The formally notified last date of admission, a month ahead: a cancellation today is refunded on the first slab. */
const LAST_DAY = addDaysToKey(todayKey("Asia/Kolkata"), 30);
const SUFFIX = String(STAMP).slice(-6);
const MAIL = (who: string) => `zz-ta-com-adm-${who}-${STAMP}@test.invalid`;
const ids: Record<string, string> = {};
let n = 0;

function ctxOf(who: "admin" | "accounts"): ActiveContext {
  return {
    sessionId: `zz-ta-com-adm-${who}`,
    membershipId: ids[`${who}M`]!,
    schoolId: ids.college!,
    role: who === "admin" ? "ADMIN" : "ACCOUNTS",
    user: {
      id: ids[who]!, name: `ZZ COM ${who}`, preferredName: null, email: null, avatarKey: null, isMinor: false, isSuperuser: false, isAppAdmin: false,
      prefs: { theme: "system", contrast: "normal", font: "default", motion: "full", locale: "en", channels: { push: false, email: false }, quietHours: null },
    },
  };
}
const admin = () => ctxOf("admin");
const accounts = () => ctxOf("accounts");

/** An application at the step named, in the round named (the fee structure's offer of 1,000,000 paise when FEE_DUE). */
async function application(status: string, opts: { roundId?: string; programmeId?: string; feeRecorded?: boolean } = {}): Promise<string> {
  n += 1;
  const feeDue = status === "FEE_DUE";
  return (
    await db.collegeApplication.create({
      data: {
        schoolId: ids.college!, roundId: opts.roundId ?? ids.round!, programmeId: opts.programmeId ?? ids.p1!, number: 5000 + n, applicantName: `ZZ COM Applicant ${n}`, category: "OPEN", quota: "INSTITUTE", status,
        antiRaggingStudentAt: new Date(), antiRaggingParentAt: new Date(),
        documentsJson: JSON.stringify({ domicile: { required: true, fileId: "f1", status: "VERIFIED", note: null }, marksheets: { required: true, fileId: "f2", status: "VERIFIED", note: null } }),
        ...(feeDue ? { feeStructureId: ids.structure!, admissionFeePaise: 1_000_000 } : {}),
        ...(feeDue && opts.feeRecorded !== false ? { admissionFeePaidAt: new Date(), admissionFeeMethod: "BANK", admissionFeeRef: `ZZUTR${n}` } : {}),
      },
      select: { id: true },
    })
  ).id;
}

type Settled = { ok: true; v: unknown } | { ok: false; e: unknown };
/** The value a settled call answered, as the type the test knows it to be; a refusal is rethrown. */
function valueOf<T>(s: Settled | undefined): T {
  if (!s?.ok) throw (s?.e ?? new Error("not settled"));
  return s.v as T;
}

/**
 * Runs the calls while this test's own transaction holds a lock they meet (taken by `lock`), lets them all reach it,
 * then releases it: the calls read before the lock and write after it, the window a race needs.
 */
async function whileHeld(lock: (tx: Prisma.TransactionClient) => Promise<unknown>, calls: () => Promise<unknown>[], ms = 1500): Promise<Settled[]> {
  let release!: () => void;
  const gate = new Promise<void>((r) => (release = r));
  let ready!: () => void;
  const isReady = new Promise<void>((r) => (ready = r));
  const holder = db.$transaction(
    async (tx) => {
      await lock(tx);
      ready();
      await gate;
    },
    { timeout: 60_000, maxWait: 10_000 },
  );
  await isReady;
  const runs = calls().map((p) => p.then((v): Settled => ({ ok: true, v }), (e: unknown): Settled => ({ ok: false, e })));
  await new Promise((r) => setTimeout(r, ms));
  release();
  await holder;
  return Promise.all(runs);
}

async function refusal(p: Promise<unknown>): Promise<string> {
  try {
    await p;
    return "went through";
  } catch (e) {
    return (e as { key?: string }).key ?? String(e);
  }
}

beforeAll(async () => {
  ids.college = (await db.school.create({ data: { name: `ZZ TA-COM Admissions ${STAMP}`, slug: `zz-ta-com-adm-${STAMP}`, code: `ZZCA${SUFFIX}`, contactEmail: MAIL("office"), timezone: "Asia/Kolkata", kind: "COLLEGE", isTestFixture: true }, select: { id: true } })).id;
  await db.schoolModule.createMany({ data: [{ schoolId: ids.college, module: "ADMISSIONS" }, { schoolId: ids.college, module: "ACADEMICS" }] });
  for (const [who, role] of [["admin", "ADMIN"], ["accounts", "ACCOUNTS"]] as const) {
    ids[who] = (await db.user.create({ data: { name: `ZZ COM ${who}`, email: MAIL(who), prefs: "{}" }, select: { id: true } })).id;
    ids[`${who}M`] = (await db.membership.create({ data: { userId: ids[who]!, schoolId: ids.college, role, status: "ACTIVE" }, select: { id: true } })).id;
  }
  ids.lastYear = (await db.academicYear.create({ data: { schoolId: ids.college, name: `ZZ 2025-26 ${STAMP}`, startDate: new Date("2025-06-01T00:00:00Z"), endDate: new Date("2026-05-31T00:00:00Z"), isCurrent: false }, select: { id: true } })).id;
  ids.year = (await db.academicYear.create({ data: { schoolId: ids.college, name: `ZZ 2026-27 ${STAMP}`, startDate: new Date("2026-06-01T00:00:00Z"), endDate: new Date("2027-05-31T00:00:00Z"), isCurrent: true }, select: { id: true } })).id;
  const dept = await db.department.create({ data: { schoolId: ids.college, code: `ZCA${SUFFIX}`, name: "ZZ COM Physics" }, select: { id: true } });
  ids.p1 = (await db.programme.create({ data: { schoolId: ids.college, departmentId: dept.id, code: "BSCPHY", name: "ZZ COM BSc Physics", level: "UG", durationYears: 3, regulator: "UGC" }, select: { id: true } })).id;
  ids.p2 = (await db.programme.create({ data: { schoolId: ids.college, departmentId: dept.id, code: "BAECO", name: "ZZ COM BA Economics", level: "UG", durationYears: 3, regulator: "UGC" }, select: { id: true } })).id;
  ids.tui = (await db.feeHead.create({ data: { schoolId: ids.college, name: "ZZ Tuition", code: "TUI", kind: "TUITION" }, select: { id: true } })).id;
  // This year's first-year OPEN structure for BSc Physics: two terms of 1,000,000 paise.
  const structure = async (yearId: string, programmeId: string, terms: [string, string][]) => {
    const s = await db.feeStructure.create({ data: { schoolId: ids.college!, academicYearId: yearId, name: `ZZ FY ${STAMP} ${yearId.slice(-4)}`, publishedAt: new Date(), programmeId, yearOfStudy: 1, category: "OPEN" }, select: { id: true } });
    let i = 0;
    for (const [label, due] of terms) {
      const inst = await db.feeInstalment.create({ data: { schoolId: ids.college!, structureId: s.id, label, sortOrder: i++, dueDate: new Date(`${due}T00:00:00Z`) }, select: { id: true } });
      await db.feeLine.create({ data: { schoolId: ids.college!, instalmentId: inst.id, headId: ids.tui!, amountPaise: 1_000_000 } });
    }
    return s.id;
  };
  ids.structure = await structure(ids.year, ids.p1, [["ZZ Term 1", "2026-07-15"], ["ZZ Term 2", "2026-12-15"]]);
  // Last year's structure for BA Economics only: this year's BA intake has none yet (TA-078).
  ids.oldStructure = await structure(ids.lastYear, ids.p2, [["ZZ Old Term 1", "2025-07-15"]]);
  ids.round = (await db.admissionRound.create({ data: { schoolId: ids.college, programmeId: ids.p1, intakeYear: 2026, kind: "MERIT", name: `ZZ Merit BSc ${STAMP}`, opensAt: new Date("2026-06-01T00:00:00Z"), closesAt: new Date("2027-05-31T23:59:59Z"), seatsJson: JSON.stringify({ OPEN: 50 }) }, select: { id: true } })).id;
  ids.roundBa = (await db.admissionRound.create({ data: { schoolId: ids.college, programmeId: ids.p2, intakeYear: 2026, kind: "MERIT", name: `ZZ Merit BA ${STAMP}`, opensAt: new Date("2026-06-01T00:00:00Z"), closesAt: new Date("2027-05-31T23:59:59Z"), seatsJson: "{}" }, select: { id: true } })).id;
});

afterAll(async () => {
  if (ids.college) {
    const admitted = await db.membership.findMany({ where: { schoolId: ids.college, role: "STUDENT" }, select: { userId: true } });
    await db.notification.deleteMany({ where: { schoolId: ids.college } });
    await db.auditLog.deleteMany({ where: { schoolId: ids.college } });
    await db.school.deleteMany({ where: { id: ids.college } });
    await db.user.deleteMany({ where: { id: { in: admitted.map((m) => m.userId) } } });
  }
  await db.user.deleteMany({ where: { email: { contains: `-${STAMP}@test.invalid` } } });
  await db.$disconnect();
});

describe("TA-077, TA-529: one application, one admission", () => {
  it("TA-077: two admits of one application at once make one student, and both answers name it", async () => {
    const app = await application("FEE_DUE");
    const number = `2026/${String(5000 + n).padStart(4, "0")}`;
    // Both calls read FEE_DUE and queue on the college's seat lock, which this test holds until both are waiting.
    const [a, b] = await whileHeld((tx) => tx.$queryRaw`SELECT 1 FROM pg_advisory_xact_lock(hashtext(${`college-seats:${ids.college}`}))`, () => [admitStudent(admin(), app), admitStudent(admin(), app)]);
    expect(a!.ok && b!.ok).toBe(true);
    const students = await db.membership.count({ where: { schoolId: ids.college, role: "STUDENT", pupilRecord: { admissionNumber: number } } });
    expect(students).toBe(1);
    expect(valueOf<{ studentMembershipId: string }>(a).studentMembershipId).toBe(valueOf<{ studentMembershipId: string }>(b).studentMembershipId);
  });

  it("TA-529: a cancel racing an admission never leaves the application and the seat telling two stories", async () => {
    const app = await application("FEE_DUE");
    // The admission waits on the seat lock this test holds; the cancel, sent meanwhile, must not decide on the FEE_DUE it read.
    const [admitted, cancelled] = await whileHeld((tx) => tx.$queryRaw`SELECT 1 FROM pg_advisory_xact_lock(hashtext(${`college-seats:${ids.college}`}))`, () => [admitStudent(admin(), app), cancelAdmission(admin(), app, { reason: "ZZ took a seat elsewhere", lastDateKey: LAST_DAY })]);
    expect(cancelled!.ok).toBe(true);
    const row = await db.collegeApplication.findUniqueOrThrow({ where: { id: app }, select: { status: true, admittedMembershipId: true } });
    // The cancel answered success, so the application is cancelled, and a student the admission made is ended with it.
    expect(row.status).toBe("CANCELLED");
    if (row.admittedMembershipId) {
      expect((await db.membership.findUniqueOrThrow({ where: { id: row.admittedMembershipId }, select: { leftAt: true } })).leftAt).not.toBeNull();
      expect((await db.programmeEnrolment.findFirstOrThrow({ where: { studentMembershipId: row.admittedMembershipId } })).status).toBe("CANCELLED");
      // And the fee the college holds still reached the ledger, however the cancel fell against its posting.
      expect(valueOf<{ receiptSerial: string | null }>(admitted).receiptSerial).toBeTruthy();
    } else {
      expect(admitted!.ok).toBe(false);
      expect(await db.membership.count({ where: { schoolId: ids.college, role: "STUDENT", pupilRecord: { admissionNumber: `2026/${String(5000 + n).padStart(4, "0")}` }, leftAt: null } })).toBe(0);
    }
  });

  it("TA-529: two desks recording the admission fee at once: one stands, the other is answered with it", async () => {
    const app = await application("FEE_DUE", { feeRecorded: false });
    // Both read "not recorded yet" and queue on the application's row, which this test holds.
    const [a, b] = await whileHeld((tx) => tx.$queryRaw`SELECT "id" FROM "CollegeApplication" WHERE "id" = ${app} FOR UPDATE`, () => [recordAdmissionFee(accounts(), app, { amountPaise: 1_000_000, method: "BANK", reference: "ZZREF-A" }), recordAdmissionFee(admin(), app, { amountPaise: 1_000_000, method: "CASH", reference: "ZZREF-B" })]);
    expect(a!.ok && b!.ok).toBe(true);
    const row = await db.collegeApplication.findUniqueOrThrow({ where: { id: app }, select: { admissionFeeRef: true, admissionFeePaidAt: true } });
    expect(await db.auditLog.count({ where: { schoolId: ids.college, action: "college.admissions.fee", targetId: app } })).toBe(1);
    for (const x of [a, b]) expect(valueOf<{ admissionFeePaidAt: string | null }>(x).admissionFeePaidAt).toBe(row.admissionFeePaidAt!.toISOString());
  });
});

describe("TA-561: the admission fee is the offer's", () => {
  it("TA-561: an amount above the offer is refused, so the admission's ledger write never fails on it", async () => {
    const app = await application("FEE_DUE", { feeRecorded: false });
    expect(await refusal(recordAdmissionFee(accounts(), app, { amountPaise: 1_100_000, method: "BANK", reference: "ZZOVER" }))).toBe("collegeOffice.refuseFeeOver");
    expect((await db.collegeApplication.findUniqueOrThrow({ where: { id: app }, select: { admissionFeePaidAt: true } })).admissionFeePaidAt).toBeNull();
    await recordAdmissionFee(accounts(), app, { amountPaise: 1_000_000, method: "BANK", reference: "ZZEXACT" });
    const r = await admitStudent(admin(), app);
    expect(r.receiptSerial).toBeTruthy();
    const first = await db.feeDemand.findFirstOrThrow({ where: { studentMembershipId: r.studentMembershipId }, orderBy: { dueDate: "asc" }, select: { status: true } });
    expect(first.status).toBe("PAID");
  });
});

describe("TA-081: one PRN per student", () => {
  it("TA-081: a second admission with a PRN already on another student is refused and creates nothing", async () => {
    const prn = `ZZPRN${SUFFIX}`;
    const one = await application("FEE_DUE");
    await admitStudent(admin(), one, { prn });
    const two = await application("FEE_DUE");
    const members = await db.membership.count({ where: { schoolId: ids.college } });
    expect(await refusal(admitStudent(admin(), two, { prn: prn.toLowerCase() }))).toBe("academics.refusePrnTaken");
    expect(await db.membership.count({ where: { schoolId: ids.college } })).toBe(members);
    expect((await db.collegeApplication.findUniqueOrThrow({ where: { id: two }, select: { status: true } })).status).toBe("FEE_DUE");
  });
});

describe("TA-078: the offer is in the intake's year", () => {
  it("TA-078: with no first-year structure in the intake's year the seat stands OFFERED, never on last year's books", async () => {
    const app = await application("SCRUTINY", { roundId: ids.roundBa, programmeId: ids.p2 });
    const offered = await offerSeat(admin(), app);
    expect(offered.status).toBe("OFFERED");
    expect((await db.collegeApplication.findUniqueOrThrow({ where: { id: app }, select: { feeStructureId: true } })).feeStructureId).toBeNull();
    // Named, last year's structure is refused too.
    expect(await refusal(offerSeat(admin(), app, { feeStructureId: ids.oldStructure! }))).toBe("collegeOffice.refuseStructure");
    // A structure of another programme named is refused.
    expect(await refusal(offerSeat(admin(), app, { feeStructureId: ids.structure! }))).toBe("collegeOffice.refuseStructure");
  });

  it("TA-078: this year's structure is the one offered, and the plan is in this year", async () => {
    const app = await application("SCRUTINY");
    const offered = await offerSeat(admin(), app);
    expect(offered.status).toBe("FEE_DUE");
    expect((await db.collegeApplication.findUniqueOrThrow({ where: { id: app }, select: { feeStructureId: true } })).feeStructureId).toBe(ids.structure);
  });
});

describe("TA-083, TA-413: a round's applications", () => {
  it("TA-083: a round for one programme refuses an application typed for another", async () => {
    const before = await db.collegeApplication.count({ where: { roundId: ids.round } });
    expect(await refusal(createApplication(admin(), { roundId: ids.round!, programmeId: ids.p2!, applicantName: "ZZ COM Wrong Programme", category: "OPEN", quota: "INSTITUTE" }))).toBe("collegeOffice.refuseRoundProgramme");
    expect(await db.collegeApplication.count({ where: { roundId: ids.round } })).toBe(before);
  });

  it("TA-083: an imported row whose choice code is another programme's is refused by its line, not attached", async () => {
    const cap = (await db.admissionRound.create({ data: { schoolId: ids.college!, programmeId: ids.p1!, intakeYear: 2026, kind: "CAP_1", name: `ZZ CAP BSc ${STAMP}`, opensAt: new Date("2026-06-01T00:00:00Z"), closesAt: new Date("2027-05-31T23:59:59Z"), seatsJson: "{}" }, select: { id: true } })).id;
    const sheet = ["Sr. No.,Application ID,Name,Gender,Category,Seat Type,Choice Code,Merit No", `1,ZZC${SUFFIX}1,ZZ COM Asha,F,OPEN,GOPENS,BSCPHY,101`, `2,ZZC${SUFFIX}2,ZZ COM Neel,M,OPEN,GOPENS,BAECO,102`].join("\n");
    const r = await importAllotments(admin(), cap, sheet);
    expect(r.added).toBe(1);
    expect(r.refused).toEqual([{ line: 3, reason: "programme" }]);
    expect(await db.capAllotment.count({ where: { roundId: cap, programmeId: ids.p2 } })).toBe(0);
  });

  it("TA-413: two applications typed at once in one round are numbered n and n+1, and one allotment row twice is one application", async () => {
    const raceRound = (await db.admissionRound.create({ data: { schoolId: ids.college!, programmeId: ids.p1!, intakeYear: 2026, kind: "MERIT", name: `ZZ Merit race ${STAMP}`, opensAt: new Date("2026-06-01T00:00:00Z"), closesAt: new Date("2027-05-31T23:59:59Z"), seatsJson: "{}" }, select: { id: true } })).id;
    const input = (who: string) => ({ roundId: raceRound, programmeId: ids.p1!, applicantName: `ZZ COM Race ${who}`, category: "OPEN" as const, quota: "INSTITUTE" as const });
    // The round's row held FOR UPDATE: every insert's key check on it waits, after each call has read the highest number.
    const holdRound = (tx: Prisma.TransactionClient) => tx.$queryRaw`SELECT "id" FROM "AdmissionRound" WHERE "id" = ${raceRound} FOR UPDATE`;
    const results = await whileHeld(holdRound, () => [createApplication(admin(), input("A")), createApplication(admin(), input("B")), createApplication(admin(), input("C"))]);
    expect(results.map((r) => r.ok)).toEqual([true, true, true]);
    const numbers = results.map((r) => valueOf<{ number: number }>(r).number).sort((x, y) => x - y);
    expect(numbers[1]).toBe(numbers[0]! + 1);
    expect(numbers[2]).toBe(numbers[0]! + 2);
    const row = await db.capAllotment.create({ data: { schoolId: ids.college!, roundId: raceRound, cetApplicationId: `ZZR${SUFFIX}`, applicantName: "ZZ COM Row", programmeCode: "BSCPHY", programmeId: ids.p1!, category: "OPEN", quota: "INSTITUTE" }, select: { id: true } });
    const twice = await whileHeld(holdRound, () => [createApplication(admin(), { roundId: raceRound, capAllotmentId: row.id }), createApplication(admin(), { roundId: raceRound, capAllotmentId: row.id })]);
    expect(twice.map((r) => r.ok)).toEqual([true, true]);
    const [x, y] = twice.map((r) => valueOf<{ id: string }>(r).id);
    expect(x).toBe(y);
  });
});

describe("TA-079: a cancelled seat leaves the books as the student left", () => {
  it("TA-079: the unpaid term is cancelled with the seat, and the refund is a refund the books read", async () => {
    const app = await application("FEE_DUE");
    const r = await admitStudent(admin(), app);
    expect(r.receiptSerial).toBeTruthy();
    const collectedBefore = (await financeTable(ids.college!, 1)).years[0]!.feesCollectedPaise;
    await cancelAdmission(admin(), app, { reason: "ZZ took a seat elsewhere", lastDateKey: LAST_DAY });
    // The second term, unpaid, is CANCELLED: nothing outstanding, nobody to chase as a defaulter.
    const open = await db.feeDemand.count({ where: { studentMembershipId: r.studentMembershipId, status: { in: ["OPEN", "PART"] } } });
    expect(open).toBe(0);
    expect(await db.feeDemand.count({ where: { studentMembershipId: r.studentMembershipId, status: "CANCELLED" } })).toBe(1);
    const cancelled = await db.collegeApplication.findUniqueOrThrow({ where: { id: app }, select: { refundPaise: true } });
    expect(cancelled.refundPaise).toBeGreaterThan(0);
    await recordRefund(accounts(), app, "ZZREFUND1");
    const refunds = await db.feeRefund.findMany({ where: { schoolId: ids.college, payment: { studentMembershipId: r.studentMembershipId } }, select: { amountPaise: true, status: true } });
    expect(refunds).toEqual([{ amountPaise: cancelled.refundPaise, status: "DONE" }]);
    const collectedAfter = (await financeTable(ids.college!, 1)).years[0]!.feesCollectedPaise;
    expect(collectedBefore - collectedAfter).toBe(cancelled.refundPaise);
  });

  it("TA-079: the refund keeps the ledger's rule, a payment's allocations and settled refunds adding up to its amount, and no term reopens", async () => {
    const app = await application("FEE_DUE");
    const r = await admitStudent(admin(), app);
    expect(r.receiptSerial).toBeTruthy();
    await cancelAdmission(admin(), app, { reason: "ZZ took a seat elsewhere", lastDateKey: LAST_DAY });
    await recordRefund(accounts(), app, "ZZREFUND2");
    const payments = await db.feePayment.findMany({ where: { schoolId: ids.college, studentMembershipId: r.studentMembershipId }, select: { amountPaise: true, status: true, allocations: { select: { amountPaise: true } }, refunds: { select: { amountPaise: true, status: true } } } });
    expect(payments.length).toBe(1);
    for (const p of payments) {
      const allocated = p.allocations.reduce((s, x) => s + x.amountPaise, 0);
      const refunded = p.refunds.filter((x) => x.status === "DONE").reduce((s, x) => s + x.amountPaise, 0);
      expect(refunded).toBeGreaterThan(0);
      // The data audit's fee-payment check (tests/data-audit.test.ts): allocations + DONE refunds = amount.
      expect(allocated + refunded).toBe(p.amountPaise);
    }
    // Nothing is owed by a student who gave the seat up, and every term still counted reads its allocations.
    const demands = await db.feeDemand.findMany({ where: { schoolId: ids.college, studentMembershipId: r.studentMembershipId }, select: { status: true, paidPaise: true, allocations: { select: { amountPaise: true } } } });
    expect(demands.filter((x) => x.status === "OPEN" || x.status === "PART")).toEqual([]);
    for (const x of demands.filter((y) => !["WAIVED", "CANCELLED", "CARRIED"].includes(y.status))) expect(x.paidPaise).toBe(x.allocations.reduce((s, y) => s + y.amountPaise, 0));
  });
});

describe("TA-529: a cancel meeting the admission's own fee posting", () => {
  it("TA-529: a cancel run between the admission's commit and its fee posting keeps the fee on the ledger and refunds on it", async () => {
    const app = await application("FEE_DUE");
    // An uncommitted payment holding the admission's own clientId: admitStudent's fee posting, after its transaction
    // has committed, waits on that key until this test rolls it back. The cancel runs in that window.
    let release!: () => void;
    const gate = new Promise<void>((res) => (release = res));
    let ready!: () => void;
    const isReady = new Promise<void>((res) => (ready = res));
    const holder = db
      .$transaction(
        async (tx) => {
          await tx.feePayment.create({ data: { schoolId: ids.college!, studentMembershipId: ids.adminM!, amountPaise: 100, method: "CASH", status: "INITIATED", clientId: `college-admission-${app}` } });
          ready();
          await gate;
          throw new Error("zz-rollback");
        },
        { timeout: 60_000, maxWait: 10_000 },
      )
      .catch(() => undefined);
    await isReady;
    const admitting = admitStudent(admin(), app).then((v): Settled => ({ ok: true, v }), (e: unknown): Settled => ({ ok: false, e }));
    for (let i = 0; i < 200; i += 1) {
      if ((await db.collegeApplication.findUniqueOrThrow({ where: { id: app }, select: { status: true } })).status === "ADMITTED") break;
      await new Promise((res) => setTimeout(res, 100));
    }
    const cancelled = await cancelAdmission(admin(), app, { reason: "ZZ took a seat elsewhere", lastDateKey: LAST_DAY });
    expect(cancelled.status).toBe("CANCELLED");
    release();
    await holder;
    const admitted = valueOf<{ studentMembershipId: string; receiptSerial: string | null }>(await admitting);
    // The fee reached the ledger against the first term, and the refund was worked out on it.
    expect(admitted.receiptSerial).toBeTruthy();
    const payment = await db.feePayment.findFirstOrThrow({ where: { schoolId: ids.college, clientId: `college-admission-${app}` }, select: { status: true, amountPaise: true } });
    expect(payment).toEqual({ status: "PAID", amountPaise: 1_000_000 });
    const terms = await db.feeDemand.findMany({ where: { studentMembershipId: admitted.studentMembershipId }, orderBy: { dueDate: "asc" }, select: { status: true } });
    expect(terms.map((t) => t.status)).toEqual(["PAID", "CANCELLED"]);
    const row = await db.collegeApplication.findUniqueOrThrow({ where: { id: app }, select: { refundPaise: true } });
    expect(row.refundPaise).toBeGreaterThan(0);
  });
});
