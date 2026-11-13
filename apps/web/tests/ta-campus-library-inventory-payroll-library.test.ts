/**
 * The library's findings of the testing analysis of 13 November 2026 (batch campus-library-inventory-payroll).
 *
 * TA-044: a fine whose demand the office carried into next year's opening balance read DUE for ever, and a waiver
 * of it left the money asked on the ledger. TA-517: waiveFine read the fine's demand with no lock and wrote WAIVED
 * by id, so a payment that held the demand's lock at that moment ended PAID money under WAIVED. TA-293: Lost pressed
 * while the same loan was being returned set the returned copy LOST and fined the borrower. TA-294: copies added by
 * the catalogue import were not offered to the readers waiting for the title.
 *
 * One scratch ZZ school of this suite's own with the library on, a fine head and two years (the current one the
 * fines are raised in, and the next); removed afterwards with everything under it.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { importCatalogue, listFines, raiseFine, waiveFine } from "@/lib/library";
import { carryForward } from "@/lib/fees-reports";
import { decideForm } from "@/lib/exam-cell";
import type { ActiveContext } from "@/lib/session";

const db = new PrismaClient();
const other = new PrismaClient();
const STAMP = Date.now();
const SUFFIX = String(STAMP).slice(-6);
const ids = { school: "", admin: "", adminM: "", librarian: "", librarianM: "", from: "", to: "", head: "", title: "" };
const pupils: { userId: string; membershipId: string; memberId: string }[] = [];
let copyN = 0;

const ctx = (userId: string, membershipId: string, role: string): ActiveContext =>
  ({
    sessionId: "test",
    membershipId,
    schoolId: ids.school,
    role: role as ActiveContext["role"],
    user: { id: userId, name: "ZZ TA Library", preferredName: null, email: null, avatarKey: null, isMinor: false, isSuperuser: false, isAppAdmin: false, prefs: { theme: "system", contrast: "normal", font: "default", motion: "full", locale: "en", channels: { push: false, email: false }, quietHours: null } },
  }) as ActiveContext;
const librarian = () => ctx(ids.librarian, ids.librarianM, "LIBRARIAN");
const office = () => ctx(ids.admin, ids.adminM, "ADMIN");

/** A copy of the suite's title lent to a pupil: open unless `returned`. */
async function loan(pupil: number, returned = false) {
  copyN += 1;
  const copy = await db.libraryCopy.create({ data: { schoolId: ids.school, titleId: ids.title, accession: `ZZL${SUFFIX}-${copyN}`, status: returned ? "AVAILABLE" : "ISSUED" }, select: { id: true } });
  const issue = await db.libraryIssue.create({ data: { schoolId: ids.school, copyId: copy.id, memberId: pupils[pupil]!.memberId, dueOn: "2026-06-01", issuedByUserId: ids.librarian, returnedAt: returned ? new Date() : null }, select: { id: true } });
  return { copyId: copy.id, issueId: issue.id };
}

beforeAll(async () => {
  ids.school = (await db.school.create({ data: { name: `ZZ TA Library ${STAMP}`, slug: `zz-ta-lib-${STAMP}`, code: `ZTL${SUFFIX}`, contactEmail: `zz-ta-lib-${STAMP}@test.invalid`, timezone: "Asia/Kolkata" }, select: { id: true } })).id;
  await db.schoolModule.create({ data: { schoolId: ids.school, module: "LIBRARY" } });
  const user = (who: string, minor = false) => db.user.create({ data: { name: `ZZ TA Lib ${who}`, email: `zz-ta-lib-${who.toLowerCase()}-${STAMP}@test.invalid`, isMinor: minor }, select: { id: true } });
  const [admin, lib] = await Promise.all([user("Admin"), user("Librarian")]);
  ids.admin = admin.id;
  ids.librarian = lib.id;
  ids.adminM = (await db.membership.create({ data: { userId: admin.id, schoolId: ids.school, role: "ADMIN", status: "ACTIVE" }, select: { id: true } })).id;
  ids.librarianM = (await db.membership.create({ data: { userId: lib.id, schoolId: ids.school, role: "LIBRARIAN", status: "ACTIVE" }, select: { id: true } })).id;
  for (let n = 0; n < 4; n += 1) {
    const u = await user(`Pupil${n}`, true);
    const m = await db.membership.create({ data: { userId: u.id, schoolId: ids.school, role: "STUDENT", status: "ACTIVE", studentCode: `ZTLP${n}${STAMP}` }, select: { id: true } });
    const member = await db.libraryMember.create({ data: { schoolId: ids.school, membershipId: m.id, kind: "PUPIL", cardNumber: `ZTL${SUFFIX}-${n}` }, select: { id: true } });
    pupils.push({ userId: u.id, membershipId: m.id, memberId: member.id });
  }
  ids.from = (await db.academicYear.create({ data: { schoolId: ids.school, name: "ZZ 2025–26", startDate: new Date("2025-04-01T00:00:00Z"), endDate: new Date("2026-03-31T00:00:00Z"), isCurrent: true }, select: { id: true } })).id;
  ids.to = (await db.academicYear.create({ data: { schoolId: ids.school, name: "ZZ 2026–27", startDate: new Date("2026-04-01T00:00:00Z"), endDate: new Date("2027-03-31T00:00:00Z"), isCurrent: false }, select: { id: true } })).id;
  ids.head = (await db.feeHead.create({ data: { schoolId: ids.school, name: "Library fines", code: "LIB", kind: "OTHER" }, select: { id: true } })).id;
  await db.librarySettings.create({ data: { schoolId: ids.school, fineHeadId: ids.head } });
  ids.title = (await db.libraryTitle.create({ data: { schoolId: ids.school, title: `ZZ TA Atlas ${STAMP}`, author: "ZZ Cartographer" }, select: { id: true } })).id;
}, 60_000);

afterAll(async () => {
  await db.school.deleteMany({ where: { id: ids.school } });
  await db.user.deleteMany({ where: { email: { contains: `-${STAMP}@test.invalid` } } });
  await db.$disconnect();
  await other.$disconnect();
});

describe("TA-044: a fine carried into next year's opening balance", () => {
  it("TA-044: once the opening balance is paid the fine reads PAID, not DUE; a carried unpaid fine cannot be waived while the opening balance asks for it", async () => {
    const a = await loan(0, true);
    const b = await loan(1, true);
    const paidFine = await raiseFine(librarian(), { issueId: a.issueId, reason: "DAMAGE", paise: 2000 });
    const keptFine = await raiseFine(librarian(), { issueId: b.issueId, reason: "DAMAGE", paise: 3000 });
    expect(paidFine.status).toBe("DUE");
    const carried = await carryForward(office(), { fromYearId: ids.from, toYearId: ids.to });
    expect(carried.carriedPaise).toBe(5000);
    const opening = await db.feeDemand.findFirstOrThrow({ where: { schoolId: ids.school, studentMembershipId: pupils[0]!.membershipId, academicYearId: ids.to }, select: { id: true, netPaise: true } });
    // The family pays the opening balance on the ledger.
    await db.feeDemand.update({ where: { id: opening.id }, data: { status: "PAID", paidPaise: opening.netPaise } });
    const due = await listFines(librarian(), "DUE");
    expect(due.items.map((f) => f.id)).not.toContain(paidFine.id);
    expect((await listFines(librarian(), "ALL")).items.find((f) => f.id === paidFine.id)?.status).toBe("PAID");
    // The other pupil has not paid: the fine is still DUE, and a waiver here is refused (the opening balance keeps asking).
    expect(due.items.map((f) => f.id)).toContain(keptFine.id);
    await expect(waiveFine(librarian(), keptFine.id, "ZZ kindness")).rejects.toMatchObject({ message: "library.refuseFineCarried" });
    const fineRow = await db.libraryFine.findUniqueOrThrow({ where: { id: keptFine.id }, select: { waivedAt: true } });
    expect(fineRow.waivedAt).toBeNull();
  });
});

describe("TA-517: a waiver racing a payment of the fine's demand", () => {
  it("TA-517: a payment holding the demand's lock commits first; the waiver is refused and the demand stays PAID", async () => {
    const l = await loan(2, true);
    const fine = await raiseFine(librarian(), { issueId: l.issueId, reason: "DAMAGE", paise: 2000 });
    const demandId = (await db.libraryFine.findUniqueOrThrow({ where: { id: fine.id }, select: { demandId: true } })).demandId!;
    let release!: () => void;
    const gate = new Promise<void>((r) => (release = r));
    let held!: () => void;
    const holding = new Promise<void>((r) => (held = r));
    // A payment on a second connection: it locks the demand, writes it PAID, and commits only when released.
    const payment = other.$transaction(
      async (tx) => {
        await tx.$queryRaw`SELECT "id" FROM "FeeDemand" WHERE "id" = ${demandId} FOR UPDATE`;
        await tx.feeDemand.update({ where: { id: demandId }, data: { status: "PAID", paidPaise: 2000 } });
        held();
        await gate;
      },
      { timeout: 20_000 },
    );
    await holding;
    const waiver = waiveFine(librarian(), fine.id, "ZZ waive").then(
      () => "waived",
      (e: Error) => e.message,
    );
    await new Promise((r) => setTimeout(r, 700));
    release();
    await payment;
    expect(await waiver).toBe("library.refuseFinePaid");
    expect((await db.feeDemand.findUniqueOrThrow({ where: { id: demandId }, select: { status: true } })).status).toBe("PAID");
    expect((await db.libraryFine.findUniqueOrThrow({ where: { id: fine.id }, select: { waivedAt: true } })).waivedAt).toBeNull();
  }, 30_000);
});

describe("TA-517: the exam cell refusing a form while its fee is paid", () => {
  it("TA-517: a counter payment holding the fee's lock commits first; the refusal leaves the demand PAID, not CANCELLED", async () => {
    await db.schoolModule.create({ data: { schoolId: ids.school, module: "EXAMS" } });
    const ctl = await db.user.create({ data: { name: "ZZ TA Lib Controller", email: `zz-ta-lib-controller-${STAMP}@test.invalid` }, select: { id: true } });
    const ctlM = await db.membership.create({ data: { userId: ctl.id, schoolId: ids.school, role: "EXAM_CONTROLLER", status: "ACTIVE" }, select: { id: true } });
    const session = await db.examSession.create({ data: { schoolId: ids.school, name: `ZZ TA Session ${STAMP}`, termId: `zz-term-${STAMP}` }, select: { id: true } });
    const demand = await db.feeDemand.create({ data: { schoolId: ids.school, studentMembershipId: pupils[0]!.membershipId, academicYearId: ids.from, label: "ZZ exam fee", dueDate: new Date("2026-01-10T00:00:00Z"), grossPaise: 90_000, concessionPaise: 0, netPaise: 90_000, linesJson: "[]", status: "OPEN" }, select: { id: true } });
    const form = await db.examForm.create({ data: { schoolId: ids.school, sessionId: session.id, studentMembershipId: pupils[0]!.membershipId, feePaise: 90_000, feeDemandId: demand.id, status: "SUBMITTED", submittedAt: new Date() }, select: { id: true } });

    let release!: () => void;
    const gate = new Promise<void>((r) => (release = r));
    let held!: () => void;
    const holding = new Promise<void>((r) => (held = r));
    const payment = other.$transaction(
      async (tx) => {
        await tx.$queryRaw`SELECT "id" FROM "FeeDemand" WHERE "id" = ${demand.id} FOR UPDATE`;
        await tx.feeDemand.update({ where: { id: demand.id }, data: { status: "PAID", paidPaise: 90_000 } });
        held();
        await gate;
      },
      { timeout: 20_000 },
    );
    await holding;
    const refusal = decideForm(ctx(ctl.id, ctlM.id, "EXAM_CONTROLLER"), form.id, { approve: false, waiveFee: false, reason: "ZZ not eligible" }).then(
      () => "decided",
      (e: Error) => e.message,
    );
    await new Promise((r) => setTimeout(r, 700));
    release();
    await payment;
    expect(await refusal).toBe("decided");
    expect((await db.feeDemand.findUniqueOrThrow({ where: { id: demand.id }, select: { status: true } })).status).toBe("PAID");
    expect((await db.examForm.findUniqueOrThrow({ where: { id: form.id }, select: { status: true } })).status).toBe("REFUSED");
  }, 30_000);
});

describe("TA-293: Lost pressed while the loan is being returned", () => {
  it("TA-293: the return commits first; Lost is refused, the copy is not LOST and no LOST fine is raised", async () => {
    const l = await loan(3);
    let release!: () => void;
    const gate = new Promise<void>((r) => (release = r));
    let held!: () => void;
    const holding = new Promise<void>((r) => (held = r));
    // The return on a second connection: the loan closed and the copy back on the shelf, committed when released.
    const ret = other.$transaction(
      async (tx) => {
        await tx.libraryIssue.update({ where: { id: l.issueId }, data: { returnedAt: new Date(), returnedByUserId: ids.librarian } });
        await tx.libraryCopy.update({ where: { id: l.copyId }, data: { status: "AVAILABLE" } });
        held();
        await gate;
      },
      { timeout: 20_000 },
    );
    await holding;
    const lost = raiseFine(librarian(), { issueId: l.issueId, reason: "LOST", paise: 50_000 }).then(
      () => "raised",
      (e: Error) => e.message,
    );
    await new Promise((r) => setTimeout(r, 700));
    release();
    await ret;
    expect(await lost).toBe("library.refuseNotOnLoan");
    expect((await db.libraryCopy.findUniqueOrThrow({ where: { id: l.copyId }, select: { status: true } })).status).toBe("AVAILABLE");
    expect(await db.libraryFine.count({ where: { issueId: l.issueId, reason: "LOST" } })).toBe(0);
  }, 30_000);
});

describe("TA-294: the catalogue import and the readers waiting", () => {
  it("TA-294: a copy the import adds to a title with a queue is held for the first reader waiting, who is told", async () => {
    const title = await db.libraryTitle.create({ data: { schoolId: ids.school, title: `ZZ TA Queue ${STAMP}`, author: "ZZ Waiting" }, select: { id: true } });
    const res = await db.libraryReservation.create({ data: { schoolId: ids.school, titleId: title.id, memberId: pupils[1]!.memberId, placedByUserId: ids.librarian }, select: { id: true } });
    const result = await importCatalogue(librarian(), `title,author,copies,accession\nZZ TA Queue ${STAMP},ZZ Waiting,1,ZZQ${SUFFIX}-1\n`);
    expect(result.titlesMatched).toBe(1);
    expect(result.copiesCreated).toBe(1);
    const after = await db.libraryReservation.findUniqueOrThrow({ where: { id: res.id }, select: { readyAt: true, readyCopyId: true } });
    expect(after.readyAt).not.toBeNull();
    const copy = await db.libraryCopy.findFirstOrThrow({ where: { schoolId: ids.school, accession: `ZZQ${SUFFIX}-1` }, select: { id: true } });
    expect(after.readyCopyId).toBe(copy.id);
    expect(await db.notification.count({ where: { userId: pupils[1]!.userId, titleKey: "library.notifReadyTitle" } })).toBe(1);
  });
});
