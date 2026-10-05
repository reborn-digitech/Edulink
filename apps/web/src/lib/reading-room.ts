import "server-only";
import type { ReadingRoomDay, ReadingRoomVisitView } from "@edulink/contracts";
import { db } from "./db";
import { AccessError } from "./access-error";
import { RuleRefusal } from "./rule-refusal";
import { audit } from "./audit";
import { assertModuleOn } from "./modules";
import { dateKeyInZone, isDateKey, todayKey, zonedStartOfDay } from "./dates";
import type { ActiveContext } from "./session";
import type { Role } from "./constants";

/**
 * THE READING-ROOM REGISTER (risks batch 5A, 5 October 2026; module LIBRARY,
 * migration 20261005230102_reading_room).
 *
 * WHO. The desk — the LIBRARIAN and the office (ADMIN) — signs a reader in
 * and out; the head (PRINCIPAL) reads the day report. A reader is a member of
 * the school who may borrow: a student or a member of staff (the library's
 * own MEMBER_ROLES), found by their library card number, their student code
 * or the membership the desk picked from the member search.
 *
 * ONE OPEN VISIT PER PERSON, held by `scan`, the one writer of
 * ReadingRoomVisit: it takes a transaction lock on the reader before it looks,
 * so two presses at once sign a reader in once. Signing in a reader already
 * inside answers the open visit as it stands; signing out a reader who is not
 * inside is refused 409. A visit is filed under the school-zone day it began;
 * a visit never signed out stays open and the day report says so — nothing
 * closes it behind the desk's back.
 */

const DESK: readonly Role[] = ["LIBRARIAN", "ADMIN"];
const DESK_READ: readonly Role[] = ["LIBRARIAN", "ADMIN", "PRINCIPAL"];
/** The library's borrowers (library.ts MEMBER_ROLES): the pupil and every member of staff. */
const READER_ROLES: readonly Role[] = ["STUDENT", "TEACHER", "ADMIN", "PRINCIPAL", "LIBRARIAN", "WARDEN", "DRIVER", "FACULTY", "HOD", "EXAM_CONTROLLER", "IQAC", "TPO", "ACCOUNTS"];
type Tx = typeof db;
type Desk = { schoolId: string; userId: string; role: Role; timeZone: string };

async function deskOf(ctx: ActiveContext, mode: "write" | "read"): Promise<Desk> {
  const roles = mode === "write" ? DESK : DESK_READ;
  if (!ctx.schoolId || !ctx.membershipId || !ctx.role || !roles.includes(ctx.role)) throw new AccessError("access.wrongRoleForThisAction");
  await assertModuleOn(ctx.schoolId, "LIBRARY");
  const zone = (await db.school.findUnique({ where: { id: ctx.schoolId }, select: { timezone: true } }))?.timezone ?? "Asia/Kolkata";
  return { schoolId: ctx.schoolId, userId: ctx.user.id, role: ctx.role, timeZone: zone };
}

const READER = { id: true, role: true, user: { select: { name: true, preferredName: true } }, enrollments: { where: { status: "ACTIVE" as const }, select: { class: { select: { name: true } } }, take: 1 } } as const;
type ReaderRow = { id: string; role: string; user: { name: string; preferredName: string | null }; enrollments: { class: { name: string } }[] };

/** The reader the desk named, at this school, as a borrower may be; otherwise 404. */
async function readerOf(schoolId: string, by: { membershipId?: string; code?: string }): Promise<ReaderRow> {
  let membershipId = by.membershipId ?? null;
  if (!membershipId && by.code) {
    const code = by.code.trim();
    const card = await db.libraryMember.findFirst({ where: { schoolId, cardNumber: code.toUpperCase() }, select: { membershipId: true } });
    membershipId = card?.membershipId ?? (await db.membership.findFirst({ where: { schoolId, studentCode: { equals: code, mode: "insensitive" }, status: "ACTIVE" }, select: { id: true } }))?.id ?? null;
  }
  const reader = membershipId ? await db.membership.findFirst({ where: { id: membershipId, schoolId, status: "ACTIVE", role: { in: [...READER_ROLES] } }, select: READER }) : null;
  if (!reader) throw new AccessError("readingRoom.refuseNoReader", "NOT_FOUND");
  return reader;
}

const minutesBetween = (from: Date, to: Date) => Math.max(0, Math.round((to.getTime() - from.getTime()) / 60_000));

function viewOf(v: { id: string; membershipId: string; dayKey: string; inAt: Date; outAt: Date | null }, reader: ReaderRow, now: Date): ReadingRoomVisitView {
  return {
    id: v.id,
    membershipId: v.membershipId,
    name: reader.user.preferredName ?? reader.user.name,
    kind: reader.role === "STUDENT" ? "STUDENT" : "STAFF",
    className: reader.enrollments[0]?.class.name ?? null,
    dayKey: v.dayKey,
    inAt: v.inAt.toISOString(),
    outAt: v.outAt?.toISOString() ?? null,
    minutes: minutesBetween(v.inAt, v.outAt ?? now),
  };
}

/** Sign a reader in or out: the register's one writer. */
export async function scanReader(ctx: ActiveContext, input: { action: "IN" | "OUT"; membershipId?: string; code?: string }, now: Date = new Date()): Promise<{ visit: ReadingRoomVisitView; changed: boolean }> {
  const desk = await deskOf(ctx, "write");
  const reader = await readerOf(desk.schoolId, input);
  const result = await db.$tenantTransaction(async (raw) => {
    const tx = raw as Tx;
    // One reader's visits are decided one press at a time.
    await tx.$queryRaw`SELECT 1 FROM pg_advisory_xact_lock(hashtext(${`reading-room:${reader.id}`}))`;
    const open = await tx.readingRoomVisit.findFirst({ where: { schoolId: desk.schoolId, membershipId: reader.id, outAt: null }, orderBy: { inAt: "desc" }, select: { id: true, membershipId: true, dayKey: true, inAt: true, outAt: true } });
    if (input.action === "IN") {
      if (open) return { row: open, changed: false };
      const row = await tx.readingRoomVisit.create({ data: { schoolId: desk.schoolId, membershipId: reader.id, dayKey: dateKeyInZone(now, desk.timeZone), inAt: now, inByUserId: desk.userId }, select: { id: true, membershipId: true, dayKey: true, inAt: true, outAt: true } });
      return { row, changed: true };
    }
    if (!open) throw new RuleRefusal("readingRoom.refuseNotIn", 409, undefined, "code");
    const row = await tx.readingRoomVisit.update({ where: { id: open.id }, data: { outAt: now, outByUserId: desk.userId }, select: { id: true, membershipId: true, dayKey: true, inAt: true, outAt: true } });
    return { row, changed: true };
  });
  if (result.changed) {
    await audit({ schoolId: desk.schoolId, actorUserId: desk.userId, action: input.action === "IN" ? "library.readingRoom.in" : "library.readingRoom.out", targetType: "ReadingRoomVisit", targetId: result.row.id, meta: { membershipId: reader.id, dayKey: result.row.dayKey } });
  }
  return { visit: viewOf(result.row, reader, now), changed: result.changed };
}

/**
 * The librarian's day report: every visit begun that day, newest first, who
 * is inside (today) or never signed out (a past day), readers by kind, the
 * average stay of the visits that ended, and the hour most readers came in.
 */
export async function readingRoomDay(ctx: ActiveContext, day?: string, now: Date = new Date()): Promise<ReadingRoomDay> {
  const desk = await deskOf(ctx, "read");
  const today = todayKey(desk.timeZone, now);
  if (day !== undefined && (!isDateKey(day) || day > today)) throw new RuleRefusal("readingRoom.refuseDay", 422, undefined, "day");
  const dayKey = day ?? today;
  const rows = await db.readingRoomVisit.findMany({ where: { schoolId: desk.schoolId, dayKey }, orderBy: { inAt: "desc" }, take: 2000, select: { id: true, membershipId: true, dayKey: true, inAt: true, outAt: true, reader: { select: READER } } });
  const visits = rows.map((r) => viewOf(r, r.reader, now));
  const ended = visits.filter((v) => v.outAt !== null);
  const readers = new Map(visits.map((v) => [v.membershipId, v.kind]));
  const start = zonedStartOfDay(dayKey, desk.timeZone).getTime();
  const perHour = new Map<number, number>();
  for (const r of rows) {
    const hour = Math.min(23, Math.max(0, Math.floor((r.inAt.getTime() - start) / 3_600_000)));
    perHour.set(hour, (perHour.get(hour) ?? 0) + 1);
  }
  let busiestHour: number | null = null;
  for (const [hour, n] of [...perHour.entries()].sort((a, b) => a[0] - b[0])) if (busiestHour === null || n > (perHour.get(busiestHour) ?? 0)) busiestHour = hour;
  return {
    dayKey,
    today: dayKey === today,
    visits,
    inside: visits.filter((v) => v.outAt === null).length,
    readers: readers.size,
    students: [...readers.values()].filter((k) => k === "STUDENT").length,
    staff: [...readers.values()].filter((k) => k === "STAFF").length,
    averageMinutes: ended.length ? Math.round(ended.reduce((a, v) => a + v.minutes, 0) / ended.length) : null,
    busiestHour,
    canRecord: DESK.includes(desk.role),
  };
}
