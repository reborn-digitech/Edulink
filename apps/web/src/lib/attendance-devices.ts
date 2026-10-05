import "server-only";
import {
  PUNCH_HEADERS,
  PUNCH_RECENT_DAYS,
  PUNCH_SKEW_SECONDS,
  punchBatchSchema,
  type BadgeSave,
  type DeviceKeyIssued,
  type DeviceSave,
  type DeviceScope,
  type DeviceUpdate,
  type DeviceView,
  type DevicesView,
  type PunchOutcome,
  type PunchResult,
} from "@edulink/contracts";
import { db } from "./db";
import { audit } from "./audit";
import { AccessError } from "./access-error";
import { RuleRefusal } from "./rule-refusal";
import { open, seal, sealingAvailable } from "./secret-box";
import { forSchool } from "./tenant-context";
import { addDaysToKey, dateKeyInZone, todayKey } from "./dates";
import { SCHOOL_STAFF_ROLES } from "./staff-records";
import { recordStaffCheckIn } from "./staff-attendance";
import { saveAttendanceBatch } from "./attendance";
import { schoolDayOn } from "./holidays";
import { newDeviceKey, verifyPunches } from "./punch-signature";
import type { ActiveContext } from "./session";

/**
 * ATTENDANCE DEVICES (the risks batch, R-2, 5 October 2026): a biometric or
 * RFID reader at the gate posts signed punches, and each lands in the
 * attendance a person would have made by hand — through the SAME writers,
 * never a second one: a member of staff's punch is their check-in
 * (staff-attendance.ts `recordStaffCheckIn`), a pupil's marks them PRESENT in
 * the day's class register (attendance.ts `saveAttendanceBatch`, with no
 * taker, so the register is still due from its teacher).
 *
 * WHAT A PUNCH NEVER DOES: overwrite. A pupil already marked that day (by a
 * teacher, or an earlier punch) and a member of staff already in (or marked
 * by the office) are ALREADY_MARKED; an OUT punch is LOGGED and nothing more;
 * a closed day, a code no badge names, a person outside the device's scope,
 * a pupil with no class register (a college student taught only in lectures)
 * and a punch older than PUNCH_RECENT_DAYS (or ahead of the clock) are each
 * kept with their outcome and change nothing.
 *
 * THE KEY. Made by `issueDeviceKey`, the one writer of `keySealed`: 32 random
 * bytes, shown once in the answer that made it, sealed under FEES_SECRET_KEY
 * bound to the school and the device (a sealed key moved to another row does
 * not open). Rotating makes a new one and the old stops at once.
 *
 * WHO. The office (ADMIN) registers devices, rotates keys, disables them and
 * maps badge codes to people; the principal reads. Every change is audited;
 * a batch of punches is audited once, with its counts.
 */

type Tx = typeof db;
const OFFICE_READ = ["ADMIN", "PRINCIPAL"];
const STAFF_ROLES: readonly string[] = SCHOOL_STAFF_ROLES;
const keyBound = (schoolId: string, deviceId: string) => `punch:${schoolId}:${deviceId}`;

function office(ctx: ActiveContext, write: boolean): { schoolId: string; userId: string; canEdit: boolean } {
  if (!ctx.schoolId || !ctx.role || !(write ? ["ADMIN"] : OFFICE_READ).includes(ctx.role)) throw new AccessError("access.wrongRoleForThisAction");
  return { schoolId: ctx.schoolId, userId: ctx.user.id, canEdit: ctx.role === "ADMIN" };
}

export function punchEndpoint(schoolId: string): string {
  return `${(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "")}/api/v1/punch/${schoolId}`;
}

/**
 * THE ONE WRITER OF A DEVICE'S KEY: a fresh key, sealed and bound, its last
 * four for the page, the version counted up. Runs inside the caller's
 * transaction; the plain key is returned to be shown once and kept nowhere.
 */
async function issueDeviceKey(tx: Tx, schoolId: string, deviceId: string, now: Date): Promise<string> {
  const key = newDeviceKey();
  await tx.attendanceDevice.update({
    where: { id: deviceId },
    data: { keySealed: seal(key, keyBound(schoolId, deviceId)), keyLast4: key.slice(-4), keyVersion: { increment: 1 }, keyRotatedAt: now },
  });
  return key;
}

type DeviceRow = { id: string; name: string; kind: string; location: string; scope: string; keyLast4: string; keyVersion: number; keyRotatedAt: Date; disabledAt: Date | null; lastPunchAt: Date | null };
function deviceView(d: DeviceRow, punchesToday: number): DeviceView {
  return { id: d.id, name: d.name, kind: d.kind as DeviceView["kind"], location: d.location, scope: d.scope as DeviceScope, keyLast4: d.keyLast4, keyVersion: d.keyVersion, keyRotatedAt: d.keyRotatedAt.toISOString(), disabled: Boolean(d.disabledAt), lastPunchAt: d.lastPunchAt?.toISOString() ?? null, punchesToday };
}

async function zoneOf(schoolId: string): Promise<string> {
  return (await db.school.findUnique({ where: { id: schoolId }, select: { timezone: true } }))?.timezone ?? "Asia/Kolkata";
}
const nameOf = (u: { name: string; preferredName: string | null }) => u.preferredName ?? u.name;

/** The office's page: the devices, the badges, the last hundred punches, the people a badge may name. */
export async function devicesView(ctx: ActiveContext, now = new Date()): Promise<DevicesView> {
  const caller = office(ctx, false);
  const today = todayKey(await zoneOf(caller.schoolId));
  const [devices, today_, badges, recent, people] = await Promise.all([
    db.attendanceDevice.findMany({ where: { schoolId: caller.schoolId }, orderBy: { createdAt: "asc" } }),
    db.attendancePunch.groupBy({ by: ["deviceId"], where: { schoolId: caller.schoolId, dateKey: today }, _count: { _all: true } }),
    db.attendanceBadge.findMany({ where: { schoolId: caller.schoolId }, orderBy: { code: "asc" }, take: 2000 }),
    db.attendancePunch.findMany({ where: { schoolId: caller.schoolId }, orderBy: { receivedAt: "desc" }, take: 100, include: { device: { select: { name: true } } } }),
    db.membership.findMany({ where: { schoolId: caller.schoolId, status: "ACTIVE", leftAt: null, role: { in: [...STAFF_ROLES, "STUDENT"] } }, select: { id: true, role: true, user: { select: { name: true, preferredName: true } } }, orderBy: [{ role: "asc" }, { user: { name: "asc" } }], take: 5000 }),
  ]);
  const countOf = new Map(today_.map((r) => [r.deviceId, r._count._all]));
  const personOf = new Map(people.map((p) => [p.id, p]));
  const missing = [...new Set([...badges.map((b) => b.membershipId), ...recent.map((r) => r.membershipId).filter((x): x is string => Boolean(x))])].filter((id) => !personOf.has(id));
  const others = missing.length ? await db.membership.findMany({ where: { id: { in: missing }, schoolId: caller.schoolId }, select: { id: true, role: true, user: { select: { name: true, preferredName: true } } } }) : [];
  for (const o of others) personOf.set(o.id, o);
  void now;
  return {
    devices: devices.map((d) => deviceView(d, countOf.get(d.id) ?? 0)),
    badges: badges.map((b) => ({ id: b.id, code: b.code, membershipId: b.membershipId, name: personOf.get(b.membershipId) ? nameOf(personOf.get(b.membershipId)!.user) : "—", role: personOf.get(b.membershipId)?.role ?? "" })),
    recent: recent.map((p) => ({ id: p.id, deviceName: p.device.name, code: p.code, name: p.membershipId && personOf.get(p.membershipId) ? nameOf(personOf.get(p.membershipId)!.user) : null, punchedAt: p.punchedAt.toISOString(), dateKey: p.dateKey, direction: (p.direction as "IN" | "OUT" | null) ?? null, outcome: p.outcome as PunchOutcome })),
    people: people.map((p) => ({ membershipId: p.id, name: nameOf(p.user), role: p.role })),
    sealingAvailable: sealingAvailable(),
    canEdit: caller.canEdit,
  };
}

function issued(schoolId: string, d: DeviceRow, key: string): DeviceKeyIssued {
  return { device: deviceView(d, 0), key, endpoint: punchEndpoint(schoolId), headers: { ...PUNCH_HEADERS } };
}

/** The office registers a device; the answer carries its key, once. Refused while sealing is not set up. Audited. */
export async function registerDevice(ctx: ActiveContext, input: DeviceSave, now = new Date()): Promise<DeviceKeyIssued> {
  const caller = office(ctx, true);
  if (!sealingAvailable()) throw new RuleRefusal("punch.refuseNoSealing", 409);
  const { device, key } = await db.$tenantTransaction(async (raw) => {
    const tx = raw as Tx;
    const made = await tx.attendanceDevice.create({ data: { schoolId: caller.schoolId, name: input.name, kind: input.kind, location: input.location, scope: input.scope, keySealed: "", keyLast4: "", keyVersion: 0, createdByUserId: caller.userId }, select: { id: true } });
    const key = await issueDeviceKey(tx, caller.schoolId, made.id, now);
    return { device: await tx.attendanceDevice.findUniqueOrThrow({ where: { id: made.id } }), key };
  });
  await audit({ schoolId: caller.schoolId, actorUserId: caller.userId, action: "attendance.device.register", targetType: "AttendanceDevice", targetId: device.id, meta: { kind: input.kind, scope: input.scope } });
  return issued(caller.schoolId, device, key);
}

/** A new key for a device; the old one stops at once. Audited (never the key). */
export async function rotateDeviceKey(ctx: ActiveContext, deviceId: string, now = new Date()): Promise<DeviceKeyIssued> {
  const caller = office(ctx, true);
  if (!sealingAvailable()) throw new RuleRefusal("punch.refuseNoSealing", 409);
  const found = await db.attendanceDevice.findFirst({ where: { id: deviceId, schoolId: caller.schoolId }, select: { id: true } });
  if (!found) throw new AccessError("access.entryNotFound", "NOT_FOUND");
  const { device, key } = await db.$tenantTransaction(async (raw) => {
    const tx = raw as Tx;
    const key = await issueDeviceKey(tx, caller.schoolId, deviceId, now);
    return { device: await tx.attendanceDevice.findUniqueOrThrow({ where: { id: deviceId } }), key };
  });
  await audit({ schoolId: caller.schoolId, actorUserId: caller.userId, action: "attendance.device.rotate", targetType: "AttendanceDevice", targetId: deviceId, meta: { keyVersion: device.keyVersion } });
  return issued(caller.schoolId, device, key);
}

/** The office renames, moves, rescopes, disables or re-enables a device. Audited. */
export async function updateDevice(ctx: ActiveContext, deviceId: string, input: DeviceUpdate, now = new Date()): Promise<DeviceView> {
  const caller = office(ctx, true);
  const found = await db.attendanceDevice.findFirst({ where: { id: deviceId, schoolId: caller.schoolId }, select: { id: true, disabledAt: true } });
  if (!found) throw new AccessError("access.entryNotFound", "NOT_FOUND");
  const d = await db.attendanceDevice.update({
    where: { id: deviceId },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.kind !== undefined ? { kind: input.kind } : {}),
      ...(input.location !== undefined ? { location: input.location } : {}),
      ...(input.scope !== undefined ? { scope: input.scope } : {}),
      ...(input.disabled !== undefined ? { disabledAt: input.disabled ? (found.disabledAt ?? now) : null } : {}),
    },
  });
  await audit({ schoolId: caller.schoolId, actorUserId: caller.userId, action: input.disabled === true ? "attendance.device.disable" : "attendance.device.update", targetType: "AttendanceDevice", targetId: deviceId, meta: { fields: Object.keys(input) } });
  return deviceView(d, 0);
}

/** The office maps a code to a person (active staff or a pupil). The same mapping again is a no-op; a code another person holds is refused. Audited. */
export async function saveBadge(ctx: ActiveContext, input: BadgeSave): Promise<{ id: string }> {
  const caller = office(ctx, true);
  const person = await db.membership.findFirst({ where: { id: input.membershipId, schoolId: caller.schoolId, status: "ACTIVE", leftAt: null, role: { in: [...STAFF_ROLES, "STUDENT"] } }, select: { id: true } });
  if (!person) throw new RuleRefusal("punch.refusePerson", 422, undefined, "membershipId");
  const existing = await db.attendanceBadge.findUnique({ where: { schoolId_code: { schoolId: caller.schoolId, code: input.code } } });
  if (existing) {
    if (existing.membershipId === input.membershipId) return { id: existing.id };
    throw new RuleRefusal("punch.refuseBadgeTaken", 409, undefined, "code");
  }
  const b = await db.attendanceBadge.create({ data: { schoolId: caller.schoolId, code: input.code, membershipId: input.membershipId, createdByUserId: caller.userId }, select: { id: true } });
  await audit({ schoolId: caller.schoolId, actorUserId: caller.userId, action: "attendance.badge.set", targetType: "Membership", targetId: input.membershipId, meta: { badgeId: b.id } });
  return b;
}

/** The office takes a badge away. Audited. */
export async function removeBadge(ctx: ActiveContext, badgeId: string): Promise<void> {
  const caller = office(ctx, true);
  const b = await db.attendanceBadge.findFirst({ where: { id: badgeId, schoolId: caller.schoolId }, select: { id: true, membershipId: true } });
  if (!b) throw new AccessError("access.entryNotFound", "NOT_FOUND");
  await db.attendanceBadge.delete({ where: { id: b.id } });
  await audit({ schoolId: caller.schoolId, actorUserId: caller.userId, action: "attendance.badge.remove", targetType: "Membership", targetId: b.membershipId, meta: { badgeId } });
}

/* ------------------------------------------------------------- the punches */

export type PunchAnswer = { status: 200; body: PunchResult } | { status: 401 | 404 | 413 | 422; body: { code: string } };

type Person = { id: string; role: string; userId: string };

async function applyOne(schoolId: string, zone: string, scope: string, person: Person | null, at: Date, direction: "IN" | "OUT" | undefined, clientId: string, now: Date): Promise<{ outcome: PunchOutcome; dateKey: string }> {
  const dateKey = dateKeyInZone(at, zone);
  const today = todayKey(zone, now);
  if (at.getTime() > now.getTime() + PUNCH_SKEW_SECONDS * 1000 || dateKey < addDaysToKey(today, -PUNCH_RECENT_DAYS)) return { outcome: "NOT_RECENT", dateKey };
  if (!person) return { outcome: "UNKNOWN_BADGE", dateKey };
  const isStudent = person.role === "STUDENT";
  if ((isStudent && scope === "STAFF") || (!isStudent && scope === "STUDENTS")) return { outcome: "OUT_OF_SCOPE", dateKey };
  if (direction === "OUT") return { outcome: "LOGGED", dateKey };
  if (!isStudent) {
    try {
      const r = await recordStaffCheckIn({ schoolId, membershipId: person.id, at, byUserId: person.userId });
      return { outcome: r.created ? "APPLIED" : "ALREADY_MARKED", dateKey };
    } catch (error) {
      if (error instanceof AccessError && error.key === "staffAttendance.refuseClosed") return { outcome: "CLOSED_DAY", dateKey };
      throw error;
    }
  }
  if (!(await schoolDayOn(schoolId, dateKey)).open) return { outcome: "CLOSED_DAY", dateKey };
  const enrolment = await db.enrollment.findFirst({ where: { studentMembershipId: person.id, status: "ACTIVE", class: { schoolId, archivedAt: null } }, select: { classId: true } });
  if (!enrolment) return { outcome: "NO_REGISTER", dateKey };
  const already = await db.attendanceRecord.findFirst({ where: { schoolId, studentMembershipId: person.id, session: { classId: enrolment.classId, dateKey } }, select: { id: true } });
  if (already) return { outcome: "ALREADY_MARKED", dateKey };
  const saved = await saveAttendanceBatch({ schoolId, classId: enrolment.classId, dateKey, marks: [{ studentMembershipId: person.id, status: "PRESENT", clientId, markedAt: at.toISOString() }], takenByMembershipId: null, actorUserId: null, notify: false });
  return { outcome: saved.applied > 0 ? "APPLIED" : "ALREADY_MARKED", dateKey };
}

/**
 * THE DOOR'S WORK (POST /api/v1/punch/{schoolId}). No session: the device is
 * found under its school, its key opened, and the signature checked over the
 * raw body before a byte of it is believed. 401 for anything that is not the
 * key holder's (an unknown or disabled device, a wrong or stale signature —
 * one answer, so a guess learns nothing), 422 for a body that is not a batch.
 * Each punch is kept once per device and its id; a punch seen before is
 * answered with what became of it then.
 */
export async function receivePunches(schoolId: string, headers: Headers, raw: string, now = new Date()): Promise<PunchAnswer> {
  // An id's shape only (a school's id may be a uuid, a device's is a cuid): anything else is nobody's.
  const ID = /^[A-Za-z0-9-]{8,64}$/;
  const deviceId = headers.get(PUNCH_HEADERS.device) ?? "";
  if (!ID.test(schoolId) || !ID.test(deviceId)) return { status: 401, body: { code: "BAD_SIGNATURE" } };
  return forSchool(schoolId, async () => {
    const device = await db.attendanceDevice.findFirst({ where: { id: deviceId, schoolId }, select: { id: true, keySealed: true, scope: true, disabledAt: true, name: true } });
    if (!device || device.disabledAt || !device.keySealed) return { status: 401, body: { code: "BAD_SIGNATURE" } } as const;
    let key: string;
    try {
      key = open(device.keySealed, keyBound(schoolId, device.id));
    } catch {
      return { status: 401, body: { code: "BAD_SIGNATURE" } } as const;
    }
    if (!verifyPunches(key, headers.get(PUNCH_HEADERS.timestamp), headers.get(PUNCH_HEADERS.signature), raw, Math.floor(now.getTime() / 1000))) return { status: 401, body: { code: "BAD_SIGNATURE" } } as const;
    let parsed: ReturnType<typeof punchBatchSchema.safeParse>;
    try {
      parsed = punchBatchSchema.safeParse(JSON.parse(raw));
    } catch {
      return { status: 422, body: { code: "NOT_JSON" } } as const;
    }
    if (!parsed.success) return { status: 422, body: { code: "VALIDATION" } } as const;

    const zone = await zoneOf(schoolId);
    const punches = parsed.data.punches;
    const seen = await db.attendancePunch.findMany({ where: { deviceId: device.id, externalId: { in: punches.map((p) => p.id) } }, select: { externalId: true, outcome: true } });
    const seenOf = new Map(seen.map((s) => [s.externalId, s.outcome as PunchOutcome]));
    const codes = [...new Set(punches.map((p) => p.code))];
    const badges = await db.attendanceBadge.findMany({ where: { schoolId, code: { in: codes } }, select: { code: true, membershipId: true } });
    const people = badges.length ? await db.membership.findMany({ where: { id: { in: badges.map((b) => b.membershipId) }, schoolId, status: "ACTIVE", leftAt: null }, select: { id: true, role: true, userId: true } }) : [];
    const personById = new Map(people.map((p) => [p.id, p]));
    const personOf = new Map(badges.map((b) => [b.code, personById.get(b.membershipId) ?? null]));

    const results: PunchResult["results"] = [];
    let applied = 0;
    let replayed = 0;
    const handled = new Set<string>();
    for (const p of punches) {
      const stored = seenOf.get(p.id);
      if (stored || handled.has(p.id)) {
        replayed += 1;
        results.push({ id: p.id, outcome: stored ?? results.find((r) => r.id === p.id)!.outcome, replayed: true });
        continue;
      }
      handled.add(p.id);
      const at = new Date(p.at);
      const person = personOf.get(p.code) ?? null;
      const { outcome, dateKey } = await applyOne(schoolId, zone, device.scope, person, at, p.direction, `punch:${device.id}:${p.id}`, now);
      try {
        await db.attendancePunch.create({ data: { schoolId, deviceId: device.id, externalId: p.id, code: p.code, membershipId: person?.id ?? null, punchedAt: at, dateKey, direction: p.direction ?? null, outcome } });
      } catch (error) {
        // The same punch delivered twice at once: the first kept it.
        if ((error as { code?: string }).code !== "P2002") throw error;
        replayed += 1;
        results.push({ id: p.id, outcome, replayed: true });
        continue;
      }
      if (outcome === "APPLIED") applied += 1;
      results.push({ id: p.id, outcome, replayed: false });
    }
    await db.attendanceDevice.update({ where: { id: device.id }, data: { lastPunchAt: now } });
    await audit({ schoolId, actorUserId: null, action: "attendance.device.punch", targetType: "AttendanceDevice", targetId: device.id, meta: { received: punches.length, applied, replayed } });
    return { status: 200, body: { received: punches.length, applied, replayed, results } } as const;
  });
}
