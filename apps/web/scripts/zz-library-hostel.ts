/**
 * The ZZ library and hostel at ZZ Northgate (the library and hostel modules,
 * 3 October 2026), built by `npm run zz:fixtures` after the module roles.
 *
 * Library: the school's rules at their defaults (fines as counter dues), 20
 * titles and 30 copies (titles 1–10 two copies each, 11–20 one), pupil 01
 * with a loan five days overdue, pupil 02 with one due in ten days, pupil 02
 * first in the queue for title 1 (its copy on the shelf held for them),
 * pupil 01's cancelled reservation for title 2, and on pupil 01's late loan
 * of May one fine still due at the counter and one settled.
 *
 * Hostel: ZZ Tilak House with zz.warden in charge, four rooms, pupils 01–03
 * boarding, pupil 01's leave last weekend (consented by zz.parent01,
 * approved, out and back on time) and a cancelled ask, last night's roll call
 * taken with everyone present, a week's menu, and a visitor who has left.
 *
 * Every id is fixed (src/lib/api-catalog/library-hostel-fixture.ts), so the API
 * catalog's samples name them. Rebuilding first removes Northgate's library
 * and hostel rows — Northgate's alone, a ZZ school — and writes them again.
 */
import type { PrismaClient } from "@prisma/client";
import { HOSTEL_FIXTURE, HOSTEL_FIXTURE_MENU, HOSTEL_FIXTURE_ROOMS, LIBRARY_FIXTURE, LIBRARY_FIXTURE_TITLES } from "../src/lib/api-catalog/library-hostel-fixture";

const DAY = 86_400_000;
/** Today and its neighbours as days in India, where every ZZ school is. */
function ist(offsetDays: number): string {
  return new Date(Date.now() + 5.5 * 3_600_000 + offsetDays * DAY).toISOString().slice(0, 10);
}
/** An instant at a time of day in India, `offsetDays` from today. */
function istAt(offsetDays: number, hour: number): Date {
  return new Date(`${ist(offsetDays)}T${String(hour).padStart(2, "0")}:00:00+05:30`);
}

export async function buildLibraryHostel(db: PrismaClient, school: { id: string }) {
  const s = school.id;
  const pupil = (n: string) => db.membership.findFirst({ where: { schoolId: s, role: "STUDENT", status: "ACTIVE", user: { email: `zz.pupil${n}@zz.test` } }, select: { id: true } });
  const [p1, p2, p3, librarian, warden, parent01, admin] = await Promise.all([
    pupil("01"),
    pupil("02"),
    pupil("03"),
    db.membership.findFirst({ where: { schoolId: s, role: "LIBRARIAN", user: { email: "zz.librarian@zz.test" } }, select: { id: true, userId: true } }),
    db.membership.findFirst({ where: { schoolId: s, role: "WARDEN", user: { email: "zz.warden@zz.test" } }, select: { id: true, userId: true } }),
    db.user.findUnique({ where: { email: "zz.parent01@zz.test" }, select: { id: true } }),
    db.membership.findFirst({ where: { schoolId: s, role: "ADMIN" }, select: { userId: true } }),
  ]);
  if (!p1 || !p2 || !p3 || !librarian || !warden || !admin) return null;

  // Northgate's rows alone; the cascades take the copies, loans, fines, rooms and the rest.
  await db.libraryFine.deleteMany({ where: { schoolId: s } });
  await db.libraryReservation.deleteMany({ where: { schoolId: s } });
  await db.libraryIssue.deleteMany({ where: { schoolId: s } });
  await db.libraryMember.deleteMany({ where: { schoolId: s } });
  await db.libraryTitle.deleteMany({ where: { schoolId: s } });
  await db.librarySettings.deleteMany({ where: { schoolId: s } });
  await db.hostelVisitor.deleteMany({ where: { schoolId: s } });
  await db.hostelLeave.deleteMany({ where: { schoolId: s } });
  await db.hostelRollCall.deleteMany({ where: { schoolId: s } });
  await db.messAttendance.deleteMany({ where: { schoolId: s } });
  await db.hostelAllotment.deleteMany({ where: { schoolId: s } });
  await db.hostel.deleteMany({ where: { schoolId: s } });
  await db.incident.updateMany({ where: { schoolId: s, hostelId: { not: null } }, data: { hostelId: null } });

  /* ---- the library ---- */
  await db.librarySettings.create({ data: { schoolId: s, pupilLimit: 2, pupilLoanDays: 14, staffLimit: 5, staffLoanDays: 30, maxRenewals: 2, finePerDayPaise: 100, fineHeadId: null } });
  let copyNo = 0;
  for (let i = 0; i < LIBRARY_FIXTURE_TITLES.length; i += 1) {
    const t = LIBRARY_FIXTURE_TITLES[i]!;
    await db.libraryTitle.create({ data: { id: LIBRARY_FIXTURE.title(i + 1), schoolId: s, ...t } });
    for (let c = 0; c < (i < 10 ? 2 : 1); c += 1) {
      copyNo += 1;
      await db.libraryCopy.create({ data: { id: LIBRARY_FIXTURE.copy(copyNo), schoolId: s, titleId: LIBRARY_FIXTURE.title(i + 1), accession: LIBRARY_FIXTURE.accession(copyNo), rack: `ZZ-${String.fromCharCode(65 + Math.floor(i / 5))}${(i % 5) + 1}` } });
    }
  }
  const m1 = await db.libraryMember.create({ data: { schoolId: s, membershipId: p1.id, kind: "PUPIL", cardNumber: "L00001" }, select: { id: true } });
  const m2 = await db.libraryMember.create({ data: { schoolId: s, membershipId: p2.id, kind: "PUPIL", cardNumber: "L00002" }, select: { id: true } });
  // Pupil 01: copy 2 (title 1), due five days ago. Pupil 02: copy 3 (title 2), due in ten days.
  await db.libraryIssue.create({ data: { id: LIBRARY_FIXTURE.overdueIssue, schoolId: s, copyId: LIBRARY_FIXTURE.copy(2), memberId: m1.id, issuedAt: istAt(-19, 11), dueOn: ist(-5), issuedByUserId: librarian.userId } });
  await db.libraryIssue.create({ data: { id: LIBRARY_FIXTURE.currentIssue, schoolId: s, copyId: LIBRARY_FIXTURE.copy(3), memberId: m2.id, issuedAt: istAt(-4, 11), dueOn: ist(10), issuedByUserId: librarian.userId } });
  await db.libraryCopy.updateMany({ where: { id: { in: [LIBRARY_FIXTURE.copy(2), LIBRARY_FIXTURE.copy(3)] } }, data: { status: "ISSUED" } });
  // Pupil 01's loan of May, back three days late: one fine due at the counter, one for damage settled.
  await db.libraryIssue.create({ data: { id: LIBRARY_FIXTURE.returnedIssue, schoolId: s, copyId: LIBRARY_FIXTURE.copy(5), memberId: m1.id, issuedAt: new Date("2026-05-04T05:30:00Z"), dueOn: "2026-05-18", returnedAt: new Date("2026-05-21T05:30:00Z"), issuedByUserId: librarian.userId, returnedByUserId: librarian.userId } });
  await db.libraryFine.create({ data: { id: LIBRARY_FIXTURE.dueFine, schoolId: s, issueId: LIBRARY_FIXTURE.returnedIssue, memberId: m1.id, paise: 300, reason: "OVERDUE", raisedByUserId: librarian.userId, createdAt: new Date("2026-05-21T05:30:00Z") } });
  await db.libraryFine.create({ data: { id: LIBRARY_FIXTURE.settledFine, schoolId: s, issueId: LIBRARY_FIXTURE.returnedIssue, memberId: m1.id, paise: 5000, reason: "DAMAGE", raisedByUserId: librarian.userId, createdAt: new Date("2026-05-21T05:31:00Z"), settledAt: new Date("2026-05-22T05:30:00Z"), settledByUserId: admin.userId } });
  // Pupil 02 first in the queue for title 1: its copy on the shelf (copy 1) is held for them. Pupil 01's ask for title 2, taken back.
  await db.libraryReservation.create({ data: { id: LIBRARY_FIXTURE.reservation, schoolId: s, titleId: LIBRARY_FIXTURE.title(1), memberId: m2.id, placedAt: istAt(-2, 12), placedByUserId: librarian.userId, readyAt: istAt(-2, 12), readyCopyId: LIBRARY_FIXTURE.copy(1) } });
  await db.libraryReservation.create({ data: { id: LIBRARY_FIXTURE.cancelledReservation, schoolId: s, titleId: LIBRARY_FIXTURE.title(2), memberId: m1.id, placedAt: istAt(-3, 12), placedByUserId: librarian.userId, cancelledAt: istAt(-3, 13) } });

  /* ---- the hostel ---- */
  // owner-batch-item5 (27 Oct 2026): the house charges a mess bill a month, so the office's mess bill has boarders to bill.
  await db.hostel.create({ data: { id: HOSTEL_FIXTURE.hostel, schoolId: s, name: "ZZ Tilak House", kind: "MIXED", wardenMembershipId: warden.id, capacity: 9, messAttendance: false, messMonthlyPaise: 2_500_00 } });
  // end owner-batch-item5
  for (let i = 0; i < HOSTEL_FIXTURE_ROOMS.length; i += 1) await db.hostelRoom.create({ data: { id: HOSTEL_FIXTURE.room(i + 1), schoolId: s, hostelId: HOSTEL_FIXTURE.hostel, ...HOSTEL_FIXTURE_ROOMS[i]! } });
  const beds = [
    { n: 1, pupil: p1.id, room: 1, bed: 1 },
    { n: 2, pupil: p2.id, room: 1, bed: 2 },
    { n: 3, pupil: p3.id, room: 2, bed: 1 },
  ];
  for (const b of beds) {
    await db.hostelAllotment.create({ data: { id: HOSTEL_FIXTURE.allotment(b.n), schoolId: s, membershipId: b.pupil, roomId: HOSTEL_FIXTURE.room(b.room), bed: b.bed, fromDate: "2026-06-15", status: "ACTIVE", activePupilKey: b.pupil, activeBedKey: `${HOSTEL_FIXTURE.room(b.room)}:${b.bed}`, allottedByUserId: admin.userId } });
  }
  await db.hostelLeave.create({
    data: { id: HOSTEL_FIXTURE.returnedLeave, schoolId: s, allotmentId: HOSTEL_FIXTURE.allotment(1), membershipId: p1.id, kind: "HOME", fromAt: istAt(-8, 16), toAt: istAt(-6, 18), destination: "ZZ Home, Pune", reason: "ZZ Weekend at home", status: "APPROVED", requestedByUserId: parent01?.id ?? warden.userId, consentAt: istAt(-9, 9), consentUserId: parent01?.id ?? null, decidedAt: istAt(-9, 10), decidedByUserId: warden.userId, outAt: istAt(-8, 16), outByUserId: warden.userId, inAt: istAt(-6, 17), inByUserId: warden.userId, late: false },
  });
  await db.hostelLeave.create({ data: { id: HOSTEL_FIXTURE.cancelledLeave, schoolId: s, allotmentId: HOSTEL_FIXTURE.allotment(1), membershipId: p1.id, kind: "LOCAL", fromAt: istAt(-4, 15), toAt: istAt(-4, 18), destination: "ZZ Dentist", status: "CANCELLED", requestedByUserId: parent01?.id ?? warden.userId, consentAt: istAt(-5, 9), consentUserId: parent01?.id ?? null } });
  const call = await db.hostelRollCall.create({ data: { schoolId: s, hostelId: HOSTEL_FIXTURE.hostel, dateKey: ist(-1), slot: "NIGHT", takenByUserId: warden.userId, takenAt: istAt(-1, 21), clientId: "zz-fixture-roll" }, select: { id: true } });
  await db.hostelRollCallEntry.createMany({ data: beds.map((b) => ({ schoolId: s, rollCallId: call.id, allotmentId: HOSTEL_FIXTURE.allotment(b.n), membershipId: b.pupil, status: "PRESENT" })) });
  await db.messMenu.createMany({ data: HOSTEL_FIXTURE_MENU.map((m) => ({ schoolId: s, hostelId: HOSTEL_FIXTURE.hostel, ...m })) });
  await db.hostelVisitor.create({ data: { id: HOSTEL_FIXTURE.visitorOut, schoolId: s, allotmentId: HOSTEL_FIXTURE.allotment(2), name: "ZZ Rekha Kale", relation: "mother", inAt: istAt(-1, 16), outAt: istAt(-1, 17), allowedByUserId: warden.userId } });

  return { titles: LIBRARY_FIXTURE_TITLES.length, copies: copyNo, boarders: beds.length, rooms: HOSTEL_FIXTURE_ROOMS.length };
}
