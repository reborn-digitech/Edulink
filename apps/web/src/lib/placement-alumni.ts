import "server-only";
import { db } from "./db";
import { audit } from "./audit";
import { notify } from "./notify";
import { AccessError } from "./access-error";
import { RuleRefusal } from "./rule-refusal";
import { assertCollege, assertModuleOn, isModuleOn } from "./modules";
import { isMeetingLink } from "./meeting-links";
import { todayKey } from "./dates";
import { nameOf } from "./placement";
import { mentorSlotsAt } from "./placement-student";
import type { ActiveContext } from "./session";

/**
 * WHAT A COLLEGE ASKS OF ITS ALUMNI (the placement module's part of the
 * alumni module, 4 October 2026), on top of the link, the feed and the
 * directory the alumni module already gives every former pupil:
 *
 *   MENTORING. An alumnus the office has marked a mentor (AlumniProfile.mentor)
 *   offers free one-to-ones to their college's students through the sessions
 *   marketplace — a GigSlot of providerKind ALUMNUS held to the college
 *   (teacherSchoolId), ONE_TO_ONE, and NEVER PRICED: `pricePaise` is 0 by
 *   construction here and the booking path refuses to sell a one-to-one
 *   (decision 0004 as amended). In the placement season these are the mock
 *   interviews. An alumni mentor's one-to-one does NOT draw on the student's
 *   free allowance (G4-26, risks batch 5 Oct 2026): alumni are volunteers and
 *   decision 0004's allowance is for experts; gig-sessions.ts leaves them out
 *   of the count and books them free, and the booking page says so.
 *   REFERRALS of openings, into a drive the college has or as a company the
 *   cell may approach; the cell is told.
 *   A COMPANY LINK for an alumnus who recruits (AlumniCompanyLink): the cell
 *   sees the alumni at a company it talks to.
 *   GIFTS, recorded only: the college issues the receipt outside the app
 *   (decision 0003) and the office writes the line.
 *   MEETS AND REUNIONS on the college's calendar (an EVENT row made with the
 *   meet) with registration.
 *   THE ALUMNI SURVEY is the IQAC module's (Survey of kind ALUMNI): linked
 *   while one is open.
 *   THE BATCH TABLE for the AQAR: alumni, listed, mentors, gifts per batch.
 */

async function alumnusAtCollege(ctx: ActiveContext) {
  if (ctx.role !== "ALUMNUS" || !ctx.schoolId || !ctx.membershipId) throw new AccessError("access.wrongRoleForThisAction");
  await assertModuleOn(ctx.schoolId, "ALUMNI");
  await assertCollege(ctx.schoolId, "placement.refuseNotCollege");
  const row = await db.membership.findFirst({ where: { id: ctx.membershipId, schoolId: ctx.schoolId, userId: ctx.user.id, role: "ALUMNUS", status: "ACTIVE", leftAt: null }, select: { id: true, joinedAt: true } });
  if (!row) throw new AccessError("access.wrongRoleForThisAction");
  const profile = await db.alumniProfile.findUnique({ where: { membershipId: row.id }, select: { mentor: true, mutedAt: true } });
  if (profile?.mutedAt) throw new AccessError("alumni.refuseMuted");
  return { schoolId: ctx.schoolId, membershipId: row.id, userId: ctx.user.id, batchYear: row.joinedAt.getUTCFullYear(), mentor: profile?.mentor ?? false };
}

async function officeOf(ctx: ActiveContext, write: boolean) {
  const allowed = write ? ["ADMIN"] : ["ADMIN", "PRINCIPAL", "TPO"];
  if (!ctx.schoolId || !ctx.role || !allowed.includes(ctx.role)) throw new AccessError("access.wrongRoleForThisAction");
  await assertModuleOn(ctx.schoolId, "ALUMNI");
  await assertCollege(ctx.schoolId, "placement.refuseNotCollege");
  return { schoolId: ctx.schoolId, userId: ctx.user.id };
}

type GiftRow = { id: string; alumnusMembershipId: string; kind: string; amountRupees: number | null; receiptRef: string; note: string; onKey: string };
async function giftViews(rows: GiftRow[]) {
  const members = rows.length ? await db.membership.findMany({ where: { id: { in: rows.map((r) => r.alumnusMembershipId) } }, select: { id: true, joinedAt: true, user: { select: { name: true, preferredName: true } } } }) : [];
  const of = new Map(members.map((m) => [m.id, m]));
  return rows.map((g) => ({ id: g.id, alumnusName: of.get(g.alumnusMembershipId) ? nameOf(of.get(g.alumnusMembershipId)!.user) : "", batchYear: of.get(g.alumnusMembershipId)?.joinedAt.getUTCFullYear() ?? null, kind: g.kind as "DONATION", amountRupees: g.amountRupees, receiptRef: g.receiptRef, note: g.note, on: g.onKey }));
}

type ReferralRow = { id: string; alumnusMembershipId: string; companyName: string; note: string; createdAt: Date; drive: { title: string; company: { name: string } } | null };
async function referralViews(rows: ReferralRow[]) {
  const members = rows.length ? await db.membership.findMany({ where: { id: { in: rows.map((r) => r.alumnusMembershipId) } }, select: { id: true, user: { select: { name: true, preferredName: true } } } }) : [];
  const of = new Map(members.map((m) => [m.id, nameOf(m.user)]));
  return rows.map((r) => ({ id: r.id, alumnusName: of.get(r.alumnusMembershipId) ?? "", companyName: r.drive?.company.name ?? r.companyName, driveTitle: r.drive?.title ?? null, note: r.note, createdAt: r.createdAt.toISOString() }));
}

async function meetViews(schoolId: string, alumnusMembershipId: string | null, where: { batchYear?: number } = {}) {
  const today = todayKey((await db.school.findUnique({ where: { id: schoolId }, select: { timezone: true } }))?.timezone ?? "Asia/Kolkata");
  const meets = await db.alumniMeet.findMany({
    where: { schoolId, ...(where.batchYear !== undefined ? { OR: [{ batchYear: null }, { batchYear: where.batchYear }] } : {}), ...(alumnusMembershipId ? { onKey: { gte: today } } : {}) },
    orderBy: { onKey: alumnusMembershipId ? "asc" : "desc" },
    take: 100,
    include: { registrations: { where: { cancelledAt: null }, select: { alumnusMembershipId: true } } },
  });
  return meets.map((m) => ({ id: m.id, title: m.title, on: m.onKey, venue: m.venue, note: m.note, batchYear: m.batchYear, registered: m.registrations.length, mine: alumnusMembershipId ? m.registrations.some((r) => r.alumnusMembershipId === alumnusMembershipId) : false }));
}

/** An open alumni survey of the IQAC module's, when there is one: linked from the alumnus's home. */
async function openAlumniSurvey(schoolId: string): Promise<string | null> {
  const today = todayKey((await db.school.findUnique({ where: { id: schoolId }, select: { timezone: true } }))?.timezone ?? "Asia/Kolkata");
  const s = await db.survey.findFirst({ where: { schoolId, kind: "ALUMNI", closedAt: null, opensOn: { lte: today }, closesOn: { gte: today } }, select: { id: true } });
  // The IQAC module's page lists every open survey for the alumnus at /alumni/survey.
  return s ? "/alumni/survey" : null;
}

/** The college's additions to an alumnus's home. */
export async function alumniCollege(ctx: ActiveContext) {
  const me = await alumnusAtCollege(ctx);
  const placement = await isModuleOn(me.schoolId, "PLACEMENT");
  const [slots, referrals, gifts, meets, drives, surveyUrl] = await Promise.all([
    db.gigSlot.findMany({ where: { providerUserId: me.userId, providerKind: "ALUMNUS", teacherSchoolId: me.schoolId, cancelledAt: null, startsAt: { gt: new Date() } }, orderBy: { startsAt: "asc" }, select: { id: true, title: true, startsAt: true, endsAt: true, seats: true, seatsTaken: true } }),
    db.alumniReferral.findMany({ where: { schoolId: me.schoolId, alumnusMembershipId: me.membershipId }, orderBy: { createdAt: "desc" }, include: { drive: { select: { title: true, company: { select: { name: true } } } } } }),
    db.alumniGift.findMany({ where: { schoolId: me.schoolId, alumnusMembershipId: me.membershipId }, orderBy: { onKey: "desc" } }),
    meetViews(me.schoolId, me.membershipId, { batchYear: me.batchYear }),
    placement ? db.drive.findMany({ where: { schoolId: me.schoolId, status: "OPEN" }, select: { id: true, title: true, company: { select: { name: true } } }, orderBy: { createdAt: "desc" }, take: 30 }) : Promise.resolve([]),
    openAlumniSurvey(me.schoolId),
  ]);
  const name = ctx.user.preferredName ?? ctx.user.name;
  return {
    mentor: me.mentor,
    slots: slots.map((s) => ({ id: s.id, title: s.title, startsAt: s.startsAt.toISOString(), endsAt: s.endsAt.toISOString(), mentorName: name, batchYear: me.batchYear, seatsLeft: s.seats - s.seatsTaken })),
    referrals: await referralViews(referrals),
    gifts: await giftViews(gifts),
    meets,
    openDrives: drives.map((d) => ({ id: d.id, title: d.title, companyName: d.company.name })),
    surveyUrl,
  };
}

/**
 * A mentor's free one-to-one: half an hour to two hours on their own meeting
 * link, at least an hour ahead and at most 120 days, not overlapping their
 * other times. Never priced — the slot is written with pricePaise 0 and the
 * sessions engine sells no one-to-one.
 */
export async function offerMentorSlot(ctx: ActiveContext, input: { title: string; startsAt: string; minutes: number; meetingUrl: string }, now: Date = new Date()) {
  const me = await alumnusAtCollege(ctx);
  if (!me.mentor) throw new AccessError("placement.refuseNotMentor");
  const startsAt = new Date(input.startsAt);
  if (Number.isNaN(startsAt.getTime()) || startsAt.getTime() < now.getTime() + 3_600_000) throw new RuleRefusal("gigs.refuseSlotTooSoon", 422, undefined, "startsAt");
  if (startsAt.getTime() > now.getTime() + 120 * 86_400_000) throw new RuleRefusal("gigs.refuseSlotTooFar", 422, undefined, "startsAt");
  // A Meet, Zoom, Teams or Jitsi room, as on every slot (seats, 17 Oct 2026; meeting-links.ts).
  if (!isMeetingLink(input.meetingUrl)) throw new RuleRefusal("seats.refuseMeetingLink", 422, undefined, "meetingUrl");
  const endsAt = new Date(startsAt.getTime() + input.minutes * 60_000);
  const clash = await db.gigSlot.findFirst({ where: { providerUserId: me.userId, cancelledAt: null, startsAt: { lt: endsAt }, endsAt: { gt: startsAt } }, select: { id: true } });
  if (clash) throw new RuleRefusal("gigs.refuseSlotOverlap", 409, undefined, "startsAt");
  const slot = await db.gigSlot.create({ data: { providerUserId: me.userId, providerKind: "ALUMNUS", teacherSchoolId: me.schoolId, kind: "ONE_TO_ONE", title: input.title.trim(), startsAt, endsAt, meetingUrl: input.meetingUrl.trim(), seats: 1, pricePaise: 0 }, select: { id: true } });
  await audit({ schoolId: me.schoolId, actorUserId: me.userId, action: "placement.mentor.slot", targetType: "GigSlot", targetId: slot.id, meta: { minutes: input.minutes } });
  return (await mentorSlotsAt(me.schoolId, now)).find((s) => s.id === slot.id) ?? null;
}

/** A referral of an opening: into one of the college's drives that is not closed, or a company for the cell; the cell is told. */
export async function referOpening(ctx: ActiveContext, input: { driveId: string | null; companyName: string; note: string }) {
  const me = await alumnusAtCollege(ctx);
  await assertModuleOn(me.schoolId, "PLACEMENT");
  if (input.driveId) {
    const d = await db.drive.findFirst({ where: { id: input.driveId, schoolId: me.schoolId, status: { not: "CLOSED" } }, select: { id: true } });
    if (!d) throw new RuleRefusal("placement.refuseReferralDrive", 422, undefined, "driveId");
  } else if (input.companyName.trim().length < 2) throw new RuleRefusal("placement.refuseReferralCompany", 422, undefined, "companyName");
  const r = await db.alumniReferral.create({ data: { schoolId: me.schoolId, alumnusMembershipId: me.membershipId, driveId: input.driveId, companyName: input.companyName.trim(), note: input.note.trim() }, include: { drive: { select: { title: true, company: { select: { name: true } } } } } });
  await audit({ schoolId: me.schoolId, actorUserId: me.userId, action: "placement.referral", targetType: "AlumniReferral", targetId: r.id });
  const tpos = await db.membership.findMany({ where: { schoolId: me.schoolId, role: "TPO", status: "ACTIVE", leftAt: null }, select: { userId: true } });
  await Promise.all(tpos.map((p) => notify({ userId: p.userId, schoolId: me.schoolId, kind: "SYSTEM", titleKey: "placement.notifReferral", titleVars: { company: r.drive?.company.name ?? r.companyName }, body: r.note, url: "/placement" }).catch(() => undefined)));
  return (await referralViews([r]))[0]!;
}

/** An alumnus who recruits names their company (a registered one, by its GSTIN or CIN); naming none clears it. */
export async function linkMyCompany(ctx: ActiveContext, input: { identifier: string | null; role: string }) {
  const me = await alumnusAtCollege(ctx);
  if (!input.identifier) {
    await db.alumniCompanyLink.deleteMany({ where: { alumnusMembershipId: me.membershipId } });
    return { linked: false };
  }
  const c = await db.company.findUnique({ where: { identifier: input.identifier }, select: { id: true } });
  if (!c) throw new RuleRefusal("placement.refuseUnknownCompany", 422, undefined, "identifier");
  await db.alumniCompanyLink.upsert({ where: { alumnusMembershipId: me.membershipId }, update: { companyId: c.id, role: input.role }, create: { schoolId: me.schoolId, alumnusMembershipId: me.membershipId, companyId: c.id, role: input.role } });
  await audit({ schoolId: me.schoolId, actorUserId: me.userId, action: "placement.alumni.company", targetType: "Company", targetId: c.id });
  return { linked: true };
}

/** Register for a meet (or cancel): an alumnus, for a meet of their batch or of everyone, not yet held. */
export async function registerForMeet(ctx: ActiveContext, meetId: string, going: boolean, now: Date = new Date()) {
  const me = await alumnusAtCollege(ctx);
  const meet = await db.alumniMeet.findFirst({ where: { id: meetId, schoolId: me.schoolId, OR: [{ batchYear: null }, { batchYear: me.batchYear }] }, select: { id: true, onKey: true, school: { select: { timezone: true } } } });
  if (!meet) throw new AccessError("placement.noSuchMeet", "NOT_FOUND");
  // Held once its day is past by the college's clock (a meet keeps a day, not an hour, and is listed through its
  // own day): no registration and no cancellation after it, which would write and audit a row the alumnus's list,
  // keeping only meets to come, never shows (owner's item 14, 1 Nov 2026).
  if (meet.onKey < todayKey(meet.school.timezone, now)) throw new RuleRefusal("placement.refuseMeetHeld", 409);
  if (going) await db.alumniMeetRegistration.upsert({ where: { meetId_alumnusMembershipId: { meetId, alumnusMembershipId: me.membershipId } }, update: { cancelledAt: null }, create: { schoolId: me.schoolId, meetId, alumnusMembershipId: me.membershipId } });
  else await db.alumniMeetRegistration.updateMany({ where: { meetId, alumnusMembershipId: me.membershipId, cancelledAt: null }, data: { cancelledAt: new Date() } });
  await audit({ schoolId: me.schoolId, actorUserId: me.userId, action: going ? "placement.meet.register" : "placement.meet.cancel", targetType: "AlumniMeet", targetId: meetId });
  return (await meetViews(me.schoolId, me.membershipId, { batchYear: me.batchYear })).find((m) => m.id === meetId) ?? null;
}

/* ---------------------------------------------------------- the office's side */

export async function alumniCollegeAdmin(ctx: ActiveContext) {
  const office = await officeOf(ctx, false);
  const [gifts, meets, referrals, alumni, profiles] = await Promise.all([
    db.alumniGift.findMany({ where: { schoolId: office.schoolId }, orderBy: { onKey: "desc" }, take: 300 }),
    meetViews(office.schoolId, null),
    db.alumniReferral.findMany({ where: { schoolId: office.schoolId }, orderBy: { createdAt: "desc" }, take: 200, include: { drive: { select: { title: true, company: { select: { name: true } } } } } }),
    db.membership.findMany({ where: { schoolId: office.schoolId, role: "ALUMNUS", status: "ACTIVE", leftAt: null }, select: { id: true, joinedAt: true, user: { select: { name: true, preferredName: true } } }, orderBy: { joinedAt: "desc" } }),
    db.alumniProfile.findMany({ where: { schoolId: office.schoolId }, select: { membershipId: true, listed: true, mentor: true } }),
  ]);
  const profileOf = new Map(profiles.map((p) => [p.membershipId, p]));
  const giftCount = new Map<string, number>();
  for (const g of gifts) giftCount.set(g.alumnusMembershipId, (giftCount.get(g.alumnusMembershipId) ?? 0) + 1);
  const batches = new Map<number, { alumni: number; listed: number; mentors: number; gifts: number }>();
  for (const a of alumni) {
    const y = a.joinedAt.getUTCFullYear();
    const b = batches.get(y) ?? { alumni: 0, listed: 0, mentors: 0, gifts: 0 };
    b.alumni += 1;
    if (profileOf.get(a.id)?.listed) b.listed += 1;
    if (profileOf.get(a.id)?.mentor) b.mentors += 1;
    b.gifts += giftCount.get(a.id) ?? 0;
    batches.set(y, b);
  }
  return {
    gifts: await giftViews(gifts),
    meets,
    referrals: await referralViews(referrals),
    batches: [...batches.entries()].sort((a, b) => b[0] - a[0]).map(([batchYear, v]) => ({ batchYear, ...v })),
    alumni: alumni.map((a) => ({ membershipId: a.id, name: nameOf(a.user), batchYear: a.joinedAt.getUTCFullYear() })),
  };
}

/** The office records a gift the college received outside the app, with the receipt it issued (decision 0003). */
export async function recordGift(ctx: ActiveContext, input: { alumnusMembershipId: string; kind: string; amountRupees: number | null; receiptRef: string; note: string; on: string }) {
  const office = await officeOf(ctx, true);
  const alumnus = await db.membership.findFirst({ where: { id: input.alumnusMembershipId, schoolId: office.schoolId, role: "ALUMNUS" }, select: { id: true } });
  if (!alumnus) throw new RuleRefusal("alumni.refuseNotAlumnus", 422, undefined, "alumnusMembershipId");
  if (input.kind !== "IN_KIND" && (input.amountRupees === null || input.amountRupees <= 0)) throw new RuleRefusal("placement.refuseGiftAmount", 422, undefined, "amountRupees");
  const g = await db.alumniGift.create({ data: { schoolId: office.schoolId, alumnusMembershipId: input.alumnusMembershipId, kind: input.kind, amountRupees: input.kind === "IN_KIND" ? input.amountRupees : input.amountRupees, receiptRef: input.receiptRef.trim(), note: input.note.trim(), onKey: input.on, recordedByUserId: office.userId } });
  await audit({ schoolId: office.schoolId, actorUserId: office.userId, action: "placement.gift", targetType: "AlumniGift", targetId: g.id, meta: { kind: input.kind, amountRupees: input.amountRupees, receiptRef: input.receiptRef } });
  return (await giftViews([g]))[0]!;
}

/** The office sets a meet: on the calendar as an EVENT, for a batch or everyone; the alumni it is for are told. */
export async function createMeet(ctx: ActiveContext, input: { title: string; on: string; venue: string; note: string; batchYear: number | null }) {
  const office = await officeOf(ctx, true);
  const meet = await db.$tenantTransaction(async (raw) => {
    const tx = raw as typeof db;
    const holiday = await tx.holiday.create({ data: { schoolId: office.schoolId, name: input.title, startDateKey: input.on, endDateKey: input.on, kind: "EVENT", note: input.venue || null }, select: { id: true } });
    return tx.alumniMeet.create({ data: { schoolId: office.schoolId, title: input.title, onKey: input.on, venue: input.venue, note: input.note, batchYear: input.batchYear, holidayId: holiday.id, createdByUserId: office.userId } });
  });
  await audit({ schoolId: office.schoolId, actorUserId: office.userId, action: "placement.meet", targetType: "AlumniMeet", targetId: meet.id, meta: { on: input.on, batchYear: input.batchYear } });
  const from = input.batchYear !== null ? new Date(Date.UTC(input.batchYear, 0, 1)) : null;
  const to = input.batchYear !== null ? new Date(Date.UTC(input.batchYear + 1, 0, 1)) : null;
  const alumni = await db.membership.findMany({ where: { schoolId: office.schoolId, role: "ALUMNUS", status: "ACTIVE", leftAt: null, ...(from && to ? { joinedAt: { gte: from, lt: to } } : {}) }, select: { userId: true } });
  await Promise.all(alumni.map((a) => notify({ userId: a.userId, schoolId: office.schoolId, kind: "SYSTEM", titleKey: "placement.notifMeet", titleVars: { title: input.title, on: input.on }, url: "/alumni/college" }).catch(() => undefined)));
  return (await meetViews(office.schoolId, null)).find((m) => m.id === meet.id)!;
}

/** The seats taken in a mentor's own one-to-ones, to mark held or not attended once begun (closeBooking in gig-sessions.ts). */
export async function mentorBookings(ctx: ActiveContext) {
  const me = await alumnusAtCollege(ctx);
  const rows = await db.gigBooking.findMany({
    where: { schoolId: me.schoolId, providerUserId: me.userId, slot: { providerKind: "ALUMNUS" }, status: { in: ["CONFIRMED", "PENDING_CONSENT", "DELIVERED", "MISSED"] } },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: { id: true, status: true, purpose: true, slot: { select: { title: true, startsAt: true } }, student: { select: { user: { select: { name: true, preferredName: true } } } } },
  });
  const now = new Date();
  return rows.map((b) => ({ id: b.id, status: b.status, purpose: b.purpose, title: b.slot.title, startsAt: b.slot.startsAt.toISOString(), studentName: nameOf(b.student.user), canClose: b.status === "CONFIRMED" && b.slot.startsAt <= now }));
}
