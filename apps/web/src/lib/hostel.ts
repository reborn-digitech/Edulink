import "server-only";
import type {
  FamilyHostel,
  FamilyHostelLeaveCreate,
  HostelAllot,
  HostelBoarder,
  HostelBoarderHealth,
  HostelIncidentCreate,
  HostelLeaveRow,
  HostelOverview,
  HostelRollCallSheet,
  HostelRollCallTake,
  HostelRollCallCorrect,
  HostelRollCallCorrected,
  HostelRollSlot,
  HostelRoomSave,
  HostelSave,
  HostelsView,
  MessMenuView,
  MessMeal,
} from "@edulink/contracts";
import { db } from "./db";
import { AccessError, assertGuardianAccess } from "./tenancy";
import { RuleRefusal } from "./rule-refusal";
import { assertModuleOn } from "./modules";
import { audit } from "./audit";
import { notify, notifyGuardians } from "./notify";
import { forSchool } from "./tenant-context";
import { addDaysToKey, todayKey, weekdayOfKey, zonedStartOfDay } from "./dates";
import { readContacts } from "./health";
import { curfewRuleFor, returnIsLate } from "./hostel-night";
import { staffOnlyKind, staffOnlyWhere } from "./incidents";
import type { ActiveContext } from "./session";
import type { Role } from "./constants";

/**
 * THE HOSTEL (module HOSTEL, role WARDEN; the owner's decision of 3 October
 * 2026).
 *
 * WHO: the office (ADMIN) makes the houses and puts a warden in charge; the
 * office and any WARDEN of the school make rooms, allot beds, take the roll
 * call, decide leave, keep the gate's out and in, the visitor book and the
 * mess menu; the head (PRINCIPAL) reads. A boarder reads their own room,
 * tonight's roll call, their leave and the menu; a guardian reads the same
 * for their own child and no other — and consents to the child's leave.
 *
 * ONE BED, ONE PUPIL. An allotment carries `activePupilKey` and
 * `activeBedKey`, unique and set only while ACTIVE, so the database itself
 * refuses a second bed for a pupil or a second pupil in a bed.
 *
 * LEAVE, AS THE SESSIONS DO IT (gig-sessions.ts): a guardian's own ask is
 * their consent; a minor's own ask waits for a guardian (AWAITING_CONSENT)
 * before the warden may decide it; a pupil of age needs nobody's. The gate
 * writes out and in, and a return after the leave's end is LATE — told to
 * the wardens, the office and the family.
 *
 * ONE ROLL CALL PER SLOT. A hostel, a day and MORNING or NIGHT make one call;
 * the phone's outbox replaying the same sheet (the same clientId) answers
 * with the call it made, and any other sheet for that slot is refused. A
 * boarder marked ABSENT is told to their guardians at once, through quiet
 * hours: a child not in their bed at night is the one notice that must wake
 * somebody.
 *
 * NOT DUPLICATED: a hostel incident is a row of the school's incident log
 * with `hostelId` set (the office follows it up and closes it there); a
 * hostel fee is the fees module's demand, which an allotment only links.
 */

const OFFICE: readonly Role[] = ["ADMIN"];
const WRITERS: readonly Role[] = ["WARDEN", "ADMIN"];
const READERS: readonly Role[] = ["WARDEN", "ADMIN", "PRINCIPAL"];

type Tx = typeof db;
type Staff = { schoolId: string; userId: string; role: Role; membershipId: string; timeZone: string };

async function zoneOf(schoolId: string): Promise<string> {
  return (await db.school.findUnique({ where: { id: schoolId }, select: { timezone: true } }))?.timezone ?? "Asia/Kolkata";
}

async function staffOf(ctx: ActiveContext, roles: readonly Role[]): Promise<Staff> {
  if (!ctx.schoolId || !ctx.membershipId || !ctx.role || !roles.includes(ctx.role)) throw new AccessError("access.wrongRoleForThisAction");
  await assertModuleOn(ctx.schoolId, "HOSTEL");
  return { schoolId: ctx.schoolId, userId: ctx.user.id, role: ctx.role, membershipId: ctx.membershipId, timeZone: await zoneOf(ctx.schoolId) };
}

const PUPIL_SELECT = { id: true, userId: true, role: true, status: true, schoolId: true, user: { select: { name: true, preferredName: true, isMinor: true } }, enrollments: { where: { status: "ACTIVE" as const }, select: { class: { select: { name: true } } }, take: 1 } } as const;
type Pupil = { id: string; userId: string; role: string; status: string; schoolId: string; user: { name: string; preferredName: string | null; isMinor: boolean }; enrollments: { class: { name: string } }[] };
const nameOf = (p: { user: { name: string; preferredName: string | null } }) => p.user.preferredName ?? p.user.name;

async function namesOf(userIds: (string | null | undefined)[]): Promise<Map<string, string>> {
  const ids = [...new Set(userIds.filter((x): x is string => Boolean(x)))];
  if (ids.length === 0) return new Map();
  const users = await db.user.findMany({ where: { id: { in: ids } }, select: { id: true, name: true } });
  return new Map(users.map((u) => [u.id, u.name]));
}

const ALLOTMENT_INCLUDE = { student: { select: PUPIL_SELECT }, room: { select: { id: true, number: true, floor: true, hostelId: true, hostel: { select: { id: true, name: true, kind: true, wardenMembershipId: true } } } } } as const;
type AllotmentRow = { id: string; membershipId: string; roomId: string; bed: number; fromDate: string; toDate: string | null; status: string; feeDemandId: string | null; student: Pupil; room: { id: string; number: string; floor: string; hostelId: string; hostel: { id: string; name: string; kind: string; wardenMembershipId: string | null } } };

/**
 * THE ONE READER OF A LIVE PLACE (A3-S-15, audit of 5 October 2026). A place
 * is live on `today` while it is ACTIVE and no approved expulsion of it takes
 * effect on or before that day: an expulsion approved for a day ahead leaves
 * the boarder on the roster, the roll call and the mess until that day, and
 * off them from it, read at the time — nothing is written on the day.
 * Every read of the house's boarders goes through here.
 */
export function liveAllotmentWhere(today: string) {
  return { status: "ACTIVE", expulsions: { none: { status: "APPROVED", effectiveOn: { lte: today } } } } as const;
}

/**
 * THE ONE WRITER OF AN EXPELLED PLACE'S END: the row is ENDED on the
 * expulsion's day, by its decider, and its keys freed. Called when the
 * principal approves an expulsion whose day has come, and before a bed or a
 * pupil is given again (the database's own keys would still hold them), so
 * the stored row catches up with what the reader above already says.
 */
export async function settleExpulsions(tx: Tx, schoolId: string, today: string, allotmentIds?: readonly string[]): Promise<number> {
  const due = await tx.hostelExpulsion.findMany({
    where: { schoolId, status: "APPROVED", effectiveOn: { lte: today }, allotment: { status: "ACTIVE" }, ...(allotmentIds ? { allotmentId: { in: [...allotmentIds] } } : {}) },
    select: { allotmentId: true, effectiveOn: true, decidedByUserId: true },
  });
  for (const x of due) {
    await tx.hostelAllotment.updateMany({ where: { id: x.allotmentId, status: "ACTIVE" }, data: { status: "ENDED", toDate: x.effectiveOn, activePupilKey: null, activeBedKey: null, endedByUserId: x.decidedByUserId } });
  }
  return due.length;
}

/** Who is out of the hostel on approved leave right now. */
async function outNowSet(allotmentIds: string[]): Promise<Set<string>> {
  if (allotmentIds.length === 0) return new Set();
  const out = await db.hostelLeave.findMany({ where: { allotmentId: { in: allotmentIds }, status: "APPROVED", outAt: { not: null }, inAt: null }, select: { allotmentId: true } });
  return new Set(out.map((l) => l.allotmentId));
}

function boarderOf(a: AllotmentRow, out: Set<string>): HostelBoarder {
  return {
    allotmentId: a.id,
    membershipId: a.membershipId,
    name: nameOf(a.student),
    className: a.student.enrollments[0]?.class.name ?? null,
    hostelId: a.room.hostelId,
    hostelName: a.room.hostel.name,
    roomId: a.roomId,
    roomNumber: a.room.number,
    bed: a.bed,
    fromDate: a.fromDate,
    toDate: a.toDate,
    onLeave: out.has(a.id),
    feeDemandId: a.feeDemandId,
  };
}

/* -------------------------------------------------------------------------- */
/* Houses, rooms, beds                                                         */
/* -------------------------------------------------------------------------- */

export async function hostelsView(ctx: ActiveContext): Promise<HostelsView> {
  const staff = await staffOf(ctx, READERS);
  const [hostels, active, wardens] = await Promise.all([
    db.hostel.findMany({ where: { schoolId: staff.schoolId }, orderBy: { name: "asc" }, include: { rooms: { orderBy: [{ floor: "asc" }, { number: "asc" }] } } }),
    db.hostelAllotment.findMany({ where: { schoolId: staff.schoolId, ...liveAllotmentWhere(todayKey(staff.timeZone)) }, include: ALLOTMENT_INCLUDE, orderBy: [{ roomId: "asc" }, { bed: "asc" }] }),
    db.membership.findMany({ where: { schoolId: staff.schoolId, role: "WARDEN", status: "ACTIVE" }, select: { id: true, user: { select: { name: true, preferredName: true } } }, orderBy: { user: { name: "asc" } } }),
  ]);
  const out = await outNowSet(active.map((a) => a.id));
  const wardenName = new Map(wardens.map((w) => [w.id, nameOf(w)]));
  return {
    hostels: hostels.map((h) => {
      const rooms = h.rooms.map((r) => {
        const boarders = active.filter((a) => a.roomId === r.id).map((a) => boarderOf(a, out));
        return { id: r.id, number: r.number, floor: r.floor, beds: r.beds, kind: r.kind as HostelsView["hostels"][number]["rooms"][number]["kind"], occupied: boarders.length, boarders };
      });
      return {
        id: h.id,
        name: h.name,
        kind: h.kind as HostelsView["hostels"][number]["kind"],
        capacity: h.capacity,
        wardenMembershipId: h.wardenMembershipId,
        wardenName: h.wardenMembershipId ? (wardenName.get(h.wardenMembershipId) ?? null) : null,
        messAttendance: h.messAttendance,
        messMonthlyPaise: h.messMonthlyPaise,
        beds: rooms.reduce((a, r) => a + r.beds, 0),
        occupied: rooms.reduce((a, r) => a + r.occupied, 0),
        rooms,
      };
    }),
    wardens: wardens.map((w) => ({ membershipId: w.id, name: nameOf(w) })),
    canManage: OFFICE.includes(staff.role),
    canAllot: WRITERS.includes(staff.role),
  };
}

/** A house, made or changed by the office, with the warden in charge; its mess's monthly charge when one is sent (owner-batch-item5), kept when not. */
export async function saveHostel(ctx: ActiveContext, input: HostelSave): Promise<HostelsView> {
  const staff = await staffOf(ctx, OFFICE);
  if (input.wardenMembershipId) {
    const w = await db.membership.findFirst({ where: { id: input.wardenMembershipId, schoolId: staff.schoolId, role: "WARDEN", status: "ACTIVE" }, select: { id: true } });
    if (!w) throw new AccessError("hostel.refuseNotWarden");
  }
  const clash = await db.hostel.findUnique({ where: { schoolId_name: { schoolId: staff.schoolId, name: input.name } }, select: { id: true } });
  if (clash && clash.id !== input.id) throw new AccessError("hostel.refuseNameTaken");
  const data = { name: input.name, kind: input.kind, capacity: input.capacity, wardenMembershipId: input.wardenMembershipId, messAttendance: input.messAttendance, ...(input.messMonthlyPaise === undefined ? {} : { messMonthlyPaise: input.messMonthlyPaise }) };
  let id = input.id;
  if (id) {
    const found = await db.hostel.findFirst({ where: { id, schoolId: staff.schoolId }, select: { id: true } });
    if (!found) throw new AccessError("hostel.refuseNoHostel", "NOT_FOUND");
    await db.hostel.update({ where: { id }, data });
  } else id = (await db.hostel.create({ data: { schoolId: staff.schoolId, ...data }, select: { id: true } })).id;
  await audit({ schoolId: staff.schoolId, actorUserId: staff.userId, action: "hostel.save", targetType: "Hostel", targetId: id, meta: { kind: input.kind, capacity: input.capacity, warden: Boolean(input.wardenMembershipId), ...(input.messMonthlyPaise === undefined ? {} : { messMonthlyPaise: input.messMonthlyPaise }) } });
  return hostelsView(ctx);
}

export async function saveRoom(ctx: ActiveContext, input: HostelRoomSave): Promise<HostelsView> {
  const staff = await staffOf(ctx, WRITERS);
  const hostel = await db.hostel.findFirst({ where: { id: input.hostelId, schoolId: staff.schoolId }, select: { id: true } });
  if (!hostel) throw new AccessError("hostel.refuseNoHostel", "NOT_FOUND");
  const clash = await db.hostelRoom.findUnique({ where: { hostelId_number: { hostelId: input.hostelId, number: input.number } }, select: { id: true } });
  if (clash && clash.id !== input.id) throw new AccessError("hostel.refuseRoomTaken");
  const data = { number: input.number, floor: input.floor, beds: input.beds, kind: input.kind };
  let id = input.id;
  if (id) {
    const room = await db.hostelRoom.findFirst({ where: { id, schoolId: staff.schoolId, hostelId: input.hostelId }, select: { id: true } });
    if (!room) throw new AccessError("hostel.refuseNoRoom", "NOT_FOUND");
    const highest = await db.hostelAllotment.findFirst({ where: { roomId: id, ...liveAllotmentWhere(todayKey(staff.timeZone)) }, orderBy: { bed: "desc" }, select: { bed: true } });
    if (highest && highest.bed > input.beds) throw new AccessError("hostel.refuseBedsInUse", "FORBIDDEN", { bed: highest.bed });
    await db.hostelRoom.update({ where: { id }, data });
  } else id = (await db.hostelRoom.create({ data: { schoolId: staff.schoolId, hostelId: input.hostelId, ...data }, select: { id: true } })).id;
  await audit({ schoolId: staff.schoolId, actorUserId: staff.userId, action: "hostel.room.save", targetType: "HostelRoom", targetId: id, meta: { hostelId: input.hostelId, beds: input.beds } });
  return hostelsView(ctx);
}

export async function listBoarders(ctx: ActiveContext, hostelId?: string): Promise<{ items: HostelBoarder[] }> {
  const staff = await staffOf(ctx, READERS);
  const rows = await db.hostelAllotment.findMany({ where: { schoolId: staff.schoolId, ...liveAllotmentWhere(todayKey(staff.timeZone)), ...(hostelId ? { room: { hostelId } } : {}) }, include: ALLOTMENT_INCLUDE });
  const out = await outNowSet(rows.map((r) => r.id));
  const items = rows.map((r) => boarderOf(r, out)).sort((a, b) => a.hostelName.localeCompare(b.hostelName) || a.roomNumber.localeCompare(b.roomNumber, undefined, { numeric: true }) || a.bed - b.bed);
  return { items };
}

/** A pupil to a bed from a day. One bed per pupil and one pupil per bed, held by the database's own unique keys. */
export async function allotBed(ctx: ActiveContext, input: HostelAllot): Promise<HostelBoarder> {
  const staff = await staffOf(ctx, WRITERS);
  const pupil = await db.membership.findFirst({ where: { id: input.membershipId, schoolId: staff.schoolId }, select: PUPIL_SELECT });
  if (!pupil || pupil.role !== "STUDENT" || pupil.status !== "ACTIVE") throw new AccessError("hostel.refuseNotPupil", "NOT_FOUND");
  const room = await db.hostelRoom.findFirst({ where: { id: input.roomId, schoolId: staff.schoolId }, select: { id: true, beds: true } });
  if (!room) throw new AccessError("hostel.refuseNoRoom", "NOT_FOUND");
  if (input.bed > room.beds) throw new AccessError("hostel.refuseNoSuchBed", "FORBIDDEN", { beds: room.beds });
  // A place is live from the moment it is written (liveAllotmentWhere reads no date), so a first day ahead would
  // put the pupil on tonight's roll call (TA-052): a bed is given from today or a day gone by.
  if (input.fromDate > todayKey(staff.timeZone)) throw new AccessError("hostel.refuseFromAhead");
  if (input.feeDemandId) {
    const d = await db.feeDemand.findFirst({ where: { id: input.feeDemandId, schoolId: staff.schoolId, studentMembershipId: pupil.id }, select: { id: true } });
    if (!d) throw new AccessError("hostel.refuseNoDemand");
  }
  // A place whose expulsion has taken effect still holds its keys until written: write it now (the one writer).
  await db.$tenantTransaction((raw) => settleExpulsions(raw as Tx, staff.schoolId, todayKey(staff.timeZone)));
  if (await db.hostelAllotment.findUnique({ where: { activePupilKey: pupil.id }, select: { id: true } })) throw new AccessError("hostel.refuseAlreadyBoarding");
  const bedKey = `${room.id}:${input.bed}`;
  if (await db.hostelAllotment.findUnique({ where: { activeBedKey: bedKey }, select: { id: true } })) throw new AccessError("hostel.refuseBedTaken");
  let id: string;
  let carried = 0;
  try {
    id = await db.$tenantTransaction(async (raw) => {
      const tx = raw as Tx;
      const created = await tx.hostelAllotment.create({ data: { schoolId: staff.schoolId, membershipId: pupil.id, roomId: room.id, bed: input.bed, fromDate: input.fromDate, status: "ACTIVE", activePupilKey: pupil.id, activeBedKey: bedKey, feeDemandId: input.feeDemandId, allottedByUserId: staff.userId }, select: { id: true } });
      // A bed given up and given again before an approved expulsion's day keeps the principal's decision (TA-050), as a
      // room change does: the expulsion moves from the ended place to this one, which then ends on that day.
      carried = (await tx.hostelExpulsion.updateMany({ where: { schoolId: staff.schoolId, membershipId: pupil.id, status: "APPROVED", effectiveOn: { gt: todayKey(staff.timeZone) }, allotment: { status: "ENDED" } }, data: { allotmentId: created.id } })).count;
      return created.id;
    });
  } catch {
    // Two presses at once: the database's keys decided; say which.
    if (await db.hostelAllotment.findUnique({ where: { activePupilKey: pupil.id }, select: { id: true } })) throw new AccessError("hostel.refuseAlreadyBoarding");
    throw new AccessError("hostel.refuseBedTaken");
  }
  await audit({ schoolId: staff.schoolId, actorUserId: staff.userId, action: "hostel.allot", targetType: "HostelAllotment", targetId: id, meta: { membershipId: pupil.id, roomId: room.id, bed: input.bed, fromDate: input.fromDate, ...(carried ? { expulsionsCarried: carried } : {}) } });
  const row = await db.hostelAllotment.findUniqueOrThrow({ where: { id }, include: ALLOTMENT_INCLUDE });
  return boarderOf(row, new Set());
}

/** The bed given up from a day; the keys are cleared, so the bed and the pupil are free again. */
export async function endAllotment(ctx: ActiveContext, allotmentId: string, toDate: string): Promise<HostelBoarder> {
  const staff = await staffOf(ctx, WRITERS);
  const a = await db.hostelAllotment.findFirst({ where: { id: allotmentId, schoolId: staff.schoolId }, select: { id: true, status: true, fromDate: true } });
  if (!a) throw new AccessError("hostel.refuseNoAllotment", "NOT_FOUND");
  if (toDate < a.fromDate) throw new AccessError("hostel.refuseEndBeforeStart");
  // Giving the bed up ends the place now, so a last day ahead would end it tonight (TA-052): refused.
  if (a.status === "ACTIVE" && toDate > todayKey(staff.timeZone)) throw new AccessError("hostel.refuseEndAhead");
  if (a.status === "ACTIVE") {
    await db.hostelAllotment.update({ where: { id: a.id }, data: { status: "ENDED", toDate, activePupilKey: null, activeBedKey: null, endedByUserId: staff.userId } });
    await audit({ schoolId: staff.schoolId, actorUserId: staff.userId, action: "hostel.allot.end", targetType: "HostelAllotment", targetId: a.id, meta: { toDate } });
  }
  const row = await db.hostelAllotment.findUniqueOrThrow({ where: { id: a.id }, include: ALLOTMENT_INCLUDE });
  return boarderOf(row, new Set());
}

/* -------------------------------------------------------------------------- */
/* Roll call                                                                   */
/* -------------------------------------------------------------------------- */

export async function rollCallSheet(ctx: ActiveContext, hostelId: string, slot: HostelRollSlot, date?: string): Promise<HostelRollCallSheet> {
  const staff = await staffOf(ctx, READERS);
  const hostel = await db.hostel.findFirst({ where: { id: hostelId, schoolId: staff.schoolId }, select: { id: true, name: true } });
  if (!hostel) throw new AccessError("hostel.refuseNoHostel", "NOT_FOUND");
  const dateKey = date ?? todayKey(staff.timeZone);
  const [call, live] = await Promise.all([
    db.hostelRollCall.findUnique({ where: { hostelId_dateKey_slot: { hostelId, dateKey, slot } }, include: { entries: { include: { allotment: { include: ALLOTMENT_INCLUDE } } } } }),
    db.hostelAllotment.findMany({ where: { schoolId: staff.schoolId, ...liveAllotmentWhere(dateKey), room: { hostelId } }, include: ALLOTMENT_INCLUDE }),
  ]);
  // A taken call is what it recorded (TA-295): its own entries, under the place each was taken on, so a boarder
  // moved or given a bed since is neither read PRESENT by default nor sent back to the office's correction.
  const active = call ? call.entries.map((e) => e.allotment) : live;
  const out = await outNowSet(active.map((a) => a.id));
  const recorded = new Map((call?.entries ?? []).map((e) => [e.allotmentId, e.status]));
  const names = await namesOf([call?.takenByUserId]);
  return {
    hostelId,
    hostelName: hostel.name,
    dateKey,
    slot,
    taken: call ? { at: call.takenAt.toISOString(), byName: names.get(call.takenByUserId) ?? "" } : null,
    rollCallId: call?.id ?? null,
    canCorrect: Boolean(call) && staff.role === "ADMIN",
    entries: active
      .map((a) => ({
        allotmentId: a.id,
        membershipId: a.membershipId,
        name: nameOf(a.student),
        roomNumber: a.room.number,
        bed: a.bed,
        status: (recorded.get(a.id) ?? (out.has(a.id) ? "ON_LEAVE" : "PRESENT")) as HostelRollCallSheet["entries"][number]["status"],
        onLeave: out.has(a.id),
      }))
      .sort((x, y) => x.roomNumber.localeCompare(y.roomNumber, undefined, { numeric: true }) || x.bed - y.bed),
  };
}

/**
 * THE OFFICE CORRECTS A TAKEN ROLL CALL (R-11, risks batch 5 Oct 2026; 08's recommended option). A roll call is
 * taken once and then locked: the warden cannot take the slot again (`takeRollCall` refuses a second sheet), and that
 * stays. A wrong mark — a boarder marked absent who was in the common room — had no way back. The office (ADMIN, not
 * the warden or the head) may set the status of boarders who were on the call, with a reason; one audit row names the
 * person (its actor) and carries every mark before and after. A boarder newly marked absent has their guardians told
 * as the call would have; nothing else is sent. Nothing changes when every status already stands.
 */
export async function correctRollCall(ctx: ActiveContext, rollCallId: string, input: HostelRollCallCorrect): Promise<HostelRollCallCorrected> {
  const staff = await staffOf(ctx, ["ADMIN"]);
  const call = await db.hostelRollCall.findFirst({ where: { id: rollCallId, schoolId: staff.schoolId }, include: { hostel: { select: { name: true } }, entries: { select: { id: true, allotmentId: true, membershipId: true, status: true } } } });
  if (!call) throw new AccessError("riskDecisions.refuseNoRollCall", "NOT_FOUND");
  const reason = input.reason.trim();
  if (reason.length < 3) throw new RuleRefusal("riskDecisions.refuseCorrectionReason", 422, undefined, "reason");
  const onCall = new Map(call.entries.map((e) => [e.allotmentId, e]));
  const wanted = new Map<string, string>();
  for (const e of input.entries) {
    if (!onCall.has(e.allotmentId)) throw new RuleRefusal("riskDecisions.refuseCorrectionEntry", 422, undefined, "entries");
    wanted.set(e.allotmentId, e.status);
  }
  const changes = [...wanted].flatMap(([allotmentId, status]) => {
    const e = onCall.get(allotmentId)!;
    return e.status === status ? [] : [{ id: e.id, allotmentId, membershipId: e.membershipId, before: e.status, after: status }];
  });
  if (changes.length) {
    await db.$tenantTransaction(async (raw) => {
      const tx = raw as Tx;
      for (const c of changes) await tx.hostelRollCallEntry.update({ where: { id: c.id }, data: { status: c.after } });
    });
    await audit({ schoolId: staff.schoolId, actorUserId: staff.userId, action: "hostel.rollcall.correct", targetType: "HostelRollCall", targetId: call.id, meta: { hostelId: call.hostelId, dateKey: call.dateKey, slot: call.slot, reason, changes: changes.map(({ allotmentId, membershipId, before, after }) => ({ allotmentId, membershipId, before, after })) } });
    for (const c of changes.filter((x) => x.after === "ABSENT")) {
      await notifyGuardians(c.membershipId, (childName) => ({
        schoolId: staff.schoolId,
        kind: "ATTENDANCE",
        titleKey: "hostel.notifAbsentTitle",
        titleVars: { name: childName },
        bodyKey: call.slot === "NIGHT" ? "hostel.notifAbsentNight" : "hostel.notifAbsentMorning",
        bodyVars: { name: childName, hostel: call.hostel.name },
        url: `/parent/hostel?child=${c.membershipId}`,
        urgent: true,
      }), "HOSTEL_TRANSPORT").catch((error) => console.error("[hostel] corrected absent notice failed", error));
    }
  }
  const now = new Map(call.entries.map((e) => [e.allotmentId, e.status]));
  for (const c of changes) now.set(c.allotmentId, c.after);
  const statuses = [...now.values()];
  return { rollCallId: call.id, changed: changes.length, present: statuses.filter((s) => s === "PRESENT").length, onLeave: statuses.filter((s) => s === "ON_LEAVE").length, absent: statuses.filter((s) => s === "ABSENT").length };
}

/** Takes a hostel's roll call for a day and slot, once. Absent boarders' guardians are told at once. */
export async function takeRollCall(ctx: ActiveContext, input: HostelRollCallTake): Promise<{ rollCallId: string; present: number; onLeave: number; absent: number; replay: boolean; skipped?: number }> {
  const staff = await staffOf(ctx, WRITERS);
  const hostel = await db.hostel.findFirst({ where: { id: input.hostelId, schoolId: staff.schoolId }, select: { id: true, name: true } });
  if (!hostel) throw new AccessError("hostel.refuseNoHostel", "NOT_FOUND");
  const today = todayKey(staff.timeZone);
  // Today, or yesterday's night call sent from the outbox in the morning; never ahead.
  if (input.dateKey > today || input.dateKey < addDaysToKey(today, -1)) throw new AccessError("hostel.refuseRollCallDate");
  const counts = (entries: { status: string }[]) => ({ present: entries.filter((e) => e.status === "PRESENT").length, onLeave: entries.filter((e) => e.status === "ON_LEAVE").length, absent: entries.filter((e) => e.status === "ABSENT").length });
  const existing = await db.hostelRollCall.findUnique({ where: { hostelId_dateKey_slot: { hostelId: hostel.id, dateKey: input.dateKey, slot: input.slot } }, include: { entries: { select: { status: true } } } });
  if (existing) {
    if (existing.clientId === input.clientId) return { rollCallId: existing.id, ...counts(existing.entries), replay: true };
    throw new AccessError("hostel.refuseRollCallTaken");
  }
  const active = await db.hostelAllotment.findMany({ where: { schoolId: staff.schoolId, ...liveAllotmentWhere(input.dateKey), room: { hostelId: hostel.id } }, select: { id: true, membershipId: true } });
  const byId = new Map(active.map((a) => [a.id, a.membershipId]));
  const seen = new Set<string>();
  for (const e of input.entries) {
    if (seen.has(e.allotmentId)) throw new AccessError("hostel.refuseNotBoarder");
    seen.add(e.allotmentId);
  }
  // A sheet read before a place changed (the phone's outbox sends it later, TA-054) is kept for everyone it can
  // still name: a boarder moved within this hostel is marked on the place they hold now, and an entry whose place
  // has ended here (a bed given up) or never was here is left out and counted, rather than the night's call lost.
  const liveOf = new Map(active.map((a) => [a.membershipId, a.id]));
  const stale = input.entries.map((e) => e.allotmentId).filter((id) => !byId.has(id));
  const movedTo = new Map<string, string>();
  if (stale.length) {
    const old = await db.hostelAllotment.findMany({ where: { id: { in: stale }, schoolId: staff.schoolId, room: { hostelId: hostel.id } }, select: { id: true, membershipId: true } });
    for (const o of old) {
      const now = liveOf.get(o.membershipId);
      if (now) movedTo.set(o.id, now);
    }
  }
  const entries: HostelRollCallTake["entries"] = input.entries.filter((e) => byId.has(e.allotmentId));
  const taken = new Set(entries.map((e) => e.allotmentId));
  for (const e of input.entries) {
    const allotmentId = movedTo.get(e.allotmentId);
    if (!allotmentId || taken.has(allotmentId)) continue;
    taken.add(allotmentId);
    entries.push({ allotmentId, status: e.status });
  }
  if (entries.length === 0) throw new AccessError("hostel.refuseNotBoarder");
  const skipped = input.entries.length - entries.length;
  let rollCallId: string;
  try {
    rollCallId = await db.$tenantTransaction(async (raw) => {
      const tx = raw as Tx;
      const call = await tx.hostelRollCall.create({ data: { schoolId: staff.schoolId, hostelId: hostel.id, dateKey: input.dateKey, slot: input.slot, takenByUserId: staff.userId, clientId: input.clientId }, select: { id: true } });
      await tx.hostelRollCallEntry.createMany({ data: entries.map((e) => ({ schoolId: staff.schoolId, rollCallId: call.id, allotmentId: e.allotmentId, membershipId: byId.get(e.allotmentId)!, status: e.status })) });
      return call.id;
    });
  } catch {
    // The same slot taken a moment ago, by this sheet's replay or by another warden.
    const again = await db.hostelRollCall.findUnique({ where: { hostelId_dateKey_slot: { hostelId: hostel.id, dateKey: input.dateKey, slot: input.slot } }, include: { entries: { select: { status: true } } } });
    if (again && again.clientId === input.clientId) return { rollCallId: again.id, ...counts(again.entries), replay: true };
    throw new AccessError("hostel.refuseRollCallTaken");
  }
  const c = counts(entries);
  await audit({ schoolId: staff.schoolId, actorUserId: staff.userId, action: "hostel.rollcall", targetType: "HostelRollCall", targetId: rollCallId, meta: { hostelId: hostel.id, dateKey: input.dateKey, slot: input.slot, ...c, ...(skipped ? { skipped } : {}) } });
  for (const e of entries.filter((x) => x.status === "ABSENT")) {
    const membershipId = byId.get(e.allotmentId)!;
    await notifyGuardians(membershipId, (childName) => ({
      schoolId: staff.schoolId,
      kind: "ATTENDANCE",
      titleKey: "hostel.notifAbsentTitle",
      titleVars: { name: childName },
      bodyKey: input.slot === "NIGHT" ? "hostel.notifAbsentNight" : "hostel.notifAbsentMorning",
      bodyVars: { name: childName, hostel: hostel.name },
      url: `/parent/hostel?child=${membershipId}`,
      urgent: true,
      // An adult college boarder's guardians hear of the hostel only under the grant their page reads (5 Oct 2026).
    }), "HOSTEL_TRANSPORT").catch((error) => console.error("[hostel] absent notice failed", error));
  }
  return { rollCallId, ...c, replay: false, ...(skipped ? { skipped } : {}) };
}

/* -------------------------------------------------------------------------- */
/* Leave and the gate                                                          */
/* -------------------------------------------------------------------------- */

const LEAVE_INCLUDE = { allotment: { include: ALLOTMENT_INCLUDE } } as const;
type LeaveLoaded = { id: string; allotmentId: string; membershipId: string; kind: string; fromAt: Date; toAt: Date; destination: string; reason: string; status: string; requestedByUserId: string; consentAt: Date | null; consentUserId: string | null; decidedAt: Date | null; decidedByUserId: string | null; decisionNote: string | null; outAt: Date | null; inAt: Date | null; late: boolean; allotment: AllotmentRow };

async function leaveRows(rows: LeaveLoaded[]): Promise<HostelLeaveRow[]> {
  const names = await namesOf(rows.flatMap((r) => [r.requestedByUserId, r.consentUserId, r.decidedByUserId]));
  return rows.map((l) => ({
    id: l.id,
    allotmentId: l.allotmentId,
    membershipId: l.membershipId,
    name: nameOf(l.allotment.student),
    className: l.allotment.student.enrollments[0]?.class.name ?? null,
    hostelName: l.allotment.room.hostel.name,
    roomNumber: l.allotment.room.number,
    kind: l.kind as HostelLeaveRow["kind"],
    fromAt: l.fromAt.toISOString(),
    toAt: l.toAt.toISOString(),
    destination: l.destination,
    reason: l.reason,
    status: l.status as HostelLeaveRow["status"],
    requestedByName: names.get(l.requestedByUserId) ?? "",
    consentAt: l.consentAt?.toISOString() ?? null,
    consentByName: l.consentUserId ? (names.get(l.consentUserId) ?? null) : null,
    decidedAt: l.decidedAt?.toISOString() ?? null,
    decidedByName: l.decidedByUserId ? (names.get(l.decidedByUserId) ?? null) : null,
    decisionNote: l.decisionNote,
    outAt: l.outAt?.toISOString() ?? null,
    inAt: l.inAt?.toISOString() ?? null,
    late: l.late,
    isMinor: l.allotment.student.user.isMinor,
  }));
}

async function leaveRow(id: string): Promise<HostelLeaveRow> {
  const row = await db.hostelLeave.findUniqueOrThrow({ where: { id }, include: LEAVE_INCLUDE });
  return (await leaveRows([row]))[0]!;
}

export async function listLeave(ctx: ActiveContext, status: "OPEN" | "TODAY" | "ALL", now: Date = new Date()): Promise<{ items: HostelLeaveRow[]; timeZone: string }> {
  const staff = await staffOf(ctx, READERS);
  const today = todayKey(staff.timeZone, now);
  const start = zonedStartOfDay(today, staff.timeZone);
  const end = zonedStartOfDay(addDaysToKey(today, 1), staff.timeZone);
  const where =
    status === "OPEN"
      ? { schoolId: staff.schoolId, OR: [{ status: { in: ["AWAITING_CONSENT", "PENDING"] } }, { status: "APPROVED", inAt: null }] }
      : status === "TODAY"
        ? { schoolId: staff.schoolId, status: "APPROVED", fromAt: { lt: end }, toAt: { gte: start } }
        : { schoolId: staff.schoolId };
  const rows = await db.hostelLeave.findMany({ where, include: LEAVE_INCLUDE, orderBy: [{ fromAt: "asc" }, { id: "asc" }], take: status === "ALL" ? 100 : 500 });
  return { items: await leaveRows(rows), timeZone: staff.timeZone };
}

async function leaveAt(schoolId: string, leaveId: string) {
  const l = await db.hostelLeave.findFirst({ where: { id: leaveId, schoolId }, include: LEAVE_INCLUDE });
  if (!l) throw new AccessError("hostel.refuseNoLeave", "NOT_FOUND");
  return l;
}

/** Tells the boarder and their guardians what became of their leave. */
async function tellFamily(schoolId: string, l: { id: string; membershipId: string; allotment: { student: Pupil } }, titleKey: "hostel.notifLeaveApproved" | "hostel.notifLeaveDeclined" | "hostel.notifLateTitle"): Promise<void> {
  await notify({ userId: l.allotment.student.userId, schoolId, kind: "SYSTEM", titleKey, titleVars: { name: nameOf(l.allotment.student) }, url: "/student/hostel" }).catch((error) => console.error("[hostel] notice failed", error));
  await notifyGuardians(l.membershipId, (childName) => ({ schoolId, kind: "SYSTEM", titleKey, titleVars: { name: childName }, url: `/parent/hostel?child=${l.membershipId}` }), "HOSTEL_TRANSPORT").catch((error) => console.error("[hostel] notice failed", error));
}

/** The wardens of the school (the house's own first) and, for a late return, the office. */
async function tellStaff(schoolId: string, roles: Role[], titleKey: "hostel.notifLeaveAsk" | "hostel.notifLateTitle", name: string): Promise<void> {
  const people = await db.membership.findMany({ where: { schoolId, role: { in: roles }, status: "ACTIVE" }, select: { userId: true, role: true } });
  for (const p of people) await notify({ userId: p.userId, schoolId, kind: "SYSTEM", titleKey, titleVars: { name }, url: p.role === "WARDEN" ? "/hostel/leave" : "/admin/hostel" }).catch((error) => console.error("[hostel] staff notice failed", error));
}

/** The warden approves or declines leave that is ready for them: a minor's only after a guardian has consented. */
export async function decideLeave(ctx: ActiveContext, leaveId: string, approve: boolean, note: string): Promise<HostelLeaveRow> {
  const staff = await staffOf(ctx, WRITERS);
  const l = await leaveAt(staff.schoolId, leaveId);
  const target = approve ? "APPROVED" : "DECLINED";
  if (l.status === target) return leaveRow(l.id);
  if (l.status === "AWAITING_CONSENT") throw new AccessError("hostel.refuseNeedsConsent");
  if (l.status !== "PENDING") throw new AccessError("hostel.refuseLeaveSettled");
  const moved = await db.hostelLeave.updateMany({ where: { id: l.id, status: "PENDING" }, data: { status: target, decidedAt: new Date(), decidedByUserId: staff.userId, decisionNote: note || null } });
  if (moved.count === 0) throw new AccessError("hostel.refuseLeaveSettled");
  await audit({ schoolId: staff.schoolId, actorUserId: staff.userId, action: approve ? "hostel.leave.approve" : "hostel.leave.decline", targetType: "HostelLeave", targetId: l.id, meta: { kind: l.kind } });
  await tellFamily(staff.schoolId, l, approve ? "hostel.notifLeaveApproved" : "hostel.notifLeaveDeclined");
  return leaveRow(l.id);
}

/** The gate: out on approved leave. Pressing twice is the same. */
/** How early before a leave's start the gate lets the boarder out (QA-45). */
export const GATE_OUT_EARLY_MS = 15 * 60_000;

export async function gateOut(ctx: ActiveContext, leaveId: string, now: Date = new Date()): Promise<HostelLeaveRow> {
  const staff = await staffOf(ctx, WRITERS);
  const l = await leaveAt(staff.schoolId, leaveId);
  if (l.status !== "APPROVED") throw new AccessError("hostel.refuseNotApproved");
  // Not out before the leave begins (QA-45), as a return is checked against its end: the approval is for that window.
  // A quarter of an hour early is let through, for a bus or a parent at the gate a little before the hour.
  if (!l.outAt && now.getTime() < l.fromAt.getTime() - GATE_OUT_EARLY_MS) throw new AccessError("hostel.refuseOutEarly");
  if (!l.outAt) {
    await db.hostelLeave.updateMany({ where: { id: l.id, outAt: null }, data: { outAt: now, outByUserId: staff.userId } });
    await audit({ schoolId: staff.schoolId, actorUserId: staff.userId, action: "hostel.leave.out", targetType: "HostelLeave", targetId: l.id });
  }
  return leaveRow(l.id);
}

/**
 * The gate: back in. After the leave's end it is LATE, flagged to the wardens, the office and the family — and at a
 * college an outing (LOCAL) is late after the hostel's curfew that evening too (hostel-night.ts, 5 Oct 2026).
 */
export async function gateIn(ctx: ActiveContext, leaveId: string, now: Date = new Date()): Promise<HostelLeaveRow> {
  const staff = await staffOf(ctx, WRITERS);
  const l = await leaveAt(staff.schoolId, leaveId);
  if (!l.outAt) throw new AccessError("hostel.refuseNotOut");
  if (!l.inAt) {
    const late = returnIsLate(l, await curfewRuleFor(l.allotment.room.hostelId), now);
    const moved = await db.hostelLeave.updateMany({ where: { id: l.id, inAt: null }, data: { inAt: now, inByUserId: staff.userId, late } });
    if (moved.count === 1) {
      await audit({ schoolId: staff.schoolId, actorUserId: staff.userId, action: "hostel.leave.in", targetType: "HostelLeave", targetId: l.id, meta: { late } });
      if (late) {
        await tellStaff(staff.schoolId, ["WARDEN", "ADMIN"], "hostel.notifLateTitle", nameOf(l.allotment.student));
        await tellFamily(staff.schoolId, l, "hostel.notifLateTitle");
      }
    }
  }
  return leaveRow(l.id);
}

/* -------------------------------------------------------------------------- */
/* The visitor book                                                            */
/* -------------------------------------------------------------------------- */

export async function listVisitors(ctx: ActiveContext, date?: string) {
  const staff = await staffOf(ctx, READERS);
  const dateKey = date ?? todayKey(staff.timeZone);
  const start = zonedStartOfDay(dateKey, staff.timeZone);
  const end = zonedStartOfDay(addDaysToKey(dateKey, 1), staff.timeZone);
  const rows = await db.hostelVisitor.findMany({
    where: { schoolId: staff.schoolId, OR: [{ inAt: { gte: start, lt: end } }, ...(dateKey === todayKey(staff.timeZone) ? [{ outAt: null }] : [])] },
    include: { allotment: { include: ALLOTMENT_INCLUDE } },
    orderBy: { inAt: "desc" },
    take: 500,
  });
  const names = await namesOf(rows.map((r) => r.allowedByUserId));
  return {
    dateKey,
    items: rows.map((v) => ({
      id: v.id,
      allotmentId: v.allotmentId,
      boarderName: nameOf(v.allotment.student),
      hostelName: v.allotment.room.hostel.name,
      roomNumber: v.allotment.room.number,
      name: v.name,
      relation: v.relation,
      note: v.note,
      inAt: v.inAt.toISOString(),
      outAt: v.outAt?.toISOString() ?? null,
      allowedByName: names.get(v.allowedByUserId) ?? "",
    })),
  };
}

export async function signVisitorIn(ctx: ActiveContext, input: { allotmentId: string; name: string; relation: string; note: string }) {
  const staff = await staffOf(ctx, WRITERS);
  const a = await db.hostelAllotment.findFirst({ where: { id: input.allotmentId, schoolId: staff.schoolId, ...liveAllotmentWhere(todayKey(staff.timeZone)) }, select: { id: true } });
  if (!a) throw new AccessError("hostel.refuseNoAllotment", "NOT_FOUND");
  const v = await db.hostelVisitor.create({ data: { schoolId: staff.schoolId, allotmentId: a.id, name: input.name, relation: input.relation, note: input.note, allowedByUserId: staff.userId }, select: { id: true } });
  await audit({ schoolId: staff.schoolId, actorUserId: staff.userId, action: "hostel.visitor.in", targetType: "HostelVisitor", targetId: v.id, meta: { allotmentId: a.id } });
  return listVisitors(ctx);
}

export async function signVisitorOut(ctx: ActiveContext, visitorId: string) {
  const staff = await staffOf(ctx, WRITERS);
  const v = await db.hostelVisitor.findFirst({ where: { id: visitorId, schoolId: staff.schoolId }, select: { id: true, outAt: true, inAt: true } });
  if (!v) throw new AccessError("hostel.refuseNoVisitor", "NOT_FOUND");
  if (!v.outAt) await db.hostelVisitor.updateMany({ where: { id: v.id, outAt: null }, data: { outAt: new Date() } });
  return listVisitors(ctx, todayKey(staff.timeZone, v.inAt));
}

/* -------------------------------------------------------------------------- */
/* The mess                                                                    */
/* -------------------------------------------------------------------------- */

/** The menu: every house's for the staff; the boarder's own house for a pupil or a guardian. */
export async function messMenu(ctx: ActiveContext, opts: { hostelId?: string; childId?: string } = {}): Promise<MessMenuView> {
  let schoolId: string;
  let hostelIds: string[] | null = null;
  let canEdit = false;
  if (ctx.role === "STUDENT" || ctx.role === "PARENT") {
    const fam = await familyAllotment(ctx, opts.childId);
    schoolId = fam.schoolId;
    hostelIds = fam.allotment ? [fam.allotment.room.hostelId] : [];
  } else {
    const staff = await staffOf(ctx, READERS);
    schoolId = staff.schoolId;
    canEdit = WRITERS.includes(staff.role);
    if (opts.hostelId) hostelIds = [opts.hostelId];
  }
  const hostels = await db.hostel.findMany({ where: { schoolId, ...(hostelIds ? { id: { in: hostelIds } } : {}) }, orderBy: { name: "asc" }, include: { menu: { orderBy: [{ weekday: "asc" }, { meal: "asc" }] } } });
  const order = ["BREAKFAST", "LUNCH", "SNACKS", "DINNER"];
  return {
    hostels: hostels.map((h) => ({ hostelId: h.id, hostelName: h.name, messAttendance: h.messAttendance, entries: h.menu.sort((a, b) => a.weekday - b.weekday || order.indexOf(a.meal) - order.indexOf(b.meal)).map((m) => ({ weekday: m.weekday, meal: m.meal as MessMeal, items: m.items })) })),
    canEdit,
  };
}

/** The whole week's menu for a house, as sent: a meal left empty is taken off. */
export async function saveMessMenu(ctx: ActiveContext, input: { hostelId: string; entries: { weekday: number; meal: MessMeal; items: string }[] }): Promise<MessMenuView> {
  const staff = await staffOf(ctx, WRITERS);
  const hostel = await db.hostel.findFirst({ where: { id: input.hostelId, schoolId: staff.schoolId }, select: { id: true } });
  if (!hostel) throw new AccessError("hostel.refuseNoHostel", "NOT_FOUND");
  const keep = new Map<string, { weekday: number; meal: MessMeal; items: string }>();
  for (const e of input.entries) if (e.items.trim()) keep.set(`${e.weekday}:${e.meal}`, e);
  await db.$tenantTransaction(async (raw) => {
    const tx = raw as Tx;
    await tx.messMenu.deleteMany({ where: { hostelId: hostel.id } });
    if (keep.size) await tx.messMenu.createMany({ data: [...keep.values()].map((e) => ({ schoolId: staff.schoolId, hostelId: hostel.id, weekday: e.weekday, meal: e.meal, items: e.items.trim() })) });
  });
  await audit({ schoolId: staff.schoolId, actorUserId: staff.userId, action: "hostel.menu", targetType: "Hostel", targetId: hostel.id, meta: { meals: keep.size } });
  return messMenu(ctx, { hostelId: hostel.id });
}

/** Who ate, where the house has mess attendance switched on; marking again overwrites the same meal. */
export async function saveMessAttendance(ctx: ActiveContext, input: { hostelId: string; dateKey: string; meal: MessMeal; entries: { allotmentId: string; present: boolean }[] }): Promise<{ saved: number }> {
  const staff = await staffOf(ctx, WRITERS);
  const hostel = await db.hostel.findFirst({ where: { id: input.hostelId, schoolId: staff.schoolId }, select: { id: true, messAttendance: true } });
  if (!hostel) throw new AccessError("hostel.refuseNoHostel", "NOT_FOUND");
  if (!hostel.messAttendance) throw new AccessError("hostel.refuseMessOff");
  if (input.dateKey > todayKey(staff.timeZone)) throw new AccessError("hostel.refuseRollCallDate");
  const active = new Set((await db.hostelAllotment.findMany({ where: { schoolId: staff.schoolId, ...liveAllotmentWhere(input.dateKey), room: { hostelId: hostel.id } }, select: { id: true } })).map((a) => a.id));
  if (input.entries.some((e) => !active.has(e.allotmentId))) throw new AccessError("hostel.refuseNotBoarder");
  await db.$tenantTransaction(async (raw) => {
    const tx = raw as Tx;
    for (const e of input.entries) {
      await tx.messAttendance.upsert({
        where: { allotmentId_dateKey_meal: { allotmentId: e.allotmentId, dateKey: input.dateKey, meal: input.meal } },
        create: { schoolId: staff.schoolId, allotmentId: e.allotmentId, dateKey: input.dateKey, meal: input.meal, present: e.present, markedByUserId: staff.userId },
        update: { present: e.present, markedByUserId: staff.userId },
      });
    }
  });
  return { saved: input.entries.length };
}

/* -------------------------------------------------------------------------- */
/* Incidents and health                                                        */
/* -------------------------------------------------------------------------- */

/** The school's incident log, as far as it happened in a hostel. */
export async function hostelIncidents(ctx: ActiveContext) {
  const staff = await staffOf(ctx, READERS);
  const rows = await db.incident.findMany({
    // A safeguarding concern: the office, the head and the warden who recorded it, never another warden (TA-108).
    where: { schoolId: staff.schoolId, hostelId: { not: null }, ...staffOnlyWhere(staff) },
    orderBy: { occurredAt: "desc" },
    take: 100,
    select: { id: true, hostelId: true, kind: true, severity: true, occurredAt: true, title: true, status: true, guardiansNotifiedAt: true, student: { select: { user: { select: { name: true, preferredName: true } } } }, reportedBy: { select: { user: { select: { name: true } } } } },
  });
  const hostels = await db.hostel.findMany({ where: { schoolId: staff.schoolId }, select: { id: true, name: true } });
  const hostelName = new Map(hostels.map((h) => [h.id, h.name]));
  return {
    items: rows.map((i) => ({
      id: i.id,
      studentName: nameOf(i.student),
      hostelName: hostelName.get(i.hostelId!) ?? "",
      kind: i.kind as "INJURY",
      severity: i.severity as "MINOR",
      occurredAt: i.occurredAt.toISOString(),
      title: i.title,
      status: i.status as "OPEN" | "CLOSED",
      reportedByName: i.reportedBy.user.name,
      guardiansNotifiedAt: i.guardiansNotifiedAt?.toISOString() ?? null,
    })),
  };
}

/**
 * The warden records what happened to a boarder in the school's own incident
 * log, tagged with the hostel — written once, told to the family as the log
 * tells it, followed up and closed by the office there.
 */
export async function recordHostelIncident(ctx: ActiveContext, input: HostelIncidentCreate) {
  const staff = await staffOf(ctx, WRITERS);
  const a = await db.hostelAllotment.findFirst({ where: { id: input.allotmentId, schoolId: staff.schoolId, ...liveAllotmentWhere(todayKey(staff.timeZone)) }, include: ALLOTMENT_INCLUDE });
  if (!a) throw new AccessError("hostel.refuseNoAllotment", "NOT_FOUND");
  const created = await db.incident.create({
    data: { schoolId: staff.schoolId, studentMembershipId: a.membershipId, reportedByMembershipId: staff.membershipId, kind: input.kind, severity: input.severity, occurredAt: new Date(), place: a.room.hostel.name.slice(0, 80), title: input.title, body: input.body, actionTaken: input.actionTaken, hostelId: a.room.hostelId },
    select: { id: true },
  });
  // A safeguarding concern is told to nobody in the family, whatever the box says (TA-108).
  const tell = input.notifyGuardians && !staffOnlyKind(input.kind);
  if (tell) {
    const school = await db.school.findUniqueOrThrow({ where: { id: staff.schoolId }, select: { name: true } });
    const told = await notifyGuardians(a.membershipId, (childName) => ({
      schoolId: staff.schoolId,
      kind: "INCIDENT",
      titleKey: input.kind === "ILLNESS" ? "notifTitle.incidentIllness" : "notifTitle.incident",
      titleVars: { name: childName },
      bodyKey: "notifBody.incidentNote",
      bodyVars: { name: childName },
      url: `/parent/incidents?child=${a.membershipId}&incident=${created.id}`,
      text: { templateKey: "incident", vars: { child: childName, summary: input.title.slice(0, 80), school: school.name }, purpose: `incident:${created.id}` },
    }), "HOSTEL_TRANSPORT");
    // Stamped only when somebody was told (TA-298): an adult boarder who has not granted HOSTEL_TRANSPORT, or one
    // with no guardian linked, leaves it empty, and the office knows to telephone.
    if (told > 0) await db.incident.update({ where: { id: created.id }, data: { guardiansNotifiedAt: new Date() } });
  }
  await audit({ schoolId: staff.schoolId, actorUserId: staff.userId, action: "incident.record", targetType: "Incident", targetId: created.id, meta: { studentMembershipId: a.membershipId, kind: input.kind, severity: input.severity, notified: tell, hostelId: a.room.hostelId } });
  return hostelIncidents(ctx);
}

/** What the warden needs at night from a boarder's health card. The read is a row the family sees, as every staff read is. */
export async function boarderHealth(ctx: ActiveContext, allotmentId: string): Promise<HostelBoarderHealth> {
  const staff = await staffOf(ctx, ["WARDEN"]);
  const a = await db.hostelAllotment.findFirst({ where: { id: allotmentId, schoolId: staff.schoolId, ...liveAllotmentWhere(todayKey(staff.timeZone)) }, include: ALLOTMENT_INCLUDE });
  if (!a) throw new AccessError("hostel.refuseNoAllotment", "NOT_FOUND");
  const card = await db.healthCard.findUnique({ where: { studentMembershipId: a.membershipId } });
  await forSchool(staff.schoolId, () => db.healthCardRead.create({ data: { schoolId: staff.schoolId, studentMembershipId: a.membershipId, healthCardId: card?.id ?? null, readerUserId: staff.userId, readerRole: "WARDEN" }, select: { id: true } }));
  return {
    allotmentId: a.id,
    name: nameOf(a.student),
    hasCard: Boolean(card),
    bloodGroup: (card?.bloodGroup as HostelBoarderHealth["bloodGroup"]) ?? null,
    allergies: card?.allergies ?? "",
    conditions: card?.conditions ?? "",
    medications: card?.medications ?? "",
    dietary: card?.dietary ?? "",
    doctorName: card?.doctorName ?? "",
    doctorPhone: card?.doctorPhone ?? "",
    contacts: readContacts(card?.contactsJson),
  };
}

/* -------------------------------------------------------------------------- */
/* The office's overview                                                       */
/* -------------------------------------------------------------------------- */

export async function hostelOverview(ctx: ActiveContext, now: Date = new Date()): Promise<HostelOverview> {
  const staff = await staffOf(ctx, READERS);
  const view = await hostelsView(ctx);
  const today = todayKey(staff.timeZone, now);
  const [leaveToday, pending, late, visitors, outNow] = await Promise.all([
    listLeave(ctx, "TODAY", now),
    db.hostelLeave.count({ where: { schoolId: staff.schoolId, status: { in: ["AWAITING_CONSENT", "PENDING"] } } }),
    db.hostelLeave.findMany({ where: { schoolId: staff.schoolId, late: true, inAt: { gte: new Date(now.getTime() - 7 * 86_400_000) } }, include: LEAVE_INCLUDE, orderBy: { inAt: "desc" }, take: 50 }),
    db.hostelVisitor.count({ where: { schoolId: staff.schoolId, inAt: { gte: zonedStartOfDay(today, staff.timeZone) } } }),
    db.hostelLeave.count({ where: { schoolId: staff.schoolId, status: "APPROVED", outAt: { not: null }, inAt: null } }),
  ]);
  const absentees: HostelOverview["absentees"] = [];
  for (const h of view.hostels) {
    const latest = await db.hostelRollCall.findFirst({ where: { hostelId: h.id }, orderBy: [{ dateKey: "desc" }, { takenAt: "desc" }], include: { entries: { where: { status: "ABSENT" }, include: { allotment: { include: ALLOTMENT_INCLUDE } } } } });
    if (!latest) continue;
    for (const e of latest.entries) absentees.push({ hostelName: h.name, dateKey: latest.dateKey, slot: latest.slot as HostelRollSlot, name: nameOf(e.allotment.student), roomNumber: e.allotment.room.number });
  }
  return {
    dateKey: today,
    hostels: view.hostels.map((h) => ({ id: h.id, name: h.name, beds: h.beds, occupied: h.occupied })),
    leaveToday: leaveToday.items,
    outNow,
    pendingLeave: pending,
    lateReturns: await leaveRows(late),
    absentees,
    visitorsToday: visitors,
  };
}

/* -------------------------------------------------------------------------- */
/* The family                                                                  */
/* -------------------------------------------------------------------------- */

/** The child a pupil or a guardian is reading about, with their active bed if any. A guardian reaches only their own children. */
async function familyAllotment(ctx: ActiveContext, childId?: string | null): Promise<{ schoolId: string; timeZone: string; pupil: Pupil; allotment: AllotmentRow | null }> {
  let membershipId: string;
  if (ctx.role === "PARENT") {
    const child = childId ?? (await db.guardianship.findFirst({ where: { parentUserId: ctx.user.id, status: "ACTIVE" }, orderBy: { createdAt: "asc" }, select: { studentMembershipId: true } }))?.studentMembershipId;
    if (!child) throw new AccessError("access.notYourChild", "NOT_FOUND");
    await assertGuardianAccess(ctx.user.id, child, "HOSTEL_TRANSPORT");
    membershipId = child;
  } else if (ctx.role === "STUDENT" && ctx.membershipId) {
    membershipId = ctx.membershipId;
  } else throw new AccessError("access.wrongRoleForThisAction");
  const pupil = await db.membership.findUnique({ where: { id: membershipId }, select: PUPIL_SELECT });
  if (!pupil) throw new AccessError("access.notYourChild", "NOT_FOUND");
  await assertModuleOn(pupil.schoolId, "HOSTEL");
  const timeZone = await zoneOf(pupil.schoolId);
  const allotment = await db.hostelAllotment.findFirst({ where: { activePupilKey: pupil.id, ...liveAllotmentWhere(todayKey(timeZone)) }, include: ALLOTMENT_INCLUDE });
  return { schoolId: pupil.schoolId, timeZone, pupil, allotment };
}

export async function familyHostel(ctx: ActiveContext, childId?: string | null, now: Date = new Date()): Promise<FamilyHostel> {
  const fam = await familyAllotment(ctx, childId);
  const today = todayKey(fam.timeZone, now);
  const a = fam.allotment;
  let tonight: FamilyHostel["tonight"] = { dateKey: today, slot: "NIGHT", status: "NOT_TAKEN" };
  let wardenName: string | null = null;
  let menuToday: FamilyHostel["menuToday"] = [];
  let leave: HostelLeaveRow[] = [];
  if (a) {
    // The boarder's entry on today's call, whichever place it was taken on (a room change makes a new place, TA-295).
    const entry = await db.hostelRollCallEntry.findFirst({ where: { membershipId: a.membershipId, schoolId: fam.schoolId, rollCall: { dateKey: today } }, include: { rollCall: { select: { slot: true, takenAt: true } } }, orderBy: { rollCall: { takenAt: "desc" } } });
    if (entry) tonight = { dateKey: today, slot: entry.rollCall.slot as HostelRollSlot, status: entry.status as "PRESENT" };
    if (a.room.hostel.wardenMembershipId) {
      const w = await db.membership.findUnique({ where: { id: a.room.hostel.wardenMembershipId }, select: { user: { select: { name: true, preferredName: true } } } });
      wardenName = w ? nameOf(w) : null;
    }
    // weekdayOfKey is 0 for Sunday; the menu counts Monday as 1 and Sunday as 7.
    const weekday = weekdayOfKey(today) || 7;
    const order = ["BREAKFAST", "LUNCH", "SNACKS", "DINNER"];
    menuToday = (await db.messMenu.findMany({ where: { hostelId: a.room.hostelId, weekday } })).sort((x, y) => order.indexOf(x.meal) - order.indexOf(y.meal)).map((m) => ({ meal: m.meal as MessMeal, items: m.items }));
  }
  const rows = await db.hostelLeave.findMany({ where: { membershipId: fam.pupil.id }, include: LEAVE_INCLUDE, orderBy: { fromAt: "desc" }, take: 20 });
  leave = await leaveRows(rows);
  return {
    child: { membershipId: fam.pupil.id, name: nameOf(fam.pupil) },
    allotment: a ? { hostelName: a.room.hostel.name, hostelKind: a.room.hostel.kind as "BOYS", roomNumber: a.room.number, floor: a.room.floor, bed: a.bed, fromDate: a.fromDate, wardenName } : null,
    tonight,
    leave,
    menuToday,
    canRequestLeave: Boolean(a),
    canConsent: ctx.role === "PARENT",
    // The school's zone (TA-500): the phone reads a leave's typed times and prints them in it, as the web does.
    timeZone: fam.timeZone,
  };
}

/**
 * Leave asked for by the boarder or a guardian. A guardian's ask is their
 * consent and goes to the warden; a minor's own ask waits for a guardian; a
 * pupil of age needs nobody's.
 */
export async function requestLeave(ctx: ActiveContext, input: FamilyHostelLeaveCreate, now: Date = new Date()): Promise<HostelLeaveRow> {
  const fam = await familyAllotment(ctx, input.childId);
  if (!fam.allotment) throw new AccessError("hostel.refuseNotBoarding");
  // A college's rule (4 Oct 2026): a hostel that does not allow night-outs refuses one.
  if (input.kind === "NIGHT_OUT" && !(await forSchool(fam.schoolId, () => db.hostelRoom.findUnique({ where: { id: fam.allotment!.roomId }, select: { hostel: { select: { nightOutAllowed: true } } } })))?.hostel.nightOutAllowed) throw new AccessError("collegeOffice.refuseNightOut");
  const fromAt = new Date(input.fromAt);
  const toAt = new Date(input.toAt);
  if (fromAt.getTime() < now.getTime() - 86_400_000 || toAt.getTime() - fromAt.getTime() > 60 * 86_400_000 || toAt <= fromAt) throw new AccessError("hostel.refuseLeaveDates");
  const byGuardian = ctx.role === "PARENT";
  const status = byGuardian || !fam.pupil.user.isMinor ? "PENDING" : "AWAITING_CONSENT";
  const l = await forSchool(fam.schoolId, () =>
    db.hostelLeave.create({
      data: { schoolId: fam.schoolId, allotmentId: fam.allotment!.id, membershipId: fam.pupil.id, kind: input.kind, fromAt, toAt, destination: input.destination, reason: input.reason, status, requestedByUserId: ctx.user.id, consentAt: byGuardian ? now : null, consentUserId: byGuardian ? ctx.user.id : null },
      select: { id: true },
    }),
  );
  await audit({ schoolId: fam.schoolId, actorUserId: ctx.user.id, action: "hostel.leave.request", targetType: "HostelLeave", targetId: l.id, meta: { kind: input.kind, status } });
  const name = nameOf(fam.pupil);
  if (status === "AWAITING_CONSENT") {
    await notifyGuardians(fam.pupil.id, (childName) => ({ schoolId: fam.schoolId, kind: "SYSTEM", titleKey: "hostel.notifConsentTitle", titleVars: { name: childName }, url: `/parent/hostel?child=${fam.pupil.id}` })).catch((error) => console.error("[hostel] consent notice failed", error));
  } else await tellStaff(fam.schoolId, ["WARDEN"], "hostel.notifLeaveAsk", name);
  return leaveRow(l.id);
}

/** A guardian's yes or no to their child's own ask. Only while it waits; answering again is the same. */
export async function consentLeave(ctx: ActiveContext, leaveId: string, approve: boolean, now: Date = new Date()): Promise<HostelLeaveRow> {
  if (ctx.role !== "PARENT") throw new AccessError("access.wrongRoleForThisAction");
  const l = await db.hostelLeave.findUnique({ where: { id: leaveId }, select: { id: true, schoolId: true, membershipId: true, status: true, consentUserId: true, allotment: { include: ALLOTMENT_INCLUDE } } });
  if (!l) throw new AccessError("hostel.refuseNoLeave", "NOT_FOUND");
  await assertGuardianAccess(ctx.user.id, l.membershipId, "HOSTEL_TRANSPORT").catch(() => {
    throw new AccessError("hostel.refuseNoLeave", "NOT_FOUND");
  });
  await assertModuleOn(l.schoolId, "HOSTEL");
  if (l.status === "AWAITING_CONSENT") {
    const moved = await forSchool(l.schoolId, () =>
      db.hostelLeave.updateMany({ where: { id: l.id, status: "AWAITING_CONSENT" }, data: approve ? { status: "PENDING", consentAt: now, consentUserId: ctx.user.id } : { status: "DECLINED", decidedAt: now, decidedByUserId: ctx.user.id } }),
    );
    if (moved.count === 1) {
      await audit({ schoolId: l.schoolId, actorUserId: ctx.user.id, action: approve ? "hostel.leave.consent" : "hostel.leave.refuse", targetType: "HostelLeave", targetId: l.id });
      if (approve) await tellStaff(l.schoolId, ["WARDEN"], "hostel.notifLeaveAsk", nameOf(l.allotment.student));
    }
  } else if (!((approve && l.status !== "DECLINED" && l.status !== "CANCELLED") || (!approve && l.status === "DECLINED"))) throw new AccessError("hostel.refuseLeaveSettled");
  return forSchool(l.schoolId, () => leaveRow(l.id));
}

/** The boarder or a guardian takes the ask back, before the boarder has gone out. */
export async function cancelLeave(ctx: ActiveContext, leaveId: string): Promise<HostelLeaveRow> {
  const l = await db.hostelLeave.findUnique({ where: { id: leaveId }, select: { id: true, schoolId: true, membershipId: true, status: true, outAt: true } });
  if (!l) throw new AccessError("hostel.refuseNoLeave", "NOT_FOUND");
  if (ctx.role === "PARENT") {
    await assertGuardianAccess(ctx.user.id, l.membershipId, "HOSTEL_TRANSPORT").catch(() => {
      throw new AccessError("hostel.refuseNoLeave", "NOT_FOUND");
    });
  } else if (!(ctx.role === "STUDENT" && ctx.membershipId === l.membershipId)) throw new AccessError("hostel.refuseNoLeave", "NOT_FOUND");
  await assertModuleOn(l.schoolId, "HOSTEL");
  if (l.status === "CANCELLED") return forSchool(l.schoolId, () => leaveRow(l.id));
  if (l.outAt || !["AWAITING_CONSENT", "PENDING", "APPROVED"].includes(l.status)) throw new AccessError("hostel.refuseLeaveSettled");
  await forSchool(l.schoolId, () => db.hostelLeave.updateMany({ where: { id: l.id, outAt: null, status: { in: ["AWAITING_CONSENT", "PENDING", "APPROVED"] } }, data: { status: "CANCELLED" } }));
  await audit({ schoolId: l.schoolId, actorUserId: ctx.user.id, action: "hostel.leave.cancel", targetType: "HostelLeave", targetId: l.id });
  return forSchool(l.schoolId, () => leaveRow(l.id));
}

/** The school's pupils with no bed, to allot one: name and class, for the office's and the warden's picker. */
export async function pupilsWithoutBed(ctx: ActiveContext): Promise<{ membershipId: string; name: string; className: string | null }[]> {
  const staff = await staffOf(ctx, WRITERS);
  const rows = await db.membership.findMany({
    where: { schoolId: staff.schoolId, role: "STUDENT", status: "ACTIVE", leftAt: null, hostelAllotments: { none: liveAllotmentWhere(todayKey(staff.timeZone)) } },
    select: PUPIL_SELECT,
    orderBy: { user: { name: "asc" } },
    take: 2000,
  });
  return rows.map((p) => ({ membershipId: p.id, name: nameOf(p), className: p.enrollments[0]?.class.name ?? null }));
}

/** Who was marked at one meal of a day, for the warden's mess sheet: every boarder of the house with their mark, or null when not yet marked. */
export async function messSheet(ctx: ActiveContext, hostelId: string, dateKey: string, meal: MessMeal): Promise<{ allotmentId: string; name: string; roomNumber: string; present: boolean | null }[]> {
  const staff = await staffOf(ctx, READERS);
  const hostel = await db.hostel.findFirst({ where: { id: hostelId, schoolId: staff.schoolId }, select: { id: true } });
  if (!hostel) throw new AccessError("hostel.refuseNoHostel", "NOT_FOUND");
  const [boarders, marks] = await Promise.all([
    db.hostelAllotment.findMany({ where: { schoolId: staff.schoolId, ...liveAllotmentWhere(dateKey), room: { hostelId } }, include: ALLOTMENT_INCLUDE }),
    db.messAttendance.findMany({ where: { schoolId: staff.schoolId, dateKey, meal, allotment: { room: { hostelId } } }, select: { allotmentId: true, present: true } }),
  ]);
  const byId = new Map(marks.map((m) => [m.allotmentId, m.present]));
  return boarders
    .map((a) => ({ allotmentId: a.id, name: nameOf(a.student), roomNumber: a.room.number, present: byId.has(a.id) ? byId.get(a.id)! : null }))
    .sort((x, y) => x.roomNumber.localeCompare(y.roomNumber, undefined, { numeric: true }) || x.name.localeCompare(y.name));
}
