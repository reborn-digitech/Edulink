import type { PrismaClient } from "@prisma/client";

/**
 * THE SEATS FIXTURE (17 October 2026; src/lib/gig-sessions.ts, decision 0006 amending 0004).
 *
 *   - A PRICED ONE-TO-ONE by zz.expert1 (₹200, twelve days ahead) with a seat held by zz.pupil01, bought by their
 *     guardian, in the company-collects form (SessionPayment path COMPANY, HELD): ₹200 gross, ₹30 commission at 15 %,
 *     ₹5.40 GST on it at 18 %, ₹164.60 net. The receipt sits in the fixtures' own "ZZ" series (ZZ-R/<FY>/0003, after
 *     the two buildGigSessions writes), so a real capture never meets it. The expert's own paid gate is not asked of a
 *     fixture row, as for the paid workshop seat beside it.
 *   - A PRICED GUIDANCE SLOT by zz.teacher1 (₹100, nine days ahead, no seat), with the teacher's UPI id saved for the
 *     company to pay them (made only when they have none).
 *
 * Idempotent: a slot is found by its provider and title before it is made, and buildGigSessions — which runs first and
 * clears its providers' "ZZ " slots each run — takes the expert's with it, so a run always ends with exactly one of
 * each. The rows cascade away with the ZZ people and schools on --teardown.
 */
export const SEATS_EXPERT_TITLE = "ZZ Priced one-to-one: a bridge engineer's half hour";
export const SEATS_TEACHER_TITLE = "ZZ Priced guidance: fractions, one to one";

const DAY = 86_400_000;
/** Whole hours, so a rebuild never leaves a slot in the past that should be ahead. */
const at = (now: Date, days: number, hour = 11) => {
  const d = new Date(now.getTime() + days * DAY);
  d.setUTCHours(hour, 0, 0, 0);
  return d;
};
const financialYear = (now: Date) => {
  const y = now.getUTCMonth() + 1 >= 4 ? now.getUTCFullYear() : now.getUTCFullYear() - 1;
  return `${y}-${String((y + 1) % 100).padStart(2, "0")}`;
};

export async function buildSeats(db: PrismaClient, opts: { domain: string; northgateId: string; now?: Date }): Promise<{ expertSlot: string | null; expertSeat: string | null; teacherSlot: string | null }> {
  const now = opts.now ?? new Date();
  const [expert, teacher] = await Promise.all([
    db.user.findUnique({ where: { email: `zz.expert1@${opts.domain}` }, select: { id: true, expertProfile: { select: { publishedAt: true } } } }),
    db.user.findUnique({ where: { email: `zz.teacher1@${opts.domain}` }, select: { id: true } }),
  ]);
  const pupil = await db.membership.findFirst({ where: { schoolId: opts.northgateId, role: "STUDENT", status: "ACTIVE", user: { email: `zz.pupil01@${opts.domain}` } }, select: { id: true, guardianships: { where: { status: "ACTIVE" }, orderBy: { createdAt: "asc" }, take: 1, select: { parentUserId: true } } } });
  const year = (await db.academicYear.findFirst({ where: { schoolId: opts.northgateId, isCurrent: true }, select: { id: true } }))?.id ?? null;

  let expertSlot: string | null = null;
  let expertSeat: string | null = null;
  const payer = pupil?.guardianships[0]?.parentUserId ?? null;
  if (expert?.expertProfile?.publishedAt && pupil && payer) {
    const startsAt = at(now, 12);
    const found = await db.gigSlot.findFirst({ where: { providerUserId: expert.id, title: SEATS_EXPERT_TITLE, cancelledAt: null }, select: { id: true } });
    const slot = found ?? (await db.gigSlot.create({ data: { providerUserId: expert.id, providerKind: "EXPERT", teacherSchoolId: null, kind: "ONE_TO_ONE", title: SEATS_EXPERT_TITLE, startsAt, endsAt: new Date(startsAt.getTime() + 30 * 60_000), meetingUrl: "https://meet.jit.si/zz-priced-one-to-one", seats: 1, seatsTaken: 1, pricePaise: 20_000 }, select: { id: true } }));
    expertSlot = slot.id;
    const booking =
      (await db.gigBooking.findUnique({ where: { slotId_studentMembershipId: { slotId: slot.id, studentMembershipId: pupil.id } }, select: { id: true } })) ??
      (await db.gigBooking.create({ data: { schoolId: opts.northgateId, slotId: slot.id, studentMembershipId: pupil.id, providerUserId: expert.id, kind: "ONE_TO_ONE", status: "CONFIRMED", bookedByUserId: payer, purpose: "ZZ A half hour past the free two, bought by her guardian.", academicYearId: year, consentAt: now, consentUserId: payer, paid: true }, select: { id: true } }));
    expertSeat = booking.id;
    const receiptNumber = `ZZ-R/${financialYear(now)}/0003`;
    const paid = await db.sessionPayment.findUnique({ where: { bookingId: booking.id }, select: { id: true } });
    if (!paid) {
      // A stale receipt of this number (its booking gone another way) is the fixture's own, never a real one.
      await db.sessionPayment.deleteMany({ where: { receiptNumber } });
      await db.sessionPayment.create({ data: { bookingId: booking.id, slotId: slot.id, payerUserId: payer, expertUserId: expert.id, amountPaise: 20_000, commissionPaise: 3_000, gstPaise: 540, netPaise: 16_460, receiptNumber, receiptSerial: 3, orderId: `order_zzseats${booking.id.slice(-10)}`, paymentId: `pay_zzseats${booking.id.slice(-10)}`, paidAt: now, status: "HELD", path: "COMPANY" } });
    }
  }

  let teacherSlot: string | null = null;
  if (teacher) {
    await db.gigPayee.upsert({ where: { userId: teacher.id }, create: { userId: teacher.id, upiId: "zz.teacher1@zzbank", payeeName: "ZZ Sunita Kale" }, update: {} });
    const startsAt = at(now, 9, 10);
    const found = await db.gigSlot.findFirst({ where: { providerUserId: teacher.id, title: SEATS_TEACHER_TITLE, cancelledAt: null }, select: { id: true } });
    teacherSlot = (found ?? (await db.gigSlot.create({ data: { providerUserId: teacher.id, providerKind: "TEACHER", teacherSchoolId: opts.northgateId, kind: "ONE_TO_ONE", title: SEATS_TEACHER_TITLE, startsAt, endsAt: new Date(startsAt.getTime() + 30 * 60_000), meetingUrl: "https://meet.google.com/zzs-fixt-ure", seats: 1, seatsTaken: 0, pricePaise: 10_000 }, select: { id: true } }))).id;
  }
  return { expertSlot, expertSeat, teacherSlot };
}
