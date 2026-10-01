import "server-only";
import type { z } from "zod";
import type { appraisalEntrySchema, appraisalSaveSchema, appraisalsSchema, myAppraisalsSchema } from "@edulink/contracts";
import { db } from "./db";
import { AccessError } from "./tenancy";
import { audit } from "./audit";
import { currentAcademicYear } from "./academic-year";
import { dateKeyInZone, zonedStartOfDay } from "./dates";
import { STAFF_ROLES } from "./staff-records";
import type { ActiveContext } from "./session";
import type { Role } from "./constants";

/**
 * The head's notes on a member of staff: a lesson observed, a target set,
 * the year's appraisal. One timeline per person, newest first.
 *
 * WHO READS WHAT. The head writes and reads every entry; the office reads
 * them (a head's record of their staff is the school's record, and the
 * office keeps the school's records) and writes none. The member of staff
 * reads an entry only once the head has marked it visible to them — an
 * observation written on the way out of a lesson is a draft until the head
 * says it is not — and never sees one that is not. Nobody appraises
 * themselves. Every write is audited by kind, never by the words.
 */
type Entry = z.infer<typeof appraisalEntrySchema>;
type Head = ActiveContext & { schoolId: string; membershipId: string; role: Role };

function office(ctx: ActiveContext): Head {
  if (!ctx.schoolId || !ctx.membershipId || !ctx.role || !["ADMIN", "PRINCIPAL"].includes(ctx.role)) throw new AccessError("access.notAllowed");
  return ctx as Head;
}
function head(ctx: ActiveContext): Head {
  const caller = office(ctx);
  if (caller.role !== "PRINCIPAL") throw new AccessError("appraisal.onlyTheHeadWrites");
  return caller;
}
function member(ctx: ActiveContext): Head {
  if (!ctx.schoolId || !ctx.membershipId || !ctx.role || !(STAFF_ROLES as readonly string[]).includes(ctx.role)) throw new AccessError("access.notAllowed");
  return ctx as Head;
}

const nameOf = (u: { name: string; preferredName: string | null }) => u.preferredName ?? u.name;

const ENTRY_SELECT = {
  id: true,
  staffMembershipId: true,
  appraiserUserId: true,
  year: true,
  kind: true,
  date: true,
  summary: true,
  strengths: true,
  targets: true,
  rating: true,
  visibleToStaff: true,
  updatedAt: true,
} as const;

async function toEntries(rows: { id: string; staffMembershipId: string; appraiserUserId: string; year: string; kind: string; date: Date; summary: string; strengths: string | null; targets: string | null; rating: number | null; visibleToStaff: boolean; updatedAt: Date }[], timezone: string): Promise<Entry[]> {
  const appraisers = await db.user.findMany({ where: { id: { in: [...new Set(rows.map((r) => r.appraiserUserId))] } }, select: { id: true, name: true, preferredName: true } });
  const nameBy = new Map(appraisers.map((u) => [u.id, nameOf(u)]));
  return rows.map((r) => ({
    id: r.id,
    staffMembershipId: r.staffMembershipId,
    year: r.year,
    kind: r.kind as Entry["kind"],
    dateKey: dateKeyInZone(r.date, timezone),
    summary: r.summary,
    strengths: r.strengths,
    targets: r.targets,
    rating: r.rating,
    visibleToStaff: r.visibleToStaff,
    appraiserName: nameBy.get(r.appraiserUserId) ?? "",
    updatedAt: r.updatedAt.toISOString(),
  }));
}

/** A member of staff of the school, by membership; a pupil's or another school's id is not found. */
async function staffOf(schoolId: string, membershipId: string) {
  const m = await db.membership.findFirst({ where: { id: membershipId, schoolId, role: { in: [...STAFF_ROLES] } }, select: { id: true, role: true, userId: true, user: { select: { name: true, preferredName: true } } } });
  if (!m) throw new AccessError("appraisal.noSuchStaff", "NOT_FOUND");
  return m;
}

/** One person's timeline, newest first: the head's and the office's read. */
export async function staffAppraisals(ctx: ActiveContext, membershipId: string): Promise<z.infer<typeof appraisalsSchema>> {
  const caller = office(ctx);
  const [subject, school, year, rows] = await Promise.all([
    staffOf(caller.schoolId, membershipId),
    db.school.findUniqueOrThrow({ where: { id: caller.schoolId }, select: { timezone: true } }),
    currentAcademicYear(caller.schoolId),
    db.staffAppraisal.findMany({ where: { schoolId: caller.schoolId, staffMembershipId: membershipId }, orderBy: [{ date: "desc" }, { createdAt: "desc" }], select: ENTRY_SELECT, take: 500 }),
  ]);
  return { staffMembershipId: subject.id, name: nameOf(subject.user), role: subject.role, year: year?.name ?? null, canEdit: caller.role === "PRINCIPAL" && subject.id !== caller.membershipId, items: await toEntries(rows, school.timezone) };
}

/** The head writes an entry for a member of staff; filed under the current year, or "—" when the school has none. */
export async function createAppraisal(ctx: ActiveContext, membershipId: string, input: z.infer<typeof appraisalSaveSchema>): Promise<{ id: string }> {
  const caller = head(ctx);
  const subject = await staffOf(caller.schoolId, membershipId);
  if (subject.id === caller.membershipId) throw new AccessError("appraisal.notYourself");
  const [school, year] = await Promise.all([db.school.findUniqueOrThrow({ where: { id: caller.schoolId }, select: { timezone: true } }), currentAcademicYear(caller.schoolId)]);
  const row = await db.staffAppraisal.create({
    data: {
      schoolId: caller.schoolId,
      staffMembershipId: subject.id,
      appraiserUserId: caller.user.id,
      year: year?.name ?? "—",
      kind: input.kind,
      date: zonedStartOfDay(input.dateKey, school.timezone),
      summary: input.summary,
      strengths: input.strengths?.trim() || null,
      targets: input.targets?.trim() || null,
      rating: input.rating ?? null,
      visibleToStaff: input.visibleToStaff ?? false,
    },
    select: { id: true },
  });
  await audit({ schoolId: caller.schoolId, actorUserId: caller.user.id, action: "appraisal.create", targetType: "Membership", targetId: subject.id, meta: { appraisalId: row.id, kind: input.kind, visibleToStaff: input.visibleToStaff ?? false } });
  return row;
}

/** The head rewrites an entry: the whole entry, as the form holds it. */
export async function updateAppraisal(ctx: ActiveContext, appraisalId: string, input: z.infer<typeof appraisalSaveSchema>): Promise<{ id: string }> {
  const caller = head(ctx);
  const existing = await db.staffAppraisal.findFirst({ where: { id: appraisalId, schoolId: caller.schoolId }, select: { id: true, staffMembershipId: true, visibleToStaff: true } });
  if (!existing) throw new AccessError("appraisal.noSuchEntry", "NOT_FOUND");
  const school = await db.school.findUniqueOrThrow({ where: { id: caller.schoolId }, select: { timezone: true } });
  await db.staffAppraisal.update({
    where: { id: existing.id },
    data: {
      kind: input.kind,
      date: zonedStartOfDay(input.dateKey, school.timezone),
      summary: input.summary,
      strengths: input.strengths?.trim() || null,
      targets: input.targets?.trim() || null,
      rating: input.rating ?? null,
      visibleToStaff: input.visibleToStaff ?? existing.visibleToStaff,
    },
  });
  await audit({ schoolId: caller.schoolId, actorUserId: caller.user.id, action: "appraisal.update", targetType: "Membership", targetId: existing.staffMembershipId, meta: { appraisalId: existing.id, kind: input.kind, visibleToStaff: input.visibleToStaff ?? existing.visibleToStaff } });
  return { id: existing.id };
}

/** The head removes an entry; nothing there is a no-op. */
export async function deleteAppraisal(ctx: ActiveContext, appraisalId: string): Promise<{ changed: boolean }> {
  const caller = head(ctx);
  const existing = await db.staffAppraisal.findFirst({ where: { id: appraisalId, schoolId: caller.schoolId }, select: { id: true, staffMembershipId: true, kind: true } });
  if (!existing) return { changed: false };
  await db.staffAppraisal.delete({ where: { id: existing.id } });
  await audit({ schoolId: caller.schoolId, actorUserId: caller.user.id, action: "appraisal.delete", targetType: "Membership", targetId: existing.staffMembershipId, meta: { appraisalId: existing.id, kind: existing.kind } });
  return { changed: true };
}

/** What the head has shown me: my own entries marked visible, newest first. */
export async function myAppraisals(ctx: ActiveContext): Promise<z.infer<typeof myAppraisalsSchema>> {
  const caller = member(ctx);
  const [school, rows] = await Promise.all([
    db.school.findUniqueOrThrow({ where: { id: caller.schoolId }, select: { timezone: true } }),
    db.staffAppraisal.findMany({ where: { schoolId: caller.schoolId, staffMembershipId: caller.membershipId, visibleToStaff: true }, orderBy: [{ date: "desc" }, { createdAt: "desc" }], select: ENTRY_SELECT, take: 500 }),
  ]);
  return { items: await toEntries(rows, school.timezone) };
}
